// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PilotApp from "./PilotApp.jsx";

afterEach(() => cleanup());

describe("Tapote Pilot", () => {
  it("affiche le workspace de démonstration et permet de changer une destination", async () => {
    render(<PilotApp />);

    expect(await screen.findByRole("heading", { name: "Vue d’ensemble" })).toBeInTheDocument();
    expect(screen.getByText(/Mode démonstration/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Produits" }));
    expect(screen.getByRole("heading", { name: "Produits" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Avis · Comptoir/ }));

    const destination = screen.getByLabelText("DESTINATION ACTUELLE");
    fireEvent.change(destination, { target: { value: "https://example.com/nouvelle-destination" } });
    fireEvent.click(screen.getByRole("button", { name: /Vérifier le changement/ }));
    expect(screen.getByText(/Tous les prochains taps ouvriront/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Confirmer$/ }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Destination mise à jour"));
    expect(destination).toHaveValue("https://example.com/nouvelle-destination");
  });

  it("refuse une destination non HTTPS avant confirmation", async () => {
    render(<PilotApp />);
    await screen.findByRole("heading", { name: "Vue d’ensemble" });
    fireEvent.click(screen.getByRole("button", { name: /Avis · Comptoir/ }));
    fireEvent.change(screen.getByLabelText("DESTINATION ACTUELLE"), { target: { value: "http://example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Vérifier le changement/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("https://");
  });

  it("rend les filtres compréhensibles et permet de rechercher un produit", async () => {
    render(<PilotApp />);

    await screen.findByRole("heading", { name: "Vue d’ensemble" });
    expect(screen.getByRole("button", { name: "30 j" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Les performances de vos produits Tapote, sans jargon.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Produits" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Rechercher" }), { target: { value: "Instagram" } });

    expect(screen.getByRole("button", { name: /Instagram · Vitrine/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Avis · Comptoir/ })).not.toBeInTheDocument();
    expect(screen.getByText(/1 résultat/)).toBeInTheDocument();
  });
});
