import { unstable_cache } from "next/cache";
import { getSql } from "@/lib/db";
import {
  pickAlternative,
  pickSuggestions,
  scoreBand,
  type DayType,
} from "@/lib/scoring";
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
  /** Windows (minutes) with data for this OD + day_type. */
  availableWindows: number[];
  /** At least one rollup cell for this oriented OD on the line (any day/window). */
  odExists: boolean;
  /** Nearest créneaux with data when `cell` is null (same day_type first). */
  suggestions: AggCell[];
  /** Other day_type suggestions when this day_type has no windows. */
  otherDaySuggestions: AggCell[];
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

async function fetchOdExists(
  lineId: string,
  fromCodeCi: string,
  toCodeCi: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT 1 AS ok
    FROM agg_pair_window_rollup
    WHERE line_id = ${lineId}
      AND from_code_ci = ${fromCodeCi}
      AND to_code_ci = ${toCodeCi}
    LIMIT 1
  `;
  return rows.length > 0;
}

const cachedPairWindows = unstable_cache(
  fetchPairWindows,
  ["agg-pair-windows-v2"],
  { revalidate: 3600, tags: ["agg"] },
);

const cachedOdExists = unstable_cache(fetchOdExists, ["agg-od-exists-v1"], {
  revalidate: 3600,
  tags: ["agg"],
});

function cellFromPick(
  windows: AggCell[],
  pick: { windowStartMinutes: number } | null,
): AggCell | null {
  if (!pick) return null;
  return (
    windows.find((w) => w.windowStartMinutes === pick.windowStartMinutes) ??
    null
  );
}

export async function getTrajetResult(
  fromCodeCi: string,
  toCodeCi: string,
  dayType: DayType,
  windowStartMinutes: number,
  lineId: string = DEFAULT_LINE_ID,
): Promise<TrajetResult> {
  const windows = await cachedPairWindows(
    lineId,
    fromCodeCi,
    toCodeCi,
    dayType,
  );
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
  const alternative = cellFromPick(windows, altPick);

  const suggestionPicks = pickSuggestions(
    windowStartMinutes,
    windows.map((w) => ({
      windowStartMinutes: w.windowStartMinutes,
      score: w.score,
      n: w.n,
    })),
    3,
  );
  const suggestions = suggestionPicks
    .map(
      (p) =>
        windows.find((w) => w.windowStartMinutes === p.windowStartMinutes) ??
        null,
    )
    .filter((w): w is AggCell => w !== null);

  let otherDaySuggestions: AggCell[] = [];
  let odExists = windows.length > 0;
  if (!odExists) {
    odExists = await cachedOdExists(lineId, fromCodeCi, toCodeCi);
    if (odExists) {
      const otherDay: DayType =
        dayType === "weekday" ? "weekend" : "weekday";
      const otherWindows = await cachedPairWindows(
        lineId,
        fromCodeCi,
        toCodeCi,
        otherDay,
      );
      otherDaySuggestions = pickSuggestions(
        windowStartMinutes,
        otherWindows.map((w) => ({
          windowStartMinutes: w.windowStartMinutes,
          score: w.score,
          n: w.n,
        })),
        3,
      )
        .map(
          (p) =>
            otherWindows.find(
              (w) => w.windowStartMinutes === p.windowStartMinutes,
            ) ?? null,
        )
        .filter((w): w is AggCell => w !== null);
    }
  }

  return {
    cell,
    alternative,
    availableWindows: windows.map((w) => w.windowStartMinutes),
    odExists,
    suggestions,
    otherDaySuggestions,
    confidence: cell ? confidenceLabel(cell.n) : null,
    insufficientHistory: cell ? hasInsufficientHistory(cell.n) : false,
    band: cell ? scoreBand(cell.score) : null,
  };
}
