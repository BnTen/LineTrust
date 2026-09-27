import type { CSSProperties } from "react";
import Link from "next/link";
import { ScoreReveal } from "@/components/score-reveal";
import { TrajetShare } from "@/components/trajet-share";
import { DISCLAIMER_FR } from "@/lib/disclaimer";
import { formatWindowLabel, buildTrajetSlug } from "@/lib/slugs";
import type { AggCell } from "@/lib/trajet";
import type { ScoreBand } from "@/lib/scoring";
import type { ConfidenceLabel } from "@/lib/uncertainty";
import type { Station } from "@/lib/stations";

const bandLabel: Record<ScoreBand, string> = {
  good: "Plutôt fiable",
  mid: "Mitigé",
  bad: "Peu fiable",
};

const confidenceCopy: Record<ConfidenceLabel, string> = {
  faible: "Historique faible",
  moyen: "Historique moyen",
  fort: "Historique solide",
};

export function TrajetScorePanel({
  from,
  to,
  cell,
  alternative,
  band,
  confidence,
  insufficientHistory,
  dayType,
  windowStartMinutes,
}: {
  from: Station;
  to: Station;
  cell: AggCell | null;
  alternative: AggCell | null;
  band: ScoreBand | null;
  confidence: ConfidenceLabel | null;
  insufficientHistory: boolean;
  dayType: string;
  windowStartMinutes: number;
}) {
  const reverseHref = `/trajet/${buildTrajetSlug(to, from)}?d=${dayType}&w=${windowStartMinutes}`;
  const shareTitle = `${from.nameDisplay} → ${to.nameDisplay} · LineTrust`;
  const dayLabel = dayType === "weekend" ? "Week-end" : "Jour ouvré";

  if (!cell) {
    return (
      <div className="mt-10 max-w-xl space-y-10">
        <section className="lt-enter" style={{ "--lt-delay": 80 } as CSSProperties}>
          <h2 className="font-heading text-lg font-semibold text-ink">Score</h2>
          <p className="mt-3 text-lg text-ink-muted">
            Pas assez d’historique pour cette fenêtre (
            {formatWindowLabel(windowStartMinutes)},{" "}
            {dayType === "weekend" ? "week-end" : "ouvré"}). Essaie une autre
            plage ou le sens inverse.
          </p>
          <p className="mt-4">
            <Link
              href={reverseHref}
              className="text-ink underline-offset-4 hover:underline"
            >
              Voir {to.nameDisplay} → {from.nameDisplay}
            </Link>
          </p>
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
    <div className="mt-10 max-w-xl space-y-10">
      <section
        className="lt-enter"
        style={{ "--lt-delay": 60 } as CSSProperties}
        aria-labelledby="trajet-score-heading"
      >
        <h2
          id="trajet-score-heading"
          className="font-heading text-lg font-semibold text-ink"
        >
          Score
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          {formatWindowLabel(windowStartMinutes)} · {dayLabel} · n={cell.n}
          {confidence ? ` · ${confidenceCopy[confidence]}` : null}
        </p>

        {insufficientHistory ? (
          <p
            className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm text-ink"
            role="status"
          >
            Historique insuffisant (moins de 30 circulations) — le score reste
            indicatif.
          </p>
        ) : null}

        <div className="mt-6">
          <ScoreReveal
            key={`${dayType}-${windowStartMinutes}-${Math.round(cell.score)}`}
            score={cell.score}
            band={band}
            label={band ? bandLabel[band] : null}
          />
        </div>

        <p className="mt-3 text-ink-muted">
          TPR {cell.tpr.toFixed(0)}% · retards &gt;15 min {cell.penalty.toFixed(0)}%
        </p>
        {cell.nUsedEst > 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Dont {cell.nUsedEst} passage(s) avec horaire estimé (obs manquant).
          </p>
        ) : null}
      </section>

      {confidence || insufficientHistory ? (
        <section
          className="lt-enter border-t border-border pt-8"
          style={{ "--lt-delay": 140 } as CSSProperties}
          aria-labelledby="trajet-uncertainty-heading"
        >
          <h2
            id="trajet-uncertainty-heading"
            className="font-heading text-lg font-semibold text-ink"
          >
            Incertitude
          </h2>
          <p className="mt-3 text-ink-muted">
            {confidence ? `${confidenceCopy[confidence]} — ` : null}
            basé sur {cell.n}{" "}
            {cell.n > 1 ? "circulations" : "circulation"} dans cette fenêtre
            (grain pair × sens × type de jour × 30 min).
          </p>
        </section>
      ) : null}

      {alternative ? (
        <section
          className="lt-enter border-t border-border pt-8"
          style={{ "--lt-delay": 200 } as CSSProperties}
          aria-labelledby="trajet-alt-heading"
        >
          <h2
            id="trajet-alt-heading"
            className="font-heading text-lg font-semibold text-ink"
          >
            Alternative ±30 min
          </h2>
          <p className="mt-3 text-ink-muted">
            {formatWindowLabel(alternative.windowStartMinutes)} — score{" "}
            <span className="font-medium text-ink">
              {Math.round(alternative.score)}
            </span>{" "}
            (n={alternative.n})
          </p>
          <Link
            href={`?d=${dayType}&w=${alternative.windowStartMinutes}`}
            className="mt-3 inline-block text-sm text-ink underline-offset-4 hover:underline"
          >
            Afficher cette fenêtre
          </Link>
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
        <p className="mt-6 text-sm leading-relaxed text-ink-muted">
          {DISCLAIMER_FR}
        </p>
      </section>

      <p className="lt-enter text-sm" style={{ "--lt-delay": 300 } as CSSProperties}>
        <Link
          href={reverseHref}
          className="text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Sens inverse : {to.nameDisplay} → {from.nameDisplay}
        </Link>
      </p>
    </div>
  );
}
