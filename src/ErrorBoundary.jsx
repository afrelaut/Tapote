import { Component } from "react";
import { reportClientError } from "./clientDiagnostics.js";
import { recoverFromAssetError, reloadWithFreshAssets } from "./runtimeRecovery.js";

export default class ErrorBoundary extends Component {
  state = { failed: false, diagnosticId: "" };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Erreur d’affichage Tapote", error, info);
    if (recoverFromAssetError(error)) return;
    const diagnosticId = reportClientError(error, info, {
      surface: window.location.pathname.startsWith("/gestion") ? "management-app" : "application",
    });
    this.setState({ diagnosticId });
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <img className="fatal-logo" src="/brand/tapote-logo.svg" alt="Tapote" />
          <h1>Tapote a besoin d’être rechargé.</h1>
          <p>Aucune commande n’a été débitée depuis cet écran.</p>
          {this.state.diagnosticId && <small className="fatal-diagnostic">Diagnostic {this.state.diagnosticId}</small>}
          <button className="button button-primary" onClick={() => reloadWithFreshAssets()}><span>Recharger la page</span></button>
        </main>
      );
    }
    return this.props.children;
  }
}
