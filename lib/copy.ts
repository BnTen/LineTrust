/** User-facing French copy — plain language, no scoring/ETL jargon. */

import type { ConfidenceLabel } from "@/lib/uncertainty";
import type { ScoreBand } from "@/lib/scoring";
import { formatWindowLabel } from "@/lib/slugs";

export const bandLabel: Record<ScoreBand, string> = {
  good: "Plutôt fiable",
  mid: "Mitigé",
  bad: "Peu fiable",
};

/** How much we can trust the sample size — plain language. */
export const confidenceLabelCopy: Record<ConfidenceLabel, string> = {
  faible: "Peu d’exemples",
  moyen: "Assez d’exemples",
  fort: "Beaucoup d’exemples",
};

export function dayTypeLabel(dayType: string): string {
  return dayType === "weekend" ? "le week-end" : "en semaine";
}

export function dayTypeControlLabel(dayType: "weekday" | "weekend"): string {
  return dayType === "weekend" ? "Week-end" : "En semaine";
}

/** e.g. "entre 08:00 et 08:30" */
export function formatSlotSpoken(windowStartMinutes: number): string {
  const [start, end] = formatWindowLabel(windowStartMinutes).split("–");
  return `entre ${start} et ${end}`;
}

export function tripCountLabel(n: number): string {
  if (n <= 0) return "aucun trajet passé";
  if (n === 1) return "1 trajet passé";
  return `${n} trajets passés`;
}

export function onTimeLine(tprPercent: number): string {
  return `${Math.round(tprPercent)} % des trains sont arrivés à l’heure (retard de moins de 5 min)`;
}

export function lateLine(penaltyPercent: number): string {
  return `${Math.round(penaltyPercent)} % sont arrivés avec plus de 15 min de retard`;
}

export function estimatedTimesNote(nUsedEst: number): string | null {
  if (nUsedEst <= 0) return null;
  if (nUsedEst === 1) {
    return "Pour 1 trajet, l’heure réelle manquait : on a utilisé une estimation.";
  }
  return `Pour ${nUsedEst} trajets, l’heure réelle manquait : on a utilisé une estimation.`;
}

export function contextSummaryLine(opts: {
  windowStartMinutes: number;
  dayType: string;
  n: number;
}): string {
  return [
    `Départs ${formatSlotSpoken(opts.windowStartMinutes)}`,
    dayTypeLabel(opts.dayType),
    `d’après ${tripCountLabel(opts.n)}`,
  ].join(" · ");
}

export function confidenceSectionBody(opts: {
  n: number;
  confidence: ConfidenceLabel | null;
  windowStartMinutes: number;
  dayType: string;
}): string {
  const slot = formatSlotSpoken(opts.windowStartMinutes);
  const day = dayTypeLabel(opts.dayType);
  const count = tripCountLabel(opts.n);
  const head = opts.confidence
    ? `${confidenceLabelCopy[opts.confidence]}. `
    : "";
  return `${head}Ce chiffre s’appuie sur ${count} dans ce sens, ${day}, pour les départs ${slot}.`;
}

/** Departure window periods for scannable <select> groups. */
export type WindowPeriod =
  | "nuit"
  | "matin"
  | "apres-midi"
  | "soir"
  | "soiree";

export const windowPeriodLabel: Record<WindowPeriod, string> = {
  nuit: "Nuit",
  matin: "Matin",
  "apres-midi": "Après-midi",
  soir: "Soir",
  soiree: "Soirée",
};

export function windowPeriod(windowStartMinutes: number): WindowPeriod {
  if (windowStartMinutes < 360) return "nuit";
  if (windowStartMinutes < 720) return "matin";
  if (windowStartMinutes < 1020) return "apres-midi";
  if (windowStartMinutes < 1200) return "soir";
  return "soiree";
}

/** Weekday-style peaks: 07:00–09:30 and 17:00–19:30. */
export function isPeakWindow(windowStartMinutes: number): boolean {
  return (
    (windowStartMinutes >= 420 && windowStartMinutes <= 570) ||
    (windowStartMinutes >= 1020 && windowStartMinutes <= 1170)
  );
}

export function formatWindowOptionLabel(windowStartMinutes: number): string {
  const base = formatWindowLabel(windowStartMinutes);
  return isPeakWindow(windowStartMinutes) ? `${base} · pointe` : base;
}

/** Horizontal corridor picker — plain language. */
export const corridorPickerTitle = "Sur la ligne";

export function corridorPickerHint(hasPair: boolean): string {
  if (hasPair) return "Clique Départ ou Arrivée, puis une autre gare.";
  return "Clique le départ, puis l’arrivée.";
}

export function corridorSelectionStatus(
  fromName: string | null,
  toName: string | null,
  editing: "from" | "to" | null = null,
): string {
  if (!fromName && !toName) {
    return "Aucune gare sélectionnée. Choisis ton départ.";
  }
  if (fromName && !toName) {
    return `Départ : ${fromName}. Choisis l’arrivée.`;
  }
  if (fromName && toName) {
    if (editing === "from") {
      return `Tu modifies le départ (${fromName}). Clique une autre gare.`;
    }
    if (editing === "to") {
      return `Tu modifies l’arrivée (${toName}). Clique une autre gare.`;
    }
    return `Trajet : ${fromName} vers ${toName}. Clique Départ ou Arrivée pour modifier.`;
  }
  return "";
}

export function corridorStationButtonLabel(opts: {
  name: string;
  role: "from" | "to" | "none";
  editing?: "from" | "to" | null;
}): string {
  if (opts.role === "from") {
    if (opts.editing === "from") {
      return `${opts.name}, départ, en cours de modification`;
    }
    return `${opts.name}, départ`;
  }
  if (opts.role === "to") {
    if (opts.editing === "to") {
      return `${opts.name}, arrivée, en cours de modification`;
    }
    return `${opts.name}, arrivée`;
  }
  return opts.name;
}

export function corridorEndBadge(opts: {
  role: "from" | "to";
  editing: "from" | "to" | null;
}): string {
  const base = opts.role === "from" ? "Départ" : "Arrivée";
  if (opts.editing === opts.role) return `${base} · à modifier`;
  return base;
}

export const reverseDirectionTitle = "Dans l’autre sens";

export function reverseDirectionDetail(toName: string, fromName: string): string {
  return `${toName} vers ${fromName}`;
}

/** Empty trajet score — distinguish structural OD gap vs créneau gap. */
export function emptySlotBody(opts: {
  windowStartMinutes: number;
  dayType: string;
  odExists: boolean;
  hasSameDayWindows: boolean;
}): string {
  if (!opts.odExists) {
    return "Pas encore de données historiques pour ce trajet dans ce sens. Essaie une autre paire de gares, ou le trajet dans l’autre sens.";
  }
  if (!opts.hasSameDayWindows) {
    const other =
      opts.dayType === "weekend" ? "en semaine" : "le week-end";
    return `Pas de trajets passés ${dayTypeLabel(opts.dayType)} pour ce parcours. Essaie ${other}, ou un autre créneau s’il apparaît ci-dessous.`;
  }
  return `Pas assez de trajets passés pour les départs ${formatSlotSpoken(opts.windowStartMinutes)} ${dayTypeLabel(opts.dayType)}. Essaie un autre créneau ci-dessous, ou le trajet dans l’autre sens.`;
}

export function suggestionChipLabel(opts: {
  windowStartMinutes: number;
  dayType: string;
  score: number;
}): string {
  const slot = formatWindowLabel(opts.windowStartMinutes);
  const day =
    opts.dayType === "weekend" ? "week-end" : "semaine";
  return `${slot} · ${day} · ${Math.round(opts.score)}`;
}
