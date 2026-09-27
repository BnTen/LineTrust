# frontend-design — LineTrust notes

## Provenance

Adapted from Anthropic’s [frontend-design](https://github.com/anthropics/claude-code/blob/HEAD/plugins/frontend-design/skills/frontend-design/SKILL.md) skill (Claude Code plugin).  
Cookbook: [Prompting for frontend aesthetics](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics).

## How to use on this repo

1. Read `docs/DESIGN.md` and `.claude/skills/linetrust-ui/SKILL.md` **first**.
2. Apply this skill’s two-pass plan → critique process.
3. Prefer `.cursor/skills/ui-ux-pro-max` for stack/search helpers — **do not reinstall** it.
4. Official **shadcn** skill: install in Phase 1 after `components.json` exists (`pnpm dlx shadcn@latest init`).

## LineTrust overrides

| Topic | Rule |
|-------|------|
| Theme | Light only |
| Signature gradient word | Allowed **once** per DESIGN.md — exception to generic “don’t accent one word” tell |
| Subject vernacular | IDF rail / commute reality |
| Cards | Not in hero |

Phase H only vendors this skill text; no UI implementation yet.
