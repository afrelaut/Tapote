// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  advanceManagementEncodedProduct: vi.fn(),
  createManagementEncodedProduct: vi.fn(),
  createManagementClient: vi.fn(),
  createManagementInventoryItem: vi.fn(),
  createManagementOrder: vi.fn(),
  getManagementAccess: vi.fn(),
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
    { recordId: "row-ready", id: "TPT-1050", clientId: "client-1", product: "Comptoir A6", quantity: 1, total: 59, status: "ready", payment: "Payé", channel: "Boutique", created: "16 juil", orderedOn: "2026-07-16", due: "17 juil", dueDate: "2026-07-17", priority: "Haute", owner: "Aymeric", destination: "Avis Google", tracking: "", note: "Prête." },
    { recordId: "row-shipped", id: "TPT-1049", clientId: "client-1", product: "Carte NFC", quantity: 2, total: 58, status: "shipped", payment: "Payé", channel: "Boutique", created: "15 juil", orderedOn: "2026-07-15", due: "16 juil", dueDate: "2026-07-16", priority: "Normale", owner: "Aymeric", destination: "Fidélité", tracking: "6A000000", note: "Expédiée." },
    { recordId: "row-cancelled", id: "TPT-1048", clientId: "client-1", product: "Sticker NFC", quantity: 1, total: 35, status: "cancelled", payment: "En attente", channel: "Boutique", created: "14 juil", orderedOn: "2026-07-14", due: "15 juil", dueDate: "2026-07-15", priority: "Normale", owner: "Aymeric", destination: "Instagram", tracking: "", note: "Annulée." },
  ],
  inventory: [{ id: "stock-1", sku: "SUP-A6", name: "Chevalet A6", category: "Support", stock: 12, reserved: 2, threshold: 5, incoming: 0, eta: "—" }],
  storefront: [{ id: "product-1", name: "Le Comptoir A6", price: 59, online: true, stockId: "stock-1", sales: 4, conversionRate: 3.2, conversion: "3,2 %" }],
  activity: [],
  encodedProducts: [{ id: "unit-1", orderId: "row-ready", clientId: "client-1", serialNumber: "TAP-6A2F91B8C440", supportType: "Comptoir A6", chipType: "NTAG213 · 38 mm", chipBatch: "N213-2607-A", label: "Café Noma · Avis", status: "encoded", shortCode: "4a8d22be71", targetUrl: "https://example.com/avis", iphoneTest: false, androidTest: false, qrTest: false, createdAt: "2026-07-16T09:30:00Z" }],
  settings: { orderPrefix: "TPT", currency: "EUR", timezone: "Europe/Paris", lowStockNotifications: true, shippingCutoff: "16:00" },
};

beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
  repository.getManagementSession.mockResolvedValue({ user: { id: "user-1", email: "marketmenow75@gmail.com" } });
  repository.getManagementAccess.mockResolvedValue({ organizationId: "org-1", organizationName: "TAPOTE Gestion", role: "owner", displayName: "Aymeric", jobTitle: "Propriétaire & administrateur", email: "marketmenow75@gmail.com" });
  repository.loadManagementData.mockResolvedValue(workspace);
  repository.onManagementAuthChange.mockReturnValue(() => {});
  repository.subscribeToManagement.mockReturnValue(() => {});
  repository.updateManagementOrderStatus.mockImplementation(async (_organizationId, order, status, tracking) => ({ ...order, status, tracking }));
  repository.advanceManagementEncodedProduct.mockResolvedValue({});
  repository.createManagementEncodedProduct.mockResolvedValue({});
});

afterEach(() => cleanup());

describe("TAPOTE Gestion", () => {
  it("affiche uniquement des indicateurs calculés depuis les données réelles", async () => {
    render(<TapoteManagementApp />);

    expect(await screen.findByRole("heading", { name: "Vue d’ensemble" })).toBeInTheDocument();
    expect(screen.getByText("117 €")).toBeInTheDocument();
    expect(screen.getByText("2 commandes payées")).toBeInTheDocument();
    expect(screen.queryByText("Aucune urgence ouverte")).not.toBeInTheDocument();
    expect(screen.queryByText("1 127 €")).not.toBeInTheDocument();
    expect(screen.queryByText("+18,2 %")).not.toBeInTheDocument();
  });

  it("exclut les commandes annulées de la file active sans planter", async () => {
    render(<TapoteManagementApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });

    fireEvent.click(screen.getByRole("button", { name: /Commandes/ }));
    expect(screen.getByText("TPT-1050")).toBeInTheDocument();
    expect(screen.queryByText("TPT-1048")).not.toBeInTheDocument();
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
});
