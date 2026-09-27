# Scale — couverture RER / Transilien & budget Neon

**Phase:** S0–S2 (cartographie → ETL → UI multi-lignes) · **gate humaine S0 signée 2026-09-27**  
**Branche:** `feat/scale-rer-network` → merge `main`  
**Status:** ✅ S0 · ✅ S1 schéma + ETL 2024 A–E · ✅ **S2 UI** (home pills + trajet `?line=`) · `noindex`  
**Profilers:** `profile-referentiel-tct-rer.md` · `profile-art-scale-tct.md`  
**Neon mesuré (2026-09-27):** **160 Mo** DB · monthly **575 k** · rollup **62 k** · headroom ≪ 400 Mo

---

## Gate humaine — décisions signées (2026-09-27)

| # | Décision | Choix humain |
|---|----------|--------------|
| 1 | Score A→B | **1 score par ligne** (`line_id` / `tct` dans la clé agg) |
| 2 | Matérialisation | **Corridors / branches** (modèle Melun) — pas de mesh all-pairs ligne |
| 3 | Ordre de charge | Melun conservé → **RER E (tous corridors)** → **autres branches D (toutes)** → **RER C par branche (toutes)** → **A ouest + B nord** (incomplets mais **voulus**) → Transilien plus tard |
| 4 | Pruning DB | **Oui** (n≥30 + drop nuit 01:00–04:30) — rester sur Neon free / ≪ 400 Mo |
| 5 | Corridors | Si une ligne a **plusieurs** corridors → **tous** intégrés (pas un seul pilote par ligne) |

---

## Verdict S0 (1 phrase)

ART IDFM couvre **14 lignes RER/Transilien** (A/B **partielles**) ; budget → **corridors/branches + `line_id` + pruning** ; charge RER E puis D/C/A/B (tous les corridors de chaque ligne).

---

## 1. Couverture ART IDFM (grain honesty)

| Statut | Lignes / branches | UI product |
|--------|-------------------|------------|
| **Couvert (complet)** | RER **C, D, E** · Transilien **H, J, K, L, N, P, R, U, V** | Peut être searchable / scoreable après ETL |
| **Partiel** | RER **A ouest** (Nanterre-Préfecture → Poissy / Cergy) · RER **B nord** (depuis Gare du Nord) | Exposer **uniquement** le sous-réseau présent ; copy « couverture partielle » |
| **Absent** | RER **A est / sud** (RATP) · RER **B sud** | **Ne pas** promettre / ne pas indexer / ne pas inventer |
| **Hors MVP scale** | Tram-trains T4/T11/T12/T13 · navette `TCC` (référentiel sans jalons ou hors scope) | Exclus |

Sources : `art-circulations-discovery.md` + stream 2023/2024 (`profile-art-scale-tct.md`).

---

## 2. Mapping `art_tct` ↔ short ↔ IDFM

Join **via `tct`** (stable) — pas via `lib_tct` (rename 2021 STIF→IDFM).

| tct | short | IDFM line_id | Couverture ART | jalons 2024 | stations jalon | OD endpoints |
|-----|-------|--------------|----------------|-------------|----------------|--------------|
| TBA | A | C01742 | **partial** ouest | 1.22 M | 11 | 54 |
| TBB | B | C01743 | **partial** nord | 3.20 M | 35 | 146 |
| TBC | C | C01727 | full | 7.58 M | 86 | 824 |
| TBD | D | C01728 | full | 5.31 M | 82 | 466 |
| TBE | E | C01729 | full | 2.36 M | 25 | 208 |
| TBN | H | C01737 | full | 3.32 M | 51 | 167 |
| TBS | J | C01739 | full | 3.06 M | 62 | 227 |
| TBV | K | C01738 | full | 0.17 M | 19 | 22 |
| TBR | L | C01740 | full | 3.79 M | 38 | 207 |
| TBM | N | C01736 | full | 1.85 M | 36 | 102 |
| TBT | P | C01730 | full | 1.09 M | 56 | 127 |
| TBL | R | C01731 | full | 0.74 M | 56 | 50 |
| TBQ | U | C01741 | full | 0.47 M | 26 | 58 |
| TBW | V | C02711 | full (2024+) | 14 k | 7 | 2 |

Détail référentiel : `profile-referentiel-tct-rer.md`.  
Filter ETL : `tct ∈ {TBA…TBE, TBL…TBW}` ; `ui=1287` préféré ; exclure tram/navette.

---

## 3. Cardinalités & modèle agg

### Grain actuel (MVP Melun)

```
agg_pair_window:        (from, to, day_type, window_30m, month)  — sans line_id
agg_pair_window_rollup: (from, to, day_type, window_30m)
```

Melun charge les **paires du corridor** (~17 stops, y compris intermédiaires), pas seulement hub↔terminus.

### Collision OD multi-lignes (mesurée 2024)

| Métrique | Valeur |
|----------|--------|
| OD endpoints distincts (tous tct) | 2 597 |
| Partagés par ≥2 `tct` | **81 (3.1 %)** |
| Exemples | A↔L (ouest) · B↔D · B/H/K (axe Creil) |

**Décision proposée (S1) :** stratégie **B** — ajouter `line_id` (ou `art_tct`) à la PK agg.

| Stratégie | Clé | Pros | Cons |
|-----------|-----|------|------|
| **A — OD global** | `(from,to,day,window[,month])` | Plus compact si 0 collision | **Unsafe** : 3 % endpoints déjà partagés ; hubs (Lyon, Nord, Châtelet) empirent en all-pairs |
| **B — par ligne** ✅ | `(line_id,from,to,day,window[,month])` | Scores honnêtes par ligne ; ETL parallèle | +taille ≈ somme des lignes (pas de dédup cross-line) |

Justification durable : section 3 de ce doc + `profile-art-scale-tct.md` § OD collision.

---

## 4. Projection stockage Neon

### Calibration réelle (pas théorique)

| Scope | Rows monthly | Rows rollup | Taille tables | DB |
|-------|--------------|-------------|---------------|-----|
| **MVP Melun (prod)** | 225 818 | 18 982 | ~55 Mo | **62 Mo** |

Extrapolations ci-dessous = **upper-bound all-pairs@10 % densité** (profil scale) **vs** **corridor-scoped calibré Melun**.

### (a) Tous RER couverts (A-ouest + B-nord + C + D + E)

| Mode | Monthly @10 % densité | + n≥30 + no overnight | Commentaire |
|------|----------------------|------------------------|-------------|
| All-pairs mesh | ~548 Mo | **~234 Mo** | Sous 400 Mo **seulement** avec double prune ; C+D dominent (~230 Mo chacun @10 %) |
| Corridor/branch (modèle Melun) | — | **≪ 250 Mo** estimé | N corridors × ~40–80 Mo ; **recommandé** |

### (b) RER + Transilien

| Mode | @10 % | Double prune | Alert 400 Mo |
|------|-------|--------------|--------------|
| All-pairs | ~1 109 Mo | **~474 Mo** | **Dépassement** / limite |
| Corridor-scoped | — | dépend du # corridors | Viable si sélection humaine |

### (c) Stratégies de pruning (ordre imposé mission)

1. **n ≥ N_min** (30) — ne persister que cellules utiles UX  
2. **Exclure 01:00–04:30** — ~15 % slots  
3. **Prioriser RER complets C/D/E** avant A/B partiels  
4. **Transilien après RER**  
5. **Jamais** raw ART dans Neon  

**Pruning additionnel critique (budget) :**

6. **Scope corridor / branche** (stop set) — comme Melun — **avant** mesh ligne entière  
7. **Rollup hot path** en priorité ; monthly optionnel / archivé  
8. **`line_id` dans PK** (stratégie B)

### Headroom vs 400 Mo

| Scénario | Neon | Gate |
|----------|------|------|
| Melun seul (historique) | 62 Mo | ✅ |
| **RER A–E corridor-scoped 2024 (mesuré)** | **160 Mo** | ✅ |
| + Transilien corridor-scoped (est.) | ~220–320 Mo | ⚠ mesurer ligne à ligne |
| RER all-pairs + double prune | ~234 Mo | ⚠ éviter |
| RER+Transilien all-pairs + prune | ~474 Mo | ❌ |

#### Mesure post-ETL 2024 (partition keys `2024-rer-*`)

| Slice | tct | Monthly cells | Rollup | Δ DB approx |
|-------|-----|---------------|--------|-------------|
| D+E (déjà) | TBD+TBE | 133 171 | D 7.1k · E 6.9k | ~85–120 Mo |
| **+ C** | TBC | +297 223 | +33 562 | → **138 Mo** |
| **+ B nord** | TBB | +116 458 | +11 516 | → **155 Mo** |
| **+ A ouest** | TBA | +27 769 | +2 499 | → **160 Mo** |
| **Total** | A–E | **574 621** | **61 609** | **160 Mo** |

Tables : `agg_pair_window` ~133 Mo · `agg_pair_window_rollup` ~19 Mo.  
2e run / tct : **noop** (hash inchangé). Rétention 12 mois (≥2024-01).  
**STOP Transilien** si approche 300–350 Mo.

---

## 5. Ordre de chargement (signé)

| # | Slice | Pourquoi | Risque taille |
|---|-------|----------|---------------|
| 0 | **RER D Melun** | MVP green — ne pas casser | 62 Mo (fait) |
| 1 | **RER E — tous corridors** | Complet ART, petit | Faible |
| 2 | **RER D — toutes autres branches** | Réutilise `tct=TBD` | Moyen |
| 3 | **RER C — toutes branches** | Complet mais volumineux | Élevé |
| 4 | **RER A ouest + B nord** | Partiel — voulus quand même | Faible–moyen |
| 5 | **Transilien** | Après RER | Différé |

Watermarks : élargir `partition_key` ex. `art-idfm-2024-RER-E` / `…-rer-d-melun`.

---

## 6. Impacts schéma / ETL / UI (aperçu S1–S3 — **pas encore implémenté**)

| Couche | Changement | Contrainte |
|--------|------------|------------|
| `ref_lines` | Une ligne/branche ART réelle ; plusieurs `corridor_id` | Pas de faux « all RER » |
| `ref_stops` | Multi-lignes ; hubs partagés ; `code_ci` unique + aliases | Documenter alias (ex. Lyon `686006`→`686030`) |
| `agg_*` | PK + `line_id` | Migration versionnée ; Melun backfill `line_id=IDFM:C01728` |
| ETL | YAML/CLI `tct` + stop-set ; stream ; hash→replace | Idempotence ; quarantine |
| UI | Search multi-lignes ; pas promettre A est / B sud | `DATA_PUBLIC=false` / `noindex` |

---

## 7. Risques & anomalies

- **RER A — terminus virtuel** : `758029` (Nanterre-Préfecture) est OD commerciale ART mais **0 jalon** ; scores = paires entre jalons ouest (Cergy/Poissy → Houilles). Fix ETL : `match_corridors` accepte hub/end hors `stop_seq`.  
- **RER A** : 11 stations jalon → confirme absence est/sud.  
- **RER B** : 35 stations → nord only (hubs Châtelet / Nord-Surface).  
- **Corridors découverts** : densités OD auto (pas noms UX figés) — UI corridor picker = mission suivante.  
- **Watermark** : clé = `{year}-rer-{tcts triés}` — un `--tct` à la fois pour noop ; multi-tct ≠ même partition.  
- **TBW (V)** / Transilien / tram : hors scope ce slice.  
- Mars 2023 dip RER D — hors rétention 12 mois (2024 only).

---

## 8. Checklist gate humaine (S0)

- [x] **Stratégie B** (`line_id` dans PK agg) — signé  
- [x] **Corridor/branch-scoped** — signé  
- [x] **Ordre** Melun → E (tous) → D branches (toutes) → C branches (toutes) → A ouest + B nord — signé  
- [x] **Pruning** n≥30 + overnight — signé (budget Neon free)  
- [x] **Tous les corridors** d’une ligne — signé  
- [x] **Transilien** différé après RER A/B — implicite ordre §3  
- [x] **UI** : ne jamais lister A est / B sud — grain honesty inchangée

---

## Artifacts

| Fichier | Rôle |
|---------|------|
| `docs/exploration/profile-referentiel-tct-rer.md` + `.json` | Map tct officielle |
| `docs/exploration/profile-art-scale-tct.md` + `.json` | Cardinalités + Mo théoriques |
| `docs/exploration/data-capability-matrix.md` | Statuts par ligne (maj S0) |
| `scripts/profile-referentiel-tct-rer.py` | Régénération référentiel |

**Raw ART reste hors Neon / hors git.**
