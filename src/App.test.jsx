// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Configurator } from "./App.jsx";


const logoFile = () => new File(
  [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])],
  "logo-client.png",
  { type: "image/png" },
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Configurateur Tapote", () => {
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
