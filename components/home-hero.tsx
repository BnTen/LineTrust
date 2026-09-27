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
 * Line pills + optional branch live inside StationSearch.
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
    <main className="relative flex flex-1 flex-col overflow-hidden md:min-h-[calc(100dvh-4.75rem)]">
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/images/hero-rail.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/85 to-canvas/55 md:bg-gradient-to-r md:from-canvas md:via-canvas/88 md:to-canvas/25" />
      </div>

      <section className="relative z-10 flex flex-1 flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 md:max-w-2xl md:px-12 lg:max-w-3xl lg:px-14 xl:max-w-4xl md:py-16 lg:py-20">
        <h1
          className="lt-enter font-heading text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl"
          style={{ "--lt-delay": 40 } as CSSProperties}
        >
          LineTrust
        </h1>
        <p
          className="lt-enter mt-5 max-w-2xl font-heading text-2xl font-medium leading-snug text-ink sm:text-3xl lg:text-[2rem]"
          style={{ "--lt-delay": 140 } as CSSProperties}
        >
          Des chiffres pour un trajet{" "}
          <span className="text-signature-gradient">fiable</span>.
        </p>
        <p
          className="lt-enter mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
          style={{ "--lt-delay": 240 } as CSSProperties}
        >
          {blurb}
        </p>
        <div
          className="lt-enter mt-8 w-full max-w-2xl lg:max-w-none"
          style={{ "--lt-delay": 360 } as CSSProperties}
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
  );
}
