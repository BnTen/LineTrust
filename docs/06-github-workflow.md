# GitHub & gh CLI — LineTrust

## Repository

| Field | Value |
|-------|-------|
| Remote | `origin` |
| URL (HTTPS) | https://github.com/BnTen/LineTrust.git |
| Owner | `BnTen` |
| Name | `LineTrust` |
| Default branch | `main` |

Clone:

```bash
gh repo clone BnTen/LineTrust
# or
git clone https://github.com/BnTen/LineTrust.git
```

## One-time local setup

```bash
git remote add origin https://github.com/BnTen/LineTrust.git
git branch -M main
git config core.hooksPath .githooks   # block .env* commits
```

Auth: `gh auth login` (HTTPS) if push/PR fails.

## Agent / human commit flow

Only commit when the user asks. Never commit `.env*` (hooks + `.gitignore`).

```bash
git status
git diff
git log -5 --oneline

# Stage (no secrets)
git add -A
# Verify nothing env-like is staged:
git diff --cached --name-only | grep -E '(^|/)\.env' && exit 1 || true

git commit -m "$(cat <<'EOF'
Short why-focused message.

EOF
)"

git status
```

## Push

```bash
git push -u origin main          # first push / set upstream
git push                         # thereafter
```

Prefer `gh` when creating remotes/PRs:

```bash
gh repo view BnTen/LineTrust
gh pr create --title "…" --body "…"
gh run list                      # CI later (Phase 5)
```

## Do not

- `git push --force` on `main` unless the user explicitly requests it
- Amend commits already pushed without explicit user request
- Commit `DATABASE_URL` / Neon passwords / `.env.local`
- Interactive git (`-i`) in agent shells

## Neon (related, not in git)

Project id `muddy-paper-90279472` — connection string only in `.env.local` / host secrets. See `docs/perf-cold-start.md` and skill `neon-mcp`.
