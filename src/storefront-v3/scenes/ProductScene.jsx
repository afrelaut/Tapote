import { resolveDeviceColors } from "../../deviceThemes.js";
import DeviceFrame from "../../storefront/scenes/DeviceFrame.jsx";
import PdpScene from "../../storefront/scenes/PdpScene.jsx";
import { ProductArt } from "./ProductArt.jsx";

export function ProductScene({
  image,
  alt,
  preview,
  compact = false,
  className = "",
  sectorId = "",
  sectorTitle = "",
  subjectLayers = [],
}) {
  const sceneColors = resolveDeviceColors(
    preview.theme,
    preview.primaryColor,
    preview.secondaryColor,
    preview.textColor,
  );
  const scenePreview = {
    ...preview,
    primaryColor: sceneColors.paper,
    secondaryColor: sceneColors.accent,
    textColor: sceneColors.ink,
  };

  return (
    <PdpScene
      image={image}
      alt={alt}
      preview={scenePreview}
      compact={compact}
      className={className}
      sectorId={sectorId}
      sectorTitle={sectorTitle}
      subjectLayers={subjectLayers}
      renderSupport={({ surface, className: supportClassName }) => (
        <ProductArt {...scenePreview} surface={surface} className={supportClassName} />
      )}
    />
  );
}

export function SectorScene({ sector, preview, compact = false, className = "" }) {
  return (
    <ProductScene
      image={sector.image}
      alt={`Tapote utilisé dans un univers ${sector.title}`}
      preview={preview}
      compact={compact}
      className={className}
      sectorId={sector.id}
      sectorTitle={sector.title}
      subjectLayers={sector.subjectLayers}
    />
  );
}

// Les cartes boutique utilisaient une photo générée, puis projetaient une page
// web dans le téléphone photographié. Le moindre écart de perspective rendait
// l'ensemble artificiel. Cette composition de studio emploie le vrai visuel du
// support et un téléphone CSS complet : l'écran est désormais contenu par son
// propre châssis, sans masque ni quadrilatère approximatif.
export function ShopProductPreview({ preview, sectorId = "", sectorTitle = "" }) {
  const sceneColors = resolveDeviceColors(
    preview.theme,
    preview.primaryColor,
    preview.secondaryColor,
    preview.textColor,
  );
  const scenePreview = {
    ...preview,
    primaryColor: sceneColors.paper,
    secondaryColor: sceneColors.accent,
    textColor: sceneColors.ink,
  };

  return (
    <div
      className={`v3-shop-product-preview is-${preview.surface}`}
      data-personalization={preview.personalization}
      aria-hidden="true"
    >
      <span className="v3-shop-preview-orbit" />
      <ProductArt {...scenePreview} className="v3-shop-preview-support" />
      <DeviceFrame
        actionId={preview.actionId}
        sectorId={sectorId}
        sectorTitle={sectorTitle}
        brandName={preview.brandName}
        brandLogo={preview.brandLogo}
        primaryColor={scenePreview.primaryColor}
        secondaryColor={scenePreview.secondaryColor}
        textColor={scenePreview.textColor}
        personalization={preview.personalization}
        accentColor={scenePreview.secondaryColor}
        embedded={false}
        className="v3-shop-preview-phone"
      />
      <span className="v3-shop-preview-proof">NFC + QR</span>
    </div>
  );
}
