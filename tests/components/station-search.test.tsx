// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CorridorPicker } from "@/components/corridor-picker";
import { StationSearch } from "@/components/station-search";
import { MELUN_TEST_CATALOG } from "@/tests/fixtures/melun-catalog";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("CorridorPicker", () => {
  it("starts with nothing selected and exposes station buttons", () => {
    render(<CorridorPicker />);
    expect(
      screen.getByRole("heading", { name: /sur la ligne/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/aucune gare sélectionnée/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Paris Gare de Lyon" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("user journey: arm départ then move it without touching arrivée", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <CorridorPicker
        fromSlug="paris-gare-de-lyon"
        toSlug="melun"
        onChange={onChange}
      />,
    );

    expect(
      screen.getByText(/tu modifies l’arrivée/i),
    ).toBeInTheDocument();

    // Arm départ
    await user.click(
      screen.getByRole("button", { name: /paris gare de lyon, départ/i }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/tu modifies le départ/i),
    ).toBeInTheDocument();

    // Move départ to Yerres — Melun must stay
    await user.click(screen.getByRole("button", { name: "Yerres" }));
    expect(onChange).toHaveBeenLastCalledWith({
      fromSlug: "yerres",
      toSlug: "melun",
    });

    rerender(
      <CorridorPicker
        fromSlug="yerres"
        toSlug="melun"
        onChange={onChange}
      />,
    );
    expect(
      screen.getByRole("button", { name: /yerres, départ/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /melun, arrivée/i }),
    ).toBeInTheDocument();
  });

  it("marks départ then arrivée for reverse click order", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <CorridorPicker fromSlug={null} toSlug={null} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Melun" }));
    expect(onChange).toHaveBeenLastCalledWith({
      fromSlug: "melun",
      toSlug: null,
    });

    rerender(
      <CorridorPicker
        fromSlug="melun"
        toSlug={null}
        onChange={onChange}
      />,
    );
    expect(
      screen.getByRole("button", { name: /melun, départ/i }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(
      screen.getByRole("button", { name: "Paris Gare de Lyon" }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      fromSlug: "melun",
      toSlug: "paris-gare-de-lyon",
    });
  });
});

describe("StationSearch", () => {
  it("blocks A = B with an alert", async () => {
    const user = userEvent.setup();
    render(
      <StationSearch
        catalog={MELUN_TEST_CATALOG}
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

  it("navigates to oriented trajet with weekday 08:00 window and line", async () => {
    const user = userEvent.setup();
    render(
      <StationSearch
        catalog={MELUN_TEST_CATALOG}
        defaultFrom="paris-gare-de-lyon"
        defaultTo="melun"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /voir la fiabilité/i }),
    );

    expect(push).toHaveBeenCalledWith(
      "/trajet/paris-gare-de-lyon--melun?d=weekday&w=480&line=D&c=rer-d-melun",
    );
  });

  it("shows line pills and optional branches for D", () => {
    render(
      <StationSearch
        catalog={MELUN_TEST_CATALOG}
        defaultFrom="paris-gare-de-lyon"
        defaultTo="melun"
      />,
    );
    expect(screen.getByRole("button", { name: "RER D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "RER E" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toutes" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Branche Melun" }),
    ).toBeInTheDocument();
  });
});
