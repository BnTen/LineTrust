# LineTrust

Fiabilité historique des trajets **TER / Transilien / RER** en Île-de-France (pilote).

- Repo: [github.com/BnTen/LineTrust](https://github.com/BnTen/LineTrust)
- Agent harness: `CLAUDE.md` · GitHub/`gh`: `docs/06-github-workflow.md`
- Product locks: `intent/000-linetrust-mvp.intent.md`

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill DATABASE_URL from Neon
git config core.hooksPath .githooks
pnpm dev
```

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Phases

See `.cursor/plan.md`. Current baseline: Phase H (harness) + Phase 1 (Neon, Vitest, shadcn, tokens).
