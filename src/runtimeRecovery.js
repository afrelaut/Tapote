const PRELOAD_RECOVERY_KEY = "tapote:preload-recovery-at";
const PRELOAD_RECOVERY_WINDOW_MS = 60_000;
const RECOVERABLE_ASSET_ERROR = [
  /ChunkLoadError/i,
  /Loading chunk [\d-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Unable to preload CSS/i,
  /Module script load failed/i,
  /^Load failed$/i,
];

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

export function isRecoverableAssetError(error) {
  const message = typeof error === "string"
    ? error
    : error?.message || error?.reason?.message || "";
  return RECOVERABLE_ASSET_ERROR.some((pattern) => pattern.test(message));
}

function attemptRecovery({ target, now, navigate }) {
  const timestamp = now();
  const previousRecoveryAt = readRecoveryAt(target);

  // If the fresh document cannot load its chunks either, surface the error
  // instead of trapping the browser in a reload loop.
  if (previousRecoveryAt > 0 && Math.abs(timestamp - previousRecoveryAt) < PRELOAD_RECOVERY_WINDOW_MS) {
    return false;
  }

  rememberRecovery(target, timestamp);
  navigate(freshAssetUrl(target.location.href, timestamp));
  return true;
}

export function installVitePreloadRecovery({
  target = window,
  now = () => Date.now(),
  navigate = (url) => target.location.replace(url),
} = {}) {
  const onPreloadError = (event) => {
    if (attemptRecovery({ target, now, navigate })) {
      event.preventDefault();
    }
  };

  target.addEventListener("vite:preloadError", onPreloadError);
  return () => target.removeEventListener("vite:preloadError", onPreloadError);
}

export function recoverFromAssetError(error, {
  target = window,
  now = () => Date.now(),
  navigate = (url) => target.location.replace(url),
} = {}) {
  if (!isRecoverableAssetError(error)) return false;
  return attemptRecovery({ target, now, navigate });
}

export function installRuntimeRecovery({
  target = window,
  now = () => Date.now(),
  navigate = (url) => target.location.replace(url),
} = {}) {
  const uninstallPreloadRecovery = installVitePreloadRecovery({ target, now, navigate });
  const onUnhandledRejection = (event) => {
    if (recoverFromAssetError(event.reason, { target, now, navigate })) {
      event.preventDefault();
    }
  };

  target.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    uninstallPreloadRecovery();
    target.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
