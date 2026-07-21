// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartPage, CheckoutPage, Configurator } from "./App.jsx";
import { DEVICE_THEMES, resolveDeviceColors } from "./deviceThemes.js";


const logoFile = () => new File(
  [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])],
  "logo-client.png",
  { type: "image/png" },
);

const relativeLuminance = (hex) => {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const contrastRatio = (first, second) => {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Configurateur Tapote", () => {
  it("affiche uniquement les trois supports personnalisables et le brief de création", () => {
    const { container } = render(<Configurator initialProduct="comptoir" onAdd={vi.fn()} />);

    expect(screen.getByText("Choisissez votre support")).toBeVisible();
    expect(screen.getByText("Votre demande de design")).toBeVisible();
    expect(screen.getByRole("button", { name: /PlaqueAvis.*39\s*€/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Chevalet/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Carte/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Vitrine/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Prêt(?:e)? à l’emploi/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Votre brief")).toBeVisible();
    expect(container.querySelector("details")).not.toBeInTheDocument();
  });

  it("ajoute un chevalet personnalisé à 39 €", () => {
    const onAdd = vi.fn();
    render(<Configurator initialProduct="comptoir" onAdd={onAdd} />);

    expect(screen.getByText(/39\s*€/, { selector: ".config-summary > strong" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au panier" }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      productId: "comptoir",
      quantity: 1,
    }));
  });

  it("garantit un contraste AA pour toutes les palettes du visuel", () => {
    Object.values(DEVICE_THEMES).forEach(({ paper, ink, accent, accentInk }) => {
      expect(contrastRatio(paper, ink)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(accent, accentInk)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("corrige une couleur de texte personnalisée illisible avant impression", () => {
    const colors = resolveDeviceColors("sand", "#173b57", "#f4b942", "#402d24");

    expect(contrastRatio(colors.paper, colors.ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.accent, colors.accentInk)).toBeGreaterThanOrEqual(4.5);
  });

  it("applique le prix du pack au lieu de multiplier le prix unitaire", () => {
    const onAdd = vi.fn();
    render(<Configurator initialProduct="comptoir" onAdd={onAdd} />);

    const quantityGroup = screen.getByRole("group", { name: "Quantité de chevalets" });
    fireEvent.click(within(quantityGroup).getByRole("button", { name: "2" }));

    expect(screen.getByText(/69\s*€/, { selector: ".config-summary > strong" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter le pack de 2" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      productId: "pack_duo",
      quantity: 1,
      supportComposition: { comptoir: 2, plaque: 0 },
    }));
    expect(screen.getByRole("button", { name: "Pack de 2 ajouté au panier" })).toBeInTheDocument();
  });

  it("conserve un aperçu contrasté pendant la préparation du BAT", () => {
    const { container } = render(<Configurator initialProduct="comptoir" onAdd={vi.fn()} />);

    const insert = container.querySelector(".printed-insert");
    expect(insert).toHaveClass("insert-style-signature");
    expect(insert).toHaveStyle({ "--insert-accent-ink": "#ffffff" });
  });

  it("affiche immédiatement le logo importé et l’ajoute à la configuration", async () => {
    const uploadId = "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a58";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ uploadId }) })));
    const onAdd = vi.fn();
    render(<Configurator initialProduct="comptoir" onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Importer le logo du commerce"), { target: { files: [logoFile()] } });

    expect(await screen.findByAltText("Aperçu du logo importé")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Logo prêt pour le BAT")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au panier" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ brandLogoId: uploadId, logoFileName: "logo-client.png" }));
  });

  it("conserve l’aperçu et propose de réessayer si la transmission échoue", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ error: "Stockage indisponible" }) })));
    render(<Configurator initialProduct="comptoir" onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Importer le logo du commerce"), { target: { files: [logoFile()] } });

    expect(await screen.findByAltText("Aperçu du logo importé")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Réessayer" })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Finaliser l’envoi du logo" })).toBeDisabled();
  });

  it("conserve le nom de la marque dans le visuel après l’import du logo", async () => {
    const uploadId = "7e58b0a4-0c28-4a1b-a2c4-40fc8dc87a58";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ uploadId }) })));
    render(<Configurator initialProduct="comptoir" onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Nom affiché sur l’objet"), { target: { value: "STUDIO TEST" } });
    fireEvent.change(screen.getByLabelText("Importer le logo du commerce"), { target: { files: [logoFile()] } });

    expect(await screen.findByAltText("Aperçu du logo importé")).toBeInTheDocument();
    expect(screen.getByText("STUDIO TEST")).toBeInTheDocument();
  });

  it("applique un scénario métier complet en un clic", () => {
    render(<Configurator initialProduct="comptoir" onAdd={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Salon de coiffure/i }));

    expect(screen.getByLabelText("Aperçu de La Plaque 12 × 12 pour Réservation")).toBeInTheDocument();
    expect(screen.getByDisplayValue("STUDIO LUNE")).toBeInTheDocument();
    expect(screen.getByText("On se revoit quand ?")).toBeInTheDocument();
  });
});

describe("Tunnel de commande B2B", () => {
  const cart = [{
    productId: "comptoir",
    actionId: "avis",
    quantity: 2,
    brandName: "CAFÉ TEST",
    theme: "blue",
    targetId: "cafe",
    designStyle: "signature",
    customHeadline: "",
    destinationUrl: "https://example.com",
    brandLogoId: "",
    logoFileName: "",
  }];

  it("affiche une vraie page panier avec récapitulatif et étape suivante", () => {
    render(<CartPage cart={cart} setCart={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Votre panier." })).toBeVisible();
    expect(screen.getByText("Le Chevalet A6")).toBeVisible();
    expect(screen.getByRole("button", { name: /Renseigner mes coordonnées/i })).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Étapes de la commande" })).toBeVisible();
  });

  it("prépare la commande sans appeler Stripe avant l’action explicite du client", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<CheckoutPage cart={cart} onOpenLegal={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Préparons la commande." })).toBeVisible();
    expect(screen.getByLabelText("Nom du commerce *")).toBeRequired();
    expect(screen.getByLabelText(/exclusivement pour les besoins/i)).toBeRequired();
    expect(screen.getByRole("button", { name: /Continuer vers Stripe Sandbox/i })).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
