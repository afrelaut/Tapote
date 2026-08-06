// TEMPORAIRE — sondes ciblées (typo minuscule, focus, motion). À supprimer.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const out = path.resolve("output/benchmark-panel");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
let browser;
try { browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] }); }
catch { browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled"] }); }

const TINY = () => {
  const res = [];
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize);
    if (fs >= 7) continue;
    let own = "";
    for (const n of el.childNodes) if (n.nodeType === 3) own += n.textContent.trim();
    if (own.length < 2) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    res.push({
      size: Math.round(fs * 100) / 100,
      cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || "")).slice(0, 70),
      tag: el.tagName,
      text: own.slice(0, 40),
      ariaHidden: el.closest("[aria-hidden=true]") ? true : false,
      scaledParent: (() => {
        let p = el, d = 0;
        while (p && d++ < 8) { const t = getComputedStyle(p).transform; if (t && t !== "none") return t.slice(0, 40); p = p.parentElement; }
        return null;
      })(),
    });
  }
  const bySize = {};
  for (const r of res) (bySize[r.size] ||= []).push(r);
  return { count: res.length, hiddenFromA11y: res.filter((r) => r.ariaHidden).length, sample: res.slice(0, 25), sizes: Object.keys(bySize).length };
};

const MOTION = () => {
  const durs = new Map(), eases = new Map(), anims = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    if (s.transitionDuration && s.transitionDuration !== "0s") {
      const ds = s.transitionDuration.split(","), es = s.transitionTimingFunction.split(/,(?![^(]*\))/);
      ds.forEach((d, i) => bump(durs, `${d.trim()} ${(es[i] || es[0] || "").trim()}`));
    }
    if (s.animationName && s.animationName !== "none") bump(anims, `${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`);
  }
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} x${v}`);
  let rm = 0;
  for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.conditionText && /reduced-motion/.test(r.conditionText)) rm++; } catch { /* cors */ } }
  return { transitions: top(durs, 14), animations: top(anims, 8), reducedMotionRules: rm };
};

const FOCUS = async () => {};

const targets = JSON.parse(process.argv[2]);
const res = {};
for (const t of targets) {
  const mobile = t.vp === "mobile";
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile, hasTouch: mobile, userAgent: UA, locale: "fr-FR", deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const key = `${t.name}-${t.vp}`;
  try {
    await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(t.wait || 4500);
    try { await page.getByRole("button", { name: /tout accepter|accepter|accept all/i }).first().click({ timeout: 2500 }); await page.waitForTimeout(700); } catch { /* none */ }
    // focus ring probe: tab through first 12 focusables
    const focus = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName, text: (el.textContent || "").trim().slice(0, 28),
          outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
          offset: s.outlineOffset, shadow: (s.boxShadow || "none").slice(0, 60),
          inView: r.top >= -5 && r.bottom <= innerHeight + 5,
          h: Math.round(r.height), w: Math.round(r.width),
        };
      });
      if (f) focus.push(f);
    }
    res[key] = { url: t.url, tiny: await page.evaluate(TINY), motion: await page.evaluate(MOTION), focus };
    console.log("OK", key, "tiny:", res[key].tiny.count);
  } catch (e) { res[key] = { error: String(e).slice(0, 160) }; console.log("FAIL", key, String(e).slice(0, 100)); }
  await ctx.close();
}
await browser.close();
await fs.writeFile(path.join(out, process.env.OUTFILE || "probe2.json"), JSON.stringify(res, null, 1));
console.log("done");
