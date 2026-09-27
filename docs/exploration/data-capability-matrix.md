# Data capability matrix

**Phase:** E (revised 2026-09-27 after ART discovery) · **S0–S2 scale 2026-09-27**  
**Corridor (MVP signed):** **RER D — Branche Melun (Paris-Gare-de-Lyon ↔ Melun)**  
**Scale:** RER **A–E** 2024 in Neon + home line pills · still `noindex`  
**Route Melun:** IDFM:C01728 · ART filter `tct = 'TBD'`  
**Sources inventoried:** `docs/exploration/source-whitelist.md` (S1–S7; **primary facts = S6 ART**)  
**Profiler artifacts:**
- `docs/exploration/art-circulations-discovery.md`
- `docs/exploration/profile-art-rer-d.md` (+ `.json`)
- `docs/exploration/rer-d-station-map.md`
- `docs/exploration/raw-inventory.md` (S1–S5)
- `docs/exploration/profile-referentiel-tct-rer.md` · `profile-art-scale-tct.md` · **`scale-rer-coverage.md`** · `scale-rer-corridors.md`

**Human gate (MVP Melun):** ☑ signed — 2026-09-27 — RER D Melun + ART primary  
**Human gate (scale multi-lignes):** ☑ S0 signed · ✅ ETL A–E · ✅ UI S2 — spot-check multi-OD before public index
## How to use

| Status | Meaning |
|--------|---------|
| `calculable` | Directly supported by cleaned facts at required grain |
| `proxy` | Approximate via coarser grain; UI must disclose |
| `impossible` | Do not show / do not claim |
| `V2` | Possible later with extra source or model |

Never upgrade `proxy`/`impossible` to product copy that implies `calculable`.

## Matrix

| KPI / promise | Required grain | Sources | Status | Notes / disclosure copy |
|---------------|----------------|---------|--------|-------------------------|
| Score directed pair A→B | pair × sens × day_type × window 30m | **S6 ART** | **calculable** | Delay at dest: `COALESCE(obs,est)−the` on type_horaire=A. Flag `used_est` when obs null (~13–18 %). |
| Score B→A independent | same | S6 | **calculable** | Separate OD filter (e.g. Melun→Lyon vs Lyon→Melun). |
| Weekday vs weekend split | day_type | S6 `date_circ` | **calculable** | ~78 % WD / ~22 % WE on RER D. |
| Alternative ±30 min | neighboring windows | S6 | **calculable** | Bucket origin `dh_the` into 30-min slots; compare cell scores. |
| Uncertainty from `n` | cell sample size | S6 | **calculable** | `n` = circulations in cell (pair × sens × day_type × window × months). Propose freeze: `N_min` 30 / 100 / 300 → labels faible/moyen/fort in `docs/03` after gate. |
| Line identity on page | line id | S6 `tct=TBD` + S4 | **calculable** | |
| Train number | train_id × run | S6 `num_marche` | **calculable** | Show if cell has enough `n`; else hide. Phase 3b optional. |
| Browse by line | line aggregates | S6 (+ S1 cross-check) | **calculable** | Phase 3b. S1 = monthly passenger KPI (different methodology). |
| Browse by region | region mapping | — | **V2** / hors slice | |
| Trend chart 24 months | monthly cells | S6 (2023–2024 on disk; +2022/2025 optional) | **calculable** (UI shows **12 mois** retained in Neon — intent 2026-09-27) | Download more IDFM years as needed; storage retention = 12m. |
| Share card metrics pack | subset | S6 | **calculable** | Pair score + window + day_type + uncertainty + disclaimer. |
| Holidays day-type | calendar | — | **V2** / V1.1 | |
| Masked suppressions | dedicated field | — | **V2** | Cancellations: derive from missing circulations vs GTFS — **proxy** until validated. |
| S1 line-month alone as pair score | — | S1 | **proxy** (fallback only) | Do not use as primary now that ART exists. |

## Join / id mapping

| Id space | Coverage | Join path | Risk |
|----------|----------|-----------|------|
| ART `code_ci_*` (6 digits) | RER D jalons | = `RIGHT(gares.codes_uic, 6)` | Multi-UIC; label drift (`Paris-Gare-de-Lyon (Banlieue)`) |
| IDFM `stop_id` | 59 stops RER D | arrets-lignes → name → gares → code_ci | Châtelet: ART `758607` (absent gares) |
| GTFS `stop_id` | same IDFM namespace | Direct | Licence Mobilité (schedule only) |
| `tct` / `num_marche` | RER D | `TBD` / commercial number | |

Detail: `docs/exploration/rer-d-station-map.md`.

## Grain honesty decision (required)

Chosen MVP display grain: **☑ window/pair** · ☐ line · ☐ train-only  

Rationale:

ART Infocentre (S6) provides observed (or estimated) timestamps per station per circulation for RER D. Slice DoD can keep **pair × sens × day_type × fenêtre 30 min** as originally intended.

**Pilot corridor:** RER D branche Melun — **Paris-Gare-de-Lyon (Banlieue) ↔ Melun** (~17 stops, ~7.4k circ/yr on OD endpoints). Full RER D Y-network deferred to Phase 3b.

**ETL honesty rules:**
1. Prefer `dh_obs_jalon`; if null use `dh_est_jalon` only with `used_est` flag / optional exclusion from TPR.
2. Quarantine empty origins, delays &gt;120 min, schema drift.
3. Never invent missing circulations; cancellations = explicit derivation or omit TSR until proven.
4. Neon = refs + `agg_*` for corridor only — not raw 10 Go/an.

## Neon budget estimate

| Table class | Est. rows | Est. Mo |
|-------------|-----------|---------|
| refs (RER D ~59 stops + Melun-branch subset + lines) | &lt; 1k | ≪ 1 |
| agg_* (pair × sens × day_type × window × month, corridor) | ~10⁵–10⁶ order | **&lt; 100** (tune after first ETL) |
| watermarks / weights | &lt; 100 | ≪ 1 |
| Raw ART CSV | **0 in Neon** | stay in `data/raw/art/` |
| **Total** | | **target ≪ 400 Mo** |

☑ Under ~400 Mo headroom if raw stays out and agg scoped to pilot (+ controlled expansion).

**Measured (Melun MVP, 2026-09-27):** DB **62 Mo** · `agg_pair_window` 226 k / 44 Mo · rollup 19 k / 11 Mo.

**Scale (S0):** all-pairs RER @10 % ≈ 548 Mo ; +pruning ≈ 234 Mo ; RER+Transilien prune ≈ 474 Mo.  
→ Prefer **corridor/branch scope** + **`line_id` in agg PK**. Detail: `docs/exploration/scale-rer-coverage.md`.

---

## Line / branch coverage (S0 — ART IDFM)

Status = whether pair × sens × day_type × fenêtre 30 min is **calculable** from S6 for that geography.  
Never upgrade `partial` / `absent` to full-network product copy.

| Line | tct | IDFM | ART coverage | Pair×window score | Notes |
|------|-----|------|--------------|-------------------|-------|
| RER D — Melun branch | TBD | C01728 | full (branch in full D) | **calculable** (Neon 2024) | MVP golden — Lyon→Melun weekday OK |
| RER D — other branches | TBD | C01728 | full | **calculable** (Neon 2024) | Corbeil / Orry / Malesherbes / cross |
| RER E | TBE | C01729 | full | **calculable** (Neon 2024) | 5 corridors · rollup 6.9k |
| RER C | TBC | C01727 | full | **calculable** (Neon 2024) | 8 branches · rollup 33.6k · dominant |
| RER B nord | TBB | C01743 | **partial** | **calculable** (Neon 2024) | 6 corridors nord · Sud = **impossible** |
| RER B sud | — | C01743 | **absent** | **impossible** | Do not list in UI |
| RER A ouest | TBA | C01742 | **partial** | **calculable** (Neon 2024) | 2 corridors · terminus virtuel Nanterre |
| RER A est / sud | — | C01742 | **absent** | **impossible** | Do not list in UI |
| Transilien H,J,K,L,N,P,R,U,V | TBN…TBW | C0173x… | full (V thin) | **calculable** (ETL deferred) | After RER — DB now **160 Mo** |
| Tram-train T4/T11–T13 | TW* | — | sparse / 0 rows | **V2** / hors scale | Exclude MVP |

Map tct ↔ IDFM: `docs/exploration/profile-referentiel-tct-rer.md`.

## Source whitelist + licences (summary)

| ID | Dataset | Role | Licence |
|----|---------|------|---------|
| **S6** | ART circulations IDFM | **Primary delay facts** | Licence Ouverte Etalab |
| S4 / S3 / S5 | IDFM arrêts, gares, GTFS | Refs + theoretical windows | ODbL / Licence Mobilité |
| S1 | SNCF ponctualité mensuelle | Cross-check / browse macro | ODbL |
| S7 | AlertesRER | Historical PoC only | LOV2 — not ETL |

## Go / No-go

- [x] Matrix complete for slice DoD rows (ART-backed)
- [x] Corridor named in `intent/` — **RER D — Branche Melun**
- [x] UI promises match statuses — human OK 2026-09-27
- [x] Licence attribution listed
- [x] Human signature — 2026-09-27

## Recommended human decisions (gate E)

1. Confirm corridor **RER D — Branche Melun (Paris-Gare-de-Lyon ↔ Melun)**.
2. Confirm primary source **ART S6** (Licence Ouverte) + attribution footer.
3. Confirm policy on estimated times: include with flag **or** exclude from score.
4. Confirm `N_min` proposal (30 / 100 / 300 circulations per cell) → `docs/03`.
5. **OK Phase 2** → ETL hash→partition + agg for this corridor.
