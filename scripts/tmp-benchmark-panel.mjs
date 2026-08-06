// TEMPORAIRE — panel de référence internationale. À supprimer après l'audit.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("output/benchmark-panel");
await fs.mkdir(outputDir, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] });
} catch {
  browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled"] });
}

const tally = (arr) => {
  const m = new Map();
  for (const v of arr) m.set(v, (m.get(v) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([v, n]) => `${v} ×${n}`);
};

const compact = (p) => {
  if (!p || p.error) return p;
  for (const k of ["sectionPads", "gaps", "radii", "transitions", "shadows", "containers", "heights"]) {
    if (Array.isArray(p[k])) p[k] = tally(p[k]);
  }
  return p;
};

const PROBE = () => {
  const px = (v) => Math.round(parseFloat(v) * 10) / 10;
  const vis = (el) => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0 && b.width > 1 && b.height > 1;
  };
  const all = [...document.querySelectorAll("*")].filter(vis);

  const typo = {};
  for (const tag of ["h1", "h2", "h3", "p", "li", "button", "a"]) {
    const els = [...document.querySelectorAll(tag)].filter(vis).slice(0, 40);
    if (!els.length) continue;
    typo[tag] = els.slice(0, 6).map((el) => {
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
      const fs2 = parseFloat(s.fontSize);
      return {
        text: txt.slice(0, 55),
        size: px(s.fontSize),
        lh: px(s.lineHeight) || s.lineHeight,
        lhRatio: parseFloat(s.lineHeight) ? Math.round((parseFloat(s.lineHeight) / fs2) * 100) / 100 : null,
        weight: s.fontWeight,
        tracking: s.letterSpacing === "normal" ? "normal" : px(s.letterSpacing),
        family: s.fontFamily.split(",")[0].replace(/["']/g, ""),
        widthPx: Math.round(b.width),
        // approximation de la mesure : largeur / (0.5 × taille de police)
        ch: Math.round(b.width / (fs2 * 0.5)),
        color: s.color,
        transform: s.textTransform,
      };
    });
  }

  // Rythme vertical : paddings des sections de premier niveau
  const sections = [...document.querySelectorAll("section, main > div, [class*='section' i]")].filter(vis).slice(0, 60);
  const sectionPads = sections.map((el) => {
    const s = getComputedStyle(el);
    return `${px(s.paddingTop)}/${px(s.paddingBottom)}`;
  });

  const gaps = all.filter((el) => {
    const s = getComputedStyle(el);
    return (s.display === "flex" || s.display === "grid") && parseFloat(s.gap) > 0;
  }).map((el) => px(getComputedStyle(el).gap));

  const radii = all.map((el) => getComputedStyle(el).borderTopLeftRadius).filter((v) => parseFloat(v) > 0).map(px);

  const transitions = [];
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.transitionDuration && s.transitionDuration !== "0s") {
      transitions.push(`${s.transitionDuration} ${s.transitionTimingFunction} [${s.transitionProperty.slice(0, 40)}]`);
    }
    if (s.animationName && s.animationName !== "none") {
      transitions.push(`@anim ${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`);
    }
  }

  const shadows = all.map((el) => getComputedStyle(el).boxShadow).filter((v) => v && v !== "none").map((v) => v.slice(0, 70));

  // Largeurs de conteneur
  const containers = all.filter((el) => {
    const s = getComputedStyle(el);
    return s.maxWidth !== "none" && parseFloat(s.maxWidth) > 400;
  }).map((el) => px(getComputedStyle(el).maxWidth));

  // Cibles tactiles
  const interactive = [...document.querySelectorAll("a[href], button, input, select, [role='button']")].filter(vis);
  const heights = interactive.map((el) => Math.round(el.getBoundingClientRect().height));
  const small = interactive.filter((el) => {
    const b = el.getBoundingClientRect();
    return b.height < 44 || b.width < 44;
  }).length;

  // Boutons : padding + hauteur
  const buttons = [...document.querySelectorAll("button, a[class*='btn' i], a[class*='button' i], [role='button']")].filter(vis).slice(0, 8).map((el) => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return {
      text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30),
      h: Math.round(b.height), w: Math.round(b.width),
      pad: `${px(s.paddingTop)} ${px(s.paddingRight)}`,
      size: px(s.fontSize), weight: s.fontWeight, radius: s.borderRadius,
      bg: s.backgroundColor, color: s.color,
      transition: s.transitionDuration === "0s" ? "aucune" : `${s.transitionDuration} ${s.transitionTimingFunction}`,
    };
  });

  // Images
  const imgs = [...document.images].filter(vis).slice(0, 12).map((i) => ({
    w: Math.round(i.getBoundingClientRect().width),
    natural: `${i.naturalWidth}x${i.naturalHeight}`,
    dpr: i.naturalWidth && i.getBoundingClientRect().width ? Math.round((i.naturalWidth / i.getBoundingClientRect().width) * 100) / 100 : null,
    srcset: !!i.srcset, loading: i.loading, alt: (i.alt || "").slice(0, 40), fmt: (i.currentSrc || "").split("?")[0].split(".").pop().slice(0, 6),
  }));

  // Sémantique / a11y
  const a11y = {
    landmarks: ["header", "nav", "main", "footer", "aside"].map((t) => `${t}:${document.querySelectorAll(t).length}`).join(" "),
    h1: document.querySelectorAll("h1").length,
    headingOrder: [...document.querySelectorAll("h1,h2,h3,h4")].filter(vis).slice(0, 14).map((h) => h.tagName),
    skipLink: !!document.querySelector("a[href^='#']:first-of-type"),
    ariaLive: document.querySelectorAll("[aria-live]").length,
    ariaLabels: document.querySelectorAll("[aria-label]").length,
    ariaExpanded: document.querySelectorAll("[aria-expanded]").length,
    ariaCurrent: document.querySelectorAll("[aria-current]").length,
    imgsNoAlt: [...document.images].filter(vis).filter((i) => !i.hasAttribute("alt")).length,
    inputsNoLabel: [...document.querySelectorAll("input:not([type=hidden]),select,textarea")].filter(vis)
      .filter((i) => !i.getAttribute("aria-label") && !i.getAttribute("aria-labelledby") && !(i.id && document.querySelector(`label[for="${CSS.escape(i.id)}"]`)) && !i.closest("label")).length,
    lang: document.documentElement.lang,
    prefersReducedMotionRule: (() => {
      let n = 0;
      for (const sheet of document.styleSheets) {
        try {
          for (const r of sheet.cssRules) if (r.conditionText && /prefers-reduced-motion/.test(r.conditionText)) n += 1;
        } catch { /* CORS */ }
      }
      return n;
    })(),
  };

  const bodyStyle = getComputedStyle(document.body);
  return {
    typo,
    sectionPads,
    gaps,
    radii,
    transitions,
    shadows,
    containers,
    buttons,
    imgs,
    a11y,
    heights,
    smallTargets: small,
    interactiveCount: interactive.length,
    body: { bg: bodyStyle.backgroundColor, color: bodyStyle.color, size: px(bodyStyle.fontSize), family: bodyStyle.fontFamily.slice(0, 90) },
    docHeight: document.documentElement.scrollHeight,
    overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    title: document.title,
  };
};

async function focusProbe(page) {
  // Tabule 6 fois et relève l'anneau de focus réel
  const out = [];
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(120);
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return {
        tag: el.tagName, text: (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 34),
        outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
        offset: s.outlineOffset, shadow: (s.boxShadow || "none").slice(0, 60),
        visibleRing: s.outlineStyle !== "none" || (s.boxShadow && s.boxShadow !== "none"),
      };
    }).catch(() => null);
    if (r) out.push(r);
  }
  return out;
}

async function dismissCookies(page) {
  const selectors = [
    'button:has-text("Accepter tout")', 'button:has-text("Tout accepter")', 'button:has-text("Accept all")',
    'button:has-text("Accepter")', 'button:has-text("Accept")', 'button:has-text("J\'accepte")',
    'button:has-text("Agree")', '#onetrust-accept-btn-handler', '[aria-label*="Accept" i]',
    'button:has-text("Continuer sans accepter")', 'button:has-text("Reject")', 'button:has-text("Refuser")',
  ];
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.count() && await loc.isVisible({ timeout: 600 })) {
        await loc.click({ timeout: 1500 });
        await page.waitForTimeout(700);
        return sel;
      }
    } catch { /* suivant */ }
  }
  return null;
}

const results = {};

async function visit(site, label, url, viewport, tag, opts = {}) {
  const key = `${site}-${label}-${tag}`;
  const context = await browser.newContext({
    viewport, userAgent: UA, locale: "fr-FR", timezoneId: "Europe/Paris",
    deviceScaleFactor: viewport.width < 500 ? 2 : 1,
    isMobile: viewport.width < 500, hasTouch: viewport.width < 500,
  });
  const page = await context.newPage();
  const entry = { url, viewport: `${viewport.width}x${viewport.height}` };
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    entry.status = resp?.status();
    await page.waitForTimeout(1800);
    entry.cookieBanner = await dismissCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.evaluate(async () => { await document.fonts?.ready; }).catch(() => {});
    await page.waitForTimeout(900);

    // Capture au-dessus de la ligne de flottaison
    await page.screenshot({ path: path.join(outputDir, `${key}-01-hero.png`) }).catch(() => {});

    entry.probeTop = compact(await page.evaluate(PROBE).catch((e) => ({ error: String(e) })));
    entry.focus = await focusProbe(page).catch(() => []);

    // Chorégraphie du scroll : on descend par paliers et on capture
    const steps = opts.scrollSteps ?? 3;
    for (let i = 1; i <= steps; i += 1) {
      await page.evaluate((n) => window.scrollTo({ top: window.innerHeight * n * 0.9, behavior: "instant" }), i);
      await page.waitForTimeout(1400);
      await page.screenshot({ path: path.join(outputDir, `${key}-0${i + 1}-scroll${i}.png`) }).catch(() => {});
    }
    entry.probeAfterScroll = await page.evaluate(() => {
      const anim = [...document.querySelectorAll("*")].filter((el) => {
        const s = getComputedStyle(el);
        return (s.transform !== "none" && s.transform !== "matrix(1, 0, 0, 1, 0, 0)") || Number(s.opacity) < 1;
      }).length;
      return { animatedElements: anim, scrollY: Math.round(window.scrollY), docHeight: document.documentElement.scrollHeight };
    }).catch(() => null);

    // Sticky / position collante
    entry.sticky = await page.evaluate(() => [...document.querySelectorAll("*")]
      .filter((el) => ["sticky", "fixed"].includes(getComputedStyle(el).position) && el.getBoundingClientRect().height > 20)
      .slice(0, 6)
      .map((el) => ({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 40), pos: getComputedStyle(el).position, h: Math.round(el.getBoundingClientRect().height) }))).catch(() => []);
  } catch (e) {
    entry.error = String(e).slice(0, 300);
  }
  await page.close().catch(() => {});
  await context.close().catch(() => {});
  results[key] = entry;
  console.log(`${key} :: ${entry.error ? `ÉCHEC ${entry.error.slice(0, 90)}` : `ok (${entry.status})`}`);
}

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

const targets = JSON.parse(process.env.BENCH_TARGETS || "[]");
for (const t of targets) {
  await visit(t.site, t.label, t.url, t.mobile ? mobile : desktop, t.mobile ? "mobile" : "desktop", t.opts || {});
}

await browser.close();

const outFile = path.join(outputDir, process.env.BENCH_OUT || "probe.json");
let existing = {};
try { existing = JSON.parse(await fs.readFile(outFile, "utf8")); } catch { /* premier passage */ }
await fs.writeFile(outFile, `${JSON.stringify({ ...existing, ...results }, null, 2)}\n`, "utf8");
console.log(`écrit -> ${outFile}`);
