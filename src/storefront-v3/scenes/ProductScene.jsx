import { resolveDeviceColors } from "../../deviceThemes.js";
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
