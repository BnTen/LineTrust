import { describe, expect, it } from "vitest";
import {
  corridorHasInternalOd,
  corridorsWithOdData,
  defaultPairWithCoverage,
  hasOdEdge,
  linesWithOdData,
} from "@/lib/coverage";
import { DEFAULT_CORRIDOR_ID, DEFAULT_LINE_ID } from "@/lib/network";
import { CORRIDOR_STATIONS } from "@/lib/stations";
import { MELUN_TEST_CATALOG } from "@/tests/fixtures/melun-catalog";
import { MELUN_TEST_COVERAGE } from "@/tests/fixtures/melun-coverage";

describe("od coverage helpers", () => {
  it("detects oriented edges", () => {
    const from = CORRIDOR_STATIONS[0]!;
    const to = CORRIDOR_STATIONS[CORRIDOR_STATIONS.length - 1]!;
    expect(
      hasOdEdge(MELUN_TEST_COVERAGE, DEFAULT_LINE_ID, from.codeCi, to.codeCi),
    ).toBe(true);
    expect(
      hasOdEdge(MELUN_TEST_COVERAGE, DEFAULT_LINE_ID, from.codeCi, "000000"),
    ).toBe(false);
  });

  it("keeps Melun + Corbeil as data-bearing D branches", () => {
    const corridors = corridorsWithOdData(
      MELUN_TEST_CATALOG,
      DEFAULT_LINE_ID,
      MELUN_TEST_COVERAGE,
    );
    expect(corridors.map((c) => c.corridorId)).toEqual(
      expect.arrayContaining([DEFAULT_CORRIDOR_ID, "rer-d-corbeil"]),
    );
  });

  it("drops a corridor with zero internal ODs", () => {
    const emptyCoverage = { edges: { [DEFAULT_LINE_ID]: {} } };
    expect(
      corridorHasInternalOd(
        emptyCoverage,
        DEFAULT_LINE_ID,
        CORRIDOR_STATIONS.map((s) => s.codeCi),
      ),
    ).toBe(false);
    expect(
      corridorsWithOdData(
        MELUN_TEST_CATALOG,
        DEFAULT_LINE_ID,
        emptyCoverage,
      ),
    ).toHaveLength(0);
  });

  it("defaults to Lyon → Melun on D Melun", () => {
    const pair = defaultPairWithCoverage(
      MELUN_TEST_CATALOG,
      DEFAULT_LINE_ID,
      DEFAULT_CORRIDOR_ID,
      MELUN_TEST_COVERAGE,
    );
    expect(pair?.from.slug).toBe("paris-gare-de-lyon");
    expect(pair?.to.slug).toBe("melun");
  });

  it("lists lines that have at least one edge", () => {
    const lines = linesWithOdData(MELUN_TEST_CATALOG, MELUN_TEST_COVERAGE);
    expect(lines.map((l) => l.short)).toEqual(
      expect.arrayContaining(["D", "E"]),
    );
  });
});
