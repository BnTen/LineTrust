import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TrajetControls } from "@/components/trajet-controls";
import { TrajetScorePanel } from "@/components/trajet-score-panel";
import type { DayType } from "@/lib/scoring";
import { parseTrajetSlug } from "@/lib/slugs";
import { getTrajetResult } from "@/lib/trajet";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ d?: string; w?: string }>;
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
  const parsed = parseTrajetSlug(slug);
  if (!parsed) {
    return { title: "Trajet introuvable", robots: { index: false, follow: false } };
  }
  const { from, to } = parsed;
  const title = `${from.nameDisplay} vers ${to.nameDisplay}`;
  const description = `Fiabilité historique ${from.nameDisplay} → ${to.nameDisplay} (RER D Melun).`;
  const canonicalPath = `/trajet/${slug}`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${canonicalPath}?d=${parseDayType(sp.d)}&w=${parseWindow(sp.w)}`,
    },
  };
}

export default async function TrajetPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const parsed = parseTrajetSlug(slug);
  if (!parsed) notFound();

  const { from, to } = parsed;
  const dayType = parseDayType(sp.d);
  const windowStartMinutes = parseWindow(sp.w);

  const result = await getTrajetResult(
    from.codeCi,
    to.codeCi,
    dayType,
    windowStartMinutes,
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-20 pt-6">
      <p className="text-sm text-ink-muted">RER D · Branche Melun</p>
      <h1 className="mt-2 max-w-2xl font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {from.nameDisplay}
        <span className="text-ink-muted"> → </span>
        {to.nameDisplay}
      </h1>

      <div className="mt-8">
        <Suspense fallback={null}>
          <TrajetControls
            dayType={dayType}
            windowStartMinutes={windowStartMinutes}
          />
        </Suspense>
      </div>

      <TrajetScorePanel
        from={from}
        to={to}
        cell={result.cell}
        alternative={result.alternative}
        band={result.band}
        confidence={result.confidence}
        insufficientHistory={result.insufficientHistory}
        dayType={dayType}
        windowStartMinutes={windowStartMinutes}
      />
    </main>
  );
}
