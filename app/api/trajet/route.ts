import { NextResponse } from "next/server";
import type { DayType } from "@/lib/scoring";
import { getTrajetResult } from "@/lib/trajet";
import {
  findStationBySlug,
  getNetworkCatalog,
  lineIdFromShort,
  stationsForSelection,
} from "@/lib/network";

function parseDayType(raw: string | null): DayType {
  return raw === "weekend" ? "weekend" : "weekday";
}

function parseWindow(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= 1440 || n % 30 !== 0) return 480;
  return n;
}

/** Soft-update payload for the trajet page — avoids full RSC navigation. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catalog = await getNetworkCatalog();
  const lineId = lineIdFromShort(searchParams.get("line"));
  const corridorId = searchParams.get("c");
  const pool = stationsForSelection(catalog, lineId, corridorId);

  const fromSlug = searchParams.get("from") ?? "";
  const toSlug = searchParams.get("to") ?? "";
  const from =
    pool.find((s) => s.slug === fromSlug) ??
    findStationBySlug(catalog, fromSlug);
  const to =
    pool.find((s) => s.slug === toSlug) ?? findStationBySlug(catalog, toSlug);

  if (!from || !to || from.slug === to.slug) {
    return NextResponse.json(
      { error: "Trajet invalide : choisis deux gares différentes." },
      { status: 400 },
    );
  }

  const dayType = parseDayType(searchParams.get("d"));
  const windowStartMinutes = parseWindow(searchParams.get("w"));
  const result = await getTrajetResult(
    from.codeCi,
    to.codeCi,
    dayType,
    windowStartMinutes,
    lineId,
  );

  return NextResponse.json({
    from,
    to,
    dayType,
    windowStartMinutes,
    result,
  });
}
