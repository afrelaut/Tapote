// TEMPORAIRE - benchmark porsche.com partie 3 : configurateur + menu mobile
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const out = path.resolve("output/benchmark-porsche");
await fs.mkdir(out, { recursive: true });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let browser;
try { browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] }); }
catch { browser = await chromium.launch({ headless: true }); }

const findings = {};

async function makeCtx(viewport) {
  const ctx = await browser.newContext({
    viewport, deviceScaleFactor: 1,
    isMobile: viewport.width < 500, hasTouch: viewport.width < 500,
    userAgent: viewport.width < 500
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" : UA,
    locale: "fr-FR", timezoneId: "Europe/Paris",
  });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });
  return ctx;
}
async function acceptCookies(page) {
  for (const t of [
    () => page.locator("#onetrust-accept-btn-handler").click({ timeout: 4000 }),
    () => page.getByRole("button", { name: /tout accepter|accepter tout|^accepter$/i }).first().click({ timeout: 4000 }),
    () => page.locator("button:has-text('Accepter')").first().click({ timeout: 3000 }),
  ]) { try { await t(); await page.waitForTimeout(1200); return true; } catch {} }
  return false;
}
async function settle(page, ms = 2000) {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  await page.waitForTimeout(ms);
}
const shot = (page, name, full = false) => page.screenshot({ path: path.join(out, `${name}.png`), fullPage: full }).catch((e) => console.log("shot fail", name, e.message));

const deepProbe = () => {
  const nodes = [];
  const walk = (root) => {
    const list = root.querySelectorAll ? root.querySelectorAll("*") : [];
    for (const el of list) { nodes.push(el); if (el.shadowRoot) walk(el.shadowRoot); }
  };
  walk(document);
  const vis = (el) => {
    try { const s = getComputedStyle(el); const b = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && b.width > 1 && b.height > 1; } catch { return false; }
  };
  const all = nodes.filter(vis);
  const typo = new Map();
  for (const el of all) {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const s = getComputedStyle(el);
    const size = Math.round(parseFloat(s.fontSize) * 10) / 10;
    const key = `${size}|${s.fontWeight}|${s.letterSpacing}|${Math.round(parseFloat(s.lineHeight) || 0)}|${s.textTransform}`;
    const e = typo.get(key) || { size, weight: s.fontWeight, tracking: s.letterSpacing, leading: Math.round(parseFloat(s.lineHeight) || 0), transform: s.textTransform, color: s.color, count: 0, sample: "" };
    e.count += 1;
    if (!e.sample) e.sample = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 46);
    typo.set(key, e);
  }
  const typoList = [...typo.values()].sort((a, b) => b.size - a.size);
  const shadows = {}, radii = {}, motion = {}, borders = {};
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.boxShadow !== "none") shadows[s.boxShadow] = (shadows[s.boxShadow] || 0) + 1;
    if (s.borderRadius !== "0px") radii[s.borderRadius] = (radii[s.borderRadius] || 0) + 1;
    if (s.borderTopWidth !== "0px" || s.borderBottomWidth !== "0px") {
      const k = `${s.borderTopWidth}/${s.borderBottomWidth} ${s.borderTopStyle} ${s.borderTopColor}`;
      borders[k] = (borders[k] || 0) + 1;
    }
    if (s.transitionDuration !== "0s") { const k = `T ${s.transitionProperty} ${s.transitionDuration} ${s.transitionTimingFunction}`; motion[k] = (motion[k] || 0) + 1; }
    if (s.animationName !== "none") { const k = `A ${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`; motion[k] = (motion[k] || 0) + 1; }
  }
  const media = [];
  for (const el of all) {
    if (el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "CANVAS") {
      const b = el.getBoundingClientRect(); const s = getComputedStyle(el);
      media.push({ tag: el.tagName, w: Math.round(b.width), h: Math.round(b.height),
        ratio: +(b.width / Math.max(b.height, 1)).toFixed(2), fit: s.objectFit,
        natural: el.naturalWidth ? `${el.naturalWidth}x${el.naturalHeight}` : null,
        radius: s.borderRadius, shadow: s.boxShadow === "none" ? null : s.boxShadow,
        src: (el.currentSrc || el.src || "").slice(0, 150) });
    }
  }
  return {
    docHeight: document.body.scrollHeight, viewport: { w: innerWidth, h: innerHeight },
    screens: +(document.body.scrollHeight / innerHeight).toFixed(1), nodeCount: all.length,
    typoSizes: [...new Set(typoList.map((t) => t.size))].sort((a, b) => b - a),
    typo: typoList.slice(0, 40),
    shadowTop: Object.entries(shadows).sort((a, b) => b[1] - a[1]).slice(0, 10),
    radiusTop: Object.entries(radii).sort((a, b) => b[1] - a[1]).slice(0, 10),
    borderTop: Object.entries(borders).sort((a, b) => b[1] - a[1]).slice(0, 10),
    motionTop: Object.entries(motion).sort((a, b) => b[1] - a[1]).slice(0, 24),
    media: media.slice(0, 25),
  };
};

// Cartographie des elements interactifs visibles (traverse shadow DOM)
const mapUI = () => {
  const acc = [];
  const walk = (root) => { for (const el of root.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } };
  walk(document);
  return acc.filter((e) => /^(A|BUTTON)$/.test(e.tagName) || e.getAttribute?.("role") === "button")
    .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 4 && b.height > 4 && b.top > -50 && b.top < innerHeight + 400; })
    .map((e) => { const b = e.getBoundingClientRect(); return {
      t: (e.textContent || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 46),
      href: (e.getAttribute("href") || "").slice(0, 90),
      x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height),
      fs: parseFloat(getComputedStyle(e).fontSize) }; })
    .slice(0, 80);
};

const priceProbe = () => {
  const acc = [];
  const walk = (root) => { for (const el of root.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } };
  walk(document);
  const re = /\d[\d\s .,]{3,}\s?€|€\s?\d/;
  return acc.filter((e) => { const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1; })
    .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && re.test(n.textContent)))
    .map((e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return {
      txt: e.textContent.trim().replace(/\s+/g, " ").slice(0, 60), y: Math.round(b.top), x: Math.round(b.left),
      fs: parseFloat(s.fontSize), fw: s.fontWeight, trans: s.transitionProperty + " " + s.transitionDuration }; })
    .slice(0, 15);
};

const D = { width: 1440, height: 900 };
const M = { width: 390, height: 844 };
const START = "https://models.porsche.com/fr-FR/model-start";

// ---------- Configurateur DESKTOP ----------
async function configurator(viewport, tag) {
  const ctx = await makeCtx(viewport); const page = await ctx.newPage();
  const rec = { steps: [] };
  try {
    await page.goto(START, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page, 3000);
    rec.cookies = await acceptCookies(page);
    await settle(page, 2000);
    await shot(page, `config-${tag}-01-model-start`);
    rec.startProbe = await page.evaluate(deepProbe).catch((e) => ({ error: String(e) }));
    rec.startUI = await page.evaluate(mapUI).catch(() => []);
    await shot(page, `config-${tag}-02-model-start-full`, true);

    // Choisir la 911
    let entered = false;
    for (const sel of [
      () => page.getByRole("link", { name: /^911$/i }).first(),
      () => page.locator('a:has-text("911")').first(),
      () => page.getByText(/^911$/).first(),
    ]) {
      try { await sel().click({ timeout: 8000 }); entered = true; break; } catch {}
    }
    rec.clicked911 = entered;
    await settle(page, 4000);
    rec.urlAfter911 = page.url();
    await shot(page, `config-${tag}-03-apres-911`);
    rec.step3UI = await page.evaluate(mapUI).catch(() => []);
    await shot(page, `config-${tag}-03b-apres-911-full`, true);

    // Choisir une declinaison (Carrera) -> entre dans le configurateur
    let entered2 = false;
    for (const sel of [
      () => page.getByRole("link", { name: /carrera(?! s)/i }).first(),
      () => page.locator('a:has-text("Carrera")').first(),
      () => page.getByRole("button", { name: /configurer|personnaliser/i }).first(),
    ]) {
      try { await sel().click({ timeout: 8000 }); entered2 = true; break; } catch {}
    }
    rec.clickedCarrera = entered2;
    await settle(page, 6000);
    rec.urlConfigurator = page.url();
    await shot(page, `config-${tag}-04-configurateur`);
    rec.configProbe = await page.evaluate(deepProbe).catch((e) => ({ error: String(e) }));
    rec.configUI = await page.evaluate(mapUI).catch(() => []);
    rec.priceBefore = await page.evaluate(priceProbe).catch(() => []);
    await shot(page, `config-${tag}-04b-configurateur-full`, true);

    // Structure : etapes / onglets
    rec.structure = await page.evaluate(() => {
      const acc = [];
      const walk = (root) => { for (const el of root.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } };
      walk(document);
      const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1; };
      const cols = acc.filter(vis).filter((e) => { const b = e.getBoundingClientRect(); return b.height > 300 && b.width > 200; })
        .map((e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return {
          tag: e.tagName, cls: (e.className?.baseVal ?? e.className ?? "").toString().slice(0, 50),
          x: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height),
          bg: s.backgroundColor, pos: s.position, overflow: s.overflowY }; });
      // dedupe
      const seen = new Set();
      return cols.filter((c) => { const k = `${c.x}-${c.w}-${c.h}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 20);
    }).catch(() => []);

    // Cliquer une couleur exterieure et mesurer la reaction
    let colorClicked = null;
    try {
      const tab = page.getByRole("button", { name: /ext[ée]rieur|couleur/i }).first();
      await tab.click({ timeout: 6000 });
      await page.waitForTimeout(2500);
      await shot(page, `config-${tag}-05-onglet-exterieur`);
    } catch {}
    try {
      const opts = page.locator('[data-testid*="option"], [class*="option"], li button, [role="radio"]');
      const n = await opts.count();
      for (let i = 0; i < Math.min(n, 25); i += 1) {
        const el = opts.nth(i);
        const box = await el.boundingBox().catch(() => null);
        if (box && box.width > 30 && box.height > 30) {
          colorClicked = (await el.textContent().catch(() => ""))?.trim().slice(0, 40);
          await el.click({ timeout: 4000 });
          break;
        }
      }
    } catch {}
    rec.colorClicked = colorClicked;
    await page.waitForTimeout(3500);
    await shot(page, `config-${tag}-06-apres-choix`);
    rec.priceAfter = await page.evaluate(priceProbe).catch(() => []);
    rec.afterUI = await page.evaluate(mapUI).catch(() => []);
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0, 300); }
  findings[`configurator-${tag}`] = rec;
  await page.close().catch(() => {}); await ctx.close();
}

await configurator(D, "desktop");
await configurator(M, "mobile");

// ---------- Menu mobile (retry) ----------
{
  const ctx = await makeCtx(M); const page = await ctx.newPage();
  const rec = {};
  try {
    await page.goto("https://www.porsche.com/france/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page, 3500); rec.cookies = await acceptCookies(page); await settle(page, 2000);
    await shot(page, "menu-mobile-00-avant");
    let opened = false;
    for (const sel of [
      () => page.getByRole("button", { name: /^menu$/i }).first(),
      () => page.locator('[aria-label*="Menu" i]').first(),
      () => page.locator("header button").first(),
    ]) { try { await sel().click({ timeout: 6000 }); opened = true; break; } catch {} }
    rec.opened = opened;
    await page.waitForTimeout(2500);
    await shot(page, "menu-mobile-01-ouvert");
    rec.ui = await page.evaluate(mapUI).catch(() => []);
    try {
      await page.getByRole("link", { name: /^mod[èe]les/i }).or(page.getByRole("button", { name: /^mod[èe]les/i })).first().click({ timeout: 6000 });
      await page.waitForTimeout(2200);
      await shot(page, "menu-mobile-02-modeles");
    } catch {}
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0, 250); }
  findings["menu-mobile"] = rec;
  await page.close().catch(() => {}); await ctx.close();
}

await fs.writeFile(path.join(out, "findings-part3.json"), JSON.stringify(findings, null, 2), "utf8");
console.log(JSON.stringify(Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, {
  ok: v.ok, err: v.error, urlConfig: v.urlConfigurator, url911: v.urlAfter911,
  c911: v.clicked911, cCar: v.clickedCarrera, color: v.colorClicked, opened: v.opened }]))), null, 2);
await browser.close();
