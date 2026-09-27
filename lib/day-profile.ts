/** Day-profile helpers — 48 × 30 min slots from rollup cells. Holes stay holes. */

import type { AggCell } from "@/lib/trajet";
import { N_MIN } from "@/lib/uncertainty";
import { scoreBand, type ScoreBand } from "@/lib/scoring";

export const WINDOW_STEP_MINUTES = 30;
export const WINDOWS_PER_DAY = 48;

export const ALL_WINDOWS: readonly number[] = Array.from(
  { length: WINDOWS_PER_DAY },
  (_, i) => i * WINDOW_STEP_MINUTES,
);

export interface ProfileSlot {
  windowStartMinutes: number;
  /** null = no rollup row — must render as a hole, not interpolated. */
  cell: AggCell | null;
  band: ScoreBand | null;
}

/** Opacity encoding for sample size — visual uncertainty without inventing CI. */
export function confidenceOpacity(n: number): number {
  if (n < N_MIN.banner) return 0.35;
  if (n < N_MIN.mid) return 0.55;
  if (n < N_MIN.high) return 0.8;
  return 1;
}

export function buildDayProfile(cells: readonly AggCell[]): ProfileSlot[] {
  const byWindow = new Map(
    cells.map((c) => [c.windowStartMinutes, c] as const),
  );
  return ALL_WINDOWS.map((windowStartMinutes) => {
    const cell = byWindow.get(windowStartMinutes) ?? null;
    return {
      windowStartMinutes,
      cell,
      band: cell ? scoreBand(cell.score) : null,
    };
  });
}

/**
 * Best créneau of the day_type: highest score among cells with enough history.
 * Tie-break: higher n, then earlier window.
 */
export function pickBestHour(
  cells: readonly AggCell[],
  nMin = N_MIN.banner,
): AggCell | null {
  const eligible = cells.filter((c) => c.n >= nMin);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, cell) => {
    if (cell.score !== best.score) return cell.score > best.score ? cell : best;
    if (cell.n !== best.n) return cell.n > best.n ? cell : best;
    return cell.windowStartMinutes < best.windowStartMinutes ? cell : best;
  });
}

/** Slots within ±radius of center (inclusive of center). */
export function neighborhoodSlots(
  profile: readonly ProfileSlot[],
  centerMinutes: number,
  radiusMinutes = 90,
): ProfileSlot[] {
  return profile.filter((s) => {
    const delta = Math.abs(s.windowStartMinutes - centerMinutes);
    return delta <= radiusMinutes;
  });
}

/** Bar height 0–1 from score; empty slots → 0. */
export function scoreHeight(score: number | null | undefined): number {
  if (score == null || Number.isNaN(score)) return 0;
  return Math.min(1, Math.max(0, score / 100));
}
