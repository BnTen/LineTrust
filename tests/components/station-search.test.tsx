// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StationSearch } from "@/components/station-search";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("StationSearch", () => {
  it("blocks A = B with an alert", async () => {
    const user = userEvent.setup();
    render(
      <StationSearch
        defaultFrom="paris-gare-de-lyon"
        defaultTo="paris-gare-de-lyon"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /voir la fiabilité/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /départ et arrivée doivent être différents/i,
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates to oriented trajet with weekday 08:00 window", async () => {
    const user = userEvent.setup();
    render(
      <StationSearch defaultFrom="paris-gare-de-lyon" defaultTo="melun" />,
    );

    await user.click(
      screen.getByRole("button", { name: /voir la fiabilité/i }),
    );

    expect(push).toHaveBeenCalledWith(
      "/trajet/paris-gare-de-lyon--melun?d=weekday&w=480",
    );
  });
});
