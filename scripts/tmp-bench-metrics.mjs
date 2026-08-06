// TEMPORAIRE — métriques d'entropie du design system, panel + Tapote. À supprimer.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const out = path.resolve("output/benchmark-panel");
await fs.mkdir(out, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const UAM = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

let browser;
try { browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] }); }
catch { browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled"] }); }

const METRICS = () => {
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.01;
  };
  const hasOwnText = (el) => {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim().length > 1) return true;
    return false;
  };
  const all = [...document.querySelectorAll("body *")].filter((e) => !["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH"].includes(e.tagName));
  const vis = all.filter(inView);
  const textEls = vis.filter(hasOwnText);

  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const sizes = new Map(), colors = new Map(), space = new Map(), fams = new Map(),
    weights = new Map(), lhs = new Map(), radii = new Map(), durs = new Map(), eases = new Map();
  let under14 = 0, under16Inputs = 0, inputsTotal = 0, textTotal = 0;
  const lineLens = [];

  for (const el of textEls) {
    const s = getComputedStyle(el);
    const fs = Math.round(parseFloat(s.fontSize) * 10) / 10;
    bump(sizes, fs); textTotal++;
    if (fs < 14) under14++;
    bump(weights, s.fontWeight);
    bump(fams, (s.fontFamily || "").split(",")[0].replace(/["']/g, "").trim());
    const lh = parseFloat(s.lineHeight);
    if (lh) bump(lhs, Math.round((lh / fs) * 100) / 100);
    const txt = el.textContent.trim();
    if (txt.length > 60) {
      const w = el.getBoundingClientRect().width;
      lineLens.push(Math.round(w / (fs * 0.5)));
    }
  }
  for (const el of vis) {
    const s = getComputedStyle(el);
    for (const p of ["color", "backgroundColor", "borderTopColor"]) {
      const c = s[p];
      if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") bump(colors, c);
    }
    for (const p of ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "marginTop", "marginBottom", "rowGap", "columnGap"]) {
      const v = parseFloat(s[p]);
      if (v > 0) bump(space, Math.round(v));
    }
    const r = parseFloat(s.borderTopLeftRadius);
    if (r > 0) bump(radii, Math.round(r));
    if (s.transitionDuration && s.transitionDuration !== "0s") {
      s.transitionDuration.split(",").forEach((d) => bump(durs, d.trim()));
      s.transitionTimingFunction.split(/,(?![^(]*\))/).forEach((e) => bump(eases, e.trim()));
    }
  }
  for (const el of document.querySelectorAll("input, select, textarea")) {
    if (!inView(el)) continue;
    inputsTotal++;
    if (parseFloat(getComputedStyle(el).fontSize) < 16) under16Inputs++;
  }

  const top = (m, n = 20) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}:${v}`);
  const singles = (m) => [...m.values()].filter((v) => v === 1).length;
  const sorted = (m) => [...m.keys()].sort((a, b) => a - b);

  // tap targets
  const tappable = [...document.querySelectorAll("a,button,input,select,[role=button]")].filter(inView);
  const small = tappable.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 24; });

  return {
    textNodes: textTotal,
    fontSizes: { distinct: sizes.size, singletons: singles(sizes), scale: sorted(sizes), top: top(sizes, 12) },
    pctUnder14: textTotal ? Math.round((under14 / textTotal) * 1000) / 10 : null,
    families: top(fams, 6),
    weights: top(weights, 8),
    lineHeightRatios: top(lhs, 8),
    colors: { distinct: colors.size, singletons: singles(colors), top: top(colors, 10) },
    spacing: { distinct: space.size, singletons: singles(space), scale: sorted(space).slice(0, 60), top: top(space, 14) },
    radii: { distinct: radii.size, top: top(radii, 8) },
    durations: top(durs, 8),
    easings: top(eases, 6),
    lineLenCh: (() => {
      if (!lineLens.length) return null;
      const s = lineLens.slice().sort((a, b) => a - b);
      return { p50: s[Math.floor(s.length / 2)], p90: s[Math.floor(s.length * 0.9)], n: s.length };
    })(),
    inputs: { total: inputsTotal, under16px: under16Inputs },
    tapTargets: { total: tappable.length, under44: small.length, pct: tappable.length ? Math.round((small.length / tappable.length) * 100) : null },
  };
};

async function acceptCookies(page) {
  const tries = [
    () => page.locator("#onetrust-accept-btn-handler").click({ timeout: 3000 }),
    () => page.locator("#wcpConsentBannerCtrl button").first().click({ timeout: 3000 }),
    () => page.getByRole("button", { name: /^(tout accepter|accepter tout|accepter|accept all|accept all cookies|allow all|j.accepte)$/i }).first().click({ timeout: 3000 }),
    () => page.locator("button[id*='accept' i], button[class*='accept' i]").first().click({ timeout: 3000 }),
  ];
  for (const t of tries) { try { await t(); await page.waitForTimeout(900); return true; } catch { /* next */ } }
  return false;
}

const TARGETS = JSON.parse(process.argv[2] || "[]");
const results = {};

for (const t of TARGETS) {
  const mobile = t.vp === "mobile";
  const viewport = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const ctx = await browser.newContext({
    viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
    userAgent: mobile ? UAM : UA, locale: "fr-FR", timezoneId: "Europe/Paris",
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => undefined }));
  if (t.mockCatalog) {
    await ctx.route("**/api/catalog*", async (route) => {
      const body = await fs.readFile(path.resolve("output/benchmark-panel/.catalog.json"), "utf8");
      await route.fulfill({ status: 200, contentType: "application/json", body });
    });
  }
  const page = await ctx.newPage();
  const key = `${t.name}-${t.vp}`;
  try {
    const resp = await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(t.wait || 3500);
    const banner = await acceptCookies(page);
    await page.waitForTimeout(800);
    const m = await page.evaluate(METRICS);
    results[key] = { url: t.url, status: resp && resp.status(), banner, ...m };
    if (t.shots) {
      const h = await page.evaluate(() => document.body.scrollHeight);
      const step = viewport.height;
      for (let i = 0; i < t.shots; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), i * step * 1.0);
        await page.waitForTimeout(1400);
        await page.screenshot({ path: path.join(out, `${key}-${String(i + 1).padStart(2, "0")}.png`) });
        if (i * step > h) break;
      }
    }
    console.log("OK", key, m.fontSizes.distinct, "sizes /", m.colors.distinct, "colors");
  } catch (e) {
    results[key] = { url: t.url, error: String(e).slice(0, 200) };
    console.log("FAIL", key, String(e).slice(0, 120));
  }
  await ctx.close();
}

await browser.close();
const file = path.join(out, process.env.OUTFILE || "metrics.json");
let prev = {};
try { prev = JSON.parse(await fs.readFile(file, "utf8")); } catch { /* new */ }
await fs.writeFile(file, JSON.stringify({ ...prev, ...results }, null, 1));
console.log("written", file);
