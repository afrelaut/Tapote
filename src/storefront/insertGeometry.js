// Géométrie des inserts, reprise des gabarits d'impression
// (voir designs/print-ready) : chevalet 105 × 148 mm, plaque 126 × 126 mm,
// carte 89 × 58 mm, fond perdu inclus.
//
// Séparé du composant pour que le rafraîchissement à chaud de React continue de
// fonctionner : un fichier de composants n'exporte que des composants.

const SURFACE_ALIASES = { comptoir: "chevalet", table6: "chevalet" };

export const SURFACE_GEOMETRY = {
  chevalet: { ratio: 1050 / 1480, layout: "portrait" },
  plaque: { ratio: 1, layout: "portrait" },
  carte: { ratio: 890 / 580, layout: "landscape" },
};

export function insertSurface(surface) {
  const resolved = SURFACE_ALIASES[surface] || surface;
  return SURFACE_GEOMETRY[resolved] ? resolved : "chevalet";
}
