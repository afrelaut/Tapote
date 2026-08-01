import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, ContactRound, FileCheck2, Globe2, Grid3X3, Layers3, Link2, PackageCheck, Palette, Plus, QrCode, ShieldCheck, SmartphoneNfc, Sparkles, Star, UtensilsCrossed, X } from "lucide-react";
import { formatMoney, PRODUCTS } from "../../../shared/catalog.js";
import { SECTOR_CATEGORIES, SECTORS } from "../../storefront/sectorData.js";
import { ProductArt } from "../scenes/ProductArt.jsx";
import { PilotAppMock } from "./PilotAppMock.jsx";
import { SectorScene } from "../scenes/ProductScene.jsx";
import { PRODUCT_FAQ_COMMON, PRODUCT_FAQ_SPECIFIC, SHOP_ITEMS, STOREFRONT_FAQ, WHY_TAPOTE, readyHeadlineForAction, taxLabel } from "../data/content.js";

export function OfferArchitectureSection() {
  const offers = [
    {
      id: "comptoir",
      productId: "comptoir_standard",
      eyebrow: "CAISSE · ACCUEIL · TABLE",
      title: "Tapote Comptoir",
      copy: "Le support visible au moment du paiement, de l’accueil ou du service.",
      href: "/produits/comptoir",
      cta: "Voir Tapote Comptoir",
      surface: "comptoir",
      actionId: "avis",
      theme: "nuit",
    },
    {
      id: "plaque",
      productId: "plaque_standard",
      eyebrow: "MUR · MIROIR · ENTRÉE",
      title: "Tapote Plaque",
      copy: "Le point d’action fixe qui reste lisible à l’entrée, au mur ou sur un miroir.",
      href: "/produits/plaque",
      cta: "Voir Tapote Plaque",
      surface: "plaque",
      actionId: "reservation",
      theme: "creme",
    },
    {
      id: "carte",
      productId: "carte_standard",
      eyebrow: "MOBILE · TERRAIN",
      title: "Tapote Card",
      copy: "Le format poche pour les rendez-vous, les visites et les équipes terrain.",
      href: "/produits/carte",
      cta: "Voir Tapote Card",
      surface: "carte",
      actionId: "contact",
      theme: "creme",
    },
    {
      id: "pack-local",
      productId: "pack_duo_standard",
      eyebrow: "CAISSE + ENTRÉE",
      title: "Pack Local",
      copy: "Un Comptoir et une Plaque pour couvrir deux moments complémentaires dans un même lieu.",
      href: "/boutique#packs",
      cta: "Voir le Pack Local",
      surface: "pack",
      actionId: "avis",
      theme: "nuit",
    },
  ];
  return (
    <section className="v3-home-products" aria-labelledby="v3-offer-title">
      <div className="v3-home-section-head">
        <span className="v3-eyebrow">LA GAMME TAPOTE</span>
        <h2 id="v3-offer-title">Quatre choix.<br />Le prix tout de suite.</h2>
        <p>Chaque prix comprend le support, le NFC, le QR, la destination initiale et l’accès à Tapote Pilot.</p>
      </div>
      <div className="v3-home-product-grid">
        {offers.map((offer, index) => (
          <article className={`v3-home-product is-${offer.id}`} data-order={index + 1} key={offer.id}>
            <a className="v3-home-product-visual" href={offer.href} aria-label={offer.cta}>
              <span>{offer.eyebrow}</span>
              <div aria-hidden="true">
                {offer.surface === "pack"
                  ? (
                    <>
                      <ProductArt surface="comptoir" actionId="avis" brandName="tapote." theme="nuit" personalization="ready" className="is-pack-comptoir" />
                      <ProductArt surface="plaque" actionId="avis" brandName="tapote." theme="creme" personalization="ready" className="is-pack-plaque" />
                    </>
                  )
                  : <ProductArt surface={offer.surface} actionId={offer.actionId} brandName="tapote." theme={offer.theme} personalization="ready" />}
              </div>
            </a>
            <div className="v3-home-product-copy">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{offer.title}</h3>
              <p>{offer.copy}</p>
              <div>
                <strong>À partir de {formatMoney(PRODUCTS[offer.productId].price)} <small>{taxLabel}</small></strong>
                <a href={offer.href}>{offer.cta} <ArrowRight /></a>
              </div>
            </div>
          </article>
        ))}
      </div>
      <a className="v3-home-products-all" href="/boutique">Comparer les quatre offres <ArrowRight /></a>
    </section>
  );
}

export function SectorSelector({ sectorId, onSelect }) {
  const activeSector = SECTORS.find((sector) => sector.id === sectorId) || SECTORS[0];
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef(null);
  const closePanel = () => {
    setOpen(false);
    window.requestAnimationFrame?.(() => toggleRef.current?.focus());
  };
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        window.requestAnimationFrame?.(() => toggleRef.current?.focus());
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  const chooseSector = (sector) => {
    onSelect(sector);
    setOpen(false);
  };
  return (
    <div className="v3-sector-selector">
      <label className="v3-sector-select">
        <span className="v3-visually-hidden">Choisir votre activité</span>
        <select
          aria-label="Choisir votre activité"
          value={sectorId}
          onChange={(event) => onSelect(SECTORS.find((sector) => sector.id === event.target.value) || SECTORS[0])}
        >
          {SECTORS.map((sector) => <option value={sector.id} key={sector.id}>{sector.title}</option>)}
        </select>
      </label>
      <button
        type="button"
        className="v3-sector-current"
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        ref={toggleRef}
      >
        <Grid3X3 aria-hidden="true" />
        <span><strong>{activeSector.title}</strong></span>
        <b>{open ? "Fermer" : "Changer"}</b>
        <i aria-hidden="true">⌄</i>
      </button>
      <div className="v3-sector-panel" id={panelId} hidden={!open} aria-label="Tous les secteurs Tapote">
        <div className="v3-sector-panel-head">
          <span><strong>Tous les secteurs</strong><small>Choisissez le métier le plus proche du vôtre.</small></span>
          <button type="button" onClick={closePanel} aria-label="Fermer la liste des secteurs"><X /></button>
        </div>
        <div className="v3-sector-chips v3-sector-panel-grid" role="group" aria-label="Choisir votre activité">
          {SECTOR_CATEGORIES.map((category) => (
            <section key={category} aria-label={category}>
              <span>{category}</span>
              {SECTORS.filter((sector) => sector.category === category).map((sector) => (
                <button
                  type="button"
                  key={sector.id}
                  aria-pressed={sector.id === sectorId}
                  className={sector.id === sectorId ? "is-selected" : ""}
                  onClick={() => chooseSector(sector)}
                >
                  <span>{sector.title}</span>
                  {sector.id === sectorId && <Check aria-hidden="true" />}
                </button>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SectorCommercialSection() {
  const uses = [
    { icon: Star, title: "Obtenir un avis", moment: "À la caisse ou juste après le service", product: "Tapote Comptoir", href: "/produits/comptoir?action=avis", surface: "comptoir", actionId: "avis", theme: "nuit" },
    { icon: UtensilsCrossed, title: "Ouvrir un menu", moment: "À table, au comptoir ou en vitrine", product: "Tapote Comptoir", href: "/produits/comptoir?action=menu", surface: "comptoir", actionId: "menu", theme: "creme" },
    { icon: CalendarDays, title: "Prendre rendez-vous", moment: "À la sortie ou près de l’accueil", product: "Tapote Plaque", href: "/produits/plaque?action=reservation", surface: "plaque", actionId: "reservation", theme: "creme" },
    { icon: ContactRound, title: "Partager un contact", moment: "En rendez-vous ou sur le terrain", product: "Tapote Card", href: "/produits/carte?action=contact", surface: "carte", actionId: "contact", theme: "nuit" },
  ];
  return (
    <section className="v3-home-uses" aria-labelledby="v3-sector-commercial-title">
      <div className="v3-home-section-head">
        <span className="v3-eyebrow">USAGES PRIORITAIRES</span>
        <h2 id="v3-sector-commercial-title">Une action utile.<br />Au bon endroit.</h2>
        <p>Tapote ne remplace pas vos outils. Il raccourcit le chemin vers la page que vos clients doivent ouvrir.</p>
      </div>
      <div className="v3-home-use-list">
        {uses.map(({ icon: Icon, title, moment, product, href, surface, actionId, theme }, index) => (
          <a href={href} key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <i aria-hidden="true"><Icon /></i>
            <div><h3>{title}</h3><p>{moment}</p></div>
            <strong>{product}</strong>
            <figure aria-hidden="true">
              <ProductArt surface={surface} actionId={actionId} brandName="tapote." theme={theme} personalization="ready" />
            </figure>
            <ArrowRight aria-hidden="true" />
          </a>
        ))}
      </div>
      <a className="v3-home-uses-all" href="/secteurs">Voir les recommandations par activité <Grid3X3 /></a>
    </section>
  );
}

export function HomePilotSection() {
  return (
    <section className="v3-home-pilot" aria-labelledby="v3-home-pilot-title">
      <div className="v3-home-pilot-copy">
        <span className="v3-eyebrow"><Layers3 size={14} /> TAPOTE PILOT</span>
        <h2 id="v3-home-pilot-title">Vos supports.<br />Leurs destinations.</h2>
        <p>Tapote Pilot est inclus pour associer vos supports, voir leurs destinations et changer un lien. Tapote Pilot Pro ajoute les fonctions avancées lorsqu’elles sont activées.</p>
        <div className="v3-home-pilot-levels">
          <div><small>INCLUS</small><strong>Tapote Pilot</strong><span>Supports, destinations et changements de lien</span></div>
          <div><small>OPTION AVANCÉE</small><strong>Tapote Pilot Pro</strong><span>Périodes, comparaisons et exports disponibles</span></div>
        </div>
        <a href="/tapote-pilot">Découvrir Tapote Pilot <ArrowRight /></a>
      </div>
      <div className="v3-home-pilot-window" aria-label="Aperçu fonctionnel de Tapote Pilot">
        <header><span><img src="/brand/tapote-logo-light.svg" alt="" /><b>PILOT</b></span><small>MES SUPPORTS</small></header>
        <div className="v3-home-pilot-window-body">
          <nav aria-label="Navigation de l’aperçu Pilot"><b><Grid3X3 /> Supports</b><span><Link2 /> Destinations</span><span><Clock3 /> Historique</span></nav>
          <div>
            <span className="v3-home-pilot-window-title"><small>SUPPORTS ACTIFS</small><strong>Choisir un support</strong></span>
            <ul>
              <li><i><ProductArt surface="comptoir" actionId="avis" brandName="tapote." theme="nuit" personalization="ready" /></i><span><b>Tapote Comptoir</b><small>Avis Google</small></span><ArrowRight /></li>
              <li><i><ProductArt surface="plaque" actionId="reservation" brandName="tapote." theme="creme" personalization="ready" /></i><span><b>Tapote Plaque</b><small>Réservation</small></span><ArrowRight /></li>
              <li><i><ProductArt surface="carte" actionId="contact" brandName="tapote." theme="creme" personalization="ready" /></i><span><b>Tapote Card</b><small>Contact</small></span><ArrowRight /></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StorefrontFaq() {
  return (
    <section className="v3-section v3-faq" aria-labelledby="v3-faq-title">
      <div className="v3-section-heading"><span className="v3-eyebrow">QUESTIONS CONCRÈTES</span><h2 id="v3-faq-title">Tout ce qu’il faut savoir avant d’acheter.</h2><p>Les points qui changent réellement le choix du support, du design et du délai.</p></div>
      <div>
        {STOREFRONT_FAQ.slice(0, 4).map(([question, answer]) => <details key={question}><summary>{question}<Plus /></summary><p>{answer}</p></details>)}
      </div>
      <a className="v3-faq-all-link" href="/faq">Consulter toute la FAQ <ArrowRight /></a>
    </section>
  );
}

export function FinalCommercialCta() {
  return (
    <section className="v3-final-commercial-cta">
      <div className="v3-final-commercial-copy">
        <span className="v3-eyebrow">PRÊT À PLACER LE BON GESTE ?</span>
        <h2>Un support.<br />Une action claire.</h2>
        <p>Choisissez le produit et l’action. Le design, le NFC, le QR et Tapote Pilot suivent dans le même parcours.</p>
        <div><a href="/boutique">Voir la boutique <ArrowRight /></a><a href="/devis">Projet de 10 supports ou plus</a></div>
      </div>
      <div className="v3-final-commercial-stage" aria-hidden="true">
        <ProductArt surface="comptoir" actionId="avis" brandName="tapote." theme="nuit" personalization="ready" className="is-comptoir" />
        <ProductArt surface="plaque" actionId="reservation" brandName="tapote." theme="creme" personalization="ready" className="is-plaque" />
        <ProductArt surface="carte" actionId="contact" brandName="tapote." theme="nuit" personalization="ready" className="is-carte" />
      </div>
    </section>
  );
}

export function ProductExamplesSection({ data, mode }) {
  const exampleByProduct = {
    comptoir: { sectorId: "cafe", actionId: "avis", theme: "nuit" },
    plaque: { sectorId: "salon", actionId: "reservation", theme: "creme" },
    carte: { sectorId: "immobilier", actionId: "contact", theme: "creme" },
  };
  const example = exampleByProduct[data.key] || exampleByProduct.comptoir;
  const sector = SECTORS.find((item) => item.id === example.sectorId) || SECTORS[0];
  const preview = {
    surface: data.key,
    actionId: example.actionId,
    theme: example.theme,
    brandName: mode === "custom" ? "VOTRE MARQUE" : "tapote.",
    personalization: mode === "custom" ? "custom" : "ready",
  };

  return (
    <section className="v3-section v3-product-examples" aria-labelledby={`v3-${data.key}-examples`}>
      <div className="v3-section-heading">
        <h2 id={`v3-${data.key}-examples`}>Voyez-le en situation.</h2>
        <p>Le support et l’écran restent identiques, de l’aperçu à l’usage.</p>
      </div>
      <div className="v3-product-example-grid">
        <figure className="v3-product-example-context">
          <SectorScene sector={sector} preview={preview} compact />
          <figcaption>En situation</figcaption>
        </figure>
        <figure className={`v3-product-example-art is-${data.key}`}>
          <ProductArt {...preview} />
          <figcaption>{data.name}</figcaption>
        </figure>
      </div>
    </section>
  );
}

export function RelatedProducts({ current }) {
  const related = SHOP_ITEMS.filter((item) => item.surface !== current).slice(0, 2);
  const previews = {
    comptoir: { actionId: "avis", theme: "nuit" },
    plaque: { actionId: "reservation", theme: "creme" },
    carte: { actionId: "contact", theme: "nuit" },
  };
  return (
    <section className="v3-section v3-related-products" aria-labelledby="v3-related-title">
      <div><span className="v3-eyebrow">AUTRES SUPPORTS</span><h2 id="v3-related-title">À chaque lieu, le bon format.</h2><p>Complétez votre parcours seulement si un autre point de contact le justifie.</p></div>
      <div>
        {related.map((item) => (
          <a href={`/produits/${item.slug}`} key={item.surface}>
            <span className="v3-related-product-art" aria-hidden="true">
              <ProductArt surface={item.surface} actionId={previews[item.surface].actionId} theme={previews[item.surface].theme} personalization="ready" brandName="tapote." />
            </span>
            <span>{item.eyebrow}</span>
            <strong>{item.title}</strong>
            <small>{item.promise}</small>
            <b>Découvrir <ArrowRight /></b>
          </a>
        ))}
        <a className="is-pack" href="/boutique#packs"><span>DEUX POINTS DE CONTACT</span><strong>Pack Local</strong><small>Un Comptoir et une Plaque avec une identité cohérente.</small><b>Voir le pack <ArrowRight /></b></a>
      </div>
    </section>
  );
}

export function ProductOrderJourney({ data }) {
  const steps = [
    { number: "01", icon: Palette, title: "Choisissez", copy: `Sélectionnez ${data.name}, l’action, le mode et la quantité. Le prix est visible avant l’ajout au panier.` },
    { number: "02", icon: FileCheck2, title: "On prépare", copy: "Tapote associe la destination au NFC et au QR. En mode À votre image, vous validez le BAT avant production." },
    { number: "03", icon: PackageCheck, title: "Vous posez", copy: "Le support arrive encodé et testé. Sa destination reste modifiable dans Tapote Pilot." },
  ];
  return (
    <section className="v3-product-journey" aria-labelledby={`v3-${data.key}-journey-title`}>
      <header><span className="v3-eyebrow">UN PARCOURS COURT</span><h2 id={`v3-${data.key}-journey-title`}>Vous choisissez.<br />On contrôle le reste.</h2><p>Trois étapes, du choix au premier tap.</p></header>
      <ol>{steps.map(({ number, icon: Icon, title, copy }) => <li key={number}><span>{number}</span><Icon /><h3>{title}</h3><p>{copy}</p></li>)}</ol>
    </section>
  );
}

export function ProductPilotProof({ data }) {
  const proof = {
    comptoir: { moment: "au moment du paiement", action: "Avis, fidélité ou menu", place: "Caisse · accueil · table", actionId: "avis", theme: "nuit" },
    plaque: { moment: "dans un point d’accueil fixe", action: "Réservation, avis ou Wi-Fi", place: "Entrée · mur · miroir", actionId: "reservation", theme: "creme" },
    carte: { moment: "pendant un rendez-vous", action: "Contact, portfolio ou avis", place: "Terrain · rendez-vous · livraison", actionId: "contact", theme: "nuit" },
  }[data.key];
  return (
    <section className={`v3-product-pilot-proof is-${data.key}`} aria-labelledby={`v3-${data.key}-proof-title`}>
      <div className="v3-product-pilot-copy">
        <span className="v3-eyebrow v3-eyebrow-dark">SÉRIE PILOTE · PREUVE À CONSTRUIRE</span>
        <h2 id={`v3-${data.key}-proof-title`}>Le produit est visible.<br />Le résultat doit être mesuré.</h2>
        <p>Pour {data.name}, le terrain pilote documentera le geste {proof.moment}, sans transformer une visualisation en faux cas client.</p>
        <dl>
          <div><dt>Emplacement</dt><dd>{proof.place}</dd></div>
          <div><dt>Action testée</dt><dd>{proof.action}</dd></div>
          <div><dt>Contrôles</dt><dd>NFC, QR, compréhension et tenue</dd></div>
        </dl>
        <div><a href="/preuves">Voir le protocole <ArrowRight /></a><a href="/devis">Proposer un terrain pilote</a></div>
      </div>
      <div className="v3-product-pilot-stage" aria-label={`Visualisation de ${data.name} pour préparer un test terrain`}>
        <span>APERÇU NATIF · PAS UNE PHOTO NI UN CAS CLIENT</span>
        <ProductArt surface={data.key} actionId={proof.actionId} brandName="VOTRE MARQUE" theme={proof.theme} personalization="custom" customHeadline={readyHeadlineForAction(proof.actionId)} />
        <footer><Clock3 /><span><b>Statut</b><small>Mesure terrain à documenter</small></span></footer>
      </div>
    </section>
  );
}

export function ProductFaqSection({ data }) {
  const questions = [...(PRODUCT_FAQ_SPECIFIC[data.key] || []), ...PRODUCT_FAQ_COMMON.slice(0, 3)];
  return (
    <section className="v3-product-faq" aria-labelledby={`v3-${data.key}-faq-title`}>
      <header><span className="v3-eyebrow">QUESTIONS FRÉQUENTES</span><h2 id={`v3-${data.key}-faq-title`}>Avant de commander.</h2><p>Les réponses essentielles sur {data.name}.</p><a href="/faq">Voir toute la FAQ <ArrowRight /></a></header>
      <div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus /></summary><p>{answer}</p></details>)}</div>
    </section>
  );
}

export function HowStrip() {
  return (
    <section className="v3-section v3-how-strip" aria-labelledby="v3-how-title">
      <div className="v3-section-heading"><span className="v3-eyebrow">DU CHOIX AU PREMIER TAP</span><h2 id="v3-how-title">Vous choisissez. On prépare. Vous posez.</h2><p>Un parcours court : le support, l’action et le style. Tapote s’occupe du NFC, du QR et du lien initial.</p></div>
      <div className="v3-step-grid">
        <article><b>01</b><Palette /><h3>Choisissez</h3><p>Un support, une action et un design prêt à poser ou à votre image.</p></article>
        <article><b>02</b><Globe2 /><h3>On prépare</h3><p>Le même lien est associé au NFC et au QR, puis contrôlé avant l’envoi.</p></article>
        <article><b>03</b><PackageCheck /><h3>Vous posez</h3><p>Le support fonctionne immédiatement. Le lien reste modifiable dans Tapote Pilot.</p></article>
      </div>
    </section>
  );
}

export function PilotMarketingSection({ pageDetail = false }) {
  return (
    <section className={`v3-pilot-story${pageDetail ? " is-page" : ""}`} id="pilot" aria-labelledby="v3-pilot-title">
      <div className="v3-pilot-orbit" aria-hidden="true">PILOT</div>
      <div className="v3-pilot-copy">
        <span className="v3-eyebrow"><Sparkles size={14} /> TAPOTE PILOT · INCLUS</span>
        {pageDetail
          ? <h1 className="v3-pilot-page-title" id="v3-pilot-title">Le bon lien.<br />Même après la pose.</h1>
          : <h2 id="v3-pilot-title">Le support reste.<br />Le lien évolue.</h2>}
        <p className="v3-pilot-lead">Tapote Pilot réunit vos supports et leurs destinations : vous retrouvez le bon objet et vous voyez exactement ce qu’il ouvre. Avec Tapote Pilot Pro, vous remplacez ce lien à distance.</p>
        <ul className="v3-pilot-included-points" aria-label="Fonctions incluses dans Tapote Pilot">
          <li><Check /> Supports et destinations</li>
          <li><Check /> Destination active visible</li>
          <li><Check /> NFC et QR conservés</li>
        </ul>
        <div className="v3-pilot-actions">
          <a href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a>
          {!pageDetail && <a className="is-quiet" href="/tapote-pilot">Découvrir Pilot <ArrowRight /></a>}
        </div>
        <p className="v3-pilot-clarity"><span><b>Pilot est inclus.</b> Pilot Pro reste une option avancée, distincte.</span></p>
      </div>

      <div className="v3-pilot-product">
        <div className="v3-pilot-window" role="img" aria-label="Aperçu de l’application Tapote Pilot">
          <PilotAppMock level="pilot" />
        </div>
        <div className="v3-pilot-feature-rail" aria-label="Fonctions incluses de Tapote Pilot">
          <span><SmartphoneNfc /><b>Retrouver</b><small>chaque support</small></span>
          <span><Link2 /><b>Modifier</b><small>avec Pilot Pro</small></span>
          <span><Clock3 /><b>Suivre</b><small>les changements</small></span>
        </div>
      </div>
    </section>
  );
}

export function WhyTapote() {
  return (
    <section className="v3-section v3-why" aria-labelledby="v3-why-title">
      <div className="v3-why-layout">
        <div className="v3-why-stage" aria-label="Exemple d’un support Tapote prêt à être posé">
          <div className="v3-why-stage-head">
            <span>PRÊT À POSER</span>
            <b>01 — Support complet</b>
          </div>
          <div className="v3-why-art" aria-hidden="true">
            <ProductArt surface="comptoir" actionId="avis" brandName="tapote." theme="creme" personalization="ready" className="is-main" />
            <ProductArt surface="carte" actionId="avis" brandName="tapote." theme="nuit" personalization="ready" className="is-card" />
          </div>
          <div className="v3-why-checks">
            <span><SmartphoneNfc /> NFC encodé</span>
            <span><QrCode /> QR contrôlé</span>
            <span><Link2 /> Lien initial configuré</span>
          </div>
        </div>
        <div className="v3-why-content">
          <div className="v3-why-head">
            <span className="v3-eyebrow"><ShieldCheck size={14} /> CE QUE LE PRIX COMPREND</span>
            <h2 id="v3-why-title">Vous recevez bien plus qu’un support imprimé.</h2>
            <p>Le visuel, l’encodage et le contrôle final sont déjà réunis. À la réception, vous posez votre Tapote et le bon lien s’ouvre.</p>
          </div>
          <div className="v3-why-grid">
            {WHY_TAPOTE.map(({ icon: Icon, title, copy }, index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i aria-hidden="true"><Icon /></i>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
