// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const accessMocks = vi.hoisted(() => ({
  getManagementAccess: vi.fn(),
  getManagementSession: vi.fn(),
  getPilotSession: vi.fn(),
}));

vi.mock("../pilot/supabase.js", () => ({
  getPilotSession: accessMocks.getPilotSession,
  isPilotConfigured: true,
}));

vi.mock("../management/supabase.js", () => ({ isManagementConfigured: true }));
vi.mock("../management/repository.js", () => ({
  getManagementAccess: accessMocks.getManagementAccess,
  getManagementSession: accessMocks.getManagementSession,
}));

import AccessApp from "./AccessApp.jsx";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.body.className = "";
});

describe("Espace Tapote", () => {
  it("présente toujours Pilot et Gestion sans accorder de droit", async () => {
    accessMocks.getPilotSession.mockResolvedValue(null);
    accessMocks.getManagementSession.mockResolvedValue(null);

    render(<AccessApp />);

    expect(screen.getByRole("link", { name: /Tapote Pilot/ })).toHaveAttribute("href", "/pilot");
    expect(screen.getByRole("link", { name: /Tapote Gestion/ })).toHaveAttribute("href", "https://gestion.tapote.fr/gestion");
    await waitFor(() => expect(screen.getByText("Connexion par e-mail ou lien sécurisé")).toBeInTheDocument());
    expect(screen.getByText("Accès interne sur invitation")).toBeInTheDocument();
  });

  it("reconnaît une session Gestion seulement avec un profil interne valide", async () => {
    accessMocks.getPilotSession.mockResolvedValue({ user: { email: "client@example.com" } });
    accessMocks.getManagementSession.mockResolvedValue({ user: { id: "manager-1" } });
    accessMocks.getManagementAccess.mockResolvedValue({ displayName: "Rico" });

    render(<AccessApp />);

    expect(await screen.findByText("Session active · client@example.com")).toBeInTheDocument();
    expect(screen.getByText("Session active · Rico")).toBeInTheDocument();
    expect(screen.getByText("Continuer vers Gestion")).toBeInTheDocument();
  });
});
