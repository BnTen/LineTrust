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

- Target Neon ≪ 400 Mo with 24 months of **aggregates** for pilot corridor.
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
