"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildTrajetSlug } from "@/lib/slugs";
import { CORRIDOR_STATIONS, type Station } from "@/lib/stations";

function StationSelect({
  id,
  label,
  value,
  onChange,
  exclude,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (slug: string) => void;
  exclude?: string;
}) {
  const options = useMemo(
    () => CORRIDOR_STATIONS.filter((s) => s.slug !== exclude),
    [exclude],
  );

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-full border border-border bg-card px-4 text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">Choisir une gare</option>
        {options.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.nameDisplay}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StationSearch({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(defaultFrom ?? "");
  const [to, setTo] = useState(defaultTo ?? "");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fromStation = CORRIDOR_STATIONS.find((s) => s.slug === from) as
      | Station
      | undefined;
    const toStation = CORRIDOR_STATIONS.find((s) => s.slug === to) as
      | Station
      | undefined;
    if (!fromStation || !toStation) {
      setError("Choisis deux gares du corridor RER D Melun.");
      return;
    }
    if (fromStation.slug === toStation.slug) {
      setError("Départ et arrivée doivent être différents.");
      return;
    }
    router.push(
      `/trajet/${buildTrajetSlug(fromStation, toStation)}?d=weekday&w=480`,
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-lg flex-col gap-4"
      noValidate
    >
      <StationSelect
        id="from"
        label="Départ"
        value={from}
        onChange={setFrom}
        exclude={to}
      />
      <StationSelect
        id="to"
        label="Arrivée"
        value={to}
        onChange={setTo}
        exclude={from}
      />
      {error ? (
        <p className="text-sm text-score-bad" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="h-11 px-6 text-base">
        Voir la fiabilité
      </Button>
    </form>
  );
}
