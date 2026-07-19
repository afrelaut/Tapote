import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
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
  VITE_LEGAL_DIRECTOR: "Direction Test",
  VITE_LEGAL_CONTACT: "test@example.com",
  VITE_LEGAL_HOST: "Hébergeur Test",
  VITE_LEGAL_MEDIATOR: "Médiateur Test",
  VITE_LEGAL_PRIVACY_CONTACT: "privacy@example.com",
  VITE_LEGAL_RETURNS_ADDRESS: "1 rue du Test",
  VITE_LEGAL_VERSION: "2026-07-16",
};

const cart = [{
  productId: "comptoir",
  actionId: "avis",
  quantity: 1,
  brandName: "Café Test",
  theme: "blue",
  targetId: "cafe",
  designStyle: "signature",
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

function makeContext(env = {}, stripe = null, overrides = {}) {
  const config = loadConfig({ NODE_ENV: "test", PUBLIC_URL: "http://localhost:5173", ...legalEnv, ...env });
  const repository = overrides.repository || createRepository(config);
  const storage = overrides.storage || { durable: false, healthCheck: vi.fn(async () => true), upload: vi.fn() };
  const logger = createLogger({ ...config, logLevel: "silent" });
  const outboxWorker = overrides.outboxWorker || { runOnce: vi.fn(async () => undefined) };
  const app = createApp({ config, repository, storage, logger, outboxWorker, stripe });
  return { app, config, repository, storage, outboxWorker };
}

afterEach(() => vi.restoreAllMocks());

describe("API Tapote", () => {
  it("ne crée jamais de commande démo en production", async () => {
    const { app } = makeContext({ NODE_ENV: "production", PUBLIC_URL: "https://tapote.fr", ALLOW_DEMO_CHECKOUT: "true" });
    const response = await request(app).post("/api/checkout").send(checkoutBody());
    expect(response.status).toBe(503);
    expect(response.body.demo).toBeUndefined();
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
    const sessionId = new URL(checkout.body.url).searchParams.get("session_id");
    const status = await request(app).get(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
    expect(status.body).toEqual({ status: "demo" });
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
    expect(checkout.success_url).toBe("http://localhost:5173/?commande=confirmee&session_id={CHECKOUT_SESSION_ID}");
    expect(checkout.cancel_url).toBe("http://localhost:5173/?commande=annulee");
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

  it("facture la livraison sous 59 € et la recalcule côté serveur", async () => {
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
    expect(checkout.line_items[0].price_data.unit_amount).toBe(2990);
    expect(checkout.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(490);
  });

  it("facture le Comptoir A6 à 49 € et conserve la livraison sous 59 €", async () => {
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
    expect(checkout.line_items[0].price_data.unit_amount).toBe(4900);
    expect(checkout.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(490);
    expect(checkout.tax_id_collection).toEqual({ enabled: true });
    expect(checkout.invoice_creation).toMatchObject({
      enabled: true,
      invoice_data: { metadata: { customerType: "business" } },
    });
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
        amount_total: 5900,
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
      items: [{ productId: "comptoir", actionId: "avis", quantity: 1, unitAmount: 5900, customization: {} }],
    });
    await context.repository.attachStripeSession(event.data.object.metadata.orderToken, event.data.object.id);
    const first = await request(context.app).post("/api/stripe/webhook").set("stripe-signature", "signature").set("Content-Type", "application/json").send("{}");
    const second = await request(context.app).post("/api/stripe/webhook").set("stripe-signature", "signature").set("Content-Type", "application/json").send("{}");
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const jobs = await context.repository.claimOutboxJobs(10);
    expect(jobs).toHaveLength(1);
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
        amount_refunded: 5900,
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
      items: [{ productId: "comptoir", actionId: "avis", quantity: 1, unitAmount: 5900, customization: {} }],
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
    }, {}, {
      repository: { durable: true, healthCheck: vi.fn(async () => true) },
      storage: { durable: true, healthCheck: vi.fn(async () => true) },
    });
    expect((await request(complete.app).get("/api/ready")).status).toBe(200);
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
});
