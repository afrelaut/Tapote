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
  Play,
  Plus,
  PhoneCall,
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
  DESIGN_STYLES,
  formatMoney,
  matchingIdentityKey,
  PRODUCTS,
  SHIPPING,
} from "../shared/catalog.js";
import { DevicePreview, GeneratedBrandMark, PlatformGlyph, prepareLogoFile, readFileAsDataUrl } from "./App.jsx";
import { extractLogoPalette, pickScreenColor } from "./brandColors.js";
import { DEVICE_THEMES, normalizeHexColor, contrastRatio, resolveDeviceColors } from "./deviceThemes.js";
import { captureStorefrontAttribution, trackStorefrontEvent } from "./storefront/analytics.js";
import { findSectorBySlug, SECTOR_CATEGORIES, SECTORS } from "./storefront/sectorData.js";

const MAX_ITEM_QUANTITY = 50;
const CART_KEY = "tapote-cart-v3";
// v2 deliberately invalidates drafts created before custom identities were
// separated from the demonstration brands used in ready-made scenes.
const CONFIG_DRAFT_PREFIX = "tapote-config-draft-v2:";
const LOGO_PREVIEW_PREFIX = "tapote-logo-preview-v1:";
const ACTION_ORDER = ["avis", "formulaire", "menu", "reservation", "commande", "paiement", "pourboire", "fidelite", "instagram", "tiktok", "facebook", "linkedin", "wifi", "site", "contact", "whatsapp", "multiliens", "autre"];
const FEATURED_ACTIONS = ["avis", "menu", "reservation", "instagram", "wifi", "multiliens"];
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
const DESIGN_CATEGORIES = ["Tous", "Avis & fidélité", "Réseaux", "Vendre & servir", "Accès & contact"];
const DESIGN_PRESETS = [
  { id: "avis-pulse", title: "Vous avez aimé ? Tapotez.", description: "L’édition manifeste : une invitation courte, une cible NFC magnétique et votre marque en premier.", category: "Avis & fidélité", actionId: "avis", surface: "comptoir", theme: "blue", designStyle: "pulse", brandName: "CAFÉ NOMA" },
  { id: "avis-signature", title: "Votre avis compte. Tapotez.", description: "La demande d’avis nette et assumée, au moment de payer.", category: "Avis & fidélité", actionId: "avis", surface: "comptoir", theme: "blue", designStyle: "signature", brandName: "CAFÉ NOMA" },
  { id: "avis-minimal", title: "Dites-nous tout. Tapotez.", description: "Une version calme pour les lieux de soin et d’accueil.", category: "Avis & fidélité", actionId: "avis", surface: "plaque", theme: "sand", designStyle: "minimal", brandName: "MAISON CALME" },
  { id: "fidelite", title: "Des avantages ? Tapotez.", description: "Carte de fidélité, avantages ou inscription au programme client.", category: "Avis & fidélité", actionId: "fidelite", surface: "comptoir", theme: "green", designStyle: "editorial", brandName: "MAISON LEVAIN" },
  { id: "instagram", title: "Les coulisses ? Tapotez.", description: "Votre univers social au bout d’un geste, sans recherche de pseudo.", category: "Réseaux", actionId: "instagram", surface: "plaque", theme: "rose", designStyle: "platform", brandName: "STUDIO LUNE" },
  { id: "facebook", title: "Restons proches. Tapotez.", description: "Page Facebook, actualités et communauté locale en accès direct.", category: "Réseaux", actionId: "facebook", surface: "plaque", theme: "blue", designStyle: "editorial", brandName: "LE LIEN LOCAL" },
  { id: "tiktok", title: "La suite ? Tapotez.", description: "Une porte immédiate vers vos formats courts et vos créations.", category: "Réseaux", actionId: "tiktok", surface: "plaque", theme: "mono", designStyle: "signature", brandName: "LIGNE NOIRE" },
  { id: "linkedin", title: "Un projet commun ? Tapotez.", description: "Le profil ou la page entreprise dans une carte de rendez-vous.", category: "Réseaux", actionId: "linkedin", surface: "carte", theme: "blue", designStyle: "minimal", brandName: "ATELIER MARTIN" },
  { id: "menu", title: "Une envie ? Tapotez.", description: "Le menu du jour toujours à jour, sans réimprimer le support.", category: "Vendre & servir", actionId: "menu", surface: "comptoir", theme: "green", designStyle: "editorial", brandName: "L’ATELIER 21" },
  { id: "reservation", title: "On se revoit ? Tapotez.", description: "La réservation posée naturellement à la fin de l’expérience.", category: "Vendre & servir", actionId: "reservation", surface: "plaque", theme: "rose", designStyle: "minimal", brandName: "STUDIO LUNE" },
  { id: "commande", title: "Ça vous tente ? Tapotez.", description: "Catalogue, click & collect ou commande récurrente en un geste.", category: "Vendre & servir", actionId: "commande", surface: "comptoir", theme: "sand", designStyle: "platform", brandName: "FLEURS SAUVAGES" },
  { id: "paiement", title: "Pour régler ? Tapotez.", description: "Un lien de paiement lisible au comptoir, sur stand ou en mobilité.", category: "Vendre & servir", actionId: "paiement", surface: "plaque", theme: "blue", designStyle: "platform", brandName: "MOBILE CLUB" },
  { id: "pourboire", title: "Un merci ? Tapotez.", description: "Le pourboire dématérialisé, proposé avec tact et sans friction.", category: "Vendre & servir", actionId: "pourboire", surface: "comptoir", theme: "sand", designStyle: "signature", brandName: "CAFÉ NOMA" },
  { id: "wifi", title: "Besoin du Wi‑Fi ? Tapotez.", description: "Le réseau invité et ses consignes accessibles dès l’arrivée.", category: "Accès & contact", actionId: "wifi", surface: "plaque", theme: "blue", designStyle: "minimal", brandName: "HÔTEL RIVAGE" },
  { id: "multiliens", title: "Tout retrouver ? Tapotez.", description: "Services, horaires et liens utiles réunis sur une seule page.", category: "Accès & contact", actionId: "multiliens", surface: "plaque", theme: "green", designStyle: "platform", brandName: "CAMPING DES PINS" },
  { id: "contact", title: "On se rappelle ? Tapotez.", description: "Téléphone, e-mail et WhatsApp dans une carte à emporter.", category: "Accès & contact", actionId: "contact", surface: "carte", theme: "sand", designStyle: "signature", brandName: "STUDIO GABRIEL" },
  { id: "whatsapp", title: "Une question ? Tapotez.", description: "Une conversation WhatsApp préremplie, prête à envoyer.", category: "Accès & contact", actionId: "whatsapp", surface: "carte", theme: "green", designStyle: "platform", brandName: "ATELIER MARTIN" },
  { id: "formulaire", title: "Un projet ? Tapotez.", description: "Inscription, devis ou demande générale sans papier à ressaisir.", category: "Accès & contact", actionId: "formulaire", surface: "plaque", theme: "blue", designStyle: "editorial", brandName: "CAMPUS 22" },
  { id: "site", title: "Envie d’en voir plus ? Tapotez.", description: "Votre site ou une page précise, exactement au bon endroit.", category: "Accès & contact", actionId: "site", surface: "comptoir", theme: "mono", designStyle: "minimal", brandName: "LA GALERIE" },
];
const ACTION_CAMPAIGN_STYLES = DESIGN_PRESETS.reduce((styles, preset) => ({ ...styles, [preset.actionId]: styles[preset.actionId] || preset.designStyle }), {});
const campaignStyleForAction = (actionId) => ACTION_CAMPAIGN_STYLES[actionId] || "signature";
const campaignHeadlineForAction = (actionId) => ACTIONS[actionId]?.campaignHeadline || ACTIONS[actionId]?.headline || "";
// Chaque design est présenté dans la même scène réelle que la boutique et les
// secteurs : décor du métier, support imprimé et téléphone qui ouvre le lien.
const DESIGN_SCENE_IMAGES = {
  "avis-pulse": "/assets/products/tapote-bg-cafe-v1.webp",
  "avis-signature": "/assets/products/tapote-bg-cafe-v1.webp",
  "avis-minimal": "/assets/products/tapote-bg-beaute-v1.webp",
  fidelite: "/assets/products/tapote-bg-boulangerie-v1.webp",
  instagram: "/assets/products/tapote-bg-beaute-v1.webp",
  facebook: "/assets/products/tapote-bg-agence-v1.webp",
  tiktok: "/assets/products/tapote-bg-artisan-v1.webp",
  linkedin: "/assets/products/tapote-bg-artisan-v1.webp",
  menu: "/assets/products/tapote-bg-restaurant-v1.webp",
  reservation: "/assets/products/tapote-bg-beaute-v1.webp",
  commande: "/assets/products/tapote-bg-retail-v1.webp",
  paiement: "/assets/products/tapote-bg-restaurant-v1.webp",
  pourboire: "/assets/products/tapote-bg-cafe-v1.webp",
  wifi: "/assets/products/tapote-bg-hotel-v1.webp",
  multiliens: "/assets/products/tapote-bg-hotel-v1.webp",
  contact: "/assets/products/tapote-bg-agence-v1.webp",
  whatsapp: "/assets/products/tapote-bg-artisan-v1.webp",
  formulaire: "/assets/products/tapote-bg-formation-v1.webp",
  site: "/assets/products/tapote-bg-evenement-v1.webp",
};
const designSceneImage = (preset) => DESIGN_SCENE_IMAGES[preset.id] || "/assets/products/tapote-bg-cafe-v1.webp";
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
  if (path === "/") return ["Supports NFC + QR prêts ou personnalisés | Tapote", "Chevalets, plaques et cartes NFC + QR. Design prêt à l’emploi ou personnalisé, lien modifiable à vie."];
  if (path === "/boutique" || path.startsWith("/categorie/")) return ["Boutique NFC + QR | Tapote", "Tous les chevalets, plaques, cartes et packs Tapote, prêts à l’emploi ou personnalisés."];
  if (path.startsWith("/produits/")) {
    const product = PRODUCT_PAGES[path.split("/")[2]];
    if (product) return [`${product.name}${/nfc/i.test(product.name) ? "" : " NFC"} + QR | Tapote`, `${product.description} Prêt à l’emploi ou personnalisé, avec lien modifiable à distance.`];
  }
  if (path === "/designs") return ["Designs NFC + QR | Tapote", "Découvrez les designs Tapote pour les avis, Instagram, Facebook, le Wi-Fi, les menus, les réservations et tous vos liens."];
  if (path === "/secteurs") return [`Tapote pour votre secteur | ${SECTORS.length} usages concrets`, "Découvrez les supports NFC + QR et les usages Tapote adaptés à votre métier."];
  if (path.startsWith("/secteurs/")) {
    const sector = findSectorBySlug(path.split("/")[2]);
    if (sector) return [`Tapote pour ${sector.title}`, `${sector.promise} ${sector.description}`];
  }
  if (path === "/personnaliser") return ["Créer mon Tapote personnalisé", "Personnalisez votre plaque, chevalet ou carte NFC en direct : logo, textes, couleurs et action."];
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
      <span><SmartphoneNfc size={14} /> NFC + QR inclus</span>
      <span><Truck size={14} /> Livraison offerte dès {formatMoney(SHIPPING.freeThreshold)}</span>
      <span><Link2 size={14} /> Lien modifiable à vie</span>
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
          <a href="/boutique" onClick={() => setOpen(false)}>Boutique</a>
          <a href="/boutique#choisir-support" onClick={() => setOpen(false)}>Quel support ?</a>
          <a href="/secteurs" onClick={() => setOpen(false)}>Solutions</a>
          <a href="/designs" onClick={() => setOpen(false)}>Designs</a>
          <a href="/comment-ca-marche" onClick={() => setOpen(false)}>Fonctionnement</a>
          <a className="v3-mobile-login" href="/personnaliser" onClick={() => setOpen(false)}>Créer mon Tapote</a>
        </nav>
        <div className="v3-header-actions">
          <a className="v3-header-primary" href="/personnaliser">Créer mon Tapote</a>
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
        <div><Brand /><p>Transformez chaque visite<br />en la bonne action.</p><small>NFC + QR · prêt ou personnalisé · sans abonnement obligatoire.</small></div>
        <div><strong>Choisir</strong><a href="/boutique">Toute la boutique</a><a href="/produits/chevalet">Chevalet A6</a><a href="/produits/plaque">Plaque 12 × 12</a><a href="/produits/carte">Carte NFC</a><a href="/personnaliser">Créer mon Tapote</a></div>
        <div><strong>Découvrir</strong><a href="/secteurs">Solutions par métier</a><a href="/designs">Tous les designs</a><a href="/comment-ca-marche">Comment ça marche</a><a href="/devis">Devis dès 10 supports</a></div>
        <div><strong>Aide</strong><a href="mailto:aymeric@tapote.fr">Nous contacter</a><a href="/cgv">Livraison et garanties</a><a href="/confidentialite">Données et confidentialité</a><a href="/connexion">Accès client</a></div>
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

function ProductArt({ surface = "comptoir", actionId = "avis", brandName = "VOTRE MARQUE", brandLogo = "", theme = "blue", primaryColor = "", secondaryColor = "", textColor = "", designStyle = "signature", customHeadline = "", customSubline = "", customTapLabel = "", personalization = "ready", className = "" }) {
  return <div className={`v3-product-art ${className}`} aria-hidden="true"><DevicePreview productId={surface} actionId={actionId} brandName={brandName} brandLogo={brandLogo} theme={theme} primaryColor={primaryColor} secondaryColor={secondaryColor} textColor={textColor} designStyle={designStyle} customHeadline={customHeadline} customSubline={customSubline} customTapLabel={customTapLabel} personalization={personalization} /></div>;
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
  "/assets/products/tapote-bg-restaurant-live-screen-v1.webp": "restaurant",
  "/assets/products/tapote-bg-restaurant-v1.webp": "restaurant",
  "/assets/products/tapote-bg-boulangerie-v1.webp": "boulangerie",
  "/assets/products/tapote-bg-beaute-v1.webp": "salon",
  "/assets/products/tapote-bg-medical-v1.webp": "cabinet_medical",
  "/assets/products/tapote-bg-retail-v1.webp": "boutique",
  "/assets/products/tapote-bg-hotel-v1.webp": "hotel",
  "/assets/products/tapote-bg-auto-ecole-v1.webp": "auto_ecole",
  "/assets/products/tapote-bg-automobile-v1.webp": "garage",
  "/assets/products/tapote-bg-artisan-v1.webp": "artisan",
  "/assets/products/tapote-bg-agence-v1.webp": "immobilier",
  "/assets/products/tapote-bg-sport-v1.webp": "salle_sport",
  "/assets/products/tapote-bg-formation-v1.webp": "coworking",
  "/assets/products/tapote-bg-evenement-v1.webp": "evenement",
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
  const [, , bottomRightRadius, bottomLeftRadius] = PHONE_SCREEN_CLIP_RADII[sceneImage]
    || (isRestaurantLiveScreen ? [60, 60, 78, 94] : [60, 60, 82, 76]);
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
    // SVG clips around foreignObject are not perfectly antialiased by every
    // Chromium scale. Mirror only the two photographed lower radii on the
    // HTML surface itself; the validated top edge and projection stay intact.
    "--v3-phone-bottom-right-radius": `${bottomRightRadius}px`,
    "--v3-phone-bottom-left-radius": `${bottomLeftRadius}px`,
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
  "/assets/products/tapote-bg-cafe-v1.webp": [[0.484577, 0.272529], [0.707072, 0.216924], [0.997888, 0.718486], [0.736645, 0.770518]],
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
  "/assets/products/tapote-bg-cafe-v1.webp": [60, 60, 80, 94],
  "/assets/products/tapote-bg-restaurant-v1.webp": [60, 60, 80, 118],
  "/assets/products/tapote-bg-boulangerie-v1.webp": [60, 60, 95, 79],
  "/assets/products/tapote-bg-beaute-v1.webp": [60, 60, 90, 83.5],
  "/assets/products/tapote-bg-medical-v1.webp": [58, 58, 62, 75],
  "/assets/products/tapote-bg-retail-v1.webp": [60, 60, 88, 79],
  "/assets/products/tapote-bg-hotel-v1.webp": [58, 58, 69, 58],
  "/assets/products/tapote-bg-auto-ecole-v1.webp": [60, 60, 105, 81],
  "/assets/products/tapote-bg-automobile-v1.webp": [58, 58, 77, 59],
  "/assets/products/tapote-bg-artisan-v1.webp": [54, 54, 67, 55],
  "/assets/products/tapote-bg-agence-v1.webp": [60, 60, 107.25, 76],
  "/assets/products/tapote-bg-sport-v1.webp": [60, 60, 108, 77],
  "/assets/products/tapote-bg-formation-v1.webp": [60, 60, 95, 71],
  "/assets/products/tapote-bg-evenement-v1.webp": [60, 60, 107, 83],
  "/assets/products/tapote-bg-animaux-v1.webp": [58, 58, 70, 77],
};

// Local control-point corrections for generated glass whose photographed
// rounded corner does not converge on the mathematical edge intersection.
// Values are photo pixels and affect only the curve, not the app perspective.
const PHONE_SCREEN_CLIP_CONTROL_OFFSETS = {
  "/assets/products/tapote-bg-beaute-v1.webp": { br: [-1.5, 7.25] },
  "/assets/products/tapote-bg-agence-v1.webp": { br: [-0.25, 7.25] },
  "/assets/products/tapote-bg-sport-v1.webp": { br: [-18.25, 3.25] },
  "/assets/products/tapote-bg-formation-v1.webp": { br: [-38, 0] },
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

function ProductScene({ image, alt, preview, compact = false, className = "", sectorId = "" }) {
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
  return <ProductScene image={sector.image} alt={`Tapote utilisé dans un univers ${sector.title}`} nativeAction={sector.actionIds[0]} preview={preview} compact={compact} className={className} sectorId={sector.id} />;
}

function CompositionPicker({ count, composition, onChange }) {
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

function BuyBox({ onAdd, initialSurface = "comptoir", initialAction = "avis", initialCount = 1, initialComposition, initialPersonalization = "ready", initialTheme = "blue", initialBrandName = "VOTRE MARQUE", initialDesignStyle = "signature", initialReadyHeadline = "", targetId = "cafe", title = "Choisissez votre Tapote.", productOnly = false, compact = false, allowAllSurfaces = false, onPreviewChange, draftKey = "" }) {
  const initialColors = DEVICE_THEMES[initialTheme] || DEVICE_THEMES.blue;
  const restoredDraft = useMemo(() => initialPersonalization === "custom" || draftKey.startsWith("cart:") ? loadConfigDraft(draftKey) : null, [draftKey, initialPersonalization]);
  const [personalization, setPersonalization] = useState(initialPersonalization);
  const [surface, setSurface] = useState(initialSurface);
  const [count, setCount] = useState(initialCount);
  const [actionId, setActionId] = useState(initialAction);
  const [composition, setComposition] = useState(initialComposition || (initialCount === 5 ? { comptoir: 2, plaque: 3 } : { comptoir: 1, plaque: 1 }));
  const [brandName, setBrandName] = useState(restoredDraft?.brandName || "");
  const [brandLogoId, setBrandLogoId] = useState(restoredDraft?.brandLogoId || "");
  const [brandLogo, setBrandLogo] = useState(() => getCachedLogoPreview(restoredDraft?.brandLogoId));
  const [logoFileName, setLogoFileName] = useState(restoredDraft?.logoFileName || "");
  const [readyDesignStyle, setReadyDesignStyle] = useState(initialDesignStyle);
  const [customDesignStyle, setCustomDesignStyle] = useState(restoredDraft?.designStyle || initialDesignStyle);
  const [customHeadline, setCustomHeadline] = useState(restoredDraft?.customHeadline || "");
  const [customSubline, setCustomSubline] = useState(restoredDraft?.customSubline || "");
  const [customTapLabel, setCustomTapLabel] = useState(restoredDraft?.customTapLabel || "");
  const [destinationUrl, setDestinationUrl] = useState(restoredDraft?.destinationUrl || "");
  const theme = initialTheme;
  const [primaryColor, setPrimaryColor] = useState(restoredDraft?.primaryColor || initialColors.paper);
  const [secondaryColor, setSecondaryColor] = useState(restoredDraft?.secondaryColor || initialColors.accent);
  const [textColor, setTextColor] = useState(restoredDraft?.textColor || initialColors.ink);
  const summaryRef = useRef(null);
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
  const availableActions = ACTION_ORDER
    .filter((id) => personalization !== "ready" || READY_ACTION_IDS.includes(id))
    .map((id) => ACTIONS[id]);
  const designStyle = personalization === "ready" ? readyDesignStyle : customDesignStyle;
  const previewBrandName = personalization === "ready" ? initialBrandName : brandName || "VOTRE MARQUE";
  const previewBrandLogo = personalization === "ready" ? "" : brandLogo;
  const previewPrimaryColor = personalization === "ready" ? initialColors.paper : primaryColor;
  const previewSecondaryColor = personalization === "ready" ? initialColors.accent : secondaryColor;
  const previewTextColor = personalization === "ready" ? initialColors.ink : textColor;
  const readyHeadline = personalization === "ready"
    ? actionId === initialAction && designStyle === initialDesignStyle && initialReadyHeadline
      ? initialReadyHeadline
      : campaignHeadlineForAction(actionId)
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
      setReadyDesignStyle(campaignStyleForAction("avis"));
    }
  };
  const selectAction = (value) => {
    markConfigurationStarted();
    const campaignStyle = campaignStyleForAction(value);
    setActionId(value);
    setReadyDesignStyle(campaignStyle);
    setCustomDesignStyle(campaignStyle);
  };
  const previewSurface = compositionSurface(safeCount, composition, surface);
  useEffect(() => {
    onPreviewChange?.({ surface: previewSurface, baseSurface: surface, actionId, brandName: previewBrandName, brandLogo: previewBrandLogo, theme, primaryColor: previewPrimaryColor, secondaryColor: previewSecondaryColor, textColor: previewTextColor, designStyle, customHeadline: previewHeadline, customSubline: personalization === "custom" ? customSubline : "", customTapLabel: personalization === "custom" ? customTapLabel : "", personalization, count: safeCount, composition, productId, productName: product.name, price: product.price });
  }, [actionId, composition, customSubline, customTapLabel, designStyle, onPreviewChange, personalization, previewBrandLogo, previewBrandName, previewHeadline, previewPrimaryColor, previewSecondaryColor, previewSurface, previewTextColor, product.name, product.price, productId, safeCount, surface, theme]);
  useEffect(() => {
    if (!draftKey || personalization !== "custom") return;
    try {
      window.sessionStorage.setItem(`${CONFIG_DRAFT_PREFIX}${draftKey}`, JSON.stringify({ actionId, count: safeCount, composition, brandName, brandLogoId, logoFileName, designStyle, customHeadline, customSubline, customTapLabel, destinationUrl, primaryColor, secondaryColor, textColor }));
    } catch { /* A full browser storage area must never block configuration or checkout. */ }
  }, [actionId, brandLogoId, brandName, composition, customHeadline, customSubline, customTapLabel, designStyle, destinationUrl, draftKey, logoFileName, personalization, primaryColor, safeCount, secondaryColor, textColor]);
  const selectCount = (value) => {
    markConfigurationStarted();
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
      designStyle,
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
  return (
    <section id={productOnly ? "configurer" : undefined} className={`v3-buybox ${compact ? "is-compact" : ""}`} aria-label="Configurer l’achat">
      <div className="v3-buybox-top"><span className="v3-rating"><Star size={14} fill="currentColor" /> Conçu pour les pros</span><span>NFC + QR · Sans application</span></div>
      <div className="v3-buybox-intro"><div><h2>{title}</h2><p>{personalization === "custom" ? "Personnalisez chaque détail ici : l’aperçu correspond au visuel qui sera imprimé." : "Un design Tapote prêt à servir, vers le lien de votre choix."} Le lien reste modifiable à vie.</p></div></div>
      <div className="v3-field-block">
        <span className="v3-field-label">1. Votre design</span>
        <div className="v3-design-choice">
          <button type="button" aria-pressed={personalization === "ready"} className={personalization === "ready" ? "is-selected" : ""} onClick={() => selectPersonalization("ready")}>
            <span><strong>Prêt à l’emploi</strong><small>{safeCount > 1 ? `Design optimisé · ${formatMoney(Math.round(readyChoicePrice / safeCount))} / support` : "Design optimisé pour le lien"}</small></span><b>{formatMoney(readyChoicePrice)}</b>
          </button>
          <button type="button" aria-pressed={personalization === "custom"} className={personalization === "custom" ? "is-selected" : ""} onClick={() => selectPersonalization("custom")}>
            <span><strong>Studio en direct</strong><small>{safeCount > 1 ? `Tout personnalisable · ${formatMoney(Math.round(customChoicePrice / safeCount))} / support` : "Logo, mise en page, textes et couleurs"}</small></span><b>{formatMoney(customChoicePrice)}</b>
          </button>
        </div>
      </div>
      {personalization === "ready" && !compact && <div className="v3-field-block v3-personalization-panel v3-campaign-design-panel"><span className="v3-field-label">Design Tapote recommandé</span><div className="v3-campaign-design-note"><Sparkles /><span><strong>{campaignHeadlineForAction(actionId)}</strong><small>Composition optimisée automatiquement pour {ACTIONS[actionId].name}.</small></span><a href="/designs">Voir la collection <ArrowRight /></a></div></div>}
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
            <span className="v3-field-label">Composition graphique</span>
            <div className="v3-style-picker">
              {Object.values(DESIGN_STYLES).map((style) => <button type="button" aria-pressed={customDesignStyle === style.id} className={customDesignStyle === style.id ? "is-selected" : ""} onClick={() => setCustomDesignStyle(style.id)} key={style.id}><strong>{style.name}</strong><small>{style.description}</small></button>)}
            </div>
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
            <span className="v3-field-label">Palette d’impression</span>
            <div className="v3-brand-colors" aria-label="Couleurs de votre identité">
            <label><span>Couleur principale</span><div><input type="color" value={primaryColor} onChange={(event) => { setPrimaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur principale" /><code>{primaryColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setPrimaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur principale à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <label><span>Couleur secondaire</span><div><input type="color" value={secondaryColor} onChange={(event) => { setSecondaryColor(event.target.value); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur secondaire" /><code>{secondaryColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setSecondaryColor(color); setPaletteDetected(false); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur secondaire à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <label><span>Couleur du texte</span><div><input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); setColorsManuallyEdited(true); setManualPalettePreserved(false); }} aria-label="Couleur du texte" /><code>{textColor.toUpperCase()}</code>{typeof window !== "undefined" && "EyeDropper" in window && <button type="button" onClick={() => pickScreenColor((color) => { setTextColor(color); setColorsManuallyEdited(true); setManualPalettePreserved(false); })} aria-label="Prélever la couleur du texte à l’écran"><Pipette size={14} /> Pipette</button>}</div></label>
            <small>{manualPalettePreserved ? "Logo importé : vos couleurs choisies ont été conservées." : paletteDetected ? "Palette détectée depuis votre logo. Ajustez-la si besoin." : "Choisissez les trois couleurs ou conservez la proposition Tapote."} Le contraste d’impression est sécurisé automatiquement et le QR reste noir sur blanc.</small>
            </div>
          </div>
          <p className="v3-studio-contract"><CheckCircle2 size={15} /><span><strong>Vous commandez ce que vous voyez.</strong><small>Pas de brief ni de validation ultérieure : contrôlez l’aperçu avant l’ajout au panier.</small></span></p>
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
        <select aria-label="Le lien à ouvrir" value={actionId} onChange={(event) => selectAction(event.target.value)}>
          {availableActions.map((action) => <option value={action.id} key={action.id}>{action.name}</option>)}
        </select>
        <label className={`v3-destination-field ${destinationInvalid ? "is-invalid" : ""}`}><Globe2 size={16} /><span><input type="url" value={destinationUrl} onFocus={markConfigurationStarted} onChange={(event) => setDestinationUrl(event.target.value.slice(0, 500))} placeholder="https://votre-lien.fr" aria-label="Adresse exacte à ouvrir" /><small>{destinationInvalid ? "Le lien doit commencer par https://" : "Adresse exacte encodée dans le NFC et le QR. Vous pourrez aussi la fournir après la commande."}</small></span></label>
      </div>
      <div className="v3-buybox-summary" ref={summaryRef}>
        <div><small>{product.name}</small><strong>{formatMoney(product.price)} <span>{taxLabel}</span></strong><em>{shipping === 0 ? "Livraison offerte" : `+ ${formatMoney(shipping)} de livraison`}</em></div>
        <button type="button" onClick={add} disabled={logoPending || destinationInvalid}>{logoPending ? logoPendingLabel : destinationInvalid ? "Vérifier le lien" : added ? <><Check size={18} /> Ajouté</> : <>Ajouter au panier <ArrowRight size={18} /></>}</button>
      </div>
      <div className="v3-buy-reassurance"><span><ShieldCheck size={16} /> Paiement sécurisé</span><span><PackageCheck size={16} /> Encodé et testé</span><span><Clock3 size={16} /> {STOREFRONT_PROMISES.fulfillment}</span><span><CheckCircle2 size={16} /> Remplacement si défaut NFC confirmé</span></div>
      {productOnly && <aside className={`v3-mobile-product-cta ${summaryVisible ? "is-summary-visible" : ""}`} aria-label="Résumé de la configuration"><span><small>{product.kind === "pack" && composition ? compositionLabel(composition) : product.name.replace(/ · .+$/, "")}</small><strong>{formatMoney(product.price)} {taxLabel}</strong></span><button type="button" onClick={add} disabled={logoPending || destinationInvalid}>{destinationInvalid ? "Lien invalide" : added ? "Ajouté" : "Ajouter"} <ArrowRight /></button></aside>}
    </section>
  );
}

const HOME_SCENES = {
  comptoir: { slug: "chevalet", label: "Chevalet A6", image: "/assets/products/tapote-bg-cafe-v1.webp", brandName: "CAFÉ NOMA", theme: "blue", nativeAction: "avis" },
  plaque: { slug: "plaque", label: "Plaque 12 × 12", image: "/assets/products/tapote-bg-boulangerie-v1.webp", brandName: "MAISON LEVAIN", theme: "sand", nativeAction: "fidelite" },
  carte: { slug: "carte", label: "Carte NFC", image: "/assets/products/tapote-bg-artisan-v1.webp", brandName: "ATELIER MARTIN", theme: "sand", nativeAction: "contact" },
};

function OfferArchitectureSection() {
  const offers = [
    {
      id: "ready",
      eyebrow: "PRÊT À L’EMPLOI",
      title: "L’essentiel, sans attendre.",
      copy: "Un design Tapote déjà composé. Choisissez le support et la destination, nous configurons le reste.",
      price: `Carte ${formatMoney(PRODUCTS.carte_standard.price)} · plaque ou chevalet ${formatMoney(PRODUCTS.plaque_standard.price)}`,
      href: "/boutique",
      cta: "Choisir un modèle prêt",
    },
    {
      id: "signature",
      eyebrow: "À VOTRE IMAGE · RECOMMANDÉ",
      title: "Votre marque passe devant.",
      copy: "Logo, palette, message et appel à l’action se règlent dans le studio avec un aperçu fidèle avant commande.",
      price: `Carte ${formatMoney(PRODUCTS.carte.price)} · plaque ou chevalet ${formatMoney(PRODUCTS.plaque.price)}`,
      href: "/personnaliser",
      cta: "Créer mon Tapote",
    },
    {
      id: "packs",
      eyebrow: "PACKS ÉQUIPEMENT",
      title: "Couvrez les bons moments.",
      copy: "Deux supports pour accueil + sortie, ou cinq supports pour équiper un lieu complet avec des liens distincts.",
      price: `Duo dès ${formatMoney(PRODUCTS.pack_duo_standard.price)} · cinq dès ${formatMoney(PRODUCTS.pack_cinq_standard.price)}`,
      href: "/boutique#packs",
      cta: "Voir les packs",
    },
  ];
  return (
    <section className="v3-section v3-offer-architecture" aria-labelledby="v3-offer-title">
      <div className="v3-section-heading">
        <span className="v3-eyebrow">UNE OFFRE LISIBLE</span>
        <h2 id="v3-offer-title">Commencez simple.<br />Équipez-vous au bon rythme.</h2>
        <p>Le NFC, le QR et la modification du lien sont toujours inclus. Vous payez davantage uniquement lorsque Tapote prépare votre identité ou plusieurs supports.</p>
      </div>
      <div className="v3-offer-lines">
        {offers.map((offer, index) => (
          <article className={offer.id === "signature" ? "is-featured" : ""} key={offer.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><small>{offer.eyebrow}</small><h3>{offer.title}</h3><p>{offer.copy}</p></div>
            <div><strong>{offer.price}</strong><a href={offer.href}>{offer.cta} <ArrowRight /></a></div>
          </article>
        ))}
      </div>
      <p className="v3-offer-volume"><Layers3 /> Dix supports ou plus ? <a href="/devis">Recevoir une composition et un tarif adaptés</a>.</p>
    </section>
  );
}

function HomePage({ onAdd }) {
  const [demoAction, setDemoAction] = useState("avis");
  const [heroSurface, setHeroSurface] = useState("comptoir");
  const [heroAction, setHeroAction] = useState("avis");
  const heroScene = HOME_SCENES[heroSurface];
  const heroPreview = { surface: heroSurface, actionId: heroAction, brandName: heroScene.brandName, theme: heroScene.theme, designStyle: campaignStyleForAction(heroAction), customHeadline: campaignHeadlineForAction(heroAction), personalization: "ready" };
  const readyPrice = PRODUCTS[getProductId(heroSurface, "ready", 1)].price;
  const customPrice = PRODUCTS[getProductId(heroSurface, "custom", 1)].price;
  const productLink = `/produits/${heroScene.slug}?mode=custom&action=${heroAction}`;
  return (
    <main id="main-content">
      <section className="v3-commerce-hero">
        <div className="v3-commerce-visual">
          <ProductScene key={`${heroSurface}-${heroAction}`} image={heroScene.image} alt={`${heroScene.label} Tapote utilisé par un client avec son téléphone`} nativeAction={heroScene.nativeAction} preview={heroPreview} className="v3-home-product-scene" />
          <div className="v3-visual-caption"><span>{heroScene.label}</span><strong>{ACTIONS[heroAction].name} s’ouvre sur le téléphone.</strong><small>NFC + QR · lien modifiable à vie</small></div>
        </div>
        <div className="v3-commerce-buy">
          <span className="v3-eyebrow"><Sparkles size={14} /> SUPPORTS NFC + QR POUR PROFESSIONNELS</span>
          <h1>Un geste.<br />Le bon lien.</h1>
          <p className="v3-home-lead">Transformez chaque visite en avis, réservation, menu, paiement ou contact — sans application ni recherche.</p>
          <div className="v3-home-quick-buy">
            <fieldset><legend>1. Le support</legend><div>{Object.entries(HOME_SCENES).map(([surface, scene]) => <button type="button" aria-pressed={heroSurface === surface} className={heroSurface === surface ? "is-selected" : ""} onClick={() => setHeroSurface(surface)} key={surface}><strong>{scene.label}</strong><small>{surface === "comptoir" ? "Visible au comptoir" : surface === "plaque" ? "Compacte et bien lisible" : "À présenter en main"}</small></button>)}</div></fieldset>
            <label><span>2. Le lien à ouvrir</span><select value={heroAction} onChange={(event) => setHeroAction(event.target.value)}>{READY_ACTION_IDS.map((id) => <option value={id} key={id}>{ACTIONS[id].name}</option>)}</select></label>
            <div className="v3-home-price"><span>À votre image</span><strong>{formatMoney(customPrice)}</strong><small>Prêt à l’emploi {formatMoney(readyPrice)} · {taxLabel}</small></div>
            <div className="v3-home-ctas"><a href={productLink}>Créer mon Tapote <ArrowRight /></a><button type="button" onClick={() => onAdd(makeCartItem(getProductId(heroSurface, "ready", 1), heroAction))}>Ajouter le prêt · {formatMoney(readyPrice)} <Plus /></button></div>
            <a className="v3-home-demo-link" href="#demo">Voir la démo en 8 secondes <Play size={13} /></a>
          </div>
        </div>
      </section>

      <section className="v3-proof-band" aria-label="Garanties Tapote">
        <span><CheckCircle2 /> NFC + QR sur chaque support</span>
        <span><Palette /> Prêt ou entièrement personnalisé</span>
        <span><Link2 /> Destination modifiable à distance</span>
        <span><Truck /> Livraison offerte dès 69 €</span>
      </section>

      <section className="v3-demo-section" id="demo">
        <div className="v3-demo-copy">
          <span className="v3-eyebrow v3-eyebrow-dark"><Play size={13} fill="currentColor" /> DÉMO · 8 SECONDES</span>
          <h2>Votre client comprend.<br />Il tapote. C’est fait.</h2>
          <p>Pas d’application, pas de recherche, pas d’explication compliquée. Tapote ouvre directement l’action que vous avez choisie.</p>
          <div className="v3-action-tabs">
            {FEATURED_ACTIONS.map((id) => <button type="button" aria-pressed={demoAction === id} className={demoAction === id ? "is-selected" : ""} onClick={() => setDemoAction(id)} key={id}>{ACTIONS[id].name}</button>)}
          </div>
          <a className="v3-text-link" href="/comment-ca-marche">Voir comment le lien se modifie <ArrowRight size={16} /></a>
        </div>
        <ProductScene key={`demo-${demoAction}`} image="/assets/products/tapote-bg-cafe-v1.webp" alt={`Démonstration réaliste du chevalet ouvrant ${ACTIONS[demoAction].name}`} nativeAction="avis" preview={{ surface: "comptoir", actionId: demoAction, brandName: "CAFÉ NOMA", theme: "blue", designStyle: campaignStyleForAction(demoAction), customHeadline: campaignHeadlineForAction(demoAction), personalization: "ready" }} className="v3-demo-player" />
      </section>

      <OfferArchitectureSection />
      <WhyTapote />
      <DesignLibraryPreview />
      <SectorPreview />
      <FaqSection />
      <section className="v3-final-buy v3-home-final">
        <span>PRÊT À CRÉER LE VÔTRE ?</span>
        <h2>Votre marque.<br />Le bon geste.</h2>
        <p>Créez le visuel en direct, vérifiez chaque détail et commandez seulement quand il vous ressemble.</p>
        <a href="/personnaliser">Créer mon Tapote <ArrowRight /></a>
      </section>
    </main>
  );
}

function DesignSpecimen({ preset, compact = false }) {
  const productName = preset.surface === "comptoir" ? "Chevalet A6" : preset.surface === "plaque" ? "Plaque 12 × 12" : "Carte NFC";
  const productSlug = preset.surface === "comptoir" ? "chevalet" : preset.surface;
  const preview = { surface: preset.surface, actionId: preset.actionId, brandName: preset.brandName, theme: preset.theme, designStyle: preset.designStyle, customHeadline: preset.title, personalization: "ready" };
  return (
    <a className={`v3-design-specimen ${compact ? "is-compact" : ""}`} href={`/produits/${productSlug}?mode=ready&design=${encodeURIComponent(preset.id)}&action=${encodeURIComponent(preset.actionId)}`} onClick={() => trackStorefrontEvent("select_design", { design_id: preset.id, action_id: preset.actionId, surface: preset.surface })}>
      <div className="v3-design-specimen-visual">
        <ProductScene image={designSceneImage(preset)} alt={`${productName} Tapote au design « ${preset.title} » dans une scène réelle, avec le téléphone qui ouvre ${ACTIONS[preset.actionId].name}`} nativeAction={preset.actionId} preview={preview} compact />
        <span>{productName}</span>
      </div>
      <div className="v3-design-specimen-copy">
        <small>{preset.category} · {ACTIONS[preset.actionId].name}</small>
        <h3>{preset.title}</h3>
        {!compact && <p>{preset.description}</p>}
        <strong>{compact ? "Voir le design" : "Partir de ce design"} <ArrowRight /></strong>
      </div>
    </a>
  );
}

function DesignLibraryPreview() {
  const featured = DESIGN_PRESETS.filter((preset) => ["avis-pulse", "instagram", "facebook", "menu", "wifi", "contact"].includes(preset.id));
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
        <span className="v3-eyebrow"><Palette /> 1 SYSTÈME TAPOTE · 19 CAMPAGNES</span>
        <h1>Le bon design<br />pour le bon geste.</h1>
        <p>Une architecture reconnaissable, déclinée en 19 campagnes selon le lien à ouvrir. Gardez les couleurs Tapote ou adaptez l’ensemble à votre marque.</p>
      </header>
      <section className="v3-designs-toolbar" aria-label="Filtrer les designs">
        <span>{filtered.length} campagne{filtered.length > 1 ? "s" : ""}</span>
        <div role="group" aria-label="Filtrer par type de campagne">{DESIGN_CATEGORIES.map((name) => <button type="button" aria-pressed={category === name} className={category === name ? "is-selected" : ""} onClick={() => setCategory(name)} key={name}>{name}</button>)}</div>
      </section>
      <section className="v3-designs-grid">{filtered.map((preset) => <DesignSpecimen preset={preset} key={preset.id} />)}</section>
    </main>
  );
}

const SHOP_ITEMS = [
  { category: "chevalet", surface: "comptoir", slug: "chevalet", image: "/assets/products/tapote-template-chevalet-v1.webp", promise: "Vertical, visible et idéal à la caisse ou à l’accueil.", spec: "A6 vertical · support transparent" },
  { category: "plaque", surface: "plaque", slug: "plaque", image: "/assets/products/tapote-plaque-avis-studio-v2.webp", promise: "Debout sur le comptoir, compacte et lisible au moment de tapoter.", spec: "12 × 12 cm · PMMA rigide" },
  { category: "carte", surface: "carte", slug: "carte", image: "/assets/products/tapote-template-carte-v1.webp", promise: "Présentée en main pendant un rendez-vous ou sur le terrain.", spec: "85 × 54 mm · format poche" },
];

function ShopPage({ onAdd, initialCategory = "tous", availableProductIds }) {
  const [personalization, setPersonalization] = useState("ready");
  const [view, setView] = useState(initialCategory === "packs" || window.location.hash === "#packs" ? "packs" : "supports");
  const packIds = (personalization === "ready" ? ["pack_duo_standard", "pack_cinq_standard"] : ["pack_duo", "pack_cinq"])
    .filter((productId) => !availableProductIds || availableProductIds.has(productId));
  const addProduct = (surface) => onAdd(makeCartItem(getProductId(surface, personalization, 1), "avis"));
  return (
    <main id="main-content" className="v3-shop">
      <header className="v3-shop-hero">
        <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>Boutique</b></nav>
        <span className="v3-eyebrow">3 FORMATS · 2 FINITIONS</span>
        <h1>Choisissez votre Tapote.</h1>
        <p>Chaque support arrive avec NFC + QR configurés, testés et reliés à une destination que vous pourrez changer gratuitement.</p>
      </header>
      <section className="v3-shop-controls" id="choisir-support" aria-label="Filtres de la boutique">
        <div className="v3-shop-categories" role="group" aria-label="Afficher les supports ou les packs">
          {[{ id: "supports", label: "Les 3 supports" }, { id: "packs", label: "Packs · dès 17,80 € / support" }].map((item) => <button type="button" aria-pressed={view === item.id} className={view === item.id ? "is-selected" : ""} onClick={() => { setView(item.id); trackStorefrontEvent("select_offer", { offer_view: item.id }); }} key={item.id}>{item.label}</button>)}
        </div>
        <div className="v3-shop-range" role="group" aria-label="Choisir la finition">
          <span>Votre finition</span>
          <button type="button" aria-pressed={personalization === "ready"} className={personalization === "ready" ? "is-selected" : ""} onClick={() => setPersonalization("ready")}><strong>Prêt à l’emploi</strong><small>Dès 19 €</small></button>
          <button type="button" aria-pressed={personalization === "custom"} className={personalization === "custom" ? "is-selected" : ""} onClick={() => setPersonalization("custom")}><strong>À votre image</strong><small>Dès 29 €</small></button>
        </div>
      </section>
      {view === "supports" && <section className="v3-shop-grid" aria-label="Supports Tapote" key={`supports-${personalization}`}>
        {SHOP_ITEMS.filter((item) => !availableProductIds || availableProductIds.has(getProductId(item.surface, personalization, 1))).map((item) => {
          const productId = getProductId(item.surface, personalization, 1);
          const product = PRODUCTS[productId];
          const scene = HOME_SCENES[item.surface];
          const preview = { surface: item.surface, actionId: "avis", brandName: scene.brandName, theme: scene.theme, primaryColor: personalization === "custom" ? DEVICE_THEMES[scene.theme].paper : "", secondaryColor: personalization === "custom" ? DEVICE_THEMES[scene.theme].accent : "", textColor: personalization === "custom" ? DEVICE_THEMES[scene.theme].ink : "", designStyle: campaignStyleForAction("avis"), customHeadline: campaignHeadlineForAction("avis"), personalization };
          return <article className="v3-shop-card" data-variant={personalization} key={`${item.surface}-${personalization}`}>
            <a className="v3-shop-card-image" href={`/produits/${item.slug}?mode=${personalization}`}><ProductScene image={scene.image} alt={`${product.shortName} Tapote ${personalization === "ready" ? "prêt à l’emploi" : "personnalisé"} dans une scène réelle`} nativeAction={scene.nativeAction} preview={preview} compact /><span>{product.badge}</span><b className="v3-shop-card-price-chip">{formatMoney(product.price)} {taxLabel}</b><small>{personalization === "ready" ? "Design Tapote" : "Studio en direct"}</small></a>
            <div className="v3-shop-card-copy"><small>{personalization === "ready" ? "PRÊT À L’EMPLOI" : "À VOTRE IMAGE"}</small><h2>{product.shortName}</h2><p>{item.promise}</p><div><strong>{formatMoney(product.price)} <small>{taxLabel}</small></strong>{personalization === "ready" ? <button type="button" onClick={() => addProduct(item.surface)}>Ajouter · Avis <Plus /></button> : <a className="v3-shop-configure" href={`/produits/${item.slug}?mode=custom`}>Personnaliser <ArrowRight /></a>}</div><ul><li><Check /> {item.spec}</li><li><Check /> NFC + QR configurés et testés</li><li><Check /> {personalization === "ready" ? "Design Tapote · lien modifiable" : "Logo, textes et couleurs en direct"}</li></ul><a href={`/produits/${item.slug}?mode=${personalization}`}>Voir la fiche produit <ArrowRight /></a></div>
          </article>;
        })}
      </section>}
      {view === "packs" && <section className="v3-shop-packs" id="packs" key={`packs-${personalization}`}>
        <div className="v3-section-heading">
          <span className="v3-eyebrow">OFFRES ÉQUIPEMENT</span>
          <h2>Équipez plus.<br />Payez moins.</h2>
          <p>Accueil, caisse, tables ou sortie&nbsp;: placez Tapote là où le geste devient naturel. Chaque support peut ouvrir son propre lien, modifiable à vie.</p>
          <div className="v3-pack-proof" aria-label="Avantages des packs">
            <span><Link2 /> Liens indépendants</span>
            <span><Sparkles /> Même identité partout</span>
            <span><Truck /> Livraison offerte dès 69&nbsp;€</span>
          </div>
        </div>
        <div className="v3-shop-pack-list">{packIds.map((productId) => {
          const product = PRODUCTS[productId];
          const savings = Math.max(0, product.value - product.price);
          const savingsPercent = Math.round((savings / product.value) * 100);
          const isBestValue = product.supportCount === 5;
          const locations = isBestValue
            ? [
              { place: "Accueil", action: "Infos" },
              { place: "Tables", action: "Menu" },
              { place: "Caisse", action: "Avis" },
              { place: "Sortie", action: "Fidélité" },
              { place: "Équipe", action: "Contact" },
            ]
            : [{ place: "Accueil", action: "Infos" }, { place: "Caisse", action: "Avis" }];
          return <article className={`v3-shop-pack-card ${isBestValue ? "is-best-value" : "is-starter"}`} key={productId}>
            <header className="v3-pack-card-top">
              <span>{isBestValue ? "PACK ÉTABLISSEMENT" : "PACK DÉMARRAGE"}</span>
              {isBestValue && <b><Star /> LE PLUS RENTABLE</b>}
            </header>
            <div className="v3-pack-support-map" aria-label={`${product.supportCount} points de contact suggérés`}>
              {locations.map((location, index) => <div key={location.place}><i className={index % 3 === 0 ? "is-stand" : "is-plaque"}><span /></i><small><b>{location.place}</b><span>{location.action}</span></small></div>)}
            </div>
            <div className="v3-pack-card-copy">
              <span>{product.supportCount} SUPPORTS · {personalization === "ready" ? "PRÊTS À SERVIR" : "À VOTRE IMAGE"}</span>
              <h3>{isBestValue ? "Couvrez tout votre lieu." : "Commencez aux deux moments clés."}</h3>
              <p>{isBestValue ? "La formule pensée pour ne laisser aucun point de contact au hasard." : "Le bon format pour tester Tapote à l’accueil et au moment de payer."}</p>
              <div className="v3-pack-price-row">
                <strong>{formatMoney(product.price)} <small>{taxLabel}</small></strong>
                <div><b>{formatMoney(Math.round(product.price / product.supportCount))} / support</b><span>au lieu de {formatMoney(Math.round(product.value / product.supportCount))}</span></div>
              </div>
              <div className="v3-pack-saving"><CircleDollarSign /><strong>Vous économisez {formatMoney(savings)}</strong><span>· jusqu’à {savingsPercent}&nbsp;% de moins</span></div>
              <ul>{product.features.map((feature) => <li key={feature}><CheckCircle2 /> {feature}</li>)}</ul>
              <a className="v3-shop-pack-configure" href={`/produits/chevalet?mode=${personalization}&count=${product.supportCount}&action=avis`}>{isBestValue ? "Équiper mon établissement" : "Composer mon pack de 2"} <ArrowRight /></a>
              <small className="v3-pack-cta-note">Composition choisie à l’étape suivante · aucun lien imposé</small>
            </div>
          </article>;
        })}</div>
        <p>10 supports ou plus ? <a href="/devis">Demandez votre tarif volume</a>.</p>
      </section>}
      <section className="v3-shop-volume" aria-label="Devis volume et multi-sites">
        <div>
          <span className="v3-eyebrow">VOLUME & MULTI-SITES</span>
          <h2>Plusieurs points de vente ?<br />Toute une équipe à équiper ?</h2>
          <p>À partir de 10 supports, on établit une composition et un tarif adaptés tout en gardant une identité cohérente sur tous vos lieux.</p>
        </div>
        <div className="v3-shop-volume-side">
          <ul><li><Check /> Tarif adapté dès 10 supports</li><li><Check /> Un interlocuteur dédié</li><li><Check /> Fichiers et facturation groupés</li></ul>
          <a href="/devis">Demander un devis volume <ArrowRight /></a>
        </div>
      </section>
      <section className="v3-proof-band" aria-label="Garanties Tapote"><span><ShieldCheck /> Paiement sécurisé</span><span><FileCheck2 /> Aperçu d’impression en direct</span><span><PackageCheck /> NFC + QR contrôlés</span><span><Link2 /> Modifications gratuites</span></section>
      <WhyTapote />
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

function HowStrip() {
  return (
    <section className="v3-section v3-how-strip">
      <div className="v3-section-heading"><span className="v3-eyebrow">PRÊT SANS PRISE DE TÊTE</span><h2>Vous choisissez. On prépare. Vous posez.</h2></div>
      <div className="v3-step-grid">
        <article><b>01</b><Palette /><h3>Choisissez le style</h3><p>Prêt à l’emploi ou entièrement à votre image.</p></article>
        <article><b>02</b><Upload /><h3>Donnez le lien</h3><p>Maintenant, après la commande ou plus tard.</p></article>
        <article><b>03</b><FileCheck2 /><h3>Vérifiez l’aperçu</h3><p>Votre configuration visible est enregistrée avec la commande.</p></article>
        <article><b>04</b><PackageCheck /><h3>Posez et tapotez</h3><p>NFC et QR sont encodés, testés et prêts.</p></article>
      </div>
    </section>
  );
}

const WHY_TAPOTE = [
  { icon: CircleDollarSign, title: "Un prix complet", copy: "Support, impression, NFC, QR et service de changement de lien sont réunis dans le prix affiché." },
  { icon: FileCheck2, title: "Votre visuel avant l’achat", copy: "Logo, textes, palette et composition se règlent dans le studio puis sont enregistrés avec la commande." },
  { icon: Link2, title: "Le lien reste modifiable à vie", copy: "Changez la destination quand vous voulez, sans réimprimer et sans abonnement obligatoire." },
  { icon: SmartphoneNfc, title: "NFC + QR testés un par un", copy: "Les deux accès sont vérifiés sur téléphone, support par support, avant la livraison." },
];

function WhyTapote() {
  return (
    <section className="v3-section v3-why">
      <div className="v3-why-head">
        <span className="v3-eyebrow"><ShieldCheck size={14} /> CE QUE LE PRIX COMPREND</span>
        <h2>Un objet prêt à servir.<br />Pas une puce à débrouiller.</h2>
        <p>Tapote réunit le support, le visuel, la configuration et le contrôle dans une seule commande. Vous choisissez le moment et le lien ; nous préparons le geste complet.</p>
      </div>
      <div className="v3-why-grid">
        {WHY_TAPOTE.map(({ icon: Icon, title, copy }) => (
          <article key={title}>
            <i aria-hidden="true"><Icon /></i>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const questions = [
    ["Puis-je changer le lien après réception ?", "Oui, autant de fois que vous voulez et à distance. Ce changement reste gratuit et ne demande aucun nouvel imprimé."],
    ["Que se passe-t-il si le NFC ne fonctionne pas ?", "Chaque support est testé avant l’envoi et le QR code reste disponible. En cas de défaut confirmé, le support est pris en charge par Tapote."],
    ["Puis-je ouvrir autre chose qu’un avis Google ?", "Oui : menu, réservation, site, Wi-Fi, paiement, Instagram, formulaire, page multi-liens ou toute URL sécurisée."],
    ["Le logo est-il vraiment inclus ?", "Oui dans le Studio en direct : importez votre logo, ajustez les textes, la composition et les couleurs, puis commandez le visuel affiché."],
    ["Un abonnement est-il nécessaire ?", "Non. Le support, son lien et les modifications de destination à distance restent utilisables sans abonnement obligatoire."],
    ["Quand vais-je recevoir ma commande ?", "Le délai applicable est confirmé à la prise en charge de la commande. Il commence après le paiement et, lorsqu’une validation est nécessaire, après l’accord sur le visuel."],
    ["Tapote filtre-t-il les clients avant un avis Google ?", "Non. Tapote ne cache jamais le lien d’avis selon la satisfaction, ne promet pas de note et n’encourage aucune récompense contre un avis. Un formulaire privé peut exister en parallèle, sans bloquer l’accès à l’avis public."],
  ];
  return <section className="v3-section v3-faq"><div className="v3-section-heading"><span className="v3-eyebrow">QUESTIONS FRÉQUENTES</span><h2>Tout ce qui doit être clair.</h2></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus /></summary><p>{answer}</p></details>)}</div></section>;
}

function ProductPage({ page, onAdd, forcedMode = "" }) {
  const data = PRODUCT_PAGES[page];
  const params = new URLSearchParams(window.location.search);
  const editIndexParam = params.get("edit");
  const replaceCartIndex = /^\d+$/.test(editIndexParam || "") ? Number(editIndexParam) : null;
  const draftKey = params.get("draft") || `product:${data?.key || page}`;
  const requestedPreset = DESIGN_PRESETS.find((preset) => preset.id === params.get("design") && preset.surface === data?.key);
  const requestedAction = requestedPreset?.actionId || (ACTIONS[params.get("action")] ? params.get("action") : "avis");
  const requestedMode = forcedMode || (params.get("mode") === "custom" ? "custom" : "ready");
  const requestedCount = [2, 5].includes(Number(params.get("count"))) ? Number(params.get("count")) : 1;
  const requestedCompositionParam = params.get("composition");
  const requestedComposition = requestedCount > 1
    ? requestedCompositionParam === "plaques" ? { comptoir: 0, plaque: requestedCount }
      : requestedCompositionParam === "chevalets" ? { comptoir: requestedCount, plaque: 0 }
        : requestedCount === 5 ? { comptoir: 2, plaque: 3 } : { comptoir: 1, plaque: 1 }
    : undefined;
  const scene = HOME_SCENES[data?.key || "comptoir"];
  const requestedTheme = requestedPreset?.theme || scene.theme;
  const requestedBrandName = requestedPreset?.brandName || scene.brandName;
  const requestedDesignStyle = requestedPreset?.designStyle || campaignStyleForAction(requestedAction);
  const requestedReadyHeadline = requestedPreset?.title || campaignHeadlineForAction(requestedAction);
  const [preview, setPreview] = useState({
    surface: compositionSurface(requestedCount, requestedComposition, data?.key || "comptoir"),
    actionId: requestedAction,
    brandName: requestedBrandName,
    theme: requestedTheme,
    designStyle: requestedDesignStyle,
    customHeadline: requestedReadyHeadline,
    personalization: requestedMode,
    count: requestedCount,
    composition: requestedComposition,
  });
  const [mobilePreviewExpanded, setMobilePreviewExpanded] = useState(false);
  const productViewTrackedRef = useRef(false);
  useEffect(() => {
    if (!data || productViewTrackedRef.current) return;
    productViewTrackedRef.current = true;
    trackStorefrontEvent("view_product", {
      product_id: data.key,
      product_name: data.name,
      action_id: requestedAction,
      personalization: requestedMode,
    });
  }, [data, requestedAction, requestedMode]);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("action", preview.actionId);
    url.searchParams.set("mode", preview.personalization);
    if (!requestedPreset || preview.personalization !== "ready" || preview.actionId !== requestedPreset.actionId || preview.designStyle !== requestedPreset.designStyle) url.searchParams.delete("design");
    if (preview.count > 1) {
      url.searchParams.set("count", String(preview.count));
      url.searchParams.set("composition", compositionParam(preview.composition));
    } else {
      url.searchParams.delete("count");
      url.searchParams.delete("composition");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [preview.actionId, preview.composition, preview.count, preview.designStyle, preview.personalization, requestedPreset]);
  useEffect(() => {
    if (!data) return;
    const productLabel = preview.count > 1
      ? `Pack ${compositionLabel(preview.composition) || `${preview.count} supports`}`
      : data.name;
    const title = `${productLabel}${/nfc/i.test(productLabel) ? "" : " NFC"} + QR | Tapote`;
    const description = `${productLabel} Tapote pour ouvrir ${ACTIONS[preview.actionId]?.name || "le lien de votre choix"}. NFC + QR configurés, lien modifiable à vie.`;
    document.title = title;
    setMetaContent("name", "description", description);
    setMetaContent("property", "og:title", title);
    setMetaContent("property", "og:description", description);
    setMetaContent("name", "twitter:title", title);
    setMetaContent("name", "twitter:description", description);
  }, [data, preview.actionId, preview.composition, preview.count]);
  if (!data) return <NotFound />;
  const submitProduct = (item) => onAdd(item, replaceCartIndex === null ? undefined : { replaceIndex: replaceCartIndex, returnToCart: true });
  const presentation = productPresentation(data, preview);
  const readyPrice = PRODUCTS[getProductId(data.key, "ready", preview.count || 1)].price;
  const customPrice = PRODUCTS[getProductId(data.key, "custom", preview.count || 1)].price;
  const related = SHOP_ITEMS.filter((item) => item.slug !== page);
  return (
    <main id="main-content">
      <section className="v3-product-hero">
        <div className={`v3-product-gallery v3-product-live-gallery ${mobilePreviewExpanded ? "is-mobile-expanded" : ""}`}>
          <ProductScene image={scene.image} alt={`${presentation.label} Tapote en situation réelle avec un téléphone affichant ${ACTIONS[preview.actionId]?.name || "le lien choisi"}`} nativeAction={scene.nativeAction} preview={preview} className="v3-product-main-image" />
          {data.key === "carte" && <div className="v3-card-two-sides" aria-label="La Carte NFC Tapote possède un recto NFC et un verso QR">
            <span className="v3-card-face-note is-front"><SmartphoneNfc aria-hidden="true" /><span><b>RECTO · NFC</b><small>Un devant net, pensé pour donner envie de tapoter.</small></span></span>
            <span className="v3-card-face-note is-back"><span className="v3-card-back-qr"><img src="/brand/tapote-qr-demo.svg" alt="" /></span><span><b>VERSO · QR</b><small>Le même lien de secours, toujours modifiable à vie.</small></span></span>
          </div>}
          <div className="v3-product-live-caption">
            <span><i /> APERÇU SYNCHRONISÉ</span>
            <strong>Le support imprimé et l’écran changent ensemble.</strong>
            <small>La photo reste la même pour comparer sans perdre le contexte.</small>
            <em className="v3-mobile-preview-context">{presentation.label} · {ACTIONS[preview.actionId]?.name || "Lien choisi"}</em>
            <button className="v3-mobile-preview-toggle" type="button" aria-pressed={mobilePreviewExpanded} onClick={() => setMobilePreviewExpanded((expanded) => !expanded)}>{mobilePreviewExpanded ? "Réduire" : "Agrandir"}</button>
          </div>
        </div>
        <div className="v3-product-buy-column">
          <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><a href="/boutique">Boutique</a><span>/</span><b>{presentation.label}</b></nav>
          <span className="v3-eyebrow">{presentation.kicker}</span><h1>{presentation.label}</h1><p className="v3-product-lead">{presentation.description}</p>{data.key === "carte" && <div className="v3-card-product-proof"><CheckCircle2 aria-hidden="true" /><span><strong>Recto NFC + verso QR inclus</strong><small>Le recto reste élégant. Le QR de secours reste disponible au dos.</small></span></div>}<div className="v3-product-price-line"><span>{preview.count > 1 ? "Pack prêt à l’emploi" : "Prêt à l’emploi"} <strong>{formatMoney(readyPrice)}</strong></span><span>{preview.count > 1 ? "Pack à votre image" : "À votre image"} <strong>{formatMoney(customPrice)}</strong></span><small>{taxLabel} · sans abonnement requis</small></div>
          {replaceCartIndex !== null && <div className="v3-editing-cart-notice" role="status"><FileCheck2 /><span><strong>Vous modifiez un article du panier.</strong><small>L’ajout remplacera sa configuration actuelle.</small></span><a href="/panier">Annuler</a></div>}
          <BuyBox onAdd={submitProduct} initialSurface={data.key} initialAction={requestedAction} initialCount={requestedCount} initialComposition={requestedComposition} initialPersonalization={requestedMode} initialTheme={requestedTheme} initialBrandName={requestedBrandName} initialDesignStyle={requestedDesignStyle} initialReadyHeadline={requestedReadyHeadline} productOnly title={presentation.title} onPreviewChange={setPreview} draftKey={draftKey} />
        </div>
      </section>
      <section className="v3-product-facts" aria-label="Informations essentielles du produit"><div><MapPin /><span><strong>Où le placer</strong>{presentation.placements}</span></div><div><Layers3 /><span><strong>Format réel</strong>{presentation.size}</span></div><div><ShieldCheck /><span><strong>Contrôle avant envoi</strong>{preview.count > 1 ? `${preview.count} NFC encodés + ${preview.count} QR contrôlés` : STOREFRONT_PROMISES.quality}</span></div><div><Clock3 /><span><strong>Préparation</strong>{STOREFRONT_PROMISES.fulfillment}</span></div></section>
      <section className="v3-section v3-detail-story"><div><span className="v3-eyebrow">VOTRE TAPOTE, PAS CELUI DE TOUT LE MONDE</span><h2>Assez simple pour être utilisé.<br />Assez beau pour rester visible.</h2><p>Un support connecté ne sert que s’il attire le regard, explique le geste et respecte le lieu où il est posé. Chaque design Tapote hiérarchise votre marque, l’action et les zones NFC/QR sans surcharge.</p></div><div className={`v3-detail-product-art ${preview.surface === "mix" ? "is-mix" : ""}`}>{preview.surface === "mix" ? <><ProductArt {...preview} surface="comptoir" /><ProductArt {...preview} surface="plaque" /></> : <ProductArt {...preview} surface={preview.surface} />}</div></section>
      <section className="v3-section v3-product-details">
        <div className="v3-section-heading"><span className="v3-eyebrow">EN DÉTAIL</span><h2>Tout est clair avant d’acheter.</h2><p>Le support, la configuration et le service de changement de lien forment un seul produit.</p></div>
        <div className="v3-product-detail-grid">
          <article><SmartphoneNfc /><h3>Caractéristiques</h3><ul>{presentation.technical.map((detail) => <li key={detail}><Check /> {detail}</li>)}</ul></article>
          <article><Sparkles /><h3>Ce que vous recevez</h3><p>{presentation.inBox}</p><ul><li><Check /> Encodage individuel</li><li><Check /> Test NFC et QR avant envoi</li><li><Check /> Accès gratuit pour modifier le lien</li></ul></article>
          <article><MapPin /><h3>Cas d’usage</h3><ul>{presentation.uses.map((use) => <li key={use}><Check /> {use}</li>)}</ul></article>
          <article><PackageCheck /><h3>Après la commande</h3><ul><li><Check /> Configuration enregistrée</li><li><Check /> Délai confirmé à la prise en charge</li><li><Check /> Contrôle NFC + QR avant envoi</li></ul></article>
        </div>
      </section>
      <HowStrip />
      <FaqSection />
      <section className="v3-section v3-related-products"><div className="v3-section-heading"><span className="v3-eyebrow">COMPLÉTEZ VOS POINTS DE CONTACT</span><h2>Vous aimerez aussi.</h2></div><div>{related.map((item) => {
        const relatedScene = HOME_SCENES[item.surface];
        const relatedPreview = { surface: item.surface, actionId: "avis", brandName: relatedScene.brandName, theme: relatedScene.theme, designStyle: "pulse", customHeadline: "Vous avez aimé ? Tapotez.", personalization: "ready" };
        return <a href={`/produits/${item.slug}`} key={item.slug}><ProductScene image={relatedScene.image} alt={`${PRODUCT_PAGES[item.slug].name} Tapote en situation réelle`} nativeAction={relatedScene.nativeAction} preview={relatedPreview} compact /><span>{PRODUCT_PAGES[item.slug].kicker}</span><h3>{PRODUCT_PAGES[item.slug].name}</h3><strong>Dès {formatMoney(PRODUCTS[`${item.surface}_standard`]?.price || PRODUCTS.carte_standard.price)}</strong><em>Voir le produit <ArrowRight /></em></a>;
      })}</div></section>
    </main>
  );
}

function SectorsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const searchId = useId();
  const filtered = SECTORS.filter((sector) => (category === "Tous" || sector.category === category) && `${sector.title} ${sector.description}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main id="main-content" className="v3-directory">
      <header className="v3-directory-hero"><span className="v3-eyebrow">{SECTORS.length} SECTEURS, DES USAGES CONCRETS</span><h1>Comment Tapote peut<br />servir votre activité ?</h1><p>Choisissez votre métier. On vous montre le bon emplacement, la bonne action et le pack qui suffit vraiment.</p></header>
      <section className="v3-directory-tools" aria-label="Rechercher et filtrer les secteurs"><label htmlFor={searchId}><span className="v3-visually-hidden">Rechercher un secteur</span><Search aria-hidden="true" /><input id={searchId} type="search" name="sectorSearch" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un secteur…" autoComplete="off" /></label><div role="group" aria-label="Filtrer par catégorie de secteur"><button type="button" aria-pressed={category === "Tous"} className={category === "Tous" ? "is-selected" : ""} onClick={() => setCategory("Tous")}>Tous</button>{SECTOR_CATEGORIES.map((name) => <button type="button" aria-pressed={category === name} className={category === name ? "is-selected" : ""} onClick={() => setCategory(name)} key={name}>{name}</button>)}</div></section>
      <section className="v3-sector-directory-grid">{filtered.map((sector) => {
        const preview = { surface: sectorDefaultSurface(sector), actionId: sector.actionIds[0], brandName: sector.exampleBrand || "VOTRE MARQUE", theme: sector.theme || "blue", designStyle: campaignStyleForAction(sector.actionIds[0]), customHeadline: campaignHeadlineForAction(sector.actionIds[0]), personalization: "ready" };
        return <a href={`/secteurs/${sector.slug}`} key={sector.id}><SectorScene sector={sector} preview={preview} compact /><span>{sector.category}</span><h2>{sector.title}</h2><p>{sector.description}</p><strong>Voir la solution <ArrowRight /></strong></a>;
      })}</section>
      {!filtered.length && <p className="v3-no-result">Aucun secteur ne correspond. Tapote peut tout de même ouvrir n’importe quel lien : <a href="/devis">parlez-nous de votre usage</a>.</p>}
    </main>
  );
}

function SectorPage({ slug, onAdd }) {
  const sector = findSectorBySlug(slug);
  const [preview, setPreview] = useState({ surface: sector ? sectorDefaultSurface(sector) : "comptoir", actionId: sector?.actionIds[0] || "avis", brandName: sector?.exampleBrand || "VOTRE MARQUE", theme: sector?.theme || "blue", designStyle: campaignStyleForAction(sector?.actionIds[0] || "avis"), customHeadline: campaignHeadlineForAction(sector?.actionIds[0] || "avis"), personalization: "ready" });
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
      <section className="v3-sector-hero"><SectorScene sector={sector} preview={preview} className="v3-sector-image" /><div className="v3-sector-buy"><nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><a href="/secteurs">Secteurs</a><span>/</span><b>{sector.title}</b></nav><span className="v3-eyebrow">TAPOTE POUR {sector.title.toUpperCase()}</span><h1>{sector.title}.</h1><p>{sector.description}</p><div className="v3-sector-recommendation"><Sparkles /> {recommendation}</div><BuyBox onAdd={onAdd} compact allowAllSurfaces initialSurface={surface} initialAction={sector.actionIds[0]} initialCount={recommendedCount} initialComposition={sector.composition} initialTheme={sector.theme} initialBrandName={sector.exampleBrand || "VOTRE MARQUE"} initialDesignStyle={campaignStyleForAction(sector.actionIds[0])} initialReadyHeadline={campaignHeadlineForAction(sector.actionIds[0])} targetId={sector.id} onPreviewChange={setPreview} /></div></section>
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
  const preview = { surface: "comptoir", actionId: "avis", brandName: "CAFÉ NOMA", theme: "blue", designStyle: "pulse", customHeadline: "Vous avez aimé ? Tapotez.", personalization: "ready" };
  return (
    <main id="main-content">
      <header className="v3-how-hero"><div><span className="v3-eyebrow v3-eyebrow-dark">SANS APP · SANS FRICTION</span><h1>Tapote ouvre exactement la bonne page.</h1><p>Votre client approche son téléphone ou scanne le QR. L’avis, le menu, la réservation ou votre page s’ouvre immédiatement.</p><a href="/boutique">Choisir mon Tapote <ArrowRight /></a></div><ProductScene image={HOME_SCENES.comptoir.image} alt="Un client utilise un chevalet Tapote avec son téléphone" nativeAction={HOME_SCENES.comptoir.nativeAction} preview={preview} className="v3-how-scene" /></header>
      <section className="v3-link-flow"><article><SmartphoneNfc /><span>1</span><h2>Le client tapote</h2><p>Ou scanne le QR code. Aucune application n’est nécessaire.</p></article><ArrowRight /><article><Zap /><span>2</span><h2>Tapote redirige</h2><p>Le lien court du support appelle votre destination actuelle.</p></article><ArrowRight /><article><Globe2 /><span>3</span><h2>La bonne page s’ouvre</h2><p>Avis, menu, réservation, réseau social ou toute autre URL.</p></article></section>
      <section className="v3-section v3-change-link"><div><span className="v3-eyebrow">ET SI LE LIEN CHANGE ?</span><h2>Vous ne touchez pas au support.</h2><p>Depuis votre espace, vous remplacez la destination. Le NFC et le QR continuent de fonctionner, car ils pointent toujours vers le même lien Tapote.</p><ul><li><Check /> Modifications illimitées</li><li><Check /> Sans abonnement obligatoire</li><li><Check /> Prises en compte à distance</li></ul></div><div className="v3-link-console"><span>Destination active</span><strong>tapote.fr/t/<b>cafe-noma</b></strong><em>ouvre</em><div>https://g.page/r/…/review</div><span className="v3-link-console-action">Modifier la destination</span></div></section>
      <FaqSection />
      <section className="v3-final-buy"><span>PRÊT À PASSER AU BON GESTE ?</span><h2>Choisissez le format.<br />On prépare le reste.</h2><a href="/boutique">Choisir mon format <ArrowRight /></a></section>
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
      designStyle: item.designStyle || "signature",
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
      <div className="v3-cart-art"><DevicePreview productId={previewId(item.productId)} actionId={item.actionId} brandName={item.brandName || "VOTRE MARQUE"} brandLogo={getCachedLogoPreview(item.brandLogoId)} theme={item.theme} primaryColor={item.primaryColor} secondaryColor={item.secondaryColor} textColor={item.textColor} designStyle={item.designStyle} customHeadline={item.customHeadline} customSubline={item.customSubline} customTapLabel={item.customTapLabel} compact /></div>
      <div className="v3-cart-copy">
        <span>{product.personalization === "ready" ? "PRÊT À L’EMPLOI" : product.personalization === "matched" ? "ASSORTIE" : "À VOTRE IMAGE"}</span>
        <h2>{cartTitle}</h2>
        <dl className="v3-cart-configuration">
          <div><dt>Action</dt><dd>{action.name}{product.kind === "pack" && item.supportComposition ? ` · ${compositionLabel(item.supportComposition)}` : ""}</dd></div>
          {item.brandName && <div><dt>Marque</dt><dd>{item.brandName}</dd></div>}
          {product.personalization === "custom" && <div><dt>Design</dt><dd>{DESIGN_STYLES[item.designStyle]?.name || "Personnalisé"}</dd></div>}
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
  return <aside className="v3-order-summary"><span>RÉCAPITULATIF</span><dl><div><dt>Sous-total</dt><dd>{formatMoney(subtotal)}</dd></div><div><dt>Livraison</dt><dd>{shipping ? formatMoney(shipping) : "Offerte"}</dd></div><div><dt>Total {taxLabel}</dt><dd>{formatMoney(subtotal + shipping)}</dd></div></dl>{freeShippingRemaining > 0 ? <div className="v3-shipping-progress"><span>Encore <strong>{formatMoney(freeShippingRemaining)}</strong> pour la livraison offerte</span><i><b style={{ width: `${Math.min(100, subtotal / SHIPPING.freeThreshold * 100)}%` }} /></i></div> : <div className="v3-shipping-progress is-complete"><span><Check /> Livraison offerte débloquée</span></div>}<ul><li><ShieldCheck /> Paiement sécurisé par Stripe</li><li><PackageCheck /> NFC testé + QR de secours inclus</li>{hasCustom && <li><FileCheck2 /> Configuration personnalisée enregistrée</li>}<li><Clock3 /> {STOREFRONT_PROMISES.fulfillment}</li><li><Link2 /> Lien modifiable à vie</li></ul>{action}</aside>;
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
      {!cart.length ? <section className="v3-empty-cart"><ShoppingBag /><h2>Votre panier est vide.</h2><p>Commencez par le support le plus utile à votre activité.</p><a href="/boutique">Voir les produits <ArrowRight /></a></section> : <div className="v3-purchase-layout"><section className="v3-cart-lines">{cart.map((item, index) => <CartLine item={item} index={index} onQuantity={(delta) => changeQuantity(index, delta)} onRemove={() => setCart((current) => current.filter((_, itemIndex) => itemIndex !== index))} key={`${itemFingerprint(item)}-${index}`} />)}{hasSupport && !hasMatchedCard && matchingSource && <button className="v3-cart-upsell" type="button" onClick={addMatchedCard}><Plus /><span><strong>Ajouter la carte assortie — 19 €</strong><small>Même identité graphique et même action que votre support personnalisé.</small></span></button>}{hasSupport && !hasMatchedCard && !matchingSource && <div className="v3-volume-notice"><Layers3 /><span><strong>Plusieurs identités sont dans ce panier.</strong><small>Configurez séparément la carte à assortir pour choisir sans ambiguïté sa marque et son usage.</small></span></div>}{requiresQuote && <div className="v3-volume-notice"><Layers3 /><span><strong>{supportTotal} supports : un devis sera plus juste.</strong><small>À partir de 10, nous vérifions la composition, les lieux et le coût de production avant de vous proposer le meilleur tarif.</small></span></div>}</section><OrderSummary cart={cart} action={requiresQuote ? <a className="v3-primary-cta" href="/devis">Demander un devis <ArrowRight /></a> : <a className="v3-primary-cta" href="/commande" onClick={() => trackStorefrontEvent("begin_checkout", { value: cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0) / 100, currency: "EUR", item_count: cart.length })}>Continuer vers la commande <ArrowRight /></a>} /></div>}
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
  return <main id="main-content" className="v3-not-found"><span>404</span><h1>Cette page n’existe pas.</h1><a href="/boutique">Retour à la boutique <ArrowRight /></a></main>;
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
  let page;
  if (path === "/") page = <HomePage onAdd={addToCart} />;
  else if (path === "/boutique") page = <ShopPage onAdd={addToCart} availableProductIds={catalogState.availableProductIds} />;
  else if (path === "/categorie/chevalets-nfc") page = <ProductPage page="chevalet" onAdd={addToCart} />;
  else if (path === "/categorie/plaques-nfc") page = <ProductPage page="plaque" onAdd={addToCart} />;
  else if (path === "/categorie/cartes-nfc") page = <ProductPage page="carte" onAdd={addToCart} />;
  else if (["/categorie/packs-nfc", "/categorie/packs"].includes(path)) page = <ShopPage onAdd={addToCart} initialCategory="packs" availableProductIds={catalogState.availableProductIds} />;
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
