// Script temporaire d'audit conversion — à supprimer après exécution.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import { PRODUCTS } from "../shared/catalog.js";

const baseUrl = "http://127.0.0.1:5179";
const outputDir = path.resolve("output/audit-conversion");
await fs.mkdir(outputDir, { recursive: true });
const log = [];
const say = (...a) => { const s = a.join(" "); log.push(s); console.log(s); };

let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }

const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "fr-FR" });
await ctx.route("**/api/catalog", (route) => route.fulfill({
  status: 200, contentType: "application/json",
  body: JSON.stringify({ products: Object.values(PRODUCTS).map((p) => ({ productId: p.id, name: p.name, price: p.price, online: true, availableStock: null })) }),
}));
await ctx.route("**/api/uploads/logo", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ uploadId: "00000000-0000-4000-8000-000000000001" }) }));

const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));

let n = 0;
const shot = async (name, opts = {}) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outputDir, `${String(n).padStart(2, "0")}-${name}.png`), ...opts });
};

const go = async (url) => { await page.goto(baseUrl + url, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(1400); };

// ---------- 1. Boutique : bascule "À votre image" ----------
await go("/boutique");
const readyPrices = await page.locator(".v3-shop-card-copy > div > strong").allTextContents();
const readyCtas = await page.locator(".v3-shop-card-copy > div > *:last-child").allTextContents();
say("BOUTIQUE prêt à poser — prix:", JSON.stringify(readyPrices), "cta:", JSON.stringify(readyCtas));
await page.getByRole("button", { name: /À votre image/i }).first().click();
await page.waitForTimeout(700);
const customPrices = await page.locator(".v3-shop-card-copy > div > strong").allTextContents();
const customCtas = await page.locator(".v3-shop-card-copy > div > *:last-child").allTextContents();
say("BOUTIQUE à votre image — prix:", JSON.stringify(customPrices), "cta:", JSON.stringify(customCtas));
// Toute mention du surcoût ?
const bodyTxt = await page.locator("body").innerText();
say("BOUTIQUE mentionne '+20' ?", /\+\s?20/.test(bodyTxt), "| mentionne 'supplément' ?", /suppl[ée]ment/i.test(bodyTxt));
await shot("boutique-custom", { fullPage: false });

// Pack Local onglet
await page.getByRole("button", { name: /^Pack Local$/ }).first().click();
await page.waitForTimeout(700);
const packTxt = await page.locator(".v3-shop-packs").innerText().catch(() => "");
say("PACK LOCAL (mode custom) bloc:", JSON.stringify(packTxt.slice(0, 420)));
await shot("boutique-pack-local");

// ---------- 2. PDP Comptoir : état par défaut, décisions imposées ----------
await go("/produits/comptoir");
const buybox = page.locator(".v3-buybox");
say("PDP prix par défaut:", await page.locator(".v3-buybox-summary strong").innerText());
say("PDP libellé résumé:", await page.locator(".v3-buybox-summary div span").innerText());
const groups = await buybox.locator(".v3-field-label").allTextContents();
say("PDP étapes visibles:", JSON.stringify(groups));
const nbBoutonsChoix = await buybox.locator('button[aria-pressed]').count();
say("PDP nb de boutons de choix (aria-pressed):", nbBoutonsChoix);
say("PDP sélecteur secteur options:", await page.locator(".v3-product-sector-control").innerText().then(t => JSON.stringify(t.slice(0,160))).catch(() => "n/a"));

// ---------- 3. Destination invalide (vraiment testée cette fois) ----------
await page.locator(".v3-destination-details summary").click();
await page.waitForTimeout(400);
await page.locator(".v3-destination-details input").fill("mon-site.fr");
await page.waitForTimeout(500);
const addBtn = page.locator(".v3-buybox-summary button");
say("DESTINATION invalide — libellé bouton:", await addBtn.innerText(), "| disabled:", await addBtn.isDisabled());
say("DESTINATION invalide — message:", await page.locator(".v3-destination-field small").innerText().catch(() => "AUCUN"));
await page.locator(".v3-buybox").screenshot({ path: path.join(outputDir, "03-destination-invalide-buybox.png") });
n += 1;
// Le bouton sticky mobile ?
say("DESTINATION invalide — le champ est-il visible sans scroll depuis le bouton ?", await page.locator(".v3-destination-details input").isVisible());
await page.locator(".v3-destination-details input").fill("");
await page.waitForTimeout(400);

// ---------- 4. Quantité 2 sur la fiche Comptoir ----------
await page.locator(".v3-quantity-choice button").nth(1).click();
await page.waitForTimeout(600);
say("QTE 2 sur Comptoir — résumé:", await page.locator(".v3-buybox-summary").innerText());
say("QTE 2 — composition proposée:", await page.locator(".v3-choice-row-three").innerText().catch(() => "aucune"));
await page.locator(".v3-buybox").screenshot({ path: path.join(outputDir, "04-comptoir-qte2.png") });
n += 1;

// ---------- 5. Quantité 2 sur la fiche Plaque (piège tarifaire) ----------
await go("/produits/plaque");
say("PDP Plaque prix 1:", await page.locator(".v3-buybox-summary strong").innerText());
const qOpts = await page.locator(".v3-quantity-choice button").allTextContents();
say("PDP Plaque options quantité:", JSON.stringify(qOpts));
await page.locator(".v3-quantity-choice button").nth(1).click();
await page.waitForTimeout(600);
say("PDP Plaque qte 2 — résumé:", await page.locator(".v3-buybox-summary").innerText());
// choisir "2 Plaques"
const compBtns = page.locator(".v3-choice-row-three button");
if (await compBtns.count()) {
  await compBtns.nth(2).click();
  await page.waitForTimeout(500);
  say("PDP Plaque qte 2 → '2 Plaques' — résumé:", await page.locator(".v3-buybox-summary").innerText());
}
await page.locator(".v3-buybox").screenshot({ path: path.join(outputDir, "05-plaque-qte2-piege.png") });
n += 1;

// ---------- 6. Achat le plus simple : boutique → ajout direct ----------
await ctx.clearCookies();
await page.evaluate(() => window.localStorage.clear());
await go("/boutique");
const t0 = Date.now();
await page.locator(".v3-shop-card-copy button").first().click();
await page.waitForTimeout(900);
say("AJOUT DIRECT boutique — notice:", await page.locator(".v3-cart-notice, [class*=notice]").first().innerText().catch(() => "aucune"));
await shot("ajout-direct-notice");
await go("/panier");
say("PANIER après ajout direct:", await page.locator(".v3-cart-line").innerText().catch(() => "VIDE"));
say("PANIER récap:", await page.locator(".v3-order-summary").innerText());
say("TEMPS achat mini (ms, hors saisie):", Date.now() - t0);

// ---------- 7. Panier : bouton Modifier (aller-retour) ----------
await page.locator(".v3-cart-edit").click();
await page.waitForTimeout(1500);
say("MODIFIER → url:", page.url());
say("MODIFIER → résumé buybox:", await page.locator(".v3-buybox-summary").innerText().catch(() => "n/a"));
say("MODIFIER → un bouton 'mettre à jour' existe ?", await page.locator(".v3-buybox-summary button").innerText());
await page.locator(".v3-buybox-summary button").click();
await page.waitForTimeout(900);
await go("/panier");
const lignes = await page.locator(".v3-cart-line").count();
say("MODIFIER → nb de lignes au panier après réajout:", lignes);
say("MODIFIER → contenu panier:", JSON.stringify((await page.locator(".v3-cart-lines").innerText()).slice(0, 400)));
await shot("panier-apres-modifier");

// ---------- 8. Seuil 10 supports ----------
await page.evaluate(() => {
  const item = JSON.parse(window.localStorage.getItem("tapote-cart-v3"))[0];
  window.localStorage.setItem("tapote-cart-v3", JSON.stringify([{ ...item, quantity: 9 }]));
});
await go("/panier");
say("PANIER 9 supports — CTA:", await page.locator(".v3-order-summary a").last().innerText());
await page.locator(".v3-cart-quantity button").last().click();
await page.waitForTimeout(800);
say("PANIER 10 supports — CTA:", await page.locator(".v3-order-summary a").last().innerText());
say("PANIER 10 supports — avis volume:", await page.locator(".v3-volume-notice").innerText().catch(() => "aucun"));
say("PANIER 10 — total:", await page.locator(".v3-order-summary dl").innerText());
await shot("panier-10-supports");
await go("/commande");
say("COMMANDE avec 10 supports:", (await page.locator("main").innerText()).slice(0, 300));
await shot("commande-bloquee-10");

// ---------- 9. Livraison offerte : seuil ----------
await page.evaluate(() => {
  const item = JSON.parse(window.localStorage.getItem("tapote-cart-v3"))[0];
  window.localStorage.setItem("tapote-cart-v3", JSON.stringify([{ ...item, quantity: 1 }]));
});
await go("/panier");
say("PANIER 1 Comptoir 69 € — récap:", (await page.locator(".v3-order-summary dl").innerText()).replace(/\n/g, " | "));

// ---------- 10. Parcours secteur ----------
await go("/secteurs/cafe-bar");
const sectTxt = await page.locator("main").innerText().catch(() => "");
say("PAGE SECTEUR existe ?", sectTxt.length > 200, "| CTA:", JSON.stringify((await page.locator("main a[href*='produits'], main a[href*='boutique']").allTextContents()).slice(0, 8)));
say("PAGE SECTEUR — prix affiché ?", /\d+\s?€/.test(sectTxt), "| bouton ajouter ?", await page.locator("main button:has-text('Ajouter')").count());
await shot("secteur-cafe");

// ---------- 11. Devis 3 étapes ----------
await go("/devis");
say("DEVIS étape 1 champs:", JSON.stringify(await page.locator(".v3-quote-step label span").allTextContents()));
say("DEVIS routage:", (await page.locator(".v3-quote-routing").innerText()).replace(/\n/g, " | "));
await shot("devis-etape1");

// ---------- 12. Retour arrière depuis le panier ----------
await go("/panier");
await page.goBack();
await page.waitForTimeout(1200);
say("RETOUR ARRIERE depuis panier → url:", page.url());

await fs.writeFile(path.join(outputDir, "notes.txt"), log.join("\n"), "utf8");
say("ERREURS JS:", JSON.stringify([...new Set(errors)]));
await browser.close();
