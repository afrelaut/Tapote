import { useEffect, useState } from "react";
import { ArrowRight, Check, Link2, RefreshCw, SmartphoneNfc } from "lucide-react";
import DeviceFrame from "../../storefront/scenes/DeviceFrame.jsx";
import { ProductArt } from "../scenes/ProductArt.jsx";

const FEATURE_STEPS = [
  {
    id: "avis",
    number: "01",
    surface: "comptoir",
    theme: "nuit",
    sectorId: "cafe",
    label: "Avis Google",
    title: "Déclencher un avis",
    copy: "Le client tapote au comptoir. La fiche Google s’ouvre directement.",
  },
  {
    id: "instagram",
    number: "02",
    surface: "plaque",
    theme: "creme",
    sectorId: "salon",
    label: "Instagram",
    title: "Montrer vos coulisses",
    copy: "La Plaque reste en place. Instagram s’ouvre sans chercher votre compte.",
  },
  {
    id: "linkedin",
    number: "03",
    surface: "carte",
    theme: "nuit",
    sectorId: "immobilier",
    label: "LinkedIn",
    title: "Partager le bon contact",
    copy: "La Card se tend en rendez-vous. Le bon profil apparaît sur le téléphone.",
  },
];

export default function FeatureShowcase3D() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = FEATURE_STEPS[activeIndex];

  useEffect(() => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % FEATURE_STEPS.length);
    }, 6200);
    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  return (
    <section className="v3-feature-3d" aria-labelledby="v3-feature-3d-title">
      <div className="v3-feature-3d-copy">
        <span className="v3-eyebrow"><SmartphoneNfc /> UN OBJET · PLUSIEURS ACTIONS</span>
        <h2 id="v3-feature-3d-title">Le geste devient<br />une vraie fonction.</h2>
        <p>Choisissez un usage : le support, l’écran et la destination évoluent ensemble.</p>
        <div className="v3-feature-3d-tabs" role="tablist" aria-label="Voir les usages Tapote">
          {FEATURE_STEPS.map((step, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "is-active" : ""}
              onClick={() => setActiveIndex(index)}
              key={step.id}
            >
              <span>{step.number}</span>
              <strong>{step.title}</strong>
              <small>{step.copy}</small>
              <ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="v3-feature-3d-stage" data-feature={active.id} aria-live="polite">
        <div className="v3-feature-3d-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="v3-feature-3d-object" key={`object-${active.id}`} aria-hidden="true">
          <ProductArt
            surface={active.surface}
            actionId={active.id}
            brandName="tapote."
            theme={active.theme}
            personalization="ready"
          />
        </div>
        <DeviceFrame
          key={`phone-${active.id}`}
          actionId={active.id}
          sectorId={active.sectorId}
          brandName="tapote."
          personalization="ready"
          demonstration
          className="v3-feature-phone"
        />
        <div className="v3-feature-3d-signal" key={`signal-${active.id}`} aria-hidden="true">
          <span><i /><i /><i /></span>
          <strong>NFC détecté</strong>
        </div>
        <div className="v3-feature-3d-cards" aria-hidden="true">
          <span><SmartphoneNfc /><small>ACCÈS</small><strong>NFC + QR</strong><Check /></span>
          <span><Link2 /><small>DESTINATION</small><strong>{active.label}</strong><Check /></span>
          <span><RefreshCw /><small>PILOT PRO</small><strong>Lien modifiable</strong><Check /></span>
        </div>
      </div>
    </section>
  );
}
