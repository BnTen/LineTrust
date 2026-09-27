# Evals skeleton

Smoke prompts to re-run when `CLAUDE.md` or core skills change.  
Not automated CI yet — Phase 1+ may wire a runner.

## How to run (manual)

1. Open a fresh agent session with repo root.
2. Paste the prompt from a case file.
3. Score against `expect.md` criteria (pass/fail).

## Cases

| Id | File | Covers |
|----|------|--------|
| H-smoke-harness | `evals/cases/h-smoke-harness/` | Finds intent, DESIGN, no Phase 1 Neon |
| H-business-rules | `evals/cases/h-business-rules/` | A≠B, score formula, noindex |

Add one new case when a skill repeatedly fails in the wild.
