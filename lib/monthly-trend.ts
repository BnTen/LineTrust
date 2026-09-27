/** Monthly score series from agg_pair_window — holes stay holes. */

import { scoreBand, type ScoreBand } from "@/lib/scoring";

export interface MonthlyPoint {
  monthKey: string; // YYYY-MM
  score: number;
  n: number;
  tpr: number;
  penalty: number;
}

export interface MonthSlot {
  monthKey: string;
  point: MonthlyPoint | null;
  band: ScoreBand | null;
}

/** Sample stddev of scores; null if fewer than `minMonths` filled points. */
export function scoreStdDev(
  points: readonly MonthlyPoint[],
  minMonths = 6,
): number | null {
  if (points.length < minMonths) return null;
  const scores = points.map((p) => p.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / (scores.length - 1);
  return Math.sqrt(variance);
}

export type VolatilityLabel = "stable" | "moderee" | "variable";

/** Plain thresholds from Neon audit (RER D p90 σ ≈ 5). */
export function volatilityLabel(sd: number): VolatilityLabel {
  if (sd < 4) return "stable";
  if (sd < 8) return "moderee";
  return "variable";
}

/**
 * Build a contiguous month axis from min..max month_key in points.
 * Missing months = null (never interpolate).
 */
export function buildMonthlySeries(
  points: readonly MonthlyPoint[],
): MonthSlot[] {
  if (points.length === 0) return [];
  const byKey = new Map(points.map((p) => [p.monthKey, p] as const));
  const keys = [...byKey.keys()].sort();
  const start = keys[0]!;
  const end = keys[keys.length - 1]!;
  const slots: MonthSlot[] = [];
  for (let key = start; key <= end; key = nextMonthKey(key)) {
    const point = byKey.get(key) ?? null;
    slots.push({
      monthKey: key,
      point,
      band: point ? scoreBand(point.score) : null,
    });
    if (key === end) break;
  }
  return slots;
}

export function nextMonthKey(monthKey: string): string {
  const [ys, ms] = monthKey.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function formatMonthShort(monthKey: string): string {
  const m = Number(monthKey.slice(5, 7));
  const labels = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  return labels[m - 1] ?? monthKey;
}
