import { describe, expect, it } from "vitest";
import {
  buildMonthlySeries,
  nextMonthKey,
  scoreStdDev,
  volatilityLabel,
  type MonthlyPoint,
} from "@/lib/monthly-trend";

function pt(monthKey: string, score: number, n = 40): MonthlyPoint {
  return { monthKey, score, n, tpr: 80, penalty: 5 };
}

describe("buildMonthlySeries", () => {
  it("inserts null holes between months", () => {
    const series = buildMonthlySeries([
      pt("2024-01", 70),
      pt("2024-03", 75),
    ]);
    expect(series.map((s) => s.monthKey)).toEqual([
      "2024-01",
      "2024-02",
      "2024-03",
    ]);
    expect(series[1]!.point).toBeNull();
    expect(series[0]!.point?.score).toBe(70);
  });
});

describe("scoreStdDev / volatilityLabel", () => {
  it("returns null under 6 months", () => {
    expect(scoreStdDev([pt("2024-01", 70), pt("2024-02", 72)])).toBeNull();
  });

  it("computes sample stddev and labels", () => {
    const points = [
      pt("2024-01", 70),
      pt("2024-02", 72),
      pt("2024-03", 71),
      pt("2024-04", 73),
      pt("2024-05", 70),
      pt("2024-06", 72),
    ];
    const sd = scoreStdDev(points);
    expect(sd).not.toBeNull();
    expect(sd!).toBeLessThan(4);
    expect(volatilityLabel(sd!)).toBe("stable");
    expect(volatilityLabel(5)).toBe("moderee");
    expect(volatilityLabel(10)).toBe("variable");
  });
});

describe("nextMonthKey", () => {
  it("rolls year", () => {
    expect(nextMonthKey("2024-12")).toBe("2025-01");
    expect(nextMonthKey("2024-09")).toBe("2024-10");
  });
});
