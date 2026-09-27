import { lateLine, onTimeLine } from "@/lib/copy";

/** Sober TPR / late-rate bars — proof under the score, not a dashboard. */
export function MetricBars({
  tpr,
  penalty,
}: {
  tpr: number;
  penalty: number;
}) {
  return (
    <ul className="mt-4 space-y-3" aria-label="Détail du score">
      <li>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-ink-muted">{onTimeLine(tpr)}</span>
          <span className="shrink-0 font-medium tabular-nums text-ink">
            {Math.round(tpr)} %
          </span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-score-good transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${Math.min(100, Math.max(0, tpr))}%` }}
          />
        </div>
      </li>
      <li>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-ink-muted">{lateLine(penalty)}</span>
          <span className="shrink-0 font-medium tabular-nums text-ink">
            {Math.round(penalty)} %
          </span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-score-bad/80 transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${Math.min(100, Math.max(0, penalty))}%` }}
          />
        </div>
      </li>
    </ul>
  );
}
