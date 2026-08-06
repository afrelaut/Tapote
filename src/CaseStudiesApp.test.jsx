// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CaseStudiesApp from "./CaseStudiesApp.jsx";

afterEach(() => {
  cleanup();
});

describe("Centre de cas clients Tapote", () => {
  it("distingue les preuves disponibles des validations terrain à venir", () => {
    render(<CaseStudiesApp />);

    expect(screen.getByRole("heading", { level: 1, name: /Des cas lisibles.*Pas des succès flous/i })).toBeVisible();
    expect(screen.getByText("Disponible")).toBeVisible();
    expect(screen.getByText("Processus actif")).toBeVisible();
    expect(screen.getByText("Pilotes recherchés")).toBeVisible();
    expect(screen.getByText("À documenter")).toBeVisible();
  });

  it("rend le protocole et les prochaines actions directement accessibles", () => {
    render(<CaseStudiesApp />);

    expect(screen.getByRole("heading", { name: "Comment un pilote devient un cas." })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Voir le centre de preuves/i })).not.toBeInTheDocument();
    expect(screen.getByText(/centre de preuves ouvrira/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /Proposer un pilote/i })).toHaveAttribute("href", "/devis");
    expect(document.title).toBe("Cas clients & preuves terrain | Tapote");
  });
});
