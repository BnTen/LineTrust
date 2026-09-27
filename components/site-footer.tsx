import { DISCLAIMER_FR } from "@/lib/disclaimer";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
          {DISCLAIMER_FR}
        </p>
        <p className="mt-3 text-xs text-ink-muted/80">
          Données ART Infocentre (Licence Ouverte) · corridor pilote RER D
          Branche Melun
        </p>
      </div>
    </footer>
  );
}
