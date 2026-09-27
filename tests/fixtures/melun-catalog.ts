import { CORRIDOR_STATIONS } from "@/lib/stations";
import {
  DEFAULT_CORRIDOR_ID,
  DEFAULT_LINE_ID,
  type NetworkCatalog,
} from "@/lib/network";

/** Minimal Melun-only catalog for component tests (no Neon). */
export const MELUN_TEST_CATALOG: NetworkCatalog = {
  lines: [
    {
      lineId: DEFAULT_LINE_ID,
      short: "D",
      pillLabel: "D",
      displayName: "RER D",
      coverage: "full",
    },
    {
      lineId: "IDFM:C01729",
      short: "E",
      pillLabel: "E",
      displayName: "RER E",
      coverage: "full",
    },
  ],
  corridors: [
    {
      corridorId: DEFAULT_CORRIDOR_ID,
      lineId: DEFAULT_LINE_ID,
      displayName: "Branche Melun",
      hubCodeCi: "686030",
      endCodeCi: "682005",
      coverage: "full",
    },
    {
      corridorId: "rer-d-corbeil",
      lineId: DEFAULT_LINE_ID,
      displayName: "Branche Corbeil",
      hubCodeCi: "686030",
      endCodeCi: "681007",
      coverage: "full",
    },
  ],
  stationsByCorridor: {
    [DEFAULT_CORRIDOR_ID]: [...CORRIDOR_STATIONS],
    "rer-d-corbeil": CORRIDOR_STATIONS.slice(0, 5),
  },
};
