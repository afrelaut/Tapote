import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp, injectStorefrontMeta, isKnownFrontendPath, storefrontMetaForPath } from "./app.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { createRepository } from "./repository.js";

const legalEnv = {
  LEGAL_READY: "true",
  LEGAL_VERSION: "2026-07-16",
  VITE_LEGAL_COMPANY: "Tapote Test",
  VITE_LEGAL_CAPITAL: "1 €",
  VITE_LEGAL_ADDRESS: "1 rue du Test",
  VITE_LEGAL_REGISTRATION: "RCS TEST",
  VITE_LEGAL_VAT: "FR000000000",
  VITE_LEGAL_TAX_LABEL: "TTC",
  VITE_LEGAL_DIRECTOR: "Direction Test",
  VITE_LEGAL_CONTACT: "test@example.com",
  VITE_LEGAL_HOST: "Hébergeur Test",
  VITE_LEGAL_MEDIATOR: "Médiateur Test",
  VITE_LEGAL_PRIVACY_CONTACT: "privacy@example.com",
  VITE_LEGAL_RETURNS_ADDRESS: "1 rue du Test",
  VITE_LEGAL_DATA_RETENTION: "10 ans pour les données comptables ; 3 ans pour le suivi commercial.",
  VITE_LEGAL_VERSION: "2026-07-16",
  STRIPE_TAX_BEHAVIOR: "inclusive",
  SHIPPING_POLICY_READY: "true",
};

const cart = [{
  productId: "comptoir",
  actionId: "avis",
  quantity: 1,
  brandName: "Café Test",
  theme: "nuit",
  targetId: "cafe",
  customHeadline: "Votre avis nous aide.",
  destinationUrl: "https://example.com/avis-comptoir",
  brandLogoId: "",
  logoFileName: "",
}];

const checkoutBody = (attemptId = "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a58") => ({
  attemptId,
  items: cart,
  customer: { businessName: "Café Test", email: "client@example.com", destinationUrl: "https://example.com/avis" },
  professionalCustomer: true,
  termsAccepted: true,
});

const storefrontHtml = `<!doctype html><html lang="fr"><head>
  <title>Accueil</title>
  <meta name="description" content="Accueil">
  <meta name="robots" content="index">
  <link rel="canonical" href="https://tapote.fr/">
  <meta property="og:title" content="Accueil">
  <meta property="og:description" content="Accueil">
  <meta property="og:url" content="https://tapote.fr/">
  <meta name="twitter:title" content="Accueil">
  <meta name="twitter:description" content="Accueil">
</head><body><div id="root"></div></body></html>`;

function makeContext(env = {}, stripe = null, overrides = {}) {
  const config = loadConfig({ NODE_ENV: "test", PUBLIC_URL: "http://localhost:5173", ...legalEnv, ...env });
  const repository = overrides.repository || createRepository(config);
  const storage = overrides.storage || { durable: false, healthCheck: vi.fn(async () => true), upload: vi.fn() };
  const logger = createLogger({ ...config, logLevel: "silent" });
  const outboxWorker = overrides.outboxWorker || { runOnce: vi.fn(async () => undefined) };
  const app = createApp({ config, repository, storage, logger, outboxWorker, stripe, storefrontHtml: overrides.storefrontHtml });
  return { app, config, repository, storage, outboxWorker };
}

afterEach(() => vi.restoreAllMocks());

describe("API Tapote", () => {
  it("distingue les vraies routes front des soft-404", () => {
    expect(isKnownFrontendPath("/")).toBe(true);
    expect(isKnownFrontendPath("/boutique/")).toBe(true);
    expect(isKnownFrontendPath("/tapote-pilot")).toBe(true);
    expect(isKnownFrontendPath("/preuves")).toBe(false);
    expect(isKnownFrontendPath("/faq")).toBe(true);
    expect(isKnownFrontendPath("/secteurs")).toBe(false);
    expect(isKnownFrontendPath("/secteurs/auto-ecoles")).toBe(false);
    expect(isKnownFrontendPath("/cas-clients")).toBe(false);
    expect(isKnownFrontendPath("/gestion/commandes")).toBe(true);
    expect(isKnownFrontendPath("/produits/invente")).toBe(false);
    expect(isKnownFrontendPath("/secteurs/invente")).toBe(false);
  });

  it("sert des métadonnées produit exploitables sans JavaScript", () => {
    const product = storefrontMetaForPath("/produits/plaque?ignored=true", "https://tapote.fr");
    const quote = storefrontMetaForPath("/devis", "https://tapote.fr");
    const pilotMarketing = storefrontMetaForPath("/tapote-pilot", "https://tapote.fr");
    const legal = storefrontMetaForPath("/cgv", "https://tapote.fr");
    const privatePage = storefrontMetaForPath("/panier", "https://tapote.fr");
    const missing = storefrontMetaForPath("/produits/invente", "https://tapote.fr");
    const template = '<html><head><title>Accueil</title><meta name="description" content="Accueil"><meta name="robots" content="index"><link rel="canonical" href="https://tapote.fr/"><meta property="og:title" content="Accueil"><meta property="og:description" content="Accueil"><meta property="og:url" content="https://tapote.fr/"><meta name="twitter:title" content="Accueil"><meta name="twitter:description" content="Accueil"></head></html>';
    const rendered = injectStorefrontMeta(template, "/produits/plaque", "https://tapote.fr");

    expect(product.title).toContain("Tapote Plaque");
    expect(product.canonical).toBe("https://tapote.fr/produits/plaque");
    expect(quote).toMatchObject({
      title: "Devis volume et multi-sites | Tapote",
      canonical: "https://tapote.fr/devis",
      robots: "index,follow,max-image-preview:large",
    });
    expect(pilotMarketing).toMatchObject({
      title: "Tapote Pilot inclus et Pilot Pro | Tapote",
      canonical: "https://tapote.fr/tapote-pilot",
      robots: "index,follow,max-image-preview:large",
    });
    expect(legal.title).toBe("Conditions générales de vente B2B | Tapote");
    expect(privatePage.robots).toBe("noindex,nofollow");
    expect(missing.robots).toBe("noindex,nofollow");
    expect(rendered).toContain("<title>Tapote Plaque NFC + QR | Tapote</title>");
    expect(rendered).toContain('property="og:url" content="https://tapote.fr/produits/plaque"');
  });

  it("sert le HTML SEO public avec un vrai statut 404 sans casser les espaces SPA privés", async () => {
    const { app } = makeContext(
      { NODE_ENV: "production", PUBLIC_URL: "https://tapote.fr" },
      null,
      { storefrontHtml },
    );

    const quote = await request(app).get("/devis").set("Accept", "text/html");
    expect(quote.status).toBe(200);
    expect(quote.type).toMatch(/html/);
    expect(quote.text).toContain("<title>Devis volume et multi-sites | Tapote</title>");
    expect(quote.text).toContain('name="robots" content="index,follow,max-image-preview:large"');
    expect(quote.text).toContain('rel="canonical" href="https://tapote.fr/devis"');
    expect(quote.headers["x-robots-tag"]).toBe("index,follow,max-image-preview:large");

    const pilotMarketing = await request(app).get("/tapote-pilot").set("Accept", "text/html");
    expect(pilotMarketing.status).toBe(200);
    expect(pilotMarketing.text).toContain("<title>Tapote Pilot inclus et Pilot Pro | Tapote</title>");
    expect(pilotMarketing.headers["x-robots-tag"]).toBe("index,follow,max-image-preview:large");

    const faq = await request(app).get("/faq").set("Accept", "text/html");
    expect(faq.status).toBe(200);
    expect(faq.text).toContain("<title>FAQ Tapote | NFC, QR, produits et livraison</title>");
    expect(faq.headers["x-robots-tag"]).toBe("index,follow,max-image-preview:large");

    for (const path of ["/secteurs", "/secteurs/auto-ecoles", "/preuves", "/cas-clients"]) {
      const missing = await request(app).get(path).set("Accept", "text/html");
      expect(missing.status, path).toBe(404);
      expect(missing.text, path).toContain("<title>Page introuvable | Tapote</title>");
      expect(missing.text, path).toContain('name="robots" content="noindex,nofollow"');
      expect(missing.headers["cache-control"], path).toBe("no-store");
      expect(missing.headers["x-robots-tag"], path).toBe("noindex,nofollow");
    }

    const missingHead = await request(app).head("/produits/invente").set("Accept", "text/html");
    expect(missingHead.status).toBe(404);

    for (const path of ["/pilot", "/pilot/produits", "/gestion", "/gestion/commandes"]) {
      const spa = await request(app).get(path).set("Accept", "text/html");
      expect(spa.status, path).toBe(200);
      expect(spa.headers["x-robots-tag"], path).toBe("noindex,nofollow");
    }
  });

  it("autorise les styles React inline avec le fallback Safari/WebKit", async () => {
    const { app } = makeContext({ SUPABASE_URL: "https://project-ref.supabase.co" });
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toContain("style-src 'self' 'unsafe-inline'");
    expect(response.headers["content-security-policy"]).toContain("style-src-attr 'unsafe-inline'");
    expect(response.headers["content-security-policy"]).toContain("connect-src 'self' https://project-ref.supabase.co wss://project-ref.supabase.co");
  });

  it("reçoit un diagnostic navigateur borné sans données de session", async () => {
    const { app } = makeContext();
    const response = await request(app)
      .post("/api/client-errors")
      .send({
        id: "WEB-TEST-123",
        surface: "management-view",
        view: "dashboard",
        name: "TypeError",
        message: "Erreur Safari",
        stack: "x".repeat(5_000),
        componentStack: "at DashboardView",
        path: "/gestion",
        userAgent: "Mobile Safari",
        viewport: { width: 390, height: 844 },
        token: "ne-doit-pas-etre-journalise",
      });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ received: true, id: "WEB-TEST-123" });
    expect((await request(app).post("/api/client-errors").send({ surface: "management-view" })).status).toBe(400);
  });

  it("ne crée jamais de commande démo en production", async () => {
    const { app, repository } = makeContext({ NODE_ENV: "production", PUBLIC_URL: "https://tapote.fr", ALLOW_DEMO_CHECKOUT: "true" });
    const response = await request(app).post("/api/checkout").send(checkoutBody());
    expect(response.status).toBe(503);
    expect(response.body.demo).toBeUndefined();
    expect(repository.orders.size).toBe(0);
  });

  it("autorise explicitement une démo locale et vérifie son statut", async () => {
    const { app } = makeContext({ ALLOW_DEMO_CHECKOUT: "true", PUBLIC_URL: "http://localhost:5175" });
    const checkout = await request(app)
      .post("/api/checkout")
      .set("Origin", "http://localhost:5173")
      .send(checkoutBody());
    expect(checkout.status).toBe(200);
    expect(checkout.body.demo).toBe(true);
    expect(new URL(checkout.body.url).origin).toBe("http://localhost:5173");
    expect(new URL(checkout.body.url).pathname).toBe("/commande/confirmee");
    const sessionId = new URL(checkout.body.url).searchParams.get("session_id");
    const status = await request(app).get(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
    expect(status.body).toEqual({ status: "demo", reference: checkoutBody().attemptId });
  });

  it("publie le catalogue Gestion et refuse un produit mis hors ligne avant toute commande", async () => {
    const context = makeContext();
    context.repository.durable = true;
    context.repository.getStorefrontCatalog = vi.fn(async () => [{
      productId: "comptoir",
      name: "Le Chevalet A6",
      price: 3900,
      online: false,
      availableStock: null,
    }]);

    const catalog = await request(context.app).get("/api/catalog");
    expect(catalog.status).toBe(200);
    expect(catalog.body.products[0]).toEqual(expect.objectContaining({ productId: "comptoir", online: false }));

    const checkout = await request(context.app).post("/api/checkout").send(checkoutBody());
    expect(checkout.status).toBe(409);
    expect(checkout.body.error).toContain("n’est plus disponible");
    expect(context.repository.orders.size).toBe(0);
  });

  it("n’expose dans le catalogue public que les trois supports et Pack Local", async () => {
    const context = makeContext();
    context.repository.getStorefrontCatalog = vi.fn(async () => []);

    const catalog = await request(context.app).get("/api/catalog");
    const productIds = catalog.body.products.map((product) => product.productId);

    expect(catalog.status).toBe(200);
    expect(productIds).toEqual(expect.arrayContaining([
      "comptoir_standard",
      "comptoir",
      "plaque_standard",
      "plaque",
      "carte_standard",
      "carte",
      "pack_duo_standard",
      "pack_duo",
    ]));
    expect(productIds).not.toContain("pack_cinq");
    expect(productIds).not.toContain("pack_cinq_standard");
    expect(productIds).not.toContain("carte_assortie");
  });

  it("renvoie Stripe vers l’origine active du storefront en développement", async () => {
    const stripe = {
      checkout: { sessions: {
        create: vi.fn(async () => ({ id: "cs_test_return_url", url: "https://checkout.stripe.test/return-url" })),
        retrieve: vi.fn(),
      } },
    };
    const { app } = makeContext({ PUBLIC_URL: "http://localhost:5175" }, stripe);
    const response = await request(app)
      .post("/api/checkout")
      .set("Origin", "http://localhost:5173")
      .send(checkoutBody("ca58b0a4-0c28-4a1b-a2c4-40fc8dc87a61"));

    expect(response.status).toBe(200);
    const checkout = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(checkout.success_url).toBe("http://localhost:5173/commande/confirmee?session_id={CHECKOUT_SESSION_ID}");
    expect(checkout.cancel_url).toBe("http://localhost:5173/commande?commande=annulee");
  });

  it("refuse les URL non HTTPS, les particuliers et l’absence d’acceptation des CGV", async () => {
    const { app } = makeContext();
    const invalidUrl = checkoutBody();
    invalidUrl.customer.destinationUrl = "http://example.com";
    expect((await request(app).post("/api/checkout").send(invalidUrl)).status).toBe(400);
    const noTerms = checkoutBody();
    noTerms.termsAccepted = false;
    expect((await request(app).post("/api/checkout").send(noTerms)).status).toBe(400);
    const consumer = checkoutBody();
    consumer.professionalCustomer = false;
    const consumerResponse = await request(app).post("/api/checkout").send(consumer);
    expect(consumerResponse.status).toBe(400);
    expect(consumerResponse.body.error).toMatch(/professionnels/i);
  });

  it("réutilise une session Stripe pour une même tentative", async () => {
    const stripe = {
      checkout: { sessions: {
        create: vi.fn(async () => ({ id: "cs_test_123", url: "https://checkout.stripe.test/session" })),
        retrieve: vi.fn(async () => ({ id: "cs_test_123", url: "https://checkout.stripe.test/session" })),
      } },
    };
    const { app } = makeContext({}, stripe);
    const first = await request(app).post("/api/checkout").send(checkoutBody());
    const second = await request(app).post("/api/checkout").send(checkoutBody());
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledTimes(1);
  });

  it("facture la carte personnalisée 59 € et la livraison sous 69 €", async () => {
    const stripe = {
      checkout: { sessions: {
        create: vi.fn(async () => ({ id: "cs_test_shipping", url: "https://checkout.stripe.test/shipping" })),
        retrieve: vi.fn(),
      } },
    };
    const { app } = makeContext({}, stripe);
    const body = checkoutBody("aa58b0a4-0c28-4a1b-a2c4-40fc8dc87a59");
    body.items = [{ ...cart[0], productId: "carte" }];

    const response = await request(app).post("/api/checkout").send(body);

    expect(response.status).toBe(200);
    const checkout = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(checkout.line_items[0].price_data.unit_amount).toBe(5900);
    expect(checkout.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(490);
  });

  it("facture Tapote Comptoir personnalisé 89 € avec livraison offerte", async () => {
    const stripe = {
      checkout: { sessions: {
        create: vi.fn(async () => ({ id: "cs_test_comptoir_price", url: "https://checkout.stripe.test/comptoir" })),
        retrieve: vi.fn(),
      } },
    };
    const { app } = makeContext({}, stripe);
    const response = await request(app).post("/api/checkout").send(checkoutBody("ba58b0a4-0c28-4a1b-a2c4-40fc8dc87a60"));

    expect(response.status).toBe(200);
    const checkout = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(checkout.line_items[0].price_data.unit_amount).toBe(8900);
    expect(checkout.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(0);
    expect(checkout.shipping_options[0].shipping_rate_data.delivery_estimate).toBeUndefined();
    expect(checkout.custom_text.shipping_address.message).toMatch(/prépare un BAT/i);
    expect(checkout.tax_id_collection).toEqual({ enabled: true });
    expect(checkout.invoice_creation).toMatchObject({
      enabled: true,
      invoice_data: { metadata: { customerType: "business" } },
    });
  });

  it("facture les versions prêtes à servir 59 €, 69 € et 39 €", async () => {
    const stripe = {
      checkout: { sessions: {
        create: vi.fn(async () => ({ id: "cs_test_ready_prices", url: "https://checkout.stripe.test/ready" })),
        retrieve: vi.fn(),
      } },
    };
    const { app } = makeContext({}, stripe);
    const body = checkoutBody("ca58b0a4-0c28-4a1b-a2c4-40fc8dc87a63");
    body.items = [
      { ...cart[0], productId: "plaque_standard" },
      { ...cart[0], productId: "comptoir_standard" },
      { ...cart[0], productId: "carte_standard" },
    ];

    const response = await request(app).post("/api/checkout").send(body);

    expect(response.status).toBe(200);
    const checkout = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(checkout.line_items.map((item) => item.price_data.unit_amount)).toEqual([5900, 6900, 3900]);
    expect(checkout.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(0);
    expect(checkout.shipping_options[0].shipping_rate_data.delivery_estimate).toBeUndefined();
    expect(checkout.custom_text.shipping_address.message).toMatch(/configur.+test.+avant expédition/i);
  });

  it("applique les deux prix publics du Pack Local", async () => {
    const stripe = {
      checkout: { sessions: {
        create: vi.fn(async ({ line_items: lineItems }) => ({
          id: `cs_test_pack_${lineItems[0].price_data.product_data.metadata.productId}`,
          url: "https://checkout.stripe.test/pack",
        })),
        retrieve: vi.fn(),
      } },
    };
    const { app } = makeContext({}, stripe);
    const cases = [
      ["pack_duo_standard", 11900, { comptoir: 1, plaque: 1 }, 0],
      ["pack_duo", 15900, { comptoir: 1, plaque: 1 }, 0],
    ];

    for (const [index, [productId, amount, supportComposition, shipping]] of cases.entries()) {
      const body = checkoutBody(`da58b0a4-0c28-4a1b-a2c4-40fc8dc87a${70 + index}`);
      body.items = [{ ...cart[0], productId, supportComposition }];
      const response = await request(app).post("/api/checkout").send(body);
      expect(response.status).toBe(200);
      const checkout = stripe.checkout.sessions.create.mock.calls[index][0];
      expect(checkout.line_items[0].price_data.unit_amount).toBe(amount);
      expect(checkout.line_items[0].price_data.product_data.metadata.supportComposition).toBe(JSON.stringify(supportComposition));
      expect(checkout.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(shipping);
    }
  });

  it("refuse une composition de pack qui ne contient pas exactement le nombre de supports annoncé", async () => {
    const { app } = makeContext({ ALLOW_DEMO_CHECKOUT: "true" });
    const body = checkoutBody("ea58b0a4-0c28-4a1b-a2c4-40fc8dc87a64");
    body.items = [{
      ...cart[0],
      productId: "pack_duo",
      supportComposition: { comptoir: 1, plaque: 0 },
    }];

    const response = await request(app).post("/api/checkout").send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/exactement 2 supports/i);
  });

  it("redirige les commandes de 10 supports ou plus vers un devis", async () => {
    const { app } = makeContext({ ALLOW_DEMO_CHECKOUT: "true" });
    const body = checkoutBody("fa58b0a4-0c28-4a1b-a2c4-40fc8dc87a71");
    body.items = [{
      ...cart[0],
      productId: "pack_duo",
      quantity: 5,
      supportComposition: { comptoir: 1, plaque: 1 },
    }];

    const response = await request(app).post("/api/checkout").send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/à partir de 10 supports.*devis/i);
  });

  it("refuse toutes les anciennes références, même dans un panier conservé", async () => {
    const stripe = {
      checkout: { sessions: {
        create: vi.fn(),
        retrieve: vi.fn(),
      } },
    };
    const { app } = makeContext({}, stripe);
    const retiredProductIds = ["pack_cinq_standard", "pack_cinq", "carte_assortie"];

    for (const [index, productId] of retiredProductIds.entries()) {
      const body = checkoutBody(`fa58b0a4-0c28-4a1b-a2c4-40fc8dc87a${65 + index}`);
      body.items = [{ ...cart[0], productId }];
      const response = await request(app).post("/api/checkout").send(body);
      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/ancienne référence.*plus commandable/i);
    }
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("déduplique les événements Stripe signés", async () => {
    const event = {
      id: "evt_duplicate",
      type: "checkout.session.completed",
      livemode: false,
      created: 1_700_000_000,
      data: { object: {
        id: "cs_test_duplicate",
        payment_status: "paid",
        payment_intent: "pi_duplicate",
        amount_total: 3900,
        currency: "eur",
        metadata: { orderToken: "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a58", businessName: "Café Test" },
        customer_details: { email: "client@example.com", name: "Client Test" },
      } },
    };
    const stripe = { webhooks: { constructEvent: vi.fn(() => event) } };
    const context = makeContext({ STRIPE_WEBHOOK_SECRET: "whsec_test" }, stripe);
    context.repository.durable = true;
    await context.repository.createPendingOrder({
      orderToken: event.data.object.metadata.orderToken,
      customer: { businessName: "Café Test", email: "client@example.com", destinationUrl: "" },
      legalVersion: "2026-07-16",
      items: [{ productId: "comptoir", actionId: "avis", quantity: 1, unitAmount: 3900, customization: {} }],
    });
    await context.repository.attachStripeSession(event.data.object.metadata.orderToken, event.data.object.id);
    const first = await request(context.app).post("/api/stripe/webhook").set("stripe-signature", "signature").set("Content-Type", "application/json").send("{}");
    const second = await request(context.app).post("/api/stripe/webhook").set("stripe-signature", "signature").set("Content-Type", "application/json").send("{}");
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const jobs = await context.repository.claimOutboxJobs(10);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].payload).toMatchObject({
      status: "paid",
      destinationUrl: "",
      items: [{
        productId: "comptoir",
        actionId: "avis",
        quantity: 1,
        unitAmount: 3900,
      }],
    });
  });

  it("enregistre et signale un remboursement Stripe", async () => {
    const orderToken = "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a58";
    const event = {
      id: "evt_refund",
      type: "charge.refunded",
      livemode: false,
      created: 1_700_000_100,
      data: { object: {
        payment_intent: "pi_refund",
        amount_refunded: 3900,
        currency: "eur",
      } },
    };
    const stripe = { webhooks: { constructEvent: vi.fn(() => event) } };
    const context = makeContext({ STRIPE_WEBHOOK_SECRET: "whsec_test" }, stripe);
    context.repository.durable = true;
    await context.repository.createPendingOrder({
      orderToken,
      customer: { businessName: "Café Test", email: "client@example.com", destinationUrl: "" },
      legalVersion: "2026-07-16",
      items: [{ productId: "comptoir", actionId: "avis", quantity: 1, unitAmount: 3900, customization: {} }],
    });
    await context.repository.attachStripeSession(orderToken, "cs_test_refund", "pi_refund");
    const response = await request(context.app).post("/api/stripe/webhook").set("stripe-signature", "signature").set("Content-Type", "application/json").send("{}");
    expect(response.status).toBe(200);
    expect((await context.repository.getOrderByToken(orderToken)).status).toBe("refunded");
    const jobs = await context.repository.claimOutboxJobs(10);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].payload).toMatchObject({ status: "refunded", businessName: "Café Test" });
  });

  it("n’annonce ready en production que lorsque toutes les dépendances sont prêtes", async () => {
    const missing = makeContext({ NODE_ENV: "production", PUBLIC_URL: "https://tapote.fr" });
    expect((await request(missing.app).get("/api/ready")).status).toBe(503);

    const complete = makeContext({
      NODE_ENV: "production",
      PUBLIC_URL: "https://tapote.fr",
      STRIPE_SECRET_KEY: "sk_live_ready",
      STRIPE_WEBHOOK_SECRET: "whsec_ready",
      DATABASE_URL: "postgresql://unused",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_ready",
      RESEND_API_KEY: "re_ready",
      ORDER_NOTIFICATION_EMAIL: "commandes@example.com",
      FROM_EMAIL: "Tapote <commandes@tapote.fr>",
    }, {}, {
      repository: { durable: true, healthCheck: vi.fn(async () => true) },
      storage: { durable: true, healthCheck: vi.fn(async () => true) },
    });
    expect((await request(complete.app).get("/api/ready")).status).toBe(200);

    const defaultResendSender = makeContext({
      NODE_ENV: "production",
      PUBLIC_URL: "https://tapote.fr",
      STRIPE_SECRET_KEY: "sk_live_ready",
      STRIPE_WEBHOOK_SECRET: "whsec_ready",
      DATABASE_URL: "postgresql://unused",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_ready",
      RESEND_API_KEY: "re_ready",
      ORDER_NOTIFICATION_EMAIL: "commandes@example.com",
    }, {}, {
      repository: { durable: true, healthCheck: vi.fn(async () => true) },
      storage: { durable: true, healthCheck: vi.fn(async () => true) },
    });
    expect((await request(defaultResendSender.app).get("/api/ready")).status).toBe(503);
  });

  it("autorise explicitement un checkout sandbox sans annoncer la vente prête", async () => {
    const stripe = {
      checkout: { sessions: {
        create: vi.fn(async () => ({ id: "cs_test_sandbox", url: "https://checkout.stripe.test/sandbox" })),
        retrieve: vi.fn(),
      } },
    };
    const context = makeContext({
      NODE_ENV: "production",
      PUBLIC_URL: "https://tapote.fr",
      STRIPE_SECRET_KEY: "sk_test_sandbox",
      STRIPE_WEBHOOK_SECRET: "whsec_sandbox",
      STRIPE_SANDBOX_CHECKOUT_ENABLED: "true",
      DATABASE_URL: "postgresql://unused",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_ready",
      RESEND_API_KEY: "re_ready",
      ORDER_NOTIFICATION_EMAIL: "commandes@example.com",
      FROM_EMAIL: "Tapote <commandes@tapote.fr>",
    }, stripe, {
      repository: Object.assign(createRepository(loadConfig({ NODE_ENV: "test" })), { durable: true }),
      storage: { durable: true, healthCheck: vi.fn(async () => true) },
    });

    expect((await request(context.app).get("/api/ready")).status).toBe(503);
    const checkout = await request(context.app).post("/api/checkout").send(checkoutBody("da58b0a4-0c28-4a1b-a2c4-40fc8dc87a62"));
    expect(checkout.status).toBe(200);
    expect(checkout.body.url).toBe("https://checkout.stripe.test/sandbox");
  });

  it("vérifie la signature réelle du fichier avant stockage", async () => {
    const context = makeContext();
    const validPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=", "base64");
    context.storage.upload.mockResolvedValue({ storagePath: "orders/test/logo.png" });
    const ok = await request(context.app).post("/api/uploads/logo").attach("logo", validPng, { filename: "logo.png", contentType: "image/png" });
    expect(ok.status).toBe(201);
    expect(ok.body.uploadId).toMatch(/^[0-9a-f-]{36}$/);
    const alias = await request(context.app).post("/api/uploads/logo").attach("logo", validPng, { filename: "logo.png", contentType: "image/x-png" });
    expect(alias.status).toBe(201);
    const fake = await request(context.app).post("/api/uploads/logo").attach("logo", Buffer.from("not an image"), { filename: "logo.png", contentType: "image/png" });
    expect(fake.status).toBe(400);
  });

  it("protège le détail atelier d’une commande par la session Gestion", async () => {
    const orderId = "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a59";
    const context = makeContext({}, null, {
      repository: {
        durable: true,
        healthCheck: vi.fn(async () => true),
        getManagementOrderDetails: vi.fn(),
      },
      storage: {
        durable: true,
        healthCheck: vi.fn(async () => true),
        authenticateManagementUser: vi.fn(async () => null),
        createSignedDownload: vi.fn(),
      },
    });

    const response = await request(context.app).get(`/api/management/orders/${orderId}/details`);

    expect(response.status).toBe(401);
    expect(response.headers["cache-control"]).toContain("no-store");
    expect(context.repository.getManagementOrderDetails).not.toHaveBeenCalled();
  });

  it("retourne les lignes de fabrication et une URL de logo privée limitée à cinq minutes", async () => {
    const orderId = "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a59";
    const userId = "8f68b0a4-0c28-4a1b-a2c4-40fc8dc87a60";
    const repository = {
      durable: true,
      healthCheck: vi.fn(async () => true),
      getManagementOrderDetails: vi.fn(async () => ({
        id: orderId,
        orderNumber: "WEB-TEST",
        sourceOrderId: "9a78b0a4-0c28-4a1b-a2c4-40fc8dc87a61",
        lines: [{
          id: "aa88b0a4-0c28-4a1b-a2c4-40fc8dc87a62",
          productId: "comptoir",
          actionId: "avis",
          quantity: 2,
          unitAmount: 3900,
          customization: { brandName: "Café Test", textColor: "#ffffff", brandLogoId: "bb98b0a4-0c28-4a1b-a2c4-40fc8dc87a63" },
          logo: {
            id: "bb98b0a4-0c28-4a1b-a2c4-40fc8dc87a63",
            storagePath: "orders/2026-07-21/private-logo.png",
            originalName: "logo-client.png",
            mimeType: "image/png",
            bytes: 1200,
          },
        }],
      })),
    };
    const storage = {
      durable: true,
      healthCheck: vi.fn(async () => true),
      authenticateManagementUser: vi.fn(async () => ({ id: userId })),
      createSignedDownload: vi.fn(async () => ({ url: "https://storage.test/signed-logo", expiresIn: 300 })),
    };
    const context = makeContext({}, null, { repository, storage });

    const response = await request(context.app)
      .get(`/api/management/orders/${orderId}/details`)
      .set("Authorization", "Bearer management-token");

    expect(response.status).toBe(200);
    expect(repository.getManagementOrderDetails).toHaveBeenCalledWith(orderId, userId);
    expect(storage.createSignedDownload).toHaveBeenCalledWith("orders/2026-07-21/private-logo.png", 300);
    expect(response.body.lines[0]).toEqual(expect.objectContaining({
      actionId: "avis",
      quantity: 2,
      customization: expect.objectContaining({ textColor: "#ffffff" }),
      logo: expect.objectContaining({
        originalName: "logo-client.png",
        downloadUrl: "https://storage.test/signed-logo",
        expiresIn: 300,
      }),
    }));
    expect(JSON.stringify(response.body)).not.toContain("orders/2026-07-21/private-logo.png");
  });

  it("protège et valide l’activation Pilot d’une commande Gestion", async () => {
    const orderId = "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a59";
    const repository = { durable: true, healthCheck: vi.fn(async () => true), getManagementOrderPilotContext: vi.fn() };
    const storage = { durable: true, healthCheck: vi.fn(async () => true), authenticateManagementUser: vi.fn(async () => null), provisionPilotWorkspace: vi.fn() };
    const context = makeContext({}, null, { repository, storage });

    const unauthorized = await request(context.app)
      .post(`/api/management/orders/${orderId}/activate-pilot`)
      .send({ locationName: "Café Test", targetUrl: "" });
    expect(unauthorized.status).toBe(401);
    expect(repository.getManagementOrderPilotContext).not.toHaveBeenCalled();

    const invalid = await request(context.app)
      .post(`/api/management/orders/${orderId}/activate-pilot`)
      .send({ locationName: "Café Test", targetUrl: "http://non-securise.test" });
    expect(invalid.status).toBe(400);
    expect(storage.provisionPilotWorkspace).not.toHaveBeenCalled();
  });

  it("active Pilot depuis une commande manuelle prête et retourne le nombre de supports", async () => {
    const orderId = "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a59";
    const userId = "8f68b0a4-0c28-4a1b-a2c4-40fc8dc87a60";
    const order = {
      id: orderId,
      orderNumber: "TPT-1049",
      status: "ready",
      clientName: "Café Test",
      clientEmail: "client@example.com",
      assignedProducts: 1,
    };
    const repository = {
      durable: true,
      healthCheck: vi.fn(async () => true),
      getManagementOrderPilotContext: vi.fn(async () => order),
    };
    const storage = {
      durable: true,
      healthCheck: vi.fn(async () => true),
      authenticateManagementUser: vi.fn(async () => ({ id: userId })),
      provisionPilotWorkspace: vi.fn(async () => ({
        status: "active",
        organizationId: "9a78b0a4-0c28-4a1b-a2c4-40fc8dc87a61",
        productsCreated: 1,
      })),
    };
    const context = makeContext({}, null, { repository, storage });

    const response = await request(context.app)
      .post(`/api/management/orders/${orderId}/activate-pilot`)
      .set("Authorization", "Bearer management-token")
      .send({ locationName: "Café Test", targetUrl: "https://example.com/avis" });

    expect(response.status).toBe(200);
    expect(repository.getManagementOrderPilotContext).toHaveBeenCalledWith(orderId, userId);
    expect(storage.provisionPilotWorkspace).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: userId,
      order,
      locationName: "Café Test",
      targetUrl: "https://example.com/avis",
    }));
    expect(response.body).toEqual(expect.objectContaining({ status: "active", productsCreated: 1 }));
  });

  it("retourne un vrai 404 JSON pour toute route API inconnue", async () => {
    const { app } = makeContext({ NODE_ENV: "production", PUBLIC_URL: "https://tapote.fr" });
    const response = await request(app).get("/api/inconnue");
    expect(response.status).toBe(404);
    expect(response.type).toMatch(/json/);
  });

  it("redirige un produit Pilot actif et journalise la source sans IP brute", async () => {
    const context = makeContext();
    context.repository.pilotLinks.set("d3e0caf001", {
      id: "b7534667-8c72-443e-a947-d42923f2791d",
      targetUrl: "https://example.com/menu",
      active: true,
    });

    const response = await request(context.app)
      .get("/a/d3e0caf001?s=nfc")
      .set("User-Agent", "Mozilla/5.0 (iPhone; Mobile)")
      .redirects(0);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("https://example.com/menu");
    expect(response.headers["cache-control"]).toContain("no-store");
    await new Promise((resolve) => setImmediate(resolve));
    expect(context.repository.tapEvents).toEqual([expect.objectContaining({
      tapoteLinkId: "b7534667-8c72-443e-a947-d42923f2791d",
      source: "nfc",
      deviceFamily: "mobile",
    })]);
    expect(context.repository.tapEvents[0]).not.toHaveProperty("ip");
  });

  it("rend une erreur lisible pour un produit Pilot absent ou en pause", async () => {
    const context = makeContext();
    context.repository.pilotLinks.set("d3e0caf002", {
      id: "fef67d40-143c-4fc6-b96b-4297538ee38d",
      targetUrl: "https://example.com/avis",
      active: false,
    });

    const missing = await request(context.app).get("/a/d3e0caf003");
    const paused = await request(context.app).get("/a/d3e0caf002");
    expect(missing.status).toBe(404);
    expect(missing.text).toContain("Lien introuvable");
    expect(paused.status).toBe(410);
    expect(paused.text).toContain("Lien en pause");
  });

  const jarvisToken = "z".repeat(40);

  it("masque le pont Jarvis quand aucun jeton n'est configuré", async () => {
    const context = makeContext();
    const response = await request(context.app)
      .get("/api/jarvis/summary?scopes=commercial")
      .set("Authorization", `Bearer ${jarvisToken}`);
    expect(response.status).toBe(404);
    expect(response.headers["cache-control"]).toContain("no-store");
    expect(response.headers["x-robots-tag"]).toContain("noindex");
  });

  it("refuse la lecture Jarvis sans jeton valide", async () => {
    const context = makeContext({ JARVIS_READ_TOKEN: jarvisToken });
    const missing = await request(context.app).get("/api/jarvis/summary?scopes=commercial");
    const wrong = await request(context.app)
      .get("/api/jarvis/summary?scopes=commercial")
      .set("Authorization", `Bearer ${"a".repeat(40)}`);
    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
  });

  it("rejette un périmètre de lecture Jarvis invalide", async () => {
    const context = makeContext({ JARVIS_READ_TOKEN: jarvisToken });
    const empty = await request(context.app)
      .get("/api/jarvis/summary")
      .set("Authorization", `Bearer ${jarvisToken}`);
    const bad = await request(context.app)
      .get("/api/jarvis/summary?scopes=inconnu")
      .set("Authorization", `Bearer ${jarvisToken}`);
    expect(empty.status).toBe(400);
    expect(bad.status).toBe(400);
  });

  it("signale un pont indisponible quand le dépôt n'est pas durable", async () => {
    const context = makeContext({ JARVIS_READ_TOKEN: jarvisToken });
    const response = await request(context.app)
      .get("/api/jarvis/summary?scopes=commercial")
      .set("Authorization", `Bearer ${jarvisToken}`);
    expect(response.status).toBe(503);
  });

  it("renvoie le résumé Jarvis agrégé avec les diagnostics de production", async () => {
    const repository = {
      durable: true,
      getJarvisReadSummary: vi.fn(async (scopes) => ({
        management: scopes.includes("commercial")
          ? [{ status: "in_production", paymentStatus: "paid", orderCount: 3, totalCents: 12000, nextDueOn: "2026-09-01" }]
          : [],
        inventory: [],
        clients: [],
        pilot: [],
      })),
    };
    const context = makeContext({ JARVIS_READ_TOKEN: jarvisToken }, null, { repository });
    const response = await request(context.app)
      .get("/api/jarvis/summary?scopes=commercial,commercial")
      .set("Authorization", `Bearer ${jarvisToken}`);
    expect(response.status).toBe(200);
    expect(repository.getJarvisReadSummary).toHaveBeenCalledWith(["commercial"]);
    expect(response.body.management).toHaveLength(1);
    expect(response.body.diagnostics.readiness).toMatchObject({
      ready: expect.any(Boolean),
      missingChecks: expect.any(Array),
    });
  });
});
