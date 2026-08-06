// TEMPORAIRE - benchmark porsche.com partie 2 (shadow DOM, modèle, configurateur, menu)
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
  ]) { try { await t(); await page.waitForTimeout(1000); return true; } catch {} }
  return false;
}
async function settle(page, ms = 2000) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  await page.waitForTimeout(ms);
}
async function fullScroll(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.7);
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 260)); }
  }).catch(() => {});
  await page.waitForTimeout(700);
}
const shot = (page, name, full = false) => page.screenshot({ path: path.join(out, `${name}.png`), fullPage: full }).catch((e) => console.log("shot fail", name, e.message));

// ---- probe profond : traverse les shadow roots ----
const deepProbe = () => {
  const nodes = [];
  const walk = (root) => {
    const list = root.querySelectorAll ? root.querySelectorAll("*") : [];
    for (const el of list) {
      nodes.push(el);
      if (el.shadowRoot) walk(el.shadowRoot);
    }
  };
  walk(document);
  const vis = (el) => {
    try {
      const s = getComputedStyle(el); const b = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && b.width > 1 && b.height > 1;
    } catch { return false; }
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

  const shadows = {}, radii = {}, motion = {};
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.boxShadow !== "none") shadows[s.boxShadow] = (shadows[s.boxShadow] || 0) + 1;
    if (s.borderRadius !== "0px") radii[s.borderRadius] = (radii[s.borderRadius] || 0) + 1;
    if (s.transitionDuration !== "0s") { const k = `T ${s.transitionProperty} ${s.transitionDuration} ${s.transitionTimingFunction}`; motion[k] = (motion[k] || 0) + 1; }
    if (s.animationName !== "none") { const k = `A ${s.animationName} ${s.animationDuration} ${s.animationTimingFunction} ${s.animationFillMode}`; motion[k] = (motion[k] || 0) + 1; }
  }

  // Extraction des @keyframes réellement définies
  const kf = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.type === CSSRule.KEYFRAMES_RULE) {
          kf.push({ name: rule.name, steps: [...rule.cssRules].map((r) => `${r.keyText}{${r.style.cssText}}`).join(" ") });
        }
      }
    } catch {}
  }

  return {
    docHeight: document.body.scrollHeight,
    viewport: { w: innerWidth, h: innerHeight },
    screens: +(document.body.scrollHeight / innerHeight).toFixed(1),
    nodeCount: all.length,
    typoSizes: [...new Set(typoList.map((t) => t.size))].sort((a, b) => b - a),
    typo: typoList.slice(0, 40),
    shadowTop: Object.entries(shadows).sort((a, b) => b[1] - a[1]).slice(0, 10),
    radiusTop: Object.entries(radii).sort((a, b) => b[1] - a[1]).slice(0, 10),
    motionTop: Object.entries(motion).sort((a, b) => b[1] - a[1]).slice(0, 20),
    keyframes: kf.filter((k) => /anim|show|fade|slide|reveal|tile|headline/i.test(k.name)).slice(0, 14),
  };
};

async function visit(label, url, viewport, opts = {}) {
  const ctx = await makeCtx(viewport);
  const page = await ctx.newPage();
  const rec = { url, viewport };
  try {
    const r = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    rec.status = r?.status();
    rec.finalUrl = page.url();
    await settle(page, opts.settle ?? 2500);
    rec.cookies = await acceptCookies(page);
    await settle(page, 1500);
    await shot(page, `${label}-01-above-fold`);
    if (opts.scroll !== false) {
      await fullScroll(page);
      await shot(page, `${label}-02-full`, true);
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
    }
    rec.probe = await page.evaluate(deepProbe).catch((e) => ({ error: String(e) }));
    rec.title = await page.title();
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0, 300); }
  findings[label] = rec;
  return { page, ctx };
}

const D = { width: 1440, height: 900 };
const M = { width: 390, height: 844 };

// A) Méga-menu desktop
{
  const ctx = await makeCtx(D); const page = await ctx.newPage();
  try {
    await page.goto("https://www.porsche.com/france/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page, 2500); await acceptCookies(page); await settle(page, 1500);
    const menuBtn = page.getByRole("button", { name: /menu/i }).first();
    await menuBtn.click({ timeout: 8000 });
    await page.waitForTimeout(1800);
    await shot(page, "megamenu-desktop-01-niveau1");
    findings["megamenu-desktop"] = { opened: true };
    // Structure du menu
    findings["megamenu-desktop"].structure = await page.evaluate(() => {
      const walk = (root, acc = []) => {
        for (const el of root.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot, acc); }
        return acc;
      };
      const all = walk(document);
      const links = all.filter((e) => (e.tagName === "A" || e.tagName === "BUTTON"))
        .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 && b.top < innerHeight && b.top > 40; })
        .map((e) => ({ t: (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40), x: Math.round(e.getBoundingClientRect().left), y: Math.round(e.getBoundingClientRect().top), fs: parseFloat(getComputedStyle(e).fontSize) }));
      return links.slice(0, 60);
    });
    // ouvrir "Modèles"
    const models = page.getByRole("link", { name: /^modèles/i }).or(page.getByRole("button", { name: /^modèles/i })).first();
    await models.click({ timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(1800);
    await shot(page, "megamenu-desktop-02-modeles");
  } catch (e) { findings["megamenu-desktop"] = { error: String(e).slice(0, 250) }; }
  await page.close().catch(() => {}); await ctx.close();
}

// B) Menu mobile
{
  const ctx = await makeCtx(M); const page = await ctx.newPage();
  try {
    await page.goto("https://www.porsche.com/france/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page, 2500); await acceptCookies(page); await settle(page, 1200);
    await page.getByRole("button", { name: /menu/i }).first().click({ timeout: 8000 });
    await page.waitForTimeout(1600);
    await shot(page, "megamenu-mobile-01");
    await page.getByRole("link", { name: /^modèles/i }).or(page.getByRole("button", { name: /^modèles/i })).first().click({ timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(1600);
    await shot(page, "megamenu-mobile-02-modeles");
    findings["megamenu-mobile"] = { opened: true };
  } catch (e) { findings["megamenu-mobile"] = { error: String(e).slice(0, 250) }; }
  await page.close().catch(() => {}); await ctx.close();
}

// C) Page modèle 911
{ const { page, ctx } = await visit("model-911-desktop", "https://www.porsche.com/france/models/911/", D); await page.close().catch(() => {}); await ctx.close(); }
{ const { page, ctx } = await visit("model-911-mobile", "https://www.porsche.com/france/models/911/", M); await page.close().catch(() => {}); await ctx.close(); }

// D) Listing gamme
{ const { page, ctx } = await visit("gamme-desktop", "https://www.porsche.com/france/modelsoverview/", D); await page.close().catch(() => {}); await ctx.close(); }

await fs.writeFile(path.join(out, "findings-part2.json"), JSON.stringify(findings, null, 2), "utf8");
console.log(JSON.stringify(Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, { ok: v.ok ?? v.opened, status: v.status, final: v.finalUrl, err: v.error }])), null, 2));
await browser.close();
