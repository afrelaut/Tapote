import { useEffect, useState } from "react";
import { Box, Check, CreditCard, ExternalLink, PanelsTopLeft, RefreshCw, SmartphoneNfc } from "lucide-react";
import InsertArtwork from "./InsertArtwork.jsx";
import DeviceFrame from "./scenes/DeviceFrame.jsx";

const HERO_PRODUCTS = {
  comptoir: {
    label: "Comptoir",
    fullLabel: "Tapote Comptoir",
    actionId: "avis",
    destinationLabel: "Avis Google",
    icon: Box,
    placement: "Caisse · accueil · table",
    colors: {
      paper: "#141414",
      ink: "#f4efe6",
      accent: "#2946f5",
      accentInk: "#ffffff",
    },
  },
  plaque: {
    label: "Plaque",
    fullLabel: "Tapote Plaque",
    actionId: "reservation",
    destinationLabel: "Réservation",
    icon: PanelsTopLeft,
    placement: "Entrée · mur · miroir",
    colors: {
      paper: "#f4efe6",
      ink: "#161310",
      accent: "#2946f5",
      accentInk: "#ffffff",
    },
  },
  carte: {
    label: "Card",
    fullLabel: "Tapote Card",
    actionId: "contact",
    destinationLabel: "Contact",
    icon: CreditCard,
    placement: "Rendez-vous · terrain",
    colors: {
      paper: "#141414",
      ink: "#f4efe6",
      accent: "#2946f5",
      accentInk: "#ffffff",
    },
  },
};

const HERO_PRODUCT_ORDER = Object.keys(HERO_PRODUCTS);
const HERO_SEQUENCE_DURATION = 10800;

export function HeroProductObject({ surface = "comptoir", className = "" }) {
  const product = HERO_PRODUCTS[surface] || HERO_PRODUCTS.comptoir;

  return (
    <div
      className={`v3-hero-product-object is-${surface} ${className}`.trim()}
      data-tapote-product={surface}
      role="img"
      aria-label={`${product.fullLabel}, design Tapote prêt à poser`}
    >
      {surface === "carte" && <div className="v3-hero-product-object__card-back" aria-hidden="true" />}
      <div className="v3-hero-product-object__body">
        <InsertArtwork
          surface={surface}
          actionId={product.actionId}
          colors={product.colors}
          personalization="ready"
        />
        {surface === "plaque" && (
          <span className="v3-hero-product-object__fixings" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
        )}
      </div>
      {surface === "comptoir" && (
        <span className="v3-hero-product-object__base" aria-hidden="true"><i /></span>
      )}
    </div>
  );
}

export default function Hero3D() {
  const [surface, setSurface] = useState("comptoir");
  const [manualPause, setManualPause] = useState(false);
  const product = HERO_PRODUCTS[surface];

  useEffect(() => {
    if (manualPause || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const nextProductTimer = window.setTimeout(() => {
      setSurface((current) => {
        const index = HERO_PRODUCT_ORDER.indexOf(current);
        return HERO_PRODUCT_ORDER[(index + 1) % HERO_PRODUCT_ORDER.length];
      });
    }, HERO_SEQUENCE_DURATION);
    return () => window.clearTimeout(nextProductTimer);
  }, [manualPause, surface]);

  useEffect(() => {
    if (!manualPause) return undefined;
    const resumeTimer = window.setTimeout(() => setManualPause(false), HERO_SEQUENCE_DURATION * 2);
    return () => window.clearTimeout(resumeTimer);
  }, [manualPause, surface]);

  const selectProduct = (id) => {
    setManualPause(true);
    setSurface(id);
  };

  return (
    <div className="v3-hero-3d" data-scene-engine="hero-css-3d" data-active-product={surface}>
      <div className="v3-hero-3d__light" aria-hidden="true" />
      <div className="v3-hero-3d__stage">
        <HeroProductObject key={`product-${surface}`} surface={surface} />
        <DeviceFrame
          key={`phone-${surface}`}
          actionId={product.actionId}
          sectorId={surface === "carte" ? "artisan" : surface === "plaque" ? "salon" : "cafe"}
          sectorTitle={surface === "carte" ? "Artisans & terrain" : surface === "plaque" ? "Beauté & accueil" : "Cafés & bars"}
          personalization="ready"
          embedded={false}
          demonstration
          className="v3-hero-gesture-phone"
        />
        <div className="v3-hero-gesture-nfc" aria-hidden="true" key={`nfc-${surface}`}><i /><i /><i /><span>NFC détecté</span></div>
        <div className="v3-hero-tech-cards" aria-hidden="true" key={`tech-${surface}`}>
          <div className="v3-hero-tech-card is-detect">
            <i><SmartphoneNfc /></i>
            <span><small>GESTE NFC</small><strong>Support détecté</strong><em>Sans application</em></span>
            <b><Check /></b>
          </div>
          <div className="v3-hero-tech-card is-open">
            <i><ExternalLink /></i>
            <span><small>DESTINATION</small><strong>{product.destinationLabel}</strong><em>Ouverte sur le téléphone</em></span>
            <b><Check /></b>
          </div>
          <div className="v3-hero-tech-card is-pilot">
            <i><RefreshCw /></i>
            <span><small>TAPOTE PILOT</small><strong>Lien modifiable</strong><em>Sans réimprimer le support</em></span>
            <b><Check /></b>
          </div>
        </div>
      </div>

      <div className="v3-hero-3d__toolbar" role="group" aria-label="Choisir le produit présenté">
        <span>OBJET EN VEDETTE</span>
        <div>
          {Object.entries(HERO_PRODUCTS).map(([id, item]) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                className={surface === id ? "is-active" : ""}
                aria-pressed={surface === id}
                onClick={() => selectProduct(id)}
                key={id}
              >
                <Icon aria-hidden="true" />
                <span><strong>{item.label}</strong><small>{item.placement}</small></span>
              </button>
            );
          })}
        </div>
        <div className="v3-hero-3d__timeline" aria-hidden="true">
          {HERO_PRODUCT_ORDER.map((id) => <i className={surface === id ? "is-active" : ""} key={id} />)}
        </div>
      </div>
    </div>
  );
}
