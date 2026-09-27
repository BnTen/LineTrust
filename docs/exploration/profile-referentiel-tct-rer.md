# Profile — ART `referentiel_tct-ui.csv` (RER + Transilien)

**Date:** 2026-09-27  
**Agent:** schema-profiler  
**Input:** `data/raw/art/referentiel_tct-ui.csv` (1 103 rows, semicolon-separated)  
**Machine-readable dump:** `docs/exploration/profile-referentiel-tct-rer.json` (regenerable via `scripts/profile-referentiel-tct-rer.py`)  
**Cross-refs:** `docs/exploration/art-circulations-discovery.md`, `docs/exploration/profile-idfm-gtfs.md`

---

## Scope & limits

- Referentiel = **lookup table** mapping `tct` (type de circulation train) + `ui` (unité d'infrastructure) → human labels used in ART circulations CSV (`lib_tct`).
- One row per `(tct, ui, annee)` combination — 9 years (2017–2025) for most IDFM lines.
- **Authoritative filter for MVP rail:** `activite = "Transilien et RER"` → **19 distinct `tct` codes**, **159 rows**.
- Broader keyword filter (RER / Transilien / Île-de-France in any column) catches **203 rows** including TET night trains (false positives via "Paris" in route names) — do **not** use for ETL.
- Tram-trains (T4, T11–T13) and navette (TCC) share the same `activite` but are **out of MVP** RER/Transilien corridor scope.

---

## Columns (referentiel)

| name | dtype | null% | distinct | notes |
|------|-------|-------|----------|-------|
| `tct` | string | 0 | 137 | 3-letter circulation type code — **stable join key** to circulations CSV |
| `ui` | string | 0 | 20 | Infrastructure unit; IDFM conventional rail = **1287** (SNCF-Transilien) |
| `lib_tct` | string | 0 | 252 | Long label echoed in circulations; **renamed 2021** (STIF → IDFM wording) |
| `lib_ui` | string | 0 | 30 | e.g. `SNCF-Transilien` / `SNCF-TRANSILIEN` (case drift) |
| `annee` | string | 0 | 9 | 2017–2025 |
| `activite` | string | 0 | 5 | MVP rows: `Transilien et RER` |
| `categorie` | string | 0 | 2 | All IDFM rows: `Service conventionné` |
| `autorite_organisatrice` | string | 23.4 | 13 | Populated from 2021+ (`Île-de-France`) |
| `nom_commercial_service_regional` | string | 23.4 | 14 | All IDFM rows: `Train Transilien` |

### Examples (≤5)

```csv
tct;ui;lib_tct;annee;activite;categorie;nom_commercial_service_regional
TBA;1287;Train transport Ile-de-France Mobilités à charge, ligne A du RER;2024;Transilien et RER;Service conventionné;Train Transilien
TBQ;1287;Train transport Ile-de-France Mobilités à charge, ligne U;2024;Transilien et RER;Service conventionné;Train Transilien
TBW;1287;Train transport Ile-de-France Mobilités à charge, ligne V;2025;Transilien et RER;Service conventionné;Train Transilien
TWN;1287;Tram-Train transport Ile-de-France Mobilités à charge, ligne T11;2024;Transilien et RER;Service conventionné;Train Transilien
```

---

## Inventory summary

| bucket | distinct `tct` | rows | MVP? |
|--------|----------------|------|------|
| RER A–E | 5 (`TBA`–`TBE`) | 45 | yes (A/B partial in circulations) |
| Transilien H,J,K,L,N,P,R,U,V | 9 (`TBL`–`TBW`*) | 83 | yes (*`TBW` from 2024 only) |
| Tram-train T4,T11–T13 | 4 (`TWT`,`TWN`,`TWP`,`TWV`) | 35 | **exclude** |
| Navette ferroviaire | 1 (`TCC`) | 3 | **exclude** |
| TET false positives (noise) | 8 | 44 | **exclude** |

All MVP rows use `ui = 1287` except `TBT`/`TWN`/`TWT` which also appear under `ui = 9178` from 2024, and tram-trains under `9165`/`9183`.

---

## RER `tct` map

| tct | lib_tct excerpt (2024) | short | IDFM line id | coverage_expectation |
|-----|------------------------|-------|--------------|----------------------|
| TBA | … ligne A du RER | A | IDFM:C01742 | **partial** — ouest only (Nanterre-Préfecture → Poissy/Cergy); est/sud RATP absent |
| TBB | … ligne B du RER | B | IDFM:C01743 | **partial** — nord from Gare du Nord; sud absent |
| TBC | … ligne C du RER | C | IDFM:C01727 | **full** |
| TBD | … ligne D du RER | D | IDFM:C01728 | **full** |
| TBE | … ligne E du RER | E | IDFM:C01729 | **full** |

Legacy `lib_tct` (2017–2020): `Train Transilien à charge, ligne {A–E} du RER`.

---

## Transilien `tct` map

| tct | lib_tct excerpt (2024) | short | IDFM line id | coverage_expectation |
|-----|------------------------|-------|--------------|----------------------|
| TBN | … ligne H | H | IDFM:C01737 | **full** |
| TBS | … ligne J | J | IDFM:C01739 | **full** |
| TBV | … ligne K | K | IDFM:C01738 | **full** |
| TBR | … ligne L | L | IDFM:C01740 | **full** |
| TBM | … ligne N | N | IDFM:C01736 | **full** |
| TBT | … ligne P | P | IDFM:C01730 | **full** |
| TBL | … ligne R | R | IDFM:C01731 | **full** |
| TBQ | … ligne U | U | IDFM:C01741 | **full** |
| TBW | … ligne V | V | IDFM:C02711 | **full** (referentiel from **2024** only) |

### Legacy geographic labels (2017–2020 → 2021+ letter)

| tct | pre-2021 lib_tct (geographic) | post-2021 lib_tct (letter) |
|-----|-------------------------------|----------------------------|
| TBL | ligne Paris-Gare de Lyon | ligne R |
| TBM | ligne Paris-Montparnasse | ligne N |
| TBN | ligne Ouest-Paris-Nord | ligne H |
| TBQ | ligne Saint-Quentin à La Défense | ligne U |
| TBR | ligne PSL (groupes 2, 3) | ligne L |
| TBS | ligne PSL (groupes 4, 5, 6) | ligne J |
| TBT | ligne Paris-Est | ligne P |
| TBV | ligne Paris-Nord - Crépy-en-Valois | ligne K |

**Note:** `tct` code is stable; only `lib_tct` wording changed. ETL should map via `tct`, not parse `lib_tct`.

---

## Tram-train & navette (same activite, out of MVP)

| tct | lib_tct excerpt | short | IDFM | notes |
|-----|-----------------|-------|------|-------|
| TWT | … ligne T4 | T4 | — | Tram-train; legacy label "ligne Paris-Est" pre-2021 |
| TWN | … ligne T11 | T11 | — | Tram Express Nord; legacy label pre-2021 |
| TWP | … ligne T12 | T12 | — | from 2022; `ui` 9165/9183 |
| TWV | … ligne T13 | T13 | — | from 2021 |
| TCC | … navette ferroviaire | — | — | from 2023; no letter mapping |

---

## Anomalies / year drift

### 1. lib_tct rename (2020 → 2021) — all 14 MVP lines

- **Before 2021:** `Train Transilien à charge, …`
- **From 2021:** `Train transport Ile-de-France Mobilités à charge, …`
- Affects **all** RER + Transilien `tct` codes. **`tct` unchanged** — safe join key.

### 2. Transilien geographic → letter labels (2020 → 2021)

Eight Transilien codes switched from geographic/PSL group names to letter codes (see table above). Same `tct`, different `lib_tct`.

### 3. New codes by year

| tct | first year | note |
|-----|------------|------|
| TBW | 2024 | Transilien V enters referentiel |
| TCC | 2023 | Navette ferroviaire |
| TWP | 2022 | Tram-train T12 |
| TWV | 2021 | Tram-train T13 |

### 4. Dual `ui` on same `(tct, annee)`

| tct | years | ui values | note |
|-----|-------|-----------|------|
| TBT | 2024–2025 | 1287, 9178 | Same lib_tct; second UI likely infrastructure split |
| TWN | 2024–2025 | 1287, 9178 | Tram-train T11 |
| TWT | 2024–2025 | 1287, 9178 | Tram-train T4 |

ETL: prefer `ui = 1287` for consistency with other IDFM lines unless circulations data shows otherwise.

### 5. lib_ui case drift

`SNCF-Transilien` vs `SNCF-TRANSILIEN` — cosmetic only.

### 6. False-positive filter noise (8 tct)

TET night trains (`LBF`, `LBH`, `LCF`, `LCH`, `NBM`, `NBS`, `NCM`, `NCS`) matched broad "Paris" / Île-de-France keyword filter but have `activite = TET`. **Exclude** from IDFM ETL.

### 7. Ambiguous

| tct | issue |
|-----|-------|
| TCC | No commercial letter — navette ferroviaire; exclude from line mapping |

---

## Mapping reco (for `scale-rer-coverage.md` / ETL)

### Primary join

```
circulations.lib_tct  ←→  referentiel.lib_tct   (fragile: text drift)
circulations.tct      ←→  referentiel.tct       (preferred: stable 3-letter code)
```

Build a static **`tct → shortname → IDFM:C0xxxx`** lookup from this profile; do not regex-parse `lib_tct` at runtime.

### Recommended static map (MVP)

```typescript
const ART_TCT_TO_LINE: Record<string, { short: string; idfm: string; coverage: "full" | "partial" }> = {
  TBA: { short: "A", idfm: "C01742", coverage: "partial" },
  TBB: { short: "B", idfm: "C01743", coverage: "partial" },
  TBC: { short: "C", idfm: "C01727", coverage: "full" },
  TBD: { short: "D", idfm: "C01728", coverage: "full" },
  TBE: { short: "E", idfm: "C01729", coverage: "full" },
  TBN: { short: "H", idfm: "C01737", coverage: "full" },
  TBS: { short: "J", idfm: "C01739", coverage: "full" },
  TBV: { short: "K", idfm: "C01738", coverage: "full" },
  TBR: { short: "L", idfm: "C01740", coverage: "full" },
  TBM: { short: "N", idfm: "C01736", coverage: "full" },
  TBT: { short: "P", idfm: "C01730", coverage: "full" },
  TBL: { short: "R", idfm: "C01731", coverage: "full" },
  TBQ: { short: "U", idfm: "C01741", coverage: "full" },
  TBW: { short: "V", idfm: "C02711", coverage: "full" },
};
```

### ETL filter (IDFM partition)

1. Keep rows where `tct ∈ keys(ART_TCT_TO_LINE)`.
2. Drop tram-trains (`TWN`,`TWP`,`TWT`,`TWV`), navette (`TCC`).
3. Apply **coverage flags** on A/B when joining to GTFS stops (ouest/nord only).
4. When filtering referentiel for validation, use `activite = "Transilien et RER"` AND `ui = "1287"` (primary).

### Coverage alignment with circulations partition

| short | referentiel | ART IDFM circulations (S6) |
|-------|-------------|----------------------------|
| A | TBA present | partial (ouest) |
| B | TBB present | partial (nord) |
| C,D,E | present | full |
| H,J,K,L,N,P,R,U | present | full |
| V | TBW (2024+) | confirm in 2024 circulations sample |

All **14 MVP lines** have referentiel entries. Absent RER branches (A est/sud, B sud) are a **circulations partition** limit, not a referentiel gap.

---

## Regeneration

```bash
python scripts/profile-referentiel-tct-rer.py
```
