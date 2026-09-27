import { Button } from "@/components/ui/button";
import {
  bestHourBanner,
  reverseBestBody,
  reverseCompareTitle,
  reverseSameSlotBody,
} from "@/lib/copy";
import { formatWindowLabel } from "@/lib/slugs";
import type { AggCell, ReverseKpis } from "@/lib/trajet";

export function ExtraKpis({
  bestHour,
  selectedWindow,
  reverse,
  onSelectWindow,
}: {
  bestHour: AggCell | null;
  selectedWindow: number;
  reverse: ReverseKpis;
  onSelectWindow?: (windowStartMinutes: number) => void;
}) {
  const hasBest = bestHour != null;
  const hasReverse = reverse.odExists;

  if (!hasBest && !hasReverse) return null;

  return (
    <div className="space-y-6">
      {hasBest ? (
        <section aria-labelledby="best-hour-heading">
          <h2
            id="best-hour-heading"
            className="font-heading text-lg font-semibold text-ink"
          >
            Meilleur créneau
          </h2>
          <p className="mt-2 text-ink-muted">
            {bestHourBanner({
              windowStartMinutes: bestHour.windowStartMinutes,
              score: bestHour.score,
              isSelected: bestHour.windowStartMinutes === selectedWindow,
            })}
          </p>
          {onSelectWindow &&
          bestHour.windowStartMinutes !== selectedWindow ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="mt-3 h-11 px-5"
              onClick={() => onSelectWindow(bestHour.windowStartMinutes)}
            >
              Voir {formatWindowLabel(bestHour.windowStartMinutes)}
            </Button>
          ) : null}
        </section>
      ) : null}

      {hasReverse ? (
        <section aria-labelledby="reverse-kpi-heading">
          <h2
            id="reverse-kpi-heading"
            className="font-heading text-lg font-semibold text-ink"
          >
            {reverseCompareTitle}
          </h2>
          <p className="mt-2 text-ink-muted">
            {reverseSameSlotBody({
              score: reverse.cell?.score ?? null,
              windowStartMinutes: selectedWindow,
            })}
          </p>
          {reverse.bestHour ? (
            <p className="mt-2 text-ink-muted">
              {reverseBestBody({
                windowStartMinutes: reverse.bestHour.windowStartMinutes,
                score: reverse.bestHour.score,
              })}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-ink-muted">
            Utilise le bouton « Dans l’autre sens » ci-dessus pour changer de
            direction.
          </p>
        </section>
      ) : null}
    </div>
  );
}
