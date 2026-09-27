# Phase E — Source whitelist (IDF)

**Status:** downloaded + profiled (2026-09-27)  
**Date:** 2026-09-27  
**Rule:** download only listed sources into `data/raw/` (gitignored). No raw in Neon / git.  
**On disk:** `data/raw/sncf/*`, `data/raw/idfm/*`, `data/raw/MANIFEST.sha256` (~145 Mo).

## Candidate sources (MVP)

| # | Source | Role | Expected grain | Licence | Cadence | Download |
|---|--------|------|----------------|---------|---------|----------|
| S1 | **Régularité mensuelle Transilien** (SNCF) | Primary punctuality KPI for RER/Transilien | **line × month** (voyageurs &lt;5 min) — *not* OD / window / train | ODbL | Monthly | [data.gouv](https://www.data.gouv.fr/datasets/regularite-mensuelle-transilien) · CSV via `ressources.data.sncf.com` dataset `ponctualite-mensuelle-transilien` |
| S2 | **Régularité mensuelle TER** (SNCF) | Context TER (région agrégée) | **région × month** (terminus &lt;5 min) — *no* ligne TER | ODbL | Monthly | [data.gouv](https://www.data.gouv.fr/datasets/regularite-mensuelle-ter-sncf) · `regularite-mensuelle-ter` |
| S3 | **Gares de voyageurs** (SNCF G&C) | Station refs + UIC / trigramme | Station master | ODbL | Ongoing | [data.gouv](https://www.data.gouv.fr/datasets/gares-de-voyageurs-1) · `gares-de-voyageurs` |
| S4 | **Arrêts et lignes associées** (IDFM) | Line ↔ stop join (IDFM ids) | Stop × line | ODbL (FR) | Daily | [IDFM](https://data.iledefrance-mobilites.fr/explore/dataset/arrets-lignes/) · `arrets-lignes` |
| S5 | **Offre horaires TC GTFS** (IDFM Datahub) | Theoretical schedule for corridors / windows / direction | Theoretical only (not observed delays) | **Licence Mobilité** (GTFS theoretical) — see PRIM | 3×/day | [IDFM](https://data.iledefrance-mobilites.fr/explore/dataset/offre-horaires-tc-gtfs-idfm/) · `offre-horaires-tc-gtfs-idfm` |
| **S6** | **ART circulations ferroviaires** (Infocentre SNCF Réseau) | **Primary facts for delays** — train × gare × théorique/observé | Circulation × jalon × timestamp (2017–2025) | **Licence Ouverte Etalab** | Annual dump (~10 Go full; IDFM ~0.5 Go/an zip) | https://ftp.autorite-transports.fr/circulations_ferroviaires.zip — see `art-circulations-discovery.md` |
| S7 | AlertesRER circulations IDF (data.gouv) | Proof-of-grain only | Train × day × retards (2019–2020 only) | LOV2 | Frozen | Community; **not** ETL MVP |

## Explicitly out of MVP whitelist (for now)

| Source | Why deferred |
|--------|----------------|
| IDFM PDF tableaux ponctualité (axes mensuels) | Human-readable PDFs, not stable machine CSV; useful as **cross-check** only |
| GTFS-RT / SIRI live | Realtime ≠ historical reliability; out of product scope |
| TGV / Intercités regularity | Hors périmètre MVP IDF TER+Transilien+RER |
| Scraping opérateur / apps | Non open-data, fragile, legal risk |
| inventing train-level facts from line/month | Forbidden (grain honesty) |

## Licence / attribution checklist (pre-indexation)

- [x] SNCF Voyageurs — ODbL attribution for S1/S2 (+ share-alike on derived DB of same nature) — listed on `/mentions-legales`
- [x] SNCF Gares & Connexions — ODbL for S3 — listed on `/mentions-legales`
- [x] Île-de-France Mobilités — ODbL for S4; **Licence Mobilité** obligations for S5 GTFS (attribution + mobility licence terms on PRIM) — listed on `/mentions-legales`
- [x] Wording: indépendant, open data historique — **pas** service SNCF/RATP/IDFM
- [x] Page `/mentions-legales` lists this table (Phase 5)
- [ ] Human data validation before flipping `DATA_PUBLIC=true` / indexation

## Neon budget policy (reminder)

Neon ← refs (stations/lines mapped) + `agg_*` only.  
Raw S1–S5 stay in `data/raw/`. Alert if Neon ≫ ~400 Mo.

## Hypotheses to validate by profiling

1. S1 cannot support pair × sens × fenêtre 30 min → those KPIs = `proxy` or `impossible`.
2. S5 can support *which stations sit on which line / theoretical windows* but **not** observed TPR/TSR.
3. Honest MVP grain is likely **ligne × mois** (optionally disclosed as proxy for a corridor), or we must find another source before promising window scores.
