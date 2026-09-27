import { NextResponse } from "next/server";
import type { DayType } from "@/lib/scoring";
import { stationBySlug } from "@/lib/stations";
import { getTrajetResult } from "@/lib/trajet";

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
  const from = stationBySlug(searchParams.get("from") ?? "");
  const to = stationBySlug(searchParams.get("to") ?? "");
  if (!from || !to || from.slug === to.slug) {
    return NextResponse.json(
      { error: "Trajet invalide : choisis deux gares différentes du corridor." },
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
  );

  return NextResponse.json({
    from,
    to,
    dayType,
    windowStartMinutes,
    result,
  });
}
