// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureStorefrontAttribution, trackStorefrontEvent } from "./analytics.js";

describe("storefront analytics bridge", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.dataLayer = [];
    window.history.replaceState({}, "", "/");
  });

  it("keeps campaign attribution for the rest of the session", () => {
    window.history.replaceState({}, "", "/?utm_source=instagram&utm_campaign=lancement");

    expect(captureStorefrontAttribution()).toEqual({
      utm_source: "instagram",
      utm_campaign: "lancement",
    });

    window.history.replaceState({}, "", "/boutique");
    expect(captureStorefrontAttribution()).toEqual({
      utm_source: "instagram",
      utm_campaign: "lancement",
    });
  });

  it("exposes a provider-neutral event and mirrors it to dataLayer", () => {
    const listener = vi.fn();
    window.addEventListener("tapote:storefront-event", listener, { once: true });

    trackStorefrontEvent("add_to_cart", { product_id: "comptoir_standard", value: 29 });

    expect(window.dataLayer).toEqual([
      expect.objectContaining({
        event: "add_to_cart",
        page_path: "/",
        product_id: "comptoir_standard",
        value: 29,
      }),
    ]);
    expect(listener).toHaveBeenCalledOnce();
  });
});
