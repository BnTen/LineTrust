# Scale S1 — clé OD multi-lignes

**Date:** 2026-09-27  
**Décision humaine:** 1 score **par ligne** · corridors/branches · pruning budget

## Choix de clé

```
agg_pair_window / rollup PK =
  (line_id, from_code_ci, to_code_ci, day_type, window_start_minutes[, month_key])
```

| Option | Verdict |
|--------|---------|
| A — OD global sans ligne | ❌ 3.1 % collisions endpoints ART ; hubs partagés |
| **B — OD × line_id** | ✅ signé |

## Hot path

Index `(line_id, from_code_ci, to_code_ci, day_type)` · lecture rollup · Melun = `line_id = IDFM:C01728`.

## Refs

- `ref_lines` — A–E (coverage full|partial)
- `ref_corridors` — un corridor = une branche UX
- `ref_stops` — `code_ci` unique (hubs partagés)
- `ref_corridor_stops` — ordre + is_hub

## Migration

`db/migrations/001_multilines.sql` backfill Melun `line_id` sans recharger le raw.
