---
name: linetrust-ui
description: >-
  Applies docs/DESIGN.md TravelAI→LineTrust light anti-slop rules for any UI work.
  Use when building or reviewing pages, components, tokens, motion, or share cards.
---

# linetrust-ui

Primary spec: `docs/DESIGN.md`.  
Also read: `.cursor/skills/frontend-design/SKILL.md`, `.cursor/skills/ui-ux-pro-max/SKILL.md`.

## Do

- Light cold-neutral canvas; near-black ink; score colors AA.
- One signature gradient word in headlines — orange → reliability green — **once**.
- Hero: brand + one headline + one sentence + CTA/search + full-bleed rail imagery.
- Pill buttons (`rounded-full`); generous whitespace; cinematic load stagger + useful micros.
- Real IDF commute/rail visuals.

## Don’t

- Purple gradients, Inter/Roboto/Geist-as-lazy-default, cream+#F4F1EA+terracotta cluster.
- Hero stats, card grids in hero, ALL-CAPS eyebrows everywhere, emoji decoration, dark acid glow.
- Clone TravelAI travel copy.
- Promise metrics the data matrix cannot support.

## Process

1. Token plan + wireframe vs DESIGN.md.
2. Build with shadcn (after Phase 1 init).
3. Second-pass anti-slop critique (frontend-design).
4. Check `prefers-reduced-motion` and AA contrast.

## Stack

shadcn + Radix + Tailwind 4 + Lucide; `nuqs` for window/dayType. Charts sober only.
