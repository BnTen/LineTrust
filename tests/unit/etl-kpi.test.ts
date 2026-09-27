import { describe, expect, it } from "vitest";
import { aggregateArtRows } from "@/lib/etl/aggregate";
import { decidePartitionLoad } from "@/lib/etl/watermark";
import { hashBuffer } from "@/lib/etl/hash";
import { metricsFromSamples } from "@/lib/kpi";
import { confidenceLabel, hasInsufficientHistory, N_MIN } from "@/lib/uncertainty";

/** Minimal Lyon → Melun circulation: depart hub 08:05, arrive Melun +3 min (on time). */
const MINI_CIRC = [
  {
    date_circ: "2024-03-12",
    id_circ: "10000001",
    tct: "TBD",
    code_ci_origine: "686030",
    code_ci_destination: "682005",
    lib_ci_origine: "Paris-Gare-de-Lyon (Banlieue)",
    code_ci_jalon: "686030",
    type_horaire: "D",
    dh_the_jalon: "2024-03-12 08:05:00",
    dh_obs_jalon: "2024-03-12 08:05:00",
  },
  {
    date_circ: "2024-03-12",
    id_circ: "10000001",
    tct: "TBD",
    code_ci_origine: "686030",
    code_ci_destination: "682005",
    lib_ci_origine: "Paris-Gare-de-Lyon (Banlieue)",
    code_ci_jalon: "682005",
    type_horaire: "A",
    dh_the_jalon: "2024-03-12 08:50:00",
    dh_obs_jalon: "2024-03-12 08:53:00",
  },
];

describe("decidePartitionLoad", () => {
  it("noops when hash unchanged and previously loaded", () => {
    const hash = hashBuffer("same-bytes");
    const decision = decidePartitionLoad(
      {
        sourceId: "art-idfm",
        partitionKey: "2024",
        contentHash: hash,
        rowCount: 10,
        status: "loaded",
      },
      hash,
    );
    expect(decision).toEqual({ action: "noop", reason: "hash_unchanged" });
  });

  it("replaces on new partition or hash change", () => {
    expect(decidePartitionLoad(null, "abc")).toEqual({
      action: "replace",
      reason: "new_partition",
    });
    expect(
      decidePartitionLoad(
        {
          sourceId: "art-idfm",
          partitionKey: "2024",
          contentHash: "old",
          rowCount: 1,
          status: "loaded",
        },
        "new",
      ),
    ).toEqual({ action: "replace", reason: "hash_changed" });
  });
});

describe("aggregateArtRows golden corridor", () => {
  it("scores Lyon→Melun on-time cell deterministically", () => {
    const late = {
      ...MINI_CIRC[1],
      id_circ: "10000002",
      dh_the_jalon: "2024-03-12 08:50:00",
      dh_obs_jalon: "2024-03-12 09:10:00", // +20 min → penalty bucket
    };
    const lateDep = {
      ...MINI_CIRC[0],
      id_circ: "10000002",
    };
    const { cells, quarantine } = aggregateArtRows([
      ...MINI_CIRC,
      lateDep,
      late,
    ]);
    expect(Object.keys(quarantine)).toHaveLength(0);
    const cell = cells.find(
      (c) =>
        c.fromCodeCi === "686030" &&
        c.toCodeCi === "682005" &&
        c.windowStartMinutes === 8 * 60,
    );
    expect(cell).toBeDefined();
    expect(cell!.metrics.n).toBe(2);
    expect(cell!.metrics.nOnTime).toBe(1);
    expect(cell!.metrics.nDelayGt15).toBe(1);
    expect(cell!.dayType).toBe("weekday");
    expect(cell!.monthKey).toBe("2024-03");
    // tpr=50, tsr=0, penalty=50 → 25 + 35 - 7.5 = 52.5
    expect(cell!.metrics.score).toBeCloseTo(52.5, 5);
  });

  it("flags used_est when obs null and includes in TPR by default", () => {
    const rows = [
      MINI_CIRC[0],
      {
        ...MINI_CIRC[1],
        dh_obs_jalon: "",
        dh_est_jalon: "2024-03-12 08:52:00",
      },
    ];
    const { cells } = aggregateArtRows(rows);
    const cell = cells.find(
      (c) => c.fromCodeCi === "686030" && c.toCodeCi === "682005",
    );
    expect(cell!.metrics.nUsedEst).toBe(1);
    expect(cell!.metrics.nOnTime).toBe(1);
  });

  it("quarantines delay > 120 without imputing", () => {
    const rows = [
      MINI_CIRC[0],
      {
        ...MINI_CIRC[1],
        dh_obs_jalon: "2024-03-12 12:00:00", // +190 min
      },
    ];
    const { cells, quarantine } = aggregateArtRows(rows);
    expect(quarantine.delay_gt_120).toBeGreaterThan(0);
    expect(cells.every((c) => c.metrics.n === 0 || c.fromCodeCi !== "686030")).toBe(
      true,
    );
  });
});

describe("metricsFromSamples + uncertainty", () => {
  it("matches w0 formula", () => {
    const m = metricsFromSamples([
      { delayMinutes: 2, usedEst: false },
      { delayMinutes: 20, usedEst: false },
    ]);
    expect(m.score).toBeCloseTo(52.5, 5);
  });

  it("freezes N_min buckets 30/100/300", () => {
    expect(N_MIN).toEqual({ banner: 30, mid: 100, high: 300 });
    expect(hasInsufficientHistory(29)).toBe(true);
    expect(confidenceLabel(50)).toBe("faible");
    expect(confidenceLabel(150)).toBe("moyen");
    expect(confidenceLabel(300)).toBe("fort");
  });
});
