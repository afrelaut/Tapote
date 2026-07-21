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
  it("rend le service et Pilot tangibles dès l’accueil", () => {
    renderRoute("/");

    expect(screen.getByRole("heading", { name: /Vous choisissez\. On prépare\. Vous posez/i })).toBeVisible();
    expect(screen.getByRole("region", { name: /Aperçu de Tapote Pilot/i })).toBeVisible();
    expect(screen.getByText("294")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "7 j" }));

    expect(screen.getByText("86")).toBeVisible();
    expect(screen.getByText("61 NFC · 25 QR")).toBeVisible();
    expect(screen.getByRole("link", { name: /Voir les 3 supports/i })).toHaveAttribute("href", "/boutique");
  });

  it("propose une galerie complète de designs par action", () => {
    renderRoute("/designs");

    expect(screen.getByRole("heading", { name: /Le bon design/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /La suite sur Instagram/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Retrouvez-nous ici/i })).toBeVisible();
    expect(screen.getAllByText(/Partir de ce design/i)).toHaveLength(18);
    expect(document.querySelectorAll(".v3-design-specimen .device-purpose")).toHaveLength(18);
    expect(screen.getAllByText("Laissez un avis Google").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Suivez-nous sur Instagram")).toBeVisible();
    expect(screen.getByText("Consultez le menu")).toBeVisible();
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
    expect(screen.getByLabelText("Le lien à ouvrir")).toHaveValue("avis");
  });

  it("présente immédiatement l’offre courte et les prix prêts à l’emploi", () => {
    renderRoute("/boutique");

    expect(screen.getByRole("heading", { name: /Choisissez votre Tapote/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Chevalet" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Plaque" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Carte NFC" })).toBeVisible();
    expect(screen.getAllByText("29 €").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("19 €")).toBeVisible();
  });

  it("fige les aperçus boutique sur un rendu commun sans les relier au configurateur", () => {
    renderRoute("/boutique");

    expect(document.querySelectorAll('[data-preview-mode="fixed"]')).toHaveLength(3);
    expect(document.querySelectorAll('[data-preview-mode="fixed"] [data-phone-action="avis"]')).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: /À votre image/i }));

    expect(document.querySelectorAll('[data-preview-mode="fixed"]')).toHaveLength(3);
    expect(document.querySelectorAll('[data-preview-mode="fixed"] [data-phone-action="avis"]')).toHaveLength(3);
  });

  it("synchronise l’écran du téléphone de la fiche avec le lien choisi", () => {
    renderRoute("/produits/chevalet?mode=ready&action=avis");

    expect(document.querySelector('[data-preview-mode="live"] [data-phone-action="avis"]')).toHaveAttribute("data-native-source", "true");
    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "menu" } });

    expect(document.querySelector('[data-preview-mode="live"] [data-phone-action="menu"]')).toBeInTheDocument();
    expect(window.location.search).toContain("action=menu");
  });

  it("rend des écrans dédiés et reconnaissables pour Avis, Instagram et WhatsApp", () => {
    renderRoute("/produits/chevalet?mode=custom&action=avis");

    expect(document.querySelector(".v3-phone-google-stars")).toHaveTextContent("★★★★★");
    expect(screen.getByText("Quelle note donneriez-vous ?")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "instagram" } });
    expect(document.querySelector(".v3-instagram-app")).toBeInTheDocument();
    expect(document.querySelectorAll(".v3-instagram-app .v3-live-social-grid i")).toHaveLength(6);

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "whatsapp" } });
    expect(document.querySelector(".v3-whatsapp-app")).toHaveTextContent("Comment pouvons-nous vous aider");
    expect(document.querySelector(".v3-whatsapp-app")).toHaveTextContent("✓✓");
  });

  it("fait configurer les packs au lieu de les ajouter sans choix", () => {
    renderRoute("/boutique");

    fireEvent.click(screen.getByRole("button", { name: /Packs · dès 17,80/i }));
    fireEvent.click(screen.getByRole("button", { name: /À votre image/i }));

    const links = screen.getAllByRole("link", { name: /Choisir la composition/i });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", expect.stringContaining("mode=custom&count=2"));
    expect(links[1]).toHaveAttribute("href", expect.stringContaining("mode=custom&count=5"));
    expect(screen.queryByRole("button", { name: /Ajouter ce pack/i })).not.toBeInTheDocument();
  });

  it("conserve l’action choisie dans l’URL et garde le brief pour le BAT", () => {
    renderRoute("/produits/chevalet?mode=custom&action=avis");

    fireEvent.change(screen.getByLabelText("Le lien à ouvrir"), { target: { value: "instagram" } });
    fireEvent.change(screen.getByLabelText("Brief de design"), { target: { value: "Univers premium chaleureux" } });

    expect(window.location.search).toContain("action=instagram");
    expect(screen.queryByText("Univers premium chaleureux")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ajouter au panier/i }));
    expect(JSON.parse(window.localStorage.getItem("tapote-cart-v3"))).toEqual([
      expect.objectContaining({ actionId: "instagram", customHeadline: "Univers premium chaleureux" }),
    ]);
  });

  it("synchronise toute la fiche avec la composition d’un pack de plaques", () => {
    renderRoute("/produits/chevalet?mode=custom&count=2&composition=plaques&action=instagram");

    expect(screen.getByRole("heading", { name: "Pack 2 plaques", level: 1 })).toBeVisible();
    expect(screen.getByLabelText("Fil d’Ariane")).toHaveTextContent("Pack 2 plaques");
    expect(screen.getByText(/2 plaques PMMA cohérentes/i)).toBeVisible();
    expect(screen.getByText("2 plaques 12 × 12")).toBeVisible();
    expect(screen.getByText("2 NFC + QR testés séparément")).toBeVisible();
    expect(screen.getByText(/2 supports imprimés dans une identité cohérente/i)).toBeVisible();
    expect(screen.queryByText("1 chevalet, 1 insert imprimé, 1 puce NFC configurée et son QR code associé.")).not.toBeInTheDocument();
  });

  it("rend une vraie page introuvable sans faire planter une fausse fiche produit", () => {
    renderRoute("/produits/invente");

    expect(screen.getByRole("heading", { name: /Cette page n’existe pas/i })).toBeVisible();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  });

  it("présente des CGV structurées pour la commande professionnelle", () => {
    renderRoute("/cgv");

    expect(screen.getByRole("heading", { name: "Conditions générales de vente", level: 1 })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Personnalisation et BAT/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Conformité et réclamations/i })).toBeVisible();
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
