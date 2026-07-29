import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  ExternalLink,
  History,
  LifeBuoy,
  Link2,
  LoaderCircle,
  LogOut,
  Menu,
  Radio,
  Search,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { createDemoWorkspace, loadPilotWorkspace, productName, updatePilotDestination } from "./pilotData.js";
import { getPilotSession, isPilotConfigured, isPilotDemo, pilotSupabase, redirectBaseUrl } from "./supabase.js";
import "./pilot.css";

const DAY = 86_400_000;
const views = {
  overview: { label: "Accueil", accessibleLabel: "Vue d’ensemble", icon: BarChart3 },
  products: { label: "Mes supports", accessibleLabel: "Produits", icon: Radio },
  history: { label: "Historique", icon: History },
  support: { label: "Support", icon: LifeBuoy },
};

const actionLabels = {
  avis: "Avis Google",
  menu: "Menu",
  reservation: "Réservation",
  fidelite: "Fidélité",
  pourboire: "Pourboire",
  instagram: "Instagram",
  wifi: "Wi-Fi",
  autre: "Autre",
};

function pilotWorkspaceLabel(workspace) {
  return workspace?.membership?.accessScope === "management"
    ? "Administration Pilot"
    : workspace?.organization?.name || "Pilot";
}

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value || 0);
}

function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: options.year ? "numeric" : undefined }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function relativeDate(value) {
  if (!value) return "Aucune interaction";
  const elapsed = Date.now() - new Date(value).getTime();
  if (elapsed < 60_000) return "À l’instant";
  if (elapsed < 3_600_000) return `Il y a ${Math.max(1, Math.floor(elapsed / 60_000))} min`;
  if (elapsed < DAY) return `Il y a ${Math.floor(elapsed / 3_600_000)} h`;
  const days = Math.floor(elapsed / DAY);
  return days === 1 ? "Hier" : `Il y a ${days} jours`;
}

function hostnameFromUrl(value, fallback = "Destination invalide") {
  try {
    return new URL(value).hostname || fallback;
  } catch {
    return fallback;
  }
}

function metricValue(rows) {
  return rows.reduce((total, row) => total + row.interactions, 0);
}

function analyticsFor(workspace, period, locationId = "all") {
  const now = Date.now();
  const start = now - period * DAY;
  const previousStart = start - period * DAY;
  const products = workspace.products.filter((product) => locationId === "all" || product.locationId === locationId);
  const linkIds = new Set(products.map((product) => product.linkId));
  const relevantMetrics = workspace.metrics.filter((row) => linkIds.has(row.tapoteLinkId));
  const metrics = relevantMetrics.filter((row) => new Date(`${row.day}T23:59:59Z`).getTime() >= start);
  const previousMetrics = relevantMetrics.filter((row) => {
    const timestamp = new Date(`${row.day}T23:59:59Z`).getTime();
    return timestamp >= previousStart && timestamp < start;
  });
  const total = metricValue(metrics);
  const previousTotal = metricValue(previousMetrics);
  const nfc = metricValue(metrics.filter((row) => row.source === "nfc"));
  const lastInteraction = metrics.reduce((latest, row) => !latest || row.lastInteraction > latest ? row.lastInteraction : latest, null);
  const byProduct = new Map(products.map((product) => [product.id, 0]));
  const productByLink = new Map(products.map((product) => [product.linkId, product.id]));
  metrics.forEach((row) => {
    const productId = productByLink.get(row.tapoteLinkId);
    if (productId) byProduct.set(productId, (byProduct.get(productId) || 0) + row.interactions);
  });

  const bucketDays = period === 90 ? 7 : 1;
  const bucketCount = Math.ceil(period / bucketDays);
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const chartStart = today.getTime() - (bucketCount * bucketDays - 1) * DAY;
  const series = Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(chartStart + index * bucketDays * DAY);
    return { date, label: formatDate(date), value: 0 };
  });
  metrics.forEach((row) => {
    const index = Math.floor((new Date(`${row.day}T12:00:00Z`).getTime() - chartStart) / (bucketDays * DAY));
    if (series[index]) series[index].value += row.interactions;
  });

  return {
    products,
    metrics,
    total,
    averagePerDay: Math.round((total / period) * 10) / 10,
    comparisonAvailable: previousMetrics.length > 0,
    trendPercent: previousTotal ? Math.round(((total - previousTotal) / previousTotal) * 100) : total ? 100 : 0,
    nfcShare: total ? Math.round((nfc / total) * 100) : 0,
    lastInteraction,
    activeProducts: products.filter((product) => product.status === "active" && product.linkActive).length,
    byProduct,
    series,
  };
}

function PilotLogo({ dark = false }) {
  return (
    <a className="pilot-logo" href="/pilot" aria-label="Tapote Pilot, accueil">
      <img src={dark ? "/brand/tapote-logo-light.svg" : "/brand/tapote-logo.svg"} alt="tapote." />
      <span>pilot</span>
    </a>
  );
}

export function PilotLogin({ onDemo, authClient = pilotSupabase }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState("password");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const submit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = method === "password"
      ? await authClient.auth.signInWithPassword({ email: normalizedEmail, password })
      : await authClient.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/pilot` },
      });
    if (error) {
      setStatus("error");
      setMessage(method === "password"
        ? "E-mail ou mot de passe incorrect, ou compte non encore activé."
        : "Impossible d’envoyer le lien. Vérifie que cette adresse a bien été invitée.");
      return;
    }
    if (method === "magic") {
      setStatus("sent");
      setCooldown(60);
      setMessage("Le lien de connexion vient de partir. Il reste valable pour une seule connexion.");
    }
  };

  const requestPasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Renseigne d’abord l’adresse e-mail de ton compte Pilot.");
      return;
    }
    setStatus("loading");
    setMessage("");
    const { error } = await authClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/pilot/`,
    });
    if (error) {
      setStatus("error");
      setMessage("Impossible d’envoyer le lien de réinitialisation pour le moment.");
      return;
    }
    setStatus("sent");
    setCooldown(60);
    setMessage("Si cette adresse possède un compte Pilot, un lien de réinitialisation vient d’être envoyé.");
  };

  return (
    <main className="pilot-login">
      <section className="pilot-login-copy">
        <PilotLogo />
        <div className="pilot-login-heading">
          <span className="pilot-kicker">ESPACE CLIENT · BÊTA PRIVÉE</span>
          <h1>Vos produits.<br /><em>Le bon lien.</em></h1>
          <p>Suivez les interactions et changez une destination sans réimprimer vos supports.</p>
        </div>
        <div className="pilot-auth-methods" role="group" aria-label="Mode de connexion">
          <button type="button" className={method === "password" ? "is-active" : ""} aria-pressed={method === "password"} onClick={() => { setMethod("password"); setMessage(""); setStatus("idle"); }}>Mot de passe</button>
          <button type="button" className={method === "magic" ? "is-active" : ""} aria-pressed={method === "magic"} onClick={() => { setMethod("magic"); setMessage(""); setStatus("idle"); }}>Lien sécurisé</button>
        </div>
        <form onSubmit={submit} className="pilot-login-form">
          <label htmlFor="pilot-email">Adresse e-mail invitée</label>
          <div className="pilot-login-entry">
            <div className="pilot-login-inputs">
              <input id="pilot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@commerce.fr" required autoComplete="email" aria-describedby={message ? "pilot-login-message" : undefined} />
              {method === "password" && <input id="pilot-password" aria-label="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe" required minLength={8} autoComplete="current-password" />}
            </div>
            <button type="submit" disabled={status === "loading" || cooldown > 0}>
              {status === "loading" ? <LoaderCircle className="pilot-spin" size={18} /> : <ArrowRight size={18} />}
              <span>{method === "password" ? "Ouvrir Pilot" : cooldown > 0 ? `Renvoyer dans ${cooldown} s` : "Recevoir mon lien"}</span>
            </button>
          </div>
          {method === "password" && <button className="pilot-password-reset" type="button" onClick={requestPasswordReset} disabled={status === "loading" || cooldown > 0}>Mot de passe oublié&nbsp;?</button>}
          {message && <p id="pilot-login-message" className={`pilot-form-message pilot-form-${status}`} role={status === "error" ? "alert" : "status"}>{message}</p>}
        </form>
        <small>Accès sur invitation uniquement. Le lien sécurisé reste disponible sans mot de passe.</small>
        {onDemo && <button className="pilot-demo-access" type="button" onClick={onDemo}><Sparkles size={17} />Explorer la démonstration</button>}
      </section>
      <aside className="pilot-login-visual" aria-hidden="true">
        <img src="/assets/tapote-hero-a6-hd.webp" alt="" />
        <div className="pilot-login-signal"><Radio size={34} /><b>294</b><span>interactions · 30 jours</span></div>
      </aside>
    </main>
  );
}

function PilotPasswordUpdate({ onComplete, authClient = pilotSupabase }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmation) {
      setStatus("error");
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setStatus("loading");
    setMessage("");
    const { error } = await authClient.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage("Le mot de passe n’a pas pu être mis à jour. Demande un nouveau lien.");
      return;
    }
    window.history.replaceState({}, document.title, "/pilot/");
    setStatus("sent");
    setMessage("Mot de passe mis à jour. Ouverture de Pilot…");
    window.setTimeout(onComplete, 500);
  };

  return (
    <main className="pilot-login pilot-password-update">
      <section className="pilot-login-copy">
        <PilotLogo />
        <div className="pilot-login-heading">
          <span className="pilot-kicker">SÉCURITÉ DU COMPTE</span>
          <h1>Nouveau<br /><em>mot de passe.</em></h1>
          <p>Choisis au moins 8 caractères et conserve ce mot de passe dans un gestionnaire sécurisé.</p>
        </div>
        <form onSubmit={submit} className="pilot-login-form">
          <label htmlFor="pilot-new-password">Nouveau mot de passe</label>
          <div className="pilot-login-entry">
            <div className="pilot-login-inputs">
              <input id="pilot-new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
              <input aria-label="Confirmer le nouveau mot de passe" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="Confirmer le mot de passe" />
            </div>
            <button type="submit" disabled={status === "loading" || status === "sent"}>{status === "loading" ? <LoaderCircle className="pilot-spin" size={18} /> : <Check size={18} />}<span>Enregistrer</span></button>
          </div>
          {message && <p className={`pilot-form-message pilot-form-${status}`} role={status === "error" ? "alert" : "status"}>{message}</p>}
        </form>
      </section>
      <aside className="pilot-login-visual" aria-hidden="true"><img src="/assets/tapote-hero-a6-hd.webp" alt="" /></aside>
    </main>
  );
}

function PilotUnavailable() {
  return (
    <main className="pilot-unavailable">
      <PilotLogo />
      <div>
        <span className="pilot-kicker">CONFIGURATION REQUISE</span>
        <h1>Pilot attend<br />ses clés Supabase.</h1>
        <p>Renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>, puis reconstruisez le site.</p>
        <a href="/">Retour à la boutique <ArrowRight size={17} /></a>
      </div>
    </main>
  );
}

function PilotLoading() {
  return <main className="pilot-loading"><PilotLogo /><LoaderCircle className="pilot-spin" size={30} /><span>Ouverture de Pilot…</span></main>;
}

function ProductGlyph({ type }) {
  return (
    <span className={`pilot-product-glyph pilot-product-${type}`} aria-hidden="true">
      {type === "carte" ? <Link2 size={19} /> : <Radio size={20} />}
    </span>
  );
}

function ProductRow({ product, interactions, onOpen }) {
  const isActive = product.status === "active" && product.linkActive;
  return (
    <button className="pilot-product-row" type="button" onClick={() => onOpen(product.id)} aria-label={`Ouvrir la fiche de ${product.label}, ${formatNumber(interactions)} interactions`}>
      <ProductGlyph type={product.productType} />
      <span className="pilot-product-name">
        <strong>{product.label}</strong>
        <small><i className={isActive ? "is-active" : "is-paused"} />{isActive ? "Actif" : "En pause"} · {productName(product.productType)} · {product.serialNumber}</small>
      </span>
      <span className="pilot-product-location"><Store size={14} />{product.locationName}</span>
      <span className="pilot-product-destination"><small>Destination</small><b>{product.targetUrl ? hostnameFromUrl(product.targetUrl) : "Non configurée"}</b></span>
      <span className="pilot-product-count"><b>{formatNumber(interactions)}</b><small>interactions</small></span>
      <ChevronRight className="pilot-row-arrow" size={18} />
    </button>
  );
}

function PeriodSwitch({ period, onChange }) {
  return (
    <div className="pilot-period-control">
      <span>Période</span>
      <div className="pilot-period" role="group" aria-label="Période affichée">
        {[7, 30, 90].map((value) => <button key={value} type="button" aria-pressed={period === value} className={period === value ? "is-active" : ""} onClick={() => onChange(value)}>{value} j</button>)}
      </div>
    </div>
  );
}

function Overview({ workspace, analytics, period, setPeriod, locationId, setLocationId, openProduct, showProducts }) {
  const maximum = Math.max(...analytics.series.map((entry) => entry.value), 1);
  const topProducts = [...analytics.products].sort((a, b) => (analytics.byProduct.get(b.id) || 0) - (analytics.byProduct.get(a.id) || 0)).slice(0, 4);
  const [quickProductId, setQuickProductId] = useState("");
  const quickProduct = analytics.products.find((product) => product.id === quickProductId) || analytics.products[0] || null;
  const TrendIcon = analytics.trendPercent >= 0 ? TrendingUp : TrendingDown;
  return (
    <>
      <header className="pilot-view-heading">
        <div className="pilot-heading-copy"><span className="pilot-kicker">PILOT · {pilotWorkspaceLabel(workspace)}</span><h1>Vue d’ensemble</h1><p>Les performances de vos produits Tapote, sans jargon.</p></div>
        <span className="pilot-free-promise"><Check size={16} /><span><b>FORMULE PILOT ACTIVE</b>Destinations pilotables à distance</span></span>
      </header>

      <section className="pilot-link-workspace" aria-labelledby="pilot-link-title">
        <div className="pilot-link-intro">
          <span>ACTION PRINCIPALE</span>
          <h2 id="pilot-link-title">Changer un lien</h2>
          <p>Choisissez le support. Collez la nouvelle adresse. Le prochain tap l’utilise.</p>
        </div>
        {quickProduct ? (
          <div className="pilot-link-control">
            <label htmlFor="pilot-quick-product">Support à modifier</label>
            <div className="pilot-link-select">
              <ProductGlyph type={quickProduct.productType} />
              <select id="pilot-quick-product" value={quickProduct.id} onChange={(event) => setQuickProductId(event.target.value)}>
                {analytics.products.map((product) => <option key={product.id} value={product.id}>{product.label} · {product.locationName}</option>)}
              </select>
            </div>
            <div className="pilot-current-link"><span>Ouvre aujourd’hui</span><strong>{quickProduct.targetUrl ? hostnameFromUrl(quickProduct.targetUrl) : "Aucune destination"}</strong><small>{quickProduct.locationName}</small></div>
            <button className="pilot-change-link" type="button" onClick={() => openProduct(quickProduct.id)}><Link2 size={18} />Changer ce lien <ArrowRight size={17} /></button>
          </div>
        ) : (
          <p className="pilot-link-empty">Aucun support dans ce lieu. Affichez tous les lieux pour choisir un produit.</p>
        )}
        <aside className="pilot-basic-counter" aria-label="Compteur des interactions">
          <span>INTERACTIONS · PILOT</span>
          <strong>{formatNumber(analytics.total)}</strong>
          <p>interactions NFC et QR<br />sur {period} jours</p>
          <small><i />{analytics.activeProducts} support{analytics.activeProducts > 1 ? "s" : ""} actif{analytics.activeProducts > 1 ? "s" : ""}</small>
        </aside>
      </section>

      <section className="pilot-location-section" aria-labelledby="pilot-location-title">
        <div><span>LIEUX</span><h2 id="pilot-location-title">Regrouper les supports</h2><p>Un lieu sélectionné filtre les supports et leur compteur.</p></div>
        <div className="pilot-location-list" role="group" aria-label="Filtrer les supports par lieu">
          <button type="button" className={locationId === "all" ? "is-active" : ""} aria-pressed={locationId === "all"} onClick={() => setLocationId("all")}><span>Tous les lieux</span><b>{workspace.products.length}</b></button>
          {workspace.locations.map((location) => {
            const count = workspace.products.filter((product) => product.locationId === location.id).length;
            return <button type="button" key={location.id} className={locationId === location.id ? "is-active" : ""} aria-pressed={locationId === location.id} onClick={() => setLocationId(location.id)}><span>{location.name}</span><b>{count}</b></button>;
          })}
        </div>
      </section>

      <section className="pilot-section-block">
        <div className="pilot-section-title"><div><span>MES SUPPORTS</span><h2>Prêts à être utilisés</h2><p>Cliquez sur un support pour voir ou changer son lien.</p></div><button type="button" onClick={showProducts}>Gérer tous les supports <ArrowRight size={16} /></button></div>
        <div className="pilot-client-product-list">
          {topProducts.map((product) => <ProductRow key={product.id} product={product} interactions={analytics.byProduct.get(product.id) || 0} onOpen={openProduct} />)}
          {!topProducts.length && <p className="pilot-empty-line">Aucun produit pour ce filtre.</p>}
        </div>
      </section>

      <section className="pilot-advanced" aria-labelledby="pilot-advanced-title">
        <header className="pilot-advanced-heading">
          <div><span>PILOT · MESURE & ANALYSE</span><h2 id="pilot-advanced-title">Comprendre ce qui fonctionne</h2><p>Les outils de pilotage pour comparer vos supports, vos lieux et vos périodes.</p></div>
          <div className="pilot-plan-price"><strong>9 €</strong><span>/ mois</span><small>ou 89 € / an</small></div>
        </header>
        <div className="pilot-advanced-features" aria-label="Fonctions Pilot avancées">
          <span>Stats par lieu</span><span>Périodes 7 / 30 / 90 jours</span><span>Part NFC / QR</span><span>Dernière interaction</span><span>Multi-établissement</span><span>Export CSV et historique</span>
        </div>
        <div className="pilot-advanced-controls">
          <label className="pilot-select-control"><span>Établissement analysé</span><select aria-label="Filtrer par établissement" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="all">Tous les établissements</option>
              {workspace.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select></label>
          <PeriodSwitch period={period} onChange={setPeriod} />
        </div>
        <div className="pilot-activity" aria-labelledby="pilot-activity-title">
          <div className="pilot-activity-total">
            <span id="pilot-activity-title">Interactions</span>
            <strong>{formatNumber(analytics.total)}</strong>
            {analytics.comparisonAvailable ? <div className={`pilot-trend ${analytics.trendPercent >= 0 ? "is-positive" : "is-negative"}`}><TrendIcon size={17} /><b>{analytics.trendPercent >= 0 ? "+" : ""}{analytics.trendPercent} %</b><span>vs période précédente</span></div> : <div className="pilot-trend"><Activity size={17} /><span>{formatNumber(analytics.averagePerDay)} par jour</span></div>}
            <small>NFC et QR · {period} derniers jours</small>
          </div>
          <div className="pilot-chart-panel">
            <div className="pilot-chart-heading"><span>Évolution</span><small>{period === 90 ? "par semaine" : "par jour"}</small></div>
            <div className="pilot-chart" role="img" aria-label={`${analytics.total} interactions sur les ${period} derniers jours`}>
              {analytics.series.map((entry) => (
                <i key={entry.date.toISOString()} style={{ "--pilot-bar": `${Math.max(3, Math.round((entry.value / maximum) * 100))}%` }} title={`${entry.label} : ${entry.value} interactions`} />
              ))}
            </div>
            <div className="pilot-chart-axis"><span>{analytics.series[0]?.label}</span><span>{analytics.series.at(-1)?.label}</span></div>
          </div>
        </div>
        <section className="pilot-kpis" aria-label="Indicateurs Pilot avancés">
          <div><span>Produits actifs</span><strong>{analytics.activeProducts} <small>/ {analytics.products.length}</small></strong><p>Supports opérationnels</p></div>
          <div><span>Part NFC</span><strong>{analytics.nfcShare} %</strong><p>Ouvertures sans appareil photo</p></div>
          <div><span>Dernière interaction</span><strong>{relativeDate(analytics.lastInteraction)}</strong><p>{formatDateTime(analytics.lastInteraction)}</p></div>
        </section>
      </section>
    </>
  );
}

function ProductsView({ workspace, analytics, openProduct, exportCsv, period }) {
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const products = analytics.products.filter((product) => {
    const matchesQuery = `${product.label} ${product.serialNumber} ${product.locationName}`.toLowerCase().includes(query.toLowerCase());
    const matchesLocation = locationFilter === "all" || product.locationId === locationFilter;
    const active = product.status === "active" && product.linkActive;
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? active : !active);
    return matchesQuery && matchesLocation && matchesStatus;
  });
  return (
    <>
      <header className="pilot-view-heading">
        <div className="pilot-heading-copy"><span className="pilot-kicker">{workspace.products.length} SUPPORT{workspace.products.length > 1 ? "S" : ""}</span><h1>Produits</h1><p>Consultez leur activité et modifiez la destination d’un support.</p></div>
        <button className="pilot-export" type="button" onClick={exportCsv}><Download size={17} />Exporter le CSV</button>
      </header>
      <div className="pilot-product-tools">
        <label className="pilot-search-field"><span>Rechercher</span><div><Search size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, série ou établissement" /></div></label>
        <label className="pilot-filter-field"><span>Établissement</span><select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}><option value="all">Tous</option>{workspace.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <label className="pilot-filter-field"><span>Statut</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tous</option><option value="active">Actifs</option><option value="paused">En pause</option></select></label>
        <span className="pilot-results-count" aria-live="polite">{products.length} résultat{products.length > 1 ? "s" : ""} · {period} jours</span>
      </div>
      <div className="pilot-client-product-list pilot-client-product-list-full">
        {products.map((product) => <ProductRow key={product.id} product={product} interactions={analytics.byProduct.get(product.id) || 0} onOpen={openProduct} />)}
        {!products.length && <p className="pilot-empty-line">Aucun produit ne correspond à cette recherche.</p>}
      </div>
    </>
  );
}

function HistoryView({ workspace, onChangeLink }) {
  const productsByLink = new Map(workspace.products.map((product) => [product.linkId, product]));
  return (
    <>
      <header className="pilot-view-heading"><div className="pilot-heading-copy"><span className="pilot-kicker">JOURNAL DES CHANGEMENTS</span><h1>Historique</h1><p>La trace des destinations modifiées depuis Pilot.</p></div></header>
      <div className="pilot-history-list">
        {workspace.auditLogs.map((entry) => {
          const product = productsByLink.get(entry.entityId);
          const change = entry.changes?.target_url;
          return (
            <article key={entry.id}>
              <span className="pilot-history-icon"><History size={17} /></span>
              <div><strong>{product?.label || "Produit Tapote"}</strong><p>Destination modifiée vers <b>{change?.to ? hostnameFromUrl(change.to) : "une nouvelle adresse"}</b>.</p>{change?.from && <small>Ancienne destination : {hostnameFromUrl(change.from)}</small>}</div>
              <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
            </article>
          );
        })}
        {!workspace.auditLogs.length && <section className="pilot-history-empty">
          <span><History size={22} /></span>
          <div><strong>Votre historique commence ici.</strong><p>Chaque changement de destination sera daté et rattaché au bon support.</p></div>
          <button type="button" onClick={onChangeLink}><Link2 size={16} />Changer un lien</button>
        </section>}
      </div>
    </>
  );
}

function SupportView() {
  return (
    <>
      <header className="pilot-view-heading"><div className="pilot-heading-copy"><span className="pilot-kicker">AIDE HUMAINE</span><h1>Support</h1><p>Un diagnostic simple avant de nous contacter.</p></div></header>
      <section className="pilot-support-lead">
        <CircleHelp size={32} />
        <h2>Un produit ne réagit pas<br />comme prévu ?</h2>
        <p>Indiquez le numéro de série visible dans sa fiche et décrivez le geste effectué. Tapote vérifiera le lien, le NFC et le QR.</p>
        <a href="mailto:contact@tapote.fr?subject=Support%20Tapote%20Pilot">Écrire au support Tapote <ArrowRight size={17} /></a>
      </section>
      <section className="pilot-support-facts">
        <div><b>01</b><strong>NFC silencieux</strong><p>Essayez sans coque, approchez le haut du téléphone, puis testez le QR.</p></div>
        <div><b>02</b><strong>Mauvais lien</strong><p>Ouvrez la fiche produit et remplacez immédiatement la destination.</p></div>
        <div><b>03</b><strong>Produit déplacé</strong><p>Contactez Tapote pour rattacher le support au bon établissement.</p></div>
      </section>
    </>
  );
}

function ProductInspector({ product, canEdit, interactions, onClose, onSave, toast }) {
  const [targetUrl, setTargetUrl] = useState(product.targetUrl);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef(null);
  const inspectorRef = useRef(null);
  const shortUrl = `${redirectBaseUrl}/a/${product.shortCode}`;

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    document.body.classList.add("pilot-modal-open");
    const close = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !inspectorRef.current) return;
      const focusable = [...inspectorRef.current.querySelectorAll('button:not([disabled]), a[href], textarea:not([readonly])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      document.body.classList.remove("pilot-modal-open");
      previousFocus?.focus?.();
    };
  }, [onClose]);

  const prepareSave = () => {
    setError("");
    try {
      const parsed = new URL(targetUrl.trim());
      if (parsed.protocol !== "https:" || targetUrl.length > 500) throw new Error();
      if (parsed.href === product.targetUrl) throw new Error("La destination n’a pas changé.");
      setTargetUrl(parsed.href);
      setConfirming(true);
    } catch (validationError) {
      setError(validationError.message || "Indiquez une URL complète commençant par https://.");
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(product, targetUrl);
      setConfirming(false);
      toast("Destination mise à jour. Le prochain tap utilisera ce lien.");
    } catch {
      setError("Le changement n’a pas pu être enregistré. Vérifiez votre connexion puis réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("Copie impossible. Sélectionnez l’adresse manuellement.");
    }
  };

  return (
    <div className="pilot-inspector-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside ref={inspectorRef} className="pilot-inspector" role="dialog" aria-modal="true" aria-labelledby="pilot-inspector-title">
        <header><div><span>FICHE PRODUIT</span><small>Modifications appliquées au prochain tap</small></div><button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Fermer la fiche"><X size={20} /></button></header>
        <div className="pilot-inspector-body">
          <ProductGlyph type={product.productType} />
          <span className={`pilot-client-status pilot-client-status-${product.status}`}><i />{product.status === "active" ? "Actif" : product.status}</span>
          <h2 id="pilot-inspector-title">{product.label}</h2>
          <p>{productName(product.productType)} · {actionLabels[product.actionId] || product.actionId}</p>
          <section className="pilot-destination-edit pilot-destination-edit-primary">
            <div className="pilot-destination-heading"><label htmlFor="pilot-target">CHANGER LE LIEN</label><span>Formule Pilot active</span></div>
            <p>Collez l’adresse HTTPS de la page à ouvrir au prochain tap.</p>
            <textarea id="pilot-target" aria-label="DESTINATION ACTUELLE" rows="3" value={targetUrl} onChange={(event) => { setTargetUrl(event.target.value); setConfirming(false); setError(""); }} readOnly={!canEdit} />
            {error && <p className="pilot-field-error" role="alert">{error}</p>}
            {canEdit && !confirming && <button className="pilot-primary-action" type="button" onClick={prepareSave}>Vérifier le changement <ArrowRight size={17} /></button>}
            {!canEdit && <p className="pilot-readonly">Votre rôle permet uniquement la consultation.</p>}
          </section>
          {confirming && (
            <section className="pilot-confirm-change">
              <span>CONFIRMER LA REDIRECTION</span>
              <p>Tous les prochains taps ouvriront <b>{hostnameFromUrl(targetUrl)}</b>. Les scans QR suivront la même destination, sans réimprimer le support.</p>
              <div><button type="button" onClick={() => setConfirming(false)}>Annuler</button><button type="button" onClick={save} disabled={saving}>{saving ? <LoaderCircle className="pilot-spin" size={16} /> : <Check size={16} />}Confirmer</button></div>
            </section>
          )}
          <dl>
            <div><dt>Établissement</dt><dd>{product.locationName}</dd></div>
            <div><dt>N° de série</dt><dd>{product.serialNumber}</dd></div>
            <div><dt>Interactions</dt><dd>{formatNumber(interactions)}</dd></div>
          </dl>
          <section className="pilot-short-link">
            <span>URL PERMANENTE DU PRODUIT</span>
            <div><code>{shortUrl.replace(/^https?:\/\//, "")}</code><button type="button" onClick={copy} aria-label={copied ? "Lien copié" : "Copier le lien permanent"}>{copied ? <Check size={17} /> : <Copy size={17} />}<span>{copied ? "Copié" : "Copier"}</span></button></div>
            <p>Cette adresse reste identique, même lorsque vous changez la destination.</p>
            <div className="pilot-source-links"><a href={`${shortUrl}?s=nfc`} target="_blank" rel="noreferrer">Tester comme un tap NFC <ExternalLink size={14} /></a><a href={`${shortUrl}?s=qr`} target="_blank" rel="noreferrer">Tester comme un scan QR <ExternalLink size={14} /></a></div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function EmptyWorkspace({ email }) {
  return (
    <main className="pilot-empty-workspace">
      <PilotLogo />
      <div><span className="pilot-kicker">COMPTE OUVERT</span><h1>Vos produits arrivent<br />bientôt dans Pilot.</h1><p>Le compte {email} est bien connecté, mais aucun établissement ne lui est encore rattaché.</p><a href="/devis">Contacter Tapote <ArrowRight size={17} /></a></div>
    </main>
  );
}

export default function PilotApp() {
  const [previewDemo, setPreviewDemo] = useState(false);
  const [session, setSession] = useState(isPilotDemo ? { user: { id: "demo-user", email: "demo@tapote.fr" } } : null);
  const [authLoading, setAuthLoading] = useState(!isPilotDemo && isPilotConfigured);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [managementOrganizationId, setManagementOrganizationId] = useState(null);
  const [view, setView] = useState("overview");
  const [period, setPeriod] = useState(30);
  const [locationId, setLocationId] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const demoMode = isPilotDemo || previewDemo;

  useEffect(() => {
    document.title = "Pilot — Tapote";
    document.body.classList.add("pilot-client-body");
    const robots = document.querySelector('meta[name="robots"]');
    const previousRobots = robots?.content;
    if (robots) robots.content = "noindex,nofollow";
    return () => {
      document.body.classList.remove("pilot-client-body");
      if (robots && previousRobots) robots.content = previousRobots;
    };
  }, []);

  useEffect(() => {
    if (demoMode || !pilotSupabase) return undefined;
    let active = true;
    getPilotSession().then((currentSession) => {
      if (active) {
        setSession(currentSession);
        setAuthLoading(false);
      }
    }).catch(() => {
      if (active) {
        setSession(null);
        setAuthLoading(false);
      }
    });
    const { data: listener } = pilotSupabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [demoMode]);

  useEffect(() => {
    if (!session) return undefined;
    let active = true;
    const request = demoMode
      ? Promise.resolve(createDemoWorkspace())
      : loadPilotWorkspace(pilotSupabase, { organizationId: managementOrganizationId || undefined });
    request.then((result) => { if (active) { setWorkspace(result); setWorkspaceError(""); } }).catch(() => {
      if (active) setWorkspaceError("Pilot n’a pas pu charger vos données. Vérifiez votre connexion puis réessayez.");
    }).finally(() => { if (active) setWorkspaceLoading(false); });
    return () => { active = false; };
  }, [session, demoMode, managementOrganizationId]);

  const analytics = useMemo(() => workspace ? analyticsFor(workspace, period, locationId) : null, [workspace, period, locationId]);
  const selectedProduct = workspace?.products.find((product) => product.id === selectedProductId) || null;
  const canEdit = workspace
    && workspace.membership.accessScope !== "management"
    && workspace.membership.role !== "viewer";

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };

  const saveDestination = async (product, targetUrl) => {
    if (!demoMode) await updatePilotDestination(pilotSupabase, product.linkId, targetUrl);
    const auditEntry = {
      id: `local-${Date.now()}`,
      action: "tapote_link.updated",
      entityId: product.linkId,
      createdAt: new Date().toISOString(),
      changes: { target_url: { from: product.targetUrl, to: targetUrl } },
    };
    setWorkspace((current) => ({
      ...current,
      products: current.products.map((entry) => entry.id === product.id ? { ...entry, targetUrl } : entry),
      auditLogs: [auditEntry, ...current.auditLogs],
    }));
  };

  const exportCsv = () => {
    const header = ["Produit", "Type", "Établissement", "Série", "Statut", `Interactions ${period} j`, "Destination", "URL Tapote"];
    const rows = analytics.products.map((product) => [
      product.label,
      productName(product.productType),
      product.locationName,
      product.serialNumber,
      product.status,
      analytics.byProduct.get(product.id) || 0,
      product.targetUrl,
      `${redirectBaseUrl}/a/${product.shortCode}`,
    ]);
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const blob = new Blob([`\ufeff${[header, ...rows].map((row) => row.map(escape).join(";")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tapote-pilot-${period}j.csv`;
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const changeView = (nextView) => {
    setView(nextView);
    setMenuOpen(false);
    if (import.meta.env.MODE !== "test") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isPilotConfigured && !isPilotDemo) return <PilotUnavailable />;
  if (authLoading) return <PilotLoading />;
  if (!session) return <PilotLogin onDemo={import.meta.env.DEV ? () => {
    setPreviewDemo(true);
    setSession({ user: { id: "demo-user", email: "demo@tapote.fr" } });
    setWorkspaceLoading(true);
  } : null} />;
  if (passwordRecovery) return <PilotPasswordUpdate onComplete={() => setPasswordRecovery(false)} />;
  if (workspaceLoading) return <PilotLoading />;
  if (workspaceError) return <main className="pilot-error"><PilotLogo /><h1>Impossible d’ouvrir Pilot.</h1><p>{workspaceError}</p><button type="button" onClick={() => window.location.reload()}>Réessayer</button></main>;
  if (!workspace) return <EmptyWorkspace email={session.user.email} />;

  return (
    <div className="pilot-client-app">
      <a className="skip-link" href="#pilot-main">Aller au contenu</a>
      <aside className={`pilot-client-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="pilot-client-sidebar-top"><PilotLogo dark /><button type="button" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X size={20} /></button></div>
        <div className="pilot-organization">
          <span>{workspace.membership.accessScope === "management" ? "ACCÈS ÉQUIPE · PILOT" : "ESPACE CLIENT"}</span>
          <strong>{pilotWorkspaceLabel(workspace)}</strong>
          {workspace.membership.accessScope === "management" && workspace.availableOrganizations.length > 0 && (
            <select
              aria-label="Espace Pilot administré"
              value={workspace.organization.id}
              onChange={(event) => {
                setWorkspaceLoading(true);
                setManagementOrganizationId(event.target.value);
                setLocationId("all");
                setSelectedProductId(null);
                setView("overview");
              }}
            >
              {workspace.availableOrganizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}
            </select>
          )}
          <small><i />{demoMode
            ? "Démonstration"
            : workspace.membership.accessScope === "management"
              ? workspace.organization.name
              : "Données à jour"}</small>
        </div>
        <button className="pilot-sidebar-change" type="button" onClick={() => { setSelectedProductId(workspace.products[0]?.id || null); setMenuOpen(false); }} disabled={!workspace.products.length}><Link2 size={18} /><span>{workspace.membership.accessScope === "management" ? "Consulter un support" : "Changer un lien"}</span><ArrowRight size={16} /></button>
        <nav aria-label="Navigation Pilot">
          {Object.entries(views).map(([key, item]) => {
            const Icon = item.icon;
            return <button data-pilot-nav={key} type="button" key={key} aria-label={item.accessibleLabel} aria-current={view === key ? "page" : undefined} className={view === key ? "is-active" : ""} onClick={() => changeView(key)}><Icon size={19} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="pilot-client-sidebar-foot">
          <a href="/" target="_blank">Boutique Tapote <ExternalLink size={14} /></a>
          <div><span>{session.user.email}</span>{demoMode ? (!isPilotDemo && <button type="button" onClick={() => { setPreviewDemo(false); setSession(null); setWorkspace(null); }}><LogOut size={17} /><span>Quitter la démo</span></button>) : <button type="button" onClick={() => pilotSupabase.auth.signOut()}><LogOut size={17} /><span>Déconnexion</span></button>}</div>
        </div>
      </aside>

      <header className="pilot-mobile-header">
        <PilotLogo />
        <span>{views[view].label}</span>
        <button className="pilot-mobile-quick-link" type="button" onClick={() => setSelectedProductId(workspace.products[0]?.id || null)} disabled={!workspace.products.length} aria-label={workspace.membership.accessScope === "management" ? "Consulter rapidement un support" : "Changer rapidement un lien"}><Link2 size={20} /></button>
        <button className="pilot-mobile-menu" type="button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"><Menu size={22} /></button>
      </header>
      {menuOpen && <button className="pilot-menu-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />}

      <main id="pilot-main" className="pilot-client-workspace">
        {demoMode && <div className="pilot-demo-banner"><Sparkles size={16} /><span><b>Mode démonstration</b> · Les données affichées sont des exemples.</span></div>}
        {view === "overview" && <Overview workspace={workspace} analytics={analytics} period={period} setPeriod={setPeriod} locationId={locationId} setLocationId={setLocationId} openProduct={setSelectedProductId} showProducts={() => changeView("products")} />}
        {view === "products" && <ProductsView workspace={workspace} analytics={analyticsFor(workspace, period, "all")} openProduct={setSelectedProductId} exportCsv={exportCsv} period={period} />}
        {view === "history" && <HistoryView workspace={workspace} onChangeLink={() => setSelectedProductId(workspace.products[0]?.id || null)} />}
        {view === "support" && <SupportView />}
      </main>

      <nav className="pilot-mobile-nav" aria-label="Navigation mobile Pilot">
        {Object.entries(views).map(([key, item]) => {
          const Icon = item.icon;
          return <button data-pilot-mobile-nav={key} type="button" key={key} aria-label={`${item.accessibleLabel || item.label} — navigation mobile`} aria-current={view === key ? "page" : undefined} className={view === key ? "is-active" : ""} onClick={() => changeView(key)}><Icon size={20} /><span>{item.label}</span></button>;
        })}
      </nav>

      {selectedProduct && <ProductInspector product={selectedProduct} canEdit={canEdit} interactions={analyticsFor(workspace, period, "all").byProduct.get(selectedProduct.id) || 0} onClose={() => setSelectedProductId(null)} onSave={saveDestination} toast={showToast} />}
      {toast && <div className="pilot-client-toast" role="status"><Check size={17} />{toast}</div>}
    </div>
  );
}
