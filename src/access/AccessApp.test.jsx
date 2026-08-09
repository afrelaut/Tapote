// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../pilot/PilotApp.jsx", () => ({
  default: () => <main><h1>Tapote Pilot</h1><p>Espace client</p></main>,
}));

import AccessApp from "./AccessApp.jsx";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Espace Tapote", () => {
  it("ne présente que Tapote Pilot sur la connexion publique", () => {
    render(<AccessApp />);
    expect(screen.getByRole("heading", { name: "Tapote Pilot" })).toBeInTheDocument();
    expect(screen.queryByText(/Gestion/i)).not.toBeInTheDocument();
  });
});
