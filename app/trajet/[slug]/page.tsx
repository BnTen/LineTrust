import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrajetView } from "@/components/trajet-view";
import type { DayType } from "@/lib/scoring";
import { robotsPolicy } from "@/lib/seo";
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
    return { title: "Trajet introuvable", robots: robotsPolicy() };
  }
  const { from, to } = parsed;
  const title = `${from.nameDisplay} vers ${to.nameDisplay}`;
  const description = `Fiabilité historique ${from.nameDisplay} → ${to.nameDisplay} (RER D Melun).`;
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-6">
      <TrajetView
        initialFrom={from}
        initialTo={to}
        initialDayType={dayType}
        initialWindowStartMinutes={windowStartMinutes}
        initialResult={result}
      />
    </main>
  );
}
