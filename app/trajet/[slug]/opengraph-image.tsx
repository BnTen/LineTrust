import { ImageResponse } from "next/og";
import { DISCLAIMER_SHORT_FR } from "@/lib/disclaimer";
import { formatWindowLabel, parseTrajetSlug } from "@/lib/slugs";
import { getTrajetResult } from "@/lib/trajet";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card defaults to weekday 08:00–08:30 (commute golden path). */
const DEFAULT_DAY = "weekday" as const;
const DEFAULT_WINDOW = 480;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const parsed = parseTrajetSlug(slug);

  let scoreLabel = "—";
  let subtitle = "Historique insuffisant";
  let fromName = "Départ";
  let toName = "Arrivée";

  if (parsed) {
    fromName = parsed.from.nameDisplay;
    toName = parsed.to.nameDisplay;
    try {
      const result = await getTrajetResult(
        parsed.from.codeCi,
        parsed.to.codeCi,
        DEFAULT_DAY,
        DEFAULT_WINDOW,
      );
      if (result.cell) {
        scoreLabel = String(Math.round(result.cell.score));
        subtitle = `${formatWindowLabel(DEFAULT_WINDOW)} · Ouvré · n=${result.cell.n}`;
      }
    } catch {
      subtitle = "Score indisponible";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#F7F8FA",
          color: "#1A1C22",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 600 }}>LineTrust</div>
          <div style={{ fontSize: 40, fontWeight: 600, maxWidth: 900 }}>
            {fromName} → {toName}
          </div>
          <div style={{ fontSize: 24, color: "#5C6370" }}>{subtitle}</div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 140, fontWeight: 700, lineHeight: 1 }}>
            {scoreLabel}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#5C6370",
              maxWidth: 420,
              lineHeight: 1.35,
            }}
          >
            {DISCLAIMER_SHORT_FR}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
