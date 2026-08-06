// TEMPORAIRE - mesure symetrique Porsche configurateur (grille d'options) + Tapote
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import { PRODUCTS } from "../shared/catalog.js";

const out = path.resolve("output/benchmark-porsche");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }
const findings = {};

async function makeCtx(vp, mock) {
  const ctx = await browser.newContext({
    viewport: vp, deviceScaleFactor: 1,
    isMobile: vp.width < 500, hasTouch: vp.width < 500,
    userAgent: vp.width < 500 ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" : UA,
    locale: "fr-FR", timezoneId: "Europe/Paris",
  });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });
  if (mock) {
    await ctx.route("**/api/catalog", (r) => r.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ products: Object.values(PRODUCTS).map((p) => ({ productId: p.id, name: p.name, price: p.price, online: true, availableStock: null })) }),
    }));
  }
  return ctx;
}
const settle = async (page, ms = 2200) => {
  await page.waitForLoadState("networkidle", { timeout: 25000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
  await page.waitForTimeout(ms);
};
const shot = (page, n) => page.screenshot({ path: path.join(out, `${n}.png`) }).catch(() => {});

// ---------- probe commun ----------
const PROBE = `(() => {
  const acc = [];
  const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } };
  walk(document);
  const vis = acc.filter((e) => { try { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 1 && b.height > 1 && s.display !== "none" && s.visibility !== "hidden"; } catch { return false; } });
  const sizes = {}, weights = {}, colors = {}, pads = {}, gaps = {}, radii = {}, trans = {}, lh = {};
  for (const el of vis) {
    const s = getComputedStyle(el);
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (hasText) {
      const fs = Math.round(parseFloat(s.fontSize) * 100) / 100;
      sizes[fs] = (sizes[fs] || 0) + 1;
      weights[s.fontWeight] = (weights[s.fontWeight] || 0) + 1;
      colors[s.color] = (colors[s.color] || 0) + 1;
      const l = Math.round((parseFloat(s.lineHeight) / parseFloat(s.fontSize)) * 100) / 100;
      if (Number.isFinite(l)) lh[l] = (lh[l] || 0) + 1;
    }
    for (const p of ["paddingTop","paddingBottom","paddingLeft","paddingRight"]) { const v = Math.round(parseFloat(s[p])||0); if (v>0) pads[v]=(pads[v]||0)+1; }
    const g = Math.round(parseFloat(s.gap)||0); if (g>0) gaps[g]=(gaps[g]||0)+1;
    if (s.borderRadius !== "0px") radii[s.borderRadius]=(radii[s.borderRadius]||0)+1;
    if (s.transitionDuration !== "0s") { const k = s.transitionDuration + " | " + s.transitionTimingFunction; trans[k]=(trans[k]||0)+1; }
  }
  const srt = (o,n) => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n);
  const small = Object.entries(sizes).filter(([k])=>+k<14).reduce((a,[,v])=>a+v,0);
  const total = Object.values(sizes).reduce((a,v)=>a+v,0);
  return {
    nodes: vis.length,
    fontSizesN: Object.keys(sizes).length,
    fontSizes: Object.entries(sizes).map(([k,v])=>[+k,v]).sort((a,b)=>b[0]-a[0]),
    pctUnder14: Math.round(small/Math.max(total,1)*100),
    weightsN: Object.keys(weights).length, weights: srt(weights,8),
    lineHeights: srt(lh,8),
    textColorsN: Object.keys(colors).length, textColors: srt(colors,8),
    padsN: Object.keys(pads).length, pads: srt(pads,16),
    gapsN: Object.keys(gaps).length, gaps: srt(gaps,12),
    radiiN: Object.keys(radii).length, radii: srt(radii,10),
    transN: Object.keys(trans).length, trans: srt(trans,10),
    docH: document.documentElement.scrollHeight, vh: innerHeight,
    screens: +(document.documentElement.scrollHeight/innerHeight).toFixed(1),
  };
})()`;

// ============ A. Porsche configurateur : grille d'options du panneau droit ============
{
  const ctx = await makeCtx({ width: 1440, height: 900 }); const page = await ctx.newPage();
  const rec = {};
  try {
    await page.goto("https://configurator.porsche.com/fr-FR/mode/model/9921B2", { waitUntil: "domcontentloaded", timeout: 90000 });
    await settle(page, 6000);
    for (const t of [() => page.locator("#onetrust-accept-btn-handler").click({ timeout: 4000 }),
                     () => page.getByRole("button", { name: /tout accepter|^accepter$/i }).first().click({ timeout: 4000 })]) {
      try { await t(); break; } catch {}
    }
    await settle(page, 5000);
    // grille d'options dans le panneau droit (x > 960)
    rec.optionGrid = await page.evaluate(() => {
      const acc = []; const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } }; walk(document);
      const cand = acc.filter((e) => { const b = e.getBoundingClientRect(); return b.left > 960 && b.width > 60 && b.width < 140 && b.height > 60 && b.height < 140; });
      const uniq = new Map();
      for (const e of cand) { const b = e.getBoundingClientRect(); const k = Math.round(b.left)+"|"+Math.round(b.top)+"|"+Math.round(b.width);
        if (!uniq.has(k)) { const s = getComputedStyle(e);
          uniq.set(k, { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height),
            radius: s.borderRadius, border: s.borderWidth+" "+s.borderStyle+" "+s.borderColor, outline: s.outlineWidth+" "+s.outlineStyle,
            shadow: s.boxShadow === "none" ? null : s.boxShadow.slice(0,44), trans: s.transition.slice(0,90), tag: e.tagName }); } }
      const list = [...uniq.values()].sort((a,b)=>a.y-b.y||a.x-b.x);
      const rows = {}; for (const o of list) rows[o.y] = (rows[o.y]||0)+1;
      const xs = [...new Set(list.map(o=>o.x))].sort((a,b)=>a-b);
      const ys = [...new Set(list.map(o=>o.y))].sort((a,b)=>a-b);
      return { count: list.length, sample: list.slice(0,8),
        xPitch: xs.slice(0,5).map((v,i,a)=> i? v-a[i-1] : 0), yPitch: ys.slice(0,5).map((v,i,a)=> i? v-a[i-1] : 0),
        perRow: Object.values(rows).slice(0,6) };
    });
    // barre d'action collante + typo du prix
    rec.actionBar = await page.evaluate(() => {
      const acc = []; const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } }; walk(document);
      const bar = acc.find((e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.position === "sticky" && b.width > 1200 && b.height > 50 && b.height < 120; });
      if (!bar) return null;
      const b = bar.getBoundingClientRect(); const s = getComputedStyle(bar);
      const kids = [...bar.querySelectorAll("*")].filter((e)=>{const r=e.getBoundingClientRect();return r.width>20&&r.height>10;})
        .map((e)=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {t:(e.textContent||"").trim().replace(/\\s+/g," ").slice(0,34),x:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height),fs:parseFloat(cs.fontSize),fw:cs.fontWeight,bg:cs.backgroundColor,color:cs.color,radius:cs.borderRadius};}).slice(0,24);
      return { top: Math.round(b.top), h: Math.round(b.height), bg: s.backgroundColor, border: s.borderBottomWidth+" "+s.borderBottomColor, z: s.zIndex, kids };
    });
    rec.style = await page.evaluate(PROBE);
    await shot(page, "config-desktop-20-grille");
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0,250); }
  findings.porscheConfig = rec;
  await ctx.close();
}

// ============ B. Tapote ============
const TAPOTE = [
  ["accueil", "http://127.0.0.1:5179/"],
  ["boutique", "http://127.0.0.1:5179/boutique"],
  ["configurateur", "http://127.0.0.1:5179/produits/comptoir?mode=custom"],
  ["secteur", "http://127.0.0.1:5179/secteurs/cafes-bars"],
];
for (const [name, url] of TAPOTE) {
  for (const [tag, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const ctx = await makeCtx(vp, true); const page = await ctx.newPage();
    const rec = { url };
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await settle(page, 2500);
      rec.style = await page.evaluate(PROBE);
      await shot(page, `tapote-${name}-${tag}-01`);
      if (name === "configurateur") {
        rec.geom = await page.evaluate(() => {
          const acc=[...document.querySelectorAll("*")];
          const R=(e)=>e.getBoundingClientRect();
          const sticky = acc.filter((e)=>/sticky|fixed/.test(getComputedStyle(e).position))
            .map((e)=>{const b=R(e);const s=getComputedStyle(e);return{pos:s.position,top:Math.round(b.top),h:Math.round(b.height),w:Math.round(b.width),z:s.zIndex,txt:(e.textContent||"").trim().replace(/\s+/g," ").slice(0,60)};})
            .filter((x)=>x.h>20&&x.w>60).slice(0,10);
          const media = acc.filter((e)=>/^(IMG|CANVAS|VIDEO|SVG)$/i.test(e.tagName))
            .map((e)=>{const b=R(e);const s=getComputedStyle(e);return{tag:e.tagName,w:Math.round(b.width),h:Math.round(b.height),r:+(b.width/Math.max(b.height,1)).toFixed(3),fit:s.objectFit,radius:s.borderRadius,shadow:s.boxShadow==="none"?null:s.boxShadow.slice(0,40)};})
            .filter((m)=>m.w>80).slice(0,14);
          const prices = acc.filter((e)=>[...e.childNodes].some((n)=>n.nodeType===3&&/\d[\d\s.,]*\s?€/.test(n.textContent)))
            .map((e)=>{const b=R(e);const s=getComputedStyle(e);return{t:e.textContent.trim().replace(/\s+/g," ").slice(0,40),x:Math.round(b.left),y:Math.round(b.top),fs:parseFloat(s.fontSize),fw:s.fontWeight};}).slice(0,12);
          const cols = acc.filter((e)=>{const b=R(e);return b.height>350&&b.width>250;})
            .map((e)=>{const b=R(e);const s=getComputedStyle(e);return{x:Math.round(b.left),w:Math.round(b.width),h:Math.round(b.height),pos:s.position};});
          const seen=new Set();
          return {sticky,media,prices,cols:cols.filter((c)=>{const k=c.x+"|"+c.w;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,10)};
        });
        // 3 captures scroll
        for (let i=0;i<3;i+=1){ await page.evaluate((y)=>scrollTo({top:y,behavior:"instant"}), i*(vp.height-60)); await page.waitForTimeout(900); await shot(page, `tapote-${name}-${tag}-vp-${i}`); }
      }
      rec.ok = true;
    } catch (e) { rec.error = String(e).slice(0,250); }
    findings[`tapote-${name}-${tag}`] = rec;
    await ctx.close();
  }
}

await fs.writeFile(path.join(out, "findings-part5.json"), JSON.stringify(findings, null, 2), "utf8");
for (const [k,v] of Object.entries(findings)) console.log(k, v.ok?"OK":"FAIL", v.error||"", v.style? `sizes=${v.style.fontSizesN} colors=${v.style.textColorsN} pads=${v.style.padsN} gaps=${v.style.gapsN} radii=${v.style.radiiN} trans=${v.style.transN} under14=${v.style.pctUnder14}% screens=${v.style.screens}`:"");
await browser.close();
