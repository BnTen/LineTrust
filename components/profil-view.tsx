"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DayProfileChart } from "@/components/day-profile-chart";
import { ScoreReveal } from "@/components/score-reveal";
import { TrajetControls } from "@/components/trajet-controls";
import {
  bandLabel,
  bestHourBody,
  profilCtaTrajet,
  profilPageEyebrow,
} from "@/lib/copy";
import { pickBestHour } from "@/lib/day-profile";
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

function syncProfilUrl(
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
  const path = `/profil/${buildTrajetSlug(from, to)}?${qs.toString()}`;
  window.history.replaceState(window.history.state, "", path);
  document.title = `Profil · ${from.nameDisplay} vers ${to.nameDisplay} · LineTrust`;
}

/**
 * Client shell for /profil — one job: compare créneaux of a directed OD.
 */
export function ProfilView({
  initialFrom,
  initialTo,
  initialDayType,
  initialWindowStartMinutes,
  initialResult,
  lineShort,
  corridorId,
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
  lineLabel: string;
}) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [dayType, setDayType] = useState(initialDayType);
  const [windowStartMinutes, setWindowStartMinutes] = useState(
    initialWindowStartMinutes,
  );
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);

  async function softUpdate(opts: {
    from?: Station;
    to?: Station;
    dayType?: DayType;
    windowStartMinutes?: number;
  }) {
    const nextFrom = opts.from ?? from;
    const nextTo = opts.to ?? to;
    const nextDay = opts.dayType ?? dayType;
    const nextW = opts.windowStartMinutes ?? windowStartMinutes;
    const id = ++requestId.current;

    setFrom(nextFrom);
    setTo(nextTo);
    setDayType(nextDay);
    setWindowStartMinutes(nextW);
    syncProfilUrl(
      nextFrom,
      nextTo,
      nextDay,
      nextW,
      lineShort,
      corridorId,
    );

    startTransition(async () => {
      const qs = new URLSearchParams({
        from: nextFrom.slug,
        to: nextTo.slug,
        d: nextDay,
        w: String(nextW),
        line: lineShort,
      });
      if (corridorId) qs.set("c", corridorId);
      try {
        const res = await fetch(`/api/trajet?${qs.toString()}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          if (id === requestId.current) {
            setError(body?.error ?? "Impossible de charger le profil.");
          }
          return;
        }
        const data = (await res.json()) as TrajetApiPayload;
        if (id !== requestId.current) return;
        setError(null);
        setFrom(data.from);
        setTo(data.to);
        setDayType(data.dayType);
        setWindowStartMinutes(data.windowStartMinutes);
        setResult(data.result);
      } catch {
        if (id === requestId.current) {
          setError("Impossible de charger le profil.");
        }
      }
    });
  }

  const score = result.cell?.score ?? null;
  const scoreBandText = result.band ? bandLabel[result.band] : null;
  const best = pickBestHour(result.profile);
  const pendingClass = isPending
    ? "opacity-60 transition-opacity duration-200 motion-reduce:transition-none"
    : "opacity-100 transition-opacity duration-200 motion-reduce:transition-none";

  const trajetQs = new URLSearchParams({
    d: dayType,
    w: String(windowStartMinutes),
    line: lineShort,
  });
  if (corridorId) trajetQs.set("c", corridorId);
  const trajetHref = `/trajet/${buildTrajetSlug(from, to)}?${trajetQs.toString()}`;

  return (
    <>
      <p className="text-sm text-ink-muted">{profilPageEyebrow}</p>
      <div className="mt-1 flex items-start justify-between gap-3 sm:gap-6">
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
        ) : null}
      </div>

      <div className="mt-6 lg:mt-8">
        <TrajetControls
          dayType={dayType}
          windowStartMinutes={windowStartMinutes}
          availableWindows={result.availableWindows}
          from={from}
          to={to}
          onDayTypeChange={(d) => softUpdate({ dayType: d })}
          onWindowChange={(w) => softUpdate({ windowStartMinutes: w })}
          onReverse={() => softUpdate({ from: to, to: from })}
        />
      </div>

      {error ? (
        <p className="mt-4 text-sm text-score-bad" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className={`mt-8 border-t border-border pt-8 ${pendingClass}`}
        aria-busy={isPending}
      >
        <DayProfileChart
          cells={result.profile}
          selectedWindow={windowStartMinutes}
          onSelectWindow={(w) => softUpdate({ windowStartMinutes: w })}
        />
      </div>

      {best ? (
        <section className="mt-8 border-t border-border pt-8">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Meilleur créneau
          </h2>
          <p className="mt-2 text-ink-muted">
            {bestHourBody({
              windowStartMinutes: best.windowStartMinutes,
              score: best.score,
              n: best.n,
              dayType,
            })}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mt-4 h-11 px-5"
            onClick={() =>
              softUpdate({ windowStartMinutes: best.windowStartMinutes })
            }
          >
            Sélectionner ce créneau
          </Button>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-8">
        <Button asChild size="lg" className="h-11 px-5">
          <Link href={trajetHref}>{profilCtaTrajet}</Link>
        </Button>
      </div>
    </>
  );
}
