# 01 — Product

Source of truth companion: `intent/000-linetrust-mvp.intent.md`.

## Audience

Commuters and occasional travelers on TER / Transilien / RER in Île-de-France who want an honest, shareable reliability signal for a directed trip A→B in a chosen time window.

## Value proposition

« On te dit que c’est ponctuel. Les chiffres disent autre chose. »  
LineTrust turns open historical regularity into a single score (with uncertainty) for a **directed** station pair and time window — weekday vs weekend.

## Primary jobs

1. Search two stations → land on `/trajet/[from]-[to]` (oriented).
2. Understand score, color, sample strength, alternative ±30 min.
3. Share a card that carries facts + mandatory disclaimer.

## Navigation (phased)

| Phase | Capability |
|-------|------------|
| 3a (slice) | Search only on pilot corridor |
| 3b | Browse by line / region **if** data matrix supports it |
| Later | Train number only if matrix = calculable |

## Content & tone

- FR only; plain verbs; citizen utility, not operator marketing.
- Never claim live status or official certification.
- Always disclose independence + open-data basis.

## Feature backlog priority

1. Vertical slice (search → score → alternative → share → disclaimer).
2. Enrich metrics only after `docs/exploration/data-capability-matrix.md`.
3. Browse / train grain / holidays / masked suppressions as gated follow-ups.

## Success metrics (qualitative MVP)

- Golden path DoD in intent passes.
- User never sees invented precision (grain honesty).
- Pages stay `noindex` until human data gate.
