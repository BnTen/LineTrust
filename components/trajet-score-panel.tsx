import type { CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReverseDirectionCta } from "@/components/reverse-direction-cta";
import { TrajetShare } from "@/components/trajet-share";
import {
  confidenceSectionBody,
  contextSummaryLine,
  dayTypeLabel,
  estimatedTimesNote,
  formatSlotSpoken,
  lateLine,
  onTimeLine,
  tripCountLabel,
} from "@/lib/copy";
import type { AggCell } from "@/lib/trajet";
import type { ConfidenceLabel } from "@/lib/uncertainty";
import type { Station } from "@/lib/stations";

export function TrajetScorePanel({
  from,
  to,
  cell,
  alternative,
  confidence,
  insufficientHistory,
  dayType,
  windowStartMinutes,
  onReverse,
  onSelectWindow,
}: {
  from: Station;
  to: Station;
  cell: AggCell | null;
  alternative: AggCell | null;
  confidence: ConfidenceLabel | null;
  insufficientHistory: boolean;
  dayType: string;
  windowStartMinutes: number;
  onReverse: () => void;
  onSelectWindow?: (windowStartMinutes: number) => void;
}) {
  const shareTitle = `${from.nameDisplay} vers ${to.nameDisplay} · LineTrust`;
  const estNote = cell ? estimatedTimesNote(cell.nUsedEst) : null;

  if (!cell) {
    return (
      <div className="max-w-2xl space-y-8 lg:max-w-none">
        <section
          className="lt-enter"
          style={{ "--lt-delay": 80 } as CSSProperties}
        >
          <h2 className="font-heading text-lg font-semibold text-ink">
            Ce créneau
          </h2>
          <p className="mt-3 text-lg text-ink-muted">
            Pas assez de trajets passés pour les départs{" "}
            {formatSlotSpoken(windowStartMinutes)} {dayTypeLabel(dayType)}.
            Essaie un autre créneau, ou le trajet dans l’autre sens.
          </p>
          <div className="mt-6">
            <ReverseDirectionCta from={from} to={to} onReverse={onReverse} />
          </div>
        </section>
        <section
          className="lt-enter border-t border-border pt-8"
          style={{ "--lt-delay": 160 } as CSSProperties}
        >
          <h2 className="font-heading text-lg font-semibold text-ink">
            Partager
          </h2>
          <div className="mt-4">
            <TrajetShare title={shareTitle} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8 lg:max-w-none">
      <section
        className="lt-enter"
        style={{ "--lt-delay": 60 } as CSSProperties}
        aria-labelledby="trajet-score-heading"
      >
        <h2
          id="trajet-score-heading"
          className="font-heading text-lg font-semibold text-ink"
        >
          Ce créneau
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          {contextSummaryLine({
            windowStartMinutes,
            dayType,
            n: cell.n,
          })}
        </p>

        {insufficientHistory ? (
          <p
            className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm text-ink"
            role="status"
          >
            Moins de 30 trajets passés sur ce créneau : le score est indicatif,
            à prendre avec prudence.
          </p>
        ) : null}

        <ul className="mt-4 space-y-1.5 text-ink-muted">
          <li>{onTimeLine(cell.tpr)}</li>
          <li>{lateLine(cell.penalty)}</li>
        </ul>
        {estNote ? (
          <p className="mt-2 text-sm text-ink-muted">{estNote}</p>
        ) : null}
      </section>

      <section
        className="lt-enter border-t border-border pt-8"
        style={{ "--lt-delay": 100 } as CSSProperties}
      >
        <ReverseDirectionCta from={from} to={to} onReverse={onReverse} />
      </section>

      {alternative ? (
        <section
          className="lt-enter border-t border-border pt-8"
          style={{ "--lt-delay": 140 } as CSSProperties}
          aria-labelledby="trajet-alt-heading"
        >
          <h2
            id="trajet-alt-heading"
            className="font-heading text-lg font-semibold text-ink"
          >
            Un créneau voisin plus fiable
          </h2>
          <p className="mt-3 text-ink-muted">
            Départs {formatSlotSpoken(alternative.windowStartMinutes)} — score{" "}
            <span className="font-medium text-ink">
              {Math.round(alternative.score)}
            </span>
            , d’après {tripCountLabel(alternative.n)}.
          </p>
          {onSelectWindow ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="mt-4 h-11 px-5"
              onClick={() => onSelectWindow(alternative.windowStartMinutes)}
            >
              Voir ce créneau
            </Button>
          ) : (
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="mt-4 h-11 px-5"
            >
              <Link href={`?d=${dayType}&w=${alternative.windowStartMinutes}`}>
                Voir ce créneau
              </Link>
            </Button>
          )}
        </section>
      ) : null}

      {confidence || insufficientHistory ? (
        <section
          className="lt-enter border-t border-border pt-8"
          style={{ "--lt-delay": 200 } as CSSProperties}
          aria-labelledby="trajet-uncertainty-heading"
        >
          <h2
            id="trajet-uncertainty-heading"
            className="font-heading text-lg font-semibold text-ink"
          >
            D’où vient ce chiffre ?
          </h2>
          <p className="mt-3 text-ink-muted">
            {confidenceSectionBody({
              n: cell.n,
              confidence,
              windowStartMinutes,
              dayType,
            })}
          </p>
        </section>
      ) : null}

      <section
        className="lt-enter border-t border-border pt-8"
        style={{ "--lt-delay": 260 } as CSSProperties}
        aria-labelledby="trajet-share-heading"
      >
        <h2
          id="trajet-share-heading"
          className="font-heading text-lg font-semibold text-ink"
        >
          Partager
        </h2>
        <div className="mt-4">
          <TrajetShare title={shareTitle} />
        </div>
      </section>
    </div>
  );
}
