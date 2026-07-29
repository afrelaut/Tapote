import * as Sentry from "@sentry/node";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { fileTypeFromBuffer } from "file-type";
import helmet from "helmet";
import multer from "multer";
import pinoHttp from "pino-http";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ACTIONS, calculateShipping, matchingIdentityKey, PRODUCTS } from "../shared/catalog.js";
import { getProductionChecks } from "./config.js";
import { checkoutSchema, checkoutStatusSchema, leadSchema, parseRequest, pilotActivationSchema, tapoteRedirectSchema } from "./validation.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedImageTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);
const imageTypeAliases = new Map([
  ["image/png", "image/png"],
  ["image/x-png", "image/png"],
  ["image/jpeg", "image/jpeg"],
  ["image/jpg", "image/jpeg"],
  ["image/pjpeg", "image/jpeg"],
  ["image/webp", "image/webp"],
]);

const storefrontPaths = new Set([
  "/",
  "/boutique",
  "/designs",
  "/secteurs",
  "/personnaliser",
  "/comment-ca-marche",
  "/tapote-pilot",
  "/panier",
  "/devis",
  "/commande",
  "/commande/confirmee",
  "/mentions-legales",
  "/cgv",
  "/confidentialite",
  "/categorie/chevalets-nfc",
  "/categorie/plaques-nfc",
  "/categorie/cartes-nfc",
  "/categorie/packs-nfc",
  "/categorie/packs",
  "/produits/chevalet",
  "/produits/plaque",
  "/produits/carte",
  "/secteurs/cafes-bars",
  "/secteurs/restaurants-traiteurs-food-trucks",
  "/secteurs/boulangeries-patisseries",
  "/secteurs/beaute-coiffure-bien-etre",
  "/secteurs/cabinets-medicaux-paramedicaux",
  "/secteurs/boutiques-commerces",
  "/secteurs/hebergements-tourisme",
  "/secteurs/auto-ecoles",
  "/secteurs/garages-mobilite",
  "/secteurs/artisans-services-terrain",
  "/secteurs/agences-independants",
  "/secteurs/sport-studios",
  "/secteurs/bureaux-formation",
  "/secteurs/evenements-culture-associations",
  "/secteurs/animaux-soins",
]);

const routeMeta = new Map([
  ["/", ["Supports NFC + QR prêts ou personnalisés | Tapote", "Chevalets, plaques et cartes NFC + QR prêts à l’emploi ou personnalisés. Destination initiale configurée et pilotage à distance avec Tapote Pilot."]],
  ["/boutique", ["Boutique NFC + QR | Tapote", "Choisissez un chevalet, une plaque verticale, une Carte NFC ou un pack Tapote, prêt à l’emploi ou adapté à votre identité."]],
  ["/designs", ["Designs Tapote pour chaque usage", "Comparez les designs Tapote pour avis, menu, réservation, réseaux sociaux, Wi-Fi, paiement et autres liens professionnels."]],
  ["/secteurs", ["Tapote pour votre secteur | 15 usages concrets", "Trouvez le support NFC + QR, le placement et l’usage Tapote adaptés à votre métier."]],
  ["/personnaliser", ["Personnaliser votre Tapote", "Créez votre Tapote en direct avec votre logo, vos couleurs, vos textes et votre destination, puis commandez le visuel affiché."]],
  ["/comment-ca-marche", ["Comment fonctionne Tapote ?", "NFC ou QR : le client approche son téléphone et ouvre instantanément l’avis, le menu, la réservation ou le lien choisi."]],
  ["/tapote-pilot", ["Tapote Pilot | Changez vos liens et suivez vos supports", "Pilotez vos supports Tapote à distance, changez leur destination et suivez les interactions NFC + QR depuis une interface unique."]],
  ["/produits/chevalet", ["Chevalet A6 NFC + QR | Tapote", "Un chevalet vertical et visible pour déclencher avis, réservation, menu, Wi-Fi ou tout autre lien au comptoir."]],
  ["/produits/plaque", ["Plaque verticale NFC + QR | Tapote", "Une plaque PMMA présentée debout, personnalisable et synchronisée avec le lien affiché sur le téléphone."]],
  ["/produits/carte", ["Carte NFC + QR professionnelle | Tapote", "Une Carte NFC compacte pour partager contact, réseaux, réservation, avis ou tout autre lien en rendez-vous et sur le terrain."]],
  ["/categorie/chevalets-nfc", ["Chevalets NFC + QR | Tapote", "Découvrez les chevalets Tapote prêts à l’emploi, personnalisés et disponibles en packs."]],
  ["/categorie/plaques-nfc", ["Plaques NFC + QR | Tapote", "Découvrez les plaques verticales Tapote prêtes à l’emploi, personnalisées et disponibles en packs."]],
  ["/categorie/cartes-nfc", ["Cartes NFC + QR | Tapote", "Découvrez les Cartes NFC Tapote prêtes à l’emploi, personnalisées ou assorties à vos supports."]],
  ["/categorie/packs-nfc", ["Packs NFC + QR professionnels | Tapote", "Multipliez les points de contact avec les packs de chevalets et plaques Tapote configurés et testés."]],
  ["/categorie/packs", ["Packs NFC + QR professionnels | Tapote", "Multipliez les points de contact avec les packs de chevalets et plaques Tapote configurés et testés."]],
  ["/devis", ["Devis volume et multi-sites | Tapote", "Décrivez votre besoin de 10 supports ou plus et recevez une proposition Tapote claire, sans engagement et adaptée à vos lieux."]],
  ["/mentions-legales", ["Mentions légales | Tapote", "Consultez les informations relatives à l’éditeur, à la publication et à l’hébergement du site Tapote."]],
  ["/cgv", ["Conditions générales de vente B2B | Tapote", "Consultez les conditions applicables aux commandes professionnelles de supports NFC + QR Tapote."]],
  ["/confidentialite", ["Politique de confidentialité | Tapote", "Découvrez comment Tapote traite les données professionnelles et comment exercer vos droits."]],
  ["/panier", ["Votre panier | Tapote", "Vérifiez les supports Tapote ajoutés au panier, leur composition et les frais de livraison."]],
  ["/commande", ["Finaliser la commande | Tapote", "Finalisez votre commande professionnelle de supports Tapote via le paiement sécurisé Stripe."]],
  ["/commande/confirmee", ["Suivi de commande | Tapote", "Consultez la confirmation et le statut de votre commande Tapote."]],
]);

const sectorMetaTitles = new Map([
  ["cafes-bars", "Cafés & bars"],
  ["restaurants-traiteurs-food-trucks", "Restaurants, traiteurs & food trucks"],
  ["boulangeries-patisseries", "Boulangeries & pâtisseries"],
  ["beaute-coiffure-bien-etre", "Beauté, coiffure & bien-être"],
  ["cabinets-medicaux-paramedicaux", "Cabinets médicaux & paramédicaux"],
  ["boutiques-commerces", "Boutiques & commerces"],
  ["hebergements-tourisme", "Hébergements & tourisme"],
  ["auto-ecoles", "Auto-écoles"],
  ["garages-mobilite", "Garages & mobilité"],
  ["artisans-services-terrain", "Artisans & services terrain"],
  ["agences-independants", "Agences & indépendants"],
  ["sport-studios", "Sport & studios"],
  ["bureaux-formation", "Bureaux & formation"],
  ["evenements-culture-associations", "Événements, culture & associations"],
  ["animaux-soins", "Animaux & soins"],
]);

const privateStorefrontPrefixes = ["/panier", "/commande", "/connexion", "/gestion", "/pilot"];
const normalizeStorefrontPath = (pathname) => (String(pathname || "/").split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/");

export function storefrontMetaForPath(pathname, publicUrl = "https://tapote.fr") {
  const normalized = normalizeStorefrontPath(pathname);
  const sectorSlug = normalized.startsWith("/secteurs/") ? normalized.slice("/secteurs/".length) : "";
  const sectorTitle = sectorMetaTitles.get(sectorSlug);
  const fallback = ["Page introuvable | Tapote", "Retrouvez les supports NFC + QR Tapote et choisissez le bon usage pour votre activité."];
  const [title, description] = sectorTitle
    ? [`Tapote pour ${sectorTitle} | NFC + QR`, `Découvrez le support, le placement et les usages Tapote recommandés pour ${sectorTitle.toLocaleLowerCase("fr-FR")}.`]
    : routeMeta.get(normalized) || fallback;
  const noindex = !isKnownFrontendPath(normalized) || privateStorefrontPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
  const base = String(publicUrl || "https://tapote.fr").replace(/\/+$/, "");
  return {
    title,
    description,
    canonical: `${base}${normalized === "/" ? "/" : normalized}`,
    robots: noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large",
  };
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const replaceMetaContent = (html, attribute, key, content) => html.replace(
  new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, "i"),
  `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`,
);

export function injectStorefrontMeta(html, pathname, publicUrl) {
  const meta = storefrontMetaForPath(pathname, publicUrl);
  let rendered = String(html).replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  rendered = rendered.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);
  rendered = replaceMetaContent(rendered, "name", "description", meta.description);
  rendered = replaceMetaContent(rendered, "name", "robots", meta.robots);
  rendered = replaceMetaContent(rendered, "property", "og:title", meta.title);
  rendered = replaceMetaContent(rendered, "property", "og:description", meta.description);
  rendered = replaceMetaContent(rendered, "property", "og:url", meta.canonical);
  rendered = replaceMetaContent(rendered, "name", "twitter:title", meta.title);
  rendered = replaceMetaContent(rendered, "name", "twitter:description", meta.description);
  return rendered;
}

export const isKnownFrontendPath = (pathname) => {
  const normalized = String(pathname || "/").replace(/\/+$/, "") || "/";
  return storefrontPaths.has(normalized)
    || ["/connexion", "/gestion", "/pilot"].some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

const canonicalImageType = (mimeType) => imageTypeAliases.get(String(mimeType || "").toLowerCase()) || "";

function bearerToken(request) {
  const authorization = String(request.headers.authorization || "").trim();
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] || "";
}

function checkoutReturnUrl(request, config) {
  if (config.isProduction) return config.publicUrl;
  const origin = String(request.headers.origin || "").trim();
  try {
    const parsed = new URL(origin);
    if (["http:", "https:"].includes(parsed.protocol)) return parsed.origin;
  } catch { /* use the configured development fallback */ }
  return config.publicUrl;
}

const limiter = (windowMs, limit, message) => rateLimit({
  windowMs,
  limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: message },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_request, file, callback) => {
    if (!canonicalImageType(file.mimetype)) return callback(new Error("TYPE_FICHIER_INVALIDE"));
    return callback(null, true);
  },
});

function cspDirectives(config) {
  const imgSrc = ["'self'", "data:", "blob:"];
  const connectSrc = ["'self'"];
  if (config.supabaseUrl) {
    try {
      const origin = new URL(config.supabaseUrl).origin;
      imgSrc.push(origin);
      connectSrc.push(origin);
    } catch { /* readiness rejects an invalid URL */ }
  }
  return {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc,
    fontSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    frameSrc: ["'none'"],
    imgSrc,
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    styleSrcAttr: ["'unsafe-inline'"],
    upgradeInsecureRequests: config.isProduction ? [] : null,
  };
}

function deviceFamily(userAgent = "") {
  const value = String(userAgent).toLowerCase();
  if (!value) return "unknown";
  if (/bot|crawler|spider|slurp|headless/.test(value)) return "bot";
  if (/ipad|tablet/.test(value)) return "tablet";
  if (/mobile|iphone|android/.test(value)) return "mobile";
  return "desktop";
}

function redirectErrorPage(title, message) {
  return `<!doctype html>
  <html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow"><title>${title} · Tapote</title>
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4efe5;color:#141414;font-family:Arial,sans-serif}.box{width:min(560px,calc(100% - 48px));border-top:5px solid #2458ff;padding-top:28px}.brand{font-weight:900;font-size:22px}.brand span{color:#2458ff}h1{margin:55px 0 14px;font-size:clamp(38px,8vw,68px);line-height:.95}p{max-width:460px;color:#6c6860;line-height:1.65}a{display:inline-block;margin-top:24px;color:#2458ff;font-weight:800}</style>
  </head><body><main class="box"><div class="brand">tapote<span>.</span></div><h1>${title}</h1><p>${message}</p><a href="https://tapote.fr">Retourner sur Tapote</a></main></body></html>`;
}

function normalizeStripeId(value) {
  if (typeof value === "string") return value;
  return value?.id || null;
}

function eventToOrderUpdate(event) {
  const object = event.data.object;
  const base = {
    eventId: event.id,
    eventType: event.type,
    livemode: Boolean(event.livemode),
    created: event.created,
    orderToken: null,
    sessionId: null,
    paymentIntentId: null,
    amountTotal: null,
    currency: null,
    status: null,
    notification: null,
  };

  if (event.type.startsWith("checkout.session.")) {
    const orderToken = uuidPattern.test(object.metadata?.orderToken || "") ? object.metadata.orderToken : null;
    const status = event.type === "checkout.session.expired"
      ? "expired"
      : event.type === "checkout.session.async_payment_failed"
        ? "payment_failed"
        : object.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded"
          ? "paid"
          : "payment_pending";
    return {
      ...base,
      orderToken,
      sessionId: object.id,
      paymentIntentId: normalizeStripeId(object.payment_intent),
      amountTotal: object.amount_total,
      currency: object.currency,
      status,
      notification: ["paid", "payment_failed"].includes(status) ? {
        status,
        orderToken,
        businessName: object.metadata?.businessName,
        customerEmail: object.customer_details?.email,
        customerName: object.customer_details?.name,
        amountTotal: object.amount_total,
        currency: object.currency,
      } : null,
    };
  }

  if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
    const status = event.type === "charge.refunded" ? "refunded" : "disputed";
    return {
      ...base,
      paymentIntentId: normalizeStripeId(object.payment_intent),
      amountTotal: object.amount_refunded ?? object.amount,
      currency: object.currency,
      status,
      notification: { status },
    };
  }

  return null;
}

function stripeStatus(session, storedOrder) {
  if (session.payment_status === "paid") return "paid";
  if (session.status === "expired") return "expired";
  if (storedOrder?.status === "payment_failed") return "payment_failed";
  return "processing";
}

export function createApp({ config, repository, storage, logger, outboxWorker, stripe: injectedStripe, storefrontHtml: injectedStorefrontHtml } = {}) {
  const stripe = injectedStripe ?? (config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null);
  const app = express();
  const checkoutLimiter = limiter(60 * 60 * 1_000, 20, "Trop de tentatives de paiement. Réessaie dans quelques minutes.");
  const uploadLimiter = limiter(60 * 60 * 1_000, 30, "Trop d’envois de fichiers. Réessaie plus tard.");
  const leadLimiter = limiter(60 * 60 * 1_000, 10, "Trop de demandes envoyées. Réessaie plus tard.");
  const statusLimiter = limiter(15 * 60 * 1_000, 60, "Trop de vérifications. Réessaie dans quelques minutes.");

  app.disable("x-powered-by");
  if (config.trustProxyHops > 0) app.set("trust proxy", config.trustProxyHops);
  app.use(pinoHttp({
    logger,
    genReqId: (request, response) => {
      const requestId = request.headers["x-request-id"] || randomUUID();
      response.setHeader("X-Request-Id", requestId);
      return requestId;
    },
    customLogLevel: (_request, response, error) => error || response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info",
  }));
  app.use(helmet({
    contentSecurityPolicy: { directives: cspDirectives(config) },
    crossOriginResourcePolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    strictTransportSecurity: config.isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: false }
      : false,
  }));
  app.use((_request, response, next) => {
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
    next();
  });
  app.use(compression());

  if (config.allowedOrigins.length) {
    app.use(cors({
      origin: (origin, callback) => {
        if (!origin || config.allowedOrigins.includes(origin.replace(/\/$/, ""))) return callback(null, true);
        return callback(new Error("ORIGINE_NON_AUTORISEE"));
      },
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
      maxAge: 600,
    }));
  }

  app.post("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (request, response, next) => {
    if (!stripe || !config.stripeWebhookSecret || !repository.durable) {
      return response.status(503).json({ error: "Webhook indisponible." });
    }
    try {
      const signature = request.headers["stripe-signature"];
      if (typeof signature !== "string") return response.status(400).json({ error: "Signature Stripe manquante." });
      const event = stripe.webhooks.constructEvent(request.body, signature, config.stripeWebhookSecret);
      const update = eventToOrderUpdate(event);
      if (update) {
        const result = await repository.recordStripeEvent(update);
        request.log.info({ stripeEventId: event.id, type: event.type, duplicate: result.duplicate }, "Webhook Stripe traité");
        if (!result.duplicate) setImmediate(() => void outboxWorker.runOnce());
      }
      return response.json({ received: true });
    } catch (error) {
      if (error?.type === "StripeSignatureVerificationError") {
        return response.status(400).json({ error: "Signature Stripe invalide." });
      }
      return next(error);
    }
  });

  app.use(express.json({ limit: "200kb", strict: true }));

  app.get("/api/health", (_request, response) => response.json({ ok: true }));
  app.get("/api/ready", async (request, response) => {
    try {
      await Promise.all([repository.healthCheck(), storage.healthCheck()]);
      const readiness = getProductionChecks(config, { repository, storage });
      if (!readiness.ready) {
        const missingChecks = Object.entries(readiness.checks)
          .filter(([, ready]) => !ready)
          .map(([name]) => name);
        request.log.warn({ missingChecks }, "Readiness production incomplète");
      }
      return response.status(readiness.ready ? 200 : 503).json({ ready: readiness.ready });
    } catch (error) {
      request.log.error({ err: error }, "Readiness production indisponible");
      return response.status(503).json({ ready: false });
    }
  });

  app.get("/a/:code", async (request, response, next) => {
    const parsed = parseRequest(tapoteRedirectSchema, {
      code: request.params.code,
      source: ["nfc", "qr"].includes(request.query.s) ? request.query.s : "unknown",
    });
    response.set({
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    });
    if (parsed.error) {
      return response.status(400).type("html").send(redirectErrorPage("Lien invalide", "Ce lien Tapote est incomplet ou a été mal recopié."));
    }

    try {
      const link = await repository.resolveTapoteLink(parsed.data.code.toLowerCase());
      if (!link) {
        return response.status(404).type("html").send(redirectErrorPage("Lien introuvable", "Ce produit n’est pas encore associé à une destination."));
      }
      if (!link.active) {
        return response.status(410).type("html").send(redirectErrorPage("Lien en pause", "Ce produit a été temporairement désactivé par son établissement."));
      }
      setImmediate(() => {
        void repository.recordTapEvent({
          tapoteLinkId: link.id,
          source: parsed.data.source,
          deviceFamily: deviceFamily(request.headers["user-agent"]),
        }).catch((error) => request.log.warn({ err: error, tapoteLinkId: link.id }, "Interaction Pilot non enregistrée"));
      });
      return response.redirect(302, link.targetUrl);
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/uploads/logo", uploadLimiter, upload.single("logo"), async (request, response, next) => {
    try {
      if (!request.file) return response.status(400).json({ error: "Sélectionne un logo PNG, JPG ou WebP." });
      if (config.isProduction && (!repository.durable || !storage.durable)) {
        return response.status(503).json({ error: "Le stockage des logos n’est pas encore configuré." });
      }
      const detected = await fileTypeFromBuffer(request.file.buffer);
      const declaredMimeType = canonicalImageType(request.file.mimetype);
      if (!detected || !allowedImageTypes.has(detected.mime) || detected.mime !== declaredMimeType) {
        return response.status(400).json({ error: "Le contenu du fichier ne correspond pas à une image PNG, JPG ou WebP valide." });
      }
      const id = randomUUID();
      const originalName = String(request.file.originalname || "logo")
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}._ -]/gu, "_")
        .slice(0, 120);
      const stored = await storage.upload({
        id,
        buffer: request.file.buffer,
        mimeType: detected.mime,
        extension: allowedImageTypes.get(detected.mime),
      });
      await repository.recordUpload({
        id,
        storagePath: stored.storagePath,
        originalName,
        mimeType: detected.mime,
        bytes: request.file.size,
      });
      return response.status(201).json({ uploadId: id });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/management/orders/:orderId/details", statusLimiter, async (request, response, next) => {
    response.set({
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    });
    if (!uuidPattern.test(request.params.orderId || "")) {
      return response.status(400).json({ error: "Identifiant de commande invalide." });
    }
    try {
      const user = await storage.authenticateManagementUser?.(bearerToken(request));
      if (!user?.id) return response.status(401).json({ error: "Session Gestion invalide ou expirée." });
      const details = await repository.getManagementOrderDetails(request.params.orderId, user.id);
      if (!details) return response.status(404).json({ error: "Commande introuvable." });
      const lines = await Promise.all(details.lines.map(async (line) => {
        if (!line.logo?.storagePath) return { ...line, logo: null };
        const signed = await storage.createSignedDownload(line.logo.storagePath, 300);
        return {
          ...line,
          logo: {
            id: line.logo.id,
            originalName: line.logo.originalName,
            mimeType: line.logo.mimeType,
            bytes: line.logo.bytes,
            downloadUrl: signed?.url || null,
            expiresIn: signed?.expiresIn || null,
          },
        };
      }));
      return response.json({ ...details, lines });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/catalog", statusLimiter, async (_request, response, next) => {
    response.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    try {
      const persisted = await repository.getStorefrontCatalog?.();
      const products = persisted?.length ? persisted : Object.values(PRODUCTS).map((product) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        online: true,
        availableStock: null,
      }));
      return response.json({ products });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/management/orders/:orderId/activate-pilot", statusLimiter, async (request, response, next) => {
    response.set({
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    });
    if (!uuidPattern.test(request.params.orderId || "")) {
      return response.status(400).json({ error: "Identifiant de commande invalide." });
    }
    const parsed = parseRequest(pilotActivationSchema, request.body);
    if (parsed.error) return response.status(400).json({ error: parsed.error });
    try {
      const user = await storage.authenticateManagementUser?.(bearerToken(request));
      if (!user?.id) return response.status(401).json({ error: "Session Gestion invalide ou expirée." });
      const order = await repository.getManagementOrderPilotContext(request.params.orderId, user.id);
      if (!order) return response.status(404).json({ error: "Commande introuvable." });
      if (!order.clientEmail) return response.status(409).json({ error: "Ajoute une adresse e-mail au client avant d’activer Pilot." });
      const activation = await storage.provisionPilotWorkspace({
        actorUserId: user.id,
        order,
        locationName: parsed.data.locationName,
        targetUrl: parsed.data.targetUrl,
      });
      return response.status(activation.status === "invited" ? 202 : 200).json(activation);
    } catch (error) {
      if (error?.statusCode) {
        return response.status(error.statusCode).json({ error: error.publicMessage || "L’activation Pilot a échoué." });
      }
      return next(error);
    }
  });

  app.post("/api/checkout", checkoutLimiter, async (request, response, next) => {
    const parsed = parseRequest(checkoutSchema, request.body);
    if (parsed.error) return response.status(400).json({ error: parsed.error });
    const { attemptId, customer, professionalCustomer, termsAccepted, items } = parsed.data;
    const returnUrl = checkoutReturnUrl(request, config);
    void termsAccepted;
    void professionalCustomer;

    try {
      const eligibleSupports = items.filter((item) => {
        const candidate = PRODUCTS[item.productId];
        return candidate?.personalization === "custom"
          && (candidate?.kind === "support" || candidate?.kind === "pack");
      });
      const hasEligibleSupport = eligibleSupports.length > 0;
      const matchingSupportsByIdentity = new Map(eligibleSupports.map((item) => [matchingIdentityKey(item), item]));
      const matchingSupport = matchingSupportsByIdentity.size === 1 ? matchingSupportsByIdentity.values().next().value : null;
      const hasMatchedCard = items.some((item) => PRODUCTS[item.productId]?.personalization === "matched");
      if (hasMatchedCard && matchingSupportsByIdentity.size > 1) {
        return response.status(400).json({ error: "La Carte NFC assortie nécessite une seule identité dans le panier. Commande une Carte NFC personnalisée séparément pour une autre marque ou un autre lien." });
      }
      const validItems = [];
      for (const item of items) {
        const product = PRODUCTS[item.productId];
        const effectiveItem = product.personalization === "matched" && matchingSupport
          ? {
            ...item,
            actionId: matchingSupport.actionId,
            brandName: matchingSupport.brandName,
            theme: matchingSupport.theme,
            primaryColor: matchingSupport.primaryColor,
            secondaryColor: matchingSupport.secondaryColor,
            textColor: matchingSupport.textColor,
            targetId: matchingSupport.targetId,
            customHeadline: matchingSupport.customHeadline,
            customSubline: matchingSupport.customSubline,
            customTapLabel: matchingSupport.customTapLabel,
            destinationUrl: matchingSupport.destinationUrl,
            brandLogoId: matchingSupport.brandLogoId,
            logoFileName: matchingSupport.logoFileName,
          }
          : item;
        if (effectiveItem.brandLogoId) {
          const logo = await repository.getUpload(effectiveItem.brandLogoId);
          if (!logo) return response.status(400).json({ error: "Un logo du panier n’est plus disponible. Importe-le de nouveau." });
        }
        const action = ACTIONS[effectiveItem.actionId];
        if (product.requiresSupportOrder && !hasEligibleSupport) {
          return response.status(400).json({ error: `${product.name} est réservée aux commandes contenant une plaque ou un chevalet.` });
        }
        if (product.kind === "pack") {
          const composition = effectiveItem.supportComposition || product.defaultComposition;
          const supportTotal = composition.comptoir + composition.plaque;
          if (supportTotal !== product.supportCount) {
            return response.status(400).json({ error: `La composition de ${product.name} doit contenir exactement ${product.supportCount} supports.` });
          }
        }
        validItems.push({
          product,
          action,
          quantity: effectiveItem.quantity,
          customization: {
            brandName: effectiveItem.brandName,
            theme: effectiveItem.theme,
            primaryColor: effectiveItem.primaryColor,
            secondaryColor: effectiveItem.secondaryColor,
            textColor: effectiveItem.textColor,
            targetId: effectiveItem.targetId,
            customHeadline: effectiveItem.customHeadline,
            customSubline: effectiveItem.customSubline,
            customTapLabel: effectiveItem.customTapLabel,
            destinationUrl: effectiveItem.destinationUrl || customer.destinationUrl,
            brandLogoId: effectiveItem.brandLogoId || null,
            logoFileName: effectiveItem.logoFileName,
            supportComposition: product.kind === "pack"
              ? (effectiveItem.supportComposition || product.defaultComposition)
              : null,
          },
        });
      }

      const physicalSupportTotal = validItems.reduce(
        (sum, { product, quantity }) => sum + (product.supportCount || 1) * quantity,
        0,
      );
      if (physicalSupportTotal >= 10) {
        return response.status(400).json({ error: "À partir de 10 supports, demandez un devis afin de recevoir un tarif adapté à votre composition." });
      }

      if (repository.durable && repository.getStorefrontCatalog) {
        const publishedCatalog = await repository.getStorefrontCatalog();
        if (Array.isArray(publishedCatalog)) {
          const publishedById = new Map(publishedCatalog.map((entry) => [entry.productId, entry]));
          const unavailableItem = validItems.find(({ product }) => {
            const published = publishedById.get(product.id);
            return !published?.online || published.price !== product.price || published.availableStock === 0;
          });
          if (unavailableItem) {
            return response.status(409).json({ error: `${unavailableItem.product.name} n’est plus disponible. Actualise la boutique avant de continuer.` });
          }
        }
      }

      const orderItems = validItems.map(({ product, action, quantity, customization }) => ({
        productId: product.id,
        actionId: action.id,
        quantity,
        unitAmount: product.price,
        customization,
      }));
      const subtotal = validItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
      const shippingAmount = calculateShipping(subtotal);

      // Fail closed before persisting anything. A checkout disabled by missing
      // production dependencies must never leave an orphan pending order.
      const readiness = getProductionChecks(config, { repository, storage });
      const sandboxCheckout = config.isProduction
        && config.stripeSandboxCheckoutEnabled
        && config.stripeSecretKey.startsWith("sk_test_");
      const missingChecks = Object.entries(readiness.checks)
        .filter(([name, ready]) => !ready && !(sandboxCheckout && name === "stripeLive"))
        .map(([name]) => name);
      if (config.isProduction && missingChecks.length > 0) {
        request.log.error({ missingChecks }, "Checkout bloqué par la readiness");
        return response.status(503).json({ error: "La boutique finalise sa configuration. Réessaie un peu plus tard." });
      }
      if (!config.legalReady || !config.legalVersion) {
        return response.status(503).json({ error: "La vente est verrouillée tant que les informations légales ne sont pas validées." });
      }

      const pendingOrder = await repository.createPendingOrder({
        orderToken: attemptId,
        customer,
        legalVersion: config.legalVersion || "development",
        items: orderItems,
      });

      if (pendingOrder.existing && pendingOrder.stripeSessionId && stripe) {
        const existingSession = await stripe.checkout.sessions.retrieve(pendingOrder.stripeSessionId);
        if (existingSession.url) return response.json({ url: existingSession.url });
      }

      if (!stripe) {
        if (!config.allowDemoCheckout) return response.status(503).json({ error: "Le paiement n’est pas encore disponible." });
        const demoId = `demo_${randomUUID()}`;
        await repository.markDemoOrder(attemptId, demoId);
        return response.json({ demo: true, url: `${returnUrl}/commande/confirmee?session_id=${encodeURIComponent(demoId)}` });
      }

      const lineItems = validItems.map(({ product, action, quantity, customization }) => ({
        quantity,
        price_data: {
          currency: "eur",
          unit_amount: product.price,
          tax_behavior: "inclusive",
          product_data: {
            name: `${product.name} · ${action.name}`,
            description: product.format,
            metadata: {
              productId: product.id,
              actionId: action.id,
              brandName: customization.brandName || customer.businessName,
              theme: customization.theme,
              primaryColor: customization.primaryColor || "default",
              secondaryColor: customization.secondaryColor || "default",
              textColor: customization.textColor || "default",
              targetId: customization.targetId,
              brandLogoId: customization.brandLogoId || "none",
              supportComposition: customization.supportComposition
                ? JSON.stringify(customization.supportComposition)
                : "single",
            },
          },
        },
      }));

      const personalizedOrder = validItems.some(({ product }) => product.personalization !== "ready");
      const shippingRateData = {
        type: "fixed_amount",
        fixed_amount: { amount: shippingAmount, currency: "eur" },
        display_name: shippingAmount === 0
          ? "Livraison standard France métropolitaine offerte"
          : "Livraison standard France métropolitaine",
      };

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        locale: "fr",
        submit_type: "pay",
        line_items: lineItems,
        customer_email: customer.email,
        customer_creation: "always",
        tax_id_collection: { enabled: true },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `Commande professionnelle Tapote · ${attemptId}`,
            metadata: { orderToken: attemptId, customerType: "business" },
          },
        },
        billing_address_collection: "required",
        shipping_address_collection: { allowed_countries: ["FR"] },
        shipping_options: [{ shipping_rate_data: shippingRateData }],
        allow_promotion_codes: true,
        phone_number_collection: { enabled: true },
        automatic_tax: { enabled: config.stripeAutomaticTax },
        payment_intent_data: { metadata: { orderToken: attemptId } },
        success_url: `${returnUrl}/commande/confirmee?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}/commande?commande=annulee`,
        metadata: { orderToken: attemptId, businessName: customer.businessName, customerType: "business" },
        custom_text: {
          shipping_address: { message: personalizedOrder
            ? "Commande personnalisée : la création enregistrée au panier part directement en préparation. Chaque support sera configuré et testé avant expédition."
            : "Commande professionnelle : chaque support sera préparé, configuré et testé avant expédition." },
          submit: { message: `En payant, vous confirmez agir à titre professionnel et accepter les CGV B2B ${config.legalVersion}.` },
        },
      }, { idempotencyKey: `tapote-checkout-${attemptId}` });

      const attached = await repository.attachStripeSession(attemptId, session.id, normalizeStripeId(session.payment_intent));
      if (!attached) throw new Error("La session Stripe n’a pas pu être rattachée à la commande.");
      return response.json({ url: session.url });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/checkout/status", statusLimiter, async (request, response, next) => {
    const parsed = parseRequest(checkoutStatusSchema, request.query);
    if (parsed.error) return response.status(400).json({ error: parsed.error });
    const sessionId = parsed.data.session_id;
    try {
      if (sessionId.startsWith("demo_") && config.allowDemoCheckout) {
        const order = await repository.getOrderBySession(sessionId);
        return order ? response.json({ status: "demo", reference: order.orderToken }) : response.status(404).json({ error: "Commande de démonstration introuvable." });
      }
      if (!stripe || !sessionId.startsWith("cs_")) return response.status(404).json({ error: "Commande introuvable." });
      const [session, storedOrder] = await Promise.all([
        stripe.checkout.sessions.retrieve(sessionId),
        repository.getOrderBySession(sessionId),
      ]);
      return response.json({ status: stripeStatus(session, storedOrder), reference: storedOrder?.orderToken || session.metadata?.orderToken || null });
    } catch (error) {
      if (error?.statusCode === 404) return response.status(404).json({ error: "Commande introuvable." });
      return next(error);
    }
  });

  app.post("/api/lead", leadLimiter, async (request, response, next) => {
    const parsed = parseRequest(leadSchema, request.body);
    if (parsed.error) return response.status(400).json({ error: parsed.error });
    if (parsed.data.website) return response.status(201).json({ ok: true });
    if (config.isProduction && !repository.durable) return response.status(503).json({ error: "Le formulaire est temporairement indisponible." });
    try {
      await repository.createLead(parsed.data);
      setImmediate(() => void outboxWorker.runOnce());
      return response.status(201).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.use("/api", (_request, response) => response.status(404).json({ error: "Route API introuvable." }));

  app.use(express.static(distDir, {
    dotfiles: "ignore",
    index: false,
    maxAge: config.isProduction ? "1h" : 0,
    setHeaders: (response, filePath) => {
      if (config.isProduction && /\/assets\/.*-[a-zA-Z0-9_-]+\.(?:js|css|woff2)$/.test(filePath)) {
        response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }));
  let storefrontTemplate = injectedStorefrontHtml;
  app.use(async (request, response, next) => {
    if (!config.isProduction || !["GET", "HEAD"].includes(request.method) || !request.accepts("html")) return next();
    try {
      storefrontTemplate ||= await readFile(join(distDir, "index.html"), "utf8");
      const knownFrontendPath = isKnownFrontendPath(request.path);
      const meta = storefrontMetaForPath(request.path, config.publicUrl);
      response.set({
        "Cache-Control": knownFrontendPath ? "no-cache" : "no-store",
        "X-Robots-Tag": meta.robots,
      });
      return response
        .status(knownFrontendPath ? 200 : 404)
        .type("html")
        .send(injectStorefrontMeta(storefrontTemplate, request.path, config.publicUrl));
    } catch (error) {
      return next(error);
    }
  });

  app.use((_request, response) => response.status(404).json({ error: "Ressource introuvable." }));

  if (config.sentryDsn) Sentry.setupExpressErrorHandler(app);
  app.use((error, request, response, next) => {
    void next;
    if (error instanceof multer.MulterError || error?.message === "TYPE_FICHIER_INVALIDE") {
      return response.status(400).json({ error: "Logo invalide ou trop volumineux. Utilise un PNG, JPG ou WebP de 2 Mo maximum." });
    }
    if (error?.message === "ORIGINE_NON_AUTORISEE") return response.status(403).json({ error: "Origine non autorisée." });
    request.log?.error({ err: error }, "Erreur API non gérée");
    return response.status(500).json({ error: "Une erreur inattendue est survenue. Réessaie ou contacte Tapote." });
  });

  return app;
}
