# Profile — IDFM arrêts-lignes + GTFS théorique

**Date:** 2026-09-27  
**Agent:** schema-profiler  
**Inputs:** `data/raw/idfm/arrets-lignes.csv` (~13 Mo), `data/raw/idfm/IDFM-gtfs.zip` (~131 Mo)  
**Machine-readable dump:** `docs/exploration/profile-idfm-gtfs.json` (regenerable via `scripts/profile-idfm-gtfs.py`)

---

## Scope & limits

- GTFS = **offre théorique** (horaires planifiés). **Ne pas** en déduire de ponctualité observée.
- Licence : **Licence Mobilité** (IDFM PRIM / GTFS théorique S5) — voir `docs/exploration/source-whitelist.md`.
- `stop_times.txt` profilé par **streaming** (head + row count) ; contenu intégral non chargé en contexte.

---

## 1. `arrets-lignes.csv`

### Columns

| name | dtype | null% | distinct | notes |
|------|-------|-------|----------|-------|
| `id` | string | 0 | 1 981 | Line / route id (`IDFM:C…`) — **join key → GTFS `route_id`** |
| `route_long_name` | string | 0 | 1 953 | Often equals shortname for rail |
| `stop_id` | string | 0 | 34 860 | `IDFM:<numeric>` — **join key → GTFS `stop_id`** |
| `stop_name` | string | 0 | — | French label |
| `stop_lon` / `stop_lat` | float (str) | 0 | — | WGS84 |
| `operatorname` | string | 0 | 57 | SNCF for RER/Transilien/TER |
| `shortname` | string | 0 | 1 850 | `A`…`E`, `H`…`V`, `TER`, etc. |
| `bookingrules` | string | **95.9** | — | Almost always empty |
| `mode` | string | 0 | 9 | NeTEx mode (see below) |
| `pointgeo` | string | 0 | — | `"lat, lon"` duplicate of coords |
| `nom_commune` / `code_insee` | string | 0 | — | Municipality |

**Rows:** 72 727 (line × stop membership, not ordered along route).

### Mode distribution (all networks)

| mode | rows | MVP rail? |
|------|------|-----------|
| Bus | 70 661 | no |
| Metro | 803 | no |
| Tramway | 564 | no |
| **RapidTransit** | 253 | **RER A–E** |
| **LocalTrain** | 263 | **Transilien H,J,K,L,N,P,R,U,V** |
| **regionalRail** | 153 | **TER** (several regional brands) |
| RailShuttle | 16 | CDG VAL, ORLYVAL — exclude from corridor |
| CableWay / Funicular | 14 | no |

### Rail filter applied

Modes: `RapidTransit`, `LocalTrain`, `regionalRail` (optionally `RailShuttle` excluded for MVP).

| metric | value |
|--------|-------|
| Rail rows | 685 |
| Distinct line ids | 26 |
| Distinct stop ids | 574 |
| Duplicate (line_id, stop_id) | **0** |

### RER / Transilien / TER line identifiers

| shortname | line_id | mode (CSV) | operator | distinct stops | network |
|-----------|---------|------------|----------|----------------|---------|
| **A** | IDFM:C01742 | RapidTransit | SNCF | 46 | RER |
| **B** | IDFM:C01743 | RapidTransit | SNCF | 47 | RER |
| **C** | IDFM:C01727 | RapidTransit | SNCF | 75 | RER |
| **D** | IDFM:C01728 | RapidTransit | SNCF | 59 | RER |
| **E** | IDFM:C01729 | RapidTransit | SNCF | 26 | RER |
| **H** | IDFM:C01737 | LocalTrain | SNCF | 50 | Transilien |
| **J** | IDFM:C01739 | LocalTrain | SNCF | 54 | Transilien |
| **K** | IDFM:C01738 | LocalTrain | SNCF | 10 | Transilien |
| **L** | IDFM:C01740 | LocalTrain | SNCF | 36 | Transilien |
| **N** | IDFM:C01736 | LocalTrain | SNCF | 35 | Transilien |
| **P** | IDFM:C01730 | LocalTrain | SNCF | 32 | Transilien |
| **R** | IDFM:C01731 | LocalTrain | SNCF | 24 | Transilien |
| **U** | IDFM:C01741 | LocalTrain | SNCF | 15 | Transilien |
| **V** | IDFM:C02711 | LocalTrain | SNCF | 7 | Transilien |
| TER ×8 | IDFM:C01744…C02375 | regionalRail | SNCF | 5–33 each | TER (multi-région) |

GTFS `route_type`: RER + Transilien + TER → **type 2** ; Métro → type 1 (16 routes).

### Examples (≤5)

```csv
id;route_long_name;stop_id;stop_name;…;mode;…
IDFM:C01741;U;IDFM:…;La Défense;…;LocalTrain;…
IDFM:C01742;A;IDFM:…;Châtelet - Les Halles;…;RapidTransit;…
IDFM:C01727;C;IDFM:…;Versailles Chantiers;…;RapidTransit;…
```

*(Exact stop ids in JSON artifact.)*

---

## 2. GTFS (`IDFM-gtfs.zip`)

### Archive inventory (selected)

| file | ~size | profiled |
|------|-------|----------|
| `agency.txt` | 8 Ko | full (20 rows) |
| `routes.txt` | 105 Ko | full (2 027 rows) |
| `stops.txt` | 5 Mo | full (53 450 rows) |
| `trips.txt` | 57 Mo | count + head |
| `stop_times.txt` | 935 Mo | **stream count + head only** |
| `calendar.txt` / `calendar_dates.txt` | small | not profiled |
| `shapes.txt` | 132 Mo | not profiled |

### `agency.txt`

20 agencies (IDFM bus operators + SNCF context). All reference `https://www.iledefrance-mobilites.fr`. **No licence field in-file** — legal terms come from dataset page (**Licence Mobilité** for theoretical GTFS).

### `routes.txt`

| metric | value |
|--------|-------|
| Rows | 2 027 |
| `route_type=3` (bus) | 1 968 |
| `route_type=1` (metro) | 16 |
| `route_type=2` (rail) | 24 |
| `route_mode` / `route_operator` extensions | **empty** on all rows |

Rail routes (type 2): RER A–E, Transilien H,J,K,L,N,P,R,U,V, TER variants (same ids as CSV).

### `stops.txt`

| metric | value |
|--------|-------|
| Rows | 53 450 |
| `IDFM:<numeric>` | 52 979 (99.1 %) |
| `IDFM:monomodalStopPlace:…` | 471 (platform/quay granularity) |
| `parent_station` populated | 18 582 |
| `location_type=0` (stop) | majority |

GTFS contains **more** stops than CSV (platforms/quays + stops not on any line in arrêts-lignes).

### `trips.txt` (sampled)

| metric | value |
|--------|-------|
| Rows | **496 429** |
| Columns | `route_id`, `service_id`, `trip_id`, `trip_headsign`, `direction_id`, `shape_id`, … |
| `trip_id` pattern | `IDFM:stif:local-<date>-<route>-<seq>` |

Example: route `IDFM:C01741` (Transilien U) → **630 trips** (validated).

### `stop_times.txt` (streamed)

| metric | value |
|--------|-------|
| Rows | **11 065 718** |
| Columns | `trip_id`, `arrival_time`, `departure_time`, `stop_id`, `stop_sequence`, `pickup_type`, `drop_off_type`, `timepoint`, … |
| `stop_id` in times | **`IDFM:<numeric>`** (matches CSV; not monomodalStopPlace) |

Example head: CDG VAL trips with times like `15:44:00` — **scheduled**, not observed.

**Transilien U check:** 630 trips → 7 230 stop_time rows → **15 distinct stop_ids**, identical set to CSV line membership.

---

## 3. Join / id mapping

### Stop id

| set | count |
|-----|-------|
| CSV all stops | 34 860 |
| CSV rail stops | 574 |
| GTFS all stops | 53 450 |
| Exact CSV ∩ GTFS (all) | 34 858 (**99.99 %**) |
| Exact CSV ∩ GTFS (rail) | 572 (**99.65 %**) |
| CSV-only (rail) | 2 ids |
| GTFS-only | ~18.6 k (platforms, quays, unused stops) |

**Recommendation:** Primary join **`arrets-lignes.stop_id` = `stops.stop_id` = `stop_times.stop_id`**. For UI search, prefer **`parent_station`** roll-up when multiple platform rows exist (not needed for Transilien U — 1:1).

### Route / line id

| set | count |
|-----|-------|
| CSV rail `id` | 26 |
| GTFS rail `route_id` (type 1∪2, excl. metro-only intent) | 40 |
| Exact overlap | **24 (92.3 %)** |
| CSV-only | `IDFM:C00563` (CDG VAL), `IDFM:C01388` (ORLYVAL) |
| GTFS-only (type 1) | Métro lines — present in GTFS, absent from rail CSV filter |

**Recommendation:** **`arrets-lignes.id` = `routes.route_id` = `trips.route_id`**. Filter MVP to `route_type=2` + CSV `mode` ∈ {RapidTransit, LocalTrain, regionalRail}.

### UIC / trigramme

Not present in either file. Need **S3 gares-de-voyageurs** (SNCF) for UIC join if required later.

---

## 4. Anomalies

| issue | severity | note |
|-------|----------|------|
| CSV `mode` labels ≠ GTFS `route_type` naming | low | Map RapidTransit→RER, LocalTrain→Transilien, regionalRail→TER |
| GTFS `route_mode` / `route_operator` empty | low | Use CSV `mode` / `operatorname` |
| 2 rail stop ids in CSV not in GTFS | low | Edge stops — investigate at ETL |
| arrêts-lignes **unordered** | medium | Route sequence only in GTFS `stop_sequence` |
| RER/Transilien **branches** (A, B, C, D, L…) | medium | One `route_id` per letter; direction via `trip_headsign` / `direction_id` |
| TER: 8 route_ids, same shortname | medium | Filter by `route_long_name` region |
| `bookingrules` 96 % null | info | Ignore for MVP |
| GTFS times >24h | not checked | Standard GTFS caveat for late trips |

---

## 5. Licence flag — GTFS théorique

| field | value |
|-------|-------|
| Source | IDFM « Offre horaires TC GTFS » (S5) |
| Licence | **Licence Mobilité** (not ODbL) |
| Use | Theoretical schedule, corridor topology, **window feasibility only** |
| Forbidden | Presenting GTFS times as observed punctuality / delays |

Attribution + PRIM terms required before indexation (`source-whitelist.md` checklist).

---

## 6. Pilot corridor candidates (RER / Transilien)

Scoring: **data completeness** (stop join, trip count) × **manageable scope** × **commuter relevance** (intuition — **not** measured from this profile).

### Candidate 1 — Transilien **U** (recommended primary)

| | |
|--|--|
| line_id | `IDFM:C01741` |
| Stops | **15** (smallest Transilien) |
| GTFS trips | 630 |
| Join quality | **Perfect** 15/15 stops CSV ↔ stop_times |
| Example OD pairs | **La Défense ↔ Saint-Quentin en Yvelines**, **Puteaux ↔ Trappes**, **Saint-Cloud ↔ Coignières** |
| Pros | Easiest branch count, fast ETL, clear western-paris axis |
| Cons / uncertainty | Lower absolute ridership vs RER A/L; still multi-branch at La Défense — verify headsigns |

### Candidate 2 — RER **E**

| | |
|--|--|
| line_id | `IDFM:C01729` |
| Stops | **26** |
| Mode | RapidTransit (RER) |
| Example OD pairs | **Haussmann Saint-Lazare ↔ Chelles - Gournay**, **Rosny-sous-Bois ↔ Tournan**, **Bondy ↔ Nanterre-La Défense** (via Rosa Parks) |
| Pros | True RER, high commuter relevance, moderate stop count |
| Cons / uncertainty | East-west span; branch complexity (Chelles vs Tournan); 26 stops still manageable |

### Candidate 3 — Transilien **L**

| | |
|--|--|
| line_id | `IDFM:C01740` |
| Stops | **36** |
| Example OD pairs | **Saint-Lazare ↔ Cergy Saint-Christophe**, **La Défense ↔ Maisons-Laffitte**, **Versailles Rive Droite ↔ Nanterre Université** |
| Pros | Very high ridership intuition; rich suburb ↔ Paris pairs |
| Cons / uncertainty | **Branchy** (Versailles vs Cergy vs Saint-Lazare); 36 stops; needs direction/branch filter in ETL |

**Deferred for MVP slice:** RER A (46 stops, multi-branch), RER C (75 stops), TER (grain mismatch with S1/S2 punctuality data — region/month not OD).

---

## 7. Mapping reco (ETL handoff)

```
arrets-lignes.id          ↔ routes.route_id ↔ trips.route_id
arrets-lignes.stop_id     ↔ stops.stop_id ↔ stop_times.stop_id
arrets-lignes.mode        → network enum: RapidTransit=RER, LocalTrain=Transilien, regionalRail=TER
trips.direction_id + trip_headsign → branch / sens (validate per corridor)
calendar + calendar_dates → weekday vs weekend service (not profiled here)
```

**Do not** compute punctuality from `arrival_time` / `departure_time`. Pair with **S1 Régularité mensuelle Transilien** (line × month) for observed KPI at honest grain.

---

## 8. Output contract (compact)

### Columns (key)

| name | dtype | null% | distinct | notes |
|------|-------|-------|----------|-------|
| CSV `id` / GTFS `route_id` | string | 0 | 26 rail / 40 GTFS rail | Direct join 92 %+ |
| CSV `stop_id` / GTFS `stop_id` | string | 0 | 574 rail / 53k GTFS | Direct join 99 %+ |
| CSV `mode` | string | 0 | 9 | Use for RER vs Transilien vs TER |
| GTFS `route_type` | int | 0 | 5 | Rail = 2 |

### Examples (≤5)

See §1 and GTFS head in `profile-idfm-gtfs.json`.

### Anomalies

See §4.

### Mapping reco

See §3 + §7.

---

## Corridor candidates (decision input)

| rank | corridor | line | stops | rationale |
|------|----------|------|-------|-----------|
| **1** | Transilien U — La Défense / SQY axis | U `C01741` | 15 | Best completeness × simplicity |
| **2** | RER E — Paris Est ↔ banlieue est | E `C01729` | 26 | RER flagship, moderate size |
| **3** | Transilien L — Saint-Lazare / Cergy / Versailles | L `C01740` | 36 | High commute relevance; branch ETL cost |

**Human gate:** Pick one corridor for `intent/000-linetrust-mvp.intent.md` Phase E sign-off.
