import { useState } from "react";
import { ArrowRight, Check, Clock3, Layers3, Link2, QrCode, SmartphoneNfc } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatMoney, PILOT_PLANS } from "../../../shared/catalog.js";
import { SECTORS } from "../../storefront/sectorData.js";
import { PilotAppMock, PilotLevelDemo } from "../marketing/PilotAppMock.jsx";
import DeviceFrame from "../../storefront/scenes/DeviceFrame.jsx";
import { ProductArt } from "../scenes/ProductArt.jsx";
import { SectorScene } from "../scenes/ProductScene.jsx";
import { readyHeadlineForAction } from "../data/content.js";

export function PilotMarketingPage() {
  const reduceMotion = useReducedMotion();
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
      <section className="v3-pilot-page-hero" aria-labelledby="v3-pilot-hero-title">
        <motion.div
          className="v3-pilot-device-scene"
          initial={reduceMotion ? false : { opacity: 0, x: -48, scale: 0.975 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src="/assets/tapote-hero-a6-hd.webp" alt="" className="v3-pilot-device-photo" />
          <div className="v3-pilot-device-shadow" aria-hidden="true" />
          <div className="v3-pilot-device">
            <i className="v3-pilot-device-camera" aria-hidden="true" />
            <div className="v3-pilot-device-screen"><PilotAppMock level="pro" compact /></div>
          </div>
          <span className="v3-pilot-device-status"><i /> Support actif · destination connectée</span>
        </motion.div>

        <motion.div
          className="v3-pilot-page-hero-copy"
          initial={reduceMotion ? false : { opacity: 0, x: 38 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.72, delay: reduceMotion ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="v3-eyebrow">TAPOTE PILOT · LE PROLONGEMENT DU SUPPORT</span>
          <h1 id="v3-pilot-hero-title">Le lien change.<br /><em>Le support reste.</em></h1>
          <p>Retrouvez chaque Tapote et la page qu’il ouvre. Avec Pilot Pro, changez sa destination et mesurez les interactions sans revenir sur place.</p>
          <div className="v3-pilot-page-hero-actions">
            <a href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a>
            <a href="#pilot-flow">Voir l’interface</a>
          </div>
          <ul className="v3-pilot-page-hero-proof" aria-label="Fonctions principales de Tapote Pilot">
            <li><Check /> Pilot inclus avec chaque support</li>
            <li><Check /> Changement de lien avec Pilot Pro</li>
            <li><Check /> Mesure NFC et QR avec Pilot Pro</li>
          </ul>
          <small>Interface de démonstration · données illustratives</small>
        </motion.div>
      </section>

      <section className="v3-pilot-page-flow" id="pilot-flow" aria-labelledby="v3-pilot-flow-title">
        <div className="v3-pilot-page-flow-head">
          <span className="v3-eyebrow">UNE INTERFACE · DEUX NIVEAUX</span>
          <h2 id="v3-pilot-flow-title">Même écran.<br />Plus de contrôle avec Pro.</h2>
          <p>Basculez entre Pilot et Pilot Pro : la différence se voit directement dans l’interface, sans tableau abstrait.</p>
        </div>
        <div className="v3-pilot-page-flow-grid">
          <div className="v3-pilot-page-steps">
            {pilotSteps.map(({ number, icon: Icon, title, copy }) => (
              <motion.article
                key={number}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: reduceMotion ? 0 : Number(number) * 0.05 }}
              >
                <span>{number}</span>
                <i><Icon /></i>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </motion.article>
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

      <section className="v3-how-explainer" aria-labelledby="v3-how-explainer-title">
        <header>
          <span className="v3-eyebrow">LE GESTE, EN VRAI</span>
          <h2 id="v3-how-explainer-title">Du support à la bonne page.</h2>
          <p>Deux gestes possibles. Le même résultat, sans application.</p>
        </header>

        <div className="v3-how-explainer-grid">
          <article className="v3-how-explainer-card is-support" data-surface={activeDestination.surface}>
            <div className="v3-how-explainer-visual">
              <motion.div
                key={`support-${activeDestination.id}`}
                initial={{ opacity: 0, y: 18, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.35 }}
              >
                <ProductArt {...preview} />
              </motion.div>
              <div className="v3-how-gesture-badges" aria-label="Deux moyens d’ouvrir la page">
                <span><SmartphoneNfc /> NFC</span>
                <span><QrCode /> QR</span>
              </div>
            </div>
            <footer><span>01</span><div><h3>Approchez ou scannez.</h3><p>Le téléphone reconnaît le support.</p></div></footer>
          </article>

          <div className="v3-how-explainer-route" aria-hidden="true">
            <i><Link2 /></i><strong>Le bon lien</strong><small>instantanément</small>
          </div>

          <article className="v3-how-explainer-card is-result">
            <div className="v3-how-explainer-visual">
              <motion.div
                key={`phone-${activeDestination.id}`}
                initial={{ opacity: 0, y: 22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.38 }}
              >
                <DeviceFrame
                  actionId={activeDestination.id}
                  sectorId={activeDestination.sectorId}
                  brandName="tapote."
                  personalization="ready"
                  className="v3-how-explainer-phone"
                />
              </motion.div>
              <span className="v3-how-opened"><Check /> Page ouverte</span>
            </div>
            <footer><span>02</span><div><h3>{activeDestination.label} s’ouvre.</h3><p>Votre client peut agir tout de suite.</p></div></footer>
          </article>
        </div>
      </section>

      <section className="v3-how-pilot-cta" id="pilot" aria-labelledby="v3-how-pilot-title">
        <div className="v3-how-pilot-preview" aria-label={`Aperçu de ${activeDestination.label} dans Tapote Pilot`}>
          <header><span><i /> Tapote Pilot</span><b>Support actif</b></header>
          <div>
            <ProductArt {...preview} />
            <span><small>Destination actuelle</small><strong>{activeDestination.label}</strong><em>tapote.fr/go/••••••</em></span>
          </div>
          <footer><Check /> Visible après la pose</footer>
        </div>
        <div className="v3-how-pilot-copy">
          <span className="v3-eyebrow">TAPOTE PILOT INCLUS</span>
          <h2 id="v3-how-pilot-title">Le support reste visible.</h2>
          <p>Retrouvez sa destination dans Pilot. Avec Pro, remplacez le lien à distance.</p>
          <div className="v3-how-pilot-actions">
            <a href="/tapote-pilot">Voir Tapote Pilot <ArrowRight /></a>
            <a href="/boutique" className="is-secondary">Choisir un support</a>
          </div>
        </div>
      </section>
    </main>
  );
}
