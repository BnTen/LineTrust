// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayProfileChart } from "@/components/day-profile-chart";
import type { AggCell } from "@/lib/trajet";

function cell(
  partial: Partial<AggCell> &
    Pick<AggCell, "windowStartMinutes" | "score" | "n">,
): AggCell {
  return {
    lineId: "IDFM:C01728",
    fromCodeCi: "686030",
    toCodeCi: "682005",
    dayType: "weekday",
    nUsedEst: 0,
    tpr: 80,
    tsr: 0,
    penalty: 5,
    weightsVersion: "w0",
    ...partial,
  };
}

afterEach(() => {
  cleanup();
});

describe("DayProfileChart", () => {
  it("renders profile and selects a filled slot", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <DayProfileChart
        cells={[
          cell({ windowStartMinutes: 840, score: 83, n: 339 }),
          cell({ windowStartMinutes: 1080, score: 76, n: 337 }),
        ]}
        selectedWindow={840}
        onSelectWindow={onSelect}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /profil de la journée/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/trous = pas assez/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /18:00–18:30.*fiabilité 76/i }),
    );
    expect(onSelect).toHaveBeenCalledWith(1080);
  });
});
