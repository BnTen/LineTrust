import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
      <Link
        href="/"
        className="font-heading text-lg font-semibold tracking-tight text-ink"
      >
        LineTrust
      </Link>
      <nav className="text-sm text-ink-muted">
        <Link href="/mentions-legales" className="hover:text-ink">
          Mentions
        </Link>
      </nav>
    </header>
  );
}
