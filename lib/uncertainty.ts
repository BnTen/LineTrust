/** Uncertainty labels from cell sample size — frozen Phase 2 (docs/03). */

export const N_MIN = {
  /** Below this → banner « historique insuffisant » + still show score */
  banner: 30,
  mid: 100,
  high: 300,
} as const;

export type ConfidenceLabel = "faible" | "moyen" | "fort";

export function confidenceLabel(n: number): ConfidenceLabel {
  if (n < N_MIN.mid) return "faible";
  if (n < N_MIN.high) return "moyen";
  return "fort";
}

export function hasInsufficientHistory(n: number): boolean {
  return n < N_MIN.banner;
}
