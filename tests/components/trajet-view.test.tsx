// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrajetView } from "@/components/trajet-view";
import { CORRIDOR_STATIONS } from "@/lib/stations";
import type { TrajetResult } from "@/lib/trajet";

const from = CORRIDOR_STATIONS[0]!;
const to = CORRIDOR_STATIONS[CORRIDOR_STATIONS.length - 1]!;
const yerres = CORRIDOR_STATIONS.find((s) => s.slug === "yerres")!;

const initialResult: TrajetResult = {
  cell: {
    fromCodeCi: from.codeCi,
    toCodeCi: to.codeCi,
    dayType: "weekday",
    windowStartMinutes: 480,
    n: 44,
    nUsedEst: 0,
    tpr: 84,
    tsr: 0,
    penalty: 5,
    score: 76,
    weightsVersion: "w0",
  },
  alternative: null,
  confidence: "faible",
  insufficientHistory: false,
  band: "mid",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TrajetView soft updates", () => {
  it("updates metrics via fetch without router navigation", async () => {
    const user = userEvent.setup();
    const replaceState = vi.spyOn(window.history, "replaceState");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        from: yerres,
        to,
        dayType: "weekday",
        windowStartMinutes: 480,
        result: {
          ...initialResult,
          cell: {
            ...initialResult.cell!,
            fromCodeCi: yerres.codeCi,
            score: 81,
            n: 41,
            tpr: 93,
          },
          band: "good",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TrajetView
        initialFrom={from}
        initialTo={to}
        initialDayType="weekday"
        initialWindowStartMinutes={480}
        initialResult={initialResult}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /paris gare de lyon.*melun/i,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /paris gare de lyon, départ/i }),
    );
    await user.click(screen.getByRole("button", { name: /^Yerres$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(
      /\/api\/trajet\?.*from=yerres.*to=melun/,
    );
    expect(replaceState).toHaveBeenCalled();
    const url = String(replaceState.mock.calls.at(-1)?.[2] ?? "");
    expect(url).toContain("/trajet/yerres--melun");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: /yerres.*melun/i }),
      ).toBeInTheDocument();
    });
  });
});
