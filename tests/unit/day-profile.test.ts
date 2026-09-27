import { describe, expect, it } from "vitest";
import {
  ALL_WINDOWS,
  buildDayProfile,
  confidenceOpacity,
  neighborhoodSlots,
  pickBestHour,
  scoreHeight,
} from "@/lib/day-profile";
import type { AggCell } from "@/lib/trajet";

function cell(
  partial: Partial<AggCell> &
    Pick<AggCell, "windowStartMinutes" | "score" | "n">,
): AggCell {
  return {
    lineId: "IDFM:C01728",
    fromCodeCi: "686030",
    toCodeCi: "682005",
    dayType: "weekday",
    nUsedEst: 0,
    tpr: 80,
    tsr: 0,
    penalty: 5,
    weightsVersion: "w0",
    ...partial,
  };
}

describe("buildDayProfile", () => {
  it("keeps 48 slots and leaves holes as null", () => {
    const profile = buildDayProfile([
      cell({ windowStartMinutes: 840, score: 83, n: 339 }),
      cell({ windowStartMinutes: 1080, score: 76, n: 337 }),
    ]);
    expect(profile).toHaveLength(ALL_WINDOWS.length);
    expect(profile[0]!.cell).toBeNull();
    expect(profile[840 / 30]!.cell?.score).toBe(83);
    expect(profile.filter((s) => s.cell != null)).toHaveLength(2);
  });
});

describe("pickBestHour", () => {
  it("picks highest score among eligible n", () => {
    const best = pickBestHour([
      cell({ windowStartMinutes: 840, score: 83, n: 339 }),
      cell({ windowStartMinutes: 1080, score: 90, n: 20 }),
      cell({ windowStartMinutes: 1050, score: 77, n: 323 }),
    ]);
    expect(best?.windowStartMinutes).toBe(840);
  });

  it("returns null when all below nMin", () => {
    expect(
      pickBestHour([cell({ windowStartMinutes: 480, score: 99, n: 10 })]),
    ).toBeNull();
  });
});

describe("neighborhoodSlots", () => {
  it("includes ±90 min around center", () => {
    const profile = buildDayProfile([
      cell({ windowStartMinutes: 1020, score: 70, n: 100 }),
      cell({ windowStartMinutes: 1080, score: 76, n: 100 }),
      cell({ windowStartMinutes: 1200, score: 60, n: 100 }),
    ]);
    const near = neighborhoodSlots(profile, 1080, 90);
    expect(near.map((s) => s.windowStartMinutes)).toContain(1020);
    expect(near.map((s) => s.windowStartMinutes)).toContain(1080);
    expect(near.map((s) => s.windowStartMinutes)).not.toContain(1200);
  });
});

describe("confidenceOpacity / scoreHeight", () => {
  it("maps n bands to opacity steps", () => {
    expect(confidenceOpacity(10)).toBe(0.35);
    expect(confidenceOpacity(50)).toBe(0.55);
    expect(confidenceOpacity(150)).toBe(0.8);
    expect(confidenceOpacity(400)).toBe(1);
  });

  it("clamps score height", () => {
    expect(scoreHeight(null)).toBe(0);
    expect(scoreHeight(50)).toBe(0.5);
    expect(scoreHeight(120)).toBe(1);
  });
});
