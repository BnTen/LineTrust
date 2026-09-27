import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrajetView } from "@/components/trajet-view";
import type { DayType } from "@/lib/scoring";
import { robotsPolicy } from "@/lib/seo";
import { parseTrajetSlug } from "@/lib/slugs";
import { getTrajetResult } from "@/lib/trajet";
import {
  DEFAULT_LINE_ID,
  findStationBySlug,
  getNetworkCatalog,
  lineIdFromShort,
  resolveCorridorForPair,
  shortFromLineId,
  stationsForSelection,
} from "@/lib/network";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ d?: string; w?: string; line?: string; c?: string }>;
}

function parseDayType(raw: string | undefined): DayType {
  return raw === "weekend" ? "weekend" : "weekday";
}

function parseWindow(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= 1440 || n % 30 !== 0) return 480;
  return n;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const catalog = await getNetworkCatalog();
  const allStations = stationsForSelection(
    catalog,
    lineIdFromShort(sp.line),
    sp.c ?? null,
  );
  const parsed =
    parseTrajetSlug(slug, allStations) ??
    (() => {
      const parts = slug.split("--");
      if (parts.length !== 2) return null;
      const from = findStationBySlug(catalog, parts[0]!);
      const to = findStationBySlug(catalog, parts[1]!);
      if (!from || !to || from.codeCi === to.codeCi) return null;
      return { from, to };
    })();
  if (!parsed) {
    return { title: "Trajet introuvable", robots: robotsPolicy() };
  }
  const { from, to } = parsed;
  const lineShort = (sp.line ?? "D").toUpperCase();
  const title = `${from.nameDisplay} vers ${to.nameDisplay}`;
  const description = `Fiabilité historique ${from.nameDisplay} → ${to.nameDisplay} (RER ${lineShort}).`;
  const canonicalPath = `/trajet/${slug}`;
  return {
    title,
    description,
    robots: robotsPolicy(),
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${canonicalPath}?d=${parseDayType(sp.d)}&w=${parseWindow(sp.w)}&line=${lineShort}`,
    },
  };
}

export default async function TrajetPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const catalog = await getNetworkCatalog();
  const lineId = lineIdFromShort(sp.line);
  const lineShort = shortFromLineId(lineId);
  const preferredCorridor = sp.c ?? null;

  const lineStations = stationsForSelection(catalog, lineId, preferredCorridor);
  let parsed = parseTrajetSlug(slug, lineStations);
  if (!parsed) {
    const parts = slug.split("--");
    if (parts.length === 2) {
      const from = findStationBySlug(catalog, parts[0]!);
      const to = findStationBySlug(catalog, parts[1]!);
      if (from && to && from.codeCi !== to.codeCi) parsed = { from, to };
    }
  }
  if (!parsed) notFound();

  const { from, to } = parsed;
  const corridor = resolveCorridorForPair(
    catalog,
    lineId,
    from,
    to,
    preferredCorridor,
  );
  const corridorId = corridor?.corridorId ?? preferredCorridor;
  const corridorStations =
    (corridorId && catalog.stationsByCorridor[corridorId]) ||
    stationsForSelection(catalog, lineId, corridorId);
  const lineMeta = catalog.lines.find((l) => l.lineId === lineId);
  const lineLabel = corridor
    ? `RER ${lineMeta?.pillLabel ?? lineShort} · ${corridor.displayName}`
    : `RER ${lineMeta?.pillLabel ?? lineShort}`;

  const dayType = parseDayType(sp.d);
  const windowStartMinutes = parseWindow(sp.w);

  const result = await getTrajetResult(
    from.codeCi,
    to.codeCi,
    dayType,
    windowStartMinutes,
    lineId || DEFAULT_LINE_ID,
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-6">
      <TrajetView
        initialFrom={from}
        initialTo={to}
        initialDayType={dayType}
        initialWindowStartMinutes={windowStartMinutes}
        initialResult={result}
        lineShort={lineShort}
        lineId={lineId}
        corridorId={corridorId}
        corridorStations={corridorStations}
        lineLabel={lineLabel}
      />
    </main>
  );
}
