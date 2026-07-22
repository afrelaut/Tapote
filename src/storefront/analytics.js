const ATTRIBUTION_KEY = "tapote-storefront-attribution-v1";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function readAttribution() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) || "{}");
  } catch {
    return {};
  }
}

export function captureStorefrontAttribution() {
  if (typeof window === "undefined") return {};
  const current = readAttribution();
  if (Object.keys(current).length) return current;

  const params = new URLSearchParams(window.location.search);
  const attribution = Object.fromEntries(
    UTM_KEYS.map((key) => [key, params.get(key)]).filter(([, value]) => Boolean(value)),
  );
  if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
    attribution.referrer = document.referrer;
  }
  if (!Object.keys(attribution).length) return attribution;

  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Analytics must never block browsing or checkout.
  }
  return attribution;
}

export function trackStorefrontEvent(event, details = {}) {
  if (typeof window === "undefined") return;
  const payload = {
    event,
    page_path: window.location.pathname,
    ...captureStorefrontAttribution(),
    ...details,
  };

  if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("tapote:storefront-event", { detail: payload }));
}
