import { Component } from "react";
import { reloadWithFreshAssets } from "./runtimeRecovery.js";

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Erreur d’affichage Tapote", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <img className="fatal-logo" src="/brand/tapote-logo.svg" alt="Tapote" />
          <h1>Tapote a besoin d’être rechargé.</h1>
          <p>Aucune commande n’a été débitée depuis cet écran.</p>
          <button className="button button-primary" onClick={() => reloadWithFreshAssets()}><span>Recharger la page</span></button>
        </main>
      );
    }
    return this.props.children;
  }
}
