import { chromium } from "playwright-core";
import { PRODUCTS } from "./shared/catalog.js";

const targets = [
  { name: "dev", base: "http://127.0.0.1:5179" },
  { name: "prod-preview", base: "http://127.0.0.1:4199" },
];
const paths = [
  ["home", "/"],
  ["boutique", "/boutique"],
  ["pdp-custom", "/produits/comptoir?mode=custom"],
];

async function launch() {
  try {
    return await chromium.launch({ headless: true, args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader"] });
  } catch {
    return chromium.launch({ channel: "chrome", headless: true });
  }
}

async function mockCatalog(context) {
  await context.route("**/api/catalog", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      products: Object.values(PRODUCTS).map((p) => ({
        productId: p.id, name: p.name, price: p.price, online: true, availableStock: null,
      })),
    }),
  }));
}

async function observers(context) {
  await context.addInitScript(() => {
    window.__p = { cls: 0, lcp: 0, lcpEl: "", longTasks: [], shifts: [] };
    const safe = (type, cb) => { try { new PerformanceObserver(cb).observe({ type, buffered: true }); } catch {} };
    safe("largest-contentful-paint", (l) => {
      const e = l.getEntries().at(-1);
      if (e) { window.__p.lcp = e.startTime; window.__p.lcpEl = (e.element?.tagName || "") + "." + (e.element?.className || "").toString().slice(0, 60) + (e.url ? ` url=${e.url.slice(-50)}` : ""); }
    });
    safe("layout-shift", (l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) {
        window.__p.cls += e.value;
        if (e.value > 0.01) window.__p.shifts.push({ v: Math.round(e.value * 1000) / 1000, t: Math.round(e.startTime), nodes: e.sources?.map((s) => (s.node?.tagName || "") + "." + (s.node?.className || "").toString().slice(0, 40)).slice(0, 3) });
      }
    });
    safe("longtask", (l) => { for (const e of l.getEntries()) window.__p.longTasks.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); });
  });
}

async function read(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const res = performance.getEntriesByType("resource");
    const bytes = (f) => res.filter(f).reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0);
    const lt = window.__p.longTasks;
    const paints = performance.getEntriesByType("paint");
    return {
      fcpMs: Math.round(paints.find((p) => p.name === "first-contentful-paint")?.startTime || 0),
      lcpMs: Math.round(window.__p.lcp),
      lcpEl: window.__p.lcpEl,
      cls: Math.round(window.__p.cls * 1000) / 1000,
      shifts: window.__p.shifts.slice(0, 5),
      longTaskCount: lt.length,
      longTaskTotalMs: Math.round(lt.reduce((s, e) => s + e.d, 0)),
      longTaskMaxMs: lt.length ? Math.max(...lt.map((e) => e.d)) : 0,
      tbtProxy: Math.round(lt.reduce((s, e) => s + Math.max(0, e.d - 50), 0)),
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadMs: nav ? Math.round(nav.loadEventEnd) : null,
      requests: res.length,
      transferKb: Math.round(bytes(() => true) / 1024),
      scriptKb: Math.round(bytes((e) => e.initiatorType === "script" || /\.m?js(\?|$)/i.test(e.name)) / 1024),
      cssKb: Math.round(bytes((e) => e.initiatorType === "link" && /\.css(\?|$)/i.test(e.name)) / 1024),
      imgKb: Math.round(bytes((e) => e.initiatorType === "img" || /\.(avif|gif|jpe?g|png|svg|webp)(\?|$)/i.test(e.name)) / 1024),
      fontKb: Math.round(bytes((e) => /\.(woff2?|ttf)(\?|$)/i.test(e.name)) / 1024),
    };
  });
}

const PROFILES = {
  desktop: { viewport: { width: 1440, height: 900 }, cpu: 1, net: null },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, cpu: 4, net: null },
  "mobile-3g": {
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, cpu: 4,
    // Slow 3G-ish: 400 kbps down, 400ms RTT (Lighthouse "Slow 4G" = 1.6Mbps/150ms; we use slower per brief)
    net: { offline: false, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8, latency: 400 },
  },
};

const rows = [];
const browser = await launch();
for (const target of targets) {
  for (const [profName, prof] of Object.entries(PROFILES)) {
    if (profName === "mobile-3g" && target.name === "dev") continue; // dev server unbundled: 3G meaningless
    const ctx = await browser.newContext({
      viewport: prof.viewport, isMobile: prof.isMobile, hasTouch: prof.hasTouch, deviceScaleFactor: prof.deviceScaleFactor,
    });
    await mockCatalog(ctx);
    await observers(ctx);
    for (const [label, p] of paths) {
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", (e) => errs.push(e.message));
      const cdp = await ctx.newCDPSession(page);
      if (prof.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: prof.cpu });
      if (prof.net) { await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", prof.net); }
      let status = null;
      try {
        const r = await page.goto(target.base + p, { waitUntil: "load", timeout: 120000 });
        status = r?.status();
        await page.waitForTimeout(prof.net ? 6000 : 3000);
      } catch (e) { errs.push("GOTO: " + e.message); }
      let m = {};
      try { m = await read(page); } catch (e) { errs.push("READ: " + e.message); }
      rows.push({ target: target.name, profile: profName, page: label, status, ...m, errors: errs.slice(0, 3) });
      console.log(JSON.stringify(rows.at(-1)));
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
console.log("\n=== SUMMARY ===");
console.table(rows.map((r) => ({
  t: r.target, prof: r.profile, page: r.page, fcp: r.fcpMs, lcp: r.lcpMs, cls: r.cls,
  ltN: r.longTaskCount, ltMs: r.longTaskTotalMs, tbt: r.tbtProxy, load: r.loadMs,
  req: r.requests, kb: r.transferKb, js: r.scriptKb, css: r.cssKb,
})));
console.log("\nLCP elements:");
for (const r of rows) console.log(`  ${r.target}/${r.profile}/${r.page}: ${r.lcpEl}`);
console.log("\nShifts:");
for (const r of rows) if (r.shifts?.length) console.log(`  ${r.target}/${r.profile}/${r.page}:`, JSON.stringify(r.shifts));
console.log("\nErrors:");
for (const r of rows) if (r.errors?.length) console.log(`  ${r.target}/${r.profile}/${r.page}:`, r.errors);
