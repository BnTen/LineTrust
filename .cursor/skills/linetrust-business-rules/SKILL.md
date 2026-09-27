---
name: linetrust-business-rules
description: >-
  Encodes LineTrust MVP product and scoring locks (IDF pilot, TER+Transilien+RER,
  A→B≠B→A, weekday/weekend, score formula, grain honesty, disclaimer, noindex).
  Use when implementing or reviewing trajets, KPI, copy, SEO slugs, or ETL aggregates.
---

# LineTrust business rules

Read `intent/000-linetrust-mvp.intent.md` and `docs/03-domain-scoring.md` first if anything conflicts — intent wins until explicitly revised.

## Non-negotiables

1. **Geo:** Île-de-France pilot only for MVP.
2. **Networks:** TER + Transilien + RER.
3. **Direction:** A→B and B→A are different scores and URLs.
4. **Day types MVP:** `weekday` | `weekend` only (holidays = V1.1).
5. **Window:** user-chosen 30 minutes; alternative = best score in ±30 min same day type.
6. **History / refresh:** **12 months** (Neon free; was 24); ETL 2×/week.
6b. **Scale RER:** score keyed by `line_id`; home line pills + optional branch; A ouest / B nord partial only; Melun golden path.
7. **Auth:** none.
8. **Locale:** FR only.
9. **SEO:** `noindex` until human data validation.
10. **Dirty data:** quarantine + alert — never silent imputation.
11. **Grain:** never claim train/line precision the capability matrix does not support.

## Scoring

```
on_time   = delay < 5 min
TPR       = on_time among non-cancelled
TSR       = cancellations / theoretical  (cancelled ∉ TPR)
penalty   = rate(delay > 15 min) clamped
score     = clamp(TPR*0.50 + (100-TSR)*0.35 - penalty*0.15, 0, 100)
```

Persist `score`, `weights_version`, `computed_at`, sample `n`.

Colors: green ≥80 / orange 50–79 / red &lt;50.

Low `n`: show score + uncertainty banner (`N_min` from docs/03 after Phase E).

## Disclaimer

Required on footer and share card. Independent open-data historical tool — not operator, not live.

## Vertical slice first

Search → one corridor pair both directions → score + uncertainty + alternative + share.  
Browse / train number / metric maximalism = after matrix gate.
