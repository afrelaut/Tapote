import { ProductArt } from "./ProductArt.jsx";

const PACK_COMPOSITIONS = Object.freeze({
  essentiel: { comptoir: 1, plaque: 1, carte: 1 },
  comptoir: { comptoir: 2, plaque: 1, carte: 1 },
  equipe: { comptoir: 2, plaque: 2, carte: 3 },
});

function packKeyFromProductId(productId = "") {
  if (productId.includes("equipe")) return "equipe";
  if (productId.includes("comptoir")) return "comptoir";
  return "essentiel";
}

// Le résumé reste lisible lorsque le client ajoute beaucoup de supports : on
// garde au moins un exemplaire de chaque format, puis les premiers designs.
// Tous les exemplaires restent accessibles dans « Vous modifiez ».
function previewUnits(supportDesigns, limit = 4) {
  const representatives = ["comptoir", "plaque", "carte"]
    .map((surface) => supportDesigns.find((design) => design.surface === surface))
    .filter(Boolean);
  const representativeKeys = new Set(representatives.map((design) => design.key));
  return [
    ...representatives,
    ...supportDesigns.filter((design) => !representativeKeys.has(design.key)),
  ].slice(0, limit);
}

export function PackArt({
  productId = "pack_essentiel_pret",
  composition,
  actionId = "avis",
  brandName = "tapote.",
  brandLogo = "",
  theme = "nuit",
  personalization = "ready",
  primaryColor = "",
  secondaryColor = "",
  textColor = "",
  blockColorMode,
  customHeadline = "",
  customSubline = "",
  customTapLabel = "",
  supportDesigns,
  className = "",
}) {
  const packKey = packKeyFromProductId(productId);
  const quantities = composition || PACK_COMPOSITIONS[packKey];
  const artProps = {
    actionId,
    brandName,
    brandLogo,
    theme,
    personalization,
    primaryColor,
    secondaryColor,
    textColor,
    blockColorMode,
    customHeadline,
    customSubline,
    customTapLabel,
  };
  if (Array.isArray(supportDesigns) && supportDesigns.length) {
    const visibleUnits = previewUnits(supportDesigns);
    const hiddenUnitCount = Math.max(0, supportDesigns.length - visibleUnits.length);
    return (
      <div className={`v3-pack-art is-${packKey} is-unit-designs ${className}`.trim()} data-pack={packKey} aria-hidden="true">
        <div className="v3-pack-art-glow" />
        {visibleUnits.map((design, index) => {
          const { key: unitKey, label, surface, ...designProps } = design;
          return (
            <div className={`v3-pack-unit is-${surface}`} key={unitKey || `${surface}-${index}`}>
              <ProductArt
                {...artProps}
                {...designProps}
                surface={surface}
                brandName={design.brandName || brandName}
                brandLogo={design.brandLogo || brandLogo}
              />
              <span>{label || `${surface} ${index + 1}`}</span>
            </div>
          );
        })}
        {hiddenUnitCount > 0 && (
          <span className="v3-pack-more-units"><b>+{hiddenUnitCount}</b><small>supports</small></span>
        )}
      </div>
    );
  }
  return (
    <div className={`v3-pack-art is-${packKey} ${className}`.trim()} data-pack={packKey} aria-hidden="true">
      <div className="v3-pack-art-glow" />
      <div className="v3-pack-piece is-comptoir">
        <ProductArt {...artProps} surface="comptoir" />
        <span><b>{quantities.comptoir}</b><small>chevalet{quantities.comptoir > 1 ? "s" : ""}</small></span>
      </div>
      <div className="v3-pack-piece is-plaque">
        <ProductArt {...artProps} surface="plaque" />
        <span><b>{quantities.plaque}</b><small>plaque{quantities.plaque > 1 ? "s" : ""}</small></span>
      </div>
      <div className="v3-pack-piece is-carte">
        <ProductArt {...artProps} surface="carte" />
        <span><b>{quantities.carte}</b><small>carte{quantities.carte > 1 ? "s" : ""}</small></span>
      </div>
    </div>
  );
}
