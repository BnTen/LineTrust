import Link from "next/link";

/** Sparse nav — brand is hero-level on home; keep header quiet. */
export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:py-5">
      <Link
        href="/"
        className="font-heading text-sm font-semibold tracking-tight text-ink-muted transition-colors hover:text-ink"
      >
        LineTrust
      </Link>
      <nav className="text-sm text-ink-muted">
        <Link
          href="/mentions-legales"
          className="underline-offset-4 hover:text-ink hover:underline"
        >
          Mentions
        </Link>
      </nav>
    </header>
  );
}
