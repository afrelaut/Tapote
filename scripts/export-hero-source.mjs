import { chromium } from "playwright-core";
import fs from "node:fs/promises";

// Exporte un rendu carré haute définition du support, à envoyer tel quel dans
// Higgsfield en image-to-video. La géométrie et la typo viennent de la chaîne
// du repo, donc le produit reste exact : le modèle n'anime que la lumière et
// la caméra, il ne réinvente pas l'objet.

const surface = process.argv[2] || "comptoir";
const out = `output/hero-source-${surface}`;
await fs.mkdir("output", { recursive: true });

let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }

// deviceScaleFactor 3 : on vise du 1440² natif pour garder de la marge après
// recadrage, Higgsfield rééchantillonne vers le bas sans perte visible.
const context = await browser.newContext({
  viewport: { width: 900, height: 900 },
  deviceScaleFactor: 3,
});
const page = await context.newPage();
await page.goto(`http://127.0.0.1:5174/produits/${surface}`, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1500);

// Isoler le support sur un fond neutre : pas de décor, pas d'interface, le
// modèle doit n'avoir que l'objet à interpréter.
await page.evaluate(() => {
  const art = document.querySelector(".v3-product-art");
  if (!art) throw new Error("aucun .v3-product-art trouvé");
  const stage = document.createElement("div");
  stage.id = "hero-stage";
  stage.style.cssText = "position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#0c0e13;";
  const clone = art.cloneNode(true);
  clone.style.cssText = "width:62%;height:auto;filter:drop-shadow(0 40px 60px rgba(0,0,0,.55));";
  stage.appendChild(clone);
  document.body.appendChild(stage);
});
await page.waitForTimeout(900);

await page.locator("#hero-stage").screenshot({ path: `${out}.png` });
console.log(`écrit : ${out}.png  (2700x2700 natif)`);

await browser.close();
