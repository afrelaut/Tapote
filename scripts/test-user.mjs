// Test utilisateur : on parcourt l'application comme un client, et on capture
// au format écran (pas fullPage) pour que les captures restent lisibles.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import { PRODUCTS } from "../shared/catalog.js";

const baseUrl = "http://127.0.0.1:5179";
const tag = process.argv[2] || "avant";
const outputDir = path.resolve(`output/test-user/${tag}`);
await fs.mkdir(outputDir, { recursive: true });

let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }

async function mock(context) {
  await context.route("**/api/catalog", (r) => r.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ products: Object.values(PRODUCTS).map((p) => ({ productId: p.id, name: p.name, price: p.price, online: true, availableStock: null })) }),
  }));
  await context.route("**/api/uploads/logo", (r) => r.request().method() === "POST"
    ? r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ uploadId: "00000000-0000-4000-8000-000000000001" }) })
    : r.continue());
}

const problemes = [];
async function shot(page, nom, { scroll = 0 } = {}) {
  if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(outputDir, `${nom}.png`) });
  const m = await page.evaluate(() => ({
    overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    tronques: [...document.querySelectorAll("*")].filter((el) => {
      const s = getComputedStyle(el);
      return s.textOverflow === "ellipsis" && s.whiteSpace === "nowrap" && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0;
    }).length,
  }));
  if (m.overflow > 2 || m.tronques > 0) problemes.push(`${nom}: débordement ${m.overflow}px, ${m.tronques} texte(s) tronqué(s)`);
  return m;
}

for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const mobile = vp.width < 500;
  const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  await mock(ctx);
  const page = await ctx.newPage();
  const p = (n) => `${label}-${n}`;

  // 1. Landing : premier écran, puis les sections qui vendent.
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);
  await shot(page, p("01-landing-premier-ecran"));
  await shot(page, p("02-landing-offre"), { scroll: mobile ? 1100 : 900 });
  await shot(page, p("03-landing-secteurs"), { scroll: mobile ? 3200 : 2600 });

  // 2. Menus.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  if (mobile) {
    await page.locator(".v3-mobile-toggle").click().catch(() => {});
    await page.waitForTimeout(600);
    await shot(page, p("04-menu"));
    await page.keyboard.press("Escape").catch(() => {});
  } else {
    await page.locator(".v3-shop-nav > button").hover().catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, p("04-menu-mega"));
    await page.mouse.move(0, 600);
  }
  await page.waitForTimeout(400);

  // 3. Boutique : aperçus produits.
  await page.goto(`${baseUrl}/boutique`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await shot(page, p("05-boutique-apercus"));

  // 4. Fiche produit : scène + prix.
  await page.goto(`${baseUrl}/produits/comptoir?mode=ready`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2600);
  await shot(page, p("06-produit-scene"));

  // 5. Personnalisation : Tapote Studio, l'écran le plus dense.
  await page.goto(`${baseUrl}/produits/comptoir?mode=custom`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2600);
  await shot(page, p("07-studio-haut"));
  const studio = await page.locator(".v3-live-studio").boundingBox().catch(() => null);
  await shot(page, p("08-studio-champs"), { scroll: studio ? studio.y - 80 : 700 });
  await shot(page, p("09-studio-couleurs"), { scroll: studio ? studio.y + 420 : 1200 });

  // 6. Panier rempli.
  await page.goto(`${baseUrl}/produits/comptoir?mode=ready`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: /Ajouter au panier/i }).first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.goto(`${baseUrl}/panier`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1600);
  await shot(page, p("10-panier"));

  // 7. Pilot en démonstration.
  await page.goto(`${baseUrl}/pilot`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2400);
  await page.locator(".pilot-demo-access").click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(1800);
  await shot(page, p("11-pilot"));

  await page.close();
  await ctx.close();
}
await browser.close();

console.log(`captures dans ${outputDir}`);
console.log(problemes.length ? `PROBLÈMES:\n${problemes.join("\n")}` : "Aucun débordement ni texte tronqué.");
