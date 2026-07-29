// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ManagementViewBoundary from "./ManagementViewBoundary.jsx";

vi.mock("../clientDiagnostics.js", () => ({
  reportClientError: vi.fn(() => "WEB-TEST-123"),
}));

function BrokenView() {
  throw new Error("Vue cassée");
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("protection des vues Gestion", () => {
  it("garde un écran opérationnel et la navigation quand une vue plante", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onNavigate = vi.fn();
    render(
      <ManagementViewBoundary view="dashboard" onNavigate={onNavigate}>
        <BrokenView />
      </ManagementViewBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Cette vue a rencontré un problème." })).toBeInTheDocument();
    expect(screen.getByText("Diagnostic WEB-TEST-123")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ouvrir les commandes/ }));
    expect(onNavigate).toHaveBeenCalledWith("orders");
  });
});
