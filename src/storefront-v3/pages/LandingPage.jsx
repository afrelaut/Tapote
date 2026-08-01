import { lazy, Suspense } from "react";
import { ArrowRight, Layers3, Palette, SmartphoneNfc, Sparkles } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { FinalCommercialCta, FrozenSupportSection, HomePilotSection, HowStrip, OfferArchitectureSection, SectorCommercialSection, StorefrontFaq } from "../marketing/MarketingSections.jsx";

const Hero3D = lazy(() => import("../../storefront/Hero3D.jsx"));

function FounderHero() {
  const canAnimateEntrance = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
  const reveal = {
    hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  };

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.64, ease: [0.2, 0.8, 0.2, 1] }}>
      <section className="v3-founder-hero" aria-labelledby="v3-founder-title">
        <div className="v3-founder-scene">
          <Suspense fallback={<img className="v3-founder-static-fallback" src="/assets/tapote-hero-nfc-counter.webp" alt="" />}>
            <Hero3D />
          </Suspense>
        </div>
        <div className="v3-founder-scrim" aria-hidden="true" />
        <motion.div
          className="v3-founder-copy"
          initial={canAnimateEntrance ? "hidden" : false}
          animate="visible"
          transition={{ staggerChildren: 0.095, delayChildren: 0.12 }}
        >
          <motion.span className="v3-eyebrow" variants={reveal}><Sparkles size={14} aria-hidden="true" /> NFC + QR · PENSÉ POUR LES LIEUX</motion.span>
          <motion.h1 id="v3-founder-title" variants={reveal}>Le bon geste,<br />au bon moment.</motion.h1>
          <motion.p variants={reveal}>Comptoir, plaque ou carte : un Tapote ouvre l’avis, le menu, la réservation ou le lien utile, sans application.</motion.p>
          <motion.div className="v3-founder-actions" variants={reveal}>
            <a href="/boutique">Découvrir les produits <ArrowRight aria-hidden="true" /></a>
          </motion.div>
          <motion.div className="v3-founder-facts" aria-label="Principes de la série pilote" variants={reveal}>
            <span><SmartphoneNfc aria-hidden="true" /> NFC + QR · Tapote Pilot inclus · sans application</span>
          </motion.div>
        </motion.div>
      </section>
    </MotionConfig>
  );
}

export function LandingPage() {
  return (
    <main id="main-content">
      <FounderHero />
      <section className="v3-proof-band" aria-label="Principes Tapote">
        <span><SmartphoneNfc /> NFC + QR sur chaque support</span>
        <span><Layers3 /> Tapote Pilot inclus</span>
        <span><Palette /> Studio à l’étape de personnalisation</span>
        <span><Sparkles /> Prêt à poser ou à votre image</span>
      </section>
      <FrozenSupportSection />
      <OfferArchitectureSection />
      <HowStrip />
      <SectorCommercialSection />
      <HomePilotSection />
      <StorefrontFaq />
      <FinalCommercialCta />
    </main>
  );
}
