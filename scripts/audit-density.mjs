import { chromium } from "playwright-core";

// Mesure la densité réelle d'une page : pour chaque section, sa hauteur, la
// part occupée par du contenu, et le plus grand vide vertical interne. Un gros
// « trou » signale une section qui respire pour rien.

const base = process.env.AUDIT_URL || "http://127.0.0.1:5174";
const paths = process.argv.slice(2);
const width = 1440;

let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }

for (const path of paths) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);

  const rows = await page.evaluate(() => {
    // Rectangles réellement « encrés » : texte, images, bordures visibles.
    const inked = (root) => {
      const boxes = [];
      const walk = (el) => {
        for (const c of el.children) {
          const r = c.getBoundingClientRect();
          if (r.height <= 0 || r.width <= 0) continue;
          const hasText = [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          const isMedia = ["IMG", "SVG", "VIDEO", "CANVAS", "PICTURE"].includes(c.tagName);
          if (hasText || isMedia) boxes.push([r.top + window.scrollY, r.bottom + window.scrollY]);
          else walk(c);
        }
      };
      walk(root);
      return boxes;
    };

    const out = [];
    for (const s of document.querySelectorAll("main > section, main section, main > div > section")) {
      const r = s.getBoundingClientRect();
      if (r.height < 200) continue;
      if (s.querySelectorAll("section").length) continue;
      const top = r.top + window.scrollY;
      const boxes = inked(s).sort((a, b) => a[0] - b[0]);
      if (!boxes.length) continue;
      // Fusionner les intervalles pour connaître la hauteur réellement occupée.
      const merged = [];
      for (const b of boxes) {
        const last = merged[merged.length - 1];
        if (last && b[0] <= last[1] + 1) last[1] = Math.max(last[1], b[1]);
        else merged.push([...b]);
      }
      let biggestGap = 0;
      let gapAt = 0;
      for (let i = 1; i < merged.length; i += 1) {
        const g = merged[i][0] - merged[i - 1][1];
        if (g > biggestGap) { biggestGap = g; gapAt = Math.round(merged[i - 1][1] - top); }
      }
      const padTop = merged[0][0] - top;
      const padBottom = (top + r.height) - merged[merged.length - 1][1];
      const ink = merged.reduce((a, b) => a + (b[1] - b[0]), 0);
      out.push({
        cls: (s.className || "").toString().slice(0, 52),
        h: Math.round(r.height),
        ink: Math.round((ink / r.height) * 100),
        padTop: Math.round(padTop),
        padBottom: Math.round(padBottom),
        gap: Math.round(biggestGap),
        gapAt: Math.round(gapAt),
      });
    }
    return out;
  });

  const total = await page.evaluate(() => document.body.scrollHeight);
  console.log(`\n=== ${path}   page ${total}px ===`);
  console.log("  hauteur  encre  padHaut padBas  +grandVide   section");
  for (const r of rows) {
    const flag = r.gap > 90 || r.padTop > 90 || r.padBottom > 90 || r.ink < 45 ? " <<<" : "";
    console.log(`  ${String(r.h).padStart(6)}px  ${String(r.ink).padStart(3)}%  ${String(r.padTop).padStart(6)}  ${String(r.padBottom).padStart(5)}  ${String(r.gap).padStart(6)}px@${r.gapAt}  ${r.cls}${flag}`);
  }
  await context.close();
}

await browser.close();
