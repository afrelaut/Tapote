// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { resolveAppSurface } from "./route-surface.js";

describe("routage des espaces Tapote", () => {
  it("réserve la connexion publique à Pilot", () => {
    expect(resolveAppSurface({ hostname: "tapote.fr", pathname: "/connexion" })).toBe("access");
    expect(resolveAppSurface({ hostname: "tapote.fr", pathname: "/pilot" })).toBe("pilot");
  });

  it("ne publie plus Gestion comme une route du site client", () => {
    expect(resolveAppSurface({ hostname: "tapote.fr", pathname: "/gestion" })).toBe("store");
  });

  it("ouvre Gestion uniquement sur son hôte interne ou la route locale de développement", () => {
    expect(resolveAppSurface({ hostname: "gestion.tapote.fr", pathname: "/" })).toBe("management");
    expect(resolveAppSurface({ hostname: "127.0.0.1", pathname: "/_atelier-tapote", development: true })).toBe("management");
    expect(resolveAppSurface({ hostname: "tapote.fr", pathname: "/_atelier-tapote", development: true })).toBe("store");
    expect(resolveAppSurface({ hostname: "127.0.0.1", pathname: "/_atelier-tapote", development: false })).toBe("store");
  });
});
