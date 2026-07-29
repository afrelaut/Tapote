const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 4_000;
const MAX_COMPONENT_STACK_LENGTH = 2_000;

function limitedString(value, maximum) {
  return typeof value === "string" ? value.slice(0, maximum) : "";
}

function diagnosticId(now = Date.now(), random = Math.random()) {
  return `WEB-${now.toString(36).toUpperCase()}-${Math.floor(random * 0xffffff).toString(36).toUpperCase().padStart(5, "0")}`;
}

export function buildClientErrorReport(error, info = {}, context = {}, target = window) {
  const id = diagnosticId();
  return {
    id,
    surface: limitedString(context.surface || "application", 40),
    view: limitedString(context.view || "", 40),
    name: limitedString(error?.name || "Error", 80),
    message: limitedString(error?.message || String(error || "Erreur inconnue"), MAX_MESSAGE_LENGTH),
    stack: limitedString(error?.stack, MAX_STACK_LENGTH),
    componentStack: limitedString(info?.componentStack, MAX_COMPONENT_STACK_LENGTH),
    path: limitedString(target.location?.pathname || "/", 160),
    userAgent: limitedString(target.navigator?.userAgent, 500),
    viewport: {
      width: Number.isFinite(target.innerWidth) ? Math.max(0, Math.round(target.innerWidth)) : 0,
      height: Number.isFinite(target.innerHeight) ? Math.max(0, Math.round(target.innerHeight)) : 0,
    },
  };
}

export function reportClientError(error, info, context, target = window) {
  const report = buildClientErrorReport(error, info, context, target);
  try {
    void target.fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      credentials: "omit",
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // The fallback remains usable even when telemetry is blocked by the browser.
  }
  return report.id;
}
