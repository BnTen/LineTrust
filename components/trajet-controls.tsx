"use client";

import { ArrowLeftRight } from "lucide-react";
import {
  dayTypeControlLabel,
  formatWindowOptionLabel,
  reverseDirectionDetail,
  reverseDirectionTitle,
  windowPeriod,
  windowPeriodLabel,
  type WindowPeriod,
} from "@/lib/copy";
import type { DayType } from "@/lib/scoring";
import type { Station } from "@/lib/stations";

const WINDOWS = Array.from({ length: 48 }, (_, i) => i * 30);

const PERIOD_ORDER: WindowPeriod[] = [
  "nuit",
  "matin",
  "apres-midi",
  "soir",
  "soiree",
];

function windowsByPeriod(): { period: WindowPeriod; windows: number[] }[] {
  const buckets = new Map<WindowPeriod, number[]>();
  for (const period of PERIOD_ORDER) buckets.set(period, []);
  for (const w of WINDOWS) {
    buckets.get(windowPeriod(w))!.push(w);
  }
  return PERIOD_ORDER.map((period) => ({
    period,
    windows: buckets.get(period)!,
  }));
}

const GROUPED = windowsByPeriod();

export function TrajetControls({
  dayType,
  windowStartMinutes,
  onDayTypeChange,
  onWindowChange,
  availableWindows,
  from,
  to,
  onReverse,
}: {
  dayType: DayType;
  windowStartMinutes: number;
  onDayTypeChange: (dayType: DayType) => void;
  onWindowChange: (windowStartMinutes: number) => void;
  /** Windows with rollup data for the current OD + day_type. */
  availableWindows?: readonly number[];
  from?: Station;
  to?: Station;
  onReverse?: () => void;
}) {
  const available = availableWindows
    ? new Set(availableWindows)
    : null;
  const showReverse = Boolean(from && to && onReverse);
  const reverseDetail =
    from && to ? reverseDirectionDetail(to.nameDisplay, from.nameDisplay) : "";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6 sm:gap-y-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Quand tu voyages</legend>
        <div className="flex gap-2">
          {(
            [
              ["weekday", dayTypeControlLabel("weekday")],
              ["weekend", dayTypeControlLabel("weekend")],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onDayTypeChange(value)}
              className={`rounded-full px-4 py-2 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                dayType === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-ink-muted hover:text-ink"
              }`}
              aria-pressed={dayType === value}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink">Créneau de départ</span>
        <select
          value={windowStartMinutes}
          onChange={(e) => onWindowChange(Number(e.target.value))}
          className="h-10 min-w-[12rem] rounded-full border border-border bg-card px-4 text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {GROUPED.map(({ period, windows }) => (
            <optgroup key={period} label={windowPeriodLabel[period]}>
              {windows.map((w) => {
                const hasData = available === null || available.has(w);
                const isCurrent = w === windowStartMinutes;
                return (
                  <option
                    key={w}
                    value={w}
                    disabled={!hasData && !isCurrent}
                  >
                    {hasData
                      ? formatWindowOptionLabel(w)
                      : `${formatWindowOptionLabel(w)} · pas de données`}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
      </label>

      {showReverse ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">
            {reverseDirectionTitle}
          </span>
          <button
            type="button"
            onClick={onReverse}
            aria-label={`${reverseDirectionTitle} : ${reverseDetail}`}
            title={reverseDetail}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm text-ink transition-colors outline-none hover:bg-secondary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeftRight className="size-4 shrink-0" aria-hidden />
            <span className="max-w-[14rem] truncate sm:max-w-[18rem]">
              {reverseDetail}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
