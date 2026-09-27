# Data capability matrix (template)

**Phase:** E (fill before promising UI grain)  
**Corridor candidacy:** _TBD_  
**Sources inventoried:** _list URLs / datasets_  
**Profiler artifacts:** `docs/exploration/…`  
**Human gate:** ☐ signed — date / name: ________

## How to use

For each KPI or UI promise, mark exactly one status:

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
| Score directed pair A→B | pair × sens × day_type × window 30m | | | |
| Score B→A independent | same | | | |
| Weekday vs weekend split | day_type | | | |
| Alternative ±30 min | neighboring windows | | | |
| Uncertainty from `n` | cell sample size | | | |
| Line identity on page | line id join | | | |
| Train number | train_id × run | | | |
| Browse by line | line aggregates | | | |
| Browse by region | region mapping | | | |
| Trend chart 24 months | monthly cells | | | |
| Share card metrics pack | subset of above | | | |
| Holidays day-type | calendar | | V2 / V1.1 | Out of MVP |
| Masked suppressions | dedicated field | | V2 | |

## Join / id mapping

| Id space | Coverage | Join path | Risk |
|----------|----------|-----------|------|
| UIC | | | |
| STIF / Île-de-France Mobilités | | | |
| GTFS stop_id | | | |

## Grain honesty decision (required)

Chosen MVP display grain: ☐ window/pair · ☐ line · ☐ train  

Rationale (from matrix):

_

## Neon budget estimate

| Table class | Est. rows | Est. Mo |
|-------------|-----------|---------|
| refs | | |
| agg_* | | |
| watermarks / weights | | |
| **Total** | | |

☐ Under ~400 Mo headroom for Free tier.

## Go / No-go

- [ ] Matrix complete for slice DoD rows
- [ ] Corridor named in `intent/`
- [ ] UI promises match statuses
- [ ] Licence attribution listed
- [ ] Human signature
