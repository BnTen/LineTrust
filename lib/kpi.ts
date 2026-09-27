/**
 * KPI cell builders from delay samples — aligns with lib/scoring.ts + business rules.
 *
 * TSR: cancellations are NOT invented. Until an explicit derivation exists,
 * n_cancelled stays 0 and tsr = 0 (proxy documented in docs/04).
 */

import { computeScore, type ScoreWeights, WEIGHTS_W0 } from "@/lib/scoring";

export const WEIGHTS_VERSION = "w0";

export const ON_TIME_MINUTES = 5;
export const PENALTY_DELAY_MINUTES = 15;
/** Quarantine threshold — delay beyond this is dirty, not silently capped into KPI. */
export const MAX_DELAY_MINUTES = 120;

export interface DelaySample {
  /** Delay minutes at destination arrival (obs or est − theoretical). May be negative (early). */
  delayMinutes: number;
  usedEst: boolean;
  cancelled?: boolean;
}

export interface CellCounts {
  n: number;
  nOnTime: number;
  nDelayGt15: number;
  nUsedEst: number;
  nCancelled: number;
}

export interface CellMetrics extends CellCounts {
  tpr: number;
  tsr: number;
  penalty: number;
  score: number;
  weightsVersion: string;
}

/**
 * Aggregate delay samples into TPR / TSR / penalty / score.
 * Early arrivals (negative delay) count as on-time.
 * Cancelled samples are excluded from TPR denominator (intent lock).
 */
export function metricsFromSamples(
  samples: DelaySample[],
  weights: ScoreWeights = WEIGHTS_W0,
  weightsVersion = WEIGHTS_VERSION,
): CellMetrics {
  let nOnTime = 0;
  let nDelayGt15 = 0;
  let nUsedEst = 0;
  let nCancelled = 0;
  let nObserved = 0;

  for (const sample of samples) {
    if (sample.cancelled) {
      nCancelled += 1;
      continue;
    }
    nObserved += 1;
    if (sample.usedEst) nUsedEst += 1;
    if (sample.delayMinutes < ON_TIME_MINUTES) nOnTime += 1;
    if (sample.delayMinutes > PENALTY_DELAY_MINUTES) nDelayGt15 += 1;
  }

  const n = nObserved + nCancelled;
  const tpr = nObserved === 0 ? 0 : (100 * nOnTime) / nObserved;
  const theoretical = n; // MVP: observed+cancelled; no invented missing runs
  const tsr = theoretical === 0 ? 0 : (100 * nCancelled) / theoretical;
  const penalty = nObserved === 0 ? 0 : (100 * nDelayGt15) / nObserved;
  const score = computeScore({ tpr, tsr, penalty }, weights);

  return {
    n,
    nOnTime,
    nDelayGt15,
    nUsedEst,
    nCancelled,
    tpr,
    tsr,
    penalty,
    score,
    weightsVersion,
  };
}

export function mergeCounts(a: CellCounts, b: CellCounts): CellCounts {
  return {
    n: a.n + b.n,
    nOnTime: a.nOnTime + b.nOnTime,
    nDelayGt15: a.nDelayGt15 + b.nDelayGt15,
    nUsedEst: a.nUsedEst + b.nUsedEst,
    nCancelled: a.nCancelled + b.nCancelled,
  };
}

export function metricsFromCounts(
  counts: CellCounts,
  weights: ScoreWeights = WEIGHTS_W0,
  weightsVersion = WEIGHTS_VERSION,
): CellMetrics {
  const nObserved = counts.n - counts.nCancelled;
  const tpr = nObserved === 0 ? 0 : (100 * counts.nOnTime) / nObserved;
  const tsr = counts.n === 0 ? 0 : (100 * counts.nCancelled) / counts.n;
  const penalty = nObserved === 0 ? 0 : (100 * counts.nDelayGt15) / nObserved;
  const score = computeScore({ tpr, tsr, penalty }, weights);
  return { ...counts, tpr, tsr, penalty, score, weightsVersion };
}

export type DayType = "weekday" | "weekend";

export function dayTypeFromDate(isoDate: string): DayType | null {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Use UTC noon to avoid TZ edge; ART dates are calendar Paris service days.
  const wd = d.getUTCDay(); // 0 Sun … 6 Sat
  return wd === 0 || wd === 6 ? "weekend" : "weekday";
}

/** Floor clock time to 30-minute window start (minutes from midnight). */
export function windowStartMinutes(hours: number, minutes: number): number {
  const total = hours * 60 + minutes;
  return Math.floor(total / 30) * 30;
}

export function parseMonthKey(isoDate: string): string | null {
  const m = isoDate.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(m) ? m : null;
}
