import { useCallback, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, ChevronUp, MapPin, SmartphoneNfc, Sparkles } from "lucide-react";
import { ACTIONS, formatMoney, PRODUCTS } from "../../../shared/catalog.js";
import { SECTORS } from "../../storefront/sectorData.js";
import { BuyBox } from "../commerce/ProductConfigurator.jsx";
import { HOME_SCENES, PRODUCT_PAGES, readyHeadlineForAction } from "../data/content.js";
import { NotFound } from "./LegalPages.jsx";
import { ProductExamplesSection, ProductFaqSection, ProductOrderJourney, RelatedProducts, SectorSelector, WhyTapote } from "../marketing/MarketingSections.jsx";
import { SectorScene, ShopProductPreview } from "../scenes/ProductScene.jsx";
import { ProductArt } from "../scenes/ProductArt.jsx";
import { PackArt } from "../scenes/PackArt.jsx";

function ShopOfferCard({ offer }) {
  const readyProduct = PRODUCTS[offer.readyId];
  const customProduct = PRODUCTS[offer.customId];
  const scene = HOME_SCENES[offer.surface];
  const previewSector = SECTORS.find((sector) => sector.id === offer.sectorId) || SECTORS[0];
  const preview = {
    surface: offer.surface,
    actionId: offer.actionId,
    brandName: scene.brandName,
    theme: scene.theme,
    customHeadline: readyHeadlineForAction(offer.actionId),
    personalization: "custom",
  };
  return (
    <article className={offer.isPack ? "v3-shop-card is-pack" : "v3-shop-card"}>
      <a className="v3-shop-card-image" href={`${offer.href}?offre=${offer.readyId}`} aria-label={`Voir l’offre ${offer.title}`}>
        {offer.isPack ? (
          <PackArt productId={offer.readyId} composition={readyProduct.defaultComposition} />
        ) : <ShopProductPreview preview={preview} sectorId={previewSector.id} sectorTitle={previewSector.title} />}
      </a>
      <div className="v3-shop-card-copy">
        <span className="v3-eyebrow">{offer.eyebrow}</span>
        <h2>{offer.title}</h2>
        <p>{offer.description}</p>
        <div className="v3-shop-finish-prices" aria-label={`Prix ${offer.title}`}>
          <a href={`${offer.href}?offre=${offer.readyId}`}><small>Prêt à poser</small><strong>{formatMoney(readyProduct.price)}</strong></a>
          <a className="is-custom" href={`${offer.href}?offre=${offer.customId}`}><small>À votre image</small><strong>{formatMoney(customProduct.price)}</strong></a>
        </div>
        <a className="v3-shop-offer-cta" href={`${offer.href}?offre=${offer.readyId}`}>Choisir cette offre <ArrowRight /></a>
      </div>
    </article>
  );
}

export function ShopPage({ onAdd, availableProductIds }) {
  void onAdd;
  void availableProductIds;
  const offers = [
    { key: "chevalet", title: "Chevalet", readyId: "chevalet_pret", customId: "chevalet_personnalise", surface: "comptoir", actionId: "avis", sectorId: "cafe", href: "/produits/comptoir", eyebrow: "CAISSE · ACCUEIL · TABLE", description: "Le support posé, visible au moment où le téléphone est déjà en main." },
    { key: "plaque", title: "Plaque", readyId: "plaque_prete", customId: "plaque_personnalisee", surface: "plaque", actionId: "reservation", sectorId: "salon", href: "/produits/plaque", eyebrow: "ENTRÉE · MUR · POINT FIXE", description: "Un point d’action compact qui reste naturellement visible." },
    { key: "carte", title: "Carte", readyId: "carte_prete", customId: "carte_personnalisee", surface: "carte", actionId: "linkedin", sectorId: "immobilier", href: "/produits/carte", eyebrow: "POCHE · RENDEZ-VOUS · TERRAIN", description: "Le format mobile à tendre en rendez-vous ou sur le terrain." },
    { key: "essentiel", title: "Pack Essentiel", readyId: "pack_essentiel_pret", customId: "pack_essentiel", surface: "comptoir", actionId: "avis", sectorId: "cafe", href: "/produits/comptoir", eyebrow: "1 CHEVALET · 1 PLAQUE · 1 CARTE", description: "Les trois formats pour équiper un premier lieu sans angle mort.", isPack: true },
    { key: "comptoir", title: "Pack Comptoir", readyId: "pack_comptoir_pret", customId: "pack_comptoir", surface: "comptoir", actionId: "avis", sectorId: "restaurant", href: "/produits/comptoir", eyebrow: "2 CHEVALETS · 1 PLAQUE · 1 CARTE", description: "Deux moments de service couverts, plus l’entrée et le terrain.", isPack: true },
    { key: "equipe", title: "Pack Équipe", readyId: "pack_equipe_pret", customId: "pack_equipe", surface: "comptoir", actionId: "contact", sectorId: "immobilier", href: "/produits/comptoir", eyebrow: "2 CHEVALETS · 2 PLAQUES · 3 CARTES", description: "Une composition complète pour plusieurs espaces et collaborateurs.", isPack: true },
  ];
  return (
    <main id="main-content" className="v3-shop">
      <header className="v3-shop-hero">
        <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>Boutique</b></nav>
        <span className="v3-eyebrow">OFFRES DE LANCEMENT</span>
        <h1>Trois formats.<br />Trois packs.</h1>
        <p>Choisissez la composition, puis la finition : design Tapote prêt à poser ou création entièrement à votre image.</p>
      </header>
      <section className="v3-shop-family" aria-labelledby="v3-shop-formats-title">
        <header><span className="v3-eyebrow">LES FORMATS</span><h2 id="v3-shop-formats-title">Le bon objet, au bon endroit.</h2><p>Chaque format existe prêt à poser ou entièrement à votre image.</p></header>
        <div className="v3-shop-grid">{offers.slice(0, 3).map((offer) => <ShopOfferCard offer={offer} key={offer.key} />)}</div>
      </section>
      <section className="v3-shop-family is-packs" aria-labelledby="v3-shop-packs-title">
        <header><span className="v3-eyebrow">LES PACKS</span><h2 id="v3-shop-packs-title">Un lieu cohérent, dès le premier jour.</h2><p>Chaque pack réunit Chevalet, Plaque et Carte dans la même finition.</p></header>
        <div className="v3-shop-grid">{offers.slice(3).map((offer) => <ShopOfferCard offer={offer} key={offer.key} />)}</div>
      </section>
      <section className="v3-shop-volume" aria-label="Devis volume et multi-sites">
        <div><span className="v3-eyebrow">VOLUME & MULTI-SITES</span><h2>Plusieurs lieux ?<br />Un déploiement à préparer ?</h2><p>À partir de 10 supports, nous cadrons les usages, les emplacements et les destinations dans une seule proposition.</p></div>
        <div className="v3-shop-volume-side"><ul><li><Check /> Une composition adaptée à chaque lieu</li><li><Check /> Une destination par support si besoin</li><li><Check /> Une proposition avant engagement</li></ul><a href="/devis">Demander un devis <ArrowRight /></a></div>
      </section>
      <WhyTapote />
    </main>
  );
}

export function ProductPage({ page, onAdd }) {
  const data = PRODUCT_PAGES[page];
  return data ? <ProductPageContent data={data} onAdd={onAdd} /> : <NotFound />;
}

function ProductPageContent({ data, onAdd }) {
  const params = new URLSearchParams(window.location.search);
  const requestedAction = ACTIONS[params.get("action")] ? params.get("action") : data?.key === "carte" ? "contact" : "avis";
  const fallbackOfferIds = { comptoir: "chevalet_pret", plaque: "plaque_prete", carte: "carte_prete" };
  const customOfferIds = { comptoir: "chevalet_personnalise", plaque: "plaque_personnalisee", carte: "carte_personnalisee" };
  const urlOffer = PRODUCTS[params.get("offre")]?.public ? PRODUCTS[params.get("offre")] : null;
  const fallbackOfferId = params.get("mode") === "custom" ? customOfferIds[data?.key] : fallbackOfferIds[data?.key];
  const requestedOffer = urlOffer || PRODUCTS[fallbackOfferId];
  const requestedMode = requestedOffer.personalization;
  const requestedComposition = { comptoir: 0, plaque: 0, carte: 0, ...requestedOffer.defaultComposition };
  const requestedCount = requestedComposition.comptoir + requestedComposition.plaque + requestedComposition.carte;
  const scene = HOME_SCENES[data?.key || "comptoir"];
  const defaultSectorId = data?.key === "carte" ? "artisan" : data?.key === "plaque" ? "salon" : "cafe";
  const requestedSector = SECTORS.find((sector) => sector.slug === params.get("activite") || sector.id === params.get("activite"));
  const [preferredMode, setPreferredMode] = useState(requestedMode);
  const [productSector, setProductSector] = useState(
    requestedSector || SECTORS.find((sector) => sector.id === defaultSectorId) || SECTORS[0],
  );
  const [productPreview, setProductPreview] = useState({
    surface: data?.key || "comptoir",
    baseSurface: data?.key || "comptoir",
    actionId: requestedAction,
    brandName: requestedMode === "custom" ? "VOTRE MARQUE" : (requestedSector?.exampleBrand || SECTORS.find((sector) => sector.id === defaultSectorId)?.exampleBrand || "tapote."),
    brandLogo: "",
    theme: scene.theme,
    personalization: requestedMode,
    count: requestedCount,
    composition: requestedComposition,
    productId: requestedOffer.id,
  });
  const initialCtaRef = useRef(null);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const handlePreviewChange = useCallback((nextPreview) => {
    setProductPreview(nextPreview);
    setPreferredMode(nextPreview.personalization);
    // Deux noms d'animation alternés relancent le retour visuel sans remonter
    // le canvas WebGL : le support reste stable pendant la saisie.
    setPreviewRevision((revision) => revision + 1);
  }, []);
  const activeMode = productPreview.personalization || preferredMode;
  const previewSurface = productPreview.surface || productPreview.baseSurface || data.key;
  const collapsedPreview = { ...productPreview };
  delete collapsedPreview.key;
  const selectProductSector = (nextSector) => {
    setProductSector(nextSector);
    setProductPreview({
      surface: data.key,
      baseSurface: data.key,
      actionId: nextSector.actionIds[0],
      brandName: preferredMode === "custom" ? "VOTRE MARQUE" : (nextSector.exampleBrand || "tapote."),
      brandLogo: "",
      theme: data.key === "carte" ? "creme" : nextSector.id === "cafe" || nextSector.id === "restaurant" ? "nuit" : "creme",
      customHeadline: readyHeadlineForAction(nextSector.actionIds[0]),
      personalization: preferredMode,
      count: productPreview.count,
      composition: productPreview.composition,
      productId: productPreview.productId,
    });
  };
  return (
    <main id="main-content" className="v3-pdp">
      <section className="v3-product-hero" aria-labelledby="v3-product-title">
        <header className="v3-product-intro" ref={initialCtaRef}>
          <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><a href="/boutique">Boutique</a><span>/</span><b>{data.name}</b></nav>
          <h1 id="v3-product-title">{data.name}</h1>
          <p className="v3-product-lead">{data.description}</p>
        </header>
        <div className={`v3-product-gallery${previewCollapsed ? " is-preview-collapsed" : ""}`} data-preview-update={previewRevision % 2}>
          <div className="v3-mobile-live-preview-bar" aria-live="polite">
            <span><i aria-hidden="true" /> Aperçu en direct</span>
            <strong>{activeMode === "custom" ? "À votre image" : "Prêt à poser"}</strong>
            <button
              type="button"
              className="v3-mobile-preview-size"
              aria-expanded={!previewCollapsed}
              aria-label={previewCollapsed ? "Agrandir l’aperçu" : "Réduire l’aperçu"}
              onClick={() => setPreviewCollapsed((value) => !value)}
            >
              {previewCollapsed ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
              <b>{previewCollapsed ? "Agrandir" : "Réduire"}</b>
            </button>
          </div>
          <SectorScene
            sector={productSector}
            preview={{ ...productPreview, surface: productPreview.surface || data.key, baseSurface: productPreview.surface || data.key, count: productPreview.count || 1 }}
            className="v3-product-live-scene"
          />
          {previewCollapsed && (
            <div className={`v3-collapsed-product-thumb is-${previewSurface}`} aria-hidden="true">
              <ProductArt {...collapsedPreview} surface={previewSurface} />
            </div>
          )}
        </div>
        <div className="v3-product-buy-column">
          <div className="v3-product-sector-control">
            <SectorSelector sectorId={productSector.id} onSelect={selectProductSector} />
          </div>
          <BuyBox
            key={`${data.key}-${productSector.id}-${requestedOffer.id}`}
            onAdd={onAdd}
            initialProductId={requestedOffer.id}
            initialSurface={data.key}
            initialAction={productSector.id === (requestedSector?.id || defaultSectorId) ? requestedAction : productSector.actionIds[0]}
            initialCount={requestedCount}
            initialComposition={requestedComposition}
            initialPersonalization={preferredMode}
            initialTheme={productPreview.theme || scene.theme}
            initialBrandName={preferredMode === "custom" ? "VOTRE MARQUE" : (productSector.exampleBrand || "tapote.")}
            initialReadyHeadline={readyHeadlineForAction(productSector.id === (requestedSector?.id || defaultSectorId) ? requestedAction : productSector.actionIds[0])}
            targetId={productSector.id}
            title="Composez votre Tapote"
            productOnly
            allowAllSurfaces
            onPreviewChange={handlePreviewChange}
            onExpandPreview={() => setPreviewCollapsed(false)}
            onCompactPreview={() => setPreviewCollapsed(true)}
            draftKey={`pdp:${data.key}`}
            stickyTriggerRef={initialCtaRef}
          />
        </div>
      </section>
      <ProductExamplesSection data={data} mode={activeMode} />
      <section className="v3-section v3-product-details">
        <div className="v3-section-heading"><span className="v3-eyebrow">L’ESSENTIEL</span><h2>Prêt à poser.</h2></div>
        <div className="v3-product-detail-grid">
          <article><SmartphoneNfc /><div><h3>{data.name}</h3><p>{data.placements}</p></div></article>
          <article><Sparkles /><div><h3>NFC + QR testés</h3><p>Lien configuré avant l’envoi</p></div></article>
          <article><MapPin /><div><h3>Tapote Pilot inclus</h3><p>Support et destination au même endroit</p></div></article>
        </div>
      </section>
      <ProductOrderJourney data={data} />
      {/* La moitié droite de cette section était vide : elle porte désormais
          l'écran réel de l'application, qui montre au lieu de raconter. */}
      <section className="v3-pdp-pilot-cta" aria-labelledby={`v3-${data.key}-pilot-title`}>
        <div>
          <span className="v3-eyebrow">TAPOTE PILOT INCLUS</span>
          <h2 id={`v3-${data.key}-pilot-title`}>Retrouvez ce support après la pose.</h2>
          <p>Sa destination reste visible dans Pilot. Pilot Pro permet ensuite de la remplacer à distance.</p>
        </div>
        <a href="/tapote-pilot">Découvrir Tapote Pilot <ArrowRight /></a>
      </section>
      <ProductFaqSection data={data} />
      <RelatedProducts current={data.key} />
    </main>
  );
}
