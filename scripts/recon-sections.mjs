import { chromium } from "playwright-core";
import fs from "node:fs/promises";

// Capture chaque section réelle d'une page, pas des tranches de scroll
// arbitraires : on repère les blocs de premier niveau, on les nomme par leur
// titre, et on les shoote un par un.

const url = process.argv[2];
const name = process.argv[3];
const width = Number(process.argv[4] || 1440);
const outDir = `output/recon/${name}`;
await fs.mkdir(outDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ channel: "chrome", headless: true });
}

const context = await browser.newContext({
  viewport: { width, height: 900 },
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(2500);

// Les widgets cookies et chat se superposent au contenu et résistent au clic
// (Axeptio vit dans son propre conteneur). On les masque, c'est plus fiable.
await page.addStyleTag({ content: `
  [class*="axeptio"], #axeptio_overlay, .axeptio_mount,
  [id*="cookie"], [class*="cookie-banner"], [class*="cookieBanner"],
  [class*="crisp-client"], #crisp-chatbox, [class*="intercom-"],
  [class*="tawk"], .grecaptcha-badge, [class*="back-to-top"] {
    display: none !important; visibility: hidden !important;
  }
` });
await page.waitForTimeout(400);

// Descendre lentement pour déclencher lazy-loading et animations au scroll.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.7;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 260));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1000);

const blocks = await page.evaluate(() => {
  const roots = document.querySelectorAll("section, main > div, main > article");
  const seen = new Set();
  const out = [];
  for (const el of roots) {
    const r = el.getBoundingClientRect();
    if (r.height < 260 || r.width < window.innerWidth * 0.55) continue;
    // Écarter les sections qui n'en contiennent qu'une autre : on veut la feuille utile.
    if (el.querySelectorAll("section").length > 0) continue;
    const key = `${Math.round(r.top + window.scrollY)}-${Math.round(r.height)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const heading = el.querySelector("h1, h2, h3");
    el.setAttribute("data-recon", String(out.length));
    out.push({
      index: out.length,
      height: Math.round(r.height),
      title: heading ? heading.textContent.trim().replace(/\s+/g, " ").slice(0, 70) : "(sans titre)",
    });
  }
  return out;
});

for (const b of blocks) {
  const node = page.locator(`[data-recon="${b.index}"]`).first();
  try {
    await node.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await node.screenshot({ path: `${outDir}/${String(b.index).padStart(2, "0")}.png` });
    console.log(`${String(b.index).padStart(2, "0")}  ${String(b.height).padStart(5)}px  ${b.title}`);
  } catch (error) {
    console.log(`${String(b.index).padStart(2, "0")}  ECHEC  ${error.message.split("\n")[0].slice(0, 60)}`);
  }
}

await browser.close();
