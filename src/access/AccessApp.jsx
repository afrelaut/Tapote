import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { getManagementAccess, getManagementSession } from "../management/repository.js";
import { getPilotSession, isPilotConfigured } from "../pilot/supabase.js";
import { isManagementConfigured } from "../management/supabase.js";
import "./access.css";

const initialState = { loading: true, pilot: null, management: null };

function sessionLabel(session, fallback) {
  return session?.user?.email ? `Session active · ${session.user.email}` : fallback;
}

export default function AccessApp() {
  const [access, setAccess] = useState(initialState);

  useEffect(() => {
    const previousTitle = document.title;
    const robots = document.querySelector('meta[name="robots"]');
    const previousRobots = robots?.content;
    document.title = "Espace Tapote · Pilot et Gestion";
    if (robots) robots.content = "noindex,nofollow";
    document.body.classList.add("access-body");
    return () => {
      document.title = previousTitle;
      if (robots && previousRobots) robots.content = previousRobots;
      document.body.classList.remove("access-body");
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      isPilotConfigured ? getPilotSession() : Promise.resolve(null),
      isManagementConfigured
        ? getManagementSession().then(async (session) => session ? { session, rights: await getManagementAccess(session.user) } : null)
        : Promise.resolve(null),
    ]).then(([pilotResult, managementResult]) => {
      if (!active) return;
      setAccess({
        loading: false,
        pilot: pilotResult.status === "fulfilled" ? pilotResult.value : null,
        management: managementResult.status === "fulfilled" && managementResult.value?.rights ? managementResult.value : null,
      });
    });
    return () => { active = false; };
  }, []);

  const pilotActive = Boolean(access.pilot);
  const managementActive = Boolean(access.management);

  return (
    <main className="access-shell">
      <header className="access-header">
        <a href="/" aria-label="Tapote, retour à la boutique"><img src="/brand/tapote-logo.svg" alt="tapote." /></a>
        <a href="/"><ArrowLeft size={17} /> Retour au site</a>
      </header>

      <section className="access-intro">
        <span>ESPACE TAPOTE</span>
        <h1>Un accès.<br /><em>Deux outils.</em></h1>
        <p>Pilot est l’espace de tes clients. Gestion reste ton atelier interne pour préparer, encoder et suivre les commandes.</p>
        <div className="access-trust"><Check size={16} /><span>Comptes invités uniquement</span><Check size={16} /><span>Droits contrôlés par Supabase</span></div>
      </section>

      <section className="access-destinations" aria-label="Choisir un espace Tapote">
        <a className="access-destination access-destination-pilot" href="/pilot">
          <span className="access-index">01</span>
          <i aria-hidden="true"><BarChart3 size={26} /></i>
          <div><small>POUR LES CLIENTS</small><h2>Tapote Pilot</h2><p>Interactions, produits actifs et destinations modifiables sans réimprimer.</p></div>
          <strong>{access.loading ? "Vérification…" : sessionLabel(access.pilot, "Connexion par e-mail ou lien sécurisé")}</strong>
          <b>{pilotActive ? "Continuer vers Pilot" : "Se connecter à Pilot"}<ArrowRight size={19} /></b>
        </a>

        <a className="access-destination access-destination-management" href="https://gestion.tapote.fr/gestion">
          <span className="access-index">02</span>
          <i aria-hidden="true"><LockKeyhole size={26} /></i>
          <div><small>POUR L’ÉQUIPE TAPOTE</small><h2>Tapote Gestion</h2><p>Commandes, encodage, contrôle qualité, stock et expéditions au même endroit.</p></div>
          <strong>{access.loading ? "Vérification…" : managementActive ? `Session active · ${access.management.rights.displayName}` : "Accès interne sur invitation"}</strong>
          <b>{managementActive ? "Continuer vers Gestion" : "Connexion gérant"}<ArrowRight size={19} /></b>
        </a>
      </section>

      <footer className="access-footer"><ShieldCheck size={16} /><span>Le bouton n’accorde aucun droit : chaque espace vérifie le compte et son organisation avant d’afficher les données.</span></footer>
    </main>
  );
}
