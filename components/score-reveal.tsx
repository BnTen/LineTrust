"use client";

import type { ScoreBand } from "@/lib/scoring";

const bandClass: Record<ScoreBand, string> = {
  good: "text-score-good",
  mid: "text-score-mid",
  bad: "text-score-bad",
};

const sizeClass = {
  hero: {
    score: "text-7xl sm:text-8xl",
    label: "mt-2 text-lg",
  },
  header: {
    score: "text-4xl leading-none sm:text-5xl lg:text-6xl",
    label: "mt-1 text-xs sm:text-sm",
  },
} as const;

export function ScoreReveal({
  score,
  band,
  label,
  size = "hero",
}: {
  score: number;
  band: ScoreBand | null;
  label: string | null;
  /** `header` = compact, sits beside the trajet title. */
  size?: keyof typeof sizeClass;
}) {
  const scale = sizeClass[size];

  return (
    <div
      className={`lt-score-reveal text-right ${size === "header" ? "shrink-0" : ""}`}
    >
      <p
        className={`font-heading font-semibold tracking-tight tabular-nums ${scale.score} ${
          band ? bandClass[band] : "text-ink"
        }`}
        aria-label={`Fiabilité ${Math.round(score)}${label ? `, ${label}` : ""}`}
      >
        {Math.round(score)}
      </p>
      {label ? (
        <p className={`${scale.label} text-ink`}>{label}</p>
      ) : null}
    </div>
  );
}
