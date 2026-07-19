import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  CloudUpload,
  CreditCard,
  CalendarDays,
  Camera,
  BriefcaseBusiness,
  FileCheck2,
  Gift,
  Globe2,
  Grid2X2,
  HandCoins,
  Link2,
  LogIn,
  Mail,
  Menu,
  MessageCircle,
  Minus,
  Music2,
  PackageCheck,
  Play,
  Plus,
  QrCode,
  ShoppingBag,
  SmartphoneNfc,
  Sparkles,
  Star,
  Store,
  UtensilsCrossed,
  Wifi,
  X,
} from "lucide-react";
import {
  ACTION_CATEGORIES,
  ACTIONS,
  calculateShipping,
  DESIGN_STYLES,
  formatMoney,
  MULTISITE_TIERS,
  PILOT_PLANS,
  PRODUCTS,
  SHIPPING,
  TARGETS,
} from "../shared/catalog.js";
import { DEVICE_THEMES } from "./deviceThemes.js";

const storefrontProductOrder = ["plaque", "comptoir", "carte", "sticker"];
const configuratorProductOrder = ["plaque", "comptoir", "mini", "carte", "sticker", "table6"];
const packOrder = ["pack_essentiel", "pack_commerce", "pack_resto"];
const complementaryPackOrder = ["pack_salon", "pack_equipe"];
const actionOrder = ["avis", "formulaire", "menu", "reservation", "commande", "paiement", "pourboire", "fidelite", "instagram", "tiktok", "facebook", "linkedin", "wifi", "site", "contact", "whatsapp", "multiliens", "autre"];
const targetOrder = ["cafe", "restaurant", "salon", "boutique", "hotel", "artisan", "immobilier", "evenement"];
const designStyleOrder = ["signature", "platform", "editorial", "minimal"];
const themeOrder = ["blue", "rose", "green", "sand", "mono"];
const themeLabels = { blue: "Signature", rose: "Douce", green: "Profonde", sand: "Naturelle", mono: "Monochrome" };
const MAX_ITEM_QUANTITY = 50;
const normalizeQuantity = (value) => Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.floor(Number(value) || 1)));
const actionIcons = {
  star: Star,
  message: MessageCircle,
  menu: UtensilsCrossed,
  calendar: CalendarDays,
  bag: ShoppingBag,
  card: CreditCard,
  coins: HandCoins,
  gift: Gift,
  instagram: Camera,
  music: Music2,
  facebook: MessageCircle,
  linkedin: BriefcaseBusiness,
  wifi: Wifi,
  globe: Globe2,
  mail: Mail,
  grid: Grid2X2,
  link: Link2,
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const launchOffers = [
  { productId: "comptoir", eyebrow: "POUR COMMENCER", title: "Le Comptoir A6", detail: "Un point de contact premium au comptoir, prêt pour les avis, réservations ou réseaux.", icon: SmartphoneNfc },
  { productId: "pack_commerce", eyebrow: "POUR UN COMMERCE", title: "Pack Commerce", detail: "Le comptoir, le mur et l’équipe avec une identité cohérente et jusqu’à cinq destinations.", icon: Store },
  { productId: "pack_resto", eyebrow: "POUR PLUSIEURS ZONES", title: "Pack Restaurant", detail: "Le comptoir, six tables et la vitrine réunis dans une seule installation.", icon: UtensilsCrossed },
];

const packStories = {
  pack_essentiel: { productId: "plaque", actionId: "avis", theme: "blue", brandName: "CAFÉ NOMA", moment: "AVIS AU COMPTOIR + CARTE MOBILE" },
  pack_visibilite: { productId: "plaque", actionId: "instagram", theme: "rose", brandName: "STUDIO LUNE", moment: "AVIS + RÉSEAUX + MULTI-LIENS" },
  pack_commerce: { productId: "comptoir", actionId: "avis", theme: "sand", brandName: "MAISON ÉCLAT", moment: "COMPTOIR + MUR + ÉQUIPE" },
  pack_resto: { productId: "table6", actionId: "menu", theme: "green", brandName: "L’ATELIER 21", moment: "COMPTOIR + TABLES + VITRINE" },
  pack_salon: { productId: "comptoir", actionId: "reservation", theme: "rose", brandName: "STUDIO LUNE", moment: "AVIS + RÉSERVATION" },
  pack_equipe: { productId: "carte", actionId: "contact", theme: "blue", brandName: "ATELIER MARTIN", moment: "ÉQUIPE + VITRINE" },
};

const createPackCartItem = (product) => ({
  productId: product.id,
  actionId: product.defaultAction,
  quantity: 1,
  brandName: "",
  theme: "blue",
  targetId: "cafe",
  designStyle: "signature",
  customHeadline: "",
  destinationUrl: "",
  brandLogoId: "",
  logoFileName: "",
});

const cartSubtotal = (cart) => cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0);

const legalDetails = {
  company: import.meta.env.VITE_LEGAL_COMPANY || "",
  capital: import.meta.env.VITE_LEGAL_CAPITAL || "",
  address: import.meta.env.VITE_LEGAL_ADDRESS || "",
  registration: import.meta.env.VITE_LEGAL_REGISTRATION || "",
  vat: import.meta.env.VITE_LEGAL_VAT || "",
  director: import.meta.env.VITE_LEGAL_DIRECTOR || "",
  contact: import.meta.env.VITE_LEGAL_CONTACT || "",
  host: import.meta.env.VITE_LEGAL_HOST || "",
  privacyContact: import.meta.env.VITE_LEGAL_PRIVACY_CONTACT || "",
  returnsAddress: import.meta.env.VITE_LEGAL_RETURNS_ADDRESS || "",
  version: import.meta.env.VITE_LEGAL_VERSION || "",
};
const legalReady = Object.values(legalDetails).every(Boolean);
const logoMimeAliases = new Map([
  ["image/png", "image/png"],
  ["image/x-png", "image/png"],
  ["image/jpeg", "image/jpeg"],
  ["image/jpg", "image/jpeg"],
  ["image/pjpeg", "image/jpeg"],
  ["image/webp", "image/webp"],
  ["image/svg+xml", "image/svg+xml"],
]);
const logoExtensionTypes = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["svg", "image/svg+xml"],
]);
const maxLogoBytes = 2 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lecture du logo impossible."));
    reader.readAsDataURL(file);
  });
}

async function convertSvgLogo(file) {
  const source = await file.text();
  const unsafeSvg = /<(?:script|foreignObject|iframe|object|embed)\b|\bon[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["']\s*(?:javascript:|https?:|data:)/i;
  if (!/<svg(?:\s|>)/i.test(source) || unsafeSvg.test(source)) {
    throw new Error("Ce SVG contient des éléments non pris en charge. Exporte-le en PNG depuis ton outil de création.");
  }

  const sourceUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
  try {
    const image = await new Promise((resolve, reject) => {
      const preview = new Image();
      preview.onload = () => resolve(preview);
      preview.onerror = () => reject(new Error("Ce fichier SVG ne peut pas être affiché."));
      preview.src = sourceUrl;
    });
    const naturalWidth = image.naturalWidth || 1200;
    const naturalHeight = image.naturalHeight || 600;
    const scale = Math.min(1, 1600 / Math.max(naturalWidth, naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Conversion du SVG impossible sur ce navigateur.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Conversion du SVG impossible."));
    }, "image/png"));
    const name = `${file.name.replace(/\.svg$/i, "") || "logo"}.png`;
    return new File([blob], name, { type: "image/png", lastModified: file.lastModified });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function prepareLogoFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const canonicalType = logoMimeAliases.get(file.type.toLowerCase()) || logoExtensionTypes.get(extension) || "";
  if (!canonicalType || file.size > maxLogoBytes) {
    throw new Error("PNG, JPG, WebP ou SVG uniquement, 2 Mo maximum.");
  }
  const normalizedFile = file.type === canonicalType ? file : new File([file], file.name, { type: canonicalType, lastModified: file.lastModified });
  return canonicalType === "image/svg+xml" ? convertSvgLogo(normalizedFile) : normalizedFile;
}

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem("tapote-cart") || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || !PRODUCTS[item.productId] || PRODUCTS[item.productId].availableStandalone === false || !ACTIONS[item.actionId]) return [];
      const quantity = normalizeQuantity(item.quantity);
      return [{
        productId: item.productId,
        actionId: item.actionId,
        quantity,
        brandName: String(item.brandName || "").slice(0, 60),
        theme: themeOrder.includes(item.theme) ? item.theme : "blue",
        targetId: TARGETS[item.targetId] ? item.targetId : "cafe",
        designStyle: DESIGN_STYLES[item.designStyle] ? item.designStyle : "signature",
        customHeadline: String(item.customHeadline || "").slice(0, 64),
        destinationUrl: String(item.destinationUrl || "").slice(0, 500),
        brandLogoId: uuidPattern.test(item.brandLogoId || "") ? item.brandLogoId : "",
        logoFileName: String(item.logoFileName || "").slice(0, 120),
      }];
    }).slice(0, 20);
  } catch {
    return [];
  }
}

const faqs = [
  [
    "Est-ce que mes clients doivent installer une application ?",
    "Non. Un téléphone compatible NFC ouvre le lien au contact ; le QR code imprimé sert de solution de secours. Aucun compte Tapote ni aucune application ne sont nécessaires.",
  ],
  [
    "Comment mon objet est-il configuré ?",
    "Tu indiques le nom du commerce et le lien souhaité à la commande. Nous encodons la puce, générons le QR code, testons les deux parcours et expédions l’objet prêt à poser.",
  ],
  [
    "Puis-je changer le lien plus tard ?",
    "Oui avec Tapote Pilot, depuis ton espace. Sans Pilot, le lien direct inscrit sur la puce reste celui configuré à la commande ; une reprogrammation physique peut être proposée.",
  ],
  [
    "Est-ce autorisé par Google ?",
    "Inviter tous les vrais clients à partager une expérience authentique est permis. En revanche, Tapote ne doit jamais filtrer les clients, promettre une récompense, ni demander exclusivement des notes positives.",
  ],
  [
    "Combien de temps faut-il pour être livré ?",
    "L’objectif opérationnel de lancement est une préparation sous 2 jours ouvrés, puis 2 à 4 jours de transport en France métropolitaine. Le délai réel doit être confirmé dans les CGV avant ouverture officielle.",
  ],
  [
    "Et pour un réseau ou une franchise ?",
    "Les tarifs multi-sites couvrent la production en série, le gabarit de marque partagé et l’adaptation par établissement. Tapote Pilot, proposé en option, ajoute le tableau de bord et les changements de destination.",
  ],
];

function BrandMark({ light = false }) {
  return (
    <a className={`brand ${light ? "brand-light" : ""}`} href="#top" aria-label="Tapote, retour en haut">
      <img className="brand-logo" src={light ? "/brand/tapote-logo-light.svg" : "/brand/tapote-logo.svg"} alt="" />
    </a>
  );
}

function Button({ children, className = "", variant = "primary", type = "button", ...props }) {
  return (
    <button type={type} className={`button button-${variant} ${className}`} {...props}>
      <span>{children}</span>
      {variant !== "icon" && <ArrowRight size={17} aria-hidden="true" />}
    </button>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const reveal = () => node.classList.add("is-visible");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.unobserve(node);
        }
      },
      { threshold: 0.01, rootMargin: "140px 0px" },
    );
    observer.observe(node);
    const safetyTimer = window.setTimeout(reveal, 900);
    return () => {
      window.clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` }}>
      {children}
    </div>
  );
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function useModalA11y(open, onClose) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const restoreFocusRef = useRef(null);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusables = () => [...(dialog?.querySelectorAll(focusableSelector) || [])];
    const frame = window.requestAnimationFrame(() => (focusables()[0] || dialog)?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusables();
      if (!elements.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  return dialogRef;
}

function PreviewInsert({ action, brandName, brandLogo, colors, productId, designStyle = "signature", customHeadline = "" }) {
  const ActionIcon = actionIcons[action.icon] || Link2;
  const tapLabel = productId === "sticker" ? "Approchez ici" : "Approchez votre téléphone";
  const headline = customHeadline.trim() || action.headline;
  return (
    <div className={`printed-insert insert-style-${designStyle} insert-action-${action.id}`} style={{ "--insert-paper": colors.paper, "--insert-ink": colors.ink, "--insert-accent": colors.accent, "--insert-accent-ink": colors.accentInk }}>
      <div className={`customer-brand ${brandLogo ? "customer-brand-has-logo" : ""}`}>
        {brandLogo ? <img src={brandLogo} alt="Logo client importé" /> : <span>{(brandName || "V").slice(0, 1).toUpperCase()}</span>}
        {(brandName || !brandLogo) && <b>{brandName || "VOTRE MARQUE"}</b>}
      </div>
      <div className="action-signature"><ActionIcon size={14} aria-hidden="true" /><span>{action.badge}</span></div>
      <div className="device-headline">{headline}</div>
      <div className="device-subline">{action.subline}</div>
      <div className="tap-zone">
        <span className="tap-zone-nfc"><SmartphoneNfc size={30} aria-hidden="true" /><strong>{tapLabel}</strong><small>NFC · sans application</small></span>
        <span className="tap-zone-qr" role="img" aria-label="Ou scannez le QR code"><img src="/brand/tapote-qr-demo.svg" alt="" /><small>OU SCANNEZ</small></span>
      </div>
      <div className="maker-signature"><img src="/brand/tapote-avatar.svg" alt="" /> TAPOTE</div>
    </div>
  );
}

function DevicePreview({ productId = "comptoir", actionId = "avis", compact = false, brandName = "CAFÉ NOMA", brandLogo = "", theme = "blue", designStyle = "signature", customHeadline = "" }) {
  const action = ACTIONS[actionId];
  const colors = DEVICE_THEMES[theme] || DEVICE_THEMES.blue;
  const product = PRODUCTS[productId] || PRODUCTS.comptoir;
  return (
    <div className={`device-preview device-preview-canonical device-preview-${productId} ${compact ? "device-preview-compact" : ""}`} aria-label={`Aperçu de ${product.name} pour ${action.name}`}>
      {productId === "table6" && <span className="device-quantity">×6</span>}
      <div className={productId === "comptoir" || productId === "table6" ? "acrylic-sheet" : "product-face"}>
        <PreviewInsert action={action} brandName={brandName} brandLogo={brandLogo} colors={colors} productId={productId} designStyle={designStyle} customHeadline={customHeadline} />
      </div>
      {(productId === "comptoir" || productId === "table6") && <div className="acrylic-foot" aria-hidden="true" />}
    </div>
  );
}

function ProductSilhouette({ productId }) {
  return <div className={`product-silhouette product-silhouette-${productId} product-silhouette-generated`}><DevicePreview productId={productId} compact /></div>;
}

function Header({ cartCount, onCart, mobileOpen, setMobileOpen }) {
  return (
    <header className="site-header">
      <BrandMark />
      <nav id="main-navigation" className={`nav-links ${mobileOpen ? "nav-links-open" : ""}`} aria-label="Navigation principale">
        <a href="#demo" onClick={() => setMobileOpen(false)}>Le geste</a>
        <a href="#offres" onClick={() => setMobileOpen(false)}>Trouver mon offre</a>
        <a href="#packs" onClick={() => setMobileOpen(false)}>Les packs</a>
        <a href="#objets" onClick={() => setMobileOpen(false)}>À l’unité</a>
        <a href="#pilot" onClick={() => setMobileOpen(false)}>Pilot</a>
        <a href="#devis" onClick={() => setMobileOpen(false)}>Devis</a>
      </nav>
      <div className="header-actions">
        <a className="header-access" href="/connexion" aria-label="Se connecter à un espace Tapote"><LogIn size={17} aria-hidden="true" /><span>Connexion</span></a>
        <a className="button button-primary header-cta" href="#configurateur"><span>Créer mon Tapote</span><ArrowRight size={16} aria-hidden="true" /></a>
        <button className="cart-trigger" onClick={onCart} aria-label={`Ouvrir le panier, ${cartCount} article(s)`}>
          <ShoppingBag size={18} />
          <span>Panier</span>
          {cartCount > 0 && <b>{cartCount}</b>}
        </button>
        <button className="menu-trigger" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileOpen} aria-controls="main-navigation">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <img className="hero-background" src="/assets/tapote-hero-nfc-counter.webp" alt="Une personne approche son téléphone du chevalet NFC Tapote posé sur un comptoir" fetchPriority="high" />
      <div className="hero-shade" />
      <div className="hero-copy">
        <div className="eyebrow hero-enter hero-enter-1"><Sparkles size={14} fill="currentColor" /> 6 chevalets reçus · série pilote</div>
        <h1 className="hero-enter hero-enter-2">
          Faites tapoter.<br />
          <span>Faites agir.</span>
        </h1>
        <p className="hero-enter hero-enter-3">Un chevalet A6 à votre image qui ouvre le bon lien par NFC ou QR, sans application.</p>
        <div className="hero-ctas hero-enter hero-enter-4">
          <div className="hero-action-row">
            <a className="button button-primary" href="#configurateur"><span>Créer mon Tapote</span><ArrowDown size={17} /></a>
            <a className="button button-secondary" href="#devis"><span>Obtenir un devis</span><ArrowRight size={17} /></a>
          </div>
          <a className="hero-demo-link" href="#demo"><i><Play size={11} fill="currentColor" /></i><span>Voir le geste<small>8 secondes</small></span></a>
          <span>Comptoir A6 49 € TTC · BAT inclus · contrôle NFC + QR avant envoi</span>
        </div>
      </div>
      <div className="hero-caption">
        <span>Premier lot reçu · tests terrain en cours</span><span>49 € TTC</span>
        <strong>Le Comptoir A6 · Avis</strong>
        <span>NFC centré + QR visible</span><span>BAT inclus</span>
      </div>
    </section>
  );
}

function SignalBand() {
  return (
    <div className="signal-band" aria-label="Caractéristiques principales">
      <div className="signal-proofs">
        <span><Check size={15} strokeWidth={3} /> Ta marque en premier</span>
        <span><Check size={15} strokeWidth={3} /> NFC + QR bien visibles</span>
        <span><Check size={15} strokeWidth={3} /> Sans application</span>
        <span><Check size={15} strokeWidth={3} /> Encodé et testé en France</span>
      </div>
    </div>
  );
}

function TapDemo() {
  const [cycle, setCycle] = useState(0);

  return (
    <section className="tap-demo" id="demo">
      <Reveal className="tap-demo-copy">
        <span className="kicker kicker-light">01 · LE GESTE</span>
        <h2>Touchez.<br /><span>Ou scannez.</span></h2>
        <p>Le NFC ouvre le lien en un geste. Le QR reste immédiatement visible pour tous les autres téléphones.</p>
        <div className="demo-proof-list">
          <div><span>01</span><p><strong>Le bon moment</strong> Le support est placé là où la décision se prend.</p></div>
          <div><span>02</span><p><strong>Deux accès</strong> Téléphone NFC centré ou QR code agrandi.</p></div>
          <div><span>03</span><p><strong>La bonne page</strong> Avis, menu ou réservation s’ouvre directement.</p></div>
        </div>
        <div className="section-action-row">
          <a className="button button-primary" href="#configurateur"><span>Créer mon Tapote</span><ArrowRight size={17} /></a>
          <a className="button button-secondary" href="#devis"><span>Demander un devis</span><ArrowRight size={17} /></a>
        </div>
      </Reveal>
      <Reveal className="tap-demo-stage" delay={120}>
        <div className="demo-scene" key={cycle} aria-label="Démonstration animée d’un client approchant son téléphone d’un chevalet Tapote">
          <div className="demo-wall-lines" aria-hidden="true" />
          <div className="demo-chevalet"><DevicePreview productId="comptoir" actionId="avis" compact brandName="CAFÉ NOMA" /></div>
          <div className="demo-ripples" aria-hidden="true"><i /><i /><i /></div>
          <div className="demo-phone" aria-hidden="true">
            <div className="demo-phone-speaker" />
            <div className="demo-lock-screen"><strong>19:24</strong><span>jeudi 16 juillet</span></div>
            <div className="demo-review-screen">
              <div className="demo-review-logo">CN</div>
              <strong>Café Noma</strong>
              <span>Comment s’est passée votre visite ?</span>
              <div className="demo-stars">★★★★★</div>
              <i />
              <b>Publier</b>
            </div>
          </div>
          <div className="demo-captions" aria-hidden="true">
            <span>Le chevalet pilote est en place.</span>
            <span>Le client approche son téléphone.</span>
            <span>La page s’ouvre. Sans application.</span>
            <span>Le bon geste, au bon moment.</span>
          </div>
          <div className="demo-badge"><i /> DÉMO · 8 S</div>
          <button className="demo-replay" onClick={() => setCycle((value) => value + 1)} aria-label="Rejouer la démonstration">↻ Rejouer</button>
        </div>
      </Reveal>
    </section>
  );
}

function OfferFinder({ onAdd }) {
  return (
    <section className="offer-finder" id="offres">
      <Reveal className="offer-finder-heading">
        <span className="kicker">02 · TROIS FAÇONS DE COMMENCER</span>
        <h2>Un besoin.<br />Un choix clair.</h2>
        <p>Commencez seul avec le Comptoir A6, équipez un commerce complet ou couvrez plusieurs zones de restaurant.</p>
      </Reveal>
      <div className="launch-offer-grid">
        {launchOffers.map(({ productId, eyebrow, title, detail, icon: Icon }, index) => {
          const product = PRODUCTS[productId];
          return <Reveal key={productId} delay={index * 80}>
            <article className={`launch-offer ${productId === "comptoir" ? "launch-offer-featured" : ""}`}>
              <span className="launch-offer-index">0{index + 1}</span>
              <i className="launch-offer-icon"><Icon size={22} /></i>
              <small>{eyebrow}</small>
              <h3>{title}</h3>
              <p>{detail}</p>
              <strong>{formatMoney(product.price)}<small> TTC</small></strong>
              {product.kind === "pack"
                ? <button type="button" onClick={() => onAdd(createPackCartItem(product))}>Choisir ce pack <Plus size={16} /></button>
                : <a href="#configurateur">Créer mon A6 <ArrowRight size={16} /></a>}
            </article>
          </Reveal>;
        })}
      </div>
      <a className="offer-all-link" href="#packs">Voir toutes les offres et les compléments <ArrowDown size={16} /></a>
    </section>
  );
}

function ProductSection({ onSelect }) {
  return (
    <section className="section products-section" id="objets">
      <div className="catalog-heading">
        <div><span className="kicker">04 · COMPLÉMENTS À L’UNITÉ</span><h2>Ajouter un autre<br />point de contact.</h2></div>
        <p>La plaque, la carte et la vitrine complètent l’installation principale.</p>
      </div>
      <div className="product-list">
        {storefrontProductOrder.map((id, index) => {
          const product = PRODUCTS[id];
          return (
            <Reveal key={id} delay={index * 80}>
              <button className="product-row" onClick={() => onSelect(id)}>
                <span className="product-index">0{index + 1}</span>
                <ProductSilhouette productId={id} />
                <span className="product-copy">
                  <span className="product-meta"><b>{product.badge}</b><i>{product.recommendedFor}</i></span>
                  <strong>{product.name}</strong>
                  <small>{product.description}</small>
                  <em>{product.format}</em>
                </span>
                <span className="product-price">{formatMoney(product.price)}<small>TTC · {formatMoney(Math.round(product.price / 1.2))} HT</small></span>
                <span className="product-arrow"><ArrowRight /></span>
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function Configurator({ initialProduct, onAdd }) {
  const [productId, setProductId] = useState(initialProduct || "comptoir");
  const [actionId, setActionId] = useState("avis");
  const [actionCategory, setActionCategory] = useState("confiance");
  const [targetId, setTargetId] = useState("cafe");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [brandName, setBrandName] = useState("CAFÉ NOMA");
  const [theme, setTheme] = useState("blue");
  const [designStyle, setDesignStyle] = useState("signature");
  const [customHeadline, setCustomHeadline] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandLogoId, setBrandLogoId] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoStatus, setLogoStatus] = useState("idle");
  const [logoError, setLogoError] = useState("");
  const [pendingLogoFile, setPendingLogoFile] = useState(null);

  const product = PRODUCTS[productId];

  const logoPending = Boolean(brandLogo && !brandLogoId);
  const destinationInvalid = Boolean(destinationUrl && !/^https:\/\/.+/i.test(destinationUrl));

  const selectAction = (id) => {
    setActionId(id);
    setActionCategory(ACTIONS[id].category);
    setCustomHeadline("");
  };

  const selectCategory = (id) => {
    setActionCategory(id);
    const firstAction = actionOrder.find((action) => ACTIONS[action].category === id);
    if (firstAction && ACTIONS[actionId].category !== id) selectAction(firstAction);
  };

  const applyTarget = (id) => {
    const target = TARGETS[id];
    setTargetId(id);
    setProductId(target.productId);
    selectAction(target.actionId);
    setTheme(target.theme);
    setDesignStyle(target.designStyle);
    setBrandName(target.exampleBrand);
  };

  const add = () => {
    if (logoPending || logoStatus === "loading" || destinationInvalid) return;
    onAdd({ productId, actionId, quantity, brandName, theme, targetId, designStyle, customHeadline, destinationUrl, brandLogoId, logoFileName });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const transmitLogo = async (file) => {
    setLogoError("");
    setLogoStatus("loading");
    try {
      const formData = new FormData();
      formData.append("logo", file, file.name);
      const response = await fetch("/api/uploads/logo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Envoi du logo impossible.");
      setBrandLogoId(data.uploadId);
      setLogoFileName(file.name.slice(0, 120));
      setLogoStatus("success");
    } catch (error) {
      setBrandLogoId("");
      setLogoStatus("error");
      setLogoError(`L’aperçu est prêt, mais le fichier n’a pas été transmis : ${error.message}`);
    }
  };

  const uploadLogo = async (event) => {
    const input = event.currentTarget;
    const selectedFile = input.files?.[0];
    input.value = "";
    if (!selectedFile) return;
    setLogoError("");
    setLogoStatus("loading");
    setBrandLogoId("");
    try {
      const file = await prepareLogoFile(selectedFile);
      const dataUrl = await readFileAsDataUrl(file);
      setBrandLogo(dataUrl);
      setLogoFileName(file.name.slice(0, 120));
      setPendingLogoFile(file);
      await transmitLogo(file);
    } catch (error) {
      setBrandLogo("");
      setBrandLogoId("");
      setLogoFileName("");
      setPendingLogoFile(null);
      setLogoStatus("error");
      setLogoError(error.message);
    }
  };

  const removeLogo = () => {
    setBrandLogo("");
    setBrandLogoId("");
    setLogoFileName("");
    setPendingLogoFile(null);
    setLogoStatus("idle");
    setLogoError("");
  };

  return (
    <section className="configurator" id="configurateur">
      <div className="configurator-preview">
        <div className="preview-orbit preview-orbit-one" />
        <div className="preview-orbit preview-orbit-two" />
        <DevicePreview productId={productId} actionId={actionId} brandName={brandName} brandLogo={brandLogo} theme={theme} designStyle={designStyle} customHeadline={customHeadline} />
        <span className="preview-note"><b>APERÇU EN DIRECT</b>{product.format} · BAT final envoyé avant production</span>
      </div>
      <div className="configurator-panel">
        <span className="kicker kicker-light">06 · PERSONNALISEZ</span>
        <h2>Voyez-le avant<br />de le commander.</h2>
        <p className="config-intro">Trois étapes suffisent. Tapote recommande le bon support et affine la direction graphique avec toi au BAT.</p>
        <fieldset>
          <legend>1. Où sera placé votre Tapote ?</legend>
          <div className="target-grid">
            {targetOrder.map((id) => {
              const target = TARGETS[id];
              return <button key={id} aria-pressed={targetId === id} className={targetId === id ? "target-active" : ""} onClick={() => applyTarget(id)}><strong>{target.name}</strong><small>{target.description}</small></button>;
            })}
          </div>
          <div className="config-recommendation"><Check size={15} /><span>Support recommandé</span><strong>{product.name}</strong><small>{product.format}</small></div>
          <div className="config-options" aria-labelledby="support-options-title">
            <div className="config-options-heading">
              <strong id="support-options-title">Choisissez votre support</strong>
              <small>Le support recommandé est déjà sélectionné.</small>
            </div>
            <div className="choice-grid product-choice-grid">
              {configuratorProductOrder.map((id) => (
                <button key={id} aria-pressed={productId === id} className={productId === id ? "choice-active" : ""} onClick={() => setProductId(id)}>
                  <span><small>{PRODUCTS[id].badge}</small><strong>{PRODUCTS[id].shortName}</strong><em>{PRODUCTS[id].recommendedFor}</em></span><b>{formatMoney(PRODUCTS[id].price)}</b>
                </button>
              ))}
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>2. Quelle action doit s’ouvrir ?</legend>
          <div className="action-categories" aria-label="Catégories d’actions">
            {Object.values(ACTION_CATEGORIES).map((category) => <button key={category.id} aria-pressed={actionCategory === category.id} className={actionCategory === category.id ? "action-category-active" : ""} onClick={() => selectCategory(category.id)}><strong>{category.name}</strong><small>{category.description}</small></button>)}
          </div>
          <div className="action-grid">
            {actionOrder.filter((id) => ACTIONS[id].category === actionCategory).map((id) => {
              const action = ACTIONS[id];
              const Icon = actionIcons[action.icon] || Link2;
              return <button key={id} aria-pressed={actionId === id} className={actionId === id ? "action-active" : ""} onClick={() => selectAction(id)}><Icon size={14} aria-hidden="true" />{action.name}</button>;
            })}
          </div>
          <label className={`destination-control ${destinationInvalid ? "destination-control-error" : ""}`}><Globe2 size={17} aria-hidden="true" /><span><input aria-label="Lien ouvert par le Tapote" type="url" value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value.slice(0, 500))} placeholder="https://votre-lien.fr" /><small>{destinationInvalid ? "Le lien doit commencer par https://" : "NFC et QR ouvriront cette destination. Pilot permettra de la modifier sans réencoder."}</small></span></label>
        </fieldset>
        <fieldset>
          <legend>3. Quelle identité doit apparaître ?</legend>
          <div className="brand-controls">
            <input aria-label="Nom affiché sur l’objet" value={brandName} onChange={(event) => setBrandName(event.target.value.slice(0, 28))} placeholder="Nom du commerce" />
            <label className={`logo-upload ${logoStatus === "success" ? "logo-upload-success" : ""}`}>
              <input aria-label="Importer le logo du commerce" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" onChange={uploadLogo} disabled={logoStatus === "loading"} />
              <CloudUpload size={14} aria-hidden="true" />
              <span>{logoStatus === "loading" ? "Envoi…" : brandLogo ? "Remplacer" : "Importer un logo"}</span>
            </label>
          </div>
          {brandLogo && <div className={`logo-file logo-file-${logoStatus}`}>
            <span className="logo-file-preview"><img src={brandLogo} alt="Aperçu du logo importé" /></span>
            <span className="logo-file-copy"><b>{logoFileName}</b><small>{logoStatus === "success" ? "Logo prêt pour le BAT" : logoStatus === "loading" ? "Transmission sécurisée…" : "Aperçu local uniquement"}</small></span>
            {logoStatus === "error" && pendingLogoFile && <button type="button" className="logo-retry" onClick={() => transmitLogo(pendingLogoFile)}>Réessayer</button>}
            <button type="button" className="logo-remove" onClick={removeLogo} aria-label="Supprimer le logo"><X size={14} /></button>
          </div>}
          {(logoStatus === "success" || logoError) && <p className={`logo-status logo-status-${logoStatus}`} role="status" aria-live="polite">{logoError || "Le logo est enregistré avec la configuration et apparaîtra sur le BAT final."}</p>}
          <div className="config-options config-style-options" aria-labelledby="style-options-title">
            <div className="config-options-heading">
              <strong id="style-options-title">Style, accroche et palette</strong>
              <small>Chaque option met l’aperçu à jour immédiatement.</small>
            </div>
            <div className="design-style-grid">
              {designStyleOrder.map((id) => <button key={id} aria-pressed={designStyle === id} className={designStyle === id ? "design-style-active" : ""} onClick={() => setDesignStyle(id)}><span className={`design-swatch design-swatch-${id}`} aria-hidden="true" /><strong>{DESIGN_STYLES[id].name}</strong><small>{DESIGN_STYLES[id].description}</small></button>)}
            </div>
            <label className="headline-control"><span>Accroche personnalisée <small>facultatif</small></span><input value={customHeadline} onChange={(event) => setCustomHeadline(event.target.value.slice(0, 64))} placeholder={ACTIONS[actionId].headline} /><em>{customHeadline.length}/64</em></label>
            <div className="theme-choices" aria-label="Palette du visuel">
              {themeOrder.map((id) => <button key={id} aria-label={`Palette ${themeLabels[id]}`} aria-pressed={theme === id} className={`${id} ${theme === id ? "theme-active" : ""}`} onClick={() => setTheme(id)}><i /><span>{themeLabels[id]}</span></button>)}
              <small>Palette affinée au BAT</small>
            </div>
          </div>
        </fieldset>
        <div className="config-guarantees"><span><Check size={13} /> NFC + QR testés</span><span><Check size={13} /> BAT avant impression</span><span><Check size={13} /> Aucun abonnement imposé</span></div>
        <div className="config-summary">
          <div><span>{product.name}</span><small>{TARGETS[targetId].name} · {ACTIONS[actionId].name} · style {DESIGN_STYLES[designStyle].name.toLowerCase()}</small></div>
          <label className="config-quantity">
            <span>Quantité</span>
            <span className="config-quantity-control">
              <button type="button" onClick={() => setQuantity((current) => normalizeQuantity(current - 1))} disabled={quantity <= 1} aria-label="Diminuer la quantité"><Minus size={14} aria-hidden="true" /></button>
              <input type="number" min="1" max={MAX_ITEM_QUANTITY} step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(normalizeQuantity(event.target.value))} aria-label="Quantité de Tapote" />
              <button type="button" onClick={() => setQuantity((current) => normalizeQuantity(current + 1))} disabled={quantity >= MAX_ITEM_QUANTITY} aria-label="Augmenter la quantité"><Plus size={14} aria-hidden="true" /></button>
            </span>
          </label>
          <strong aria-live="polite">{formatMoney(product.price * quantity)}<small>{quantity > 1 ? `${quantity} × ${formatMoney(product.price)} TTC` : "TTC"}</small></strong>
        </div>
        <Button className={added ? "button-success" : ""} onClick={add} disabled={logoStatus === "loading" || logoPending || destinationInvalid}>
          {logoStatus === "loading" ? "Envoi du logo…" : logoPending ? "Finaliser l’envoi du logo" : destinationInvalid ? "Vérifier le lien" : added ? `${quantity} ajouté${quantity > 1 ? "s" : ""} au panier` : quantity > 1 ? `Ajouter ${quantity} au panier` : "Ajouter au panier"}
        </Button>
        <p className="micro-copy"><Check size={14} /> Prix TTC · livraison offerte dès {formatMoney(SHIPPING.freeThreshold)} · paiement sécurisé</p>
        <div className="config-quote-link">
          <span><strong>Plusieurs supports ou un besoin particulier ?</strong><small>Décrivez votre projet, nous préparons une proposition adaptée.</small></span>
          <a href="#devis">Demander un devis <ArrowRight size={15} /></a>
        </div>
      </div>
    </section>
  );
}

function ProductShowcaseSection() {
  const journey = [
    ["01", HandCoins, "Vous proposez", "Juste après le paiement, quand l’échange est encore naturel."],
    ["02", SmartphoneNfc, "Le client approche", "Un téléphone sur la zone NFC, ou un scan du QR. Rien à installer."],
    ["03", Globe2, "La page s’ouvre", "Avis, réservation, menu ou fidélité apparaît directement."],
    ["04", Link2, "Vous gardez la main", "La destination peut évoluer dans Pilot, sans réimprimer le support."],
  ];
  const facts = [
    ["01", FileCheck2, "BAT avant production", "Le visuel final est validé avec le client avant impression ou fabrication."],
    ["02", QrCode, "Deux gestes vraiment visibles", "Le téléphone NFC et le QR occupent chacun une zone claire, immédiatement compréhensible."],
    ["03", PackageCheck, "Double contrôle", "Le lien NFC et le QR sont testés avant l’expédition de chaque objet."],
  ];
  return (
    <section className="product-showcase" id="personnalisation">
      <div className="customer-journey">
        <Reveal className="journey-heading">
          <span>05 · LE PARCOURS CLIENT</span>
          <h2>Le bon geste.<br /><em>Au bon moment.</em></h2>
          <p>Tapote prolonge l’échange au moment où l’attention est la plus forte&nbsp;: juste avant que le client ne reparte.</p>
        </Reveal>
        <div className="journey-story">
          <Reveal className="journey-product-wrap">
            <figure className="journey-product">
              <img src="/assets/tapote-restaurant-a6.webp" alt="Un client approche son téléphone d’un chevalet Tapote dans un restaurant" loading="lazy" />
              <span className="journey-photo-tag"><SmartphoneNfc size={17} aria-hidden="true" /> NFC + QR</span>
              <figcaption>
                <span>EN SITUATION</span>
                <strong>Un geste, rien de plus.</strong>
                <small>Chevalet A6 · posé au point de décision</small>
              </figcaption>
            </figure>
          </Reveal>
          <Reveal className="journey-steps-wrap" delay={100}>
            <ol className="journey-steps">
              {journey.map(([number, Icon, title, text], index) => <li key={number} style={{ "--step-index": index }}>
                <span>{number}</span><div><strong>{title}</strong><p>{text}</p></div><i aria-hidden="true"><Icon size={20} /></i>
              </li>)}
            </ol>
          </Reveal>
        </div>
        <Reveal className="journey-result" delay={160}><span>RÉSULTAT</span><strong>Le client agit pendant que l’intention est encore fraîche.</strong><a href="#configurateur">Créer mon parcours <ArrowRight size={17} /></a></Reveal>
      </div>
      <div className="product-facts" id="controle-qualite">
        {facts.map(([number, Icon, title, text]) => <div key={number}>
          <span className="fact-index">{number}</span>
          <span className="fact-icon" aria-hidden="true"><Icon /></span>
          <div className="fact-copy"><strong>{title}</strong><p>{text}</p></div>
        </div>)}
      </div>
      <div className="sample-cta"><p><strong>Besoin de toucher le produit avant un déploiement ?</strong><span>Demande un échantillon ou un BAT adapté à ton commerce.</span></p><a className="button button-primary" href="#devis"><span>Demander un échantillon</span><ArrowRight size={17} /></a></div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Vous choisissez", "Le point de contact, l’action et votre univers de marque se règlent dans l’aperçu.", "Support · objectif · style"],
    ["On finalise", "Un humain contrôle la hiérarchie, agrandit le QR et vous envoie le BAT avant impression.", "BAT · encodage · contrôle"],
    ["Vous le posez", "NFC et QR sont déjà configurés et testés. L’équipe n’a plus qu’à montrer le geste.", "Prêt à agir"],
  ];
  return (
    <section className="section how-section" id="fonctionnement">
      <div className="how-layout">
        <div className="how-lead">
          <Reveal className="section-heading">
            <span className="kicker">07 · DU BAT À LA POSE</span>
            <h2>Vous choisissez.<br />On livre prêt.</h2>
          </Reveal>
          <Reveal className="how-process-visual" role="img" aria-label="Un téléphone approche un chevalet Tapote et ouvre une page d’avis">
            <div className="how-device" aria-hidden="true"><DevicePreview productId="comptoir" actionId="avis" compact brandName="CAFÉ NOMA" /></div>
            <div className="how-tap-signal" aria-hidden="true"><i /><i /><i /></div>
            <div className="how-phone-card" aria-hidden="true">
              <span><Check size={13} /> Page ouverte</span>
              <strong>Avis Google</strong>
              <b>★★★★★</b>
            </div>
            <div className="how-visual-caption" aria-hidden="true"><SmartphoneNfc size={15} /> NFC centré · QR visible</div>
          </Reveal>
        </div>
        <div className="how-flow">
          <div className="steps">
            {steps.map(([title, text, meta], index) => (
              <Reveal key={title} className="step" delay={index * 100}>
                <span>0{index + 1}</span>
                <div><h3>{title}</h3><p>{text}</p><small>{meta}</small></div>
                <ArrowRight aria-hidden="true" />
              </Reveal>
            ))}
          </div>
          <Reveal className="honesty-note">
            <Sparkles size={20} fill="currentColor" />
            <p><strong>Le support ne remplace pas l’accueil.</strong> Il rend simplement l’action évidente au moment où votre équipe la propose.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PilotSection() {
  return (
    <section className="pilot-section" id="pilot">
      <div className="pilot-copy">
        <Reveal>
          <span className="kicker kicker-light">08 · TAPOTE PILOT</span>
          <span className="pilot-beta"><b>BÊTA</b> Ouverture après les premiers déploiements terrain</span>
          <h2>Changez le lien.<br /><span>Pas l’objet.</span></h2>
          <p>Pilot est en bêta privée. Changez une destination, suivez les interactions et pilotez plusieurs établissements sans réimprimer. Sans abonnement, le dernier lien configuré reste actif.</p>
          <div className="pilot-prices">
            <div><strong>Gratuit<small> en bêta</small></strong><span>Pour les premiers commerces pilotes</span></div>
            <div><strong>{formatMoney(PILOT_PLANS.pilot.price)}<small>/mois ensuite</small></strong><span>{formatMoney(PILOT_PLANS.annual.price)} / an · sans engagement</span></div>
          </div>
          <div className="pilot-access-actions"><a href="/pilot" className="button button-primary"><span>Ouvrir Tapote Pilot</span><ArrowRight size={16} /></a><a href="#devis" className="text-link">Rejoindre la bêta <ArrowRight size={16} /></a></div>
        </Reveal>
      </div>
      <Reveal className="pilot-interface">
        <div className="pilot-topline"><BrandMark light /><span>JUILLET · 30 JOURS</span></div>
        <div className="pilot-total"><span>Interactions</span><strong>294</strong><small>+18 % vs. période précédente</small></div>
        <div className="pilot-bars">
          {[42, 68, 51, 83, 62, 91, 74, 88, 66, 94, 77, 86].map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}
        </div>
        <div className="pilot-list">
          <div><span><i className="dot dot-blue" /> Menu · Tables</span><b>187</b></div>
          <div><span><i className="dot dot-yellow" /> Avis · Comptoir</span><b>76</b></div>
          <div><span><i className="dot dot-cream" /> Instagram · Vitrine</span><b>31</b></div>
        </div>
        <small className="demo-label">Données d’illustration — interface en cours de développement</small>
      </Reveal>
    </section>
  );
}

function Packs({ onAdd }) {
  const visibility = PRODUCTS.pack_visibilite;
  return (
    <section className="section packs-section" id="packs">
      <Reveal className="section-heading wide-heading">
        <div><span className="kicker">03 · TOUTES LES OFFRES</span><h2>Besoin d’aller<br />plus loin ?</h2></div>
        <p>Les packs spécialisés, les volumes et le multisite restent disponibles sans encombrer le choix principal.</p>
      </Reveal>
      <div className="packs-catalog">
        <div className="packs-catalog-head"><span><strong>Comparer les six offres Tapote</strong><small>Essentiel, Commerce, Restaurant, Visibilité, Salon et Équipe</small></span><b>Toutes les offres sont affichées</b></div>
        <div className="pack-swipe-hint" aria-hidden="true"><span>Faites glisser pour comparer</span><ArrowRight size={15} /></div>
        <div className="pack-grid">
        {packOrder.map((id, index) => {
          const product = PRODUCTS[id];
          const story = packStories[id];
          const savings = product.value - product.price;
          return (
            <Reveal className={`pack-wrap pack-wrap-${index + 1}`} key={id} delay={index * 90}>
              <article className={`pack ${id === "pack_commerce" ? "pack-featured" : ""}`} id={`offre-${id}`}>
                <div className="pack-number">0{index + 1}</div>
                <div className="pack-art"><DevicePreview productId={story.productId} actionId={story.actionId} theme={story.theme} brandName={story.brandName} compact /></div>
                <div className="pack-body">
                  <div className="pack-labels"><small className="pack-moment">{story.moment}</small><b>{product.badge}</b></div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <ul>{product.features.map((feature) => <li key={feature}><Check size={13} />{feature}</li>)}</ul>
                  <span>{product.format}</span>
                  <div className="pack-value"><span>Valeur à l’unité {formatMoney(product.value)}</span><b>Économie {formatMoney(savings)}</b></div>
                  <div className="pack-buy">
                    <strong>{formatMoney(product.price)}<small> TTC · {formatMoney(Math.round(product.price / 1.2))} HT</small></strong>
                    <button onClick={() => onAdd(createPackCartItem(product))}>Choisir ce pack <Plus size={16} /></button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
        </div>
      <Reveal className="visibility-offer" delay={100}>
        <div className="visibility-art"><DevicePreview productId="plaque" actionId="instagram" theme="rose" brandName="STUDIO LUNE" compact /></div>
        <div className="visibility-copy" id="pack-visibilite">
          <span>OFFRE RÉSEAUX SOCIAUX</span>
          <h3>{visibility.name}</h3>
          <p>{visibility.description}</p>
          <strong>{visibility.format}</strong>
        </div>
        <div className="visibility-buy">
          <span>Valeur {formatMoney(visibility.value)} · économie {formatMoney(visibility.value - visibility.price)}</span>
          <strong>{formatMoney(visibility.price)}<small> TTC</small></strong>
          <button onClick={() => onAdd(createPackCartItem(visibility))}>Ajouter au panier <Plus size={16} /></button>
        </div>
      </Reveal>
      <Reveal className="complementary-packs" delay={120}>
        <div className="complementary-packs-intro">
          <span>PACKS MÉTIER</span>
          <h3>Deux besoins ciblés.<br />Deux packs prêts.</h3>
          <p>Pour les salons qui convertissent sur place et les équipes qui restent mobiles.</p>
        </div>
        {complementaryPackOrder.map((id) => {
          const product = PRODUCTS[id];
          const story = packStories[id];
          return (
            <article className="complementary-pack" id={`offre-${id}`} key={id}>
              <div className="complementary-pack-art"><DevicePreview productId={story.productId} actionId={story.actionId} theme={story.theme} brandName={story.brandName} compact /></div>
              <div className="complementary-pack-copy">
                <span>{story.moment}</span>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <strong>{product.format}</strong>
                <small>Valeur {formatMoney(product.value)} · économie {formatMoney(product.value - product.price)}</small>
                <div><b>{formatMoney(product.price)} TTC</b><button onClick={() => onAdd(createPackCartItem(product))}>Choisir <Plus size={15} /></button></div>
              </div>
            </article>
          );
        })}
      </Reveal>
      <Reveal className="multisite-offer" delay={140}>
        <div className="multisite-intro"><span>MULTI-ÉTABLISSEMENTS</span><h3>Une marque.<br />Plusieurs adresses.</h3><p>Design centralisé, adaptation par site, QR et NFC distincts, contrôle avant expédition et destinations modifiables avec Pilot en option.</p></div>
        <div className="multisite-tiers">
          {MULTISITE_TIERS.map((tier) => <div key={tier.quantity}><span>{tier.quantity} plaques</span><strong>{formatMoney(tier.price)}</strong><small>{formatMoney(Math.round(tier.price / tier.quantity))} / plaque</small></div>)}
          <div><span>11 plaques et +</span><strong>Sur devis</strong><small>Selon le projet</small></div>
        </div>
        <a className="button button-primary" href="#devis"><span>Parler de mon réseau</span><ArrowRight size={17} /></a>
      </Reveal>
      </div>
    </section>
  );
}

function QuoteSection() {
  const [form, setForm] = useState({ name: "", email: "", company: "", need: "", consent: false, website: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const update = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi impossible.");
      setStatus("success");
      setMessage("Demande reçue. Aymeric pourra répondre avec une proposition précise.");
      setForm({ name: "", email: "", company: "", need: "", consent: false, website: "" });
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  };

  return (
    <section className="quote-section" id="devis">
      <Reveal className="quote-intro">
        <span className="kicker">09 · SUR MESURE</span>
        <h2>Un besoin précis ?<br />Décrivez le projet.</h2>
        <p>Commerce indépendant, équipe ou réseau : indiquez l’usage, les lieux et les volumes. Nous préparons une proposition claire et adaptée.</p>
      </Reveal>
      <Reveal>
        <form className="quote-form" onSubmit={submit}>
          <label className="form-honeypot" aria-hidden="true"><span>Site web</span><input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" /></label>
          <label><span>Ton nom *</span><input name="name" value={form.name} onChange={update} required autoComplete="name" /></label>
          <label><span>E-mail pro *</span><input name="email" value={form.email} onChange={update} required type="email" autoComplete="email" /></label>
          <label><span>Entreprise</span><input name="company" value={form.company} onChange={update} autoComplete="organization" /></label>
          <label className="form-wide"><span>Le besoin, les lieux, les volumes *</span><textarea name="need" value={form.need} onChange={update} required rows="4" /></label>
          <label className="form-check form-wide"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required /><span>J’accepte que Tapote utilise ces informations pour répondre à ma demande.</span></label>
          <Button type="submit" className="form-wide" disabled={status === "loading"}>{status === "loading" ? "Envoi…" : "Recevoir une proposition"}</Button>
          {message && <p className={`form-message form-${status}`} role="status" aria-live="polite">{message}</p>}
        </form>
      </Reveal>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq-section" id="faq">
      <Reveal className="section-heading"><span className="kicker">10 · QUESTIONS</span><h2>Avant de poser,<br />tout est clair.</h2></Reveal>
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <Reveal key={question} delay={index * 40}>
            <button className="faq-question" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index} aria-controls={`faq-answer-${index}`} id={`faq-question-${index}`}>
              <span>0{index + 1}</span><strong>{question}</strong><ChevronDown className={open === index ? "faq-chevron-open" : ""} />
            </button>
            <div id={`faq-answer-${index}`} className={`faq-answer ${open === index ? "faq-answer-open" : ""}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={open !== index}><p>{answer}</p></div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LegalDialog({ page, onClose }) {
  const dialogRef = useModalA11y(Boolean(page), onClose);
  if (!page) return null;
  const titles = { legal: "Mentions légales", cgv: "Conditions générales de vente", privacy: "Confidentialité" };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="legal-dialog" role="dialog" aria-modal="true" aria-labelledby="legal-title" aria-describedby="legal-content" tabIndex="-1">
        <button className="dialog-close" onClick={onClose} aria-label="Fermer"><X /></button>
        <span className={legalReady ? "legal-ready" : "legal-warning"}>{legalReady ? "INFORMATIONS DE L’ÉDITEUR" : "PRÉ-LANCEMENT · VENTE RÉELLE BLOQUÉE TANT QUE CES DONNÉES MANQUENT"}</span>
        <h2 id="legal-title">{titles[page]}</h2>
        <div id="legal-content" className="legal-content">
        {page === "legal" && <>
          <p>Éditeur : <strong>{legalDetails.company || "à renseigner"}</strong>. Statut juridique : <strong>{legalDetails.capital || "à renseigner"}</strong>. Adresse professionnelle : <strong>{legalDetails.address || "à renseigner"}</strong>. Immatriculation SIREN/RCS/RNE : <strong>{legalDetails.registration || "à renseigner"}</strong>. Régime de TVA : <strong>{legalDetails.vat || "à renseigner"}</strong>.</p>
          <p>Direction de la publication : <strong>{legalDetails.director || "à renseigner"}</strong>. Contact : <strong>{legalDetails.contact || "à renseigner"}</strong>. Hébergeur : <strong>{legalDetails.host || "à renseigner"}</strong>.</p>
        </>}
        {page === "cgv" && <>
          <p><strong>Champ d’application.</strong> Version <strong>{legalDetails.version || "à renseigner"}</strong>. La boutique Tapote est exclusivement réservée aux personnes agissant à des fins professionnelles. Toute commande passée en qualité de consommateur est interdite. Le client confirme son statut professionnel avant d’accéder au paiement.</p>
          <p><strong>Produits et commande.</strong> Les caractéristiques essentielles, quantités, personnalisations et prix sont récapitulés avant paiement. La commande devient ferme après paiement accepté par Stripe. Le BAT transmis après commande doit être validé avant production. Pilot n’est pas inclus dans l’achat des supports et ne fait l’objet d’aucun abonnement présélectionné.</p>
          <p><strong>Prix et paiement.</strong> Les prix affichés sont en euros et présentés TTC. Le régime de TVA applicable figure dans les mentions légales. Le paiement par carte est exigible à la commande. Pour toute somme exceptionnellement facturée à échéance, un retard entraîne de plein droit les pénalités prévues par l’article L.441-10 du Code de commerce ainsi que l’indemnité forfaitaire de 40 € pour frais de recouvrement.</p>
          <p><strong>Livraison.</strong> La livraison standard en France métropolitaine coûte {formatMoney(SHIPPING.standardPrice)} et devient offerte dès {formatMoney(SHIPPING.freeThreshold)}. Le délai indicatif est de 4 à 6 jours ouvrés après validation du BAT. Un retard raisonnable indépendant de Tapote ne permet pas d’annuler automatiquement la commande ; le client doit contacter Tapote afin de convenir d’une solution.</p>
          <p><strong>Personnalisation, annulation et conformité.</strong> Une demande d’annulation peut être adressée avant validation du BAT. Après validation du BAT ou lancement de la production, l’annulation n’est possible qu’avec l’accord écrit de Tapote. Le client doit vérifier le BAT, notamment les textes, liens et visuels. Toute non-conformité ou avarie apparente doit être signalée rapidement avec des justificatifs, sans priver le client de ses droits légaux applicables.</p>
          <p><strong>Réclamations et retours.</strong> Contact et adresse : <strong>{legalDetails.returnsAddress || "à renseigner"}</strong>. Les parties rechercheront d’abord une solution amiable. La médiation de la consommation et le droit de rétractation du Code de la consommation ne s’appliquent pas aux commandes conclues exclusivement entre professionnels.</p>
          <p><strong>Responsabilité et droit applicable.</strong> Tapote ne répond pas du contenu ou de la disponibilité des destinations externes choisies par le client. Sa responsabilité ne peut être engagée pour un usage non conforme des supports, sans exclure les responsabilités qui ne peuvent légalement être limitées. Les conditions sont régies par le droit français ; à défaut d’accord amiable, les juridictions compétentes sont déterminées selon les règles applicables.</p>
        </>}
        {page === "privacy" && <>
          <p><strong>Responsable et finalités.</strong> <strong>{legalDetails.company || "Tapote"}</strong> traite les coordonnées professionnelles, données de commande, personnalisations, fichiers transmis et données techniques nécessaires à l’exécution des commandes, au support, à la sécurité, à la facturation et au respect de ses obligations légales.</p>
          <p><strong>Bases et destinataires.</strong> Les traitements reposent selon le cas sur l’exécution du contrat, les obligations légales et l’intérêt légitime de sécuriser et gérer le service. Les données sont accessibles aux seules personnes habilitées et aux prestataires nécessaires : Stripe pour le paiement, Supabase pour les données et fichiers, Resend pour les notifications, et l’hébergeur du service.</p>
          <p><strong>Conservation.</strong> Les pièces de commande et de facturation sont conservées pendant les durées légales applicables, notamment jusqu’à dix ans pour les documents comptables. Les demandes commerciales sans commande sont conservées au maximum trois ans après le dernier contact. Les journaux de sécurité sont conservés pendant une durée proportionnée, au maximum douze mois sauf incident ou obligation légale. Les fichiers de personnalisation sont conservés le temps nécessaire à la production, au support et à la défense des droits de Tapote.</p>
          <p><strong>Droits et transferts.</strong> Pour exercer un droit d’accès, de rectification, d’effacement, de limitation ou d’opposition, ou poser une question : <strong>{legalDetails.privacyContact || "à renseigner"}</strong>. Une réclamation peut être adressée à la CNIL. Certains prestataires peuvent traiter des données hors de l’Espace économique européen selon les garanties prévues par la réglementation et leurs engagements contractuels.</p>
        </>}
        </div>
      </section>
    </div>
  );
}

function Footer({ setLegal }) {
  return (
    <footer className="footer">
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tapote · {legalReady ? legalDetails.company : "Pré-lancement — vente réelle verrouillée"}</span>
        <div><button onClick={() => setLegal("legal")}>Mentions légales</button><button onClick={() => setLegal("cgv")}>CGV</button><button onClick={() => setLegal("privacy")}>Confidentialité</button><a href="/connexion">Espace Tapote</a><a href="#devis">Contact pro</a></div>
      </div>
    </footer>
  );
}

function CartDrawer({ open, onClose, cart, setCart, onCheckout }) {
  const dialogRef = useModalA11y(open, onClose);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartSubtotal(cart);
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  const changeQuantity = (index, delta) => {
    setCart((current) => current
      .map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + delta) } : item)
      .filter((item) => item.quantity > 0));
  };

  return (
    <div className={`drawer-backdrop ${open ? "drawer-backdrop-open" : ""}`} aria-hidden={!open} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside ref={dialogRef} className={`cart-drawer ${open ? "cart-drawer-open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex="-1" inert={!open ? true : undefined}>
        <div className="drawer-header"><div><span id="cart-title">Ton panier</span><small>{itemCount} article{itemCount > 1 ? "s" : ""} · {cart.length} référence{cart.length > 1 ? "s" : ""}</small></div><button onClick={onClose} aria-label="Fermer le panier"><X /></button></div>
        <div className="drawer-content">
          {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={34} /><h3>Rien ici, pour l’instant.</h3><p>Choisis un objet et son action dans le configurateur.</p><a href="#configurateur" onClick={onClose}>Commencer <ArrowRight size={16} /></a></div> : cart.map((item, index) => {
            const product = PRODUCTS[item.productId];
            const action = ACTIONS[item.actionId];
            const previewProductId = packStories[item.productId]?.productId || item.productId;
            return (
              <div className="cart-item" key={`${item.productId}-${item.actionId}-${index}`}>
                <div className="cart-item-art"><DevicePreview productId={previewProductId} actionId={item.actionId} brandName={item.brandName} theme={item.theme} designStyle={item.designStyle} customHeadline={item.customHeadline} compact /></div>
                <div className="cart-item-copy"><strong>{product.name}</strong><span>{product.kind === "pack" ? product.format : `${action.name} · ${DESIGN_STYLES[item.designStyle]?.name || "Signature"}${item.brandLogoId ? " · logo transmis" : ""}`}</span><small>{product.kind === "pack" ? "Personnalisation et liens confirmés au BAT" : item.destinationUrl ? "Lien individuel configuré" : "Lien à confirmer au paiement"} · {item.quantity > 1 ? `${formatMoney(product.price * item.quantity)} TTC (${formatMoney(product.price)} / unité)` : `${formatMoney(product.price)} TTC`}</small></div>
                <div className="quantity"><button onClick={() => changeQuantity(index, -1)} aria-label={`Diminuer la quantité de ${product.name}`}><Minus size={13} /></button><b>{item.quantity}</b><button onClick={() => changeQuantity(index, 1)} disabled={item.quantity >= MAX_ITEM_QUANTITY} aria-label={`Augmenter la quantité de ${product.name}`}><Plus size={13} /></button></div>
              </div>
            );
          })}
        </div>
        {cart.length > 0 && <div className="drawer-footer"><div><span>Total TTC</span><strong>{formatMoney(total)}</strong></div><small>Sous-total {formatMoney(subtotal)} · livraison {shipping === 0 ? "offerte" : formatMoney(shipping)} en France métropolitaine.</small><Button onClick={onCheckout}>Passer la commande</Button></div>}
      </aside>
    </div>
  );
}

function CheckoutDialog({ open, onClose, cart, onOpenLegal }) {
  const dialogRef = useModalA11y(open, onClose);
  const [form, setForm] = useState({ businessName: "", email: "", destinationUrl: "", professionalCustomer: false, termsAccepted: false });
  const [attemptId] = useState(() => window.crypto.randomUUID());
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const update = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const subtotal = cartSubtotal(cart);
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  const submit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          items: cart,
          customer: { businessName: form.businessName, email: form.email, destinationUrl: form.destinationUrl },
          professionalCustomer: form.professionalCustomer,
          termsAccepted: form.termsAccepted,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Paiement indisponible.");
      window.location.assign(data.url);
    } catch (requestError) {
      setStatus("error");
      setError(requestError.message);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title" aria-describedby="checkout-description" tabIndex="-1">
        <button className="dialog-close" onClick={onClose} aria-label="Fermer"><X /></button>
        <span className="kicker">COMMANDE PROFESSIONNELLE SÉCURISÉE</span>
        <h2 id="checkout-title">On prépare<br />ton Tapote.</h2>
        <p id="checkout-description">Ces informations lancent la préparation. Les liens multiples et les détails de personnalisation seront confirmés au BAT avant production.</p>
        <form onSubmit={submit}>
          <label><span>Nom du commerce *</span><input name="businessName" value={form.businessName} onChange={update} required placeholder="Ex. Café des Amis" /></label>
          <label><span>E-mail de commande *</span><input type="email" name="email" value={form.email} onChange={update} required placeholder="aymeric@tapote.fr" /></label>
          <label><span>Lien principal à ouvrir</span><input type="url" name="destinationUrl" value={form.destinationUrl} onChange={update} placeholder="https://…" pattern="https://.*" title="Le lien doit commencer par https://" /></label>
          <div className="checkout-pilot-beta"><b>Pilot est en bêta privée.</b><span>Cette commande porte uniquement sur les objets : aucun abonnement n’est ajouté ni présélectionné.</span></div>
          <label className="checkout-terms"><input type="checkbox" name="professionalCustomer" checked={form.professionalCustomer} onChange={update} required /><span>Je confirme passer cette commande exclusivement pour les besoins de mon activité professionnelle et ne pas agir en qualité de consommateur.</span></label>
          <label className="checkout-terms"><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} required /><span>J’ai lu et j’accepte les <button type="button" onClick={() => onOpenLegal("cgv")}>CGV</button> et la <button type="button" onClick={() => onOpenLegal("privacy")}>politique de confidentialité</button>{legalDetails.version ? ` — version ${legalDetails.version}` : ""}.</span></label>
          <div className="checkout-costs"><span>Sous-total TTC <b>{formatMoney(subtotal)}</b></span><span>Livraison France <b>{shipping === 0 ? "Offerte" : formatMoney(shipping)}</b></span></div>
          <div className="checkout-total"><span>Total à payer</span><strong>{formatMoney(total)} TTC</strong></div>
          <Button type="submit" disabled={status === "loading" || !attemptId}>{status === "loading" ? "Connexion à Stripe…" : "Continuer vers le paiement sécurisé"}</Button>
          {import.meta.env.DEV && <small>Mode développement : sans clés Stripe, aucune somme n’est débitée.</small>}
          {error && <p className="form-message form-error" role="alert">{error}</p>}
        </form>
      </section>
    </div>
  );
}

function StatusBanner() {
  const params = new URLSearchParams(window.location.search);
  const requestedStatus = params.get("commande");
  const sessionId = params.get("session_id") || "";
  const knownStatus = ["confirmee", "demo", "annulee"].includes(requestedStatus);
  const [visible, setVisible] = useState(knownStatus);
  const [verifiedStatus, setVerifiedStatus] = useState(requestedStatus === "annulee" ? "cancel" : sessionId ? "checking" : "error");

  useEffect(() => {
    if (!knownStatus || requestedStatus === "annulee" || !sessionId) {
      return undefined;
    }
    let cancelled = false;
    let timer;
    let attempts = 0;
    const verify = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Vérification impossible.");
        if (cancelled) return;
        if (data.status === "processing" && attempts < 5) {
          setVerifiedStatus("processing");
          timer = window.setTimeout(verify, 1_500);
          return;
        }
        setVerifiedStatus(["paid", "demo", "expired", "payment_failed"].includes(data.status) ? data.status : "processing");
      } catch {
        if (!cancelled) setVerifiedStatus("error");
      }
    };
    void verify();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [knownStatus, requestedStatus, sessionId]);

  if (!visible || !knownStatus) return null;
  const successful = verifiedStatus === "paid" || verifiedStatus === "demo";
  const content = {
    checking: ["Vérification du paiement…", "Nous confirmons la session avec Stripe."],
    processing: ["Paiement en cours de confirmation.", "La page se mettra à jour automatiquement."],
    paid: ["Commande confirmée.", "Le paiement a bien été vérifié avec Stripe."],
    demo: ["Commande de démonstration créée.", "Aucune somme n’a été débitée."],
    cancel: ["Paiement annulé.", "Ton panier reste disponible."],
    expired: ["Session de paiement expirée.", "Relance la commande depuis ton panier."],
    payment_failed: ["Paiement non confirmé.", "Aucune commande ne partira en production."],
    error: ["Confirmation indisponible.", "Consulte ton e-mail Stripe ou contacte Tapote avant de réessayer."],
  }[verifiedStatus] || ["Paiement en cours.", "Vérification en cours."];
  const close = () => {
    setVisible(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("commande");
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };
  return (
    <div className={`status-banner status-${successful ? "success" : "cancel"}`} role="status" aria-live="polite">
      <div>{successful ? <Check /> : <X />}<span><strong>{content[0]}</strong> {content[1]}</span></div>
      <button onClick={close} aria-label="Fermer"><X size={18} /></button>
    </div>
  );
}

function StorefrontApp() {
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("comptoir");
  const [legal, setLegal] = useState(null);
  const [returnToCheckout, setReturnToCheckout] = useState(false);

  useEffect(() => { localStorage.setItem("tapote-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    document.body.classList.toggle("no-scroll", cartOpen || checkoutOpen || Boolean(legal) || mobileOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [cartOpen, checkoutOpen, legal, mobileOpen]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const addToCart = (item) => {
    setCart((current) => {
      const normalizedItem = { ...item, quantity: normalizeQuantity(item.quantity) };
      const existing = current.findIndex((entry) => entry.productId === normalizedItem.productId
        && entry.actionId === normalizedItem.actionId
        && entry.brandName === normalizedItem.brandName
        && entry.theme === normalizedItem.theme
        && entry.targetId === normalizedItem.targetId
        && entry.designStyle === normalizedItem.designStyle
        && entry.customHeadline === normalizedItem.customHeadline
        && entry.destinationUrl === normalizedItem.destinationUrl
        && entry.brandLogoId === normalizedItem.brandLogoId);
      if (existing < 0) return [...current, normalizedItem];
      return current.map((entry, index) => index === existing ? { ...entry, quantity: Math.min(MAX_ITEM_QUANTITY, entry.quantity + normalizedItem.quantity) } : entry);
    });
    setCartOpen(true);
  };
  const selectProduct = (id) => {
    setSelectedProduct(id);
    document.getElementById("configurateur")?.scrollIntoView({ behavior: "smooth" });
  };
  const openFooterLegal = (page) => {
    setReturnToCheckout(false);
    setLegal(page);
  };
  const openCheckoutLegal = (page) => {
    setCheckoutOpen(false);
    setReturnToCheckout(true);
    setLegal(page);
  };
  const closeLegal = () => {
    setLegal(null);
    if (returnToCheckout) {
      setReturnToCheckout(false);
      setCheckoutOpen(true);
    }
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      <StatusBanner />
      <Header cartCount={cartCount} onCart={() => setCartOpen(true)} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main id="main-content">
        <Hero />
        <SignalBand />
        <TapDemo />
        <OfferFinder onAdd={addToCart} />
        <Packs onAdd={addToCart} />
        <ProductSection onSelect={selectProduct} />
        <ProductShowcaseSection />
        <Configurator key={selectedProduct} initialProduct={selectedProduct} onAdd={addToCart} />
        <HowItWorks />
        <PilotSection />
        <QuoteSection />
        <FAQ />
      </main>
      <Footer setLegal={openFooterLegal} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} cart={cart} onOpenLegal={openCheckoutLegal} />
      <LegalDialog page={legal} onClose={closeLegal} />
    </>
  );
}

export default function App() {
  return <StorefrontApp />;
}
