"""One-off streaming profiler for ART IDFM RER D circulations. Not product code."""
import csv
import io
import json
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ZIPS = [
    REPO / "data/raw/art/idfm_annuel_2023.zip",
    REPO / "data/raw/art/idfm_annuel_2024.zip",
]
OUT_JSON = REPO / "docs/exploration/profile-art-rer-d.json"

RER_D_TCT = {"TBD"}
RER_D_LIB_SNIPPET = "ligne D du RER"

# Known RER D branch anchors (lib_ci labels as in ART)
BRANCHES = {
    "melun": {
        "endpoint": "Melun",
        "hub": "Paris Gare de Lyon",
        "markers": [
            "Paris Gare de Lyon",
            "Maisons-Alfort - Alfortville",
            "Villeneuve-Saint-Georges",
            "Villeneuve-Triage",
            "Vigneux-sur-Seine",
            "Juvisy",
            "Brétigny",
            "Évry - Courcouronnes",
            "Le Mée",
            "Melun",
        ],
    },
    "corbeil": {
        "endpoint": "Corbeil-Essonnes",
        "hub": "Paris Gare de Lyon",
        "markers": [
            "Paris Gare de Lyon",
            "Maisons-Alfort - Alfortville",
            "Villeneuve-Saint-Georges",
            "Villeneuve-Triage",
            "Vigneux-sur-Seine",
            "Juvisy",
            "Brétigny",
            "Évry - Courcouronnes",
            "Corbeil-Essonnes",
        ],
    },
    "orry": {
        "endpoint": "Orry-la-Ville - Gouvieux",
        "hub": "Paris Gare de Lyon",
        "markers": [
            "Paris Gare de Lyon",
            "Paris Nord Surface",
            "Stade de France - Saint-Denis",
            "Saint-Denis",
            "Pierrefitte - Stains",
            "Stains",
            "Garges - Sarcelles",
            "Deuil - Montmagny",
            "Épinay - Villetaneuse",
            "Villiers-le-Bel - Gonesse - Arnouville",
            "Goussainville",
            "Louvres",
            "Survilliers - Fosses",
            "Orry-la-Ville - Gouvieux",
        ],
    },
    "creil": {
        "endpoint": "Creil",
        "hub": "Paris Gare de Lyon",
        "markers": [
            "Paris Gare de Lyon",
            "Saint-Denis",
            "Goussainville",
            "Survilliers - Fosses",
            "Orry-la-Ville - Gouvieux",
            "Chantilly - Gouvieux",
            "Creil",
        ],
    },
}


def is_rer_d(row: dict) -> bool:
    tct = (row.get("tct") or "").strip()
    lib = (row.get("lib_tct") or "").lower()
    return tct in RER_D_TCT or RER_D_LIB_SNIPPET.lower() in lib


def parse_ts(s: str):
    s = (s or "").strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:19], fmt[: len(s) if len(s) < 19 else 19])
        except ValueError:
            continue
    return None


def stream_year(zip_path: Path) -> dict:
    year = zip_path.stem.split("_")[-1]
    stats = {
        "year": year,
        "total_rows": 0,
        "rer_d_rows": 0,
        "tct_codes": Counter(),
        "lib_tct_samples": set(),
        "date_min": None,
        "date_max": None,
        "origins": set(),
        "destinations": set(),
        "jalon_stations": set(),
        "od_circ_counts": Counter(),
        "seen_circ": set(),
        "obs_null": 0,
        "est_only": 0,
        "obs_present": 0,
        "both_obs_est": 0,
        "weekday_circ": set(),
        "weekend_circ": set(),
        "month_counts": Counter(),
        "delay_samples": [],
        "delay_negative": 0,
        "delay_over_120": 0,
        "arrival_dest_rows": 0,
        "arrival_dest_delay_ok": 0,
        "origin_depart_rows": 0,
        "origin_depart_with_time": 0,
        "branch_jalon_hits": {k: Counter() for k in BRANCHES},
        "branch_od": {k: Counter() for k in BRANCHES},
        "examples": [],
    }

    with zipfile.ZipFile(zip_path) as zf:
        csv_name = next(n for n in zf.namelist() if n.endswith(".csv"))
        with zf.open(csv_name) as raw:
            text = io.TextIOWrapper(raw, encoding="utf-8")
            reader = csv.DictReader(text)
            for row in reader:
                stats["total_rows"] += 1
                if not is_rer_d(row):
                    continue

                stats["rer_d_rows"] += 1
                stats["tct_codes"][row.get("tct", "").strip()] += 1
                if len(stats["lib_tct_samples"]) < 3:
                    stats["lib_tct_samples"].add(row.get("lib_tct", "").strip())

                dc = (row.get("date_circ") or "").strip()
                if dc:
                    if stats["date_min"] is None or dc < stats["date_min"]:
                        stats["date_min"] = dc
                    if stats["date_max"] is None or dc > stats["date_max"]:
                        stats["date_max"] = dc
                    if len(dc) >= 7:
                        stats["month_counts"][dc[:7]] += 1

                orig = (row.get("lib_ci_origine") or "").strip()
                dest = (row.get("lib_ci_destination") or "").strip()
                jalon = (row.get("lib_ci_jalon") or "").strip()
                stats["origins"].add(orig)
                stats["destinations"].add(dest)
                if jalon:
                    stats["jalon_stations"].add(jalon)

                circ_id = row.get("id_circ", "")
                od_key = (orig, dest)
                if circ_id and circ_id not in stats["seen_circ"]:
                    stats["seen_circ"].add(circ_id)
                    stats["od_circ_counts"][od_key] += 1
                    if dc:
                        try:
                            d = datetime.strptime(dc[:10], "%Y-%m-%d")
                            if d.weekday() < 5:
                                stats["weekday_circ"].add(circ_id)
                            else:
                                stats["weekend_circ"].add(circ_id)
                        except ValueError:
                            pass

                obs = (row.get("dh_obs_jalon") or "").strip()
                est = (row.get("dh_est_jalon") or "").strip()
                if not obs:
                    stats["obs_null"] += 1
                    if est:
                        stats["est_only"] += 1
                else:
                    stats["obs_present"] += 1
                    if est:
                        stats["both_obs_est"] += 1

                th = parse_ts(row.get("dh_the_jalon", ""))
                obs_ts = parse_ts(obs)
                est_ts = parse_ts(est)
                typ = (row.get("type_horaire") or "").strip()

                if typ == "A" and jalon == dest and th:
                    stats["arrival_dest_rows"] += 1
                    actual = obs_ts or est_ts
                    if actual:
                        delay_min = (actual - th).total_seconds() / 60
                        stats["arrival_dest_delay_ok"] += 1
                        if delay_min < 0:
                            stats["delay_negative"] += 1
                        if delay_min > 120:
                            stats["delay_over_120"] += 1
                        if len(stats["delay_samples"]) < 5:
                            stats["delay_samples"].append(
                                {
                                    "date_circ": dc,
                                    "orig": orig,
                                    "dest": dest,
                                    "jalon": jalon,
                                    "delay_min": round(delay_min, 1),
                                    "used_est": obs_ts is None,
                                }
                            )

                if typ == "D" and jalon == orig and th:
                    stats["origin_depart_rows"] += 1
                    stats["origin_depart_with_time"] += 1

                for branch, cfg in BRANCHES.items():
                    if jalon in cfg["markers"]:
                        stats["branch_jalon_hits"][branch][jalon] += 1
                    ep, hub = cfg["endpoint"], cfg["hub"]
                    if (orig == hub and dest == ep) or (orig == ep and dest == hub):
                        stats["branch_od"][branch][(orig, dest)] += 1

                if len(stats["examples"]) < 5:
                    stats["examples"].append(
                        {k: row.get(k, "") for k in reader.fieldnames[:12]}
                    )

                if stats["total_rows"] % 2_000_000 == 0:
                    print(
                        f"[{year}] scanned {stats['total_rows']:,} rows, "
                        f"RER D {stats['rer_d_rows']:,}",
                        file=sys.stderr,
                    )

    return stats


def normalize(stats: dict) -> dict:
    rer = stats["rer_d_rows"] or 1
    out = {
        "year": stats["year"],
        "total_rows": stats["total_rows"],
        "rer_d_rows": stats["rer_d_rows"],
        "rer_d_pct_of_file": round(100 * stats["rer_d_rows"] / max(stats["total_rows"], 1), 2),
        "tct_codes": dict(stats["tct_codes"]),
        "lib_tct_samples": sorted(stats["lib_tct_samples"]),
        "date_min": stats["date_min"],
        "date_max": stats["date_max"],
        "distinct_origins": len(stats["origins"]),
        "distinct_destinations": len(stats["destinations"]),
        "distinct_jalon_stations": len(stats["jalon_stations"]),
        "distinct_circulations": len(stats["seen_circ"]),
        "obs_null_pct": round(100 * stats["obs_null"] / rer, 2),
        "est_only_pct": round(100 * stats["est_only"] / rer, 2),
        "obs_present_pct": round(100 * stats["obs_present"] / rer, 2),
        "weekday_circ_count": len(stats["weekday_circ"]),
        "weekend_circ_count": len(stats["weekend_circ"]),
        "month_counts": dict(sorted(stats["month_counts"].items())),
        "top_od_pairs": stats["od_circ_counts"].most_common(25),
        "arrival_dest_rows": stats["arrival_dest_rows"],
        "arrival_dest_delay_ok": stats["arrival_dest_delay_ok"],
        "origin_depart_rows": stats["origin_depart_rows"],
        "delay_negative": stats["delay_negative"],
        "delay_over_120": stats["delay_over_120"],
        "delay_samples": stats["delay_samples"],
        "branch_jalon_hits": {
            k: dict(v) for k, v in stats["branch_jalon_hits"].items()
        },
        "branch_od": {k: dict(v) for k, v in stats["branch_od"].items()},
        "examples": stats["examples"],
        "origins_sample": sorted(stats["origins"])[:30],
        "destinations_sample": sorted(stats["destinations"])[:30],
    }
    return out


def main():
    results = []
    for zp in ZIPS:
        if not zp.exists():
            print(f"Missing {zp}", file=sys.stderr)
            continue
        print(f"Profiling {zp.name}...", file=sys.stderr)
        raw = stream_year(zp)
        results.append(normalize(raw))

    OUT_JSON.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
