/** Melun-branch corridor constants for ART join (docs/exploration). */

export const CORRIDOR_ID = "rer-d-melun";
export const ART_TCT = "TBD";
export const SOURCE_ID = "art-idfm";

/** Canonical 6-digit UIC suffixes on the Melun branch (ordered southbound). */
export const CORRIDOR_STOPS: ReadonlyArray<{
  codeCi: string;
  aliases: readonly string[];
  sequence: number;
  name: string;
}> = [
  { codeCi: "686030", aliases: ["686006"], sequence: 1, name: "Paris-Gare-de-Lyon (Banlieue)" },
  { codeCi: "681155", aliases: [], sequence: 2, name: "Maisons-Alfort-Alfortville" },
  { codeCi: "681247", aliases: [], sequence: 3, name: "Le Vert-de-Maisons" },
  { codeCi: "608802", aliases: [], sequence: 4, name: "Créteil-Pompadour" },
  { codeCi: "681825", aliases: [], sequence: 5, name: "Villeneuve-St-Georges" },
  { codeCi: "681809", aliases: [], sequence: 6, name: "Villeneuve-St-Georges-Triage" },
  { codeCi: "682104", aliases: [], sequence: 7, name: "Montgeron-Crosne" },
  { codeCi: "682112", aliases: [], sequence: 8, name: "Yerres" },
  { codeCi: "682120", aliases: [], sequence: 9, name: "Brunoy" },
  { codeCi: "682138", aliases: [], sequence: 10, name: "Boussy-St-Antoine" },
  { codeCi: "682146", aliases: [], sequence: 11, name: "Combs-la-Ville-Quincy" },
  { codeCi: "682153", aliases: [], sequence: 12, name: "Lieusaint-Moissy" },
  { codeCi: "682187", aliases: [], sequence: 13, name: "Savigny-le-Temple-Nandy" },
  { codeCi: "682161", aliases: [], sequence: 14, name: "Cesson" },
  { codeCi: "682179", aliases: [], sequence: 15, name: "Le Mée" },
  { codeCi: "682005", aliases: [], sequence: 16, name: "Melun" },
];

const HUB = "686030";
const HUB_ALIASES = new Set(["686030", "686006"]);
const END = "682005";

export function canonicalCodeCi(code: string): string | null {
  const c = code.trim();
  if (!c) return null;
  if (HUB_ALIASES.has(c)) return HUB;
  for (const stop of CORRIDOR_STOPS) {
    if (stop.codeCi === c || stop.aliases.includes(c)) return stop.codeCi;
  }
  return null;
}

export function isCorridorEndpointOd(origCode: string, destCode: string): boolean {
  const o = canonicalCodeCi(origCode);
  const d = canonicalCodeCi(destCode);
  if (!o || !d) return false;
  return (o === HUB && d === END) || (o === END && d === HUB);
}

export function corridorSequence(codeCi: string): number | null {
  const c = canonicalCodeCi(codeCi);
  if (!c) return null;
  const stop = CORRIDOR_STOPS.find((s) => s.codeCi === c);
  return stop?.sequence ?? null;
}
