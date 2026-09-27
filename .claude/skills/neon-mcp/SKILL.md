---
name: neon-mcp
description: >-
  Neon project conventions for LineTrust — project id, env vars, storage budget,
  connection via MCP. Use when touching DATABASE_URL, migrations, or Neon MCP tools.
---

# neon-mcp (LineTrust)

## Project

| Field | Value |
|-------|-------|
| Name | LineTrust |
| Id | `muddy-paper-90279472` |
| Region | `aws-eu-central-1` |
| DB | `neondb` |

## Secrets

- `DATABASE_URL` only in `.env.local` / host secrets — never commit.
- Prefer pooled connection string for serverless.
- Hooks block `git add/commit` of `.env*`.

## Budget

Free ~0.5 Go. Alert if approaching ~400 Mo. Store refs + `agg_*` + watermarks + weights only.

## Cold start

See `docs/perf-cold-start.md`. Do not promise &lt;50 ms on cold Neon wake — use cache/ISR for hot path.
