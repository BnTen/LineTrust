import { CORRIDOR_STATIONS } from "@/lib/stations";
import { DEFAULT_LINE_ID, type NetworkCatalog } from "@/lib/network";
import type { OdCoverage } from "@/lib/coverage";
import { MELUN_TEST_CATALOG } from "@/tests/fixtures/melun-catalog";

/** Dense Melun OD matrix + Corbeil edges for component tests. */
export function buildTestOdCoverage(
  catalog: NetworkCatalog = MELUN_TEST_CATALOG,
): OdCoverage {
  const edges: OdCoverage["edges"] = {};

  function add(lineId: string, from: string, to: string) {
    if (!edges[lineId]) edges[lineId] = {};
    if (!edges[lineId]![from]) edges[lineId]![from] = [];
    if (!edges[lineId]![from]!.includes(to)) {
      edges[lineId]![from]!.push(to);
    }
  }

  for (const corridor of catalog.corridors) {
    const list = catalog.stationsByCorridor[corridor.corridorId] ?? [];
    for (const from of list) {
      for (const to of list) {
        if (from.codeCi !== to.codeCi) {
          add(corridor.lineId, from.codeCi, to.codeCi);
        }
      }
    }
  }

  const lyon = CORRIDOR_STATIONS[0]!;
  const melun = CORRIDOR_STATIONS[CORRIDOR_STATIONS.length - 1]!;
  add(DEFAULT_LINE_ID, lyon.codeCi, melun.codeCi);

  // Line E pill stays visible even without corridor stops in the fixture.
  const eLine = catalog.lines.find((l) => l.short === "E");
  if (eLine) add(eLine.lineId, "E1", "E2");

  return { edges };
}

export const MELUN_TEST_COVERAGE = buildTestOdCoverage();
