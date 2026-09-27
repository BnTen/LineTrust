---
name: data-exploration-guidelines
description: >-
  Guidelines for Phase E and any open-data exploration: capability matrix, grain
  honesty, quarantine, Neon budget, licences, subagent profiling. Use before
  downloading datasets, profiling CSV/GTFS, or promising train-level UI.
---

# Data exploration guidelines

## Order of work (Phase E)

1. Whitelist candidate sources (URLs, licences, refresh cadence).
2. Download to `data/raw/` (gitignored) — do not commit raw.
3. Profile via **subagents** (`explorer-data`, `schema-profiler`).
4. Write findings under `docs/exploration/`.
5. Fill `docs/exploration/data-capability-matrix.md`.
6. Propose pilot corridor (data × ridership) → human names it in `intent/`.
7. Estimate Neon footprint (refs + agg only).

## Grain honesty

Open “monthly regularity” CSVs are often **line/month**, not train 08:08 A→B.  
GTFS = theoretical, not observed. Without granular facts:

- Window / train promises may be `proxy` or `impossible`.
- MVP must display the **honest** grain and defer train numbers.

## Quarantine

Schema drift, impossible delays, broken station ids → quarantine + alert.  
No mean-fill, no silent drop without log.

## Neon

Only clean useful tables. Alert path if size → ~400 Mo. Raw stays out.

## Human gate

Do not start Phase 2 UI promises until matrix + corridor signed (`REVIEW.md` / plan).

## Parallelism

Profile multiple sources with ≤3 subagents; merge into matrix rows.
