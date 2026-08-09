export function resolveAppSurface({ hostname, pathname, development = false }) {
  const normalizedHost = String(hostname || "").toLowerCase().split(":")[0];
  const managementHost = normalizedHost === "gestion.tapote.fr";
  const localHost = normalizedHost === "127.0.0.1" || normalizedHost === "localhost";
  const localManagementRoute = development
    && localHost
    && (pathname === "/_atelier-tapote" || pathname.startsWith("/_atelier-tapote/"));
  if (managementHost || localManagementRoute) return "management";
  if (pathname === "/connexion" || pathname.startsWith("/connexion/")) return "access";
  if (pathname === "/pilot" || pathname.startsWith("/pilot/")) return "pilot";
  return "store";
}
