// Audit temporaire de l'app Gestion (opérateur atelier). Supprimé après usage.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.TAPOTE_AUDIT_URL || "http://127.0.0.1:5179";
const outputDir = path.resolve("output/audit-gestion");
await fs.mkdir(outputDir, { recursive: true });

const report = { baseUrl, startedAt: new Date().toISOString(), steps: [], notes: [] };

let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }

function watchRuntime(page) {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|React DevTools/i.test(m.text())) errors.push(`console: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on("requestfailed", (r) => { const f = r.failure()?.errorText || ""; if (!/ERR_ABORTED/i.test(f)) errors.push(`requestfailed: ${r.url().slice(0, 120)} (${f})`); });
  return () => errors.splice(0, errors.length);
}

async function settle(page, ms = 500) {
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function metrics(page) {
  return page.evaluate(() => {
    const rendered = (el) => {
      const s = getComputedStyle(el); const b = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0 && b.width > 0 && b.height > 0;
    };
    const small = [...document.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, label.pilot-switch')]
      .filter(rendered)
      .map((el) => { const b = el.getBoundingClientRect(); return { label: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 44), w: Math.round(b.width), h: Math.round(b.height) }; })
      .filter((t) => t.w < 44 || t.h < 44);
    const tiny = [...document.querySelectorAll("body *")].filter(rendered)
      .filter((el) => el.children.length === 0 && el.textContent.trim())
      .map((el) => ({ px: parseFloat(getComputedStyle(el).fontSize), t: el.textContent.trim().slice(0, 30) }))
      .filter((x) => x.px < 12);
    return {
      overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      interactive: [...document.querySelectorAll('button:not([disabled]), a[href], input, select, textarea')].filter(rendered).length,
      smallTapCount: small.length,
      smallTapSamples: small.slice(0, 8),
      tinyTextCount: tiny.length,
      tinyTextSamples: [...new Map(tiny.map((x) => [x.t, x])).values()].slice(0, 5),
      title: document.title,
    };
  }).catch((e) => ({ error: String(e) }));
}

let n = 0;
async function shot(page, tag, name, flush) {
  n += 1;
  const id = `${String(n).padStart(2, "0")}-${tag}-${name}`.replace(/[^a-z0-9-]/gi, "-");
  await settle(page);
  const m = await metrics(page);
  await page.screenshot({ path: path.join(outputDir, `${id}.png`), fullPage: true }).catch(() => {});
  const entry = { id, tag, name, url: page.url(), ...m, runtimeErrors: flush ? flush() : [] };
  report.steps.push(entry);
  console.log(`[${id}] overflowX=${m.overflowX} small=${m.smallTapCount} tiny=${m.tinyTextCount} err=${entry.runtimeErrors.length}`);
  return entry;
}

async function run(viewport, tag) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
  const page = await context.newPage();
  const flush = watchRuntime(page);
  const mobile = viewport.width < 500;

  // 0. Page /connexion
  await page.goto(`${baseUrl}/connexion`, { waitUntil: "domcontentloaded" });
  await shot(page, tag, "00-connexion", flush);

  // 1. Entrée Gestion (mode démo)
  await page.goto(`${baseUrl}/gestion`, { waitUntil: "domcontentloaded" });
  await shot(page, tag, "01-dashboard", flush);

  // 2. Centre d'alertes
  await page.locator('button[aria-label="Notifications"]').first().click().catch(() => {});
  await shot(page, tag, "02-alertes", flush);
  await page.keyboard.press("Escape").catch(() => {});
  await page.mouse.click(5, 5).catch(() => {});

  // 3. Recherche globale
  await page.locator('input[aria-label="Recherche globale"]').fill("TPT").catch(() => {});
  await shot(page, tag, "03-recherche", flush);
  await page.locator('input[aria-label="Recherche globale"]').fill("").catch(() => {});
  await page.keyboard.press("Escape").catch(() => {});

  const openNav = async () => {
    if (!mobile) return;
    await page.locator('button[aria-label="Ouvrir la navigation"], .management-mobile-nav button:has-text("Plus")').first().click().catch(() => {});
    await page.waitForTimeout(350);
  };

  const go = async (label) => {
    await openNav();
    const btn = page.locator(`.pilot-sidebar nav button:has-text("${label}")`).first();
    await btn.click({ timeout: 5000 }).catch(async () => {
      report.notes.push(`${tag}: clic navigation "${label}" échoué`);
    });
    await page.waitForTimeout(500);
  };

  // 4. Commandes
  await go("Commandes");
  await shot(page, tag, "04-commandes", flush);

  // 5. Ouvrir une commande (drawer)
  await page.locator('.pilot-table tbody tr').first().click().catch(() => {});
  await shot(page, tag, "05-commande-drawer", flush);
  // Compter les confirmations autour du bouton d'avancement
  const drawerInfo = await page.evaluate(() => {
    const d = document.querySelector(".pilot-order-drawer");
    if (!d) return null;
    return {
      title: d.querySelector("h2")?.textContent,
      footerButtons: [...d.querySelectorAll("footer button")].map((b) => b.textContent.trim()),
      hasCancelAction: /annul/i.test(d.textContent) ,
      scrollHeight: d.scrollHeight, clientHeight: d.clientHeight,
    };
  });
  report.notes.push({ tag, drawerInfo });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 6. Clients
  await go("Clients");
  await shot(page, tag, "06-clients", flush);

  // 7. Assemblage (board)
  await go("Assemblage");
  await shot(page, tag, "07-assemblage", flush);
  const boardInfo = await page.evaluate(() => {
    const cols = [...document.querySelectorAll(".pilot-board-column")];
    const board = document.querySelector(".pilot-board");
    return {
      columns: cols.length,
      boardScrollWidth: board?.scrollWidth, boardClientWidth: board?.clientWidth,
      nextButtons: [...document.querySelectorAll(".pilot-board-next")].map((b) => ({ t: b.textContent.trim(), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })),
    };
  });
  report.notes.push({ tag, boardInfo });

  // 7b. Cliquer "étape suivante" sur une carte : y a-t-il une confirmation ?
  const before = await page.evaluate(() => document.querySelectorAll(".pilot-board-column")[0]?.textContent.trim().slice(0, 120));
  await page.locator(".pilot-board-next").first().click().catch(() => {});
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    col0: document.querySelectorAll(".pilot-board-column")[0]?.textContent.trim().slice(0, 120),
    toast: document.querySelector(".pilot-toast.is-visible")?.textContent.trim(),
    modal: Boolean(document.querySelector(".pilot-modal-layer")),
  }));
  report.notes.push({ tag, advanceNoConfirm: { before, after } });
  await shot(page, tag, "08-assemblage-apres-clic", flush);

  // 8. Encodage
  await go("Création & encodage");
  await shot(page, tag, "09-encodage", flush);
  const encInfo = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".pilot-encoding-row")].slice(1);
    const table = document.querySelector(".pilot-encoding-table");
    return {
      rows: rows.length,
      tableScrollWidth: table?.scrollWidth, tableClientWidth: table?.clientWidth,
      firstRowText: rows[0]?.textContent.replace(/\s+/g, " ").slice(0, 240),
      checks: [...document.querySelectorAll(".pilot-encoding-checks span")].map((s) => ({ t: s.textContent, ok: s.className.includes("is-ok") })),
    };
  });
  report.notes.push({ tag, encInfo });

  // 8b. Modale de test NFC/QR
  await page.locator('.pilot-encoding-row button:has-text("Tester")').first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, tag, "10-encodage-tests", flush);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 8c. Modale de création produit
  await page.locator('button:has-text("Créer un produit")').first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, tag, "11-encodage-creation", flush);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 9. Supply
  await go("Supply & stocks");
  await shot(page, tag, "12-supply", flush);
  await page.locator('.pilot-table-action:has-text("Réceptionner")').first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, tag, "13-supply-reception", flush);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 10. Expéditions
  await go("Expéditions");
  await shot(page, tag, "14-expeditions", flush);
  await page.locator('.pilot-shipment-row button:has-text("Expédier")').first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, tag, "15-expedition-modale", flush);
  // tester la validation du numéro de suivi : saisir n'importe quoi
  await page.locator('.pilot-modal input').first().fill("aaaaa").catch(() => {});
  await page.locator('.pilot-modal button[type="submit"]').first().click().catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, tag, "16-expedition-suivi-bidon", flush);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 11. E-commerce
  await go("Site e-commerce");
  await shot(page, tag, "17-ecommerce", flush);
  // Basculer un produit hors ligne : confirmation ?
  const toggleBefore = await page.evaluate(() => document.querySelectorAll(".pilot-product-list input[type=checkbox]")[0]?.checked);
  await page.locator(".pilot-product-list input[type=checkbox]").first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(700);
  const toggleAfter = await page.evaluate(() => ({
    checked: document.querySelectorAll(".pilot-product-list input[type=checkbox]")[0]?.checked,
    modal: Boolean(document.querySelector(".pilot-modal-layer")),
    toast: document.querySelector(".pilot-toast.is-visible")?.textContent.trim(),
  }));
  report.notes.push({ tag, storefrontToggle: { toggleBefore, toggleAfter } });
  await shot(page, tag, "18-ecommerce-toggle", flush);

  // 12. Réglages
  await openNav();
  await page.locator('.pilot-sidebar-foot button:has-text("Réglages")').first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, tag, "19-reglages", flush);
  await page.keyboard.press("Escape");

  // 13. Nouvelle commande
  await page.locator('button:has-text("Nouvelle commande")').first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, tag, "20-nouvelle-commande", flush);
  await page.keyboard.press("Escape");

  await context.close();
}

await run({ width: 1440, height: 900 }, "desktop");
await run({ width: 390, height: 844 }, "mobile");

await browser.close();
await fs.writeFile(path.join(outputDir, "rapport.json"), JSON.stringify(report, null, 2));
console.log("OK");
