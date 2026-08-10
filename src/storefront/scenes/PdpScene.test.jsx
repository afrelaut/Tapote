// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PdpScene from "./PdpScene.jsx";

afterEach(cleanup);

const basePreview = {
  surface: "comptoir",
  actionId: "avis",
  brandName: "MARQUE DE DÉMO",
  personalization: "ready",
  secondaryColor: "#2458ff",
};

describe("moteur de scène PDP", () => {
  it("n'affiche aucun faux téléphone pendant le chargement différé de la 3D", () => {
    const { container } = render(
      <PdpScene
        image="/assets/products/tapote-bg-cafe-v1.webp"
        alt="Scène café"
        preview={basePreview}
        sectorId="cafe"
        sectorTitle="Cafés & bars"
        renderSupport={() => <div />}
      />,
    );

    const loading = screen.getByRole("status", { name: "Chargement de l’aperçu 3D" });
    expect(loading).toHaveAttribute("data-render-mode", "loading");
    expect(container.querySelector(".tapote-device-frame")).not.toBeInTheDocument();
  });

  it("garde le support et l’écran synchronisés", () => {
    const renderSupport = ({ surface, className }) => <div className={className} data-testid="support">{surface}</div>;
    const { rerender } = render(
      <PdpScene
        image="/assets/products/tapote-bg-cafe-v1.webp"
        alt="Scène café"
        preview={basePreview}
        sectorId="cafe"
        sectorTitle="Cafés & bars"
        renderSupport={renderSupport}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /En situation/i }));
    expect(screen.getByTestId("support")).toHaveTextContent("comptoir");
    expect(screen.getByRole("img", { name: "Écran du téléphone après ouverture : Avis Google" })).toHaveAttribute("data-phone-sector", "cafe");

    rerender(
      <PdpScene
        image="/assets/products/tapote-bg-cafe-v1.webp"
        alt="Scène café"
        preview={{ ...basePreview, actionId: "menu" }}
        sectorId="cafe"
        sectorTitle="Cafés & bars"
        renderSupport={renderSupport}
      />,
    );
    expect(screen.getByRole("img", { name: "Écran du téléphone après ouverture : Menu" })).toHaveAttribute("data-screen-family", "commerce");
  });

  it("charge les scènes compactes et leurs calques en différé", () => {
    const { container } = render(
      <PdpScene
        image="/assets/products/tapote-bg-cafe-v1.webp"
        alt="Scène café"
        preview={basePreview}
        compact
        subjectLayers={[{ image: "/assets/products/layer.webp" }]}
        renderSupport={() => <div />}
      />,
    );
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    images.forEach((image) => expect(image).toHaveAttribute("loading", "lazy"));
  });
});
