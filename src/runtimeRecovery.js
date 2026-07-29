const PRELOAD_RECOVERY_KEY = "tapote:preload-recovery-at";
const PRELOAD_RECOVERY_WINDOW_MS = 60_000;

let inMemoryRecoveryAt = 0;

function readRecoveryAt(target) {
  try {
    return Math.max(
      inMemoryRecoveryAt,
      Number(target.sessionStorage?.getItem(PRELOAD_RECOVERY_KEY) || 0),
    );
  } catch {
    return inMemoryRecoveryAt;
  }
}

function rememberRecovery(target, timestamp) {
  inMemoryRecoveryAt = timestamp;
  try {
    target.sessionStorage?.setItem(PRELOAD_RECOVERY_KEY, String(timestamp));
  } catch {
    // Private browsing can make sessionStorage unavailable. The in-memory guard
    // still prevents a reload loop for the lifetime of the current document.
  }
}

export function freshAssetUrl(currentUrl, timestamp = Date.now()) {
  const url = new URL(currentUrl);
  url.searchParams.set("_tapote_reload", timestamp.toString(36));
  return url.href;
}

export function reloadWithFreshAssets(target = window) {
  target.location.replace(freshAssetUrl(target.location.href));
}

export function installVitePreloadRecovery({
  target = window,
  now = () => Date.now(),
  navigate = (url) => target.location.replace(url),
} = {}) {
  const onPreloadError = (event) => {
    const timestamp = now();
    const previousRecoveryAt = readRecoveryAt(target);

    // If the fresh document cannot load its chunks either, let the error reach
    // React's boundary instead of trapping the browser in a reload loop.
    if (previousRecoveryAt > 0 && Math.abs(timestamp - previousRecoveryAt) < PRELOAD_RECOVERY_WINDOW_MS) {
      return;
    }

    event.preventDefault();
    rememberRecovery(target, timestamp);
    navigate(freshAssetUrl(target.location.href, timestamp));
  };

  target.addEventListener("vite:preloadError", onPreloadError);
  return () => target.removeEventListener("vite:preloadError", onPreloadError);
}
