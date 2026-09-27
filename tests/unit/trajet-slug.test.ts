import { describe, expect, it } from "vitest";
import { buildTrajetSlug, parseTrajetSlug, formatWindowLabel } from "@/lib/slugs";
import { stationBySlug } from "@/lib/stations";
import { pickAlternative } from "@/lib/scoring";

describe("trajet slugs", () => {
  it("builds and parses oriented Lyon→Melun slug", () => {
    const from = stationBySlug("paris-gare-de-lyon")!;
    const to = stationBySlug("melun")!;
    const slug = buildTrajetSlug(from, to);
    expect(slug).toBe("paris-gare-de-lyon--melun");
    const parsed = parseTrajetSlug(slug);
    expect(parsed?.from.codeCi).toBe("686030");
    expect(parsed?.to.codeCi).toBe("682005");
  });

  it("rejects A=A and unknown stations", () => {
    expect(parseTrajetSlug("melun--melun")).toBeNull();
    expect(parseTrajetSlug("paris--nowhere")).toBeNull();
    expect(parseTrajetSlug("no-separator")).toBeNull();
  });

  it("treats reverse as different slug", () => {
    const from = stationBySlug("paris-gare-de-lyon")!;
    const to = stationBySlug("melun")!;
    expect(buildTrajetSlug(from, to)).not.toBe(buildTrajetSlug(to, from));
  });
});

describe("formatWindowLabel", () => {
  it("formats half-hour ranges", () => {
    expect(formatWindowLabel(480)).toBe("08:00–08:30");
    expect(formatWindowLabel(0)).toBe("00:00–00:30");
  });
});

describe("golden path alternative", () => {
  it("picks better neighbor window", () => {
    const alt = pickAlternative(480, [
      { windowStartMinutes: 480, score: 70, n: 100 },
      { windowStartMinutes: 510, score: 82, n: 90 },
      { windowStartMinutes: 450, score: 75, n: 80 },
    ]);
    expect(alt?.windowStartMinutes).toBe(510);
  });
});
