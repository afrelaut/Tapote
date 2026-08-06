// Temporaire : audit produit de Tapote Pilot (parcours réel, inspecteur inclus).
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.TAPOTE_AUDIT_URL || "http://127.0.0.1:5179";
const outputDir = path.resolve("output/audit-pilot");
await fs.mkdir(outputDir, { recursive: true });

const report = { baseUrl, startedAt: new Date().toISOString(), steps: [], notes: {} };

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ channel: "chrome", headless: true });
}

function watchRuntime(page) {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|React DevTools/i.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => {
    const f = r.failure()?.errorText || "";
    if (!/ERR_ABORTED/i.test(f)) errors.push(`requestfailed: ${r.url()} (${f})`);
  });
  return () => errors.splice(0, errors.length);
}

async function settle(page, ms = 500) {
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function metrics(page) {
  return page.evaluate(() => {
    const rendered = (el) => {
      const s = getComputedStyle(el); const b = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0 && b.width > 0 && b.height > 0;
    };
    const small = [...document.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea')]
      .filter(rendered)
      .map((el) => {
        const b = el.getBoundingClientRect();
        return { label: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 46), w: Math.round(b.width), h: Math.round(b.height) };
      })
      .filter((t) => t.w < 44 || t.h < 44);
    return {
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      h1: document.querySelectorAll("h1").length,
      brokenImages: [...document.images].filter((i) => rendered(i) && (!i.complete || i.naturalWidth === 0)).length,
      smallTapTargets: small.length,
      smallTapSamples: small.slice(0, 8),
      title: document.title,
      viewportText: document.body.innerText.slice(0, 0),
    };
  }).catch((e) => ({ error: String(e) }));
}

let idx = 0;
async function step(page, tag, name, { flush, axe = false, fullPage = true } = {}) {
  idx += 1;
  const id = `${String(idx).padStart(2, "0")}-${tag}-${name}`.replace(/[^a-z0-9-]/gi, "-");
  await settle(page);
  const m = await metrics(page);
  await page.screenshot({ path: path.join(outputDir, `${id}.png`), fullPage }).catch(() => {});
  let a11y = null;
  if (axe) {
    const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze().catch(() => null);
    if (res) a11y = res.violations.filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes[0]?.html?.slice(0, 200) }));
  }
  const entry = { id, tag, name, ...m, a11yBlocking: a11y, runtimeErrors: flush ? flush() : [] };
  report.steps.push(entry);
  console.log(`  · ${id}  overflow=${m.overflow} small=${m.smallTapTargets} h1=${m.h1} err=${(entry.runtimeErrors || []).length}`);
  return entry;
}

async function run(viewport, tag) {
  const isMobile = viewport.width < 500;
  const context = await browser.newContext({
    viewport, deviceScaleFactor: isMobile ? 2 : 1, isMobile, hasTouch: isMobile,
    locale: "fr-FR",
    permissions: [],
  });
  const page = await context.newPage();
  const flush = watchRuntime(page);
  const notes = [];
  report.notes[tag] = notes;
  console.log(`\n=== ${tag} (${viewport.width}x${viewport.height}) ===`);

  await page.goto(`${baseUrl}/pilot`, { waitUntil: "domcontentloaded" });
  await step(page, tag, "01-entree", { flush, axe: true });

  const demo = page.locator(".pilot-demo-access");
  if (await demo.count()) {
    notes.push("Écran de connexion affiché, entrée par « Explorer la démonstration ».");
    await demo.click().catch(() => {});
    await page.waitForTimeout(1400);
  } else {
    notes.push("Pas d'écran de connexion : accès direct au workspace démo.");
  }
  await step(page, tag, "02-vue-ensemble", { flush, axe: true });

  // Ce qu'on voit sans scroller (5 premières secondes).
  await step(page, tag, "03-above-the-fold", { flush, fullPage: false });

  // Contenu textuel de la vue d'ensemble, pour analyser le vocabulaire.
  notes.push({ overviewText: await page.evaluate(() => document.querySelector(".pilot-client-workspace")?.innerText?.slice(0, 2600)) });

  const navAttr = isMobile ? "data-pilot-mobile-nav" : "data-pilot-nav";

  // --- Onglet Mes supports
  await page.locator(`[${navAttr}="products"]`).first().click().catch((e) => notes.push(`BLOQUÉ nav products: ${e.message}`));
  await page.waitForTimeout(700);
  await step(page, tag, "04-mes-supports", { flush, axe: true });

  // Export CSV
  const dl = page.waitForEvent("download", { timeout: 4000 }).catch(() => null);
  await page.locator(".pilot-export").first().click().catch(() => notes.push("BLOQUÉ: bouton export CSV introuvable/cliquable"));
  const download = await dl;
  if (download) {
    const p = path.join(outputDir, `csv-${tag}-${download.suggestedFilename()}`);
    await download.saveAs(p).catch(() => {});
    notes.push(`CSV téléchargé : ${download.suggestedFilename()}`);
  } else {
    notes.push("Aucun téléchargement CSV capté.");
  }
  await step(page, tag, "05-apres-export", { flush, fullPage: false });

  // Recherche qui ne donne rien (état vide de recherche)
  const search = page.locator('.pilot-search-field input');
  if (await search.count()) {
    await search.fill("zzzz").catch(() => {});
    await page.waitForTimeout(500);
    await step(page, tag, "06-recherche-vide", { flush });
    await search.fill("").catch(() => {});
    await page.waitForTimeout(300);
  }

  // --- L'INSPECTEUR : ouvrir un support et tenter de changer sa destination
  await page.locator(".pilot-product-row").first().click().catch((e) => notes.push(`BLOQUÉ ouverture inspecteur: ${e.message}`));
  await page.waitForTimeout(700);
  await step(page, tag, "07-inspecteur-ouvert", { flush, axe: true, fullPage: false });

  const insp = page.locator(".pilot-inspector");
  notes.push({
    inspectorPresent: await insp.count() > 0,
    inspectorText: await insp.innerText().catch(() => null),
    textareaReadOnly: await page.locator("#pilot-target").getAttribute("readonly").catch(() => "n/a"),
    readonlyNotice: await page.locator(".pilot-readonly").innerText().catch(() => null),
    verifyButtonVisible: await page.locator(".pilot-primary-action").isVisible().catch(() => false),
    inspectorBox: await insp.boundingBox().catch(() => null),
    viewportH: viewport.height,
  });

  // URL invalide
  const target = page.locator("#pilot-target");
  if (await target.count() && !(await target.getAttribute("readonly"))) {
    await target.fill("pas-une-url");
    await page.locator(".pilot-primary-action").click().catch(() => {});
    await page.waitForTimeout(400);
    await step(page, tag, "08-destination-invalide", { flush, fullPage: false });
    notes.push({ erreurUrlInvalide: await page.locator(".pilot-field-error").innerText().catch(() => null) });

    // URL http:// (non https)
    await target.fill("http://exemple.fr/menu");
    await page.locator(".pilot-primary-action").click().catch(() => {});
    await page.waitForTimeout(400);
    notes.push({ erreurHttp: await page.locator(".pilot-field-error").innerText().catch(() => null) });
    await step(page, tag, "09-destination-http", { flush, fullPage: false });

    // URL valide -> confirmation
    await target.fill("https://g.page/r/cafe-mistral/review");
    await page.locator(".pilot-primary-action").click().catch(() => {});
    await page.waitForTimeout(500);
    await step(page, tag, "10-confirmation", { flush, fullPage: false });
    notes.push({ confirmText: await page.locator(".pilot-confirm-change").innerText().catch(() => null) });

    await page.locator(".pilot-confirm-change button", { hasText: "Confirmer" }).last().click().catch(() => {});
    await page.waitForTimeout(900);
    await step(page, tag, "11-apres-enregistrement", { flush, fullPage: false });
    notes.push({ toast: await page.locator(".pilot-client-toast").innerText().catch(() => null) });

    // Re-soumettre la même URL (destination inchangée)
    await page.locator(".pilot-primary-action").click().catch(() => {});
    await page.waitForTimeout(400);
    notes.push({ erreurInchangee: await page.locator(".pilot-field-error").innerText().catch(() => null) });
  } else {
    notes.push("Champ destination en lecture seule : parcours d'édition impossible.");
  }

  // Fermeture par Échap
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  notes.push({ inspecteurFermeParEchap: (await page.locator(".pilot-inspector").count()) === 0 });
  await step(page, tag, "12-apres-fermeture", { flush, fullPage: false });

  // --- Historique (doit contenir le changement)
  await page.locator(`[${navAttr}="history"]`).first().click().catch(() => notes.push("BLOQUÉ nav history"));
  await page.waitForTimeout(700);
  await step(page, tag, "13-historique", { flush, axe: true });
  notes.push({ historiqueText: await page.locator(".pilot-history-list").innerText().catch(() => null) });

  // --- Support
  await page.locator(`[${navAttr}="support"]`).first().click().catch(() => notes.push("BLOQUÉ nav support"));
  await page.waitForTimeout(700);
  await step(page, tag, "14-support", { flush, axe: true });

  // --- Retour accueil, période et filtre lieu
  await page.locator(`[${navAttr}="overview"]`).first().click().catch(() => {});
  await page.waitForTimeout(700);
  await page.locator('.pilot-period button', { hasText: "7 j" }).first().click().catch(() => notes.push("BLOQUÉ période 7j"));
  await page.waitForTimeout(600);
  await step(page, tag, "15-periode-7j", { flush });
  await page.locator('.pilot-period button', { hasText: "90 j" }).first().click().catch(() => {});
  await page.waitForTimeout(600);
  await step(page, tag, "16-periode-90j", { flush });

  // Filtre par lieu : on choisit le 2e lieu (1 seul support)
  const locButtons = page.locator(".pilot-location-list button");
  if (await locButtons.count() > 2) {
    await locButtons.nth(2).click().catch(() => {});
    await page.waitForTimeout(700);
    await step(page, tag, "17-filtre-lieu", { flush });
    notes.push({ apresFiltreLieu: await page.locator(".pilot-link-workspace").innerText().catch(() => null) });
  }

  if (isMobile) {
    // Menu mobile
    await page.locator(".pilot-mobile-menu").click().catch(() => notes.push("BLOQUÉ menu mobile"));
    await page.waitForTimeout(600);
    await step(page, tag, "18-menu-mobile", { flush, fullPage: false, axe: true });
    await page.locator(".pilot-menu-backdrop").click().catch(() => {});
    await page.waitForTimeout(400);

    // Raccourci « changer un lien » du header mobile
    await page.locator(".pilot-mobile-quick-link").click().catch(() => notes.push("BLOQUÉ raccourci mobile"));
    await page.waitForTimeout(700);
    await step(page, tag, "19-raccourci-inspecteur", { flush, fullPage: false });
    notes.push({
      inspecteurMobileBox: await page.locator(".pilot-inspector").boundingBox().catch(() => null),
      champVisibleSansScroll: await page.locator("#pilot-target").isVisible().catch(() => false),
      boutonPrimaireBox: await page.locator(".pilot-primary-action").boundingBox().catch(() => null),
    });
    // Le clavier virtuel : simulation d'un focus dans le champ
    await page.locator("#pilot-target").click().catch(() => {});
    await page.waitForTimeout(400);
    await step(page, tag, "20-inspecteur-focus-champ", { flush, fullPage: false });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // La barre de nav basse chevauche-t-elle le contenu ?
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    await step(page, tag, "21-bas-de-page", { flush, fullPage: false });
  }

  await page.close();
  await context.close();
}

await run({ width: 1440, height: 1000 }, "desktop");
await run({ width: 390, height: 844 }, "mobile");

await browser.close();
report.finishedAt = new Date().toISOString();
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const problems = report.steps.filter((s) => s.overflow > 2 || s.brokenImages > 0 || s.h1 !== 1 || (s.runtimeErrors || []).length || (s.a11yBlocking || []).length);
console.log(`\nÉtapes: ${report.steps.length} — avec anomalie: ${problems.length}`);
console.log(JSON.stringify(problems.map((p) => ({ id: p.id, overflow: p.overflow, h1: p.h1, small: p.smallTapTargets, a11y: p.a11yBlocking, err: p.runtimeErrors })), null, 2));
