import { unstable_cache } from "next/cache";
import { getSql } from "@/lib/db";
import { pickAlternative, scoreBand, type DayType } from "@/lib/scoring";
import {
  confidenceLabel,
  hasInsufficientHistory,
  type ConfidenceLabel,
} from "@/lib/uncertainty";

import { DEFAULT_LINE_ID } from "@/lib/network";

export { DEFAULT_LINE_ID };

export interface AggCell {
  lineId: string;
  fromCodeCi: string;
  toCodeCi: string;
  dayType: DayType;
  windowStartMinutes: number;
  n: number;
  nUsedEst: number;
  tpr: number;
  tsr: number;
  penalty: number;
  score: number;
  weightsVersion: string;
}

export interface TrajetResult {
  cell: AggCell | null;
  alternative: AggCell | null;
  confidence: ConfidenceLabel | null;
  insufficientHistory: boolean;
  band: ReturnType<typeof scoreBand> | null;
}

function rowToCell(row: Record<string, unknown>): AggCell {
  return {
    lineId: String(row.line_id ?? DEFAULT_LINE_ID).trim(),
    fromCodeCi: String(row.from_code_ci).trim(),
    toCodeCi: String(row.to_code_ci).trim(),
    dayType: row.day_type as DayType,
    windowStartMinutes: Number(row.window_start_minutes),
    n: Number(row.n),
    nUsedEst: Number(row.n_used_est),
    tpr: Number(row.tpr),
    tsr: Number(row.tsr),
    penalty: Number(row.penalty),
    score: Number(row.score),
    weightsVersion: String(row.weights_version),
  };
}

async function fetchPairWindows(
  lineId: string,
  fromCodeCi: string,
  toCodeCi: string,
  dayType: DayType,
): Promise<AggCell[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      line_id, from_code_ci, to_code_ci, day_type, window_start_minutes,
      n, n_used_est, tpr, tsr, penalty, score, weights_version
    FROM agg_pair_window_rollup
    WHERE line_id = ${lineId}
      AND from_code_ci = ${fromCodeCi}
      AND to_code_ci = ${toCodeCi}
      AND day_type = ${dayType}
    ORDER BY window_start_minutes
  `;
  return rows.map((r) => rowToCell(r as Record<string, unknown>));
}

const cachedPairWindows = unstable_cache(
  fetchPairWindows,
  ["agg-pair-windows-v2"],
  { revalidate: 3600, tags: ["agg"] },
);

export async function getTrajetResult(
  fromCodeCi: string,
  toCodeCi: string,
  dayType: DayType,
  windowStartMinutes: number,
  lineId: string = DEFAULT_LINE_ID,
): Promise<TrajetResult> {
  const windows = await cachedPairWindows(lineId, fromCodeCi, toCodeCi, dayType);
  const cell =
    windows.find((w) => w.windowStartMinutes === windowStartMinutes) ?? null;

  const altPick = pickAlternative(
    windowStartMinutes,
    windows.map((w) => ({
      windowStartMinutes: w.windowStartMinutes,
      score: w.score,
      n: w.n,
    })),
  );
  const alternative = altPick
    ? (windows.find(
        (w) => w.windowStartMinutes === altPick.windowStartMinutes,
      ) ?? null)
    : null;

  return {
    cell,
    alternative,
    confidence: cell ? confidenceLabel(cell.n) : null,
    insufficientHistory: cell ? hasInsufficientHistory(cell.n) : false,
    band: cell ? scoreBand(cell.score) : null,
  };
}
