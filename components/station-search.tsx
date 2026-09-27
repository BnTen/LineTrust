"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  corridorsWithOdData,
  defaultPairWithCoverage,
  hasOdEdge,
  linesWithOdData,
  type OdCoverage,
} from "@/lib/coverage";
import {
  stationsForSelection,
  type NetworkCatalog,
  type RerLine,
  DEFAULT_CORRIDOR_ID,
  DEFAULT_LINE_ID,
} from "@/lib/network";
import { buildTrajetSlug } from "@/lib/slugs";

function StationSelect({
  id,
  label,
  value,
  onChange,
  stations,
  exclude,
  disabledCodes,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (slug: string) => void;
  stations: readonly { slug: string; codeCi: string; nameDisplay: string }[];
  exclude?: string;
  disabledCodes?: ReadonlySet<string>;
}) {
  const options = useMemo(
    () => stations.filter((s) => s.slug !== exclude),
    [stations, exclude],
  );

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-full border border-border bg-card/95 px-4 text-base text-ink shadow-sm outline-none transition-[box-shadow,border-color] focus-visible:border-ink/30 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">Choisir une gare</option>
        {options.map((s) => {
          const unavailable = disabledCodes?.has(s.codeCi) ?? false;
          return (
            <option key={s.slug} value={s.slug} disabled={unavailable}>
              {unavailable
                ? `${s.nameDisplay} (pas de données)`
                : s.nameDisplay}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function LinePill({
  selected,
  onClick,
  children,
  ariaLabel,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        "h-9 min-w-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-ink bg-ink text-canvas"
          : "border-border/80 bg-card/80 text-ink hover:bg-secondary/70",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function branchOptionLabel(displayName: string): string {
  return displayName.replace(/^RER [A-E]\s*[—–-]\s*/i, "");
}

export function StationSearch({
  catalog,
  coverage,
  defaultLineId = DEFAULT_LINE_ID,
  defaultCorridorId = DEFAULT_CORRIDOR_ID,
  defaultFrom,
  defaultTo,
  onSelectionChange,
}: {
  catalog: NetworkCatalog;
  coverage: OdCoverage;
  defaultLineId?: string;
  defaultCorridorId?: string | null;
  defaultFrom?: string;
  defaultTo?: string;
  onSelectionChange?: (lineId: string, corridorId: string | null) => void;
}) {
  const router = useRouter();
  const lines = useMemo(
    () => linesWithOdData(catalog, coverage),
    [catalog, coverage],
  );
  const initialLineId = lines.some((l) => l.lineId === defaultLineId)
    ? defaultLineId
    : (lines[0]?.lineId ?? defaultLineId);

  const [lineId, setLineId] = useState(initialLineId);
  const [corridorId, setCorridorId] = useState<string | null>(
    defaultCorridorId,
  );
  const [from, setFrom] = useState(defaultFrom ?? "");
  const [to, setTo] = useState(defaultTo ?? "");
  const [error, setError] = useState<string | null>(null);

  const line = (lines.find((l) => l.lineId === lineId) ??
    catalog.lines.find((l) => l.lineId === lineId)) as RerLine;
  const corridors = corridorsWithOdData(catalog, lineId, coverage);
  const stations = stationsForSelection(catalog, lineId, corridorId);

  const fromStation = stations.find((s) => s.slug === from);
  const toStation = stations.find((s) => s.slug === to);

  const disabledArrivalCodes = useMemo(() => {
    if (!fromStation) return undefined;
    const disabled = new Set<string>();
    for (const s of stations) {
      if (s.codeCi === fromStation.codeCi) continue;
      if (!hasOdEdge(coverage, lineId, fromStation.codeCi, s.codeCi)) {
        disabled.add(s.codeCi);
      }
    }
    return disabled;
  }, [coverage, fromStation, lineId, stations]);

  const disabledDepartureCodes = useMemo(() => {
    if (!toStation) return undefined;
    const disabled = new Set<string>();
    for (const s of stations) {
      if (s.codeCi === toStation.codeCi) continue;
      if (!hasOdEdge(coverage, lineId, s.codeCi, toStation.codeCi)) {
        disabled.add(s.codeCi);
      }
    }
    return disabled;
  }, [coverage, lineId, stations, toStation]);

  function applySelection(nextLineId: string, nextCorridorId: string | null) {
    setLineId(nextLineId);
    setCorridorId(nextCorridorId);
    onSelectionChange?.(nextLineId, nextCorridorId);
    setError(null);
    const pair = defaultPairWithCoverage(
      catalog,
      nextLineId,
      nextCorridorId,
      coverage,
    );
    if (pair) {
      setFrom(pair.from.slug);
      setTo(pair.to.slug);
    } else {
      setFrom("");
      setTo("");
    }
  }

  function onLineClick(next: RerLine) {
    if (next.lineId === lineId) return;
    const nextCorridors = corridorsWithOdData(catalog, next.lineId, coverage);
    const preferred =
      next.lineId === DEFAULT_LINE_ID ? DEFAULT_CORRIDOR_ID : null;
    const initial =
      preferred && nextCorridors.some((c) => c.corridorId === preferred)
        ? preferred
        : null;
    applySelection(next.lineId, initial);
  }

  function onBranchChange(value: string) {
    applySelection(lineId, value === "" ? null : value);
  }

  function onFromChange(slug: string) {
    setFrom(slug);
    setError(null);
    const nextFrom = stations.find((s) => s.slug === slug);
    const currentTo = stations.find((s) => s.slug === to);
    if (
      nextFrom &&
      currentTo &&
      !hasOdEdge(coverage, lineId, nextFrom.codeCi, currentTo.codeCi)
    ) {
      setTo("");
    }
  }

  function onToChange(slug: string) {
    setTo(slug);
    setError(null);
    const nextTo = stations.find((s) => s.slug === slug);
    const currentFrom = stations.find((s) => s.slug === from);
    if (
      nextTo &&
      currentFrom &&
      !hasOdEdge(coverage, lineId, currentFrom.codeCi, nextTo.codeCi)
    ) {
      setFrom("");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fromS = stations.find((s) => s.slug === from);
    const toS = stations.find((s) => s.slug === to);
    if (!fromS || !toS) {
      setError("Choisis deux gares de la ligne sélectionnée.");
      return;
    }
    if (fromS.slug === toS.slug) {
      setError("Départ et arrivée doivent être différents.");
      return;
    }
    if (!hasOdEdge(coverage, lineId, fromS.codeCi, toS.codeCi)) {
      setError(
        "Pas encore de données pour ce trajet dans ce sens. Choisis une autre paire de gares.",
      );
      return;
    }
    const qs = new URLSearchParams({
      d: "weekday",
      w: "480",
      line: line.short,
    });
    if (corridorId) qs.set("c", corridorId);
    router.push(`/trajet/${buildTrajetSlug(fromS, toS)}?${qs.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-5"
      noValidate
      aria-label="Rechercher un trajet"
    >
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Ligne</span>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Lignes RER"
        >
          {lines.map((l) => (
            <LinePill
              key={l.lineId}
              selected={l.lineId === lineId}
              onClick={() => onLineClick(l)}
              ariaLabel={`RER ${l.pillLabel}`}
            >
              {l.pillLabel}
            </LinePill>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
        <StationSelect
          id="from"
          label="Départ"
          value={from}
          onChange={onFromChange}
          stations={stations}
          exclude={to}
          disabledCodes={disabledDepartureCodes}
        />
        <StationSelect
          id="to"
          label="Arrivée"
          value={to}
          onChange={onToChange}
          stations={stations}
          exclude={from}
          disabledCodes={disabledArrivalCodes}
        />
      </div>

      {corridors.length > 1 ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">
            Branche{" "}
            <span className="font-normal text-ink-muted">(optionnel)</span>
          </span>
          <select
            id="branch"
            value={corridorId ?? ""}
            onChange={(e) => onBranchChange(e.target.value)}
            className="h-11 max-w-md rounded-full border border-border bg-card/90 px-4 text-ink outline-none transition-[box-shadow,border-color] focus-visible:border-ink/30 focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Branche optionnelle"
          >
            <option value="">Toutes les branches</option>
            {corridors.map((c) => (
              <option key={c.corridorId} value={c.corridorId}>
                {branchOptionLabel(c.displayName)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? (
        <p className="text-sm text-score-bad" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full px-8 text-base sm:w-auto sm:self-start"
      >
        Voir le score
      </Button>
    </form>
  );
}
