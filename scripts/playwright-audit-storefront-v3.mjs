import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { PRODUCTS } from "../shared/catalog.js";

const baseUrl = process.env.TAPOTE_AUDIT_URL || "http://127.0.0.1:5173";
const outputDir = path.resolve("output/playwright/v3-final");
await fs.mkdir(outputDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ channel: "chrome", headless: true });
}

const report = { baseUrl, pages: [], assertions: [], errors: [] };
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

async function settlePage(page) {
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.evaluate(async () => {
    await document.fonts?.ready;
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => { image.loading = "eager"; });
  });
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete),
    undefined,
    { timeout: 15_000 },
  ).catch(() => {});
  await page.waitForTimeout(900);
}

async function documentMetrics(page) {
  return page.evaluate(() => {
    const isRendered = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity) > 0
        && box.width > 0
        && box.height > 0;
    };
    const mains = [...document.querySelectorAll("main")];
    const headings = [...document.querySelectorAll("h1")];
    const unlabeledControls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')]
      .filter((control) => !control.disabled && isRendered(control))
      .filter((control) => !control.labels?.length && !control.getAttribute("aria-label") && !control.getAttribute("aria-labelledby"))
      .map((control) => ({ tag: control.tagName, type: control.type, id: control.id, name: control.name }));
    return {
      mains: mains.length,
      h1s: headings.length,
      h1InsideMain: mains.length === 1 && headings.length === 1 && mains[0].contains(headings[0]),
      h1Visible: headings.length === 1 && isRendered(headings[0]),
      h1Text: headings[0]?.textContent?.trim().replace(/\s+/g, " "),
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      brokenVisibleImages: [...document.images].filter(
        (image) => isRendered(image) && (!image.complete || image.naturalWidth === 0),
      ).length,
      unlabeledControls,
    };
  });
}

async function auditPage(context, pathname, name, action, options = {}) {
  const page = await context.newPage();
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/favicon/i.test(message.text())) pageErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));

  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
  await page.locator("body").waitFor({ state: "visible" });
  await settlePage(page);
  const metrics = await documentMetrics(page);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const blockingA11y = accessibility.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));

  assert(`document-valide-${name}`, (
    response?.status() === (options.expectedStatus || 200)
    && metrics.mains === 1
    && metrics.h1s === 1
    && metrics.h1InsideMain
    && metrics.h1Visible
    && metrics.overflow <= 1
    && metrics.brokenVisibleImages === 0
    && metrics.unlabeledControls.length === 0
  ), metrics);
  assert(`accessibilite-bloquante-${name}`, blockingA11y.length === 0, blockingA11y.map(({ id, impact, nodes, help }) => ({
    id,
    impact,
    help,
    nodes: nodes.length,
    examples: nodes.slice(0, 4).map((node) => ({ target: node.target, html: node.html })),
  })));

  if (action) await action(page);

  report.pages.push({
    name,
    pathname,
    status: response?.status(),
    title: await page.title(),
    ...metrics,
    accessibility: {
      total: accessibility.violations.length,
      blocking: blockingA11y.length,
    },
    pageErrors,
  });
  if (pageErrors.length) report.errors.push(...pageErrors.map((error) => `${name}: ${error}`));
  return page;
}

async function auditPublicRoutes(context) {
  const pathnames = [
    "/",
    "/boutique",
    "/designs",
    "/personnaliser",
    "/categorie/chevalets-nfc",
    "/categorie/plaques-nfc",
    "/categorie/cartes-nfc",
    "/categorie/packs-nfc",
    "/produits/comptoir?mode=ready",
    "/produits/plaque?mode=custom",
    "/produits/carte?mode=custom",
    "/comment-ca-marche",
    "/tapote-pilot",
    "/devis",
    "/mentions-legales",
    "/cgv",
    "/confidentialite",
  ];
  const page = await context.newPage();
  const results = [];
  for (const pathname of pathnames) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    await page.locator("main").waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("main h1").waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
    await settlePage(page);
    const metrics = await documentMetrics(page);
    results.push({
      pathname,
      status: response?.status(),
      title: await page.title(),
      ...metrics,
    });
  }
  await page.close();
  assert(
    "routes-publiques-valides",
    results.every((result) => result.status === 200
      && result.title
      && result.mains === 1
      && result.h1s === 1
      && result.h1InsideMain
      && result.h1Visible
      && result.overflow <= 1),
    results,
  );
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await mockStorefrontApis(desktop);
const reset = await desktop.newPage();
await reset.goto(baseUrl, { waitUntil: "domcontentloaded" });
await reset.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await reset.close();

const home = await auditPage(desktop, "/", "landing-desktop", async (page) => {
  assert("promesse-landing", await page.getByRole("heading", { level: 1, name: /Le bon geste.*Au bon moment/i }).isVisible());
  assert("cta-boutique-landing", await page.locator('.v3-founder-actions a[href="/boutique"]').isVisible());
  assert("aucun-cta-demonstration-redondant", await page.locator('.v3-founder-actions a[href="/comment-ca-marche"]').count() === 0);
  assert("scene-dynamique-ou-fallback", await page.locator(".v3-hero-3d, .v3-founder-static-fallback").count() === 1);
  assert("landing-trois-formats-et-prix", (
    await page.locator(".v3-immersive-pack__legend button").count() === 3
    && /49\s*€.*59\s*€/s.test(await page.locator(".v3-immersive-pack").innerText())
  ));
  assert("aucune-preuve-inventee", !/20[ .]?000 entreprises|30[ .]?000 clients|fabriqué en france/i.test(await page.locator("main").innerText()));
  await page.screenshot({ path: path.join(outputDir, "01-landing-desktop.png"), fullPage: false });
});
await home.close();

const shop = await auditPage(desktop, "/boutique", "boutique-desktop", async (page) => {
  const formats = page.locator(".v3-shop-family").first();
  assert("boutique-trois-formats", (
    await formats.locator(".v3-shop-card").count() === 3
    && await formats.getByRole("heading", { name: /^Chevalet$/i }).count() === 1
    && await formats.getByRole("heading", { name: /^Plaque$/i }).count() === 1
    && await formats.getByRole("heading", { name: /^Carte$/i }).count() === 1
  ));
  const packs = page.locator(".v3-shop-family.is-packs");
  assert("boutique-packs", (
    await packs.count() === 1
    && await packs.locator(".v3-shop-card.is-pack").count() === 3
    && await packs.getByRole("heading", { name: /^Pack Essentiel$/i }).count() === 1
    && await packs.getByRole("heading", { name: /^Pack Comptoir$/i }).count() === 1
    && await packs.getByRole("heading", { name: /^Pack Équipe$/i }).count() === 1
  ));
  await page.screenshot({ path: path.join(outputDir, "02-boutique-desktop.png"), fullPage: false });
});
await shop.close();

const product = await auditPage(desktop, "/produits/comptoir?mode=custom", "produit-personnalise-desktop", async (page) => {
  await page.getByRole("textbox", { name: /Lien obligatoire à ouvrir/i }).fill("https://example.com/tapote-audit");
  const addButtons = page.getByRole("button", { name: /Ajouter au panier/i });
  assert("un-seul-cta-ajouter-au-panier", await addButtons.count() === 1);
  assert("personnalisation-et-bat-expliques", /Tapote Studio/i.test(await page.locator("main").innerText()) && /BAT/i.test(await page.locator("main").innerText()));
  await addButtons.click();
  assert("ajout-panier-fonctionnel", await page.getByRole("link", { name: /Voir le panier, 1 article/i }).count() === 1);
  await page.screenshot({ path: path.join(outputDir, "03-produit-personnalise-desktop.png"), fullPage: false });
});
await product.close();

const studio = await auditPage(desktop, "/personnaliser?support=comptoir&mode=custom&lien=avis&count=1", "studio-desktop", async (page) => {
  assert("studio-apercus-presents", await page.locator(".v3-shop-grid .v3-product-art").count() >= 3);
  assert("studio-reste-facultatif", /BAT|aperçu|personnal/i.test(await page.locator("main").innerText()));
  await page.screenshot({ path: path.join(outputDir, "04-studio-desktop.png"), fullPage: false });
});
await studio.close();

await auditPublicRoutes(desktop);

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await mockStorefrontApis(mobile);

const homeMobile = await auditPage(mobile, "/", "landing-mobile", async (page) => {
  assert("hero-mobile-lisible", await page.getByRole("heading", { level: 1, name: /Le bon geste.*Au bon moment/i }).isVisible());
  assert("cta-mobile-visible", await page.locator('.v3-founder-actions a[href="/boutique"]').isVisible());
  assert("scene-mobile-presente", await page.locator(".v3-hero-3d, .v3-founder-static-fallback").count() === 1);
  await page.screenshot({ path: path.join(outputDir, "05-landing-mobile.png"), fullPage: false });
});
await homeMobile.close();

const productMobile = await auditPage(mobile, "/produits/plaque?mode=custom", "produit-mobile", async (page) => {
  await page.getByRole("textbox", { name: /Lien obligatoire à ouvrir/i }).fill("https://example.com/tapote-audit-mobile");
  assert("cta-produit-mobile-unique", await page.getByRole("button", { name: /Ajouter au panier/i }).count() === 1);
  assert("cta-produit-mobile-visible", await page.getByRole("button", { name: /Ajouter au panier/i }).isVisible());
  await page.screenshot({ path: path.join(outputDir, "06-produit-mobile.png"), fullPage: false });
});
await productMobile.close();

const pilotMobile = await auditPage(mobile, "/tapote-pilot", "pilot-marketing-mobile", async (page) => {
  const pilotText = await page.locator("main").innerText();
  assert("pilot-pro-tarifs-clairs", /9\s*€\s*\/\s*mois/i.test(pilotText) && /89\s*€[^\n]*par an/i.test(pilotText));
  assert("pilot-pro-offre-distincte", /option avancée|offre distincte/i.test(await page.locator("main").innerText()));
});
await pilotMobile.close();

await desktop.close();
await mobile.close();
await browser.close();

report.ok = report.errors.length === 0 && report.assertions.every((entry) => entry.ok);
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
