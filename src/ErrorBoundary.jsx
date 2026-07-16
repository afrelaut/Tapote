import { Component } from "react";

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
          <strong className="fatal-brand">tapote.</strong>
          <h1>Tapote a besoin d’être rechargé.</h1>
          <p>Aucune commande n’a été débitée depuis cet écran.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}><span>Recharger la page</span></button>
        </main>
      );
    }
    return this.props.children;
  }
}
