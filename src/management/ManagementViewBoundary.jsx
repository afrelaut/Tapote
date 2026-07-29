import { Component } from "react";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { reportClientError } from "../clientDiagnostics.js";

export default class ManagementViewBoundary extends Component {
  state = { failed: false, diagnosticId: "" };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Erreur d’affichage dans une vue Gestion", error, info);
    const diagnosticId = reportClientError(error, info, {
      surface: "management-view",
      view: this.props.view,
    });
    this.setState({ diagnosticId });
  }

  componentDidUpdate(previousProps) {
    if (previousProps.view !== this.props.view && this.state.failed) {
      this.setState({ failed: false, diagnosticId: "" });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="pilot-surface management-view-error" role="alert">
        <i><AlertTriangle size={24} /></i>
        <div>
          <span>MODE PROTÉGÉ</span>
          <h2>Cette vue a rencontré un problème.</h2>
          <p>La navigation Gestion reste disponible. Aucune commande n’a été modifiée.</p>
          {this.state.diagnosticId && <small>Diagnostic {this.state.diagnosticId}</small>}
        </div>
        <div className="management-view-error-actions">
          <button
            type="button"
            className="pilot-primary"
            onClick={() => this.setState({ failed: false, diagnosticId: "" })}
          >
            <RefreshCw size={16} />Réessayer
          </button>
          {this.props.view !== "orders" && (
            <button type="button" className="pilot-secondary" onClick={() => this.props.onNavigate("orders")}>
              Ouvrir les commandes<ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>
    );
  }
}
