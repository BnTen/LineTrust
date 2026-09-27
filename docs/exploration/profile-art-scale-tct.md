# Profile — ART IDFM scale by TCT (Neon budget)

**Date:** 2026-09-27  
**Agent:** schema-profiler / explorer-data  
**Sources:** `data/raw/art/idfm_annuel_2023.zip`, `idfm_annuel_2024.zip`, `referentiel_tct-ui.csv`, prior `profile-art-rer-d.md`  
**Method:** Streaming `csv.DictReader` on zip members (no full unzip, no full RAM load). 2024 full cardinalities; 2023 jalon row counts per `tct` only.  
**Machine output:** `profile-art-scale-tct.json`

---

## Inventory

| Asset | Size | Rows (jalon) |
|-------|------|--------------|
| `idfm_annuel_2023.zip` | 480 Mo (502 Mo on disk) | **31.53 M** |
| `idfm_annuel_2024.zip` | 506 Mo (530 Mo on disk) | **34.57 M** |
| CSV inside zip (uncompressed est.) | ~9.3 / ~10.2 Go | — |

**2024 partition split:**

| Family | Jalon rows | Share |
|--------|------------|-------|
| RER (TBA–TBE) | 19.67 M | 56.9 % |
| Transilien + tram (TB*) | 14.90 M | 43.1 % |
| Other | 0 | 0 % |

**15 distinct `tct` codes** appear in 2024 (referentiel lists T11/T13/T4/navette codes with **zero rows** in both years).

---

## Per-line table (2024)

Short name = `line_family` from `lib_tct` + referentiel. Coverage = IDFM partition scope per `lisezmoi.md`.

| Short | tct | jalons_2024 | circs | stations | OD_pairs | coverage |
|-------|-----|-------------|-------|----------|----------|----------|
| RER-C | TBC | 7.58 M | 200 548 | 86 | 824 | complete |
| RER-D | TBD | 5.31 M | 159 652 | 82 | 466 | complete |
| Transilien-L | TBR | 3.79 M | 174 376 | 38 | 207 | complete |
| Transilien-H | TBN | 3.32 M | 137 814 | 51 | 167 | complete |
| RER-B | TBB | 3.20 M | 167 369 | 35 | 146 | **partial** (nord only) |
| Transilien-J | TBS | 3.06 M | 157 003 | 62 | 227 | complete |
| RER-E | TBE | 2.36 M | 136 721 | 25 | 208 | complete |
| Transilien-N | TBM | 1.85 M | 69 807 | 36 | 102 | complete |
| RER-A | TBA | 1.22 M | 92 469 | 11 | 54 | **partial** (ouest only) |
| Transilien-P | TBT | 1.09 M | 98 934 | 56 | 127 | complete |
| Transilien-R | TBL | 0.74 M | 40 294 | 56 | 50 | complete |
| Transilien-U | TBQ | 0.47 M | 23 405 | 26 | 58 | complete |
| Transilien-T12 | TWP | 0.39 M | 44 147 | 7 | 20 | complete (2023: 19 k rows — ramp-up) |
| Transilien-K | TBV | 0.17 M | 10 170 | 19 | 22 | complete |
| Transilien-V | TBW | 14 k | 1 171 | 7 | 2 | **anomaly** (not in referentiel 2023) |

**Endpoint OD density** (distinct circulation endpoints ÷ S×(S−1)): typically **4–15 %**; RER-A partial (49 %), RER-E (35 %), Transilien-R (1.6 %) are outliers.

**2023 jalon counts** track 2024 within ~5–8 % per line (except TWP +1960 % vs 2023 launch year).

---

## Neon projection (Mo)

**Assumptions:** agg grain `(from_ci, to_ci, day_type, window_30min, month)`; 96 window-slots (48 × 2 day types); 24 months; ~150 bytes/row (data + indexes).  
**Theoretical cells** = S×(S−1) × 96 × 24 (monthly) or × 96 (rollup). Real density ≪ 1; Melun MVP uses **hub↔terminus only** (2 pairs / 272 theoretical = **0.74 %**). Budget with **10 % density** unless noted.

### Per major line family (2024, strategy A — global OD key)

| Line | S | jalon_rows | monthly upper (Mo) | rollup upper (Mo) | @10 % density monthly |
|------|---|------------|--------------------|--------------------|------------------------|
| RER-A | 11 | 1.22 M | 38 | 1.6 | 3.8 |
| RER-B | 35 | 3.20 M | 411 | 17 | 41 |
| RER-C | 86 | 7.58 M | **2 526** | 105 | 253 |
| RER-D | 82 | 5.31 M | **2 295** | 96 | 230 |
| RER-E | 25 | 2.36 M | 207 | 8.6 | 21 |
| Transilien (sum) | — | 14.90 M | ~5 610 | ~234 | ~561 |

Strategy **B** (add `line_id` to key): same row counts per line when materialized separately; **no cross-line collision**; total Mo ≈ sum above.

### Scenarios (all lines aggregated)

| Scenario | monthly upper | @10 % density | + n≥30 (50 %) | + drop overnight 01–04:30 | Both prunes |
|----------|---------------|---------------|---------------|---------------------------|-------------|
| **1 — RER only** (A-ouest, B-nord, C, D, E) | 5 478 Mo | 548 Mo | 274 Mo | 468 Mo | **234 Mo** |
| **2 — RER + Transilien** | 11 089 Mo | 1 109 Mo | 554 Mo | 947 Mo | **474 Mo** |

Rollup (no month) @10 % density: **RER ~23 Mo**, **RER+Transilien ~46 Mo**.

**Neon alert threshold (~400 Mo):** scenario 1 exceeds raw upper bound; **pruned scenario 1 (~234 Mo)** and **density-adjusted RER (~548 Mo unpruned)** need corridor/branch scoping or strategy B + per-line load. Full IDFM all-pairs at 10 % density (~1.1 Go) is **not viable** on free tier.

---

## OD key collision risk

Measured on **circulation endpoint** pairs `(code_ci_origine, code_ci_destination)` across `tct` (2024):

| Metric | Value |
|--------|-------|
| Distinct endpoint OD pairs (all IDFM) | 2 597 |
| Pairs shared by ≥2 `tct` | **81 (3.1 %)** |
| Max `tct` overlap | 3 (TBB + TBN + TBV on 271031→271007) |

**Examples:** RER-A (TBA) ↔ Transilien-L (TBR) share western branch endpoints; RER-B/D share north-corridor codes; RER-B/H/K share Creil axis.

**Reco:** Strategy **B** (`line_id` / `tct` in agg PK) for any multi-line Neon load. Strategy A (global OD) **unsafe** for ~3 % of endpoint keys; worse if expanding to **all station pairs** (shared hubs like Châtelet, Lyon, Nord).

---

## Reco load order + pruning

1. **RER-D Melun corridor** (done MVP) — hub-end pairs, ~192 rollup cells max.
2. **RER-E** — smallest complete RER (S=25, ~21 Mo @10 % monthly).
3. **RER-B nord / RER-A ouest** — partial but bounded (S=35/11).
4. **RER-C** — largest RER footprint; load by **branch** not whole line.
5. **Transilien** — after RER pilot; prefer **L, H, J** (high volume) with branch filters.

**Pruning stack (apply in ETL):**

- Materialize **rollup first** (no month) for UX hot path.
- Drop windows **01:00–04:30** (saves ~15 % cells).
- Emit cells only where **n ≥ 30** (est. 40–60 % of populated cells).
- Scope to **pilot corridor stop sets** (Melun model) until budget proven.

---

## Anomalies

1. **TBW (ligne V)** — 14 k rows 2024, absent from `referentiel_tct-ui.csv` 2023; investigate mapping / data quirk.
2. **TCC, TWN, TWV, TWT** (navette, T11, T13, T4) — in referentiel, **zero jalon rows** 2023–2024.
3. **RER-A** only 11 jalon stations (ouest branches) — confirms A est/sud absent from IDFM partition.
4. **RER-B** only 35 stations — confirms B sud absent; nord-only scope.
5. **TWP (T12)** — 20× row growth 2023→2024 (new line ramp).
6. **March 2023 dip** on RER-D (see `profile-art-rer-d.md`) — affects YoY trends, not scale counts.
7. **Endpoint OD ≪ theoretical pairs** — all-pairs ETL would over-generate empty cells; prefer corridor-filtered pair enumeration.

---

## Mapping reco

| Join | Path |
|------|------|
| Line identity | `tct` → `referentiel_tct-ui.csv` (`activite = Transilien et RER`) |
| Station | `code_ci_jalon` (6-digit UIC suffix) primary; `lib_ci_jalon` for display |
| Neon PK | `(line_id/tct, from_code_ci, to_code_ci, day_type, window_start_minutes[, month_key])` |

---

## Compact contract

```
rows:     31.5M (2023) + 34.6M (2024) jalon
tcts:     15 active (5 RER + 10 Transilien/tram)
rer:      19.7M rows 2024 — A partial, B partial, C/D/E complete
neon:     RER all-pairs upper ~5.5 Go; @10%+prune ~234 Mo (RER only)
collision: 81/2597 endpoint ODs on ≥2 lines → require line_id in key
pilot:    branch-scoped corridors before full-line materialization
```
