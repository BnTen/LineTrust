"use client";

import type { ScoreBand } from "@/lib/scoring";

const bandClass: Record<ScoreBand, string> = {
  good: "text-score-good",
  mid: "text-score-mid",
  bad: "text-score-bad",
};

export function ScoreReveal({
  score,
  band,
  label,
}: {
  score: number;
  band: ScoreBand | null;
  label: string | null;
}) {
  return (
    <div className="lt-score-reveal">
      <p
        className={`font-heading text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl ${
          band ? bandClass[band] : "text-ink"
        }`}
        aria-label={`Score ${Math.round(score)}${label ? `, ${label}` : ""}`}
      >
        {Math.round(score)}
      </p>
      {label ? <p className="mt-2 text-lg text-ink">{label}</p> : null}
    </div>
  );
}
