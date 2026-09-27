"""Corridor drill-down: Paris-Gare-de-Lyon (Banlieue) ↔ Melun on RER D."""
import csv
import io
import json
import zipfile
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ZIPS = [REPO / "data/raw/art/idfm_annuel_2024.zip"]
OUT = REPO / "docs/exploration/profile-art-rer-d-corridor.json"

HUB = "Paris-Gare-de-Lyon (Banlieue)"
END = "Melun"
RER_D_TCT = {"TBD"}


def in_corridor(orig, dest):
    pair = {(orig, dest), (dest, orig)}
    return (HUB, END) in pair


def main():
    station_by_dist = defaultdict(lambda: {"count": 0, "code": "", "min_dist": 999999999})
    od_counts = Counter()
    weekday = Counter()
    half_hour_slots = Counter()
    circ_stations = defaultdict(list)
    examples = []

    with zipfile.ZipFile(ZIPS[0]) as zf:
        csv_name = next(n for n in zf.namelist() if n.endswith(".csv"))
        with zf.open(csv_name) as raw:
            reader = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8"))
            current_circ = None
            current_od = None
            current_date = None
            for row in reader:
                if row.get("tct", "").strip() not in RER_D_TCT:
                    continue
                orig = row.get("lib_ci_origine", "").strip()
                dest = row.get("lib_ci_destination", "").strip()
                if not in_corridor(orig, dest):
                    continue

                circ = row.get("id_circ", "")
                dc = row.get("date_circ", "").strip()
                od = (orig, dest)
                jalon = row.get("lib_ci_jalon", "").strip()
                dist = int(row.get("distance_cumul") or 0)
                typ = row.get("type_horaire", "").strip()
                th = row.get("dh_the_jalon", "").strip()

                if circ != current_circ:
                    if current_circ and current_od and circ_stations[current_circ]:
                        pass
                    current_circ = circ
                    current_od = od
                    current_date = dc
                    od_counts[od] += 1
                    try:
                        d = datetime.strptime(dc[:10], "%Y-%m-%d")
                        weekday["weekday" if d.weekday() < 5 else "weekend"] += 1
                    except ValueError:
                        pass

                if jalon:
                    info = station_by_dist[jalon]
                    info["count"] += 1
                    info["code"] = row.get("code_ci_jalon", "")
                    info["min_dist"] = min(info["min_dist"], dist)
                    circ_stations[circ].append((dist, jalon, typ))

                if typ == "D" and jalon == orig and th and len(th) >= 16:
                    try:
                        t = datetime.strptime(th[:19], "%Y-%m-%dT%H:%M:%S")
                        slot = t.hour * 2 + (1 if t.minute >= 30 else 0)
                        half_hour_slots[slot] += 1
                    except ValueError:
                        pass

                if len(examples) < 3:
                    examples.append(
                        {
                            "date_circ": dc,
                            "orig": orig,
                            "dest": dest,
                            "num_marche": row.get("num_marche"),
                            "jalon": jalon,
                            "type_horaire": typ,
                        }
                    )

    ordered_stations = sorted(
        [
            {
                "name": name,
                "code_ci": info["code"],
                "jalon_rows": info["count"],
                "min_distance_m": info["min_dist"],
            }
            for name, info in station_by_dist.items()
        ],
        key=lambda x: x["min_distance_m"],
    )

    # Typical path: stations appearing in >50% of corridor circulations
    circ_count = sum(od_counts.values())
    typical = []
    for s in ordered_stations:
        pct = 100 * s["jalon_rows"] / max(circ_count * 15, 1)  # ~15 jalons per circ
        if s["jalon_rows"] > circ_count * 0.3:
            typical.append({**s, "presence_pct": round(pct, 1)})

    result = {
        "corridor": f"{HUB} ↔ {END}",
        "year": "2024",
        "od_counts": {f"{a} → {b}": c for (a, b), c in od_counts.items()},
        "total_circulations": circ_count,
        "weekday_weekend": dict(weekday),
        "distinct_half_hour_depart_slots": len(half_hour_slots),
        "top_depart_slots": half_hour_slots.most_common(10),
        "stations_ordered_by_distance": ordered_stations,
        "typical_path_stations": typical,
        "station_count_ordered": len(ordered_stations),
        "examples": examples,
    }
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
