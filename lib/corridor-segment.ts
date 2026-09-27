/** Corridor segment helpers — Melun branch order from CORRIDOR_STATIONS. */

import { CORRIDOR_STATIONS, type Station } from "@/lib/stations";

export interface CorridorSelection {
  fromSlug: string | null;
  toSlug: string | null;
}

/** Which endpoint the next station click will move. */
export type CorridorEnd = "from" | "to";

export interface CorridorPickState extends CorridorSelection {
  /**
   * Armed endpoint when both ends are set.
   * `null` while the pair is still being built (0–1 station).
   */
  editing: CorridorEnd | null;
}

/** Inclusive stations between A and B by sequenceOrder (direction-agnostic). */
export function isStationOnSegment(
  station: Station,
  from: Station,
  to: Station,
): boolean {
  const lo = Math.min(from.sequenceOrder, to.sequenceOrder);
  const hi = Math.max(from.sequenceOrder, to.sequenceOrder);
  return station.sequenceOrder >= lo && station.sequenceOrder <= hi;
}

export function stationsOnSegment(from: Station, to: Station): Station[] {
  return CORRIDOR_STATIONS.filter((s) => isStationOnSegment(s, from, to));
}

/**
 * Explicit endpoint picking — avoids “mystery replace arrival” UX.
 *
 * Build:
 * - empty → set départ
 * - départ only → set arrivée (pair complete, arm arrivée)
 *
 * With a complete pair:
 * - click Départ / Arrivée → arm that end (2nd click on same end clears it, unless lockPair)
 * - click another gare → move the armed end only
 */
export function applyCorridorClick(
  state: CorridorPickState,
  clickedSlug: string,
  opts: { lockPair?: boolean } = {},
): CorridorPickState {
  const { fromSlug, toSlug, editing } = state;
  const lockPair = opts.lockPair ?? false;

  if (!fromSlug && !toSlug) {
    return { fromSlug: clickedSlug, toSlug: null, editing: null };
  }

  if (fromSlug && !toSlug) {
    if (clickedSlug === fromSlug) {
      return { fromSlug: null, toSlug: null, editing: null };
    }
    return { fromSlug, toSlug: clickedSlug, editing: "to" };
  }

  if (!fromSlug && toSlug) {
    if (clickedSlug === toSlug) {
      return { fromSlug: null, toSlug: null, editing: null };
    }
    return { fromSlug: clickedSlug, toSlug, editing: "from" };
  }

  // Both ends set — fromSlug & toSlug are non-null here
  const from = fromSlug as string;
  const to = toSlug as string;
  const armed: CorridorEnd = editing ?? "to";

  if (clickedSlug === from) {
    if (armed === "from" && !lockPair) {
      return { fromSlug: to, toSlug: null, editing: null };
    }
    return { fromSlug: from, toSlug: to, editing: "from" };
  }

  if (clickedSlug === to) {
    if (armed === "to" && !lockPair) {
      return { fromSlug: from, toSlug: null, editing: null };
    }
    return { fromSlug: from, toSlug: to, editing: "to" };
  }

  if (armed === "from") {
    if (clickedSlug === to) return state;
    return { fromSlug: clickedSlug, toSlug: to, editing: "from" };
  }

  if (clickedSlug === from) return state;
  return { fromSlug: from, toSlug: clickedSlug, editing: "to" };
}

/** @deprecated Prefer applyCorridorClick — kept for narrow call sites. */
export function toggleCorridorStation(
  current: CorridorSelection,
  clickedSlug: string,
): CorridorSelection {
  const next = applyCorridorClick(
    { ...current, editing: current.fromSlug && current.toSlug ? "to" : null },
    clickedSlug,
  );
  return { fromSlug: next.fromSlug, toSlug: next.toSlug };
}
