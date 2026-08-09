import { useCallback, useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, CircleDollarSign, Link2, MapPin, PackageCheck, Plus, SmartphoneNfc, Sparkles, Star } from "lucide-react";
import { ACTIONS, formatMoney, PRODUCTS } from "../../../shared/catalog.js";
import { SECTORS } from "../../storefront/sectorData.js";
import { compositionSurface, getProductId, makeCartItem } from "../commerce/cart.js";
import { BuyBox } from "../commerce/ProductConfigurator.jsx";
import { HOME_SCENES, PRODUCT_PAGES, SHOP_ITEMS, readyHeadlineForAction, taxLabel } from "../data/content.js";
import { NotFound } from "./LegalPages.jsx";
import { ProductExamplesSection, ProductFaqSection, ProductOrderJourney, RelatedProducts, SectorSelector, WhyTapote } from "../marketing/MarketingSections.jsx";
import { SectorScene, ShopProductPreview } from "../scenes/ProductScene.jsx";
import { ProductArt } from "../scenes/ProductArt.jsx";

const SHOP_PREVIEW_DESTINATIONS = {
  comptoir: { actionId: "avis", sectorId: "cafe" },
  plaque: { actionId: "instagram", sectorId: "salon" },
  carte: { actionId: "linkedin", sectorId: "immobilier" },
};

export function ShopPage({ onAdd, availableProductIds, initialPersonalization = "ready" }) {
  const [personalization, setPersonalization] = useState(initialPersonalization);
  const [view, setView] = useState(window.location.hash === "#packs" || window.location.pathname.includes("packs") ? "packs" : "supports");
  const isCustomEntry = initialPersonalization === "custom";
  const addProduct = (surface) => onAdd(makeCartItem(
    getProductId(surface, personalization, 1),
    HOME_SCENES[surface]?.nativeAction || "avis",
  ));
  const packs = [
    {
      id: personalization === "ready" ? "pack_duo_standard" : "pack_duo",
      title: "Pack Local",
      eyebrow: "DUO COMPTOIR + PLAQUE",
      copy: "Un Comptoir pour le moment de paiement et une Plaque pour l’entrée ou la sortie.",
      count: 2,
      composition: { comptoir: 1, plaque: 1 },
      cta: "Choisir le Pack Local",
    },
  ].filter((pack) => !availableProductIds || availableProductIds.has(pack.id));
  return (
    <main id="main-content" className="v3-shop">
      <header className="v3-shop-hero">
        <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>Boutique</b></nav>
        <span className="v3-eyebrow">{isCustomEntry ? "À VOTRE IMAGE · LE SUPPORT RESTE DÉJÀ CHOISI" : "PRÊT À POSER OU À VOTRE IMAGE"}</span>
        <h1>{isCustomEntry ? <>Votre identité.<br />Sur le bon support.</> : <>Trois objets.<br />Deux chemins simples.</>}</h1>
        <p>{isCustomEntry
          ? "Choisissez Comptoir, Plaque ou Card. Logo, couleurs et textes se personnalisent ensuite dans Tapote Studio, avec un BAT avant production."
          : "Choisissez votre support puis son mode : design Tapote prêt à poser, ou personnalisation à votre image dans Tapote Studio."}</p>
      </header>
      <section className="v3-shop-controls" aria-label="Choix de la boutique">
        <div className="v3-shop-categories" role="group" aria-label="Afficher les produits ou les packs">
          <button type="button" aria-pressed={view === "supports"} className={view === "supports" ? "is-selected" : ""} onClick={() => setView("supports")}>Les 3 produits</button>
          <button type="button" aria-pressed={view === "packs"} className={view === "packs" ? "is-selected" : ""} onClick={() => setView("packs")}>Pack Local</button>
        </div>
        <div className="v3-shop-range" role="group" aria-label="Choisir le mode de création">
          <span>Votre chemin</span>
          <button type="button" aria-pressed={personalization === "ready"} className={personalization === "ready" ? "is-selected" : ""} onClick={() => setPersonalization("ready")}><strong>Prêt à poser</strong><small>Design Tapote</small></button>
          <button type="button" aria-pressed={personalization === "custom"} className={personalization === "custom" ? "is-selected" : ""} onClick={() => setPersonalization("custom")}><strong>À votre image</strong><small>Studio + BAT</small></button>
        </div>
      </section>
      {view === "supports" && (
        <section className="v3-shop-grid" aria-label="Produits Tapote" key={personalization}>
          {SHOP_ITEMS.filter((item) => !availableProductIds || availableProductIds.has(getProductId(item.surface, personalization, 1))).map((item) => {
            const productId = getProductId(item.surface, personalization, 1);
            const product = PRODUCTS[productId];
            const scene = HOME_SCENES[item.surface];
            const destination = SHOP_PREVIEW_DESTINATIONS[item.surface];
            const previewSector = SECTORS.find((sector) => sector.id === destination.sectorId) || SECTORS[0];
            const preview = {
              surface: item.surface,
              actionId: destination.actionId,
              brandName: personalization === "custom" ? scene.brandName : "tapote.",
              theme: scene.theme,
              customHeadline: personalization === "custom" ? readyHeadlineForAction(destination.actionId) : "",
              personalization,
            };
            return (
              <article className="v3-shop-card" data-variant={personalization} key={item.surface}>
                <a
                  className="v3-shop-card-image"
                  href={`/produits/${item.slug}?mode=${personalization}`}
                  aria-label={`Voir ${item.title} en mode ${personalization === "ready" ? "Prêt à poser" : "À votre image"}`}
                >
                  <ShopProductPreview preview={preview} sectorId={previewSector.id} sectorTitle={previewSector.title} />
                </a>
                <div className="v3-shop-card-copy">
                  <h2>{item.title}</h2>
                  <p>{item.promise}</p>
                  <div>
                    <strong>{formatMoney(product.price)}</strong>
                    {personalization === "ready"
                      ? <button type="button" onClick={() => addProduct(item.surface)}>Ajouter au panier <Plus /></button>
                      : <a className="v3-shop-card-studio-link" href={`/produits/${item.slug}?mode=custom`}>Personnaliser <ArrowRight /></a>}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      {view === "packs" && (
        <section className="v3-shop-packs" id="packs" key={`packs-${personalization}`}>
          <div className="v3-section-heading">
            <span className="v3-eyebrow">LE PACK TAPOTE</span>
            <h2>La caisse et l’entrée.<br />Dans une même identité.</h2>
            <p>Pack Local réunit un Comptoir et une Plaque. Chaque support garde sa propre destination dans Tapote Pilot.</p>
            <div className="v3-pack-proof">
              <span><Link2 /> Liens indépendants</span>
              <span><Sparkles /> Même identité partout</span>
              <span><PackageCheck /> Un seul contrôle de série</span>
            </div>
          </div>
          <div className="v3-shop-pack-list">
            {packs.map((pack) => {
              const product = PRODUCTS[pack.id];
              const saving = Math.max(0, product.value - product.price);
              return (
                <article className="v3-shop-pack-card is-starter" id="pack-local" key={pack.id}>
                  <header className="v3-pack-card-top"><span>{pack.eyebrow}</span><b><Star /> PACK LOCAL</b></header>
                  <div className="v3-pack-support-map" aria-label={`${pack.count} emplacements suggérés`}>
                    {Array.from({ length: pack.count }, (_, itemIndex) => (
                      <div key={itemIndex}><i className={itemIndex < pack.composition.comptoir ? "is-stand" : "is-plaque"}><span /></i><small><b>{itemIndex < pack.composition.comptoir ? "Comptoir" : "Plaque"}</b><span>{itemIndex === 0 ? "Caisse" : itemIndex === 1 ? "Entrée" : "Parcours"}</span></small></div>
                    ))}
                  </div>
                  <div className="v3-pack-card-copy">
                    <span>{pack.count} POINTS D’ACTION · {personalization === "ready" ? "PRÊTS À SERVIR" : "À VOTRE IMAGE"}</span>
                    <h3>{pack.title}</h3>
                    <p>{pack.copy}</p>
                    <div className="v3-pack-price-row"><strong><b>{formatMoney(product.price)}</b><small>{taxLabel}</small></strong><div><b>{formatMoney(Math.round(product.price / pack.count))} / support</b><span>{saving ? `${formatMoney(saving)} d’écart` : "prix groupé"}</span></div></div>
                    <div className="v3-pack-saving"><CircleDollarSign /><strong>Composition prête</strong><span>· chaque destination reste indépendante</span></div>
                    <ul><li><CheckCircle2 /> NFC + QR testés un par un</li><li><CheckCircle2 /> Une identité cohérente</li><li><CheckCircle2 /> Tapote Pilot inclus</li></ul>
                    <button className="v3-shop-pack-configure" type="button" onClick={() => onAdd(makeCartItem(pack.id, "avis", { supportComposition: pack.composition }))}>{pack.cta} <Plus /></button>
                  </div>
                </article>
              );
            })}
          </div>
          <p>10 supports ou plus ? <a href="/devis">Demander une composition et un devis documenté</a>.</p>
        </section>
      )}
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
  const params = new URLSearchParams(window.location.search);
  // Les anciens liens ?mode=custom continuent d'ouvrir directement la partie
  // personnalisée, mais la fiche reste désormais un espace unique : le client
  // peut passer du design Tapote à son identité sans changer de page.
  const requestedMode = params.get("mode") === "custom" ? "custom" : "ready";
  const requestedAction = ACTIONS[params.get("action")] ? params.get("action") : data?.key === "carte" ? "contact" : "avis";
  const requestedCount = 1;
  const scene = HOME_SCENES[data?.key || "comptoir"];
  const defaultSectorId = data?.key === "carte" ? "artisan" : data?.key === "plaque" ? "salon" : "cafe";
  const requestedSector = SECTORS.find((sector) => sector.slug === params.get("activite") || sector.id === params.get("activite"));
  const [preferredMode, setPreferredMode] = useState(requestedMode);
  const [productSector, setProductSector] = useState(
    requestedSector || SECTORS.find((sector) => sector.id === defaultSectorId) || SECTORS[0],
  );
  const [productPreview, setProductPreview] = useState({
    surface: data?.key || "comptoir",
    actionId: requestedAction,
    brandName: requestedMode === "custom" ? "VOTRE MARQUE" : (requestedSector?.exampleBrand || SECTORS.find((sector) => sector.id === defaultSectorId)?.exampleBrand || "tapote."),
    brandLogo: "",
    theme: scene.theme,
    personalization: requestedMode,
    count: 1,
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
  if (!data) return <NotFound />;
  const activeMode = productPreview.personalization || preferredMode;
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
      count: 1,
      composition: data.key === "plaque" ? { comptoir: 0, plaque: 1 } : data.key === "carte" ? { comptoir: 0, plaque: 0 } : { comptoir: 1, plaque: 0 },
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
            preview={{ ...productPreview, surface: compositionSurface(productPreview.count || 1, productPreview.composition, data.key), baseSurface: data.key, count: productPreview.count || 1 }}
            className="v3-product-live-scene"
          />
          {previewCollapsed && (
            <div className={`v3-collapsed-product-thumb is-${data.key}`} aria-hidden="true">
              <ProductArt {...productPreview} surface={data.key} />
            </div>
          )}
        </div>
        <div className="v3-product-buy-column">
          <div className="v3-product-sector-control">
            <SectorSelector sectorId={productSector.id} onSelect={selectProductSector} />
          </div>
          <BuyBox
            key={`${data.key}-${productSector.id}-${preferredMode}`}
            onAdd={onAdd}
            initialSurface={data.key}
            initialAction={productSector.id === (requestedSector?.id || defaultSectorId) ? requestedAction : productSector.actionIds[0]}
            initialCount={requestedCount}
            initialPersonalization={preferredMode}
            initialTheme={productPreview.theme || scene.theme}
            initialBrandName={preferredMode === "custom" ? "VOTRE MARQUE" : (productSector.exampleBrand || "tapote.")}
            initialReadyHeadline={readyHeadlineForAction(productSector.id === (requestedSector?.id || defaultSectorId) ? requestedAction : productSector.actionIds[0])}
            targetId={productSector.id}
            title={`Configurez ${data.name}`}
            productOnly
            onPreviewChange={handlePreviewChange}
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
