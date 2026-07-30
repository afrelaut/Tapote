import { useEffect, useRef, useState } from "react";
import { toCanvas } from "html-to-image";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Timer,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import InsertArtwork from "../InsertArtwork.jsx";
import DeviceFrame from "./DeviceFrame.jsx";
import { SCENE_BUDGETS } from "./sceneBudgets.js";

const PRODUCT_LABELS = {
  comptoir: "Tapote Comptoir",
  plaque: "Tapote Plaque",
  carte: "Tapote Card",
};

function supportsWebGl() {
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent || "")) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true })
      || canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }),
    );
  } catch {
    return false;
  }
}

function makePrintTexture(canvas) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function makeMaterials(surface, texture, primaryColor) {
  const edge = new MeshPhysicalMaterial({
    color: primaryColor,
    roughness: surface === "carte" ? 0.24 : 0.18,
    metalness: surface === "carte" ? 0.18 : 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const print = new MeshPhysicalMaterial({
    map: texture,
    roughness: 0.23,
    metalness: 0.02,
    clearcoat: 0.92,
    clearcoatRoughness: 0.16,
  });
  const acrylic = new MeshPhysicalMaterial({
    color: "#dce7ff",
    roughness: 0.06,
    metalness: 0,
    transmission: 0.9,
    transparent: true,
    opacity: 0.46,
    thickness: 0.8,
    ior: 1.48,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });
  return { edge, print, acrylic };
}

function addFront(group, width, height, depth, texture, radius = 0.07) {
  const front = new Mesh(
    new RoundedBoxGeometry(width, height, 0.018, 7, radius),
    new MeshBasicMaterial({
      map: texture,
      toneMapped: false,
    }),
  );
  front.position.z = (depth / 2) + 0.012;
  front.castShadow = true;
  group.add(front);
}

function buildComptoir(texture, primaryColor) {
  const group = new Group();
  const { edge, acrylic } = makeMaterials("comptoir", texture, primaryColor);
  const shell = new Mesh(new RoundedBoxGeometry(2.38, 3.35, 0.12, 8, 0.09), acrylic);
  shell.position.y = 0.22;
  shell.castShadow = true;
  group.add(shell);

  const insert = new Mesh(new RoundedBoxGeometry(2.22, 3.18, 0.085, 7, 0.08), edge);
  insert.position.set(0, 0.2, 0.04);
  insert.castShadow = true;
  group.add(insert);
  addFront(group, 2.15, 3.11, 0.16, texture, 0.075);
  group.children[group.children.length - 1].position.y = 0.2;

  const base = new Mesh(new RoundedBoxGeometry(2.82, 0.12, 1.12, 7, 0.055), acrylic);
  base.position.set(0, -1.53, 0.42);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const foot = new Mesh(new RoundedBoxGeometry(2.12, 0.08, 0.78, 6, 0.04), new MeshPhysicalMaterial({
    color: primaryColor,
    roughness: 0.2,
    metalness: 0.08,
    clearcoat: 0.9,
  }));
  foot.position.set(0, -1.48, 0.36);
  foot.castShadow = true;
  group.add(foot);
  return group;
}

function buildPlaque(texture, primaryColor) {
  const group = new Group();
  const { edge } = makeMaterials("plaque", texture, primaryColor);
  const panel = new Mesh(new RoundedBoxGeometry(3.12, 3.12, 0.13, 8, 0.11), edge);
  panel.castShadow = true;
  group.add(panel);
  addFront(group, 3.02, 3.02, 0.13, texture, 0.1);

  const standoffMaterial = new MeshPhysicalMaterial({
    color: "#cbd2dc",
    roughness: 0.18,
    metalness: 0.72,
    clearcoat: 0.8,
  });
  [[-1.3, 1.3], [1.3, 1.3], [-1.3, -1.3], [1.3, -1.3]].forEach(([x, y]) => {
    const standoff = new Mesh(new CylinderGeometry(0.075, 0.075, 0.06, 28), standoffMaterial);
    standoff.rotation.x = Math.PI / 2;
    standoff.position.set(x, y, 0.11);
    standoff.castShadow = true;
    group.add(standoff);
  });
  return group;
}

function buildCard(texture, primaryColor) {
  const group = new Group();
  const { edge } = makeMaterials("carte", texture, primaryColor);
  const back = new Mesh(new RoundedBoxGeometry(3.4, 2.214, 0.09, 8, 0.15), edge);
  back.position.set(0.22, 0.2, -0.17);
  back.rotation.z = 0.075;
  back.castShadow = true;
  group.add(back);

  const card = new Mesh(new RoundedBoxGeometry(3.4, 2.214, 0.105, 8, 0.15), edge);
  card.castShadow = true;
  group.add(card);
  addFront(group, 3.31, 2.124, 0.105, texture, 0.14);
  return group;
}

function buildProduct(surface, texture, primaryColor) {
  if (surface === "plaque") return buildPlaque(texture, primaryColor);
  if (surface === "carte") return buildCard(texture, primaryColor);
  return buildComptoir(texture, primaryColor);
}

function disposeScene(scene, renderer, timer, environmentTarget) {
  scene.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material?.map?.dispose();
      material?.dispose();
    });
  });
  environmentTarget?.dispose();
  timer.disconnect();
  timer.dispose();
  renderer.dispose();
}

export default function ProductStudio3D({
  surface = "comptoir",
  actionId = "avis",
  primaryColor = "#111216",
  accentColor = "#2864ff",
  textColor = "#f8f7f2",
  destinationUrl = "",
  sectorId = "",
  sectorTitle = "",
  brandName = "",
  brandLogo = "",
  customHeadline = "",
  customSubline = "",
  customTapLabel = "",
  personalization = "ready",
  hero = false,
  className = "",
}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const artworkRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [capturedArtwork, setCapturedArtwork] = useState(null);
  // La texture est régénérée dès qu'un élément imprimé change : sans le nom, le
  // logo et les textes, l'objet 3D restait au design Tapote générique alors que
  // le client venait de personnaliser son support.
  const artworkKey = [surface, actionId, primaryColor, accentColor, textColor, personalization, brandName, brandLogo, customHeadline, customSubline, customTapLabel].join(":");
  const [eligible, setEligible] = useState(() => (
    typeof window !== "undefined"
    && (typeof window.matchMedia !== "function" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    && supportsWebGl()
  ));

  useEffect(() => {
    if (!eligible) return undefined;
    let cancelled = false;
    let frameId = 0;

    const captureArtwork = async () => {
      const source = artworkRef.current?.querySelector(".tp-insert");
      if (!source) return;
      try {
        await document.fonts?.ready;
        frameId = window.requestAnimationFrame(async () => {
          try {
            const canvas = await toCanvas(source, {
              backgroundColor: primaryColor,
              cacheBust: true,
              pixelRatio: 1,
            });
            if (!cancelled) setCapturedArtwork({ key: artworkKey, canvas });
          } catch {
            // The static artwork stays available when browser capture is not
            // supported; WebGL starts only after the exact texture is ready.
          }
        });
      } catch {
        // Font loading can be unavailable in test DOMs.
      }
    };

    captureArtwork();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [accentColor, actionId, artworkKey, eligible, primaryColor, surface, textColor]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateEligibility = () => setEligible(!motionPreference.matches && supportsWebGl());
    motionPreference.addEventListener("change", updateEligibility);
    return () => motionPreference.removeEventListener("change", updateEligibility);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const artworkCanvas = capturedArtwork?.key === artworkKey ? capturedArtwork.canvas : null;
    if (!host || !canvas || !eligible || !artworkCanvas) return undefined;
    setReady(false);

    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const budget = mobile ? SCENE_BUDGETS.mobile : SCENE_BUDGETS.desktop;
    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: budget.antialias,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = hero ? 1.12 : 1.18;
    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = PCFShadowMap;

    const scene = new Scene();
    scene.background = new Color(hero ? "#07090f" : "#edf0f5");
    const pmrem = new PMREMGenerator(renderer);
    const environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environmentTarget.texture;
    pmrem.dispose();

    const camera = new PerspectiveCamera(hero ? 29 : 31, 1, 0.1, 50);
    camera.position.set(hero ? 0.62 : 0.25, hero ? 0.1 : 0.18, hero ? 8.8 : 8.2);

    scene.add(new AmbientLight("#eef3ff", hero ? 1.3 : 1.75));
    const keyLight = new DirectionalLight("#ffffff", hero ? 5.6 : 5);
    keyLight.position.set(4.8, 6.2, 5.8);
    keyLight.castShadow = !mobile;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 22;
    scene.add(keyLight);
    const rimLight = new DirectionalLight(accentColor, hero ? 2.2 : 0.85);
    rimLight.position.set(-5.5, 1.4, 3.8);
    scene.add(rimLight);
    const fillLight = new DirectionalLight("#c6d5ff", 2.2);
    fillLight.position.set(0, -2.8, 4.2);
    scene.add(fillLight);

    const texture = makePrintTexture(artworkCanvas);
    const product = buildProduct(surface, texture, primaryColor);
    // Keep the physical relationship credible beside a ~147 mm smartphone:
    // Comptoir is roughly phone-height, Plaque slightly shorter, Card compact.
    const baseScale = surface === "carte" ? 0.58 : surface === "plaque" ? 0.84 : 0.88;
    const heroScale = surface === "comptoir" ? 1.08 : surface === "plaque" ? 0.74 : 0.64;
    const sceneScale = hero ? (mobile ? heroScale * 0.9 : heroScale) : (mobile ? 0.92 : 1);
    const finalScale = sceneScale * baseScale;
    product.scale.setScalar(finalScale);
    // Sur mobile le téléphone occupe la moitié droite du cadre : l'objet se
    // décale vers la gauche pour rester entier et lisible à côté de lui.
    const objectX = hero ? (mobile ? 0.42 : 0.72) : (mobile ? -0.58 : -0.42);
    product.position.set(objectX, surface === "comptoir" ? 0.18 : 0.05, 0);
    product.rotation.set(
      surface === "carte" ? -0.12 : -0.025,
      surface === "plaque" ? -0.24 : surface === "carte" ? -0.38 : -0.3,
      surface === "carte" ? -0.08 : 0.015,
    );
    scene.add(product);

    const pedestalY = hero
      ? surface === "plaque" ? -0.98 : surface === "carte" ? -0.78 : -0.68
      : surface === "comptoir" ? -1.62 : -1.48;
    if (!hero) {
      const pedestal = new Mesh(
        new CylinderGeometry(2.42, 2.58, 0.22, 72),
        new MeshPhysicalMaterial({
          color: "#dfe4ed",
          roughness: 0.3,
          metalness: 0.18,
          clearcoat: 0.72,
        }),
      );
      pedestal.position.set(product.position.x, pedestalY, -0.15);
      pedestal.receiveShadow = !mobile;
      pedestal.castShadow = !mobile;
      scene.add(pedestal);
    }

    if (!hero) {
      const floor = new Mesh(
        new PlaneGeometry(18, 12),
        new MeshStandardMaterial({
          color: "#edf0f5",
          roughness: 0.62,
          metalness: 0.04,
        }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.74;
      floor.receiveShadow = !mobile;
      scene.add(floor);
    }

    if (hero) {
      const contactShadow = new Mesh(
        new PlaneGeometry(surface === "carte" ? 3.15 : 2.65, surface === "carte" ? 1.2 : 1.05),
        new MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.38, depthWrite: false }),
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.set(product.position.x, pedestalY + 0.04, -0.08);
      scene.add(contactShadow);
    }

    const timer = new Timer();
    timer.connect(document);
    let frameId = 0;
    let stopped = false;
    let rendered = false;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const pixelRatioByArea = Math.sqrt(budget.maxCanvasPixels / (width * height));
      const pixelRatio = Math.max(0.75, Math.min(window.devicePixelRatio || 1, budget.maxDpr, pixelRatioByArea));
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      host.dataset.pixelRatio = pixelRatio.toFixed(2);
    };

    const onPointerMove = (event) => {
      const bounds = host.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) - 0.5;
      pointerY = ((event.clientY - bounds.top) / Math.max(1, bounds.height)) - 0.5;
    };

    const render = (timestamp) => {
      if (stopped) return;
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      const baseRotationY = surface === "plaque" ? -0.24 : surface === "carte" ? -0.38 : -0.3;
      const baseRotationX = surface === "carte" ? -0.12 : -0.025;
      product.rotation.y += ((baseRotationY + (pointerX * 0.28)) - product.rotation.y) * 0.045;
      product.rotation.x += ((baseRotationX - (pointerY * 0.12)) - product.rotation.x) * 0.045;
      product.position.y += (((surface === "comptoir" ? 0.18 : 0.05) + (Math.sin(elapsed * 0.68) * 0.035)) - product.position.y) * 0.08;
      renderer.render(scene, camera);
      if (!rendered) {
        rendered = true;
        setReady(true);
      }
      frameId = window.requestAnimationFrame(render);
    };

    const onContextLost = (event) => {
      event.preventDefault();
      setReady(false);
      setEligible(false);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    if (!mobile) host.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("webglcontextlost", onContextLost);
    frameId = window.requestAnimationFrame(render);

    return () => {
      stopped = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      disposeScene(scene, renderer, timer, environmentTarget);
    };
  }, [accentColor, artworkKey, capturedArtwork, eligible, hero, primaryColor, surface]);

  return (
    <div
      ref={hostRef}
      className={`tapote-product-studio ${hero ? "is-hero" : "is-pdp"} ${ready ? "is-live" : "is-fallback"} ${className}`}
      data-scene-engine="product-studio"
      data-render-mode={ready ? "webgl" : "static"}
      aria-label={`Aperçu 3D natif de ${PRODUCT_LABELS[surface] || PRODUCT_LABELS.comptoir}`}
    >
      <div
        ref={artworkRef}
        className={`tapote-product-studio__artwork-source is-${surface}`}
        aria-hidden="true"
      >
        <InsertArtwork
          surface={surface}
          actionId={actionId}
          brandName={brandName}
          brandLogo={brandLogo}
          headline={customHeadline}
          subline={customSubline}
          tapLabel={customTapLabel}
          personalization={personalization}
          colors={{
            paper: primaryColor,
            ink: textColor,
            accent: accentColor,
            accentInk: "#ffffff",
          }}
        />
      </div>
      <canvas ref={canvasRef} className="tapote-product-studio__canvas" hidden={!eligible} aria-hidden="true" />
      {!ready && <div className="tapote-product-studio__fallback" aria-hidden="true" />}
      <DeviceFrame
        actionId={actionId}
        sectorId={sectorId}
        sectorTitle={sectorTitle}
        brandName={brandName}
        brandLogo={brandLogo}
        primaryColor={primaryColor}
        secondaryColor={accentColor}
        textColor={textColor}
        personalization={personalization}
        destinationUrl={destinationUrl}
        accentColor={accentColor}
        embedded={false}
        demonstration={hero}
        className="tapote-studio-device"
      />
      <div className="tapote-product-studio__nfc" aria-hidden="true">
        <i /><i /><i />
        <span>NFC détecté</span>
      </div>
    </div>
  );
}
