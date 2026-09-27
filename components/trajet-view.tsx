"use client";

import { useRef, useState, useTransition } from "react";
import { CorridorPicker } from "@/components/corridor-picker";
import { ScoreReveal } from "@/components/score-reveal";
import { TrajetControls } from "@/components/trajet-controls";
import { TrajetScorePanel } from "@/components/trajet-score-panel";
import { bandLabel } from "@/lib/copy";
import type { CorridorEnd, CorridorSelection } from "@/lib/corridor-segment";
import type { DayType } from "@/lib/scoring";
import { buildTrajetSlug } from "@/lib/slugs";
import type { Station } from "@/lib/stations";
import type { TrajetResult } from "@/lib/trajet";

interface TrajetApiPayload {
  from: Station;
  to: Station;
  dayType: DayType;
  windowStartMinutes: number;
  result: TrajetResult;
}

function syncTrajetUrl(
  from: Station,
  to: Station,
  dayType: DayType,
  windowStartMinutes: number,
  lineShort: string,
  corridorId: string | null,
) {
  const qs = new URLSearchParams({
    d: dayType,
    w: String(windowStartMinutes),
    line: lineShort,
  });
  if (corridorId) qs.set("c", corridorId);
  const path = `/trajet/${buildTrajetSlug(from, to)}?${qs.toString()}`;
  window.history.replaceState(window.history.state, "", path);
  document.title = `${from.nameDisplay} vers ${to.nameDisplay} · LineTrust`;
}

/**
 * Client shell for /trajet: corridor + controls update metrics via /api/trajet
 * and sync the URL without a full App Router navigation.
 */
export function TrajetView({
  initialFrom,
  initialTo,
  initialDayType,
  initialWindowStartMinutes,
  initialResult,
  lineShort,
  corridorId,
  corridorStations,
  lineLabel,
}: {
  initialFrom: Station;
  initialTo: Station;
  initialDayType: DayType;
  initialWindowStartMinutes: number;
  initialResult: TrajetResult;
  lineShort: string;
  lineId: string;
  corridorId: string | null;
  corridorStations: Station[];
  lineLabel: string;
}) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [dayType, setDayType] = useState(initialDayType);
  const [windowStartMinutes, setWindowStartMinutes] = useState(
    initialWindowStartMinutes,
  );
  const [result, setResult] = useState(initialResult);
  const [editing, setEditing] = useState<CorridorEnd | null>("to");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fetchGen = useRef(0);
  const bySlug = new Map(corridorStations.map((s) => [s.slug, s]));

  async function loadTrajet(
    nextFrom: Station,
    nextTo: Station,
    nextDay: DayType,
    nextWindow: number,
  ) {
    const gen = ++fetchGen.current;
    setError(null);
    const qs = new URLSearchParams({
      from: nextFrom.slug,
      to: nextTo.slug,
      d: nextDay,
      w: String(nextWindow),
      line: lineShort,
    });
    if (corridorId) qs.set("c", corridorId);
    const res = await fetch(`/api/trajet?${qs.toString()}`);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "Impossible de charger ce trajet.");
    }
    const data = (await res.json()) as TrajetApiPayload;
    if (gen !== fetchGen.current) return;

    setFrom(data.from);
    setTo(data.to);
    setDayType(data.dayType);
    setWindowStartMinutes(data.windowStartMinutes);
    setResult(data.result);
    syncTrajetUrl(
      data.from,
      data.to,
      data.dayType,
      data.windowStartMinutes,
      lineShort,
      corridorId,
    );
  }

  function softUpdate(opts: {
    from?: Station;
    to?: Station;
    dayType?: DayType;
    windowStartMinutes?: number;
  }) {
    const nextFrom = opts.from ?? from;
    const nextTo = opts.to ?? to;
    const nextDay = opts.dayType ?? dayType;
    const nextWindow = opts.windowStartMinutes ?? windowStartMinutes;

    setFrom(nextFrom);
    setTo(nextTo);
    setDayType(nextDay);
    setWindowStartMinutes(nextWindow);
    syncTrajetUrl(
      nextFrom,
      nextTo,
      nextDay,
      nextWindow,
      lineShort,
      corridorId,
    );

    startTransition(() => {
      void loadTrajet(nextFrom, nextTo, nextDay, nextWindow).catch(
        (err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger ce trajet.",
          );
        },
      );
    });
  }

  function onCorridorChange(next: CorridorSelection) {
    if (!next.fromSlug || !next.toSlug || next.fromSlug === next.toSlug) return;
    if (next.fromSlug === from.slug && next.toSlug === to.slug) return;
    const nextFrom = bySlug.get(next.fromSlug);
    const nextTo = bySlug.get(next.toSlug);
    if (!nextFrom || !nextTo) return;
    softUpdate({ from: nextFrom, to: nextTo });
  }

  const score = result.cell?.score ?? null;
  const scoreBandText = result.band ? bandLabel[result.band] : null;
  const liveAnnouncement = isPending
    ? "Mise à jour de la fiabilité…"
    : score !== null
      ? `Fiabilité ${Math.round(score)}${scoreBandText ? `, ${scoreBandText}` : ""}`
      : "Pas de score pour ce créneau";

  const pendingClass = isPending
    ? "opacity-60 transition-opacity duration-200 motion-reduce:transition-none"
    : "opacity-100 transition-opacity duration-200 motion-reduce:transition-none";

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <div className="sticky top-0 z-30 -mx-6 border-b border-border/70 bg-canvas/90 px-6 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/80 lg:static lg:z-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <div className="flex items-start justify-between gap-3 sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-muted">{lineLabel}</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {from.nameDisplay}
              <span className="text-ink-muted"> vers </span>
              {to.nameDisplay}
            </h1>
          </div>
          {score !== null ? (
            <div className={pendingClass}>
              <ScoreReveal
                key={`${from.slug}-${to.slug}-${dayType}-${windowStartMinutes}-${Math.round(score)}`}
                score={score}
                band={result.band}
                label={scoreBandText}
                size="header"
              />
            </div>
          ) : (
            <p className="shrink-0 pt-1 text-sm text-ink-muted">Pas de score</p>
          )}
        </div>
      </div>

      <div className="mt-6 lg:mt-8">
        <TrajetControls
          dayType={dayType}
          windowStartMinutes={windowStartMinutes}
          onDayTypeChange={(d) => softUpdate({ dayType: d })}
          onWindowChange={(w) => softUpdate({ windowStartMinutes: w })}
        />
      </div>

      {error ? (
        <p className="mt-4 text-sm text-score-bad" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className="mt-8 grid gap-8 border-t border-border pt-8 lg:mt-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-12"
        aria-busy={isPending}
      >
        <div className={`order-1 lg:order-2 ${pendingClass}`}>
          <TrajetScorePanel
            from={from}
            to={to}
            cell={result.cell}
            alternative={result.alternative}
            confidence={result.confidence}
            insufficientHistory={result.insufficientHistory}
            dayType={dayType}
            windowStartMinutes={windowStartMinutes}
            onReverse={() => softUpdate({ from: to, to: from })}
            onSelectWindow={(w) => softUpdate({ windowStartMinutes: w })}
          />
        </div>
        <div className="order-2 lg:order-1">
          <CorridorPicker
            fromSlug={from.slug}
            toSlug={to.slug}
            stations={corridorStations}
            lineLabel={lineLabel}
            band={result.band}
            editing={editing}
            onEditingChange={setEditing}
            lockPair
            onChange={onCorridorChange}
          />
        </div>
      </div>
    </>
  );
}
