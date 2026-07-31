import { ACTIONS, PRODUCTS } from "../../../shared/catalog.js";
import { DEFAULT_THEME, normalizeHexColor, resolveThemeId } from "../../deviceThemes.js";
import { DEFAULT_BLOCK_COLOR_MODE } from "../../storefront/actionPalettes.js";

export const MAX_ITEM_QUANTITY = 50;

export const CART_KEY = "tapote-cart-v3";

export const CONFIG_DRAFT_PREFIX = "tapote-config-draft-v2:";

const LOGO_PREVIEW_PREFIX = "tapote-logo-preview-v1:";

export function getProductId(surface, personalization, count = 1) {
  const suffix = personalization === "ready" ? "_standard" : "";
  if (count === 2) return `pack_duo${suffix}`;
  if (count === 5) return `pack_cinq${suffix}`;
  return `${surface}${suffix}`;
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
      .filter((item) => PRODUCTS[item.productId] && ACTIONS[item.actionId])
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
    tagline: options.tagline || "",
    contactLine: options.contactLine || "",
    blockColorMode: options.blockColorMode || DEFAULT_BLOCK_COLOR_MODE,
    ...(product.kind === "pack" ? { supportComposition: options.supportComposition || product.defaultComposition } : {}),
  };
}

export function physicalSupportCount(cart) {
  return cart.reduce((sum, item) => (
    sum + (PRODUCTS[item.productId]?.supportCount || 1) * normalizedQuantity(item.quantity)
  ), 0);
}

export function compositionLabel(composition) {
  if (!composition) return "";
  const parts = [];
  if (composition.comptoir) parts.push(`${composition.comptoir} Comptoir${composition.comptoir > 1 ? "s" : ""}`);
  if (composition.plaque) parts.push(`${composition.plaque} Plaque${composition.plaque > 1 ? "s" : ""}`);
  return parts.join(" + ");
}

export function compositionSurface(count, composition, fallback = "comptoir") {
  if (count <= 1 || !composition) return fallback;
  if (composition.comptoir > 0 && composition.plaque > 0) return "mix";
  return composition.plaque > 0 ? "plaque" : "comptoir";
}

function compositionParam(composition) {
  if (!composition) return "";
  if (composition.comptoir > 0 && composition.plaque > 0) return "mix";
  return composition.plaque > 0 ? "plaques" : "chevalets";
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

export function saveCartItemAsDraft(item, descriptor) {
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
