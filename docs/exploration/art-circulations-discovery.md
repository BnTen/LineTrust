# Discovery — ART circulations (vrai grain)

**Date:** 2026-09-27  
**Status:** downloaded IDFM 2023+2024 partitions; schema confirmed

## Clarification

La ponctualité SNCF **ligne × mois** (S1) couvre **les 13 lignes** RER/Transilien — pas seulement U.  
U était seulement un **corridor pilote** proposé faute de grain fin.

Le **vrai** jeu pour LineTrust est ailleurs.

## Source S6 — ART Infocentre circulations

| Field | Value |
|-------|--------|
| Publisher | Autorité de régulation des transports (ART) |
| URL (full ~10 Go) | https://ftp.autorite-transports.fr/circulations_ferroviaires.zip |
| Page | https://www.autorite-transports.fr/observatoire-et-numerique/jeux-de-donnees-en-open-data/ |
| Licence | **Licence Ouverte Etalab** |
| Origin | SNCF Réseau Infocentre-circulations (décision ART 2019-020) |
| Period | 2017 → 2025 |
| Local | `data/raw/art/idfm_annuel_2023.zip`, `idfm_annuel_2024.zip`, `lisezmoi.md`, `referentiel_tct-ui.csv` |

### Partitions utiles

| Partition | Contenu |
|-----------|---------|
| **IDFM** (~0.4–0.7 Go/an compressé, ~10 Go CSV/an) | Transilien **complet** · RER **C, D, E** · RER **B nord** (depuis Gare du Nord) · RER **A ouest** (Nanterre-Préfecture → Poissy / Cergy) |
| TER / TET / SLO | Hors ou adjacent au pilote IDF |

### Grain (confirmé sur `idfm_annuel_2024.csv`)

Une ligne = **1 jalon** (arrivée ou départ) d’**une circulation** à **une gare** :

- `date_circ`, `id_circ`, `num_marche`
- origine / destination (`code_ci_*` = 6 derniers chiffres UIC)
- `lib_ci_jalon`, `type_horaire` (A/D/P)
- `dh_the_jalon` (théorique) · `dh_obs_jalon` (observé) · `dh_est_jalon` (estimé si obs manquant)
- `lib_tct` porte l’identité de ligne (ex. « … ligne A du RER »)

→ On peut dériver **retard à la gare**, **paire A→B orientée**, **fenêtre 30 min**, **ouvré/WE**, **n° de marche**.

### Limites honnêtes

- Pas tout le RER A (branches RATP est/sud absentes) ni RER B sud.
- CSV ~10 Go/an → **stream only** ; Neon = agg uniquement.
- Annulations : à dériver (circulation absente / jalons manquants) — pas un champ booléen simple.
- `dh_est_jalon` ≠ observation : quarantine / flag si on l’utilise.

## Source S7 — AlertesRER (communautaire, obsolète)

[data.gouv — circulations quotidiennes IDF](https://www.data.gouv.fr/datasets/details-des-circulations-quotidiennes-des-trains-sncf-dile-de-france-rer-et-transiliens)  
Grain fin (mission, heure, retards par gare, ouvré/WE) mais **figé 2019–début 2020**, producteur tiers. Utile comme preuve de concept seulement — **pas** source ETL MVP.

## Impact matrice (révision)

| KPI | Avant (S1 seul) | Avec ART S6 |
|-----|-----------------|-------------|
| Score A→B × fenêtre 30 min | impossible | **calculable** (à valider ETL) |
| B→A indépendant | impossible | **calculable** |
| Ouvré / WE | impossible | **calculable** |
| Alternative ±30 min | impossible | **calculable** (comparer cellules fenêtre) |
| N° train / marche | impossible | **proxy/calculable** via `num_marche` |
| Browse ligne | calculable S1 | calculable S6 + S1 cross-check |

## Next (avant Phase 2)

1. Sous-agent schema-profiler sur échantillon IDFM filtré Transilien U (ou corridor choisi) — cardinalités, % `dh_obs` null, jointure UIC.
2. Recaler corridor pilote (U toujours bon ; RER E ou D aussi viables avec couverture ART pleine).
3. Réécrire `data-capability-matrix.md` + gate humaine.
