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
  assert("pilot-visible-page-unique", await page.getByRole("heading", { name: /Le support reste/i }).isVisible());
  assert("acces-pilot-vers-connexion", await page.locator('.v3-pilot-actions a[href="/connexion"]').count() === 1);
  assert("promesses-abonnement-corrigees", !/sans abonnement obligatoire|lien modifiable à vie/i.test(await page.locator("body").innerText()));
  assert("offres-redirigent-vers-configurations", await page.locator([
    'a[href="/boutique?activite=cafes-bars&support=comptoir&lien=avis&design=noir&count=1"]',
    'a[href="/personnaliser?activite=cafes-bars&support=comptoir&lien=avis&mode=custom&count=1"]',
    'a[href="/boutique?activite=cafes-bars&support=comptoir&lien=avis&design=blanc&count=2&composition=mix"]',
  ].join(",")).count() === 6);
  assert("faq-et-cta-final-retires", await page.locator(".v3-faq, .v3-final-buy").count() === 0);
  await auditScene(page, "desktop");
  await auditQuantityAlignment(page, "desktop");

  await page.getByLabel("Le lien à ouvrir").selectOption("wifi");
  await page.waitForURL(/lien=wifi/);
  assert("telephone-synchronise-au-lien", await page.locator('[data-preview-mode="live"] [data-phone-action="wifi"]').count() === 1);
  await page.screenshot({ path: path.join(outputDir, "01-page-unique-desktop.png"), fullPage: true });
  await page.locator("#pilot").screenshot({ path: path.join(outputDir, "03-pilot-desktop.png") });
  await page.getByRole("button", { name: "Carte", exact: true }).click();
  const cardQuantity = page.locator(".v3-card-quantity");
  const cardQuantityLayout = await cardQuantity.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const parent = element.parentElement.getBoundingClientRect();
    return {
      visible: box.width > 0 && box.height > 0,
      width: box.width,
      parentWidth: parent.width,
      overflow: element.scrollWidth - element.clientWidth,
    };
  });
  assert(
    "quantite-carte-coherente-desktop",
    cardQuantityLayout.visible
      && cardQuantityLayout.width <= cardQuantityLayout.parentWidth + 1
      && cardQuantityLayout.overflow <= 1,
    cardQuantityLayout,
  );
  await page.locator(".v3-core-choice-grid").screenshot({ path: path.join(outputDir, "05-card-quantity-desktop.png") });
});
await home.close();

const pilotMarketing = await auditPage(desktop, "/tapote-pilot", "Page marketing Tapote Pilot desktop", async (page) => {
  assert("pilot-marketing-hero-visible", await page.getByRole("heading", { level: 1, name: /Un seul poste.*Tous vos Tapote/i }).isVisible());
  assert("pilot-marketing-flux-visible", await page.getByRole("heading", { name: /Un changement de campagne/i }).isVisible());
  assert("pilot-marketing-valeur-visible", await page.getByRole("heading", { name: /Le contrôle utile/i }).isVisible());
  assert(
    "pilot-marketing-connexion-reelle",
    await page.locator('a[href="/connexion"]').count() >= 3
      && await page.locator('a[href="/pilot"]').count() === 0,
  );
  await page.screenshot({ path: path.join(outputDir, "06-pilot-marketing-desktop.png"), fullPage: true });
});
await pilotMarketing.close();

const accessPage = await desktop.newPage();
await accessPage.goto(`${baseUrl}/connexion`, { waitUntil: "domcontentloaded" });
await settlePage(accessPage);
assert("acces-pilot-route-reelle", await accessPage.locator('a.access-destination-pilot[href="/pilot"]').count() === 1);
await accessPage.goto(`${baseUrl}/pilot`, { waitUntil: "domcontentloaded" });
await settlePage(accessPage);
assert(
  "route-pilot-ne-revient-pas-au-configurateur",
  new URL(accessPage.url()).pathname.startsWith("/pilot")
    && await accessPage.locator(".v3-home-hero").count() === 0,
  accessPage.url(),
);
await accessPage.close();

const wide = await browser.newContext({ viewport: { width: 2048, height: 1112 }, deviceScaleFactor: 1 });
await mockStorefrontApis(wide);
const wideHome = await auditPage(
  wide,
  "/boutique?activite=boulangeries-patisseries&support=comptoir&lien=whatsapp&design=blanc&count=2&composition=chevalets",
  "Page unique grand écran",
  async (page) => {
    const layout = await page.evaluate(() => {
      const visual = document.querySelector(".v3-home-visual")?.getBoundingClientRect();
      const buybox = document.querySelector(".v3-home-hero .v3-buybox")?.getBoundingClientRect();
      const selector = document.querySelector(".v3-sector-selector")?.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        visualWidth: visual?.width ?? 0,
        buyboxWidth: buybox?.width ?? 0,
        selectorWidth: selector?.width ?? 0,
        rightGutter: buybox ? window.innerWidth - buybox.right : Infinity,
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      };
    });
    assert(
      "configurateur-plein-ecran-large",
      layout.buyboxWidth >= 940
        && Math.abs(layout.buyboxWidth - layout.selectorWidth) <= 1
        && layout.rightGutter >= 40
        && layout.rightGutter <= 80
        && layout.overflow <= 1,
      layout,
    );
    const pilotLayout = await page.locator("#pilot").evaluate((section) => {
      const box = section.getBoundingClientRect();
      const product = section.querySelector(".v3-pilot-product")?.getBoundingClientRect();
      const screen = section.querySelector(".v3-pilot-window")?.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        width: box.width,
        viewportWidth: window.innerWidth,
        productWidth: product?.width ?? 0,
        screenWidth: screen?.width ?? 0,
        screenHeight: screen?.height ?? 0,
        screenRatio: screen?.height ? screen.width / screen.height : 0,
      };
    });
    assert(
      "pilot-plein-ecran-large",
      Math.abs(pilotLayout.left) <= 1
        && Math.abs(pilotLayout.right - pilotLayout.viewportWidth) <= 1
        && Math.abs(pilotLayout.width - pilotLayout.viewportWidth) <= 1
        && pilotLayout.productWidth >= 720
        && pilotLayout.productWidth <= 900
        && pilotLayout.screenRatio >= 1.72
        && pilotLayout.screenRatio <= 1.82,
      pilotLayout,
    );
    const offerLayout = await page.locator(".v3-offer-cards").evaluate((grid) => {
      const cards = [...grid.children].map((card) => {
        const box = card.getBoundingClientRect();
        const visual = card.querySelector(".v3-offer-visual")?.getBoundingClientRect();
        return { width: box.width, height: box.height, visualHeight: visual?.height ?? 0 };
      });
      const box = grid.getBoundingClientRect();
      return { width: box.width, left: box.left, right: box.right, cards };
    });
    assert(
      "offres-proportionnees-grand-ecran",
      offerLayout.cards.length === 3
        && offerLayout.cards.every((card) => card.width >= 400 && card.width <= 460 && card.visualHeight >= 230 && card.visualHeight <= 260)
        && Math.max(...offerLayout.cards.map((card) => card.width)) - Math.min(...offerLayout.cards.map((card) => card.width)) <= 1,
      offerLayout,
    );
    await page.locator(".v3-offer-architecture").screenshot({ path: path.join(outputDir, "07-offres-grand-ecran.png") });
    await page.locator("#pilot").screenshot({ path: path.join(outputDir, "09-pilot-grand-ecran.png") });
    await page.screenshot({ path: path.join(outputDir, "00-page-unique-wide.png"), fullPage: false });
  },
);
await wideHome.close();

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
  "/tapote-pilot",
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
    const workspacePreview = await page.locator(".v3-sector-hero").evaluate((hero) => {
      const visual = hero.querySelector(".v3-home-visual");
      const composer = hero.querySelector(".v3-sector-buy");
      const switcher = hero.querySelector(".v3-mobile-workspace-switch");
      const visualStyle = getComputedStyle(visual);
      return {
        mode: hero.className,
        visualDisplay: visualStyle.display,
        visualPosition: visualStyle.position,
        composerDisplay: getComputedStyle(composer).display,
        switchDisplay: getComputedStyle(switcher).display,
        visualWidth: visual.getBoundingClientRect().width,
        viewportWidth: window.innerWidth,
      };
    });
    assert(
      "atelier-mobile-demarre-sur-apercu",
      workspacePreview.mode.includes("is-mobile-preview")
        && workspacePreview.visualDisplay !== "none"
        && workspacePreview.visualPosition !== "sticky"
        && workspacePreview.composerDisplay === "none"
        && workspacePreview.switchDisplay === "grid"
        && workspacePreview.visualWidth <= workspacePreview.viewportWidth - 24,
      workspacePreview,
    );
    await page.locator(".v3-home-hero").screenshot({ path: path.join(outputDir, "02a-page-unique-mobile-apercu.png") });
    await page.getByRole("tab", { name: /Configurer/i }).click();
    await page.locator(".v3-mobile-config-preview").waitFor({ state: "visible" });
    const workspaceConfig = await page.locator(".v3-sector-hero").evaluate((hero) => {
      const visual = hero.querySelector(".v3-home-visual");
      const composer = hero.querySelector(".v3-sector-buy");
      const miniPreview = hero.querySelector(".v3-mobile-config-preview");
      const switcher = hero.querySelector(".v3-mobile-workspace-switch");
      const miniStyle = getComputedStyle(miniPreview);
      return {
        mode: hero.className,
        visualDisplay: getComputedStyle(visual).display,
        composerDisplay: getComputedStyle(composer).display,
        miniDisplay: miniStyle.display,
        miniPosition: miniStyle.position,
        miniTop: miniStyle.top,
        miniWidth: miniPreview.getBoundingClientRect().width,
        switchHeight: switcher.getBoundingClientRect().height,
        viewportWidth: window.innerWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    assert(
      "atelier-mobile-config-garde-un-apercu",
      workspaceConfig.mode.includes("is-mobile-config")
        && workspaceConfig.visualDisplay === "none"
        && workspaceConfig.composerDisplay !== "none"
        && workspaceConfig.miniDisplay === "grid"
        && workspaceConfig.miniPosition === "sticky"
        && workspaceConfig.miniWidth <= workspaceConfig.viewportWidth - 24
        && workspaceConfig.switchHeight <= 64
        && workspaceConfig.overflow <= 1,
      workspaceConfig,
    );
    await page.screenshot({ path: path.join(outputDir, "02b-page-unique-mobile-configuration.png"), fullPage: false });
    assert("pack-mobile-restaure", await page.getByRole("button", { name: "2 plaques", exact: true }).getAttribute("aria-pressed") === "true");
    assert("selecteur-activites-mobile", await page.locator(".v3-sector-chips button").count() === SECTORS.length);
    const pilotMobile = page.locator("#pilot");
    const pilotMobileLayout = await pilotMobile.evaluate((section) => {
      const box = section.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        width: box.width,
        viewportWidth: window.innerWidth,
        scrollWidth: section.scrollWidth,
        clientWidth: section.clientWidth,
      };
    });
    assert(
      "pilot-mobile-sans-debordement",
      Math.abs(pilotMobileLayout.left) <= 1
        && Math.abs(pilotMobileLayout.right - pilotMobileLayout.viewportWidth) <= 1
        && pilotMobileLayout.scrollWidth <= pilotMobileLayout.clientWidth + 1,
      pilotMobileLayout,
    );
    assert("pilot-mobile-acces-visible", await pilotMobile.locator('a[href="/connexion"]').isVisible());
    await page.screenshot({ path: path.join(outputDir, "02-page-unique-mobile.png"), fullPage: true });
    await pilotMobile.screenshot({ path: path.join(outputDir, "04-pilot-mobile.png") });
    await page.getByRole("button", { name: "Carte", exact: true }).click();
    await page.locator(".v3-mobile-config-preview .v3-product-carte").waitFor({ state: "visible" });
    assert(
      "apercu-mobile-carte-synchronise",
      await page.locator(".v3-mobile-config-preview .v3-product-carte").count() === 1,
    );
    const cardQuantity = page.locator(".v3-card-quantity");
    const cardQuantityLayout = await cardQuantity.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
      overflow: element.scrollWidth - element.clientWidth,
    }));
    assert(
      "quantite-carte-coherente-mobile",
      cardQuantityLayout.width <= cardQuantityLayout.viewportWidth - 28
        && cardQuantityLayout.overflow <= 1,
      cardQuantityLayout,
    );
    await page.locator(".v3-core-choice-grid").screenshot({ path: path.join(outputDir, "05-card-quantity-mobile.png") });
    await page.locator(".v3-mobile-config-preview").click();
    assert(
      "retour-apercu-mobile-depuis-la-configuration",
      await page.getByRole("tab", { name: /Aperçu/i }).getAttribute("aria-selected") === "true"
        && await page.locator(".v3-home-visual").isVisible(),
    );
  },
);
await mobileHome.close();

const pilotMarketingMobile = await auditPage(mobile, "/tapote-pilot", "Page marketing Tapote Pilot mobile", async (page) => {
  assert("pilot-marketing-mobile-cta-visible", await page.locator('.v3-pilot-story a[href="/connexion"]').first().isVisible());
  assert(
    "pilot-marketing-mobile-sans-debordement",
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  );
  await page.screenshot({ path: path.join(outputDir, "08-pilot-marketing-mobile.png"), fullPage: true });
});
await pilotMarketingMobile.close();

const pilotApplicationMobile = await auditPage(mobile, "/pilot", "Application Tapote Pilot mobile", async (page) => {
  const demoButton = page.getByRole("button", { name: /Explorer la démonstration/i });
  if (await demoButton.count()) {
    await demoButton.click();
    await page.locator(".pilot-client-app").waitFor({ state: "visible" });
  }
  await page.waitForTimeout(650);
  const pilotMetrics = await page.evaluate(() => {
    const header = document.querySelector(".pilot-mobile-header");
    const nav = document.querySelector(".pilot-mobile-nav");
    const heading = document.querySelector(".pilot-view-heading");
    const quickLink = document.querySelector(".pilot-link-workspace");
    const counter = document.querySelector(".pilot-basic-counter");
    const headerStyle = getComputedStyle(header);
    const navStyle = getComputedStyle(nav);
    return {
      headerDisplay: headerStyle.display,
      headerHeight: header.getBoundingClientRect().height,
      headerPosition: headerStyle.position,
      navDisplay: navStyle.display,
      navHeight: nav.getBoundingClientRect().height,
      navPosition: navStyle.position,
      headingHeight: heading?.getBoundingClientRect().height ?? 0,
      quickLinkHeight: quickLink?.getBoundingClientRect().height ?? 0,
      counterHeight: counter?.getBoundingClientRect().height ?? 0,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  assert(
    "pilot-app-mobile-compacte-et-navigable",
    pilotMetrics.headerDisplay === "grid"
      && pilotMetrics.headerPosition === "fixed"
      && pilotMetrics.headerHeight <= 64
      && pilotMetrics.navDisplay === "grid"
      && pilotMetrics.navPosition === "fixed"
      && pilotMetrics.navHeight <= 72
      && pilotMetrics.headingHeight <= 230
      && pilotMetrics.quickLinkHeight <= 620
      && pilotMetrics.counterHeight <= 130
      && pilotMetrics.overflow <= 1,
    pilotMetrics,
  );
  await page.screenshot({ path: path.join(outputDir, "10-pilot-application-mobile.png"), fullPage: true });
  await page.locator('[data-pilot-mobile-nav="products"]').click();
  assert(
    "pilot-navigation-mobile-change-de-vue",
    await page.locator('[data-pilot-mobile-nav="products"]').getAttribute("aria-current") === "page"
      && await page.getByRole("heading", { name: "Produits", exact: true }).isVisible(),
  );
  await page.locator(".pilot-mobile-quick-link").click();
  await page.locator(".pilot-inspector").waitFor({ state: "visible" });
  await page.waitForTimeout(400);
  const inspectorMetrics = await page.locator(".pilot-inspector").evaluate((inspector) => {
    const style = getComputedStyle(inspector);
    const box = inspector.getBoundingClientRect();
    return {
      position: style.position,
      bottom: style.bottom,
      width: box.width,
      height: box.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      overflow: inspector.scrollWidth - inspector.clientWidth,
    };
  });
  assert(
    "pilot-editeur-mobile-en-feuille-basse",
    inspectorMetrics.position !== "fixed"
      && inspectorMetrics.width <= inspectorMetrics.viewportWidth
      && inspectorMetrics.height <= inspectorMetrics.viewportHeight * 0.9
      && inspectorMetrics.overflow <= 1,
    inspectorMetrics,
  );
  await page.screenshot({ path: path.join(outputDir, "11-pilot-editeur-mobile.png"), fullPage: false });
});
await pilotApplicationMobile.close();

const quoteMobile = await auditPage(mobile, "/devis", "Devis mobile", async (page) => {
  const quoteMetrics = await page.locator(".v3-quote-intro").evaluate((hero) => {
    const heading = hero.querySelector("h1");
    const style = getComputedStyle(heading);
    return {
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      width: heading.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  assert(
    "devis-mobile-lisible",
    quoteMetrics.fontSize <= 55
      && quoteMetrics.lineHeight <= 58
      && quoteMetrics.width <= quoteMetrics.viewportWidth - 32
      && quoteMetrics.overflow <= 1,
    quoteMetrics,
  );
  await page.screenshot({ path: path.join(outputDir, "12-devis-mobile.png"), fullPage: false });
});
await quoteMobile.close();

await wide.close();
await desktop.close();
await mobile.close();
await browser.close();

report.ok = report.errors.length === 0 && report.assertions.every((entry) => entry.ok);
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
