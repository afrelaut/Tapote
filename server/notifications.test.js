import { afterEach, describe, expect, it, vi } from "vitest";
import { createOutboxWorker, renderJob } from "./notifications.js";

const paidJob = {
  id: "job-1",
  kind: "order_notification",
  dedupeKey: "stripe:evt_paid",
  payload: {
    status: "paid",
    orderToken: "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a58",
    businessName: "Café Test",
    customerName: "Camille Martin",
    customerEmail: "client@example.com",
    amountTotal: 8290,
    currency: "eur",
    destinationUrl: "https://example.com/avis",
    items: [{
      productId: "comptoir",
      actionId: "avis",
      quantity: 2,
      unitAmount: 3900,
      customization: {
        brandName: "Café Test",
        primaryColor: "#123456",
        secondaryColor: "#abcdef",
        textColor: "#ffffff",
        targetId: "cafe",
        designStyle: "signature",
        customHeadline: "Votre avis nous aide.",
        customSubline: "Merci pour votre confiance.",
        customTapLabel: "Donnez votre avis",
        destinationUrl: "https://example.com/avis-comptoir",
        brandLogoId: "3cc6307e-8790-4e73-a8bd-707665c9379e",
        logoFileName: "logo-cafe.png",
      },
    }],
  },
};

const config = {
  resendApiKey: "re_test",
  orderNotificationEmail: "atelier@tapote.fr",
  customerSupportEmail: "bonjour@tapote.fr",
  fromEmail: "Tapote <commandes@tapote.fr>",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("notifications transactionnelles", () => {
  it("prépare un dossier atelier complet et une confirmation client après paiement", () => {
    const messages = renderJob(paidJob, config);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ channel: "atelier", to: "atelier@tapote.fr" });
    expect(messages[0].subject).toContain("Café Test");
    expect(messages[0].html).toContain("7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a58");
    expect(messages[0].html).toContain("Le Chevalet A6");
    expect(messages[0].html).toContain("#123456");
    expect(messages[0].html).toContain("Votre avis nous aide.");
    expect(messages[0].html).toContain("Merci pour votre confiance.");
    expect(messages[0].html).toContain("Donnez votre avis");
    expect(messages[0].html).toContain("3cc6307e-8790-4e73-a8bd-707665c9379e");
    expect(messages[0].html).toContain("https://example.com/avis-comptoir");

    expect(messages[1]).toMatchObject({ channel: "client", to: "client@example.com" });
    expect(messages[1].subject).toContain("Commande Tapote confirmée");
    expect(messages[1].html).toContain("Création enregistrée");
    expect(messages[1].html).toContain("la préparation commence après votre paiement");
    expect(messages[1].html).toContain("bonjour@tapote.fr");
  });

  it("n’envoie pas de confirmation client pour un paiement échoué", () => {
    const messages = renderJob({
      ...paidJob,
      payload: { ...paidJob.payload, status: "payment_failed" },
    }, config);

    expect(messages).toHaveLength(1);
    expect(messages[0].channel).toBe("atelier");
  });

  it("annonce le délai standard lorsqu’aucun produit n’est personnalisé", () => {
    const messages = renderJob({
      ...paidJob,
      payload: {
        ...paidJob.payload,
        items: [{
          productId: "carte_standard",
          actionId: "contact",
          quantity: 1,
          unitAmount: 1900,
          customization: {},
        }],
      },
    }, config);

    expect(messages[1].html).not.toContain("Création enregistrée");
    expect(messages[1].html).toContain("le délai exact vous sera confirmé");
  });

  it("laisse les tâches en attente si le fournisseur n’est pas configuré", async () => {
    const repository = {
      claimOutboxJobs: vi.fn(),
      markOutboxDone: vi.fn(),
      markOutboxFailed: vi.fn(),
    };
    const logger = { warn: vi.fn(), error: vi.fn() };
    const worker = createOutboxWorker({
      config: { ...config, resendApiKey: "" },
      repository,
      logger,
    });

    await worker.runOnce();

    expect(repository.claimOutboxJobs).not.toHaveBeenCalled();
    expect(repository.markOutboxDone).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("envoie réellement les deux destinataires avant de marquer la tâche comme terminée", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const repository = {
      claimOutboxJobs: vi.fn(async () => [paidJob]),
      markOutboxDone: vi.fn(async () => undefined),
      markOutboxFailed: vi.fn(async () => undefined),
    };
    const logger = { warn: vi.fn(), error: vi.fn() };
    const worker = createOutboxWorker({ config, repository, logger });

    await worker.runOnce();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const requests = fetchMock.mock.calls.map(([, options]) => ({
      body: JSON.parse(options.body),
      idempotencyKey: options.headers["Idempotency-Key"],
    }));
    expect(requests.map((entry) => entry.body.to[0])).toEqual(["atelier@tapote.fr", "client@example.com"]);
    expect(requests.map((entry) => entry.idempotencyKey)).toEqual([
      "stripe:evt_paid:atelier",
      "stripe:evt_paid:client",
    ]);
    expect(repository.markOutboxDone).toHaveBeenCalledWith("job-1");
    expect(repository.markOutboxFailed).not.toHaveBeenCalled();
  });
});
