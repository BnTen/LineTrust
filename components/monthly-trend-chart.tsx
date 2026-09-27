import { confidenceOpacity, scoreHeight } from "@/lib/day-profile";
import {
  buildMonthlySeries,
  formatMonthShort,
  volatilityLabel,
  type MonthlyPoint,
} from "@/lib/monthly-trend";
import {
  monthlyTrendHint,
  monthlyTrendTitle,
  tripCountLabel,
  volatilityBody,
} from "@/lib/copy";

const BAND_FILL: Record<string, string> = {
  good: "bg-score-good",
  mid: "bg-score-mid",
  bad: "bg-score-bad",
};

export function MonthlyTrendChart({
  points,
  volatilitySd,
}: {
  points: readonly MonthlyPoint[];
  volatilitySd: number | null;
}) {
  const series = buildMonthlySeries(points);
  if (series.length === 0) return null;

  const filled = series.filter((s) => s.point != null).length;
  const vol =
    volatilitySd != null ? volatilityLabel(volatilitySd) : null;

  return (
    <section aria-labelledby="monthly-trend-heading" className="space-y-3">
      <div>
        <h2
          id="monthly-trend-heading"
          className="font-heading text-lg font-semibold text-ink"
        >
          {monthlyTrendTitle}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {monthlyTrendHint(filled)}
        </p>
        {vol != null && volatilitySd != null ? (
          <p className="mt-1 text-sm text-ink-muted">
            {volatilityBody(vol, volatilitySd)}
          </p>
        ) : null}
      </div>

      <div
        className="flex h-28 w-full items-end gap-1 rounded-2xl bg-secondary/40 px-2 pb-2 pt-3 sm:h-32"
        role="img"
        aria-label={`${monthlyTrendTitle}, ${filled} mois avec données`}
      >
        {series.map((slot) => {
          const has = slot.point != null;
          const heightPct = has ? scoreHeight(slot.point!.score) * 100 : 0;
          return (
            <div
              key={slot.monthKey}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
              title={
                has
                  ? `${formatMonthShort(slot.monthKey)} · ${Math.round(slot.point!.score)} · ${tripCountLabel(slot.point!.n)}`
                  : `${formatMonthShort(slot.monthKey)} · pas de données`
              }
            >
              <span
                className={`w-full rounded-t-sm ${
                  has
                    ? BAND_FILL[slot.band ?? "mid"]
                    : "border border-dashed border-border/80 bg-transparent"
                }`}
                style={{
                  height: has ? `${Math.max(heightPct, 10)}%` : "10%",
                  opacity: has ? confidenceOpacity(slot.point!.n) : 1,
                }}
                aria-hidden
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between gap-1 px-1 text-[10px] text-ink-muted sm:text-xs">
        {series.map((slot) => (
          <span
            key={`lbl-${slot.monthKey}`}
            className="min-w-0 flex-1 truncate text-center tabular-nums"
          >
            {formatMonthShort(slot.monthKey)}
          </span>
        ))}
      </div>
    </section>
  );
}
