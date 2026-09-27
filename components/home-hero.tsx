import type { CSSProperties } from "react";
import Image from "next/image";
import { StationSearch } from "@/components/station-search";

/**
 * TravelAI-light hero — DESIGN.md budget:
 * brand + 1 headline + 1 sentence + search CTA + full-bleed rail plane.
 * No stats strip, no cards in hero. Corridor timeline lives on /trajet only.
 */
export function HomeHero() {
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

      <section className="relative z-10 flex flex-1 flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 md:max-w-xl md:px-12 lg:max-w-2xl lg:px-14 md:py-20">
        <h1
          className="lt-enter font-heading text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl"
          style={{ "--lt-delay": 40 } as CSSProperties}
        >
          LineTrust
        </h1>
        <p
          className="lt-enter mt-5 max-w-xl font-heading text-2xl font-medium leading-snug text-ink sm:text-3xl lg:text-[2rem]"
          style={{ "--lt-delay": 140 } as CSSProperties}
        >
          Des chiffres pour un trajet{" "}
          <span className="text-signature-gradient">fiable</span>.
        </p>
        <p
          className="lt-enter mt-4 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg"
          style={{ "--lt-delay": 240 } as CSSProperties}
        >
          Choisis ton départ et ton arrivée sur le RER D (Branche Melun). On te
          montre comment ce trajet s’est passé dans le passé — en semaine ou le
          week-end, sur un créneau d’une demi-heure.
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
    </main>
  );
}
