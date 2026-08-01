import { chromium } from "playwright-core";

// Chercher la 3D partout, pas seulement dans le document principal :
// iframes (Spline/Vectary), vidéos, lottie, canvas, WebGL, animations CSS.

const url = process.argv[2] || "https://vkard.io/";
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
const page = await context.newPage();

const netHits = [];
page.on("request", (r) => {
  const u = r.url();
  if (/spline|\.splinecode|vectary|three|\.glb|\.gltf|\.usdz|lottie|\.json\?|rive|\.riv|\.webm|\.mp4/i.test(u)) {
    netHits.push(`${r.resourceType()}  ${u.slice(0, 130)}`);
  }
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(6000);

console.log("=== FRAMES ===");
for (const f of page.frames()) console.log(`  ${f.url().slice(0, 120)}`);

console.log("\n=== CANVAS / WEBGL par frame ===");
for (const f of page.frames()) {
  try {
    const r = await f.evaluate(() => {
      const cs = [...document.querySelectorAll("canvas")].map((c) => {
        let ctx = "?";
        try { ctx = c.getContext("webgl2") ? "webgl2" : c.getContext("webgl") ? "webgl" : "2d/none"; } catch { /* ignore */ }
        const b = c.getBoundingClientRect();
        return `canvas ${Math.round(b.width)}x${Math.round(b.height)} ctx=${ctx}`;
      });
      const vids = [...document.querySelectorAll("video")].map((v) => {
        const b = v.getBoundingClientRect();
        return `video ${Math.round(b.width)}x${Math.round(b.height)} src=${(v.currentSrc || v.src || "").slice(0, 80)} autoplay=${v.autoplay} loop=${v.loop}`;
      });
      const lottie = document.querySelectorAll("[class*='lottie'],lottie-player,dotlottie-player").length;
      const spline = document.querySelectorAll("spline-viewer,[class*='spline']").length;
      const imgs = [...document.querySelectorAll("img")].filter((i) => /\.(webp|gif|avif)$/i.test(i.currentSrc || i.src || "")).slice(0, 4)
        .map((i) => `img ${(i.currentSrc || i.src).split("/").pop().slice(0, 60)}`);
      return { cs, vids, lottie, spline, imgs };
    });
    if (r.cs.length || r.vids.length || r.lottie || r.spline || r.imgs.length) {
      console.log(`  [${f.url().slice(0, 60)}]`);
      [...r.cs, ...r.vids, ...r.imgs].forEach((x) => console.log(`     ${x}`));
      if (r.lottie) console.log(`     lottie: ${r.lottie}`);
      if (r.spline) console.log(`     spline: ${r.spline}`);
    }
  } catch { /* frame cross-origin non lisible */ }
}

console.log("\n=== REQUETES 3D / MEDIA ===");
[...new Set(netHits)].slice(0, 25).forEach((h) => console.log("  " + h));

console.log("\n=== HERO : contenu du premier ecran ===");
console.log(await page.evaluate(() => {
  const out = [];
  const walk = (el, depth) => {
    if (depth > 4) return;
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      if (r.top > 900 || r.height < 40 || r.width < 60) continue;
      const tag = c.tagName.toLowerCase();
      if (["img", "video", "canvas", "svg", "iframe", "picture"].includes(tag)) {
        out.push(`  ${tag} ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)} src=${(c.currentSrc || c.src || "").split("/").pop().slice(0, 55)}`);
      }
      walk(c, depth + 1);
    }
  };
  walk(document.body, 0);
  return out.slice(0, 20).join("\n");
}));

await browser.close();
