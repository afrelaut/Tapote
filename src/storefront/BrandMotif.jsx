import { MONOGRAM_SHAPES, brandInitialsFor, motifPath } from "./brandMotifs.js";

// Marque de substitution rendue à l'écran comme à l'impression : soit un
// monogramme (cartouche + initiales), soit un symbole neutre. Un seul composant
// pour les deux, afin que l'aperçu du configurateur et le support imprimé ne
// puissent jamais diverger.
export function BrandMotif({ shape = "", initials = "", brandName = "", className = "" }) {
  const path = motifPath(shape);
  if (!path) return null;
  const isMonogram = Object.prototype.hasOwnProperty.call(MONOGRAM_SHAPES, shape);
  const letters = isMonogram ? (initials || brandInitialsFor(brandName) || "AB") : "";
  return (
    <svg className={`tp-motif ${className}`.trim()} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth={isMonogram ? 2 : 2.2} strokeLinecap="round" strokeLinejoin="round" />
      {letters && (
        <text
          x="24"
          y="24"
          fill="currentColor"
          stroke="none"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Archivo Black', Archivo, sans-serif"
          fontSize={letters.length > 1 ? 15 : 20}
          letterSpacing="-0.5"
        >
          {letters}
        </text>
      )}
    </svg>
  );
}
