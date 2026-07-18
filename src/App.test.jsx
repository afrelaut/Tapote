// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Configurator } from "./App.jsx";
import { DEVICE_THEMES } from "./deviceThemes.js";


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
  it("affiche les choix de support et de style sans accordéon", () => {
    const { container } = render(<Configurator initialProduct="comptoir" onAdd={vi.fn()} />);

    expect(screen.getByText("Choisissez votre support")).toBeVisible();
    expect(screen.getByText("Style, accroche et palette")).toBeVisible();
    expect(screen.getByRole("button", { name: /Plaque 12 × 12/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Vitrine/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Minimal/i })).toBeVisible();
    expect(container.querySelector("details")).not.toBeInTheDocument();
  });

  it("garantit un contraste AA pour toutes les palettes du visuel", () => {
    Object.values(DEVICE_THEMES).forEach(({ paper, ink, accent, accentInk }) => {
      expect(contrastRatio(paper, ink)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(accent, accentInk)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("ajoute plusieurs exemplaires identiques depuis le configurateur", () => {
    const onAdd = vi.fn();
    render(<Configurator initialProduct="comptoir" onAdd={onAdd} />);

    fireEvent.click(screen.getByRole("button", { name: "Augmenter la quantité" }));
    fireEvent.click(screen.getByRole("button", { name: "Augmenter la quantité" }));

    expect(screen.getByLabelText("Quantité de Tapote")).toHaveValue(3);
    fireEvent.click(screen.getByRole("button", { name: "Ajouter 3 au panier" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ productId: "comptoir", quantity: 3 }));
    expect(screen.getByRole("button", { name: "3 ajoutés au panier" })).toBeInTheDocument();
  });

  it("adapte la couleur du texte au fond accentué sélectionné", () => {
    const { container } = render(<Configurator initialProduct="comptoir" onAdd={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Palette Profonde" }));
    fireEvent.click(screen.getByRole("button", { name: /Minimal/i }));

    const insert = container.querySelector(".printed-insert");
    expect(insert).toHaveClass("insert-style-minimal");
    expect(insert).toHaveStyle({ "--insert-accent-ink": "#17110c" });
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

    fireEvent.click(screen.getByRole("button", { name: /Beauté & bien-être/i }));

    expect(screen.getByLabelText("Aperçu de La Plaque 12 × 12 pour Réservation")).toBeInTheDocument();
    expect(screen.getByDisplayValue("STUDIO LUNE")).toBeInTheDocument();
    expect(screen.getByText("On se revoit quand ?")).toBeInTheDocument();
  });
});
