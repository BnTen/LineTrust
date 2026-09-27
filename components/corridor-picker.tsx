"use client";

import { useState } from "react";
import {
  corridorEndBadge,
  corridorPickerHint,
  corridorPickerTitle,
  corridorSelectionStatus,
  corridorStationButtonLabel,
} from "@/lib/copy";
import {
  applyCorridorClick,
  isStationOnSegment,
  type CorridorEnd,
  type CorridorSelection,
} from "@/lib/corridor-segment";
import { CORRIDOR_STATIONS, type Station } from "@/lib/stations";
import type { ScoreBand } from "@/lib/scoring";

export interface CorridorPickerProps {
  fromSlug?: string | null;
  toSlug?: string | null;
  /** Ordered stops for the active corridor (defaults to Melun). */
  stations?: readonly Station[];
  /** Subtitle under the picker title, e.g. "RER D · Branche Melun". */
  lineLabel?: string;
  /** Soft tint on the active segment (trajet page). */
  band?: ScoreBand | null;
  /** Controlled editing end (trajet soft-update shell). */
  editing?: CorridorEnd | null;
  onEditingChange?: (editing: CorridorEnd | null) => void;
  /** Keep a complete pair (trajet page) — no clear-to-incomplete. */
  lockPair?: boolean;
  onChange?: (next: CorridorSelection) => void;
  className?: string;
}

const bandStroke: Record<ScoreBand, string> = {
  good: "bg-score-good",
  mid: "bg-score-mid",
  bad: "bg-score-bad",
};

function initialEditing(
  fromSlug: string | null,
  toSlug: string | null,
): CorridorEnd | null {
  return fromSlug && toSlug ? "to" : null;
}

export function CorridorPicker({
  fromSlug = null,
  toSlug = null,
  stations = CORRIDOR_STATIONS,
  lineLabel = "RER D · Branche Melun",
  band = null,
  editing: editingProp,
  onEditingChange,
  lockPair = false,
  onChange,
  className = "",
}: CorridorPickerProps) {
  const [editingLocal, setEditingLocal] = useState<CorridorEnd | null>(() =>
    initialEditing(fromSlug, toSlug),
  );
  const isEditingControlled = editingProp !== undefined;
  const editing = isEditingControlled ? editingProp : editingLocal;

  function setEditing(next: CorridorEnd | null) {
    if (!isEditingControlled) setEditingLocal(next);
    onEditingChange?.(next);
  }

  const bySlug = new Map(stations.map((s) => [s.slug, s]));
  const from = fromSlug ? bySlug.get(fromSlug) : undefined;
  const to = toSlug ? bySlug.get(toSlug) : undefined;
  const hasPair = Boolean(from && to);
  const armed = hasPair ? (editing ?? "to") : null;

  const status = corridorSelectionStatus(
    from?.nameDisplay ?? null,
    to?.nameDisplay ?? null,
    armed,
  );

  function selectStation(slug: string) {
    const next = applyCorridorClick(
      { fromSlug, toSlug, editing: armed },
      slug,
      { lockPair },
    );
    setEditing(next.editing);
    if (next.fromSlug !== fromSlug || next.toSlug !== toSlug) {
      onChange?.({ fromSlug: next.fromSlug, toSlug: next.toSlug });
    }
  }

  const activeRailClass =
    band && hasPair ? bandStroke[band] : "bg-line-rer-d";

  return (
    <section
      className={`w-full ${className}`}
      aria-labelledby="corridor-picker-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2
          id="corridor-picker-heading"
          className="font-heading text-lg font-semibold text-ink"
        >
          {corridorPickerTitle}
        </h2>
        <p className="text-sm text-ink-muted">{lineLabel}</p>
      </div>
      <p className="mt-1 max-w-xl text-sm text-ink-muted">
        {corridorPickerHint(hasPair)}
      </p>

      <ol
        className="relative mt-5 max-w-md list-none sm:max-w-lg"
        aria-label={`Gares — ${lineLabel}`}
      >
        <div
          aria-hidden
          className="absolute top-4 bottom-4 left-[1.125rem] w-1.5 rounded-full bg-line-rer-d-muted"
        />
        {hasPair && from && to ? (
          <ActiveRailVertical
            from={from}
            to={to}
            stations={stations}
            className={activeRailClass}
          />
        ) : null}

        {stations.map((station) => {
          const role =
            station.slug === fromSlug
              ? "from"
              : station.slug === toSlug
                ? "to"
                : "none";
          const selected = role !== "none";
          const isArmed = armed !== null && role === armed;
          const onTrip =
            hasPair && from && to
              ? isStationOnSegment(station, from, to)
              : false;
          const muted = hasPair && !onTrip;

          return (
            <li key={station.slug} className="relative z-10">
              <button
                type="button"
                aria-pressed={selected}
                aria-current={isArmed ? "true" : undefined}
                aria-label={corridorStationButtonLabel({
                  name: station.nameDisplay,
                  role,
                  editing: armed,
                })}
                onClick={() => selectStation(station.slug)}
                className={[
                  "flex w-full min-h-12 items-center gap-3.5 rounded-2xl py-2.5 pr-3 pl-1 text-left",
                  "outline-none transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  isArmed
                    ? "bg-secondary ring-2 ring-ink/20"
                    : selected
                      ? "bg-secondary/70"
                      : "hover:bg-secondary/50 active:bg-secondary/70",
                ].join(" ")}
              >
                <span
                  className={[
                    "ml-2.5 size-4 shrink-0 rounded-full border-2 transition-[transform,background-color,border-color] duration-200",
                    "motion-reduce:transition-none",
                    selected
                      ? "scale-125 border-ink bg-line-rer-d"
                      : onTrip
                        ? "border-line-rer-d bg-line-rer-d"
                        : muted
                          ? "border-line-rer-d-muted bg-canvas"
                          : "border-line-rer-d bg-line-rer-d",
                  ].join(" ")}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={[
                      "block text-base leading-snug sm:text-[1.05rem]",
                      selected
                        ? "font-semibold text-ink"
                        : muted
                          ? "text-ink-muted/55"
                          : "font-medium text-ink",
                    ].join(" ")}
                  >
                    {station.nameDisplay}
                  </span>
                  {role === "from" || role === "to" ? (
                    <span
                      className={[
                        "mt-0.5 block text-xs font-medium",
                        isArmed ? "text-ink" : "text-ink-muted",
                      ].join(" ")}
                    >
                      {corridorEndBadge({ role, editing: armed })}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p
        className="mt-4 max-w-md text-sm font-medium text-ink sm:max-w-lg"
        aria-live="polite"
      >
        {status}
      </p>
    </section>
  );
}

function ActiveRailVertical({
  from,
  to,
  stations,
  className,
}: {
  from: Station;
  to: Station;
  stations: readonly Station[];
  className: string;
}) {
  const n = stations.length || 1;
  const i0 = Math.min(from.sequenceOrder, to.sequenceOrder) - 1;
  const i1 = Math.max(from.sequenceOrder, to.sequenceOrder) - 1;
  const topPct = ((i0 + 0.5) / n) * 100;
  const bottomPct = ((i1 + 0.5) / n) * 100;

  return (
    <div
      aria-hidden
      className={`absolute left-[1.125rem] w-1.5 rounded-full ${className}`}
      style={{
        top: `${topPct}%`,
        height: `${bottomPct - topPct}%`,
      }}
    />
  );
}
