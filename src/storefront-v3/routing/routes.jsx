import { resolveProductPageSlug } from "../data/content.js";
import { CartPage, CheckoutPage, ConfirmationPage, QuotePage } from "../pages/CheckoutPages.jsx";
import { ProductPage, ShopPage } from "../pages/CommercePages.jsx";
import { HowPage, PilotMarketingPage } from "../pages/InformationPages.jsx";
import { LandingPage } from "../pages/LandingPage.jsx";
import { LegalPage, NotFound } from "../pages/LegalPages.jsx";

export function resolveStorefrontPage({
  path,
  cart,
  setCart,
  addToCart,
  availableProductIds,
}) {
  if (path === "/") return <LandingPage />;
  if (path === "/boutique" || path.startsWith("/categorie/")) {
    return <ShopPage onAdd={addToCart} availableProductIds={availableProductIds} />;
  }
  if (path === "/personnaliser" || path === "/designs") {
    return <ShopPage onAdd={addToCart} availableProductIds={availableProductIds} initialPersonalization="custom" />;
  }
  if (path.startsWith("/produits/")) {
    return <ProductPage page={resolveProductPageSlug(path.split("/")[2])} onAdd={addToCart} />;
  }
  if (path === "/comment-ca-marche") return <HowPage />;
  if (path === "/tapote-pilot") return <PilotMarketingPage />;
  if (path === "/panier") return <CartPage cart={cart} setCart={setCart} onAdd={addToCart} />;
  if (path === "/devis") return <QuotePage />;
  if (path === "/commande") return <CheckoutPage cart={cart} />;
  if (path === "/commande/confirmee") return <ConfirmationPage setCart={setCart} />;
  if (["/mentions-legales", "/cgv", "/confidentialite"].includes(path)) {
    return <LegalPage type={path.slice(1)} />;
  }
  return <NotFound />;
}
