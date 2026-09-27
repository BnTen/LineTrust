# LineTrust agent harness

@AGENTS.md

This file is the operating manual for AI agents on **LineTrust (MonTER)**.  
Product locks live in `intent/000-linetrust-mvp.intent.md`. Visual locks in `docs/DESIGN.md`.

## Commands

```bash
pnpm dev          # Next.js local
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
pnpm build        # Production build
```

Package manager: **pnpm** only.

## Source-of-truth map

| Artifact | Path |
|----------|------|
| Intent | `intent/000-linetrust-mvp.intent.md` |
| Product → ops docs | `docs/01` … `docs/05` (`01-product.md` … `05-ops-seo-legal.md`) |
| Spec | `docs/spec.md` |
| Design | `docs/DESIGN.md` |
| Data matrix | `docs/exploration/data-capability-matrix.md` |
| Phase checklist | `.cursor/plan.md` |
| Review lens | `REVIEW.md` |
| GitHub / gh | `docs/06-github-workflow.md` |
| Evals | `evals/` |
| Tests | `tests/` |

## GitHub repository

| Field | Value |
|-------|-------|
| Remote | `origin` → https://github.com/BnTen/LineTrust.git |
| Default branch | `main` |
| CLI | [GitHub CLI `gh`](https://cli.github.com/) — see `docs/06-github-workflow.md` |

```bash
# First-time remote (already done on primary machine)
git remote add origin https://github.com/BnTen/LineTrust.git
git branch -M main
git push -u origin main

# Day-to-day (only when user asks to commit/push)
git add -A && git status   # confirm no .env*
git commit -m "…"
git push
gh pr create               # when opening a PR
```

Never commit `.env.local` / secrets. Use `.githooks` + Cursor hook.

## Definition of Done (slice)

See intent. Short form:

1. Search 2 pilot-corridor stations → oriented trajet page  
2. Score + color + uncertainty + ±30 min alternative (weekday/WE) + disclaimer  
3. Share OG image  
4. Tests green; ETL second run noop; `noindex`

## Sub-agents (mandatory for heavy data)

| Agent | Path | Use when |
|-------|------|----------|
| explorer-data | `.claude/agents/explorer-data.md` | Large CSV/GTFS/zip inventory |
| schema-profiler | `.claude/agents/schema-profiler.md` | Columns, dtypes, cardinalities |
| verifier | `.claude/agents/verifier.md` | End-of-feature lint/test report only |

Also: Cursor Task `explore` for codebase research.

**Hard rules:** skill `subagent-orchestration`. Never paste multi-MB dumps into the main thread. Max 2–3 parallel subagents. Do not subagent files under ~500 lines / ~1 Mo if already summarized in `docs/exploration/`.

## Skill catalog

### Project core (`.claude/skills/` — mirrored under `.cursor/skills/` for Cursor discovery)

| Skill | When |
|-------|------|
| `linetrust-business-rules` | Scoring, day types, A≠B, disclaimer, grain honesty |
| `subagent-orchestration` | Before profiling / large file work |
| `feature-test-gate` | Closing any feature |
| `data-exploration-guidelines` | Phase E and any raw data touch |
| `linetrust-ui` | Any UI / DESIGN.md work |

### UI toolkit (`.cursor/skills/`) — already installed + Phase H

| Skill | When |
|-------|------|
| `ui-ux-pro-max` | Design system search / stack guidance |
| `frontend-design` | Anti-slop aesthetics (Anthropic) |
| `ui-styling` / `design` / `brand` / … | As needed; prefer `linetrust-ui` + DESIGN.md first |
| shadcn (Phase 1) | After `components.json` exists — install official shadcn skill then |

**Do not reinstall** `ui-ux-pro-max`. Skills `etl-diff`, `seo`, `code-quality` are created on first repetition in their phase. `neon-mcp` added in Phase 1.

## Phase boundaries

- **Phase H (this harness):** docs/skills/agents/hooks/evals only — **no** product routes, Neon live, ETL download, shadcn init.
- **Phase 1:** Neon via MCP, Vitest, shadcn init, CSS tokens.
- Later phases: see `.cursor/plan.md`.

## Security

- Never commit `.env*` (template: `.env.example` only).
- Cursor hook: `.cursor/hooks.json` → `block-env-commit.mjs` on `git add|commit|stage`.
- Git hook: `git config core.hooksPath .githooks` (once per clone) → `.githooks/pre-commit`.
- Parameterized SQL only (when DB arrives).
- No silent data invention.

## Quality bar

Code: secure, tested, lean. ETL: hashed, idempotent, tested. Docs & skills: living — update when decisions change.
