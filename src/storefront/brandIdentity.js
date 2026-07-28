// Dérivation d'identité de marque : initiales et choix du pictogramme de
// plateforme. Séparé de BrandMark.jsx pour préserver le rafraîchissement à
// chaud (un fichier de composants n'exporte que des composants).

// Marques de démonstration : initiales et variante de monogramme figées pour
// que les mêmes exemples gardent la même image d'une page à l'autre.
export const DEMO_BRAND_IDENTITIES = {
  "CAFE NOMA": ["CN", 0],
  "MAISON LEVAIN": ["ML", 1],
  "L'ATELIER 21": ["A21", 2],
  "ATELIER 21": ["A21", 2],
  "STUDIO LUNE": ["SL", 3],
  "MAISON CALME": ["MC", 3],
  "LE LIEN LOCAL": ["LL", 5],
  "LIGNE NOIRE": ["LN", 4],
  "ATELIER MARTIN": ["AM", 2],
  "HOTEL RIVAGE": ["HR", 4],
  "CAMPING DES PINS": ["CP", 1],
  "FLEURS SAUVAGES": ["FS", 3],
  "MOBILE CLUB": ["MC", 0],
  "CAMPUS 22": ["C22", 2],
  "LA GALERIE": ["LG", 5],
  "STUDIO GABRIEL": ["SG", 3],
  "LA MAISON DOUCE": ["MD", 1],
  "CABINET RIVOLI": ["CR", 0],
  "MOTION CLUB": ["MC", 5],
  "AGENCE HORIZON": ["AH", 4],
};

const STOP_WORDS = new Set(["DE", "DES", "DU", "LA", "LE", "LES", "L", "ET"]);

export function normalizeBrandName(name) {
  return String(name || "VOTRE MARQUE")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
}

export function brandInitials(name) {
  const normalized = normalizeBrandName(name);
  const words = normalized.split(/[^A-Z0-9]+/).filter((word) => word && !STOP_WORDS.has(word));
  const fallback = words.length > 1 ? `${words[0][0]}${words.at(-1)[0]}` : words[0]?.slice(0, 2) || "VM";
  return (DEMO_BRAND_IDENTITIES[normalized]?.[0] || fallback).slice(0, 3);
}

export function brandMarkVariant(name) {
  const safeName = name || "VOTRE MARQUE";
  const stored = DEMO_BRAND_IDENTITIES[normalizeBrandName(safeName)]?.[1];
  if (stored !== undefined) return stored;
  return [...safeName].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 6;
}

export const PLATFORM_GLYPH_IDS = ["google", "instagram", "facebook", "linkedin", "tiktok", "whatsapp"];

export function platformGlyphForAction(actionId) {
  if (actionId === "avis") return "google";
  return PLATFORM_GLYPH_IDS.includes(actionId) ? actionId : "";
}
