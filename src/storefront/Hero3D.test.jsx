// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Hero3D from "./Hero3D.jsx";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Hero3D", () => {
  it("redémarre ensemble le téléphone, le NFC et les popups lors d’un changement de produit", () => {
    const { container } = render(<Hero3D />);
    const phoneBefore = container.querySelector(".v3-hero-gesture-phone");
    const nfcBefore = container.querySelector(".v3-hero-gesture-nfc");
    const cardsBefore = container.querySelector(".v3-hero-tech-cards");

    fireEvent.click(screen.getByRole("button", { name: /Plaque/i }));

    expect(container.querySelector(".v3-hero-3d")).toHaveAttribute("data-active-product", "plaque");
    expect(container.querySelector(".v3-hero-gesture-phone")).not.toBe(phoneBefore);
    expect(container.querySelector(".v3-hero-gesture-nfc")).not.toBe(nfcBefore);
    expect(container.querySelector(".v3-hero-tech-cards")).not.toBe(cardsBefore);
  });

  it("passe automatiquement au produit suivant à la fin de la démonstration", () => {
    vi.useFakeTimers();
    const { container } = render(<Hero3D />);

    expect(container.querySelector(".v3-hero-3d")).toHaveAttribute("data-active-product", "comptoir");
    act(() => vi.advanceTimersByTime(10_800));
    expect(container.querySelector(".v3-hero-3d")).toHaveAttribute("data-active-product", "plaque");
  });
});
