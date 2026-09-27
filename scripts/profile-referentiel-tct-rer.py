"""Profile ART referentiel_tct-ui.csv for RER + Transilien tct codes."""
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data/raw/art/referentiel_tct-ui.csv"
JSON_OUT = ROOT / "docs/exploration/profile-referentiel-tct-rer.json"

IDFM = {
    "A": "C01742",
    "B": "C01743",
    "C": "C01727",
    "D": "C01728",
    "E": "C01729",
    "H": "C01737",
    "J": "C01739",
    "K": "C01738",
    "L": "C01740",
    "N": "C01736",
    "P": "C01730",
    "R": "C01731",
    "U": "C01741",
    "V": "C02711",
}

COVERAGE = {
    "A": "partial (ouest only; est/sud RATP absent)",
    "B": "partial (nord from Gare du Nord; sud absent)",
    "C": "full",
    "D": "full",
    "E": "full",
    "H": "full",
    "J": "full",
    "K": "full",
    "L": "full",
    "N": "full",
    "P": "full",
    "R": "full",
    "U": "full",
    "V": "full",
}

RER_LETTERS = set("ABCDE")
TRANSILIEN_LETTERS = set("HJKLNP RUV".replace(" ", ""))


def norm(value: str | None) -> str:
    return (value or "").strip()


def is_idf_related(row: dict[str, str]) -> bool:
    activite = norm(row.get("activite", "")).upper()
    lib_tct = norm(row.get("lib_tct", "")).upper()
    lib_ui = norm(row.get("lib_ui", "")).upper()
    nom = norm(row.get("nom_commercial_service_regional", "")).upper()
    ao = norm(row.get("autorite_organisatrice", "")).upper()
    cat = norm(row.get("categorie", "")).upper()
    haystack = " ".join([activite, lib_tct, lib_ui, nom, ao, cat])

    keywords = [
        "RER",
        "TRANSILIEN",
        "ILE-DE-FRANCE",
        "ILE DE FRANCE",
        "IDFM",
        "STIF",
        "PARIS",
        "SNCF RESEAU IDF",
        "RESEAU IDF",
    ]
    if any(keyword in haystack for keyword in keywords):
        return True
    if activite in RER_LETTERS | TRANSILIEN_LETTERS:
        return True
    if re.search(r"\bRER\b", lib_tct, re.I):
        return True
    if re.search(r"TRANSILIEN", lib_tct, re.I):
        return True
    if re.search(r"LIGNE\s+[A-E]\s+DU\s+RER", lib_tct, re.I):
        return True
    if re.search(r"TRANSILIEN\s+[HJKLNP RUV]", lib_tct, re.I):
        return True
    return False


def extract_short_name(row: dict[str, str]) -> str | None:
    activite = norm(row.get("activite", ""))
    lib_tct = norm(row.get("lib_tct", ""))
    nom = norm(row.get("nom_commercial_service_regional", ""))
    tct = norm(row.get("tct", ""))

    if len(activite) == 1 and activite.upper() in RER_LETTERS | TRANSILIEN_LETTERS:
        return activite.upper()

    for src in [nom, lib_tct]:
        match = re.search(r"(?:RER|Transilien)\s+([A-EHJKLNP RUV])", src, re.I)
        if match:
            return match.group(1).upper()
        match = re.search(r"[Ll]igne\s+([A-EHJKLNP RUV])\b", src)
        if match:
            return match.group(1).upper()
        match = re.search(r"\b([A-E])\s+du\s+RER", src, re.I)
        if match:
            return match.group(1).upper()
        match = re.search(r"[Ll]igne\s+(T\d+)\b", src, re.I)
        if match:
            return match.group(1).upper()

    if tct:
        match = re.match(r"RER([A-E])", tct, re.I)
        if match:
            return match.group(1).upper()
        match = re.match(r"TR([HJKLNP RUV])", tct, re.I)
        if match:
            return match.group(1).upper()
        match = re.match(r"TL([HJKLNP RUV])", tct, re.I)
        if match:
            return match.group(1).upper()

    return None


def is_transilien_activite(row: dict[str, str]) -> bool:
    return norm(row.get("activite", "")).lower() == "transilien et rer"


def classify_network(short: str | None, lib_tct: str) -> str | None:
    if short in RER_LETTERS:
        return "RER"
    if short in TRANSILIEN_LETTERS:
        return "Transilien"
    if short and short.startswith("T") and short[1:].isdigit():
        return "Tram-train"
    lib = lib_tct.upper()
    if "NAVETTE" in lib:
        return "Navette"
    if "TRAM" in lib:
        return "Tram-train"
    if "RER" in lib:
        return "RER"
    if "TRANSILIEN" in lib:
        return "Transilien"
    return None


def load_rows() -> tuple[list[str], list[dict[str, str]]]:
    with CSV_PATH.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        fieldnames = list(reader.fieldnames or [])
        return fieldnames, list(reader)


def column_stats(fieldnames: list[str], rows: list[dict[str, str]]) -> dict[str, dict]:
    stats: dict[str, dict] = {}
    total = len(rows)
    for column in fieldnames:
        values = [norm(row.get(column, "")) for row in rows]
        non_empty = [value for value in values if value]
        stats[column] = {
            "null_pct": round(100 * (total - len(non_empty)) / total, 1) if total else 0,
            "distinct": len(set(non_empty)),
        }
    return stats


def build_tct_map(rows: list[dict[str, str]]) -> dict[str, dict]:
    by_tct: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_tct[norm(row["tct"])].append(row)

    tct_map: dict[str, dict] = {}
    for tct, group in sorted(by_tct.items()):
        years = sorted({norm(row["annee"]) for row in group if norm(row["annee"])})
        short_counts: dict[str, int] = defaultdict(int)
        for row in group:
            short = extract_short_name(row)
            if short:
                short_counts[short] += 1
        short = max(short_counts, key=short_counts.get) if short_counts else None
        lib_joined = " | ".join(sorted({norm(row["lib_tct"]) for row in group}))
        network = classify_network(short, lib_joined)

        idfm = IDFM.get(short) if short in IDFM else None
        tct_map[tct] = {
            "tct": tct,
            "ui": sorted({norm(row["ui"]) for row in group}),
            "lib_tct": sorted({norm(row["lib_tct"]) for row in group}),
            "nom_commercial_service_regional": sorted(
                {
                    norm(row["nom_commercial_service_regional"])
                    for row in group
                    if norm(row["nom_commercial_service_regional"])
                }
            ),
            "annee": years,
            "categorie": sorted({norm(row["categorie"]) for row in group}),
            "activite": sorted({norm(row["activite"]) for row in group}),
            "short": short,
            "network": network,
            "idfm_line_id": f"IDFM:{idfm}" if idfm else None,
            "coverage_expectation": COVERAGE.get(short) if short else None,
            "row_count": len(group),
        }
    return tct_map


def find_year_drift(rows: list[dict[str, str]], tct_map: dict[str, dict]) -> list[dict]:
    drift: list[dict] = []
    for tct, info in tct_map.items():
        if len(info["annee"]) <= 1:
            continue
        by_year: dict[str, set[str]] = defaultdict(set)
        for row in rows:
            if norm(row["tct"]) != tct:
                continue
            by_year[norm(row["annee"])].add(norm(row["lib_tct"]))
        if len({frozenset(values) for values in by_year.values()}) > 1:
            drift.append({"tct": tct, "by_year": {year: sorted(values) for year, values in sorted(by_year.items())}})
    return drift


def find_ambiguous(by_tct: dict[str, list[dict[str, str]]], tct_map: dict[str, dict]) -> list[dict]:
    ambiguous: list[dict] = []
    for tct, info in tct_map.items():
        shorts = {extract_short_name(row) for row in by_tct[tct]} - {None}
        if not info["short"]:
            ambiguous.append(
                {
                    "tct": tct,
                    "reason": "no short name inferred",
                    "lib_tct": info["lib_tct"][:2],
                    "activite": info["activite"],
                }
            )
        elif len(shorts) > 1:
            ambiguous.append(
                {
                    "tct": tct,
                    "reason": f"multiple shorts: {sorted(shorts)}",
                    "lib_tct": info["lib_tct"][:2],
                    "activite": info["activite"],
                }
            )
    return ambiguous


def main() -> None:
    fieldnames, all_rows = load_rows()
    idf_rows = [row for row in all_rows if is_idf_related(row)]
    rer_trans_rows = [row for row in all_rows if is_transilien_activite(row)]

    by_tct: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rer_trans_rows:
        by_tct[norm(row["tct"])].append(row)

    tct_map = build_tct_map(rer_trans_rows)
    rer_map = {key: value for key, value in tct_map.items() if value["network"] == "RER"}
    trans_map = {key: value for key, value in tct_map.items() if value["network"] == "Transilien"}
    tram_map = {key: value for key, value in tct_map.items() if value["network"] == "Tram-train"}
    navette_map = {key: value for key, value in tct_map.items() if value["network"] == "Navette"}
    other_map = {
        key: value
        for key, value in tct_map.items()
        if value["network"] not in ("RER", "Transilien", "Tram-train", "Navette")
    }

    noise = [row for row in idf_rows if not is_transilien_activite(row)]
    noise_tcts = sorted({norm(row["tct"]) for row in noise})

    payload = {
        "meta": {
            "source": str(CSV_PATH.relative_to(ROOT)),
            "total_rows": len(all_rows),
            "idf_filtered_rows": len(idf_rows),
            "rer_transilien_rows": len(rer_trans_rows),
            "distinct_tct_codes": len(tct_map),
        },
        "columns": column_stats(fieldnames, all_rows),
        "rer_tct_map": rer_map,
        "transilien_tct_map": trans_map,
        "tram_train_tct_map": tram_map,
        "navette_tct_map": navette_map,
        "unclassified_tct_map": other_map,
        "ambiguous": find_ambiguous(by_tct, tct_map),
        "year_drift": find_year_drift(rer_trans_rows, tct_map),
        "noise_tcts": noise_tcts,
        "idfm_reference": {key: f"IDFM:{value}" for key, value in IDFM.items()},
        "coverage_reference": COVERAGE,
    }

    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"total_rows={payload['meta']['total_rows']}")
    print(f"idf_filtered={payload['meta']['idf_filtered_rows']}")
    print(f"rer_transilien={payload['meta']['rer_transilien_rows']}")
    print(f"distinct_tct={payload['meta']['distinct_tct_codes']}")
    print(
        f"rer={len(rer_map)} transilien={len(trans_map)} "
        f"tram={len(tram_map)} navette={len(navette_map)} other={len(other_map)}"
    )
    print(f"ambiguous={len(payload['ambiguous'])} year_drift={len(payload['year_drift'])}")
    print(f"noise_tcts={len(noise_tcts)}")
    print(f"wrote {JSON_OUT}")


if __name__ == "__main__":
    main()
