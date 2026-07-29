// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { buildClientErrorReport, reportClientError } from "./clientDiagnostics.js";

function targetWith(fetch = vi.fn(() => Promise.resolve())) {
  return {
    fetch,
    innerWidth: 390,
    innerHeight: 844,
    location: { pathname: "/gestion" },
    navigator: { userAgent: "Mobile Safari test" },
  };
}

describe("diagnostics des erreurs navigateur", () => {
  it("ne collecte que le contexte technique utile", () => {
    const report = buildClientErrorReport(
      new TypeError("La vue a échoué"),
      { componentStack: "\n at DashboardView" },
      { surface: "management-view", view: "dashboard" },
      targetWith(),
    );

    expect(report).toMatchObject({
      surface: "management-view",
      view: "dashboard",
      name: "TypeError",
      message: "La vue a échoué",
      componentStack: "\n at DashboardView",
      path: "/gestion",
      userAgent: "Mobile Safari test",
      viewport: { width: 390, height: 844 },
    });
    expect(report.id).toMatch(/^WEB-/);
    expect(report).not.toHaveProperty("email");
    expect(report).not.toHaveProperty("token");
  });

  it("envoie le diagnostic en arrière-plan sans bloquer l’écran de secours", () => {
    const fetch = vi.fn(() => Promise.resolve({ ok: true }));
    const target = targetWith(fetch);

    const id = reportClientError(new Error("Crash Safari"), {}, { surface: "management-app" }, target);

    expect(id).toMatch(/^WEB-/);
    expect(fetch).toHaveBeenCalledWith("/api/client-errors", expect.objectContaining({
      method: "POST",
      credentials: "omit",
      keepalive: true,
    }));
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      id,
      message: "Crash Safari",
      surface: "management-app",
    });
  });
});
