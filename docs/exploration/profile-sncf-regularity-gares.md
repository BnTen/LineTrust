# SNCF regularity & gares — schema profile

**Phase:** E (capability matrix input)  
**Profiled:** 2026-09-27  
**Agent:** schema-profiler  
**Sources (repo):**

| File | Rows | Size | Delimiter | Encoding |
|------|------|------|-----------|----------|
| `data/raw/sncf/ponctualite-mensuelle-transilien.csv` | 2 074 | 93 Ko | `;` | UTF-8 BOM |
| `data/raw/sncf/regularite-mensuelle-ter.csv` | 2 380 | 457 Ko | `;` | UTF-8 BOM |
| `data/raw/sncf/gares-de-voyageurs.csv` | 2 782 | 264 Ko | `;` | UTF-8 BOM |

---

## 1. Ponctualité mensuelle Transilien

### Columns

| name | dtype | null% | distinct | notes |
|------|-------|-------|----------|-------|
| date | date_month (`YYYY-MM`) | 0.0 | 160 | key; min=2013-01, max=2026-08 |
| service | string | 0.0 | 2 | key; `RER`, `Transilien` |
| ligne | string | 0.0 | 13 | key; letter code |
| nom_de_la_ligne | string | 0.0 | 13 | key; 1:1 with `ligne` |
| taux_de_ponctualite | float64 | 0.05 | 1 435 | % punctuality (0–100) |
| nombre_de_voyageurs_a_l_heure_pour_un_voyageur_en_retard | float64 | 0.0 | 1 162 | inverse KPI (lower = better) |

### Distinct `ligne` / `service` / `nom_de_la_ligne`

| ligne | service | nom_de_la_ligne |
|-------|---------|-----------------|
| A | RER | RER A |
| B | RER | RER B |
| C | RER | RER C |
| D | RER | RER D |
| E | RER | RER E |
| H | Transilien | Paris Nord Ouest |
| J | Transilien | Paris Saint-Lazare Nord |
| K | Transilien | Paris Nord Crépy |
| L | Transilien | Paris Saint-Lazare Sud |
| N | Transilien | Paris Montparnasse |
| P | Transilien | Paris Est |
| R | Transilien | Paris Sud Est |
| U | Transilien | La Verrière - La Défense |

`ligne` ↔ `nom_de_la_ligne` is strictly 1:1. `service` is derivable from `ligne` (A–E → RER, else Transilien).

### Grain

**Confirmed: line × month** (not OD, not time-window, not train).

- Unique `(date, ligne)` keys: **2 074** = total rows → **0 duplicates**.
- Unique `(date, service, ligne)`: also 2 074 (service adds no grain).
- Expected 13 lines × 160 months = 2 080; **6 rows missing** (see anomalies).
- No origin/destination, station, window, or train columns present.

### Examples (≤5)

| date | service | ligne | nom_de_la_ligne | taux_de_ponctualite | pax/heure/retard |
|------|---------|-------|-----------------|---------------------|------------------|
| 2026-08 | RER | A | RER A | 93.652 | 14.752 |
| 2026-08 | RER | C | RER C | 88.738 | 7.88 |
| 2026-08 | Transilien | K | Paris Nord Crépy | 95.812 | 22.88 |
| 2026-08 | Transilien | N | Paris Montparnasse | 95.515 | 21.297 |
| 2014-06 | RER | B | RER B | *(empty)* | 0.0 |

### Anomalies

- **1 row** with empty `taux_de_ponctualite` (2014-06, RER B); companion KPI = 0.0.
- **COVID gap:** no data for 2020-04, 2020-05 (jump 2020-03 → 2020-06).
- **Line U absent** for 2022-01 … 2022-06 (6 months × 1 line = 6 missing rows).
- `taux_de_ponctualite` range 44.925–99.411; none outside [0, 100].
- Metric is **line-level punctuality**, not pair-level reliability — cannot support A→B corridor score directly.

---

## 2. Régularité mensuelle TER

### Columns

| name | dtype | null% | distinct | notes |
|------|-------|-------|----------|-------|
| date | date_month | 0.0 | 164 | key; min=2013-01, max=2026-08 |
| region | string | 0.0 | 31 | key; see region timeline below |
| nombre_de_trains_programmes | int64 | 1.55 | 2 208 | scheduled trains |
| nombre_de_trains_ayant_circule | int64 | 1.55 | 2 217 | ran |
| nombre_de_trains_annules | int64 | 1.55 | 784 | cancelled |
| nombre_de_trains_en_retard_a_l_arrivee | int64 | 1.55 | 1 469 | late at arrival |
| taux_de_regularite | float64 | 1.55 | 2 229 | % regularity |
| nombre_de_trains_a_l_heure_pour_un_train_en_retard_a_l_arrivee | float64 | 1.55 | 2 321 | inverse KPI |
| commentaires | string | 61.1 | 858 | free-text narrative |

### Distinct `region` (31) — timeline notes

Historical names (pre-2017/2018 reform) coexist **sequentially** with post-reform names; **no same-month overlap** of old+new pairs detected.

| Era | Regions reported per month | Examples |
|-----|---------------------------|----------|
| 2013–2016 | ~20 | Alsace, Aquitaine, Auvergne, Bretagne, … |
| 2018–2020 | ~11 | Auvergne-Rhône-Alpes, Grand Est, Normandie, … |
| 2020-09+ | ~11 | + Centre Val-de-Loire, Nouvelle Aquitaine, Occitanie |
| 2025-01+ | ~14 | + Etoile Amiens, Loire Océan, Sud Azur (sub-brands?) |

Full list: Alsace, Aquitaine, Auvergne, Auvergne-Rhône-Alpes, Basse Normandie, Bourgogne, Bourgogne-Franche-Comté, Bretagne, Centre, Centre Val-de-Loire, Champagne Ardenne, Etoile Amiens, Franche Comté, Grand Est, Haute Normandie, Hauts-de-France, Languedoc Roussillon, Limousin, Loire Océan, Lorraine, Midi Pyrénées, Nord Pas de Calais, Normandie, Nouvelle Aquitaine, Occitanie, Pays-de-la-Loire, Picardie, Poitou Charentes, Provence Alpes Côte d'Azur, Rhône Alpes, Sud Azur.

### Île-de-France / Paris

**No Île-de-France, Paris, or IDF region appears.** TER dataset covers regional networks outside Transilien scope. Closest match: `Etoile Amiens` (2025+, Picardy/Hauts-de-France area, not IDF).

### Grain

**Confirmed: région × month** (not line, OD, window, or train).

- Unique `(date, region)` keys: **2 380** = total rows → **0 duplicates**.
- Regions per month varies 11–20 depending on reform era.

### Examples (≤5)

| date | region | programmés | circulé | annulés | retards | taux_régularité |
|------|--------|------------|---------|---------|---------|-----------------|
| 2026-08 | Auvergne-Rhône-Alpes | 38 215 | 37 568 | 1 003 | 3 879 | 89.67 |
| 2026-08 | Bretagne | 8 337 | 8 231 | 106 | 485 | 94.11 |
| 2026-08 | Grand Est | 39 764 | 38 246 | 1 392 | 5 041 | 87.19 |
| 2026-08 | Provence Alpes Côte d'Azur | 5 550 | 5 409 | 141 | 1 741 | 68.62 |
| 2019-05 | Aquitaine | … | … | … | … | *(+ commentaire)* |

### Anomalies

- **37 rows** (1.55%) with all numeric KPIs null (same rows); likely pre-launch or suppressed months per region.
- **343 rows** where `programmés ≠ circulé + annulés` (e.g. 2026-08 Auvergne-Rhône-Alpes: 38 215 ≠ 37 568 + 1 003 = 38 571). Definitions likely differ (partial runs, re-routes) — do not assume arithmetic closure.
- **926 rows** (39%) carry non-empty `commentaires` (qualitative, not structured).
- `taux_de_regularite` range 68.62–98.03 among non-null; none outside [0, 100].
- Region label churn requires a **normalisation map** before cross-era trend charts.

---

## 3. Gares de voyageurs

### Columns

| name | dtype | null% | distinct | notes |
|------|-------|-------|----------|-------|
| nom | string | 0.0 | 2 782 | station name |
| libellecourt | string | 0.0 | 2 782 | trigramme (3-letter code) |
| segment_drg | string | 0.0 | 10 | DRG segment class A/B/C; see anomalies |
| position_geographique | geo_coord | 0.0 | 2 782 | `lat, lon` decimal |
| codeinsee | string/int | 0.0 | 2 470 | commune code (5 digits); dept = first 2 |
| codes_uic | string | 0.0 | 2 782 | UIC code(s); see anomalies |
| id | uuid | 0.0 | 2 782 | SNCF internal UUID (**not** `id_gare`) |

**Note:** No column named `id_gare` or `trigramme` — use `id` (UUID) and `libellecourt` (trigramme) respectively.

### Key ID columns

| Column | Distinct | Duplicates | Format |
|--------|----------|------------|--------|
| codes_uic | 2 782 | 0 | 8-digit string (87xxxxxx); 12 rows multi-value |
| libellecourt | 2 782 | 0 | 3-char trigramme |
| id | 2 782 | 0 | UUID v4 |

UIC length distribution: 8 chars (2 770), 17 chars (10), 26 chars (2) — longer values are **semicolon-separated multi-UIC** (12 stations).

### Île-de-France stations (INSEE dept filter)

Departments 75, 77, 78, 91, 92, 93, 94, 95 → **402 stations** (~14.5% of file).

| Dept | Count | Dept | Count |
|------|-------|------|-------|
| 75 (Paris) | 28 | 91 (Essonne) | 63 |
| 77 (Seine-et-Marne) | 69 | 92 (Hauts-de-Seine) | 32 |
| 78 (Yvelines) | 79 | 93 (Seine-Saint-Denis) | 44 |
| 94 (Val-de-Marne) | 19 | 95 (Val-d'Oise) | 68 |

No dedicated `département` column — derive from `codeinsee[:2]`.

### segment_drg distribution

| Value | Count | Notes |
|-------|-------|-------|
| C | 1 568 | small/local |
| B | 1 076 | medium |
| A | 128 | major hub |
| compound (`A;A`, `A;B`, …) | 10 | multi-segment hubs |

### Examples (≤5)

| nom | libellecourt | segment_drg | codeinsee | codes_uic |
|-----|--------------|-------------|-----------|-----------|
| Abancourt | ABT | C | 60001 | 87313759 |
| Ablon-sur-Seine | ABL | B | 94001 | 87545269 |
| Achères Grand Cormier | GCR | B | 78551 | 87386052 |
| Paris Gare du Nord | *(PGN)* | A;B;A | 75108 | *(single UIC)* |
| Aéroport Charles de Gaulle 2 TGV | RYT | A;A | 93073 | 87271494;87001479 |

### Anomalies

- **12 stations** with multi-UIC in `codes_uic` (semicolon-separated); ETL must split or pick primary.
- **10 stations** with compound `segment_drg` (e.g. Paris Gare du Nord = `A;B;A`); overlaps multi-UIC set.
- **No nulls** in any column; all rows geocoded.
- `codeinsee` has 2 470 distinct vs 2 782 stations → ~312 communes host multiple stops (expected).
- File is **national** SNCF catalogue, not IDF-only — filter required for corridor work.

---

## Mapping recommendations (capability matrix)

| UI promise | Transilien | TER | Gares |
|------------|------------|-----|-------|
| Score directed pair A→B | **impossible** — line×month only | **impossible** — region×month | join ref only |
| Browse by line | **calculable** (13 Transilien/RER lines) | **impossible** | — |
| Browse by region | — (IDF implicit) | **calculable** (with region normalisation) | filter by dept |
| Trend chart 24 months | **calculable** (160 months avail; gaps need handling) | **calculable** (164 months; label churn) | N/A |
| Line identity on page | map `ligne` → `nom_de_la_ligne` | N/A | — |
| Station id join (UIC) | N/A | N/A | **calculable** — primary join key to GTFS/STIF |
| Uncertainty from n | **proxy** — no raw train/passenger counts, only aggregate rates | **proxy** — train counts available but not per-OD | — |

### Join paths

1. **Gares.codes_uic → GTFS stop_id / STIF** — normalize 8-digit UIC; split multi-UIC rows; pad/compare as string.
2. **Transilien.ligne → corridor line list** — static mapping table (13 lines); no station dimension.
3. **TER.region → display region** — build `region_canonical` map covering 31 historical labels → ~13 current regions for trends.
4. **Gares.codeinsee[:2] → IDF filter** — for pilot corridor station pick list.

### ETL cautions

- Strip UTF-8 BOM on ingest (`utf-8-sig`).
- Do not assume `programmés = circulé + annulés` on TER.
- Treat Transilien `taux_de_ponctualite` nulls and line U gaps as missing data, not zero.
- Region reform boundaries (2017, 2018, 2020, 2025) need explicit effective dates in ref table.
