// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StorefrontV3 from "./StorefrontV3.jsx";

function renderRoute(path) {
  window.history.pushState({}, "", path);
  return render(<StorefrontV3 />);
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Boutique Tapote V3", () => {
  it("propose une galerie complète de designs par action", () => {
    renderRoute("/designs");

    expect(screen.getByRole("heading", { name: /Le bon design/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /La suite sur Instagram/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Retrouvez-nous ici/i })).toBeVisible();
    expect(screen.getAllByText(/Partir de ce design/i)).toHaveLength(18);
  });

  it("couvre quinze familles de secteurs avec une offre recommandée mais non imposée", () => {
    renderRoute("/secteurs");

    expect(screen.getByText(/15 SECTEURS/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Restaurants, traiteurs & food trucks" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Hébergements & tourisme" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Auto-écoles" })).toBeVisible();

    cleanup();
    renderRoute("/secteurs/auto-ecoles");
    expect(screen.getByText(/Pack 2 recommandé · achat à l’unité toujours possible/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /1 support/i })).toBeVisible();
    expect(screen.getByLabelText("Le lien à ouvrir")).toHaveValue("reservation");
  });

  it("présente immédiatement l’offre courte et les prix prêts à l’emploi", () => {
    renderRoute("/boutique");

    expect(screen.getByRole("heading", { name: /Trois formats/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Chevalet" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Plaque" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Carte" })).toBeVisible();
    expect(screen.getAllByText("29 €").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("19 €")).toBeVisible();
  });

  it("ajoute la version prête à l’emploi de la fiche produit au panier par défaut", () => {
    renderRoute("/produits/chevalet");

    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));

    expect(screen.getByText("Ajouté au panier")).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ productId: "comptoir_standard", actionId: "avis", quantity: 1 }),
    ]);
  });

  it("explique que le changement de lien reste gratuit sans Pilot", () => {
    renderRoute("/comment-ca-marche");

    expect(screen.getByRole("heading", { name: /Vous ne touchez pas au support/i })).toBeVisible();
    expect(screen.getByText("Modifications illimitées")).toBeVisible();
    expect(screen.getByText("Gratuites, sans Pilot")).toBeVisible();
  });

  it("envoie la demande de devis volume vers l’API existante", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    vi.stubGlobal("fetch", fetchSpy);
    renderRoute("/devis");

    fireEvent.change(screen.getByLabelText("Votre nom *"), { target: { value: "Rico Test" } });
    fireEvent.change(screen.getByLabelText("E-mail professionnel *"), { target: { value: "rico@example.com" } });
    fireEvent.change(screen.getByLabelText("Besoin, lieux et volumes *"), { target: { value: "12 supports pour trois établissements" } });
    fireEvent.click(screen.getByLabelText(/J’accepte que Tapote/i));
    fireEvent.click(screen.getByRole("button", { name: /Recevoir une proposition/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/lead", expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText(/Demande reçue/i)).toBeVisible();
  });

  it("remplace le paiement par un devis à partir de 10 supports", () => {
    window.localStorage.setItem("tapote-cart-v3", JSON.stringify([{
      productId: "pack_cinq",
      actionId: "avis",
      quantity: 2,
      brandName: "GROUPE TEST",
      theme: "blue",
      targetId: "cafe",
      designStyle: "signature",
      customHeadline: "",
      destinationUrl: "",
      brandLogoId: "",
      logoFileName: "",
      supportComposition: { comptoir: 2, plaque: 3 },
    }]));

    renderRoute("/panier");

    expect(screen.getByText(/10 supports : un devis sera plus juste/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /Demander un devis/i })).toHaveAttribute("href", "/devis");
    expect(screen.queryByRole("link", { name: /Continuer vers la commande/i })).not.toBeInTheDocument();
  });

  it("permet de reprendre une commande dont la session Stripe a expiré", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ status: "expired" }) })));

    renderRoute("/commande/confirmee?session_id=cs_test_expired");

    expect(await screen.findByRole("heading", { name: /La session de paiement a expiré/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /Reprendre la commande/i })).toHaveAttribute("href", "/commande");
  });
});
