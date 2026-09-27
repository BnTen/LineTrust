"use client";

import {
  buildDayProfile,
  confidenceOpacity,
  scoreHeight,
  type ProfileSlot,
} from "@/lib/day-profile";
import {
  dayProfileHint,
  dayProfileSlotLabel,
  dayProfileTitle,
} from "@/lib/copy";
import { formatWindowLabel } from "@/lib/slugs";
import type { AggCell } from "@/lib/trajet";

const BAND_FILL: Record<string, string> = {
  good: "bg-score-good",
  mid: "bg-score-mid",
  bad: "bg-score-bad",
};

function SlotButton({
  slot,
  selected,
  compact,
  onSelect,
}: {
  slot: ProfileSlot;
  selected: boolean;
  compact?: boolean;
  onSelect?: (windowStartMinutes: number) => void;
}) {
  const hasData = slot.cell != null;
  const opacity = hasData ? confidenceOpacity(slot.cell!.n) : 0;
  const heightPct = hasData ? scoreHeight(slot.cell!.score) * 100 : 0;
  const label = dayProfileSlotLabel({
    windowStartMinutes: slot.windowStartMinutes,
    score: slot.cell?.score ?? null,
    n: slot.cell?.n ?? null,
    selected,
  });

  const barClass = hasData
    ? BAND_FILL[slot.band ?? "mid"]
    : "bg-transparent";

  return (
    <button
      type="button"
      disabled={!hasData || !onSelect}
      onClick={() => {
        if (hasData && onSelect) onSelect(slot.windowStartMinutes);
      }}
      aria-label={label}
      aria-pressed={selected}
      title={
        hasData
          ? `${formatWindowLabel(slot.windowStartMinutes)} · ${Math.round(slot.cell!.score)}`
          : `${formatWindowLabel(slot.windowStartMinutes)} · pas de données`
      }
      className={`group relative flex h-full min-w-0 flex-1 flex-col justify-end outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/60 ${
        hasData && onSelect ? "cursor-pointer" : "cursor-default"
      } ${compact ? "px-px" : "px-0.5"}`}
    >
      <span
        className={`w-full rounded-t-sm transition-[height,opacity] duration-200 motion-reduce:transition-none ${barClass} ${
          selected ? "ring-2 ring-ink ring-offset-1 ring-offset-canvas" : ""
        } ${!hasData ? "border border-dashed border-border/80" : ""}`}
        style={{
          height: hasData
            ? `${Math.max(heightPct, 8)}%`
            : compact
              ? "12%"
              : "8%",
          opacity: hasData ? opacity : 1,
        }}
        aria-hidden
      />
    </button>
  );
}

export function DayProfileChart({
  cells,
  selectedWindow,
  onSelectWindow,
  compact = false,
}: {
  cells: readonly AggCell[];
  selectedWindow: number;
  onSelectWindow?: (windowStartMinutes: number) => void;
  compact?: boolean;
}) {
  const profile = buildDayProfile(cells);
  const filled = profile.filter((s) => s.cell != null).length;

  return (
    <section className="space-y-4" aria-labelledby="day-profile-heading">
      <div>
        <h2
          id="day-profile-heading"
          className="font-heading text-lg font-semibold text-ink"
        >
          {dayProfileTitle}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{dayProfileHint(filled)}</p>
      </div>

      <div
        className={`relative flex w-full items-end gap-0 rounded-2xl bg-secondary/40 px-2 pb-2 pt-3 ${
          compact ? "h-28" : "h-36 sm:h-44"
        }`}
        role="listbox"
        aria-label={dayProfileTitle}
      >
        {profile.map((slot) => (
          <SlotButton
            key={slot.windowStartMinutes}
            slot={slot}
            selected={slot.windowStartMinutes === selectedWindow}
            compact={compact}
            onSelect={onSelectWindow}
          />
        ))}
      </div>

      <div className="flex justify-between px-1 text-xs tabular-nums text-ink-muted">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>
    </section>
  );
}
