// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { freshAssetUrl, installVitePreloadRecovery } from "./runtimeRecovery.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function createTarget() {
  const target = new EventTarget();
  target.location = { href: "https://gestion.tapote.fr/gestion?source=mobile#dashboard" };
  target.sessionStorage = createStorage();
  return target;
}

describe("récupération des chunks Vite", () => {
  it("conserve la route et ajoute un cache-buster", () => {
    expect(freshAssetUrl("https://gestion.tapote.fr/gestion?source=mobile#dashboard", 1234))
      .toBe("https://gestion.tapote.fr/gestion?source=mobile&_tapote_reload=ya#dashboard");
  });

  it("recharge automatiquement une seule fois dans la fenêtre de sécurité", () => {
    const target = createTarget();
    const navigate = vi.fn();
    let timestamp = 10_000;
    const uninstall = installVitePreloadRecovery({
      target,
      now: () => timestamp,
      navigate,
    });

    const firstError = new Event("vite:preloadError", { cancelable: true });
    target.dispatchEvent(firstError);

    expect(firstError.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith(
      "https://gestion.tapote.fr/gestion?source=mobile&_tapote_reload=7ps#dashboard",
    );

    timestamp += 1_000;
    const repeatedError = new Event("vite:preloadError", { cancelable: true });
    target.dispatchEvent(repeatedError);

    expect(repeatedError.defaultPrevented).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(1);

    uninstall();
  });
});
