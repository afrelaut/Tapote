// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DeviceFrame from "./DeviceFrame.jsx";
import { ACTION_SCREEN_DATA, SCREEN_FAMILIES } from "./screenData.js";

afterEach(cleanup);

describe("DeviceFrame Tapote", () => {
  it("limite le moteur à six familles d’écran", () => {
    const families = new Set(Object.values(ACTION_SCREEN_DATA).map((action) => action.family));
    expect(families).toEqual(new Set(Object.values(SCREEN_FAMILIES)));
    expect(families.size).toBe(6);
  });

  it("synchronise le contenu et le nom accessible avec l’action", () => {
    const { rerender } = render(<DeviceFrame actionId="avis" sectorId="cafe" sectorTitle="Cafés & bars" />);
    expect(screen.getByRole("img", { name: "Écran du téléphone après ouverture : Avis Google" })).toHaveAttribute("data-screen-family", "reputation");
    expect(screen.getByRole("heading", { name: /Comment s’est passée votre visite/ })).toBeVisible();

    rerender(<DeviceFrame actionId="reservation" sectorId="salon" sectorTitle="Beauté, coiffure & bien-être" />);
    expect(screen.getByRole("img", { name: "Écran du téléphone après ouverture : Réservation" })).toHaveAttribute("data-screen-family", "booking");
    expect(screen.getByRole("heading", { name: "Réservez votre prestation" })).toBeVisible();
  });

  it("adapte le contenu de l’écran au secteur du client", () => {
    const { rerender } = render(<DeviceFrame actionId="menu" sectorId="restaurant" personalization="custom" brandName="L’ATELIER" />);
    expect(screen.getByText("Burrata crémeuse")).toBeVisible();

    rerender(<DeviceFrame actionId="menu" sectorId="boulangerie" personalization="custom" brandName="MAISON LEVAIN" />);
    expect(screen.getByText("Croissant pur beurre")).toBeVisible();
  });

  it("ouvre la vraie interface de l’application demandée", () => {
    const { container, rerender } = render(<DeviceFrame actionId="instagram" sectorId="cafe" />);
    expect(container.querySelector(".v3-instagram-app")).toBeInTheDocument();

    rerender(<DeviceFrame actionId="whatsapp" sectorId="cafe" />);
    expect(container.querySelector(".v3-whatsapp-app")).toBeInTheDocument();

    rerender(<DeviceFrame actionId="paiement" sectorId="cafe" />);
    expect(container.querySelector(".v3-apple-pay-app")).toBeInTheDocument();
  });

  it("n’affiche pas une marque de démonstration comme un vrai client", () => {
    const { rerender } = render(<DeviceFrame actionId="menu" brandName="CAFÉ NOMA" personalization="ready" />);
    expect(screen.getByText("Votre établissement")).toBeVisible();
    expect(screen.queryByText("CAFÉ NOMA")).not.toBeInTheDocument();

    rerender(<DeviceFrame actionId="menu" brandName="MA MAISON" personalization="custom" />);
    expect(screen.getByText("MA MAISON")).toBeVisible();
  });

  it("rend la destination cliquable uniquement lorsqu’elle est sûre", () => {
    const { rerender } = render(<DeviceFrame actionId="avis" destinationUrl="javascript:alert(1)" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    rerender(<DeviceFrame actionId="avis" destinationUrl="https://tapote.fr" />);
    expect(screen.getByRole("link", { name: /Publier mon avis/i })).toHaveAttribute("href", "https://tapote.fr");
  });

  it("ne duplique jamais le chrome iPhone dans une photo de téléphone", () => {
    const { container, rerender } = render(<DeviceFrame actionId="avis" />);
    expect(container.querySelectorAll(".v3-live-phone-status")).toHaveLength(1);
    expect(container.querySelector("[data-phone-render-mode='complete-device']")).toBeInTheDocument();

    rerender(<DeviceFrame actionId="avis" embedded />);
    expect(container.querySelectorAll(".v3-live-phone-status")).toHaveLength(0);
    expect(container.querySelector("[data-phone-render-mode='screen-inlay']")).toBeInTheDocument();
  });
});
