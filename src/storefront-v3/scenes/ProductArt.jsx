import InsertArtwork from "../../storefront/InsertArtwork.jsx";
import { insertSurface } from "../../storefront/insertGeometry.js";
import { resolveDeviceColors } from "../../deviceThemes.js";

export function ProductArt({ surface = "comptoir", actionId = "avis", brandName = "VOTRE MARQUE", brandLogo = "", brandMotif, tagline = "", contactLine = "", blockColorMode, theme = "blue", primaryColor = "", secondaryColor = "", textColor = "", customHeadline = "", customSubline = "", customTapLabel = "", personalization = "ready", designPlaceholder = false, className = "" }) {
  const shape = insertSurface(surface);
  const colors = resolveDeviceColors(theme, primaryColor, secondaryColor, textColor);
  return (
    <div className={`v3-product-art v3-product-${shape} ${className}`.trim()} data-personalization={personalization} aria-hidden="true">
      <div className="v3-product-frame">
        <InsertArtwork
          surface={shape}
          actionId={actionId}
          brandName={brandName}
          brandLogo={brandLogo}
          brandMotif={brandMotif}
          tagline={tagline}
          contactLine={contactLine}
          blockColorMode={blockColorMode}
          colors={colors}
          headline={customHeadline}
          subline={customSubline}
          tapLabel={customTapLabel}
          personalization={personalization}
          designPlaceholder={designPlaceholder}
        />
      </div>
      {shape === "chevalet" && <span className="v3-product-stand" aria-hidden="true" />}
    </div>
  );
}
