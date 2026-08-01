// Marque de substitution pour un client sans logo.
//
// Une bibliothèque d'emblèmes métier n'est pas tenable : il existe trop de
// métiers, et un pictogramme « boulangerie » ne fera jamais une identité. Trois
// niveaux couvrent le besoin réel sans rien promettre d'infini :
//
//   1. MONOGRAMME — les initiales du commerce dans un cartouche. Universel,
//      vectoriel, valable pour toute activité sans exception. C'est le défaut.
//   2. SYMBOLE NEUTRE — six formes de marque abstraites. Elles disent « identité
//      soignée », jamais « voici votre métier ». Aucune ne prétend illustrer une
//      activité, donc aucune ne peut être à côté de la plaque.
//   3. LOGO DESSINÉ — le client coche « je n'ai pas de logo » et Tapote Studio
//      lui livre un tracé dans le BAT. C'est un service, pas une fonction du
//      site, et c'est ce qui nous distingue d'un configurateur en libre-service.
//
// Aucune IA générative dans la chaîne : un support part en impression, il faut
// un tracé reproductible à l'identique, libre de droits et contrôlable.

// Cartouches du monogramme : le contour qui entoure les initiales.
export const MONOGRAM_SHAPES = Object.freeze({
  cercle: { label: "Cercle", path: "M24 4a20 20 0 1 1 0 40 20 20 0 0 1 0-40Z" },
  ecusson: { label: "Écusson", path: "M24 4l17 6v14c0 10-7 17-17 20C14 41 7 34 7 24V10Z" },
  carre: { label: "Carré", path: "M11 5h26a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6V11a6 6 0 0 1 6-6Z" },
  filet: { label: "Double filet", path: "M6 6h36v36H6Zm4 4h28v28H10Z" },
});

export const DEFAULT_MONOGRAM_SHAPE = "cercle";

// Symboles neutres : des marques abstraites, jamais des métiers.
export const NEUTRAL_MOTIFS = Object.freeze({
  onde: { label: "Onde", path: "M6 30c6-12 12-12 18 0s12 12 18 0M6 18c6-12 12-12 18 0" },
  arche: { label: "Arche", path: "M8 42V24a16 16 0 0 1 32 0v18M18 42V24a6 6 0 0 1 12 0v18" },
  losange: { label: "Losange", path: "M24 4 44 24 24 44 4 24Zm0 10 10 10-10 10-10-10Z" },
  hexagone: { label: "Hexagone", path: "M24 4l17 10v20L24 44 7 34V14Zm0 12 7 4v8l-7 4-7-4v-8Z" },
  etoile: { label: "Étoile", path: "M24 4l5.6 12.4L43 18l-9.5 9.2 2.3 13.3L24 34.2 12.2 40.5l2.3-13.3L5 18l13.4-1.6Z" },
  trame: { label: "Trame", path: "M8 8h13v13H8Zm19 0h13v13H27ZM8 27h13v13H8Zm19 0h13v13H27Z" },
});

export function isMonogramShape(value) {
  return Object.prototype.hasOwnProperty.call(MONOGRAM_SHAPES, value || "");
}

export function isNeutralMotif(value) {
  return Object.prototype.hasOwnProperty.call(NEUTRAL_MOTIFS, value || "");
}

export function motifPath(id) {
  return NEUTRAL_MOTIFS[id]?.path || MONOGRAM_SHAPES[id]?.path || "";
}

// Initiales : deux lettres au maximum, accents retirés, pour rester lisibles à
// 15 mm de côté.
export function brandInitialsFor(name) {
  const cleaned = String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9\s'-]/g, " ")
    .trim();
  if (!cleaned) return "";
  const words = cleaned.split(/[\s'-]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Filigrane : même tracé, en data URI, donc toujours vectoriel.
export function motifDataUri(id, color = "#000000") {
  const path = motifPath(id);
  if (!path) return "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><path d="${path}" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
