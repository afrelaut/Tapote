import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("output/playwright/benchmark-live");
await fs.mkdir(outputDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ channel: "chrome", headless: true });
}

const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const targets = [
  ["izikard-home", "https://izikard.com/"],
  ["izikard-shop", "https://izikard.com/boutique/"],
  ["izikard-product", "https://izikard.com/produit/plaque-nfc-avis-google/"],
  ["viewup-product", "https://viewup.fr/pages/plaque-avis-google-viewup"],
  ["tapote-production-home", "https://tapote.fr/"],
  ["tapote-production-shop", "https://tapote.fr/boutique"],
  ["tapote-production-product", "https://tapote.fr/produits/plaque?mode=custom&action=avis"],
  ["tapote-home", "http://127.0.0.1:5173/"],
  ["tapote-shop", "http://127.0.0.1:5173/boutique"],
  ["tapote-product", "http://127.0.0.1:5173/produits/plaque?mode=custom&action=avis"],
];

const report = [];
for (const [name, url] of targets) {
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(2_500);
    const consent = page.getByRole("button", { name: /refuser|continuer sans accepter|reject/i }).first();
    if (await consent.count()) await consent.click({ timeout: 1_500 }).catch(() => undefined);
    await page.waitForTimeout(500);
    const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
    report.push({
      name,
      url: page.url(),
      status: response?.status(),
      title: await page.title(),
      h1: await page.locator("h1").first().textContent().catch(() => ""),
      prices: bodyText.match(/\d+[,.]?\d*\s*€/g)?.slice(0, 12) || [],
      ctas: await page.locator("a, button").evaluateAll((elements) => elements.map((element) => element.textContent?.replace(/\s+/g, " ").trim()).filter((text) => text && /acheter|commander|ajouter|configurer|panier|devis/i.test(text)).slice(0, 18)),
      errors: errors.slice(0, 8),
    });
    await page.screenshot({ path: path.join(outputDir, `${name}.png`) });
  } catch (error) {
    report.push({ name, url, error: error.message, errors: errors.slice(0, 8) });
  } finally {
    await page.close();
  }
}

await context.close();
await browser.close();
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
