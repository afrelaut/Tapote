import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./ErrorBoundary.jsx";
import RouteApp from "./RouteApp.jsx";
import "@fontsource/archivo/latin-400.css";
import "@fontsource/archivo/latin-500.css";
import "@fontsource/archivo/latin-600.css";
import "@fontsource/archivo/latin-700.css";
import "@fontsource/archivo/latin-800.css";
import "@fontsource/archivo-black/latin-400.css";
import "./base.css";
import "./storefront-v3.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <RouteApp />
    </ErrorBoundary>
  </StrictMode>,
);
