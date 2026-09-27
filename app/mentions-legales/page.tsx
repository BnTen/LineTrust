import type { Metadata } from "next";
import { DISCLAIMER_FR } from "@/lib/disclaimer";
import { robotsPolicy } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: robotsPolicy(),
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-10">
      <h1 className="font-heading text-3xl font-semibold text-ink">
        Mentions légales
      </h1>

      <div className="mt-8 space-y-8 text-ink-muted leading-relaxed">
        <section className="space-y-3" aria-labelledby="mentions-nature">
          <h2
            id="mentions-nature"
            className="font-heading text-lg font-semibold text-ink"
          >
            Nature du service
          </h2>
          <p>{DISCLAIMER_FR}</p>
          <p>
            LineTrust (projet MonTER) n’est pas affilié à la SNCF, à Île-de-France
            Mobilités, à la RATP ni à l’Autorité de régulation des transports
            (ART). Aucune marque opérateur n’est utilisée pour laisser croire à un
            service officiel.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="mentions-sources">
          <h2
            id="mentions-sources"
            className="font-heading text-lg font-semibold text-ink"
          >
            Sources de données et licences
          </h2>
          <p>
            Les scores du corridor pilote s’appuient principalement sur l’open
            data suivant (détail :{" "}
            <code className="text-ink">docs/exploration/source-whitelist.md</code>
            )&nbsp;:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="font-medium text-ink">
                ART — circulations ferroviaires (Infocentre)
              </strong>{" "}
              — Licence Ouverte Etalab. Faits de circulation / jalons pour le
              score pair × sens × type de jour × fenêtre 30&nbsp;min.
            </li>
            <li>
              <strong className="font-medium text-ink">
                SNCF Voyageurs — régularité mensuelle Transilien / TER
              </strong>{" "}
              — ODbL. Cross-check ligne × mois uniquement (pas le grain affiché).
            </li>
            <li>
              <strong className="font-medium text-ink">
                SNCF Gares &amp; Connexions — gares de voyageurs
              </strong>{" "}
              — ODbL. Référentiel d’arrêts.
            </li>
            <li>
              <strong className="font-medium text-ink">
                Île-de-France Mobilités — arrêts et lignes
              </strong>{" "}
              — ODbL. Jointure arrêt ↔ ligne.
            </li>
            <li>
              <strong className="font-medium text-ink">
                IDFM — offre horaires GTFS
              </strong>{" "}
              — Licence Mobilité (théorique). Non utilisé comme score observé.
            </li>
          </ul>
          <p>
            Toute réutilisation dérivée respecte les obligations d’attribution
            (et de partage à l’identique le cas échéant) de chaque licence.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="mentions-seo">
          <h2
            id="mentions-seo"
            className="font-heading text-lg font-semibold text-ink"
          >
            Indexation
          </h2>
          <p>
            Les pages restent en{" "}
            <code className="text-ink">noindex</code> (
            <code className="text-ink">DATA_PUBLIC=false</code>) tant que la
            validation data humaine n’est pas signée. Aucune génération de pages
            miroir à faible contenu.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="mentions-contact">
          <h2
            id="mentions-contact"
            className="font-heading text-lg font-semibold text-ink"
          >
            Édition
          </h2>
          <p>
            Projet open-source :{" "}
            <a
              href="https://github.com/BnTen/LineTrust"
              className="text-ink underline-offset-4 hover:underline"
            >
              github.com/BnTen/LineTrust
            </a>
            . Hébergement applicatif prévu sur Vercel ; base Neon (agrégats
            uniquement — pas de dumps bruts).
          </p>
        </section>
      </div>
    </main>
  );
}
