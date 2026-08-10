import { useState } from "react";
import { ArrowRight, Check, Clock3, Globe2, Layers3, Link2, QrCode, SmartphoneNfc, Zap } from "lucide-react";
import { motion } from "motion/react";
import { formatMoney, PILOT_PLANS } from "../../../shared/catalog.js";
import { SECTORS } from "../../storefront/sectorData.js";
import { PilotLevelDemo } from "../marketing/PilotAppMock.jsx";
import { SectorScene } from "../scenes/ProductScene.jsx";
import { readyHeadlineForAction } from "../data/content.js";

export function PilotMarketingPage() {
  const pilotSteps = [
    {
      number: "01",
      icon: SmartphoneNfc,
      title: "Votre support arrive prêt",
      copy: "Le NFC et le QR ouvrent la destination choisie à la commande. Aucun réglage technique à faire sur place.",
    },
    {
      number: "02",
      icon: Link2,
      title: "Vous changez le lien avec Pro",
      copy: "Tapote Pilot Pro remplace l’ancienne destination par la nouvelle. Le support physique, lui, ne bouge pas.",
    },
    {
      number: "03",
      icon: Layers3,
      title: "Vous gardez la main",
      copy: "Retrouvez chaque support et sa destination sans revenir sur place ni remplacer l’objet.",
    },
  ];
  return (
    <main id="main-content" className="v3-pilot-page">
      <section className="v3-pilot-page-flow" id="pilot-flow" aria-labelledby="v3-pilot-flow-title">
        <div className="v3-pilot-page-flow-head">
          <span className="v3-eyebrow">TAPOTE PILOT · INCLUS</span>
          <h1 id="v3-pilot-flow-title">Le lien change.<br />Le support reste.</h1>
          <p>Le client voit toujours le même Tapote. Avec Pilot Pro, vous changez simplement la page qu’il ouvre.</p>
          <div className="v3-pilot-page-flow-actions"><a href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a><span><Check /> Inclus avec chaque support</span></div>
        </div>
        <div className="v3-pilot-page-flow-grid">
          <div className="v3-pilot-page-steps">
            {pilotSteps.map(({ number, icon: Icon, title, copy }) => (
              <article key={number}>
                <span>{number}</span>
                <i><Icon /></i>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
          <div className="v3-pilot-page-demo">
            <PilotLevelDemo initialLevel="pilot" />
          </div>
        </div>
      </section>

      <section className="v3-pilot-page-value" aria-labelledby="v3-pilot-value-title">
        <div>
          <span className="v3-eyebrow">LE SUIVI INCLUS · LE PILOTAGE EN OPTION</span>
          <h2 id="v3-pilot-value-title">Voir, c’est inclus.<br />Changer, c’est Pro.</h2>
          <p>Pilot vous montre votre parc et ce que chaque support ouvre. Pilot Pro vous donne la main pour remplacer ces destinations et lire les interactions.</p>
        </div>
        <div className="v3-pilot-page-value-grid">
          <article><Layers3 /><span>INCLUS</span><h3>Retrouver</h3><p>Vos supports, leurs lieux et la page que chacun ouvre aujourd’hui.</p></article>
          <article><Check /><span>INCLUS</span><h3>Vérifier</h3><p>L’état d’un support et le test de sa destination, depuis votre compte.</p></article>
          <article><Link2 /><span>PILOT PRO</span><h3>Changer</h3><p>Remplacez une destination à distance, sans réencoder ni réimprimer.</p></article>
          <article><Clock3 /><span>PILOT PRO</span><h3>Analyser</h3><p>Lisez les interactions par période, lieu et support, puis exportez.</p></article>
        </div>
      </section>

      <section className="v3-pilot-page-plan" aria-labelledby="v3-pilot-plan-title">
        <header>
          <span className="v3-eyebrow">DEUX NIVEAUX CLAIRS</span>
          <h2 id="v3-pilot-plan-title">Pilot inclus.<br />Pro à la demande.</h2>
          <p>Aucune option avancée n’est ajoutée automatiquement à votre commande.</p>
        </header>
        <div className="v3-pilot-page-plan-grid">
          <article className="is-included">
            <span>INCLUS AVEC VOS SUPPORTS</span>
            <h3>Tapote Pilot</h3>
            <ul>
              <li><Check /> Retrouver les supports</li>
              <li><Check /> Voir la destination active</li>
              <li><Check /> Tester le support et sa destination</li>
              <li><Check /> Conserver le même NFC + QR</li>
            </ul>
            <a href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a>
          </article>
          <article className="is-pro">
            <span>OPTION AVANCÉE</span>
            <h3>Tapote Pilot Pro</h3>
            <strong className="v3-pilot-pro-price">{formatMoney(PILOT_PLANS.pilotPro.price)}<small> / mois</small></strong>
            <ul>
              <li><Check /> Changer la destination à distance</li>
              <li><Check /> Analyses par période, lieu et support</li>
              <li><Check /> Comparaisons multi-sites</li>
              <li><Check /> Historique, statistiques NFC / QR et exports</li>
            </ul>
            <p>Disponible séparément lorsque votre organisation a besoin d’analyses avancées, ou {formatMoney(PILOT_PLANS.pilotProAnnual.price)} par an.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

export function HowPage() {
  const destinations = [
    { id: "avis", label: "Avis Google", sectorId: "cafe", surface: "comptoir", theme: "nuit" },
    { id: "instagram", label: "Instagram · Plaque", sectorId: "salon", surface: "plaque", theme: "creme" },
    { id: "linkedin", label: "LinkedIn · Card", sectorId: "immobilier", surface: "carte", theme: "nuit" },
  ];
  const [activeDestinationId, setActiveDestinationId] = useState(destinations[0].id);
  const activeDestination = destinations.find((destination) => destination.id === activeDestinationId) || destinations[0];
  const activeSector = SECTORS.find((sector) => sector.id === activeDestination.sectorId) || SECTORS[0];
  const preview = {
    surface: activeDestination.surface,
    actionId: activeDestination.id,
    brandName: "tapote.",
    theme: activeDestination.theme,
    personalization: "ready",
    customHeadline: readyHeadlineForAction(activeDestination.id),
  };
  return (
    <main id="main-content" className="v3-how-page">
      <header className="v3-how-hero">
        <div className="v3-how-hero-copy">
          <span className="v3-eyebrow v3-eyebrow-dark">UN GESTE · AUCUNE APP</span>
          <h1>Approchez.<br />C’est ouvert.</h1>
          <p>Avis, menu, réservation, Wi-Fi ou contact : votre client arrive directement au bon endroit.</p>
          <div className="v3-how-hero-actions">
            <a href="/boutique">Choisir mon Tapote <ArrowRight /></a>
          </div>
          <div className="v3-how-hero-proof" aria-label="Principaux avantages">
            <span><Check /> NFC + QR</span>
            <span><Check /> iPhone et Android</span>
            <span><Check /> Tapote Pilot inclus</span>
          </div>
        </div>

        <div className="v3-how-live" id="demonstration">
          <motion.div
            className="v3-how-live-stage"
            data-destination={activeDestination.id}
            initial={{ opacity: 0.5, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectorScene sector={activeSector} preview={preview} className="v3-how-scene" />
          </motion.div>
          <div className="v3-how-destination-tabs" role="group" aria-label="Choisir la destination de démonstration">
            {destinations.map((destination) => (
              <button
                type="button"
                className={destination.id === activeDestination.id ? "is-selected" : ""}
                aria-pressed={destination.id === activeDestination.id}
                onClick={() => setActiveDestinationId(destination.id)}
                key={destination.id}
              >
                {destination.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="v3-how-steps" aria-labelledby="v3-how-steps-title">
        <header>
          <span className="v3-eyebrow">COMMENT ÇA MARCHE</span>
          <h2 id="v3-how-steps-title">Trois secondes.<br />Trois étapes.</h2>
          <p>Rien à télécharger, rien à expliquer.</p>
        </header>
        <div className="v3-how-step-grid">
          <article>
            <div><span>01</span><SmartphoneNfc /></div>
            <h3>Approchez</h3>
            <p>Le téléphone détecte le Tapote. La caméra peut aussi lire le QR.</p>
          </article>
          <article>
            <div><span>02</span><Zap /></div>
            <h3>Tapote dirige</h3>
            <p>Le support retrouve instantanément la destination associée.</p>
          </article>
          <article>
            <div><span>03</span><Globe2 /></div>
            <h3>La page s’ouvre</h3>
            <p>Votre client agit tout de suite, sans compte ni application.</p>
          </article>
        </div>
      </section>

      <section className="v3-how-choice" aria-labelledby="v3-how-choice-title">
        <header>
          <span className="v3-eyebrow">DEUX GESTES · LE MÊME LIEN</span>
          <h2 id="v3-how-choice-title">Tapoter ou scanner.<br />À chacun son réflexe.</h2>
        </header>
        <div className="v3-how-choice-grid">
          <article>
            <SmartphoneNfc />
            <div><h3>NFC</h3><p>Approchez le téléphone.</p></div>
          </article>
          <article>
            <QrCode />
            <div><h3>QR</h3><p>Ouvrez l’appareil photo.</p></div>
          </article>
        </div>
        <div className="v3-how-choice-result"><Globe2 /><span>Dans les deux cas</span><strong>{activeDestination.label}</strong></div>
      </section>

      <section className="v3-how-pilot-cta" id="pilot" aria-labelledby="v3-how-pilot-title">
        <div className="v3-how-pilot-icon"><Link2 /></div>
        <div>
          <span className="v3-eyebrow">TAPOTE PILOT INCLUS</span>
          <h2 id="v3-how-pilot-title">Le support reste.<br />Sa destination peut évoluer.</h2>
          <p>Retrouvez tous vos Tapote. Avec Pilot Pro, changez leurs liens à distance.</p>
        </div>
        <a href="/tapote-pilot">Découvrir Tapote Pilot <ArrowRight /></a>
      </section>

      <section className="v3-how-final">
        <span>PRÊT À COMMENCER ?</span>
        <h2>Choisissez le support.<br />Tapote prépare le reste.</h2>
        <div>
          <a href="/boutique">Choisir mon Tapote <ArrowRight /></a>
          <a href="/devis" className="is-secondary">10 supports ou plus</a>
        </div>
      </section>
    </main>
  );
}
