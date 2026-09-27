# Spec — LineTrust MVP (slice)

Normative companion to `intent/000-linetrust-mvp.intent.md`. UI visuals: `docs/DESIGN.md`.

## Routes (Phase 3a — implement later)

| Route | Behavior |
|-------|----------|
| `/` | Hero TravelAI-light + search 2 stations (pilot corridor) |
| `/trajet/[from]-[to]` | Oriented pair; score, uncertainty, alternative, disclaimer |
| `/api/...` | Only if needed for OG/share; prefer RSC |
| `/mentions-legales` | Legal + attribution |

Phase 3b (after matrix): browse by line/region — out of slice DoD.

## Page: Trajet

### Inputs

- `from`, `to` station ids (slug → resolve)
- Query: `window` (30 min start), `dayType` (`weekday`|`weekend`) via `nuqs`

### Outputs

1. Score 0–100 + color band
2. Uncertainty banner if `n < N_min`
3. Best alternative within ±30 min same day type
4. Optional sober trend chart (no chartjunk) — only if agg supports
5. Share CTA → OG image with max useful facts + disclaimer
6. Meta: `noindex` until validated

### Errors

- Unknown station / pair outside pilot: clear FR message + link home search
- Missing agg cell: explain lack of history; do not fake score

## Search

- Autocomplete limited to stations in scope (pilot corridor Phase 3a)
- Submit navigates to oriented slug; swapping from/to = different URL

## Scoring service

Pure functions over agg rows + `weights_version`. Unit-tested with fixtures under `tests/fixtures/`.

## Non-functional

| NFR | Target |
|-----|--------|
| A11y | WCAG 2.2 AA |
| Locale | FR |
| Auth | None |
| Hot read | Cached agg; p95 &lt; 50 ms warm |
| ETL | 2×/week; idempotent |

## Out of scope this spec

Neon project creation (Phase 1), raw download (Phase E), shadcn init runtime (Phase 1), full UI polish (Phase 4).
