import { lazy, Suspense } from "react";

const PilotApp = lazy(() => import("./pilot/PilotApp.jsx"));
const AccessApp = lazy(() => import("./access/AccessApp.jsx"));
const ManagementApp = lazy(() => import("./ManagementApp.jsx"));
const StoreApp = lazy(() => import("./StorefrontV3.jsx"));

export default function RouteApp() {
  const pilotRoute = window.location.pathname === "/pilot" || window.location.pathname.startsWith("/pilot/");
  const accessRoute = window.location.pathname === "/connexion" || window.location.pathname.startsWith("/connexion/");
  const managementRoute = window.location.pathname === "/gestion" || window.location.pathname.startsWith("/gestion/");
  const CurrentApp = accessRoute ? AccessApp : managementRoute ? ManagementApp : pilotRoute ? PilotApp : StoreApp;
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
