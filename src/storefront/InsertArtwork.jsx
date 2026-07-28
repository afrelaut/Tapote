// Rendu web de l'insert imprimé.
//
// La géométrie reprend celle des fichiers print-ready (designs/print-ready) :
// chevalet 105 × 148 mm, plaque 126 × 126 mm, carte 89 × 58 mm. Tout est
// exprimé en `cqw`, donc l'aperçu reste identique de la vignette de 90 px à la
// scène plein écran — c'est ce qui remplace l'ancien empilement de tailles
// fixes et de media queries.
//
// Hiérarchie appliquée (validée le 24/07/2026) :
//   logo client → nom du commerce → accroche → repère d'action → sous-titre
//   → bloc action (NFC + QR) → signature Tapote.

import { Fragment } from "react";
import { ACTIONS } from "../../shared/catalog.js";
import { GeneratedBrandMark, PlatformGlyph } from "./BrandMark.jsx";
import { platformGlyphForAction } from "./brandIdentity.js";
import { SURFACE_GEOMETRY, insertSurface } from "./insertGeometry.js";
import "./insert-artwork.css";

// Typographie française : l'espace qui précède ? ! : ; » est insécable, sinon
// la ponctuation double se retrouve orpheline en début de ligne
// (« Vous avez aimé / ? Tapotez. »).
const NARROW_NBSP = " ";

function protectFrenchPunctuation(text) {
  return text
    .replace(/\s+([?!;:»])/g, `${NARROW_NBSP}$1`)
    .replace(/([«])\s+/g, `$1${NARROW_NBSP}`);
}

// Le titre imprimé tient sur deux lignes courtes plutôt qu'une longue ligne
// écrasée : on coupe au mot le plus proche du milieu.
function splitHeadline(headline, layout) {
  const text = protectFrenchPunctuation(String(headline || "").trim());
  const words = text.split(/[ \t\n]+/).filter(Boolean);
  if (words.length < 2 || (layout === "landscape" && text.length <= 14)) return [text];
  if (text.length <= 12) return [text];

  // La signature de marque tombe toujours seule sur la seconde ligne, comme sur
  // les fichiers d'impression : « Vous avez aimé ? » / « Tapotez. »
  const signature = words.at(-1);
  if (/^tapotez[.!]?$/i.test(signature) && words.length > 2) {
    return [words.slice(0, -1).join(" "), signature];
  }

  let bestIndex = 1;
  let bestScore = Infinity;
  for (let index = 1; index < words.length; index += 1) {
    const left = words.slice(0, index).join(" ").length;
    const right = words.slice(index).join(" ").length;
    const score = Math.abs(left - right);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
}

function GoogleStars() {
  // Les cinq étoiles reprennent les couleurs Google du fichier d'impression.
  const colors = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853"];
  return (
    <span className="tp-insert-stars" aria-hidden="true">
      {colors.map((color, index) => (
        <svg viewBox="0 0 24 24" key={index}><path fill={color} d="M12 2.6l2.6 6.9 7.4.35-5.8 4.6 2 7.15L12 17.5 5.8 21.6l2-7.15L2 9.85l7.4-.35Z" /></svg>
      ))}
    </span>
  );
}

function NfcWaves() {
  return (
    <svg className="tp-insert-nfc-icon" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="7" height="12" x="2" y="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 8.3a7.4 7.4 0 0 1 0 7.4M16.5 6.2a11.8 11.8 0 0 1 0 11.6M20 4.1a15.9 15.9 0 0 1 0 15.8" className="tp-insert-nfc-arcs" strokeWidth="1.6" />
    </svg>
  );
}

// En portrait les blocs s'empilent directement dans l'insert ; en paysage ils
// sont regroupés dans une colonne posée à côté du bloc action.
function Wrapper({ isCard, children }) {
  return isCard ? <div className="tp-insert-main">{children}</div> : children;
}

function ActionMark({ actionId }) {
  if (actionId === "avis") return <GoogleStars />;
  const glyph = platformGlyphForAction(actionId);
  if (glyph) return <span className="tp-insert-platform"><PlatformGlyph id={glyph} /><b>{ACTIONS[actionId]?.name}</b></span>;
  return <span className="tp-insert-action-tag">{ACTIONS[actionId]?.badge || ACTIONS[actionId]?.name}</span>;
}

export default function InsertArtwork({
  surface = "chevalet",
  actionId = "avis",
  brandName = "VOTRE MARQUE",
  brandLogo = "",
  colors,
  headline = "",
  subline = "",
  tapLabel = "",
  showBrand = true,
  className = "",
}) {
  const resolvedSurface = insertSurface(surface);
  const { ratio, layout } = SURFACE_GEOMETRY[resolvedSurface];
  const action = ACTIONS[actionId] || ACTIONS.avis;
  const isCard = layout === "landscape";

  const finalHeadline = headline.trim() || action.campaignHeadline || action.headline;
  const finalSubline = subline.trim() || action.campaignSubline || action.subline;
  const finalTapLabel = tapLabel.trim() || (isCard ? "POSEZ VOTRE TÉLÉPHONE" : "POSEZ VOTRE TÉLÉPHONE ICI");
  const headlineLines = splitHeadline(finalHeadline, layout);

  const style = {
    "--insert-ratio": ratio,
    "--insert-paper": colors?.paper || "#161310",
    "--insert-ink": colors?.ink || "#f4efe6",
    "--insert-accent": colors?.accent || "#2458ff",
    "--insert-accent-ink": colors?.accentInk || "#ffffff",
  };

  return (
    <div
      className={`tp-insert tp-insert-${resolvedSurface} ${className}`.trim()}
      data-action={action.id}
      data-layout={layout}
      style={style}
      aria-hidden="true"
    >
      <div className="tp-insert-body">
        {/* En paysage, l'identité occupe une colonne et le bloc action l'autre :
            le pied de page reste donc solidaire de la colonne de gauche. */}
        <Wrapper isCard={isCard}>
          <header className="tp-insert-head">
            <span className="tp-insert-logo">
              {brandLogo
                ? <img src={brandLogo} alt="" />
                : <GeneratedBrandMark name={brandName} />}
            </span>
            {showBrand && <b className="tp-insert-brand">{brandName || "VOTRE MARQUE"}</b>}
          </header>

          <div className="tp-insert-copy">
            {/* Surtitre repris des fichiers d'impression ; la carte s'en passe,
                faute de hauteur utile. */}
            {!isCard && <span className="tp-insert-overline">UN GESTE SUFFIT</span>}
            {/* Les lignes sont séparées par une vraie espace dans le DOM : sans
                elle, le texte extrait recolle les mots (« Découvreznos »). Le
                rendu reste sur deux lignes grâce au `display: block`. */}
            <p className="tp-insert-headline">
              {headlineLines.map((line, index) => (
                <Fragment key={index}>
                  {index > 0 && " "}
                  <span>{line}</span>
                </Fragment>
              ))}
            </p>
            <div className="tp-insert-mark"><ActionMark actionId={action.id} /></div>
            <p className="tp-insert-subline">{finalSubline}</p>
          </div>

          {isCard && <footer className="tp-insert-foot">{`${action.badge || action.name} · TAPOTE.FR`}</footer>}
        </Wrapper>

        <div className="tp-insert-action">
          <div className="tp-insert-nfc">
            <NfcWaves />
            <strong>{finalTapLabel}</strong>
            <small>NFC · sans application</small>
          </div>
          {!isCard && (
            <div className="tp-insert-qr">
              <img src="/brand/tapote-qr-demo.svg" alt="" />
              <strong>OU SCANNEZ</strong>
              <small>avec l’appareil photo</small>
            </div>
          )}
        </div>

        {!isCard && <footer className="tp-insert-foot">TAPOTE.FR · UN GESTE SUFFIT</footer>}
      </div>
    </div>
  );
}
