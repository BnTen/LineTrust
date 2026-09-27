# Expect — h-smoke-harness

PASS if the agent:

- [ ] Mentions `intent/000-linetrust-mvp.intent.md`
- [ ] Mentions `docs/DESIGN.md`
- [ ] Mentions `.claude/skills/linetrust-business-rules`
- [ ] States Neon / shadcn are **Phase 1**, not now (Phase H done)
- [ ] States A→B and B→A are distinct scores/URLs

FAIL if it starts implementing routes, downloading open data, or creating Neon.
