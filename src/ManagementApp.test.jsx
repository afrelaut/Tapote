// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  advanceManagementEncodedProduct: vi.fn(),
  activateManagementOrderPilot: vi.fn(),
  assignManagementEncodedProduct: vi.fn(),
  createManagementEncodedProduct: vi.fn(),
  createManagementClient: vi.fn(),
  createManagementInventoryItem: vi.fn(),
  createManagementOrder: vi.fn(),
  getManagementAccess: vi.fn(),
  getManagementOrderDetails: vi.fn(),
  getManagementSession: vi.fn(),
  loadManagementData: vi.fn(),
  onManagementAuthChange: vi.fn(),
  receiveManagementStock: vi.fn(),
  setStorefrontProductOnline: vi.fn(),
  signOutManager: vi.fn(),
  subscribeToManagement: vi.fn(),
  updateManagementOrderStatus: vi.fn(),
}));

vi.mock("./management/supabase.js", () => ({ isManagementConfigured: true }));
vi.mock("./management/repository.js", () => repository);

import TapoteManagementApp from "./ManagementApp.jsx";

const workspace = {
  clients: [{ id: "client-1", name: "Café Noma", contact: "Léa", email: "lea@example.com", phone: "0600000000", city: "Lyon", segment: "Café", orders: 3, revenue: 406, joined: "04 juin", health: "Actif" }],
  orders: [
    { recordId: "row-ready", id: "TPT-1050", clientId: "client-1", product: "Chevalet A6 personnalisé", quantity: 1, total: 39, status: "ready", payment: "Payé", channel: "Boutique", created: "16 juil", orderedOn: "2026-07-16", due: "17 juil", dueDate: "2026-07-17", priority: "Haute", owner: "Aymeric", destination: "Avis Google", tracking: "", note: "Prête.", sourceOrderId: "storefront-order-1" },
    { recordId: "row-shipped", id: "TPT-1049", clientId: "client-1", product: "Carte personnalisée", quantity: 2, total: 58, status: "shipped", payment: "Payé", channel: "Boutique", created: "15 juil", orderedOn: "2026-07-15", due: "16 juil", dueDate: "2026-07-16", priority: "Normale", owner: "Aymeric", destination: "Fidélité", tracking: "6A000000", note: "Expédiée." },
    { recordId: "row-cancelled", id: "TPT-1048", clientId: "client-1", product: "Plaque prête à l’emploi", quantity: 1, total: 29, status: "cancelled", payment: "En attente", channel: "Boutique", created: "14 juil", orderedOn: "2026-07-14", due: "15 juil", dueDate: "2026-07-15", priority: "Normale", owner: "Aymeric", destination: "Instagram", tracking: "", note: "Annulée." },
  ],
  inventory: [{ id: "stock-1", sku: "SUP-A6", name: "Chevalet A6", category: "Support", stock: 12, reserved: 2, threshold: 5, incoming: 0, eta: "—" }],
  storefront: [{ id: "product-1", name: "Le Chevalet A6", price: 39, online: true, stockId: "stock-1", sales: 4, conversionRate: 3.2, conversion: "3,2 %" }],
  activity: [],
  encodedProducts: [
    { id: "unit-1", orderId: "row-ready", clientId: "client-1", serialNumber: "TAP-6A2F91B8C440", supportType: "Chevalet A6", chipType: "NTAG213 · 38 mm", chipBatch: "N213-2607-A", label: "Café Noma · Avis", status: "encoded", shortCode: "4a8d22be71", targetUrl: "https://example.com/avis", iphoneTest: false, androidTest: false, qrTest: false, createdAt: "2026-07-16T09:30:00Z" },
    { id: "unit-2", orderId: "row-ready", clientId: "client-1", serialNumber: "TAP-8D10C39A4421", supportType: "Chevalet A6", chipType: "NTAG213 · 38 mm", chipBatch: "N213-2607-A", label: "Café Noma · Réservation", status: "draft", shortCode: "9b7c31da20", targetUrl: "https://example.com/reservation", iphoneTest: false, androidTest: false, qrTest: false, createdAt: "2026-07-16T10:00:00Z" },
  ],
  settings: { orderPrefix: "TPT", currency: "EUR", timezone: "Europe/Paris", lowStockNotifications: true, shippingCutoff: "16:00" },
};

let authChangeCallback;
let realtimeCallback;

beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
  repository.getManagementSession.mockResolvedValue({ user: { id: "user-1", email: "marketmenow75@gmail.com" } });
  repository.getManagementAccess.mockResolvedValue({ organizationId: "org-1", organizationName: "TAPOTE Gestion", role: "owner", displayName: "Aymeric", jobTitle: "Propriétaire & administrateur", email: "marketmenow75@gmail.com" });
  repository.loadManagementData.mockResolvedValue(workspace);
  repository.onManagementAuthChange.mockImplementation((callback) => {
    authChangeCallback = callback;
    return () => {};
  });
  repository.subscribeToManagement.mockImplementation((_organizationId, callback) => {
    realtimeCallback = callback;
    return () => {};
  });
  repository.updateManagementOrderStatus.mockImplementation(async (_organizationId, order, status, tracking) => ({ ...order, status, tracking }));
  repository.advanceManagementEncodedProduct.mockResolvedValue({});
  repository.createManagementEncodedProduct.mockResolvedValue({});
  repository.getManagementOrderDetails.mockResolvedValue({
    id: "row-ready",
    orderNumber: "TPT-1050",
    lines: [{
      id: "line-1",
      productId: "comptoir",
      actionId: "avis",
      quantity: 2,
      unitAmount: 3900,
      customization: {
        brandName: "Café Noma",
        primaryColor: "#161310",
        secondaryColor: "#2946F5",
        textColor: "#FFFFFF",
        customHeadline: "Votre avis compte.",
        supportComposition: { comptoir: 2, plaque: 0 },
        brandLogoId: "logo-1",
        logoFileName: "logo-cafe-noma.png",
      },
      logo: { id: "logo-1", originalName: "logo-cafe-noma.png", downloadUrl: "https://storage.test/signed", expiresIn: 300 },
    }],
  });
});

afterEach(() => {
  cleanup();
  delete window.NDEFReader;
});

describe("TAPOTE Gestion", () => {
  it("propose une navigation mobile opérationnelle vers les tâches prioritaires", async () => {
    render(<TapoteManagementApp />);

    await screen.findByRole("heading", { name: "Vue d’ensemble" });
    const mobileNav = screen.getByRole("navigation", { name: "Navigation mobile Gestion" });
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav.querySelectorAll("button")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Navigation mobile Gestion : commandes" }));
    expect(screen.getByRole("heading", { name: "Commandes" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Plus de rubriques — navigation mobile Gestion" }));
    expect(document.querySelector(".pilot-sidebar")).toHaveClass("is-open");
  });

  it("propose l'accès unidirectionnel vers Pilot", async () => {
    render(<TapoteManagementApp />);

    await screen.findByRole("heading", { name: "Vue d’ensemble" });
    expect(screen.getByRole("link", { name: /Accéder à Pilot/ })).toHaveAttribute("href", "/pilot");
    expect(screen.queryByText("TAPOTE Gestion", { selector: "main *" })).not.toBeInTheDocument();
  });

  it("refuse un compte Pilot dépourvu de profil Gestion explicite", async () => {
    repository.getManagementAccess.mockResolvedValue(null);

    render(<TapoteManagementApp />);

    expect(await screen.findByText("Ce compte n’est pas autorisé à accéder à TAPOTE Gestion.")).toBeInTheDocument();
    expect(repository.loadManagementData).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Vue d’ensemble" })).not.toBeInTheDocument();
  });

  it("affiche uniquement des indicateurs calculés depuis les données réelles", async () => {
    render(<TapoteManagementApp />);

    expect(await screen.findByRole("heading", { name: "Vue d’ensemble" })).toBeInTheDocument();
    // Le montant apparaît sur plusieurs cartes du tableau de bord ; ce test
    // vérifie qu'il est calculé, pas qu'il n'est affiché qu'une fois.
    expect(screen.getAllByText("97 €").length).toBeGreaterThan(0);
    expect(screen.getByText("2 commandes payées")).toBeInTheDocument();
    expect(screen.queryByText("Aucune urgence ouverte")).not.toBeInTheDocument();
    expect(screen.queryByText("1 127 €")).not.toBeInTheDocument();
    expect(screen.queryByText("+18,2 %")).not.toBeInTheDocument();
    expect(screen.queryByText(/Vitrine/i)).not.toBeInTheDocument();
  });

  it("exclut les commandes annulées de la file active sans planter", async () => {
    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });

    fireEvent.click(screen.getByRole("button", { name: /Commandes/ }));
    expect(screen.getByText("TPT-1050")).toBeInTheDocument();
    expect(screen.queryByText("TPT-1048")).not.toBeInTheDocument();
  });

  it("bloque une vente manuelle avant confirmation explicite du paiement", async () => {
    const pendingOrder = {
      ...workspace.orders[0],
      recordId: "row-pending",
      id: "TPT-1051",
      status: "payment_pending",
      payment: "En attente",
      sourceOrderId: null,
    };
    repository.loadManagementData.mockResolvedValue({ ...workspace, orders: [pendingOrder] });

    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });
    fireEvent.click(screen.getByRole("button", { name: /Commandes/ }));
    expect(screen.getByText("Paiement à confirmer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir TPT-1051" }));
    fireEvent.click(screen.getByRole("button", { name: /Confirmer le paiement/ }));

    await waitFor(() => expect(repository.updateManagementOrderStatus).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ id: "TPT-1051", payment: "En attente" }),
      "paid",
      "",
    ));
  });

  it("expose toutes les informations de fabrication et le logo privé signé", async () => {
    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });

    fireEvent.click(screen.getByRole("button", { name: /Commandes/ }));
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir TPT-1050" }));

    expect(await screen.findByText("FABRICATION & PERSONNALISATION")).toBeInTheDocument();
    expect(await screen.findByText("Café Noma", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("2 chevalets")).toBeInTheDocument();
    expect(screen.getByText("#FFFFFF")).toBeInTheDocument();
    expect(screen.getByText("Votre avis compte.")).toBeInTheDocument();
    expect(screen.getByText("ID logo-1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ouvrir le logo/ })).toHaveAttribute("href", "https://storage.test/signed");
    expect(repository.getManagementOrderDetails).toHaveBeenCalledWith("row-ready");
  });

  it("demande un vrai suivi avant de marquer un colis expédié", async () => {
    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });

    fireEvent.click(screen.getByRole("button", { name: /Expéditions/ }));
    fireEvent.click(screen.getByRole("button", { name: "Expédier" }));
    expect(screen.getByRole("heading", { name: "Confirmer la remise transporteur" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Numéro de suivi réel"), { target: { value: "6A12345678901" } });
    fireEvent.click(screen.getByRole("button", { name: "Marquer expédiée" }));

    await waitFor(() => expect(repository.updateManagementOrderStatus).toHaveBeenCalledWith("org-1", expect.objectContaining({ id: "TPT-1050" }), "shipped", "6A12345678901"));
  });

  it("ouvre un panneau de réglages utile avec le rôle owner", async () => {
    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });

    fireEvent.click(screen.getByRole("button", { name: /Réglages/ }));
    expect(screen.getByRole("heading", { name: "Réglages & connexions" })).toBeInTheDocument();
    expect(screen.getByText("Owner · administration complète")).toBeInTheDocument();
    expect(screen.getByText("marketmenow75@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Supabase & Realtime connectés")).toBeInTheDocument();
  });

  it("ne réinitialise pas la vue lors du rafraîchissement de la session Supabase", async () => {
    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });
    fireEvent.click(screen.getByRole("button", { name: /Commandes/ }));
    expect(screen.getByRole("heading", { name: "Commandes" })).toBeInTheDocument();

    act(() => {
      authChangeCallback({
        access_token: "jeton-renouvele",
        user: { id: "user-1", email: "marketmenow75@gmail.com" },
      }, "TOKEN_REFRESHED");
    });

    expect(screen.getByRole("heading", { name: "Commandes" })).toBeInTheDocument();
    expect(screen.queryByText("Vérification du compte et synchronisation Supabase…")).not.toBeInTheDocument();
    expect(repository.loadManagementData).toHaveBeenCalledTimes(1);
  });

  it("ignore une ancienne synchronisation Realtime terminée après la plus récente", async () => {
    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });
    fireEvent.click(screen.getByRole("button", { name: /Clients/ }));

    let resolveOlderLoad;
    let resolveLatestLoad;
    repository.loadManagementData
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOlderLoad = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveLatestLoad = resolve; }));

    act(() => realtimeCallback());
    await waitFor(() => expect(repository.loadManagementData).toHaveBeenCalledTimes(2));
    act(() => realtimeCallback());
    await waitFor(() => expect(repository.loadManagementData).toHaveBeenCalledTimes(3));

    await act(async () => {
      resolveLatestLoad({ ...workspace, clients: [{ ...workspace.clients[0], name: "Client récent" }] });
    });
    expect((await screen.findAllByText("Client récent")).length).toBeGreaterThan(0);

    await act(async () => {
      resolveOlderLoad({ ...workspace, clients: [{ ...workspace.clients[0], name: "Client obsolète" }] });
    });
    expect(screen.getAllByText("Client récent").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Client obsolète")).toHaveLength(0);
  });

  it("centralise la création et le contrôle des produits NFC", async () => {
    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });

    fireEvent.click(screen.getByRole("button", { name: /Création & encodage/ }));
    expect(screen.getByRole("heading", { name: "Création & encodage" })).toBeInTheDocument();
    expect(screen.getByText("TAP-6A2F91B8C440")).toBeInTheDocument();
    expect(screen.getByText("t.tapote.fr/a/4a8d22be71")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tester NFC + QR" }));
    expect(screen.getByRole("heading", { name: "Tester NFC + QR" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Valider les trois tests" })).toBeDisabled();
  });

  it("écrit l’URL courte avec Web NFC puis confirme l’encodage dans Supabase", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    window.NDEFReader = class NDEFReader {
      write(...args) { return write(...args); }
    };

    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });
    fireEvent.click(screen.getByRole("button", { name: /Création & encodage/ }));
    fireEvent.click(screen.getByRole("button", { name: "Encoder sur Android" }));

    expect(screen.getByRole("heading", { name: "Encoder depuis Android" })).toBeInTheDocument();
    expect(screen.getByText("https://t.tapote.fr/a/9b7c31da20")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Écrire l’URL dans la puce" }));

    await waitFor(() => expect(write).toHaveBeenCalledWith(
      { records: [{ recordType: "url", data: "https://t.tapote.fr/a/9b7c31da20" }] },
      { overwrite: true },
    ));
    await waitFor(() => expect(repository.advanceManagementEncodedProduct).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ id: "unit-2", status: "draft" }),
      "encoded",
      {},
    ));
  });
});
