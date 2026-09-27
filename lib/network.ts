import { unstable_cache } from "next/cache";
import { getSql } from "@/lib/db";
import { CORRIDOR_STATIONS, type Station } from "@/lib/stations";

/** Default pilot — RER D Melun golden path. */
export const DEFAULT_LINE_SHORT = "D";
export const DEFAULT_LINE_ID = "IDFM:C01728";
export const DEFAULT_CORRIDOR_ID = "rer-d-melun";

export interface RerLine {
  lineId: string;
  short: string;
  /** Pill label, e.g. "D" or "A ouest". */
  pillLabel: string;
  displayName: string;
  coverage: "full" | "partial";
}

export interface CorridorMeta {
  corridorId: string;
  lineId: string;
  displayName: string;
  hubCodeCi: string | null;
  endCodeCi: string | null;
  coverage: "full" | "partial";
}

export interface NetworkCatalog {
  lines: RerLine[];
  corridors: CorridorMeta[];
  /** Stations keyed by corridor_id (status=loaded only). */
  stationsByCorridor: Record<string, Station[]>;
}

const SHORT_TO_LINE_ID: Record<string, string> = {
  A: "IDFM:C01742",
  B: "IDFM:C01743",
  C: "IDFM:C01727",
  D: "IDFM:C01728",
  E: "IDFM:C01729",
};

const LINE_ID_TO_SHORT: Record<string, string> = Object.fromEntries(
  Object.entries(SHORT_TO_LINE_ID).map(([s, id]) => [id, s]),
);

/** Preserve Melun MVP URL slugs + display names. */
const MELUN_BY_CI = new Map(
  CORRIDOR_STATIONS.map((s) => [s.codeCi, s] as const),
);

export function lineIdFromShort(short: string | null | undefined): string {
  if (!short) return DEFAULT_LINE_ID;
  const id = SHORT_TO_LINE_ID[short.trim().toUpperCase()];
  return id ?? DEFAULT_LINE_ID;
}

export function shortFromLineId(lineId: string): string {
  return LINE_ID_TO_SHORT[lineId] ?? "D";
}

export function slugifyStationName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function rowToStation(row: {
  stop_id: string;
  code_ci: string;
  name: string;
  name_display: string;
  sequence_order: number;
}): Station {
  const codeCi = String(row.code_ci).trim();
  const melun = MELUN_BY_CI.get(codeCi);
  if (melun) {
    return { ...melun, sequenceOrder: Number(row.sequence_order) };
  }
  const name = String(row.name);
  const nameDisplay = String(row.name_display || row.name);
  return {
    stopId: String(row.stop_id),
    codeCi,
    slug: slugifyStationName(nameDisplay || name || codeCi),
    name,
    nameDisplay,
    sequenceOrder: Number(row.sequence_order),
  };
}

function pillLabel(short: string, coverage: string): string {
  if (short === "A" && coverage === "partial") return "A ouest";
  if (short === "B" && coverage === "partial") return "B nord";
  return short;
}

async function fetchNetworkCatalog(): Promise<NetworkCatalog> {
  const sql = getSql();

  const lineRows = await sql`
    SELECT line_id, short_name, display_name, coverage
    FROM ref_lines
    WHERE network = 'rer'
    ORDER BY short_name
  `;

  const corridorRows = await sql`
    SELECT corridor_id, line_id, display_name, hub_code_ci, end_code_ci, coverage
    FROM ref_corridors
    WHERE status = 'loaded'
    ORDER BY line_id, display_name
  `;

  const stopRows = await sql`
    SELECT
      cs.corridor_id,
      s.stop_id,
      s.code_ci,
      s.name,
      s.name_display,
      cs.sequence_order
    FROM ref_corridor_stops cs
    JOIN ref_stops s ON s.stop_id = cs.stop_id
    JOIN ref_corridors c ON c.corridor_id = cs.corridor_id
    WHERE c.status = 'loaded'
    ORDER BY cs.corridor_id, cs.sequence_order
  `;

  const lines: RerLine[] = lineRows.map((r) => {
    const short = String(r.short_name).trim();
    const coverage = (r.coverage === "partial" ? "partial" : "full") as
      | "full"
      | "partial";
    return {
      lineId: String(r.line_id),
      short,
      pillLabel: pillLabel(short, coverage),
      displayName: String(r.display_name),
      coverage,
    };
  });

  const corridors: CorridorMeta[] = corridorRows.map((r) => ({
    corridorId: String(r.corridor_id),
    lineId: String(r.line_id),
    displayName: String(r.display_name),
    hubCodeCi: r.hub_code_ci ? String(r.hub_code_ci).trim() : null,
    endCodeCi: r.end_code_ci ? String(r.end_code_ci).trim() : null,
    coverage: (r.coverage === "partial" ? "partial" : "full") as
      | "full"
      | "partial",
  }));

  const stationsByCorridor: Record<string, Station[]> = {};
  for (const row of stopRows) {
    const cid = String(row.corridor_id);
    const station = rowToStation(
      row as {
        stop_id: string;
        code_ci: string;
        name: string;
        name_display: string;
        sequence_order: number;
      },
    );
    if (!stationsByCorridor[cid]) stationsByCorridor[cid] = [];
    stationsByCorridor[cid].push(station);
  }

  return { lines, corridors, stationsByCorridor };
}

export const getNetworkCatalog = unstable_cache(
  fetchNetworkCatalog,
  ["network-catalog-v1"],
  { revalidate: 3600, tags: ["refs", "agg"] },
);

export function corridorsForLine(
  catalog: NetworkCatalog,
  lineId: string,
): CorridorMeta[] {
  return catalog.corridors.filter((c) => c.lineId === lineId);
}

/** Union of stations for a line, optionally filtered to one corridor. Dedup by codeCi. */
export function stationsForSelection(
  catalog: NetworkCatalog,
  lineId: string,
  corridorId: string | null,
): Station[] {
  if (corridorId) {
    return [...(catalog.stationsByCorridor[corridorId] ?? [])];
  }
  const seen = new Map<string, Station>();
  for (const c of corridorsForLine(catalog, lineId)) {
    for (const s of catalog.stationsByCorridor[c.corridorId] ?? []) {
      if (!seen.has(s.codeCi)) seen.set(s.codeCi, s);
    }
  }
  return [...seen.values()].sort((a, b) =>
    a.nameDisplay.localeCompare(b.nameDisplay, "fr"),
  );
}

export function stationBySlugIn(
  stations: readonly Station[],
  slug: string,
): Station | undefined {
  return stations.find((s) => s.slug === slug);
}

/** Find a station by slug across the whole catalog. */
export function findStationBySlug(
  catalog: NetworkCatalog,
  slug: string,
): Station | undefined {
  const seen = new Set<string>();
  for (const list of Object.values(catalog.stationsByCorridor)) {
    for (const s of list) {
      if (seen.has(s.codeCi)) continue;
      seen.add(s.codeCi);
      if (s.slug === slug) return s;
    }
  }
  return undefined;
}

/** Prefer Melun corridor when both ends live there; else first corridor containing both. */
export function resolveCorridorForPair(
  catalog: NetworkCatalog,
  lineId: string,
  from: Station,
  to: Station,
  preferredCorridorId?: string | null,
): CorridorMeta | null {
  const candidates = corridorsForLine(catalog, lineId);
  if (preferredCorridorId) {
    const pref = candidates.find((c) => c.corridorId === preferredCorridorId);
    if (pref) {
      const stops = catalog.stationsByCorridor[pref.corridorId] ?? [];
      const codes = new Set(stops.map((s) => s.codeCi));
      if (codes.has(from.codeCi) && codes.has(to.codeCi)) return pref;
    }
  }
  if (lineId === DEFAULT_LINE_ID) {
    const melun = candidates.find((c) => c.corridorId === DEFAULT_CORRIDOR_ID);
    if (melun) {
      const stops = catalog.stationsByCorridor[melun.corridorId] ?? [];
      const codes = new Set(stops.map((s) => s.codeCi));
      if (codes.has(from.codeCi) && codes.has(to.codeCi)) return melun;
    }
  }
  for (const c of candidates) {
    const stops = catalog.stationsByCorridor[c.corridorId] ?? [];
    const codes = new Set(stops.map((s) => s.codeCi));
    if (codes.has(from.codeCi) && codes.has(to.codeCi)) return c;
  }
  return candidates[0] ?? null;
}

export function defaultPairForSelection(
  catalog: NetworkCatalog,
  lineId: string,
  corridorId: string | null,
): { from: Station; to: Station } | null {
  if (lineId === DEFAULT_LINE_ID && (!corridorId || corridorId === DEFAULT_CORRIDOR_ID)) {
    const melun = catalog.stationsByCorridor[DEFAULT_CORRIDOR_ID];
    if (melun && melun.length >= 2) {
      return { from: melun[0]!, to: melun[melun.length - 1]! };
    }
  }
  const stations = stationsForSelection(catalog, lineId, corridorId);
  if (stations.length < 2) return null;
  if (corridorId) {
    const ordered = catalog.stationsByCorridor[corridorId] ?? stations;
    if (ordered.length >= 2) {
      return { from: ordered[0]!, to: ordered[ordered.length - 1]! };
    }
  }
  return { from: stations[0]!, to: stations[stations.length - 1]! };
}

export function lineHeroCopy(line: RerLine, corridor: CorridorMeta | null): string {
  const lineBit =
    line.coverage === "partial"
      ? `RER ${line.pillLabel}`
      : `RER ${line.short}`;
  if (corridor) {
    const branch = corridor.displayName.replace(/^RER [A-E]\s*[—–-]\s*/i, "");
    return `Départ et arrivée sur le ${lineBit} · ${branch}. Fiabilité historique, créneau de 30 min.`;
  }
  const partial =
    line.coverage === "partial" ? " Couverture partielle." : "";
  return `Départ et arrivée sur le ${lineBit}.${partial} Fiabilité historique, créneau de 30 min.`;
}
