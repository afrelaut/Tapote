import { useState } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, Check, Clock3, LifeBuoy, Link2, Lock, Radio, TrendingUp } from "lucide-react";
import { ProductArt } from "../scenes/ProductArt.jsx";
import "../styles/pages/pilot-mock.css";

// Reproduction de l'écran réel de Tapote Pilot : même rail noir, même en-tête,
// mêmes blocs que l'application livrée aux clients. Le niveau affiché change
// ce que le compte peut faire, pas la mise en page — c'est exactement la
// différence entre Tapote Pilot et Tapote Pilot Pro.

const SUPPORTS = [
  { surface: "comptoir", action: "avis", theme: "nuit", label: "Avis · Comptoir", place: "Café Mistral · République", serial: "TAP-MISTRAL-001", destination: "avis.google.com", interactions: "183" },
  { surface: "plaque", action: "menu", theme: "creme", label: "Menu · Salle", place: "Café Mistral · République", serial: "TAP-MISTRAL-002", destination: "menu.cafemistral.fr", interactions: "213" },
  { surface: "plaque", action: "instagram", theme: "nuit", label: "Instagram · Plaque", place: "Café Mistral · Bastille", serial: "TAP-MISTRAL-003", destination: "instagram.com", interactions: "279" },
];

const BARS = [42, 61, 38, 74, 52, 88, 47, 66, 35, 79, 58, 92, 44, 70, 51, 83, 39, 64, 48, 76];

export function PilotAppMock({ level = "pilot", compact = false }) {
  const pro = level === "pro";
  return (
    <div className={`pilot-mock ${pro ? "is-pro" : "is-included"} ${compact ? "is-compact" : ""}`} aria-hidden="true">
      <aside className="pilot-mock__rail">
        <span className="pilot-mock__brand"><img src="/brand/tapote-logo-light.svg" alt="" /><b>PILOT</b></span>
        <span className="pilot-mock__space"><small>ESPACE CLIENT</small><strong>Café Mistral</strong><em><i />Démonstration</em></span>
        <nav>
          <span className={pro ? "is-action" : "is-locked"}>{pro ? <Link2 /> : <Lock />}Changer un lien{pro && <ArrowRight />}</span>
          <b className="is-active"><BarChart3 />Accueil</b>
          <span><Radio />Mes supports</span>
          <span><Clock3 />Historique</span>
          <span><LifeBuoy />Support</span>
        </nav>
        <span className="pilot-mock__foot">Boutique Tapote <ArrowUpRight /></span>
      </aside>

      <div className="pilot-mock__panel">
        <div className="pilot-mock__demo-banner">Démonstration de l’interface — données illustratives</div>

        <header className="pilot-mock__head">
          <span>
            <small>PILOT · CAFÉ MISTRAL</small>
            <strong>Vue d’ensemble</strong>
          </span>
          <em className={pro ? "is-pro" : ""}>{pro ? <Check /> : <Check />}{pro ? "PILOT PRO ACTIF" : "PILOT INCLUS"}</em>
        </header>

        <section className="pilot-mock__link">
          <div className="pilot-mock__link-copy">
            <small>{pro ? "ACTION PRINCIPALE" : "AVEC TAPOTE PILOT PRO"}</small>
            <strong>Changer un lien</strong>
            <p>{pro
              ? "Choisissez le support. Collez la nouvelle adresse. Le prochain tap l’utilise."
              : "Votre formule affiche la destination de chaque support. Le remplacer à distance est une fonction Pro."}</p>
          </div>
          <div className={`pilot-mock__link-card ${pro ? "" : "is-locked"}`}>
            <span className="pilot-mock__field"><i><Radio /></i><b>Avis · Comptoir · Café Mistral</b></span>
            <span className="pilot-mock__current"><small>Ouvre aujourd’hui</small><b>avis.google.com</b></span>
            <span className="pilot-mock__cta">{pro ? <><Link2 /> Changer ce lien <ArrowRight /></> : <><Lock /> Réservé à Tapote Pilot Pro</>}</span>
          </div>
          <div className="pilot-mock__counter">
            <small>INTERACTIONS · {pro ? "PILOT PRO" : "PILOT"}</small>
            <strong>{pro ? "675" : "—"}</strong>
            <p>{pro ? <>interactions NFC et QR<br />sur 30 jours</> : <>La mesure des ouvertures<br />fait partie de Pilot Pro</>}</p>
            <em><i />3 supports actifs</em>
          </div>
        </section>

        <section className="pilot-mock__supports">
          <div className="pilot-mock__section-head"><small>MES SUPPORTS</small><strong>Prêts à être utilisés</strong></div>
          {SUPPORTS.map((support) => (
            <article key={support.serial}>
              <i className={`is-${support.surface} is-${support.theme}`}><ProductArt surface={support.surface} actionId={support.action} brandName="tapote." theme={support.theme} personalization="ready" /></i>
              <span className="pilot-mock__support-id">
                <b>{support.label}</b>
                <small><u />Actif · {support.serial}</small>
              </span>
              <span className="pilot-mock__support-place">{support.place}</span>
              <span className="pilot-mock__support-destination"><small>DESTINATION</small><b>{support.destination}</b></span>
              <span className="pilot-mock__support-count">{pro ? <><b>{support.interactions}</b><small>INTERACTIONS</small></> : <><b className="is-muted">—</b><small>PILOT PRO</small></>}</span>
            </article>
          ))}
        </section>

        <section className={`pilot-mock__analytics ${pro ? "is-live" : "is-teaser"}`}>
          <div className="pilot-mock__analytics-head">
            <span><small>PILOT PRO · MESURE & ANALYSE</small><strong>Comprendre ce qui fonctionne</strong></span>
            {pro
              ? <span className="pilot-mock__period"><b>7 j</b><b className="is-on">30 j</b><b>90 j</b></span>
              : <span className="pilot-mock__price"><b>Option</b><small>avancée</small></span>}
          </div>
          {pro ? (
            <div className="pilot-mock__chart">
              <span className="pilot-mock__chart-total"><strong>675</strong><small><TrendingUp /> +8 % vs période précédente</small></span>
              <div className="pilot-mock__bars">
                {BARS.map((value, index) => <i key={index} className={index % 5 === 2 ? "is-qr" : ""} style={{ height: `${value}%` }} />)}
              </div>
            </div>
          ) : (
            <ul className="pilot-mock__locked-list">
              <li><Lock /> Changement de destination à distance</li>
              <li><Lock /> Périodes 7 / 30 / 90 jours</li>
              <li><Lock /> Part NFC et QR, export CSV</li>
              <li><Lock /> Comparaison multi-établissements</li>
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// Sélecteur des deux niveaux : le visiteur voit le même écran basculer, donc
// il comprend l'écart sans avoir à lire un tableau comparatif.
export function PilotLevelDemo({ initialLevel = "pilot" }) {
  const [level, setLevel] = useState(initialLevel);
  return (
    <div className="pilot-level-demo">
      <div className="pilot-level-switch" role="group" aria-label="Comparer Tapote Pilot et Tapote Pilot Pro">
        <button type="button" className={level === "pilot" ? "is-active" : ""} aria-pressed={level === "pilot"} onClick={() => setLevel("pilot")}>
          <strong>Tapote Pilot</strong><small>Inclus avec vos supports</small>
        </button>
        <button type="button" className={level === "pro" ? "is-active" : ""} aria-pressed={level === "pro"} onClick={() => setLevel("pro")}>
          <strong>Tapote Pilot Pro</strong><small>Option avancée</small>
        </button>
      </div>
      <PilotAppMock level={level} />
      <p className="pilot-level-note">
        {level === "pro"
          ? "Avec Pilot Pro : vous remplacez la destination à distance et vous lisez les ouvertures par période, lieu et support."
          : "Avec Pilot inclus : vous retrouvez chaque support et la page qu’il ouvre aujourd’hui. Le reste est grisé, pas caché."}
      </p>
    </div>
  );
}
