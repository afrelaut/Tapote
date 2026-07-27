import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const baseUrl = process.env.V3_AUDIT_URL || "http://localhost:5173";
const outputDir = "output/playwright/phone-bottom-audit";
const scenes = [
  ["cafe", "cafes-bars", "tapote-bg-cafe-v1.webp"],
  ["restaurant", "restaurants-traiteurs-food-trucks", "tapote-bg-restaurant-live-screen-v1.webp"],
  ["boulangerie", "boulangeries-patisseries", "tapote-bg-boulangerie-v1.webp"],
  ["beaute", "beaute-coiffure-bien-etre", "tapote-bg-beaute-v1.webp"],
  ["medical", "cabinets-medicaux-paramedicaux", "tapote-bg-medical-v1.webp"],
  ["retail", "boutiques-commerces", "tapote-bg-retail-v1.webp"],
  ["hotel", "hebergements-tourisme", "tapote-bg-hotel-v1.webp"],
  ["auto-ecole", "auto-ecoles", "tapote-bg-auto-ecole-v1.webp"],
  ["automobile", "garages-mobilite", "tapote-bg-automobile-v1.webp"],
  ["artisan", "artisans-services-terrain", "tapote-bg-artisan-v1.webp"],
  ["agence", "agences-independants", "tapote-bg-agence-v1.webp"],
  ["sport", "sport-studios", "tapote-bg-sport-v1.webp"],
  ["formation", "bureaux-formation", "tapote-bg-formation-v1.webp"],
  ["evenement", "evenements-culture-associations", "tapote-bg-evenement-v1.webp"],
  ["animaux", "animaux-soins", "tapote-bg-animaux-v1.webp"],
];
const sceneFilter = process.env.V3_AUDIT_SCENE;
const actionFilter = process.env.V3_AUDIT_ACTION;
const selectedScenes = sceneFilter ? scenes.filter(([name]) => name === sceneFilter) : scenes;

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1254, height: 1254 }, deviceScaleFactor: 1 });

for (const [name, slug, asset] of selectedScenes) {
  await page.goto(`${baseUrl}/secteurs/${slug}`, { waitUntil: "networkidle" });
  if (actionFilter) {
    await page.locator('select[aria-label="Le lien à ouvrir"]').selectOption(actionFilter);
    await page.locator(`.v3-sector-hero .v3-live-phone-screen[data-phone-action="${actionFilter}"]`).waitFor();
  }
  const scene = page.locator(".v3-sector-hero .v3-sector-scene");
  await scene.evaluate((element) => {
    Object.assign(element.style, {
      position: "fixed",
      inset: "0",
      width: "1254px",
      height: "1254px",
      zIndex: "99999",
      borderRadius: "0",
      transform: "none",
    });
  });
  await page.screenshot({
    path: `${outputDir}/${name}-render-bottom.png`,
    clip: { x: 500, y: 500, width: 754, height: 754 },
  });

  await page.goto(`${baseUrl}/assets/products/${asset}`, { waitUntil: "load" });
  await page.evaluate(() => {
    document.body.style.margin = "0";
    const image = document.querySelector("img");
    Object.assign(image.style, { width: "1254px", height: "1254px" });
  });
  await page.screenshot({
    path: `${outputDir}/${name}-raw-bottom.png`,
    clip: { x: 500, y: 500, width: 754, height: 754 },
  });
}

await browser.close();
console.log(`Phone bottom audit written to ${outputDir}`);
