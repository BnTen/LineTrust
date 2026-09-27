"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { StationSearch } from "@/components/station-search";
import type { OdCoverage } from "@/lib/coverage";
import {
  DEFAULT_CORRIDOR_ID,
  DEFAULT_LINE_ID,
  lineHeroCopy,
  type NetworkCatalog,
} from "@/lib/network";

/**
 * TravelAI-light hero — DESIGN.md budget:
 * brand + 1 headline + 1 sentence + search CTA + full-bleed rail plane.
 * Editorial beat sits below the fold (one job).
 */
export function HomeHero({
  catalog,
  coverage,
}: {
  catalog: NetworkCatalog;
  coverage: OdCoverage;
}) {
  const [lineId, setLineId] = useState(DEFAULT_LINE_ID);
  const [corridorId, setCorridorId] = useState<string | null>(
    DEFAULT_CORRIDOR_ID,
  );

  const blurb = useMemo(() => {
    const line = catalog.lines.find((l) => l.lineId === lineId);
    if (!line) return "";
    const corridor = corridorId
      ? (catalog.corridors.find((c) => c.corridorId === corridorId) ?? null)
      : null;
    return lineHeroCopy(line, corridor);
  }, [catalog, lineId, corridorId]);

  return (
    <>
      <main className="relative flex flex-1 flex-col overflow-hidden md:min-h-[calc(100dvh-4.75rem)]">
        <div className="absolute inset-0" aria-hidden>
          <Image
            src="/images/hero-rail.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_40%] scale-[1.02]"
          />
          {/* Lighter wash on the right so the rail photo stays cinematic */}
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/75 to-canvas/35 md:bg-gradient-to-r md:from-canvas md:via-canvas/70 md:to-transparent" />
          <div className="absolute inset-y-0 left-0 hidden w-[min(52%,36rem)] bg-gradient-to-r from-canvas/90 to-transparent md:block" />
        </div>

        <section className="relative z-10 flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 sm:py-14 md:max-w-xl md:px-12 lg:max-w-2xl lg:px-14 xl:max-w-2xl md:py-16">
          <h1
            className="lt-enter font-heading text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl"
            style={{ "--lt-delay": 40 } as CSSProperties}
          >
            LineTrust
          </h1>
          <p
            className="lt-enter mt-4 max-w-lg font-heading text-2xl font-medium leading-snug text-ink sm:mt-5 sm:text-3xl"
            style={{ "--lt-delay": 120 } as CSSProperties}
          >
            Des chiffres pour un trajet{" "}
            <span className="text-signature-gradient">fiable</span>.
          </p>
          <p
            className="lt-enter mt-3 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg"
            style={{ "--lt-delay": 200 } as CSSProperties}
          >
            {blurb}
          </p>
          <div
            className="lt-enter mt-8 w-full"
            style={{ "--lt-delay": 300 } as CSSProperties}
          >
            <StationSearch
              catalog={catalog}
              coverage={coverage}
              defaultLineId={DEFAULT_LINE_ID}
              defaultCorridorId={DEFAULT_CORRIDOR_ID}
              defaultFrom="paris-gare-de-lyon"
              defaultTo="melun"
              onSelectionChange={(nextLineId, nextCorridorId) => {
                setLineId(nextLineId);
                setCorridorId(nextCorridorId);
              }}
            />
          </div>
        </section>
      </main>

      <section
        className="border-t border-border bg-canvas px-6 py-14 sm:px-10 sm:py-16 md:px-12 lg:px-14"
        aria-labelledby="home-method-heading"
      >
        <div className="mx-auto max-w-2xl">
          <h2
            id="home-method-heading"
            className="font-heading text-xl font-semibold tracking-tight text-ink sm:text-2xl"
          >
            Historique, pas du live
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Score de fiabilité sur des trajets passés — créneau de 30&nbsp;min,
            en semaine ou le week-end. Outil indépendant fondé sur l’open data,
            pas un service opérateur.
          </p>
        </div>
      </section>
    </>
  );
}
