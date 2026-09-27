"use client";

import {
  dayTypeControlLabel,
  formatWindowOptionLabel,
  windowPeriod,
  windowPeriodLabel,
  type WindowPeriod,
} from "@/lib/copy";
import type { DayType } from "@/lib/scoring";

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
}: {
  dayType: DayType;
  windowStartMinutes: number;
  onDayTypeChange: (dayType: DayType) => void;
  onWindowChange: (windowStartMinutes: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
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
              {windows.map((w) => (
                <option key={w} value={w}>
                  {formatWindowOptionLabel(w)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}
