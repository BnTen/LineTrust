# RER D — station map & ART join keys

**Date:** 2026-09-27  
**Agent:** explorer-data (secondary pass)  
**Sources (on disk):** `arrets-lignes.csv`, `gares-de-voyageurs.csv`, ART `idfm_annuel_2024.zip` (stream sample only)

---

## Route identity

| Field | Value |
|-------|-------|
| **route_id** (GTFS / arrets `id`) | `IDFM:C01728` |
| **shortname** | `D` |
| **mode** | `RapidTransit` |
| **operator** | SNCF |
| **Distinct stops** (arrets-lignes) | **59** |
| ART filter (`lib_tct`) | `… ligne D du RER` (referentiel `tct=TBD`, `ui=1287`) |

Single route_id — no multi-`route_id` disambiguation needed (unlike some TER rows).

---

## Branch sketch (from stop names + geography)

RER D is a **Y + fork** network; `arrets-lignes` is unordered membership, not sequence.

```
                    [nord-Creil]
Gare du Nord ── Saint-Denis ── Stade de France ── … ── Orry-la-Ville ── Creil
       │
       └── (via Châtelet) ── Gare de Lyon ── [sud-commun trunk]
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
              [sud-Melun]              [sud-Corbeil]            (Créteil Pompadour
           Melun ← … ← Juvisy         Corbeil ← Juvisy          — southern stub)
                    │                         │
                    │                    [sud-Malesherbes]
                    │                    Malesherbes ← … ← Corbeil
```

| Branch tag | Representative stops |
|------------|---------------------|
| **spine** | Gare du Nord, Saint-Denis, Stade de France, Châtelet - Les Halles, Gare de Lyon |
| **nord-Creil** | Pierrefitte, Garges, Goussainville, Orry-la-Ville, Chantilly, Creil, … |
| **sud-commun** | Maisons-Alfort, Villeneuve-Saint-Georges, Juvisy, Évry, Brunoy, Yerres, … |
| **sud-Melun** | Combs-la-Ville, Lieusaint, Melun, Boissise-le-Roi, Ponthierry, … |
| **sud-Corbeil** | Corbeil-Essonnes, Mennecy, Villabé, Essonnes Robinson, … |
| **sud-Malesherbes** | Malesherbes, Ballancourt, Boutigny, La Ferté-Alais, … |

---

## Station list (59) — IDFM stop + ART `code_ci`

`code_ci` = last 6 digits of SNCF `codes_uic` (8-digit). Join key to ART `code_ci_jalon` / `code_ci_origine` / `code_ci_destination`.

| stop_name | stop_id | code_ci | UIC (8-digit) | branch |
|-----------|---------|---------|---------------|--------|
| Ballancourt | IDFM:monomodalStopPlace:43087 | 681437 | 87681437 | sud-Malesherbes |
| Boigneville | IDFM:monomodalStopPlace:43092 | 684407 | 87684407 | sud-Malesherbes |
| Boissise-le-Roi | IDFM:monomodalStopPlace:45763 | 682518 | 87682518 | sud-Melun |
| Boussy-Saint-Antoine | IDFM:monomodalStopPlace:47924 | 682138 | 87682138 | sud-commun |
| Boutigny | IDFM:monomodalStopPlace:47895 | 681478 | 87681478 | sud-Malesherbes |
| Brunoy | IDFM:monomodalStopPlace:58873 | 682120 | 87682120 | sud-commun |
| Buno - Gironville | IDFM:monomodalStopPlace:43102 | 681510 | 87681510 | sud-Malesherbes |
| Cesson | IDFM:monomodalStopPlace:42516 | 682161 | 87682161 | sud-Melun |
| Chantilly - Gouvieux | IDFM:monomodalStopPlace:411428 | 276113 | 87276113 | nord-Creil |
| Châtelet - Les Halles | IDFM:monomodalStopPlace:45102 | **758607** | 87758607 | spine |
| Combs-la-Ville - Quincy | IDFM:monomodalStopPlace:45771 | 682146 | 87682146 | sud-Melun |
| Corbeil-Essonnes | IDFM:monomodalStopPlace:43115 | 681007 | 87681007 | sud-Corbeil |
| Creil | IDFM:monomodalStopPlace:411440 | 276006 | 87276006 | nord-Creil |
| Créteil Pompadour | IDFM:monomodalStopPlace:46286 | 608802 | 87608802 | sud stub |
| Essonnes Robinson | IDFM:monomodalStopPlace:45759 | 681601 | 87681601 | sud-Corbeil |
| Gare de Lyon | IDFM:monomodalStopPlace:470195 | 686030 | 87686030 | spine |
| Gare du Nord | IDFM:monomodalStopPlace:462394 | 271007 | 87271007 | spine / nord |
| Garges - Sarcelles | IDFM:monomodalStopPlace:43251 | 276196 | 87276196 | nord-Creil |
| Goussainville | IDFM:monomodalStopPlace:47876 | 276246 | 87276246 | nord-Creil |
| Grand Bourg | IDFM:monomodalStopPlace:45860 | 681353 | 87681353 | sud-Corbeil |
| Grigny Centre | IDFM:monomodalStopPlace:43132 | 681379 | 87681379 | sud-commun |
| Juvisy | IDFM:monomodalStopPlace:45739 | 545244 | 87545244 | sud-commun |
| La Borne Blanche | IDFM:monomodalStopPlace:411418 | 276287 | 87276287 | nord-Creil |
| La Ferté-Alais | IDFM:monomodalStopPlace:43142 | 681452 | 87681452 | sud-Malesherbes |
| Le Bras de Fer | IDFM:monomodalStopPlace:45850 | 681395 | 87681395 | sud-Corbeil |
| Le Coudray-Montceaux | IDFM:monomodalStopPlace:45824 | 681635 | 87681635 | sud-Corbeil |
| Le Mée | IDFM:monomodalStopPlace:45784 | 682179 | 87682179 | sud-Melun |
| Le Plessis Chenet | IDFM:monomodalStopPlace:45820 | 681627 | 87681627 | sud-Corbeil |
| Le Vert de Maisons | IDFM:monomodalStopPlace:464040 | 681247 | 87681247 | sud-commun |
| Les Noues | IDFM:monomodalStopPlace:47968 | 276238 | 87276238 | nord-Creil |
| Lieusaint - Moissy | IDFM:monomodalStopPlace:47669 | 682153 | 87682153 | sud-Melun |
| Louvres | IDFM:monomodalStopPlace:44628 | 276253 | 87276253 | nord-Creil |
| Maisons-Alfort - Alfortville | IDFM:monomodalStopPlace:43154 | 681155 | 87681155 | sud-commun |
| Maisse | IDFM:monomodalStopPlace:43156 | 681486 | 87681486 | sud-Malesherbes |
| Malesherbes | IDFM:monomodalStopPlace:411485 | 684415 | 87684415 | sud-Malesherbes |
| Melun | IDFM:monomodalStopPlace:47909 | 682005 | 87682005 | sud-Melun |
| Mennecy | IDFM:monomodalStopPlace:47899 | 681411 | 87681411 | sud-Corbeil |
| Montgeron - Crosne | IDFM:monomodalStopPlace:47684 | 682104 | 87682104 | sud-commun |
| Moulin Galant | IDFM:monomodalStopPlace:45761 | 681403 | 87681403 | sud-Melun |
| Orangis Bois de l'Épine | IDFM:monomodalStopPlace:48489 | 681346 | 87681346 | sud-commun |
| Orry-la-Ville - Coye | IDFM:monomodalStopPlace:411421 | 276279 | 87276279 | nord-Creil |
| Pierrefitte - Stains | IDFM:monomodalStopPlace:43179 | 271163 | 87271163 | nord-Creil |
| Ponthierry - Pringy | IDFM:monomodalStopPlace:45812 | 682526 | 87682526 | sud-Melun |
| Ris-Orangis | IDFM:monomodalStopPlace:47948 | 681338 | 87681338 | sud-commun |
| Saint-Denis | IDFM:monomodalStopPlace:412743 | 271015 | 87271015 | spine / nord |
| Saint-Fargeau | IDFM:monomodalStopPlace:45814 | 682542 | 87682542 | sud-Melun |
| Savigny-le-Temple - Nandy | IDFM:monomodalStopPlace:47665 | 682187 | 87682187 | sud-Melun |
| Stade de France Saint-Denis | IDFM:monomodalStopPlace:43204 | 164780 | 87164780 | spine / nord |
| Survilliers - Fosses | IDFM:monomodalStopPlace:47958 | 276261 | 87276261 | nord-Creil |
| Vigneux-sur-Seine | IDFM:monomodalStopPlace:45735 | 681304 | 87681304 | sud-commun |
| Villabé | IDFM:monomodalStopPlace:47904 | 681619 | 87681619 | sud-Corbeil |
| Villeneuve Triage | IDFM:monomodalStopPlace:46304 | 681809 | 87681809 | sud-commun |
| Villeneuve-Saint-Georges | IDFM:monomodalStopPlace:45067 | 681825 | 87681825 | sud-commun |
| Villiers-le-Bel - Gonesse - Arnouville | IDFM:monomodalStopPlace:43222 | 276220 | 87276220 | nord-Creil |
| Viry-Châtillon | IDFM:monomodalStopPlace:43225 | 681312 | 87681312 | sud-commun |
| Vosves | IDFM:monomodalStopPlace:47967 | 682500 | 87682500 | sud-Melun |
| Yerres | IDFM:monomodalStopPlace:43226 | 682112 | 87682112 | sud-commun |
| Évry - Courcouronnes | IDFM:monomodalStopPlace:47906 | 681387 | 87681387 | sud-commun |
| Évry - Val de Seine | IDFM:monomodalStopPlace:45745 | 681361 | 87681361 | sud-commun |

**Coverage check (2024 ART stream):** all 59 IDFM `code_ci` values appear in RER D circulations. ART also lists ~23 extra PR codes (e.g. `271023` Paris-Nord-Souterraine) not in passenger stop list — infra / pass-through jalons.

---

## Join recipe (IDFM ↔ gares ↔ ART)

```
arrets-lignes (shortname=D, mode=RapidTransit)
  stop_id ──────────────────────────► GTFS stops.stop_id (1:1)
  stop_name ──normalize──► gares-de-voyageurs.nom
                              │
                              └─ codes_uic (8-digit) ──► RIGHT(codes_uic, 6) = code_ci
                                                              │
ART idfm_annuel_*.csv (filter lib_tct ~ "ligne D du RER")
  code_ci_jalon | code_ci_origine | code_ci_destination ──────┘
  lib_ci_jalon (label cross-check; accents differ)
```

### Rules

1. **Primary UI key:** `IDFM:monomodalStopPlace:*` (`stop_id`) — stable for GTFS / search.
2. **ART facts key:** 6-digit `code_ci_*` = `RIGHT(codes_uic, 6)` per ART `lisezmoi.md` and SNCF gares spec.
3. **Name match:** strip accents, case-fold, hyphen/space normalize (`Châtelet - Les Halles` ↔ `Chatelet-les-Halles`). **58/59** auto-match gares; **Châtelet** absent from gares file → use ART-derived `758607` / UIC `87758607`.
4. **Multi-UIC gares** (`;`-separated, 12 rows): split and pick voyageur-facing UIC; none hit on this RER D list except verify at ETL.
5. **Hub aliases in ART:** `Gare de Lyon` IDFM → gares `Paris Gare de Lyon` (`686030`); ART may also label `686006` `Paris-Gare-de-Lyon` — same hub, distinct PR codes.
6. **Line filter in ART:** `lib_tct LIKE '%ligne D du RER%'` (not S1 `ligne=D` alone — that is monthly punctuality, line grain).

### Minimal SQL-shaped join (ETL sketch)

```sql
-- ref: idfm_rer_d_stops (59 rows from arrets-lignes)
SELECT art.*
FROM art_circulations art
JOIN idfm_rer_d_stops s ON art.code_ci_jalon = s.code_ci
WHERE art.lib_tct LIKE '%ligne D du RER%';
```

Oriented pair A→B: filter two jalons sharing `id_circ` with `rang` order, or aggregate by `(code_ci_origine, code_ci_destination, time_window)`.

---

## Honest limits

- Branch tags are **heuristic** (unordered arrets membership); use GTFS `stop_times` / shapes for sequence in Phase 2.
- No direct UIC in IDFM files — gares bridge required (`profile-idfm-gtfs.md`).
- `gares-de-voyageurs` has **no** row for Châtelet-Les-Halles; ART is authoritative for that `code_ci`.
- ART IDFM partition = **full RER D** coverage (per `art-circulations-discovery.md`).
