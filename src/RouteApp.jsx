import { lazy, Suspense } from "react";

const PilotApp = lazy(() => import("./pilot/PilotApp.jsx"));
const StoreApp = lazy(() => import("./App.jsx"));

export default function RouteApp() {
  const pilotRoute = window.location.pathname === "/pilot" || window.location.pathname.startsWith("/pilot/");
  const CurrentApp = pilotRoute ? PilotApp : StoreApp;

  return (
    <Suspense fallback={(
      <main className="route-loading" role="status">
        <img src="/brand/tapote-logo.svg" alt="tapote." />
        <span>{pilotRoute ? "Ouverture de Pilot…" : "Chargement…"}</span>
      </main>
    )}>
      <CurrentApp />
    </Suspense>
  );
}
