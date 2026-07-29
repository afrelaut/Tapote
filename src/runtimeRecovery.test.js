// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  freshAssetUrl,
  installRuntimeRecovery,
  installVitePreloadRecovery,
  isRecoverableAssetError,
  recoverFromAssetError,
} from "./runtimeRecovery.js";

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

  it("reconnaît les erreurs de module produites par Safari et Chromium", () => {
    expect(isRecoverableAssetError(new TypeError("Load failed"))).toBe(true);
    expect(isRecoverableAssetError(new TypeError("Failed to fetch dynamically imported module"))).toBe(true);
    expect(isRecoverableAssetError(new Error("Erreur Supabase"))).toBe(false);
  });

  it("récupère une erreur de module interceptée par React", () => {
    const target = createTarget();
    const navigate = vi.fn();

    expect(recoverFromAssetError(new TypeError("Load failed"), {
      target,
      now: () => 100_000,
      navigate,
    })).toBe(true);
    expect(navigate).toHaveBeenCalledWith(
      "https://gestion.tapote.fr/gestion?source=mobile&_tapote_reload=255s#dashboard",
    );
  });

  it("intercepte aussi les promesses de module rejetées hors de Vite", () => {
    const target = createTarget();
    const navigate = vi.fn();
    const uninstall = installRuntimeRecovery({
      target,
      now: () => 200_000,
      navigate,
    });
    const rejection = new Event("unhandledrejection", { cancelable: true });
    rejection.reason = new TypeError("Importing a module script failed");

    target.dispatchEvent(rejection);

    expect(rejection.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
    uninstall();
  });
});
