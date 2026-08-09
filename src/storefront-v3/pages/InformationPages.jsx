import { useState } from "react";
import { ArrowRight, Check, Clock3, Globe2, Layers3, Link2, MessageCircle, Plus, QrCode, Search, SmartphoneNfc, Zap } from "lucide-react";
import { motion } from "motion/react";
import { ACTIONS, formatMoney, PILOT_PLANS } from "../../../shared/catalog.js";
import { SECTORS } from "../../storefront/sectorData.js";
import { FAQ_GROUPS } from "../data/content.js";
import { PilotMarketingSection } from "../marketing/MarketingSections.jsx";
import { PilotLevelDemo } from "../marketing/PilotAppMock.jsx";
import { SectorScene } from "../scenes/ProductScene.jsx";

export function FaqPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  const visibleGroups = FAQ_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter(([question, answer]) => `${question} ${answer}`.toLocaleLowerCase("fr").includes(normalizedQuery)),
    }))
    .filter((group) => group.items.length);
  const answerCount = FAQ_GROUPS.reduce((count, group) => count + group.items.length, 0);

  return (
    <main id="main-content" className="v3-faq-page">
      <section className="v3-faq-page-hero">
        <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>FAQ</b></nav>
        <span className="v3-eyebrow v3-eyebrow-dark">QUESTIONS FRÉQUENTES · RÉPONSES CONCRÈTES</span>
        <h1>Une réponse claire.<br />Avant de commander.</h1>
        <p>Support, NFC, QR, personnalisation, Tapote Pilot, Pilot Pro, livraison et déploiement : les décisions utiles sont réunies ici.</p>
        <label className="v3-faq-search">
          <Search aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher : BAT, NFC, livraison…" aria-label="Rechercher dans la FAQ" />
          <small>{answerCount} réponses</small>
        </label>
      </section>
      <div className="v3-faq-page-layout">
        <aside aria-label="Thèmes de la FAQ">
          <span>PAR THÈME</span>
          {FAQ_GROUPS.map((group, index) => <a href={`#faq-${group.id}`} key={group.id}><b>0{index + 1}</b>{group.title}</a>)}
          <a className="is-contact" href="mailto:aymeric@tapote.fr"><MessageCircle /> Poser une question</a>
        </aside>
        <div className="v3-faq-groups">
          {visibleGroups.map((group, groupIndex) => (
            <section id={`faq-${group.id}`} key={group.id}>
              <header><span>0{FAQ_GROUPS.findIndex((candidate) => candidate.id === group.id) + 1}</span><h2>{group.title}</h2></header>
              {group.items.map(([question, answer], itemIndex) => <details open={Boolean(normalizedQuery) && groupIndex === 0 && itemIndex === 0} key={question}><summary>{question}<Plus /></summary><p>{answer}</p></details>)}
            </section>
          ))}
          {!visibleGroups.length && <section className="v3-faq-empty"><Search /><h2>Aucune réponse trouvée.</h2><p>Essayez un mot plus simple ou écrivez-nous directement.</p><a href="mailto:aymeric@tapote.fr">Poser la question <ArrowRight /></a></section>}
        </div>
      </div>
      <section className="v3-faq-final"><span>ENCORE UN DOUTE ?</span><h2>Montrez-nous votre parcours client.</h2><p>Pour 10 supports ou plus, Tapote vous aide à choisir les formats, les emplacements et les destinations.</p><a href="/devis">Préparer mon projet <ArrowRight /></a></section>
    </main>
  );
}

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
      <PilotMarketingSection pageDetail />

      <section className="v3-pilot-page-flow" id="pilot-flow" aria-labelledby="v3-pilot-flow-title">
        <div className="v3-pilot-page-flow-head">
          <span className="v3-eyebrow">UN LIEN QUI RESTE PILOTABLE</span>
          <h2 id="v3-pilot-flow-title">Le lien change.<br />Le support reste.</h2>
          <p>Le client voit toujours le même Tapote. Avec Pilot Pro, vous changez simplement la page qu’il ouvre.</p>
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
    { id: "menu", label: "Menu", sectorId: "restaurant", surface: "comptoir", brandName: "VOTRE MARQUE", theme: "nuit" },
    { id: "reservation", label: "Réservation", sectorId: "salon", surface: "plaque", brandName: "VOTRE MARQUE", theme: "creme" },
    { id: "wifi", label: "Wi-Fi", sectorId: "hotel", surface: "plaque", brandName: "VOTRE MARQUE", theme: "creme" },
    { id: "contact", label: "Contact", sectorId: "artisan", surface: "carte", brandName: "VOTRE MARQUE", theme: "nuit" },
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
            <p>Au comptoir, à table ou carte en main : une notification apparaît, le client la touche.</p>
            <ul>
              <li><Check /> Actif sur la majorité des smartphones récents</li>
              <li><Check /> Aucun appairage ni application</li>
            </ul>
          </article>
          <article>
            <div className="v3-how-channel-number">02</div>
            <QrCode />
            <h3>Scanner avec l’appareil photo</h3>
            <p>Le chemin universel. Il prend le relais dès que le NFC n’est pas disponible.</p>
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
          <p>Le NFC et le QR pointent vers une adresse Tapote stable. Pilot vous montre ce qu’elle ouvre ; Pilot Pro remplace cette page à distance, sans réimprimer le support.</p>
          <div className="v3-how-link-route" aria-label="Exemple de redirection Tapote">
            <div><small>IMPRIMÉ SUR LE SUPPORT</small><strong>tapote.fr/t/votre-support</strong><span>reste identique</span></div>
            <ArrowRight aria-hidden="true" />
            <div><small>DESTINATION ACTIVE</small><strong>{activeAction.name}</strong><span>modifiable à distance</span></div>
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
          <p className="v3-how-pro-note"><strong>Pilot Pro</strong> ajoute les analyses, les exports et le multi-sites. <a href="/tapote-pilot">Comparer les usages <ArrowRight /></a></p>
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
