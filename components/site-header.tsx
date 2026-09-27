import Link from "next/link";

/** Sparse nav — brand is hero-level on home; keep header quiet. */
export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 sm:py-4">
      <Link
        href="/"
        className="font-heading text-xs font-medium tracking-wide text-ink-muted/80 transition-colors hover:text-ink"
      >
        LineTrust
      </Link>
      <nav className="flex items-center gap-4 text-xs text-ink-muted/80 sm:text-sm">
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
