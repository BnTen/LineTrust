# 04 — Data & ETL

## Principles

1. Neon holds **only** clean, app-useful rows (refs, aggregates, watermarks, weights).
2. Raw stays in `data/raw/` (gitignored) or object storage — not git LFS for MVP.
3. Dirty data → quarantine table + alert; no silent imputation.
4. Idempotent loads; second run with same inputs = noop.

## Pipeline v0 (MVP)

```
download → hash file → if unchanged: noop
                     → if changed: replace partition (month × source)
```

Row-level diff = v1 **only after** Phase E proves stable business keys.

## Phase 2 + Scale RER implementation

| Piece | Path |
|-------|------|
| Schema | `db/schema.sql` + `db/migrations/001_multilines.sql` (Neon `muddy-paper-90279472`) |
| Network ETL (primary) | `scripts/etl/art-network-stream.py` — multi-corridor · `--tct` · prune n≥30 + nuit |
| Corridor config | `scripts/etl/corridors.yaml` + `corridors.discovered.json` |
| Discover | `scripts/etl/discover-corridors.py` |
| Legacy Melun-only | `scripts/etl/art-melun-stream.py` |
| Pure aggregate (tests) | `lib/etl/aggregate.ts` |
| Watermark decision | `lib/etl/watermark.ts` |

**Agg key:** `(line_id, from, to, day_type, window[, month])` — score **par ligne**.  
**Partitions:** `{year}-rer-{TCT…}` (ex. `2024-rer-TBC`) — un `--tct` à la fois pour noop.  
**Retention:** 12 calendar months. **Raw ART** hors Neon / hors git.

**Loaded 2024 (mesuré):** RER A–E corridor-scoped · ~575 k monthly · ~62 k rollup · DB **~160 Mo**.  
Melun golden path: `tct=TBD` · Lyon `686030` ↔ Melun `682005`.  
Partial honesty: A ouest / B nord only (terminus virtuel Nanterre `758029` = OD sans jalon).

### Estimated times (`dh_est_jalon`)

**Choice (Phase 2):** include estimated arrivals when `dh_obs_jalon` is null, with `n_used_est` / future UI flag `used_est`.  
Strict TPR (obs-only) is optional later — not the default score. Disclose share of estimated samples when material for the cell.

### Cancellations / TSR

No boolean cancel field in ART. **MVP:** `n_cancelled = 0`, `tsr = 0` (reliability term = 35 pts flat).  
Do not invent missing circulations. TSR upgrade = explicit derivation vs GTFS (V2 / validated proxy).

## Watermarks

Track per source: `source_id`, `partition_key` (e.g. `2025-01`), `content_hash`, `loaded_at`, `row_count`.

## Tests (required Phase 2)

| Case | Expect |
|------|--------|
| Same file hash | No partition rewrite |
| New month file | Upsert that partition only |
| Corrupt / schema drift | Quarantine + fail loud |
| Scoring fixture | Deterministic score for golden cells |

## Capability matrix (Phase E gate)

Before promising UI grain, fill:

`docs/exploration/data-capability-matrix.md`

Per KPI: `calculable` | `proxy` | `impossible` | `V2`.

## Storage budget

- Target Neon ≪ 400 Mo with **12 months** of **aggregates** (corridor-scoped; was 24 — revised for free tier).
- If raw facts needed for recompute: keep outside Neon; rebuild agg from scratch scripts.

## Cadence

2× / week cron (Phase 5). Prefer differential hash→replace; full reload only with written justification in REVIEW.

## Licences (checklist before indexation)

- Attribution ODbL / data.gouv as required by each source.
- Do not imply SNCF/RATP endorsement.
- Page `/mentions-legales` + footer disclaimer (Phase 3+).

## Subagents

Files &gt; ~500 lines or &gt; ~1 Mo or multi-file GTFS → `explorer-data` / `schema-profiler`.  
Write durable findings under `docs/exploration/`.
