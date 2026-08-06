// TEMPORAIRE - benchmark porsche.com (à supprimer après audit)
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const out = path.resolve("output/benchmark-porsche");
await fs.mkdir(out, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] });
} catch {
  browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled"] });
}

const findings = {};

async function makeCtx(viewport) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width < 500,
    hasTouch: viewport.width < 500,
    userAgent: viewport.width < 500
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
      : UA,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  return ctx;
}

async function acceptCookies(page) {
  const tries = [
    () => page.locator("#onetrust-accept-btn-handler").click({ timeout: 4000 }),
    () => page.getByRole("button", { name: /tout accepter|accepter tout|accepter/i }).first().click({ timeout: 4000 }),
    () => page.frameLocator("iframe[title*='consent' i]").getByRole("button", { name: /accepter/i }).first().click({ timeout: 4000 }),
    () => page.locator("[data-testid*='accept' i], button[class*='accept' i]").first().click({ timeout: 4000 }),
  ];
  for (const t of tries) {
    try { await t(); await page.waitForTimeout(1200); return true; } catch { /* next */ }
  }
  return false;
}

async function settle(page, ms = 1500) {
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  await page.waitForTimeout(ms);
}

// Scroll complet pour déclencher les révélations, puis retour en haut.
async function fullScroll(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.7);
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 280));
    }
  }).catch(() => {});
  await page.waitForTimeout(800);
}

// ---- Extraction de mécaniques mesurables ----
const probe = () => {
  const vis = (el) => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && b.width > 1 && b.height > 1;
  };
  const all = [...document.querySelectorAll("body *")].filter(vis);

  // Typographie : recense les couples (font-size, weight, family, letter-spacing, line-height)
  const typo = new Map();
  for (const el of all) {
    if (!el.childNodes.length) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const s = getComputedStyle(el);
    const key = `${parseFloat(s.fontSize)}|${s.fontWeight}|${s.fontFamily.split(",")[0].replace(/["']/g, "")}|${s.letterSpacing}|${parseFloat(s.lineHeight) || s.lineHeight}|${s.textTransform}`;
    const e = typo.get(key) || { size: parseFloat(s.fontSize), weight: s.fontWeight, family: s.fontFamily.split(",")[0].replace(/["']/g, ""), tracking: s.letterSpacing, leading: parseFloat(s.lineHeight) || s.lineHeight, transform: s.textTransform, count: 0, sample: "" };
    e.count += 1;
    if (!e.sample) e.sample = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 48);
    typo.set(key, e);
  }
  const typoList = [...typo.values()].sort((a, b) => b.size - a.size);

  // Sections : hauteur, padding vertical
  const sections = [...document.querySelectorAll("section, [class*='section' i], main > div, main > *")]
    .filter(vis)
    .map((el) => {
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 60),
        h: Math.round(b.height),
        w: Math.round(b.width),
        pt: parseFloat(s.paddingTop),
        pb: parseFloat(s.paddingBottom),
        mt: parseFloat(s.marginTop),
        mb: parseFloat(s.marginBottom),
        bg: s.backgroundColor,
      };
    })
    .filter((s) => s.h > 120)
    .slice(0, 40);

  // Couleurs réellement présentes (fond + texte) pondérées par surface
  const colorArea = {};
  const textColor = {};
  for (const el of all) {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const a = Math.round(b.width * b.height);
    if (s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)") {
      colorArea[s.backgroundColor] = (colorArea[s.backgroundColor] || 0) + a;
    }
    textColor[s.color] = (textColor[s.color] || 0) + 1;
  }

  // Transitions / animations déclarées
  const motion = {};
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.transitionDuration && s.transitionDuration !== "0s") {
      const k = `${s.transitionProperty} ${s.transitionDuration} ${s.transitionTimingFunction}`;
      motion[k] = (motion[k] || 0) + 1;
    }
    if (s.animationName && s.animationName !== "none") {
      const k = `@${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`;
      motion[k] = (motion[k] || 0) + 1;
    }
  }

  // Ombres et rayons (le « pas de carte générique »)
  const shadows = {};
  const radii = {};
  const borders = {};
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.boxShadow && s.boxShadow !== "none") shadows[s.boxShadow] = (shadows[s.boxShadow] || 0) + 1;
    if (s.borderRadius && s.borderRadius !== "0px") radii[s.borderRadius] = (radii[s.borderRadius] || 0) + 1;
    if (s.borderTopWidth !== "0px" || s.borderBottomWidth !== "0px") {
      borders[`${s.borderTopWidth}/${s.borderBottomWidth} ${s.borderTopColor}`] = (borders[`${s.borderTopWidth}/${s.borderBottomWidth} ${s.borderTopColor}`] || 0) + 1;
    }
  }

  // Images : ratios, tailles, object-fit
  const imgs = [...document.querySelectorAll("img, picture img, video")].filter(vis).map((el) => {
    const b = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      w: Math.round(b.width), h: Math.round(b.height),
      ratio: +(b.width / b.height).toFixed(2),
      fit: s.objectFit,
      natural: el.naturalWidth ? `${el.naturalWidth}x${el.naturalHeight}` : null,
      src: (el.currentSrc || el.src || "").slice(0, 110),
      alt: (el.alt || "").slice(0, 60),
      radius: s.borderRadius,
      shadow: s.boxShadow !== "none",
    };
  }).slice(0, 30);

  // Largeur de la colonne de texte principale
  const paras = [...document.querySelectorAll("p")].filter(vis).map((p) => Math.round(p.getBoundingClientRect().width));

  // Conteneur max
  const containers = [...document.querySelectorAll("div,section,main")].filter(vis)
    .map((el) => ({ w: Math.round(el.getBoundingClientRect().width), ml: Math.round(el.getBoundingClientRect().left) }))
    .filter((c) => c.w > 600);

  return {
    docHeight: document.body.scrollHeight,
    viewport: { w: innerWidth, h: innerHeight },
    screens: +(document.body.scrollHeight / innerHeight).toFixed(1),
    typo: typoList.slice(0, 30),
    typoDistinctSizes: [...new Set(typoList.map((t) => t.size))].sort((a, b) => b - a),
    sections,
    bgTop: Object.entries(colorArea).sort((a, b) => b[1] - a[1]).slice(0, 8),
    textTop: Object.entries(textColor).sort((a, b) => b[1] - a[1]).slice(0, 8),
    motionTop: Object.entries(motion).sort((a, b) => b[1] - a[1]).slice(0, 15),
    shadowTop: Object.entries(shadows).sort((a, b) => b[1] - a[1]).slice(0, 10),
    radiusTop: Object.entries(radii).sort((a, b) => b[1] - a[1]).slice(0, 10),
    borderTop: Object.entries(borders).sort((a, b) => b[1] - a[1]).slice(0, 8),
    imgs,
    paraWidths: [...new Set(paras)].sort((a, b) => b - a).slice(0, 10),
    maxContainer: Math.max(0, ...containers.map((c) => c.w)),
    fontsLoaded: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style}`).filter((v, i, a) => a.indexOf(v) === i).slice(0, 12),
  };
};

async function capture(page, name, { full = false } = {}) {
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file, fullPage: full }).catch((e) => console.log("shot fail", name, e.message));
  return file;
}

async function visit(label, url, viewport, { scroll = true, fullShot = true } = {}) {
  const ctx = await makeCtx(viewport);
  const page = await ctx.newPage();
  const rec = { url, viewport, ok: false };
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    rec.status = resp?.status();
    await settle(page, 2500);
    rec.cookiesAccepted = await acceptCookies(page);
    await settle(page, 1500);
    await capture(page, `${label}-01-above-fold`);
    if (scroll) {
      await fullScroll(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(700);
      if (fullShot) await capture(page, `${label}-02-full`, { full: true });
    }
    rec.probe = await page.evaluate(probe).catch((e) => ({ error: String(e) }));
    rec.title = await page.title();
    rec.ok = true;
  } catch (e) {
    rec.error = String(e).slice(0, 300);
  }
  findings[label] = rec;
  return { page, ctx };
}

const D = { width: 1440, height: 900 };
const M = { width: 390, height: 844 };

// 1) Accueil desktop
{
  const { page, ctx } = await visit("home-desktop", "https://www.porsche.com/france/", D);
  if (!page.isClosed?.()) {
    // Méga-menu
    try {
      const nav = page.locator("header a, header button").filter({ hasText: /modèles|models/i }).first();
      await nav.hover({ timeout: 5000 });
      await page.waitForTimeout(1200);
      await nav.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await capture(page, "home-desktop-03-megamenu");
    } catch (e) { findings["megamenu-desktop"] = { error: String(e).slice(0, 200) }; }
    // Sections en cours de scroll : 3 arrêts précis
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.keyboard.press("Escape").catch(() => {});
    for (const [i, frac] of [0.25, 0.5, 0.75].entries()) {
      await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), frac);
      await page.waitForTimeout(1400);
      await capture(page, `home-desktop-04-scroll-${i + 1}`);
    }
    await page.close(); await ctx.close();
  }
}

// 2) Accueil mobile
{
  const { page, ctx } = await visit("home-mobile", "https://www.porsche.com/france/", M);
  if (!page.isClosed?.()) {
    try {
      const burger = page.locator("header button").first();
      await burger.click({ timeout: 5000 });
      await page.waitForTimeout(1500);
      await capture(page, "home-mobile-03-menu");
    } catch (e) { findings["menu-mobile"] = { error: String(e).slice(0, 200) }; }
    await page.close(); await ctx.close();
  }
}

await fs.writeFile(path.join(out, "findings-part1.json"), JSON.stringify(findings, null, 2), "utf8");
console.log(JSON.stringify(Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, { ok: v.ok, status: v.status, title: v.title, cookies: v.cookiesAccepted, err: v.error }])), null, 2));

await browser.close();
