export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-24">
      <p className="font-heading text-sm tracking-wide text-ink-muted">
        LineTrust
      </p>
      <h1 className="mt-4 max-w-xl font-heading text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
        Des chiffres pour un trajet{" "}
        <span className="text-signature-gradient">fiable</span>.
      </h1>
      <p className="mt-4 max-w-md text-lg text-ink-muted">
        Environnement Phase 1 — search et scores arrivent après exploration
        data.
      </p>
    </main>
  );
}
