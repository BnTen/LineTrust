# Tests

Vitest is wired (`pnpm test`). Layout:

```
tests/
  unit/           # pure functions (scoring, …)
  fixtures/       # golden synth cells for CI without Neon
```

## Phase 1 coverage

- Score formula + clamp + bands (`lib/scoring.ts`)
- Alternative window ±30 min tie-breaks
- Golden fixture `fixtures/score-cell.golden.json`

Route/UI tests wait for Phase 3–4.
