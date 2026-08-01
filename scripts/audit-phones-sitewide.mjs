import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { ACTIONS, PRODUCTS } from "../shared/catalog.js";
import { SECTORS } from "../src/storefront/sectorData.js";

const baseUrl =
  process.env.TAPOTE_PHONE_AUDIT_URL ||
  process.env.TAPOTE_AUDIT_URL ||
  "http://127.0.0.1:5173";
const outputDir = path.resolve("output/playwright/phones-sitewide");
const actionIds = Object.keys(ACTIONS);
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

const occurrenceRoutes = [
  // Une occurrence vivante sur les pages éditoriales et PDP. La boutique
  // montre volontairement les trois produits côte à côte.
  // La scène du hero dispose de son propre audit de séquence. Ce script
  // compte seulement les scènes PDP/secteur basées sur PdpScene.
  ["accueil", "/", 0],
  ["boutique", "/boutique", 3],
  ["secteurs", "/secteurs", 0],
  ["designs", "/designs", 3],
  ["categorie-comptoir", "/categorie/comptoirs-nfc", 3],
  ["categorie-plaque", "/categorie/plaques-nfc", 3],
  ["categorie-carte", "/categorie/cartes-nfc", 3],
  ["produit-comptoir", "/produits/comptoir?mode=custom&action=avis", 2],
  ["produit-plaque", "/produits/plaque?mode=custom&action=avis", 2],
  ["produit-carte", "/produits/carte?mode=custom&action=avis", 2],
  ["personnaliser", "/personnaliser", 3],
  ["fonctionnement", "/comment-ca-marche", 1],
  ...SECTORS.map((sector) => [`secteur-${sector.id}`, `/secteurs/${sector.slug}`, 1]),
];

// Les anciens photomontages statiques ne sont plus une autorité visuelle.
// La qualité est contrôlée sur les composants natifs réellement rendus.
const staticPhoneAssets = [];

const report = {
  baseUrl,
  actionCount: actionIds.length,
  expectedOccurrencesPerViewport: occurrenceRoutes.reduce((sum, [, , expected]) => sum + expected, 0),
  viewports: [],
  occurrenceChecks: [],
  actionMatrices: [],
  staticAssets: [],
  failures: [],
};

const safeName = (value) => value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
const fail = (scope, detail) => report.failures.push({ scope, detail });

await mkdir(outputDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ channel: "chrome", headless: true });
}

async function prepareContext(viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  await context.route("**/api/catalog", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      products: Object.values(PRODUCTS).map((product) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        online: true,
        availableStock: null,
      })),
    }),
  }));
  return context;
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.locator("body").waitFor({ state: "visible" });
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => { image.loading = "eager"; });
    const step = Math.max(420, Math.floor(innerHeight * 0.78));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 22));
    }
    scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, { timeout: 15_000 });
  await page.waitForTimeout(80);
}

async function openPage(context, pathname) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
  await settle(page);
  return { page, errors, status: response?.status() };
}

function measureScene(element) {
  const scene = element.getBoundingClientRect();
  const sceneStyle = getComputedStyle(element);
  const number = (value) => Number.parseFloat(value) || 0;
  const sceneInner = {
    x: scene.left + number(sceneStyle.borderLeftWidth) + number(sceneStyle.paddingLeft),
    y: scene.top + number(sceneStyle.borderTopWidth) + number(sceneStyle.paddingTop),
    width: scene.width
      - number(sceneStyle.borderLeftWidth)
      - number(sceneStyle.borderRightWidth)
      - number(sceneStyle.paddingLeft)
      - number(sceneStyle.paddingRight),
    height: scene.height
      - number(sceneStyle.borderTopWidth)
      - number(sceneStyle.borderBottomWidth)
      - number(sceneStyle.paddingTop)
      - number(sceneStyle.paddingBottom),
  };
  const stageElement = element.querySelector(".v3-sector-scene-stage");
  const backgroundElement = element.querySelector(".v3-sector-scene-background");
  const screens = [...element.querySelectorAll(".v3-live-phone-screen")];
  const svgs = [...element.querySelectorAll(".v3-live-phone-svg")];
  const htmlCanvases = [...element.querySelectorAll(".v3-live-phone-canvas")];
  const foreignObjects = [...element.querySelectorAll("foreignObject")];
  const paths = [...element.querySelectorAll("clipPath path")];
  const uiElement = element.querySelector(".v3-live-phone-ui");
  const stage = stageElement?.getBoundingClientRect();
  const background = backgroundElement?.getBoundingClientRect();
  const screen = screens[0]?.getBoundingClientRect();
  const svg = svgs[0]?.getBoundingClientRect();
  const ui = uiElement?.getBoundingClientRect();
  const screenStyle = screens[0] ? getComputedStyle(screens[0]) : null;
  const canvasStyle = htmlCanvases[0] ? getComputedStyle(htmlCanvases[0]) : null;
  const uiStyle = uiElement ? getComputedStyle(uiElement) : null;
  const transformValues = uiStyle?.transform?.startsWith("matrix3d(")
    ? uiStyle.transform.slice(9, -1).split(",").map(Number)
    : [];
  let clipBounds = null;
  try {
    const bounds = paths[0]?.getBBox();
    if (bounds) clipBounds = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  } catch {
    clipBounds = null;
  }
  const close = (a, b, tolerance = 1.25) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
  const stageAlignedWithScene = Boolean(stage
    && close(stage.width, sceneInner.width)
    && stage.height >= sceneInner.height - 1.25
    && close(stage.left, sceneInner.x)
    && close(stage.top + (stage.height / 2), sceneInner.y + (sceneInner.height / 2)));
  const backgroundFillsStage = Boolean(stage && background && close(background.width, stage.width) && close(background.height, stage.height));
  const screenFillsStage = Boolean(stage && screen && close(screen.width, stage.width) && close(screen.height, stage.height));
  const svgFillsStage = Boolean(stage && svg && close(svg.width, stage.width) && close(svg.height, stage.height));
  const clipInsideCanvas = Boolean(clipBounds
    && clipBounds.x >= -2
    && clipBounds.y >= -2
    && clipBounds.x + clipBounds.width <= 1256
    && clipBounds.y + clipBounds.height <= 1256
    && clipBounds.width > 150
    && clipBounds.height > 300);
  const htmlCanvasClipsPhone = Boolean(canvasStyle?.clipPath?.startsWith("polygon("));
  const uiInsideStage = Boolean(stage && ui
    && ui.left >= stage.left - 2
    && ui.top >= stage.top - 2
    && ui.right <= stage.right + 2
    && ui.bottom <= stage.bottom + 2);
  const uiHasPhysicalPresence = Boolean(stage && ui
    && ui.width >= stage.width * .22
    && ui.height >= stage.height * .34);
  const ok = scene.width > 80
    && scene.height > 80
    && stageAlignedWithScene
    && backgroundFillsStage
    && screenFillsStage
    && svgFillsStage
    && backgroundElement?.complete
    && backgroundElement?.naturalWidth > 0
    && screens.length === 1
    && svgs.length === 1
    && htmlCanvases.length === 1
    && foreignObjects.length === 0
    && paths.length === 0
    && svgs[0]?.getAttribute("viewBox") === "0 0 390 844"
    && screenStyle?.display !== "none"
    && screenStyle?.visibility !== "hidden"
    && uiStyle?.width === "390px"
    && uiStyle?.height === "844px"
    && uiStyle?.display !== "none"
    && uiStyle?.visibility !== "hidden"
    && Number.parseFloat(uiStyle?.opacity || "0") > 0
    && ui?.width > 20
    && ui?.height > 20
    && (uiElement?.innerText || "").trim().length > 10
    && transformValues.length === 16
    && transformValues.every(Number.isFinite)
    && uiInsideStage
    && uiHasPhysicalPresence;
  return {
    ok,
    action: screens[0]?.dataset.phoneAction || "",
    sector: screens[0]?.dataset.phoneSector || "",
    scene: { width: scene.width, height: scene.height, inner: sceneInner },
    counts: { screens: screens.length, svgs: svgs.length, htmlCanvases: htmlCanvases.length, foreignObjects: foreignObjects.length, clipPaths: paths.length },
    stageAlignedWithScene,
    backgroundFillsStage,
    screenFillsStage,
    svgFillsStage,
    htmlCanvasClipsPhone,
    uiInsideStage,
    uiHasPhysicalPresence,
    backgroundLoaded: Boolean(backgroundElement?.complete && backgroundElement?.naturalWidth > 0),
    ui: {
      width: uiStyle?.width,
      height: uiStyle?.height,
      transform: uiStyle?.transform,
      display: uiStyle?.display,
      visibility: uiStyle?.visibility,
      opacity: uiStyle?.opacity,
      bounds: ui ? { x: ui.x, y: ui.y, width: ui.width, height: ui.height } : null,
      contentLength: (uiElement?.innerText || "").trim().length,
    },
    clipBounds,
    clipInsideCanvas,
    path: paths[0]?.getAttribute("d") || "",
  };
}

async function sceneMetrics(locator) {
  return locator.evaluate(measureScene);
}

async function auditEveryOccurrence(context, viewport) {
  const viewportDir = path.join(outputDir, "occurrences", viewport.name);
  await mkdir(viewportDir, { recursive: true });
  let total = 0;
  const occurrenceFrames = [];
  for (const [name, pathname, expected] of occurrenceRoutes) {
    const { page, errors, status } = await openPage(context, pathname);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const scenes = page.locator(".v3-sector-scene");
    const count = await scenes.count();
    const routeCheck = { viewport: viewport.name, name, pathname, expected, count, status, overflow, errors, scenes: [] };
    if (status !== 200) fail(`${viewport.name}:${name}`, `HTTP ${status}`);
    if (count !== expected) fail(`${viewport.name}:${name}`, `${count} téléphone(s), ${expected} attendu(s)`);
    if (overflow > 1) fail(`${viewport.name}:${name}`, `débordement horizontal ${overflow}px`);
    if (errors.length) fail(`${viewport.name}:${name}`, errors);
    for (let index = 0; index < count; index += 1) {
      const scene = scenes.nth(index);
      await scene.scrollIntoViewIfNeeded();
      const contextButton = scene.locator(".v3-scene-view-switch button").filter({ hasText: "En situation" });
      if (await contextButton.count()) {
        await contextButton.click();
        await page.waitForTimeout(60);
      }
      const metrics = await sceneMetrics(scene);
      routeCheck.scenes.push(metrics);
      if (!metrics.ok) fail(`${viewport.name}:${name}:scene-${index + 1}`, metrics);
      const image = await scene.screenshot({ path: path.join(viewportDir, `${safeName(name)}-${String(index + 1).padStart(2, "0")}.png`), animations: "disabled" });
      occurrenceFrames.push({ label: `${name} · ${index + 1}`, image });
    }
    total += count;
    report.occurrenceChecks.push(routeCheck);
    await page.close();
    console.log(`[occurrences] ${viewport.name} · ${name}: ${count}/${expected}`);
  }
  if (total !== report.expectedOccurrencesPerViewport) fail(`${viewport.name}:total`, `${total}/${report.expectedOccurrencesPerViewport}`);
  await renderContactSheet(context, viewport, "toutes-les-occurrences", occurrenceFrames);
  report.viewports.push({ name: viewport.name, width: viewport.width, height: viewport.height, occurrences: total });
}

async function renderContactSheet(context, viewport, name, frames) {
  const sheetDir = path.join(outputDir, "matrices", viewport.name);
  await mkdir(sheetDir, { recursive: true });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1420, height: 900 });
  const figures = frames.map(({ label, image }) => `<figure><img src="data:image/png;base64,${image.toString("base64")}" alt=""><figcaption>${label}</figcaption></figure>`).join("");
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#111;color:#fff;font-family:Arial,sans-serif}h1{margin:0 0 16px;font-size:20px}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}figure{margin:0;padding:7px;background:#202126;border:1px solid #383a42;border-radius:9px}img{width:100%;aspect-ratio:1;display:block;object-fit:contain;background:#0b0b0d;border-radius:5px}figcaption{padding:7px 2px 1px;font-size:11px;font-weight:700}</style><h1>${viewport.name} · ${name} · ${frames.length} états</h1><div class="grid">${figures}</div>`);
  await page.screenshot({ path: path.join(sheetDir, `${safeName(name)}.png`), fullPage: true });
  await page.close();
}

async function runSelectMatrix(context, viewport, { name, pathname, selectSelector, sceneSelector, setup }) {
  const { page, errors, status } = await openPage(context, pathname);
  if (setup) await setup(page);
  const contextButton = page.locator(`${sceneSelector} .v3-scene-view-switch button`).filter({ hasText: "En situation" });
  if (await contextButton.count()) {
    await contextButton.click();
    await page.waitForTimeout(60);
  }
  const select = page.locator(selectSelector);
  const options = await select.locator("option").evaluateAll((items) => items.map((option) => option.value));
  const missing = actionIds.filter((actionId) => !options.includes(actionId));
  const unexpected = options.filter((actionId) => !actionIds.includes(actionId));
  const frames = [];
  const states = [];
  if (status !== 200 || errors.length || missing.length || unexpected.length || options.length !== actionIds.length) {
    fail(`${viewport.name}:${name}:options`, { status, errors, count: options.length, missing, unexpected });
  }
  for (const actionId of options) {
    await select.selectOption(actionId);
    const scene = page.locator(sceneSelector);
    await scene.locator(`.v3-live-phone-screen[data-phone-action="${actionId}"]`).waitFor();
    await page.waitForTimeout(35);
    const metrics = await sceneMetrics(scene);
    const loadedImages = await scene.locator("img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0));
    const state = { actionId, ok: metrics.ok && loadedImages, loadedImages, metrics };
    states.push(state);
    if (!state.ok) fail(`${viewport.name}:${name}:${actionId}`, state);
    frames.push({ label: `${actionId} · ${ACTIONS[actionId]?.name || actionId}`, image: await scene.screenshot({ animations: "disabled" }) });
  }
  const distinctPaths = [...new Set(states.map((state) => state.metrics.path).filter(Boolean))].length;
  report.actionMatrices.push({ viewport: viewport.name, name, pathname, options, distinctPaths, states: states.map(({ actionId, ok, loadedImages, metrics }) => ({ actionId, ok, loadedImages, action: metrics.action, sector: metrics.sector, uiInsideStage: metrics.uiInsideStage, uiHasPhysicalPresence: metrics.uiHasPhysicalPresence })) });
  await renderContactSheet(context, viewport, name, frames);
  await page.close();
  console.log(`[actions] ${viewport.name} · ${name}: ${states.filter((state) => state.ok).length}/${states.length}`);
}

async function auditActionMatrices(context, viewport) {
  for (const product of ["comptoir", "plaque", "carte"]) {
    await runSelectMatrix(context, viewport, {
      name: `produit-${product}`,
      pathname: `/produits/${product}?mode=custom&action=avis`,
      // Les anciennes fiches produit rendent désormais la même page unifiée.
      // L'audit doit donc suivre le configurateur et la scène réellement
      // présents, au lieu de tolérer silencieusement une matrice vide.
      selectSelector: '.v3-buybox select[aria-label="Le lien à ouvrir"]',
      sceneSelector: ".v3-product-gallery .v3-sector-scene",
    });
  }
}

async function auditStaticAssets() {
  const context = await browser.newContext({ viewport: { width: 1254, height: 1254 }, deviceScaleFactor: 1 });
  const assetDir = path.join(outputDir, "static-assets");
  await mkdir(assetDir, { recursive: true });
  for (const asset of staticPhoneAssets) {
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}${asset}`, { waitUntil: "load" });
    const image = page.locator("img");
    const metrics = await image.evaluate((element) => ({ complete: element.complete, width: element.naturalWidth, height: element.naturalHeight }));
    const ok = response?.status() === 200 && metrics.complete && metrics.width >= 1000 && metrics.height >= 800;
    report.staticAssets.push({ asset, status: response?.status(), ok, ...metrics });
    if (!ok) fail(`asset:${asset}`, { status: response?.status(), ...metrics });
    await image.screenshot({ path: path.join(assetDir, `${safeName(path.basename(asset, path.extname(asset)))}.png`) });
    await page.close();
    console.log(`[statique] ${asset}: ${ok ? "OK" : "ECHEC"}`);
  }
  await context.close();
}

await auditStaticAssets();
for (const viewport of viewports) {
  const context = await prepareContext(viewport);
  await auditEveryOccurrence(context, viewport);
  await auditActionMatrices(context, viewport);
  await context.close();
}

await browser.close();

report.totalOccurrences = report.viewports.reduce((sum, viewport) => sum + viewport.occurrences, 0);
report.totalActionStates = report.actionMatrices.reduce((sum, matrix) => sum + (Array.isArray(matrix.states) ? matrix.states.length : Number(matrix.states || 0)), 0);
report.ok = report.failures.length === 0;
await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`[résultat] occurrences=${report.totalOccurrences} états=${report.totalActionStates} échecs=${report.failures.length}`);
if (!report.ok) process.exitCode = 1;
