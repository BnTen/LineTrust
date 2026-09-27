/** LineTrust score helpers — weights versioned for immutable aggregates. */

export interface ScoreWeights {
  tpr: number;
  reliability: number;
  penalty: number;
}

/** Locked MVP weights (docs/03 + intent). Persist as weights_version on agg rows. */
export const WEIGHTS_W0: ScoreWeights = {
  tpr: 0.5,
  reliability: 0.35,
  penalty: 0.15,
};

export type ScoreBand = "good" | "mid" | "bad";

export interface ScoreInputs {
  /** On-time rate 0–100 among non-cancelled */
  tpr: number;
  /** Cancellation rate 0–100 */
  tsr: number;
  /** Rate of delays > 15 min, already clamped 0–100 */
  penalty: number;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * score = (TPR×0.50)+((100−TSR)×0.35)−(penalty×0.15) then clamp [0,100]
 */
export function computeScore(
  inputs: ScoreInputs,
  weights: ScoreWeights = WEIGHTS_W0,
): number {
  const raw =
    inputs.tpr * weights.tpr +
    (100 - inputs.tsr) * weights.reliability -
    inputs.penalty * weights.penalty;
  return clamp(raw, 0, 100);
}

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "good";
  if (score >= 50) return "mid";
  return "bad";
}

export type DayType = "weekday" | "weekend";

export interface WindowCell {
  windowStartMinutes: number;
  score: number;
  n: number;
}

/**
 * Best alternative in ±30 min of the user window (same day type assumed by caller).
 * Tie-break: higher n, then closer window.
 */
export function pickAlternative(
  userWindowStartMinutes: number,
  candidates: WindowCell[],
  radiusMinutes = 30,
): WindowCell | null {
  const inRange = candidates.filter((cell) => {
    const delta = Math.abs(cell.windowStartMinutes - userWindowStartMinutes);
    return delta > 0 && delta <= radiusMinutes;
  });
  if (inRange.length === 0) return null;

  return inRange.reduce((best, cell) => {
    if (cell.score !== best.score) return cell.score > best.score ? cell : best;
    if (cell.n !== best.n) return cell.n > best.n ? cell : best;
    const bestDelta = Math.abs(best.windowStartMinutes - userWindowStartMinutes);
    const cellDelta = Math.abs(cell.windowStartMinutes - userWindowStartMinutes);
    return cellDelta < bestDelta ? cell : best;
  });
}

/**
 * When the chosen créneau is empty: nearest windows with data first,
 * then higher score / n. Excludes the user window.
 */
export function pickSuggestions(
  userWindowStartMinutes: number,
  candidates: WindowCell[],
  limit = 3,
): WindowCell[] {
  return [...candidates]
    .filter((cell) => cell.windowStartMinutes !== userWindowStartMinutes)
    .sort((a, b) => {
      const da = Math.abs(a.windowStartMinutes - userWindowStartMinutes);
      const db = Math.abs(b.windowStartMinutes - userWindowStartMinutes);
      if (da !== db) return da - db;
      if (b.score !== a.score) return b.score - a.score;
      return b.n - a.n;
    })
    .slice(0, limit);
}
