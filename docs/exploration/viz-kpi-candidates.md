# Viz KPI decisions (2026-09-27)

Phase 0 Neon audit → product choices for day-profile viz.

## Locked for v1

| Choice | Decision |
|--------|----------|
| Trajet enrichment | Profil horaire 48 slots + encoding `n` (opacity) + barres TPR/&gt;15 min (voisinage ±90 retiré — redondant avec le profil) |
| Nouvelle page | `/profil/[slug]` — job unique : comparer les créneaux d’un OD orienté |
| Tendance 12 mois | **Livrée** sur `/trajet` (trous visibles + volatilité σ si ≥6 mois) |
| Comparaison sens | **Livrée** — même créneau reverse + meilleure heure reverse |
| Meilleur créneau | **Livré** sur trajet + profil |
| TSR / suppressions | **Ne pas visualiser** (`tsr` toujours 0 en Neon) |
| Charts lib | CSS/SVG custom — pas de Recharts |

## Grain

Toujours `agg_pair_window_rollup` : pair × sens × day_type × window. Trous = absences réelles, jamais interpolés.

## SQL proof (Melun Lyon→Melun weekday)

5/48 créneaux (14h–18h30) ; sens inverse 4 créneaux matin ; weekend 0.
