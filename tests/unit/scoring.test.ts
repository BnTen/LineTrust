import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  computeScore,
  pickAlternative,
  pickSuggestions,
  scoreBand,
  WEIGHTS_W0,
} from "@/lib/scoring";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/score-cell.golden.json",
);

interface GoldenFixture {
  weights_version: string;
  cell: {
    tpr: number;
    tsr: number;
    penalty: number;
    expected_score: number;
  };
}

describe("computeScore", () => {
  it("matches golden fixture w0", () => {
    const golden = JSON.parse(
      readFileSync(fixturePath, "utf8"),
    ) as GoldenFixture;
    expect(golden.weights_version).toBe("w0");
    const score = computeScore({
      tpr: golden.cell.tpr,
      tsr: golden.cell.tsr,
      penalty: golden.cell.penalty,
    });
    expect(score).toBeCloseTo(golden.cell.expected_score, 5);
  });

  it("clamps floor at 0; w0 ceiling is 85 for perfect inputs", () => {
    expect(computeScore({ tpr: 0, tsr: 100, penalty: 100 })).toBe(0);
    // 100*0.5 + 100*0.35 - 0 = 85 (formula does not reach 100 with w0)
    expect(computeScore({ tpr: 100, tsr: 0, penalty: 0 })).toBe(85);
  });

  it("exposes w0 weights matching intent", () => {
    expect(WEIGHTS_W0).toEqual({ tpr: 0.5, reliability: 0.35, penalty: 0.15 });
  });
});

describe("scoreBand", () => {
  it("maps green / orange / red thresholds", () => {
    expect(scoreBand(80)).toBe("good");
    expect(scoreBand(79.9)).toBe("mid");
    expect(scoreBand(50)).toBe("mid");
    expect(scoreBand(49.9)).toBe("bad");
  });
});

describe("pickAlternative", () => {
  it("picks best score within ±30 min", () => {
    const pick = pickAlternative(8 * 60, [
      { windowStartMinutes: 8 * 60, score: 70, n: 100 },
      { windowStartMinutes: 8 * 60 + 30, score: 88, n: 40 },
      { windowStartMinutes: 9 * 60 + 30, score: 95, n: 200 },
    ]);
    expect(pick?.windowStartMinutes).toBe(8 * 60 + 30);
  });

  it("tie-breaks on higher n then closer window", () => {
    const pick = pickAlternative(8 * 60, [
      { windowStartMinutes: 8 * 60 - 30, score: 80, n: 10 },
      { windowStartMinutes: 8 * 60 + 15, score: 80, n: 50 },
    ]);
    expect(pick?.windowStartMinutes).toBe(8 * 60 + 15);
  });
});

describe("pickSuggestions", () => {
  it("returns nearest windows first, excluding the user créneau", () => {
    const picks = pickSuggestions(8 * 60, [
      { windowStartMinutes: 8 * 60, score: 70, n: 100 },
      { windowStartMinutes: 10 * 60, score: 90, n: 40 },
      { windowStartMinutes: 8 * 60 + 30, score: 60, n: 20 },
      { windowStartMinutes: 7 * 60, score: 85, n: 30 },
    ]);
    expect(picks.map((p) => p.windowStartMinutes)).toEqual([
      8 * 60 + 30,
      7 * 60,
      10 * 60,
    ]);
  });
});
