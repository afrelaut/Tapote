// Le design Tapote par défaut, décliné en deux couleurs — et rien d'autre.
//
// Les valeurs sont celles des fichiers d'impression (designs/print-ready) :
// papier #141414, encre #f4efe6, bloc action #2458ff. La déclinaison claire
// inverse simplement papier et encre. Un client choisit entre deux options
// lisibles, pas entre cinq nuances qu'il faut lui expliquer.

export const DEVICE_THEMES = Object.freeze({
  nuit: { paper: "#141414", ink: "#f4efe6", accent: "#2458ff", accentInk: "#ffffff" },
  creme: { paper: "#f4efe6", ink: "#141414", accent: "#2458ff", accentInk: "#ffffff" },
});

export const DEFAULT_THEME = "nuit";

export const THEME_LABELS = Object.freeze({
  nuit: "Tapote Noir",
  creme: "Tapote Blanc",
});

// Les paniers, brouillons et liens partagés d'avant la refonte portent encore
// les anciens identifiants de thème : on les ramène sur la déclinaison la plus
// proche plutôt que de casser une commande en cours.
const LEGACY_THEME_ALIASES = {
  blue: "nuit",
  mono: "creme",
  sand: "creme",
  rose: "creme",
  green: "nuit",
};

export function resolveThemeId(theme) {
  if (DEVICE_THEMES[theme]) return theme;
  return LEGACY_THEME_ALIASES[theme] || DEFAULT_THEME;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function normalizeHexColor(value, fallback) {
  const normalized = String(value || "").trim();
  return HEX_COLOR.test(normalized) ? normalized.toLowerCase() : fallback;
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color) {
  const normalized = normalizeHexColor(color, "#000000");
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue);
}

export function readableInk(background) {
  const dark = "#111111";
  const light = "#ffffff";
  return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
}

export function contrastRatio(first, second) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

// La couleur choisie par le client ne passe que si elle reste lisible : sous
// 4,5:1 on retombe sur l'encre qui contraste, pour ne jamais imprimer un
// support illisible.
export function resolveDeviceColors(theme = DEFAULT_THEME, primaryColor = "", secondaryColor = "", textColor = "") {
  const base = DEVICE_THEMES[resolveThemeId(theme)];
  const paper = normalizeHexColor(primaryColor, base.paper);
  const accent = normalizeHexColor(secondaryColor, base.accent);
  const requestedInk = normalizeHexColor(textColor, primaryColor ? readableInk(paper) : base.ink);
  const requestedAccentInk = secondaryColor ? readableInk(accent) : base.accentInk;
  return {
    paper,
    accent,
    ink: contrastRatio(paper, requestedInk) >= 4.5 ? requestedInk : readableInk(paper),
    accentInk: contrastRatio(accent, requestedAccentInk) >= 4.5 ? requestedAccentInk : readableInk(accent),
  };
}
