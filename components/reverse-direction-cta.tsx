"use client";

import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  reverseDirectionDetail,
  reverseDirectionTitle,
} from "@/lib/copy";
import type { Station } from "@/lib/stations";

/**
 * Clear, full-width reverse-direction CTA — pill secondary, not a buried text link.
 */
export function ReverseDirectionCta({
  from,
  to,
  onReverse,
}: {
  from: Station;
  to: Station;
  onReverse: () => void;
}) {
  const detail = reverseDirectionDetail(to.nameDisplay, from.nameDisplay);

  return (
    <section aria-labelledby="trajet-reverse-heading">
      <h2
        id="trajet-reverse-heading"
        className="font-heading text-lg font-semibold text-ink"
      >
        {reverseDirectionTitle}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Les scores ne sont pas les mêmes dans chaque sens.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={onReverse}
        className="mt-4 h-auto min-h-14 w-full justify-start gap-3 px-4 py-3 text-left text-base whitespace-normal sm:w-auto sm:min-w-[18rem]"
        aria-label={`${reverseDirectionTitle} : ${detail}`}
      >
        <ArrowLeftRight
          className="size-5 shrink-0 text-ink"
          aria-hidden
          data-icon="inline-start"
        />
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <span className="font-medium text-ink">{detail}</span>
          <span className="text-xs font-normal text-ink-muted">
            Voir la fiabilité dans ce sens
          </span>
        </span>
      </Button>
    </section>
  );
}
