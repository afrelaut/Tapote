import { ACTIONS, calculateProductPrice, isPublicProductId, PRODUCTS } from "../../../shared/catalog.js";
import { DEFAULT_THEME, normalizeHexColor, resolveThemeId } from "../../deviceThemes.js";
import { DEFAULT_BLOCK_COLOR_MODE } from "../../storefront/actionPalettes.js";

export const MAX_ITEM_QUANTITY = 50;

export const CART_KEY = "tapote-cart-v3";

export const CONFIG_DRAFT_PREFIX = "tapote-config-draft-v2:";

const LOGO_PREVIEW_PREFIX = "tapote-logo-preview-v1:";

export function getProductId(surface, personalization, count = 1) {
  const suffix = personalization === "ready" ? "pret" : "personnalise";
  if (surface === "carte") return `carte_${suffix === "pret" ? "prete" : "personnalisee"}`;
  if (surface === "plaque") return `plaque_${suffix === "pret" ? "prete" : "personnalisee"}`;
  if (count > 1) return personalization === "ready" ? "pack_comptoir_pret" : "pack_comptoir";
  return `chevalet_${suffix}`;
}

export function previewId(productId) {
  const product = PRODUCTS[productId];
  if (product?.kind === "pack") return "comptoir";
  return product?.baseProductId || productId;
}

export function normalizedQuantity(value) {
  return Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.floor(Number(value) || 1)));
}

export function loadCart() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    // Les paniers enregistrés avant la refonte portent un thème disparu et un
    // style graphique qui n'existe plus : on les normalise ici plutôt que de
    // laisser le serveur les refuser.
    return parsed
      .filter((item) => isPublicProductId(item.productId) && ACTIONS[item.actionId])
      // eslint-disable-next-line no-unused-vars -- la déstructuration sert à écarter le champ obsolète
      .map(({ designStyle, ...item }) => ({ ...item, theme: resolveThemeId(item.theme) }));
  } catch {
    return [];
  }
}

export function itemFingerprint(item) {
  return JSON.stringify(Object.fromEntries(Object.entries(item).filter(([key]) => key !== "quantity")));
}

export function makeCartItem(productId, actionId, options = {}) {
  const product = PRODUCTS[productId];
  const supportDesigns = options.packDesignMode === "individual" && options.supportDesigns && typeof options.supportDesigns === "object"
    ? Object.fromEntries(Object.entries(options.supportDesigns).slice(0, 50).map(([key, design = {}]) => [key, {
      surface: ["comptoir", "plaque", "carte"].includes(design.surface) ? design.surface : "comptoir",
      actionId: ACTIONS[design.actionId] ? design.actionId : actionId,
      destinationUrl: design.destinationUrl || "",
      brandName: design.brandName || "",
      brandLogoId: design.brandLogoId || "",
      logoFileName: design.logoFileName || "",
      signageId: design.signageId || "",
      signageFileName: design.signageFileName || "",
      tagline: design.tagline || "",
      contactLine: design.contactLine || "",
      blockColorMode: design.blockColorMode || DEFAULT_BLOCK_COLOR_MODE,
      theme: design.theme || DEFAULT_THEME,
      primaryColor: normalizeHexColor(design.primaryColor, ""),
      secondaryColor: normalizeHexColor(design.secondaryColor, ""),
      textColor: normalizeHexColor(design.textColor, ""),
      customHeadline: design.customHeadline || "",
      customSubline: design.customSubline || "",
      customTapLabel: design.customTapLabel || "",
    }]))
    : undefined;
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
    signageId: options.signageId || "",
    signageFileName: options.signageFileName || "",
    tagline: options.tagline || "",
    contactLine: options.contactLine || "",
    blockColorMode: options.blockColorMode || DEFAULT_BLOCK_COLOR_MODE,
    customizationPath: ["ready", "assisted", "self"].includes(options.customizationPath) ? options.customizationPath : "ready",
    packDesignMode: options.packDesignMode === "individual" ? "individual" : "shared",
    ...(supportDesigns ? { supportDesigns } : {}),
    ...(product.defaultComposition ? { supportComposition: options.supportComposition || product.defaultComposition } : {}),
  };
}

export function cartItemUnitPrice(item) {
  return calculateProductPrice(item.productId, item.supportComposition) ?? 0;
}

export function physicalSupportCount(cart) {
  return cart.reduce((sum, item) => (
    sum + (((item.supportComposition?.comptoir || 0) + (item.supportComposition?.plaque || 0) + (item.supportComposition?.carte || 0))
      || PRODUCTS[item.productId]?.supportCount || 1) * normalizedQuantity(item.quantity)
  ), 0);
}

export function compositionLabel(composition) {
  if (!composition) return "";
  const parts = [];
  if (composition.comptoir) parts.push(`${composition.comptoir} chevalet${composition.comptoir > 1 ? "s" : ""}`);
  if (composition.plaque) parts.push(`${composition.plaque} plaque${composition.plaque > 1 ? "s" : ""}`);
  if (composition.carte) parts.push(`${composition.carte} carte${composition.carte > 1 ? "s" : ""}`);
  return parts.join(" + ");
}

export function compositionSurface(count, composition, fallback = "comptoir") {
  if (!composition) return fallback;
  if (composition.comptoir > 0) return "comptoir";
  if (composition.plaque > 0) return "plaque";
  return "carte";
}

function compositionParam(composition) {
  if (!composition) return "";
  return `${composition.comptoir || 0}-${composition.plaque || 0}-${composition.carte || 0}`;
}

export function getCachedLogoPreview(uploadId) {
  if (!uploadId) return "";
  try { return window.sessionStorage.getItem(`${LOGO_PREVIEW_PREFIX}${uploadId}`) || ""; } catch { return ""; }
}

export function cacheLogoPreview(uploadId, dataUrl) {
  if (!uploadId || !dataUrl) return;
  try { window.sessionStorage.setItem(`${LOGO_PREVIEW_PREFIX}${uploadId}`, dataUrl); } catch { /* The order remains valid even if the browser cannot cache the local preview. */ }
}

export function loadConfigDraft(draftKey) {
  if (!draftKey) return null;
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(`${CONFIG_DRAFT_PREFIX}${draftKey}`) || "null");
    return draft && typeof draft === "object" ? draft : null;
  } catch { return null; }
}

export function cartEditDescriptor(item, index) {
  const product = PRODUCTS[item.productId];
  const composition = item.supportComposition || product.defaultComposition;
  const count = product.kind === "card"
    ? composition?.carte || 1
    : product.kind === "pack"
      ? composition?.comptoir || 1
      : 1;
  const surface = product.kind === "pack" ? "comptoir" : product.baseProductId;
  const slug = surface === "comptoir" ? "chevalet" : surface;
  const draftKey = `cart:${index}`;
  const params = new URLSearchParams({
    mode: product.personalization === "ready" ? "ready" : "custom",
    action: item.actionId,
    edit: String(index),
    draft: draftKey,
  });
  params.set("count", String(count));
  params.set("composition", compositionParam(composition));
  return { href: `/produits/${slug}?${params.toString()}`, draftKey, count, composition };
}

export function saveCartItemAsDraft(item, descriptor) {
  try {
    window.sessionStorage.setItem(`${CONFIG_DRAFT_PREFIX}${descriptor.draftKey}`, JSON.stringify({
      actionId: item.actionId,
      count: descriptor.count,
      composition: descriptor.composition,
      customizationPath: item.customizationPath || "ready",
      packDesignMode: item.packDesignMode || "shared",
      supportDesigns: item.supportDesigns || {},
      brandName: item.brandName || "",
      brandLogoId: item.brandLogoId || "",
      logoFileName: item.logoFileName || "",
      signageId: item.signageId || "",
      signageFileName: item.signageFileName || "",
      tagline: item.tagline || "",
      contactLine: item.contactLine || "",
      blockColorMode: item.blockColorMode || DEFAULT_BLOCK_COLOR_MODE,
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
