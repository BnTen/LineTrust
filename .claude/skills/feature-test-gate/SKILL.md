---
name: feature-test-gate
description: >-
  Closing checklist before marking a LineTrust feature done: tests, REVIEW.md,
  intent alignment, noindex/secrets, and verifier subagent. Use at end of every
  feature implementation or phase gate.
---

# Feature test gate

Do not claim “done” until this passes.

## Checklist

1. **Intent alignment** — no locked decision violated (`intent/`, business-rules skill).
2. **Tests** — unit/fixture coverage for new logic; `pnpm test` green when available.
3. **Types/lint** — `pnpm lint` (+ `tsc` when scripted).
4. **REVIEW.md** — relevant sections checked.
5. **Secrets** — no `.env*` in diff.
6. **SEO/data flags** — still `noindex` / `DATA_PUBLIC=false` unless human signed gate.
7. **Verifier** — run `.claude/agents/verifier.md` (report only) on non-trivial features.
8. **Docs** — update `docs/` or exploration artifacts if behavior/contracts changed.
9. **Evals** — if harness/skill/CLAUDE.md changed, add or run one smoke eval under `evals/`.

## Slice DoD reminder

Search → score + uncertainty + alternative + disclaimer + share OG + tests + ETL noop + noindex.

## Fail closed

If data grain is uncertain, **block UI that over-claims** — fix matrix/copy first.
