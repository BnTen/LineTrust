import type { CSSProperties } from "react";
import Image from "next/image";
import { StationSearch } from "@/components/station-search";

/**
 * TravelAI-light hero — DESIGN.md budget:
 * brand + 1 headline + 1 sentence + search CTA + full-bleed rail plane.
 * No stats strip, no cards in hero.
 */
export function HomeHero() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden md:min-h-[calc(100dvh-4.75rem)]">
      <div className="grid flex-1 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 md:px-12 lg:px-14 md:py-20">
          <p
            className="lt-enter font-heading text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl"
            style={{ "--lt-delay": 40 } as CSSProperties}
          >
            LineTrust
          </p>
          <h1
            className="lt-enter mt-5 max-w-xl font-heading text-2xl font-medium leading-snug text-ink sm:text-3xl lg:text-[2rem]"
            style={{ "--lt-delay": 140 } as CSSProperties}
          >
            Des chiffres pour un trajet{" "}
            <span className="text-signature-gradient">fiable</span>.
          </h1>
          <p
            className="lt-enter mt-4 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg"
            style={{ "--lt-delay": 240 } as CSSProperties}
          >
            Score historique orienté A→B sur le corridor RER D Branche Melun —
            ouvré ou week-end, fenêtre de 30 minutes.
          </p>
          <div
            className="lt-enter mt-10 max-w-md"
            style={{ "--lt-delay": 360 } as CSSProperties}
          >
            <StationSearch
              defaultFrom="paris-gare-de-lyon"
              defaultTo="melun"
            />
          </div>
        </section>

        {/* Full-bleed rail plane: stacked on phone; side plane from md */}
        <div
          className="lt-enter relative min-h-[42vh] w-full sm:min-h-[48vh] md:min-h-0"
          style={{ "--lt-delay": 180 } as CSSProperties}
          aria-hidden
        >
          <Image
            src="/images/hero-rail.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover object-[center_40%] md:rounded-l-media"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent md:bg-gradient-to-r md:from-canvas md:via-canvas/25 md:to-transparent" />
        </div>
      </div>
    </main>
  );
}
