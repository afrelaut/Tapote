import { lazy, Suspense } from "react";
import { resolveAppSurface } from "./route-surface.js";

const PilotApp = lazy(() => import("./pilot/PilotApp.jsx"));
const AccessApp = lazy(() => import("./access/AccessApp.jsx"));
const ManagementApp = lazy(() => import("./ManagementApp.jsx"));
const StoreApp = lazy(() => import("./StorefrontV3.jsx"));

export default function RouteApp() {
  const surface = resolveAppSurface({
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    development: import.meta.env.DEV,
  });
  const accessRoute = surface === "access";
  const pilotRoute = surface === "pilot";
  const managementRoute = surface === "management";
  const CurrentApp = accessRoute
    ? AccessApp
    : managementRoute
      ? ManagementApp
      : pilotRoute
        ? PilotApp
        : StoreApp;
  const loadingLabel = accessRoute
    ? "Ouverture de votre espace…"
    : managementRoute
      ? "Ouverture de la gestion…"
      : pilotRoute
        ? "Ouverture de Pilot…"
        : "Chargement…";

  return (
    <Suspense fallback={(
      <main className="route-loading" role="status">
        <img src="/brand/tapote-logo.svg" alt="tapote." />
        <span>{loadingLabel}</span>
      </main>
    )}>
      <CurrentApp />
    </Suspense>
  );
}
