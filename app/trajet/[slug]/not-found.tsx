import Link from "next/link";

export default function TrajetNotFound() {
  return (
    <main className="mx-auto max-w-5xl flex-1 px-6 py-16">
      <h1 className="font-heading text-2xl font-semibold text-ink">
        Trajet introuvable
      </h1>
      <p className="mt-3 text-ink-muted">
        Cette paire n’est pas sur le corridor pilote RER D Branche Melun.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-ink underline-offset-4 hover:underline">
          Retour à la recherche
        </Link>
      </p>
    </main>
  );
}
