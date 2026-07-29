import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Clapperboard,
  ClipboardList,
  ContactRound,
  CreditCard,
  FileCheck2,
  Globe2,
  Gift,
  Grid3X3,
  Heart,
  Home,
  Inbox,
  Info,
  Layers3,
  Link2,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Music2,
  Minus,
  PackageCheck,
  Palette,
  Pipette,
  Plus,
  PhoneCall,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  SmartphoneNfc,
  Sparkles,
  Star,
  Trash2,
  Truck,
  UtensilsCrossed,
  Upload,
  UserRound,
  UsersRound,
  Video,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import {
  ACTIONS,
  calculateShipping,
  formatMoney,
  matchingIdentityKey,
  PILOT_PLANS,
  PRODUCTS,
  SHIPPING,
} from "../shared/catalog.js";
import { GeneratedBrandMark, PlatformGlyph } from "./storefront/BrandMark.jsx";
import InsertArtwork from "./storefront/InsertArtwork.jsx";
import { insertSurface } from "./storefront/insertGeometry.js";
import { prepareLogoFile, readFileAsDataUrl } from "./storefront/logoFile.js";
import { extractLogoPalette, pickScreenColor } from "./brandColors.js";
import { DEFAULT_THEME, DEVICE_THEMES, THEME_LABELS, normalizeHexColor, contrastRatio, resolveDeviceColors, resolveThemeId } from "./deviceThemes.js";
import { captureStorefrontAttribution, trackStorefrontEvent } from "./storefront/analytics.js";
import { findSectorBySlug, SECTOR_CATEGORIES, SECTORS } from "./storefront/sectorData.js";

const MAX_ITEM_QUANTITY = 50;
const CART_KEY = "tapote-cart-v3";
// v2 deliberately invalidates drafts created before custom identities were
// separated from the demonstration brands used in ready-made scenes.
const CONFIG_DRAFT_PREFIX = "tapote-config-draft-v2:";
const LOGO_PREVIEW_PREFIX = "tapote-logo-preview-v1:";
const ACTION_ORDER = ["avis", "formulaire", "menu", "reservation", "commande", "paiement", "pourboire", "fidelite", "instagram", "tiktok", "facebook", "linkedin", "wifi", "site", "contact", "whatsapp", "multiliens", "autre"];
const STOREFRONT_PROMISES = {
  fulfillment: "Délai confirmé à la prise en charge",
  quality: "NFC encodé + QR contrôlé avant envoi",
  support: "Remplacement si un défaut NFC est confirmé",
};
const READY_ACTION_IDS = [...ACTION_ORDER];
const PHONE_SCREENS = {
  avis: { overline: "AVIS", title: "Comment s’est passée votre visite ?", detail: "★★★★★", helper: "Partagez votre expérience en quelques mots.", cta: "Publier mon avis" },
  formulaire: { overline: "FORMULAIRE", title: "Comment pouvons-nous vous aider ?", detail: "Devis · Inscription · Demande", helper: "Quelques informations suffisent", cta: "Commencer" },
  menu: { overline: "LA CARTE", title: "Aujourd’hui au menu", detail: "Entrées · Plats · Desserts", helper: "Allergènes et options disponibles", cta: "Voir le menu" },
  reservation: { overline: "RÉSERVATION", title: "Choisissez votre créneau", detail: "09:00   11:00   15:30", helper: "Confirmation immédiate", cta: "Réserver" },
  commande: { overline: "COMMANDE", title: "Votre sélection", detail: "3 produits disponibles", helper: "Retrait ou livraison", cta: "Commander" },
  paiement: { overline: "PAIEMENT", title: "Montant à régler", detail: "24,00 €", helper: "Paiement sécurisé", cta: "Payer" },
  pourboire: { overline: "POURBOIRE", title: "Merci pour l’équipe", detail: "5 %   10 %   15 %", helper: "Choisissez librement", cta: "Valider" },
  fidelite: { overline: "FIDÉLITÉ", title: "Votre prochain avantage", detail: "● ● ● ● ○", helper: "Encore un passage", cta: "Ajouter ma visite" },
  instagram: { overline: "INSTAGRAM", title: "Découvrez nos coulisses", detail: "Photos · Reels · Stories", helper: "@votre.marque", cta: "Voir le profil" },
  tiktok: { overline: "TIKTOK", title: "La suite se passe ici", detail: "Vidéos · Créations", helper: "@votre.marque", cta: "Voir le profil" },
  facebook: { overline: "FACEBOOK", title: "Retrouvez nos actualités", detail: "Événements · Photos", helper: "Votre page locale", cta: "Ouvrir la page" },
  linkedin: { overline: "LINKEDIN", title: "Gardons le contact", detail: "Entreprise · Équipe", helper: "Votre page professionnelle", cta: "Voir la page" },
  wifi: { overline: "WI-FI INVITÉ", title: "Vous êtes connecté.", detail: "Réseau : INVITES", helper: "Accès sécurisé", cta: "Se connecter" },
  site: { overline: "SITE INTERNET", title: "Bienvenue chez nous", detail: "Services · Équipe · Contact", helper: "Tout commence ici", cta: "Découvrir" },
  contact: { overline: "CONTACT", title: "Gardons le contact", detail: "Téléphone · E-mail", helper: "Coordonnées prêtes à enregistrer", cta: "Ajouter aux contacts" },
  whatsapp: { overline: "WHATSAPP", title: "Écrivez-nous ici", detail: "Bonjour, je vous contacte…", helper: "Message prérempli", cta: "Envoyer le message" },
  multiliens: { overline: "VOS LIENS", title: "Tout est juste ici", detail: "Menu · Horaires · Réserver", helper: "Choisissez votre destination", cta: "Ouvrir" },
  autre: { overline: "LIEN PERSONNALISÉ", title: "Votre destination", detail: "Une page faite pour ce moment", helper: "Ouverture sécurisée", cta: "Continuer" },
};
const campaignHeadlineForAction = (actionId) => ACTIONS[actionId]?.campaignHeadline || ACTIONS[actionId]?.headline || "";
const readyHeadlineForAction = (actionId) => (
  actionId === "avis" ? "Votre avis compte, tapotez." : campaignHeadlineForAction(actionId)
);
const readyDesignParam = (theme) => resolveThemeId(theme) === "creme" ? "blanc" : "noir";
const themeFromReadyDesignParam = (value) => value === "blanc" ? "creme" : DEFAULT_THEME;
// Chaque design est présenté dans la même scène réelle que la boutique et les
// secteurs : décor du métier, support imprimé et téléphone qui ouvre le lien.
const PRODUCT_PAGES = {
  chevalet: {
    key: "comptoir",
    name: "Le Chevalet A6",
    kicker: "VISIBLE AU BON MOMENT",
    title: "Le support qui fait passer à l’action.",
    description: "À la caisse, à l’accueil ou sur une table : votre marque reste visible et le bon lien s’ouvre en un geste.",
    image: "/assets/products/tapote-template-chevalet-v1.webp",
    imageAlt: "Chevalet A6 Tapote vertical avec une main utilisant le téléphone et l’écran d’avis visible",
    gallery: ["/assets/products/tapote-template-chevalet-v1.webp", "/assets/products/tapote-menu-restaurant-v1.webp", "/assets/products/tapote-avis-barbier-v1.webp"],
    placements: "Caisse · accueil · table",
    size: "Insert A6 · support transparent",
    technical: ["Format A6 vertical", "Support transparent réutilisable", "Insert imprimé remplaçable", "NFC + QR reliés au même lien"],
    uses: ["Avis et fidélité à la caisse", "Menu ou réservation sur table", "Accueil, Wi-Fi et informations pratiques"],
    inBox: "1 chevalet, 1 insert imprimé, 1 puce NFC configurée et son QR code associé.",
  },
  plaque: {
    key: "plaque",
    name: "La Plaque 12 × 12",
    kicker: "COMPACTE ET TOUJOURS LÀ",
    title: "Un point de contact, sans prendre de place.",
    description: "Une plaque PMMA compacte, présentée debout sur le comptoir là où votre client a naturellement le téléphone en main.",
    image: "/assets/products/tapote-plaque-avis-studio-v2.webp",
    imageAlt: "Plaque NFC Tapote en PMMA sur un comptoir avec un téléphone affichant la page d’avis",
    gallery: ["/assets/products/tapote-plaque-avis-studio-v2.webp", "/assets/products/tapote-plaque-reservation-salon-v2.webp", "/assets/tapote-hero-nfc-counter.webp"],
    placements: "Comptoir · bureau · table",
    size: "≈ 12 × 12 cm · PMMA rigide",
    technical: ["Format carré proche de 12 × 12 cm", "Plaque PMMA imprimée de qualité professionnelle", "Présentoir vertical, lisible sans la poser à plat", "NFC + QR reliés au même lien"],
    uses: ["Avis près du terminal de paiement", "Réservation sur un bureau d’accueil", "Informations pratiques sur une table ou un comptoir"],
    inBox: "1 plaque imprimée, 1 puce NFC configurée et son QR code associé.",
  },
  carte: {
    key: "carte",
    name: "La Carte NFC",
    kicker: "TAPOTE DANS LA POCHE",
    title: "Le bon lien vous suit partout.",
    description: "Pour les rendez-vous, livraisons, visites et équipes terrain. Elle se tend, se tapote et se range en une seconde.",
    image: "/assets/products/tapote-template-carte-v1.webp",
    imageAlt: "Carte NFC Tapote tenue en main avec un téléphone affichant les coordonnées",
    gallery: ["/assets/products/tapote-template-carte-v1.webp", "/assets/products/tapote-carte-avis-artisan-v1.webp", "/assets/products/tapote-carte-contact-studio-v1.webp"],
    placements: "Terrain · rendez-vous · livraison",
    size: "85 × 54 mm · format carte",
    technical: ["Format carte 85 × 54 mm", "Visuel imprimé recto", "Format poche facile à transmettre", "NFC + QR reliés au même lien"],
    uses: ["Coordonnées en rendez-vous", "Avis après une prestation", "Catalogue, paiement ou réservation sur le terrain"],
    inBox: "1 carte PVC imprimée, avec NFC configuré et QR code associé.",
  },
};

const LEGAL_DETAILS = {
  company: import.meta.env.VITE_LEGAL_COMPANY || "Aymeric Frelaut (Tapote)",
  capital: import.meta.env.VITE_LEGAL_CAPITAL || "Entrepreneur individuel (EI) — capital social non applicable",
  address: import.meta.env.VITE_LEGAL_ADDRESS || "24 rue Labouret, 92700 Colombes, France",
  registration: import.meta.env.VITE_LEGAL_REGISTRATION || "SIREN 105 019 103 — SIRET 105 019 103 00016 — immatriculé au RNE le 15 mai 2026",
  vat: import.meta.env.VITE_LEGAL_VAT || "TVA non applicable, article 293 B du CGI",
  director: import.meta.env.VITE_LEGAL_DIRECTOR || "Aymeric Frelaut",
  contact: import.meta.env.VITE_LEGAL_CONTACT || "aymeric@tapote.fr — +33 6 63 15 04 49",
  privacyContact: import.meta.env.VITE_LEGAL_PRIVACY_CONTACT || import.meta.env.VITE_LEGAL_CONTACT || "aymeric@tapote.fr",
  returnsAddress: import.meta.env.VITE_LEGAL_RETURNS_ADDRESS || "24 rue Labouret, 92700 Colombes, France",
  dataRetention: import.meta.env.VITE_LEGAL_DATA_RETENTION || "Les demandes commerciales sans commande sont conservées au maximum trois ans après le dernier contact ; les journaux de sécurité, au maximum douze mois hors incident ou obligation légale ; les fichiers de personnalisation, pendant l’exécution de la commande puis trois ans pour le support et la défense des droits.",
  version: import.meta.env.VITE_LEGAL_VERSION || "22 juillet 2026",
  host: import.meta.env.VITE_LEGAL_HOST || "HOSTINGER INTERNATIONAL LIMITED, 61 Lordou Vironos str., 6023 Larnaca, Chypre — compliance@hostinger.com",
};

const isVatExempt = /non applicable|franchise en base/i.test(LEGAL_DETAILS.vat);
const taxLabel = isVatExempt ? "net de TVA" : "TTC";

function pageMetadata(path) {
  if (path === "/") return ["Supports NFC + QR prêts ou personnalisés | Tapote", "Chevalets, plaques et cartes NFC + QR. Design prêt à l’emploi ou personnalisé, destination initiale configurée et pilotage à distance avec Tapote Pilot."];
  if (path === "/boutique" || path.startsWith("/categorie/")) return ["Boutique NFC + QR | Tapote", "Tous les chevalets, plaques, cartes et packs Tapote, prêts à l’emploi ou personnalisés."];
  if (path.startsWith("/produits/")) {
    const product = PRODUCT_PAGES[path.split("/")[2]];
    if (product) return [`${product.name}${/nfc/i.test(product.name) ? "" : " NFC"} + QR | Tapote`, `${product.description} Prêt à l’emploi ou personnalisé, avec destination initiale configurée et Tapote Pilot en option.`];
  }
  if (path === "/designs") return ["Designs NFC + QR | Tapote", "Découvrez les designs Tapote pour les avis, Instagram, Facebook, le Wi-Fi, les menus, les réservations et tous vos liens."];
  if (path === "/secteurs") return [`Tapote pour votre secteur | ${SECTORS.length} usages concrets`, "Découvrez les supports NFC + QR et les usages Tapote adaptés à votre métier."];
  if (path.startsWith("/secteurs/")) {
    const sector = findSectorBySlug(path.split("/")[2]);
    if (sector) return [`Tapote pour ${sector.title}`, `${sector.promise} ${sector.description}`];
  }
  if (path === "/personnaliser") return ["Créer mon Tapote personnalisé", "Personnalisez votre plaque, chevalet ou carte NFC en direct : logo, textes, couleurs et action."];
  if (path === "/comment-ca-marche") return ["Comment fonctionne Tapote ?", "NFC, QR code, encodage et changement de destination à distance expliqués simplement."];
  if (path === "/tapote-pilot") return ["Tapote Pilot | Changez vos liens et suivez vos supports", "Tapote Pilot permet de changer la destination de vos supports à distance, organiser vos lieux et suivre les interactions NFC + QR."];
  if (path === "/panier") return ["Votre panier | Tapote", "Vérifiez vos supports Tapote, leur composition, la livraison et les options."];
  if (path === "/devis") return ["Devis volume et multi-sites | Tapote", "Décrivez votre besoin de 10 supports ou plus et recevez une proposition Tapote claire et adaptée."];
  if (path.startsWith("/commande")) return ["Finaliser la commande | Tapote", "Finalisez votre commande professionnelle Tapote via Stripe."];
  if (path === "/mentions-legales") return ["Mentions légales | Tapote", "Informations relatives à l’éditeur, à la publication et à l’hébergement du site Tapote."];
  if (path === "/cgv") return ["Conditions générales de vente B2B | Tapote", "Conditions applicables aux commandes professionnelles de supports NFC + QR Tapote."];
  if (path === "/confidentialite") return ["Politique de confidentialité | Tapote", "Informations sur les données traitées par Tapote et les droits des professionnels."];
  return ["Page introuvable | Tapote", "La page demandée n’existe pas ou a été déplacée."];
}

// Tous les chemins qui rendent la page unique — l'accueil et tout ce qui y a
// été fusionné.
function isHomeSurface(path) {
  if (["/", "/boutique", "/designs", "/secteurs", "/personnaliser"].includes(path)) return true;
  if (path.startsWith("/categorie/")) return true;
  if (path.startsWith("/produits/")) return Boolean(PRODUCT_PAGES[path.split("/")[2]]);
  if (path.startsWith("/secteurs/")) return Boolean(findSectorBySlug(path.split("/")[2]));
  return false;
}

function isKnownStorefrontPath(path) {
  if (["/", "/boutique", "/designs", "/secteurs", "/personnaliser", "/comment-ca-marche", "/tapote-pilot", "/panier", "/devis", "/commande", "/commande/confirmee", "/mentions-legales", "/cgv", "/confidentialite"].includes(path)) return true;
  if (["/categorie/chevalets-nfc", "/categorie/plaques-nfc", "/categorie/cartes-nfc", "/categorie/packs-nfc", "/categorie/packs"].includes(path)) return true;
  if (path.startsWith("/produits/")) return Boolean(PRODUCT_PAGES[path.split("/")[2]]);
  if (path.startsWith("/secteurs/")) return Boolean(findSectorBySlug(path.split("/")[2]));
  return false;
}

function getProductId(surface, personalization, count = 1) {
  const suffix = personalization === "ready" ? "_standard" : "";
  if (count === 2) return `pack_duo${suffix}`;
  if (count === 5) return `pack_cinq${suffix}`;
  return `${surface}${suffix}`;
}

function previewId(productId) {
  const product = PRODUCTS[productId];
  if (product?.kind === "pack") return "comptoir";
  return product?.baseProductId || productId;
}

function normalizedQuantity(value) {
  return Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.floor(Number(value) || 1)));
}

function loadCart() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    // Les paniers enregistrés avant la refonte portent un thème disparu et un
    // style graphique qui n'existe plus : on les normalise ici plutôt que de
    // laisser le serveur les refuser.
    return parsed
      .filter((item) => PRODUCTS[item.productId] && ACTIONS[item.actionId])
      // eslint-disable-next-line no-unused-vars -- la déstructuration sert à écarter le champ obsolète
      .map(({ designStyle, ...item }) => ({ ...item, theme: resolveThemeId(item.theme) }));
  } catch {
    return [];
  }
}

function itemFingerprint(item) {
  return JSON.stringify(Object.fromEntries(Object.entries(item).filter(([key]) => key !== "quantity")));
}

function makeCartItem(productId, actionId, options = {}) {
  const product = PRODUCTS[productId];
  return {
    productId,
    actionId,
    quantity: 1,
    brandName: options.brandName || "",
    theme: options.theme || DEFAULT_THEME,
    primaryColor: normalizeHexColor(options.primaryColor, ""),
    secondaryColor: normalizeHexColor(options.secondaryColor, ""),
    textColor: normalizeHexColor(options.textColor, ""),
    targetId: options.targetId || "cafe",
    customHeadline: options.customHeadline || "",
    customSubline: options.customSubline || "",
    customTapLabel: options.customTapLabel || "",
    destinationUrl: options.destinationUrl || "",
    brandLogoId: options.brandLogoId || "",
    logoFileName: options.logoFileName || "",
    ...(product.kind === "pack" ? { supportComposition: options.supportComposition || product.defaultComposition } : {}),
  };
}

function physicalSupportCount(cart) {
  return cart.reduce((sum, item) => (
    sum + (PRODUCTS[item.productId]?.supportCount || 1) * normalizedQuantity(item.quantity)
  ), 0);
}

function compositionLabel(composition) {
  if (!composition) return "";
  const parts = [];
  if (composition.comptoir) parts.push(`${composition.comptoir} chevalet${composition.comptoir > 1 ? "s" : ""}`);
  if (composition.plaque) parts.push(`${composition.plaque} plaque${composition.plaque > 1 ? "s" : ""}`);
  return parts.join(" + ");
}

function compositionSurface(count, composition, fallback = "comptoir") {
  if (count <= 1 || !composition) return fallback;
  if (composition.comptoir > 0 && composition.plaque > 0) return "mix";
  return composition.plaque > 0 ? "plaque" : "comptoir";
}

function compositionParam(composition) {
  if (!composition) return "";
  if (composition.comptoir > 0 && composition.plaque > 0) return "mix";
  return composition.plaque > 0 ? "plaques" : "chevalets";
}

function getCachedLogoPreview(uploadId) {
  if (!uploadId) return "";
  try { return window.sessionStorage.getItem(`${LOGO_PREVIEW_PREFIX}${uploadId}`) || ""; } catch { return ""; }
}

function cacheLogoPreview(uploadId, dataUrl) {
  if (!uploadId || !dataUrl) return;
  try { window.sessionStorage.setItem(`${LOGO_PREVIEW_PREFIX}${uploadId}`, dataUrl); } catch { /* The order remains valid even if the browser cannot cache the local preview. */ }
}

function loadConfigDraft(draftKey) {
  if (!draftKey) return null;
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(`${CONFIG_DRAFT_PREFIX}${draftKey}`) || "null");
    return draft && typeof draft === "object" ? draft : null;
  } catch { return null; }
}

function setMetaContent(attribute, value, content) {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonicalUrl(url) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", url);
}

function Brand() {
  return <a className="v3-brand" href="/" aria-label="Tapote, accueil"><img src="/brand/tapote-logo.svg" alt="tapote." /></a>;
}

function UtilityBar() {
  return (
    <div className="v3-utility">
      <span><SmartphoneNfc size={14} /> NFC + QR inclus</span>
      <span><Truck size={14} /> Livraison offerte dès {formatMoney(SHIPPING.freeThreshold)}</span>
      <span><Link2 size={14} /> Pilotage à distance avec Tapote Pilot</span>
    </div>
  );
}

const MOBILE_MENU_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Header({ cartCount, compact = false }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  const navigationRef = useRef(null);
  const toggleRef = useRef(null);
  const returnFocusRef = useRef(null);
  const menuId = useId();
  useEffect(() => {
    document.body.classList.toggle("v3-menu-open", open);
    return () => document.body.classList.remove("v3-menu-open");
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;

    returnFocusRef.current = document.activeElement;
    const header = headerRef.current;
    const navigation = navigationRef.current;
    const toggle = toggleRef.current;
    if (!header || !navigation || !toggle) return undefined;
    const pageElements = [...document.querySelectorAll(".v3-site > :not(.v3-header)"), ...header.querySelectorAll(".v3-brand, .v3-login, .v3-cart-button")];
    const previousInertState = pageElements.map((element) => ({
      element,
      inert: element.hasAttribute("inert"),
    }));
    pageElements.forEach((element) => element.setAttribute("inert", ""));

    const focusableElements = () => [...navigation.querySelectorAll(MOBILE_MENU_FOCUSABLE_SELECTOR), toggle]
      .filter((element) => element && !element.hasAttribute("disabled"));
    const firstLink = navigation.querySelector("a[href]");
    firstLink?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!focusable.includes(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousInertState.forEach(({ element, inert }) => {
        if (!inert) element.removeAttribute("inert");
      });
      const returnTarget = returnFocusRef.current;
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [open]);
  if (compact) return (
    <header className="v3-header v3-checkout-header">
      <Brand />
      <div><span><ShieldCheck /> Paiement sécurisé</span><a href="/panier">Retour au panier</a></div>
    </header>
  );
  return (
      <header className="v3-header" ref={headerRef}>
        <Brand />
        <nav id={menuId} ref={navigationRef} className={open ? "is-open" : ""} aria-label="Navigation principale">
          <a href="/#main-content" onClick={() => setOpen(false)}>Créer mon Tapote</a>
          <a href="/comment-ca-marche" onClick={() => setOpen(false)}>Fonctionnement</a>
          <a href="/tapote-pilot" onClick={() => setOpen(false)}>Tapote Pilot</a>
          <a href="/devis" onClick={() => setOpen(false)}>Devis dès 10 supports</a>
          <a className="v3-mobile-login" href="/connexion" onClick={() => setOpen(false)}>Accéder à Tapote Pilot</a>
        </nav>
        <div className="v3-header-actions">
          <a className="v3-login" href="/connexion"><UserRound size={16} /> Tapote Pilot</a>
          <a className="v3-header-primary" href="/#main-content"><span>Créer mon Tapote</span><i aria-hidden="true"><ArrowRight /></i></a>
          <a className="v3-cart-button" href="/panier" aria-label={`Voir le panier, ${cartCount} article(s)`}>
            <ShoppingBag size={18} /><span>Panier</span>{cartCount > 0 && <b>{cartCount}</b>}
          </a>
          <button ref={toggleRef} className="v3-mobile-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-controls={menuId} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
  );
}

function Footer() {
  return (
    <footer className="v3-footer">
      <div className="v3-footer-main">
        <div><Brand /><p>Transformez chaque visite<br />en la bonne action.</p><small>NFC + QR · prêt ou personnalisé · pilotable avec Tapote Pilot.</small></div>
        <div><strong>Créer</strong>{SECTORS.slice(0, 5).map((sector) => <a href={`/?activite=${sector.slug}`} key={sector.id}>{sector.title}</a>)}</div>
        <div><strong>Découvrir</strong><a href="/comment-ca-marche">Comment ça marche</a><a href="/tapote-pilot">Tapote Pilot</a><a href="/devis">Devis dès 10 supports</a><a href="/cgv">Livraison et garanties</a></div>
        <div><strong>Aide</strong><a href="mailto:aymeric@tapote.fr">Nous contacter</a><a href="/cgv">Livraison et garanties</a><a href="/confidentialite">Données et confidentialité</a><a href="/connexion">Accéder à Pilot</a></div>
      </div>
      <div className="v3-footer-bottom"><span>© 2026 Tapote</span><a href="/mentions-legales">Mentions légales</a><a href="/cgv">CGV</a><a href="/confidentialite">Confidentialité</a></div>
    </footer>
  );
}

function CartNotice({ notice, onClose }) {
  if (!notice) return null;
  return <aside className="v3-cart-notice" role="status" aria-live="polite"><div><CheckCircle2 /><span><strong>Ajouté au panier</strong><small>{notice}</small></span><button type="button" onClick={onClose} aria-label="Fermer"><X /></button></div><span><button type="button" onClick={onClose}>Continuer mes achats</button><a href="/panier">Voir le panier <ArrowRight /></a></span></aside>;
}

function focusMainContent() {
  const main = document.getElementById("main-content");
  if (!main) return;
  main.tabIndex = -1;
  main.focus({ preventScroll: true });
  main.scrollIntoView?.({ block: "start" });
}

function Shell({ cartCount, cartNotice, onCloseNotice, compactCheckout = false, children }) {
  return <div className="v3-site"><a className="v3-skip" href="#main-content" onClick={focusMainContent}>Aller au contenu</a>{!compactCheckout && <UtilityBar />}<Header cartCount={cartCount} compact={compactCheckout} />{children}<CartNotice notice={cartNotice} onClose={onCloseNotice} />{!compactCheckout && <Footer />}</div>;
}

// L'objet physique : l'insert imprimé posé dans son support réel (chevalet
// transparent, plaque PMMA ou carte PVC).
function ProductArt({ surface = "comptoir", actionId = "avis", brandName = "VOTRE MARQUE", brandLogo = "", theme = "blue", primaryColor = "", secondaryColor = "", textColor = "", customHeadline = "", customSubline = "", customTapLabel = "", personalization = "ready", className = "" }) {
  const shape = insertSurface(surface);
  const colors = resolveDeviceColors(theme, primaryColor, secondaryColor, textColor);
  return (
    <div className={`v3-product-art v3-product-${shape} ${className}`.trim()} data-personalization={personalization} aria-hidden="true">
      <div className="v3-product-frame">
        <InsertArtwork
          surface={shape}
          actionId={actionId}
          brandName={brandName}
          brandLogo={brandLogo}
          colors={colors}
          headline={customHeadline}
          subline={customSubline}
          tapLabel={customTapLabel}
          personalization={personalization}
        />
      </div>
      {shape === "chevalet" && <span className="v3-product-stand" aria-hidden="true" />}
    </div>
  );
}

const PHONE_CONTENT_PATH = "M630 313 C609 318 599 341 612 372 L863 930 C877 963 901 978 932 971 L1187 913 C1214 907 1224 880 1209 848 L902 294 C891 274 869 266 844 270 Z";
// Restaurant glass measured just inside the black bezel. The whole surface is
// live so the iOS status area can share the exact background of each app.
const PHONE_DYNAMIC_CONTENT_PATH = "M624 307 C605 311 598 330 607 354 L870 922 C884 944 910 961 920 958 L1140 880 C1165 878 1182 858 1178 818 L902 288 C891 268 869 260 844 263 Z";
// Dark full-screen apps expose sub-pixel gaps that are invisible on the
// photographed white iOS surface. Extend only the left glass edge by a few
// source pixels so TikTok's black canvas meets the physical bezel cleanly.
const PHONE_DARK_CONTENT_PATH = "M612 304 C593 307 586 328 595 354 L858 928 C875 953 906 969 920 965 L1140 880 C1165 878 1182 858 1178 818 L902 288 C891 268 869 260 844 263 Z";

const RESTAURANT_PHONE_MEDIA = {
  burrata: "/assets/phone/restaurant-burrata-v1.webp",
  duck: "/assets/phone/restaurant-canard-v1.webp",
  fish: "/assets/phone/restaurant-dorade-v1.webp",
  dessert: "/assets/phone/restaurant-creme-brulee-v1.webp",
  tiktok: "/assets/phone/restaurant-chef-tiktok-v1.webp",
};

const PHONE_SCENE_SECTORS = {
  "/assets/products/tapote-bg-cafe-v1.webp": "cafe",
  "/assets/products/tapote-bg-cafe-restaurant-phone-v2.webp": "cafe",
  "/assets/products/tapote-bg-cafe-empty-v3.png": "cafe",
  "/assets/products/tapote-bg-restaurant-live-screen-v1.webp": "restaurant",
  "/assets/products/tapote-bg-restaurant-v1.webp": "restaurant",
  "/assets/products/tapote-bg-boulangerie-v1.webp": "boulangerie",
  "/assets/products/tapote-bg-boulangerie-empty-v2.png": "boulangerie",
  "/assets/products/tapote-bg-beaute-v1.webp": "salon",
  "/assets/products/tapote-bg-medical-v1.webp": "cabinet_medical",
  "/assets/products/tapote-bg-retail-v1.webp": "boutique",
  "/assets/products/tapote-bg-hotel-v1.webp": "hotel",
  "/assets/products/tapote-bg-auto-ecole-v1.webp": "auto_ecole",
  "/assets/products/tapote-bg-automobile-v1.webp": "garage",
  "/assets/products/tapote-bg-artisan-v1.webp": "artisan",
  "/assets/products/tapote-bg-agence-v1.webp": "immobilier",
  "/assets/products/tapote-bg-agence-empty-v2.png": "immobilier",
  "/assets/products/tapote-bg-sport-v1.webp": "salle_sport",
  "/assets/products/tapote-bg-sport-empty-v2.png": "salle_sport",
  "/assets/products/tapote-bg-formation-v1.webp": "coworking",
  "/assets/products/tapote-bg-formation-empty-v2.png": "coworking",
  "/assets/products/tapote-bg-evenement-v1.webp": "evenement",
  "/assets/products/tapote-bg-evenement-empty-v2.png": "evenement",
  "/assets/products/tapote-bg-animaux-v1.webp": "veterinaire",
};

const DEFAULT_PHONE_SECTOR_PROFILE = {
  bookingTitle: "Choisissez votre créneau",
  bookingSubject: "1 rendez-vous",
  bookingService: "Prochaines disponibilités",
  reward: "Avantage de bienvenue",
  menuTitle: "Notre sélection",
  menuItems: [["Prestation essentielle", "Sur rendez-vous", "35 €"], ["Formule complète", "Conseil personnalisé", "59 €"], ["Option premium", "Selon vos besoins", "79 €"]],
  orderItems: [["Formule essentielle", "Disponible aujourd’hui", "35 €"], ["Option complémentaire", "Ajout à la demande", "12 €"]],
  paymentLabel: "Règlement sécurisé",
  paymentAmount: "35,00 €",
  formType: "Demande d’information",
  formPlaceholder: "Votre besoin, vos disponibilités, précisions…",
  siteKicker: "NOTRE SAVOIR-FAIRE",
  siteTitle: "Un service précis. Une réponse claire.",
  siteBody: "Découvrez nos services, nos disponibilités et les informations utiles.",
  links: [["Nos services", "Prestations et informations"], ["Prendre rendez-vous", "Disponibilités en ligne"], ["Venir sur place", "Adresse et horaires"], ["Nous contacter", "Téléphone et e-mail"]],
  phone: "01 84 80 20 20",
  email: "bonjour@votremarque.fr",
  address: "Voir l’itinéraire",
  wifi: "INVITÉS",
  socialCaption: "Un aperçu de notre quotidien et de notre savoir-faire.",
};

const PHONE_SECTOR_PROFILES = {
  cafe: { bookingSubject: "2 personnes", bookingService: "Ce soir", reward: "Boisson chaude offerte", menuTitle: "La carte du moment", menuItems: [["Espresso de spécialité", "Brésil · notes chocolatées", "2,50 €"], ["Cappuccino", "Double shot · lait fermier", "4,50 €"], ["Cookie noisette", "Cuit ce matin", "3,80 €"]], orderItems: [["Cappuccino", "Lait entier", "4,50 €"], ["Cookie noisette", "Quantité · 1", "3,80 €"]], paymentLabel: "Commande au comptoir", paymentAmount: "8,30 €", formType: "Privatisation", formPlaceholder: "Date, nombre de personnes, ambiance souhaitée…", siteKicker: "CAFÉ DE SPÉCIALITÉ", siteTitle: "Torréfié avec soin. Servi simplement.", siteBody: "La carte, nos horaires et les cafés du moment.", links: [["Voir la carte", "Cafés, boissons et douceurs"], ["Réserver une table", "Disponibilités ce soir"], ["Nos horaires", "Ouvert aujourd’hui"], ["Nous appeler", "Une question rapide"]], phone: "01 42 60 11 25", email: "bonjour@cafenoma.fr", address: "18 rue du Bac, Paris", wifi: "CAFE_NOMA_GUEST", socialCaption: "Du grain à la tasse, les coulisses du comptoir." },
  restaurant: { bookingSubject: "2 personnes", bookingService: "Service du soir", reward: "Dessert maison offert", menuTitle: "Aujourd’hui au menu", menuItems: [["Velouté de potimarron", "Châtaigne · huile de noisette", "9 €"], ["Burrata crémeuse", "Tomates anciennes · basilic", "12 €"], ["Magret de canard", "Pommes grenaille · jus corsé", "24 €"]], orderItems: [["Burrata du marché", "Tomates anciennes", "12 €"], ["Magret de canard", "Pommes grenaille", "24 €"], ["Crème brûlée", "Vanille de Madagascar", "8 €"]], paymentLabel: "Règlement de la table", paymentAmount: "44,00 €", formType: "Privatisation", formPlaceholder: "Date, nombre de personnes, précisions…", siteKicker: "CUISINE DE SAISON", siteTitle: "Le goût du produit, simplement.", siteBody: "Produits frais, gestes précis et accueil chaleureux.", links: [["Voir la carte", "Menu du jour et allergènes"], ["Réserver une table", "Disponibilités en temps réel"], ["Venir au restaurant", "Itinéraire et horaires"], ["Nous contacter", "Appel et e-mail"]], phone: "01 42 18 21 21", email: "bonjour@latelier21.fr", address: "21 rue du Marché, Paris", wifi: "ATELIER21_INVITES", socialCaption: "En cuisine : le produit du jour, sauce montée minute ✨" },
  boulangerie: { bookingSubject: "1 commande", bookingService: "Retrait en boutique", reward: "Baguette tradition offerte", menuTitle: "Sorties du four", menuItems: [["Tradition au levain", "Farine Label Rouge", "1,30 €"], ["Croissant pur beurre", "Feuilletage maison", "1,40 €"], ["Tarte citron", "Format individuel", "4,90 €"]], orderItems: [["Pain de campagne", "Tranché · 500 g", "4,20 €"], ["6 croissants", "Retrait demain matin", "8,40 €"]], paymentLabel: "Commande à retirer", paymentAmount: "12,60 €", formType: "Commande spéciale", formPlaceholder: "Produit, quantité, date et heure de retrait…", siteKicker: "FABRIQUÉ ICI", siteTitle: "Du levain, du beurre, du temps.", siteBody: "Nos pains, pâtisseries et commandes pour vos événements.", links: [["Commander", "Pains et pâtisseries"], ["Voir les créations", "La sélection du moment"], ["Horaires", "Cuissons et ouvertures"], ["Nous appeler", "Commande spéciale"]], phone: "01 43 21 08 14", email: "commande@maisonlevain.fr", address: "8 place du Marché, Lyon", wifi: "MAISON_LEVAIN", socialCaption: "Ce matin au fournil : feuilletage pur beurre et levain naturel." },
  salon: { bookingTitle: "Réservez votre prestation", bookingSubject: "Coupe & coiffage", bookingService: "Cette semaine", reward: "Soin profond offert", menuTitle: "Nos prestations", menuItems: [["Coupe & coiffage", "Diagnostic inclus", "48 €"], ["Couleur signature", "Soin protecteur inclus", "85 €"], ["Rituel bien-être", "Massage du cuir chevelu", "35 €"]], orderItems: [["Shampoing éclat", "250 ml", "24 €"], ["Masque réparateur", "200 ml", "29 €"]], paymentLabel: "Prestation du jour", paymentAmount: "48,00 €", formType: "Diagnostic personnalisé", formPlaceholder: "Votre longueur, votre envie, vos disponibilités…", siteKicker: "BEAUTÉ & SOIN", siteTitle: "Votre style, jusque dans le détail.", siteBody: "Prestations, inspirations et réservation avec votre équipe.", links: [["Réserver", "Choisir une prestation"], ["Nos tarifs", "Coupes, couleurs et soins"], ["Voir Instagram", "Inspirations et réalisations"], ["Nous contacter", "Conseil avant rendez-vous"]], phone: "01 45 20 22 40", email: "bonjour@studiolune.fr", address: "32 rue de Charonne, Paris", wifi: "STUDIO_LUNE", socialCaption: "Avant / après : une coupe pensée pour le mouvement." },
  cabinet_medical: { bookingTitle: "Prendre rendez-vous", bookingSubject: "Consultation", bookingService: "Créneaux disponibles", reward: "Rappel prévention activé", menuTitle: "Informations pratiques", menuItems: [["Consultation", "Sur rendez-vous", "Secteur 1"], ["Téléconsultation", "Selon le motif", "25 €"], ["Documents utiles", "Ordonnance et carte Vitale", "—"]], orderItems: [["Téléconsultation", "Créneau confirmé", "25 €"]], paymentLabel: "Téléconsultation", paymentAmount: "25,00 €", formType: "Demande administrative", formPlaceholder: "Objet de la demande, disponibilité, informations utiles…", siteKicker: "INFORMATIONS PATIENTS", siteTitle: "Votre parcours, clairement expliqué.", siteBody: "Horaires, accès, spécialités et préparation du rendez-vous.", links: [["Prendre rendez-vous", "Créneaux disponibles"], ["Préparer ma visite", "Documents nécessaires"], ["Accès au cabinet", "Adresse et transports"], ["Contacter le secrétariat", "Demandes administratives"]], phone: "01 40 18 72 10", email: "secretariat@cabinetrivoli.fr", address: "14 rue de Rivoli, Paris", wifi: "CABINET_INVITES", socialCaption: "Informations de prévention et actualités du cabinet." },
  boutique: { bookingSubject: "Conseil privé", bookingService: "Cette semaine", reward: "-15 % sur votre prochain achat", menuTitle: "La sélection", menuItems: [["Veste en laine", "Coupe droite · marine", "149 €"], ["Chemise popeline", "Coton biologique", "79 €"], ["Sac atelier", "Cuir pleine fleur", "189 €"]], orderItems: [["Chemise popeline", "Taille M · blanc", "79 €"], ["Ceinture atelier", "Cuir cognac", "59 €"]], paymentLabel: "Commande boutique", paymentAmount: "138,00 €", formType: "Conseil taille", formPlaceholder: "Article, taille habituelle et préférence…", siteKicker: "NOUVELLE COLLECTION", siteTitle: "Des pièces choisies pour durer.", siteBody: "La collection, les nouveautés et le retrait en boutique.", links: [["Voir la collection", "Nouveautés et essentiels"], ["Réserver en boutique", "Essayage personnalisé"], ["Notre adresse", "Horaires et accès"], ["Nous écrire", "Disponibilité d’un article"]], phone: "01 84 25 16 90", email: "bonjour@maisoneclat.fr", address: "6 rue Vieille-du-Temple, Paris", wifi: "MAISON_ECLAT_GUEST", socialCaption: "Nouvelle silhouette : matières naturelles et coupe précise." },
  hotel: { bookingTitle: "Réserver un service", bookingSubject: "2 voyageurs", bookingService: "Pendant votre séjour", reward: "Départ tardif offert", menuTitle: "Services de l’hôtel", menuItems: [["Petit-déjeuner", "Servi de 7 h à 10 h 30", "18 €"], ["Room service", "Jusqu’à 22 h 30", "À la carte"], ["Départ tardif", "Selon disponibilité", "25 €"]], orderItems: [["Petit-déjeuner", "2 personnes · demain", "36 €"], ["Départ tardif", "Jusqu’à 14 h", "25 €"]], paymentLabel: "Services du séjour", paymentAmount: "61,00 €", formType: "Demande à la réception", formPlaceholder: "Numéro de chambre, service et horaire souhaité…", siteKicker: "VOTRE SÉJOUR", siteTitle: "Tout l’hôtel dans votre poche.", siteBody: "Wi-Fi, services, bonnes adresses et informations pratiques.", links: [["Guide d’accueil", "Services et informations"], ["Commander un service", "Petit-déjeuner et chambre"], ["Bonnes adresses", "La sélection de la réception"], ["Contacter l’accueil", "Disponible 24 h / 24"]], phone: "01 58 90 14 14", email: "reception@hotelrivage.fr", address: "4 quai de la Loire, Nantes", wifi: "RIVAGE_GUEST", socialCaption: "Une adresse calme, pensée pour prendre le temps." },
  auto_ecole: { bookingTitle: "Réserver une leçon", bookingSubject: "Leçon de conduite", bookingService: "Mon planning", reward: "1 h de simulateur offerte", menuTitle: "Nos formations", menuItems: [["Permis B", "Boîte manuelle", "Dès 1 190 €"], ["Conduite accompagnée", "Dès 15 ans", "Dès 1 290 €"], ["Heure de conduite", "Leçon individuelle", "52 €"]], orderItems: [["Heure de conduite", "Moniteur confirmé", "52 €"], ["Livret numérique", "Inclus", "0 €"]], paymentLabel: "Leçon de conduite", paymentAmount: "52,00 €", formType: "Inscription permis", formPlaceholder: "Permis visé, disponibilités et expérience…", siteKicker: "PRENEZ LE VOLANT", siteTitle: "Une formation claire, à votre rythme.", siteBody: "Formules, planning des leçons et inscription en ligne.", links: [["Voir les formations", "Permis et formules"], ["Réserver une leçon", "Planning en ligne"], ["Dossier d’inscription", "Pièces à fournir"], ["Contacter l’agence", "Une question sur le permis"]], phone: "01 46 70 31 20", email: "contact@driveclub.fr", address: "27 avenue Jean-Jaurès, Lille", wifi: "DRIVE_CLUB", socialCaption: "Conseils de conduite, réussites et vie de l’agence." },
  garage: { bookingTitle: "Planifier l’entretien", bookingSubject: "Révision véhicule", bookingService: "Atelier", reward: "Contrôle sécurité offert", menuTitle: "Nos prestations", menuItems: [["Révision constructeur", "Garantie préservée", "Dès 189 €"], ["Diagnostic électronique", "Compte-rendu inclus", "79 €"], ["Pneumatiques", "Montage et équilibrage", "Sur devis"]], orderItems: [["Diagnostic électronique", "Durée estimée · 1 h", "79 €"], ["Contrôle sécurité", "Inclus", "0 €"]], paymentLabel: "Facture atelier", paymentAmount: "189,00 €", formType: "Demande de devis", formPlaceholder: "Immatriculation, kilométrage et intervention…", siteKicker: "L’ATELIER AUTO", siteTitle: "Votre véhicule, suivi sans surprise.", siteBody: "Entretien, diagnostic, devis et prochain rendez-vous.", links: [["Prendre rendez-vous", "Entretien et diagnostic"], ["Demander un devis", "Réponse de l’atelier"], ["Suivre mon véhicule", "État de l’intervention"], ["Appeler la réception", "Une urgence mécanique"]], phone: "01 70 26 45 80", email: "atelier@atelierauto.fr", address: "12 route de Lyon, Dijon", wifi: "ATELIER_AUTO", socialCaption: "Diagnostic, entretien et conseils de l’équipe atelier." },
  artisan: { bookingTitle: "Planifier un rendez-vous", bookingSubject: "Visite technique", bookingService: "Sur place", reward: "Diagnostic offert", menuTitle: "Nos prestations", menuItems: [["Dépannage", "Intervention rapide", "Sur devis"], ["Installation", "Étude personnalisée", "Sur devis"], ["Entretien annuel", "Contrôle complet", "129 €"]], orderItems: [["Diagnostic sur place", "Déplacement inclus", "69 €"], ["Compte-rendu", "Envoyé par e-mail", "Inclus"]], paymentLabel: "Acompte intervention", paymentAmount: "69,00 €", formType: "Demande de devis", formPlaceholder: "Adresse, travaux souhaités, photos et délai…", siteKicker: "SAVOIR-FAIRE ARTISAN", siteTitle: "Un travail propre, expliqué et durable.", siteBody: "Réalisations, zones d’intervention et demande de devis.", links: [["Voir les réalisations", "Chantiers et finitions"], ["Demander un devis", "Décrivez votre projet"], ["Zone d’intervention", "Secteurs desservis"], ["Appeler l’artisan", "Disponible sur le terrain"]], phone: "06 12 34 56 78", email: "contact@ateliermartin.fr", address: "Interventions en Île-de-France", wifi: "ATELIER_MARTIN", socialCaption: "Les étapes d’un chantier soigné, du diagnostic à la finition." },
  immobilier: { bookingTitle: "Planifier une visite", bookingSubject: "Visite immobilière", bookingService: "Avec votre conseiller", reward: "Avis de valeur offert", menuTitle: "Nos services", menuItems: [["Estimation", "Avis de valeur détaillé", "Offert"], ["Mise en vente", "Photos et diffusion", "Sur mandat"], ["Recherche acquéreur", "Accompagnement complet", "Sur mesure"]], orderItems: [["Dossier d’estimation", "Analyse du marché", "Offert"]], paymentLabel: "Acompte prestation", paymentAmount: "90,00 €", formType: "Demande d’estimation", formPlaceholder: "Adresse, surface, type de bien et projet…", siteKicker: "VOTRE PROJET IMMOBILIER", siteTitle: "Estimer, vendre, trouver le bon lieu.", siteBody: "Biens disponibles, estimation et contact direct avec votre conseiller.", links: [["Voir les biens", "Sélection disponible"], ["Estimer mon bien", "Avis de valeur offert"], ["Prendre rendez-vous", "Visite ou échange conseil"], ["Enregistrer le contact", "Votre conseiller dédié"]], phone: "06 24 18 72 30", email: "bonjour@agencehorizon.fr", address: "9 place Bellecour, Lyon", wifi: "HORIZON_CLIENTS", socialCaption: "Nouveau bien : lumière, volumes et emplacement recherché." },
  salle_sport: { bookingTitle: "Réserver une séance", bookingSubject: "Cours collectif", bookingService: "Planning du studio", reward: "1 séance offerte", menuTitle: "Le planning", menuItems: [["HIIT Express", "45 min · tous niveaux", "18 €"], ["Pilates Flow", "50 min · petit groupe", "20 €"], ["Coaching individuel", "Bilan inclus", "65 €"]], orderItems: [["Carnet 10 séances", "Valable 4 mois", "160 €"], ["Bilan forme", "30 min", "Offert"]], paymentLabel: "Carnet de séances", paymentAmount: "160,00 €", formType: "Séance d’essai", formPlaceholder: "Objectif, niveau et créneaux préférés…", siteKicker: "BOUGEZ À VOTRE RYTHME", siteTitle: "Un studio, une équipe, votre progression.", siteBody: "Planning, réservation et formules d’entraînement.", links: [["Voir le planning", "Cours et disponibilités"], ["Réserver une séance", "Confirmation immédiate"], ["Nos formules", "À la séance ou abonnement"], ["Rejoindre la communauté", "Actualités du studio"]], phone: "01 82 83 46 20", email: "hello@motionclub.fr", address: "5 rue Oberkampf, Paris", wifi: "MOTION_CLUB", socialCaption: "Séance du jour : énergie, précision et progression collective." },
  coworking: { bookingTitle: "Réserver une salle", bookingSubject: "Salle de réunion", bookingService: "Aujourd’hui", reward: "1 h de salle offerte", menuTitle: "Espaces & services", menuItems: [["Poste nomade", "Journée complète", "29 €"], ["Salle Horizon", "Jusqu’à 8 personnes", "45 €/h"], ["Studio visio", "Équipement inclus", "30 €/h"]], orderItems: [["Salle Horizon", "2 heures", "90 €"], ["Café d’accueil", "8 personnes", "24 €"]], paymentLabel: "Réservation d’espace", paymentAmount: "114,00 €", formType: "Inscription formation", formPlaceholder: "Programme, participants et besoins techniques…", siteKicker: "TRAVAILLER AUTREMENT", siteTitle: "Des espaces prêts quand vous l’êtes.", siteBody: "Salles, bureaux, événements et ressources des membres.", links: [["Réserver une salle", "Disponibilités en direct"], ["Programme des formations", "Sessions à venir"], ["Ressources membres", "Documents et accès"], ["Contacter l’accueil", "Aide sur place"]], phone: "01 76 40 22 18", email: "accueil@bureaulibre.fr", address: "22 rue du Sentier, Paris", wifi: "BUREAU_LIBRE_GUEST", socialCaption: "Atelier, rencontre et nouveaux projets dans les espaces partagés." },
  evenement: { bookingTitle: "Réserver une place", bookingSubject: "1 participant", bookingService: "Prochaine session", reward: "Accès prioritaire offert", menuTitle: "Le programme", menuItems: [["Ouverture des portes", "Accueil du public", "18:30"], ["Temps fort", "Scène principale", "20:00"], ["Rencontre artistes", "Après la représentation", "22:00"]], orderItems: [["Billet plein tarif", "Placement libre", "24 €"], ["Soutien à l’association", "Don libre", "10 €"]], paymentLabel: "Billetterie", paymentAmount: "34,00 €", formType: "Inscription bénévole", formPlaceholder: "Disponibilités, mission souhaitée et expérience…", siteKicker: "AU PROGRAMME", siteTitle: "Une soirée à vivre ensemble.", siteBody: "Programme, billetterie, accès et informations pratiques.", links: [["Voir le programme", "Horaires et scènes"], ["Prendre un billet", "Billetterie sécurisée"], ["Informations pratiques", "Accès et horaires"], ["Soutenir le projet", "Adhésion et dons"]], phone: "01 88 32 14 60", email: "bonjour@lebonmoment.fr", address: "Parvis des Arts, Bordeaux", wifi: "BON_MOMENT_PUBLIC", socialCaption: "Montage en cours : les coulisses avant l’ouverture des portes." },
  veterinaire: { bookingTitle: "Prendre rendez-vous", bookingSubject: "Consultation vétérinaire", bookingService: "Créneaux disponibles", reward: "Bilan prévention offert", menuTitle: "Soins & conseils", menuItems: [["Consultation", "Chien, chat et NAC", "42 €"], ["Vaccination", "Bilan inclus", "Dès 58 €"], ["Toilettage soin", "Sur rendez-vous", "Dès 45 €"]], orderItems: [["Alimentation conseil", "Sac 3 kg", "29 €"], ["Antiparasitaire", "Selon le poids", "18 €"]], paymentLabel: "Consultation du jour", paymentAmount: "42,00 €", formType: "Demande de rendez-vous", formPlaceholder: "Animal, motif, âge et disponibilités…", siteKicker: "PRENDRE SOIN D’EUX", siteTitle: "Une équipe attentive, à chaque étape.", siteBody: "Rendez-vous, urgences, conseils et informations pratiques.", links: [["Prendre rendez-vous", "Consultations et soins"], ["Conseils pratiques", "Prévention et bien-être"], ["Accès à la clinique", "Adresse et urgences"], ["Appeler l’équipe", "Une question sur votre animal"]], phone: "01 49 72 18 30", email: "contact@cliniquedeslilas.fr", address: "3 avenue des Lilas, Lille", wifi: "CLINIQUE_INVITES", socialCaption: "Conseils de prévention et nouvelles de nos patients à quatre pattes." },
};

// Dedicated in-phone media. Lifestyle hero photographs deliberately never
// appear here: reusing them would put a second phone inside the first one.
const PHONE_SECTOR_MEDIA = {
  cafe: "/assets/phone/sector-cafe-media-v1.webp",
  boulangerie: "/assets/phone/sector-boulangerie-media-v1.webp",
  salon: "/assets/phone/sector-salon-media-v1.webp",
  cabinet_medical: "/assets/phone/sector-medical-media-v1.webp",
  boutique: "/assets/phone/sector-boutique-media-v1.webp",
  hotel: "/assets/phone/sector-hotel-media-v1.webp",
  auto_ecole: "/assets/phone/sector-auto-ecole-media-v1.webp",
  garage: "/assets/phone/sector-garage-media-v1.webp",
  artisan: "/assets/phone/sector-artisan-media-v1.webp",
  immobilier: "/assets/phone/sector-immobilier-media-v1.webp",
  salle_sport: "/assets/phone/sector-sport-media-v1.webp",
  coworking: "/assets/phone/sector-coworking-media-v1.webp",
  evenement: "/assets/phone/sector-evenement-media-v1.webp",
  veterinaire: "/assets/phone/sector-veterinaire-media-v1.webp",
};

const PHONE_SECTOR_EXPERIENCE = {
  cafe: { times: ["08:30", "10:00", "11:30"], tabs: ["Boissons", "Douceurs", "Infos"], location: "Paris", incoming: "Bonjour 👋 Vous souhaitez réserver une table ou connaître le café du jour ?", outgoing: "Bonjour, avez-vous encore une table pour deux vers 18 h ?" },
  restaurant: { times: ["19:00", "19:30", "20:00"], tabs: ["Entrées", "Plats", "Desserts"], location: "Paris", incoming: "Bonsoir 👋 Souhaitez-vous réserver ou nous signaler une allergie ?", outgoing: "Bonsoir, une table pour deux à 20 h serait-elle disponible ?" },
  boulangerie: { times: ["08:00", "09:30", "11:00"], tabs: ["Pains", "Viennoiseries", "Pâtisseries"], location: "Lyon", incoming: "Bonjour 👋 Que souhaitez-vous faire préparer ?", outgoing: "Bonjour, je voudrais réserver six croissants pour demain matin." },
  salon: { times: ["09:30", "13:00", "16:30"], tabs: ["Coiffure", "Couleur", "Soins"], location: "Paris", incoming: "Bonjour 👋 Quelle prestation souhaitez-vous réserver ?", outgoing: "Bonjour, avez-vous un créneau coupe et coiffage cette semaine ?" },
  cabinet_medical: { times: ["09:00", "11:20", "15:40"], tabs: ["Consultations", "Pratique", "Accès"], location: "Paris", incoming: "Bonjour, le secrétariat vous répond pour les demandes administratives.", outgoing: "Bonjour, je souhaite déplacer mon rendez-vous de jeudi." },
  boutique: { times: ["11:00", "14:30", "17:00"], tabs: ["Nouveautés", "Collection", "Guide"], location: "Paris", incoming: "Bonjour 👋 Souhaitez-vous vérifier une taille ou réserver un essayage ?", outgoing: "Bonjour, la chemise popeline est-elle disponible en taille M ?" },
  hotel: { times: ["07:30", "09:00", "10:30"], tabs: ["Séjour", "Services", "Infos"], location: "Nantes", incoming: "Bonjour 👋 La réception est disponible. Indiquez-nous votre numéro de chambre.", outgoing: "Bonjour, chambre 204 : deux petits-déjeuners pour demain, s’il vous plaît." },
  auto_ecole: { times: ["10:00", "14:00", "17:30"], tabs: ["Permis B", "Conduite", "Dossier"], location: "Lille", incoming: "Bonjour 👋 Avez-vous déjà un numéro NEPH ?", outgoing: "Bonjour, je souhaite réserver une leçon de conduite samedi." },
  garage: { times: ["08:30", "11:00", "14:30"], tabs: ["Entretien", "Diagnostic", "Devis"], location: "Dijon", incoming: "Bonjour 👋 Pouvez-vous nous préciser le modèle et l’immatriculation ?", outgoing: "Bonjour, je souhaite un devis pour la révision de mon véhicule." },
  artisan: { times: ["08:00", "13:30", "16:00"], tabs: ["Services", "Réalisations", "Zone"], location: "Île-de-France", incoming: "Bonjour 👋 Envoyez votre adresse et quelques photos du projet.", outgoing: "Bonjour, je souhaiterais un devis pour une intervention à domicile." },
  immobilier: { times: ["10:00", "14:00", "17:00"], tabs: ["Biens", "Estimation", "Conseil"], location: "Lyon", incoming: "Bonjour 👋 Souhaitez-vous visiter un bien ou demander une estimation ?", outgoing: "Bonjour, je voudrais visiter l’appartement présenté cette semaine." },
  salle_sport: { times: ["07:30", "12:15", "18:30"], tabs: ["Cours", "Coaching", "Tarifs"], location: "Bordeaux", incoming: "Bonjour 👋 Quel cours souhaitez-vous essayer ?", outgoing: "Bonjour, reste-t-il une place au Pilates de 18 h 30 ?" },
  coworking: { times: ["09:00", "13:00", "15:30"], tabs: ["Espaces", "Salles", "Pass"], location: "Toulouse", incoming: "Bonjour 👋 Pour combien de personnes souhaitez-vous réserver ?", outgoing: "Bonjour, je cherche une salle pour six personnes jeudi après-midi." },
  evenement: { times: ["18:30", "19:30", "20:30"], tabs: ["Billets", "Programme", "Accès"], location: "Marseille", incoming: "Bonjour 👋 Une question sur le programme ou l’accessibilité ?", outgoing: "Bonjour, reste-t-il des places pour la séance de samedi ?" },
  veterinaire: { times: ["09:20", "11:40", "16:10"], tabs: ["Soins", "Prévention", "Urgences"], location: "Lille", incoming: "Bonjour 👋 Quel animal souhaitez-vous faire examiner ?", outgoing: "Bonjour, mon chat doit recevoir son rappel de vaccin." },
};

function phoneSectorExperience(sectorId) {
  return PHONE_SECTOR_EXPERIENCE[sectorId] || { times: ["09:00", "13:30", "17:00"], tabs: ["Sélection", "Services", "Infos"], location: "France", incoming: "Bonjour 👋 Comment pouvons-nous vous aider ?", outgoing: "Bonjour, je souhaiterais obtenir un renseignement." };
}

function phoneSectorMedia(sectorId) {
  if (sectorId === "restaurant") return [RESTAURANT_PHONE_MEDIA.burrata, RESTAURANT_PHONE_MEDIA.tiktok, RESTAURANT_PHONE_MEDIA.duck, RESTAURANT_PHONE_MEDIA.fish, RESTAURANT_PHONE_MEDIA.dessert, RESTAURANT_PHONE_MEDIA.burrata];
  const asset = PHONE_SECTOR_MEDIA[sectorId] || PHONE_SECTOR_MEDIA.cafe;
  return [asset, asset, asset, asset, asset, asset];
}

function resolvePhoneSectorId(sectorId, sceneImage) {
  return sectorId || PHONE_SCENE_SECTORS[sceneImage] || "";
}

function phoneSectorProfile(sectorId, sceneImage) {
  return { ...DEFAULT_PHONE_SECTOR_PROFILE, ...(PHONE_SECTOR_PROFILES[resolvePhoneSectorId(sectorId, sceneImage)] || {}) };
}

function parseEuroAmount(value) {
  const normalized = String(value || "").replace(/\s/g, "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  return normalized ? Number(normalized[0]) : 0;
}

function compactEuro(value) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;
}

function PhoneActionPreview({ actionId, screen, sceneImage = "", brandName = "VOTRE MARQUE", sectorId = "" }) {
  const safeBrandName = brandName || "VOTRE MARQUE";
  const resolvedSectorId = resolvePhoneSectorId(sectorId, sceneImage);
  const profile = phoneSectorProfile(resolvedSectorId, sceneImage);
  const experience = phoneSectorExperience(resolvedSectorId);
  const media = phoneSectorMedia(resolvedSectorId);
  const isRestaurant = resolvedSectorId === "restaurant";
  if (actionId === "avis") return <div className="v3-phone-google-card">
    <header><PlatformGlyph id="google" /><span><b>Publier un avis</b><small>{safeBrandName} · Google Maps</small></span></header>
    <div className="v3-phone-google-user"><i>R</i><span><b>Votre compte Google</b><small>Publication publique</small></span></div>
    <strong>Comment s’est passée votre visite ?</strong>
    <div className="v3-phone-google-stars" aria-label="5 étoiles"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></div>
    <span className="v3-phone-review-copy">Partagez des détails sur votre expérience</span>
    <span className="v3-phone-google-photo-action"><Camera /> Ajouter des photos</span>
  </div>;
  if (actionId === "menu") {
    return <div className="v3-phone-menu-card"><nav><b>{experience.tabs[0]}</b><span>{experience.tabs[1]}</span><span>{experience.tabs[2]}</span></nav>{profile.menuItems.map(([name, detail, price]) => <div key={name}><span><b>{name}</b><small>{detail}</small></span><strong>{price}</strong></div>)}</div>;
  }
  if (actionId === "reservation") return <div className="v3-phone-booking-card">
    <header><span><UserRound />{profile.bookingSubject}</span><small>Modifier</small></header>
    <div className="v3-phone-booking-days"><span>Lun<small>21</small></span><span className="is-selected">Mar<small>22</small></span><span>Mer<small>23</small></span><span>Jeu<small>24</small></span></div>
    <strong>{profile.bookingService}</strong>
    <nav>{experience.times.map((time, index) => <span className={index === 1 ? "is-selected" : ""} key={time}>{time}</span>)}</nav>
    <footer><CheckCircle2 /> Confirmation immédiate</footer>
  </div>;
  if (actionId === "commande") {
    const items = isRestaurant ? [
      { name: "Burrata du marché", detail: "Tomates anciennes", price: "12 €", image: RESTAURANT_PHONE_MEDIA.burrata },
      { name: "Magret de canard", detail: "Pommes grenaille", price: "24 €", image: RESTAURANT_PHONE_MEDIA.duck },
      { name: "Crème brûlée", detail: "Vanille de Madagascar", price: "8 €", image: RESTAURANT_PHONE_MEDIA.dessert },
    ] : profile.orderItems.map(([name, detail, price], index) => ({ name, detail, price, image: media[index % media.length] }));
    const calculatedTotal = items.reduce((sum, item) => sum + parseEuroAmount(item.price), 0);
    return <div className="v3-phone-order-card">{items.map((item, index) => <div key={item.name}><img src={item.image} alt="" style={socialCropStyle(item.image, index + 1)} /><span><b>{item.name}</b><small>{item.detail}</small><em>× 1</em></span><strong>{item.price}</strong></div>)}<footer><span><small>{items.length} article{items.length > 1 ? "s" : ""}</small>Total</span><b>{calculatedTotal ? compactEuro(calculatedTotal) : profile.paymentAmount}</b></footer></div>;
  }
  if (actionId === "pourboire") {
    const bill = parseEuroAmount(profile.paymentAmount);
    return <div className="v3-phone-payment-card is-pourboire">
    <header><span>{profile.paymentLabel}</span><b>{profile.paymentAmount}</b></header>
    <small>POUR L’ÉQUIPE</small><strong>Merci !</strong>
    <nav><span>0 %<small>Aucun</small></span>{[5, 10, 15].map((rate) => <span className={rate === 10 ? "is-selected" : ""} key={rate}>{rate} %<small>{compactEuro((bill * rate) / 100)}</small></span>)}</nav>
    <span>Le pourboire est intégralement reversé à l’équipe.</span>
  </div>;
  }
  if (actionId === "fidelite") return <div className="v3-phone-loyalty-card">
    <header><span>Carte de fidélité</span><b>4 / 5 visites</b></header>
    <div>{[1, 2, 3, 4, 5].map((step) => <span className={step < 5 ? "is-complete" : ""} key={step}>{step < 5 ? "✓" : step}</span>)}</div>
    <section><Gift /><span><small>PROCHAINE RÉCOMPENSE</small><strong>{profile.reward}</strong></span></section>
    <small>Encore une visite chez {safeBrandName}.</small>
  </div>;
  if (actionId === "wifi") return <div className="v3-phone-wifi-card"><i>⌁</i><span><small>RÉSEAU</small><b>INVITÉS</b></span><strong>Connecté</strong></div>;
  if (actionId === "site") return <div className="v3-phone-website-card"><div><span>NOTRE SAVOIR-FAIRE</span><strong>Des gestes précis.<br />Un résultat durable.</strong></div><nav><span>Services</span><span>Réalisations</span><span>Contact</span></nav></div>;
  if (actionId === "contact") return <div className="v3-phone-contact-card">
    <div><span><PhoneCall /></span><p><small>APPELER</small><b>{profile.phone}</b></p></div>
    <div><span><ContactRound /></span><p><small>E-MAIL</small><b>{profile.email}</b></p></div>
    <div><span><MapPin /></span><p><small>ITINÉRAIRE</small><b>{profile.address}</b></p></div>
  </div>;
  if (actionId === "whatsapp") return <div className="v3-phone-whatsapp-card"><div><PlatformGlyph id="whatsapp" /><b>WhatsApp</b><span>en ligne</span></div><p>Bonjour ! Comment pouvons-nous vous aider ?</p><small>Écrivez votre message…</small></div>;
  if (actionId === "multiliens") {
    const LinkIcons = [Globe2, CalendarDays, MapPin, PhoneCall];
    return <div className="v3-phone-links-card">{profile.links.map(([title, detail], index) => { const LinkIcon = LinkIcons[index]; return <div key={title}><span><LinkIcon /></span><p><b>{title}</b><small>{detail}</small></p><strong>›</strong></div>; })}</div>;
  }
  if (actionId === "formulaire") return <div className="v3-phone-form-card">
    <label><small>NOM COMPLET</small><span>Votre nom</span></label>
    <label><small>VOTRE DEMANDE</small><span>{profile.formType} <b>⌄</b></span></label>
    <label><small>MESSAGE</small><span className="is-large">{profile.formPlaceholder}</span></label>
    <p><Check /> Réponse habituelle sous 24 h</p>
  </div>;
  return <strong className={`v3-phone-detail is-${actionId}`}>{screen.detail}</strong>;
}

function instagramPostImages(sceneImage, sectorId = "") {
  return phoneSectorMedia(resolvePhoneSectorId(sectorId, sceneImage));
}

const SOCIAL_CROP_POSITIONS = ["18% 22%", "52% 18%", "82% 28%", "20% 72%", "54% 66%", "82% 76%"];
const socialCropStyle = (image, index) => ({
  "--v3-phone-post-image": `url(${image})`,
  "--v3-phone-post-position": SOCIAL_CROP_POSITIONS[index % SOCIAL_CROP_POSITIONS.length],
  "--v3-phone-post-size": index % 3 === 1 ? "220%" : "185%",
});

function InstagramPhoneApp({ brandAvatar, brandName, handle, sceneImage, profile, sectorId }) {
  const posts = instagramPostImages(sceneImage, sectorId);
  return <div className="v3-instagram-app">
    <header><strong>{handle.replace(/^@/, "")}⌄</strong><span><Plus /><Menu /></span></header>
    <section className="v3-instagram-profile">
      {brandAvatar}
      <dl><div><dt>128</dt><dd>publications</dd></div><div><dt>4,8 k</dt><dd>followers</dd></div><div><dt>246</dt><dd>suivi(e)s</dd></div></dl>
      <div className="v3-instagram-bio"><b>{brandName}</b><span>{profile.siteKicker.toLowerCase()}</span><small>Ouvert aujourd’hui</small></div>
      <nav><b>Suivre</b><span>Contacter</span></nav>
      <div className="v3-instagram-highlights" aria-hidden="true">{posts.slice(0, 3).map((post, index) => <i key={`${post}-${index}`} style={{ "--v3-highlight-image": `url(${post})`, backgroundPosition: SOCIAL_CROP_POSITIONS[index] }} />)}</div>
    </section>
    <div className="v3-instagram-tabs"><Grid3X3 /><Clapperboard /></div>
    <div className="v3-live-social-grid" aria-label="Aperçu des publications">{posts.map((post, index) => <i key={`${post}-${index}`} style={socialCropStyle(post, index)} />)}</div>
    <footer><Home /><Search /><Plus /><Clapperboard /><span className="v3-instagram-footer-avatar">{brandAvatar}</span></footer>
  </div>;
}

function TikTokPhoneApp({ brandAvatar, brandName, handle, sceneImage, profile, sectorId }) {
  const poster = phoneSectorMedia(resolvePhoneSectorId(sectorId, sceneImage))[1];
  return <div className="v3-tiktok-app" style={{ "--v3-tiktok-poster": poster ? `url(${poster})` : "none" }}>
    <div className="v3-tiktok-poster" />
    <header><span>Abonnements</span><b>Pour toi</b><Search /></header>
    <aside>
      {brandAvatar}
      <span><Heart fill="currentColor" /><b>12,4 K</b></span>
      <span><MessageCircle fill="currentColor" /><b>386</b></span>
      <span><Bookmark fill="currentColor" /><b>1 208</b></span>
      <span><Share2 fill="currentColor" /><b>Partager</b></span>
      <i className="v3-tiktok-disc"><Music2 /></i>
    </aside>
    <footer>
      <b>{handle}</b>
      <p>{profile.socialCaption}</p>
      <small>♫ son original · {brandName}</small>
      <nav><span><Home /><small>Accueil</small></span><span><UsersRound /><small>Amis</small></span><strong><Plus /></strong><span><Inbox /><small>Boîte de réception</small></span><span><UserRound /><small>Profil</small></span></nav>
    </footer>
  </div>;
}

function FacebookPhoneApp({ brandAvatar, brandName, sceneImage, profile, sectorId }) {
  const posts = instagramPostImages(sceneImage, sectorId);
  return <div className="v3-facebook-app">
    <header><strong>facebook</strong><span><Search /><Menu /></span></header>
    <div className="v3-facebook-cover" style={{ "--v3-social-cover": `url(${posts[1]})` }} />
    <section>
      {brandAvatar}
      <div><h3>{brandName}</h3><p>{profile.siteKicker}</p><small>4,8 ★ · 246 avis</small></div>
      <nav><b>Suivre</b><span>Message</span><i>•••</i></nav>
      <menu><b>Accueil</b><span>Publications</span><span>Photos</span><span>À propos</span></menu>
    </section>
    <article>
      <header>{brandAvatar}<span><b>{brandName}</b><small>À l’instant · Public</small></span><i>•••</i></header>
      <p>{profile.socialCaption}</p>
      <div style={{ "--v3-social-cover": `url(${posts[2]})` }} />
      <footer><span>👍 ❤️ 128</span><span>12 commentaires · 4 partages</span></footer>
      <nav><b>J’aime</b><span>Commenter</span><span>Partager</span></nav>
    </article>
    <footer className="v3-facebook-tabbar"><span><Home /><b>Accueil</b></span><span><Video /><b>Vidéos</b></span><span><Inbox /><b>Notifications</b></span><span><Menu /><b>Menu</b></span></footer>
  </div>;
}

function LinkedInPhoneApp({ brandAvatar, brandName, sceneImage, profile, sectorId }) {
  const posts = instagramPostImages(sceneImage, sectorId);
  const experience = phoneSectorExperience(resolvePhoneSectorId(sectorId, sceneImage));
  return <div className="v3-linkedin-app">
    <header><PlatformGlyph id="linkedin" /><span><Search />Rechercher</span><MessageCircle /></header>
    <div className="v3-linkedin-cover" style={{ "--v3-social-cover": `url(${posts[0]})` }} />
    <section>
      {brandAvatar}
      <h3>{brandName}</h3>
      <p>{profile.siteTitle}</p>
      <small>{experience.location} · 4,8 k abonnés</small>
      <nav><b>+ Suivre</b><span>Voir le site</span><i>•••</i></nav>
      <menu><b>Accueil</b><span>À propos</span><span>Publications</span><span>Emplois</span></menu>
    </section>
    <article>
      <header>{brandAvatar}<span><b>{brandName}</b><small>4 812 abonnés · 1 h</small></span><i>•••</i></header>
      <p>{profile.socialCaption}</p>
      <div style={{ "--v3-social-cover": `url(${posts[1]})` }} />
      <footer><span>👍 💡 ❤️ 86</span><span>8 commentaires</span></footer>
      <nav><b>J’aime</b><span>Commenter</span><span>Republier</span><span>Envoyer</span></nav>
    </article>
    <footer className="v3-linkedin-tabbar"><span><Home /><b>Accueil</b></span><span><UserRound /><b>Réseau</b></span><span><Plus /><b>Publier</b></span><span><Inbox /><b>Notifications</b></span><span><ShoppingBag /><b>Emplois</b></span></footer>
  </div>;
}

function WifiSettingsApp({ brandName, profile }) {
  const privateNetwork = brandName.replace(/[^A-Z0-9]+/gi, "_").replace(/^_|_$/g, "").toUpperCase().slice(0, 22) || "ENTREPRISE";
  return <div className="v3-ios-wifi-app">
    <header><span>‹ Réglages</span><b>Wi‑Fi</b><i>Modifier</i></header>
    <section className="v3-ios-settings-group"><div><b>Wi‑Fi</b><i className="is-on"><span /></i></div></section>
    <small>RÉSEAUX</small>
    <section className="v3-ios-settings-group v3-ios-network-list">
      <div><Check /><b>{profile.wifi}</b><Wifi /><Info /></div>
      <div><span /><b>{privateNetwork}</b><LockKeyhole /><Wifi /><Info /></div>
    </section>
    <small>AUTRES RÉSEAUX</small>
    <section className="v3-ios-settings-group v3-ios-network-list"><div><span /><b>Orange_5G</b><LockKeyhole /><Wifi /><Info /></div></section>
  </div>;
}

function WhatsAppPhoneApp({ brandAvatar, brandName, sectorId }) {
  const experience = phoneSectorExperience(sectorId);
  return <div className="v3-whatsapp-app">
    <header><span className="v3-whatsapp-back">‹</span>{brandAvatar}<div><b>{brandName}</b><small>compte professionnel</small></div><Video /><PhoneCall /></header>
    <section><time>AUJOURD’HUI</time><p className="is-incoming">{experience.incoming}<small>11:24</small></p><p className="is-outgoing">{experience.outgoing}<small>11:25 · ✓✓</small></p></section>
    <footer><Plus /><span>Message<Camera /></span><Mic /></footer>
  </div>;
}

function ApplePayPhoneApp({ brandAvatar, brandName, profile }) {
  return <div className="v3-apple-pay-app">
    <div className="v3-apple-pay-checkout">
      <header>{brandAvatar}<span><b>{brandName}</b><small>{profile.paymentLabel}</small></span></header>
      <div><span>Total</span><b>{profile.paymentAmount}</b></div>
    </div>
    <section className="v3-apple-pay-sheet">
      <i className="v3-apple-pay-grabber" />
      <header><b>Apple Pay</b><strong>{profile.paymentAmount}</strong></header>
      <div><small>CARTE</small><span><b>•••• 4242</b><em>Visa</em></span></div>
      <div><small>CONTACT</small><span><b>Compte Apple · contact masqué</b><em>›</em></span></div>
      <footer><span>Confirmer avec le bouton latéral</span><i /></footer>
    </section>
  </div>;
}

function SafariPhoneApp({ brandAvatar, brandName, actionId, sceneImage, profile, sectorId }) {
  const isOther = actionId === "autre";
  const heroImage = phoneSectorMedia(resolvePhoneSectorId(sectorId, sceneImage))[0];
  const domain = brandName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 18) || "votre-lien";
  return <div className="v3-safari-app">
    <div className="v3-safari-page">
      <header>{brandAvatar}<span>{brandName}</span><Menu /></header>
      <div className="v3-safari-hero" style={{ "--v3-safari-image": `url(${heroImage})` }}>
        <small>{isOther ? "VOTRE ESPACE" : profile.siteKicker}</small>
        <h3>{isOther ? "Un lien, votre univers." : profile.siteTitle}</h3>
      </div>
      <section><b>{isOther ? "Bienvenue" : "À découvrir"}</b><p>{isOther ? "Horaires, actualités et informations utiles au même endroit." : profile.siteBody}</p><span>{isOther ? "Découvrir" : "Voir les services"}</span></section>
    </div>
    <footer>
      <div><LockKeyhole /><span>{isOther ? "votre-lien.fr" : `${domain}.fr`}</span><i>↻</i></div>
      <nav><span>‹</span><span>›</span><Share2 /><Bookmark /><Layers3 /></nav>
    </footer>
  </div>;
}

function PhoneServiceMark({ actionId, label }) {
  const platformId = actionId === "avis" ? "google" : ["instagram", "facebook", "linkedin", "tiktok", "whatsapp"].includes(actionId) ? actionId : "";
  const ServiceIcon = {
    formulaire: ClipboardList,
    menu: UtensilsCrossed,
    reservation: CalendarDays,
    commande: ShoppingBag,
    paiement: CreditCard,
    pourboire: CircleDollarSign,
    fidelite: Gift,
    wifi: Wifi,
    site: Globe2,
    contact: ContactRound,
    multiliens: Layers3,
    autre: Link2,
  }[actionId];
  return <span className="v3-live-phone-service">{platformId ? <PlatformGlyph id={platformId} /> : ServiceIcon ? <ServiceIcon /> : null}<b>{actionId === "avis" ? "Avis Google" : label}</b></span>;
}

function LivePhoneScreen({ actionId = "avis", brandName = "VOTRE MARQUE", brandLogo = "", primaryColor = "", secondaryColor = "", textColor = "", sceneImage = "", sectorId = "", className = "", native = false, preserveNativeStatus = false }) {
  const resolvedSectorId = resolvePhoneSectorId(sectorId, sceneImage);
  const profile = phoneSectorProfile(resolvedSectorId, sceneImage);
  const baseScreen = PHONE_SCREENS[actionId] || PHONE_SCREENS.autre;
  const screen = {
    ...baseScreen,
    title: actionId === "menu" ? profile.menuTitle : actionId === "reservation" ? profile.bookingTitle : baseScreen.title,
  };
  const socialNetwork = ["instagram", "facebook", "linkedin", "tiktok"].includes(actionId) ? actionId : "";
  const safeBrandName = brandName || "VOTRE MARQUE";
  const handle = `@${safeBrandName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "votre.marque"}`;
  const instanceId = useId().replace(/:/g, "");
  const clipId = `tapote-phone-screen-${instanceId}`;
  const glareId = `tapote-phone-glare-${instanceId}`;
  const glassId = `tapote-phone-glass-${instanceId}`;
  const isRestaurantLiveScreen = sceneImage === "/assets/products/tapote-bg-restaurant-live-screen-v1.webp";
  const isLifestylePhone = Boolean(PHONE_SCENE_SECTORS[sceneImage]);
  const contentPath = isRestaurantLiveScreen
    ? actionId === "tiktok" ? PHONE_DARK_CONTENT_PATH : PHONE_DYNAMIC_CONTENT_PATH
    : isLifestylePhone ? roundedPhoneClipPath(sceneImage) : PHONE_CONTENT_PATH;
  // The phone screen mimics a real light-mode app: brand text and the avatar
  // (a white glyph on a coloured disc) sit on a white UI, so they need a dark
  // brand colour. Depending on the theme the dark tone is the paper (blue,
  // green) or the ink (sand, rose, mono), so pick whichever of the two reads
  // best on white and fall back to near-black if neither is dark enough.
  const brandCandidates = [primaryColor, textColor]
    .map((value) => normalizeHexColor(value, ""))
    .filter(Boolean);
  const strongestBrandColor = brandCandidates.reduce((best, candidate) => (
    !best || contrastRatio(candidate, "#ffffff") > contrastRatio(best, "#ffffff") ? candidate : best
  ), "");
  const brandDark = strongestBrandColor && contrastRatio(strongestBrandColor, "#ffffff") >= 4.5
    ? strongestBrandColor
    : "#161310";
  const normalizedSecondary = normalizeHexColor(secondaryColor, "#2057f3");
  const brandAccent = contrastRatio(normalizedSecondary, "#ffffff") >= 3
    ? normalizedSecondary
    : contrastRatio(normalizeHexColor(primaryColor, brandDark), "#ffffff") >= 3
      ? normalizeHexColor(primaryColor, brandDark)
      : brandDark;
  const phoneStyle = {
    "--v3-phone-primary": brandDark,
    "--v3-phone-accent": brandAccent,
    // Base UI text also lives on the white app surface, so it uses the same
    // guaranteed-dark tone rather than the support's ink (light on dark themes).
    "--v3-phone-copy": brandDark,
    "--v3-phone-scene-image": sceneImage ? `url(${sceneImage})` : "none",
  };
  const bareBrandAvatar = <div className="v3-live-brand-avatar">{brandLogo ? <img src={brandLogo} alt="" /> : <GeneratedBrandMark name={safeBrandName} />}</div>;
  const brandAvatar = <div className="v3-live-brand-avatar">{brandLogo ? <img src={brandLogo} alt="" /> : <GeneratedBrandMark name={safeBrandName} />}{socialNetwork && <b className={`is-${socialNetwork}`}><PlatformGlyph id={socialNetwork} /></b>}</div>;
  const socialPosts = instagramPostImages(sceneImage, resolvedSectorId);
  return (
    <div className={`v3-live-phone-screen is-action-${actionId} ${className}`} style={phoneStyle} data-phone-action={actionId} data-phone-sector={resolvedSectorId || undefined} data-native-source={native || undefined} role="img" aria-label={`Écran du téléphone après ouverture : ${ACTIONS[actionId]?.name || "lien"}`}>
      <svg className="v3-live-phone-svg" viewBox="0 0 1254 1254" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse"><path d={contentPath} /></clipPath>
          <linearGradient id={glassId} x1=".12" y1="0" x2=".86" y2="1"><stop offset="0" stopColor="#f4f2ed" /><stop offset=".48" stopColor="#eeede9" /><stop offset="1" stopColor="#d7d9dd" /></linearGradient>
          <linearGradient id={glareId} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff7e8" stopOpacity=".2" /><stop offset=".4" stopColor="#fff" stopOpacity="0" /><stop offset=".82" stopColor="#cbd5e1" stopOpacity=".12" /></linearGradient>
        </defs>
        <path className="v3-live-phone-mask" d={contentPath} fill={`url(#${glassId})`} />
        <foreignObject x="0" y="0" width="1254" height="1254" clipPath={`url(#${clipId})`}>
          <div className="v3-live-phone-canvas" xmlns="http://www.w3.org/1999/xhtml" aria-hidden="true">
            <div className="v3-live-phone-ui">
              {/* Every lifestyle photograph already contains the physical iOS
                  status area. Light destinations preserve it; TikTok repaints
                  the full glass and therefore draws a white live status bar. */}
              {(!preserveNativeStatus || actionId === "tiktok") && <div className="v3-live-phone-status"><span>11:25</span><div><i className="is-signal" /><Wifi /><i className="is-battery" /></div></div>}
              {!['instagram', 'tiktok', 'facebook', 'linkedin', 'whatsapp', 'wifi', 'paiement', 'site', 'autre'].includes(actionId) && <div className="v3-live-phone-browser"><span>‹</span><strong><PhoneServiceMark actionId={actionId} label={screen.overline} /></strong><i>•••</i></div>}
              {actionId === "instagram" ? <InstagramPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} handle={handle} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} /> : actionId === "tiktok" ? <TikTokPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} handle={handle} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} /> : actionId === "facebook" ? <FacebookPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} /> : actionId === "linkedin" ? <LinkedInPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} /> : actionId === "whatsapp" ? <WhatsAppPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} profile={profile} sectorId={resolvedSectorId} /> : actionId === "wifi" ? <WifiSettingsApp brandName={safeBrandName} profile={profile} /> : actionId === "paiement" ? <ApplePayPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} profile={profile} /> : ["site", "autre"].includes(actionId) ? <SafariPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} actionId={actionId} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} /> : socialNetwork ? <div className="v3-live-phone-social">
                {brandAvatar}
                <div><h3>{safeBrandName}</h3><span>{handle}</span></div>
                <dl><div><dt>128</dt><dd>publications</dd></div><div><dt>4,8 k</dt><dd>abonnés</dd></div><div><dt>246</dt><dd>abonnements</dd></div></dl>
                <span className="v3-live-phone-cta">{socialNetwork === "linkedin" ? "Suivre la page" : "Suivre"}</span>
                <div className="v3-live-social-grid">{socialPosts.map((post, index) => <i key={`${post}-${index}`} style={{ "--v3-phone-post-image": `url(${post})` }} />)}</div>
              </div> : <div className={`v3-live-phone-content is-${actionId}`}>
                <div className="v3-live-phone-brand">{brandAvatar}<small>{safeBrandName}</small></div>
                <h3>{screen.title}</h3>
                <PhoneActionPreview actionId={actionId} screen={screen} sceneImage={sceneImage} brandName={safeBrandName} sectorId={resolvedSectorId} />
                <p>{screen.helper}</p>
                <span className="v3-live-phone-cta">{screen.cta}</span>
              </div>}
              <i className="v3-live-phone-home" />
            </div>
          </div>
        </foreignObject>
        <path className="v3-live-phone-glare" d="M635 315 C621 330 625 360 643 402 L866 902 C879 932 897 947 919 943 L955 935 L747 307 Z" fill={`url(#${glareId})`} clipPath={`url(#${clipId})`} />
      </svg>
    </div>
  );
}

function sectorDefaultSurface(sector) {
  if (sector.recommendedProductId === "carte" || (!sector.composition?.comptoir && !sector.composition?.plaque)) return "carte";
  return sector.composition?.comptoir > 0 ? "comptoir" : "plaque";
}

// Per-photo perspective mapping. The live UI is projected directly from its
// native 390 × 844 rectangle onto the measured glass quadrilateral. Keeping the
// SVG mask fixed in photo coordinates avoids double-warping the rounded corners.
const PHONE_UI_SOURCE_QUAD = [[0, 0], [390 / 1254, 0], [390 / 1254, 844 / 1254], [0, 844 / 1254]];
const PHONE_SCREEN_QUADS = {
  // Four measured intersections of the photographed glass edges. Keeping the
  // full quadrilateral (instead of approximating its centre) makes both the
  // browser chrome and the home indicator parallel to the physical phone.
  "/assets/products/tapote-bg-restaurant-live-screen-v1.webp": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-cafe-empty-v3.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-boulangerie-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-agence-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-sport-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-evenement-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  // La scène Coworking réutilise volontairement les pixels et la géométrie
  // du téléphone Restaurant, superposés sur son propre fond vide.
  "/assets/products/tapote-bg-formation-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  // Contrairement aux autres scènes, le téléphone Café est davantage tourné
  // et ses quatre bords ne convergent pas autour d'un simple rectangle incliné.
  // Ces intersections suivent précisément la limite verre / écran de la photo :
  // toute l'interface partage ainsi le même cadrage, quelle que soit la destination.
  "/assets/products/tapote-bg-cafe-v1.webp": [[0.481659, 0.261563], [0.708932, 0.215311], [0.996810, 0.719298], [0.716906, 0.779904]],
  "/assets/products/tapote-bg-cafe-restaurant-phone-v2.webp": [[0.4872, 0.2720], [0.7105, 0.2290], [0.9848, 0.7177], [0.7273, 0.7735]],
  "/assets/products/tapote-bg-restaurant-v1.webp": [[0.474478, 0.257134], [0.687755, 0.205264], [0.959916, 0.682301], [0.697377, 0.780543]],
  "/assets/products/tapote-bg-boulangerie-v1.webp": [[0.498975, 0.248284], [0.733490, 0.211885], [0.968620, 0.691920], [0.716358, 0.771898]],
  "/assets/products/tapote-bg-beaute-v1.webp": [[0.501229, 0.249648], [0.740691, 0.213979], [0.969611, 0.703874], [0.716696, 0.785585]],
  "/assets/products/tapote-bg-medical-v1.webp": [[0.476215, 0.280453], [0.694688, 0.224574], [0.945019, 0.669781], [0.718625, 0.758771]],
  "/assets/products/tapote-bg-retail-v1.webp": [[0.499329, 0.247809], [0.732111, 0.210345], [0.966294, 0.685388], [0.716630, 0.770543]],
  "/assets/products/tapote-bg-hotel-v1.webp": [[0.465652, 0.259039], [0.682713, 0.205416], [0.947277, 0.681730], [0.712337, 0.769983]],
  "/assets/products/tapote-bg-auto-ecole-v1.webp": [[0.500609, 0.276762], [0.739021, 0.239813], [0.977707, 0.727795], [0.723370, 0.814768]],
  "/assets/products/tapote-bg-automobile-v1.webp": [[0.508017, 0.259777], [0.728628, 0.221889], [0.967728, 0.711728], [0.724802, 0.789559]],
  "/assets/products/tapote-bg-artisan-v1.webp": [[0.497336, 0.248034], [0.727057, 0.210598], [0.976482, 0.723398], [0.723725, 0.800895]],
  "/assets/products/tapote-bg-agence-v1.webp": [[0.498484, 0.250929], [0.728625, 0.215380], [0.964823, 0.692531], [0.717898, 0.780191]],
  "/assets/products/tapote-bg-sport-v1.webp": [[0.500117, 0.254376], [0.730542, 0.219908], [0.967212, 0.708945], [0.714041, 0.788721]],
  "/assets/products/tapote-bg-formation-v1.webp": [[0.503090, 0.252974], [0.732562, 0.215909], [0.975399, 0.708791], [0.721353, 0.782529]],
  "/assets/products/tapote-bg-evenement-v1.webp": [[0.503473, 0.253848], [0.734066, 0.218198], [0.965786, 0.696765], [0.716194, 0.782694]],
  "/assets/products/tapote-bg-animaux-v1.webp": [[0.472355, 0.285801], [0.685404, 0.230525], [0.936727, 0.674057], [0.708341, 0.757322]],
};

// Corner radii in the native 390 × 844 screen coordinate system, ordered
// TL, TR, BR, BL. Generated lifestyle shots bend the two lower corners
// differently, so a single CSS radius cannot follow their photographed glass.
const PHONE_SCREEN_CLIP_RADII = {
  // Le téléphone de la scène Café remonte plus vite sur son coin inférieur
  // gauche que celui du restaurant. Une valeur dédiée évite que l'écran
  // dynamique dépasse du verre sans modifier son haut, déjà correctement calé.
  "/assets/products/tapote-bg-cafe-v1.webp": [60, 60, 106, 76],
  "/assets/products/tapote-bg-cafe-restaurant-phone-v2.webp": [60, 60, 90, 90],
  "/assets/products/tapote-bg-cafe-empty-v3.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-boulangerie-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-agence-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-sport-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-evenement-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-formation-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-restaurant-v1.webp": [60, 60, 80, 118],
  "/assets/products/tapote-bg-boulangerie-v1.webp": [60, 60, 95, 79],
  "/assets/products/tapote-bg-beaute-v1.webp": [60, 60, 90, 83.5],
  "/assets/products/tapote-bg-medical-v1.webp": [58, 58, 62, 75],
  "/assets/products/tapote-bg-retail-v1.webp": [60, 60, 88, 79],
  "/assets/products/tapote-bg-hotel-v1.webp": [58, 58, 69, 58],
  "/assets/products/tapote-bg-auto-ecole-v1.webp": [60, 60, 105, 81],
  "/assets/products/tapote-bg-automobile-v1.webp": [58, 58, 77, 59],
  "/assets/products/tapote-bg-artisan-v1.webp": [54, 54, 67, 55],
  "/assets/products/tapote-bg-agence-v1.webp": [60, 60, 92, 76],
  "/assets/products/tapote-bg-sport-v1.webp": [60, 60, 108, 77],
  "/assets/products/tapote-bg-formation-v1.webp": [60, 60, 95, 58],
  "/assets/products/tapote-bg-evenement-v1.webp": [60, 60, 92, 83],
  "/assets/products/tapote-bg-animaux-v1.webp": [58, 58, 70, 77],
};

// Local control-point corrections for generated glass whose photographed
// rounded corner does not converge on the mathematical edge intersection.
// Values are photo pixels and affect only the curve, not the app perspective.
const PHONE_SCREEN_CLIP_CONTROL_OFFSETS = {
  "/assets/products/tapote-bg-cafe-v1.webp": { br: [-8, -4] },
  "/assets/products/tapote-bg-beaute-v1.webp": { br: [-1.5, 7.25] },
  "/assets/products/tapote-bg-agence-v1.webp": { br: [-0.25, 7.25] },
  "/assets/products/tapote-bg-sport-v1.webp": { br: [-18.25, 3.25] },
  "/assets/products/tapote-bg-formation-v1.webp": { br: [-8, 0] },
};

// Project a rounded 390 × 844 screen silhouette into the photographed glass.
// The four quad points are the intersections of the straight glass edges; the
// rounded path then clips the live HTML in photo coordinates. This is the same
// robust masking principle as the hand-measured restaurant scene, generalized
// to every lifestyle photograph so no app surface can escape over a bezel.
function roundedPhoneClipPath(sceneImage) {
  const quad = PHONE_SCREEN_QUADS[sceneImage];
  if (!quad) return PHONE_CONTENT_PATH;
  const [tl, tr, br, bl] = quad.map(([x, y]) => [x * 1254, y * 1254]);
  const [tlRadius, trRadius, brRadius, blRadius] = PHONE_SCREEN_CLIP_RADII[sceneImage] || [60, 60, 82, 76];
  const controlOffsets = PHONE_SCREEN_CLIP_CONTROL_OFFSETS[sceneImage] || {};
  const shifted = ([x, y], [dx = 0, dy = 0] = []) => [x + dx, y + dy];
  const tlControl = shifted(tl, controlOffsets.tl);
  const trControl = shifted(tr, controlOffsets.tr);
  const brControl = shifted(br, controlOffsets.br);
  const blControl = shifted(bl, controlOffsets.bl);
  const along = ([ax, ay], [bx, by], amount) => [ax + ((bx - ax) * amount), ay + ((by - ay) * amount)];
  const topStart = along(tl, tr, tlRadius / 390);
  const topEnd = along(tr, tl, trRadius / 390);
  const rightStart = along(tr, br, trRadius / 844);
  const rightEnd = along(br, tr, brRadius / 844);
  const bottomStart = along(br, bl, brRadius / 390);
  const bottomEnd = along(bl, br, blRadius / 390);
  const leftStart = along(bl, tl, blRadius / 844);
  const leftEnd = along(tl, bl, tlRadius / 844);
  const point = ([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  return [
    `M ${point(topStart)}`,
    `L ${point(topEnd)}`,
    `Q ${point(trControl)} ${point(rightStart)}`,
    `L ${point(rightEnd)}`,
    `Q ${point(brControl)} ${point(bottomStart)}`,
    `L ${point(bottomEnd)}`,
    `Q ${point(blControl)} ${point(leftStart)}`,
    `L ${point(leftEnd)}`,
    `Q ${point(tlControl)} ${point(topStart)}`,
    "Z",
  ].join(" ");
}

// Adjugate of a 3×3 matrix (row-major, length 9).
function adj3(m) {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ];
}
function mul3(a, b) {
  const c = new Array(9).fill(0);
  for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) for (let k = 0; k < 3; k += 1) c[3 * i + j] += a[3 * i + k] * b[3 * k + j];
  return c;
}
function mulV(m, v) {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}
// Basis mapping the unit square corners to four points.
function basisFor(pts) {
  const m = [pts[0][0], pts[1][0], pts[2][0], pts[0][1], pts[1][1], pts[2][1], 1, 1, 1];
  const v = mulV(adj3(m), [pts[3][0], pts[3][1], 1]);
  return mul3(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}
// CSS matrix3d string mapping the source quad onto the destination quad, both given
// in scene fractions and scaled to the scene's pixel size (w × h).
function quadMatrix3d(srcFrac, dstFrac, w, h) {
  const scale = (q) => q.map(([x, y]) => [x * w, y * h]);
  const projection = mul3(basisFor(scale(dstFrac)), adj3(basisFor(scale(srcFrac))));
  for (let i = 0; i < 9; i += 1) projection[i] /= projection[8];
  const t = projection;
  const m = [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]];
  return `matrix3d(${m.join(",")})`;
}

function ProductScene({ image, alt, preview, compact = false, className = "", sectorId = "", subjectLayers = [] }) {
  const isRestaurantPhoto = image === "/assets/products/tapote-bg-restaurant-live-screen-v1.webp";
  const isPhotoPhone = Boolean(PHONE_SCENE_SECTORS[image]);
  const resolvedSectorId = resolvePhoneSectorId(sectorId, image);
  const isMixedPack = preview.surface === "mix";
  const sceneColors = resolveDeviceColors(preview.theme, preview.primaryColor, preview.secondaryColor, preview.textColor);
  const scenePreview = { ...preview, primaryColor: sceneColors.paper, secondaryColor: sceneColors.accent, textColor: sceneColors.ink };
  const sceneRef = useRef(null);
  const destQuad = PHONE_SCREEN_QUADS[image];
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const screenEl = scene?.querySelector(".v3-live-phone-screen");
    const uiEl = scene?.querySelector(".v3-live-phone-ui");
    if (!screenEl || !uiEl) return undefined;
    screenEl.style.transform = "";
    if (!destQuad) { uiEl.style.transform = ""; return undefined; }
    uiEl.style.transform = quadMatrix3d(PHONE_UI_SOURCE_QUAD, destQuad, 1254, 1254);
    return undefined;
  }, [destQuad, scenePreview.actionId, scenePreview.brandName, scenePreview.brandLogo, scenePreview.primaryColor, scenePreview.secondaryColor, scenePreview.textColor, scenePreview.personalization]);
  return (
    <div ref={sceneRef} className={`v3-sector-scene ${compact ? "is-compact is-fixed-preview" : "is-live-preview"} is-surface-${preview.surface} ${className}`} data-preview-mode={compact ? "fixed" : "live"} aria-hidden={compact || undefined}>
      <div className="v3-sector-scene-stage">
        <img className="v3-sector-scene-background" src={image} alt={compact ? "" : alt} loading={compact ? "lazy" : "eager"} />
        {subjectLayers.map((layer) => (
          <img
            className={`v3-sector-scene-subject${layer.mask ? "" : " is-cutout"}`}
            src={layer.image}
            alt=""
            aria-hidden="true"
            loading={compact ? "lazy" : "eager"}
            style={layer.mask ? { "--v3-subject-mask": `url("${layer.mask}")` } : undefined}
            key={layer.mask || layer.image}
          />
        ))}
        {isMixedPack ? <div className="v3-sector-scene-support v3-sector-scene-support-mix">
          <ProductArt {...scenePreview} surface="comptoir" className="is-mix-comptoir" />
          <ProductArt {...scenePreview} surface="plaque" className="is-mix-plaque" />
        </div> : <ProductArt {...scenePreview} className="v3-sector-scene-support" />}
        <LivePhoneScreen key={`${scenePreview.actionId}-${scenePreview.brandName}-${scenePreview.brandLogo}-${scenePreview.primaryColor}-${scenePreview.secondaryColor}-${scenePreview.textColor}-${scenePreview.personalization}`} actionId={scenePreview.actionId} brandName={scenePreview.brandName} brandLogo={scenePreview.brandLogo} primaryColor={scenePreview.primaryColor} secondaryColor={scenePreview.secondaryColor} textColor={scenePreview.textColor} sceneImage={image} sectorId={resolvedSectorId} className={`v3-sector-scene-screen${isPhotoPhone ? " is-photo-screen" : ""}${isRestaurantPhoto ? " is-restaurant-screen" : ""}`} preserveNativeStatus={isPhotoPhone} />
      </div>
    </div>
  );
}

function SectorScene({ sector, preview, compact = false, className = "" }) {
  return <ProductScene image={sector.image} alt={`Tapote utilisé dans un univers ${sector.title}`} nativeAction={sector.actionIds[0]} preview={preview} compact={compact} className={className} sectorId={sector.id} subjectLayers={sector.subjectLayers} />;
}

function CompositionPicker({ count, composition, onChange, labelId }) {
  if (count === 1) return null;
  const choices = count === 2
    ? [
      { label: "2 chevalets", value: { comptoir: 2, plaque: 0 } },
      { label: "1 chevalet + 1 plaque", value: { comptoir: 1, plaque: 1 } },
      { label: "2 plaques", value: { comptoir: 0, plaque: 2 } },
    ]
    : [
      { label: "5 chevalets", value: { comptoir: 5, plaque: 0 } },
      { label: "Mix recommandé", value: { comptoir: 2, plaque: 3 } },
      { label: "5 plaques", value: { comptoir: 0, plaque: 5 } },
    ];
  return (
    <div className="v3-field-block" role="group" aria-labelledby={labelId}>
      <span className="v3-field-label" id={labelId}><b aria-hidden="true">↳</b><span>La composition</span><small>Répartissez les formats dans votre lot.</small></span>
      <div className="v3-choice-row v3-choice-row-three">
        {choices.map((choice) => {
          const selected = choice.value.comptoir === composition.comptoir && choice.value.plaque === composition.plaque;
          return <button type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => onChange(choice.value)} key={choice.label}>{choice.label}</button>;
        })}
      </div>
    </div>
  );
}

function ReadyDesignPicker({ onChange, theme }) {
  return (
    <div className="v3-ready-design-panel">
      <div className="v3-ready-design-heading">
        <span>Couleur du modèle</span>
        <small>Le rendu complet est visible à gauche.</small>
      </div>
      <div className="v3-ready-design-choice" role="group" aria-label="Choisir le modèle Tapote prêt à l’emploi">
        {Object.keys(DEVICE_THEMES).map((themeId) => {
          const selected = theme === themeId;
          const light = themeId === "creme";
          return (
            <button
              type="button"
              key={themeId}
              className={selected ? "is-selected" : ""}
              aria-label={`Design ${THEME_LABELS[themeId]}`}
              aria-pressed={selected}
              onClick={() => onChange(themeId)}
            >
              <span
                className="v3-ready-design-swatch"
                style={{
                  "--ready-paper": DEVICE_THEMES[themeId].paper,
                  "--ready-ink": DEVICE_THEMES[themeId].ink,
                  "--ready-accent": DEVICE_THEMES[themeId].accent,
                }}
                aria-hidden="true"
              >
                <i />
                <b>t.</b>
              </span>
              <span className="v3-ready-design-copy">
                <strong>{THEME_LABELS[themeId]}</strong>
                <small>{light ? "Fond clair" : "Fond noir"}</small>
              </span>
              <Check aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BuyBox({ onAdd, initialSurface = "comptoir", initialAction = "avis", initialCount = 1, initialComposition, initialPersonalization = "ready", initialTheme = DEFAULT_THEME, initialBrandName = "VOTRE MARQUE", initialReadyHeadline = "", targetId = "cafe", title = "Choisissez votre Tapote.", productOnly = false, compact = false, allowAllSurfaces = false, onPreviewChange, draftKey = "" }) {
  const initialColors = DEVICE_THEMES[resolveThemeId(initialTheme)];
  const restoredDraft = useMemo(() => initialPersonalization === "custom" || draftKey.startsWith("cart:") ? loadConfigDraft(draftKey) : null, [draftKey, initialPersonalization]);
  const [personalization, setPersonalization] = useState(initialPersonalization);
  const [surface, setSurface] = useState(initialSurface);
  const restoredCount = [1, 2, 5].includes(Number(restoredDraft?.count)) ? Number(restoredDraft.count) : initialCount;
  const [count, setCount] = useState(restoredCount);
  const [actionId, setActionId] = useState(ACTIONS[restoredDraft?.actionId] ? restoredDraft.actionId : initialAction);
  const [composition, setComposition] = useState(
    restoredDraft?.composition
    || initialComposition
    || (restoredCount === 5 ? { comptoir: 2, plaque: 3 } : restoredCount === 2 ? { comptoir: 1, plaque: 1 } : { comptoir: 1, plaque: 0 }),
  );
  const [brandName, setBrandName] = useState(restoredDraft?.brandName || "");
  const [brandLogoId, setBrandLogoId] = useState(restoredDraft?.brandLogoId || "");
  const [brandLogo, setBrandLogo] = useState(() => getCachedLogoPreview(restoredDraft?.brandLogoId));
  const [logoFileName, setLogoFileName] = useState(restoredDraft?.logoFileName || "");
  const [customHeadline, setCustomHeadline] = useState(restoredDraft?.customHeadline || "");
  const [customSubline, setCustomSubline] = useState(restoredDraft?.customSubline || "");
  const [customTapLabel, setCustomTapLabel] = useState(restoredDraft?.customTapLabel || "");
  const [destinationUrl, setDestinationUrl] = useState(restoredDraft?.destinationUrl || "");
  const [theme, setTheme] = useState(resolveThemeId(restoredDraft?.theme || initialTheme));
  const [primaryColor, setPrimaryColor] = useState(restoredDraft?.primaryColor || initialColors.paper);
  const [secondaryColor, setSecondaryColor] = useState(restoredDraft?.secondaryColor || initialColors.accent);
  const [textColor, setTextColor] = useState(restoredDraft?.textColor || initialColors.ink);
  // Choisir une déclinaison réapplique ses trois couleurs : le client voit
  // immédiatement le résultat sans toucher au réglage fin.
  const applyTheme = (nextTheme) => {
    const palette = DEVICE_THEMES[nextTheme];
    setTheme(nextTheme);
    setPrimaryColor(palette.paper);
    setSecondaryColor(palette.accent);
    setTextColor(palette.ink);
    setPaletteDetected(false);
    setColorsManuallyEdited(false);
    setManualPalettePreserved(false);
    markConfigurationStarted();
  };
  const summaryRef = useRef(null);
  const supportLabelId = useId();
  const quantityLabelId = useId();
  const compositionLabelId = useId();
  const linkLabelId = useId();
  const designLabelId = useId();
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [paletteDetected, setPaletteDetected] = useState(false);
  const [colorsManuallyEdited, setColorsManuallyEdited] = useState(false);
  const [manualPalettePreserved, setManualPalettePreserved] = useState(false);
  const configurationTrackedRef = useRef(false);
  const markConfigurationStarted = () => {
    if (configurationTrackedRef.current) return;
    configurationTrackedRef.current = true;
    trackStorefrontEvent("start_configurator", {
      surface: initialSurface,
      personalization,
      action_id: actionId,
    });
  };
  useEffect(() => {
    if (!productOnly || !summaryRef.current || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setSummaryVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(summaryRef.current);
    return () => observer.disconnect();
  }, [productOnly]);
  const [logoStatus, setLogoStatus] = useState(restoredDraft?.brandLogoId ? "success" : "idle");
  const [logoError, setLogoError] = useState("");
  const [added, setAdded] = useState(false);
  const isCard = surface === "carte";
  const safeCount = isCard ? 1 : count;
  const productId = getProductId(surface, personalization, safeCount);
  const product = PRODUCTS[productId];
  const readyChoicePrice = PRODUCTS[getProductId(surface, "ready", safeCount)].price;
  const customChoicePrice = PRODUCTS[getProductId(surface, "custom", safeCount)].price;
  const shipping = calculateShipping(product.price);
  const readyColors = DEVICE_THEMES[resolveThemeId(theme)];
  const availableActions = ACTION_ORDER
    .filter((id) => personalization !== "ready" || READY_ACTION_IDS.includes(id))
    .map((id) => ACTIONS[id]);
  const previewBrandName = personalization === "ready" ? initialBrandName : brandName || "VOTRE MARQUE";
  const previewBrandLogo = personalization === "ready" ? "" : brandLogo;
  const previewPrimaryColor = personalization === "ready" ? readyColors.paper : primaryColor;
  const previewSecondaryColor = personalization === "ready" ? readyColors.accent : secondaryColor;
  const previewTextColor = personalization === "ready" ? readyColors.ink : textColor;
  const readyHeadline = personalization === "ready"
    ? actionId === initialAction && initialReadyHeadline
      ? initialReadyHeadline
      : readyHeadlineForAction(actionId)
    : "";
  const previewHeadline = personalization === "custom" ? customHeadline : readyHeadline;
  const logoPending = personalization === "custom" && (logoStatus === "loading" || Boolean(brandLogo && !brandLogoId));
  const destinationInvalid = Boolean(destinationUrl && !/^https:\/\/.+/i.test(destinationUrl));
  const logoPendingLabel = logoStatus === "loading" ? "Envoi du logo…" : "Logo à retransmettre";
  const selectPersonalization = (value) => {
    markConfigurationStarted();
    setPersonalization(value);
    if (value === "ready" && !READY_ACTION_IDS.includes(actionId)) {
      setActionId("avis");
    }
  };
  const selectAction = (value) => {
    markConfigurationStarted();
    setActionId(value);
  };
  const previewSurface = compositionSurface(safeCount, composition, surface);
  useEffect(() => {
    onPreviewChange?.({ surface: previewSurface, baseSurface: surface, actionId, brandName: previewBrandName, brandLogo: previewBrandLogo, theme, primaryColor: previewPrimaryColor, secondaryColor: previewSecondaryColor, textColor: previewTextColor, customHeadline: previewHeadline, customSubline: personalization === "custom" ? customSubline : "", customTapLabel: personalization === "custom" ? customTapLabel : "", personalization, count: safeCount, composition, productId, productName: product.name, price: product.price });
  }, [actionId, composition, customSubline, customTapLabel, onPreviewChange, personalization, previewBrandLogo, previewBrandName, previewHeadline, previewPrimaryColor, previewSecondaryColor, previewSurface, previewTextColor, product.name, product.price, productId, safeCount, surface, theme]);
  useEffect(() => {
    if (!draftKey || personalization !== "custom") return;
    try {
      window.sessionStorage.setItem(`${CONFIG_DRAFT_PREFIX}${draftKey}`, JSON.stringify({ actionId, count: safeCount, composition, brandName, brandLogoId, logoFileName, theme, customHeadline, customSubline, customTapLabel, destinationUrl, primaryColor, secondaryColor, textColor }));
    } catch { /* A full browser storage area must never block configuration or checkout. */ }
  }, [actionId, brandLogoId, brandName, composition, customHeadline, customSubline, customTapLabel, destinationUrl, draftKey, logoFileName, personalization, primaryColor, safeCount, secondaryColor, textColor, theme]);
  const selectCount = (value) => {
    markConfigurationStarted();
    setCount(value);
    if (productOnly && initialSurface === "comptoir") {
      setComposition({ comptoir: value, plaque: 0 });
    } else if (productOnly && initialSurface === "plaque") {
      setComposition({ comptoir: 0, plaque: value });
    } else if (value === 1) {
      setComposition(surface === "plaque" ? { comptoir: 0, plaque: 1 } : { comptoir: 1, plaque: 0 });
    } else {
      setComposition(value === 2 ? { comptoir: 1, plaque: 1 } : { comptoir: 2, plaque: 3 });
    }
  };
  const selectSurface = (value) => {
    markConfigurationStarted();
    setSurface(value);
    if (value === "carte") return;
    if (count > 1) setComposition(value === "plaque" ? { comptoir: 0, plaque: count } : { comptoir: count, plaque: 0 });
  };
  const uploadLogo = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setLogoStatus("loading");
    setLogoError("");
    setBrandLogoId("");
    setManualPalettePreserved(false);
    try {
      const file = await prepareLogoFile(selectedFile);
      const dataUrl = await readFileAsDataUrl(file);
      setBrandLogo(dataUrl);
      setPaletteDetected(false);
      void extractLogoPalette(dataUrl).then((palette) => {
        if (!palette) return;
        if (colorsManuallyEdited) {
          setManualPalettePreserved(true);
          return;
        }
        setPrimaryColor(palette.primary);
        setSecondaryColor(palette.secondary);
        setPaletteDetected(true);
      });
      setLogoFileName(file.name.slice(0, 120));
      const formData = new FormData();
      formData.append("logo", file, file.name);
      const response = await fetch("/api/uploads/logo", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi du logo impossible.");
      cacheLogoPreview(data.uploadId, dataUrl);
      setBrandLogoId(data.uploadId);
      setLogoStatus("success");
    } catch (uploadError) {
      setLogoStatus("error");
      setLogoError(uploadError.message);
    }
  };
  const removeLogo = () => {
    setBrandLogo("");
    setBrandLogoId("");
    setLogoFileName("");
    setLogoStatus("idle");
    setLogoError("");
    setPrimaryColor(initialColors.paper);
    setSecondaryColor(initialColors.accent);
    setTextColor(initialColors.ink);
    setPaletteDetected(false);
    setColorsManuallyEdited(false);
    setManualPalettePreserved(false);
  };
  const add = () => {
    if (logoPending || destinationInvalid) return;
    onAdd(makeCartItem(productId, actionId, {
      targetId,
      supportComposition: composition,
      brandName: personalization === "custom" ? brandName : "",
      brandLogoId: personalization === "custom" ? brandLogoId : "",
      logoFileName: personalization === "custom" ? logoFileName : "",
      theme,
      primaryColor: personalization === "custom" ? primaryColor : "",
      secondaryColor: personalization === "custom" ? secondaryColor : "",
      textColor: personalization === "custom" ? textColor : "",
      customHeadline: personalization === "custom" ? customHeadline : readyHeadline,
      customSubline: personalization === "custom" ? customSubline : "",
      customTapLabel: personalization === "custom" ? customTapLabel : "",
      destinationUrl,
    }));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };
  // La page unifiée garde volontairement la même ossature quand on passe à la
  // carte. La carte est vendue à l'unité, mais l'étape quantité reste visible
  // pour éviter un changement brutal du configurateur.
  const showSupports = !productOnly && (!isCard || allowAllSurfaces);
  const showQuantity = !isCard || allowAllSurfaces;
  const supportStep = 1;
  const quantityStep = showSupports ? 2 : 1;
  const linkStep = (showSupports ? 1 : 0) + (showQuantity ? 1 : 0) + 1;
  const designStep = linkStep + 1;
  return (
    <section id={productOnly ? "configurer" : undefined} className={`v3-buybox ${compact ? "is-compact" : ""}`} aria-label="Configurer l’achat">
      <div className="v3-buybox-top"><span className="v3-rating"><Star size={14} fill="currentColor" /> Configuration en direct</span><span>4 choix · prix instantané</span></div>
      <div className="v3-buybox-intro"><div><h2>{title}</h2><p>{personalization === "custom" ? "Personnalisez chaque détail ici : l’aperçu correspond au visuel qui sera imprimé." : "Un design Tapote prêt à servir, vers le lien de votre choix."} La destination initiale est configurée avant l’envoi.</p></div></div>
      <div className={`v3-core-choice-grid ${showSupports && showQuantity ? "" : "is-single"}`}>
        {showSupports && (
          <div className="v3-field-block" role="group" aria-labelledby={supportLabelId}>
            <span className="v3-field-label" id={supportLabelId}><b>{supportStep}</b><span>Le support</span><small>Où sera-t-il utilisé ?</small></span>
            <div className={`v3-choice-row ${allowAllSurfaces ? "v3-choice-row-three" : ""}`}>
              <button type="button" aria-label="Chevalet" aria-pressed={surface === "comptoir"} className={surface === "comptoir" ? "is-selected" : ""} onClick={() => selectSurface("comptoir")}><strong>Chevalet A6</strong><small>Comptoir & table</small></button>
              <button type="button" aria-label="Plaque" aria-pressed={surface === "plaque"} className={surface === "plaque" ? "is-selected" : ""} onClick={() => selectSurface("plaque")}><strong>Plaque 12 × 12</strong><small>Compacte & stable</small></button>
              {allowAllSurfaces && <button type="button" aria-label="Carte" aria-pressed={surface === "carte"} className={surface === "carte" ? "is-selected" : ""} onClick={() => selectSurface("carte")}><strong>Carte NFC</strong><small>Mobile & terrain</small></button>}
            </div>
          </div>
        )}
        {showQuantity && (
          <div className="v3-field-block" role="group" aria-labelledby={quantityLabelId}>
            <span className="v3-field-label" id={quantityLabelId}><b>{quantityStep}</b><span>La quantité</span><small>Le tarif du lot est déjà calculé.</small></span>
            {isCard ? (
              <div className="v3-card-quantity" aria-label={`1 carte NFC · ${formatMoney(product.price)}`}>
                <span>
                  <strong>1</strong>
                  <span><small>carte NFC</small><b>{formatMoney(product.price)}</b></span>
                  <CheckCircle2 aria-hidden="true" />
                </span>
                <p><b>Vendue à l’unité</b><span>Pour plusieurs cartes, ajoutez celle-ci puis ajustez la quantité dans le panier.</span></p>
              </div>
            ) : (
              <div className="v3-quantity-choice">
                {[1, 2, 5].map((value) => {
                  const optionId = getProductId(surface, personalization, value);
                  return <button type="button" aria-label={`${value} ${value === 1 ? "support" : "supports"} · ${formatMoney(PRODUCTS[optionId].price)}`} aria-pressed={count === value} className={count === value ? "is-selected" : ""} onClick={() => selectCount(value)} key={value}><strong>{value}</strong><span>{value === 1 ? "support" : "supports"}</span><b>{formatMoney(PRODUCTS[optionId].price)}</b>{value === 2 && personalization === "custom" && <em>Populaire</em>}</button>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <CompositionPicker count={safeCount} composition={composition} onChange={setComposition} labelId={compositionLabelId} />
      {product.kind === "pack" && <p className="v3-pack-link-note"><Link2 /> Même lien par défaut. Avant la production, chaque support peut recevoir sa propre destination initiale.</p>}
      <div className="v3-field-block v3-field-destination">
        <span className="v3-field-label" id={linkLabelId}><b>{linkStep}</b><span>La destination</span><small>Ce que votre client ouvrira.</small></span>
        <select aria-label="Le lien à ouvrir" aria-describedby={linkLabelId} value={actionId} onChange={(event) => selectAction(event.target.value)}>
          {availableActions.map((action) => <option value={action.id} key={action.id}>{action.name}</option>)}
        </select>
        <label className={`v3-destination-field ${destinationInvalid ? "is-invalid" : ""}`}><Globe2 size={16} /><span><input type="url" value={destinationUrl} onFocus={markConfigurationStarted} onChange={(event) => setDestinationUrl(event.target.value.slice(0, 500))} placeholder="https://votre-lien.fr" aria-label="Adresse exacte à ouvrir" /><small>{destinationInvalid ? "Le lien doit commencer par https://" : "Adresse initiale encodée dans le NFC et le QR. Vous pouvez aussi la transmettre après la commande, avant production."}</small></span></label>
      </div>
      <div className="v3-field-block" role="group" aria-labelledby={designLabelId}>
        <span className="v3-field-label" id={designLabelId}><b>{designStep}</b><span>Le design</span><small>Prêt maintenant ou à votre image.</small></span>
        <div className="v3-design-choice">
          <button type="button" aria-pressed={personalization === "ready"} className={personalization === "ready" ? "is-selected" : ""} onClick={() => selectPersonalization("ready")}>
            <span><em>LE PLUS SIMPLE</em><strong>Prêt à l’emploi</strong><small>{safeCount > 1 ? `Tapote Noir ou Blanc · ${formatMoney(Math.round(readyChoicePrice / safeCount))} / support` : "Tapote Noir ou Blanc · aucune maquette à fournir"}</small></span><b>{formatMoney(readyChoicePrice)}</b>
          </button>
          <button type="button" aria-pressed={personalization === "custom"} className={personalization === "custom" ? "is-selected" : ""} onClick={() => selectPersonalization("custom")}>
            <span><em>À VOTRE IMAGE</em><strong>Studio en direct</strong><small>{safeCount > 1 ? `Logo et couleurs · ${formatMoney(Math.round(customChoicePrice / safeCount))} / support` : "Logo, textes et couleurs visibles immédiatement"}</small></span><b>{formatMoney(customChoicePrice)}</b>
          </button>
        </div>
        {personalization === "ready" && (
          <ReadyDesignPicker
            onChange={applyTheme}
            theme={theme}
          />
        )}
      </div>
      {personalization === "ready" && !compact && <div className="v3-field-block v3-personalization-panel v3-campaign-design-panel"><span className="v3-field-label">Design Tapote recommandé</span><div className="v3-campaign-design-note"><Sparkles /><span><strong>{campaignHeadlineForAction(actionId)}</strong><small>Composition optimisée automatiquement pour {ACTIONS[actionId].name}.</small></span><a href="/">Voir la collection <ArrowRight /></a></div></div>}
      {personalization === "custom" && (
        <div className="v3-field-block v3-branding-fields v3-personalization-panel v3-live-studio">
          <div className="v3-studio-heading"><span><Sparkles size={15} /><strong>Studio d’impression en direct</strong></span><small>Tout changement est visible immédiatement.</small></div>
          <div className="v3-studio-section">
            <span className="v3-field-label">Identité imprimée</span>
            <div className="v3-identity-grid">
              <input value={brandName} onChange={(event) => setBrandName(event.target.value.slice(0, 28))} placeholder="Nom de votre entreprise" aria-label="Nom de votre entreprise" />
              <label className={`v3-logo-upload is-${logoStatus}`}>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" onChange={uploadLogo} disabled={logoStatus === "loading"} />
                <Upload size={17} />
                <span><strong>{logoStatus === "loading" ? "Envoi sécurisé…" : brandLogo ? "Remplacer le logo" : "Ajouter votre logo"}</strong><small>PNG, JPG, WebP ou SVG · 2 Mo max.</small></span>
              </label>
            </div>
            {brandLogo && <div className="v3-uploaded-logo"><img src={brandLogo} alt="Aperçu du logo importé" /><span><strong>{logoFileName}</strong><small>{logoStatus === "success" ? "Affiché dans l’aperçu" : "À retransmettre"}</small></span><button type="button" onClick={removeLogo} aria-label="Retirer le logo"><X size={15} /></button></div>}
            {logoError && <p className="v3-upload-error" role="alert">{logoError} Retirez le fichier pour continuer sans logo.</p>}
          </div>
          <div className="v3-studio-section">
            <span className="v3-field-label">Textes imprimés</span>
            <div className="v3-live-copy-fields">
              <label className="is-wide"><span>Message principal <em>{customHeadline.length}/64</em></span><input value={customHeadline} onChange={(event) => setCustomHeadline(event.target.value.slice(0, 64))} placeholder={campaignHeadlineForAction(actionId)} aria-label="Message principal imprimé" /></label>
              <label className="is-wide"><span>Phrase secondaire <em>{customSubline.length}/90</em></span><input value={customSubline} onChange={(event) => setCustomSubline(event.target.value.slice(0, 90))} placeholder={ACTIONS[actionId].campaignSubline || ACTIONS[actionId].subline} aria-label="Phrase secondaire imprimée" /></label>
              <label><span>Appel à l’action <em>{customTapLabel.length}/32</em></span><input value={customTapLabel} onChange={(event) => setCustomTapLabel(event.target.value.slice(0, 32))} placeholder="Tapotez ici" aria-label="Appel à l’action imprimé" /></label>
            </div>
          </div>
          <div className="v3-studio-section">
            <span className="v3-field-label">Couleur du support</span>
            {/* Deux déclinaisons du design Tapote : c'est le choix par défaut.
                Le réglage couleur par couleur reste possible, mais replié. */}
            <div className="v3-theme-choice" role="group" aria-label="Déclinaison de couleur">
              {Object.keys(DEVICE_THEMES).map((themeId) => (
                <button
                  type="button"
                  key={themeId}
                  className={theme === themeId ? "is-selected" : ""}
                  aria-pressed={theme === themeId}
                  onClick={() => applyTheme(themeId)}
                >
                  <span aria-hidden="true" style={{ background: DEVICE_THEMES[themeId].paper, color: DEVICE_THEMES[themeId].ink, borderColor: DEVICE_THEMES[themeId].ink }}>Aa</span>
                  <b>{THEME_LABELS[themeId]}</b>
                </button>
              ))}
            </div>
            <details className="v3-advanced-colors">
              <summary>Utiliser mes propres couleurs</summary>
            <div className="v3-brand-colors" aria-label="Couleurs de votre identité">
            <label><span>Couleur principale</span><div><input type="color" value={primaryColor} onChange={(event) => { setPrimaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur principale" /><code>{primaryColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setPrimaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur principale à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <label><span>Couleur secondaire</span><div><input type="color" value={secondaryColor} onChange={(event) => { setSecondaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur secondaire" /><code>{secondaryColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setSecondaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur secondaire à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <label><span>Couleur du texte</span><div><input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur du texte" /><code>{textColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setTextColor(color); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur du texte à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <small>{manualPalettePreserved ? "Logo importé : vos couleurs choisies ont été conservées." : paletteDetected ? "Palette détectée depuis votre logo. Ajustez-la si besoin." : "Choisissez les trois couleurs ou conservez la proposition Tapote."} Le contraste d’impression est sécurisé automatiquement et le QR reste noir sur blanc.</small>
            </div>
            </details>
          </div>
          <p className="v3-studio-contract"><CheckCircle2 size={15} /><span><strong>Vous commandez ce que vous voyez.</strong><small>Pas de brief ni de validation ultérieure : contrôlez l’aperçu avant l’ajout au panier.</small></span></p>
        </div>
      )}
      <div className="v3-buybox-summary" ref={summaryRef}>
        <div><small>{product.name} · {ACTIONS[actionId].name}{personalization === "ready" ? ` · ${THEME_LABELS[resolveThemeId(theme)]}` : ""}</small><strong>{formatMoney(product.price)} <span>{taxLabel}</span></strong><em>{shipping === 0 ? "Livraison offerte" : `+ ${formatMoney(shipping)} de livraison`}</em></div>
        <button type="button" onClick={add} disabled={logoPending || destinationInvalid}>{logoPending ? logoPendingLabel : destinationInvalid ? "Vérifier le lien" : added ? <><Check size={18} /> Ajouté</> : <>Ajouter au panier <ArrowRight size={18} /></>}</button>
      </div>
      <div className="v3-buy-reassurance"><span><ShieldCheck size={16} /> Paiement sécurisé</span><span><PackageCheck size={16} /> Encodé et testé</span><span><Clock3 size={16} /> {STOREFRONT_PROMISES.fulfillment}</span><span><CheckCircle2 size={16} /> Remplacement si défaut NFC confirmé</span></div>
      {productOnly && <aside className={`v3-mobile-product-cta ${summaryVisible ? "is-summary-visible" : ""}`} aria-label="Résumé de la configuration"><span><small>{product.kind === "pack" && composition ? compositionLabel(composition) : product.name.replace(/ · .+$/, "")}</small><strong>{formatMoney(product.price)} {taxLabel}</strong></span><button type="button" onClick={add} disabled={logoPending || destinationInvalid}>{destinationInvalid ? "Lien invalide" : added ? "Ajouté" : "Ajouter"} <ArrowRight /></button></aside>}
    </section>
  );
}

const HOME_SCENES = {
  comptoir: {
    slug: "chevalet",
    label: "Chevalet A6",
    image: "/assets/products/tapote-bg-cafe-empty-v3.png",
    subjectLayers: [
      { image: "/assets/products/tapote-restaurant-phone-hand-cutout-v1.png" },
    ],
    brandName: "CAFÉ NOMA",
    theme: "nuit",
    nativeAction: "avis",
  },
  plaque: { slug: "plaque", label: "Plaque 12 × 12", image: "/assets/products/tapote-bg-boulangerie-v1.webp", brandName: "MAISON LEVAIN", theme: "creme", nativeAction: "fidelite" },
  carte: { slug: "carte", label: "Carte NFC", image: "/assets/products/tapote-bg-artisan-v1.webp", brandName: "ATELIER MARTIN", theme: "creme", nativeAction: "contact" },
};

function OfferArchitectureSection() {
  const offers = [
    {
      id: "ready",
      eyebrow: "PRÊT À L’EMPLOI",
      title: "Tapote Noir ou Blanc.",
      copy: "Les deux signatures officielles, déjà composées. Choisissez la destination et le format : nous encodons, imprimons et contrôlons.",
      price: `Carte ${formatMoney(PRODUCTS.carte_standard.price)} · plaque ou chevalet ${formatMoney(PRODUCTS.plaque_standard.price)}`,
      href: "/boutique?activite=cafes-bars&support=comptoir&lien=avis&design=noir&count=1",
      cta: "Configurer un modèle prêt",
      art: [
        { surface: "carte", theme: "nuit", brandName: "tapote.", className: "is-card-black" },
        { surface: "carte", theme: "creme", brandName: "tapote.", className: "is-card-white" },
      ],
    },
    {
      id: "signature",
      eyebrow: "À VOTRE IMAGE · RECOMMANDÉ",
      title: "Votre identité, en situation.",
      copy: "Logo, palette, message et appel à l’action se règlent dans le studio. Le rendu visible est celui qui part avec la commande.",
      price: `Carte ${formatMoney(PRODUCTS.carte.price)} · plaque ou chevalet ${formatMoney(PRODUCTS.plaque.price)}`,
      href: "/personnaliser?activite=cafes-bars&support=comptoir&lien=avis&mode=custom&count=1",
      cta: "Ouvrir le studio",
      art: [
        { surface: "comptoir", theme: "nuit", brandName: "CAFÉ NOMA", personalization: "custom", className: "is-custom-easel" },
      ],
    },
    {
      id: "packs",
      eyebrow: "PACKS ÉQUIPEMENT",
      title: "Un support là où ça compte.",
      copy: "Duo pour deux moments clés, pack de cinq pour couvrir un lieu complet. La composition plaques / chevalets reste au choix.",
      price: `Duo dès ${formatMoney(PRODUCTS.pack_duo_standard.price)} · cinq dès ${formatMoney(PRODUCTS.pack_cinq_standard.price)}`,
      href: "/boutique?activite=cafes-bars&support=comptoir&lien=avis&design=blanc&count=2&composition=mix",
      cta: "Créer un pack",
      art: [
        { surface: "comptoir", theme: "creme", brandName: "tapote.", className: "is-pack-easel" },
        { surface: "plaque", theme: "nuit", brandName: "tapote.", className: "is-pack-plaque" },
      ],
    },
  ];
  return (
    <section className="v3-section v3-offer-architecture" aria-labelledby="v3-offer-title">
      <div className="v3-section-heading">
        <span className="v3-eyebrow">UNE OFFRE LISIBLE</span>
        <h2 id="v3-offer-title">Trois façons de commencer.<br />Une même qualité Tapote.</h2>
        <p>Prêt à l’emploi, à votre image ou en pack : chaque choix ouvre directement le configurateur avec le bon mode, le bon support et la bonne quantité.</p>
      </div>
      <div className="v3-offer-cards">
        {offers.map((offer) => (
          <article className={offer.id === "signature" ? "is-featured" : ""} key={offer.id}>
            <a className="v3-offer-visual" href={offer.href} aria-label={`${offer.cta} : ${offer.title}`}>
              <span>{offer.id === "ready" ? "2 DESIGNS" : offer.id === "signature" ? "APERÇU FIDÈLE" : "2 OU 5 SUPPORTS"}</span>
              <div>
                {offer.art.map((item) => (
                  <ProductArt
                    key={item.className}
                    surface={item.surface}
                    actionId="avis"
                    brandName={item.brandName}
                    theme={item.theme}
                    personalization={item.personalization || "ready"}
                    customHeadline={item.personalization ? "Votre avis compte." : ""}
                    className={item.className}
                  />
                ))}
              </div>
            </a>
            <div className="v3-offer-card-copy">
              <small>{offer.eyebrow}</small>
              <h3>{offer.title}</h3>
              <p>{offer.copy}</p>
              <strong>{offer.price}</strong>
              <a href={offer.href}>{offer.cta} <ArrowRight /></a>
            </div>
          </article>
        ))}
      </div>
      <p className="v3-offer-volume"><Layers3 /> Dix supports ou plus ? <a href="/devis">Recevoir une composition et un tarif adaptés</a>.</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// LA PAGE.
//
// Tapote vend trois objets. Il n'y a donc pas de boutique, pas de catalogue de
// secteurs, pas de galerie de designs : une seule page, pilotée par quatre
// sélecteurs qui recomposent la même scène en direct.
//
//   secteur  → le décor réel dans lequel l'objet est posé
//   lien     → le design imprimé ET l'écran qui s'ouvre sur le téléphone
//   support  → chevalet, plaque ou carte, à l'unité ou en pack
//   design   → prêt à l'emploi ou studio en direct (dans le BuyBox)
//
// Les anciennes URL (/boutique, /designs, /secteurs/…) pointent ici avec le
// secteur présélectionné : les liens existants et les pages indexées survivent.
// ---------------------------------------------------------------------------

function SectorSelector({ sectorId, onSelect }) {
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
        <span><small>Votre activité</small><strong>{activeSector.title}</strong></span>
        <span><small>{activeSector.category}</small><b>{open ? "Fermer" : `Changer · ${SECTORS.length} secteurs`}</b></span>
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
      <p className="v3-sector-context"><MapPin aria-hidden="true" /><span><strong>Conseil de pose</strong><small>{activeSector.placement}</small></span></p>
    </div>
  );
}

function HomePage({ onAdd, initialSector }) {
  const [sector, setSector] = useState(initialSector || SECTORS[0]);

  // Liens profonds : une campagne ou un ancien lien produit peut ouvrir la page
  // déjà réglée (?support=plaque&lien=menu&mode=custom&count=2).
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const [editIndex] = useState(() => {
    const rawValue = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("edit");
    if (rawValue === null || rawValue === "") return null;
    const value = Number(rawValue);
    return Number.isInteger(value) && value >= 0 ? value : null;
  });
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  const surfaceFromPath = path.startsWith("/produits/") ? PRODUCT_PAGES[path.split("/")[2]]?.key : path === "/categorie/chevalets-nfc" ? "comptoir" : path === "/categorie/plaques-nfc" ? "plaque" : path === "/categorie/cartes-nfc" ? "carte" : "";
  const requestedSurface = ["comptoir", "plaque", "carte"].includes(params.get("support")) ? params.get("support") : surfaceFromPath;
  const surface = requestedSurface || sectorDefaultSurface(sector);
  const requestedAction = ACTIONS[params.get("lien") || params.get("action")] ? (params.get("lien") || params.get("action")) : sector.actionIds[0];
  const requestedMode = params.get("mode") === "custom" ? "custom" : params.get("mode") === "ready" ? "ready" : "ready";
  const requestedTheme = themeFromReadyDesignParam(params.get("design"));
  const requestedCount = [1, 2, 5].includes(Number(params.get("count"))) ? Number(params.get("count")) : null;
  const recommendedCount = requestedCount || (sector.recommendedProductId === "pack_cinq" ? 5 : sector.recommendedProductId === "pack_duo" ? 2 : 1);
  const requestedComposition = params.get("composition") === "plaques"
    ? { comptoir: 0, plaque: recommendedCount }
    : params.get("composition") === "chevalets"
      ? { comptoir: recommendedCount, plaque: 0 }
      : params.get("composition") === "mix"
        ? recommendedCount === 2 ? { comptoir: 1, plaque: 1 } : { comptoir: 2, plaque: 3 }
        : requestedCount === 1
          ? surface === "plaque" ? { comptoir: 0, plaque: 1 } : surface === "carte" ? { comptoir: 0, plaque: 0 } : { comptoir: 1, plaque: 0 }
          : sector.composition;
  const [preview, setPreview] = useState({
    surface,
    actionId: requestedAction,
    brandName: sector.exampleBrand || "VOTRE MARQUE",
    theme: requestedTheme,
    customHeadline: readyHeadlineForAction(requestedAction),
    personalization: requestedMode,
    count: recommendedCount,
    composition: requestedComposition,
  });

  // Changer d'activité rejoue la scène et repositionne le BuyBox sur l'usage et
  // la composition recommandés pour ce métier : le remontage par `key` est
  // volontaire, c'est ce qui réinitialise proprement les quatre sélecteurs.
  const selectSector = (nextSector) => {
    setSector(nextSector);
    setPreview({
      surface: sectorDefaultSurface(nextSector),
      actionId: nextSector.actionIds[0],
      brandName: nextSector.exampleBrand || "VOTRE MARQUE",
      theme: DEFAULT_THEME,
      customHeadline: readyHeadlineForAction(nextSector.actionIds[0]),
      personalization: "ready",
      count: nextSector.recommendedProductId === "pack_cinq" ? 5 : nextSector.recommendedProductId === "pack_duo" ? 2 : 1,
      composition: nextSector.composition,
    });
  };

  // L'URL reflète la configuration affichée : le client peut partager, mettre en
  // favori ou revenir sur exactement la même scène, et les campagnes peuvent
  // pointer sur un réglage précis.
  useEffect(() => {
    const next = new URLSearchParams();
    next.set("activite", sector.slug);
    next.set("support", preview.surface === "mix" ? "comptoir" : preview.surface);
    next.set("lien", preview.actionId);
    next.set("design", readyDesignParam(preview.theme));
    if (preview.personalization === "custom") next.set("mode", "custom");
    next.set("count", String(preview.count));
    if (preview.count > 1) {
      next.set("composition", compositionParam(preview.composition));
    }
    if (editIndex !== null) next.set("edit", String(editIndex));
    const search = `?${next.toString()}`;
    if (window.location.search !== search) window.history.replaceState({}, "", `${window.location.pathname}${search}`);
  }, [editIndex, sector.slug, preview.actionId, preview.composition, preview.count, preview.personalization, preview.surface, preview.theme]);

  const handleAdd = (item) => onAdd(item, editIndex === null ? {} : { replaceIndex: editIndex, returnToCart: true });
  return (
    <main id="main-content">
      <section className="v3-sector-hero v3-home-hero">
        <div className="v3-home-visual">
          <SectorScene key={sector.id} sector={sector} preview={preview} className="v3-sector-image" />
        </div>
        <div className="v3-home-copy">
          <span className="v3-eyebrow"><Sparkles size={14} aria-hidden="true" /> SUPPORTS NFC + QR POUR PROFESSIONNELS</span>
          <h1>Le bon lien.<br />Au bon moment.</h1>
          <p className="v3-home-lead">Choisissez l’activité, la destination et le format. L’aperçu suit chaque choix, le prix aussi.</p>
          <div className="v3-home-proof" aria-label="Les essentiels inclus">
            <span><Check /> Prêt dès réception</span>
            <span><Link2 /> Lien initial configuré</span>
            <span><SmartphoneNfc /> NFC + QR</span>
          </div>
        </div>
        <div className="v3-sector-buy" id="composer">
          <SectorSelector sectorId={sector.id} onSelect={selectSector} />
          <BuyBox
            key={sector.id}
            onAdd={handleAdd}
            compact
            allowAllSurfaces
            initialSurface={surface}
            initialAction={requestedAction}
            initialCount={recommendedCount}
            initialComposition={requestedComposition}
            initialPersonalization={requestedMode}
            initialTheme={requestedTheme}
            initialBrandName={sector.exampleBrand || "VOTRE MARQUE"}
            initialReadyHeadline={readyHeadlineForAction(requestedAction)}
            targetId={sector.id}
            title={editIndex === null ? "Créez le vôtre." : "Mettez à jour votre Tapote."}
            onPreviewChange={setPreview}
            draftKey={editIndex === null ? `product:${surface}` : `cart:${editIndex}`}
          />
        </div>
      </section>
      <section className="v3-proof-band" aria-label="Garanties Tapote">
        <span><SmartphoneNfc /> NFC + QR sur chaque support</span>
        <span><Link2 /> Destination initiale configurée</span>
        <span><PackageCheck /> Encodé et testé avant envoi</span>
        <span><Truck /> Livraison offerte dès {formatMoney(SHIPPING.freeThreshold)}</span>
      </section>
      <HowStrip />
      <OfferArchitectureSection />
      <PilotMarketingSection />
      <WhyTapote />
    </main>
  );
}


function HowStrip() {
  return (
    <section className="v3-section v3-how-strip" aria-labelledby="v3-how-title">
      <div className="v3-section-heading"><span className="v3-eyebrow">DU CHOIX AU PREMIER TAP</span><h2 id="v3-how-title">Vous choisissez. On prépare. Vous posez.</h2><p>Pas de puce à encoder ni de QR à bricoler : la configuration suit votre commande jusqu’au contrôle final.</p></div>
      <div className="v3-step-grid">
        <article><b>01</b><Palette /><h3>Choisissez le style</h3><p>Tapote Noir ou Blanc, ou une création entièrement à votre image.</p></article>
        <article><b>02</b><Globe2 /><h3>Indiquez la destination</h3><p>Tout de suite ou après la commande, avant le lancement en production.</p></article>
        <article><b>03</b><FileCheck2 /><h3>Contrôlez le rendu</h3><p>Le support, le message et la destination restent réunis dans le récapitulatif.</p></article>
        <article><b>04</b><PackageCheck /><h3>Posez. C’est prêt.</h3><p>NFC et QR sont encodés puis testés sur téléphone avant l’envoi.</p></article>
      </div>
    </section>
  );
}

function PilotMarketingSection({ pageDetail = false }) {
  const activityBars = [36, 58, 44, 72, 63, 88, 76, 94, 68, 82, 100, 86];
  return (
    <section className="v3-pilot-story" id="pilot" aria-labelledby="v3-pilot-title">
      <div className="v3-pilot-orbit" aria-hidden="true">PILOT</div>
      <div className="v3-pilot-copy">
        <span className="v3-eyebrow"><Sparkles size={14} /> TAPOTE PILOT · POSTE DE CONTRÔLE</span>
        {pageDetail
          ? <h1 className="v3-pilot-page-title" id="v3-pilot-title">Un seul poste.<br />Tous vos Tapote.</h1>
          : <h2 id="v3-pilot-title">Le support reste.<br />Le lien évolue.</h2>}
        <p className="v3-pilot-lead">{pageDetail ? "Retrouvez les supports, les lieux, les destinations et les interactions dans une interface commune. Le tableau de bord reprend les mêmes repères que le vrai logiciel Tapote Pilot." : "Votre Tapote arrive configuré et fonctionne avec sa destination initiale. Quand votre menu, votre campagne ou votre priorité change, Pilot met à jour le prochain tap sans toucher au support."}</p>
        <div className="v3-pilot-price" aria-label={`Tapote Pilot, ${formatMoney(PILOT_PLANS.pilot.price)} par mois ou ${formatMoney(PILOT_PLANS.annual.price)} par an`}>
          <strong>{formatMoney(PILOT_PLANS.pilot.price)}</strong>
          <span>/ mois</span>
          <small>ou {formatMoney(PILOT_PLANS.annual.price)} / an</small>
        </div>
        <div className="v3-pilot-actions">
          <a href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a>
          <a className="is-quiet" href={pageDetail ? "#pilot-flow" : "/tapote-pilot"}>{pageDetail ? "Voir le fonctionnement" : "Voir comment ça marche"} <ArrowRight /></a>
        </div>
        <p className="v3-pilot-clarity"><Info size={15} /><span><b>Clair dès le départ.</b> L’achat du support n’ajoute aucun abonnement automatiquement. Pilot est requis pour modifier la destination après livraison.</span></p>
      </div>

      <div className="v3-pilot-product">
        <div className="v3-pilot-window" aria-hidden="true">
          <div className="v3-pilot-shell">
            <nav aria-label="Aperçu des sections Pilot">
              <span className="v3-pilot-mini-brand"><img src="/brand/tapote-logo-light.svg" alt="" /> <b>pilot</b></span>
              <small>ESPACE CLIENT</small>
              <strong>Café Noma</strong>
              <b className="is-action"><Link2 /> Changer un lien <ArrowRight /></b>
              <b className="is-active"><Grid3X3 /> Accueil</b>
              <span><SmartphoneNfc /> Mes supports</span>
              <span><Clock3 /> Historique</span>
              <span><Info /> Support</span>
            </nav>
            <div className="v3-pilot-panel">
              <div className="v3-pilot-dashboard-head">
                <span><small>PILOT · MESURE & ANALYSE</small><strong>Comprendre ce qui fonctionne</strong></span>
                <span className="v3-pilot-panel-price"><b>{formatMoney(PILOT_PLANS.pilot.price)}</b><small>/ mois</small></span>
              </div>
              <div className="v3-pilot-screen-features">
                <span>Stats par lieu</span><span>Périodes 7 / 30 / 90 jours</span><span>Part NFC / QR</span>
              </div>
              <div className="v3-pilot-screen-controls"><span>Établissement <b>Tous les établissements</b></span><span>Période <b>30 j</b></span></div>
              <section className="v3-pilot-analytics-preview">
                <div className="v3-pilot-analytics-total"><span>Interactions</span><strong>675</strong><small>↗ + 8 % <i>vs période précédente</i></small></div>
                <div className="v3-pilot-chart-preview">
                  <div><span>ÉVOLUTION</span><small>par jour</small></div>
                  <div className="v3-pilot-bars" role="img" aria-label="Exemple de graphique des interactions sur trente jours">
                    {activityBars.map((value, index) => <i className={[4, 8, 10].includes(index) ? "is-highlight" : ""} key={`${value}-${index}`} style={{ "--v3-pilot-bar": `${value}%` }} />)}
                  </div>
                  <footer><span>30 juin</span><span>29 juil.</span></footer>
                </div>
              </section>
              <div className="v3-pilot-screen-kpis">
                <span><small>PRODUITS ACTIFS</small><b>3 <i>/ 3</i></b></span>
                <span><small>PART NFC</small><b>72 %</b></span>
                <span><small>DERNIÈRE INTERACTION</small><b>Il y a 16 min</b></span>
              </div>
            </div>
          </div>
        </div>
        <div className="v3-pilot-feature-rail" aria-label="Fonctions clés de Tapote Pilot">
          <span><Link2 /><b>Changer</b><small>la destination à distance</small></span>
          <span><Layers3 /><b>Organiser</b><small>les supports et les lieux</small></span>
          <span><CircleDollarSign /><b>Mesurer</b><small>les interactions NFC + QR</small></span>
        </div>
      </div>
    </section>
  );
}

function PilotMarketingPage() {
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
      title: "Vous changez le lien",
      copy: "Depuis Pilot, remplacez l’ancienne destination par la nouvelle. Le support physique ne bouge pas.",
    },
    {
      number: "03",
      icon: CircleDollarSign,
      title: "Vous mesurez les usages",
      copy: "Comparez les interactions, les supports et les lieux sur 7, 30 ou 90 jours.",
    },
  ];
  const destinations = [
    { label: "Avis Google", detail: "Campagne permanente", active: false },
    { label: "Menu d’été", detail: "Actif maintenant", active: true },
    { label: "Réservation", detail: "Prochaine campagne", active: false },
  ];
  return (
    <main id="main-content" className="v3-pilot-page">
      <PilotMarketingSection pageDetail />

      <section className="v3-pilot-page-flow" id="pilot-flow" aria-labelledby="v3-pilot-flow-title">
        <div className="v3-pilot-page-flow-head">
          <span className="v3-eyebrow">SIMPLE PAR CONCEPTION</span>
          <h2 id="v3-pilot-flow-title">Un changement de campagne.<br />Pas un changement de matériel.</h2>
          <p>Le lien visible par vos clients évolue dans Pilot. La puce, le QR et le support restent exactement là où ils sont.</p>
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
          <div className="v3-pilot-destination-demo" aria-label="Exemple de changement de destination dans Tapote Pilot">
            <header><span><img src="/brand/tapote-logo-light.svg" alt="" /><b>PILOT</b></span><small>CAFÉ NOMA · 3 SUPPORTS</small></header>
            <div className="v3-pilot-destination-product">
              <ProductArt surface="comptoir" actionId="avis" brandName="CAFÉ NOMA" theme="nuit" personalization="custom" customHeadline="Votre avis compte." />
              <span><SmartphoneNfc /><b>Chevalet comptoir</b><small>Entrée principale</small></span>
            </div>
            <div className="v3-pilot-destination-list">
              <small>DESTINATION DU SUPPORT</small>
              {destinations.map((destination) => (
                <span className={destination.active ? "is-active" : ""} key={destination.label}>
                  <i>{destination.active ? <Check /> : <Link2 />}</i>
                  <b>{destination.label}</b>
                  <small>{destination.detail}</small>
                  {destination.active && <em>EN COURS</em>}
                </span>
              ))}
              <span className="v3-pilot-destination-apply">Appliquer ce lien <ArrowRight /></span>
            </div>
          </div>
        </div>
      </section>

      <section className="v3-pilot-page-value" aria-labelledby="v3-pilot-value-title">
        <div>
          <span className="v3-eyebrow">CE QUE PILOT AJOUTE</span>
          <h2 id="v3-pilot-value-title">Le contrôle utile.<br />Sans tableau de bord pour faire joli.</h2>
          <p>Chaque écran répond à une question concrète : quel support ouvre quoi, où est-il installé et quand est-il utilisé.</p>
        </div>
        <div className="v3-pilot-page-value-grid">
          <article><Link2 /><span>01</span><h3>Changer</h3><p>Une destination se remplace à distance, sans réencoder ni réimprimer.</p></article>
          <article><Layers3 /><span>02</span><h3>Organiser</h3><p>Les supports sont regroupés par lieu pour retrouver le bon objet immédiatement.</p></article>
          <article><CircleDollarSign /><span>03</span><h3>Mesurer</h3><p>Les interactions NFC + QR sont lisibles par période, lieu et support.</p></article>
          <article><Clock3 /><span>04</span><h3>Tracer</h3><p>L’historique garde la mémoire des changements de destination.</p></article>
        </div>
      </section>

      <section className="v3-pilot-page-plan" aria-labelledby="v3-pilot-plan-title">
        <div>
          <span className="v3-eyebrow">UNE OPTION, JAMAIS UNE SURPRISE</span>
          <h2 id="v3-pilot-plan-title">Votre Tapote fonctionne dès la livraison.</h2>
          <p>Pilot devient utile quand vous voulez faire évoluer le lien après la livraison ou suivre l’activité de plusieurs supports. Aucun abonnement n’est ajouté automatiquement à l’achat.</p>
        </div>
        <aside>
          <span>TAPOTE PILOT</span>
          <strong>{formatMoney(PILOT_PLANS.pilot.price)}<small>/ mois</small></strong>
          <p>ou {formatMoney(PILOT_PLANS.annual.price)} / an</p>
          <ul>
            <li><Check /> Changement de destination à distance</li>
            <li><Check /> Supports et lieux centralisés</li>
            <li><Check /> Statistiques NFC + QR</li>
            <li><Check /> Historique des modifications</li>
          </ul>
          <a href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a>
          <small>Déjà équipé ? Connectez-vous avec l’adresse liée à votre compte.</small>
        </aside>
      </section>
    </main>
  );
}

const WHY_TAPOTE = [
  { icon: CircleDollarSign, title: "Un prix produit complet", copy: "Support, impression, NFC, QR, configuration du lien initial et contrôle sont réunis dans le prix affiché." },
  { icon: FileCheck2, title: "Votre visuel avant l’achat", copy: "Logo, textes, palette et composition se règlent dans le studio puis sont enregistrés avec la commande." },
  { icon: Link2, title: "Un lien qui peut évoluer", copy: "Avec Tapote Pilot, changez la destination à distance sans réencoder ni réimprimer le support." },
  { icon: SmartphoneNfc, title: "NFC + QR testés un par un", copy: "Les deux accès sont vérifiés sur téléphone, support par support, avant la livraison." },
];

function WhyTapote() {
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

function HowPage() {
  const preview = { surface: "comptoir", actionId: "avis", brandName: "CAFÉ NOMA", theme: "nuit", customHeadline: "Vous avez aimé ? Tapotez.", personalization: "ready" };
  return (
    <main id="main-content">
      <header className="v3-how-hero"><div><span className="v3-eyebrow v3-eyebrow-dark">SANS APP · SANS FRICTION</span><h1>Tapote ouvre exactement la bonne page.</h1><p>Votre client approche son téléphone ou scanne le QR. L’avis, le menu, la réservation ou votre page s’ouvre immédiatement.</p><a href="/">Créer mon Tapote <ArrowRight /></a></div><ProductScene image={HOME_SCENES.comptoir.image} alt="Un client utilise un chevalet Tapote avec son téléphone" nativeAction={HOME_SCENES.comptoir.nativeAction} preview={preview} className="v3-how-scene" subjectLayers={HOME_SCENES.comptoir.subjectLayers} /></header>
      <section className="v3-link-flow"><article><SmartphoneNfc /><span>1</span><h2>Le client tapote</h2><p>Ou scanne le QR code. Aucune application n’est nécessaire.</p></article><ArrowRight /><article><Zap /><span>2</span><h2>Tapote redirige</h2><p>Le lien court du support appelle votre destination actuelle.</p></article><ArrowRight /><article><Globe2 /><span>3</span><h2>La bonne page s’ouvre</h2><p>Avis, menu, réservation, réseau social ou toute autre URL.</p></article></section>
      <section className="v3-section v3-change-link" id="pilot"><div><span className="v3-eyebrow">AVEC TAPOTE PILOT</span><h2>Vous ne touchez pas au support.</h2><p>Depuis Pilot, vous remplacez la destination. Le NFC et le QR continuent de fonctionner, car ils pointent toujours vers le même lien Tapote.</p><ul><li><Check /> Modifications à distance</li><li><Check /> Supports et lieux regroupés</li><li><Check /> Interactions NFC + QR suivies</li></ul><p className="v3-change-link-plan"><b>{formatMoney(PILOT_PLANS.pilot.price)} / mois</b> ou {formatMoney(PILOT_PLANS.annual.price)} / an · l’achat du support reste séparé.</p><a className="v3-change-link-cta" href="/connexion">Accéder à Tapote Pilot <ArrowRight /></a></div><div className="v3-link-console"><span>Destination active</span><strong>tapote.fr/t/<b>cafe-noma</b></strong><em>ouvre</em><div>https://g.page/r/…/review</div><span className="v3-link-console-action">Modifier dans Pilot</span></div></section>
    </main>
  );
}

function cartEditDescriptor(item, index) {
  const product = PRODUCTS[item.productId];
  const count = product.supportCount || 1;
  const composition = item.supportComposition || product.defaultComposition;
  const surface = product.kind === "pack"
    ? composition?.plaque === count ? "plaque" : "comptoir"
    : product.baseProductId;
  const slug = surface === "comptoir" ? "chevalet" : surface;
  const draftKey = `cart:${index}`;
  const params = new URLSearchParams({
    mode: product.personalization === "ready" ? "ready" : "custom",
    action: item.actionId,
    edit: String(index),
    draft: draftKey,
  });
  if (count > 1) {
    params.set("count", String(count));
    params.set("composition", compositionParam(composition));
  }
  return { href: `/produits/${slug}?${params.toString()}`, draftKey, count, composition };
}

function saveCartItemAsDraft(item, descriptor) {
  try {
    window.sessionStorage.setItem(`${CONFIG_DRAFT_PREFIX}${descriptor.draftKey}`, JSON.stringify({
      actionId: item.actionId,
      count: descriptor.count,
      composition: descriptor.composition,
      brandName: item.brandName || "",
      brandLogoId: item.brandLogoId || "",
      logoFileName: item.logoFileName || "",
      theme: item.theme || DEFAULT_THEME,
      customHeadline: item.customHeadline || "",
      customSubline: item.customSubline || "",
      customTapLabel: item.customTapLabel || "",
      destinationUrl: item.destinationUrl || "",
      primaryColor: item.primaryColor || "",
      secondaryColor: item.secondaryColor || "",
      textColor: item.textColor || "",
    }));
  } catch {
    // The edit link still works with the choices encoded in its URL.
  }
}

function CartLine({ item, index, onQuantity, onRemove }) {
  const product = PRODUCTS[item.productId];
  const action = ACTIONS[item.actionId];
  const editable = onQuantity && product.personalization !== "matched";
  const edit = editable ? cartEditDescriptor(item, index) : null;
  const cartTitle = product.kind === "pack"
    ? `${product.supportCount} supports · ${product.personalization === "ready" ? "Prêts à l’emploi" : "À votre image"}`
    : product.name.replace(/ · .+$/, "");
  return (
    <article className="v3-cart-line">
      <div className="v3-cart-art"><ProductArt surface={previewId(item.productId)} actionId={item.actionId} brandName={item.brandName || "VOTRE MARQUE"} brandLogo={getCachedLogoPreview(item.brandLogoId)} theme={item.theme} primaryColor={item.primaryColor} secondaryColor={item.secondaryColor} textColor={item.textColor} customHeadline={item.customHeadline} customSubline={item.customSubline} customTapLabel={item.customTapLabel} personalization={product.personalization === "ready" ? "ready" : "custom"} /></div>
      <div className="v3-cart-copy">
        <span>{product.personalization === "ready" ? "PRÊT À L’EMPLOI" : product.personalization === "matched" ? "ASSORTIE" : "À VOTRE IMAGE"}</span>
        <h2>{cartTitle}</h2>
        <dl className="v3-cart-configuration">
          <div><dt>Action</dt><dd>{action.name}{product.kind === "pack" && item.supportComposition ? ` · ${compositionLabel(item.supportComposition)}` : ""}</dd></div>
          {product.personalization === "ready" && <div><dt>Design</dt><dd>{THEME_LABELS[resolveThemeId(item.theme)]}</dd></div>}
          {item.brandName && <div><dt>Marque</dt><dd>{item.brandName}</dd></div>}
          
          <div><dt>Destination</dt><dd className={item.destinationUrl ? "is-ready" : "is-pending"}>{item.destinationUrl ? "Lien configuré" : "À fournir après commande"}</dd></div>
        </dl>
        <strong>{formatMoney(product.price * item.quantity)}</strong>
      </div>
      {onQuantity && <div className="v3-cart-actions">{edit && <a className="v3-cart-edit" href={edit.href} onClick={() => saveCartItemAsDraft(item, edit)}><FileCheck2 /> Modifier</a>}<div className="v3-cart-quantity"><button type="button" onClick={() => onQuantity(-1)} disabled={item.quantity <= 1} aria-label="Diminuer"><Minus /></button><b>{item.quantity}</b><button type="button" onClick={() => onQuantity(1)} aria-label="Augmenter"><Plus /></button></div><button className="v3-cart-remove" type="button" onClick={onRemove}><Trash2 /> Supprimer</button></div>}
    </article>
  );
}

function OrderSummary({ cart, action }) {
  const subtotal = cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0);
  const shipping = calculateShipping(subtotal);
  const freeShippingRemaining = Math.max(0, SHIPPING.freeThreshold - subtotal);
  const hasCustom = cart.some((item) => ["custom", "matched"].includes(PRODUCTS[item.productId].personalization));
  return <aside className="v3-order-summary"><span>RÉCAPITULATIF</span><dl><div><dt>Sous-total</dt><dd>{formatMoney(subtotal)}</dd></div><div><dt>Livraison</dt><dd>{shipping ? formatMoney(shipping) : "Offerte"}</dd></div><div><dt>Total {taxLabel}</dt><dd>{formatMoney(subtotal + shipping)}</dd></div></dl>{freeShippingRemaining > 0 ? <div className="v3-shipping-progress"><span>Encore <strong>{formatMoney(freeShippingRemaining)}</strong> pour la livraison offerte</span><i><b style={{ width: `${Math.min(100, subtotal / SHIPPING.freeThreshold * 100)}%` }} /></i></div> : <div className="v3-shipping-progress is-complete"><span><Check /> Livraison offerte débloquée</span></div>}<ul><li><ShieldCheck /> Paiement sécurisé par Stripe</li><li><PackageCheck /> NFC testé + QR de secours inclus</li>{hasCustom && <li><FileCheck2 /> Configuration personnalisée enregistrée</li>}<li><Clock3 /> {STOREFRONT_PROMISES.fulfillment}</li><li><Link2 /> Destination initiale configurée</li></ul>{action}</aside>;
}

function CartPage({ cart, setCart, onAdd }) {
  const changeQuantity = (index, delta) => setCart((current) => current
    .map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + delta } : item)
    .filter((item) => item.quantity > 0));
  const supportTotal = physicalSupportCount(cart);
  const requiresQuote = supportTotal >= 10;
  const customSources = cart.filter((item) => PRODUCTS[item.productId].personalization === "custom" && ["support", "pack"].includes(PRODUCTS[item.productId].kind));
  const customSourceIdentities = new Set(customSources.map(matchingIdentityKey));
  const hasSupport = customSources.length > 0;
  const hasMatchedCard = cart.some((item) => item.productId === "carte_assortie");
  const matchingSource = customSourceIdentities.size === 1 ? customSources[0] : null;
  const addMatchedCard = () => {
    if (!matchingSource) return;
    onAdd(makeCartItem("carte_assortie", matchingSource.actionId, {
      brandName: matchingSource.brandName,
      theme: matchingSource.theme,
      primaryColor: matchingSource.primaryColor,
      secondaryColor: matchingSource.secondaryColor,
      textColor: matchingSource.textColor,
      targetId: matchingSource.targetId,
      customHeadline: matchingSource.customHeadline,
      customSubline: matchingSource.customSubline,
      customTapLabel: matchingSource.customTapLabel,
      destinationUrl: matchingSource.destinationUrl,
      brandLogoId: matchingSource.brandLogoId,
      logoFileName: matchingSource.logoFileName,
    }));
  };
  return (
    <main id="main-content" className="v3-purchase-page">
      <header><span className="v3-eyebrow">VOTRE COMMANDE</span><h1>Votre panier.</h1><p>Simple à vérifier. Facile à modifier.</p></header>
      {!cart.length ? <section className="v3-empty-cart"><ShoppingBag /><h2>Votre panier est vide.</h2><p>Commencez par le support le plus utile à votre activité.</p><a href="/">Créer mon Tapote <ArrowRight /></a></section> : <div className="v3-purchase-layout"><section className="v3-cart-lines">{cart.map((item, index) => <CartLine item={item} index={index} onQuantity={(delta) => changeQuantity(index, delta)} onRemove={() => setCart((current) => current.filter((_, itemIndex) => itemIndex !== index))} key={`${itemFingerprint(item)}-${index}`} />)}{hasSupport && !hasMatchedCard && matchingSource && <button className="v3-cart-upsell" type="button" onClick={addMatchedCard}><Plus /><span><strong>Ajouter la carte assortie — 19 €</strong><small>Même identité graphique et même action que votre support personnalisé.</small></span></button>}{hasSupport && !hasMatchedCard && !matchingSource && <div className="v3-volume-notice"><Layers3 /><span><strong>Plusieurs identités sont dans ce panier.</strong><small>Configurez séparément la carte à assortir pour choisir sans ambiguïté sa marque et son usage.</small></span></div>}{requiresQuote && <div className="v3-volume-notice"><Layers3 /><span><strong>{supportTotal} supports : un devis sera plus juste.</strong><small>À partir de 10, nous vérifions la composition, les lieux et les coûts avant de vous proposer le tarif le plus juste.</small></span></div>}</section><OrderSummary cart={cart} action={requiresQuote ? <a className="v3-primary-cta" href="/devis">Demander un devis <ArrowRight /></a> : <a className="v3-primary-cta" href="/commande" onClick={() => trackStorefrontEvent("begin_checkout", { value: cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0) / 100, currency: "EUR", item_count: cart.length })}>Continuer vers la commande <ArrowRight /></a>} /></div>}
    </main>
  );
}

function CheckoutPage({ cart }) {
  const checkoutCanceled = new URLSearchParams(window.location.search).get("commande") === "annulee";
  const hasPack = cart.some((item) => PRODUCTS[item.productId].kind === "pack");
  const [attemptId] = useState(() => window.crypto.randomUUID());
  const [form, setForm] = useState({ businessName: "", email: "", destinationUrl: "", professionalCustomer: false, termsAccepted: false });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setStatus("loading"); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, items: cart, customer: { businessName: form.businessName, email: form.email, destinationUrl: form.destinationUrl }, professionalCustomer: form.professionalCustomer, termsAccepted: form.termsAccepted }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Le paiement est indisponible.");
      window.location.assign(data.url);
    } catch (requestError) { setStatus("error"); setError(requestError.message); }
  };
  if (!cart.length) return <main id="main-content" className="v3-purchase-page"><section className="v3-empty-cart"><ShoppingBag /><h1>Votre panier est vide.</h1><a href="/">Voir les produits <ArrowRight /></a></section></main>;
  if (physicalSupportCount(cart) >= 10) return <main id="main-content" className="v3-purchase-page"><section className="v3-empty-cart"><Layers3 /><span className="v3-eyebrow">10 SUPPORTS OU PLUS</span><h1>Votre projet mérite un devis.</h1><p>Nous validons la composition et les coûts avant de vous proposer le tarif le plus juste.</p><a href="/devis">Demander un devis <ArrowRight /></a></section></main>;
  return (
    <main id="main-content" className="v3-purchase-page">
      <header><span className="v3-eyebrow">COORDONNÉES & PAIEMENT</span><h1>Finalisez votre commande.</h1><p>Stripe recueillera ensuite vos adresses de facturation et de livraison.</p>{checkoutCanceled && <p className="v3-checkout-canceled" role="status">Le paiement a été annulé. Votre panier est intact et rien n’a été débité.</p>}</header>
      <div className="v3-purchase-layout"><form className="v3-checkout-form" onSubmit={submit}><label><span>Nom de l’entreprise *</span><input name="businessName" value={form.businessName} onChange={update} required autoComplete="organization" /></label><label><span>E-mail de commande *</span><input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" /></label><label><span>Lien principal à ouvrir <small>(facultatif maintenant)</small></span><input type="url" name="destinationUrl" value={form.destinationUrl} onChange={update} placeholder="https://…" pattern="https://.*" /></label><div className="v3-checkout-help"><Clock3 /><span>Vous ne connaissez pas encore le lien ? Laissez ce champ vide : nous vous aidons à le retrouver après la commande et avant le lancement en production.</span></div>{hasPack && <div className="v3-checkout-help"><Link2 /><span>Ce lien sera appliqué par défaut. Pendant la préparation, vous pourrez indiquer une destination initiale différente pour chaque support.</span></div>}<div className="v3-checkout-help"><Info /><span>Après livraison, le changement de destination à distance nécessite Tapote Pilot. Aucun abonnement n’est ajouté à cette commande.</span></div><label className="v3-checkbox"><input type="checkbox" name="professionalCustomer" checked={form.professionalCustomer} onChange={update} required /><span>Je commande pour mon activité professionnelle.</span></label><label className="v3-checkbox"><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} required /><span>J’accepte les <a href="/cgv" target="_blank">CGV</a> et la <a href="/confidentialite" target="_blank">politique de confidentialité</a>.</span></label><button className="v3-primary-cta" type="submit" disabled={status === "loading"}>{status === "loading" ? "Connexion à Stripe…" : <>Payer en toute sécurité <ArrowRight /></>}</button><div className="v3-checkout-payment-note"><ShieldCheck /><span><strong>Carte bancaire via Stripe</strong><small>Tapote ne stocke jamais vos données bancaires.</small></span></div>{error && <p className="v3-form-error" role="alert">{error}</p>}</form><div><section className="v3-checkout-lines">{cart.map((item, index) => <CartLine item={item} key={`${itemFingerprint(item)}-${index}`} />)}</section><OrderSummary cart={cart} /></div></div>
    </main>
  );
}

function QuotePage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", need: "", consent: false, website: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const websiteFieldId = useId();
  const update = (event) => setForm((current) => ({
    ...current,
    [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
  }));
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
      setMessage("Demande reçue. Nous revenons vers vous avec une proposition précise.");
      trackStorefrontEvent("lead_submit", { lead_type: "volume_quote" });
      setForm({ name: "", email: "", company: "", need: "", consent: false, website: "" });
    } catch (requestError) {
      setStatus("error");
      setMessage(requestError.message);
    }
  };
  return (
    <main id="main-content" className="v3-quote-page">
      <section className="v3-quote-intro">
        <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>Devis</b></nav>
        <span className="v3-eyebrow v3-eyebrow-dark">10 SUPPORTS OU PLUS</span>
        <h1>Votre projet.<br />Un tarif clair.</h1>
        <p>Indiquez les lieux, le nombre de supports et l’usage recherché. Nous préparons une composition adaptée, sans vous imposer un pack inutile.</p>
        <ul><li><Check /> Plaques et chevalets mixables</li><li><Check /> Un design cohérent, décliné par lieu</li><li><Check /> Un lien différent par support si nécessaire</li><li><Check /> NFC + QR contrôlés avant l’envoi</li></ul>
      </section>
      <form className="v3-quote-form" onSubmit={submit}>
        <div><span>DEMANDE PROFESSIONNELLE</span><h2>Parlez-nous du besoin.</h2><p>Quelques lignes suffisent. Aucun engagement.</p></div>
        <label className="v3-form-honeypot" htmlFor={websiteFieldId} aria-hidden="true"><span>Site web</span><input id={websiteFieldId} name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" aria-hidden="true" /></label>
        <label><span>Votre nom *</span><input name="name" value={form.name} onChange={update} required autoComplete="name" /></label>
        <label><span>E-mail professionnel *</span><input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" /></label>
        <label><span>Entreprise</span><input name="company" value={form.company} onChange={update} autoComplete="organization" /></label>
        <label><span>Besoin, lieux et volumes *</span><textarea name="need" value={form.need} onChange={update} rows="6" required placeholder="Ex. 3 restaurants, 12 chevalets personnalisés pour le menu et les avis…" /></label>
        <label className="v3-checkbox"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required /><span>J’accepte que Tapote utilise ces informations pour répondre à ma demande.</span></label>
        <button className="v3-primary-cta" type="submit" disabled={status === "loading"}>{status === "loading" ? "Envoi…" : <>Recevoir une proposition <ArrowRight /></>}</button>
        {message && <p className={`v3-form-message is-${status}`} role="status" aria-live="polite">{message}</p>}
      </form>
    </main>
  );
}

function ConfirmationPage({ setCart }) {
  const sessionId = new URLSearchParams(window.location.search).get("session_id") || "";
  const [status, setStatus] = useState(sessionId ? "checking" : "error");
  const [orderReference, setOrderReference] = useState("");
  const purchaseTrackedRef = useRef(false);
  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    let timer;
    let attempt = 0;
    const verify = async () => {
      try {
        const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`); const data = await response.json();
        if (!response.ok) throw new Error();
        if (!active) return;
        const nextStatus = ["paid", "demo", "expired", "payment_failed", "processing"].includes(data.status) ? data.status : "error";
        setStatus(nextStatus);
        if (data.reference) setOrderReference(`TAP-${String(data.reference).split("-")[0].toUpperCase()}`);
        if (["paid", "demo"].includes(data.status)) {
          if (data.status === "paid" && !purchaseTrackedRef.current) {
            purchaseTrackedRef.current = true;
            trackStorefrontEvent("purchase", { transaction_id: data.reference || sessionId });
          }
          setCart([]);
          return;
        }
        if (["expired", "payment_failed"].includes(nextStatus)) return;
        attempt += 1;
        if (attempt < 5) timer = window.setTimeout(verify, 1500);
        else setStatus("pending");
      } catch { if (active) setStatus("error"); }
    };
    void verify(); return () => { active = false; window.clearTimeout(timer); };
  }, [sessionId, setCart]);
  const success = ["paid", "demo"].includes(status);
  const content = {
    checking: ["VÉRIFICATION", "Nous vérifions votre paiement.", "Ne relancez pas le paiement tant que la vérification est en cours."],
    processing: ["VÉRIFICATION", "Le paiement est en traitement.", "La confirmation peut prendre quelques instants. Ne relancez pas encore la commande."],
    pending: ["TOUJOURS EN ATTENTE", "Stripe n’a pas encore confirmé le paiement.", "Vérifiez votre e-mail. En cas de doute, contactez Tapote avant toute nouvelle tentative."],
    paid: ["COMMANDE CONFIRMÉE", "Merci. On s’occupe de la suite.", "Votre configuration est enregistrée. Nous contrôlons maintenant le NFC et le QR avant production."],
    demo: ["COMMANDE DE DÉMONSTRATION", "Le parcours de test est terminé.", "Aucune somme n’a été débitée."],
    expired: ["SESSION EXPIRÉE", "La session de paiement a expiré.", "Aucun paiement n’a été confirmé. Votre panier est conservé et vous pouvez reprendre la commande."],
    payment_failed: ["PAIEMENT NON ABOUTI", "Le paiement n’a pas été confirmé.", "Aucune commande ne partira en production. Votre panier est conservé pour réessayer."],
    error: ["VÉRIFICATION IMPOSSIBLE", "Nous ne pouvons pas confirmer la commande.", "Vérifiez votre e-mail ou contactez Tapote avant de recommencer un paiement."],
  }[status] || ["VÉRIFICATION", "Nous vérifions votre paiement.", "Patientez quelques instants."];
  const retryAllowed = ["expired", "payment_failed"].includes(status);
  return <main id="main-content" className={`v3-confirmation ${success ? "is-success" : ""}`}><div>{success ? <CheckCircle2 /> : ["checking", "processing", "pending"].includes(status) ? <CreditCard /> : <X />}</div><span className="v3-eyebrow">{content[0]}</span><h1>{content[1]}</h1>{orderReference && <strong className="v3-order-reference">Référence {orderReference}</strong>}<p>{content[2]}</p>{retryAllowed && <a href="/commande">Reprendre la commande <ArrowRight /></a>}{!retryAllowed && <a href={status === "error" ? "/panier" : "/"}>{status === "error" ? "Voir mon panier" : "Retour à l’accueil"} <ArrowRight /></a>}</main>;
}

function LegalPage({ type }) {
  const content = {
    "mentions-legales": {
      title: "Mentions légales",
      intro: "Informations relatives à l’éditeur et au fonctionnement du site tapote.fr.",
      sections: [
        ["Éditeur", `${LEGAL_DETAILS.company} · ${LEGAL_DETAILS.capital}\n${LEGAL_DETAILS.address}\n${LEGAL_DETAILS.registration} · ${LEGAL_DETAILS.vat}`],
        ["Publication et contact", `Direction de la publication : ${LEGAL_DETAILS.director}\nContact : ${LEGAL_DETAILS.contact}`],
        ["Hébergement", LEGAL_DETAILS.host],
        ["Propriété intellectuelle", "La marque Tapote, les textes, interfaces, visuels de produits et éléments graphiques du site sont protégés. Toute reproduction ou exploitation non autorisée est interdite."],
      ],
    },
    cgv: {
      title: "Conditions générales de vente",
      intro: `Version ${LEGAL_DETAILS.version} · Boutique réservée aux clients professionnels.`,
      sections: [
        ["1. Offre et commande", "Les caractéristiques essentielles, la finition, la quantité, la personnalisation et le prix sont affichés avant paiement. La commande devient ferme après confirmation du paiement. Aucun abonnement n’est présélectionné."],
        ["2. Prix, réductions et paiement", `Les montants unitaires et les réductions de packs sont affichés en euros ${taxLabel} avant validation. Le paiement est comptant, par carte via Stripe ; aucun escompte pour paiement anticipé n’est appliqué. Les coordonnées bancaires ne sont jamais stockées par Tapote. En cas de somme exceptionnellement exigible et impayée à son échéance, les pénalités courent dès le lendemain, sans rappel, au taux de refinancement de la BCE majoré de 10 points et au minimum à trois fois le taux d’intérêt légal. Une indemnité forfaitaire de 40 € pour frais de recouvrement est due, sans préjudice des frais supplémentaires justifiés.`],
        ["3. Personnalisation en direct", "Pour la gamme Studio en direct, le logo, les couleurs, les textes, la composition et la destination enregistrés au panier constituent le fichier de production. Le client doit contrôler l’aperçu et reste responsable des textes, liens, logos et droits d’utilisation des éléments transmis."],
        ["4. Préparation et livraison", `La livraison standard en France métropolitaine coûte ${formatMoney(SHIPPING.standardPrice)} et est offerte dès ${formatMoney(SHIPPING.freeThreshold)}. Le délai applicable est confirmé lors de la prise en charge et commence après le paiement de la commande.`],
        ["5. Conformité et réclamations", `Chaque NFC et chaque QR code sont contrôlés avant expédition. Une non-conformité ou une avarie doit être signalée avec les éléments utiles afin d’organiser la prise en charge. Contact et retours : ${LEGAL_DETAILS.returnsAddress}`],
        ["6. Annulation et responsabilité", "Une demande d’annulation peut être étudiée avant le lancement de la préparation. Tapote ne répond pas de la disponibilité ni du contenu des destinations externes choisies par le client. Les responsabilités qui ne peuvent légalement être exclues restent applicables."],
        ["7. Droit applicable", `Les présentes conditions sont soumises au droit français. Les parties rechercheront d’abord une solution amiable. Contact contractuel : ${LEGAL_DETAILS.contact}.`],
      ],
    },
    confidentialite: {
      title: "Politique de confidentialité",
      intro: "Tapote limite les données collectées à ce qui est utile pour répondre, fabriquer, livrer et sécuriser le service.",
      sections: [
        ["Données et finalités", "Coordonnées professionnelles, commande, fichiers de personnalisation, destinations et données techniques sont utilisés pour exécuter la commande, assurer le support, prévenir les abus et respecter les obligations comptables."],
        ["Bases légales", "Les traitements reposent selon le cas sur l’exécution du contrat, une obligation légale ou l’intérêt légitime de sécuriser et améliorer le service. Les données ne sont pas vendues."],
        ["Prestataires", "Stripe traite le paiement ; Supabase héberge les données et fichiers nécessaires ; Resend peut acheminer les e-mails transactionnels ; l’hébergeur technique sert le site. Seules les données nécessaires leur sont transmises."],
        ["Durées", `Les pièces et données de facturation sont archivées pendant 10 ans lorsqu’une obligation comptable l’impose. Pour les autres données, Tapote applique la politique suivante : ${LEGAL_DETAILS.dataRetention}`],
        ["Vos droits", `Vous pouvez demander l’accès, la rectification, l’effacement ou la limitation lorsque ces droits s’appliquent, ainsi que vous opposer à certains traitements. Contact : ${LEGAL_DETAILS.privacyContact}. Vous pouvez également saisir la CNIL.`],
      ],
    },
  }[type];
  return <main id="main-content" className="v3-legal"><nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>{content.title}</b></nav><span className="v3-eyebrow">INFORMATIONS CONTRACTUELLES</span><h1>{content.title}</h1><p className="v3-legal-intro">{content.intro}</p><div className="v3-legal-sections">{content.sections.map(([title, body]) => <section key={title}><h2>{title}</h2>{body.split("\n").map((line) => <p key={line}>{line}</p>)}</section>)}</div><p className="v3-legal-updated">Document contractuel : {LEGAL_DETAILS.version}</p></main>;
}

function NotFound() {
  return <main id="main-content" className="v3-not-found"><span>404</span><h1>Cette page n’existe pas.</h1><a href="/">Retour à la boutique <ArrowRight /></a></main>;
}

export default function StorefrontV3() {
  const [cart, setCart] = useState(loadCart);
  const [cartNotice, setCartNotice] = useState("");
  const [catalogState, setCatalogState] = useState({ loaded: false, availableProductIds: null });
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  useEffect(() => { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  useEffect(() => {
    captureStorefrontAttribution();
    if (path.startsWith("/secteurs/") && findSectorBySlug(path.split("/")[2])) {
      trackStorefrontEvent("view_sector", { sector_slug: path.split("/")[2] });
    }
  }, [path]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { headers: { Accept: "application/json" }, signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("catalog_unavailable")))
      .then((payload) => setCatalogState({
        loaded: true,
        availableProductIds: new Set((payload.products || []).filter((product) => product.online && product.availableStock !== 0).map((product) => product.productId)),
      }))
      .catch((error) => { if (error.name !== "AbortError") setCatalogState({ loaded: false, availableProductIds: null }); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const [title, description] = pageMetadata(path);
    const canonicalUrl = `https://tapote.fr${path === "/" ? "" : path}`;
    const privateRoute = path.startsWith("/panier") || path.startsWith("/commande") || !isKnownStorefrontPath(path);
    document.title = title;
    setMetaContent("name", "description", description);
    setMetaContent("name", "robots", privateRoute ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    setMetaContent("property", "og:title", title);
    setMetaContent("property", "og:description", description);
    setMetaContent("property", "og:url", canonicalUrl);
    setMetaContent("name", "twitter:title", title);
    setMetaContent("name", "twitter:description", description);
    setCanonicalUrl(canonicalUrl);
  }, [path]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const addToCart = (item, options = {}) => {
    const normalized = { ...item, quantity: normalizedQuantity(item.quantity) };
    if (catalogState.loaded && !catalogState.availableProductIds?.has(normalized.productId)) {
      setCartNotice("Ce produit n’est momentanément pas disponible. Le catalogue vient d’être actualisé.");
      return;
    }
    setCart((current) => {
      if (Number.isInteger(options.replaceIndex) && current[options.replaceIndex]) {
        return current.map((entry, itemIndex) => itemIndex === options.replaceIndex ? normalized : entry);
      }
      const fingerprint = itemFingerprint(normalized);
      const index = current.findIndex((entry) => itemFingerprint(entry) === fingerprint);
      if (index < 0) return [...current, normalized];
      return current.map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: Math.min(MAX_ITEM_QUANTITY, entry.quantity + normalized.quantity) } : entry);
    });
    const product = PRODUCTS[normalized.productId];
    const notice = product.kind === "pack"
      ? `${product.supportCount} supports · ${product.personalization === "custom" ? "À votre image" : "Prêts à l’emploi"} · ${ACTIONS[normalized.actionId].name}${normalized.supportComposition ? ` · ${compositionLabel(normalized.supportComposition)}` : ""}`
      : `${product.name.replace(/ · .+$/, "")} · ${ACTIONS[normalized.actionId].name}`;
    setCartNotice(Number.isInteger(options.replaceIndex) ? `Configuration mise à jour · ${notice}` : notice);
    trackStorefrontEvent("add_to_cart", {
      product_id: normalized.productId,
      product_name: product.name,
      action_id: normalized.actionId,
      personalization: product.personalization,
      quantity: normalized.quantity,
      value: product.price * normalized.quantity / 100,
      currency: "EUR",
      update: Number.isInteger(options.replaceIndex),
    });
    if (options.returnToCart) window.setTimeout(() => window.location.assign("/panier"), 120);
  };
  // La boutique, les fiches produit, la galerie de designs et les 15 pages
  // secteur sont fusionnées dans la page unique. Les anciennes adresses y
  // mènent, secteur présélectionné quand l'URL en désignait un : les liens
  // déjà diffusés et les pages indexées continuent de fonctionner.
  const sectorFromPath = path.startsWith("/secteurs/") ? findSectorBySlug(path.split("/")[2]) : null;
  const sectorFromQuery = findSectorBySlug(new URLSearchParams(window.location.search).get("activite") || "");
  const homeSector = sectorFromPath || sectorFromQuery || null;

  let page;
  if (isHomeSurface(path)) page = <HomePage onAdd={addToCart} initialSector={homeSector} />;
  else if (path === "/comment-ca-marche") page = <HowPage />;
  else if (path === "/tapote-pilot") page = <PilotMarketingPage />;
  else if (path === "/panier") page = <CartPage cart={cart} setCart={setCart} onAdd={addToCart} />;
  else if (path === "/devis") page = <QuotePage />;
  else if (path === "/commande") page = <CheckoutPage cart={cart} />;
  else if (path === "/commande/confirmee") page = <ConfirmationPage setCart={setCart} />;
  else if (["/mentions-legales", "/cgv", "/confidentialite"].includes(path)) page = <LegalPage type={path.slice(1)} />;
  else page = <NotFound />;
  return <Shell cartCount={cartCount} cartNotice={cartNotice} onCloseNotice={() => setCartNotice("")} compactCheckout={path.startsWith("/commande")}>{page}</Shell>;
}
