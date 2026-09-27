/**
 * Pure in-memory corridor aggregation — mirrors scripts/etl/art-melun-stream.py
 * for fixtures / unit tests (no zip, no Neon).
 */

import {
  canonicalCodeCi,
  corridorSequence,
  isCorridorEndpointOd,
} from "@/lib/etl/corridor";
import {
  dayTypeFromDate,
  MAX_DELAY_MINUTES,
  metricsFromSamples,
  parseMonthKey,
  type DelaySample,
  windowStartMinutes,
  WEIGHTS_VERSION,
} from "@/lib/kpi";

export interface ArtJalonRow {
  date_circ: string;
  id_circ: string;
  tct: string;
  code_ci_origine: string;
  code_ci_destination: string;
  lib_ci_origine?: string;
  code_ci_jalon: string;
  type_horaire: string;
  dh_the_jalon: string;
  dh_obs_jalon?: string;
  dh_est_jalon?: string;
}

export interface AggCellRow {
  fromCodeCi: string;
  toCodeCi: string;
  dayType: "weekday" | "weekend";
  windowStartMinutes: number;
  monthKey: string;
  metrics: ReturnType<typeof metricsFromSamples>;
}

interface ParsedJalon {
  code: string;
  seq: number;
  typ: string;
  the: Date | null;
  obs: Date | null;
  est: Date | null;
}

function parseTs(raw: string | undefined): Date | null {
  if (!raw?.trim()) return null;
  const s = raw.trim().slice(0, 19).replace("T", " ");
  const d = new Date(s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

function delayOf(arr: ParsedJalon): { sample: DelaySample } | { quarantine: string } {
  if (!arr.the) return { quarantine: "missing_theoretical" };
  let actual = arr.obs;
  let usedEst = false;
  if (!actual) {
    actual = arr.est;
    usedEst = true;
  }
  if (!actual) return { quarantine: "missing_actual" };
  const delayMinutes = (actual.getTime() - arr.the.getTime()) / 60_000;
  if (delayMinutes > MAX_DELAY_MINUTES) return { quarantine: "delay_gt_120" };
  return { sample: { delayMinutes, usedEst } };
}

function bestDepart(js: ParsedJalon[]): ParsedJalon | null {
  const deps = js.filter((j) => j.typ === "D" && j.the);
  if (deps.length) return deps.reduce((a, b) => (a.the! <= b.the! ? a : b));
  const withThe = js.filter((j) => j.the);
  if (!withThe.length) return null;
  return withThe.reduce((a, b) => (a.the! <= b.the! ? a : b));
}

function bestArrive(js: ParsedJalon[]): ParsedJalon | null {
  const arrs = js.filter((j) => j.typ === "A" && j.the);
  if (arrs.length) return arrs.reduce((a, b) => (a.the! >= b.the! ? a : b));
  const withThe = js.filter((j) => j.the);
  if (!withThe.length) return null;
  return withThe.reduce((a, b) => (a.the! >= b.the! ? a : b));
}

type SampleKey = string;

function sampleKey(
  from: string,
  to: string,
  dayType: string,
  window: number,
  month: string,
): SampleKey {
  return `${from}|${to}|${dayType}|${window}|${month}`;
}

/**
 * Aggregate ART-like jalon rows for Melun endpoint OD circulations into scored cells.
 */
export function aggregateArtRows(rows: ArtJalonRow[]): {
  cells: AggCellRow[];
  quarantine: Record<string, number>;
} {
  const byCirc = new Map<string, ArtJalonRow[]>();
  for (const row of rows) {
    if (row.tct.trim() !== "TBD") continue;
    if (!isCorridorEndpointOd(row.code_ci_origine, row.code_ci_destination)) continue;
    if (!(row.lib_ci_origine ?? "").trim()) continue;
    const list = byCirc.get(row.id_circ) ?? [];
    list.push(row);
    byCirc.set(row.id_circ, list);
  }

  const buckets = new Map<SampleKey, DelaySample[]>();
  const quarantine: Record<string, number> = {};

  for (const circRows of byCirc.values()) {
    const first = circRows[0];
    const dayType = dayTypeFromDate(first.date_circ);
    const monthKey = parseMonthKey(first.date_circ);
    if (!dayType || !monthKey) {
      quarantine.bad_date = (quarantine.bad_date ?? 0) + 1;
      continue;
    }
    const orig = canonicalCodeCi(first.code_ci_origine)!;
    const dest = canonicalCodeCi(first.code_ci_destination)!;
    const southbound = orig === "686030" && dest === "682005";

    const byCode = new Map<string, ParsedJalon[]>();
    for (const row of circRows) {
      const code = canonicalCodeCi(row.code_ci_jalon);
      const seq = corridorSequence(row.code_ci_jalon);
      if (!code || seq === null) continue;
      const list = byCode.get(code) ?? [];
      list.push({
        code,
        seq,
        typ: row.type_horaire.trim(),
        the: parseTs(row.dh_the_jalon),
        obs: parseTs(row.dh_obs_jalon),
        est: parseTs(row.dh_est_jalon),
      });
      byCode.set(code, list);
    }

    const codes = [...byCode.keys()].sort(
      (a, b) => corridorSequence(a)! - corridorSequence(b)!,
    );

    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        const pairs: [string, string][] = [
          [codes[i], codes[j]],
          [codes[j], codes[i]],
        ];
        for (const [frm, to] of pairs) {
          const fs = corridorSequence(frm)!;
          const ts = corridorSequence(to)!;
          if (southbound && fs >= ts) continue;
          if (!southbound && fs <= ts) continue;

          const dep = bestDepart(byCode.get(frm) ?? []);
          const arr = bestArrive(byCode.get(to) ?? []);
          if (!dep?.the || !arr) continue;

          const result = delayOf(arr);
          if ("quarantine" in result) {
            quarantine[result.quarantine] = (quarantine[result.quarantine] ?? 0) + 1;
            continue;
          }
          const w = windowStartMinutes(dep.the.getHours(), dep.the.getMinutes());
          const key = sampleKey(frm, to, dayType, w, monthKey);
          const list = buckets.get(key) ?? [];
          list.push(result.sample);
          buckets.set(key, list);
        }
      }
    }
  }

  const cells: AggCellRow[] = [];
  for (const [key, samples] of buckets) {
    const [fromCodeCi, toCodeCi, dayType, windowStr, monthKey] = key.split("|");
    cells.push({
      fromCodeCi,
      toCodeCi,
      dayType: dayType as "weekday" | "weekend",
      windowStartMinutes: Number(windowStr),
      monthKey,
      metrics: metricsFromSamples(samples),
    });
  }

  cells.sort((a, b) =>
    `${a.fromCodeCi}${a.toCodeCi}${a.dayType}${a.windowStartMinutes}${a.monthKey}`.localeCompare(
      `${b.fromCodeCi}${b.toCodeCi}${b.dayType}${b.windowStartMinutes}${b.monthKey}`,
    ),
  );

  return { cells, quarantine };
}

export { WEIGHTS_VERSION };
