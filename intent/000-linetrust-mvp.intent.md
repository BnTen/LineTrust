# Intent — LineTrust MVP (MonTER)

Status: **locked** · Phases H→5 + **Scale RER S0–S2** (data + UI multi-lignes)  
Last updated: 2026-09-27 (scale RER A–E 2024 in Neon · UI pills · history 12 months)

## One-liner

LineTrust montre, pour un trajet Île-de-France (sens orienté), un score de fiabilité historique fondé sur l’open data — pas du temps réel opérateur.

## Problem

Les usagers TER / Transilien / RER n’ont pas de preuve chiffrée, lisible et partageable de la ponctualité d’un trajet A→B dans une fenêtre horaire, séparée ouvré / week-end.

## Outcome (slice + scale RER)

Un usager choisit une **ligne RER** (A–E), optionnellement une **branche**, puis 2 gares → score + couleur + incertitude + meilleure alternative ±30 min (weekday|weekend) + disclaimer + share OG. Golden path Melun conservé. Pages en `noindex` jusqu’à validation data humaine (`DATA_PUBLIC=false`).

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Networks | TER + Transilien + RER |
| Geo | Pilot Île-de-France only |
| Grain | Station pair + **line_id** (score par ligne) · train number **if** matrix allows |
| Direction | A→B ≠ B→A (two scores, two URLs) |
| Nav | Search from/to first · home **line pills** + optional branch · browse line/region = Phase 3b |
| Time window | Always user-chosen (30 min) |
| Day type | Weekday vs weekend only (holidays = V1.1) |
| Alternative | Best within ±30 min, same day type |
| History | **12 months** (budget Neon free — was 24; expand later if plan/storage allows) |
| Refresh | ETL 2× / week (differential) |
| Auth | None |
| Language | FR only |
| Indexing | `noindex` until data gate signed |
| Neon | Clean useful data only (refs + agg_* + watermarks + weights) · raw ART out |
| Dirty data | Quarantine + alert — never silent imputation |
| Corridor MVP | **RER D — Branche Melun** · IDFM:C01728 · ART `tct=TBD` — **gate E signed** |
| Scale RER | **A–E 2024 loaded** · corridors/branches · A ouest / B nord **partial** only · Transilien après budget |
| Honest score grain | **Pair × sens × day_type × fenêtre 30 min × line_id** via ART Infocentre (S6) |

## Scoring (locked)

- On-time: delay **&lt; 5 min**
- TSR: cancellations (+ masked in V2) / theoretical; cancelled ∉ TPR
- Penalty &gt;15 min: rate clamped then weight 0.15
- Score: `(TPR×0.50)+((100−TSR)×0.35)−(penalty×0.15)` clamp [0,100]
- Weights versioned; persist `score`, `weights_version`, `computed_at`
- Colors: green ≥80 / orange 50–79 / red &lt;50
- Low sample: show score + uncertainty banner (`N_min` after Phase E)

## Non-goals (v1)

Auth, native app, live realtime, freemium, France outside IDF, early indexing, holiday day-type, inventing train-level precision, claiming **A est / B sud** (absent ART).

## V1.1 / V2

- V1.1: holidays + calendar source; train number if matrix OK
- V2: masked suppressions; Transilien / geo expansion

## Definition of Done (scale RER UI)

1. Home: pick RER line (+ optional branch) → 2 stations → oriented trajet with `?line=` (+ `?c=`).
2. Sees score + color + uncertainty + ±30 min alternative (weekday/WE) + disclaimer.
3. Melun golden path still works; share OG; `noindex`.
4. `pnpm test` green; ETL 2e run noop per partition; Neon ≪ 400 Mo (~160 Mo mesuré).

## Gates

| Gate | Owner | Artifact |
|------|-------|----------|
| H | Human | Harness + DESIGN.md + core skills |
| 1 | Human | Neon + Vitest + shadcn + tokens |
| E | Human | `data-capability-matrix.md` + named corridor |
| 2–5 | Human | Per phase checklist in `.cursor/plan.md` |
| S0–S2 | Human | `scale-rer-coverage.md` + ETL A–E + UI multi-lignes |

## Open (resolved)

- Pilot corridor → **RER D Branche Melun** (gate E signed 2026-09-27)
- Score grain → **pair × window × line_id** via ART S6 (signed)
- `N_min` → **frozen** 30 / 100 / 300 in `docs/03` + `lib/uncertainty.ts`
- Estimated times → **include** with `used_est` / `n_used_est` (default); see `docs/04`
- Whitelist → `docs/exploration/source-whitelist.md` (S6 ART primary)
- Scale → RER A–E corridor ETL + home pills (2026-09-27)
