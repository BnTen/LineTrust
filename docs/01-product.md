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
| 3a (slice) | Search Melun corridor |
| **S2 scale** | Home **RER line pills** (A–E) + optional branch → selects → trajet `?line=` |
| 3b | Dedicated browse by line / region **if** matrix supports it |
| Later | Train number only if matrix = calculable |

## Content & tone

- FR only; plain verbs; citizen utility, not operator marketing.
- Never claim live status or official certification.
- Always disclose independence + open-data basis.
- Partial ART: copy **A ouest** / **B nord** only — never list A est / B sud.

## Feature backlog priority

1. Vertical slice Melun (done) → scale RER UI (done).
2. Transilien ETL if Neon headroom OK (≪ 300–350 Mo).
3. Browse / train grain / holidays / masked suppressions as gated follow-ups.

## Success metrics (qualitative MVP)

- Golden path DoD in intent passes.
- User never sees invented precision (grain honesty).
- Pages stay `noindex` until human data gate.
