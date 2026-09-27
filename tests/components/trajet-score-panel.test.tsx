// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ScoreReveal } from "@/components/score-reveal";
import { TrajetScorePanel } from "@/components/trajet-score-panel";
import { CORRIDOR_STATIONS } from "@/lib/stations";
import type { AggCell } from "@/lib/trajet";

const from = CORRIDOR_STATIONS[0]!;
const to = CORRIDOR_STATIONS[CORRIDOR_STATIONS.length - 1]!;

afterEach(() => {
  cleanup();
});

function cell(
  partial: Partial<AggCell> &
    Pick<AggCell, "windowStartMinutes" | "score" | "n">,
): AggCell {
  return {
    fromCodeCi: from.codeCi,
    toCodeCi: to.codeCi,
    dayType: "weekday",
    nUsedEst: 0,
    tpr: 80,
    tsr: 0,
    penalty: 5,
    weightsVersion: "w0",
    ...partial,
  };
}

describe("ScoreReveal", () => {
  it("exposes score and band label for a11y", () => {
    render(<ScoreReveal score={82.4} band="good" label="Plutôt fiable" />);
    expect(
      screen.getByLabelText(/score 82, plutôt fiable/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Plutôt fiable")).toBeInTheDocument();
  });
});

describe("TrajetScorePanel", () => {
  it("renders score, alternative, share, and disclaimer sections", () => {
    render(
      <TrajetScorePanel
        from={from}
        to={to}
        cell={cell({
          windowStartMinutes: 480,
          score: 74,
          n: 120,
          nUsedEst: 2,
        })}
        alternative={cell({
          windowStartMinutes: 450,
          score: 81,
          n: 110,
          tpr: 85,
          penalty: 3,
        })}
        band="mid"
        confidence="moyen"
        insufficientHistory={false}
        dayType="weekday"
        windowStartMinutes={480}
      />,
    );

    expect(screen.getByRole("heading", { name: "Score" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Incertitude" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /alternative/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Partager" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /partager ce trajet/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/outil indépendant fondé sur l’open data historique/i),
    ).toBeInTheDocument();
  });
});
