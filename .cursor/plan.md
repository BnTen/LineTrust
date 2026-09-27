# LineTrust — phase checklist

Plan reference: harness AI-SDLC + Neon + TravelAI-light.  
Agents execute between human gates. Check boxes only when the gate evidence exists.

## Phase H — Harness mince

- [x] `intent/000-linetrust-mvp.intent.md`
- [x] `docs/01` … `docs/05` + `docs/spec.md` + `docs/DESIGN.md`
- [x] `docs/exploration/data-capability-matrix.md` (template)
- [x] `CLAUDE.md` enriched
- [x] `REVIEW.md`
- [x] Core skills + `linetrust-ui` + agents explorer/profiler/verifier
- [x] `frontend-design` skill notes (Anthropic) under `.cursor/skills/`
- [x] Hook anti-commit `.env*`
- [x] `evals/` + `tests/` skeleton
- [x] **No** app feature routes / Neon live / ETL download / shadcn init

**Gate H:** harness ready — human signed 2026-09-27. Ready for Phase 1.

## Phase 1 — Environment

- [x] Neon project via MCP + local `DATABASE_URL` (`.env.local`, project `muddy-paper-90279472`)
- [x] Vitest + scoring fixtures (`lib/scoring.ts`, `tests/unit/scoring.test.ts`)
- [x] `pnpm dlx shadcn@latest init` + CSS tokens from DESIGN.md
- [x] Cold-start / ISR vs &lt;50 ms documented (`docs/perf-cold-start.md`)
- [x] Gate: lint + tsc + test

**Gate 1:** env ready — human OK to start Phase E (exploration).

## Phase E — Exploration

- [ ] Download + profile (subagents) + clean + useful ingest notes
- [ ] Fill `data-capability-matrix.md`
- [ ] Name pilot corridor in `intent/`
- [ ] Neon budget + source whitelist + licences
- [ ] **Human gate:** matrix + corridor + honest grain

## Phase 2 — ETL + KPI

- [ ] Schema refs / agg / watermarks / weights
- [ ] ETL hash → replace partition
- [ ] Scoring + uncertainty (`N_min` frozen)
- [ ] Tests etl/kpi + CI fixtures
- [ ] Gate: double-run noop; storage OK

## Phase 3 — Routes

### 3a Slice

- [ ] Search + `/trajet/[from]-[to]` oriented
- [ ] `noindex` + canonical self
- [ ] Golden path DoD

### 3b Browse (only if matrix OK)

- [ ] Line / region browse
- [ ] Train number only if calculable

## Phase 4 — UI TravelAI-light

- [ ] Hero + search composition
- [ ] Trajet cinematic score + uncertainty + alternative + share + disclaimer
- [ ] Motion + reduced-motion
- [ ] Anti-slop second pass + component tests
- [ ] Optional Stitch mock upstream

## Phase 5 — Deploy & maintain

- [ ] CI
- [ ] Cron 2×/week
- [ ] Licences / mentions
- [ ] Keep `DATA_PUBLIC` / noindex until validation
- [ ] Backlog: masked suppressions, holidays, geo expansion
