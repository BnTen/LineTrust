import type { CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExtraKpis } from "@/components/extra-kpis";
import { MetricBars } from "@/components/metric-bars";
import { MonthlyTrendChart } from "@/components/monthly-trend-chart";
import { TrajetShare } from "@/components/trajet-share";
import {
  confidenceSectionBody,
  contextSummaryLine,
  emptySlotBody,
  estimatedTimesNote,
  formatSlotSpoken,
  suggestionChipLabel,
  trajetCtaProfil,
  tripCountLabel,
} from "@/lib/copy";
import type { MonthlyPoint } from "@/lib/monthly-trend";
import type { AggCell, ReverseKpis } from "@/lib/trajet";
import type { ConfidenceLabel } from "@/lib/uncertainty";
import type { Station } from "@/lib/stations";
import { buildTrajetSlug } from "@/lib/slugs";

function SuggestionButtons({
  suggestions,
  onSelectWindow,
  onSelectDayAndWindow,
  dayType,
}: {
  suggestions: AggCell[];
  dayType: string;
  onSelectWindow?: (windowStartMinutes: number) => void;
  onSelectDayAndWindow?: (
    dayType: AggCell["dayType"],
    windowStartMinutes: number,
  ) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {suggestions.map((s) => {
        const label = suggestionChipLabel({
          windowStartMinutes: s.windowStartMinutes,
          dayType: s.dayType,
          score: s.score,
        });
        const sameDay = s.dayType === dayType;
        if (onSelectDayAndWindow || onSelectWindow) {
          return (
            <Button
              key={`${s.dayType}-${s.windowStartMinutes}`}
              type="button"
              variant="secondary"
              size="lg"
              className="h-11 px-4"
              onClick={() => {
                if (!sameDay && onSelectDayAndWindow) {
                  onSelectDayAndWindow(s.dayType, s.windowStartMinutes);
                } else {
                  onSelectWindow?.(s.windowStartMinutes);
                }
              }}
            >
              {label}
            </Button>
          );
        }
        return (
          <Button
            key={`${s.dayType}-${s.windowStartMinutes}`}
            asChild
            variant="secondary"
            size="lg"
            className="h-11 px-4"
          >
            <Link href={`?d=${s.dayType}&w=${s.windowStartMinutes}`}>
              {label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

function ProfilLink({
  from,
  to,
  dayType,
  windowStartMinutes,
  lineShort,
  corridorId,
}: {
  from: Station;
  to: Station;
  dayType: string;
  windowStartMinutes: number;
  lineShort: string;
  corridorId: string | null;
}) {
  const qs = new URLSearchParams({
    d: dayType,
    w: String(windowStartMinutes),
    line: lineShort,
  });
  if (corridorId) qs.set("c", corridorId);
  return (
    <Button asChild variant="secondary" size="lg" className="h-11 px-5">
      <Link href={`/profil/${buildTrajetSlug(from, to)}?${qs.toString()}`}>
        {trajetCtaProfil}
      </Link>
    </Button>
  );
}

export function TrajetScorePanel({
  from,
  to,
  cell,
  alternative,
  suggestions = [],
  otherDaySuggestions = [],
  odExists = true,
  availableWindows = [],
  confidence,
  insufficientHistory,
  dayType,
  windowStartMinutes,
  lineShort = "D",
  corridorId = null,
  bestHour = null,
  monthly = [],
  volatilitySd = null,
  reverse = { cell: null, bestHour: null, odExists: false },
  onSelectWindow,
  onSelectDayAndWindow,
}: {
  from: Station;
  to: Station;
  cell: AggCell | null;
  alternative: AggCell | null;
  suggestions?: AggCell[];
  otherDaySuggestions?: AggCell[];
  odExists?: boolean;
  availableWindows?: readonly number[];
  confidence: ConfidenceLabel | null;
  insufficientHistory: boolean;
  dayType: string;
  windowStartMinutes: number;
  lineShort?: string;
  corridorId?: string | null;
  bestHour?: AggCell | null;
  monthly?: readonly MonthlyPoint[];
  volatilitySd?: number | null;
  reverse?: ReverseKpis;
  onSelectWindow?: (windowStartMinutes: number) => void;
  onSelectDayAndWindow?: (
    dayType: AggCell["dayType"],
    windowStartMinutes: number,
  ) => void;
}) {
  const shareTitle = `${from.nameDisplay} vers ${to.nameDisplay} · LineTrust`;
  const estNote = cell ? estimatedTimesNote(cell.nUsedEst) : null;

  if (!cell) {
    const nearby =
      alternative &&
      !suggestions.some(
        (s) => s.windowStartMinutes === alternative.windowStartMinutes,
      )
        ? [alternative, ...suggestions].slice(0, 3)
        : suggestions.length > 0
          ? suggestions
          : alternative
            ? [alternative]
            : [];
    const crossDay = nearby.length === 0 ? otherDaySuggestions : [];

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
            {emptySlotBody({
              windowStartMinutes,
              dayType,
              odExists,
              hasSameDayWindows: availableWindows.length > 0,
            })}
          </p>
          {nearby.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-ink">
                Créneaux avec des données
              </h3>
              <SuggestionButtons
                suggestions={nearby}
                dayType={dayType}
                onSelectWindow={onSelectWindow}
                onSelectDayAndWindow={onSelectDayAndWindow}
              />
            </div>
          ) : null}
          {crossDay.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-ink">
                Essayer {dayType === "weekend" ? "en semaine" : "le week-end"}
              </h3>
              <SuggestionButtons
                suggestions={crossDay}
                dayType={dayType}
                onSelectWindow={onSelectWindow}
                onSelectDayAndWindow={onSelectDayAndWindow}
              />
            </div>
          ) : null}
          {odExists ? (
            <div className="mt-6">
              <ProfilLink
                from={from}
                to={to}
                dayType={dayType}
                windowStartMinutes={windowStartMinutes}
                lineShort={lineShort}
                corridorId={corridorId}
              />
            </div>
          ) : null}
        </section>
        {(bestHour || reverse.odExists) && odExists ? (
          <section
            className="lt-enter border-t border-border pt-8"
            style={{ "--lt-delay": 120 } as CSSProperties}
          >
            <ExtraKpis
              bestHour={bestHour}
              selectedWindow={windowStartMinutes}
              reverse={reverse}
              onSelectWindow={onSelectWindow}
            />
          </section>
        ) : null}
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

        <MetricBars tpr={cell.tpr} penalty={cell.penalty} />
        {estNote ? (
          <p className="mt-2 text-sm text-ink-muted">{estNote}</p>
        ) : null}

        <div className="mt-6">
          <ProfilLink
            from={from}
            to={to}
            dayType={dayType}
            windowStartMinutes={windowStartMinutes}
            lineShort={lineShort}
            corridorId={corridorId}
          />
        </div>
      </section>

      {monthly.length > 0 ? (
        <section
          className="lt-enter border-t border-border pt-8"
          style={{ "--lt-delay": 100 } as CSSProperties}
        >
          <MonthlyTrendChart points={monthly} volatilitySd={volatilitySd} />
        </section>
      ) : null}

      {bestHour || reverse.odExists ? (
        <section
          className="lt-enter border-t border-border pt-8"
          style={{ "--lt-delay": 120 } as CSSProperties}
        >
          <ExtraKpis
            bestHour={bestHour}
            selectedWindow={windowStartMinutes}
            reverse={reverse}
            onSelectWindow={onSelectWindow}
          />
        </section>
      ) : null}

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
