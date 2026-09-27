import { describe, expect, it } from "vitest";
import {
  applyCorridorClick,
  isStationOnSegment,
  type CorridorPickState,
} from "@/lib/corridor-segment";
import { stationBySlug } from "@/lib/stations";

function pair(
  fromSlug: string,
  toSlug: string,
  editing: CorridorPickState["editing"] = "to",
): CorridorPickState {
  return { fromSlug, toSlug, editing };
}

describe("applyCorridorClick — user journeys", () => {
  it("builds départ then arrivée in click order", () => {
    const afterFrom = applyCorridorClick(
      { fromSlug: null, toSlug: null, editing: null },
      "paris-gare-de-lyon",
    );
    expect(afterFrom).toEqual({
      fromSlug: "paris-gare-de-lyon",
      toSlug: null,
      editing: null,
    });

    const afterTo = applyCorridorClick(afterFrom, "melun");
    expect(afterTo).toEqual({
      fromSlug: "paris-gare-de-lyon",
      toSlug: "melun",
      editing: "to",
    });
  });

  it("UX bugfix: with a pair, clicking a middle station must NOT silently steal départ", () => {
    // Default arm = arrivée → middle click moves Melun → Yerres, Lyon stays
    const next = applyCorridorClick(
      pair("paris-gare-de-lyon", "melun", "to"),
      "yerres",
    );
    expect(next.fromSlug).toBe("paris-gare-de-lyon");
    expect(next.toSlug).toBe("yerres");
    expect(next.editing).toBe("to");
  });

  it("UX: change départ by arming it first, then picking the new gare", () => {
    const armed = applyCorridorClick(
      pair("paris-gare-de-lyon", "melun", "to"),
      "paris-gare-de-lyon",
    );
    expect(armed).toEqual({
      fromSlug: "paris-gare-de-lyon",
      toSlug: "melun",
      editing: "from",
    });

    const moved = applyCorridorClick(armed, "yerres");
    expect(moved).toEqual({
      fromSlug: "yerres",
      toSlug: "melun",
      editing: "from",
    });
  });

  it("UX: after arming départ, a stray middle click no longer moves arrivée", () => {
    const armedFrom = pair("paris-gare-de-lyon", "melun", "from");
    const next = applyCorridorClick(armedFrom, "brunoy");
    expect(next.fromSlug).toBe("brunoy");
    expect(next.toSlug).toBe("melun");
  });

  it("UX: click armed Arrivée twice clears only arrivée", () => {
    const armed = pair("paris-gare-de-lyon", "melun", "to");
    const cleared = applyCorridorClick(armed, "melun");
    expect(cleared).toEqual({
      fromSlug: "paris-gare-de-lyon",
      toSlug: null,
      editing: null,
    });
  });

  it("lockPair: second click on armed end only keeps the arm, does not clear", () => {
    const armed = pair("paris-gare-de-lyon", "melun", "to");
    const next = applyCorridorClick(armed, "melun", { lockPair: true });
    expect(next).toEqual({
      fromSlug: "paris-gare-de-lyon",
      toSlug: "melun",
      editing: "to",
    });
  });

  it("supports reverse Melun → Lyon build", () => {
    const next = applyCorridorClick(
      applyCorridorClick(
        { fromSlug: null, toSlug: null, editing: null },
        "melun",
      ),
      "paris-gare-de-lyon",
    );
    expect(next).toEqual({
      fromSlug: "melun",
      toSlug: "paris-gare-de-lyon",
      editing: "to",
    });
  });
});

describe("isStationOnSegment", () => {
  const lyon = stationBySlug("paris-gare-de-lyon")!;
  const melun = stationBySlug("melun")!;
  const yerres = stationBySlug("yerres")!;

  it("includes endpoints and intermediates either direction", () => {
    expect(isStationOnSegment(yerres, lyon, melun)).toBe(true);
    expect(isStationOnSegment(yerres, melun, lyon)).toBe(true);
  });
});
