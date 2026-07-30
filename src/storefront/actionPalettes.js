// Couleurs du bloc d'action imprimé.
//
// Le bloc « posez votre téléphone » peut prendre trois sources de couleur :
//   - tapote  : le bleu de la marque, quel que soit le lien ;
//   - marque  : la couleur secondaire choisie par le client ;
//   - action  : la couleur du service ouvert, pour que le support parle le même
//               langage visuel que la destination (Instagram, WhatsApp, Google…).
//
// Chaque entrée porte aussi son liseré : un ton clair du même bloc, imprimé
// autour, qui décolle le bloc du fond comme sur les supports produits.

export const BLOCK_COLOR_MODES = Object.freeze({
  tapote: "Bleu Tapote",
  marque: "Couleur de la marque",
  action: "Couleur du service",
});

export const DEFAULT_BLOCK_COLOR_MODE = "action";

const TAPOTE_BLUE = Object.freeze({ block: "#2458ff", ink: "#ffffff", liseret: "#c3d2ff", label: "Bleu Tapote" });

// Les dégradés restent sobres : deux ou trois arrêts, jamais de bandes franches,
// pour rester imprimables et lisibles à 105 mm de large.
const ACTION_PALETTES = Object.freeze({
  avis: { block: "#4285f4", ink: "#ffffff", liseret: "#cfe0fd", label: "Bleu Google" },
  instagram: {
    block: "#c9256d",
    gradient: "linear-gradient(142deg, #7a29c9 0%, #c9256d 46%, #e8622a 78%, #f9b23c 100%)",
    ink: "#ffffff",
    liseret: "#f4cfe0",
    label: "Dégradé Instagram",
  },
  tiktok: {
    block: "#111112",
    gradient: "linear-gradient(140deg, #25f4ee 0%, #111112 42%, #111112 62%, #fe2c55 100%)",
    ink: "#ffffff",
    liseret: "#c8ccd2",
    label: "Noir TikTok",
  },
  facebook: { block: "#1877f2", ink: "#ffffff", liseret: "#c9dffd", label: "Bleu Facebook" },
  linkedin: { block: "#0a66c2", ink: "#ffffff", liseret: "#c3dcf3", label: "Bleu LinkedIn" },
  whatsapp: { block: "#128c4a", ink: "#ffffff", liseret: "#bfe9d1", label: "Vert WhatsApp" },
  menu: { block: "#a8442a", ink: "#ffffff", liseret: "#f0cec3", label: "Terracotta" },
  commande: { block: "#b4400f", ink: "#ffffff", liseret: "#f3cdbb", label: "Orange brûlé" },
  reservation: { block: "#1e3a8a", ink: "#ffffff", liseret: "#c6d1ed", label: "Bleu nuit" },
  paiement: { block: "#046c4e", ink: "#ffffff", liseret: "#bde4d5", label: "Vert paiement" },
  pourboire: { block: "#0d6d63", ink: "#ffffff", liseret: "#bfe3df", label: "Vert menthe" },
  fidelite: { block: "#a2620a", ink: "#ffffff", liseret: "#f0dcb8", label: "Or fidélité" },
  wifi: { block: "#3b32b8", ink: "#ffffff", liseret: "#cbc8f0", label: "Indigo" },
  site: TAPOTE_BLUE,
  contact: { block: "#1f2937", ink: "#ffffff", liseret: "#ccd2da", label: "Anthracite" },
  multiliens: { block: "#4c1d95", ink: "#ffffff", liseret: "#d9cbf1", label: "Violet" },
  formulaire: { block: "#0d6d86", ink: "#ffffff", liseret: "#c2e2ec", label: "Bleu pétrole" },
  autre: TAPOTE_BLUE,
});

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHex(value) {
  const hex = String(value || "").trim().replace("#", "");
  if (hex.length === 3) {
    return [0, 1, 2].map((index) => parseInt(hex[index] + hex[index], 16));
  }
  if (hex.length === 6) {
    return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
  }
  return null;
}

// Le liseré d'une couleur libre est calculé, pas choisi : on éclaircit la teinte
// vers le blanc pour obtenir le même halo que sur les palettes prédéfinies.
export function liseretFor(color, amount = 0.74) {
  const rgb = parseHex(color);
  if (!rgb) return TAPOTE_BLUE.liseret;
  const [r, g, b] = rgb.map((channel) => clampChannel(channel + ((255 - channel) * amount)));
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function actionPalette(actionId) {
  return ACTION_PALETTES[actionId] || TAPOTE_BLUE;
}

export function actionPaletteLabel(actionId) {
  return actionPalette(actionId).label;
}

// Résout la couleur réellement imprimée sur le bloc d'action.
export function resolveBlockPalette({ mode = DEFAULT_BLOCK_COLOR_MODE, actionId = "avis", brandAccent = "", brandAccentInk = "#ffffff" } = {}) {
  if (mode === "tapote") return { ...TAPOTE_BLUE, gradient: "" };
  if (mode === "marque") {
    const block = brandAccent || TAPOTE_BLUE.block;
    return { block, gradient: "", ink: brandAccentInk || "#ffffff", liseret: liseretFor(block), label: BLOCK_COLOR_MODES.marque };
  }
  const palette = actionPalette(actionId);
  return { gradient: "", ...palette };
}
