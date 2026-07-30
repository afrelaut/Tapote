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

// Emplacement du logo client : il reste affiché tant que le client n'a rien
// saisi, parce qu'il vend la personnalisation. Redessiné dans le même langage
// que les monogrammes — cercle fin, croix légère — et la mention passe SOUS le
// cercle au lieu de chevaucher son tracé.
export function BrandLogoPlaceholder({ className = "" }) {
  return (
    <svg className={`tp-motif tp-logo-slot ${className}`.trim()} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="21" r="15.4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.6 3.4" strokeLinecap="round" />
      <path d="M24 14.6v12.8M17.6 21h12.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <text
        x="24"
        y="43.5"
        fill="currentColor"
        stroke="none"
        textAnchor="middle"
        fontFamily="Archivo, sans-serif"
        fontSize="6"
        fontWeight="800"
        letterSpacing="1.1"
      >
        LOGO
      </text>
    </svg>
  );
}
