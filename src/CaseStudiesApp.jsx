import { useEffect } from "react";
import {
  ArrowRight,
  Check,
  CircleDot,
  Clock3,
  FileCheck2,
  Gauge,
  MapPin,
  ShieldCheck,
  SmartphoneNfc,
} from "lucide-react";
import { Shell } from "./storefront-v3/layouts/StorefrontLayout.jsx";
import "./case-studies.css";

const PROOF_ROWS = [
  {
    icon: SmartphoneNfc,
    label: "Expérience",
    title: "Studio en direct",
    copy:
      "La personnalisation est déjà visible et manipulable : le Studio permet de composer le support avant sa validation.",
    status: "Disponible",
    tone: "ready",
  },
  {
    icon: FileCheck2,
    label: "Production",
    title: "Validation avant fabrication",
    copy:
      "La création passe par une validation afin de contrôler la lisibilité, le QR code et la composition avant production.",
    status: "Processus actif",
    tone: "ready",
  },
  {
    icon: MapPin,
    label: "Terrain",
    title: "Installation en situation réelle",
    copy:
      "Photos d’emplacement, vidéo du geste et contexte d’usage seront publiés pour chaque cas avec l’accord du participant.",
    status: "Pilotes recherchés",
    tone: "progress",
  },
  {
    icon: Gauge,
    label: "Résultats",
    title: "Mesure NFC, QR et action finale",
    copy:
      "Un résultat ne sera affiché qu’avec une période, un point de départ et une méthode compréhensible.",
    status: "À documenter",
    tone: "progress",
  },
];

const PROTOCOL = [
  {
    number: "01",
    title: "Cadrer",
    copy: "Un lieu, un moment, une action attendue et un indicateur sont définis avant la pose.",
  },
  {
    number: "02",
    title: "Installer",
    copy: "Le support est placé là où le geste est naturel : table, caisse, accueil, événement ou équipe.",
  },
  {
    number: "03",
    title: "Observer",
    copy: "Les interactions NFC et QR sont distinguées de l’action finale pendant une période annoncée.",
  },
  {
    number: "04",
    title: "Publier",
    copy: "Le cas montre aussi ses limites et ne cite l’entreprise qu’avec son autorisation.",
  },
];

function setMeta(name, content, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function usePageMeta() {
  useEffect(() => {
    const title = "Cas clients & preuves terrain | Tapote";
    const description =
      "Les cas pilotes Tapote : contexte, protocole et résultats vérifiables des supports NFC et QR sur le terrain.";

    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
  }, []);
}

export default function CaseStudiesApp() {
  usePageMeta();

  return (
    <Shell catalogStatus="ready">
      <div className="cs-site">
      <main id="main-content">
        <section className="cs-hero">
          <div className="cs-hero-kicker">
            <span>Cas clients</span>
            <span>Série pilote</span>
          </div>
          <h1>
            Des cas lisibles.
            <br />
            <em>Pas des succès flous.</em>
          </h1>
          <p>
            Tapote documente le lieu, le geste et le résultat. Tant que les premières mesures
            terrain ne sont pas publiées, nous le disons clairement.
          </p>
        </section>

        <section className="cs-intro">
          <div className="cs-statement">
            <ShieldCheck aria-hidden="true" />
            <p>Pas de faux avis. Pas de logo décoratif. Pas de chiffre sans méthode.</p>
          </div>
          <div className="cs-intro-copy">
            <p className="cs-overline">La règle Tapote</p>
            <h2>Une preuve doit pouvoir être comprise et vérifiée.</h2>
            <p>
              Le produit numérique est déjà visible. La preuve terrain se construit maintenant :
              installation, geste réel et résultat mesuré dans un contexte précis.
            </p>
            <a href="/preuves">
              Voir le centre de preuves <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="cs-ledger-section" aria-labelledby="ledger-title">
          <header className="cs-section-heading">
            <p className="cs-overline">État des cas</p>
            <h2 id="ledger-title">Ce qui existe. Ce qui vient ensuite.</h2>
          </header>
          <div className="cs-ledger">
            {PROOF_ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <article className="cs-ledger-row" key={row.title}>
                  <div className="cs-ledger-icon">
                    <Icon aria-hidden="true" />
                    <span>{row.label}</span>
                  </div>
                  <div className="cs-ledger-copy">
                    <h3>{row.title}</h3>
                    <p>{row.copy}</p>
                  </div>
                  <span className={`cs-status cs-status--${row.tone}`}>
                    {row.tone === "ready" ? <Check aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
                    {row.status}
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="cs-protocol" aria-labelledby="protocol-title">
          <header className="cs-section-heading cs-section-heading--light">
            <p className="cs-overline">Protocole</p>
            <h2 id="protocol-title">Comment un pilote devient un cas.</h2>
          </header>
          <ol>
            {PROTOCOL.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="cs-callout">
          <div>
            <p className="cs-overline">Commerces & équipes pilotes</p>
            <h2>Votre terrain peut devenir le premier cas documenté.</h2>
          </div>
          <div>
            <CircleDot aria-hidden="true" />
            <p>
              Vous avez un point de contact clair et un indicateur utile ? Construisons un test
              simple, mesurable et publiable avec votre accord.
            </p>
            <a className="cs-button" href="/devis">
              Proposer un pilote <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      </div>
    </Shell>
  );
}
