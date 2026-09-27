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
  const { lineId: lineIdOverride, ...rest } = partial;
  return {
    fromCodeCi: from.codeCi,
    toCodeCi: to.codeCi,
    dayType: "weekday",
    nUsedEst: 0,
    tpr: 80,
    tsr: 0,
    penalty: 5,
    weightsVersion: "w0",
    ...rest,
    lineId: lineIdOverride ?? "IDFM:C01728",
  };
}

describe("ScoreReveal", () => {
  it("exposes fiabilité and band label for a11y", () => {
    render(<ScoreReveal score={82.4} band="good" label="Plutôt fiable" />);
    expect(
      screen.getByLabelText(/fiabilité 82, plutôt fiable/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Plutôt fiable")).toBeInTheDocument();
  });
});

describe("TrajetScorePanel", () => {
  it("empty créneau offers suggestions when OD exists elsewhere", () => {
    render(
      <TrajetScorePanel
        from={from}
        to={to}
        cell={null}
        alternative={null}
        suggestions={[
          cell({ windowStartMinutes: 510, score: 78, n: 40 }),
        ]}
        odExists
        availableWindows={[510]}
        confidence={null}
        insufficientHistory={false}
        dayType="weekday"
        windowStartMinutes={480}
        onReverse={() => undefined}
        onSelectWindow={() => undefined}
      />,
    );
    expect(
      screen.getByText(/pas assez de trajets passés/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /créneaux avec des données/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /08:30–09:00/i }),
    ).toBeInTheDocument();
  });

  it("empty OD explains there is no history for the pair", () => {
    render(
      <TrajetScorePanel
        from={from}
        to={to}
        cell={null}
        alternative={null}
        odExists={false}
        availableWindows={[]}
        confidence={null}
        insufficientHistory={false}
        dayType="weekday"
        windowStartMinutes={480}
        onReverse={() => undefined}
      />,
    );
    expect(
      screen.getByText(/pas encore de données historiques pour ce trajet/i),
    ).toBeInTheDocument();
  });

  it("renders plain-language score, alternative, reverse, and share", () => {
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
        confidence="moyen"
        insufficientHistory={false}
        dayType="weekday"
        windowStartMinutes={480}
        onReverse={() => undefined}
        onSelectWindow={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Ce créneau" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /dans l’autre sens/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /dans l’autre sens : melun vers paris gare de lyon/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /d’où vient ce chiffre/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /créneau voisin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /voir ce créneau/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/arrivés à l’heure/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/TPR/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/n=/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Partager" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /partager ce trajet/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/outil indépendant fondé sur l’open data historique/i),
    ).not.toBeInTheDocument();
  });
});
