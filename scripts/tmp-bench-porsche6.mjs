// TEMPORAIRE - shop.porsche.com (produits 30-150 EUR) : le vrai analogue de Tapote
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const out = path.resolve("output/benchmark-porsche");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ channel: "chrome", headless: true }); }
const findings = {};

const PROBE = `(() => {
  const acc = []; const walk = (r) => { for (const el of r.querySelectorAll("*")) { acc.push(el); if (el.shadowRoot) walk(el.shadowRoot); } }; walk(document);
  const vis = acc.filter((e)=>{try{const b=e.getBoundingClientRect();const s=getComputedStyle(e);return b.width>1&&b.height>1&&s.display!=="none"&&s.visibility!=="hidden";}catch{return false;}});
  const sizes={},weights={},colors={},radii={},trans={};
  for (const el of vis) { const s=getComputedStyle(el);
    if ([...el.childNodes].some((n)=>n.nodeType===3&&n.textContent.trim().length>1)) {
      const fs=Math.round(parseFloat(s.fontSize)*100)/100; sizes[fs]=(sizes[fs]||0)+1;
      weights[s.fontWeight]=(weights[s.fontWeight]||0)+1; colors[s.color]=(colors[s.color]||0)+1; }
    if (s.borderRadius!=="0px") radii[s.borderRadius]=(radii[s.borderRadius]||0)+1;
    if (s.transitionDuration!=="0s") { const k=s.transitionDuration+" | "+s.transitionTimingFunction; trans[k]=(trans[k]||0)+1; } }
  const srt=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n);
  const small=Object.entries(sizes).filter(([k])=>+k<14).reduce((a,[,v])=>a+v,0);
  const tot=Object.values(sizes).reduce((a,v)=>a+v,0);
  return { fontSizesN:Object.keys(sizes).length, fontSizes:Object.entries(sizes).map(([k,v])=>[+k,v]).sort((a,b)=>b[0]-a[0]),
    pctUnder14: Math.round(small/Math.max(tot,1)*100), weights:srt(weights,8), textColorsN:Object.keys(colors).length,
    radiiN:Object.keys(radii).length, radii:srt(radii,8), trans:srt(trans,6) };
})()`;

const PRICEPROBE = `(() => {
  const acc=[...document.querySelectorAll("*")];
  return acc.filter((e)=>[...e.childNodes].some((n)=>n.nodeType===3&&/\\d+[.,]\\d{2}\\s?€|€\\s?\\d/.test(n.textContent)))
    .map((e)=>{const b=e.getBoundingClientRect();const s=getComputedStyle(e);
      return {t:e.textContent.trim().replace(/\\s+/g," ").slice(0,40),fs:parseFloat(s.fontSize),fw:s.fontWeight,y:Math.round(b.top)};}).slice(0,14);
})()`;

for (const [name, url, vp] of [
  ["shop-home-desktop", "https://shop.porsche.com/fr/fr-FR", { width: 1440, height: 900 }],
  ["shop-home-mobile", "https://shop.porsche.com/fr/fr-FR", { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: vp.width < 500, hasTouch: vp.width < 500,
    userAgent: vp.width < 500 ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" : UA,
    locale: "fr-FR", timezoneId: "Europe/Paris" });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });
  const page = await ctx.newPage();
  const rec = { url };
  try {
    const r = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    rec.status = r?.status();
    await page.waitForLoadState("networkidle", { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(3000);
    for (const t of [() => page.locator("#onetrust-accept-btn-handler").click({ timeout: 4000 }),
                     () => page.getByRole("button", { name: /tout accepter|^accepter$/i }).first().click({ timeout: 4000 })]) { try { await t(); break; } catch {} }
    await page.waitForTimeout(2500);
    rec.finalUrl = page.url(); rec.title = await page.title();
    await page.screenshot({ path: path.join(out, `porsche-${name}-01.png`) });
    for (let i = 1; i < 4; i += 1) { await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), i * (vp.height - 60)); await page.waitForTimeout(1400); await page.screenshot({ path: path.join(out, `porsche-${name}-vp-${i}.png`) }); }
    rec.style = await page.evaluate(PROBE);
    rec.prices = await page.evaluate(PRICEPROBE);
    rec.ok = true;
  } catch (e) { rec.error = String(e).slice(0, 250); }
  findings[name] = rec;
  await ctx.close();
}

await fs.writeFile(path.join(out, "findings-part6.json"), JSON.stringify(findings, null, 2), "utf8");
for (const [k, v] of Object.entries(findings)) console.log(k, v.ok ? "OK" : "FAIL", v.status, v.finalUrl, v.error || "", v.style ? `sizes=${v.style.fontSizesN} under14=${v.style.pctUnder14}% radii=${v.style.radiiN} colors=${v.style.textColorsN}` : "");
console.log(JSON.stringify(findings["shop-home-desktop"]?.prices?.slice(0, 6), null, 1));
await browser.close();
