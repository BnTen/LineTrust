import type { Metadata } from "next";
import { DISCLAIMER_FR } from "@/lib/disclaimer";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: false },
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-10">
      <h1 className="font-heading text-3xl font-semibold text-ink">
        Mentions légales
      </h1>
      <div className="mt-8 space-y-6 text-ink-muted leading-relaxed">
        <p>{DISCLAIMER_FR}</p>
        <p>
          Sources principales : ART Infocentre circulations (Licence Ouverte
          Etalab) ; référentiels IDFM / SNCF gares pour les arrêts. LineTrust
          n’est pas affilié à la SNCF, à Île-de-France Mobilités ni à l’ART.
        </p>
        <p>
          Les pages restent en <code className="text-ink">noindex</code> tant
          que la validation data humaine n’est pas signée.
        </p>
      </div>
    </main>
  );
}
