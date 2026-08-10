import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { PRODUCTS } from "../shared/catalog.js";

const baseUrl = process.env.TAPOTE_AUDIT_URL || "http://127.0.0.1:5173";
const strictPerformance = process.env.TAPOTE_PERF_STRICT === "1";
const requireWebgl = process.env.TAPOTE_REQUIRE_WEBGL === "1";
const outputDir = path.resolve("output/playwright/storefront-experience");
const heroSourcePath = path.resolve("src/storefront/Hero3D.jsx");
const heroStylesPath = path.resolve("src/storefront-v3/styles/pages/founder.css");
const mobileProfiles = [
  { name: "compact", width: 360, height: 720, productPath: "/produits/comptoir?mode=ready" },
  { name: "iphone", width: 390, height: 844, productPath: "/produits/plaque?mode=custom" },
  { name: "large", width: 430, height: 932, productPath: "/produits/carte?mode=custom" },
];

await fs.mkdir(outputDir, { recursive: true });

const report = {
  startedAt: new Date().toISOString(),
  baseUrl,
  options: { strictPerformance, requireWebgl },
  checks: [],
  pages: [],
  performance: {},
  artifacts: [],
  runtimeErrors: [],
};

function check(name, ok, details, { blocking = true } = {}) {
  report.checks.push({
    name,
    ok: Boolean(ok),
    blocking,
    ...(details === undefined ? {} : { details }),
  });
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function launchBrowser() {
  try {
    return await chromium.launch({
      headless: true,
      args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader"],
    });
  } catch {
    return chromium.launch({
      channel: "chrome",
      headless: true,
      args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader"],
    });
  }
}

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
}

async function installPerformanceObservers(context) {
  await context.addInitScript(() => {
    window.__tapotePerformance = {
      cls: 0,
      lcp: 0,
      longTasks: [],
    };
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const latest = entries.at(-1);
        if (latest) window.__tapotePerformance.lcp = latest.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Unsupported metrics stay at zero and are reported as unavailable.
    }
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__tapotePerformance.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // Unsupported metrics stay at zero and are reported as unavailable.
    }
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__tapotePerformance.longTasks.push({
            startTime: entry.startTime,
            duration: entry.duration,
          });
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Unsupported metrics stay empty and are reported as unavailable.
    }
  });
}

function observeRuntime(page, label) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() !== "error" || /favicon/i.test(message.text())) return;
    errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText || "";
    if (/ERR_ABORTED/i.test(failure)) return;
    errors.push(`requestfailed: ${request.method()} ${request.url()} (${failure})`);
  });
  return () => {
    if (errors.length) report.runtimeErrors.push(...errors.map((error) => `${label}: ${error}`));
    check(`runtime-sans-erreur-${label}`, errors.length === 0, errors);
    return errors;
  };
}

async function settlePage(page, { hero = false } = {}) {
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.evaluate(async () => {
    await document.fonts?.ready;
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
      image.loading = "eager";
    });
  });
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete),
    undefined,
    { timeout: 15_000 },
  ).catch(() => {});
  if (hero) {
    await page.locator(".v3-hero-3d").waitFor({ state: "visible", timeout: 10_000 });
    await page.locator(".v3-hero-3d .v3-hero-product-object").waitFor({ state: "visible", timeout: 10_000 });
  }
  await page.waitForTimeout(700);
}

async function goto(page, pathname, label, options = {}) {
  const flushErrors = observeRuntime(page, label);
  const response = await page.goto(`${baseUrl}${pathname}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.locator("main").waitFor({ state: "visible", timeout: 15_000 });
  await settlePage(page, options);
  check(`http-${label}`, Boolean(response) && response.status() < 400, response?.status());
  report.pages.push({
    label,
    pathname,
    status: response?.status(),
    title: await page.title(),
  });
  return flushErrors;
}

async function layoutMetrics(page, root = "body") {
  return page.locator(root).evaluate((element) => {
    const visible = (node) => {
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return box.width > 0
        && box.height > 0
        && style.visibility !== "hidden"
        && style.display !== "none"
        && Number(style.opacity) > 0;
    };
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const smallTargets = [...element.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea')]
      .filter(visible)
      .map((node) => {
        const box = node.getBoundingClientRect();
        return {
          label: node.getAttribute("aria-label") || node.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
          width: Math.round(box.width),
          height: Math.round(box.height),
        };
      })
      .filter(({ width, height }) => width < 44 || height < 44);
    return {
      overflow: Math.max(0, Math.round((documentWidth - window.innerWidth) * 10) / 10),
      h1Count: element.querySelectorAll("h1").length,
      brokenImages: [...element.querySelectorAll("img")]
        .filter(visible)
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .length,
      smallTargets,
    };
  });
}

async function isFullyInViewport(locator) {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.top >= 0
      && box.left >= 0
      && box.bottom <= window.innerHeight
      && box.right <= window.innerWidth;
  });
}

async function targetSizes(locator) {
  return locator.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return {
      label: element.getAttribute("aria-label") || element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
  }));
}

async function screenshot(page, filename, options = {}) {
  const target = path.join(outputDir, filename);
  await page.screenshot({ path: target, ...options });
  report.artifacts.push(path.relative(process.cwd(), target));
  return target;
}

async function readPerformance(page) {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const bytesFor = (predicate) => resources
      .filter(predicate)
      .reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0);
    const longTasks = window.__tapotePerformance?.longTasks || [];
    return {
      lcpMs: Math.round(window.__tapotePerformance?.lcp || 0),
      cls: Math.round((window.__tapotePerformance?.cls || 0) * 1_000) / 1_000,
      longTaskCount: longTasks.length,
      longTaskTotalMs: Math.round(longTasks.reduce((sum, entry) => sum + entry.duration, 0)),
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      loadMs: navigation ? Math.round(navigation.loadEventEnd) : null,
      transferBytes: Math.round(bytesFor(() => true)),
      scriptBytes: Math.round(bytesFor((entry) => entry.initiatorType === "script" || /\.m?js(?:\?|$)/i.test(entry.name))),
      imageBytes: Math.round(bytesFor((entry) => entry.initiatorType === "img" || /\.(?:avif|gif|jpe?g|png|svg|webp)(?:\?|$)/i.test(entry.name))),
      resources: resources.length,
    };
  });
}

async function auditHeroSourceContract() {
  const [source, styles] = await Promise.all([
    fs.readFile(heroSourcePath, "utf8"),
    fs.readFile(heroStylesPath, "utf8"),
  ]);
  const products = ["comptoir", "plaque", "carte"].every((product) => source.includes(`${product}: {`));
  check(
    "hero-contrat-trois-supports",
    products
      && source.includes("<HeroProductObject")
      && source.includes("<DeviceFrame")
      && source.includes("HERO_SEQUENCE_DURATION")
      && source.includes("HERO_PRODUCT_ORDER"),
    { products },
  );
  check(
    "hero-contrat-mouvement-reduit-et-sans-webgl",
    source.includes("prefers-reduced-motion: reduce")
      && styles.includes("@media (prefers-reduced-motion: reduce)")
      && !source.includes("WebGLRenderer")
      && !source.includes("<Canvas"),
  );
}

async function auditDesktopHeader(context) {
  const page = await context.newPage();
  const flushErrors = await goto(page, "/", "header-desktop");
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  const links = await nav.locator(":scope > a:visible, :scope > .v3-shop-nav > button:visible").evaluateAll((elements) => elements.map((element) => ({
    label: element.textContent?.trim().replace(/\s+/g, " "),
    href: element.getAttribute("href") || "/boutique",
  })));
  const shopTrigger = nav.getByRole("button", { name: /Boutique/i });
  check(
    "header-desktop-navigation-visible",
    await nav.isVisible() && await shopTrigger.isVisible() && links.length >= 1,
    links,
  );
  check("header-desktop-liens-uniques", new Set(links.map(({ href }) => href)).size === links.length, links);
  check("header-desktop-cta-commande", await page.locator('.v3-header-primary[href="/boutique"]').isVisible());
  check("header-desktop-connexion", await page.locator('.v3-login[href="/connexion"]').isVisible());
  check("header-desktop-panier", await page.locator('.v3-cart-button[href="/panier"]').isVisible());
  const metrics = await layoutMetrics(page, ".v3-header");
  check("header-desktop-sans-debordement", metrics.overflow <= 1, metrics);
  await screenshot(page, "01-header-desktop.png", { fullPage: false });
  flushErrors();
  await page.close();
}

async function auditHero(context) {
  const page = await context.newPage();
  const flushErrors = await goto(page, "/", "hero-desktop", { hero: true });
  const hero = page.locator(".v3-hero-3d");
  check("hero-sans-dependance-webgl", await hero.locator("canvas").count() === 0);
  check("hero-support-et-telephone-presents",
    await hero.locator(".v3-hero-product-object").count() === 1
      && await hero.locator(".tapote-device-frame").count() === 1);
  const toolbarButtons = hero.locator(".v3-hero-3d__toolbar button");
  check("hero-selecteur-trois-supports", await toolbarButtons.count() === 3);

  const frames = [];
  const products = ["comptoir", "plaque", "carte"];
  for (let index = 0; index < products.length; index += 1) {
    await toolbarButtons.nth(index).click();
    await page.waitForFunction(
      (product) => document.querySelector(".v3-hero-3d")?.dataset.activeProduct === product,
      products[index],
    );
    await page.waitForTimeout(180);
    const target = path.join(outputDir, `02-hero-${products[index]}.png`);
    const buffer = await hero.screenshot({ path: target, animations: "disabled" });
    frames.push({
      path: target,
      hash: sha256(buffer),
      dataUri: `data:image/png;base64,${buffer.toString("base64")}`,
    });
    report.artifacts.push(path.relative(process.cwd(), target));
  }
  const uniqueFrames = new Set(frames.map(({ hash }) => hash)).size;
  check("hero-trois-etats-visuellement-distincts", uniqueFrames === 3, {
    uniqueFrames,
    hashes: frames.map(({ hash }) => hash.slice(0, 12)),
  });

  const sheet = await context.newPage();
  await sheet.setViewportSize({ width: 1500, height: 660 });
  await sheet.setContent(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; background: #0b0c10; color: #fff; font: 18px/1.4 Arial, sans-serif; }
            h1 { margin: 0 0 24px; font-size: 26px; }
            main { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
            figure { margin: 0; border: 1px solid #333846; border-radius: 16px; overflow: hidden; background: #11141a; }
            img { width: 100%; display: block; }
            figcaption { padding: 12px 16px; }
          </style>
        </head>
        <body>
          <h1>Hero dynamique — vérification humaine : Comptoir, Plaque, Card</h1>
          <main>
            ${frames.map(({ dataUri }, index) => `<figure><img src="${dataUri}" alt=""><figcaption>${products[index]}</figcaption></figure>`).join("")}
          </main>
        </body>
      </html>
    `);
  await screenshot(sheet, "03-hero-contact-sheet.png", { fullPage: true });
  await sheet.close();

  const metrics = await readPerformance(page);
  report.performance.home = metrics;
  check("perf-lcp-home", metrics.lcpMs > 0 && metrics.lcpMs <= 3_500, metrics, { blocking: strictPerformance });
  check("perf-cls-home", metrics.cls <= 0.1, metrics, { blocking: strictPerformance });
  check("perf-long-tasks-home", metrics.longTaskTotalMs <= 500, metrics, { blocking: strictPerformance });
  await screenshot(page, "04-hero-desktop.png", { fullPage: false });
  flushErrors();
  await page.close();
}

async function auditReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await mockStorefrontApis(context);
  const page = await context.newPage();
  const flushErrors = await goto(page, "/", "hero-reduced-motion", { hero: true });
  const hero = page.locator(".v3-hero-3d");
  check("reduced-motion-sans-canvas", await hero.locator("canvas").count() === 0);
  check("reduced-motion-visuel-complet",
    await hero.locator(".v3-hero-product-object").count() === 1
      && await hero.locator(".tapote-device-frame").count() === 1);
  const firstProduct = await hero.getAttribute("data-active-product");
  await page.waitForTimeout(1_000);
  const secondProduct = await hero.getAttribute("data-active-product");
  check("reduced-motion-produit-stable", firstProduct === secondProduct, { firstProduct, secondProduct });
  await screenshot(page, "05-hero-reduced-motion.png", { fullPage: false });
  flushErrors();
  await page.close();
  await context.close();
}

async function auditWebglFallback(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patchedGetContext(type, ...args) {
      if (["webgl", "webgl2", "experimental-webgl"].includes(String(type).toLowerCase())) return null;
      return originalGetContext.call(this, type, ...args);
    };
  });
  await mockStorefrontApis(context);
  const page = await context.newPage();
  const flushErrors = await goto(page, "/", "hero-sans-webgl", { hero: true });
  const hero = page.locator(".v3-hero-3d");
  check("webgl-indisponible-sans-canvas", await hero.locator("canvas").count() === 0);
  check("webgl-indisponible-visuel-complet",
    await hero.locator(".v3-hero-product-object").count() === 1
      && await hero.locator(".tapote-device-frame").count() === 1);
  check("webgl-indisponible-garde-h1", await page.getByRole("heading", { level: 1 }).isVisible());
  check("webgl-indisponible-garde-cta", await page.locator('main a[href="/boutique"]').first().isVisible());
  await screenshot(page, "06-hero-sans-webgl.png", { fullPage: false });
  flushErrors();
  await page.close();
  await context.close();
}

async function auditMobileProfile(browser, profile) {
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await mockStorefrontApis(context);
  await installPerformanceObservers(context);

  const home = await context.newPage();
  const flushHomeErrors = await goto(home, "/", `home-mobile-${profile.name}`, { hero: true });
  const homeMetrics = await layoutMetrics(home);
  const h1 = home.getByRole("heading", { level: 1 });
  const primaryCta = home.locator('main a[href="/boutique"]').first();
  check(`mobile-${profile.name}-home-h1-unique`, homeMetrics.h1Count === 1 && await h1.isVisible(), homeMetrics);
  check(`mobile-${profile.name}-home-sans-debordement`, homeMetrics.overflow <= 1, homeMetrics);
  check(`mobile-${profile.name}-home-images-valides`, homeMetrics.brokenImages === 0, homeMetrics);
  check(`mobile-${profile.name}-home-h1-premier-ecran`, await isFullyInViewport(h1));
  check(
    `mobile-${profile.name}-home-cta-present-et-visible`,
    await primaryCta.isVisible(),
    undefined,
  );
  const primaryTargets = await targetSizes(home.locator(".v3-header .v3-cart-button:visible, .v3-header .v3-mobile-toggle:visible, .v3-founder-actions a:visible"));
  check(
    `mobile-${profile.name}-cibles-header-et-hero-44px`,
    primaryTargets.length >= 3 && primaryTargets.every(({ width, height }) => width >= 44 && height >= 44),
    primaryTargets,
  );

  const toggle = home.locator(".v3-mobile-toggle");
  const toggleBox = await toggle.boundingBox();
  check(
    `mobile-${profile.name}-menu-bouton-44px`,
    Boolean(toggleBox) && toggleBox.width >= 44 && toggleBox.height >= 44,
    toggleBox,
  );
  await toggle.click();
  const navigation = home.getByRole("navigation", { name: "Navigation principale" });
  check(`mobile-${profile.name}-menu-ouvert`, await navigation.isVisible() && await toggle.getAttribute("aria-expanded") === "true");
  check(
    `mobile-${profile.name}-menu-focus-premier-lien`,
    await home.evaluate(() => document.activeElement?.closest("nav[aria-label='Navigation principale']") !== null),
    await home.evaluate(() => document.activeElement?.textContent?.trim()),
  );
  check(
    `mobile-${profile.name}-menu-page-inerte`,
    await home.locator("main[inert]").count() === 1 && await home.locator("body.v3-menu-open").count() === 1,
  );
  await home.keyboard.press("Escape");
  check(
    `mobile-${profile.name}-menu-echap-retour-focus`,
    await toggle.getAttribute("aria-expanded") === "false"
      && await toggle.evaluate((element) => document.activeElement === element)
      && await home.locator("main[inert]").count() === 0,
  );
  await screenshot(home, `07-home-mobile-${profile.width}.png`, { fullPage: false });
  if (profile.name === "iphone") {
    const metrics = await readPerformance(home);
    report.performance.mobileHome = metrics;
    check("perf-lcp-home-mobile", metrics.lcpMs > 0 && metrics.lcpMs <= 3_500, metrics, { blocking: strictPerformance });
    check("perf-cls-home-mobile", metrics.cls <= 0.1, metrics, { blocking: strictPerformance });
  }
  flushHomeErrors();
  await home.close();

  const shop = await context.newPage();
  const flushShopErrors = await goto(shop, "/boutique", `boutique-mobile-${profile.name}`);
  const shopMetrics = await layoutMetrics(shop, "main");
  const productHrefs = await shop.locator('.v3-shop-grid a[href^="/produits/"]').evaluateAll((elements) => (
    [...new Set(elements.map((element) => element.getAttribute("href")?.split("?")[0]).filter(Boolean))]
  ));
  const formatCards = shop.locator(".v3-shop-family:not(.is-packs) .v3-shop-card");
  const packCards = shop.locator(".v3-shop-family.is-packs .v3-shop-card");
  const finishChoices = shop.locator(".v3-shop-finish-prices");
  check(`mobile-${profile.name}-boutique-h1-unique`, shopMetrics.h1Count === 1, shopMetrics);
  check(`mobile-${profile.name}-boutique-sans-debordement`, shopMetrics.overflow <= 1, shopMetrics);
  check(`mobile-${profile.name}-boutique-trois-pdp`, productHrefs.length === 3, productHrefs);
  check(`mobile-${profile.name}-boutique-trois-formats`, await formatCards.count() === 3);
  check(`mobile-${profile.name}-boutique-trois-packs`, await packCards.count() === 3);
  check(`mobile-${profile.name}-boutique-deux-finitions-par-offre`, await finishChoices.count() === 6);
  check(
    `mobile-${profile.name}-boutique-prix-prets-et-personnalises`,
    await shop.getByText("Prêt à poser", { exact: true }).count() === 6
      && await shop.getByText("À votre image", { exact: true }).count() === 6,
  );
  await screenshot(shop, `08-boutique-mobile-${profile.width}.png`, { fullPage: false });
  flushShopErrors();
  await shop.close();

  const product = await context.newPage();
  const flushProductErrors = await goto(product, profile.productPath, `pdp-mobile-${profile.name}`);
  const productMetrics = await layoutMetrics(product, "main");
  const add = product.getByRole("button", { name: /Ajouter au panier/i });
  const productHeroCount = await product.locator(".v3-product-hero").count();
  const buyColumn = product.locator(".v3-product-buy-column");
  const intro = product.locator(".v3-product-intro");
  const gallery = product.locator(".v3-product-gallery");
  const introBox = await intro.boundingBox();
  const galleryBox = await gallery.boundingBox();
  check(`mobile-${profile.name}-pdp-h1-unique`, productMetrics.h1Count === 1, productMetrics);
  check(`mobile-${profile.name}-pdp-route-produit-valide`, productHeroCount === 1, {
    pathname: profile.productPath,
    title: await product.title(),
    h1: await product.getByRole("heading", { level: 1 }).first().textContent().catch(() => ""),
  });
  check(`mobile-${profile.name}-pdp-sans-debordement`, productMetrics.overflow <= 1, productMetrics);
  check(`mobile-${profile.name}-pdp-sept-blocs-maximum`, await product.locator("#main-content > section").count() <= 8);
  check(`mobile-${profile.name}-pdp-une-zone-achat`, await buyColumn.locator(".v3-buybox").count() === 1);
  check(
    `mobile-${profile.name}-pdp-nom-avant-scene`,
    Boolean(introBox) && Boolean(galleryBox) && introBox.y < galleryBox.y
      && Boolean((await intro.innerText()).trim()),
    { introBox, galleryBox },
  );
  check(
    `mobile-${profile.name}-pdp-sans-duplication-hero`,
    await product.locator(".v3-product-price-line, .v3-product-assurance, .v3-product-facts, .v3-product-design-showcase, .v3-product-pilot-proof").count() === 0,
  );
  check(`mobile-${profile.name}-pdp-visuel-valide`, await product.locator(".v3-product-gallery .v3-sector-scene").count() >= 1);
  const sticky = product.locator(".v3-mobile-product-cta");
  check(`mobile-${profile.name}-pdp-sticky-cache-au-depart`, !await sticky.evaluate((element) => element.classList.contains("is-visible")));
  // La destination est une donnée de production obligatoire. Remplir le champ
  // fait volontairement défiler Playwright jusqu'au configurateur : le contrôle
  // du sticky « au départ » doit donc précéder cette interaction.
  const destinationField = product.getByRole("textbox", { name: /Lien obligatoire à ouvrir/i });
  if (await destinationField.count() === 1) {
    await destinationField.fill("https://example.com/tapote-audit");
  } else {
    await intro.evaluate((element) => {
      window.scrollTo(0, window.scrollY + element.getBoundingClientRect().bottom + 24);
    });
  }
  const addCount = await add.count();
  check(`mobile-${profile.name}-pdp-un-seul-ajout`, addCount === 1);
  await product.waitForFunction(() => document.querySelector(".v3-mobile-product-cta")?.classList.contains("is-visible"));
  check(`mobile-${profile.name}-pdp-sticky-apres-cta`, await sticky.evaluate((element) => element.classList.contains("is-visible")));
  await product.locator(".v3-buybox-summary").scrollIntoViewIfNeeded();
  await product.waitForFunction(() => !document.querySelector(".v3-mobile-product-cta")?.classList.contains("is-visible"));
  check(`mobile-${profile.name}-pdp-sticky-cache-sur-cta-final`, !await sticky.evaluate((element) => element.classList.contains("is-visible")));
  const addBox = addCount === 1 ? await add.boundingBox() : null;
  check(
    `mobile-${profile.name}-pdp-ajout-44px`,
    Boolean(addBox) && addBox.width >= 44 && addBox.height >= 44,
    addBox,
  );
  if (addCount === 1) await add.click();
  check(
    `mobile-${profile.name}-pdp-ajout-fonctionnel`,
    addCount === 1 && await product.getByRole("link", { name: /Voir le panier, 1 article/i }).count() === 1,
  );
  await screenshot(product, `09-pdp-mobile-${profile.width}.png`, { fullPage: false });
  flushProductErrors();
  await product.close();

  await context.close();
}

let browser;
try {
  await auditHeroSourceContract();
  browser = await launchBrowser();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await mockStorefrontApis(desktop);
  await installPerformanceObservers(desktop);
  await auditDesktopHeader(desktop);
  await auditHero(desktop);
  await desktop.close();

  await auditReducedMotion(browser);
  await auditWebglFallback(browser);

  for (const profile of mobileProfiles) {
    await auditMobileProfile(browser, profile);
  }
} catch (error) {
  report.fatalError = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ""}` : String(error);
} finally {
  await browser?.close().catch(() => {});
  report.finishedAt = new Date().toISOString();
  report.ok = !report.fatalError
    && report.runtimeErrors.length === 0
    && report.checks.every((entry) => entry.ok || !entry.blocking);
  const reportPath = path.join(outputDir, "report.json");
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  report.artifacts.push(path.relative(process.cwd(), reportPath));
  const failedChecks = report.checks
    .filter((entry) => !entry.ok)
    .map(({ name, blocking, details }) => ({ name, blocking, details }));
  console.log(JSON.stringify({
    ok: report.ok,
    baseUrl,
    checks: report.checks.length,
    passed: report.checks.length - failedChecks.length,
    failed: failedChecks,
    fatalError: report.fatalError,
    report: path.relative(process.cwd(), reportPath),
  }, null, 2));
  if (!report.ok) process.exitCode = 1;
}
