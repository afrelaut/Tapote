import { useLayoutEffect, useRef, useState } from "react";
import { Image, Rotate3D } from "lucide-react";
import DeviceFrame from "./DeviceFrame.jsx";
import ProductStudio3D from "./ProductStudio3D.jsx";
import { SCENE_BUDGETS } from "./sceneBudgets.js";

// Géométrie du verre photographié, reprise de la version en production.
//
// Le quadrilatère donne la perspective ; le chemin arrondi qui en découle
// découpe l'écran sur la silhouette réelle de la vitre, coins compris. Sans
// cette découpe, la moindre imprécision laisse l'interface déborder sur le
// biseau ou sur la main.

const PHONE_SCREEN_QUADS = {
  // Four measured intersections of the photographed glass edges. Keeping the
  // full quadrilateral (instead of approximating its centre) makes both the
  // browser chrome and the home indicator parallel to the physical phone.
  "/assets/products/tapote-bg-restaurant-live-screen-v1.webp": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-cafe-empty-v3.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-boulangerie-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-agence-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-sport-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  "/assets/products/tapote-bg-evenement-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  // La scène Coworking réutilise volontairement les pixels et la géométrie
  // du téléphone Restaurant, superposés sur son propre fond vide.
  "/assets/products/tapote-bg-formation-empty-v2.png": [[0.46709, 0.25773], [0.69149, 0.21130], [0.95828, 0.69250], [0.71273, 0.77095]],
  // Contrairement aux autres scènes, le téléphone Café est davantage tourné
  // et ses quatre bords ne convergent pas autour d'un simple rectangle incliné.
  // Ces intersections suivent précisément la limite verre / écran de la photo :
  // toute l'interface partage ainsi le même cadrage, quelle que soit la destination.
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
  "/assets/products/tapote-bg-agence-v1.webp": [[0.498484, 0.250929], [0.728625, 0.215380], [0.964823, 0.692531], [0.717898, 0.780191]],
  "/assets/products/tapote-bg-sport-v1.webp": [[0.500117, 0.254376], [0.730542, 0.219908], [0.967212, 0.708945], [0.714041, 0.788721]],
  "/assets/products/tapote-bg-formation-v1.webp": [[0.503090, 0.252974], [0.732562, 0.215909], [0.975399, 0.708791], [0.721353, 0.782529]],
  "/assets/products/tapote-bg-evenement-v1.webp": [[0.503473, 0.253848], [0.734066, 0.218198], [0.965786, 0.696765], [0.716194, 0.782694]],
  "/assets/products/tapote-bg-animaux-v1.webp": [[0.472355, 0.285801], [0.685404, 0.230525], [0.936727, 0.674057], [0.708341, 0.757322]],
};

const PHONE_SCREEN_CLIP_RADII = {
  // Le téléphone de la scène Café remonte plus vite sur son coin inférieur
  // gauche que celui du restaurant. Une valeur dédiée évite que l'écran
  // dynamique dépasse du verre sans modifier son haut, déjà correctement calé.
  "/assets/products/tapote-bg-cafe-v1.webp": [60, 60, 106, 76],
  "/assets/products/tapote-bg-cafe-restaurant-phone-v2.webp": [60, 60, 90, 90],
  "/assets/products/tapote-bg-cafe-empty-v3.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-boulangerie-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-agence-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-sport-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-evenement-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-formation-empty-v2.png": [60, 60, 82, 76],
  "/assets/products/tapote-bg-restaurant-v1.webp": [60, 60, 80, 118],
  "/assets/products/tapote-bg-boulangerie-v1.webp": [60, 60, 95, 79],
  "/assets/products/tapote-bg-beaute-v1.webp": [60, 60, 90, 83.5],
  "/assets/products/tapote-bg-medical-v1.webp": [58, 58, 62, 75],
  "/assets/products/tapote-bg-retail-v1.webp": [60, 60, 88, 79],
  "/assets/products/tapote-bg-hotel-v1.webp": [58, 58, 69, 58],
  "/assets/products/tapote-bg-auto-ecole-v1.webp": [60, 60, 105, 81],
  "/assets/products/tapote-bg-automobile-v1.webp": [58, 58, 77, 59],
  "/assets/products/tapote-bg-artisan-v1.webp": [54, 54, 67, 55],
  "/assets/products/tapote-bg-agence-v1.webp": [60, 60, 92, 76],
  "/assets/products/tapote-bg-sport-v1.webp": [60, 60, 108, 77],
  "/assets/products/tapote-bg-formation-v1.webp": [60, 60, 95, 58],
  "/assets/products/tapote-bg-evenement-v1.webp": [60, 60, 92, 83],
  "/assets/products/tapote-bg-animaux-v1.webp": [58, 58, 70, 77],
};

// Local control-point corrections for generated glass whose photographed
// rounded corner does not converge on the mathematical edge intersection.
// Values are photo pixels and affect only the curve, not the app perspective.
const PHONE_SCREEN_CLIP_CONTROL_OFFSETS = {
  "/assets/products/tapote-bg-cafe-v1.webp": { br: [-8, -4] },
  "/assets/products/tapote-bg-beaute-v1.webp": { br: [-1.5, 7.25] },
  "/assets/products/tapote-bg-agence-v1.webp": { br: [-0.25, 7.25] },
  "/assets/products/tapote-bg-sport-v1.webp": { br: [-18.25, 3.25] },
  "/assets/products/tapote-bg-formation-v1.webp": { br: [-8, 0] },
};

function roundedPhoneClipPath(sceneImage) {
  const quad = PHONE_SCREEN_QUADS[sceneImage];
  if (!quad) return "";
  const [tl, tr, br, bl] = quad.map(([x, y]) => [x * 1254, y * 1254]);
  const [tlRadius, trRadius, brRadius, blRadius] = PHONE_SCREEN_CLIP_RADII[sceneImage] || [60, 60, 82, 76];
  const controlOffsets = PHONE_SCREEN_CLIP_CONTROL_OFFSETS[sceneImage] || {};
  const shifted = ([x, y], [dx = 0, dy = 0] = []) => [x + dx, y + dy];
  const tlControl = shifted(tl, controlOffsets.tl);
  const trControl = shifted(tr, controlOffsets.tr);
  const brControl = shifted(br, controlOffsets.br);
  const blControl = shifted(bl, controlOffsets.bl);
  const along = ([ax, ay], [bx, by], amount) => [ax + ((bx - ax) * amount), ay + ((by - ay) * amount)];
  const topStart = along(tl, tr, tlRadius / 390);
  const topEnd = along(tr, tl, trRadius / 390);
  const rightStart = along(tr, br, trRadius / 844);
  const rightEnd = along(br, tr, brRadius / 844);
  const bottomStart = along(br, bl, brRadius / 390);
  const bottomEnd = along(bl, br, blRadius / 390);
  const leftStart = along(bl, tl, blRadius / 844);
  const leftEnd = along(tl, bl, tlRadius / 844);
  const point = ([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  return [
    `M ${point(topStart)}`,
    `L ${point(topEnd)}`,
    `Q ${point(trControl)} ${point(rightStart)}`,
    `L ${point(rightEnd)}`,
    `Q ${point(brControl)} ${point(bottomStart)}`,
    `L ${point(bottomEnd)}`,
    `Q ${point(blControl)} ${point(leftStart)}`,
    `L ${point(leftEnd)}`,
    `Q ${point(tlControl)} ${point(topStart)}`,
    "Z",
  ].join(" ");
}

function samplePhonePath(pathData) {
  const tokens = String(pathData || "").match(/[MLQCZ]|-?(?:\d+\.?\d*|\.\d+)/g) || [];
  if (!tokens.length) return [];
  const points = [];
  let index = 0;
  let current = [0, 0];
  let start = [0, 0];
  const number = () => Number(tokens[index++]);
  const addPoint = (point) => {
    if (point.every(Number.isFinite)) points.push(point);
  };
  const sampleQuadratic = (from, control, to, steps = 10) => {
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const inverse = 1 - t;
      addPoint([
        (inverse * inverse * from[0]) + (2 * inverse * t * control[0]) + (t * t * to[0]),
        (inverse * inverse * from[1]) + (2 * inverse * t * control[1]) + (t * t * to[1]),
      ]);
    }
  };
  const sampleCubic = (from, firstControl, secondControl, to, steps = 14) => {
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const inverse = 1 - t;
      addPoint([
        (inverse ** 3 * from[0]) + (3 * inverse * inverse * t * firstControl[0]) + (3 * inverse * t * t * secondControl[0]) + (t ** 3 * to[0]),
        (inverse ** 3 * from[1]) + (3 * inverse * inverse * t * firstControl[1]) + (3 * inverse * t * t * secondControl[1]) + (t ** 3 * to[1]),
      ]);
    }
  };

  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === "M") {
      current = [number(), number()];
      start = current;
      addPoint(current);
    } else if (command === "L") {
      current = [number(), number()];
      addPoint(current);
    } else if (command === "Q") {
      const control = [number(), number()];
      const destination = [number(), number()];
      sampleQuadratic(current, control, destination);
      current = destination;
    } else if (command === "C") {
      const firstControl = [number(), number()];
      const secondControl = [number(), number()];
      const destination = [number(), number()];
      sampleCubic(current, firstControl, secondControl, destination);
      current = destination;
    } else if (command === "Z") {
      current = start;
    } else {
      return [];
    }
  }

  return points.length < 4 ? [] : points;
}

// Le masque est exprimé en pixels de la scène, pas en pourcentages : c'est la
// seule façon de rester juste quand le cadre n'est pas carré et que la photo
// est recadrée par `object-fit: cover`.
function phoneClipPolygon(pathData, width, height) {
  const points = samplePhonePath(pathData);
  if (!points.length) return "none";
  const { size, offsetX, offsetY } = coverProjection(width, height);
  const asPixels = ([x, y]) => `${(offsetX + ((x / 1254) * size)).toFixed(2)}px ${(offsetY + ((y / 1254) * size)).toFixed(2)}px`;
  return `polygon(${points.map(asPixels).join(", ")})`;
}

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
    const frame = sceneRef.current?.querySelector(".tapote-device-frame");
    const screen = sceneRef.current?.querySelector(".tapote-device__screen");
    if (!stage || !screen || !frame) return undefined;
    if (!destinationQuad) {
      screen.style.transform = "";
      frame.style.clipPath = "";
      return undefined;
    }
    const glassPath = roundedPhoneClipPath(image);
    const positionDevice = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      screen.style.transform = phoneMatrix3d(destinationQuad, width, height);
      // La découpe suit la silhouette photographiée du verre : aucune surface
      // de l'application ne peut passer par-dessus le biseau ou la main.
      const clip = phoneClipPolygon(glassPath, width, height);
      frame.style.clipPath = clip === "none" ? "" : clip;
    };
    positionDevice();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(positionDevice);
    observer?.observe(stage);
    return () => observer?.disconnect();
  }, [activeView, destinationQuad, image, preview.actionId]);

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
