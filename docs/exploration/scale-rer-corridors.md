# Scale — inventaire corridors RER (modèle Melun)

**Date:** 2026-09-27  
**Status:** ✅ ETL 2024 loaded (A–E) — listes runtime = `corridors.yaml` + `corridors.discovered.json`  
**Gate:** tous les corridors d’une ligne · ordre E → D → C → A/B  
**Filtre charge :** `stop_seq` ≥ 4 stops · `n_circ_undirected` ≥ 500 · prune n≥30 + drop 01:00–04:30

---

## Règle corridor

Un corridor = **hub ↔ terminus** + jalons intermédiaires sur les circulations ART de cette OD (comme Melun).  
Scores = paires orientées parmi ces stops · clé agg = `(line_id, from, to, day_type, window[, month])`.

Hub/end peuvent être **terminus virtuels** (présents en OD ART, absents des jalons) — ex. RER A `758029` Nanterre-Préfecture.

---

## RER D · `tct=TBD` · IDFM:C01728 · full · **loaded**

| corridor_id | display / axe | stops | status |
|-------------|---------------|-------|--------|
| `rer-d-melun` | Lyon Banlieue → Melun | 17 | **loaded** (MVP golden) |
| `rer-d-corbeil` | Lyon Banlieue → Corbeil | 14 | **loaded** |
| `rer-d-malesherbes` | Juvisy → Malesherbes | 15 | **loaded** |
| `rer-d-nord` | Lyon → Goussainville | — | yaml stub ; densités via disc |
| `rer-d-orry` | Paris-Nord → Orry | 11 | **loaded** |
| `rer-d-276220-681007` | Villiers-le-Bel → Corbeil | 21 | **loaded** (disc) |
| `rer-d-276006-681007` | Creil → Corbeil | 29 | **loaded** (disc) |
| `rer-d-681825-684415` | Juvisy → Malesherbes (alt) | 15 | **loaded** (disc) |

Rollup D : **7 122** · monthly **65 469**.

---

## RER E · `tct=TBE` · IDFM:C01729 · full · **loaded**

| corridor_id | axe typique | stops | status |
|-------------|-------------|-------|--------|
| `rer-e-116293-281899` | Vaires-Torcy → Haussmann | 11 | **loaded** |
| `rer-e-113795-281899` | Villiers-sur-Marne → Haussmann | 11 | **loaded** |
| `rer-e-116210-281899` | Tournan → Haussmann | 13 | **loaded** |
| `rer-e-113001-116293` | Paris-Est → Rosa Parks | 9 | **loaded** |
| `rer-e-113746-281899` | Nogent-Le Perreux → Haussmann | 9 | **loaded** |

Rollup E : **6 910** · monthly **67 702**.

---

## RER C · `tct=TBC` · IDFM:C01727 · full · **loaded** (8 corridors)

| corridor_id | axe typique | stops | status |
|-------------|-------------|-------|--------|
| `rer-c-393157-545244` | Versailles RG → Juvisy | 22 | **loaded** |
| `rer-c-393009-393579` | Versailles-Chantiers → Massy | 7 | **loaded** |
| `rer-c-393843-545350` | St-Quentin → St-Martin-Étampes | 30 | **loaded** |
| `rer-c-276139-393579` | Pontoise → Massy | 38 | **loaded** |
| `rer-c-276089-546192` | Montigny-Beauchamp → Pont-de-Rungis | 30 | **loaded** |
| `rer-c-393033-393843` | Invalides → St-Quentin | 13 | **loaded** |
| `rer-c-393579-547026` | Massy → Austerlitz Banlieue | 13 | **loaded** |
| `rer-c-393033-540179` | Invalides → Dourdan-la-Forêt | 20 | **loaded** |

Rollup C : **33 562** · monthly **297 223** · dominant budget.

---

## RER A ouest · `tct=TBA` · IDFM:C01742 · **partial** · **loaded** (2)

| corridor_id | axe | stops | status |
|-------------|-----|-------|--------|
| `rer-a-382655-758029` | Cergy-le-Haut ↔ Nanterre-Préf. (jalons → Houilles) | 9 | **loaded** |
| `rer-a-386573-758029` | Poissy ↔ Nanterre-Préf. (jalons → Houilles) | 5 | **loaded** |

**Exclu:** A est / sud (RATP) — `impossible`.  
Nanterre-Préfecture = terminus virtuel (0 jalon ART).

Rollup A : **2 499** · monthly **27 769**.

---

## RER B nord · `tct=TBB` · IDFM:C01743 · **partial** · **loaded** (6)

| corridor_id | axe | stops | status |
|-------------|-----|-------|--------|
| `rer-b-001479-758607` | CDG 2 → Châtelet | 13 | **loaded** |
| `rer-b-271528-758607` | Mitry-Claye → Châtelet | 12 | **loaded** |
| `rer-b-271460-758607` | CDG 1 → Châtelet | 12 | **loaded** |
| `rer-b-001479-271031` | CDG 2 → Paris-Nord-Surface | 12 | **loaded** |
| `rer-b-271411-758607` | Aulnay → Châtelet | 8 | **loaded** |
| `rer-b-271486-758607` | Parc-des-Expositions → Châtelet | 11 | **loaded** |

**Exclu:** B sud — `impossible`.

Rollup B : **11 516** · monthly **116 458**.

---

## Budget mesuré

| Ligne | Corridors loaded | Monthly | Rollup | Note |
|-------|------------------|---------|--------|------|
| D | 7 | 65 k | 7.1 k | Melun golden OK |
| E | 5 | 68 k | 6.9 k | |
| C | 8 | 297 k | 33.6 k | Dominant |
| B | 6 | 116 k | 11.5 k | Partial nord |
| A | 2 | 28 k | 2.5 k | Partial ouest |
| **Σ** | **28** | **575 k** | **62 k** | **DB 160 Mo** |

Alert 400 Mo / free ~0.5 Go — **marge OK** avant Transilien.

---

## Exclus (grain honesty)

- RER A est / A sud  
- RER B sud  
- Transilien (après mesure budget)  
- Tram-trains / navette  

---

## Next

1. Transilien ETL — un `tct` à la fois · STOP si Neon → 300–350 Mo.  
2. Human spot-check multi-OD before `DATA_PUBLIC=true`.  
3. Phase 3b browse pages (optional) — home pills déjà en place.