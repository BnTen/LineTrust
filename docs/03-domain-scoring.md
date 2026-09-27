# 03 — Domain & scoring

## Entities (MVP)

| Entity | Notes |
|--------|-------|
| Station | IDF stop with stable id mapping (UIC / STIF / GTFS — resolved Phase E) |
| Directed pair | From → To; reverse is a different page and score |
| Line | Optional display; required for browse 3b |
| Train number | Only if capability matrix = calculable |
| Time window | User-selected 30 min slot |
| Day type | `weekday` \| `weekend` (holidays V1.1) |
| Aggregate cell | pair × direction × day_type × window × (optional line) |

## Score formula (locked)

```
on_time     := delay < 5 minutes
TPR         := on_time rate among non-cancelled observed runs in cell
TSR         := cancellations / theoretical  (cancelled ∉ TPR denominator)
penalty     := rate of delays > 15 min, clamped [0, 100]
score_raw   := (TPR×0.50) + ((100−TSR)×0.35) − (penalty×0.15)
score       := clamp(score_raw, 0, 100)
```

Persist with each aggregate row:

- `score`
- `weights_version`
- `computed_at`
- sample size `n` (for uncertainty)

## Colors

| Band | Range | Token role |
|------|-------|------------|
| Green | ≥ 80 | Reliable |
| Orange | 50–79 | Mixed |
| Red | &lt; 50 | Poor |

Must meet WCAG 2.2 AA on light canvas.

## Uncertainty (to freeze after Phase E)

Until exploration:

- Placeholder rule: if `n < N_min` → banner « historique insuffisant » + still show score.
- Labels: faible / moyen / fort from sample size buckets.
- No fancy Bayesian interval unless trivial after E.

Fill exact `N_min` and buckets here after gate E — do not invent before matrix.

## Alternative

Among cells same day type, windows within ±30 min of user window: pick best `score` (tie-break: higher `n`, then closer window).

## Integrity rules

1. Never invent train-level or minute-level precision absent from sources.
2. If grain is line/window only, UI copy must say so.
3. Quarantine dirty rows; never silent fill.
4. A→B and B→A are independent cells.
