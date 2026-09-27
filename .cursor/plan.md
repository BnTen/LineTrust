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

- [x] Download + profile (subagents) — S1–S5 puis **S6 ART** IDFM 2023–2024 (`art-circulations-discovery.md`, `profile-art-rer-d.md`)
- [x] Fill `data-capability-matrix.md` — **revised**: pair×window **calculable** via ART; S1 = cross-check
- [x] Name pilot corridor in `intent/` — **RER D — Branche Melun (Paris-Gare-de-Lyon ↔ Melun)** (pending human confirm)
- [x] Neon budget + source whitelist + licences (`source-whitelist.md`; raw ART hors Neon; agg corridor ≪ 400 Mo)
- [x] **Human gate:** matrix + corridor + honest grain — signed 2026-09-27 (RER D Melun + ART S6; OK Phase 2)

## Phase 2 — ETL + KPI

- [x] Schema refs / agg / watermarks / weights
- [x] ETL hash → replace partition
- [x] Scoring + uncertainty (`N_min` frozen)
- [x] Tests etl/kpi + CI fixtures
- [x] Gate: double-run noop; storage OK

**Gate 2:** human OK 2026-09-27 → Phase 3a.

## Phase 3 — Routes

### 3a Slice

- [x] Search + `/trajet/[from]-[to]` oriented
- [x] `noindex` + canonical self
- [x] Golden path DoD

**Gate 3a evidence:** home search → `/trajet/paris-gare-de-lyon--melun` ; score + uncertainty + alt ±30 + disclaimer + OG ; tests/lint/tsc green.

### 3b Browse (only if matrix OK)

- [ ] Line / region browse
- [ ] Train number only if calculable

## Phase 4 — UI TravelAI-light

- [x] Hero + search composition — brand hero-level + headline + phrase + CTA + full-bleed rail (`components/home-hero.tsx`, `public/images/hero-rail.jpg`)
- [x] Trajet cinematic score + uncertainty + alternative + share + disclaimer (`trajet-score-panel`, `score-reveal`, `trajet-share`)
- [x] Motion + reduced-motion — stagger `.lt-enter`, score `.lt-score-reveal`, control `.lt-control-feedback`; global `prefers-reduced-motion`
- [x] Anti-slop second pass + component tests — cold canvas wash; tests `tests/components/*`; `pnpm test` + `typecheck` + `lint` green 2026-09-27
- [ ] Optional Stitch mock upstream — skipped (non-blocking)

**Gate 4:** human OK 2026-09-27 → Phase 5.

## Phase 5 — Deploy & maintain

- [x] CI — `.github/workflows/ci.yml` (secret scan + lint + typecheck + test + build)
- [x] Cron 2×/week — `.github/workflows/etl-cron.yml` (Tue/Fri 04:00 UTC; needs `DATABASE_URL` secret)
- [x] Licences / mentions — `/mentions-legales` attribution table + whitelist checklist
- [x] Keep `DATA_PUBLIC` / noindex until validation — `lib/seo.ts` + `app/robots.ts`; `.env.example` still `false`
- [x] Backlog documented: masked suppressions, holidays, geo expansion (V1.1 / V2 — see intent)

**Gate 5:** awaiting human OK (enable GitHub secrets for live ETL cron; still noindex).

### Backlog (post-MVP — do not block Gate 5)

- Masked suppressions (V2)
- Holidays day-type (V1.1)
- Geo expansion beyond RER D Melun
- Phase 3b browse ligne/région (optional, human-triggered)
- PostHog funnel (optional)
