import { useState } from "react";
import { ArrowRight, Check, Clock3, Globe2, Layers3, Link2, Plus, QrCode, SmartphoneNfc, Zap } from "lucide-react";
import { motion } from "motion/react";
import { ACTIONS, formatMoney, PILOT_PLANS } from "../../../shared/catalog.js";
import { SECTORS } from "../../storefront/sectorData.js";
import { PilotLevelDemo } from "../marketing/PilotAppMock.jsx";
import { SectorScene } from "../scenes/ProductScene.jsx";

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
    { id: "avis", label: "Avis Google", sectorId: "cafe", surface: "comptoir", brandName: "VOTRE MARQUE", theme: "nuit" },
    { id: "instagram", label: "Instagram · Plaque", sectorId: "salon", surface: "plaque", brandName: "VOTRE MARQUE", theme: "creme" },
    { id: "linkedin", label: "LinkedIn · Card", sectorId: "immobilier", surface: "carte", brandName: "VOTRE MARQUE", theme: "nuit" },
  ];
  const [activeDestinationId, setActiveDestinationId] = useState(destinations[0].id);
  const activeDestination = destinations.find((destination) => destination.id === activeDestinationId) || destinations[0];
  const activeSector = SECTORS.find((sector) => sector.id === activeDestination.sectorId) || SECTORS[0];
  const activeAction = ACTIONS[activeDestination.id];
  const preview = {
    surface: activeDestination.surface,
    actionId: activeDestination.id,
    brandName: activeDestination.brandName,
    theme: activeDestination.theme,
    customHeadline: activeAction.campaignHeadline,
    customSubline: activeAction.campaignSubline,
    personalization: "ready",
  };
  return (
    <main id="main-content" className="v3-how-page">
      <header className="v3-how-hero">
        <div className="v3-how-hero-copy">
          <span className="v3-eyebrow v3-eyebrow-dark">NFC + QR · AUCUNE APP À INSTALLER</span>
          <h1>Un geste.<br />La bonne action.</h1>
          <p>Votre client approche son téléphone. La page que vous avez choisie s’ouvre.</p>
          <div className="v3-how-hero-actions">
            <a href="/boutique">Voir les supports <ArrowRight /></a>
          </div>
          <div className="v3-how-hero-proof" aria-label="Principaux avantages">
            <span><Check /> iPhone & Android</span>
            <span><Check /> QR de secours</span>
            <span><Check /> Destination visible dans Pilot</span>
          </div>
        </div>

        <div className="v3-how-live" id="demonstration">
          <motion.div
            className="v3-how-live-stage"
            key={`${activeDestination.id}-${activeSector.id}`}
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

      <div className="v3-how-proof-rail" aria-label="Fonctionnement de Tapote">
        <span><SmartphoneNfc /> NFC sans contact</span>
        <span><QrCode /> QR intégré</span>
        <span><Globe2 /> Toute destination web</span>
        <span><Link2 /> Tapote Pilot inclus</span>
      </div>

      <section className="v3-how-flow-section" aria-labelledby="v3-how-flow-title">
        <header>
          <span className="v3-eyebrow">LE GESTE EN TROIS SECONDES</span>
          <h2 id="v3-how-flow-title">Du support au résultat.<br />Sans étape inutile.</h2>
        </header>
        <div className="v3-link-flow">
          <article>
            <span>01</span>
            <SmartphoneNfc />
            <div><small>LE GESTE</small><h3>Il tapote</h3><p>Le téléphone détecte la puce. Le QR reste juste à côté.</p></div>
          </article>
          <ArrowRight aria-hidden="true" />
          <article>
            <span>02</span>
            <Zap />
            <div><small>LE LIEN</small><h3>Tapote dirige</h3><p>Le support retrouve la destination que vous avez activée.</p></div>
          </article>
          <ArrowRight aria-hidden="true" />
          <article>
            <span>03</span>
            <Globe2 />
            <div><small>LE RÉSULTAT</small><h3>La bonne page s’ouvre</h3><p>Avis, menu, agenda, Wi-Fi ou contact. Sans application.</p></div>
          </article>
        </div>
      </section>

      <section className="v3-how-channels" aria-labelledby="v3-how-channels-title">
        <div className="v3-how-channels-heading">
          <span className="v3-eyebrow">DEUX CHEMINS · UN SEUL RÉSULTAT</span>
          <h2 id="v3-how-channels-title">NFC quand le geste est naturel.<br />QR quand la caméra est plus simple.</h2>
        </div>
        <div className="v3-how-channel-grid">
          <article>
            <div className="v3-how-channel-number">01</div>
            <SmartphoneNfc />
            <h3>Approcher le téléphone</h3>
            <ul>
              <li><Check /> Actif sur la majorité des smartphones récents</li>
              <li><Check /> Aucun appairage ni application</li>
            </ul>
          </article>
          <article>
            <div className="v3-how-channel-number">02</div>
            <QrCode />
            <h3>Scanner avec l’appareil photo</h3>
            <ul>
              <li><Check /> Le même lien et la même destination</li>
              <li><Check /> Intégré au design, toujours accessible</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="v3-how-link-system" id="pilot" aria-labelledby="v3-how-link-title">
        <div className="v3-how-link-copy">
          <span className="v3-eyebrow">LE SUPPORT RESTE · LE LIEN ÉVOLUE</span>
          <h2 id="v3-how-link-title">Changez la destination.<br />Pas l’objet.</h2>
          <div className="v3-how-link-route" aria-label="Exemple de redirection Tapote">
            <div><small>VOTRE TAPOTE</small><strong>NFC + QR</strong><span>ne changent pas</span></div>
            <ArrowRight aria-hidden="true" />
            <div><small>LA PAGE QUI S’OUVRE</small><strong>{activeAction.name}</strong><span>modifiable avec Pilot Pro</span></div>
          </div>
        </div>
        <div className="v3-how-plan-panel">
          <div className="v3-how-plan-card is-included">
            <span>INCLUS AVEC VOTRE SUPPORT</span>
            <h3>Tapote Pilot</h3>
            <strong>Inclus<small> avec le support</small></strong>
            <ul>
              <li><Check /> Voir la destination active</li>
              <li><Check /> Conserver le même NFC + QR</li>
              <li><Check /> Retrouver vos supports et destinations</li>
            </ul>
            <a href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a>
          </div>
          <div className="v3-how-plan-card is-pro">
            <span>OPTION AVANCÉE</span>
            <h3>Tapote Pilot Pro</h3>
            <strong>9 €<small> / mois</small></strong>
            <ul>
              <li><Check /> Changer la destination à distance</li>
              <li><Check /> Analyser par période, lieu et support</li>
              <li><Check /> Comparer plusieurs sites</li>
              <li><Check /> Historique et exports</li>
            </ul>
            <a href="/tapote-pilot">Comparer Pilot et Pilot Pro <ArrowRight /></a>
          </div>
        </div>
      </section>

      <section className="v3-how-faq" aria-labelledby="v3-how-faq-title">
        <header>
          <span className="v3-eyebrow">QUESTIONS FRÉQUENTES</span>
          <h2 id="v3-how-faq-title">Tout ce qu’il faut savoir avant de tapoter.</h2>
        </header>
        <div>
          <details>
            <summary>Faut-il installer une application ? <Plus /></summary>
            <p>Non. Le téléphone ouvre une page web avec son navigateur habituel. Aucune application Tapote n’est nécessaire côté client.</p>
          </details>
          <details>
            <summary>Que se passe-t-il si le NFC ne fonctionne pas ? <Plus /></summary>
            <p>Chaque support conserve un QR visible qui ouvre la même destination. Le client peut donc scanner avec son appareil photo.</p>
          </details>
          <details>
            <summary>Puis-je changer le lien après réception ? <Plus /></summary>
            <p>Oui, avec Tapote Pilot Pro. Pilot, inclus, affiche la page ouverte ; la remplacer à distance est une fonction Pro.</p>
          </details>
          <details>
            <summary>Quelle page puis-je ouvrir ? <Plus /></summary>
            <p>Toute adresse web valide : avis Google, menu, réservation, formulaire, Wi-Fi, réseaux sociaux, coordonnées ou page multi-liens.</p>
          </details>
        </div>
      </section>

      <section className="v3-how-final">
        <span>À VOUS DE CHOISIR LE MOMENT</span>
        <h2>Un support.<br />Le bon lien.</h2>
        <p>Prêt à poser ou à votre image, toujours accessible en NFC et par QR.</p>
        <div>
          <a href="/boutique">Voir les supports <ArrowRight /></a>
          <a href="/devis" className="is-secondary">10 supports ou plus</a>
        </div>
      </section>
    </main>
  );
}
