"""One-off schema profiler for IDFM arrets-lignes + GTFS. Not product code."""
import csv
import io
import json
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

CSV_PATH = Path("data/raw/idfm/arrets-lignes.csv")
ZIP_PATH = Path("data/raw/idfm/IDFM-gtfs.zip")
RAIL_MODES = {"LocalTrain", "RapidTransit", "regionalRail", "RailShuttle"}


def profile_arrets_lignes():
    row_count = 0
    null_counts = Counter()
    line_to_info = defaultdict(
        lambda: {
            "stops": 0,
            "stop_ids": set(),
            "route_long_name": "",
            "shortname": "",
            "mode": "",
            "operator": "",
        }
    )
    mode_counts = Counter()
    operator_counts = Counter()
    all_distinct_line = set()
    all_distinct_stop = set()
    duplicate_keys = Counter()
    examples = []
    cols = None

    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        cols = reader.fieldnames
        for row in reader:
            row_count += 1
            for col in cols:
                v = row.get(col, "")
                if v is None or str(v).strip() == "":
                    null_counts[col] += 1
            mode = row.get("mode", "").strip()
            mode_counts[mode] += 1
            operator_counts[row.get("operatorname", "").strip()] += 1
            lid = row.get("id", "").strip()
            sid = row.get("stop_id", "").strip()
            all_distinct_line.add(lid)
            all_distinct_stop.add(sid)
            duplicate_keys[(lid, sid)] += 1
            if len(examples) < 5:
                examples.append({k: row.get(k) for k in cols})
            if mode in RAIL_MODES:
                info = line_to_info[lid]
                info["stops"] += 1
                info["stop_ids"].add(sid)
                info["route_long_name"] = row.get("route_long_name", "")
                info["shortname"] = row.get("shortname", "")
                info["mode"] = mode
                info["operator"] = row.get("operatorname", "")

    rail_lines = sorted(
        [
            {
                "line_id": lid,
                "shortname": info["shortname"],
                "route_long_name": info["route_long_name"],
                "mode": info["mode"],
                "operator": info["operator"],
                "stop_rows": info["stops"],
                "distinct_stops": len(info["stop_ids"]),
            }
            for lid, info in line_to_info.items()
        ],
        key=lambda x: (-x["distinct_stops"], x["shortname"]),
    )

    rail_stop_ids = set()
    for info in line_to_info.values():
        rail_stop_ids |= info["stop_ids"]

    return {
        "row_count": row_count,
        "columns": cols,
        "null_pct": {c: round(100 * null_counts[c] / row_count, 2) for c in cols},
        "distinct": {
            "line_id": len(all_distinct_line),
            "stop_id": len(all_distinct_stop),
        },
        "mode_counts": dict(mode_counts),
        "operator_top20": dict(operator_counts.most_common(20)),
        "duplicate_line_stop_pairs": sum(1 for v in duplicate_keys.values() if v > 1),
        "examples": examples,
        "rail": {
            "modes_filter": sorted(RAIL_MODES),
            "row_count": sum(x["stop_rows"] for x in rail_lines),
            "distinct_line_ids": len(rail_lines),
            "distinct_stop_ids": len(rail_stop_ids),
            "lines": rail_lines,
        },
    }


def read_zip_head(name, n=5):
    with zipfile.ZipFile(ZIP_PATH) as zf:
        with zf.open(name) as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            cols = reader.fieldnames
            rows = [row for i, row in enumerate(reader) if i < n]
            return cols, rows


def count_zip_rows(name):
    with zipfile.ZipFile(ZIP_PATH) as zf:
        with zf.open(name) as f:
            return sum(1 for _ in f) - 1


def profile_gtfs():
    out = {}

    agency_cols, agency_rows = read_zip_head("agency.txt", 20)
    out["agency"] = {
        "columns": agency_cols,
        "row_count": len(agency_rows),
        "rows": agency_rows,
    }

    routes_cols, routes_head = read_zip_head("routes.txt", 5)
    route_type_counts = Counter()
    route_mode_counts = Counter()
    route_operator_counts = Counter()
    rail_routes = []
    route_count = 0
    gtfs_route_ids_rail = set()
    with zipfile.ZipFile(ZIP_PATH) as zf:
        with zf.open("routes.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            for row in reader:
                route_count += 1
                rt = row.get("route_type", "")
                route_type_counts[rt] += 1
                route_mode_counts[row.get("route_mode", "")] += 1
                route_operator_counts[row.get("route_operator", "")] += 1
                is_rail = rt in ("1", "2") or row.get("route_mode", "") in RAIL_MODES
                if is_rail:
                    gtfs_route_ids_rail.add(row.get("route_id", ""))
                    if len(rail_routes) < 60:
                        rail_routes.append(
                            {
                                "route_id": row.get("route_id"),
                                "route_short_name": row.get("route_short_name"),
                                "route_long_name": row.get("route_long_name"),
                                "route_type": rt,
                                "route_mode": row.get("route_mode"),
                                "route_operator": row.get("route_operator"),
                            }
                        )
    out["routes"] = {
        "columns": routes_cols,
        "row_count": route_count,
        "route_type_counts": dict(route_type_counts),
        "route_mode_counts": dict(route_mode_counts),
        "route_operator_top15": dict(route_operator_counts.most_common(15)),
        "head": routes_head,
        "rail_routes_sample": rail_routes,
        "rail_route_id_count": len(gtfs_route_ids_rail),
    }

    stops_cols, stops_head = read_zip_head("stops.txt", 5)
    stop_count = 0
    idfm_format = 0
    parent_station = 0
    location_type_counts = Counter()
    gtfs_stops = set()
    with zipfile.ZipFile(ZIP_PATH) as zf:
        with zf.open("stops.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            for row in reader:
                stop_count += 1
                sid = row.get("stop_id", "")
                gtfs_stops.add(sid)
                if sid.startswith("IDFM:"):
                    idfm_format += 1
                if row.get("parent_station"):
                    parent_station += 1
                location_type_counts[row.get("location_type", "0")] += 1
    out["stops"] = {
        "columns": stops_cols,
        "row_count": stop_count,
        "idfm_prefix_count": idfm_format,
        "idfm_prefix_pct": round(100 * idfm_format / stop_count, 2),
        "parent_station_nonnull": parent_station,
        "location_type_counts": dict(location_type_counts),
        "head": stops_head,
    }

    trips_count = count_zip_rows("trips.txt")
    trips_cols, trips_head = read_zip_head("trips.txt", 5)
    route_id_in_trips = Counter()
    with zipfile.ZipFile(ZIP_PATH) as zf:
        with zf.open("trips.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            for i, row in enumerate(reader):
                if i < 100000:
                    route_id_in_trips[row.get("route_id", "")] += 1
    out["trips"] = {
        "columns": trips_cols,
        "row_count": trips_count,
        "head": trips_head,
        "route_id_top20_first100k": dict(route_id_in_trips.most_common(20)),
    }

    st_cols = None
    st_count = 0
    st_head = []
    with zipfile.ZipFile(ZIP_PATH) as zf:
        with zf.open("stop_times.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            st_cols = reader.fieldnames
            for i, row in enumerate(reader):
                st_count += 1
                if i < 5:
                    st_head.append(row)
    out["stop_times"] = {
        "columns": st_cols,
        "row_count": st_count,
        "head": st_head,
    }

    return out, gtfs_stops, gtfs_route_ids_rail


def join_analysis(gtfs_stops, gtfs_route_ids_rail):
    idfm_stops_csv = set()
    csv_rail_line_ids = set()
    csv_rail_stops = set()
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            sid = row.get("stop_id", "")
            idfm_stops_csv.add(sid)
            if row.get("mode") in RAIL_MODES:
                csv_rail_line_ids.add(row.get("id", ""))
                csv_rail_stops.add(sid)

    overlap = idfm_stops_csv & gtfs_stops
    rail_overlap = csv_rail_stops & gtfs_stops
    route_overlap = csv_rail_line_ids & gtfs_route_ids_rail

    return {
        "stop_id": {
            "csv_all": len(idfm_stops_csv),
            "csv_rail": len(csv_rail_stops),
            "gtfs": len(gtfs_stops),
            "exact_overlap_all": len(overlap),
            "exact_overlap_rail": len(rail_overlap),
            "overlap_pct_csv_all": round(100 * len(overlap) / len(idfm_stops_csv), 2),
            "overlap_pct_csv_rail": round(100 * len(rail_overlap) / len(csv_rail_stops), 2),
            "csv_only_sample": sorted(idfm_stops_csv - gtfs_stops)[:8],
            "gtfs_only_sample": sorted(gtfs_stops - idfm_stops_csv)[:8],
        },
        "route_id": {
            "csv_rail_line_ids": len(csv_rail_line_ids),
            "gtfs_rail_route_ids": len(gtfs_route_ids_rail),
            "exact_overlap": len(route_overlap),
            "overlap_pct": round(100 * len(route_overlap) / len(csv_rail_line_ids), 2)
            if csv_rail_line_ids
            else 0,
            "csv_only_sample": sorted(csv_rail_line_ids - gtfs_route_ids_rail)[:8],
            "gtfs_only_sample": sorted(gtfs_route_ids_rail - csv_rail_line_ids)[:8],
        },
        "reco": "Direct join on stop_id and route_id — both use IDFM:… namespace in CSV and GTFS.",
    }


def main():
    print("Profiling arrets-lignes...", file=sys.stderr)
    arrets = profile_arrets_lignes()
    print("Profiling GTFS...", file=sys.stderr)
    gtfs, gtfs_stops, gtfs_routes = profile_gtfs()
    print("Join analysis...", file=sys.stderr)
    joins = join_analysis(gtfs_stops, gtfs_routes)
    result = {"arrets_lignes": arrets, "gtfs": gtfs, "joins": joins}
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
