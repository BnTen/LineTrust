/** Pilot corridor stations — mirrors db/seed-corridor.sql / Neon ref_stops. */

export interface Station {
  stopId: string;
  codeCi: string;
  slug: string;
  name: string;
  nameDisplay: string;
  sequenceOrder: number;
}

export const CORRIDOR_STATIONS: readonly Station[] = [
  {
    stopId: "IDFM:monomodalStopPlace:470195",
    codeCi: "686030",
    slug: "paris-gare-de-lyon",
    name: "Paris-Gare-de-Lyon (Banlieue)",
    nameDisplay: "Paris Gare de Lyon",
    sequenceOrder: 1,
  },
  {
    stopId: "IDFM:monomodalStopPlace:43154",
    codeCi: "681155",
    slug: "maisons-alfort-alfortville",
    name: "Maisons-Alfort-Alfortville",
    nameDisplay: "Maisons-Alfort - Alfortville",
    sequenceOrder: 2,
  },
  {
    stopId: "IDFM:monomodalStopPlace:464040",
    codeCi: "681247",
    slug: "le-vert-de-maisons",
    name: "Le Vert-de-Maisons",
    nameDisplay: "Le Vert de Maisons",
    sequenceOrder: 3,
  },
  {
    stopId: "IDFM:monomodalStopPlace:46286",
    codeCi: "608802",
    slug: "creteil-pompadour",
    name: "Créteil-Pompadour",
    nameDisplay: "Créteil Pompadour",
    sequenceOrder: 4,
  },
  {
    stopId: "IDFM:monomodalStopPlace:45067",
    codeCi: "681825",
    slug: "villeneuve-saint-georges",
    name: "Villeneuve-St-Georges",
    nameDisplay: "Villeneuve-Saint-Georges",
    sequenceOrder: 5,
  },
  {
    stopId: "IDFM:monomodalStopPlace:46304",
    codeCi: "681809",
    slug: "villeneuve-triage",
    name: "Villeneuve-St-Georges-Triage",
    nameDisplay: "Villeneuve Triage",
    sequenceOrder: 6,
  },
  {
    stopId: "IDFM:monomodalStopPlace:47684",
    codeCi: "682104",
    slug: "montgeron-crosne",
    name: "Montgeron-Crosne",
    nameDisplay: "Montgeron - Crosne",
    sequenceOrder: 7,
  },
  {
    stopId: "IDFM:monomodalStopPlace:43226",
    codeCi: "682112",
    slug: "yerres",
    name: "Yerres",
    nameDisplay: "Yerres",
    sequenceOrder: 8,
  },
  {
    stopId: "IDFM:monomodalStopPlace:58873",
    codeCi: "682120",
    slug: "brunoy",
    name: "Brunoy",
    nameDisplay: "Brunoy",
    sequenceOrder: 9,
  },
  {
    stopId: "IDFM:monomodalStopPlace:47924",
    codeCi: "682138",
    slug: "boussy-saint-antoine",
    name: "Boussy-St-Antoine",
    nameDisplay: "Boussy-Saint-Antoine",
    sequenceOrder: 10,
  },
  {
    stopId: "IDFM:monomodalStopPlace:45771",
    codeCi: "682146",
    slug: "combs-la-ville-quincy",
    name: "Combs-la-Ville-Quincy",
    nameDisplay: "Combs-la-Ville - Quincy",
    sequenceOrder: 11,
  },
  {
    stopId: "IDFM:monomodalStopPlace:47669",
    codeCi: "682153",
    slug: "lieusaint-moissy",
    name: "Lieusaint-Moissy",
    nameDisplay: "Lieusaint - Moissy",
    sequenceOrder: 12,
  },
  {
    stopId: "IDFM:monomodalStopPlace:47665",
    codeCi: "682187",
    slug: "savigny-le-temple-nandy",
    name: "Savigny-le-Temple-Nandy",
    nameDisplay: "Savigny-le-Temple - Nandy",
    sequenceOrder: 13,
  },
  {
    stopId: "IDFM:monomodalStopPlace:42516",
    codeCi: "682161",
    slug: "cesson",
    name: "Cesson",
    nameDisplay: "Cesson",
    sequenceOrder: 14,
  },
  {
    stopId: "IDFM:monomodalStopPlace:45784",
    codeCi: "682179",
    slug: "le-mee",
    name: "Le Mée",
    nameDisplay: "Le Mée",
    sequenceOrder: 15,
  },
  {
    stopId: "IDFM:monomodalStopPlace:47909",
    codeCi: "682005",
    slug: "melun",
    name: "Melun",
    nameDisplay: "Melun",
    sequenceOrder: 16,
  },
] as const;

const bySlug = new Map(CORRIDOR_STATIONS.map((s) => [s.slug, s]));
const byCode = new Map(CORRIDOR_STATIONS.map((s) => [s.codeCi, s]));

export function stationBySlug(slug: string): Station | undefined {
  return bySlug.get(slug);
}

export function stationByCodeCi(codeCi: string): Station | undefined {
  return byCode.get(codeCi);
}

export function searchStations(query: string, limit = 8): Station[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...CORRIDOR_STATIONS].slice(0, limit);
  return CORRIDOR_STATIONS.filter(
    (s) =>
      s.nameDisplay.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.slug.includes(q),
  ).slice(0, limit);
}
