import { useLayoutEffect, useRef, useState } from "react";
import { Image, Rotate3D } from "lucide-react";
import DeviceFrame from "./DeviceFrame.jsx";
import ProductStudio3D from "./ProductStudio3D.jsx";
import { SCENE_BUDGETS } from "./sceneBudgets.js";

// Coins de la vitre du téléphone, en fractions de la scène. Les sept décors
// composités partagent la même découpe main + téléphone : ils partagent donc le
// même quadrilatère, mesuré sur l'image de la découpe et non recopié à l'œil.
const PHONE_SCREEN_QUADS = Object.freeze({
  "/assets/products/tapote-bg-restaurant-live-screen-v1.webp": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-cafe-empty-v3.png": [[0.48850, 0.27000], [0.69050, 0.23350], [0.93450, 0.68000], [0.71150, 0.75150]],
  "/assets/products/tapote-bg-boulangerie-empty-v2.png": [[0.48850, 0.27000], [0.69050, 0.23350], [0.93450, 0.68000], [0.71150, 0.75150]],
  "/assets/products/tapote-bg-agence-empty-v2.png": [[0.48850, 0.27000], [0.69050, 0.23350], [0.93450, 0.68000], [0.71150, 0.75150]],
  "/assets/products/tapote-bg-sport-empty-v2.png": [[0.48850, 0.27000], [0.69050, 0.23350], [0.93450, 0.68000], [0.71150, 0.75150]],
  "/assets/products/tapote-bg-evenement-empty-v2.png": [[0.48850, 0.27000], [0.69050, 0.23350], [0.93450, 0.68000], [0.71150, 0.75150]],
  "/assets/products/tapote-bg-formation-empty-v2.png": [[0.48850, 0.27000], [0.69050, 0.23350], [0.93450, 0.68000], [0.71150, 0.75150]],
  "/assets/products/tapote-bg-beaute-empty-v2.png": [[0.48850, 0.27000], [0.69050, 0.23350], [0.93450, 0.68000], [0.71150, 0.75150]],
  "/assets/products/tapote-bg-cafe-v1.webp": [[0.481659, 0.261563], [0.708932, 0.215311], [0.996810, 0.719298], [0.716906, 0.779904]],
  "/assets/products/tapote-bg-cafe-restaurant-phone-v2.webp": [[0.4872, 0.2720], [0.7105, 0.2290], [0.9848, 0.7177], [0.7273, 0.7735]],
  "/assets/products/tapote-bg-restaurant-v1.webp": [[0.474478, 0.257134], [0.687755, 0.205264], [0.959916, 0.682301], [0.697377, 0.780543]],
  "/assets/products/tapote-bg-boulangerie-v1.webp": [[0.498975, 0.248284], [0.733490, 0.211885], [0.968620, 0.691920], [0.716358, 0.771898]],
  "/assets/products/tapote-bg-beaute-v1.webp": [[0.501229, 0.249648], [0.740691, 0.213979], [0.969611, 0.703874], [0.716696, 0.785585]],
  "/assets/products/tapote-bg-medical-v1.webp": [[0.476215, 0.280453], [0.694688, 0.224574], [0.945019, 0.669781], [0.718625, 0.758771]],
  "/assets/products/tapote-bg-retail-v1.webp": [[0.499329, 0.247809], [0.732111, 0.210345], [0.966294, 0.685388], [0.716630, 0.770543]],
  "/assets/products/tapote-bg-hotel-v1.webp": [[0.465652, 0.259039], [0.682713, 0.205416], [0.947277, 0.681730], [0.712337, 0.769983]],
  "/assets/products/tapote-bg-auto-ecole-v1.webp": [[0.500609, 0.276762], [0.739021, 0.239813], [0.977707, 0.727795], [0.723370, 0.814768]],
  "/assets/products/tapote-bg-automobile-v1.webp": [[0.508017, 0.259777], [0.728628, 0.221889], [0.967728, 0.711728], [0.724802, 0.789559]],
  "/assets/products/tapote-bg-artisan-v1.webp": [[0.497336, 0.248034], [0.727057, 0.210598], [0.976482, 0.723398], [0.723725, 0.800895]],
  "/assets/products/tapote-bg-agence-v1.webp": [[0.498484, 0.250929], [0.728625, 0.21538], [0.964823, 0.692531], [0.717898, 0.780191]],
  "/assets/products/tapote-bg-sport-v1.webp": [[0.500117, 0.254376], [0.730542, 0.219908], [0.967212, 0.708945], [0.714041, 0.788721]],
  "/assets/products/tapote-bg-formation-v1.webp": [[0.50309, 0.252974], [0.732562, 0.215909], [0.975399, 0.708791], [0.721353, 0.782529]],
  "/assets/products/tapote-bg-evenement-v1.webp": [[0.503473, 0.253848], [0.734066, 0.218198], [0.965786, 0.696765], [0.716194, 0.782694]],
  "/assets/products/tapote-bg-animaux-v1.webp": [[0.472355, 0.285801], [0.685404, 0.230525], [0.936727, 0.674057], [0.708341, 0.757322]],
});

function adjugate3(matrix) {
  return [
    matrix[4] * matrix[8] - matrix[5] * matrix[7],
    matrix[2] * matrix[7] - matrix[1] * matrix[8],
    matrix[1] * matrix[5] - matrix[2] * matrix[4],
    matrix[5] * matrix[6] - matrix[3] * matrix[8],
    matrix[0] * matrix[8] - matrix[2] * matrix[6],
    matrix[2] * matrix[3] - matrix[0] * matrix[5],
    matrix[3] * matrix[7] - matrix[4] * matrix[6],
    matrix[1] * matrix[6] - matrix[0] * matrix[7],
    matrix[0] * matrix[4] - matrix[1] * matrix[3],
  ];
}

function multiply3(left, right) {
  const result = new Array(9).fill(0);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      for (let index = 0; index < 3; index += 1) {
        result[(3 * row) + column] += left[(3 * row) + index] * right[(3 * index) + column];
      }
    }
  }
  return result;
}

function multiplyVector(matrix, vector) {
  return [
    matrix[0] * vector[0] + matrix[1] * vector[1] + matrix[2] * vector[2],
    matrix[3] * vector[0] + matrix[4] * vector[1] + matrix[5] * vector[2],
    matrix[6] * vector[0] + matrix[7] * vector[1] + matrix[8] * vector[2],
  ];
}

function basisFor(points) {
  const matrix = [
    points[0][0], points[1][0], points[2][0],
    points[0][1], points[1][1], points[2][1],
    1, 1, 1,
  ];
  const vector = multiplyVector(adjugate3(matrix), [points[3][0], points[3][1], 1]);
  return multiply3(matrix, [vector[0], 0, 0, 0, vector[1], 0, 0, 0, vector[2]]);
}

// Les quadrilatères sont mesurés sur l'image source, qui est carrée. La scène,
// elle, ne l'est pas toujours : `object-fit: cover` recadre alors la photo, et
// appliquer les fractions à la boîte de la scène décalait l'écran hors du
// téléphone. On reproduit ici le recadrage de `cover` avant de projeter.
function coverProjection(width, height) {
  const displayed = Math.max(width, height);
  return {
    size: displayed,
    offsetX: (width - displayed) / 2,
    offsetY: (height - displayed) / 2,
  };
}

function phoneMatrix3d(destinationFractions, width, height) {
  const source = [[0, 0], [390, 0], [390, 844], [0, 844]];
  const { size, offsetX, offsetY } = coverProjection(width, height);
  const destination = destinationFractions.map(([x, y]) => [offsetX + (x * size), offsetY + (y * size)]);
  const projection = multiply3(basisFor(destination), adjugate3(basisFor(source)));
  for (let index = 0; index < 9; index += 1) projection[index] /= projection[8];
  return `matrix3d(${[
    projection[0], projection[3], 0, projection[6],
    projection[1], projection[4], 0, projection[7],
    0, 0, 1, 0,
    projection[2], projection[5], 0, projection[8],
  ].join(",")})`;
}

export default function PdpScene({
  image,
  alt,
  preview,
  compact = false,
  className = "",
  sectorId = "",
  sectorTitle = "",
  subjectLayers = [],
  renderSupport,
}) {
  const sceneRef = useRef(null);
  const [viewMode, setViewMode] = useState("studio");
  const destinationQuad = PHONE_SCREEN_QUADS[image];
  const mixedPack = preview.surface === "mix";
  const activeView = compact || mixedPack ? "context" : viewMode;

  useLayoutEffect(() => {
    if (activeView !== "context") return undefined;
    const stage = sceneRef.current?.querySelector(".v3-sector-scene-stage");
    const screen = sceneRef.current?.querySelector(".tapote-device__screen");
    if (!stage || !screen) return undefined;
    if (!destinationQuad) {
      screen.style.transform = "";
      return undefined;
    }
    const positionDevice = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (width && height) screen.style.transform = phoneMatrix3d(destinationQuad, width, height);
    };
    positionDevice();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(positionDevice);
    observer?.observe(stage);
    return () => observer?.disconnect();
  }, [activeView, destinationQuad, preview.actionId]);

  return (
    <div
      ref={sceneRef}
      className={`v3-sector-scene ${compact ? "is-compact is-fixed-preview" : "is-live-preview"} is-surface-${preview.surface} ${className}`}
      data-preview-mode={compact ? "fixed" : "live"}
      data-scene-engine="pdp"
      data-scene-budget={compact ? "compact" : "responsive"}
      aria-hidden={compact || undefined}
    >
      {!compact && !mixedPack && (
        <div className="v3-scene-view-switch" role="group" aria-label="Type d’aperçu">
          <button type="button" className={activeView === "studio" ? "is-active" : ""} aria-pressed={activeView === "studio"} onClick={() => setViewMode("studio")}>
            <Rotate3D aria-hidden="true" /> Objet 3D
          </button>
          <button type="button" className={activeView === "context" ? "is-active" : ""} aria-pressed={activeView === "context"} onClick={() => setViewMode("context")}>
            <Image aria-hidden="true" /> En situation
          </button>
        </div>
      )}
      {activeView === "studio" ? (
        <div className="v3-sector-scene-studio">
          <ProductStudio3D
            surface={preview.surface}
            actionId={preview.actionId}
            primaryColor={preview.primaryColor}
            accentColor={preview.secondaryColor}
            textColor={preview.textColor}
            destinationUrl={preview.destinationUrl}
            sectorId={sectorId}
            sectorTitle={sectorTitle}
            brandName={preview.brandName}
            brandLogo={preview.brandLogo}
            brandMotif={preview.brandMotif}
            tagline={preview.tagline}
            contactLine={preview.contactLine}
            blockColorMode={preview.blockColorMode}
            customHeadline={preview.customHeadline}
            customSubline={preview.customSubline}
            customTapLabel={preview.customTapLabel}
            personalization={preview.personalization}
          />
        </div>
      ) : (
        <div className="v3-sector-scene-stage">
          <img
            className="v3-sector-scene-background"
            src={image}
            alt={compact ? "" : alt}
            loading={compact ? SCENE_BUDGETS.compact.imageLoading : "eager"}
            decoding="async"
          />
          {subjectLayers.map((layer) => (
            <img
              className={`v3-sector-scene-subject${layer.mask ? "" : " is-cutout"}`}
              src={layer.image}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={layer.mask ? { "--v3-subject-mask": `url("${layer.mask}")` } : undefined}
              key={layer.mask || layer.image}
            />
          ))}
          {mixedPack ? (
            <div className="v3-sector-scene-support v3-sector-scene-support-mix">
              {renderSupport({ surface: "comptoir", className: "is-mix-comptoir" })}
              {renderSupport({ surface: "plaque", className: "is-mix-plaque" })}
            </div>
          ) : renderSupport({ surface: preview.surface, className: "v3-sector-scene-support" })}
          <DeviceFrame
            actionId={preview.actionId}
            sectorId={sectorId}
            sectorTitle={sectorTitle}
            brandName={preview.brandName}
            brandLogo={preview.brandLogo}
            primaryColor={preview.primaryColor}
            secondaryColor={preview.secondaryColor}
            textColor={preview.textColor}
            sceneImage={image}
            personalization={preview.personalization}
            destinationUrl={preview.destinationUrl}
            accentColor={preview.secondaryColor}
            embedded
            className={!destinationQuad ? "is-unmapped" : ""}
          />
        </div>
      )}
    </div>
  );
}
