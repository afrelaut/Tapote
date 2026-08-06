// TEMPORAIRE - benchmark panel international (à supprimer après audit)
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const out = path.resolve("output/benchmark-panel");
await fs.mkdir(out, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const UAM = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] });
} catch {
  browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled"] });
}

const findings = {};

async function makeCtx(viewport, locale = "fr-FR") {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width < 500,
    hasTouch: viewport.width < 500,
    userAgent: viewport.width < 500 ? UAM : UA,
    locale,
    timezoneId: "Europe/Paris",
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  return ctx;
}

async function acceptCookies(page) {
  const tries = [
    () => page.locator("#onetrust-accept-btn-handler").click({ timeout: 3500 }),
    () => page.locator("#wcpConsentBannerCtrl button").first().click({ timeout: 3500 }),
    () => page.getByRole("button", { name: /^(tout accepter|accepter tout|accepter|accept all|accept all cookies|allow all|j.accepte)$/i }).first().click({ timeout: 3500 }),
    () => page.locator("[data-testid*='accept' i], button[class*='accept' i], button[id*='accept' i]").first().click({ timeout: 3500 }),
    () => page.frameLocator("iframe[title*='consent' i]").getByRole("button", { name: /accepter|accept/i }).first().click({ timeout: 3500 }),
  ];
  for (const t of tries) {
    try { await t(); await page.waitForTimeout(1200); return true; } catch { /* next */ }
  }
  return false;
}

async function settle(page, ms = 1500) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function fullScroll(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 260));
    }
  }).catch(() => {});
  await page.waitForTimeout(800);
}

const probe = () => {
  const vis = (el) => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && b.width > 1 && b.height > 1;
  };
  const all = [...document.querySelectorAll("body *")].filter(vis);

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

  const sections = [...document.querySelectorAll("section, [class*='section' i], main > div, main > *")]
    .filter(vis)
    .map((el) => {
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 50),
        h: Math.round(b.height), w: Math.round(b.width),
        pt: parseFloat(s.paddingTop), pb: parseFloat(s.paddingBottom),
        bg: s.backgroundColor,
      };
    })
    .filter((s) => s.h > 120).slice(0, 30);

  const colorArea = {}; const textColor = {};
  for (const el of all) {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const a = Math.round(b.width * b.height);
    if (s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)") colorArea[s.backgroundColor] = (colorArea[s.backgroundColor] || 0) + a;
    textColor[s.color] = (textColor[s.color] || 0) + 1;
  }

  const motion = {};
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.transitionDuration && s.transitionDuration !== "0s") {
      const k = `${s.transitionProperty.slice(0, 40)} ${s.transitionDuration} ${s.transitionTimingFunction}`;
      motion[k] = (motion[k] || 0) + 1;
    }
    if (s.animationName && s.animationName !== "none") {
      const k = `@${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`;
      motion[k] = (motion[k] || 0) + 1;
    }
  }

  const shadows = {}; const radii = {}; const borders = {};
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.boxShadow && s.boxShadow !== "none") shadows[s.boxShadow] = (shadows[s.boxShadow] || 0) + 1;
    if (s.borderRadius && s.borderRadius !== "0px") radii[s.borderRadius] = (radii[s.borderRadius] || 0) + 1;
    if (s.borderTopWidth !== "0px" || s.borderBottomWidth !== "0px") {
      const k = `${s.borderTopWidth}/${s.borderBottomWidth} ${s.borderTopColor}`;
      borders[k] = (borders[k] || 0) + 1;
    }
  }

  const imgs = [...document.querySelectorAll("img, picture img, video")].filter(vis).map((el) => {
    const b = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(), w: Math.round(b.width), h: Math.round(b.height),
      ratio: +(b.width / b.height).toFixed(2), fit: s.objectFit,
      natural: el.naturalWidth ? `${el.naturalWidth}x${el.naturalHeight}` : null,
      alt: (el.alt || "").slice(0, 60), radius: s.borderRadius, shadow: s.boxShadow !== "none",
      loop: el.tagName === "VIDEO" ? el.loop : undefined,
      autoplay: el.tagName === "VIDEO" ? el.autoplay : undefined,
      muted: el.tagName === "VIDEO" ? el.muted : undefined,
    };
  }).slice(0, 25);

  const paras = [...document.querySelectorAll("p")].filter(vis).map((p) => Math.round(p.getBoundingClientRect().width));
  const containers = [...document.querySelectorAll("div,section,main")].filter(vis)
    .map((el) => Math.round(el.getBoundingClientRect().width)).filter((w) => w > 600);

  // ---- accessibilité mesurée ----
  const focusables = [...document.querySelectorAll('a[href],button:not([disabled]),input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(vis);
  const tiny = focusables.map((el) => {
    const b = el.getBoundingClientRect();
    return { label: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40), w: Math.round(b.width), h: Math.round(b.height) };
  }).filter((t) => t.w < 44 || t.h < 44);

  const skipLink = [...document.querySelectorAll("a[href^='#']")].slice(0, 5)
    .map((a) => (a.textContent || "").trim().slice(0, 50)).filter(Boolean);

  // règles :focus-visible déclarées dans les feuilles de style
  const focusRules = [];
  for (const sheet of [...document.styleSheets]) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const r of rules) {
      if (r.selectorText && /focus-visible|:focus\b/.test(r.selectorText) && /outline|box-shadow|border/.test(r.cssText)) {
        focusRules.push(r.cssText.replace(/\s+/g, " ").slice(0, 220));
      }
      if (focusRules.length > 24) break;
    }
    if (focusRules.length > 24) break;
  }

  const reducedMotion = [];
  for (const sheet of [...document.styleSheets]) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const r of rules) {
      if (r.media && /prefers-reduced-motion/.test(r.conditionText || r.media.mediaText || "")) {
        reducedMotion.push((r.conditionText || r.media.mediaText) + " {" + [...r.cssRules].slice(0, 2).map((x) => x.cssText.replace(/\s+/g, " ").slice(0, 120)).join(" ") + "}");
      }
      if (reducedMotion.length > 5) break;
    }
    if (reducedMotion.length > 5) break;
  }

  const landmarks = {
    header: document.querySelectorAll("header, [role=banner]").length,
    nav: document.querySelectorAll("nav, [role=navigation]").length,
    main: document.querySelectorAll("main, [role=main]").length,
    footer: document.querySelectorAll("footer, [role=contentinfo]").length,
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().replace(/\s+/g, " ").slice(0, 60)),
    headingSeq: [...document.querySelectorAll("h1,h2,h3")].slice(0, 20).map((h) => `${h.tagName}:${h.textContent.trim().replace(/\s+/g, " ").slice(0, 40)}`),
    imgNoAlt: [...document.images].filter(vis).filter((i) => !i.hasAttribute("alt")).length,
    ariaLive: document.querySelectorAll("[aria-live]").length,
    langAttr: document.documentElement.lang,
  };

  // structure de l'offre tarifaire si présente
  const priceLike = [...document.querySelectorAll("*")].filter(vis).filter((el) => {
    const t = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
    return /^[€$]?\s?\d+([.,]\d+)?\s?[€$]?$/.test(t) && t.length < 12;
  }).slice(0, 12).map((el) => {
    const s = getComputedStyle(el);
    return { text: el.textContent.trim().slice(0, 20), size: parseFloat(s.fontSize), weight: s.fontWeight };
  });

  return {
    docHeight: document.body.scrollHeight,
    viewport: { w: innerWidth, h: innerHeight },
    screens: +(document.body.scrollHeight / innerHeight).toFixed(1),
    typo: typoList.slice(0, 26),
    typoDistinctSizes: [...new Set(typoList.map((t) => t.size))].sort((a, b) => b - a),
    sections,
    bgTop: Object.entries(colorArea).sort((a, b) => b[1] - a[1]).slice(0, 7),
    textTop: Object.entries(textColor).sort((a, b) => b[1] - a[1]).slice(0, 7),
    motionTop: Object.entries(motion).sort((a, b) => b[1] - a[1]).slice(0, 14),
    shadowTop: Object.entries(shadows).sort((a, b) => b[1] - a[1]).slice(0, 8),
    radiusTop: Object.entries(radii).sort((a, b) => b[1] - a[1]).slice(0, 8),
    borderTop: Object.entries(borders).sort((a, b) => b[1] - a[1]).slice(0, 6),
    imgs,
    paraWidths: [...new Set(paras)].sort((a, b) => b - a).slice(0, 8),
    maxContainer: Math.max(0, ...containers),
    fontsLoaded: [...document.fonts].map((f) => `${f.family} ${f.weight}`).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10),
    a11y: { tinyTargets: tiny.length, tinySamples: tiny.slice(0, 5), skipLink, focusRules: focusRules.slice(0, 12), reducedMotion, landmarks },
    priceLike,
  };
};

// mesure le style de focus réellement peint après N tabulations
async function focusWalk(page, steps = 8) {
  const res = [];
  for (let i = 0; i < steps; i += 1) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(180);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 45),
        outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`,
        outlineOffset: s.outlineOffset,
        boxShadow: s.boxShadow === "none" ? null : s.boxShadow.slice(0, 90),
        rect: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
        inViewport: b.top >= -5 && b.top < innerHeight,
      };
    }).catch(() => null);
    if (info) res.push(info);
  }
  return res;
}

async function capture(page, name, { full = false } = {}) {
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: full }).catch((e) => console.log("shot fail", name, e.message));
}

async function visit(label, url, viewport, opts = {}) {
  const { scroll = true, fullShot = true, locale = "fr-FR", after = null } = opts;
  const ctx = await makeCtx(viewport, locale);
  const page = await ctx.newPage();
  const rec = { url, viewport, ok: false };
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    rec.status = resp?.status();
    await settle(page, 2500);
    rec.cookiesAccepted = await acceptCookies(page);
    await settle(page, 1200);
    await capture(page, `${label}-01-fold`);
    if (scroll) {
      await fullScroll(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(700);
      if (fullShot) await capture(page, `${label}-02-full`, { full: true });
    }
    rec.probe = await page.evaluate(probe).catch((e) => ({ error: String(e) }));
    rec.title = await page.title();
    rec.ok = true;
    if (after) await after(page, rec);
  } catch (e) {
    rec.error = String(e).slice(0, 300);
  }
  findings[label] = rec;
  await page.close().catch(() => {});
  await ctx.close().catch(() => {});
}

const D = { width: 1440, height: 900 };
const M = { width: 390, height: 844 };

const batch = process.argv[2] || "1";

if (batch === "1") {
  // APPLE — fiche produit
  await visit("apple-iphone-desktop", "https://www.apple.com/fr/iphone-17-pro/", D, {
    after: async (page, rec) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      rec.focusWalk = await focusWalk(page, 6);
      for (const [i, f] of [0.15, 0.3, 0.5, 0.7].entries()) {
        await page.evaluate((fr) => window.scrollTo({ top: document.body.scrollHeight * fr, behavior: "instant" }), f);
        await page.waitForTimeout(1600);
        await capture(page, `apple-iphone-desktop-03-scroll-${i + 1}`);
      }
    },
  });
  await visit("apple-iphone-mobile", "https://www.apple.com/fr/iphone-17-pro/", M);
  await visit("apple-buy-desktop", "https://www.apple.com/fr/shop/buy-iphone/iphone-17-pro", D);
  await visit("apple-buy-mobile", "https://www.apple.com/fr/shop/buy-iphone/iphone-17-pro", M);
}

if (batch === "2") {
  await visit("stripe-home-desktop", "https://stripe.com/fr", D, {
    after: async (page, rec) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      rec.focusWalk = await focusWalk(page, 6);
    },
  });
  await visit("stripe-home-mobile", "https://stripe.com/fr", M);
  await visit("stripe-pricing-desktop", "https://stripe.com/fr/pricing", D);
  await visit("stripe-pricing-mobile", "https://stripe.com/fr/pricing", M);
}

if (batch === "3") {
  await visit("microsoft-home-desktop", "https://www.microsoft.com/fr-fr/", D, {
    after: async (page, rec) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      rec.focusWalk = await focusWalk(page, 10);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.keyboard.press("Tab");
      await page.waitForTimeout(500);
      await capture(page, "microsoft-home-desktop-03-focus-1");
      for (let i = 0; i < 4; i += 1) { await page.keyboard.press("Tab"); await page.waitForTimeout(250); }
      await capture(page, "microsoft-home-desktop-04-focus-5");
    },
  });
  await visit("microsoft-home-mobile", "https://www.microsoft.com/fr-fr/", M);
  await visit("microsoft-surface-desktop", "https://www.microsoft.com/fr-fr/surface/devices/surface-pro-11th-edition", D, {
    after: async (page, rec) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      rec.focusWalk = await focusWalk(page, 12);
      await capture(page, "microsoft-surface-desktop-03-focus");
    },
  });
  await visit("microsoft-surface-mobile", "https://www.microsoft.com/fr-fr/surface/devices/surface-pro-11th-edition", M);
}

if (batch === "4") {
  await visit("shopify-home-desktop", "https://www.shopify.com/fr", D, {
    after: async (page, rec) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      rec.focusWalk = await focusWalk(page, 6);
    },
  });
  await visit("shopify-home-mobile", "https://www.shopify.com/fr", M);
  await visit("shopify-pricing-desktop", "https://www.shopify.com/fr/pricing", D);
  await visit("square-home-desktop", "https://squareup.com/fr/fr", D);
  await visit("square-home-mobile", "https://squareup.com/fr/fr", M);
}

if (batch === "5") {
  await visit("linear-home-desktop", "https://linear.app/", D, {
    locale: "en-US",
    after: async (page, rec) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      rec.focusWalk = await focusWalk(page, 8);
      for (const [i, f] of [0.2, 0.45, 0.7].entries()) {
        await page.evaluate((fr) => window.scrollTo({ top: document.body.scrollHeight * fr, behavior: "instant" }), f);
        await page.waitForTimeout(1500);
        await capture(page, `linear-home-desktop-03-scroll-${i + 1}`);
      }
    },
  });
  await visit("linear-home-mobile", "https://linear.app/", M, { locale: "en-US" });
  await visit("linear-pricing-desktop", "https://linear.app/pricing", D, { locale: "en-US" });
}

if (batch === "tapote") {
  const base = "http://127.0.0.1:5179";
  await visit("tapote-home-desktop", base, D, {
    after: async (page, rec) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      rec.focusWalk = await focusWalk(page, 8);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.keyboard.press("Tab");
      await page.waitForTimeout(400);
      await capture(page, "tapote-home-desktop-03-focus-1");
    },
  });
  await visit("tapote-home-mobile", base, M);
  await visit("tapote-boutique-desktop", `${base}/boutique`, D);
  await visit("tapote-pdp-desktop", `${base}/produits/comptoir?mode=custom`, D, {
    after: async (page, rec) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      rec.focusWalk = await focusWalk(page, 10);
    },
  });
  await visit("tapote-pdp-mobile", `${base}/produits/comptoir?mode=custom`, M);
  await visit("tapote-pilot-page-desktop", `${base}/tapote-pilot`, D);
  await visit("tapote-pilot-page-mobile", `${base}/tapote-pilot`, M);
}

if (batch === "tapote-app") {
  const base = "http://127.0.0.1:5179";
  const ctx = await makeCtx(D);
  const page = await ctx.newPage();
  try {
    await page.goto(`${base}/pilot`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await settle(page, 1500);
    const demo = page.locator(".pilot-demo-access");
    if (await demo.count()) { await demo.click().catch(() => {}); await page.waitForTimeout(1800); }
    await settle(page, 1200);
    await capture(page, "tapote-pilot-app-desktop-01-fold");
    await capture(page, "tapote-pilot-app-desktop-02-full", { full: true });
    findings["tapote-pilot-app-desktop"] = { url: page.url(), ok: true, probe: await page.evaluate(probe).catch((e) => ({ error: String(e) })) };
    await page.evaluate(() => window.scrollTo(0, 0));
    findings["tapote-pilot-app-desktop"].focusWalk = await focusWalk(page, 8);
  } catch (e) { findings["tapote-pilot-app-desktop"] = { error: String(e).slice(0, 200) }; }
  await page.close().catch(() => {});
  await ctx.close().catch(() => {});

  const ctx2 = await makeCtx(D);
  const page2 = await ctx2.newPage();
  try {
    await page2.goto(`${base}/gestion`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await settle(page2, 2200);
    await capture(page2, "tapote-gestion-desktop-01-fold");
    findings["tapote-gestion-desktop"] = { url: page2.url(), ok: true, probe: await page2.evaluate(probe).catch((e) => ({ error: String(e) })) };
  } catch (e) { findings["tapote-gestion-desktop"] = { error: String(e).slice(0, 200) }; }
  await page2.close().catch(() => {});
  await ctx2.close().catch(() => {});
}

await fs.writeFile(path.join(out, `findings-${batch}.json`), JSON.stringify(findings, null, 2), "utf8");
console.log(JSON.stringify(Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, { ok: v.ok, status: v.status, title: (v.title || "").slice(0, 60), cookies: v.cookiesAccepted, screens: v.probe?.screens, err: v.error }])), null, 2));

await browser.close();
