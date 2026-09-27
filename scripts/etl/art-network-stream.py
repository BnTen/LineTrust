#!/usr/bin/env python3
"""
ETL scale — stream ART IDFM zip -> agg_pair_window (+ rollup) for all RER corridors.

- One pass per year zip; multi-corridor / multi-line.
- Hash -> watermark partition `{year}-rer-network`; same hash = noop.
- Prune: drop overnight windows; persist only cells with n >= n_min.
- Melun + other D/E/C/A/B from corridors.yaml + corridors.discovered.json.
- Raw stays out of Neon.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import sys
import zipfile
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("psycopg2 required", file=sys.stderr)
    sys.exit(1)

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

REPO = Path(__file__).resolve().parents[2]
SOURCE_ID = "art-idfm"
WEIGHTS_VERSION = "w0"
ON_TIME = 5
PENALTY_GT = 15
MAX_DELAY = 120


def load_dotenv_local() -> None:
    env_path = REPO / ".env.local"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


@dataclass
class Corridor:
    id: str
    tct: str
    line_id: str
    hub: str
    end: str
    stop_seq: dict[str, int]
    canon: dict[str, str]
    display_name: str = ""
    stop_names: dict[str, str] = field(default_factory=dict)


@dataclass
class Config:
    n_min: int = 30
    retention_months: int = 12
    drop_from: int = 60
    drop_to: int = 270
    corridors: list[Corridor] = field(default_factory=list)
    # tct -> list of corridors
    by_tct: dict[str, list[Corridor]] = field(default_factory=dict)


def load_config() -> Config:
    cfg = Config()
    yaml_path = REPO / "scripts/etl/corridors.yaml"
    disc_path = REPO / "scripts/etl/corridors.discovered.json"
    lines_map: dict[str, str] = {}

    if yaml_path.exists() and yaml is not None:
        raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
        cfg.n_min = int(raw.get("n_min", 30))
        cfg.retention_months = int(raw.get("retention_months", 12))
        cfg.drop_from = int(raw.get("drop_window_minutes_from", 60))
        cfg.drop_to = int(raw.get("drop_window_minutes_to", 270))
        for tct, meta in (raw.get("lines") or {}).items():
            lines_map[tct] = meta["line_id"]
        for c in raw.get("corridors") or []:
            tct = c["line_tct"]
            stop_seq = {str(k): int(v) for k, v in (c.get("stop_seq") or {}).items()}
            aliases = {str(k): str(v) for k, v in (c.get("aliases") or {}).items()}
            if not stop_seq:
                continue  # wait for discovered
            canon = {code: aliases.get(code, code) for code in stop_seq}
            for a, b in aliases.items():
                canon[a] = b
                if b in stop_seq and a not in stop_seq:
                    stop_seq[a] = stop_seq[b]
            cfg.corridors.append(
                Corridor(
                    id=c["id"],
                    tct=tct,
                    line_id=lines_map.get(tct, c.get("line_id", "")),
                    hub=str(c["hub"]),
                    end=str(c["end"]),
                    stop_seq=stop_seq,
                    canon=canon,
                    display_name=c.get("display_name", c["id"]),
                    stop_names={
                        str(k): str(v) for k, v in (c.get("stop_names") or {}).items()
                    },
                )
            )

    if disc_path.exists():
        disc = json.loads(disc_path.read_text(encoding="utf-8"))
        have = {c.id for c in cfg.corridors}
        for c in disc.get("corridors") or []:
            cid = c["id"]
            # Prefer YAML Melun fixed seq; skip duplicate preferred D ids if already present
            if cid in have:
                continue
            # Skip auto D duplicates of preferred hubs we already have from yaml without seq
            stop_seq = {str(k): int(v) for k, v in (c.get("stop_seq") or {}).items()}
            if len(stop_seq) < 4:
                continue
            if int(c.get("n_circ_undirected") or 0) < 500:
                continue
            canon = {code: code for code in stop_seq}
            cfg.corridors.append(
                Corridor(
                    id=cid,
                    tct=c["line_tct"],
                    line_id=c["line_id"],
                    hub=str(c["hub"]),
                    end=str(c["end"]),
                    stop_seq=stop_seq,
                    canon=canon,
                    display_name=c.get("id", cid),
                    stop_names={
                        str(k): str(v) for k, v in (c.get("stop_names") or {}).items()
                    },
                )
            )

    # Also merge discovered stop_seq into yaml corridors that lack seq
    if disc_path.exists() and yaml is not None:
        disc = json.loads(disc_path.read_text(encoding="utf-8"))
        by_ends = {
            (d["line_tct"], d["hub"], d["end"]): d for d in disc.get("corridors") or []
        }
        by_ends.update(
            {
                (d["line_tct"], d["end"], d["hub"]): d
                for d in disc.get("corridors") or []
            }
        )
        # reload yaml stubs without seq
        raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
        have = {c.id for c in cfg.corridors}
        for c in raw.get("corridors") or []:
            if c["id"] in have:
                continue
            if c.get("stop_seq"):
                continue
            tct = c["line_tct"]
            hub, end = str(c["hub"]), str(c["end"])
            d = by_ends.get((tct, hub, end))
            if not d:
                continue
            stop_seq = {str(k): int(v) for k, v in d["stop_seq"].items()}
            aliases = {str(k): str(v) for k, v in (c.get("aliases") or {}).items()}
            canon = {code: aliases.get(code, code) for code in stop_seq}
            for a, b in aliases.items():
                canon[a] = b
                if b in stop_seq:
                    stop_seq[a] = stop_seq[b]
            cfg.corridors.append(
                Corridor(
                    id=c["id"],
                    tct=tct,
                    line_id=lines_map.get(tct, d["line_id"]),
                    hub=hub,
                    end=end,
                    stop_seq=stop_seq,
                    canon=canon,
                    display_name=c.get("display_name", c["id"]),
                )
            )

    cfg.by_tct = defaultdict(list)
    for c in cfg.corridors:
        cfg.by_tct[c.tct].append(c)
    print(f"Loaded {len(cfg.corridors)} corridors: {[c.id for c in cfg.corridors]}", flush=True)
    return cfg


def day_type(date_circ: str) -> str | None:
    try:
        d = datetime.strptime(date_circ[:10], "%Y-%m-%d")
    except ValueError:
        return None
    return "weekend" if d.weekday() >= 5 else "weekday"


def parse_ts(raw: str) -> datetime | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(raw[:19], fmt)
        except ValueError:
            continue
    return None


def window_start(ts: datetime) -> int:
    return (ts.hour * 60 + ts.minute) // 30 * 30


@dataclass
class Jalon:
    code: str
    seq: int
    typ: str
    the: datetime | None
    obs: datetime | None
    est: datetime | None


@dataclass
class CircBuf:
    id_circ: str = ""
    date_circ: str = ""
    tct: str = ""
    orig: str = ""
    dest: str = ""
    jalons: list[Jalon] = field(default_factory=list)


# (line_id, from, to, day_type, window, month)
CellKey = tuple[str, str, str, str, int, str]


@dataclass
class Acc:
    n: int = 0
    n_on_time: int = 0
    n_delay_gt15: int = 0
    n_used_est: int = 0
    n_cancelled: int = 0


def score_cell(a: Acc) -> tuple[float, float, float, float]:
    n_obs = a.n - a.n_cancelled
    tpr = 0.0 if n_obs == 0 else 100.0 * a.n_on_time / n_obs
    tsr = 0.0 if a.n == 0 else 100.0 * a.n_cancelled / a.n
    penalty = 0.0 if n_obs == 0 else 100.0 * a.n_delay_gt15 / n_obs
    raw = tpr * 0.5 + (100.0 - tsr) * 0.35 - penalty * 0.15
    return tpr, tsr, penalty, max(0.0, min(100.0, raw))


def best_depart(js: list[Jalon]) -> Jalon | None:
    deps = [j for j in js if j.typ == "D" and j.the]
    if deps:
        return min(deps, key=lambda j: j.the)  # type: ignore[arg-type]
    with_the = [j for j in js if j.the]
    return min(with_the, key=lambda j: j.the) if with_the else None  # type: ignore[arg-type]


def best_arrive(js: list[Jalon]) -> Jalon | None:
    arrs = [j for j in js if j.typ == "A" and j.the]
    if arrs:
        return max(arrs, key=lambda j: j.the)  # type: ignore[arg-type]
    with_the = [j for j in js if j.the]
    return max(with_the, key=lambda j: j.the) if with_the else None  # type: ignore[arg-type]


def delay_minutes(j: Jalon) -> tuple[float | None, bool, str | None]:
    if not j.the:
        return None, False, "missing_theoretical"
    actual = j.obs
    used_est = False
    if actual is None:
        actual = j.est
        used_est = True
    if actual is None:
        return None, used_est, "missing_actual"
    delay = (actual - j.the).total_seconds() / 60.0
    if delay > MAX_DELAY:
        return None, used_est, "delay_gt_120"
    return delay, used_est, None


def match_corridors(cfg: Config, tct: str, orig: str, dest: str) -> list[Corridor]:
    """Match circulation OD to corridor hub↔end.

    Hub/end may be *virtual termini*: present as ART origine/destination but
    never as jalons (e.g. RER A Nanterre-Préfecture `758029`). Those codes need
    not appear in stop_seq — pair emission still uses jalon stops only.
    """
    out: list[Corridor] = []
    for c in cfg.by_tct.get(tct, []):
        oh = c.canon.get(c.hub, c.hub)
        eh = c.canon.get(c.end, c.end)
        # Accept exact hub↔end OD even when end/hub are absent from stop_seq.
        if {orig, dest} == {oh, eh} or {orig, dest} == {c.hub, c.end}:
            out.append(c)
            continue
        o = c.canon.get(orig)
        d = c.canon.get(dest)
        if o is None and orig in c.stop_seq:
            o = orig
        if d is None and dest in c.stop_seq:
            d = dest
        if o and d and {o, d} == {oh, eh}:
            out.append(c)
    return out


def process_circulation(
    buf: CircBuf,
    cfg: Config,
    cells: dict[CellKey, Acc],
    quarantine: dict[str, int],
) -> int:
    matched = match_corridors(cfg, buf.tct, buf.orig, buf.dest)
    if not matched or not buf.jalons:
        return 0
    dt = day_type(buf.date_circ)
    month = buf.date_circ[:7] if len(buf.date_circ) >= 7 else None
    if not dt or not month or month[4] != "-":
        quarantine["bad_date"] = quarantine.get("bad_date", 0) + 1
        return 0

    samples = 0
    for corr in matched:
        by_code: dict[str, list[Jalon]] = defaultdict(list)
        for j in buf.jalons:
            code = corr.canon.get(j.code)
            if code is None and j.code in corr.stop_seq:
                code = j.code
            if not code or code not in corr.stop_seq:
                continue
            by_code[code].append(j)
        codes = sorted(by_code.keys(), key=lambda c: corr.stop_seq[c])
        if len(codes) < 2:
            continue
        oh = corr.canon.get(corr.hub, corr.hub)
        eh = corr.canon.get(corr.end, corr.end)
        o2 = corr.canon.get(buf.orig, buf.orig)
        d2 = corr.canon.get(buf.dest, buf.dest)
        southbound = o2 == oh and d2 == eh
        for i, from_c in enumerate(codes):
            for to_c in codes[i + 1 :]:
                for frm, to in ((from_c, to_c), (to_c, from_c)):
                    if southbound:
                        if corr.stop_seq[frm] >= corr.stop_seq[to]:
                            continue
                    else:
                        if corr.stop_seq[frm] <= corr.stop_seq[to]:
                            continue
                    dep = best_depart(by_code[frm])
                    arr = best_arrive(by_code[to])
                    if not dep or not arr or not dep.the:
                        continue
                    delay, used_est, qreason = delay_minutes(arr)
                    if qreason:
                        quarantine[qreason] = quarantine.get(qreason, 0) + 1
                        continue
                    assert delay is not None
                    w = window_start(dep.the)
                    if cfg.drop_from <= w < cfg.drop_to:
                        continue
                    key: CellKey = (corr.line_id, frm, to, dt, w, month)
                    acc = cells[key]
                    acc.n += 1
                    if used_est:
                        acc.n_used_est += 1
                    if delay < ON_TIME:
                        acc.n_on_time += 1
                    if delay > PENALTY_GT:
                        acc.n_delay_gt15 += 1
                    samples += 1
    return samples


def flush_row(
    row: dict[str, str],
    buf: CircBuf,
    cfg: Config,
    cells: dict,
    quarantine: dict,
) -> int:
    emitted = 0
    circ = row.get("id_circ", "").strip()
    if buf.id_circ and circ != buf.id_circ:
        emitted = process_circulation(buf, cfg, cells, quarantine)
        buf.jalons.clear()
        buf.id_circ = ""

    tct = row.get("tct", "").strip()
    if tct not in cfg.by_tct:
        return emitted
    orig = row.get("code_ci_origine", "").strip()
    dest = row.get("code_ci_destination", "").strip()
    if not match_corridors(cfg, tct, orig, dest):
        return emitted
    if not (row.get("lib_ci_origine") or "").strip():
        quarantine["empty_origin"] = quarantine.get("empty_origin", 0) + 1
        return emitted

    code_raw = row.get("code_ci_jalon", "").strip()
    # accept if any matching corridor knows this code
    known = False
    for c in match_corridors(cfg, tct, orig, dest):
        if code_raw in c.stop_seq or code_raw in c.canon:
            known = True
            break
    if not known:
        return emitted

    if not buf.id_circ:
        buf.id_circ = circ
        buf.date_circ = row.get("date_circ", "").strip()
        buf.tct = tct
        buf.orig = orig
        buf.dest = dest

    the = parse_ts(row.get("dh_the_jalon", ""))
    obs = parse_ts(row.get("dh_obs_jalon", ""))
    est = parse_ts(row.get("dh_est_jalon", ""))
    buf.jalons.append(
        Jalon(
            code=code_raw,
            seq=0,
            typ=(row.get("type_horaire") or "").strip(),
            the=the,
            obs=obs,
            est=est,
        )
    )
    return emitted


def stream_zip(path: Path, cfg: Config) -> tuple[dict[CellKey, Acc], dict[str, int], int]:
    cells: dict[CellKey, Acc] = defaultdict(Acc)
    quarantine: dict[str, int] = {}
    jalon_rows = 0
    samples = 0
    buf = CircBuf()
    with zipfile.ZipFile(path) as zf:
        csv_name = next(n for n in zf.namelist() if n.endswith(".csv"))
        with zf.open(csv_name) as raw:
            reader = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8", newline=""))
            for row in reader:
                jalon_rows += 1
                if jalon_rows % 2_000_000 == 0:
                    print(
                        f"  ... {path.name}: {jalon_rows:,} rows, cells={len(cells):,}",
                        flush=True,
                    )
                samples += flush_row(row, buf, cfg, cells, quarantine)
            if buf.id_circ:
                samples += process_circulation(buf, cfg, cells, quarantine)
    print(f"  samples emitted={samples:,} raw_cells={len(cells):,}", flush=True)
    return cells, quarantine, jalon_rows


def ensure_refs(conn, cfg: Config) -> None:
    cur = conn.cursor()
    short_of = {"TBA": "A", "TBB": "B", "TBC": "C", "TBD": "D", "TBE": "E"}
    for c in cfg.corridors:
        short = short_of[c.tct]
        cur.execute(
            """
            INSERT INTO ref_lines (line_id, short_name, display_name, art_tct, network, coverage)
            VALUES (%s, %s, %s, %s, 'rer', %s)
            ON CONFLICT (line_id) DO UPDATE SET
              short_name = EXCLUDED.short_name,
              display_name = EXCLUDED.display_name,
              art_tct = EXCLUDED.art_tct,
              coverage = EXCLUDED.coverage
            """,
            (
                c.line_id,
                short,
                f"RER {short}",
                c.tct,
                "partial" if c.tct in ("TBA", "TBB") else "full",
            ),
        )
        cur.execute(
            """
            INSERT INTO ref_corridors (
              corridor_id, line_id, display_name, hub_code_ci, end_code_ci, coverage, status
            ) VALUES (%s, %s, %s, %s, %s, %s, 'loaded')
            ON CONFLICT (corridor_id) DO UPDATE SET
              hub_code_ci = EXCLUDED.hub_code_ci,
              end_code_ci = EXCLUDED.end_code_ci,
              status = 'loaded',
              display_name = EXCLUDED.display_name
            """,
            (
                c.id,
                c.line_id,
                c.display_name or c.id,
                c.hub,
                c.end,
                "partial" if c.tct in ("TBA", "TBB") else "full",
            ),
        )
        # Upsert stops (ART ids) + corridor membership
        for code, seq in c.stop_seq.items():
            canon = c.canon.get(code, code)
            if code != canon:
                continue  # alias only in canon map
            stop_id = f"ART:{canon}"
            lib = c.stop_names.get(canon) or c.stop_names.get(code) or canon
            display = lib.replace("-", " ") if lib != canon else canon
            cur.execute(
                """
                INSERT INTO ref_stops (stop_id, code_ci, name, name_display, aliases_code_ci)
                VALUES (%s, %s, %s, %s, '{}')
                ON CONFLICT (code_ci) DO UPDATE SET
                  name = CASE
                    WHEN ref_stops.name = ref_stops.code_ci OR ref_stops.name ~ '^[0-9]+$'
                    THEN EXCLUDED.name ELSE ref_stops.name END,
                  name_display = CASE
                    WHEN ref_stops.name_display = ref_stops.code_ci OR ref_stops.name_display ~ '^[0-9]+$'
                    THEN EXCLUDED.name_display ELSE ref_stops.name_display END
                """,
                (stop_id, canon, lib, display),
            )
            cur.execute("SELECT stop_id FROM ref_stops WHERE code_ci = %s", (canon,))
            row = cur.fetchone()
            if not row:
                continue
            cur.execute(
                """
                INSERT INTO ref_corridor_stops (corridor_id, stop_id, sequence_order, is_hub)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (corridor_id, stop_id) DO UPDATE SET sequence_order = EXCLUDED.sequence_order
                """,
                (c.id, row[0], seq, canon in (c.hub, c.end)),
            )
    conn.commit()
    cur.close()


def replace_months(
    conn,
    cfg: Config,
    cells: dict[CellKey, Acc],
    months: set[str],
    partition_key: str,
    content_hash: str,
    jalon_rows: int,
    quarantine: dict[str, int],
) -> int:
    # Neon free tier often drops idle SSL during long streams — reconnect before write
    try:
        conn.close()
    except Exception:
        pass
    load_dotenv_local()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.set_session(autocommit=False)
    now = datetime.now(timezone.utc)
    cur = conn.cursor()
    line_ids = sorted({c.line_id for c in cfg.corridors})
    for m in sorted(months):
        cur.execute(
            "DELETE FROM agg_pair_window WHERE month_key = %s AND line_id = ANY(%s)",
            (m, line_ids),
        )

    rows = []
    skipped_n = 0
    for (line_id, frm, to, dt, w, month), acc in cells.items():
        if month not in months:
            continue
        if acc.n < cfg.n_min:
            skipped_n += 1
            continue
        tpr, tsr, penalty, score = score_cell(acc)
        rows.append(
            (
                line_id,
                frm,
                to,
                dt,
                w,
                month,
                acc.n,
                acc.n_on_time,
                acc.n_delay_gt15,
                acc.n_used_est,
                acc.n_cancelled,
                round(tpr, 4),
                round(tsr, 4),
                round(penalty, 4),
                round(score, 4),
                WEIGHTS_VERSION,
                now,
            )
        )

    print(f"  writing {len(rows):,} cells to Neon (skipped n<{cfg.n_min}: {skipped_n:,})...", flush=True)
    BATCH = 2000
    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        psycopg2.extras.execute_batch(
            cur,
            """
            INSERT INTO agg_pair_window (
              line_id, from_code_ci, to_code_ci, day_type, window_start_minutes, month_key,
              n, n_on_time, n_delay_gt15, n_used_est, n_cancelled,
              tpr, tsr, penalty, score, weights_version, computed_at
            ) VALUES (
              %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            )
            """,
            chunk,
            page_size=500,
        )
        if i == 0 or (i // BATCH) % 10 == 0:
            print(f"    inserted {min(i + BATCH, len(rows)):,}/{len(rows):,}", flush=True)
    conn.commit()

    for reason, count in quarantine.items():
        cur.execute(
            """
            INSERT INTO etl_quarantine (source_id, partition_key, reason, sample_count, payload)
            VALUES (%s, %s, %s, %s, %s::jsonb)
            """,
            (
                SOURCE_ID,
                partition_key,
                reason,
                count,
                psycopg2.extras.Json({"count": count}),
            ),
        )

    cur.execute(
        """
        INSERT INTO etl_watermarks (source_id, partition_key, content_hash, loaded_at, row_count, status)
        VALUES (%s, %s, %s, %s, %s, 'loaded')
        ON CONFLICT (source_id, partition_key) DO UPDATE SET
          content_hash = EXCLUDED.content_hash,
          loaded_at = EXCLUDED.loaded_at,
          row_count = EXCLUDED.row_count,
          status = 'loaded'
        """,
        (SOURCE_ID, partition_key, content_hash, now, jalon_rows),
    )
    conn.commit()
    cur.close()
    print(f"  persisted_cells={len(rows):,}", flush=True)

    # Drop months outside retention window (intent: 12 months)
    conn = purge_old_months(conn, cfg, line_ids)
    return len(rows), conn


def purge_old_months(conn, cfg: Config, line_ids: list[str]):
    """DELETE monthly cells older than retention_months; caller rebuilds rollup."""
    try:
        conn.close()
    except Exception:
        pass
    load_dotenv_local()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    # Keep last N calendar months relative to max month present for these lines
    cur.execute(
        """
        SELECT MAX(month_key) FROM agg_pair_window WHERE line_id = ANY(%s)
        """,
        (line_ids,),
    )
    row = cur.fetchone()
    max_month = row[0] if row and row[0] else None
    if not max_month:
        cur.close()
        return conn
    # Parse YYYY-MM and subtract retention_months-1 to get cutoff inclusive
    y, m = map(int, max_month.split("-"))
    # cutoff = first month to KEEP
    total = y * 12 + (m - 1) - (cfg.retention_months - 1)
    cut_y, cut_m0 = divmod(total, 12)
    cutoff = f"{cut_y}-{cut_m0 + 1:02d}"
    cur.execute(
        """
        DELETE FROM agg_pair_window
        WHERE line_id = ANY(%s) AND month_key < %s
        """,
        (line_ids, cutoff),
    )
    deleted = cur.rowcount
    conn.commit()
    cur.close()
    print(
        f"  retention: kept >= {cutoff} ({cfg.retention_months}m); deleted_rows={deleted}",
        flush=True,
    )
    return conn


def rebuild_rollup(conn, cfg: Config) -> int:
    now = datetime.now(timezone.utc)
    cur = conn.cursor()
    line_ids = sorted({c.line_id for c in cfg.corridors})
    cur.execute(
        "DELETE FROM agg_pair_window_rollup WHERE line_id = ANY(%s)",
        (line_ids,),
    )
    cur.execute(
        """
        INSERT INTO agg_pair_window_rollup (
          line_id, from_code_ci, to_code_ci, day_type, window_start_minutes,
          n, n_on_time, n_delay_gt15, n_used_est, n_cancelled,
          tpr, tsr, penalty, score, weights_version, computed_at
        )
        SELECT
          line_id, from_code_ci, to_code_ci, day_type, window_start_minutes,
          SUM(n)::int,
          SUM(n_on_time)::int,
          SUM(n_delay_gt15)::int,
          SUM(n_used_est)::int,
          SUM(n_cancelled)::int,
          CASE WHEN SUM(n - n_cancelled) = 0 THEN 0
               ELSE ROUND(100.0 * SUM(n_on_time) / SUM(n - n_cancelled), 4) END,
          CASE WHEN SUM(n) = 0 THEN 0
               ELSE ROUND(100.0 * SUM(n_cancelled) / SUM(n), 4) END,
          CASE WHEN SUM(n - n_cancelled) = 0 THEN 0
               ELSE ROUND(100.0 * SUM(n_delay_gt15) / SUM(n - n_cancelled), 4) END,
          0,
          %s,
          %s
        FROM agg_pair_window
        WHERE line_id = ANY(%s)
        GROUP BY line_id, from_code_ci, to_code_ci, day_type, window_start_minutes
        HAVING SUM(n) >= %s
        """,
        (WEIGHTS_VERSION, now, line_ids, cfg.n_min),
    )
    cur.execute(
        """
        UPDATE agg_pair_window_rollup SET score = GREATEST(0, LEAST(100,
          tpr * 0.5 + (100 - tsr) * 0.35 - penalty * 0.15
        ))
        WHERE line_id = ANY(%s)
        """,
        (line_ids,),
    )
    cur.execute(
        "SELECT COUNT(*) FROM agg_pair_window_rollup WHERE line_id = ANY(%s)",
        (line_ids,),
    )
    n = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return n


def process_year_zip(
    conn, path: Path, cfg: Config, force: bool = False
) -> dict[str, Any]:
    year = path.stem.replace("idfm_annuel_", "")
    tcts = "-".join(sorted(cfg.by_tct.keys())) or "none"
    partition_key = f"{year}-rer-{tcts}"
    print(f"Hashing {path.name}...", flush=True)
    content_hash = sha256_file(path)
    cur = conn.cursor()
    cur.execute(
        "SELECT content_hash, row_count, status FROM etl_watermarks "
        "WHERE source_id = %s AND partition_key = %s",
        (SOURCE_ID, partition_key),
    )
    existing = cur.fetchone()
    cur.close()
    if (
        not force
        and existing
        and existing[0] == content_hash
        and existing[2] == "loaded"
    ):
        print(f"NOOP {partition_key} — hash unchanged")
        return {
            "partition_key": partition_key,
            "action": "noop",
            "content_hash": content_hash,
            "row_count": existing[1],
        }

    print(f"Streaming {path.name} ({len(cfg.corridors)} corridors)...", flush=True)
    cells, quarantine, jalon_rows = stream_zip(path, cfg)
    months = {k[5] for k in cells.keys()}
    if not months:
        months = {f"{year}-{m:02d}" for m in range(1, 13)}
    n_cells, conn = replace_months(
        conn, cfg, cells, months, partition_key, content_hash, jalon_rows, quarantine
    )
    return {
        "partition_key": partition_key,
        "action": "replace",
        "content_hash": content_hash,
        "row_count": jalon_rows,
        "cells": n_cells,
        "quarantine": quarantine,
        "conn": conn,
    }


def main() -> int:
    load_dotenv_local()
    parser = argparse.ArgumentParser(description="ART multi-corridor RER ETL")
    parser.add_argument("--years", nargs="+", default=["2023", "2024"])
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--zip-dir", type=Path, default=REPO / "data/raw/art")
    parser.add_argument("--skip-refs", action="store_true")
    parser.add_argument(
        "--tct",
        nargs="*",
        help="Only these tct codes (e.g. TBD TBE). Default: all loaded.",
    )
    args = parser.parse_args()

    if yaml is None:
        print("PyYAML required: pip install pyyaml", file=sys.stderr)
        return 1

    cfg = load_config()
    if args.tct:
        want = set(args.tct)
        cfg.corridors = [c for c in cfg.corridors if c.tct in want]
        cfg.by_tct = defaultdict(list)
        for c in cfg.corridors:
            cfg.by_tct[c.tct].append(c)
        print(f"Filtered to tct={want} -> {len(cfg.corridors)} corridors", flush=True)

    if not cfg.corridors:
        print("No corridors loaded — run discover-corridors.py first", file=sys.stderr)
        return 1

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL missing", file=sys.stderr)
        return 1

    conn = psycopg2.connect(db_url)
    results = []
    try:
        if not args.skip_refs:
            ensure_refs(conn, cfg)
        for year in args.years:
            path = args.zip_dir / f"idfm_annuel_{year}.zip"
            if not path.exists():
                print(f"Missing {path}", file=sys.stderr)
                return 1
            r = process_year_zip(conn, path, cfg, force=args.force)
            if "conn" in r:
                conn = r.pop("conn")
            results.append(r)
        if any(r["action"] == "replace" for r in results):
            rollup_n = rebuild_rollup(conn, cfg)
            print(f"Rollup cells: {rollup_n:,}", flush=True)
        else:
            print("All noop — rollup unchanged", flush=True)
        cur = conn.cursor()
        cur.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
        print("DB size:", cur.fetchone()[0], flush=True)
        cur.execute(
            "SELECT line_id, COUNT(*) FROM agg_pair_window_rollup GROUP BY line_id ORDER BY 1"
        )
        print("Rollup by line:", cur.fetchall(), flush=True)
        cur.close()
    finally:
        try:
            conn.close()
        except Exception:
            pass

    print("SUMMARY", results)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
