import Link from "next/link";
import { formatWindowLabel } from "@/lib/slugs";
import type { AggCell } from "@/lib/trajet";
import type { ScoreBand } from "@/lib/scoring";
import type { ConfidenceLabel } from "@/lib/uncertainty";
import { buildTrajetSlug } from "@/lib/slugs";
import type { Station } from "@/lib/stations";

const bandClass: Record<ScoreBand, string> = {
  good: "text-score-good",
  mid: "text-score-mid",
  bad: "text-score-bad",
};

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

  if (!cell) {
    return (
      <section className="mt-10 max-w-xl">
        <p className="text-lg text-ink-muted">
          Pas assez d’historique pour cette fenêtre ({formatWindowLabel(windowStartMinutes)},{" "}
          {dayType === "weekend" ? "week-end" : "ouvré"}). Essaie une autre
          plage ou le sens inverse.
        </p>
        <p className="mt-4">
          <Link href={reverseHref} className="text-ink underline-offset-4 hover:underline">
            Voir {to.nameDisplay} → {from.nameDisplay}
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 max-w-xl">
      <p className="text-sm text-ink-muted">
        {formatWindowLabel(windowStartMinutes)} ·{" "}
        {dayType === "weekend" ? "Week-end" : "Jour ouvré"} · n={cell.n}
        {confidence ? ` · ${confidenceCopy[confidence]}` : null}
      </p>

      {insufficientHistory ? (
        <p
          className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm text-ink"
          role="status"
        >
          Historique insuffisant (moins de 30 circulations) — le score reste
          indicatif.
        </p>
      ) : null}

      <p
        className={`mt-6 font-heading text-7xl font-semibold tracking-tight tabular-nums ${
          band ? bandClass[band] : "text-ink"
        }`}
      >
        {Math.round(cell.score)}
      </p>
      <p className="mt-2 text-lg text-ink">
        {band ? bandLabel[band] : null}
        <span className="text-ink-muted">
          {" "}
          · TPR {cell.tpr.toFixed(0)}% · retards &gt;15 min {cell.penalty.toFixed(0)}%
        </span>
      </p>
      {cell.nUsedEst > 0 ? (
        <p className="mt-2 text-sm text-ink-muted">
          Dont {cell.nUsedEst} passage(s) avec horaire estimé (obs manquant).
        </p>
      ) : null}

      {alternative ? (
        <div className="mt-8 border-t border-border pt-6">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Alternative ±30 min
          </h2>
          <p className="mt-2 text-ink-muted">
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
        </div>
      ) : null}

      <p className="mt-8 text-sm">
        <Link href={reverseHref} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          Sens inverse : {to.nameDisplay} → {from.nameDisplay}
        </Link>
      </p>
    </section>
  );
}
