import { chromium } from "playwright-core";

let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }

for (const [name, width] of [["buybox-desktop", 1440], ["buybox-mobile", 390]]) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5174/produits/comptoir", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);
  const box = page.locator(".v3-buybox").first();
  await box.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await box.screenshot({ path: `output/recon/${name}.png` });
  const h = await box.evaluate((el) => Math.round(el.getBoundingClientRect().height));
  console.log(name, `${h}px`);
  await context.close();
}
await browser.close();
