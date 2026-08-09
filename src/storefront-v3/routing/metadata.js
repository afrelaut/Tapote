import { PRODUCT_PAGES, resolveProductPageSlug } from "../data/content.js";

/* Google tronque les descriptions vers 158 caractères. Les fiches produit
   composaient la leur à partir d'un texte variable et dépassaient. */
const META_DESCRIPTION_MAX = 158;

const clampDescription = (text) => {
  if (text.length <= META_DESCRIPTION_MAX) return text;
  const cut = text.slice(0, META_DESCRIPTION_MAX + 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.]+$/, "")}…`;
};

export function pageMetadata(path) {
  if (path === "/") return ["Tapote — le bon geste, au bon moment", "Comptoir, plaque et carte NFC + QR pour ouvrir l’avis, le menu, la réservation ou le lien utile. Boutique simple ou personnalisation en direct."];
  if (path === "/boutique" || path.startsWith("/categorie/")) return ["Boutique NFC + QR | Tapote", "Tapote Comptoir, Tapote Plaque, Tapote Card et Pack Local, prêts à poser ou à votre image."];
  if (path.startsWith("/produits/")) {
    const product = PRODUCT_PAGES[resolveProductPageSlug(path.split("/")[2])];
    if (product) return [`${product.name}${/nfc/i.test(product.name) ? "" : " NFC"} + QR | Tapote`, clampDescription(`${product.description} Prêt à poser ou à votre image, Tapote Pilot inclus.`)];
  }
  if (path === "/designs") return ["Designs NFC + QR | Tapote", "Découvrez les designs Tapote pour les avis, Instagram, Facebook, le Wi-Fi, les menus, les réservations et tous vos liens."];
  if (path === "/personnaliser") return ["Créer mon Tapote personnalisé", "Personnalisez Tapote Comptoir, Tapote Plaque ou Tapote Card : logo, textes, couleurs et action."];
  if (path === "/comment-ca-marche") return ["Comment fonctionne Tapote ?", "NFC, QR code, encodage et changement de destination à distance expliqués simplement."];
  if (path === "/tapote-pilot") return ["Tapote Pilot inclus et Pilot Pro | Tapote", "Tapote Pilot est inclus pour activer vos supports et suivre leurs destinations. Pilot Pro ajoute statistiques, périodes, lieux, exports et multi-sites."];
  if (path === "/faq") return ["FAQ Tapote | NFC, QR, produits et livraison", "Réponses détaillées sur les supports Tapote, le NFC, le QR, le Studio, Pilot, Pilot Pro, la livraison et les projets multi-sites."];
  if (path === "/panier") return ["Votre panier | Tapote", "Vérifiez vos supports Tapote, leur composition, la livraison et les options."];
  if (path === "/devis") return ["Devis volume et multi-sites | Tapote", "Décrivez votre besoin de 10 supports ou plus et recevez une proposition Tapote claire et adaptée."];
  if (path.startsWith("/commande")) return ["Finaliser la commande | Tapote", "Finalisez votre commande professionnelle Tapote via Stripe."];
  if (path === "/mentions-legales") return ["Mentions légales | Tapote", "Informations relatives à l’éditeur, à la publication et à l’hébergement du site Tapote."];
  if (path === "/cgv") return ["Conditions générales de vente B2B | Tapote", "Conditions applicables aux commandes professionnelles de supports NFC + QR Tapote."];
  if (path === "/confidentialite") return ["Politique de confidentialité | Tapote", "Informations sur les données traitées par Tapote et les droits des professionnels."];
  return ["Page introuvable | Tapote", "La page demandée n’existe pas ou a été déplacée."];
}

export function isKnownStorefrontPath(path) {
  if (["/", "/boutique", "/designs", "/personnaliser", "/comment-ca-marche", "/tapote-pilot", "/faq", "/panier", "/devis", "/commande", "/commande/confirmee", "/mentions-legales", "/cgv", "/confidentialite"].includes(path)) return true;
  if (["/categorie/chevalets-nfc", "/categorie/plaques-nfc", "/categorie/cartes-nfc", "/categorie/packs-nfc", "/categorie/packs"].includes(path)) return true;
  if (path.startsWith("/produits/")) return Boolean(PRODUCT_PAGES[resolveProductPageSlug(path.split("/")[2])]);
  return false;
}

export function setMetaContent(attribute, value, content) {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function setCanonicalUrl(url) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", url);
}
