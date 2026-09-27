import { StationSearch } from "@/components/station-search";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-20 pt-10 sm:pt-16">
      <h1 className="max-w-2xl font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
        LineTrust
      </h1>
      <p className="mt-4 max-w-xl font-heading text-2xl font-medium leading-snug text-ink sm:text-3xl">
        Des chiffres pour un trajet{" "}
        <span className="text-signature-gradient">fiable</span>.
      </p>
      <p className="mt-4 max-w-md text-lg text-ink-muted">
        Score historique orienté A→B sur le corridor RER D Branche Melun — ouvré
        ou week-end, fenêtre de 30 minutes.
      </p>
      <div className="mt-10">
        <StationSearch defaultFrom="paris-gare-de-lyon" defaultTo="melun" />
      </div>
    </main>
  );
}
