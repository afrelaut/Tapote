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

const report = { baseUrl, pages: [], errors: [], assertions: [] };
const assert = (name, ok, value) => report.assertions.push({ name, ok: Boolean(ok), ...(value === undefined ? {} : { value }) });

async function mockLogoUpload(context) {
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
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, { timeout: 15_000 });
  await page.waitForTimeout(180);
}

// Vite, the catalogue request and lazy media can keep a local connection open
// longer than the UI needs. Prefer network-idle when it arrives, but never let
// one long-lived request block the entire visual audit.
async function settlePage(page) {
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(250);
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
  const spread = (key) => Math.max(...metrics.map((item) => item?.[key] ?? Infinity)) - Math.min(...metrics.map((item) => item?.[key] ?? -Infinity));
  const aligned = metrics.length === 3
    && metrics.every(Boolean)
    && ["height", "numberX", "numberY", "labelX", "labelY", "priceX", "priceY"].every((key) => spread(key) < 0.5)
    && metrics.every((item) => Math.abs(item.labelX - item.priceX) < 0.5);
  assert(`quantites-alignees-${name}`, aligned, metrics);
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

async function auditNarrowFilters(page, selector, name, minimumButtons) {
  const metrics = await page.evaluate(({ selector: filterSelector }) => {
    const container = document.querySelector(filterSelector);
    if (!container) return null;
    const containerBox = container.getBoundingClientRect();
    const buttons = [...container.querySelectorAll("button")].map((button) => {
      const box = button.getBoundingClientRect();
      return {
        text: button.textContent?.trim().replace(/\s+/g, " "),
        width: box.width,
        height: box.height,
        insidePage: box.left >= -1 && box.right <= document.documentElement.clientWidth + 1,
      };
    });
    const horizontalRails = [...container.querySelectorAll("div")].map((rail) => {
      const style = getComputedStyle(rail);
      return {
        overflowX: style.overflowX,
        scrollWidth: rail.scrollWidth,
        clientWidth: rail.clientWidth,
      };
    }).filter((rail) => rail.scrollWidth > rail.clientWidth + 1);
    return {
      ariaLabel: container.getAttribute("aria-label"),
      insidePage: containerBox.left >= -1 && containerBox.right <= document.documentElement.clientWidth + 1,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      buttons,
      overflowingRailsAreScrollable: horizontalRails.every((rail) => ["auto", "scroll"].includes(rail.overflowX)),
      horizontalRails,
    };
  }, { selector });
  const usable = Boolean(metrics)
    && Boolean(metrics.ariaLabel)
    && metrics.insidePage
    && metrics.pageOverflow <= 1
    && metrics.buttons.length >= minimumButtons
    && metrics.buttons.every((button) => button.text && button.height >= 44 && button.width <= 320)
    && metrics.overflowingRailsAreScrollable;
  assert(`filtres-utilisables-320-${name}`, usable, metrics);
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
  const brokenImages = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).length);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const blockingA11y = accessibility.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
  const relevantPageErrors = pageErrors.filter((error) => !(response?.status() === 404 && /status of 404/i.test(error)));
  report.pages.push({ name, pathname, status: response?.status(), title: initialTitle, overflow, brokenImages, accessibility: { violations: accessibility.violations.length, blocking: blockingA11y.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length, examples: nodes.slice(0, 6).map((node) => node.target) })) }, pageErrors: relevantPageErrors });
  if (overflow > 1) report.errors.push(`${name}: débordement horizontal de ${overflow}px`);
  if (brokenImages) report.errors.push(`${name}: ${brokenImages} image(s) non chargée(s)`);
  if (blockingA11y.length) report.errors.push(`${name}: ${blockingA11y.length} violation(s) d’accessibilité sérieuse(s) ou critique(s)`);
  if (relevantPageErrors.length) report.errors.push(...relevantPageErrors.map((error) => `${name}: ${error}`));
  return page;
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await mockLogoUpload(desktop);
const reset = await desktop.newPage();
await reset.goto(baseUrl, { waitUntil: "domcontentloaded" });
await reset.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await reset.close();

const home = await auditPage(desktop, "/", "Accueil desktop", async (page) => {
  assert("achat-direct-home", await page.getByRole("button", { name: /Ajouter le prêt/i }).isVisible());
  assert("trois-supports-home", await page.getByRole("button", { name: /Chevalet A6|Plaque 12|Carte NFC/ }).count() === 3);
  assert("scene-home-complete", await page.locator(".v3-home-product-scene .v3-sector-scene-background, .v3-home-product-scene .v3-sector-scene-support, .v3-home-product-scene .v3-sector-scene-screen").count() === 3);
  const offers = page.locator(".v3-offer-lines article");
  assert("offre-commerce-lisible-home", await offers.count() === 3 && await offers.filter({ hasText: "À VOTRE IMAGE · RECOMMANDÉ" }).count() === 1);
  assert("service-et-cta-final-home", await page.locator(".v3-why").getByRole("heading", { name: /Un objet prêt à servir/i }).isVisible() && await page.locator(".v3-home-final").getByRole("link", { name: /Créer mon Tapote/i }).isVisible());
  await page.screenshot({ path: path.join(outputDir, "01-home-desktop.png"), fullPage: true });
});
await home.close();

const shop = await auditPage(desktop, "/boutique", "Boutique desktop", async (page) => {
  assert("trois-supports-boutique", await page.locator(".v3-shop-card").count() === 3);
  assert("prix-et-actions-visibles", await page.locator(".v3-shop-card .v3-shop-card-price-chip").count() === 3 && await page.getByRole("button", { name: /Ajouter ·/ }).count() === 3);
  const previewGeometry = await page.locator(".v3-shop-card-image").evaluateAll((frames) => frames.map((frame) => {
    const scene = frame.querySelector(".v3-sector-scene");
    const frameBox = frame.getBoundingClientRect();
    const sceneBox = scene?.getBoundingClientRect();
    return sceneBox ? { square: Math.abs(sceneBox.width - sceneBox.height) < 1, coversFrame: sceneBox.width >= frameBox.width - 1 && sceneBox.height >= frameBox.height - 1, phones: scene.querySelectorAll(".v3-live-phone-svg").length } : null;
  }));
  assert("apercus-recadrent-photo-support-et-telephone-ensemble", previewGeometry.length === 3 && previewGeometry.every((item) => item?.coversFrame), previewGeometry);
  assert("une-seule-incrustation-par-apercu", previewGeometry.every((item) => item?.phones === 1), previewGeometry);
  const firstShopCard = page.locator(".v3-shop-card").first();
  const shopScene = firstShopCard.locator(".v3-sector-scene");
  await page.mouse.move(0, 0);
  const shopTransformBefore = await shopScene.evaluate((element) => getComputedStyle(element).transform);
  await firstShopCard.hover();
  await page.waitForTimeout(520);
  const shopHoverTransforms = await shopScene.evaluate((element) => ({
    scene: getComputedStyle(element).transform,
    background: getComputedStyle(element.querySelector(".v3-sector-scene-background")).transform,
    screen: getComputedStyle(element.querySelector(".v3-sector-scene-screen")).transform,
  }));
  assert("survol-boutique-scene-atomique", shopHoverTransforms.scene === shopTransformBefore && shopHoverTransforms.background === "none" && shopHoverTransforms.screen === "none", shopHoverTransforms);
  await firstShopCard.locator(".v3-shop-card-image").screenshot({ path: path.join(outputDir, "02a-shop-hover-atomic.png") });
  await page.getByRole("button", { name: /À votre image/i }).first().click();
  assert("custom-passe-par-fiche-produit", await page.getByRole("link", { name: "Personnaliser" }).count() === 3);
  await page.getByRole("button", { name: /Packs ·/ }).click();
  assert("deux-packs-merchandises", await page.locator(".v3-shop-packs article").count() === 2);
  assert("pack-cinq-clairement-recommande", await page.locator(".v3-shop-pack-card.is-best-value").count() === 1 && await page.getByText("LE PLUS RENTABLE", { exact: true }).count() === 1);
  const packContactCounts = await page.locator(".v3-pack-support-map").evaluateAll((maps) => maps.map((map) => map.children.length));
  assert("packs-rendus-concrets", packContactCounts.join(",") === "2,5", packContactCounts);
  const packJourneys = await page.locator(".v3-pack-support-map").allTextContents();
  assert("packs-racontent-un-parcours-commercial", packJourneys.some((copy) => copy.includes("Accueil") && copy.includes("Infos") && copy.includes("Caisse") && copy.includes("Avis")) && packJourneys.some((copy) => copy.includes("Tables") && copy.includes("Menu") && copy.includes("Sortie") && copy.includes("Fidélité")), packJourneys);
  assert("economies-packs-visibles", await page.locator(".v3-pack-saving").count() === 2);
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

const designs = await auditPage(desktop, "/designs", "Galerie designs", async (page) => {
  const specimens = page.locator(".v3-design-specimen");
  assert("bloc-promotionnel-designs-retire", await page.locator(".v3-designs-custom-cta").count() === 0);
  const links = await specimens.evaluateAll((items) => items.map((item) => item.getAttribute("href")));
  assert("dix-neuf-designs-disponibles", await specimens.count() === 19, await specimens.count());
  assert("designs-ouvrent-la-fiche-exacte", links.length === 19 && links.every((href) => href?.includes("mode=ready") && href.includes("design=") && href.includes("action=")), links);
  const purposeLabels = await specimens.locator(".device-purpose").allTextContents();
  assert("utilite-lisible-sur-chaque-design", purposeLabels.length === 19 && purposeLabels.every((label) => label.trim().split(/\s+/).length >= 2), purposeLabels);
  const tapCommands = await specimens.locator(".tap-zone-nfc strong").allTextContents();
  assert("signature-tapotez-coherente-sur-les-19-designs", tapCommands.length === 19 && tapCommands.every((label) => label.trim() === "Tapotez ici"), tapCommands);
  const campaignHeadlines = await specimens.locator(".device-headline").allTextContents();
  assert("signature-verbale-tapotez-sur-les-19-campagnes", campaignHeadlines.length === 19 && campaignHeadlines.every((label) => /Tapotez\.$/i.test(label.trim())), campaignHeadlines);
  const minimalActionZones = await specimens.locator('[data-template="minimal"] .tap-zone').evaluateAll((zones) => zones.map((zone) => ({
    background: getComputedStyle(zone).backgroundColor,
    color: getComputedStyle(zone).color,
  })));
  assert("zones-nfc-minimales-restent-visibles", minimalActionZones.length >= 3 && minimalActionZones.every(({ background }) => background !== "rgba(0, 0, 0, 0)" && background !== "transparent"), minimalActionZones);
  const variantSignals = await specimens.locator('[data-template="pulse"] .device-purpose, [data-template="signature"] .device-purpose').evaluateAll((nodes) => nodes.map((node) => ({
    template: node.closest("[data-template]")?.dataset.template,
    background: getComputedStyle(node).backgroundColor,
  })));
  assert("variantes-pulse-et-signature-visuellement-distinctes", new Set(variantSignals.map(({ background }) => background)).size >= 2, variantSignals);
  const physicalBounds = await specimens.locator(".device-preview-canonical").evaluateAll((previews) => previews.map((preview) => {
    const face = preview.querySelector(".product-face, .acrylic-sheet");
    const insert = preview.querySelector(".printed-insert");
    if (!face || !insert) return null;
    const faceBox = face.getBoundingClientRect();
    const insertBox = insert.getBoundingClientRect();
    return {
      left: insertBox.left - faceBox.left,
      top: insertBox.top - faceBox.top,
      right: faceBox.right - insertBox.right,
      bottom: faceBox.bottom - insertBox.bottom,
    };
  }));
  assert("incrustations-physiques-dans-leurs-supports", physicalBounds.length === 19 && physicalBounds.every((box) => box && Object.values(box).every((gap) => gap >= -1.5)), physicalBounds);
  assert("logos-officiels-sur-les-destinations-connues", await specimens.locator(".action-signature .platform-glyph").count() >= 7);
  assert("identite-de-marque-sur-chaque-support", await specimens.locator(".customer-brand .generated-brand-mark").count() === 19);
  const readyPhonePalettes = await specimens.locator(".v3-sector-scene-screen").evaluateAll((screens) => screens.map((screen) => ({
    primary: getComputedStyle(screen).getPropertyValue("--v3-phone-primary").trim(),
    accent: getComputedStyle(screen).getPropertyValue("--v3-phone-accent").trim(),
  })));
  assert("palettes-pretes-coherentes-sur-les-19-designs", readyPhonePalettes.length === 19
    && new Set(readyPhonePalettes.map(({ primary }) => primary)).size >= 4
    && new Set(readyPhonePalettes.map(({ accent }) => accent)).size >= 4,
  readyPhonePalettes);
  const firstSpecimen = specimens.first();
  const designScene = firstSpecimen.locator(".v3-sector-scene");
  await page.mouse.move(0, 0);
  const designTransformBefore = await designScene.evaluate((element) => getComputedStyle(element).transform);
  await firstSpecimen.hover();
  await page.waitForTimeout(580);
  const designHoverTransforms = await designScene.evaluate((element) => ({
    scene: getComputedStyle(element).transform,
    background: getComputedStyle(element.querySelector(".v3-sector-scene-background")).transform,
    screen: getComputedStyle(element.querySelector(".v3-sector-scene-screen")).transform,
  }));
  assert("survol-design-scene-atomique", designHoverTransforms.scene === designTransformBefore && designHoverTransforms.background === "none" && designHoverTransforms.screen === "none", designHoverTransforms);
  await firstSpecimen.locator(".v3-design-specimen-visual").screenshot({ path: path.join(outputDir, "03aa-design-hover-atomic.png") });
  await page.screenshot({ path: path.join(outputDir, "03a-designs.png"), fullPage: true });
});
await designs.close();

const readyTiktok = await auditPage(desktop, "/produits/plaque?mode=ready&design=tiktok&action=tiktok", "Design TikTok prêt à l’emploi", async (page) => {
  const scene = page.locator(".v3-product-main-image");
  const supportCopy = (await scene.locator(".v3-sector-scene-support").innerText()).replace(/\s+/g, " ");
  const phoneCopy = (await scene.locator(".v3-sector-scene-screen").innerText()).replace(/\s+/g, " ");
  assert("tiktok-selectionne", await page.getByLabel("Le lien à ouvrir").inputValue() === "tiktok");
  assert("preset-tiktok-conserve", supportCopy.includes("LIGNE NOIRE") && supportCopy.includes("La suite ? Tapotez."), supportCopy);
  assert("iphone-tiktok-synchronise", phoneCopy.includes("Pour toi") && phoneCopy.includes("LIGNE NOIRE"), phoneCopy);
  assert("style-tiktok-conserve", (await page.locator(".v3-campaign-design-note").innerText()).includes("La suite ? Tapotez."));
  await scene.screenshot({ path: path.join(outputDir, "03b-design-tiktok.png") });
  await page.getByLabel("Le lien à ouvrir").selectOption("facebook");
  await page.waitForURL((url) => !url.searchParams.has("design") && url.searchParams.get("action") === "facebook");
  assert("changement-action-retire-le-preset-fige", !page.url().includes("design=") && page.url().includes("action=facebook"), page.url());
});
await readyTiktok.close();

const readyMinimal = await auditPage(desktop, "/produits/plaque?mode=ready&design=avis-minimal&action=avis", "Design Minimal prêt à l’emploi", async (page) => {
  const scene = page.locator(".v3-product-main-image");
  const supportCopy = (await scene.locator(".v3-sector-scene-support").innerText()).replace(/\s+/g, " ");
  assert("preset-minimal-compose-sur-le-master", await scene.locator('.printed-insert.insert-style-campaign[data-template="minimal"]').count() === 1);
  assert("preset-minimal-conserve", supportCopy.includes("MAISON CALME") && supportCopy.includes("Dites-nous tout."), supportCopy);
  assert("iphone-avis-synchronise", (await scene.locator(".v3-sector-scene-screen").innerText()).includes("Avis Google"));
});
await readyMinimal.close();

const readyTip = await auditPage(desktop, "/produits/chevalet?mode=ready&design=pourboire&action=pourboire", "Design Pourboire prêt à l’emploi", async (page) => {
  const scene = page.locator(".v3-product-main-image");
  const supportCopy = (await scene.locator(".v3-sector-scene-support").innerText()).replace(/\s+/g, " ");
  const phoneCopy = (await scene.locator(".v3-sector-scene-screen").innerText()).replace(/\s+/g, " ");
  assert("pourboire-selectionne", await page.getByLabel("Le lien à ouvrir").inputValue() === "pourboire");
  assert("preset-pourboire-conserve", supportCopy.includes("CAFÉ NOMA") && supportCopy.includes("Un merci ? Tapotez."), supportCopy);
  assert("iphone-pourboire-synchronise", phoneCopy.includes("POURBOIRE") && phoneCopy.includes("CAFÉ NOMA"), phoneCopy);
});
await readyTip.close();

const restaurant = await auditPage(desktop, "/secteurs/restaurants-traiteurs-food-trucks", "Secteur restaurant", async (page) => {
  const hero = page.locator(".v3-sector-scene");
  const actionSelect = page.locator(".v3-sector-buy select");
  const backgroundBefore = await hero.locator(".v3-sector-scene-background").getAttribute("src");
  assert("restaurant-action-menu", await actionSelect.inputValue() === "menu");
  await page.locator(".v3-sector-buy").getByRole("button", { name: "Plaque", exact: true }).click();
  await actionSelect.selectOption("avis");
  await hero.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector(".v3-sector-hero .v3-sector-scene")?.classList.contains("is-surface-plaque"));
  assert("support-et-ecran-synchronises", await hero.evaluate((element) => element.classList.contains("is-surface-plaque")) && (await hero.locator(".v3-sector-scene-screen").getAttribute("class"))?.includes("is-action-avis"));
  assert("fond-stable", await hero.locator(".v3-sector-scene-background").getAttribute("src") === backgroundBefore);
  await page.screenshot({ path: path.join(outputDir, "04-restaurant.png"), fullPage: true });

  const actionValues = await actionSelect.locator("option").evaluateAll((options) => options.map((option) => option.value));
  const bottomChecks = [];
  for (const actionId of actionValues) {
    await actionSelect.selectOption(actionId);
    await page.waitForFunction((expected) => document.querySelector(".v3-sector-hero .v3-live-phone-screen")?.classList.contains(`is-action-${expected}`), actionId);
    bottomChecks.push(await hero.evaluate((element) => {
      const screen = element.querySelector(".v3-live-phone-screen");
      const ui = element.querySelector(".v3-live-phone-ui");
      const home = element.querySelector(".v3-live-phone-home");
      const foreignObject = element.querySelector("foreignObject");
      const uiRect = ui?.getBoundingClientRect();
      const homeRect = home?.getBoundingClientRect();
      return {
        action: [...(screen?.classList || [])].find((className) => className.startsWith("is-action-")),
        clipped: Boolean(foreignObject && getComputedStyle(foreignObject).clipPath !== "none"),
        uiClipsContent: ui ? getComputedStyle(ui).overflow === "hidden" : false,
        homeInsideScreen: Boolean(uiRect && homeRect && homeRect.left >= uiRect.left - 3 && homeRect.right <= uiRect.right + 3 && homeRect.top >= uiRect.top - 3 && homeRect.bottom <= uiRect.bottom + 3),
      };
    }));
  }
  assert("tous-les-ecrans-dynamiques-gardent-un-bas-securise", actionValues.length >= 17 && bottomChecks.every((check) => check.clipped && check.uiClipsContent && check.homeInsideScreen), bottomChecks);
  await actionSelect.selectOption("avis");
});
await restaurant.close();

const drivingSchool = await auditPage(desktop, "/secteurs/auto-ecoles", "Secteur auto-écoles", async (page) => {
  assert("auto-ecole-fond-dedie", (await page.locator(".v3-sector-scene-background").getAttribute("src"))?.includes("bg-auto-ecole"));
  assert("auto-ecole-avis-par-defaut", await page.locator(".v3-sector-buy select").inputValue() === "avis");
});
await drivingSchool.close();

const sectorPhoneMatrix = [
  ["cafe", "cafes-bars", "cafe"],
  ["restaurant", "restaurants-traiteurs-food-trucks", "restaurant"],
  ["boulangerie", "boulangeries-patisseries", "boulangerie"],
  ["salon", "beaute-coiffure-bien-etre", "salon"],
  ["cabinet_medical", "cabinets-medicaux-paramedicaux", "medical"],
  ["boutique", "boutiques-commerces", "boutique"],
  ["hotel", "hebergements-tourisme", "hotel"],
  ["auto_ecole", "auto-ecoles", "auto-ecole"],
  ["garage", "garages-mobilite", "garage"],
  ["artisan", "artisans-services-terrain", "artisan"],
  ["immobilier", "agences-independants", "immobilier"],
  ["salle_sport", "sport-studios", "sport"],
  ["coworking", "bureaux-formation", "coworking"],
  ["evenement", "evenements-culture-associations", "evenement"],
  ["veterinaire", "animaux-soins", "veterinaire"],
];

for (const [index, [sectorId, slug, mediaStem]] of sectorPhoneMatrix.entries()) {
  const page = await desktop.newPage();
  const response = await page.goto(`${baseUrl}/secteurs/${slug}`, { waitUntil: "domcontentloaded" });
  await settlePage(page);
  const scene = page.locator(".v3-sector-hero .v3-sector-scene");
  await scene.waitFor({ state: "visible" });
  const screen = scene.locator(".v3-live-phone-screen");
  const ui = scene.locator(".v3-live-phone-ui");
  assert(`secteur-${sectorId}-charge`, response?.ok());
  assert(`secteur-${sectorId}-dynamique`, await screen.getAttribute("data-phone-sector") === sectorId);
  assert(`secteur-${sectorId}-projection-et-masque`, await ui.evaluate((element) => getComputedStyle(element).transform.startsWith("matrix3d")) && Boolean(await scene.locator("foreignObject").getAttribute("clip-path")));
  const bottomSafety = await scene.evaluate((element) => {
    const phoneScreen = element.querySelector(".v3-live-phone-screen");
    const phoneUi = element.querySelector(".v3-live-phone-ui");
    const home = element.querySelector(".v3-live-phone-home");
    const foreignObject = element.querySelector("foreignObject");
    const sceneRect = element.getBoundingClientRect();
    const screenRect = phoneScreen?.getBoundingClientRect();
    const uiRect = phoneUi?.getBoundingClientRect();
    const homeRect = home?.getBoundingClientRect();
    return {
      clipped: Boolean(foreignObject && getComputedStyle(foreignObject).clipPath !== "none"),
      uiClipsContent: phoneUi ? getComputedStyle(phoneUi).overflow === "hidden" : false,
      screenInsideScene: Boolean(screenRect && screenRect.left >= sceneRect.left - 2 && screenRect.right <= sceneRect.right + 2 && screenRect.top >= sceneRect.top - 2 && screenRect.bottom <= sceneRect.bottom + 2),
      homeInsideScreen: Boolean(uiRect && homeRect && homeRect.left >= uiRect.left - 3 && homeRect.right <= uiRect.right + 3 && homeRect.top >= uiRect.top - 3 && homeRect.bottom <= uiRect.bottom + 3),
    };
  });
  assert(`secteur-${sectorId}-bas-ecran-securise`, bottomSafety.clipped && bottomSafety.uiClipsContent && bottomSafety.screenInsideScene && bottomSafety.homeInsideScreen, bottomSafety);
  await page.locator(".v3-sector-buy select").selectOption("instagram");
  await scene.locator(".v3-instagram-app").waitFor({ state: "visible" });
  await page.waitForTimeout(280);
  const postImages = await scene.locator(".v3-live-social-grid i").evaluateAll((items) => items.map((item) => getComputedStyle(item).getPropertyValue("--v3-phone-post-image")));
  const expectedMedia = sectorId === "restaurant" ? "/assets/phone/restaurant-" : `/assets/phone/sector-${mediaStem}-media-v1.webp`;
  assert(`secteur-${sectorId}-media-dedie`, postImages.length > 0 && postImages.every((value) => value.includes(expectedMedia)), postImages);
  await scene.screenshot({ path: path.join(outputDir, `04-sector-${String(index + 1).padStart(2, "0")}-${sectorId}.png`) });
  await page.close();
}

const custom = await auditPage(desktop, "/produits/chevalet?mode=custom&count=2&action=avis", "Pack personnalisé", async (page) => {
  const hero = page.locator(".v3-product-main-image");
  const floatingPurchase = page.locator(".v3-mobile-product-cta");
  const finishPrices = (await page.locator(".v3-design-choice").innerText()).replace(/\s+/g, " ");
  assert("prix-finitions-correspondent-au-pack-selectionne", /Prêt à l’emploi.*55\s*€/.test(finishPrices) && /Studio en direct.*69\s*€/.test(finishPrices), finishPrices);
  await auditQuantityAlignment(page, "desktop");
  assert("achat-flottant-desktop-retire-pour-liberer-les-criteres", !(await floatingPurchase.isVisible()));
  assert("reserve-cta-desktop", await page.locator(".v3-product-buy-column").evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom) >= 90));
  await page.getByLabel("Nom de votre entreprise").focus();
  await page.waitForTimeout(250);
  assert("cta-ne-masque-pas-la-personnalisation", !(await floatingPurchase.isVisible()));
  await page.getByLabel("Nom de votre entreprise").blur();
  await page.waitForTimeout(250);
  assert("cta-reste-reserve-au-mobile", !(await floatingPurchase.isVisible()));
  await page.getByRole("button", { name: "2 plaques", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".v3-product-main-image")?.classList.contains("is-surface-plaque"));
  assert("pack-deux-plaques-visible", await hero.evaluate((element) => element.classList.contains("is-surface-plaque")));
  assert("titre-pack-synchronise", (await page.title()).includes("Pack 2 plaques"));
  assert("breadcrumb-pack-synchronise", (await page.locator(".v3-breadcrumb").innerText()).includes("Pack 2 plaques") && !(await page.locator(".v3-breadcrumb").innerText()).includes("Chevalet A6"));
  assert("promesse-pack-synchronisee", (await page.locator(".v3-product-lead").innerText()).includes("2 plaques PMMA") && !(await page.locator(".v3-product-lead").innerText()).includes("À la caisse"));
  const packPrices = (await page.locator(".v3-product-price-line").innerText()).replace(/\s+/g, " ");
  assert("prix-pack-synchronises", /55\s*€/.test(packPrices) && /69\s*€/.test(packPrices), packPrices);
  assert("faits-pack-synchronises", (await page.locator(".v3-product-facts").innerText()).includes("2 plaques 12 × 12") && (await page.locator(".v3-product-facts").innerText()).includes("2 NFC encodés + 2 QR contrôlés"));
  assert("contenu-pack-synchronise", (await page.locator(".v3-product-details").innerText()).includes("2 supports imprimés") && !(await page.locator(".v3-product-details").innerText()).includes("1 chevalet, 1 insert"));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outputDir, "05a-pack-plaques-desktop.png") });
  await page.getByRole("button", { name: "1 chevalet + 1 plaque", exact: true }).click();
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
  await page.getByLabel("Message principal imprimé").fill("Découvrez Maison Nova");
  await page.getByLabel("Phrase secondaire imprimée").fill("Nos nouveautés et nos coulisses");
  await page.getByLabel("Appel à l’action imprimé").fill("Suivez-nous");
  await page.getByLabel("Adresse exacte à ouvrir").fill("https://instagram.com/maisonnova");
  await page.locator('.v3-logo-upload input[type="file"]').setInputFiles(path.resolve("public/icon-512.png"));
  await page.getByText("Affiché dans l’aperçu").waitFor();
  assert("logo-incruste-dans-iphone", await hero.locator(".v3-sector-scene-screen .v3-live-brand-avatar img").count() >= 1);
  assert("marque-synchronisee-support-iphone", await hero.getByText("Maison Nova").count() >= 2);
  const phoneTheme = await hero.locator(".v3-sector-scene-screen").evaluate((element) => ({
    primary: getComputedStyle(element).getPropertyValue("--v3-phone-primary").trim(),
    accent: getComputedStyle(element).getPropertyValue("--v3-phone-accent").trim(),
    copy: getComputedStyle(element).getPropertyValue("--v3-phone-copy").trim(),
  }));
  assert("couleurs-synchronisees-dans-iphone", phoneTheme.primary === "#173b57" && phoneTheme.accent === "#173b57" && phoneTheme.copy === "#173b57", phoneTheme);
  await page.getByRole("button", { name: /Prêt à l’emploi/i }).click();
  await page.waitForTimeout(220);
  const readyIdentity = await hero.evaluate((element) => ({
    uploadedLogos: element.querySelectorAll('img[alt="Logo client importé"]').length,
    supportBrands: [...element.querySelectorAll(".customer-brand b")].map((node) => node.textContent),
    phoneCopy: element.querySelector(".v3-live-phone-screen")?.textContent,
  }));
  assert("retour-ready-restaure-identite-mockup", readyIdentity.uploadedLogos === 0
    && readyIdentity.supportBrands.every((name) => name === "CAFÉ NOMA")
    && readyIdentity.phoneCopy?.includes("CAFÉ NOMA"),
  readyIdentity);
  await page.getByRole("button", { name: /Studio en direct/i }).click();
  await hero.locator(".v3-live-brand-avatar img").first().waitFor({ state: "visible" });
  assert("retour-custom-restaure-logo-et-marque", await hero.locator('.customer-brand img[alt="Logo client importé"]').count() >= 1 && await hero.getByText("Maison Nova").count() >= 2);
  assert("textes-studio-imprimes", await hero.getByText("Découvrez Maison Nova").count() >= 1 && await hero.getByText("Nos nouveautés et nos coulisses").count() >= 1 && await hero.getByText("Suivez-nous").count() >= 1);
  assert("url-configuration-partageable", /mode=custom/.test(page.url()) && /action=instagram/.test(page.url()) && /count=2/.test(page.url()) && /composition=mix/.test(page.url()), page.url());
  await page.reload({ waitUntil: "domcontentloaded" });
  await settlePage(page);
  assert("brouillon-conserve", await page.getByLabel("Nom de votre entreprise").inputValue() === "Maison Nova" && await page.getByLabel("Message principal imprimé").inputValue() === "Découvrez Maison Nova" && await page.getByLabel("Adresse exacte à ouvrir").inputValue() === "https://instagram.com/maisonnova");
  assert("logo-conserve-apres-reload", await page.locator('.v3-product-main-image img[alt="Logo client importé"]').count() > 0);
  assert("logo-iphone-conserve-apres-reload", await page.locator(".v3-product-main-image .v3-sector-scene-screen .v3-live-brand-avatar img").count() >= 1);
  await page.locator(".v3-buybox-summary").getByRole("button", { name: /Ajouter au panier/i }).click();
  await page.getByRole("status").waitFor();
  assert("toast-pack-explicite", (await page.getByRole("status").innerText()).includes("2 supports") && (await page.getByRole("status").innerText()).includes("Instagram") && (await page.getByRole("status").innerText()).includes("1 chevalet + 1 plaque"));
  await page.goto(`${baseUrl}/panier`, { waitUntil: "domcontentloaded" });
  await settlePage(page);
  assert("logo-visible-panier", await page.locator('.v3-cart-art img[alt="Logo client importé"]').count() === 1);
  assert("composition-visible-panier", (await page.locator(".v3-cart-copy").innerText()).includes("1 chevalet + 1 plaque"));
  const cartConfiguration = await page.evaluate(() => {
    const line = document.querySelector(".v3-cart-line");
    if (!line) return null;
    const copy = line.querySelector(".v3-cart-copy")?.textContent?.trim().replace(/\s+/g, " ") || "";
    const edit = [...line.querySelectorAll("a, button")].find((control) => /^Modifier\b/i.test(control.textContent?.trim() || ""));
    return {
      copy,
      hasDestination: /Instagram/i.test(copy),
      hasPersonalization: /Maison Nova|À VOTRE IMAGE|personnalis/i.test(copy),
      edit: edit ? {
        tag: edit.tagName.toLowerCase(),
        text: edit.textContent?.trim().replace(/\s+/g, " "),
        href: edit.getAttribute("href"),
      } : null,
    };
  });
  assert("panier-resume-destination-et-personnalisation", Boolean(cartConfiguration?.hasDestination && cartConfiguration?.hasPersonalization), cartConfiguration);
  assert("panier-propose-modifier", Boolean(cartConfiguration?.edit), cartConfiguration?.edit);
  assert("modifier-revient-a-la-configuration", Boolean(cartConfiguration?.edit?.tag === "button"
    || (cartConfiguration?.edit?.href?.includes("/produits/")
      && cartConfiguration.edit.href.includes("mode=custom")
      && cartConfiguration.edit.href.includes("action=instagram"))),
  cartConfiguration?.edit);
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

const notFound = await auditPage(desktop, "/produits/inconnu", "Produit introuvable", async (page, response) => {
  const httpStatus = response?.status();
  assert("404-http-reel-produit-inconnu", httpStatus === undefined || httpStatus === 404, httpStatus ?? "statut indisponible");
  assert("404-sans-crash", await page.getByRole("heading", { name: /Cette page n’existe pas/ }).isVisible());
  assert("404-noindex", await page.locator('meta[name="robots"]').getAttribute("content") === "noindex,nofollow");
});
await notFound.close();

const unknownRoute = await auditPage(desktop, "/page-inexistante-audit-ecommerce", "Route publique introuvable", async (page, response) => {
  const httpStatus = response?.status();
  assert("404-http-reel-route-inconnue", httpStatus === undefined || httpStatus === 404, httpStatus ?? "statut indisponible");
  assert("404-route-generique-sans-crash", await page.locator("body").evaluate((element) => /page n.existe pas|introuvable|404/i.test(element.innerText)));
  assert("404-route-generique-noindex", await page.locator('meta[name="robots"]').getAttribute("content") === "noindex,nofollow");
});
await unknownRoute.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await mockLogoUpload(mobile);
const mobileHome = await auditPage(mobile, "/", "Accueil mobile", async (page) => {
  const buy = page.locator(".v3-commerce-buy");
  const scene = page.locator(".v3-commerce-visual");
  assert("achat-avant-visuel-mobile", await page.evaluate(() => {
    const first = document.querySelector(".v3-commerce-buy");
    const second = document.querySelector(".v3-commerce-visual");
    return Boolean(first && second && Number.parseInt(getComputedStyle(first).order, 10) < Number.parseInt(getComputedStyle(second).order, 10));
  }));
  assert("achat-mobile-visible", await buy.getByRole("button", { name: /Ajouter le prêt/i }).isVisible() && await scene.count() === 1);
  const firstViewportCommerce = await page.evaluate(() => {
    const measure = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
      return {
        selector,
        top: box.top,
        bottom: box.bottom,
        height: box.height,
        visibleHeight,
        fullyVisible: box.top >= 0 && box.bottom <= innerHeight,
        meaningfullyVisible: visibleHeight >= Math.min(120, box.height * 0.2),
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 180),
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      price: measure(".v3-home-price"),
      cta: measure(".v3-home-ctas a"),
      visual: measure(".v3-commerce-visual"),
    };
  });
  assert("premier-ecran-mobile-prix-cta-visuel", Boolean(firstViewportCommerce.price?.fullyVisible
    && firstViewportCommerce.cta?.fullyVisible
    && firstViewportCommerce.visual?.meaningfullyVisible
    && /€/.test(firstViewportCommerce.price.text)),
  firstViewportCommerce);
  await page.screenshot({ path: path.join(outputDir, "08-home-mobile.png"), fullPage: true });
});
await mobileHome.close();

const mobileMenu = await auditPage(mobile, "/", "Navigation mobile", async (page) => {
  const toggle = page.getByRole("button", { name: "Ouvrir le menu" });
  const toggleCount = await toggle.count();
  assert("declencheur-menu-mobile-unique", toggleCount === 1, toggleCount);
  if (toggleCount !== 1) return;
  await toggle.focus();
  await toggle.press("Enter");
  await page.waitForTimeout(120);
  assert("menu-mobile-ouvert", await page.locator("body").evaluate((element) => element.classList.contains("v3-menu-open")));
  assert("liens-menu-mobile-visibles", await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link").count() === 6 && await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Créer mon Tapote" }).isVisible());
  const menuLinkCount = await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link").count();
  const focusPath = [];
  for (let index = 0; index < menuLinkCount + 2; index += 1) {
    await page.keyboard.press("Tab");
    focusPath.push(await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tag: active?.tagName.toLowerCase(),
        text: active?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
        label: active?.getAttribute("aria-label"),
        insideMenu: Boolean(active?.closest('nav[aria-label="Navigation principale"]')),
        isToggle: Boolean(active?.classList.contains("v3-mobile-toggle")),
      };
    }));
  }
  await page.keyboard.press("Shift+Tab");
  focusPath.push(await page.evaluate(() => {
    const active = document.activeElement;
    return {
      tag: active?.tagName.toLowerCase(),
      text: active?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
      label: active?.getAttribute("aria-label"),
      insideMenu: Boolean(active?.closest('nav[aria-label="Navigation principale"]')),
      isToggle: Boolean(active?.classList.contains("v3-mobile-toggle")),
    };
  }));
  assert("menu-clavier-sans-fuite-focus", focusPath.length > 0 && focusPath.every((step) => step.insideMenu || step.isToggle), focusPath);
  await page.screenshot({ path: path.join(outputDir, "08a-navigation-mobile.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  const menuCloseState = await page.evaluate(() => ({
    closed: !document.body.classList.contains("v3-menu-open"),
    focusReturned: Boolean(document.activeElement?.classList.contains("v3-mobile-toggle")),
  }));
  assert("menu-echap-et-retour-focus", menuCloseState.closed && menuCloseState.focusReturned, menuCloseState);
});
await mobileMenu.close();

const mobileProduct = await auditPage(mobile, "/produits/chevalet?mode=custom&count=2&composition=plaques&action=instagram", "Produit mobile", async (page) => {
  const sticky = page.locator(".v3-mobile-product-cta");
  const gallery = page.locator(".v3-product-live-gallery");
  await auditQuantityAlignment(page, "mobile");
  const stickyText = (await sticky.innerText()).replace(/\s+/g, " ");
  assert("cta-mobile-synchronise", await sticky.isVisible() && stickyText.includes("2 plaques") && /69\s*€/.test(stickyText) && stickyText.includes("Ajouter"), stickyText);
  assert("scene-mobile-plaque", await page.locator(".v3-product-main-image").evaluate((element) => element.classList.contains("is-surface-plaque")));
  assert("reserve-scroll-mobile", await page.locator(".v3-product-hero").evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom) >= 120));
  const mobileLayout = await page.evaluate(() => {
    const galleryElement = document.querySelector(".v3-product-live-gallery");
    const buyboxElement = document.querySelector(".v3-product-buy-column > .v3-buybox");
    const titleElement = document.querySelector(".v3-product-buy-column > h1");
    const galleryBox = galleryElement?.getBoundingClientRect();
    return {
      galleryPosition: galleryElement ? getComputedStyle(galleryElement).position : null,
      galleryWidth: galleryBox?.width || 0,
      configuratorBeforeEditorial: Boolean(buyboxElement && titleElement && buyboxElement.getBoundingClientRect().top < titleElement.getBoundingClientRect().top),
    };
  });
  assert("apercu-mobile-compact-et-collant", mobileLayout.galleryPosition === "sticky" && mobileLayout.galleryWidth <= 302, mobileLayout);
  assert("configurateur-mobile-avant-editorial", mobileLayout.configuratorBeforeEditorial, mobileLayout);
  assert("contexte-apercu-mobile-dynamique", (await page.locator(".v3-mobile-preview-context").innerText()).includes("Instagram"));
  const collapsedWidth = await gallery.evaluate((element) => element.getBoundingClientRect().width);
  await page.getByRole("button", { name: "Agrandir", exact: true }).click();
  await page.waitForTimeout(320);
  const expandedWidth = await gallery.evaluate((element) => element.getBoundingClientRect().width);
  assert("apercu-mobile-agrandissable", expandedWidth >= collapsedWidth + 25, { collapsedWidth, expandedWidth });
  await page.getByRole("button", { name: "Réduire", exact: true }).click();
  await page.getByLabel("Le lien à ouvrir", { exact: true }).selectOption("facebook");
  await page.waitForFunction(() => document.querySelector(".v3-product-main-image .v3-live-phone-screen")?.classList.contains("is-action-facebook"));
  const visibleParameter = page.locator(".v3-brand-colors input").first();
  await visibleParameter.scrollIntoViewIfNeeded();
  const sameViewport = await page.evaluate(() => {
    const preview = document.querySelector(".v3-product-live-gallery")?.getBoundingClientRect();
    const parameter = document.querySelector(".v3-brand-colors input")?.getBoundingClientRect();
    return Boolean(preview && parameter && preview.top >= 0 && preview.bottom <= innerHeight && parameter.top >= 0 && parameter.bottom <= innerHeight);
  });
  assert("produit-et-parametre-visibles-ensemble", sameViewport);
  assert("destination-synchronisee-dans-apercu-mobile", (await page.locator(".v3-mobile-preview-context").innerText()).includes("Facebook"));
  await page.screenshot({ path: path.join(outputDir, "09-product-mobile.png"), fullPage: true });
});
await mobileProduct.close();

const mobileSector = await auditPage(mobile, "/secteurs/hebergements-tourisme", "Secteur mobile orienté achat", async (page) => {
  const firstViewport = await page.evaluate(() => {
    const sectorBuy = document.querySelector(".v3-sector-buy");
    const choiceRows = sectorBuy?.querySelectorAll(".v3-choice-row") || [];
    const elements = [["scene", document.querySelector(".v3-sector-image")], ["design", sectorBuy?.querySelector(".v3-design-choice")], ["supports", choiceRows[0]], ["quantite", sectorBuy?.querySelector(".v3-quantity-choice")], ["composition", choiceRows[1]]];
    return elements.map(([selector, element]) => {
      const box = element?.getBoundingClientRect();
      return { selector, visible: Boolean(box && box.top < innerHeight && box.bottom > 0), top: box?.top, bottom: box?.bottom };
    });
  });
  assert("secteur-mobile-apercu-et-criteres-directs", firstViewport.every((item) => item.visible), firstViewport);
  assert("supports-secteur-mobile-sur-une-ligne", await page.locator(".v3-sector-buy .v3-choice-row").first().evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length === 3));
  await page.screenshot({ path: path.join(outputDir, "09a-sector-mobile-commerce.png"), fullPage: true });
});
await mobileSector.close();

const mobilePurchase = await auditPage(mobile, "/", "Achat mobile de bout en bout", async (page) => {
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: "domcontentloaded" });
  await settlePage(page);
  await page.getByRole("button", { name: /Carte NFC/ }).click();
  await page.locator(".v3-commerce-buy select").selectOption("instagram");
  await page.waitForFunction(() => {
    const scene = document.querySelector(".v3-home-product-scene");
    return scene?.classList.contains("is-surface-carte") && scene.querySelector(".v3-sector-scene-screen")?.classList.contains("is-action-instagram");
  });
  assert("carte-et-instagram-synchronises-mobile", await page.locator(".v3-home-product-scene").evaluate((element) => element.classList.contains("is-surface-carte")));
  await page.getByRole("button", { name: /Ajouter le prêt/i }).click();
  const notice = (await page.getByRole("status").innerText()).replace(/\s+/g, " ");
  assert("confirmation-ajout-mobile-explicite", notice.includes("Carte NFC") && notice.includes("Instagram"), notice);
  await page.goto(`${baseUrl}/panier`, { waitUntil: "domcontentloaded" });
  await settlePage(page);
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
await mockLogoUpload(tablet);
const tabletProduct = await auditPage(tablet, "/produits/plaque?mode=custom&count=2&composition=plaques&action=avis", "Produit tablette 744 px", async (page) => {
  const sticky = page.locator(".v3-mobile-product-cta");
  await auditQuantityAlignment(page, "tablette");
  const stickyText = (await sticky.innerText()).replace(/\s+/g, " ");
  assert("cta-tablette-sans-zone-morte", await sticky.isVisible() && stickyText.includes("2 plaques") && /69\s*€/.test(stickyText), stickyText);
  assert("reserve-scroll-tablette", await page.locator(".v3-product-hero").evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom) >= 120));
  await page.screenshot({ path: path.join(outputDir, "12-product-tablet-744.png"), fullPage: true });
});
await tabletProduct.close();

const shortDesktop = await browser.newContext({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
await mockLogoUpload(shortDesktop);
const shortHome = await auditPage(shortDesktop, "/", "Accueil desktop 1365 × 768", async (page) => {
  const primaryCtas = page.locator(".v3-home-ctas");
  const inViewport = await primaryCtas.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= window.innerHeight;
  });
  assert("achat-principal-dans-le-premier-ecran", inViewport);
  assert("configurateur-accueil-entierement-visible", await page.locator(".v3-home-quick-buy").evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight;
  }));
  assert("trois-supports-premier-ecran", await page.getByRole("button", { name: /Chevalet A6|Plaque 12|Carte NFC/ }).count() === 3);
  await page.screenshot({ path: path.join(outputDir, "13-home-1365x768.png") });
});
await shortHome.close();

const shortSector = await auditPage(shortDesktop, "/secteurs/hebergements-tourisme", "Secteur desktop 1365 × 768", async (page) => {
  const criteria = await page.locator(".v3-sector-buy").evaluate((element) => {
    const rows = element.querySelectorAll(".v3-choice-row");
    return [["design", element.querySelector(".v3-design-choice")], ["supports", rows[0]], ["quantite", element.querySelector(".v3-quantity-choice")], ["composition", rows[1]]].map(([selector, target]) => {
    const box = target?.getBoundingClientRect();
    return { selector, fullyVisible: Boolean(box && box.top >= 0 && box.bottom <= innerHeight), top: box?.top, bottom: box?.bottom };
    });
  });
  assert("criteres-secteur-desktop-dans-le-premier-ecran", criteria.every((item) => item.fullyVisible), criteria);
  await page.screenshot({ path: path.join(outputDir, "13a-sector-1365x768.png") });
});
await shortSector.close();

const shortProduct = await auditPage(shortDesktop, "/produits/chevalet?mode=custom&count=2&action=avis", "Produit desktop 1365 × 768", async (page) => {
  const hierarchy = await page.evaluate(() => {
    const buybox = document.querySelector(".v3-product-buy-column > .v3-buybox")?.getBoundingClientRect();
    const title = document.querySelector(".v3-product-buy-column > h1")?.getBoundingClientRect();
    const design = document.querySelector(".v3-product-buy-column .v3-design-choice")?.getBoundingClientRect();
    const identity = document.querySelector(".v3-product-buy-column .v3-branding-fields")?.getBoundingClientRect();
    return { offerFirst: Boolean(buybox && title && title.top < buybox.top && buybox.top < innerHeight), designVisible: Boolean(design && design.top < innerHeight), identityStartsNext: Boolean(identity && identity.top >= design.top) };
  });
  assert("fiche-produit-offre-et-design-premier-ecran", hierarchy.offerFirst && hierarchy.designVisible && hierarchy.identityStartsNext, hierarchy);
  assert("pas-de-cta-flottant-desktop-inutile", !(await page.locator(".v3-mobile-product-cta").isVisible()));
  await page.screenshot({ path: path.join(outputDir, "13b-product-1365x768.png") });
});
await shortProduct.close();

const shortShop = await auditPage(shortDesktop, "/boutique", "Boutique desktop 1365 × 768", async (page) => {
  assert("filtres-et-premier-produit-boutique-visibles", await page.locator(".v3-shop-controls").isVisible() && await page.locator(".v3-shop-card").first().isVisible());
});
await shortShop.close();

const shortDesigns = await auditPage(shortDesktop, "/designs", "Designs desktop 1365 × 768", async (page) => {
  assert("filtres-et-premier-design-visibles", await page.locator(".v3-designs-toolbar").isVisible() && await page.locator(".v3-design-specimen").first().isVisible());
});
await shortDesigns.close();

const narrow = await browser.newContext({ viewport: { width: 320, height: 700 }, deviceScaleFactor: 1 });
await mockLogoUpload(narrow);
const narrowProduct = await auditPage(narrow, "/produits/plaque?mode=custom&action=facebook", "Produit étroit 320 px", async (page) => {
  const scene = page.locator(".v3-product-main-image");
  await auditQuantityAlignment(page, "320px");
  await page.getByLabel("Nom de votre entreprise").fill("Atelier Solstice");
  await page.locator('.v3-brand-colors input[type="color"]').nth(0).fill("#173b57");
  await page.locator('.v3-brand-colors input[type="color"]').nth(1).fill("#f4b942");
  await page.locator('.v3-logo-upload input[type="file"]').setInputFiles(path.resolve("public/icon-512.png"));
  await scene.locator(".v3-live-brand-avatar img").first().waitFor({ state: "visible" });
  assert("aucun-debordement-320", await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth));
  assert("une-seule-incrustation-iphone-320", await scene.locator(".v3-sector-scene-screen").count() === 1 && await scene.locator(".v3-live-phone-svg").count() === 1);
  const syncedNames = await scene.evaluate((element) => ({
    support: element.querySelector(".v3-sector-scene-support")?.textContent?.toLowerCase().includes("atelier solstice"),
    phone: element.querySelector(".v3-sector-scene-screen")?.textContent?.toLowerCase().includes("atelier solstice"),
  }));
  assert("logo-et-marque-iphone-320", await scene.locator(".v3-live-brand-avatar img").count() >= 1 && syncedNames.support && syncedNames.phone, syncedNames);
  await page.screenshot({ path: path.join(outputDir, "14-product-320.png"), fullPage: true });
});
await narrowProduct.close();

const narrowShop = await auditPage(narrow, "/boutique", "Filtres boutique 320 px", async (page) => {
  await auditNarrowFilters(page, ".v3-shop-controls", "boutique", 4);
  assert("premier-produit-visible-apres-filtres-320", await page.locator(".v3-shop-card").first().isVisible());
  await page.screenshot({ path: path.join(outputDir, "14a-shop-filters-320.png"), fullPage: true });
});
await narrowShop.close();

const narrowDesigns = await auditPage(narrow, "/designs", "Filtres designs 320 px", async (page) => {
  await auditNarrowFilters(page, ".v3-designs-toolbar", "designs", 4);
  assert("premier-design-visible-apres-filtres-320", await page.locator(".v3-design-specimen").first().isVisible());
  await page.screenshot({ path: path.join(outputDir, "14b-design-filters-320.png"), fullPage: true });
});
await narrowDesigns.close();

const wide = await browser.newContext({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 1 });
await mockLogoUpload(wide);
const wideProduct = await auditPage(wide, "/produits/plaque?mode=custom&action=avis", "Produit large 2000 px", async (page) => {
  const scene = page.locator(".v3-product-main-image");
  assert("scene-large-sans-double-telephone", await scene.locator(".v3-sector-scene-screen").count() === 1 && await scene.locator(".v3-live-phone-svg").count() === 1);
  assert("support-vertical-large", await scene.evaluate((element) => element.classList.contains("is-surface-plaque")));
  await scene.screenshot({ path: path.join(outputDir, "15-product-scene-2000.png") });
});
await wideProduct.close();

await desktop.close();
await mobile.close();
await tablet.close();
await shortDesktop.close();
await narrow.close();
await wide.close();
await browser.close();

report.ok = report.errors.length === 0 && report.assertions.every((assertion) => assertion.ok);
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
