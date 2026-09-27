import { unstable_cache } from "next/cache";
import { getSql } from "@/lib/db";
import {
  DEFAULT_CORRIDOR_ID,
  DEFAULT_LINE_ID,
  type CorridorMeta,
  type NetworkCatalog,
} from "@/lib/network";
import type { Station } from "@/lib/stations";

/**
 * Oriented OD coverage from agg rollup (any day_type / window).
 * Layer 2: structural reachability — not créneau-specific.
 */
export interface OdCoverage {
  /** lineId → fromCodeCi → toCodeCi[] */
  edges: Record<string, Record<string, string[]>>;
}

export function emptyOdCoverage(): OdCoverage {
  return { edges: {} };
}

export function hasOdEdge(
  coverage: OdCoverage,
  lineId: string,
  fromCodeCi: string,
  toCodeCi: string,
): boolean {
  const outs = coverage.edges[lineId]?.[fromCodeCi];
  if (!outs) return false;
  return outs.includes(toCodeCi);
}

export function destinationsFrom(
  coverage: OdCoverage,
  lineId: string,
  fromCodeCi: string,
): ReadonlySet<string> {
  const outs = coverage.edges[lineId]?.[fromCodeCi];
  return new Set(outs ?? []);
}

/** Stations that can reach `toCodeCi` on this line. */
export function originsTo(
  coverage: OdCoverage,
  lineId: string,
  toCodeCi: string,
): ReadonlySet<string> {
  const line = coverage.edges[lineId];
  if (!line) return new Set();
  const origins = new Set<string>();
  for (const [from, tos] of Object.entries(line)) {
    if (tos.includes(toCodeCi)) origins.add(from);
  }
  return origins;
}

/** Stations that appear in at least one OD (as from or to) on the line. */
export function participatingStations(
  coverage: OdCoverage,
  lineId: string,
): ReadonlySet<string> {
  const line = coverage.edges[lineId];
  if (!line) return new Set();
  const codes = new Set<string>();
  for (const [from, tos] of Object.entries(line)) {
    codes.add(from);
    for (const to of tos) codes.add(to);
  }
  return codes;
}

export function corridorHasInternalOd(
  coverage: OdCoverage,
  lineId: string,
  stationCodes: readonly string[],
): boolean {
  const codeSet = new Set(stationCodes);
  const line = coverage.edges[lineId];
  if (!line || codeSet.size < 2) return false;
  for (const from of stationCodes) {
    const tos = line[from];
    if (!tos) continue;
    for (const to of tos) {
      if (codeSet.has(to)) return true;
    }
  }
  return false;
}

/** Loaded corridors that have at least one scored OD between their stops. */
export function corridorsWithOdData(
  catalog: NetworkCatalog,
  lineId: string,
  coverage: OdCoverage,
): CorridorMeta[] {
  return catalog.corridors.filter((c) => {
    if (c.lineId !== lineId) return false;
    const stations = catalog.stationsByCorridor[c.corridorId] ?? [];
    return corridorHasInternalOd(
      coverage,
      lineId,
      stations.map((s) => s.codeCi),
    );
  });
}

/** Lines that have at least one OD edge in rollup. */
export function linesWithOdData(
  catalog: NetworkCatalog,
  coverage: OdCoverage,
): NetworkCatalog["lines"] {
  return catalog.lines.filter((l) => {
    const edges = coverage.edges[l.lineId];
    if (!edges) return false;
    return Object.keys(edges).length > 0;
  });
}

/**
 * Pick a default A→B that has rollup data when possible.
 * Prefers corridor ends among participating stations, then any internal edge.
 */
export function defaultPairWithCoverage(
  catalog: NetworkCatalog,
  lineId: string,
  corridorId: string | null,
  coverage: OdCoverage,
): { from: Station; to: Station } | null {
  if (
    lineId === DEFAULT_LINE_ID &&
    (!corridorId || corridorId === DEFAULT_CORRIDOR_ID)
  ) {
    const melun = catalog.stationsByCorridor[DEFAULT_CORRIDOR_ID];
    if (melun && melun.length >= 2) {
      const from = melun[0]!;
      const to = melun[melun.length - 1]!;
      if (hasOdEdge(coverage, lineId, from.codeCi, to.codeCi)) {
        return { from, to };
      }
    }
  }

  const stations = corridorId
    ? [...(catalog.stationsByCorridor[corridorId] ?? [])]
    : (() => {
        const seen = new Map<string, Station>();
        for (const c of corridorsWithOdData(catalog, lineId, coverage)) {
          for (const s of catalog.stationsByCorridor[c.corridorId] ?? []) {
            if (!seen.has(s.codeCi)) seen.set(s.codeCi, s);
          }
        }
        return [...seen.values()];
      })();

  if (stations.length < 2) return null;

  const byCi = new Map(stations.map((s) => [s.codeCi, s] as const));
  const codes = stations.map((s) => s.codeCi);
  const line = coverage.edges[lineId] ?? {};

  function firstEdge(
    preferFromOrder: string[],
    preferToOrder: string[],
  ): { from: Station; to: Station } | null {
    for (const fromCi of preferFromOrder) {
      const tos = line[fromCi];
      if (!tos?.length) continue;
      for (const toCi of preferToOrder) {
        if (toCi === fromCi) continue;
        if (!tos.includes(toCi)) continue;
        const from = byCi.get(fromCi);
        const to = byCi.get(toCi);
        if (from && to) return { from, to };
      }
    }
    return null;
  }

  // Ends first (typical hub → terminus), then reverse order.
  const fromOrder = [...codes];
  const toOrder = [...codes].reverse();
  const ends = firstEdge(fromOrder, toOrder);
  if (ends) return ends;

  // Any internal edge (stable: earliest from, earliest listed to).
  for (const fromCi of codes) {
    const tos = line[fromCi];
    if (!tos?.length) continue;
    for (const toCi of tos) {
      const from = byCi.get(fromCi);
      const to = byCi.get(toCi);
      if (from && to) return { from, to };
    }
  }

  // Fallback without coverage (should be rare).
  return { from: stations[0]!, to: stations[stations.length - 1]! };
}

async function fetchOdCoverage(): Promise<OdCoverage> {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT line_id, from_code_ci, to_code_ci
    FROM agg_pair_window_rollup
  `;

  const edges: OdCoverage["edges"] = {};
  for (const row of rows) {
    const lineId = String(row.line_id).trim();
    const from = String(row.from_code_ci).trim();
    const to = String(row.to_code_ci).trim();
    if (!edges[lineId]) edges[lineId] = {};
    const bucket = edges[lineId]!;
    if (!bucket[from]) bucket[from] = [];
    if (!bucket[from]!.includes(to)) bucket[from]!.push(to);
  }
  return { edges };
}

export const getOdCoverage = unstable_cache(fetchOdCoverage, ["od-coverage-v1"], {
  revalidate: 3600,
  tags: ["agg"],
});
