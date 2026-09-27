# Profile — ART IDFM circulations, RER D

**Date:** 2026-09-27  
**Agent:** schema-profiler  
**Sources:** `data/raw/art/idfm_annuel_2023.zip`, `idfm_annuel_2024.zip`, `lisezmoi.md`, `referentiel_tct-ui.csv`  
**Method:** Full-file streaming pass (Python `csv.DictReader` on zip members); corridor drill-down on 2024 only.  
**Machine output:** `docs/exploration/profile-art-rer-d.json`, `profile-art-rer-d-corridor.json`

---

## Filter — RER D identity

| Field | Value |
|-------|--------|
| **Primary filter** | `tct = 'TBD'` |
| **lib_tct (2023–2024)** | `Train transport Ile-de-France Mobilités à charge, ligne D du RER` |
| **ui** | `1287` (SNCF-TRANSILIEN) |
| **Referentiel** | `referentiel_tct-ui.csv` rows with `TBD` + `activite = Transilien et RER` |

No other `tct` codes appear on RER D rows in 2023–2024. Filtering on `lib_tct ILIKE '%ligne D du RER%'` is equivalent.

---

## Volume & coverage

| Metric | 2023 | 2024 | Combined |
|--------|------|------|----------|
| Total IDFM jalon rows | 31.5 M | 34.6 M | 66.1 M |
| **RER D jalon rows** | **4.90 M** | **5.31 M** | **10.2 M** |
| RER D share of file | 15.5 % | 15.4 % | 15.4 % |
| Distinct circulations (`id_circ`) | 147 703 | 159 652 | ~307 k |
| Distinct endpoint origins | 55 | 55 | — |
| Distinct endpoint destinations | 57 | 59 | — |
| Distinct jalon stations | 64 | 82 | — |
| Date range | 2023-01-01 → 2023-12-31 | 2024-01-01 → 2024-12-31 | 24 months |

**Weekday / weekend (circulation level, deduped by `id_circ`):**

| | 2023 | 2024 |
|--|------|------|
| Weekday (Mon–Fri) | 115 120 | 124 925 |
| Weekend (Sat–Sun) | 32 583 | 34 727 |
| Weekend share | 22.1 % | 21.8 % |

Both day types are well populated → **day_type split feasible**.

---

## Columns (RER D subset)

| name | dtype | null% (jalon rows) | distinct | notes |
|------|-------|-------------------|----------|-------|
| `date_circ` | date | ~0 | 365/yr | Service date; weekday/WE derivable |
| `id_circ` | char(8) | ~0 | ~148–160 k/yr | Circulation key |
| `num_marche` | text | low | high | Commercial train number |
| `code_ci_origine` / `lib_ci_origine` | char(6) / text | ~0 | 55 | Trip origin PR (6-digit UIC suffix) |
| `code_ci_destination` / `lib_ci_destination` | char(6) / text | ~0 | 57–59 | Trip destination PR |
| `tct` / `lib_tct` | char(3) / text | 0 | 1 / 1 | Always `TBD` on RER D |
| `lib_ci_jalon` | text | ~0 | 64–82 | Stop passed on trip |
| `type_horaire` | char(1) | ~0 | A/D/P | A = arrival, D = departure |
| `dh_the_jalon` | timestamp | low | — | Theoretical time (Paris TZ) |
| `dh_obs_jalon` | timestamp | **17.8 % (2023)** / **12.9 % (2024)** | — | Observed passage |
| `dh_est_jalon` | timestamp | fills obs gaps | — | Estimated when obs missing |
| `distance_cumul` | int | low | — | Meters from origin; orders corridor stops |
| `code_ligne` | char(6) | low | — | RFN line code at jalon |

**Observation vs estimate:**

| | 2023 | 2024 |
|--|------|------|
| `dh_obs_jalon` null | 17.81 % | 12.91 % |
| Using `dh_est_jalon` only (obs null, est present) | 17.81 % | 12.91 % |
| Both obs + est present | rare | rare |

→ ~13–18 % of jalon rows rely on **estimated** times. ETL must flag `used_est = true` and optionally quarantine for strict punctuality KPIs.

---

## Delay derivability

**Rule (confirmed on sample):** at destination jalon with `type_horaire = 'A'`:

```text
delay_min = (COALESCE(dh_obs_jalon, dh_est_jalon) - dh_the_jalon) in minutes
```

| Check (2024, all RER D) | Count |
|-------------------------|-------|
| Rows: `type_horaire=A` AND `lib_ci_jalon = lib_ci_destination` | 157 686 |
| Rows with computable delay (the + actual) | 157 686 (100 %) |
| Origin depart rows (`type_horaire=D`, jalon=origin) | 151 461 |

**Anomalies on delay samples:**

- **~32 % negative delays** (early arrival vs theoretical) — normal SNCF tolerance artefact; clamp or bucket in scoring.
- **43–54 rows** with delay > 120 min — investigate outliers / partial runs.
- Empty `lib_ci_origine` on some circulations (2024 top-OD: `" → Malesherbes"`, `" → Corbeil-Essonnes"`) — exclude or join via jalon graph.

---

## Top OD pairs (circulation count, deduped `id_circ`)

Endpoints = trip origin/destination, not user-selected intermediate pair.

**2024 (top 10):**

| Rank | Origin | Destination | Circulations |
|------|--------|-------------|--------------|
| 1 | Goussainville | Melun | 16 298 |
| 2 | Melun | Goussainville | 15 825 |
| 3 | Orry-la-Ville-Coye | Corbeil-Essonnes | 11 027 |
| 4 | Corbeil-Essonnes | Orry-la-Ville-Coye | 10 738 |
| 5 | Corbeil-Essonnes | Villiers-le-Bel-Gonesse | 9 907 |
| 6 | Villiers-le-Bel-Gonesse | Corbeil-Essonnes | 9 084 |
| 7 | Malesherbes | Juvisy | 8 328 |
| 8 | Melun | Corbeil-Essonnes | 5 972 |
| 9 | Corbeil-Essonnes | Juvisy | 5 849 |
| 10 | Corbeil-Essonnes | Melun | 5 319 |

**Hub-style pairs (clear pilot candidates):**

| Pair | 2023 circ | 2024 circ | Notes |
|------|-----------|-----------|-------|
| Paris-Gare-de-Lyon (Banlieue) ↔ Melun | 7 722 (4199+3523) | 7 420 (4162+3258) | Best hub endpoint density |
| Paris-Gare-de-Lyon (Banlieue) ↔ Corbeil-Essonnes | 7 546 (3855+3691) | 6 942 (3732+3210) | Strong alternative |
| Paris-Gare-de-Lyon (Banlieue) ↔ Goussainville | — | ~5.5 k (est.) | North branch |

Cross-branch pairs (Goussainville ↔ Melun) dominate globally but span the full RER D Y-network — less suitable for a **single-branch** pilot UX.

---

## Recommended pilot corridor

### **RER D — Branche Melun : Paris-Gare-de-Lyon (Banlieue) ↔ Melun**

| Criterion | Assessment |
|-----------|------------|
| Branch clarity | Single southeastern branch from Lyon hub |
| Station count | **17** stations with jalon presence in corridor circulations |
| Sample density | **7 420** circulations in 2024 (~15.1 k over 2023–2024) |
| A→B / B→A | Lyon→Melun **4 162** · Melun→Lyon **3 258** (2024) — asymmetric but both strong |
| Weekday / WE | Weekday **5 479** · Weekend **1 941** (2024, deduped `id_circ`) |
| ±30 min window | **Feasible** — origin `type_horaire=D` + `dh_the_jalon` (`YYYY-MM-DD HH:MM:SS`); corridor 2024: **7 132** origin-depart rows, **43** half-hour slots |
| UIC join | `code_ci_*` = 6-digit UIC suffix → SNCF Gares de voyageurs |

**Stations on corridor (ordered by `distance_cumul`, 2024 data):**

1. Paris-Gare-de-Lyon (Banlieue) — `686030`
2. Maisons-Alfort-Alfortville — `681155`
3. Le Vert-de-Maisons — `681247` *(partial traffic)*
4. Créteil-Pompadour — `608802`
5. Villeneuve-St-Georges — `681825`
6. Villeneuve-St-Georges-Triage — `681809` *(partial)*
7. Montgeron-Crosne — `682104`
8. Yerres — `682112`
9. Brunoy — `682120`
10. Boussy-St-Antoine — `682138`
11. Combs-la-Ville-Quincy — `682146`
12. Lieusaint-Moissy — `682153`
13. Savigny-le-Temple-Nandy — `682187`
14. Cesson — `682161`
15. Le Mée — `682179`
16. Melun — `682005`

*(Paris-Gare-de-Lyon `686006` appears on 17 rows — main-line surface variant; map to banlieue hub in UX.)*

**Why not Corbeil or Orry?**

- **Corbeil** (Lyon ↔ Corbeil-Essonnes): similar hub density (~6.9 k circ/yr) but southern branch shares juvisy split complexity.
- **Orry / Creil** (north): Creil jalon hits thin (**8 k** rows/yr vs **99 k** Goussainville); Creil endpoint less ideal for first slice.
- **Goussainville ↔ Melun** top OD is cross-network through Paris — not a single branch.

---

## Month coverage & gaps

**2023 monthly jalon rows (RER D):**

| Month | Rows | Flag |
|-------|------|------|
| 2023-03 | 266 848 | **⚠ −37 % vs adjacent months** — likely ingest/collection gap |
| Other months | 380–459 k | OK |

**2024:** all months 407–479 k — even coverage, no gap flagged.

---

## Examples (≤5)

| date_circ | id_circ | num_marche | origine | destination | tct |
|-----------|---------|------------|---------|-------------|-----|
| 2024-01-14 | 82782858 | 150266 | Melun | Paris-Gare-de-Lyon (Banlieue) | TBD |
| 2024-01-01 | 82516372 | 127003 | Paris-Gare-de-Lyon (Banlieue) | Goussainville | TBD |
| 2023-01-02 | 76056143 | 158436 | Malesherbes | Juvisy | TBD |
| 2023-01-01 | 76025234 | 127003 | Paris-Gare-de-Lyon (Banlieue) | Villiers-le-Bel-Gonesse | TBD |
| 2024-01-01 | 82516372 | 127003 | Paris-Gare-de-Lyon (Banlieue) | Goussainville | TBD |

---

## Anomalies

1. **March 2023 volume dip** — under-count vs rest of year; exclude or impute with care in trend charts.
2. **~13–18 % estimated jalons** — not observed punctuality; disclose when `dh_est_jalon` used.
3. **~32 % negative delays** at destination arrival — early arrivals; define business rule (clamp at 0? keep for distribution?).
4. **Empty origin** on some circulations (2024) — breaks OD labelling; filter `lib_ci_origine != ''`.
5. **Station label drift** — ART uses hyphenated forms (`Paris-Gare-de-Lyon (Banlieue)`, `Villeneuve-St-Georges`, `Orry-la-Ville-Coye`) vs GTFS/display names — normalize via UIC `code_ci`.
6. **RER D Y-network** — many circulations run origin→destination across branches; corridor ETL must filter trips whose jalons ⊆ branch stop set.

---

## Mapping reco

| Join | Path | Risk |
|------|------|------|
| ART → UIC | `code_ci_jalon` = last 6 digits UIC | Direct per lisezmoi |
| ART → IDFM GTFS | UIC → name fuzzy → `stop_id` | Name variants; prefer UIC when SNCf gares join lands |
| Corridor → line identity | `tct=TBD` + filter branch stops | User-facing “RER D branche Melun” |
| `num_marche` → train display | Direct | Same number may repeat across dates |

---

## Neon budget note

**Do not load raw 10 Go/year into Neon.**

Suggested aggregate grain for pilot corridor:

| Table | Grain | Est. rows (2 yr) | Notes |
|-------|-------|------------------|-------|
| `agg_corridor_window_daytype` | pair × direction × date × 30m_window × day_type | ~500 k–2 M | Filter Melun branch only |
| `agg_corridor_pair_month` | pair × direction × month × day_type | ~1 k | Dashboard / trend |
| `ref_corridor_stops` | 17 stops | 17 | Static |

Materialize during ETL stream from zip; store hashes in manifest.

---

## Matrix status (RER D + ART S6)

| KPI | Status | Notes |
|-----|--------|-------|
| Score pair A→B | **calculable** | Destination arrival delay, oriented circulations |
| Score B→A | **calculable** | Independent circulation sets (see asymmetry 4162 vs 3258 in 2024) |
| day_type (weekday/WE) | **calculable** | From `date_circ` |
| Alternative ±30 min | **calculable** | Compare cells sharing origin, neighboring `dh_the_jalon` half-hour buckets |
| Uncertainty `n` | **calculable** | Trip/circulation count per cell (not month proxy) |
| Train number | **calculable** | `num_marche` on circulation |
| Browse line (RER D) | **calculable** | Filter `tct=TBD`; branch tag via stop subset |

**Disclosure still required:** ~13–18 % estimated jalons; March 2023 gap; score = historical observed/estimated run performance, not real-time.

---

## Output contract (compact)

```
filter:      tct='TBD' (lib_tct ligne D du RER)
rows:        4.9M (2023) + 5.3M (2024) jalon rows
circulations: ~148k/yr
obs null:    13–18%
delay:       OK at dest type_horaire=A
pilot:       RER D branche Melun — Paris-Gare-de-Lyon (Banlieue) ↔ Melun (17 stops, ~7.4k circ/yr)
matrix:      pair score, B→A, day_type, ±30m, n, train#, browse → calculable
neon:        aggregates only
```

**Recommended corridor name:** `RER D — Branche Melun (Paris-Gare-de-Lyon ↔ Melun)`
