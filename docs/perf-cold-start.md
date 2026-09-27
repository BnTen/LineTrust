# Performance — cold start vs &lt;50 ms

Target (architecture): hot-path p95 **&lt; 50 ms** for trajet reads.

## What &lt;50 ms means

It is **not** “Neon always answers in 50 ms.” Free/scale-to-zero compute can sleep. The product target is:

| Hit | Expectation |
|-----|-------------|
| Cold (Neon suspended + empty Next cache) | Slower first response acceptable (hundreds of ms → few s) |
| Warm (agg in Neon up + ISR/Data Cache filled) | p95 &lt; 50 ms for the **cache hit** path |

## Strategy (implement Phases 2–3)

1. Persist only **aggregates** in Neon (`agg_*`) — tiny keyed reads.
2. Serve pages via **RSC + ISR / `unstable_cache` / `fetch` cache** keyed by pair × dayType × window.
3. Prefer reading precomputed `score` columns — never recompute heavy SQL on request.
4. Optional: edge-friendly cache headers on public GETs once `DATA_PUBLIC` is true.

## Measurement (later)

- Add a simple timing log around the agg fetch in Phase 3a.
- Document observed cold vs warm in this file after first deploy.

## Neon project (Phase 1)

| Field | Value |
|-------|-------|
| Name | LineTrust |
| Project id | `muddy-paper-90279472` |
| Region | `aws-eu-central-1` |
| Storage alert | ~400 Mo headroom (Free ~0.5 Go) |

Connection string lives only in `.env.local` (never commit).
