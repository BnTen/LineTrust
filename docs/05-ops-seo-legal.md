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

- `pnpm lint` + `tsc` + `pnpm test`
- Block secrets via hook + CI scan if available
- ETL dry-run on fixtures

## Rollback ETL

Keep previous partition or Neon snapshot before month replace.

## Human gates

Never auto-enable public indexation or claim train-level grain without signed Phase E matrix + corridor name in `intent/`.
