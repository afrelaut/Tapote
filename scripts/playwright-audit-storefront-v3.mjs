import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { PRODUCTS } from "../shared/catalog.js";
import { SECTORS } from "../src/storefront/sectorData.js";

const baseUrl = process.env.TAPOTE_AUDIT_URL || "http://127.0.0.1:5173";
const outputDir = path.resolve("output/playwright/v3-final");
await fs.mkdir(outputDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ channel: "chrome", headless: true });
}

const report = { baseUrl, pages: [], errors: [], assertions: [] };
const assert = (name, ok, value) => report.assertions.push({
  name,
  ok: Boolean(ok),
  ...(value === undefined ? {} : { value }),
});

async function mockStorefrontApis(context) {
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
  await context.route("**/api/uploads/logo", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ uploadId: "00000000-0000-4000-8000-000000000001" }),
    });
  });
}

async function hydrateLazyAssets(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => { image.loading = "eager"; });
    const step = Math.max(500, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 25));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete),
    undefined,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(150);
}

async function settlePage(page) {
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(200);
}

async function auditDocumentSemantics(page, name) {
  const semantics = await page.evaluate(() => {
    const mains = [...document.querySelectorAll("main")];
    const headings = [...document.querySelectorAll("h1")];
    const isRendered = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    };
    const unlabeledControls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')]
      .filter((control) => !control.disabled && isRendered(control))
      .filter((control) => !control.labels?.length && !control.getAttribute("aria-label") && !control.getAttribute("aria-labelledby"))
      .map((control) => ({
        tag: control.tagName.toLowerCase(),
        type: control.getAttribute("type"),
        name: control.getAttribute("name"),
        id: control.id,
        placeholder: control.getAttribute("placeholder"),
      }));
    return {
      mains: mains.length,
      h1s: headings.length,
      h1Texts: headings.map((heading) => heading.textContent?.trim().replace(/\s+/g, " ")),
      h1InsideMain: headings.length === 1 && mains.length === 1 && mains[0].contains(headings[0]),
      unlabeledControls,
    };
  });
  assert(`un-main-et-un-h1-${name}`, semantics.mains === 1 && semantics.h1s === 1 && semantics.h1InsideMain, semantics);
  assert(`champs-tous-etiquetes-${name}`, semantics.unlabeledControls.length === 0, semantics.unlabeledControls);
}

async function auditQuantityAlignment(page, name) {
  const metrics = await page.locator(".v3-quantity-choice button").evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect();
    const number = button.querySelector("strong")?.getBoundingClientRect();
    const label = button.querySelector("span")?.getBoundingClientRect();
    const price = button.querySelector("b")?.getBoundingClientRect();
    if (!number || !label || !price) return null;
    return {
      height: box.height,
      numberX: number.x - box.x,
      numberY: number.y - box.y,
      labelX: label.x - box.x,
      labelY: label.y - box.y,
      priceX: price.x - box.x,
      priceY: price.y - box.y,
    };
  }));
  const spread = (key) => Math.max(...metrics.map((item) => item?.[key] ?? Infinity))
    - Math.min(...metrics.map((item) => item?.[key] ?? -Infinity));
  const aligned = metrics.length === 3
    && metrics.every(Boolean)
    && ["height", "numberX", "numberY", "labelX", "labelY", "priceX", "priceY"].every((key) => spread(key) < 0.5)
    && metrics.every((item) => Math.abs(item.labelX - item.priceX) < 0.5);
  assert(`quantites-alignees-${name}`, aligned, metrics);
}

async function auditPage(context, pathname, name, action) {
  const page = await context.newPage();
  const pageErrors = [];
  page.on("console", (message) => { if (message.type() === "error") pageErrors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
  await page.locator("body").waitFor({ state: "visible" });
  await settlePage(page);
  const initialTitle = await page.title();
  await hydrateLazyAssets(page);
  await auditDocumentSemantics(page, name);
  if (action) await action(page, response);
  await hydrateLazyAssets(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const brokenImages = await page.locator("img").evaluateAll(
    (images) => images.filter((image) => !image.complete || image.naturalWidth === 0).length,
  );
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const blockingA11y = accessibility.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
  const relevantPageErrors = pageErrors.filter((error) => !(response?.status() === 404 && /status of 404/i.test(error)));
  report.pages.push({
    name,
    pathname,
    status: response?.status(),
    title: initialTitle,
    overflow,
    brokenImages,
    accessibility: {
      violations: accessibility.violations.length,
      blocking: blockingA11y.map(({ id, impact, nodes }) => ({
        id,
        impact,
        nodes: nodes.length,
        examples: nodes.slice(0, 6).map((node) => node.target),
      })),
    },
    pageErrors: relevantPageErrors,
  });
  if (overflow > 1) report.errors.push(`${name}: débordement horizontal de ${overflow}px`);
  if (brokenImages) report.errors.push(`${name}: ${brokenImages} image(s) non chargée(s)`);
  if (blockingA11y.length) report.errors.push(`${name}: ${blockingA11y.length} violation(s) d’accessibilité sérieuse(s) ou critique(s)`);
  if (relevantPageErrors.length) report.errors.push(...relevantPageErrors.map((error) => `${name}: ${error}`));
  return page;
}

async function auditScene(page, name) {
  const metrics = await page.locator(".v3-sector-hero .v3-sector-scene").evaluate((scene) => ({
    backgrounds: scene.querySelectorAll(".v3-sector-scene-background").length,
    supports: scene.querySelectorAll(".v3-sector-scene-support").length,
    screens: scene.querySelectorAll(".v3-sector-scene-screen").length,
    phones: scene.querySelectorAll(".v3-live-phone-svg").length,
    brokenImages: [...scene.querySelectorAll("img")].filter((image) => !image.complete || image.naturalWidth === 0).length,
  }));
  assert(
    `scene-principale-complete-${name}`,
    metrics.backgrounds === 1 && metrics.supports === 1 && metrics.screens === 1 && metrics.phones === 1 && metrics.brokenImages === 0,
    metrics,
  );
}

async function auditPublicRouteSweep(context, pathnames) {
  const page = await context.newPage();
  const results = [];
  for (const pathname of pathnames) {
    const pageErrors = [];
    const onConsole = (message) => { if (message.type() === "error") pageErrors.push(`console: ${message.text()}`); };
    const onPageError = (error) => pageErrors.push(`pageerror: ${error.message}`);
    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    await page.locator("main h1").waitFor({ state: "visible", timeout: 10_000 });
    await hydrateLazyAssets(page);
    const metrics = await page.evaluate(() => {
      const rendered = (element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
      };
      const main = document.querySelectorAll("main");
      const h1 = document.querySelectorAll("h1");
      return {
        mains: main.length,
        h1s: h1.length,
        h1InsideMain: main.length === 1 && h1.length === 1 && main[0].contains(h1[0]),
        title: document.title,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        brokenVisibleImages: [...document.images].filter(
          (image) => rendered(image) && (!image.complete || image.naturalWidth === 0),
        ).length,
      };
    });
    results.push({ pathname, status: response?.status(), pageErrors, ...metrics });
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
  await page.close();
  assert(
    "toutes-routes-publiques-valides",
    results.every((result) => result.status === 200
      && result.pageErrors.length === 0
      && result.mains === 1
      && result.h1s === 1
      && result.h1InsideMain
      && result.title
      && result.overflow <= 1
      && result.brokenVisibleImages === 0),
    results,
  );
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await mockStorefrontApis(desktop);
const reset = await desktop.newPage();
await reset.goto(baseUrl, { waitUntil: "domcontentloaded" });
await reset.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await reset.close();

const home = await auditPage(desktop, "/", "Page unique desktop", async (page) => {
  assert("achat-direct-page-unique", await page.getByRole("button", { name: /Ajouter au panier/i }).isVisible());
  assert("trois-supports-page-unique", await page.getByRole("button", { name: /^(Chevalet|Plaque|Carte)$/ }).count() === 3);
  assert("quinze-activites-page-unique", await page.locator(".v3-sector-chips button").count() === SECTORS.length);
  await auditScene(page, "desktop");
  await auditQuantityAlignment(page, "desktop");

  await page.getByLabel("Le lien à ouvrir").selectOption("wifi");
  await page.waitForURL(/lien=wifi/);
  assert("telephone-synchronise-au-lien", await page.locator('[data-preview-mode="live"] [data-phone-action="wifi"]').count() === 1);
  await page.screenshot({ path: path.join(outputDir, "01-page-unique-desktop.png"), fullPage: true });
});
await home.close();

await auditPublicRouteSweep(desktop, [
  "/",
  "/boutique",
  "/designs",
  "/secteurs",
  "/personnaliser",
  "/categorie/chevalets-nfc",
  "/categorie/plaques-nfc",
  "/categorie/cartes-nfc",
  "/categorie/packs-nfc",
  "/produits/chevalet?mode=ready",
  "/produits/plaque?mode=custom&count=2&composition=plaques",
  "/produits/carte?mode=custom",
  ...SECTORS.map((sector) => `/secteurs/${sector.slug}`),
  "/comment-ca-marche",
  "/devis",
  "/mentions-legales",
  "/cgv",
  "/confidentialite",
]);

const notFound = await auditPage(desktop, "/produits/inconnu", "Page introuvable", async (page) => {
  assert("fiche-inconnue-retourne-une-404-metier", await page.getByRole("heading", { name: /Cette page n’existe pas/i }).isVisible());
});
await notFound.close();

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await mockStorefrontApis(mobile);
const mobileHome = await auditPage(
  mobile,
  "/boutique?support=plaque&mode=custom&count=2&composition=plaques&lien=instagram",
  "Page unique mobile",
  async (page) => {
    await auditScene(page, "mobile");
    assert("pack-mobile-restaure", await page.getByRole("button", { name: "2 plaques", exact: true }).getAttribute("aria-pressed") === "true");
    assert("selecteur-activites-mobile", await page.locator(".v3-sector-chips button").count() === SECTORS.length);
    await page.screenshot({ path: path.join(outputDir, "02-page-unique-mobile.png"), fullPage: true });
  },
);
await mobileHome.close();

await desktop.close();
await mobile.close();
await browser.close();

report.ok = report.errors.length === 0 && report.assertions.every((entry) => entry.ok);
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
