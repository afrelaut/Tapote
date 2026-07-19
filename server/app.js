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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ACTIONS, calculateShipping, PRODUCTS } from "../shared/catalog.js";
import { getProductionChecks } from "./config.js";
import { checkoutSchema, checkoutStatusSchema, leadSchema, parseRequest, tapoteRedirectSchema } from "./validation.js";

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

const canonicalImageType = (mimeType) => imageTypeAliases.get(String(mimeType || "").toLowerCase()) || "";

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

const checkoutLimiter = limiter(60 * 60 * 1_000, 20, "Trop de tentatives de paiement. Réessaie dans quelques minutes.");
const uploadLimiter = limiter(60 * 60 * 1_000, 30, "Trop d’envois de fichiers. Réessaie plus tard.");
const leadLimiter = limiter(60 * 60 * 1_000, 10, "Trop de demandes envoyées. Réessaie plus tard.");
const statusLimiter = limiter(15 * 60 * 1_000, 60, "Trop de vérifications. Réessaie dans quelques minutes.");

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

export function createApp({ config, repository, storage, logger, outboxWorker, stripe: injectedStripe } = {}) {
  const stripe = injectedStripe ?? (config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null);
  const app = express();

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
      allowedHeaders: ["Content-Type", "X-Request-Id"],
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
  app.get("/api/ready", async (_request, response) => {
    try {
      await Promise.all([repository.healthCheck(), storage.healthCheck()]);
      const readiness = getProductionChecks(config, { repository, storage });
      return response.status(readiness.ready ? 200 : 503).json({ ready: readiness.ready });
    } catch {
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

  app.post("/api/checkout", checkoutLimiter, async (request, response, next) => {
    const parsed = parseRequest(checkoutSchema, request.body);
    if (parsed.error) return response.status(400).json({ error: parsed.error });
    const { attemptId, customer, professionalCustomer, termsAccepted, items } = parsed.data;
    const returnUrl = checkoutReturnUrl(request, config);
    void termsAccepted;
    void professionalCustomer;

    try {
      const validItems = [];
      for (const item of items) {
        if (item.brandLogoId) {
          const logo = await repository.getUpload(item.brandLogoId);
          if (!logo) return response.status(400).json({ error: "Un logo du panier n’est plus disponible. Importe-le de nouveau." });
        }
        const product = PRODUCTS[item.productId];
        const action = ACTIONS[item.actionId];
        if (product.availableStandalone === false) {
          return response.status(400).json({ error: `${product.name} est disponible uniquement dans les packs Tapote.` });
        }
        validItems.push({
          product,
          action,
          quantity: item.quantity,
          customization: {
            brandName: item.brandName,
            theme: item.theme,
            targetId: item.targetId,
            designStyle: item.designStyle,
            customHeadline: item.customHeadline,
            destinationUrl: item.destinationUrl || customer.destinationUrl,
            brandLogoId: item.brandLogoId || null,
            logoFileName: item.logoFileName,
          },
        });
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
        return response.json({ demo: true, url: `${returnUrl}/?commande=demo&session_id=${encodeURIComponent(demoId)}` });
      }

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
              targetId: customization.targetId,
              designStyle: customization.designStyle,
              brandLogoId: customization.brandLogoId || "none",
            },
          },
        },
      }));

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        locale: "fr",
        submit_type: "pay",
        line_items: lineItems,
        customer_email: customer.email,
        customer_creation: "always",
        billing_address_collection: "required",
        shipping_address_collection: { allowed_countries: ["FR"] },
        shipping_options: [{
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingAmount, currency: "eur" },
            display_name: shippingAmount === 0
              ? "Livraison standard France métropolitaine offerte"
              : "Livraison standard France métropolitaine",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 4 },
              maximum: { unit: "business_day", value: 6 },
            },
          },
        }],
        allow_promotion_codes: true,
        phone_number_collection: { enabled: true },
        automatic_tax: { enabled: config.stripeAutomaticTax },
        payment_intent_data: { metadata: { orderToken: attemptId } },
        success_url: `${returnUrl}/?commande=confirmee&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}/?commande=annulee`,
        metadata: { orderToken: attemptId, businessName: customer.businessName, customerType: "business" },
        custom_text: {
          shipping_address: { message: "Commande professionnelle : votre objet sera personnalisé, configuré et testé avant expédition." },
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
        return order ? response.json({ status: "demo" }) : response.status(404).json({ error: "Commande de démonstration introuvable." });
      }
      if (!stripe || !sessionId.startsWith("cs_")) return response.status(404).json({ error: "Commande introuvable." });
      const [session, storedOrder] = await Promise.all([
        stripe.checkout.sessions.retrieve(sessionId),
        repository.getOrderBySession(sessionId),
      ]);
      return response.json({ status: stripeStatus(session, storedOrder) });
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
  app.use((request, response, next) => {
    if (!config.isProduction || request.method !== "GET" || !request.accepts("html")) return next();
    return response.sendFile(join(distDir, "index.html"));
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
