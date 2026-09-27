import { stationBySlug, type Station } from "@/lib/stations";

/** Oriented slug: `{fromSlug}--{toSlug}` (double hyphen separates ends). */
export function buildTrajetSlug(from: Station, to: Station): string {
  return `${from.slug}--${to.slug}`;
}

export function parseTrajetSlug(
  slug: string,
): { from: Station; to: Station } | null {
  const parts = slug.split("--");
  if (parts.length !== 2) return null;
  const from = stationBySlug(parts[0]);
  const to = stationBySlug(parts[1]);
  if (!from || !to) return null;
  if (from.codeCi === to.codeCi) return null;
  return { from, to };
}

export function formatWindowLabel(windowStartMinutes: number): string {
  const h = Math.floor(windowStartMinutes / 60);
  const m = windowStartMinutes % 60;
  const end = windowStartMinutes + 30;
  const eh = Math.floor(end / 60) % 24;
  const em = end % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}–${pad(eh)}:${pad(em)}`;
}
