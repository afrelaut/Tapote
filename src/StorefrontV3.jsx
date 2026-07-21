import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Globe2,
  Layers3,
  Link2,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  Palette,
  Pipette,
  Play,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SmartphoneNfc,
  Sparkles,
  Star,
  Trash2,
  Truck,
  Upload,
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
import { DevicePreview, prepareLogoFile, readFileAsDataUrl } from "./App.jsx";
import { extractLogoPalette, pickScreenColor } from "./brandColors.js";
import { DEVICE_THEMES, normalizeHexColor } from "./deviceThemes.js";
import { findSectorBySlug, SECTOR_CATEGORIES, SECTORS } from "./storefront/sectorData.js";

const MAX_ITEM_QUANTITY = 50;
const CART_KEY = "tapote-cart-v3";
const CONFIG_DRAFT_PREFIX = "tapote-config-draft-v1:";
const LOGO_PREVIEW_PREFIX = "tapote-logo-preview-v1:";
const FEATURED_ACTIONS = ["avis", "menu", "reservation", "instagram", "wifi", "multiliens"];
const READY_ACTION_IDS = ["avis", "fidelite", "menu", "reservation", "commande", "paiement", "instagram", "facebook", "linkedin", "wifi", "site", "contact", "whatsapp", "multiliens", "formulaire"];
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
const DESIGN_CATEGORIES = ["Tous", "Avis & fidélité", "Réseaux", "Vendre & servir", "Accès & contact"];
const DESIGN_PRESETS = [
  { id: "avis-signature", title: "Votre avis compte.", description: "La demande d’avis nette et assumée, au moment de payer.", category: "Avis & fidélité", actionId: "avis", surface: "comptoir", theme: "blue", designStyle: "signature", brandName: "CAFÉ NOMA" },
  { id: "avis-minimal", title: "Dites-nous tout.", description: "Une version calme pour les lieux de soin et d’accueil.", category: "Avis & fidélité", actionId: "avis", surface: "plaque", theme: "sand", designStyle: "minimal", brandName: "MAISON CALME" },
  { id: "fidelite", title: "On vous garde une place.", description: "Carte de fidélité, avantages ou inscription au programme client.", category: "Avis & fidélité", actionId: "fidelite", surface: "comptoir", theme: "green", designStyle: "editorial", brandName: "MAISON LEVAIN" },
  { id: "instagram", title: "La suite sur Instagram.", description: "Votre univers social au bout d’un geste, sans recherche de pseudo.", category: "Réseaux", actionId: "instagram", surface: "plaque", theme: "rose", designStyle: "platform", brandName: "STUDIO LUNE" },
  { id: "facebook", title: "Retrouvez-nous ici.", description: "Page Facebook, actualités et communauté locale en accès direct.", category: "Réseaux", actionId: "facebook", surface: "plaque", theme: "blue", designStyle: "editorial", brandName: "LE LIEN LOCAL" },
  { id: "tiktok", title: "Voyez les coulisses.", description: "Une porte immédiate vers vos formats courts et vos créations.", category: "Réseaux", actionId: "tiktok", surface: "plaque", theme: "mono", designStyle: "signature", brandName: "LIGNE NOIRE" },
  { id: "linkedin", title: "Gardons le contact.", description: "Le profil ou la page entreprise dans une carte de rendez-vous.", category: "Réseaux", actionId: "linkedin", surface: "carte", theme: "blue", designStyle: "minimal", brandName: "ATELIER MARTIN" },
  { id: "menu", title: "La carte, juste ici.", description: "Le menu du jour toujours à jour, sans réimprimer le support.", category: "Vendre & servir", actionId: "menu", surface: "comptoir", theme: "green", designStyle: "editorial", brandName: "L’ATELIER 21" },
  { id: "reservation", title: "On se revoit quand ?", description: "La réservation posée naturellement à la fin de l’expérience.", category: "Vendre & servir", actionId: "reservation", surface: "plaque", theme: "rose", designStyle: "minimal", brandName: "STUDIO LUNE" },
  { id: "commande", title: "Commandez la suite.", description: "Catalogue, click & collect ou commande récurrente en un geste.", category: "Vendre & servir", actionId: "commande", surface: "comptoir", theme: "sand", designStyle: "platform", brandName: "FLEURS SAUVAGES" },
  { id: "paiement", title: "Réglez ici.", description: "Un lien de paiement lisible au comptoir, sur stand ou en mobilité.", category: "Vendre & servir", actionId: "paiement", surface: "plaque", theme: "blue", designStyle: "platform", brandName: "MOBILE CLUB" },
  { id: "pourboire", title: "Merci pour l’équipe.", description: "Le pourboire dématérialisé, proposé avec tact et sans friction.", category: "Vendre & servir", actionId: "pourboire", surface: "comptoir", theme: "sand", designStyle: "signature", brandName: "CAFÉ NOMA" },
  { id: "wifi", title: "Le Wi-Fi, sans demander.", description: "Le réseau invité et ses consignes accessibles dès l’arrivée.", category: "Accès & contact", actionId: "wifi", surface: "plaque", theme: "blue", designStyle: "minimal", brandName: "HÔTEL RIVAGE" },
  { id: "multiliens", title: "Tout est juste ici.", description: "Services, horaires et liens utiles réunis sur une seule page.", category: "Accès & contact", actionId: "multiliens", surface: "plaque", theme: "green", designStyle: "platform", brandName: "CAMPING DES PINS" },
  { id: "contact", title: "Gardons le contact.", description: "Téléphone, e-mail et WhatsApp dans une carte à emporter.", category: "Accès & contact", actionId: "contact", surface: "carte", theme: "sand", designStyle: "signature", brandName: "STUDIO GABRIEL" },
  { id: "whatsapp", title: "Écrivez-nous ici.", description: "Une conversation WhatsApp préremplie, prête à envoyer.", category: "Accès & contact", actionId: "whatsapp", surface: "carte", theme: "green", designStyle: "platform", brandName: "ATELIER MARTIN" },
  { id: "formulaire", title: "Votre demande commence ici.", description: "Inscription, devis ou demande générale sans papier à ressaisir.", category: "Accès & contact", actionId: "formulaire", surface: "plaque", theme: "blue", designStyle: "editorial", brandName: "CAMPUS 22" },
  { id: "site", title: "Découvrez la suite.", description: "Votre site ou une page précise, exactement au bon endroit.", category: "Accès & contact", actionId: "site", surface: "comptoir", theme: "mono", designStyle: "minimal", brandName: "LA GALERIE" },
];
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
  company: import.meta.env.VITE_LEGAL_COMPANY || "Tapote",
  capital: import.meta.env.VITE_LEGAL_CAPITAL || "À compléter avant l’ouverture commerciale",
  address: import.meta.env.VITE_LEGAL_ADDRESS || "Adresse communiquée avant la mise en ligne commerciale.",
  registration: import.meta.env.VITE_LEGAL_REGISTRATION || "Immatriculation communiquée avant la mise en ligne commerciale.",
  vat: import.meta.env.VITE_LEGAL_VAT || "Régime de TVA communiqué avant la mise en ligne commerciale.",
  director: import.meta.env.VITE_LEGAL_DIRECTOR || "Direction de la publication communiquée avant la mise en ligne commerciale.",
  contact: import.meta.env.VITE_LEGAL_CONTACT || "contact@tapote.fr",
  privacyContact: import.meta.env.VITE_LEGAL_PRIVACY_CONTACT || import.meta.env.VITE_LEGAL_CONTACT || "contact@tapote.fr",
  returnsAddress: import.meta.env.VITE_LEGAL_RETURNS_ADDRESS || "Adresse de retour communiquée lors de la prise en charge.",
  dataRetention: import.meta.env.VITE_LEGAL_DATA_RETENTION || "Durées opérationnelles détaillées à valider avant l’ouverture commerciale.",
  version: import.meta.env.VITE_LEGAL_VERSION || "à valider avant l’ouverture commerciale",
  host: import.meta.env.VITE_LEGAL_HOST || "Hébergement communiqué avant la mise en ligne commerciale.",
};

const isVatExempt = /non applicable|franchise en base/i.test(import.meta.env.VITE_LEGAL_VAT || "");
const taxLabel = isVatExempt ? "net de TVA" : "TTC";

function pageMetadata(path) {
  if (path === "/") return ["Supports NFC + QR prêts ou personnalisés | Tapote", "Chevalets, plaques et cartes NFC + QR. Design prêt à l’emploi ou personnalisé, lien modifiable à vie."];
  if (path === "/boutique" || path.startsWith("/categorie/")) return ["Boutique NFC + QR | Tapote", "Tous les chevalets, plaques, cartes et packs Tapote, prêts à l’emploi ou personnalisés."];
  if (path.startsWith("/produits/")) {
    const product = PRODUCT_PAGES[path.split("/")[2]];
    if (product) return [`${product.name} NFC + QR | Tapote`, `${product.description} Prêt à l’emploi ou personnalisé, avec lien modifiable à distance.`];
  }
  if (path === "/designs") return ["Designs NFC + QR | Tapote", "Découvrez les designs Tapote pour les avis, Instagram, Facebook, le Wi-Fi, les menus, les réservations et tous vos liens."];
  if (path === "/secteurs") return [`Tapote pour votre secteur | ${SECTORS.length} usages concrets`, "Découvrez les supports NFC + QR et les usages Tapote adaptés à votre métier."];
  if (path.startsWith("/secteurs/")) {
    const sector = findSectorBySlug(path.split("/")[2]);
    if (sector) return [`Tapote pour ${sector.title}`, `${sector.promise} ${sector.description}`];
  }
  if (path === "/personnaliser") return ["Créer mon Tapote personnalisé", "Préparez votre plaque, chevalet ou carte NFC avec votre logo, votre brief et votre action."];
  if (path === "/comment-ca-marche") return ["Comment fonctionne Tapote ?", "NFC, QR code, encodage et changement de destination à distance expliqués simplement."];
  if (path === "/panier") return ["Votre panier | Tapote", "Vérifiez vos supports Tapote, leur composition, la livraison et les options."];
  if (path === "/devis") return ["Devis volume et multi-sites | Tapote", "Décrivez votre besoin de 10 supports ou plus et recevez une proposition Tapote claire et adaptée."];
  if (path.startsWith("/commande")) return ["Finaliser la commande | Tapote", "Finalisez votre commande professionnelle Tapote via Stripe."];
  if (path === "/mentions-legales") return ["Mentions légales | Tapote", "Informations relatives à l’éditeur, à la publication et à l’hébergement du site Tapote."];
  if (path === "/cgv") return ["Conditions générales de vente B2B | Tapote", "Conditions applicables aux commandes professionnelles de supports NFC + QR Tapote."];
  if (path === "/confidentialite") return ["Politique de confidentialité | Tapote", "Informations sur les données traitées par Tapote et les droits des professionnels."];
  return ["Page introuvable | Tapote", "La page demandée n’existe pas ou a été déplacée."];
}

function isKnownStorefrontPath(path) {
  if (["/", "/boutique", "/designs", "/secteurs", "/personnaliser", "/comment-ca-marche", "/panier", "/devis", "/commande", "/commande/confirmee", "/mentions-legales", "/cgv", "/confidentialite"].includes(path)) return true;
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
    return parsed.filter((item) => PRODUCTS[item.productId] && ACTIONS[item.actionId]);
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
    theme: options.theme || "blue",
    primaryColor: normalizeHexColor(options.primaryColor, ""),
    secondaryColor: normalizeHexColor(options.secondaryColor, ""),
    textColor: normalizeHexColor(options.textColor, ""),
    targetId: options.targetId || "cafe",
    designStyle: options.designStyle || "signature",
    customHeadline: options.customHeadline || "",
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

function productPresentation(data, preview) {
  const count = preview.count || 1;
  if (count <= 1) return {
    label: data.name,
    kicker: data.kicker,
    title: data.title,
    description: data.description,
    placements: data.placements,
    size: data.size,
    technical: data.technical,
    uses: data.uses,
    inBox: data.inBox,
  };

  const composition = preview.composition || (count === 5 ? { comptoir: 2, plaque: 3 } : { comptoir: 1, plaque: 1 });
  const label = compositionLabel(composition) || `${count} supports`;
  const hasChevalets = composition.comptoir > 0;
  const hasPlaques = composition.plaque > 0;
  const isMixed = hasChevalets && hasPlaques;
  const formatParts = [];
  if (hasChevalets) formatParts.push(`${composition.comptoir} chevalet${composition.comptoir > 1 ? "s" : ""} A6`);
  if (hasPlaques) formatParts.push(`${composition.plaque} plaque${composition.plaque > 1 ? "s" : ""} 12 × 12`);

  return {
    label: `Pack ${label}`,
    kicker: `${count} POINTS DE CONTACT COHÉRENTS`,
    title: "Le pack qui couvre vraiment votre lieu.",
    description: isMixed
      ? `Un même univers graphique sur ${label} : les chevalets restent visibles et les plaques se placent au plus près du geste.`
      : hasPlaques
        ? `${count} plaques PMMA cohérentes à répartir sur vos comptoirs, bureaux ou tables, avec un lien modifiable pour chaque emplacement.`
        : `${count} chevalets A6 cohérents à répartir aux endroits les plus visibles, avec un lien modifiable pour chaque emplacement.`,
    placements: isMixed ? "Accueil · caisse · comptoir · table" : hasPlaques ? "Comptoirs · bureaux · tables" : "Accueils · caisses · tables",
    size: formatParts.join(" + "),
    technical: [
      `${count} supports imprimés dans une identité cohérente`,
      ...(hasChevalets ? ["Chevalets A6 avec supports transparents réutilisables"] : []),
      ...(hasPlaques ? ["Plaques PMMA rigides proches de 12 × 12 cm"] : []),
      "Un NFC et un QR testés individuellement sur chaque support",
    ],
    uses: [
      "Couvrir plusieurs moments du parcours client",
      "Conserver un design cohérent dans tout le lieu",
      "Attribuer gratuitement un lien différent à chaque support après la commande",
    ],
    inBox: `${label}, ${count} puces NFC configurées et ${count} QR codes associés. Chaque support est imprimé, encodé et testé séparément.`,
  };
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
      <span><FileCheck2 size={14} /> Personnalisation & BAT inclus</span>
      <span><Truck size={14} /> Livraison offerte dès {formatMoney(SHIPPING.freeThreshold)}</span>
      <span><Link2 size={14} /> Lien modifiable à vie</span>
    </div>
  );
}

function Header({ cartCount, compact = false }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("v3-menu-open", open);
    return () => document.body.classList.remove("v3-menu-open");
  }, [open]);
  if (compact) return (
    <header className="v3-header v3-checkout-header">
      <Brand />
      <div><span><ShieldCheck /> Paiement sécurisé</span><a href="/panier">Retour au panier</a></div>
    </header>
  );
  return (
      <header className="v3-header">
        <Brand />
        <nav className={open ? "is-open" : ""} aria-label="Navigation principale">
          <a href="/boutique" onClick={() => setOpen(false)}>Acheter</a>
          <a href="/secteurs" onClick={() => setOpen(false)}>Secteurs</a>
          <a href="/designs" onClick={() => setOpen(false)}>Designs</a>
          <a href="/comment-ca-marche" onClick={() => setOpen(false)}>Comment ça marche</a>
          <a className="v3-mobile-login" href="/connexion" onClick={() => setOpen(false)}>Connexion</a>
        </nav>
        <div className="v3-header-actions">
          <a className="v3-login" href="/connexion">Connexion</a>
          <a className="v3-cart-button" href="/panier" aria-label={`Voir le panier, ${cartCount} article(s)`}>
            <ShoppingBag size={18} /><span>Panier</span>{cartCount > 0 && <b>{cartCount}</b>}
          </a>
          <button className="v3-mobile-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open}>
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
        <div><Brand /><p>Un geste. Le bon lien.<br />À votre image.</p></div>
        <div><strong>Produits</strong><a href="/boutique">Toute la boutique</a><a href="/produits/chevalet">Chevalet A6</a><a href="/produits/plaque">Plaque 12 × 12</a><a href="/produits/carte">Carte NFC</a><a href="/designs">Tous les designs</a></div>
        <div><strong>Découvrir</strong><a href="/secteurs">Tous les secteurs</a><a href="/designs">Tous les designs</a><a href="/comment-ca-marche">Comment ça marche</a><a href="/#pilot">Tapote Pilot</a><a href="/devis">Devis volume</a></div>
        <div><strong>Votre espace</strong><a href="/connexion">Connexion</a><a href="/pilot">Ouvrir Pilot</a><a href="mailto:contact@tapote.fr">Support</a></div>
      </div>
      <div className="v3-footer-bottom"><span>© 2026 Tapote</span><a href="/mentions-legales">Mentions légales</a><a href="/cgv">CGV</a><a href="/confidentialite">Confidentialité</a></div>
    </footer>
  );
}

function CartNotice({ notice, onClose }) {
  if (!notice) return null;
  return <aside className="v3-cart-notice" role="status" aria-live="polite"><div><CheckCircle2 /><span><strong>Ajouté au panier</strong><small>{notice}</small></span><button type="button" onClick={onClose} aria-label="Fermer"><X /></button></div><span><button type="button" onClick={onClose}>Continuer mes achats</button><a href="/panier">Voir le panier <ArrowRight /></a></span></aside>;
}

function Shell({ cartCount, cartNotice, onCloseNotice, compactCheckout = false, children }) {
  return <div className="v3-site"><a className="v3-skip" href="#main-content">Aller au contenu</a>{!compactCheckout && <UtilityBar />}<Header cartCount={cartCount} compact={compactCheckout} />{children}<CartNotice notice={cartNotice} onClose={onCloseNotice} />{!compactCheckout && <Footer />}</div>;
}

function ProductArt({ surface = "comptoir", actionId = "avis", brandName = "VOTRE MARQUE", brandLogo = "", theme = "blue", primaryColor = "", secondaryColor = "", textColor = "", designStyle = "signature", customHeadline = "", className = "" }) {
  return <div className={`v3-product-art ${className}`}><DevicePreview productId={surface} actionId={actionId} brandName={brandName} brandLogo={brandLogo} theme={theme} primaryColor={primaryColor} secondaryColor={secondaryColor} textColor={textColor} designStyle={designStyle} customHeadline={customHeadline} /></div>;
}

function LivePhoneScreen({ actionId = "avis", brandName = "VOTRE MARQUE", className = "", native = false }) {
  const screen = PHONE_SCREENS[actionId] || PHONE_SCREENS.autre;
  const socialNetwork = ["instagram", "facebook", "linkedin", "tiktok"].includes(actionId) ? actionId : "";
  const safeBrandName = brandName || "VOTRE MARQUE";
  const handle = `@${safeBrandName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "votre.marque"}`;
  return (
    <div className={`v3-live-phone-screen is-action-${actionId} ${native ? "is-native-screen" : ""} ${className}`} role={native ? undefined : "img"} aria-hidden={native || undefined} aria-label={native ? undefined : `Écran du téléphone après ouverture : ${ACTIONS[actionId]?.name || "lien"}`}>
      <svg className="v3-live-phone-svg" viewBox="0 0 1254 1254" preserveAspectRatio="none" aria-hidden="true">
        <defs><clipPath id="tapote-phone-screen-shape" clipPathUnits="userSpaceOnUse"><path d="M678 311 C654 315 638 337 648 367 L849 910 C861 946 884 962 914 955 L1163 900 C1193 894 1206 870 1191 839 L900 309 C888 287 866 278 842 282 Z" /></clipPath></defs>
        <path className="v3-live-phone-mask" d="M678 311 C654 315 638 337 648 367 L849 910 C861 946 884 962 914 955 L1163 900 C1193 894 1206 870 1191 839 L900 309 C888 287 866 278 842 282 Z" />
        <foreignObject x="0" y="0" width="1254" height="1254" clipPath="url(#tapote-phone-screen-shape)">
          <div className="v3-live-phone-canvas" xmlns="http://www.w3.org/1999/xhtml">
            <div className="v3-live-phone-ui">
        <div className="v3-live-phone-status"><span>11:25</span><i /><b>5G</b></div>
        <div className="v3-live-phone-browser"><span>‹</span><strong>{screen.overline}</strong><i>•••</i></div>
        {socialNetwork ? <div className="v3-live-phone-social">
          <div className={`v3-live-platform-logo is-${socialNetwork}`} aria-hidden="true"><i>{socialNetwork === "facebook" ? "f" : socialNetwork === "linkedin" ? "in" : socialNetwork === "tiktok" ? "♪" : ""}</i></div>
          <div><h3>{safeBrandName}</h3><span>{handle}</span></div>
          <dl><div><dt>128</dt><dd>publications</dd></div><div><dt>4,8 k</dt><dd>abonnés</dd></div><div><dt>246</dt><dd>abonnements</dd></div></dl>
          <span className="v3-live-phone-cta">{socialNetwork === "linkedin" ? "Suivre la page" : "Suivre"}</span>
          <div className="v3-live-social-grid"><i /><i /><i /><i /><i /><i /></div>
        </div> : <div className="v3-live-phone-content">
          <small>{safeBrandName}</small>
          <h3>{screen.title}</h3>
          {actionId === "avis" ? <strong className="v3-google-rating"><span><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></span><b>Avis Google</b></strong> : <strong className={`v3-phone-detail is-${actionId}`}>{actionId === "paiement" ? " Pay   ·   G Pay" : screen.detail}</strong>}
          <p>{screen.helper}</p>
          <span className="v3-live-phone-cta">{screen.cta}</span>
        </div>}
              <i className="v3-live-phone-home" />
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}

function sectorDefaultSurface(sector) {
  if (sector.recommendedProductId === "carte" || (!sector.composition?.comptoir && !sector.composition?.plaque)) return "carte";
  return sector.composition?.comptoir > 0 ? "comptoir" : "plaque";
}

function ProductScene({ image, alt, nativeAction = "avis", preview, compact = false, className = "" }) {
  const nativeScreen = preview.actionId === nativeAction && preview.personalization !== "custom";
  const isMixedPack = preview.surface === "mix";
  return (
    <div className={`v3-sector-scene ${compact ? "is-compact" : ""} is-surface-${preview.surface} ${className}`} aria-hidden={compact || undefined}>
      <img className="v3-sector-scene-background" src={image} alt={compact ? "" : alt} loading={compact ? "lazy" : "eager"} />
      {isMixedPack ? <div className="v3-sector-scene-support v3-sector-scene-support-mix">
        <ProductArt {...preview} surface="comptoir" className="is-mix-comptoir" />
        <ProductArt {...preview} surface="plaque" className="is-mix-plaque" />
      </div> : <ProductArt key={`${preview.surface}-${preview.actionId}-${preview.designStyle}-${preview.primaryColor}-${preview.secondaryColor}-${preview.textColor}-${preview.brandName}`} {...preview} className="v3-sector-scene-support" />}
      <LivePhoneScreen key={`${preview.actionId}-${preview.brandName}-${preview.personalization}`} actionId={preview.actionId} brandName={preview.brandName} className="v3-sector-scene-screen" native={nativeScreen} />
    </div>
  );
}

function SectorScene({ sector, preview, compact = false, className = "" }) {
  return <ProductScene image={sector.image} alt={`Tapote utilisé dans un univers ${sector.title}`} nativeAction={sector.actionIds[0]} preview={preview} compact={compact} className={className} />;
}

function CompositionPicker({ count, composition, onChange }) {
  if (count === 1) return null;
  const choices = count === 2
    ? [
      { label: "2 chevalets", value: { comptoir: 2, plaque: 0 } },
      { label: "1 + 1", value: { comptoir: 1, plaque: 1 } },
      { label: "2 plaques", value: { comptoir: 0, plaque: 2 } },
    ]
    : [
      { label: "5 chevalets", value: { comptoir: 5, plaque: 0 } },
      { label: "Mix recommandé", value: { comptoir: 2, plaque: 3 } },
      { label: "5 plaques", value: { comptoir: 0, plaque: 5 } },
    ];
  return (
    <div className="v3-field-block">
      <span className="v3-field-label">Votre composition</span>
      <div className="v3-choice-row v3-choice-row-three">
        {choices.map((choice) => {
          const selected = choice.value.comptoir === composition.comptoir && choice.value.plaque === composition.plaque;
          return <button type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => onChange(choice.value)} key={choice.label}>{choice.label}</button>;
        })}
      </div>
    </div>
  );
}

function BuyBox({ onAdd, initialSurface = "comptoir", initialAction = "avis", initialCount = 1, initialComposition, initialPersonalization = "ready", initialTheme = "blue", initialBrandName = "VOTRE MARQUE", targetId = "cafe", title = "Choisissez votre Tapote.", productOnly = false, compact = false, allowAllSurfaces = false, onPreviewChange, draftKey = "" }) {
  const initialColors = DEVICE_THEMES[initialTheme] || DEVICE_THEMES.blue;
  const restoredDraft = useMemo(() => initialPersonalization === "custom" ? loadConfigDraft(draftKey) : null, [draftKey, initialPersonalization]);
  const [personalization, setPersonalization] = useState(initialPersonalization);
  const [surface, setSurface] = useState(initialSurface);
  const [count, setCount] = useState(initialCount);
  const [actionId, setActionId] = useState(initialAction);
  const [composition, setComposition] = useState(initialComposition || (initialCount === 5 ? { comptoir: 2, plaque: 3 } : { comptoir: 1, plaque: 1 }));
  const [brandName, setBrandName] = useState(restoredDraft?.brandName || initialBrandName);
  const [brandLogoId, setBrandLogoId] = useState(restoredDraft?.brandLogoId || "");
  const [brandLogo, setBrandLogo] = useState(() => getCachedLogoPreview(restoredDraft?.brandLogoId));
  const [logoFileName, setLogoFileName] = useState(restoredDraft?.logoFileName || "");
  const [designStyle, setDesignStyle] = useState(restoredDraft?.designStyle || "signature");
  const [customHeadline, setCustomHeadline] = useState(restoredDraft?.customHeadline || "");
  const theme = initialTheme;
  const [primaryColor, setPrimaryColor] = useState(restoredDraft?.primaryColor || initialColors.paper);
  const [secondaryColor, setSecondaryColor] = useState(restoredDraft?.secondaryColor || initialColors.accent);
  const [textColor, setTextColor] = useState(restoredDraft?.textColor || initialColors.ink);
  const summaryRef = useRef(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [paletteDetected, setPaletteDetected] = useState(false);
  const [colorsManuallyEdited, setColorsManuallyEdited] = useState(false);
  const [manualPalettePreserved, setManualPalettePreserved] = useState(false);
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
  const readyUnitPrice = PRODUCTS[getProductId(surface, "ready", 1)].price;
  const customUnitPrice = PRODUCTS[getProductId(surface, "custom", 1)].price;
  const shipping = calculateShipping(product.price);
  const availableActions = personalization === "ready" ? READY_ACTION_IDS.map((id) => ACTIONS[id]) : Object.values(ACTIONS);
  const selectPersonalization = (value) => {
    setPersonalization(value);
    if (value === "ready" && !READY_ACTION_IDS.includes(actionId)) setActionId("avis");
  };
  const previewSurface = compositionSurface(safeCount, composition, surface);
  useEffect(() => {
    onPreviewChange?.({ surface: previewSurface, baseSurface: surface, actionId, brandName: brandName || "VOTRE MARQUE", brandLogo, theme, primaryColor: personalization === "custom" ? primaryColor : "", secondaryColor: personalization === "custom" ? secondaryColor : "", textColor: personalization === "custom" ? textColor : "", designStyle, customHeadline: "", personalization, count: safeCount, composition, productId, productName: product.name, price: product.price });
  }, [actionId, brandLogo, brandName, composition, designStyle, onPreviewChange, personalization, previewSurface, primaryColor, product.name, product.price, productId, safeCount, secondaryColor, surface, textColor, theme]);
  useEffect(() => {
    if (!draftKey || personalization !== "custom") return;
    try {
      window.sessionStorage.setItem(`${CONFIG_DRAFT_PREFIX}${draftKey}`, JSON.stringify({ actionId, count: safeCount, composition, brandName, brandLogoId, logoFileName, designStyle, customHeadline, primaryColor, secondaryColor, textColor }));
    } catch { /* A full browser storage area must never block configuration or checkout. */ }
  }, [actionId, brandLogoId, brandName, composition, customHeadline, designStyle, draftKey, logoFileName, personalization, primaryColor, safeCount, secondaryColor, textColor]);
  const selectCount = (value) => {
    setCount(value);
    if (productOnly && initialSurface === "comptoir") {
      setComposition({ comptoir: value, plaque: 0 });
    } else if (productOnly && initialSurface === "plaque") {
      setComposition({ comptoir: 0, plaque: value });
    } else {
      setComposition(value === 2 ? { comptoir: 1, plaque: 1 } : { comptoir: 2, plaque: 3 });
    }
  };
  const selectSurface = (value) => {
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
    if (logoStatus === "loading" || (brandLogo && !brandLogoId)) return;
    onAdd(makeCartItem(productId, actionId, {
      targetId,
      supportComposition: composition,
      brandName: personalization === "custom" ? brandName : "",
      brandLogoId: personalization === "custom" ? brandLogoId : "",
      logoFileName: personalization === "custom" ? logoFileName : "",
      designStyle,
      theme,
      primaryColor: personalization === "custom" ? primaryColor : "",
      secondaryColor: personalization === "custom" ? secondaryColor : "",
      textColor: personalization === "custom" ? textColor : "",
      customHeadline: personalization === "custom" ? customHeadline : "",
    }));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };
  return (
    <section id={productOnly ? "configurer" : undefined} className={`v3-buybox ${compact ? "is-compact" : ""}`} aria-label="Configurer l’achat">
      <div className="v3-buybox-top"><span className="v3-rating"><Star size={14} fill="currentColor" /> Conçu pour les pros</span><span>NFC + QR · Sans application</span></div>
      <div className="v3-buybox-intro"><div><h2>{title}</h2><p>{personalization === "custom" ? "Votre logo, vos couleurs et un BAT à valider avant impression." : "Un design Tapote prêt à servir, vers le lien de votre choix."} Le lien reste modifiable à vie.</p></div></div>
      <div className="v3-field-block">
        <span className="v3-field-label">1. Votre design</span>
        <div className="v3-design-choice">
          <button type="button" aria-pressed={personalization === "ready"} className={personalization === "ready" ? "is-selected" : ""} onClick={() => selectPersonalization("ready")}>
            <span><strong>Prêt à l’emploi</strong><small>Design Tapote au choix</small></span><b>{formatMoney(readyUnitPrice)}</b>
          </button>
          <button type="button" aria-pressed={personalization === "custom"} className={personalization === "custom" ? "is-selected" : ""} onClick={() => selectPersonalization("custom")}>
            <span><strong>À votre image</strong><small>Logo, brief et BAT inclus</small></span><b>{formatMoney(customUnitPrice)}</b>
          </button>
        </div>
      </div>
      {personalization === "ready" && !compact && <div className="v3-field-block v3-personalization-panel"><span className="v3-field-label">Votre modèle Tapote</span><div className="v3-ready-designs">{[{ id: "signature", name: "Signature" }, { id: "editorial", name: "Éditorial" }, { id: "platform", name: "Impact" }].map((style) => <button type="button" aria-pressed={designStyle === style.id} className={designStyle === style.id ? `is-selected is-${style.id}` : `is-${style.id}`} onClick={() => setDesignStyle(style.id)} key={style.id}><i />{style.name}</button>)}</div></div>}
      {personalization === "custom" && (
        <div className="v3-field-block v3-branding-fields v3-personalization-panel">
          <span className="v3-field-label">Votre identité <small>facultatif maintenant</small></span>
          <input value={brandName} onChange={(event) => setBrandName(event.target.value.slice(0, 28))} placeholder="Nom de votre entreprise" aria-label="Nom de votre entreprise" />
          <label className={`v3-logo-upload is-${logoStatus}`}>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" onChange={uploadLogo} disabled={logoStatus === "loading"} />
            <Upload size={17} />
            <span><strong>{logoStatus === "loading" ? "Envoi sécurisé…" : brandLogo ? "Logo transmis" : "Ajouter votre logo"}</strong><small>PNG, JPG, WebP ou SVG · 2 Mo max.</small></span>
          </label>
          {brandLogo && <div className="v3-uploaded-logo"><img src={brandLogo} alt="Aperçu du logo importé" /><span><strong>{logoFileName}</strong><small>{logoStatus === "success" ? "Prêt pour le BAT" : "À retransmettre"}</small></span><button type="button" onClick={removeLogo} aria-label="Retirer le logo"><X size={15} /></button></div>}
          {logoError && <p className="v3-upload-error" role="alert">{logoError} Retirez le fichier pour continuer sans logo.</p>}
          <div className="v3-brand-colors" aria-label="Couleurs de votre identité">
            <label><span>Couleur principale</span><div><input type="color" value={primaryColor} onChange={(event) => { setPrimaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur principale" /><code>{primaryColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setPrimaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur principale à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <label><span>Couleur secondaire</span><div><input type="color" value={secondaryColor} onChange={(event) => { setSecondaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur secondaire" /><code>{secondaryColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setSecondaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur secondaire à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <label><span>Couleur du texte</span><div><input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur du texte" /><code>{textColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setTextColor(color); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur du texte à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <small>{manualPalettePreserved ? "Logo importé : vos couleurs choisies ont été conservées." : paletteDetected ? "Palette détectée depuis votre logo. Ajustez-la si besoin." : "Choisissez les trois couleurs ou conservez la proposition Tapote."} Le QR reste noir sur blanc.</small>
          </div>
          <label className="v3-design-brief"><span>Votre brief <small>facultatif</small></span><input value={customHeadline} onChange={(event) => setCustomHeadline(event.target.value.slice(0, 64))} placeholder="Ex. élégant, chaleureux, minimal…" aria-label="Brief de design" /><small>Notre équipe prépare ensuite un BAT sur mesure à valider.</small></label>
        </div>
      )}
      {!productOnly && (!isCard || allowAllSurfaces) && (
        <div className="v3-field-block">
          <span className="v3-field-label">2. Vos supports</span>
          <div className={`v3-choice-row ${allowAllSurfaces ? "v3-choice-row-three" : ""}`}>
            <button type="button" aria-pressed={surface === "comptoir"} className={surface === "comptoir" ? "is-selected" : ""} onClick={() => selectSurface("comptoir")}>Chevalet</button>
            <button type="button" aria-pressed={surface === "plaque"} className={surface === "plaque" ? "is-selected" : ""} onClick={() => selectSurface("plaque")}>Plaque</button>
            {allowAllSurfaces && <button type="button" aria-pressed={surface === "carte"} className={surface === "carte" ? "is-selected" : ""} onClick={() => selectSurface("carte")}>Carte</button>}
          </div>
        </div>
      )}
      {!isCard && (
        <div className="v3-field-block">
          <span className="v3-field-label">{productOnly ? "2" : "3"}. Combien ?</span>
          <div className="v3-quantity-choice">
            {[1, 2, 5].map((value) => {
              const optionId = getProductId(surface, personalization, value);
              return <button type="button" aria-label={`${value} ${value === 1 ? "support" : "supports"} · ${formatMoney(PRODUCTS[optionId].price)}`} aria-pressed={count === value} className={count === value ? "is-selected" : ""} onClick={() => selectCount(value)} key={value}><strong>{value}</strong><span>{value === 1 ? "support" : "supports"}</span><b>{formatMoney(PRODUCTS[optionId].price)}</b>{value === 2 && personalization === "custom" && <em>Populaire</em>}</button>;
            })}
          </div>
        </div>
      )}
      <CompositionPicker count={safeCount} composition={composition} onChange={setComposition} />
      {product.kind === "pack" && <p className="v3-pack-link-note"><Link2 /> Même lien par défaut. Après la commande, chaque support pourra recevoir gratuitement son propre lien.</p>}
      <div className="v3-field-block">
        <span className="v3-field-label">{isCard ? "2" : productOnly ? "3" : "4"}. Le lien à ouvrir</span>
        <select aria-label="Le lien à ouvrir" value={actionId} onChange={(event) => setActionId(event.target.value)}>
          {availableActions.map((action) => <option value={action.id} key={action.id}>{action.name}</option>)}
        </select>
      </div>
      <div className="v3-buybox-summary" ref={summaryRef}>
        <div><small>{product.name}</small><strong>{formatMoney(product.price)} <span>{taxLabel}</span></strong><em>{shipping === 0 ? "Livraison offerte" : `+ ${formatMoney(shipping)} de livraison`}</em></div>
        <button type="button" onClick={add} disabled={logoStatus === "loading" || Boolean(brandLogo && !brandLogoId)}>{logoStatus === "loading" ? "Envoi du logo…" : added ? <><Check size={18} /> Ajouté</> : <>Ajouter au panier <ArrowRight size={18} /></>}</button>
      </div>
      <div className="v3-buy-reassurance"><span><ShieldCheck size={16} /> Paiement sécurisé</span><span><PackageCheck size={16} /> Encodé et testé</span><span><Link2 size={16} /> Changement de lien gratuit</span><span><CheckCircle2 size={16} /> Remplacement si défaut NFC confirmé</span></div>
      {productOnly && <aside className={`v3-mobile-product-cta ${summaryVisible ? "is-summary-visible" : ""}`} aria-label="Résumé de la configuration"><span><small>{product.kind === "pack" && composition ? compositionLabel(composition) : product.name.replace(/ · .+$/, "")}</small><strong>{formatMoney(product.price)} {taxLabel}</strong></span><button type="button" onClick={add} disabled={logoStatus === "loading" || Boolean(brandLogo && !brandLogoId)}>{added ? "Ajouté" : "Ajouter"} <ArrowRight /></button></aside>}
    </section>
  );
}

const HOME_SCENES = {
  comptoir: { slug: "chevalet", label: "Chevalet A6", image: "/assets/products/tapote-bg-cafe-v1.webp", brandName: "CAFÉ NOMA", theme: "blue", nativeAction: "avis" },
  plaque: { slug: "plaque", label: "Plaque 12 × 12", image: "/assets/products/tapote-bg-boulangerie-v1.webp", brandName: "MAISON LEVAIN", theme: "sand", nativeAction: "fidelite" },
  carte: { slug: "carte", label: "Carte NFC", image: "/assets/products/tapote-bg-artisan-v1.webp", brandName: "ATELIER MARTIN", theme: "sand", nativeAction: "contact" },
};

function HomePage({ onAdd }) {
  const [demoAction, setDemoAction] = useState("avis");
  const [heroSurface, setHeroSurface] = useState("comptoir");
  const [heroAction, setHeroAction] = useState("avis");
  const heroScene = HOME_SCENES[heroSurface];
  const heroPreview = { surface: heroSurface, actionId: heroAction, brandName: heroScene.brandName, theme: heroScene.theme, designStyle: "signature", customHeadline: "", personalization: "ready" };
  const productLink = `/produits/${heroScene.slug}?action=${heroAction}`;
  return (
    <main id="main-content">
      <section className="v3-commerce-hero">
        <div className="v3-commerce-visual">
          <ProductScene key={`${heroSurface}-${heroAction}`} image={heroScene.image} alt={`${heroScene.label} Tapote utilisé par un client avec son téléphone`} nativeAction={heroScene.nativeAction} preview={heroPreview} className="v3-home-product-scene" />
          <div className="v3-visual-caption"><span>{heroScene.label}</span><strong>{ACTIONS[heroAction].name} s’ouvre sur le téléphone.</strong><small>NFC + QR · lien modifiable à vie</small></div>
        </div>
        <div className="v3-commerce-buy">
          <span className="v3-eyebrow"><Sparkles size={14} /> LE BON LIEN, AU BON MOMENT</span>
          <h1>Un geste.<br />Le bon lien.</h1>
          <p className="v3-home-lead">Choisissez un support et le lien à ouvrir. Nous l’encodons, le testons et vous le livrons prêt à servir.</p>
          <div className="v3-home-quick-buy">
            <fieldset><legend>1. Le support</legend><div>{Object.entries(HOME_SCENES).map(([surface, scene]) => <button type="button" aria-pressed={heroSurface === surface} className={heroSurface === surface ? "is-selected" : ""} onClick={() => setHeroSurface(surface)} key={surface}><strong>{scene.label}</strong><small>{surface === "comptoir" ? "Visible au comptoir" : surface === "plaque" ? "Compacte et bien lisible" : "À présenter en main"}</small></button>)}</div></fieldset>
            <label><span>2. Le lien à ouvrir</span><select value={heroAction} onChange={(event) => setHeroAction(event.target.value)}>{READY_ACTION_IDS.map((id) => <option value={id} key={id}>{ACTIONS[id].name}</option>)}</select></label>
            <div className="v3-home-price"><span>Dès</span><strong>{formatMoney(PRODUCTS[getProductId(heroSurface, "ready", 1)].price)}</strong><small>{taxLabel} · sans abonnement</small></div>
            <div className="v3-home-ctas"><a href={productLink}>Configurer et commander <ArrowRight /></a><button type="button" onClick={() => onAdd(makeCartItem(getProductId(heroSurface, "ready", 1), heroAction))}>Ajouter · {ACTIONS[heroAction].name} <Plus /></button></div>
          </div>
        </div>
      </section>

      <section className="v3-proof-band" aria-label="Garanties Tapote">
        <span><CheckCircle2 /> NFC + QR sur chaque support</span>
        <span><Palette /> Prêt ou entièrement personnalisé</span>
        <span><Link2 /> Destination modifiable à distance</span>
        <span><Truck /> Livraison offerte dès 69 €</span>
      </section>

      <section className="v3-demo-section">
        <div className="v3-demo-copy">
          <span className="v3-eyebrow v3-eyebrow-dark"><Play size={13} fill="currentColor" /> DÉMO · 8 SECONDES</span>
          <h2>Votre client comprend.<br />Il tapote. C’est fait.</h2>
          <p>Pas d’application, pas de recherche, pas d’explication compliquée. Tapote ouvre directement l’action que vous avez choisie.</p>
          <div className="v3-action-tabs">
            {FEATURED_ACTIONS.map((id) => <button type="button" aria-pressed={demoAction === id} className={demoAction === id ? "is-selected" : ""} onClick={() => setDemoAction(id)} key={id}>{ACTIONS[id].name}</button>)}
          </div>
          <a className="v3-text-link" href="/comment-ca-marche">Voir comment le lien se modifie <ArrowRight size={16} /></a>
        </div>
        <ProductScene key={`demo-${demoAction}`} image="/assets/products/tapote-bg-cafe-v1.webp" alt={`Démonstration réaliste du chevalet ouvrant ${ACTIONS[demoAction].name}`} nativeAction="avis" preview={{ surface: "comptoir", actionId: demoAction, brandName: "CAFÉ NOMA", theme: "blue", designStyle: "signature", personalization: "ready" }} className="v3-demo-player" />
      </section>

      <DesignLibraryPreview />
      <SectorPreview />
      <PilotSection />
      <FaqSection />
    </main>
  );
}

function DesignSpecimen({ preset, compact = false }) {
  const productName = preset.surface === "comptoir" ? "Chevalet A6" : preset.surface === "plaque" ? "Plaque 12 × 12" : "Carte NFC";
  const productSlug = preset.surface === "comptoir" ? "chevalet" : preset.surface;
  return (
    <a className={`v3-design-specimen ${compact ? "is-compact" : ""}`} href={`/produits/${productSlug}?action=${preset.actionId}`}>
      <div className="v3-design-specimen-visual">
        <ProductArt surface={preset.surface} actionId={preset.actionId} brandName={preset.brandName} theme={preset.theme} designStyle={preset.designStyle} customHeadline={preset.title} />
        <span>{productName}</span>
      </div>
      <div className="v3-design-specimen-copy">
        <small>{preset.category}</small>
        <h3>{preset.title}</h3>
        {!compact && <p>{preset.description}</p>}
        <strong>{compact ? "Voir le design" : "Partir de ce design"} <ArrowRight /></strong>
      </div>
    </a>
  );
}

function DesignLibraryPreview() {
  const featured = DESIGN_PRESETS.filter((preset) => ["avis-signature", "instagram", "facebook", "menu", "wifi", "contact"].includes(preset.id));
  return (
    <section className="v3-design-library-preview">
      <div className="v3-design-library-heading">
        <div><span className="v3-eyebrow">UNE IDENTITÉ POUR CHAQUE ACTION</span><h2>Avis. Insta. Wi-Fi.<br />Et tout le reste.</h2></div>
        <div><p>Choisissez une direction Tapote ou partez de votre propre univers. Chaque design garde le geste NFC et le QR immédiatement compréhensibles.</p><a href="/designs">Voir les {DESIGN_PRESETS.length} designs <ArrowRight /></a></div>
      </div>
      <div className="v3-design-preview-rail">{featured.map((preset) => <DesignSpecimen preset={preset} compact key={preset.id} />)}</div>
    </section>
  );
}

function DesignsPage() {
  const [category, setCategory] = useState("Tous");
  const filtered = category === "Tous" ? DESIGN_PRESETS : DESIGN_PRESETS.filter((preset) => preset.category === category);
  return (
    <main id="main-content" className="v3-designs-page">
      <header className="v3-designs-hero">
        <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>Designs</b></nav>
        <span className="v3-eyebrow"><Palette /> COLLECTION TAPOTE</span>
        <h1>Le bon design<br />pour le bon geste.</h1>
        <p>Avis Google, Instagram, Facebook, menu, Wi-Fi, réservation ou contact : partez d’un modèle clair, puis gardez-le tel quel ou adaptez-le à votre marque.</p>
      </header>
      <section className="v3-designs-toolbar" aria-label="Filtrer les designs">
        <span>{filtered.length} design{filtered.length > 1 ? "s" : ""}</span>
        <div>{DESIGN_CATEGORIES.map((name) => <button type="button" aria-pressed={category === name} className={category === name ? "is-selected" : ""} onClick={() => setCategory(name)} key={name}>{name}</button>)}</div>
      </section>
      <section className="v3-designs-grid">{filtered.map((preset) => <DesignSpecimen preset={preset} key={preset.id} />)}</section>
      <section className="v3-designs-custom-cta"><span>VOUS AVEZ DÉJÀ UNE IDENTITÉ ?</span><h2>Votre logo. Vos couleurs.<br />Notre œil sur le geste.</h2><p>Choisissez d’abord le support : sa fiche affiche immédiatement votre nom, vos couleurs et votre usage dans la scène réelle.</p><a href="/boutique">Choisir mon support <ArrowRight /></a></section>
    </main>
  );
}

const SHOP_ITEMS = [
  { category: "chevalet", surface: "comptoir", slug: "chevalet", image: "/assets/products/tapote-template-chevalet-v1.webp", promise: "Vertical, visible et idéal à la caisse ou à l’accueil.", spec: "A6 vertical · support transparent" },
  { category: "plaque", surface: "plaque", slug: "plaque", image: "/assets/products/tapote-plaque-avis-studio-v2.webp", promise: "Debout sur le comptoir, compacte et lisible au moment de tapoter.", spec: "12 × 12 cm · PMMA rigide" },
  { category: "carte", surface: "carte", slug: "carte", image: "/assets/products/tapote-template-carte-v1.webp", promise: "Présentée en main pendant un rendez-vous ou sur le terrain.", spec: "85 × 54 mm · format poche" },
];

function ShopPage({ onAdd, initialCategory = "tous" }) {
  const [personalization, setPersonalization] = useState("ready");
  const [view, setView] = useState(initialCategory === "packs" ? "packs" : "supports");
  const packIds = personalization === "ready" ? ["pack_duo_standard", "pack_cinq_standard"] : ["pack_duo", "pack_cinq"];
  const addProduct = (surface) => onAdd(makeCartItem(getProductId(surface, personalization, 1), "avis"));
  return (
    <main id="main-content" className="v3-shop">
      <header className="v3-shop-hero">
        <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>Boutique</b></nav>
        <span className="v3-eyebrow">3 FORMATS · 2 FINITIONS</span>
        <h1>Choisissez votre Tapote.</h1>
        <p>Chaque support arrive avec NFC + QR configurés, testés et reliés à une destination que vous pourrez changer gratuitement.</p>
      </header>
      <section className="v3-shop-controls" aria-label="Filtres de la boutique">
        <div className="v3-shop-categories">
          {[{ id: "supports", label: "Les 3 supports" }, { id: "packs", label: "Packs · dès 17,80 € / support" }].map((item) => <button type="button" aria-pressed={view === item.id} className={view === item.id ? "is-selected" : ""} onClick={() => setView(item.id)} key={item.id}>{item.label}</button>)}
        </div>
        <div className="v3-shop-range">
          <span>Votre finition</span>
          <button type="button" aria-pressed={personalization === "ready"} className={personalization === "ready" ? "is-selected" : ""} onClick={() => setPersonalization("ready")}><strong>Prêt à l’emploi</strong><small>Dès 19 €</small></button>
          <button type="button" aria-pressed={personalization === "custom"} className={personalization === "custom" ? "is-selected" : ""} onClick={() => setPersonalization("custom")}><strong>À votre image</strong><small>Dès 29 €</small></button>
        </div>
      </section>
      {view === "supports" && <section className="v3-shop-grid" aria-label="Supports Tapote" key={`supports-${personalization}`}>
        {SHOP_ITEMS.map((item) => {
          const productId = getProductId(item.surface, personalization, 1);
          const product = PRODUCTS[productId];
          const scene = HOME_SCENES[item.surface];
          const preview = { surface: item.surface, actionId: "avis", brandName: scene.brandName, theme: scene.theme, primaryColor: personalization === "custom" ? DEVICE_THEMES[scene.theme].paper : "", secondaryColor: personalization === "custom" ? DEVICE_THEMES[scene.theme].accent : "", textColor: personalization === "custom" ? DEVICE_THEMES[scene.theme].ink : "", designStyle: "signature", personalization };
          return <article className="v3-shop-card" data-variant={personalization} key={`${item.surface}-${personalization}`}>
            <a className="v3-shop-card-image" href={`/produits/${item.slug}?mode=${personalization}`}><ProductScene image={scene.image} alt={`${product.shortName} Tapote ${personalization === "ready" ? "prêt à l’emploi" : "personnalisé"} dans une scène réelle`} nativeAction={scene.nativeAction} preview={preview} compact /><span>{product.badge}</span><b className="v3-shop-card-price-chip">{formatMoney(product.price)} {taxLabel}</b><small>{personalization === "ready" ? "Design Tapote" : "Logo + couleurs + BAT"}</small></a>
            <div className="v3-shop-card-copy"><small>{personalization === "ready" ? "PRÊT À L’EMPLOI" : "À VOTRE IMAGE"}</small><h2>{product.shortName}</h2><p>{item.promise}</p><div><strong>{formatMoney(product.price)} <small>{taxLabel}</small></strong>{personalization === "ready" ? <button type="button" onClick={() => addProduct(item.surface)}>Ajouter · Avis <Plus /></button> : <a className="v3-shop-configure" href={`/produits/${item.slug}?mode=custom`}>Personnaliser <ArrowRight /></a>}</div><ul><li><Check /> {item.spec}</li><li><Check /> NFC + QR configurés et testés</li><li><Check /> {personalization === "ready" ? "Design Tapote · lien modifiable" : "Logo, couleurs et BAT inclus"}</li></ul><a href={`/produits/${item.slug}?mode=${personalization}`}>Voir la fiche produit <ArrowRight /></a></div>
          </article>;
        })}
      </section>}
      {view === "packs" && <section className="v3-shop-packs" key={`packs-${personalization}`}>
        <div className="v3-section-heading"><span className="v3-eyebrow">LES PACKS</span><h2>Plus de points de contact.<br />Moins cher par support.</h2><p>Mixez plaques et chevalets. Chaque support peut conserver son propre lien. Les cartes restent disponibles à l’unité.</p></div>
        <div>{packIds.map((productId) => { const product = PRODUCTS[productId]; const savings = Math.max(0, product.value - product.price); return <article className={product.supportCount === 2 ? "is-featured" : ""} key={productId}><span>{product.badge}</span><h3>{product.name}</h3><strong>{formatMoney(product.price)} <small>{taxLabel}</small></strong><b className="v3-pack-economy"><span>{formatMoney(Math.round(product.price / product.supportCount))} / support</span><em>Vous économisez {formatMoney(savings)}</em></b><p>{product.description}</p><em>{product.format}</em><ul>{product.features.map((feature) => <li key={feature}><Check /> {feature}</li>)}</ul><a className="v3-shop-pack-configure" href={`/produits/chevalet?mode=${personalization}&count=${product.supportCount}&action=avis`}>Choisir la composition <ArrowRight /></a></article>; })}</div>
        <p>10 supports ou plus ? <a href="/devis">Demandez votre tarif volume</a>.</p>
      </section>}
      <section className="v3-proof-band" aria-label="Garanties Tapote"><span><ShieldCheck /> Paiement sécurisé</span><span><FileCheck2 /> BAT inclus en personnalisé</span><span><PackageCheck /> NFC + QR contrôlés</span><span><Link2 /> Modifications gratuites</span></section>
    </main>
  );
}

function SectorPreview() {
  const featured = ["boulangeries-patisseries", "beaute-coiffure-bien-etre", "cabinets-medicaux-paramedicaux", "hebergements-tourisme", "auto-ecoles", "boutiques-commerces"];
  return (
    <section className="v3-section v3-sector-preview">
      <div className="v3-section-heading"><span className="v3-eyebrow">PENSÉ POUR VOTRE QUOTIDIEN</span><h2>Votre secteur. Le bon usage.</h2><p>Tapote ne sert pas seulement à demander un avis. Il ouvre ce qui est réellement utile à vos clients.</p></div>
      <div className="v3-sector-row">{featured.map((slug) => { const sector = findSectorBySlug(slug); return <a href={`/secteurs/${sector.slug}`} key={slug}><span>{sector.title}</span><small>{sector.description}</small><ArrowRight /></a>; })}</div>
      <a className="v3-outline-cta" href="/secteurs">Explorer tous les secteurs <ArrowRight /></a>
    </section>
  );
}

function PilotSection() {
  return (
    <section className="v3-pilot" id="pilot">
      <div className="v3-pilot-copy"><span className="v3-eyebrow v3-eyebrow-dark"><Zap size={13} /> TAPOTE PILOT</span><h2>Changer le lien est gratuit.<br />Piloter votre réseau va plus loin.</h2><p>Votre Tapote fonctionne sans abonnement. Pilot est une option pour comparer vos lieux et analyser précisément l’usage de vos supports.</p><a href="/pilot">Ouvrir Pilot <ArrowRight /></a></div>
      <div className="v3-plan-grid">
        <article><span>INCLUS À VIE</span><strong>0 €</strong><p>Avec chaque Tapote</p><ul><li><Check /> Changement de destination illimité</li><li><Check /> Nombre de tapotes</li><li><Check /> Gestion de vos supports</li></ul></article>
        <article className="is-featured"><span>PILOT</span><strong>{formatMoney(PILOT_PLANS.pilot.price)}<small>/mois</small></strong><p>ou 89 € par an · activation accompagnée</p><ul><li><Check /> Statistiques par emplacement</li><li><Check /> Comparaisons sur 7, 30 ou 90 jours</li><li><Check /> Part NFC / QR et dernière interaction</li><li><Check /> Export CSV et historique</li></ul></article>
      </div>
      <p className="v3-pilot-note">Vous arrêtez Pilot ? Votre dernier lien reste actif et vous pouvez toujours le modifier gratuitement.</p>
    </section>
  );
}

function HowStrip() {
  return (
    <section className="v3-section v3-how-strip">
      <div className="v3-section-heading"><span className="v3-eyebrow">PRÊT SANS PRISE DE TÊTE</span><h2>Vous choisissez. On prépare. Vous posez.</h2></div>
      <div className="v3-step-grid">
        <article><b>01</b><Palette /><h3>Choisissez le style</h3><p>Prêt à l’emploi ou entièrement à votre image.</p></article>
        <article><b>02</b><Upload /><h3>Donnez le lien</h3><p>Maintenant, après la commande ou plus tard.</p></article>
        <article><b>03</b><FileCheck2 /><h3>Validez le BAT</h3><p>Pour la gamme personnalisée, rien ne part sans votre accord.</p></article>
        <article><b>04</b><PackageCheck /><h3>Posez et tapotez</h3><p>NFC et QR sont encodés, testés et prêts.</p></article>
      </div>
    </section>
  );
}

function FaqSection() {
  const questions = [
    ["Puis-je changer le lien après réception ?", "Oui, autant de fois que vous voulez et à distance. Ce changement reste gratuit, sans Pilot."],
    ["Que se passe-t-il si le NFC ne fonctionne pas ?", "Chaque support est testé avant l’envoi et le QR code reste disponible. En cas de défaut confirmé, le support est pris en charge par Tapote."],
    ["Puis-je ouvrir autre chose qu’un avis Google ?", "Oui : menu, réservation, site, Wi-Fi, paiement, Instagram, formulaire, page multi-liens ou toute URL sécurisée."],
    ["Le logo est-il vraiment inclus ?", "Oui dans la gamme À votre image : votre logo, votre brief, le BAT et une petite correction sont inclus."],
    ["Dois-je payer Pilot pour utiliser mon Tapote ?", "Non. Pilot ajoute des fonctions avancées. Votre support, son lien et les modifications à distance restent utilisables sans abonnement."],
    ["Tapote filtre-t-il les clients avant un avis Google ?", "Non. Tapote ne cache jamais le lien d’avis selon la satisfaction, ne promet pas de note et n’encourage aucune récompense contre un avis. Un formulaire privé peut exister en parallèle, sans bloquer l’accès à l’avis public."],
  ];
  return <section className="v3-section v3-faq"><div className="v3-section-heading"><span className="v3-eyebrow">QUESTIONS FRÉQUENTES</span><h2>Tout ce qui doit être clair.</h2></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus /></summary><p>{answer}</p></details>)}</div></section>;
}

function ProductPage({ page, onAdd, forcedMode = "" }) {
  const data = PRODUCT_PAGES[page];
  const params = new URLSearchParams(window.location.search);
  const requestedAction = ACTIONS[params.get("action")] ? params.get("action") : "avis";
  const requestedMode = forcedMode || (params.get("mode") === "custom" ? "custom" : "ready");
  const requestedCount = [2, 5].includes(Number(params.get("count"))) ? Number(params.get("count")) : 1;
  const requestedCompositionParam = params.get("composition");
  const requestedComposition = requestedCount > 1
    ? requestedCompositionParam === "plaques" ? { comptoir: 0, plaque: requestedCount }
      : requestedCompositionParam === "chevalets" ? { comptoir: requestedCount, plaque: 0 }
        : requestedCount === 5 ? { comptoir: 2, plaque: 3 } : { comptoir: 1, plaque: 1 }
    : undefined;
  const scene = HOME_SCENES[data?.key || "comptoir"];
  const [preview, setPreview] = useState({
    surface: compositionSurface(requestedCount, requestedComposition, data?.key || "comptoir"),
    actionId: requestedAction,
    brandName: scene.brandName,
    theme: scene.theme,
    designStyle: "signature",
    customHeadline: "",
    personalization: requestedMode,
    count: requestedCount,
    composition: requestedComposition,
  });
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("action", preview.actionId);
    url.searchParams.set("mode", preview.personalization);
    if (preview.count > 1) {
      url.searchParams.set("count", String(preview.count));
      url.searchParams.set("composition", compositionParam(preview.composition));
    } else {
      url.searchParams.delete("count");
      url.searchParams.delete("composition");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [preview.actionId, preview.composition, preview.count, preview.personalization]);
  useEffect(() => {
    if (!data) return;
    const productLabel = preview.count > 1
      ? `Pack ${compositionLabel(preview.composition) || `${preview.count} supports`}`
      : data.name;
    const title = `${productLabel} NFC + QR | Tapote`;
    const description = `${productLabel} Tapote pour ouvrir ${ACTIONS[preview.actionId]?.name || "le lien de votre choix"}. NFC + QR configurés, lien modifiable à vie.`;
    document.title = title;
    setMetaContent("name", "description", description);
    setMetaContent("property", "og:title", title);
    setMetaContent("property", "og:description", description);
    setMetaContent("name", "twitter:title", title);
    setMetaContent("name", "twitter:description", description);
  }, [data, preview.actionId, preview.composition, preview.count]);
  if (!data) return <NotFound />;
  const presentation = productPresentation(data, preview);
  const readyPrice = PRODUCTS[getProductId(data.key, "ready", preview.count || 1)].price;
  const customPrice = PRODUCTS[getProductId(data.key, "custom", preview.count || 1)].price;
  const related = SHOP_ITEMS.filter((item) => item.slug !== page);
  return (
    <main id="main-content">
      <section className="v3-product-hero">
        <div className="v3-product-gallery v3-product-live-gallery">
          <ProductScene key={`${preview.surface}-${preview.actionId}-${preview.personalization}-${preview.designStyle}-${preview.primaryColor}-${preview.secondaryColor}-${preview.textColor}-${preview.brandName}`} image={scene.image} alt={`${presentation.label} Tapote en situation réelle avec un téléphone affichant ${ACTIONS[preview.actionId]?.name || "le lien choisi"}`} nativeAction={scene.nativeAction} preview={preview} className="v3-product-main-image" />
          <div className="v3-product-live-caption"><span><i /> APERÇU SYNCHRONISÉ</span><strong>Le support imprimé et l’écran changent ensemble.</strong><small>La photo reste la même pour comparer sans perdre le contexte.</small></div>
        </div>
        <div className="v3-product-buy-column">
          <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><a href="/boutique">Boutique</a><span>/</span><b>{presentation.label}</b></nav>
          <span className="v3-eyebrow">{presentation.kicker}</span><h1>{presentation.label}</h1><p className="v3-product-lead">{presentation.description}</p><div className="v3-product-price-line"><span>{preview.count > 1 ? "Pack prêt à l’emploi" : "Prêt à l’emploi"} <strong>{formatMoney(readyPrice)}</strong></span><span>{preview.count > 1 ? "Pack à votre image" : "À votre image"} <strong>{formatMoney(customPrice)}</strong></span><small>{taxLabel} · sans abonnement requis</small></div>
          <BuyBox onAdd={onAdd} initialSurface={data.key} initialAction={requestedAction} initialCount={requestedCount} initialComposition={requestedComposition} initialPersonalization={requestedMode} initialTheme={scene.theme} initialBrandName={scene.brandName} productOnly title={presentation.title} onPreviewChange={setPreview} draftKey={`product:${data.key}`} />
        </div>
      </section>
      <section className="v3-product-facts"><div><MapPin /><span><strong>Où le placer</strong>{presentation.placements}</span></div><div><Layers3 /><span><strong>Format</strong>{presentation.size}</span></div><div><ShieldCheck /><span><strong>Contrôle</strong>{preview.count > 1 ? `${preview.count} NFC + QR testés séparément` : "NFC + QR testés avant envoi"}</span></div><div><Link2 /><span><strong>Après réception</strong>{preview.count > 1 ? "Un lien modifiable par support" : "Lien modifiable à distance"}</span></div></section>
      <section className="v3-section v3-detail-story"><div><span className="v3-eyebrow">VOTRE TAPOTE, PAS CELUI DE TOUT LE MONDE</span><h2>Assez simple pour être utilisé.<br />Assez beau pour rester visible.</h2><p>Un support connecté ne sert que s’il attire le regard, explique le geste et respecte le lieu où il est posé. Chaque design Tapote hiérarchise votre marque, l’action et les zones NFC/QR sans surcharge.</p></div><div className={`v3-detail-product-art ${preview.surface === "mix" ? "is-mix" : ""}`}>{preview.surface === "mix" ? <><ProductArt {...preview} surface="comptoir" /><ProductArt {...preview} surface="plaque" /></> : <ProductArt {...preview} surface={preview.surface} />}</div></section>
      <section className="v3-section v3-product-details">
        <div className="v3-section-heading"><span className="v3-eyebrow">EN DÉTAIL</span><h2>Tout est clair avant d’acheter.</h2><p>Le support, la configuration et le service de changement de lien forment un seul produit.</p></div>
        <div className="v3-product-detail-grid">
          <article><SmartphoneNfc /><h3>Caractéristiques</h3><ul>{presentation.technical.map((detail) => <li key={detail}><Check /> {detail}</li>)}</ul></article>
          <article><Sparkles /><h3>Ce que vous recevez</h3><p>{presentation.inBox}</p><ul><li><Check /> Encodage individuel</li><li><Check /> Test NFC et QR avant envoi</li><li><Check /> Accès gratuit pour modifier le lien</li></ul></article>
          <article><MapPin /><h3>Cas d’usage</h3><ul>{presentation.uses.map((use) => <li key={use}><Check /> {use}</li>)}</ul></article>
        </div>
      </section>
      <HowStrip />
      <FaqSection />
      <section className="v3-section v3-related-products"><div className="v3-section-heading"><span className="v3-eyebrow">COMPLÉTEZ VOS POINTS DE CONTACT</span><h2>Vous aimerez aussi.</h2></div><div>{related.map((item) => <a href={`/produits/${item.slug}`} key={item.slug}><img src={item.image} alt="" loading="lazy" /><span>{PRODUCT_PAGES[item.slug].kicker}</span><h3>{PRODUCT_PAGES[item.slug].name}</h3><strong>Dès {formatMoney(PRODUCTS[`${item.surface}_standard`]?.price || PRODUCTS.carte_standard.price)}</strong><em>Voir le produit <ArrowRight /></em></a>)}</div></section>
    </main>
  );
}

function SectorsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const filtered = SECTORS.filter((sector) => (category === "Tous" || sector.category === category) && `${sector.title} ${sector.description}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main id="main-content" className="v3-directory">
      <header className="v3-directory-hero"><span className="v3-eyebrow">{SECTORS.length} SECTEURS, DES USAGES CONCRETS</span><h1>Comment Tapote peut<br />servir votre activité ?</h1><p>Choisissez votre métier. On vous montre le bon emplacement, la bonne action et le pack qui suffit vraiment.</p></header>
      <section className="v3-directory-tools"><label><span className="v3-visually-hidden">Rechercher un secteur</span><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un secteur…" /></label><div><button type="button" aria-pressed={category === "Tous"} className={category === "Tous" ? "is-selected" : ""} onClick={() => setCategory("Tous")}>Tous</button>{SECTOR_CATEGORIES.map((name) => <button type="button" aria-pressed={category === name} className={category === name ? "is-selected" : ""} onClick={() => setCategory(name)} key={name}>{name}</button>)}</div></section>
      <section className="v3-sector-directory-grid">{filtered.map((sector) => {
        const preview = { surface: sectorDefaultSurface(sector), actionId: sector.actionIds[0], brandName: sector.exampleBrand || "VOTRE MARQUE", theme: sector.theme || "blue", designStyle: "signature" };
        return <a href={`/secteurs/${sector.slug}`} key={sector.id}><SectorScene sector={sector} preview={preview} compact /><span>{sector.category}</span><h2>{sector.title}</h2><p>{sector.description}</p><strong>Voir la solution <ArrowRight /></strong></a>;
      })}</section>
      {!filtered.length && <p className="v3-no-result">Aucun secteur ne correspond. Tapote peut tout de même ouvrir n’importe quel lien : <a href="/devis">parlez-nous de votre usage</a>.</p>}
    </main>
  );
}

function SectorPage({ slug, onAdd }) {
  const sector = findSectorBySlug(slug);
  const [preview, setPreview] = useState({ surface: sector ? sectorDefaultSurface(sector) : "comptoir", actionId: sector?.actionIds[0] || "avis", brandName: sector?.exampleBrand || "VOTRE MARQUE", theme: sector?.theme || "blue", designStyle: "signature", customHeadline: "", personalization: "ready" });
  if (!sector) return <NotFound />;
  const surface = sectorDefaultSurface(sector);
  const recommendedCount = sector.recommendedProductId === "pack_cinq" ? 5 : sector.recommendedProductId === "pack_duo" ? 2 : 1;
  const recommendation = preview.surface === "carte"
    ? "Carte à l’unité recommandée · ajoutez-en ensuite selon votre équipe"
    : recommendedCount === 1
      ? "1 support recommandé · les packs restent disponibles"
      : `Pack ${recommendedCount} recommandé · achat à l’unité toujours possible`;
  return (
    <main id="main-content">
      <section className="v3-sector-hero"><SectorScene sector={sector} preview={preview} className="v3-sector-image" /><div className="v3-sector-buy"><nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><a href="/secteurs">Secteurs</a><span>/</span><b>{sector.title}</b></nav><span className="v3-eyebrow">TAPOTE POUR {sector.title.toUpperCase()}</span><h1>{sector.title}.<br />Le bon geste.</h1><p>{sector.description} Changez de support ou d’utilisation : le décor reste le même, le design et l’écran s’adaptent instantanément.</p><div className="v3-sector-recommendation"><Sparkles /> {recommendation}</div><BuyBox onAdd={onAdd} compact allowAllSurfaces initialSurface={surface} initialAction={sector.actionIds[0]} initialCount={recommendedCount} initialComposition={sector.composition} initialTheme={sector.theme} initialBrandName={sector.exampleBrand || "VOTRE MARQUE"} targetId={sector.id} onPreviewChange={setPreview} /></div></section>
      <HowStrip />
    </main>
  );
}

function CustomizePage({ onAdd }) {
  const params = new URLSearchParams(window.location.search);
  const requestedSupport = params.get("support");
  const page = requestedSupport === "plaque" ? "plaque" : requestedSupport === "carte" ? "carte" : "chevalet";
  const action = ACTIONS[params.get("action")] ? params.get("action") : "avis";
  useEffect(() => {
    window.history.replaceState({}, "", `/produits/${page}?mode=custom&action=${action}`);
  }, [action, page]);
  return <ProductPage page={page} onAdd={onAdd} forcedMode="custom" />;
}

function HowPage() {
  const preview = { surface: "comptoir", actionId: "avis", brandName: "CAFÉ NOMA", theme: "blue", designStyle: "signature", personalization: "ready" };
  return (
    <main id="main-content">
      <header className="v3-how-hero"><div><span className="v3-eyebrow v3-eyebrow-dark">SANS APP · SANS FRICTION</span><h1>Tapote ouvre exactement la bonne page.</h1><p>Votre client approche son téléphone ou scanne le QR. L’avis, le menu, la réservation ou votre page s’ouvre immédiatement.</p><a href="/boutique">Choisir mon Tapote <ArrowRight /></a></div><ProductScene image={HOME_SCENES.comptoir.image} alt="Un client utilise un chevalet Tapote avec son téléphone" nativeAction={HOME_SCENES.comptoir.nativeAction} preview={preview} className="v3-how-scene" /></header>
      <section className="v3-link-flow"><article><SmartphoneNfc /><span>1</span><h2>Le client tapote</h2><p>Ou scanne le QR code. Aucune application n’est nécessaire.</p></article><ArrowRight /><article><Zap /><span>2</span><h2>Tapote redirige</h2><p>Le lien court du support appelle votre destination actuelle.</p></article><ArrowRight /><article><Globe2 /><span>3</span><h2>La bonne page s’ouvre</h2><p>Avis, menu, réservation, réseau social ou toute autre URL.</p></article></section>
      <section className="v3-section v3-change-link"><div><span className="v3-eyebrow">ET SI LE LIEN CHANGE ?</span><h2>Vous ne touchez pas au support.</h2><p>Depuis votre espace, vous remplacez la destination. Le NFC et le QR continuent de fonctionner, car ils pointent toujours vers le même lien Tapote.</p><ul><li><Check /> Modifications illimitées</li><li><Check /> Gratuites, sans Pilot</li><li><Check /> Prises en compte à distance</li></ul></div><div className="v3-link-console"><span>Destination active</span><strong>tapote.fr/t/<b>cafe-noma</b></strong><em>ouvre</em><div>https://g.page/r/…/review</div><span className="v3-link-console-action">Modifier la destination</span></div></section>
      <PilotSection />
      <FaqSection />
      <section className="v3-final-buy"><span>PRÊT À PASSER AU BON GESTE ?</span><h2>Choisissez le format.<br />On prépare le reste.</h2><a href="/boutique">Choisir mon format <ArrowRight /></a></section>
    </main>
  );
}

function CartLine({ item, onQuantity, onRemove }) {
  const product = PRODUCTS[item.productId];
  const action = ACTIONS[item.actionId];
  const cartTitle = product.kind === "pack"
    ? `${product.supportCount} supports · ${product.personalization === "ready" ? "Prêts à l’emploi" : "À votre image"}`
    : product.name.replace(/ · .+$/, "");
  return (
    <article className="v3-cart-line">
      <div className="v3-cart-art"><DevicePreview productId={previewId(item.productId)} actionId={item.actionId} brandName={item.brandName || "VOTRE MARQUE"} brandLogo={getCachedLogoPreview(item.brandLogoId)} theme={item.theme} primaryColor={item.primaryColor} secondaryColor={item.secondaryColor} textColor={item.textColor} designStyle={item.designStyle} compact /></div>
      <div className="v3-cart-copy"><span>{product.personalization === "ready" ? "PRÊT À L’EMPLOI" : product.personalization === "matched" ? "ASSORTIE" : "À VOTRE IMAGE"}</span><h2>{cartTitle}</h2><p>{action.name}{product.kind === "pack" && item.supportComposition ? ` · ${compositionLabel(item.supportComposition)}` : ""}</p><strong>{formatMoney(product.price * item.quantity)}</strong></div>
      {onQuantity && <div className="v3-cart-actions"><div className="v3-cart-quantity"><button type="button" onClick={() => onQuantity(-1)} disabled={item.quantity <= 1} aria-label="Diminuer"><Minus /></button><b>{item.quantity}</b><button type="button" onClick={() => onQuantity(1)} aria-label="Augmenter"><Plus /></button></div><button className="v3-cart-remove" type="button" onClick={onRemove}><Trash2 /> Supprimer</button></div>}
    </article>
  );
}

function OrderSummary({ cart, action }) {
  const subtotal = cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0);
  const shipping = calculateShipping(subtotal);
  const freeShippingRemaining = Math.max(0, SHIPPING.freeThreshold - subtotal);
  const hasCustom = cart.some((item) => ["custom", "matched"].includes(PRODUCTS[item.productId].personalization));
  return <aside className="v3-order-summary"><span>RÉCAPITULATIF</span><dl><div><dt>Sous-total</dt><dd>{formatMoney(subtotal)}</dd></div><div><dt>Livraison</dt><dd>{shipping ? formatMoney(shipping) : "Offerte"}</dd></div><div><dt>Total {taxLabel}</dt><dd>{formatMoney(subtotal + shipping)}</dd></div></dl>{freeShippingRemaining > 0 ? <div className="v3-shipping-progress"><span>Encore <strong>{formatMoney(freeShippingRemaining)}</strong> pour la livraison offerte</span><i><b style={{ width: `${Math.min(100, subtotal / SHIPPING.freeThreshold * 100)}%` }} /></i></div> : <div className="v3-shipping-progress is-complete"><span><Check /> Livraison offerte débloquée</span></div>}<ul><li><ShieldCheck /> Paiement sécurisé par Stripe</li><li><PackageCheck /> NFC testé + QR de secours inclus</li>{hasCustom && <li><FileCheck2 /> BAT validé avant impression</li>}<li><Link2 /> Lien modifiable à vie</li></ul>{action}</aside>;
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
      designStyle: matchingSource.designStyle,
      customHeadline: matchingSource.customHeadline,
      destinationUrl: matchingSource.destinationUrl,
      brandLogoId: matchingSource.brandLogoId,
      logoFileName: matchingSource.logoFileName,
    }));
  };
  return (
    <main id="main-content" className="v3-purchase-page">
      <header><span className="v3-eyebrow">VOTRE COMMANDE</span><h1>Votre panier.</h1><p>Simple à vérifier. Facile à modifier.</p></header>
      {!cart.length ? <section className="v3-empty-cart"><ShoppingBag /><h2>Votre panier est vide.</h2><p>Commencez par le support le plus utile à votre activité.</p><a href="/boutique">Voir les produits <ArrowRight /></a></section> : <div className="v3-purchase-layout"><section className="v3-cart-lines">{cart.map((item, index) => <CartLine item={item} onQuantity={(delta) => changeQuantity(index, delta)} onRemove={() => setCart((current) => current.filter((_, itemIndex) => itemIndex !== index))} key={`${itemFingerprint(item)}-${index}`} />)}{hasSupport && !hasMatchedCard && matchingSource && <button className="v3-cart-upsell" type="button" onClick={addMatchedCard}><Plus /><span><strong>Ajouter la carte assortie — 19 €</strong><small>Même identité graphique et même action que votre support personnalisé.</small></span></button>}{hasSupport && !hasMatchedCard && !matchingSource && <div className="v3-volume-notice"><Layers3 /><span><strong>Plusieurs identités sont dans ce panier.</strong><small>Configurez séparément la carte à assortir pour choisir sans ambiguïté sa marque et son usage.</small></span></div>}{requiresQuote && <div className="v3-volume-notice"><Layers3 /><span><strong>{supportTotal} supports : un devis sera plus juste.</strong><small>À partir de 10, nous vérifions la composition, les lieux et le coût de production avant de vous proposer le meilleur tarif.</small></span></div>}</section><OrderSummary cart={cart} action={requiresQuote ? <a className="v3-primary-cta" href="/devis">Demander un devis <ArrowRight /></a> : <a className="v3-primary-cta" href="/commande">Continuer vers la commande <ArrowRight /></a>} /></div>}
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
      <div className="v3-purchase-layout"><form className="v3-checkout-form" onSubmit={submit}><label><span>Nom de l’entreprise *</span><input name="businessName" value={form.businessName} onChange={update} required autoComplete="organization" /></label><label><span>E-mail de commande *</span><input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" /></label><label><span>Lien principal à ouvrir <small>(facultatif maintenant)</small></span><input type="url" name="destinationUrl" value={form.destinationUrl} onChange={update} placeholder="https://…" pattern="https://.*" /></label><div className="v3-checkout-help"><Clock3 /><span>Vous ne connaissez pas encore le lien ? Laissez ce champ vide : nous vous aidons à le retrouver après la commande, puis vous pourrez le modifier à vie.</span></div>{hasPack && <div className="v3-checkout-help"><Link2 /><span>Ce lien sera appliqué par défaut. Après la commande, vous pourrez attribuer gratuitement un lien différent à chaque support.</span></div>}<label className="v3-checkbox"><input type="checkbox" name="professionalCustomer" checked={form.professionalCustomer} onChange={update} required /><span>Je commande pour mon activité professionnelle.</span></label><label className="v3-checkbox"><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} required /><span>J’accepte les <a href="/cgv" target="_blank">CGV</a> et la <a href="/confidentialite" target="_blank">politique de confidentialité</a>.</span></label><button className="v3-primary-cta" type="submit" disabled={status === "loading"}>{status === "loading" ? "Connexion à Stripe…" : <>Payer en toute sécurité <ArrowRight /></>}</button><div className="v3-checkout-payment-note"><ShieldCheck /><span><strong>Carte bancaire via Stripe</strong><small>Tapote ne stocke jamais vos données bancaires.</small></span></div>{error && <p className="v3-form-error" role="alert">{error}</p>}</form><div><section className="v3-checkout-lines">{cart.map((item, index) => <CartLine item={item} key={`${itemFingerprint(item)}-${index}`} />)}</section><OrderSummary cart={cart} /></div></div>
    </main>
  );
}

function QuotePage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", need: "", consent: false, website: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
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
        <ul><li><Check /> Plaques et chevalets mixables</li><li><Check /> Un design cohérent, décliné par lieu</li><li><Check /> Un lien différent par support si nécessaire</li><li><Check /> Pilot reste optionnel</li></ul>
      </section>
      <form className="v3-quote-form" onSubmit={submit}>
        <div><span>DEMANDE PROFESSIONNELLE</span><h2>Parlez-nous du besoin.</h2><p>Quelques lignes suffisent. Aucun engagement.</p></div>
        <label className="v3-form-honeypot" aria-hidden="true"><span>Site web</span><input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" /></label>
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
    paid: ["COMMANDE CONFIRMÉE", "Merci. On s’occupe de la suite.", "Vous allez recevoir les informations de commande et, pour un design personnalisé, la suite du BAT."],
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
        ["1. Offre et commande", "Les caractéristiques essentielles, la finition, la quantité, la personnalisation et le prix sont affichés avant paiement. La commande devient ferme après confirmation du paiement. Tapote Pilot n’est pas inclus et aucun abonnement n’est présélectionné."],
        ["2. Prix, réductions et paiement", `Les montants unitaires et les réductions de packs sont affichés en euros ${taxLabel} avant validation. Le paiement est comptant, par carte via Stripe ; aucun escompte pour paiement anticipé n’est appliqué. Les coordonnées bancaires ne sont jamais stockées par Tapote. En cas de somme exceptionnellement exigible et impayée à son échéance, les pénalités courent dès le lendemain, sans rappel, au taux de refinancement de la BCE majoré de 10 points et au minimum à trois fois le taux d’intérêt légal. Une indemnité forfaitaire de 40 € pour frais de recouvrement est due, sans préjudice des frais supplémentaires justifiés.`],
        ["3. Personnalisation et BAT", "Pour la gamme À votre image, le logo, les couleurs, le brief et la destination sont repris dans un BAT numérique. La fabrication commence après validation. Le client reste responsable de la vérification des textes, liens, logos et droits d’utilisation des éléments transmis."],
        ["4. Préparation et livraison", `La livraison standard en France métropolitaine coûte ${formatMoney(SHIPPING.standardPrice)} et est offerte dès ${formatMoney(SHIPPING.freeThreshold)}. Le délai applicable est confirmé lors de la prise en charge ; pour un support personnalisé, il commence après validation du BAT.`],
        ["5. Conformité et réclamations", `Chaque NFC et chaque QR code sont contrôlés avant expédition. Une non-conformité ou une avarie doit être signalée avec les éléments utiles afin d’organiser la prise en charge. Contact et retours : ${LEGAL_DETAILS.returnsAddress}`],
        ["6. Annulation et responsabilité", "Une demande d’annulation peut être étudiée avant validation du BAT ou lancement de la préparation. Tapote ne répond pas de la disponibilité ni du contenu des destinations externes choisies par le client. Les responsabilités qui ne peuvent légalement être exclues restent applicables."],
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
  return <main id="main-content" className="v3-not-found"><span>404</span><h1>Cette page n’existe pas.</h1><a href="/boutique">Retour à la boutique <ArrowRight /></a></main>;
}

export default function StorefrontV3() {
  const [cart, setCart] = useState(loadCart);
  const [cartNotice, setCartNotice] = useState("");
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  useEffect(() => { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
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
  const addToCart = (item) => {
    const normalized = { ...item, quantity: normalizedQuantity(item.quantity) };
    setCart((current) => {
      const fingerprint = itemFingerprint(normalized);
      const index = current.findIndex((entry) => itemFingerprint(entry) === fingerprint);
      if (index < 0) return [...current, normalized];
      return current.map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: Math.min(MAX_ITEM_QUANTITY, entry.quantity + normalized.quantity) } : entry);
    });
    const product = PRODUCTS[normalized.productId];
    const notice = product.kind === "pack"
      ? `${product.supportCount} supports · ${product.personalization === "custom" ? "À votre image" : "Prêts à l’emploi"} · ${ACTIONS[normalized.actionId].name}${normalized.supportComposition ? ` · ${compositionLabel(normalized.supportComposition)}` : ""}`
      : `${product.name.replace(/ · .+$/, "")} · ${ACTIONS[normalized.actionId].name}`;
    setCartNotice(notice);
  };
  let page;
  if (path === "/") page = <HomePage onAdd={addToCart} />;
  else if (path === "/boutique") page = <ShopPage onAdd={addToCart} />;
  else if (path === "/categorie/chevalets-nfc") page = <ProductPage page="chevalet" onAdd={addToCart} />;
  else if (path === "/categorie/plaques-nfc") page = <ProductPage page="plaque" onAdd={addToCart} />;
  else if (path === "/categorie/cartes-nfc") page = <ProductPage page="carte" onAdd={addToCart} />;
  else if (["/categorie/packs-nfc", "/categorie/packs"].includes(path)) page = <ShopPage onAdd={addToCart} initialCategory="packs" />;
  else if (path.startsWith("/produits/") && PRODUCT_PAGES[path.split("/")[2]]) page = <ProductPage page={path.split("/")[2]} onAdd={addToCart} />;
  else if (path === "/designs") page = <DesignsPage />;
  else if (path === "/secteurs") page = <SectorsPage />;
  else if (path.startsWith("/secteurs/") && findSectorBySlug(path.split("/")[2])) page = <SectorPage slug={path.split("/")[2]} onAdd={addToCart} />;
  else if (path === "/personnaliser") page = <CustomizePage onAdd={addToCart} />;
  else if (path === "/comment-ca-marche") page = <HowPage />;
  else if (path === "/panier") page = <CartPage cart={cart} setCart={setCart} onAdd={addToCart} />;
  else if (path === "/devis") page = <QuotePage />;
  else if (path === "/commande") page = <CheckoutPage cart={cart} />;
  else if (path === "/commande/confirmee") page = <ConfirmationPage setCart={setCart} />;
  else if (["/mentions-legales", "/cgv", "/confidentialite"].includes(path)) page = <LegalPage type={path.slice(1)} />;
  else page = <NotFound />;
  return <Shell cartCount={cartCount} cartNotice={cartNotice} onCloseNotice={() => setCartNotice("")} compactCheckout={path.startsWith("/commande")}>{page}</Shell>;
}
