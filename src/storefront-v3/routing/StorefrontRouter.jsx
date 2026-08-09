import { useEffect, useMemo, useState } from "react";
import { ACTIONS, PRODUCTS } from "../../../shared/catalog.js";
import { captureStorefrontAttribution, trackStorefrontEvent } from "../../storefront/analytics.js";
import { CART_KEY, MAX_ITEM_QUANTITY, compositionLabel, itemFingerprint, loadCart, normalizedQuantity, physicalSupportCount } from "../commerce/cart.js";
import { Shell } from "../layouts/StorefrontLayout.jsx";
import { isKnownStorefrontPath, pageMetadata, setCanonicalUrl, setMetaContent } from "./metadata.js";
import { resolveStorefrontPage } from "./routes.jsx";

export default function StorefrontV3() {
  const [cart, setCart] = useState(loadCart);
  const [cartNotice, setCartNotice] = useState(null);
  const [catalogState, setCatalogState] = useState({ status: "loading", availableProductIds: null });
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  useEffect(() => { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  useEffect(() => {
    captureStorefrontAttribution();
    trackStorefrontEvent("page_view", { page_title: pageMetadata(path)[0] });
    const productSlug = path.match(/^\/produits\/(comptoir|plaque|carte)$/)?.[1];
    const productId = productSlug === "comptoir" ? "comptoir_standard"
      : productSlug === "plaque" ? "plaque_standard"
        : productSlug === "carte" ? "carte_standard"
          : null;
    if (productId && PRODUCTS[productId]) {
      trackStorefrontEvent("view_item", {
        product_id: productId,
        product_name: PRODUCTS[productId].name,
        value: PRODUCTS[productId].price / 100,
        currency: "EUR",
      });
    }
  }, [path]);
  useEffect(() => {
    if (path === "/panier") {
      trackStorefrontEvent("view_cart", {
        value: cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0) / 100,
        currency: "EUR",
        item_count: physicalSupportCount(cart),
      });
    }
  }, [cart, path]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { headers: { Accept: "application/json" }, signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("catalog_unavailable")))
      .then((payload) => setCatalogState({
        status: "ready",
        availableProductIds: new Set((payload.products || []).filter((product) => product.online && product.availableStock !== 0).map((product) => product.productId)),
      }))
      .catch((error) => { if (error.name !== "AbortError") setCatalogState({ status: "error", availableProductIds: null }); });
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
    if (catalogState.status !== "ready") {
      setCartNotice({ tone: "error", title: "Ajout impossible", message: "Le catalogue ne peut pas être vérifié pour le moment. Réessayez dans quelques secondes." });
      return false;
    }
    if (!catalogState.availableProductIds?.has(normalized.productId)) {
      setCartNotice({ tone: "error", title: "Produit indisponible", message: "Ce produit n’est momentanément pas disponible. Le catalogue vient d’être actualisé." });
      return false;
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
      ? `${product.supportCount} supports · ${product.personalization === "custom" ? "À votre image" : "Prêts à poser"} · ${ACTIONS[normalized.actionId].name}${normalized.supportComposition ? ` · ${compositionLabel(normalized.supportComposition)}` : ""}`
      : `${product.name.replace(/ · .+$/, "")} · ${ACTIONS[normalized.actionId].name}`;
    setCartNotice({
      tone: "success",
      title: Number.isInteger(options.replaceIndex) ? "Configuration mise à jour" : "Ajouté au panier",
      message: notice,
    });
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
    return true;
  };
  const page = resolveStorefrontPage({
    path,
    cart,
    setCart,
    addToCart,
    availableProductIds: catalogState.availableProductIds,
  });
  return <Shell cartCount={cartCount} cartNotice={cartNotice} onCloseNotice={() => setCartNotice(null)} compactCheckout={path.startsWith("/commande")} catalogStatus={catalogState.status}>{page}</Shell>;
}
