# REVIEW.md — LineTrust

Use before merging a feature or signing a phase gate.

## Always

- [x] Matches `intent/` locks (no scope creep: auth, live, France-wide, early index…)
- [x] Grain honesty: UI claims ⊆ capability matrix statuses
- [x] A→B and B→A treated as distinct
- [x] Disclaimer present where user-facing score/share appears
- [x] FR copy; no operator impersonation
- [x] `noindex` still on until data gate signed — `DATA_PUBLIC=false` / `robotsPolicy()` (Phase 5)
- [x] Tests added/updated; `feature-test-gate` satisfied
- [x] No secrets (`.env*`) in diff
- [x] No multi-MB raw dumps committed or pasted into agent context

## Security

- [ ] No credentials in git
- [ ] SQL parameterized (no string-concat filters)
- [ ] User input validated at boundaries (slugs, query enums)
- [ ] Dependency / script changes justified

## Performance

- [ ] Hot path reads aggregates + cache/ISR — not full scans
- [ ] Cold-start expectation documented if touching Neon
- [ ] Images: sized, modern format, no layout shift bombs

## ETL / data (when touched)

- [ ] Hash → partition replace; second run noop proven or tested
- [ ] Quarantine path for dirty rows — no silent imputation
- [ ] Watermarks updated
- [ ] Storage impact vs ~400 Mo Neon headroom considered
- [ ] Full reload only with written justification

## UI (when touched)

- [x] `docs/DESIGN.md` + `linetrust-ui` followed — Phase 4 TravelAI-light 2026-09-27
- [x] Anti-slop checklist passed (second pass) — cold paper, Outfit/Source Sans, one signature gradient word, no hero stats/cards
- [x] WCAG 2.2 AA for score colors on light canvas — tokens unchanged; score bands on canvas
- [x] `prefers-reduced-motion` respected — globals + motion utilities
- [x] Hero budget respected (no stats strip / card grid in first viewport)

## Context hygiene (agentic)

- [ ] Heavy profiling delegated to subagents
- [ ] Durable findings written under `docs/exploration/`
- [ ] Main agent did not re-ingest raw after summary

## Phase gate sign-off

### Scale RER S0–S2 (2026-09-27)

- [x] S0 gate signed (`scale-rer-coverage.md`)
- [x] ETL 2024 A–E loaded · Melun + E still scoreable · 2e run noop · Neon ~160 Mo
- [x] UI multi-lignes (pills + branche optionnelle + `?line=`) · tests green · still `noindex`
- [ ] Human multi-OD spot-check before `DATA_PUBLIC=true`

Phase: **S2**  
Reviewer: agent + pending human spot-check  
Date: 2026-09-27  
Notes: Transilien deferred (budget); A est / B sud still impossible.