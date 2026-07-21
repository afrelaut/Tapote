import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";

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
const assert = (name, ok, value) => report.assertions.push({ name, ok: Boolean(ok), ...(value === undefined ? {} : { value }) });

async function hydrateLazyAssets(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => { image.loading = "eager"; });
    const step = Math.max(500, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, { timeout: 15_000 });
  await page.waitForTimeout(180);
}

async function auditPage(context, pathname, name, action) {
  const page = await context.newPage();
  const pageErrors = [];
  page.on("console", (message) => { if (message.type() === "error") pageErrors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  const initialTitle = await page.title();
  await hydrateLazyAssets(page);
  if (action) await action(page);
  await hydrateLazyAssets(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const brokenImages = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).length);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const blockingA11y = accessibility.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
  report.pages.push({ name, pathname, status: response?.status(), title: initialTitle, overflow, brokenImages, accessibility: { violations: accessibility.violations.length, blocking: blockingA11y.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length, examples: nodes.slice(0, 6).map((node) => node.target) })) }, pageErrors });
  if (overflow > 1) report.errors.push(`${name}: débordement horizontal de ${overflow}px`);
  if (brokenImages) report.errors.push(`${name}: ${brokenImages} image(s) non chargée(s)`);
  if (blockingA11y.length) report.errors.push(`${name}: ${blockingA11y.length} violation(s) d’accessibilité sérieuse(s) ou critique(s)`);
  if (pageErrors.length) report.errors.push(...pageErrors.map((error) => `${name}: ${error}`));
  return page;
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const reset = await desktop.newPage();
await reset.goto(baseUrl, { waitUntil: "domcontentloaded" });
await reset.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await reset.close();

const home = await auditPage(desktop, "/", "Accueil desktop", async (page) => {
  assert("achat-direct-home", await page.getByRole("button", { name: /Ajouter ·/ }).first().isVisible());
  assert("trois-supports-home", await page.getByRole("button", { name: /Chevalet A6|Plaque 12|Carte NFC/ }).count() === 3);
  assert("scene-home-complete", await page.locator(".v3-home-product-scene .v3-sector-scene-background, .v3-home-product-scene .v3-sector-scene-support, .v3-home-product-scene .v3-sector-scene-screen").count() === 3);
  await page.screenshot({ path: path.join(outputDir, "01-home-desktop.png"), fullPage: true });
});
await home.close();

const shop = await auditPage(desktop, "/boutique", "Boutique desktop", async (page) => {
  assert("trois-supports-boutique", await page.locator(".v3-shop-card").count() === 3);
  assert("prix-et-actions-visibles", await page.locator(".v3-shop-card .v3-shop-card-price-chip").count() === 3 && await page.getByRole("button", { name: /Ajouter ·/ }).count() === 3);
  await page.getByRole("button", { name: /À votre image/i }).first().click();
  assert("custom-passe-par-fiche-produit", await page.getByRole("link", { name: "Personnaliser" }).count() === 3);
  await page.getByRole("button", { name: /Packs ·/ }).click();
  assert("deux-packs-merchandises", await page.locator(".v3-shop-packs article").count() === 2);
  const packLinks = await page.locator(".v3-shop-pack-configure").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  assert("packs-configures-avant-panier", packLinks.every((href) => href?.includes("mode=custom") && /count=(2|5)/.test(href)), packLinks);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outputDir, "02-shop-desktop.png"), fullPage: true });
});
await shop.close();

const directory = await auditPage(desktop, "/secteurs", "Annuaire secteurs", async (page) => {
  const count = await page.locator(".v3-sector-directory-grid > a").count();
  assert("secteurs-regroupes", count === 15, count);
  assert("scene-complete-par-secteur", await page.locator(".v3-sector-directory-grid > a .v3-sector-scene-background").count() === count && await page.locator(".v3-sector-directory-grid > a .v3-sector-scene-support").count() === count && await page.locator(".v3-sector-directory-grid > a .v3-sector-scene-screen").count() === count);
  await page.screenshot({ path: path.join(outputDir, "03-secteurs.png"), fullPage: true });
});
await directory.close();

const restaurant = await auditPage(desktop, "/secteurs/restaurants-traiteurs-food-trucks", "Secteur restaurant", async (page) => {
  const hero = page.locator(".v3-sector-scene");
  const backgroundBefore = await hero.locator(".v3-sector-scene-background").getAttribute("src");
  assert("restaurant-action-menu", await page.locator(".v3-sector-buy select").inputValue() === "menu");
  await page.locator(".v3-sector-buy").getByRole("button", { name: "Plaque", exact: true }).click();
  await page.locator(".v3-sector-buy select").selectOption("avis");
  await hero.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector(".v3-sector-hero .v3-sector-scene")?.classList.contains("is-surface-plaque"));
  assert("support-et-ecran-synchronises", await hero.evaluate((element) => element.classList.contains("is-surface-plaque")) && (await hero.locator(".v3-sector-scene-screen").getAttribute("class"))?.includes("is-action-avis"));
  assert("fond-stable", await hero.locator(".v3-sector-scene-background").getAttribute("src") === backgroundBefore);
  await page.screenshot({ path: path.join(outputDir, "04-restaurant.png"), fullPage: true });
});
await restaurant.close();

const drivingSchool = await auditPage(desktop, "/secteurs/auto-ecoles", "Secteur auto-écoles", async (page) => {
  assert("auto-ecole-fond-dedie", (await page.locator(".v3-sector-scene-background").getAttribute("src"))?.includes("bg-auto-ecole"));
  assert("auto-ecole-avis-par-defaut", await page.locator(".v3-sector-buy select").inputValue() === "avis");
});
await drivingSchool.close();

const custom = await auditPage(desktop, "/produits/chevalet?mode=custom&count=2&action=avis", "Pack personnalisé", async (page) => {
  const hero = page.locator(".v3-product-main-image");
  const floatingPurchase = page.locator(".v3-mobile-product-cta");
  assert("achat-flottant-desktop-visible", await floatingPurchase.isVisible());
  assert("reserve-cta-desktop", await page.locator(".v3-product-buy-column").evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom) >= 90));
  await page.getByLabel("Nom de votre entreprise").focus();
  await page.waitForTimeout(250);
  assert("cta-ne-masque-pas-la-personnalisation", await floatingPurchase.evaluate((element) => getComputedStyle(element).pointerEvents === "none" && Number.parseFloat(getComputedStyle(element).opacity) === 0));
  await page.getByLabel("Nom de votre entreprise").blur();
  await page.waitForTimeout(250);
  assert("cta-revient-apres-personnalisation", await floatingPurchase.isVisible());
  await page.getByRole("button", { name: "2 plaques", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".v3-product-main-image")?.classList.contains("is-surface-plaque"));
  assert("pack-deux-plaques-visible", await hero.evaluate((element) => element.classList.contains("is-surface-plaque")));
  assert("titre-pack-synchronise", (await page.title()).includes("Pack 2 plaques"));
  assert("breadcrumb-pack-synchronise", (await page.locator(".v3-breadcrumb").innerText()).includes("Pack 2 plaques") && !(await page.locator(".v3-breadcrumb").innerText()).includes("Chevalet A6"));
  assert("promesse-pack-synchronisee", (await page.locator(".v3-product-lead").innerText()).includes("2 plaques PMMA") && !(await page.locator(".v3-product-lead").innerText()).includes("À la caisse"));
  const packPrices = (await page.locator(".v3-product-price-line").innerText()).replace(/\s+/g, " ");
  assert("prix-pack-synchronises", /55\s*€/.test(packPrices) && /69\s*€/.test(packPrices), packPrices);
  assert("faits-pack-synchronises", (await page.locator(".v3-product-facts").innerText()).includes("2 plaques 12 × 12") && (await page.locator(".v3-product-facts").innerText()).includes("2 NFC + QR testés séparément"));
  assert("contenu-pack-synchronise", (await page.locator(".v3-product-details").innerText()).includes("2 supports imprimés") && !(await page.locator(".v3-product-details").innerText()).includes("1 chevalet, 1 insert"));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outputDir, "05a-pack-plaques-desktop.png") });
  await page.getByRole("button", { name: "1 + 1", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".v3-product-main-image")?.classList.contains("is-surface-mix"));
  assert("pack-mix-visible", await hero.evaluate((element) => element.classList.contains("is-surface-mix")) && await hero.locator(".v3-sector-scene-support-mix .v3-product-art").count() === 2);
  await hero.screenshot({ path: path.join(outputDir, "05-pack-mix-scene.png") });
  await page.getByLabel("Le lien à ouvrir").selectOption("instagram");
  await page.getByLabel("Nom de votre entreprise").fill("Maison Nova");
  const colors = page.locator('.v3-brand-colors input[type="color"]');
  assert("trois-couleurs-personnalisees", await colors.count() === 3);
  await colors.nth(0).fill("#173b57");
  await colors.nth(1).fill("#f4b942");
  await colors.nth(2).fill("#ffffff");
  await page.getByLabel("Brief de design").fill("Brief interne confidentiel — ne pas imprimer");
  await page.locator('.v3-logo-upload input[type="file"]').setInputFiles(path.resolve("public/brand/tapote-logo.svg"));
  await page.getByText("Prêt pour le BAT").waitFor();
  assert("brief-non-imprime", await hero.getByText("Brief interne confidentiel — ne pas imprimer").count() === 0);
  assert("url-configuration-partageable", /mode=custom/.test(page.url()) && /action=instagram/.test(page.url()) && /count=2/.test(page.url()) && /composition=mix/.test(page.url()), page.url());
  await page.reload({ waitUntil: "networkidle" });
  assert("brouillon-conserve", await page.getByLabel("Nom de votre entreprise").inputValue() === "Maison Nova" && await page.getByLabel("Brief de design").inputValue() === "Brief interne confidentiel — ne pas imprimer");
  assert("logo-conserve-apres-reload", await page.locator('.v3-product-main-image img[alt="Logo client importé"]').count() > 0);
  await page.locator(".v3-buybox-summary").getByRole("button", { name: /Ajouter au panier/i }).click();
  await page.getByRole("status").waitFor();
  assert("toast-pack-explicite", (await page.getByRole("status").innerText()).includes("2 supports") && (await page.getByRole("status").innerText()).includes("Instagram") && (await page.getByRole("status").innerText()).includes("1 chevalet + 1 plaque"));
  await page.goto(`${baseUrl}/panier`, { waitUntil: "networkidle" });
  assert("logo-visible-panier", await page.locator('.v3-cart-art img[alt="Logo client importé"]').count() === 1);
  assert("composition-visible-panier", (await page.locator(".v3-cart-copy").innerText()).includes("1 chevalet + 1 plaque"));
  await page.screenshot({ path: path.join(outputDir, "06-cart-custom.png"), fullPage: true });
  await page.getByRole("link", { name: /Continuer vers la commande/i }).click();
  await page.waitForURL((url) => url.pathname === "/commande");
  await page.getByRole("heading", { name: "Finalisez votre commande." }).waitFor();
  assert("checkout-professionnel-explicite", await page.locator('input[name="professionalCustomer"]').isVisible());
  assert("checkout-stripe-explicite", await page.getByText("Carte bancaire via Stripe", { exact: true }).isVisible());
  assert("logo-visible-checkout", await page.locator('.v3-checkout-lines img[alt="Logo client importé"]').count() === 1);
  await page.screenshot({ path: path.join(outputDir, "07-checkout-custom.png"), fullPage: true });
});
await custom.close();

const legal = await auditPage(desktop, "/cgv", "CGV", async (page) => {
  assert("cgv-structuree", await page.locator(".v3-legal-sections section").count() >= 7);
  assert("version-sans-duplication", !(await page.locator(".v3-legal-intro").innerText()).includes("Version Version"));
});
await legal.close();

const notFound = await auditPage(desktop, "/produits/inconnu", "Produit introuvable", async (page) => {
  assert("404-sans-crash", await page.getByRole("heading", { name: /Cette page n’existe pas/ }).isVisible());
  assert("404-noindex", await page.locator('meta[name="robots"]').getAttribute("content") === "noindex,nofollow");
});
await notFound.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobileHome = await auditPage(mobile, "/", "Accueil mobile", async (page) => {
  const buy = page.locator(".v3-commerce-buy");
  const scene = page.locator(".v3-commerce-visual");
  assert("achat-avant-visuel-mobile", await page.evaluate(() => {
    const first = document.querySelector(".v3-commerce-buy");
    const second = document.querySelector(".v3-commerce-visual");
    return Boolean(first && second && Number.parseInt(getComputedStyle(first).order, 10) < Number.parseInt(getComputedStyle(second).order, 10));
  }));
  assert("achat-mobile-visible", await buy.getByRole("button", { name: /Ajouter ·/ }).isVisible() && await scene.count() === 1);
  await page.screenshot({ path: path.join(outputDir, "08-home-mobile.png"), fullPage: true });
});
await mobileHome.close();

const mobileMenu = await auditPage(mobile, "/", "Navigation mobile", async (page) => {
  const toggle = page.getByRole("button", { name: "Ouvrir le menu" });
  await toggle.click();
  assert("menu-mobile-ouvert", await page.locator("body").evaluate((element) => element.classList.contains("v3-menu-open")));
  assert("liens-menu-mobile-visibles", await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link").count() === 5 && await page.getByRole("link", { name: "Acheter" }).isVisible());
  await page.screenshot({ path: path.join(outputDir, "08a-navigation-mobile.png") });
  await page.getByRole("button", { name: "Fermer le menu" }).click();
  assert("menu-mobile-referme", !(await page.locator("body").evaluate((element) => element.classList.contains("v3-menu-open"))));
});
await mobileMenu.close();

const mobileProduct = await auditPage(mobile, "/produits/chevalet?mode=custom&count=2&composition=plaques&action=instagram", "Produit mobile", async (page) => {
  const sticky = page.locator(".v3-mobile-product-cta");
  const stickyText = (await sticky.innerText()).replace(/\s+/g, " ");
  assert("cta-mobile-synchronise", await sticky.isVisible() && stickyText.includes("2 plaques") && /69\s*€/.test(stickyText) && stickyText.includes("Ajouter"), stickyText);
  assert("scene-mobile-plaque", await page.locator(".v3-product-main-image").evaluate((element) => element.classList.contains("is-surface-plaque")));
  assert("reserve-scroll-mobile", await page.locator(".v3-product-hero").evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom) >= 120));
  await page.screenshot({ path: path.join(outputDir, "09-product-mobile.png"), fullPage: true });
});
await mobileProduct.close();

const mobilePurchase = await auditPage(mobile, "/", "Achat mobile de bout en bout", async (page) => {
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Carte NFC/ }).click();
  await page.locator(".v3-commerce-buy select").selectOption("instagram");
  await page.waitForFunction(() => {
    const scene = document.querySelector(".v3-home-product-scene");
    return scene?.classList.contains("is-surface-carte") && scene.querySelector(".v3-sector-scene-screen")?.classList.contains("is-action-instagram");
  });
  assert("carte-et-instagram-synchronises-mobile", await page.locator(".v3-home-product-scene").evaluate((element) => element.classList.contains("is-surface-carte")));
  await page.getByRole("button", { name: /Ajouter · Instagram/ }).click();
  const notice = (await page.getByRole("status").innerText()).replace(/\s+/g, " ");
  assert("confirmation-ajout-mobile-explicite", notice.includes("Carte NFC") && notice.includes("Instagram"), notice);
  await page.goto(`${baseUrl}/panier`, { waitUntil: "networkidle" });
  const cartCopy = (await page.locator(".v3-cart-copy").innerText()).replace(/\s+/g, " ");
  assert("panier-mobile-coherent", cartCopy.includes("Carte NFC") && cartCopy.includes("Instagram") && /19\s*€/.test(cartCopy), cartCopy);
  await page.screenshot({ path: path.join(outputDir, "10-cart-mobile.png"), fullPage: true });
  await page.getByRole("link", { name: /Continuer vers la commande/i }).click();
  await page.waitForURL((url) => url.pathname === "/commande");
  await page.getByRole("heading", { name: "Finalisez votre commande." }).waitFor({ state: "visible", timeout: 10_000 });
  assert("commande-mobile-accessible", await page.locator('input[name="businessName"]').isVisible() && await page.locator('input[name="email"]').isVisible());
  await page.screenshot({ path: path.join(outputDir, "11-checkout-mobile.png"), fullPage: true });
});
await mobilePurchase.close();

const tablet = await browser.newContext({ viewport: { width: 744, height: 1133 }, deviceScaleFactor: 1 });
const tabletProduct = await auditPage(tablet, "/produits/plaque?mode=custom&count=2&composition=plaques&action=avis", "Produit tablette 744 px", async (page) => {
  const sticky = page.locator(".v3-mobile-product-cta");
  const stickyText = (await sticky.innerText()).replace(/\s+/g, " ");
  assert("cta-tablette-sans-zone-morte", await sticky.isVisible() && stickyText.includes("2 plaques") && /69\s*€/.test(stickyText), stickyText);
  assert("reserve-scroll-tablette", await page.locator(".v3-product-hero").evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom) >= 120));
  await page.screenshot({ path: path.join(outputDir, "12-product-tablet-744.png"), fullPage: true });
});
await tabletProduct.close();

const shortDesktop = await browser.newContext({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
const shortHome = await auditPage(shortDesktop, "/", "Accueil desktop 1365 × 768", async (page) => {
  const primaryCtas = page.locator(".v3-home-ctas");
  const inViewport = await primaryCtas.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= window.innerHeight;
  });
  assert("achat-principal-dans-le-premier-ecran", inViewport);
  assert("trois-supports-premier-ecran", await page.getByRole("button", { name: /Chevalet A6|Plaque 12|Carte NFC/ }).count() === 3);
  await page.screenshot({ path: path.join(outputDir, "13-home-1365x768.png") });
});
await shortHome.close();

await desktop.close();
await mobile.close();
await tablet.close();
await shortDesktop.close();
await browser.close();

report.ok = report.errors.length === 0 && report.assertions.every((assertion) => assertion.ok);
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
