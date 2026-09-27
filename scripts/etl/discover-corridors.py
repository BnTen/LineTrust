#!/usr/bin/env python3
"""
Discover RER corridor hub↔end ODs + stop sequences from one ART IDFM zip stream.
Writes scripts/etl/corridors.discovered.json (no Neon, no chat dumps).
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
TCT_LINES = {
    "TBA": ("IDFM:C01742", "A"),
    "TBB": ("IDFM:C01743", "B"),
    "TBC": ("IDFM:C01727", "C"),
    "TBD": ("IDFM:C01728", "D"),
    "TBE": ("IDFM:C01729", "E"),
}

# Prefer these named ends when present in top ODs (code_ci)
PREFERRED = {
    "TBD": [
        ("rer-d-melun", "686030", "682005"),
        ("rer-d-corbeil", "686030", "681007"),
        ("rer-d-malesherbes", "545244", "684415"),
        ("rer-d-nord", "686030", "276246"),
        ("rer-d-orry", "271007", "276279"),
    ],
    "TBE": [
        # filled if codes appear; else top-N auto
    ],
    "TBC": [],
    "TBA": [],
    "TBB": [],
}


def od_key(a: str, b: str) -> tuple[str, str]:
    return (a, b) if a <= b else (b, a)


def stream_discover(path: Path, max_corridors_per_line: int = 8) -> dict:
    # tct -> Counter[(orig, dest)] directed
    od_dir: dict[str, Counter[tuple[str, str]]] = defaultdict(Counter)
    # tct -> undirected od -> Counter code_ci (jalon presence)
    od_stops: dict[str, dict[tuple[str, str], Counter[str]]] = defaultdict(
        lambda: defaultdict(Counter)
    )
    # tct -> undirected od -> code -> list of distance samples
    od_dist: dict[str, dict[tuple[str, str], dict[str, list[int]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )
    # labels
    names: dict[str, str] = {}

    rows = 0
    with zipfile.ZipFile(path) as zf:
        csv_name = next(n for n in zf.namelist() if n.endswith(".csv"))
        with zf.open(csv_name) as raw:
            reader = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8", newline=""))
            prev = ""
            cur_tct = cur_o = cur_d = ""
            seen_codes: set[str] = set()
            for row in reader:
                rows += 1
                if rows % 2_000_000 == 0:
                    print(f"  discover … {rows:,}", flush=True)
                tct = (row.get("tct") or "").strip()
                if tct not in TCT_LINES:
                    continue
                circ = (row.get("id_circ") or "").strip()
                o = (row.get("code_ci_origine") or "").strip()
                d = (row.get("code_ci_destination") or "").strip()
                if not circ or not o or not d or o == d:
                    continue
                if circ != prev:
                    if prev and cur_tct:
                        od_dir[cur_tct][(cur_o, cur_d)] += 1
                    prev = circ
                    cur_tct, cur_o, cur_d = tct, o, d
                    seen_codes = set()
                code = (row.get("code_ci_jalon") or "").strip()
                if not code or code in seen_codes:
                    continue
                seen_codes.add(code)
                uk = od_key(o, d)
                od_stops[tct][uk][code] += 1
                try:
                    dist = int(row.get("distance_cumul") or 0)
                except ValueError:
                    dist = 0
                if len(od_dist[tct][uk][code]) < 40:
                    od_dist[tct][uk][code].append(dist)
                lib = (row.get("lib_ci_jalon") or "").strip()
                if lib and code not in names:
                    names[code] = lib
            if prev and cur_tct:
                od_dir[cur_tct][(cur_o, cur_d)] += 1

    corridors: list[dict] = []
    for tct, (line_id, short) in TCT_LINES.items():
        # undirected strength
        und: Counter[tuple[str, str]] = Counter()
        for (o, d), n in od_dir[tct].items():
            und[od_key(o, d)] += n

        chosen: list[tuple[str, str, str]] = []
        for pref in PREFERRED.get(tct, []):
            cid, h, e = pref
            uk = od_key(h, e)
            if und[uk] > 0:
                chosen.append((cid, h, e))

        # auto-fill top ODs not overlapping chosen ends too much
        used_ends = {x for _, h, e in chosen for x in (h, e)}
        for (a, b), n in und.most_common(40):
            if len(chosen) >= max_corridors_per_line:
                break
            if od_key(a, b) in {od_key(h, e) for _, h, e in chosen}:
                continue
            # skip if both ends already used (prefer new branches)
            if a in used_ends and b in used_ends:
                continue
            cid = f"rer-{short.lower()}-{a}-{b}"
            chosen.append((cid, a, b))
            used_ends.add(a)
            used_ends.add(b)

        for cid, h, e in chosen:
            uk = od_key(h, e)
            stops_c = od_stops[tct][uk]
            if not stops_c:
                continue
            # keep codes present on ≥5% of max frequency
            max_f = max(stops_c.values())
            thresh = max(3, int(0.05 * max_f))
            codes = [c for c, f in stops_c.items() if f >= thresh]
            # order by median distance
            def med(c: str) -> float:
                xs = od_dist[tct][uk].get(c) or [0]
                xs = sorted(xs)
                return xs[len(xs) // 2]

            codes_sorted = sorted(codes, key=med)
            # Orient hub→end by distance; put hub first / end last when present as jalons.
            # Virtual termini (e.g. TBA 758029 Nanterre) never appear as jalons —
            # ETL match_corridors still accepts the commercial OD pair.
            if h in codes_sorted:
                codes_sorted = [h] + [c for c in codes_sorted if c != h]
            if e in codes_sorted:
                codes_sorted = [c for c in codes_sorted if c != e] + [e]
            stop_seq = {c: i + 1 for i, c in enumerate(codes_sorted)}
            n_circ = und[uk]
            corridors.append(
                {
                    "id": cid,
                    "line_tct": tct,
                    "line_id": line_id,
                    "short": short,
                    "hub": h,
                    "end": e,
                    "n_circ_undirected": n_circ,
                    "stop_seq": stop_seq,
                    "stop_names": {c: names.get(c, c) for c in codes_sorted},
                }
            )

    return {
        "source_zip": path.name,
        "jalon_rows_scanned": rows,
        "corridors": corridors,
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--zip",
        type=Path,
        default=REPO / "data/raw/art/idfm_annuel_2024.zip",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=REPO / "scripts/etl/corridors.discovered.json",
    )
    p.add_argument("--max-per-line", type=int, default=8)
    args = p.parse_args()
    print(f"Discovering corridors from {args.zip.name}…", flush=True)
    data = stream_discover(args.zip, args.max_per_line)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"Wrote {args.out} — {len(data['corridors'])} corridors",
        flush=True,
    )
    by = Counter(c["short"] for c in data["corridors"])
    print("Per line:", dict(by), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
