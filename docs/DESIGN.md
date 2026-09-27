# DESIGN.md — LineTrust (TravelAI → light, anti-slop)

Reference concepts: [travelai.com](https://www.travelai.com/) — **principles only**, adapted to IDF rail reliability. Light theme only. Do not clone travel wording.

Skill enforcement: `.claude/skills/linetrust-ui/` + `.cursor/skills/frontend-design/` + `.cursor/skills/ui-ux-pro-max/`.

## Product atmosphere

Honest commute utility. Real platforms, trains, morning light — not SaaS purple mesh, not “AI travel agent” fantasy.

## Concepts checklist (TravelAI → LineTrust)

| TravelAI concept | LineTrust adaptation |
|------------------|----------------------|
| Massive left-aligned hero type, few elements | Brand + 1 headline + 1 sentence + search CTA |
| One signature word in orange→lime gradient | One keyword only (e.g. « fiable » / « vraiment ») in **orange → reliability green** — nowhere else |
| Minimal nav | Logo + sparse links; secondary in drawer |
| Pill CTAs | shadcn Button `rounded-full` — primary solid / secondary ghost |
| Generous whitespace | Airy sections; no dense dashboard in hero |
| Full-bleed cinematic photo, soft large radius | Real IDF rail/commute imagery — edge-to-edge hero plane |
| Editorial story bands | Citizen belief line, not decorative 01/02/03 |
| Product pillars as tabs | Score / Alternative / Preuve (share) — real jobs |
| Soft atmosphere | Light radial wash / light grain on paper — no dark neon |
| Mono logo + wordmark | Simple LineTrust wordmark; no mascot |

## Tokens (Phase 1 → CSS variables)

### Color

| Token | Role | Guidance |
|-------|------|----------|
| `--canvas` | Page bg | Cold-neutral paper (stone/zinc light). **Avoid** cream `#F4F1EA` + terracotta cluster |
| `--ink` | Headings | Near-black |
| `--ink-muted` | Body | Readable gray |
| `--score-good` | ≥80 | Green, AA on canvas |
| `--score-mid` | 50–79 | Orange, AA |
| `--score-bad` | &lt;50 | Red, AA |
| `--gradient-signature` | One headline fragment | Orange → score green |

### Type

- Display: distinctive grotesk (**not** Inter, Roboto, Arial, Geist-as-default).
- Body: highly readable companion or same family at text sizes.
- Editorial scale: large hero, calm body, short measure (&lt; ~80ch).

### Shape & space

- Media: very large radius.
- Controls: subtler radius than media.
- Hero budget: brand, one headline, one line, one CTA group, one dominant image — nothing else in first viewport.

### Motion

1. One load orchestration: stagger headline → CTA (cinematic beat).
2. Score reveal micro-interaction.
3. Window / day-type feedback.
Respect `prefers-reduced-motion`.

## Layout rules (hard)

- One composition in the first viewport (not a dashboard).
- Brand is hero-level, not a nav afterthought.
- Full-bleed hero visual plane by default — no inset card hero.
- No cards in hero; cards only when they wrap a real interaction.
- No detached badges/chips overlaid on hero media.
- One job per section.

## Forbidden (AI slop)

Purple gradients; Inter/Roboto defaults; identical SaaS card grids; 3-column hero stats; ALL-CAPS eyebrows everywhere; dark acid-green kitsch; cream+terracotta default; decorative emoji; glow spam; cloning TravelAI copy.

## Critique process (Phase 4)

1. Plan tokens + ASCII wireframe against this doc.
2. Implement.
3. Second pass with `frontend-design` + `linetrust-ui` anti-slop checklist + screenshot review.
4. Verifier: a11y + visual smoke.

## shadcn

Init in **Phase 1** only (`pnpm dlx shadcn@latest init`). Map CSS variables to tokens above. Prefer composition over custom one-offs.
