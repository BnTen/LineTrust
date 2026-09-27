#!/usr/bin/env python3
"""
ETL Phase 2 — stream ART IDFM zip → agg_pair_window (+ rollup) for RER D Melun corridor.

- Never loads full CSV into memory (one circulation buffer).
- Hash file → watermark; same hash = noop.
- Partition grain: month_key (YYYY-MM) × source art-idfm.
- TSR: n_cancelled=0 until explicit cancellation derivation (docs/04).
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
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

REPO = Path(__file__).resolve().parents[2]
SOURCE_ID = "art-idfm"
ART_TCT = "TBD"
LINE_ID = "IDFM:C01728"
CORRIDOR_ID = "rer-d-melun"
WEIGHTS_VERSION = "w0"
ON_TIME = 5
PENALTY_GT = 15
MAX_DELAY = 120

# Melun branch — canonical code_ci + aliases (Paris-Lyon mainline → banlieue hub)
STOP_SEQ = {
    "686030": 1,
    "686006": 1,  # alias → canonical 686030
    "681155": 2,
    "681247": 3,
    "608802": 4,
    "681825": 5,
    "681809": 6,
    "682104": 7,
    "682112": 8,
    "682120": 9,
    "682138": 10,
    "682146": 11,
    "682153": 12,
    "682187": 13,
    "682161": 14,
    "682179": 15,
    "682005": 16,
}
CANON = {c: ("686030" if s == 1 else c) for c, s in STOP_SEQ.items()}
HUB = "686030"
END = "682005"


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


def canonical(code: str) -> str | None:
    c = (code or "").strip()
    if not c:
        return None
    if c not in STOP_SEQ:
        return None
    return CANON[c]


def is_corridor_od(orig: str, dest: str) -> bool:
    o, d = canonical(orig), canonical(dest)
    if not o or not d:
        return False
    return (o == HUB and d == END) or (o == END and d == HUB)


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
    dist: int


@dataclass
class CircBuf:
    id_circ: str = ""
    date_circ: str = ""
    orig: str = ""
    dest: str = ""
    jalons: list[Jalon] = field(default_factory=list)


# cell key → counters
# key: (from, to, day_type, window, month)
CellKey = tuple[str, str, str, int, str]


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
    score = max(0.0, min(100.0, raw))
    return tpr, tsr, penalty, score


def best_depart(js: list[Jalon]) -> Jalon | None:
    deps = [j for j in js if j.typ == "D" and j.the]
    if deps:
        return min(deps, key=lambda j: j.the)  # type: ignore[arg-type, return-value]
    with_the = [j for j in js if j.the]
    return min(with_the, key=lambda j: j.the) if with_the else None  # type: ignore[arg-type, return-value]


def best_arrive(js: list[Jalon]) -> Jalon | None:
    arrs = [j for j in js if j.typ == "A" and j.the]
    if arrs:
        return max(arrs, key=lambda j: j.the)  # type: ignore[arg-type, return-value]
    with_the = [j for j in js if j.the]
    return max(with_the, key=lambda j: j.the) if with_the else None  # type: ignore[arg-type, return-value]


def delay_minutes(j: Jalon) -> tuple[float | None, bool, str | None]:
    """Returns (delay_min, used_est, quarantine_reason)."""
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


def process_circulation(
    buf: CircBuf,
    cells: dict[CellKey, Acc],
    quarantine: dict[str, int],
) -> int:
    """Emit directed pair samples for stations on this corridor OD trip. Returns sample count."""
    if not buf.jalons or not is_corridor_od(buf.orig, buf.dest):
        return 0
    dt = day_type(buf.date_circ)
    month = buf.date_circ[:7] if len(buf.date_circ) >= 7 else None
    if not dt or not month or month[4] != "-":
        quarantine["bad_date"] = quarantine.get("bad_date", 0) + 1
        return 0

    by_code: dict[str, list[Jalon]] = defaultdict(list)
    for j in buf.jalons:
        by_code[j.code].append(j)

    codes = sorted(by_code.keys(), key=lambda c: STOP_SEQ[c])
    if len(codes) < 2:
        return 0

    samples = 0
    for i, from_c in enumerate(codes):
        for to_c in codes[i + 1 :]:
            # Southbound pairs (increasing seq) and northbound (flip)
            for frm, to in ((from_c, to_c), (to_c, from_c)):
                # Direction must match OD travel
                o, d = canonical(buf.orig), canonical(buf.dest)
                assert o and d
                if o == HUB and d == END:
                    # southbound: only increasing sequence
                    if STOP_SEQ[frm] >= STOP_SEQ[to]:
                        continue
                else:
                    # northbound: only decreasing sequence
                    if STOP_SEQ[frm] <= STOP_SEQ[to]:
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
                key: CellKey = (frm, to, dt, w, month)
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


def flush_row(row: dict[str, str], buf: CircBuf, cells: dict, quarantine: dict) -> int:
    emitted = 0
    circ = row.get("id_circ", "").strip()
    if buf.id_circ and circ != buf.id_circ:
        emitted = process_circulation(buf, cells, quarantine)
        buf.jalons.clear()
        buf.id_circ = ""

    if row.get("tct", "").strip() != ART_TCT:
        return emitted
    orig = row.get("code_ci_origine", "").strip()
    dest = row.get("code_ci_destination", "").strip()
    if not is_corridor_od(orig, dest):
        return emitted
    if not (row.get("lib_ci_origine") or "").strip():
        quarantine["empty_origin"] = quarantine.get("empty_origin", 0) + 1
        return emitted

    code_raw = row.get("code_ci_jalon", "").strip()
    code = canonical(code_raw)
    if not code:
        return emitted

    if not buf.id_circ:
        buf.id_circ = circ
        buf.date_circ = row.get("date_circ", "").strip()
        buf.orig = orig
        buf.dest = dest

    the = parse_ts(row.get("dh_the_jalon", ""))
    obs = parse_ts(row.get("dh_obs_jalon", ""))
    est = parse_ts(row.get("dh_est_jalon", ""))
    try:
        dist = int(row.get("distance_cumul") or 0)
    except ValueError:
        dist = 0
    buf.jalons.append(
        Jalon(
            code=code,
            seq=STOP_SEQ[code_raw],
            typ=(row.get("type_horaire") or "").strip(),
            the=the,
            obs=obs,
            est=est,
            dist=dist,
        )
    )
    return emitted


def stream_zip(path: Path) -> tuple[dict[CellKey, Acc], dict[str, int], int]:
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
                    print(f"  … {path.name}: {jalon_rows:,} rows, cells={len(cells)}", flush=True)
                samples += flush_row(row, buf, cells, quarantine)
            if buf.id_circ:
                samples += process_circulation(buf, cells, quarantine)

    return cells, quarantine, jalon_rows


def get_watermark(cur, partition_key: str) -> dict | None:
    cur.execute(
        "SELECT content_hash, row_count, status FROM etl_watermarks "
        "WHERE source_id = %s AND partition_key = %s",
        (SOURCE_ID, partition_key),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"content_hash": row[0], "row_count": row[1], "status": row[2]}


def replace_months(
    conn,
    cells: dict[CellKey, Acc],
    months: set[str],
    partition_key: str,
    content_hash: str,
    jalon_rows: int,
    quarantine: dict[str, int],
) -> int:
    now = datetime.now(timezone.utc)
    cur = conn.cursor()
    # Delete existing monthly cells for months in this year partition
    for m in sorted(months):
        cur.execute(
            "DELETE FROM agg_pair_window WHERE line_id = %s AND month_key = %s",
            (LINE_ID, m),
        )

    rows = []
    for (frm, to, dt, w, month), acc in cells.items():
        if month not in months:
            continue
        tpr, tsr, penalty, score = score_cell(acc)
        rows.append(
            (
                LINE_ID,
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
        rows,
        page_size=500,
    )

    # Quarantine summary rows (no silent drop)
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
    return len(rows)


def rebuild_rollup(conn) -> int:
    now = datetime.now(timezone.utc)
    cur = conn.cursor()
    # Scope to this line so other lines' rollups survive multi-line loads
    cur.execute(
        "DELETE FROM agg_pair_window_rollup WHERE line_id = %s",
        (LINE_ID,),
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
          0,  -- placeholder, updated below
          %s,
          %s
        FROM agg_pair_window
        WHERE line_id = %s
        GROUP BY line_id, from_code_ci, to_code_ci, day_type, window_start_minutes
        """,
        (WEIGHTS_VERSION, now, LINE_ID),
    )
    cur.execute(
        """
        UPDATE agg_pair_window_rollup SET score = GREATEST(0, LEAST(100,
          tpr * 0.5 + (100 - tsr) * 0.35 - penalty * 0.15
        ))
        WHERE line_id = %s
        """,
        (LINE_ID,),
    )
    cur.execute(
        "SELECT COUNT(*) FROM agg_pair_window_rollup WHERE line_id = %s",
        (LINE_ID,),
    )
    n = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return n


def process_year_zip(conn, path: Path, force: bool = False) -> dict[str, Any]:
    year = path.stem.replace("idfm_annuel_", "")  # 2023 / 2024
    partition_key = year
    print(f"Hashing {path.name}…", flush=True)
    content_hash = sha256_file(path)
    cur = conn.cursor()
    existing = get_watermark(cur, partition_key)
    cur.close()

    if (
        not force
        and existing
        and existing["content_hash"] == content_hash
        and existing["status"] == "loaded"
    ):
        print(f"NOOP {partition_key} — hash unchanged ({content_hash[:12]}…)")
        return {
            "partition_key": partition_key,
            "action": "noop",
            "content_hash": content_hash,
            "row_count": existing["row_count"],
        }

    print(f"Streaming {path.name} (corridor Melun OD)…", flush=True)
    cells, quarantine, jalon_rows = stream_zip(path)
    months = {k[4] for k in cells.keys()}
    # Also ensure year months empty if no cells (still watermark)
    if not months:
        months = {f"{year}-{m:02d}" for m in range(1, 13)}

    n_cells = replace_months(
        conn, cells, months, partition_key, content_hash, jalon_rows, quarantine
    )
    print(
        f"LOADED {partition_key}: jalon_rows={jalon_rows:,} cells={n_cells:,} "
        f"quarantine={quarantine}",
        flush=True,
    )
    return {
        "partition_key": partition_key,
        "action": "replace",
        "content_hash": content_hash,
        "row_count": jalon_rows,
        "cells": n_cells,
        "quarantine": quarantine,
    }


def main() -> int:
    load_dotenv_local()
    parser = argparse.ArgumentParser(description="ART Melun corridor ETL")
    parser.add_argument(
        "--years",
        nargs="+",
        default=["2023", "2024"],
        help="Year partitions to load",
    )
    parser.add_argument("--force", action="store_true", help="Ignore watermark hash")
    parser.add_argument(
        "--zip-dir",
        type=Path,
        default=REPO / "data/raw/art",
    )
    args = parser.parse_args()

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL missing (.env.local)", file=sys.stderr)
        return 1

    conn = psycopg2.connect(db_url)
    results = []
    try:
        for year in args.years:
            path = args.zip_dir / f"idfm_annuel_{year}.zip"
            if not path.exists():
                print(f"Missing {path}", file=sys.stderr)
                return 1
            results.append(process_year_zip(conn, path, force=args.force))
        if any(r["action"] == "replace" for r in results):
            rollup_n = rebuild_rollup(conn)
            print(f"Rollup cells: {rollup_n}", flush=True)
        else:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM agg_pair_window_rollup")
            rollup_n = cur.fetchone()[0]
            cur.close()
            print(f"Rollup cells: {rollup_n} (unchanged — all noop)", flush=True)
    finally:
        conn.close()

    noop = all(r["action"] == "noop" for r in results)
    print("SUMMARY", results, "all_noop=" + str(noop))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
