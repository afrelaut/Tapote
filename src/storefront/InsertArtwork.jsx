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
import { PlatformGlyph } from "./BrandMark.jsx";
import { platformGlyphForAction } from "./brandIdentity.js";
import { SURFACE_GEOMETRY, insertSurface } from "./insertGeometry.js";
import { DEFAULT_BLOCK_COLOR_MODE, resolveBlockPalette } from "./actionPalettes.js";
import { BrandLogoPlaceholder } from "./BrandMotif.jsx";
import "./insert-artwork.css";

// Typographie française : l'espace qui précède ? ! : ; » est insécable, sinon
// la ponctuation double se retrouve orpheline en début de ligne
// (« Vous avez aimé / ? Tapotez. »).
const NARROW_NBSP = " ";

function markImportedLogoShape(event) {
  const image = event.currentTarget;
  const ratio = image.naturalWidth / Math.max(image.naturalHeight, 1);
  const shape = ratio <= 1.35 ? "compact" : ratio >= 3 ? "wide" : "standard";
  const logoBox = image.closest(".tp-insert-logo");
  const insert = image.closest(".tp-insert");
  if (logoBox) logoBox.dataset.logoShape = shape;
  if (insert) insert.dataset.logoShape = shape;
}

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

function GoogleWordmark() {
  return (
    <span className="tp-insert-google" aria-hidden="true">
      <i>G</i><i>o</i><i>o</i><i>g</i><i>l</i><i>e</i>
    </span>
  );
}

const PLATFORM_WORDMARKS = {
  instagram: "Instagram",
  facebook: "facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
};

function PlatformLockup({ platformId }) {
  return (
    <span className={`tp-insert-platform-lockup is-${platformId}`} data-platform={platformId}>
      <span className="tp-insert-platform-icon"><PlatformGlyph id={platformId} /></span>
      {platformId === "google"
        ? <GoogleWordmark />
        : <b>{PLATFORM_WORDMARKS[platformId]}</b>}
    </span>
  );
}

function NfcWaves() {
  return (
    <svg className="tp-insert-nfc-icon" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="7" height="12" x="2" y="6" rx="1.2" stroke="currentColor" strokeWidth="2" />
      <path d="M13 8.3a7.4 7.4 0 0 1 0 7.4M16.5 6.2a11.8 11.8 0 0 1 0 11.6M20 4.1a15.9 15.9 0 0 1 0 15.8" className="tp-insert-nfc-arcs" strokeWidth="2" />
    </svg>
  );
}

// En portrait les blocs s'empilent directement dans l'insert ; en paysage ils
// sont regroupés dans une colonne posée à côté du bloc action.
function Wrapper({ isCard, children }) {
  return isCard ? <div className="tp-insert-main">{children}</div> : children;
}

function ActionMark({ actionId, ready = false }) {
  const glyph = platformGlyphForAction(actionId);
  // Le service ouvert fait partie du message principal, quel que soit le mode
  // de personnalisation. Les supports « à votre image » doivent donc montrer
  // le même bloc-marque officiel que les modèles Tapote prêts à poser, et non
  // un petit libellé générique difficile à lire dans les aperçus boutique.
  if (glyph) return <PlatformLockup platformId={glyph} />;
  if (actionId === "avis") return ready ? <GoogleWordmark /> : <GoogleStars />;
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
  tagline = "",
  contactLine = "",
  blockColorMode = DEFAULT_BLOCK_COLOR_MODE,
  showBrand = true,
  personalization = "custom",
  designPlaceholder = false,
  className = "",
}) {
  const resolvedSurface = insertSurface(surface);
  const { ratio, layout } = SURFACE_GEOMETRY[resolvedSurface];
  const action = ACTIONS[actionId] || ACTIONS.avis;
  const isCard = layout === "landscape";
  const isReady = personalization === "ready";

  const readyHeadline = action.id === "avis" ? "Votre avis compte, tapotez." : action.campaignHeadline || action.headline;
  const readySubline = action.id === "avis" ? "Laissez un avis en 30 secondes" : action.campaignSubline || action.subline;
  const finalHeadline = headline.trim() || (isReady ? readyHeadline : action.campaignHeadline || action.headline);
  const finalSubline = subline.trim() || (isReady ? readySubline : action.campaignSubline || action.subline);
  const finalTapLabel = tapLabel.trim() || (isCard ? "POSEZ VOTRE TÉLÉPHONE" : "POSEZ VOTRE TÉLÉPHONE ICI");
  const headlineLines = splitHeadline(finalHeadline, layout);
  const readyLogo = String(colors?.paper || "").toLowerCase() === "#141414"
    ? "/brand/tapote-logo-light.svg"
    : "/brand/tapote-logo.svg";

  // Le bloc d'action porte sa propre couleur : celle de Tapote, celle de la
  // marque du client, ou celle du service ouvert par le lien.
  const block = resolveBlockPalette({
    mode: blockColorMode,
    actionId: action.id,
    brandAccent: colors?.accent,
    brandAccentInk: colors?.accentInk,
  });
  const finalTagline = tagline.trim();
  const finalContactLine = contactLine.trim();
  // Le logo du client sert aussi de filigrane : posé en haut, centré, contenu
  // dans la zone imprimable, jamais rogné par le bord du support. Sans logo,
  // c'est l'emblème métier choisi qui tient ce rôle.
  // Tant que le client n'a rien saisi, l'emplacement du logo reste visible : il
  // montre ce qu'il obtiendra. Dès qu'un nom est écrit, le monogramme prend le
  // relais ; dès qu'un logo est importé, c'est le logo.
  // Un client sans logo doit voir un support fini, pas un emplacement vide. Dès
  // qu'il a écrit son nom, la composition se referme sur son nom : c'est ainsi
  // que sont dessinées la plupart des enseignes réelles. L'emplacement en
  // pointillés ne subsiste que sur les aperçus génériques de la vitrine, où il
  // dit au visiteur ce qu'il pourra mettre.
  const namedBrand = Boolean(brandName.trim()) && brandName.trim().toUpperCase() !== "VOTRE MARQUE";
  const showLogoSlot = !isReady && !brandLogo && !namedBrand;
  const watermark = isReady || !brandLogo ? "" : brandLogo;

  const style = {
    "--insert-ratio": ratio,
    "--insert-paper": colors?.paper || "#161310",
    "--insert-ink": colors?.ink || "#f4efe6",
    "--insert-accent": colors?.accent || "#2458ff",
    "--insert-accent-ink": colors?.accentInk || "#ffffff",
    "--insert-block": block.block,
    "--insert-block-image": block.gradient || "none",
    "--insert-block-ink": block.ink,
    "--insert-block-liseret": block.liseret,
  };

  return (
    <div
      className={`tp-insert tp-insert-${resolvedSurface} is-${personalization} ${className}`.trim()}
      data-action={action.id}
      data-layout={layout}
      data-personalization={personalization}
      style={style}
      aria-hidden="true"
    >
      {watermark && <span className="tp-insert-watermark" style={{ "--insert-watermark": `url(${watermark})` }} aria-hidden="true" />}
      <div className="tp-insert-body">
        {designPlaceholder ? (
          <div className="tp-insert-placeholder">
            <span className="tp-insert-placeholder-brand">tapote.</span>
            <i className="is-top-left" />
            <i className="is-top-right" />
            <i className="is-bottom-left" />
            <i className="is-bottom-right" />
            <div>
              <small>VOTRE</small>
              <strong>DESIGN</strong>
              <small>ICI</small>
            </div>
            <footer><NfcWaves /><b>NFC + QR INCLUS</b></footer>
          </div>
        ) : (
          <>
        {/* En paysage, l'identité occupe une colonne et le bloc action l'autre :
            le pied de page reste donc solidaire de la colonne de gauche. */}
        <Wrapper isCard={isCard}>
          <header className="tp-insert-head">
            {(isReady || brandLogo || showLogoSlot) && <span className={`tp-insert-logo${brandLogo ? " is-uploaded" : ""}`}>
              {isReady
                ? <img className="tp-insert-tapote-logo" src={readyLogo} alt="" />
                : brandLogo
                ? <img src={brandLogo} alt="" onLoad={markImportedLogoShape} />
                : <BrandLogoPlaceholder />}
            </span>}
            {showBrand && !isReady && !brandLogo && <b className="tp-insert-brand">{brandName || "VOTRE MARQUE"}</b>}
            {!isReady && finalTagline && <span className="tp-insert-tagline">{finalTagline}</span>}
            {!isReady && finalContactLine && <span className="tp-insert-contact">{finalContactLine}</span>}
          </header>

          <div className="tp-insert-copy">
            {/* Surtitre repris des fichiers d'impression ; la carte s'en passe,
                faute de hauteur utile. */}
            {!isCard && !isReady && !finalTagline && <span className="tp-insert-overline">UN GESTE SUFFIT</span>}
            {/* La destination reste une information de premier niveau, y compris
                sur une création à l'image du client. Une Plaque Instagram ou
                une Card LinkedIn doit être reconnaissable avant même de lire
                l'accroche, exactement comme la collection prête à poser. */}
            {platformGlyphForAction(action.id) && (
              <div className="tp-insert-mark is-service">
                <ActionMark actionId={action.id} ready />
              </div>
            )}
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
            {!isReady && !platformGlyphForAction(action.id) && (
              <div className={`tp-insert-mark${action.id === "avis" ? " is-service" : ""}`}>
                <ActionMark actionId={action.id} />
              </div>
            )}
            {action.id === "avis" && <GoogleStars />}
            <p className="tp-insert-subline">{finalSubline}</p>
          </div>

          {isCard && <footer className="tp-insert-foot">{isReady ? "PROPULSÉ PAR TAPOTE.FR" : `${action.badge || action.name} · TAPOTE.FR`}</footer>}
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
              <strong>TAPOTE.FR</strong>
              <small>ou scannez avec l’appareil photo</small>
            </div>
          )}
        </div>

        {!isCard && <footer className="tp-insert-foot">{isReady ? "PROPULSÉ PAR TAPOTE.FR" : "TAPOTE.FR · UN GESTE SUFFIT"}</footer>}
          </>
        )}
      </div>
    </div>
  );
}
