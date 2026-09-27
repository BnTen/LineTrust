// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProfilView } from "@/components/profil-view";
import { CORRIDOR_STATIONS } from "@/lib/stations";
import type { TrajetResult } from "@/lib/trajet";

const from = CORRIDOR_STATIONS[0]!;
const to = CORRIDOR_STATIONS[CORRIDOR_STATIONS.length - 1]!;

const initialResult: TrajetResult = {
  cell: {
    lineId: "IDFM:C01728",
    fromCodeCi: from.codeCi,
    toCodeCi: to.codeCi,
    dayType: "weekday",
    windowStartMinutes: 840,
    n: 339,
    nUsedEst: 0,
    tpr: 96,
    tsr: 0,
    penalty: 1,
    score: 83,
    weightsVersion: "w0",
  },
  alternative: null,
  profile: [
    {
      lineId: "IDFM:C01728",
      fromCodeCi: from.codeCi,
      toCodeCi: to.codeCi,
      dayType: "weekday",
      windowStartMinutes: 840,
      n: 339,
      nUsedEst: 0,
      tpr: 96,
      tsr: 0,
      penalty: 1,
      score: 83,
      weightsVersion: "w0",
    },
    {
      lineId: "IDFM:C01728",
      fromCodeCi: from.codeCi,
      toCodeCi: to.codeCi,
      dayType: "weekday",
      windowStartMinutes: 1080,
      n: 337,
      nUsedEst: 0,
      tpr: 84,
      tsr: 0,
      penalty: 5,
      score: 76,
      weightsVersion: "w0",
    },
  ],
  availableWindows: [840, 1080],
  odExists: true,
  suggestions: [],
  otherDaySuggestions: [],
  confidence: "fort",
  insufficientHistory: false,
  band: "good",
  bestHour: {
    lineId: "IDFM:C01728",
    fromCodeCi: from.codeCi,
    toCodeCi: to.codeCi,
    dayType: "weekday",
    windowStartMinutes: 840,
    n: 339,
    nUsedEst: 0,
    tpr: 96,
    tsr: 0,
    penalty: 1,
    score: 83,
    weightsVersion: "w0",
  },
  monthly: [],
  volatilitySd: null,
  reverse: { cell: null, bestHour: null, odExists: true },
};

afterEach(() => {
  cleanup();
});

describe("ProfilView", () => {
  it("shows day profile, best hour, and link back to trajet", () => {
    render(
      <ProfilView
        initialFrom={from}
        initialTo={to}
        initialDayType="weekday"
        initialWindowStartMinutes={840}
        initialResult={initialResult}
        lineShort="D"
        lineId="IDFM:C01728"
        corridorId="rer-d-melun"
        lineLabel="RER D · Branche Melun"
      />,
    );

    expect(screen.getByText(/^Explorer$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /profil de la journée/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /meilleur créneau/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voir le score de ce créneau/i }),
    ).toHaveAttribute("href", expect.stringContaining("/trajet/"));
  });
});
