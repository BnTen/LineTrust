# Raw inventory — Phase E downloads

**Date:** 2026-09-27  
**Agent:** explorer-data  
**Scope:** `data/raw/` only — no ETL, no product implementation  
**Manifest:** `data/raw/MANIFEST.sha256` (5 files, SHA-256 verified at download)

## Summary verdict (MVP grain)

**Observed punctuality at `station-pair × direction × 30-min window` is not supported by any file in this bundle.**

The only punctuality facts are **monthly line aggregates** (Transilien/RER) or **monthly region aggregates** (TER). GTFS adds **theoretical** schedule (windows, direction, weekday/weekend via `calendar*`) but **no delay / cancellation history**.

Honest MVP options without new sources:

1. **Proxy:** line × month punctuality applied to corridor pairs on that line (heavy disclaimer).
2. **Impossible as stated:** pair × sens × fenêtre 30 min observed score, A≠B independent observed scores, ±30 min *reliability* alternative.
3. **Theoretical adjunct:** GTFS for “trains in window” and corridor topology only.

---

## Inventory

| Path | Size (disk) | Rows (est.) | Format | Apparent cadence / grain |
|------|-------------|-------------|--------|--------------------------|
| `sncf/ponctualite-mensuelle-transilien.csv` | 93 Ko | 2 074 | CSV `;`, UTF-8 BOM | **Month × service × ligne** (13 lines: RER A–E + Transilien H,J,K,L,N,P,R,U). Cols: `date`, `service`, `ligne`, `nom_de_la_ligne`, `taux_de_ponctualite`, `nombre_de_voyageurs_a_l_heure_pour_un_voyageur_en_retard`. History **2013-01 → 2026-08** (~160 months). KPI = voyageurs &lt;5 min (passenger-weighted). **No station, direction, day-type, or time window.** |
| `sncf/regularite-mensuelle-ter.csv` | 457 Ko | 2 380 (parsed) | CSV `;`, UTF-8 BOM | **Month × région TER** (31 region labels incl. historical names). Cols: train counts, `taux_de_regularite`, `nombre_de_trains_a_l_heure_pour_un_train_en_retard`, free-text `commentaires`. History **2013-01 → 2026-08** (~164 months). **No ligne TER, station, direction, window.** |
| `sncf/gares-de-voyageurs.csv` | 264 Ko | 2 782 | CSV `;`, UTF-8 BOM | Station master: `nom`, `libellecourt`, `segment_drg`, coords, `codeinsee`, **`codes_uic`**, UUID `id`. ~395 rows with IDF `code_insee` prefix 75/77/78/91/92/93/94/95. |
| `idfm/arrets-lignes.csv` | 13 Mo | 72 727 | CSV `;`, UTF-8 BOM, CRLF | **Stop × line** (IDFM ids). Cols: `id` (route), `route_long_name`, `stop_id`, `stop_name`, coords, `operatorname`, `shortname`, `mode`, commune. Rail subset: **406 rows** — RapidTransit (RER A–E, 253 stops) + regionalRail (`TER`, 153). Mostly Bus/Metro/Tram otherwise. |
| `idfm/IDFM-gtfs.zip` | 131 Mo (137 Mo on disk) | 14 files | GTFS (+ IDFM extensions) | Theoretical schedule, refreshed per IDFM hub (~3×/day). **Uncompressed ~1.16 Go** total. |

### GTFS zip contents (uncompressed size)

| File | Uncompressed | Rows (est.) | Role |
|------|--------------|-------------|------|
| `stop_times.txt` | 935 Mo | 11 065 719 | Theoretical stop times — **do not full-scan in main thread** |
| `object_codes_extension.txt` | 101 Mo | 1 214 322 | Netex / external id crosswalk |
| `shapes.txt` | 132 Mo | 3 453 585 | Geometry |
| `trips.txt` | 57 Mo | 496 430 | `direction_id`, `shape_id`, headsign |
| `transfers.txt` | 5.6 Mo | 192 337 | Transfers |
| `stops.txt` | 5.0 Mo | 53 451 | Stops / parent stations |
| `pathways.txt` | 556 Ko | — | |
| `routes.txt` | 105 Ko | 2 028 | Includes RER/Transilien letters (A–E, H, J, …) |
| `calendar_dates.txt` | 63 Ko | 2 453 | Exceptions |
| `calendar.txt` | 51 Ko | 1 076 | Service patterns |
| `attributions.txt` | 87 Ko | — | |
| `agency.txt` | 8.6 Ko | — | |
| `booking_rules.txt` | 6.5 Ko | — | |
| `ticketing_deep_links.txt` | 197 B | — | |

Licence / attribution files: **none inside `data/raw/`** — see `docs/exploration/source-whitelist.md` (ODbL SNCF, ODbL IDFM S4, Licence Mobilité GTFS S5).

---

## Join candidates

| From | To | Key / path | Coverage note |
|------|-----|------------|---------------|
| `ponctualite…ligne` | `arrets-lignes.shortname` | Letter match (A, B, …) when `mode=RapidTransit` | 13 lines; no route_id on SNCF side |
| `ponctualite…ligne` | `GTFS routes.route_short_name` | Same letters; multiple `route_id` per letter (agency duplicates, replacement routes) | Needs disambiguation rules |
| `arrets-lignes.stop_id` | `GTFS stops.stop_id` | `IDFM:monomodalStopPlace:*` | **376 / 378** rail stop_ids overlap |
| `arrets-lignes.id` | `GTFS routes.route_id` | `IDFM:C…` | Direct for line membership |
| `gares.codes_uic` | GTFS | Via `object_codes_extension` | **No direct UIC overlap observed** (88 numeric `87*` externals, 0 match with gares UIC). Join likely **name + geo** or future ref table |
| `gares` | `arrets-lignes` | `stop_name` ≈ `nom` + coords | Fuzzy; homonyms (e.g. “… RER” bus stops in arrets) |
| GTFS `trips` + `stop_times` | Pair A→B | Shared `trip_id`, ordered `stop_sequence`, `direction_id` | **Theoretical** path only; 30-min bins derivable from `departure_time` |
| GTFS `calendar` / `calendar_dates` | Day type | `service_id` → weekday vs weekend | Theoretical service days only |
| TER `region` | IDF corridor | Manual map | Île-de-France TER ≈ region label match; still **region-month** grain |

---

## Risks

| Risk | Severity | Detail |
|------|----------|--------|
| **Grain mismatch vs MVP promise** | **Blocker** | S1 is line×month; cannot compute pair×direction×window observed reliability |
| **No weekday / weekend in S1** | High | Product requires ouvré vs WE split; absent from punctuality CSV |
| **Proxy overclaim** | High | Assigning line-month score to a sub-segment (e.g. Nanterre→Châtelet) implies precision not in data |
| **A→B ≠ B→A** | High | No directional punctuality; GTFS direction is operational, not delay asymmetry |
| **±30 min alternative (reliability)** | High | GTFS gives alternative *departure times*, not comparative punctuality |
| **TER coarseness** | Medium | Region-month only; useless for station-pair slice except broad disclaimer |
| **TER CSV parsing** | Medium | Multiline `commentaires` breaks naive `cut`; use proper CSV parser |
| **GTFS size** | Medium | `stop_times` ~11 M rows / 935 Mo — ETL must stream; not for Neon raw |
| **ID mapping** | Medium | UIC not wired GTFS↔gares; IDFM stop_id is primary for rail |
| **arrets noise** | Low | Bus stops named “… RER”; filter `mode ∈ {RapidTransit, regionalRail}` |
| **Duplicate route_ids** | Low | Multiple GTFS routes per letter (e.g. 4× `A`) — pick canonical for corridor |
| **History depth** | Low | ~160 months available (&gt;24 required) ✓ |

---

## Reco for matrix rows

| KPI / promise | Status | Notes |
|---------------|--------|-------|
| Score directed pair A→B (pair × sens × day_type × window 30m) | **impossible** | No observed facts at grain; S1 line-month only |
| Score B→A independent | **impossible** | Same |
| Weekday vs weekend split (observed) | **impossible** | Not in S1/S2; GTFS calendar = theoretical only → **proxy** if used |
| Alternative ±30 min (reliability) | **impossible** | GTFS → **proxy** for “other departures in window” (theoretical) |
| Uncertainty from `n` | **proxy** | `nombre_de_voyageurs_a_l_heure_pour_un_voyageur_en_retard` is derived passenger metric, not cell `n`; line-month `n` not published |
| Line identity on page | **calculable** | Via arrets + GTFS routes |
| Train number | **V2** | Not in punctuality sources |
| Browse by line | **calculable** | S1 line-month aggregates |
| Browse by region (TER) | **calculable** | S2 region-month |
| Trend chart 24 months | **calculable** | S1/S2 monthly series at their native grain |
| Share card metrics pack | **proxy** | Only if UI discloses line-month proxy, not pair-window |
| Station search / corridor | **calculable** | gares + arrets + GTFS topology |
| Theoretical departures in 30-min window | **calculable** | GTFS stop_times + calendar (not reliability) |
| Holidays day-type | **V2** | Per intent |
| Masked suppressions | **V2** | Per intent |

---

## Grain honesty decision (preliminary)

**Recommended MVP display grain (from files alone):** **ligne × mois** punctuality proxy for a named pilot corridor, with:

- Station picker backed by gares / arrets / GTFS refs
- Optional GTFS-backed “services in your window” (theoretical)
- Prominent disclaimer: score is line-level monthly open data, not OD nor half-hour observed reliability

**Do not ship** pair×window observed scores without a new whitelist source (e.g. axis-level PDF tables are not machine-ready; train-level open data not present).

---

## Next profiling (not done here)

- [ ] schema-profiler: dtypes, null rates, cardinalities per CSV
- [ ] Name–geo join quality: gares ↔ arrets rail stops (sample corridor)
- [ ] Canonical `route_id` pick per RER letter for pilot corridor
- [ ] Human gate on `data-capability-matrix.md` + corridor name in intent
