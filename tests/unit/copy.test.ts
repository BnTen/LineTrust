import { describe, expect, it } from "vitest";
import {
  contextSummaryLine,
  corridorPickerHint,
  corridorSelectionStatus,
  dayTypeLabel,
  formatSlotSpoken,
  formatWindowOptionLabel,
  isPeakWindow,
  lateLine,
  onTimeLine,
  reverseDirectionDetail,
  reverseDirectionTitle,
  tripCountLabel,
  windowPeriod,
} from "@/lib/copy";

describe("user-facing copy", () => {
  it("speaks slots and day types plainly", () => {
    expect(formatSlotSpoken(480)).toBe("entre 08:00 et 08:30");
    expect(dayTypeLabel("weekday")).toBe("en semaine");
    expect(dayTypeLabel("weekend")).toBe("le week-end");
    expect(tripCountLabel(44)).toBe("44 trajets passés");
  });

  it("avoids TPR / n= jargon in summary lines", () => {
    const line = contextSummaryLine({
      windowStartMinutes: 480,
      dayType: "weekday",
      n: 44,
    });
    expect(line).toBe(
      "Départs entre 08:00 et 08:30 · en semaine · d’après 44 trajets passés",
    );
    expect(line).not.toMatch(/TPR|n=|ouvré|fenêtre/i);
    expect(onTimeLine(84)).toMatch(/à l’heure/i);
    expect(lateLine(5)).toMatch(/15 min de retard/i);
  });

  it("describes corridor selection without jargon", () => {
    expect(corridorSelectionStatus(null, null)).toMatch(/aucune gare/i);
    expect(corridorSelectionStatus("Melun", null)).toMatch(/départ : melun/i);
    expect(corridorSelectionStatus("Melun", "Paris Gare de Lyon")).toMatch(
      /melun vers paris gare de lyon/i,
    );
    expect(
      corridorSelectionStatus("Melun", "Paris Gare de Lyon", "from"),
    ).toMatch(/tu modifies le départ/i);
    expect(
      corridorSelectionStatus("Melun", "Paris Gare de Lyon", "to"),
    ).toMatch(/tu modifies l’arrivée/i);
    expect(corridorSelectionStatus("Melun", "Yerres")).not.toMatch(
      /TPR|fenêtre|ouvré/i,
    );
  });

  it("keeps corridor hints short once a pair exists", () => {
    expect(corridorPickerHint(false)).toMatch(/départ.*arrivée/i);
    expect(corridorPickerHint(true)).toMatch(/départ ou arrivée/i);
    expect(corridorPickerHint(true).length).toBeLessThan(60);
  });

  it("groups windows and marks peaks", () => {
    expect(windowPeriod(60)).toBe("nuit");
    expect(windowPeriod(480)).toBe("matin");
    expect(windowPeriod(840)).toBe("apres-midi");
    expect(windowPeriod(1080)).toBe("soir");
    expect(windowPeriod(1320)).toBe("soiree");
    expect(isPeakWindow(480)).toBe(true);
    expect(isPeakWindow(720)).toBe(false);
    expect(formatWindowOptionLabel(480)).toMatch(/pointe/);
    expect(formatWindowOptionLabel(720)).not.toMatch(/pointe/);
  });

  it("names the reverse direction plainly", () => {
    expect(reverseDirectionTitle).toMatch(/dans l’autre sens/i);
    expect(
      reverseDirectionDetail("Melun", "Villeneuve-Saint-Georges"),
    ).toBe("Melun vers Villeneuve-Saint-Georges");
  });
});
