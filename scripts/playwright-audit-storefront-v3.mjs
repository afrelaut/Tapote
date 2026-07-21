import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.TAPOTE_AUDIT_URL || "http://127.0.0.1:5174";
const outputDir = path.resolve("output/playwright/v3-final");
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = { baseUrl, pages: [], errors: [], assertions: [] };

async function hydrateLazyAssets(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => { image.loading = "eager"; });
    const step = Math.max(420, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 45));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, { timeout: 10_000 });
  await page.waitForTimeout(250);
}

async function auditPage(context, pathname, name, action) {
  const page = await context.newPage();
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await hydrateLazyAssets(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const brokenImages = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).length);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const blockingA11y = accessibility.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
  report.pages.push({ name, pathname, status: response?.status(), title: await page.title(), overflow, brokenImages, accessibility: { violations: accessibility.violations.length, blocking: blockingA11y.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length, examples: nodes.slice(0, 8).map((node) => node.target) })) }, pageErrors });
  if (overflow > 1) report.errors.push(`${name}: débordement horizontal de ${overflow}px`);
  if (brokenImages) report.errors.push(`${name}: ${brokenImages} image(s) non chargée(s)`);
  if (blockingA11y.length) report.errors.push(`${name}: ${blockingA11y.length} violation(s) d’accessibilité sérieuse(s) ou critique(s)`);
  if (pageErrors.length) report.errors.push(...pageErrors.map((error) => `${name}: ${error}`));
  if (action) await action(page);
  return page;
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

const home = await auditPage(desktop, "/", "Accueil desktop", async (page) => {
  await page.screenshot({ path: path.join(outputDir, "01-home-desktop.png"), fullPage: true });
  report.assertions.push({ name: "achat-direct-home", ok: await page.getByRole("button", { name: /Ajouter au panier/i }).first().isVisible() });
  report.assertions.push({ name: "photo-produit-home", ok: (await page.locator(".v3-commerce-visual > img").getAttribute("src"))?.includes("template-chevalet") });
});
await home.close();

const directory = await auditPage(desktop, "/secteurs", "Annuaire secteurs", async (page) => {
  const count = await page.locator(".v3-sector-directory-grid > a").count();
  report.assertions.push({ name: "secteurs-regroupes", ok: count === 15, value: count });
  report.assertions.push({ name: "un-fond-par-carte-secteur", ok: await page.locator(".v3-sector-directory-grid > a .v3-sector-scene-background").count() === count });
  report.assertions.push({ name: "un-support-par-carte-secteur", ok: await page.locator(".v3-sector-directory-grid > a .v3-sector-scene-support").count() === count });
  report.assertions.push({ name: "un-ecran-par-carte-secteur", ok: await page.locator(".v3-sector-directory-grid > a .v3-sector-scene-screen").count() === count });
  await page.screenshot({ path: path.join(outputDir, "02-secteurs-regroupes.png"), fullPage: true });
});
await directory.close();

const shop = await auditPage(desktop, "/boutique", "Boutique et transitions", async (page) => {
  report.assertions.push({ name: "trois-supports-boutique", ok: await page.locator(".v3-shop-card").count() === 3 });
  await page.getByRole("button", { name: /À votre image/i }).click();
  await page.waitForTimeout(80);
  report.assertions.push({ name: "boutique-personnalisee-visible", ok: await page.locator('.v3-shop-card[data-variant="custom"]').count() === 3 });
  report.assertions.push({ name: "transition-boutique-active", ok: await page.locator(".v3-shop-card").first().evaluate((element) => getComputedStyle(element).animationName === "v3-shop-card-in") });
  await page.screenshot({ path: path.join(outputDir, "11-boutique-personnalisee.png"), fullPage: true });
});
await shop.close();

const restaurant = await auditPage(desktop, "/secteurs/restaurants-traiteurs-food-trucks", "Secteur restaurant", async (page) => {
  const hero = page.locator(".v3-sector-scene");
  const backgroundBefore = await hero.locator(".v3-sector-scene-background").getAttribute("src");
  await hero.screenshot({ path: path.join(outputDir, "03-restaurant-menu-chevalet.png") });
  report.assertions.push({ name: "restaurant-fond", ok: backgroundBefore?.includes("bg-restaurant") });
  report.assertions.push({ name: "une-seule-scene-secteur", ok: await page.locator(".v3-sector-scene").count() === 1 });
  report.assertions.push({ name: "aucune-scene-legacy", ok: await page.locator(".v3-sector-live, .v3-human-story").count() === 0 });
  report.assertions.push({ name: "restaurant-action-menu", ok: await page.locator(".v3-sector-buy select").inputValue() === "menu" });
  await page.locator(".v3-sector-buy").getByRole("button", { name: "Plaque", exact: true }).click();
  await page.waitForTimeout(300);
  report.assertions.push({ name: "support-plaque", ok: await hero.evaluate((element) => element.classList.contains("is-surface-plaque")) });
  report.assertions.push({ name: "fond-stable-changement-support", ok: await hero.locator(".v3-sector-scene-background").getAttribute("src") === backgroundBefore });
  report.assertions.push({ name: "ecran-reste-menu", ok: (await hero.locator(".v3-sector-scene-screen").getAttribute("class"))?.includes("is-action-menu") });
  await page.locator(".v3-sector-buy select").selectOption("avis");
  await page.waitForTimeout(300);
  report.assertions.push({ name: "ecran-change-avis", ok: (await hero.locator(".v3-sector-scene-screen").getAttribute("class"))?.includes("is-action-avis") });
  report.assertions.push({ name: "support-reste-plaque", ok: await hero.evaluate((element) => element.classList.contains("is-surface-plaque")) });
  report.assertions.push({ name: "fond-stable-changement-usage", ok: await hero.locator(".v3-sector-scene-background").getAttribute("src") === backgroundBefore });
  await hero.screenshot({ path: path.join(outputDir, "04-restaurant-avis-plaque.png") });
  await page.screenshot({ path: path.join(outputDir, "05-restaurant-page-desktop.png"), fullPage: true });
});
await restaurant.close();

const drivingSchool = await auditPage(desktop, "/secteurs/auto-ecoles", "Secteur auto-écoles", async (page) => {
  const hero = page.locator(".v3-sector-scene");
  report.assertions.push({ name: "auto-ecole-fond-dedie", ok: (await hero.locator(".v3-sector-scene-background").getAttribute("src"))?.includes("bg-auto-ecole") });
  report.assertions.push({ name: "auto-ecole-reservation-par-defaut", ok: await page.locator(".v3-sector-buy select").inputValue() === "reservation" });
  report.assertions.push({ name: "auto-ecole-ecran-reservation", ok: (await hero.locator(".v3-sector-scene-screen").getAttribute("class"))?.includes("is-action-reservation") });
  await hero.screenshot({ path: path.join(outputDir, "10-auto-ecole-reservation.png") });
});
await drivingSchool.close();

const custom = await auditPage(desktop, "/produits/plaque", "Produit plaque", async (page) => {
  await page.getByRole("button", { name: /À votre image/i }).first().click();
  await page.waitForTimeout(250);
  const colorInputs = page.locator('.v3-brand-colors input[type="color"]');
  report.assertions.push({ name: "deux-couleurs-personnalisees", ok: await colorInputs.count() === 2 });
  await colorInputs.nth(0).fill("#173B57");
  await colorInputs.nth(1).fill("#F4B942");
  await page.locator(".v3-product-thumbs button").nth(1).click();
  await page.waitForTimeout(250);
  await page.locator(".v3-product-main-image").screenshot({ path: path.join(outputDir, "06-plaque-personnalisee-live.png") });
  await page.screenshot({ path: path.join(outputDir, "07-produit-plaque-desktop.png"), fullPage: true });
});
await custom.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobileHome = await auditPage(mobile, "/", "Accueil mobile", async (page) => {
  await page.screenshot({ path: path.join(outputDir, "08-home-mobile.png"), fullPage: true });
});
await mobileHome.close();
const mobileSector = await auditPage(mobile, "/secteurs/restaurants-traiteurs-food-trucks", "Restaurant mobile", async (page) => {
  report.assertions.push({ name: "mobile-scene-avant-configurateur", ok: await page.evaluate(() => {
    const scene = document.querySelector(".v3-sector-scene");
    const buy = document.querySelector(".v3-sector-buy");
    return Boolean(scene && buy && (scene.compareDocumentPosition(buy) & Node.DOCUMENT_POSITION_FOLLOWING));
  }) });
  report.assertions.push({ name: "mobile-scene-complete", ok: await page.locator(".v3-sector-scene-background, .v3-sector-scene-support, .v3-sector-scene-screen").count() === 3 });
  await page.screenshot({ path: path.join(outputDir, "09-restaurant-mobile.png"), fullPage: true });
});
await mobileSector.close();

await browser.close();
report.ok = report.errors.length === 0 && report.assertions.every((assertion) => assertion.ok);
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
