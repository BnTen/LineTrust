# 05 — Ops, SEO & compliance

## Environments

| Env | Notes |
|-----|-------|
| Local | `.env.local` with Neon `DATABASE_URL` (never commit) |
| Preview | Vercel preview; `DATA_PUBLIC=false`, `noindex` |
| Prod | Same flags until human signs data validation |

## Source control

Repo: **https://github.com/BnTen/LineTrust.git** (`main`).  
Full `gh` / commit / push playbook: `docs/06-github-workflow.md`.

```bash
git remote add origin https://github.com/BnTen/LineTrust.git
git branch -M main
git push -u origin main
```

Enable local secret hook once: `git config core.hooksPath .githooks`.

## SEO (MVP)

- Slugs: readable station names; handle homonyms deliberately (Phase 3).
- A→B and B→A: distinct titles (« … vers … »), self-canonical, asymmetric content.
- **All** trajet/browse pages: `noindex, nofollow` until gate « data validated ».
- No doorway/spam generation of thin mirror pages.

## Legal & trust

Mandatory disclaimer on:

- Site footer
- Share / OG card

Wording direction: indépendant, basé sur open data historique, pas un service opérateur, pas du temps réel.

Before flipping indexation:

- [ ] Source attribution list complete
- [ ] `/mentions-legales` live
- [ ] Trademark / brand claims reviewed (no false official status)

## Observability (light)

- Structured ETL logs (start, hash, partition, noop vs replace, errors).
- PostHog later (search → trajet funnel) — optional Phase 5+.

## CI (Phase 5)

Workflow: `.github/workflows/ci.yml` on `push` / `PR` → `main`.

- Secret scan (no `.env*` except `.env.example`; no live `DATABASE_URL=postgres…` in tree)
- `pnpm lint` + `pnpm typecheck` + `pnpm test` + `pnpm build`
- `DATA_PUBLIC=false` on build

Inspect runs: `gh run list` / `gh run view`.

## ETL cron (Phase 5)

Workflow: `.github/workflows/etl-cron.yml`

| | |
|--|--|
| Schedule | Tue + Fri 04:00 UTC (`0 4 * * 2,5`) |
| Manual | `workflow_dispatch` (`force`, `years`) |
| Script | `scripts/etl/art-melun-stream.py` (+ `fetch-art-idfm.sh`) |

**Secrets (repo Settings → Secrets and variables → Actions):**

| Secret | Required | Role |
|--------|----------|------|
| `DATABASE_URL` | yes for real runs | Neon connection (never commit) |
| `ART_IDFM_2023_URL` | on cache miss | HTTPS URL to `idfm_annuel_2023.zip` |
| `ART_IDFM_2024_URL` | on cache miss | HTTPS URL to `idfm_annuel_2024.zip` |

Zips are gitignored; Actions caches `data/raw/art` between runs. First enablement: seed cache via a machine that has the zips, or set the URL secrets.

Without `DATABASE_URL`, the workflow exits cleanly (skip) — CI quality job stays green.

## Rollback ETL

Keep previous partition or Neon snapshot before month replace.

## Human gates

Never auto-enable public indexation or claim train-level grain without signed Phase E matrix + corridor name in `intent/`. Flip only by setting `DATA_PUBLIC=true` in host env **after** human sign-off.