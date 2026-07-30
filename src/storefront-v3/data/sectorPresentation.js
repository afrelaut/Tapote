import { readyHeadlineForAction } from "./content.js";

function sectorDefaultSurface(sector) {
  if (sector.recommendedProductId === "carte" || (!sector.composition?.comptoir && !sector.composition?.plaque)) return "carte";
  return sector.composition?.comptoir > 0 ? "comptoir" : "plaque";
}

export function productPathForSector(sector) {
  if (sector.recommendedProductId === "carte") return `/produits/carte?action=${sector.actionIds[0]}`;
  if (sector.recommendedProductId === "pack_cinq") return "/devis";
  return "/boutique#packs";
}

export function sectorPreviewFor(sector) {
  const surface = sectorDefaultSurface(sector);
  return {
    surface,
    actionId: sector.actionIds[0],
    brandName: "VOTRE MARQUE",
    theme: surface === "carte" ? "nuit" : "creme",
    customHeadline: readyHeadlineForAction(sector.actionIds[0]),
    personalization: "custom",
    count: sector.recommendedProductId === "pack_cinq" ? 5 : sector.recommendedProductId === "pack_duo" ? 2 : 1,
    composition: sector.composition,
  };
}
