import { useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle2, CircleDollarSign, Link2, MapPin, PackageCheck, Plus, SmartphoneNfc, Sparkles, Star } from "lucide-react";
import { ACTIONS, formatMoney, PRODUCTS } from "../../../shared/catalog.js";
import { SECTORS } from "../../storefront/sectorData.js";
import { getProductId, makeCartItem } from "../commerce/cart.js";
import { BuyBox } from "../commerce/ProductConfigurator.jsx";
import { HOME_SCENES, PRODUCT_PAGES, SHOP_ITEMS, readyHeadlineForAction, taxLabel } from "../data/content.js";
import { NotFound } from "./LegalPages.jsx";
import { ProductExamplesSection, ProductFaqSection, ProductOrderJourney, RelatedProducts, SectorSelector, WhyTapote } from "../marketing/MarketingSections.jsx";
import { ProductScene, SectorScene } from "../scenes/ProductScene.jsx";

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
      eyebrow: "CAISSE + ENTRÉE",
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
            const preview = {
              surface: item.surface,
              actionId: scene.nativeAction,
              brandName: personalization === "custom" ? scene.brandName : "tapote.",
              theme: scene.theme,
              customHeadline: personalization === "custom" ? readyHeadlineForAction(scene.nativeAction) : "",
              personalization,
            };
            return (
              <article className="v3-shop-card" data-variant={personalization} key={item.surface}>
                <a
                  className="v3-shop-card-image"
                  href={`/produits/${item.slug}?mode=${personalization}`}
                  aria-label={`Voir ${item.title} en mode ${personalization === "ready" ? "Prêt à poser" : "À votre image"}`}
                >
                  <ProductScene image={scene.image} alt={`${item.title} en situation`} preview={preview} compact />
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
                    <div className="v3-pack-price-row"><strong>{formatMoney(product.price)} <small>{taxLabel}</small></strong><div><b>{formatMoney(Math.round(product.price / pack.count))} / support</b><span>{saving ? `${formatMoney(saving)} d’écart` : "prix groupé"}</span></div></div>
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
  if (!data) return <NotFound />;
  const activeMode = productPreview.personalization || requestedMode;
  const selectProductSector = (nextSector) => {
    setProductSector(nextSector);
    setProductPreview({
      surface: data.key,
      baseSurface: data.key,
      actionId: nextSector.actionIds[0],
      brandName: requestedMode === "custom" ? "VOTRE MARQUE" : (nextSector.exampleBrand || "tapote."),
      brandLogo: "",
      theme: data.key === "carte" ? "creme" : nextSector.id === "cafe" || nextSector.id === "restaurant" ? "nuit" : "creme",
      customHeadline: readyHeadlineForAction(nextSector.actionIds[0]),
      personalization: requestedMode,
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
        <div className="v3-product-gallery">
          <SectorScene
            key={`${productSector.id}-${data.key}`}
            sector={productSector}
            preview={{ ...productPreview, surface: data.key, baseSurface: data.key, count: 1 }}
            className="v3-product-live-scene"
          />
        </div>
        <div className="v3-product-buy-column">
          <div className="v3-product-sector-control">
            <SectorSelector sectorId={productSector.id} onSelect={selectProductSector} />
          </div>
          <BuyBox
            key={`${data.key}-${productSector.id}`}
            onAdd={onAdd}
            initialSurface={data.key}
            initialAction={productSector.id === (requestedSector?.id || defaultSectorId) ? requestedAction : productSector.actionIds[0]}
            initialCount={requestedCount}
            initialPersonalization={requestedMode}
            initialTheme={productPreview.theme || scene.theme}
            initialBrandName={requestedMode === "custom" ? "VOTRE MARQUE" : (productSector.exampleBrand || "tapote.")}
            initialReadyHeadline={readyHeadlineForAction(productSector.id === (requestedSector?.id || defaultSectorId) ? requestedAction : productSector.actionIds[0])}
            targetId={productSector.id}
            title={`Configurez ${data.name}`}
            productOnly
            onPreviewChange={setProductPreview}
            draftKey={`pdp:${data.key}`}
            stickyTriggerRef={initialCtaRef}
          />
        </div>
      </section>
      <ProductExamplesSection data={data} mode={activeMode} />
      <section className="v3-section v3-product-details">
        <div className="v3-section-heading"><span className="v3-eyebrow">L’ESSENTIEL</span><h2>Ce que vous recevez.</h2><p>Un support prêt pour son premier tap.</p></div>
        <div className="v3-product-detail-grid">
          <article><SmartphoneNfc /><h3>Le support</h3><ul><li><Check /> {data.size}</li><li><Check /> {data.placements}</li>{data.technical.map((detail) => <li key={detail}><Check /> {detail}</li>)}</ul></article>
          <article><Sparkles /><h3>Prêt à fonctionner</h3><p>{data.inBox}</p><ul><li><Check /> NFC configuré</li><li><Check /> QR associé</li><li><Check /> Tapote Pilot inclus</li></ul></article>
          <article><MapPin /><h3>Les bons moments</h3><ul>{data.uses.map((use) => <li key={use}><Check /> {use}</li>)}</ul></article>
        </div>
      </section>
      <ProductOrderJourney data={data} />
      <section className="v3-pdp-pilot" aria-labelledby={`v3-${data.key}-pilot-title`}>
        <div>
          <span className="v3-eyebrow">TAPOTE PILOT INCLUS</span>
          <h2 id={`v3-${data.key}-pilot-title`}>Le support reste.<br />Sa destination évolue.</h2>
          <p>Retrouvez {data.name}, vérifiez sa destination et changez le lien ouvert sans réimprimer ni réencoder le support.</p>
          <ul>
            <li><Check /> Gestion des supports</li>
            <li><Check /> Modification des destinations</li>
            <li><Check /> Accès inclus avec le produit</li>
          </ul>
          <a href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a>
        </div>
        <p className="v3-pdp-pilot-pro"><strong>Pilot Pro</strong> ajoute des fonctions avancées pour les périodes, lieux, équipes, exports et organisations multi-sites. <a href="/tapote-pilot">Comparer les usages <ArrowRight /></a></p>
      </section>
      <ProductFaqSection data={data} />
      <RelatedProducts current={data.key} />
    </main>
  );
}
