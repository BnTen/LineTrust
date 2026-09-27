# Intent — LineTrust MVP (MonTER)

Status: **locked** · Phase 2+3a complete (awaiting human gate 3a) · next = Phase 4 UI polish  
Last updated: 2026-09-27

## One-liner

LineTrust montre, pour un trajet Île-de-France (sens orienté), un score de fiabilité historique fondé sur l’open data — pas du temps réel opérateur.

## Problem

Les usagers TER / Transilien / RER n’ont pas de preuve chiffrée, lisible et partageable de la ponctualité d’un trajet A→B dans une fenêtre horaire, séparée ouvré / week-end.

## Outcome (slice MVP)

Un usager choisit 2 gares du **corridor pilote IDF**, voit score + couleur + incertitude + meilleure alternative ±30 min (même jour type) + disclaimer, et peut générer une share card OG. Pages en `noindex` jusqu’à validation data humaine.

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Networks | TER + Transilien + RER |
| Geo | Pilot Île-de-France only |
| Grain | Station pair + line / train number **if data matrix allows** |
| Direction | A→B ≠ B→A (two scores, two URLs) |
| Nav | Search from/to first; browse line/region = Phase 3b after slice |
| Time window | Always user-chosen (30 min) |
| Day type | Weekday vs weekend only (holidays = V1.1) |
| Alternative | Best within ±30 min, same day type |
| History | 24 months |
| Refresh | ETL 2× / week (differential) |
| Auth | None |
| Language | FR only |
| Indexing | `noindex` until data gate signed |
| Neon | Clean useful data only (refs + agg_* + watermarks + weights) |
| Dirty data | Quarantine + alert — never silent imputation |
| Corridor | **RER D — Branche Melun (Paris-Gare-de-Lyon ↔ Melun)** · IDFM:C01728 · ART `tct=TBD` · ~17 stops — **gate E signed** |
| Honest score grain (Phase E) | **Pair × sens × day_type × fenêtre 30 min** via ART Infocentre (S6) — calculable; S1 line×month = cross-check only |

## Scoring (locked)

- On-time: delay **&lt; 5 min**
- TSR: cancellations (+ masked in V2) / theoretical; cancelled ∉ TPR
- Penalty &gt;15 min: rate clamped then weight 0.15
- Score: `(TPR×0.50)+((100−TSR)×0.35)−(penalty×0.15)` clamp [0,100]
- Weights versioned; persist `score`, `weights_version`, `computed_at`
- Colors: green ≥80 / orange 50–79 / red &lt;50
- Low sample: show score + uncertainty banner (`N_min` after Phase E)

## Non-goals (v1)

Auth, native app, live realtime, freemium, France outside IDF, early indexing, holiday day-type, massive browse before vertical slice, inventing train-level precision absent from sources.

## V1.1 / V2

- V1.1: holidays + calendar source; train number if matrix OK
- V2: masked suppressions; geo expansion

## Definition of Done (slice)

1. User enters 2 IDF stations on the pilot corridor.
2. Sees score + color + uncertainty + ±30 min alternative (weekday/WE) + disclaimer.
3. Share card produces an OG image.
4. `pnpm test` green; second ETL run is noop; page remains `noindex`.

## Gates

| Gate | Owner | Artifact |
|------|-------|----------|
| H | Human | Harness + DESIGN.md + core skills |
| 1 | Human | Neon + Vitest + shadcn + tokens |
| E | Human | `data-capability-matrix.md` + named corridor |
| 2–5 | Human | Per phase checklist in `.cursor/plan.md` |

## Open (resolved in later phases)

- Pilot corridor → **RER D Branche Melun** (gate E signed 2026-09-27)
- Score grain → **pair × window** via ART S6 (signed)
- `N_min` → **frozen** 30 / 100 / 300 in `docs/03` + `lib/uncertainty.ts`
- Estimated times → **include** with `used_est` / `n_used_est` (default); see `docs/04`
- Whitelist → `docs/exploration/source-whitelist.md` (S6 ART primary)
