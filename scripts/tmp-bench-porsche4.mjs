// TEMPORAIRE - mesures fines configurateur + rythme + menu mobile
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const out = path.resolve("output/benchmark-porsche");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }
const findings = {};

async function makeCtx(vp) {
  const ctx = await browser.newContext({
    viewport: vp, deviceScaleFactor: 1,
    isMobile: vp.width < 500, hasTouch: vp.width < 500,
    userAgent: vp.width < 500 ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" : UA,
    locale: "fr-FR", timezoneId: "Europe/Paris",
  });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });
  return ctx;
}
async function cookies(page) {
  for (const t of [
    () => page.locator("#onetrust-accept-btn-handler").click({ timeout: 4000 }),
    () => page.getByRole("button", { name: /tout accepter|^accepter$/i }).first().click({ timeout: 4000 }),
  ]) { try { await t(); await page.waitForTimeout(1200); return true; } catch {} }
  return false;
}
const settle = async (page, ms = 2500) => {
  await page.waitForLoadState("networkidle", { timeout: 25000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  await page.waitForTimeout(ms);
};
const shot = (page, n) => page.screenshot({ path: path.join(out, `${n}.png`) }).catch(() => {});

// ---- probe : espacements, typo, geometrie ----
const spacingProbe = () => {
  const acc = [];
  const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } };
  walk(document);
  const vis = acc.filter((e) => { try { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 1 && b.height > 1 && s.display !== "none"; } catch { return false; } });
  const pad = {}, gap = {}, sizes = {}, weights = {}, radii = {}, colors = {}, bgs = {}, trans = {};
  for (const el of vis) {
    const s = getComputedStyle(el);
    for (const p of ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]) {
      const v = Math.round(parseFloat(s[p]) || 0); if (v > 0) pad[v] = (pad[v] || 0) + 1;
    }
    const g = Math.round(parseFloat(s.gap) || 0); if (g > 0) gap[g] = (gap[g] || 0) + 1;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (hasText) {
      const fs = Math.round(parseFloat(s.fontSize) * 100) / 100;
      sizes[fs] = (sizes[fs] || 0) + 1;
      weights[s.fontWeight] = (weights[s.fontWeight] || 0) + 1;
      colors[s.color] = (colors[s.color] || 0) + 1;
    }
    if (s.borderRadius !== "0px") radii[s.borderRadius] = (radii[s.borderRadius] || 0) + 1;
    if (s.backgroundColor !== "rgba(0, 0, 0, 0)") bgs[s.backgroundColor] = (bgs[s.backgroundColor] || 0) + 1;
    if (s.transitionDuration !== "0s") trans[`${s.transitionDuration} ${s.transitionTimingFunction}`] = (trans[`${s.transitionDuration} ${s.transitionTimingFunction}`] || 0) + 1;
  }
  const srt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);
  return {
    nodes: vis.length,
    padDistinct: Object.keys(pad).length, padTop: srt(pad).slice(0, 14),
    gapDistinct: Object.keys(gap).length, gapTop: srt(gap).slice(0, 10),
    fontSizesDistinct: Object.keys(sizes).length,
    fontSizes: Object.entries(sizes).map(([k, v]) => [+k, v]).sort((a, b) => b[0] - a[0]),
    fontSizesOnce: Object.entries(sizes).filter(([, v]) => v === 1).length,
    weights: srt(weights), textColorsDistinct: Object.keys(colors).length, textColors: srt(colors).slice(0, 8),
    bgDistinct: Object.keys(bgs).length, bgTop: srt(bgs).slice(0, 8),
    radiiTop: srt(radii).slice(0, 8), transTop: srt(trans).slice(0, 10),
  };
};

// ---- geometrie configurateur ----
const configGeom = () => {
  const acc = [];
  const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } };
  walk(document);
  const R = (e) => e.getBoundingClientRect();
  const sticky = acc.filter((e) => { const s = getComputedStyle(e); return /sticky|fixed/.test(s.position); })
    .map((e) => { const b = R(e); const s = getComputedStyle(e); return { pos: s.position, top: Math.round(b.top), h: Math.round(b.height), w: Math.round(b.width), z: s.zIndex, txt: (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60) }; })
    .filter((x) => x.h > 20 && x.w > 60).slice(0, 12);
  // pastilles de couleur = elements carres 60-120px
  const swatch = acc.filter((e) => { const b = R(e); return b.width > 50 && b.width < 130 && Math.abs(b.width - b.height) < 12; })
    .map((e) => { const b = R(e); const s = getComputedStyle(e); return { w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.left), y: Math.round(b.top), radius: s.borderRadius, border: `${s.borderWidth} ${s.borderStyle} ${s.borderColor}`, outline: s.outline, shadow: s.boxShadow, trans: s.transition.slice(0, 60) } });
  const media = acc.filter((e) => /^(IMG|CANVAS|VIDEO)$/.test(e.tagName))
    .map((e) => { const b = R(e); const s = getComputedStyle(e); return { tag: e.tagName, w: Math.round(b.width), h: Math.round(b.height), r: +(b.width / Math.max(b.height, 1)).toFixed(3), fit: s.objectFit, radius: s.borderRadius, shadow: s.boxShadow === "none" ? null : s.boxShadow.slice(0, 50), src: (e.currentSrc || e.src || "").slice(0, 120) } })
    .filter((m) => m.w > 60).slice(0, 20);
  const priceEls = acc.filter((e) => { const b = R(e); return b.width > 1 && [...e.childNodes].some((n) => n.nodeType === 3 && /\d[\d\s .,]{2,}\s?€/.test(n.textContent)); })
    .map((e) => { const b = R(e); const s = getComputedStyle(e); return { txt: e.textContent.trim().replace(/\s+/g, " ").slice(0, 50), x: Math.round(b.left), y: Math.round(b.top), fs: parseFloat(s.fontSize), fw: s.fontWeight, color: s.color } }).slice(0, 18);
  // colonnes principales
  const cols = acc.filter((e) => { const b = R(e); return b.height > 400 && b.width > 250 && b.width < 1500; })
    .map((e) => { const b = R(e); const s = getComputedStyle(e); return { x: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height), pos: s.position, ov: s.overflowY, bg: s.backgroundColor } });
  const seen = new Set();
  const colsU = cols.filter((c) => { const k = `${c.x}|${c.w}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 12);
  return { sticky, swatchCount: swatch.length, swatchSample: swatch.slice(0, 6), media, priceEls, cols: colsU, scrollH: document.documentElement.scrollHeight, vh: innerHeight };
};

// ============ 1. configurateur desktop, mesures fines ============
{
  const ctx = await makeCtx({ width: 1440, height: 900 }); const page = await ctx.newPage();
  const rec = {};
  try {
    await page.goto("https://configurator.porsche.com/fr-FR/mode/model/9921B2", { waitUntil: "domcontentloaded", timeout: 90000 });
    await settle(page, 6000);
    rec.cookies = await cookies(page); await settle(page, 4000);
    rec.url = page.url();
    await shot(page, "config-desktop-10-mesure-initial");
    rec.geom = await page.evaluate(configGeom).catch((e) => ({ err: String(e) }));
    rec.style = await page.evaluate(spacingProbe).catch((e) => ({ err: String(e) }));
    // prix avant
    const readPrice = () => {
      const acc = []; const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } }; walk(document);
      const m = acc.filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && /\d{2,3}\s?\d{3},\d{2}\s?€/.test(n.textContent)));
      return m.map((e) => e.textContent.trim().replace(/\s+/g, " ").slice(0, 40)).slice(0, 5);
    };
    rec.priceBefore = await page.evaluate(readPrice);
    // cliquer une pastille couleur payante (Reves)
    const clicked = await page.evaluate(() => {
      const acc = []; const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } }; walk(document);
      const sw = acc.filter((e) => { const b = e.getBoundingClientRect(); return b.width > 70 && b.width < 110 && Math.abs(b.width - b.height) < 10 && b.top > 500; });
      if (!sw.length) return null;
      const t = sw[Math.min(10, sw.length - 1)];
      t.scrollIntoView({ block: "center" });
      const lbl = t.getAttribute("aria-label") || t.title || t.textContent || "";
      t.click();
      return lbl.slice(0, 60) || "(sans label)";
    });
    rec.clicked = clicked;
    await page.waitForTimeout(1200);
    await shot(page, "config-desktop-11-apres-clic-1200ms");
    rec.priceAt1200 = await page.evaluate(readPrice);
    await page.waitForTimeout(4000);
    await shot(page, "config-desktop-12-apres-clic-5200ms");
    rec.priceAfter = await page.evaluate(readPrice);
    rec.geomAfter = await page.evaluate(configGeom).catch(() => null);
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0, 250); }
  findings.configDesktopFine = rec;
  await ctx.close();
}

// ============ 2. rythme home desktop, viewport par viewport ============
{
  const ctx = await makeCtx({ width: 1440, height: 900 }); const page = await ctx.newPage();
  const rec = {};
  try {
    await page.goto("https://www.porsche.com/france/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page, 3500); await cookies(page); await settle(page, 2500);
    rec.style = await page.evaluate(spacingProbe).catch((e) => ({ err: String(e) }));
    rec.sections = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("section, main > div, [class*='Teaser'], [class*='Stage']")) {
        const b = el.getBoundingClientRect(); const s = getComputedStyle(el);
        if (b.height < 120 || b.width < 600) continue;
        out.push({ cls: (el.className || "").toString().slice(0, 46), top: Math.round(b.top + scrollY), h: Math.round(b.height), pt: Math.round(parseFloat(s.paddingTop)), pb: Math.round(parseFloat(s.paddingBottom)), bg: s.backgroundColor });
      }
      const seen = new Set();
      return out.filter((o) => { const k = `${o.top}|${o.h}`; if (seen.has(k)) return false; seen.add(k); return true; });
    });
    for (let i = 0; i < 8; i += 1) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), i * 900);
      await page.waitForTimeout(1600);
      await shot(page, `home-desktop-vp-${String(i).padStart(2, "0")}`);
    }
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0, 250); }
  findings.homeRhythm = rec;
  await ctx.close();
}

// ============ 3. menu mobile (nouvelle tentative) ============
{
  const ctx = await makeCtx({ width: 390, height: 844 }); const page = await ctx.newPage();
  const rec = {};
  try {
    await page.goto("https://www.porsche.com/france/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page, 4000); await cookies(page); await settle(page, 3000);
    const btn = await page.evaluate(() => {
      const acc = []; const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } }; walk(document);
      const c = acc.filter((e) => (e.tagName === "BUTTON" || e.getAttribute?.("role") === "button"))
        .filter((e) => { const b = e.getBoundingClientRect(); return b.top < 90 && b.left < 120 && b.width > 20; });
      if (!c.length) return null;
      c[0].click(); return (c[0].getAttribute("aria-label") || c[0].textContent || "?").slice(0, 30);
    });
    rec.btn = btn;
    await page.waitForTimeout(3000);
    await shot(page, "menu-mobile-10-ouvert");
    rec.items = await page.evaluate(() => {
      const acc = []; const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } }; walk(document);
      return acc.filter((e) => /^(A|BUTTON)$/.test(e.tagName))
        .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 100 && b.height > 24 && b.top > 0 && b.top < 900; })
        .map((e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return { t: (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30), y: Math.round(b.top), h: Math.round(b.height), fs: parseFloat(s.fontSize) } }).slice(0, 20);
    });
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0, 250); }
  findings.menuMobile = rec;
  await ctx.close();
}

// ============ 4. page modele 911, mesures ============
{
  const ctx = await makeCtx({ width: 1440, height: 900 }); const page = await ctx.newPage();
  const rec = {};
  try {
    await page.goto("https://www.porsche.com/france/models/911/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page, 3500); await cookies(page); await settle(page, 2500);
    rec.style = await page.evaluate(spacingProbe).catch((e) => ({ err: String(e) }));
    for (let i = 0; i < 5; i += 1) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), i * 900);
      await page.waitForTimeout(1500);
      await shot(page, `model911-desktop-vp-${String(i).padStart(2, "0")}`);
    }
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0, 250); }
  findings.model911 = rec;
  await ctx.close();
}

await fs.writeFile(path.join(out, "findings-part4.json"), JSON.stringify(findings, null, 2), "utf8");
console.log("configDesktopFine", findings.configDesktopFine.ok, findings.configDesktopFine.error || "", findings.configDesktopFine.clicked);
console.log("prices", JSON.stringify(findings.configDesktopFine.priceBefore), "->", JSON.stringify(findings.configDesktopFine.priceAfter));
console.log("homeRhythm", findings.homeRhythm.ok, findings.homeRhythm.error || "");
console.log("menuMobile", findings.menuMobile.ok, findings.menuMobile.btn, findings.menuMobile.error || "");
console.log("model911", findings.model911.ok, findings.model911.error || "");
await browser.close();
