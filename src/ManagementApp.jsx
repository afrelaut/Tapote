import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  Factory,
  Gauge,
  Globe2,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  PackageOpen,
  Plus,
  Radio,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Settings2,
  ShoppingCart,
  Store,
  SmartphoneNfc,
  Truck,
  UserRound,
  UsersRound,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import ManagementAuth, { ManagementPasswordSetup } from "./management/ManagementAuth.jsx";
import {
  advanceManagementEncodedProduct,
  createManagementEncodedProduct,
  createManagementClient,
  createManagementInventoryItem,
  createManagementOrder,
  getManagementAccess,
  getManagementSession,
  loadManagementData,
  onManagementAuthChange,
  receiveManagementStock,
  setStorefrontProductOnline,
  signOutManager,
  subscribeToManagement,
  updateManagementOrderStatus,
} from "./management/repository.js";
import { isManagementConfigured } from "./management/supabase.js";
import "./management.css";

const statusFlow = ["paid", "bat", "supply", "assembly", "quality", "ready", "shipped"];

const statusMeta = {
  paid: { label: "Payée", tone: "blue", action: "Préparer le BAT" },
  bat: { label: "BAT à valider", tone: "amber", action: "BAT validé" },
  supply: { label: "Matériel réservé", tone: "purple", action: "Lancer l’assemblage" },
  assembly: { label: "Assemblage", tone: "orange", action: "Passer au contrôle" },
  quality: { label: "Contrôle qualité", tone: "teal", action: "Commande prête" },
  ready: { label: "Prête à expédier", tone: "green", action: "Marquer expédiée" },
  shipped: { label: "Expédiée", tone: "dark", action: "Expédiée" },
  cancelled: { label: "Annulée", tone: "dark", action: "Commande annulée" },
};

const encodingStatusMeta = {
  draft: { label: "À encoder", tone: "amber", action: "Confirmer l’encodage", next: "encoded" },
  encoded: { label: "Encodée", tone: "blue", action: "Tester NFC + QR", next: "tested" },
  tested: { label: "Testée", tone: "teal", action: "Verrouiller la fiche", next: "locked" },
  locked: { label: "Prête à affecter", tone: "green", action: "Affecter au client", next: "assigned" },
  assigned: { label: "Affectée", tone: "dark", action: null, next: null },
  replaced: { label: "Remplacée", tone: "dark", action: null, next: null },
};

const productPrices = {
  "Comptoir A6": 59,
  "Pack Restaurant": 189,
  "Carte NFC": 29.9,
  "Vitrine NFC": 29.9,
};

const initialData = {
  clients: [
    { id: "c1", name: "Café Noma", contact: "Léa Martin", email: "lea@cafenoma.fr", phone: "06 24 18 09 32", city: "Lyon", segment: "Café", orders: 3, revenue: 327, joined: "04 juin 2026", health: "Actif" },
    { id: "c2", name: "Maison Sépia", contact: "Inès Bernard", email: "ines@maisonsepia.fr", phone: "06 76 44 12 08", city: "Paris", segment: "Salon", orders: 2, revenue: 118, joined: "18 juin 2026", health: "Actif" },
    { id: "c3", name: "Bistrot des Quais", contact: "Hugo Colin", email: "hugo@bistrot-quais.fr", phone: "07 11 38 64 02", city: "Bordeaux", segment: "Restaurant", orders: 2, revenue: 498, joined: "02 juil. 2026", health: "À suivre" },
    { id: "c4", name: "Studio Bloom", contact: "Sofia Roux", email: "hello@studiobloom.fr", phone: "06 53 41 90 18", city: "Annecy", segment: "Beauté", orders: 1, revenue: 59, joined: "08 juil. 2026", health: "Actif" },
    { id: "c5", name: "Atelier Grain", contact: "Noé Dupont", email: "noe@ateliergrain.fr", phone: "07 42 18 22 06", city: "Nantes", segment: "Boutique", orders: 1, revenue: 35, joined: "11 juil. 2026", health: "Nouveau" },
  ],
  orders: [
    { id: "TPT-1048", clientId: "c1", product: "Pack Restaurant ×6", quantity: 1, total: 249, status: "assembly", payment: "Payé", channel: "Boutique", created: "15 juil.", due: "18 juil.", priority: "Haute", owner: "Aymeric", destination: "Avis Google", tracking: "", note: "6 chevalets, visuel terracotta validé." },
    { id: "TPT-1047", clientId: "c2", product: "Comptoir A6", quantity: 2, total: 118, status: "bat", payment: "Payé", channel: "Boutique", created: "15 juil.", due: "19 juil.", priority: "Normale", owner: "Rico", destination: "Réservation", tracking: "", note: "En attente de confirmation du rose de marque." },
    { id: "TPT-1046", clientId: "c3", product: "Pack Restaurant ×6", quantity: 1, total: 249, status: "quality", payment: "Payé", channel: "Devis", created: "14 juil.", due: "17 juil.", priority: "Haute", owner: "Aymeric", destination: "Menu", tracking: "", note: "Contrôler les 6 QR avant emballage." },
    { id: "TPT-1045", clientId: "c4", product: "Comptoir A6", quantity: 1, total: 59, status: "ready", payment: "Payé", channel: "Boutique", created: "13 juil.", due: "17 juil.", priority: "Normale", owner: "Rico", destination: "Instagram", tracking: "", note: "Colis prêt, étiquette à imprimer." },
    { id: "TPT-1044", clientId: "c5", product: "Sticker NFC", quantity: 1, total: 35, status: "supply", payment: "Payé", channel: "Boutique", created: "12 juil.", due: "18 juil.", priority: "Normale", owner: "Aymeric", destination: "Avis Google", tracking: "", note: "Réserver un sticker extérieur mat." },
    { id: "TPT-1043", clientId: "c1", product: "Carte NFC", quantity: 2, total: 58, status: "shipped", payment: "Payé", channel: "Boutique", created: "10 juil.", due: "15 juil.", priority: "Normale", owner: "Rico", destination: "Fidélité", tracking: "1K02840173012", note: "Remis à La Poste." },
    { id: "TPT-1042", clientId: "c3", product: "Pack Restaurant ×6", quantity: 1, total: 249, status: "shipped", payment: "Payé", channel: "Devis", created: "08 juil.", due: "14 juil.", priority: "Normale", owner: "Aymeric", destination: "Avis Google", tracking: "1K02840172991", note: "Livré le 14 juillet." },
  ],
  inventory: [
    { id: "s1", sku: "SUP-A6-CLR", name: "Chevalet plexi A6", category: "Support", stock: 18, reserved: 9, threshold: 12, incoming: 30, eta: "22 juil." },
    { id: "s2", sku: "NFC-NTAG213-38", name: "Tag NFC NTAG213 · antenne 35 mm", category: "Électronique", stock: 42, reserved: 13, threshold: 25, incoming: 100, eta: "24 juil." },
    { id: "s3", sku: "CARD-PVC-W", name: "Carte PVC blanche", category: "Support", stock: 64, reserved: 2, threshold: 30, incoming: 0, eta: "—" },
    { id: "s4", sku: "STK-EXT-MAT", name: "Sticker extérieur mat", category: "Impression", stock: 7, reserved: 3, threshold: 15, incoming: 50, eta: "19 juil." },
    { id: "s5", sku: "BOX-A6-KRAFT", name: "Étui kraft A6", category: "Packaging", stock: 23, reserved: 8, threshold: 20, incoming: 0, eta: "—" },
  ],
  storefront: [
    { id: "p1", name: "Le Comptoir A6", price: 59, online: true, stockId: "s1", sales: 24, conversion: "4,8 %" },
    { id: "p2", name: "Pack Restaurant ×6", price: 249, online: true, stockId: "s1", sales: 9, conversion: "2,9 %" },
    { id: "p3", name: "Carte NFC", price: 29, online: true, stockId: "s3", sales: 18, conversion: "5,2 %" },
    { id: "p4", name: "Sticker NFC", price: 35, online: false, stockId: "s4", sales: 12, conversion: "3,6 %" },
  ],
  activity: [
    { id: "a1", icon: "order", text: "La commande TPT-1048 est passée en assemblage", time: "Il y a 12 min" },
    { id: "a2", icon: "stock", text: "30 chevalets A6 commandés au fournisseur", time: "Il y a 48 min" },
    { id: "a3", icon: "client", text: "Nouveau client : Atelier Grain", time: "Il y a 2 h" },
    { id: "a4", icon: "ship", text: "TPT-1043 remise au transporteur", time: "Hier, 17:42" },
  ],
  encodedProducts: [
    { id: "u1", orderId: "row-1048", clientId: "c1", serialNumber: "TAP-6A2F91B8C440", supportType: "Comptoir A6", chipType: "NTAG213 · 38 mm", chipBatch: "N213-2607-A", label: "Café Noma · Avis", status: "encoded", shortCode: "4a8d22be71", targetUrl: "https://g.page/r/cafe-noma/review", iphoneTest: false, androidTest: false, qrTest: false, createdAt: "2026-07-16T09:30:00Z" },
    { id: "u2", orderId: null, clientId: "c2", serialNumber: "TAP-7DC42A18E103", supportType: "Plaque 12 × 12", chipType: "NTAG213 · 38 mm", chipBatch: "N213-2607-A", label: "Maison Sépia · Réservation", status: "locked", shortCode: "8f31c9e5a2", targetUrl: "https://example.com/reservation", iphoneTest: true, androidTest: true, qrTest: true, createdAt: "2026-07-15T14:00:00Z" },
  ],
  settings: { orderPrefix: "TPT", currency: "EUR", timezone: "Europe/Paris", lowStockNotifications: true, shippingCutoff: "16:00" },
};

const navGroups = [
  {
    label: "Pilotage",
    links: [
      { id: "dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
      { id: "orders", label: "Commandes", icon: ShoppingCart, count: "orders" },
      { id: "clients", label: "Clients", icon: UsersRound },
    ],
  },
  {
    label: "Opérations",
    links: [
      { id: "production", label: "Assemblage", icon: Factory, count: "production" },
      { id: "encoding", label: "Création & encodage", icon: QrCode, count: "encoding" },
      { id: "supply", label: "Supply & stocks", icon: Warehouse, alert: true },
      { id: "shipping", label: "Expéditions", icon: Truck, count: "shipping" },
    ],
  },
  {
    label: "Commerce",
    links: [
      { id: "ecommerce", label: "Site e-commerce", icon: Globe2 },
    ],
  },
];

const viewTitles = {
  dashboard: ["Vue d’ensemble", "__TODAY__ · données opérationnelles synchronisées"],
  orders: ["Commandes", "Suivre les ventes de la validation jusqu’à la livraison"],
  clients: ["Clients", "Historique, valeur et prochaine action par compte"],
  production: ["Assemblage", "Piloter la file atelier et les contrôles qualité"],
  encoding: ["Création & encodage", "Sérialiser, encoder, tester et affecter chaque produit Tapote"],
  supply: ["Supply & stocks", "Anticiper les ruptures et les réceptions fournisseurs"],
  shipping: ["Expéditions", "Préparer les colis et suivre les livraisons"],
  ecommerce: ["Site e-commerce", "Gérer la disponibilité et la performance de la boutique"],
};

function formatEuro(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function formatToday(referenceTime) {
  const label = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(referenceTime));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toUserMessage(error, fallback) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  if (code === "23505") return "Cette référence existe déjà dans TAPOTE Gestion.";
  if (code === "40001" || /management_order_conflict/i.test(message)) return "Cette commande vient d’être modifiée par un autre gérant. Les données ont été actualisées.";
  if (code === "42501" || /access_denied/i.test(message)) return "Votre compte n’a pas les droits nécessaires pour cette action.";
  if (code === "22023" || /invalid_/i.test(message)) return "Les informations saisies ne permettent pas d’enregistrer cette action.";
  if (/network|fetch/i.test(message)) return "Connexion à Supabase interrompue. Vérifiez le réseau puis réessayez.";
  return fallback;
}

function getViewTitle(view, referenceTime) {
  const [title, subtitle] = viewTitles[view];
  return [title, subtitle.replace("__TODAY__", formatToday(referenceTime))];
}

function getOrderSeries(orders, referenceTime, days = 14) {
  const today = new Date(referenceTime);
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    const key = date.toISOString().slice(0, 10);
    const dayOrders = orders.filter((order) => order.orderedOn === key);
    return { key, count: dayOrders.length, revenue: dayOrders.reduce((sum, order) => sum + order.total, 0) };
  });
}

function dateInputValue(referenceTime, offsetDays = 0) {
  const date = new Date(referenceTime + offsetDays * 86400000);
  return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function cx(...names) {
  return names.filter(Boolean).join(" ");
}

function isClosedOrder(order) {
  return ["shipped", "cancelled"].includes(order.status);
}

function StatusBadge({ status, label }) {
  const meta = statusMeta[status] || { label: label || status, tone: "dark" };
  return <span className={`pilot-status pilot-status-${meta.tone}`}><i />{label || meta.label}</span>;
}

function Brand() {
  return (
    <a className="pilot-brand" href="/gestion" aria-label="Tapote Gestion, accueil">
      <img src="/brand/tapote-logo-light.svg" alt="" />
      <span>GESTION</span>
    </a>
  );
}

function Sidebar({ currentView, onNavigate, open, onClose, openSettings, counts, access, onSignOut }) {
  const displayName = access?.displayName || "Gérant TAPOTE";
  const jobTitle = access?.jobTitle || "Accès privé";
  return (
    <>
      <button className={cx("pilot-nav-scrim", open && "is-open")} onClick={onClose} aria-label="Fermer la navigation" />
      <aside className={cx("pilot-sidebar", open && "is-open")}>
        <div className="pilot-sidebar-top"><Brand /><button onClick={onClose} aria-label="Fermer"><X size={18} /></button></div>
        <nav aria-label="Navigation de la gestion interne">
          {navGroups.map((group) => (
            <div className="pilot-nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.links.map((link) => {
                const Icon = link.icon;
                return (
                  <button key={link.id} className={cx(currentView === link.id && "is-active")} onClick={() => { onNavigate(link.id); onClose(); }}>
                    <Icon size={18} strokeWidth={1.8} />
                    <b>{link.label}</b>
                    {link.count && <em>{counts[link.count]}</em>}
                    {link.alert && counts.stockAlerts > 0 && <i className="pilot-nav-alert" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="pilot-sidebar-foot">
          <button onClick={openSettings}><Settings2 size={18} /><span><b>Réglages</b><small>Équipe & connexions</small></span></button>
          <div className="pilot-user"><span>{initials(displayName)}</span><div><b>{displayName}</b><small>{jobTitle}</small></div><button onClick={onSignOut} aria-label="Se déconnecter" title="Se déconnecter"><LogOut size={16} /></button></div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ view, search, setSearch, onMenu, onNewOrder, searchResults, onSearchResult, alerts, onAlertAction, referenceTime }) {
  const [title, subtitle] = getViewTitle(view, referenceTime);
  const searchRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, []);
  return (
    <header className="pilot-topbar">
      <div className="pilot-title-wrap">
        <button className="pilot-mobile-menu" onClick={onMenu} aria-label="Ouvrir la navigation"><Menu size={21} /></button>
        <div><h1>{title}</h1><p>{subtitle}</p></div>
      </div>
      <div className="pilot-top-actions">
        <div className="pilot-search-wrap" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
          <label className="pilot-search"><Search size={19} /><input ref={searchRef} value={search} onFocus={() => { setSearchOpen(true); setAlertsOpen(false); }} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === "Enter" && searchResults[0]) onSearchResult(searchResults[0]); if (event.key === "Escape") { setSearch(""); setSearchOpen(false); event.currentTarget.blur(); } }} placeholder="Commande, client, stock…" aria-label="Recherche globale" aria-expanded={searchOpen && Boolean(search.trim())} aria-controls="pilot-search-results" /><kbd>⌘ K</kbd></label>
          {searchOpen && search.trim() && <div className="pilot-search-results" id="pilot-search-results">
            <header><span>RÉSULTATS</span><small>{searchResults.length} trouvé{searchResults.length > 1 ? "s" : ""}</small></header>
            {searchResults.map((result) => <button key={`${result.kind}-${result.id}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onSearchResult(result)}>
              <i>{result.kind === "order" ? <Package size={18} /> : result.kind === "client" ? <UsersRound size={18} /> : <Boxes size={18} />}</i>
              <span><b>{result.title}</b><small>{result.subtitle}</small></span>
              <em>{result.label}</em><ArrowRight size={16} />
            </button>)}
            {!searchResults.length && <div className="pilot-search-empty"><Search size={20} /><span>Aucun résultat pour « {search} »</span></div>}
            {searchResults.length > 0 && <footer><kbd>↵</kbd> ouvre le premier résultat</footer>}
          </div>}
        </div>
        <div className="pilot-alert-wrap" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setAlertsOpen(false); }}>
          <button className="pilot-icon-button" onClick={() => { setAlertsOpen((value) => !value); setSearchOpen(false); }} aria-label="Notifications" aria-expanded={alertsOpen}><Bell size={20} />{alerts.length > 0 && <span>{alerts.length}</span>}</button>
          {alertsOpen && <div className="pilot-alert-panel">
            <header><div><span>CENTRE D’ACTION</span><h2>À surveiller aujourd’hui</h2></div><b>{alerts.length}</b></header>
            {alerts.map((alert) => <button key={alert.id} onClick={() => { onAlertAction(alert); setAlertsOpen(false); }}>
              <i className={`is-${alert.tone}`}>{alert.icon === "shipping" ? <Truck size={19} /> : alert.icon === "stock" ? <Warehouse size={19} /> : <ClipboardCheck size={19} />}</i>
              <span><b>{alert.title}</b><small>{alert.detail}</small></span>
              <ChevronRight size={17} />
            </button>)}
            {!alerts.length && <div className="pilot-alert-empty"><CheckCircle2 size={21} /><b>Tout est calme</b><span>Aucune alerte opérationnelle ouverte.</span></div>}
            <footer><CheckCircle2 size={16} /> Alertes calculées depuis les opérations en cours</footer>
          </div>}
        </div>
        <button className="pilot-primary" onClick={() => { setAlertsOpen(false); setSearchOpen(false); onNewOrder(); }}><Plus size={17} />Nouvelle commande</button>
      </div>
    </header>
  );
}

function Metric({ label, value, detail, trend, icon: Icon }) {
  return (
    <div className="pilot-metric">
      <div><span>{label}</span><strong>{value}</strong><small className={cx(trend && "is-positive")}>{trend && <ArrowUpRight size={13} />}{detail}</small></div>
      <i><Icon size={20} /></i>
    </div>
  );
}

function MiniBars({ series }) {
  const maximum = Math.max(1, ...series.map((day) => day.revenue));
  const hasData = series.some((day) => day.revenue > 0);
  return <div className={cx("pilot-mini-bars", !hasData && "is-empty")} aria-label="Chiffre d’affaires sur les 14 derniers jours">{series.map((day) => <i key={day.key} title={`${day.key} · ${formatEuro(day.revenue)}`} style={{ height: `${hasData ? Math.max(6, Math.round((day.revenue / maximum) * 100)) : 4}%` }} />)}</div>;
}

function DashboardView({ data, clientMap, onNavigate, openOrder, referenceTime, onNewClient, onNewInventory }) {
  const activeOrders = data.orders.filter((order) => !isClosedOrder(order));
  const paidOrders = data.orders.filter((order) => order.payment === "Payé");
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const ready = data.orders.filter((order) => order.status === "ready").length;
  const lowStock = data.inventory.filter((item) => item.stock - item.reserved <= item.threshold).length;
  const urgent = activeOrders.filter((order) => order.priority === "Haute" || order.status === "ready").slice(0, 4);
  const priorityCount = activeOrders.filter((order) => ["Haute", "Urgente"].includes(order.priority)).length;
  const orderSeries = getOrderSeries(data.orders, referenceTime);
  const revenue14 = orderSeries.reduce((sum, day) => sum + day.revenue, 0);
  const orderCount14 = orderSeries.reduce((sum, day) => sum + day.count, 0);
  const dueSoon = activeOrders.filter((order) => order.dueDate && new Date(`${order.dueDate}T12:00:00`) <= new Date(referenceTime + 3 * 86400000)).length;
  const productionCounts = statusFlow.slice(1, 6).map((status) => [status, data.orders.filter((order) => order.status === status).length]);
  return (
    <div className="pilot-view pilot-dashboard-view">
      {!data.clients.length && !data.orders.length && <section className="pilot-onboarding">
        <div className="pilot-onboarding-copy"><img src="/brand/tapote-mark.svg" alt="" /><div><span>ESPACE PRÊT</span><h2>Configurez votre atelier TAPOTE</h2><p>Votre organisation privée est sécurisée et vide. Ajoutez les premières données réelles pour démarrer sans contenu de démonstration.</p></div></div>
        <div className="pilot-onboarding-steps"><button onClick={onNewClient}><i>01</i><span><b>Ajouter un client</b><small>Contacts et historique</small></span><Plus size={17} /></button><button onClick={onNewInventory}><i>02</i><span><b>Créer le stock</b><small>Références et seuils</small></span><Plus size={17} /></button><button onClick={() => onNavigate("ecommerce")}><i>03</i><span><b>Vérifier le catalogue</b><small>Produits publiés</small></span><ArrowRight size={17} /></button></div>
      </section>}
      <section className="pilot-metrics" aria-label="Indicateurs principaux">
        <Metric label="CA encaissé" value={formatEuro(revenue)} detail={`${paidOrders.length} commande${paidOrders.length > 1 ? "s" : ""} payée${paidOrders.length > 1 ? "s" : ""}`} icon={CircleDollarSign} />
        <Metric label="Commandes actives" value={activeOrders.length} detail={`${priorityCount} prioritaire${priorityCount > 1 ? "s" : ""}`} icon={ShoppingCart} />
        <Metric label="Prêtes à expédier" value={ready} detail={`cut-off ${data.settings?.shippingCutoff || "16:00"}`} icon={PackageCheck} />
        <Metric label="Alertes stock" value={lowStock} detail={lowStock ? "à traiter" : "stocks sereins"} icon={AlertTriangle} />
      </section>

      <section className="pilot-dashboard-grid">
        <div className="pilot-surface pilot-priority-panel">
          <div className="pilot-section-head"><div><span>À TRAITER AUJOURD’HUI</span><h2>Priorités opérationnelles</h2></div><button onClick={() => onNavigate("orders")}>Toutes les commandes <ArrowRight size={15} /></button></div>
          <div className="pilot-priority-list">
            {urgent.map((order) => (
              <button key={order.id} onClick={() => openOrder(order.id)}>
                <span className={cx("pilot-priority-dot", order.priority === "Haute" && "is-urgent")}><Package size={17} /></span>
                <div><b>{order.id} · {clientMap[order.clientId]?.name}</b><small>{order.product} · échéance {order.due}</small></div>
                <StatusBadge status={order.status} />
                <ChevronRight size={17} />
              </button>
            ))}
            {!urgent.length && <div className="pilot-inline-empty"><CheckCircle2 size={21} /><div><b>Aucune urgence ouverte</b><span>Les commandes actives sont dans un rythme normal.</span></div></div>}
          </div>
          <div className="pilot-quick-note"><Zap size={17} fill="currentColor" /><span><b>Rythme des 72 h</b> {dueSoon ? `${dueSoon} commande${dueSoon > 1 ? "s" : ""} arrive${dueSoon > 1 ? "nt" : ""} à échéance.` : "Aucune échéance critique détectée."}</span></div>
        </div>

        <div className="pilot-surface pilot-sales-panel">
          <div className="pilot-section-head"><div><span>14 DERNIERS JOURS</span><h2>Ventes enregistrées</h2></div><Radio size={17} /></div>
          <div className="pilot-sales-number"><strong>{formatEuro(revenue14)}</strong><span>{orderCount14} commande{orderCount14 > 1 ? "s" : ""}</span></div>
          <MiniBars series={orderSeries} />
          <div className="pilot-chart-legend"><span>{new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${orderSeries[0].key}T12:00:00`))}</span><span>Aujourd’hui</span></div>
        </div>
      </section>

      <section className="pilot-dashboard-grid pilot-dashboard-grid-lower">
        <div className="pilot-surface pilot-flow-panel">
          <div className="pilot-section-head"><div><span>ATELIER</span><h2>Flux de production</h2></div><button onClick={() => onNavigate("production")}>Ouvrir l’atelier <ArrowRight size={15} /></button></div>
          <div className="pilot-flow-steps">
            {productionCounts.map(([status, count], index) => (
              <div key={status}><span>{String(index + 1).padStart(2, "0")}</span><strong>{count}</strong><small>{statusMeta[status].label}</small>{index < productionCounts.length - 1 && <ArrowRight size={15} />}</div>
            ))}
          </div>
        </div>
        <div className="pilot-surface pilot-activity-panel">
          <div className="pilot-section-head"><div><span>JOURNAL</span><h2>Activité récente</h2></div><Activity size={18} /></div>
          <div className="pilot-activity-list">
            {data.activity.slice(0, 4).map((item) => <div key={item.id}><i>{item.icon === "ship" ? <Truck /> : item.icon === "stock" ? <Boxes /> : item.icon === "client" ? <UserRound /> : <Package />}</i><p>{item.text}<small>{item.time}</small></p></div>)}
            {!data.activity.length && <div className="pilot-inline-empty"><Activity size={21} /><div><b>Journal prêt</b><span>Les prochaines actions apparaîtront ici.</span></div></div>}
          </div>
        </div>
      </section>
    </div>
  );
}

function OrderTable({ orders, clientMap, openOrder }) {
  return (
    <div className="pilot-table-wrap">
      <table className="pilot-table">
        <thead><tr><th>Commande</th><th>Client</th><th>Produit</th><th>Échéance</th><th>Montant</th><th>Statut</th><th><span className="sr-only">Action</span></th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} onClick={() => openOrder(order.id)}>
              <td><b>{order.id}</b><small>{order.channel} · {order.created}</small></td>
              <td><div className="pilot-client-cell"><span>{initials(clientMap[order.clientId]?.name || "")}</span><b>{clientMap[order.clientId]?.name}</b></div></td>
              <td><b>{order.product}</b><small>{order.quantity} unité{order.quantity > 1 ? "s" : ""} · {order.destination}</small></td>
              <td><b className={cx(order.priority === "Haute" && "pilot-urgent-text")}>{order.due}</b><small>{order.priority === "Haute" ? "Prioritaire" : order.owner}</small></td>
              <td><b>{formatEuro(order.total)}</b><small>{order.payment}</small></td>
              <td><StatusBadge status={order.status} /></td>
              <td><button onClick={(event) => { event.stopPropagation(); openOrder(order.id); }} aria-label={`Ouvrir ${order.id}`}><ChevronRight size={17} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && <div className="pilot-empty"><Search size={24} /><b>Aucune commande trouvée</b><span>Essaie un autre filtre ou une autre recherche.</span></div>}
    </div>
  );
}

function OrdersView({ data, clientMap, search, openOrder, exportOrders }) {
  const [filter, setFilter] = useState("active");
  const filtered = data.orders.filter((order) => {
    const matchesSearch = `${order.id} ${order.product} ${clientMap[order.clientId]?.name}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "active" && !isClosedOrder(order)) || order.status === filter;
    return matchesSearch && matchesFilter;
  });
  return (
    <div className="pilot-view">
      <section className="pilot-list-surface">
        <div className="pilot-list-toolbar">
          <div className="pilot-tabs">
            {[['active', 'Actives'], ['all', 'Toutes'], ['bat', 'BAT'], ['assembly', 'Assemblage'], ['ready', 'À expédier'], ['shipped', 'Expédiées']].map(([id, label]) => <button key={id} className={filter === id ? "is-active" : ""} onClick={() => setFilter(id)}>{label}</button>)}
          </div>
          <button className="pilot-secondary" onClick={exportOrders}><Download size={16} />Exporter CSV</button>
        </div>
        <OrderTable orders={filtered} clientMap={clientMap} openOrder={openOrder} />
        <div className="pilot-table-foot"><span>{filtered.length} commande{filtered.length > 1 ? "s" : ""}</span><span>Données actualisées à l’instant</span></div>
      </section>
    </div>
  );
}

function ClientsView({ data, search, selectedClient, setSelectedClient, clientOrders, onNewClient }) {
  const clients = data.clients.filter((client) => `${client.name} ${client.contact} ${client.city} ${client.segment}`.toLowerCase().includes(search.toLowerCase()));
  const selected = data.clients.find((client) => client.id === selectedClient) || clients[0];
  const orders = selected ? clientOrders(selected.id) : [];
  return (
    <div className="pilot-view pilot-client-layout">
      <section className="pilot-list-surface pilot-client-directory">
        <div className="pilot-directory-head"><span>{clients.length} CLIENTS</span><button className="pilot-secondary" onClick={onNewClient}><Plus size={15} />Ajouter</button></div>
        <div className="pilot-client-list">
          {clients.map((client) => (
            <button key={client.id} className={selected?.id === client.id ? "is-active" : ""} onClick={() => setSelectedClient(client.id)}>
              <span>{initials(client.name)}</span><div><b>{client.name}</b><small>{client.segment} · {client.city}</small></div><em>{formatEuro(client.revenue)}</em><ChevronRight size={16} />
            </button>
          ))}
          {!clients.length && <div className="pilot-inline-empty"><UsersRound size={21} /><div><b>Aucun client trouvé</b><span>Modifie la recherche ou crée le premier compte.</span></div></div>}
        </div>
      </section>
      {selected && <section className="pilot-surface pilot-client-profile">
        <div className="pilot-profile-hero"><span>{initials(selected.name)}</span><div><small>CLIENT DEPUIS LE {selected.joined.toUpperCase()}</small><h2>{selected.name}</h2><p>{selected.segment} · {selected.city}</p></div><StatusBadge status="quality" label={selected.health} /></div>
        <div className="pilot-profile-metrics"><div><span>CA total</span><strong>{formatEuro(selected.revenue)}</strong></div><div><span>Commandes</span><strong>{selected.orders}</strong></div><div><span>Panier moyen</span><strong>{formatEuro(selected.orders ? Math.round(selected.revenue / selected.orders) : 0)}</strong></div></div>
        <div className="pilot-profile-grid">
          <div><span>CONTACT PRINCIPAL</span><b>{selected.contact}</b>{selected.email !== "—" && <a href={`mailto:${selected.email}`}>{selected.email}</a>}{selected.phone !== "—" && <a href={`tel:${selected.phone.replaceAll(" ", "")}`}>{selected.phone}</a>}{selected.email === "—" && selected.phone === "—" && <p>Coordonnées à compléter</p>}</div>
          <div><span>PROCHAINE ACTION</span><b>{orders.some((order) => !isClosedOrder(order)) ? "Suivre la commande active" : "Relancer dans 30 jours"}</b><p>{orders.some((order) => !isClosedOrder(order)) ? "Une production est actuellement en cours." : "Aucune commande active pour ce client."}</p></div>
        </div>
        <div className="pilot-profile-orders"><div className="pilot-section-head"><div><span>HISTORIQUE</span><h3>Dernières commandes</h3></div></div>{orders.map((order) => <div key={order.id}><b>{order.id}</b><span>{order.product}</span><StatusBadge status={order.status} /><strong>{formatEuro(order.total)}</strong></div>)}</div>
      </section>}
      {!selected && <section className="pilot-surface pilot-client-profile pilot-client-profile-empty"><UsersRound size={32} /><h2>Construisez votre base clients</h2><p>Ajoutez un client pour centraliser ses contacts, son historique et ses commandes.</p><button className="pilot-primary" onClick={onNewClient}><Plus size={16} />Ajouter le premier client</button></section>}
    </div>
  );
}

function ProductionView({ data, clientMap, openOrder, advanceOrder, referenceTime }) {
  const stages = ["bat", "supply", "assembly", "quality", "ready"];
  const workshopOrders = data.orders.filter((order) => stages.includes(order.status));
  const priorityOrders = workshopOrders.filter((order) => ["Haute", "Urgente"].includes(order.priority));
  const dueOrders = workshopOrders.filter((order) => order.dueDate && new Date(`${order.dueDate}T12:00:00`) <= new Date(referenceTime + 2 * 86400000));
  return (
    <div className="pilot-view">
      <div className="pilot-production-summary"><div><Gauge size={18} /><span>En atelier</span><b>{workshopOrders.length} commande{workshopOrders.length > 1 ? "s" : ""}</b></div><div><Clock3 size={18} /><span>Échéances 48 h</span><b>{dueOrders.length}</b></div><div><BadgeCheck size={18} /><span>Prioritaires</span><b>{priorityOrders.length}</b></div></div>
      <section className="pilot-board">
        {stages.map((status) => {
          const orders = data.orders.filter((order) => order.status === status);
          return <div className="pilot-board-column" key={status}>
            <header><div><i className={`pilot-stage-dot pilot-stage-${status}`} /><b>{statusMeta[status].label}</b><span>{orders.length}</span></div></header>
            <div className="pilot-board-stack">
              {orders.map((order) => <article key={order.id} className={cx(order.priority === "Haute" && "is-priority")}>
                <button className="pilot-board-main" onClick={() => openOrder(order.id)}><span><b>{order.id}</b>{order.priority === "Haute" && <em>URGENT</em>}</span><h3>{clientMap[order.clientId]?.name}</h3><p>{order.product}</p><small><CalendarDays size={13} /> Échéance {order.due}</small></button>
                <div className="pilot-board-progress"><span>Étape opérationnelle</span><b>{statusMeta[status].label}</b></div>
                <button className="pilot-board-next" onClick={() => advanceOrder(order.id)}>{statusMeta[status].action}<ArrowRight size={14} /></button>
              </article>)}
              {!orders.length && <div className="pilot-board-empty"><Check size={18} />File vide</div>}
            </div>
          </div>;
        })}
      </section>
    </div>
  );
}

function EncodingStatusBadge({ status }) {
  const meta = encodingStatusMeta[status] || encodingStatusMeta.draft;
  return <span className={`pilot-status pilot-status-${meta.tone}`}><i />{meta.label}</span>;
}

function EncodingView({ data, clientMap, search, onCreate, onAdvance, onTest }) {
  const products = (data.encodedProducts || []).filter((product) => (
    `${product.serialNumber} ${product.label} ${product.supportType} ${product.chipType} ${product.chipBatch} ${clientMap[product.clientId]?.name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  ));
  const orderMap = Object.fromEntries(data.orders.map((order) => [order.recordId || order.id, order]));
  const pending = (data.encodedProducts || []).filter((product) => ["draft", "encoded"].includes(product.status)).length;
  const tested = (data.encodedProducts || []).filter((product) => ["tested", "locked", "assigned"].includes(product.status)).length;
  const assigned = (data.encodedProducts || []).filter((product) => product.status === "assigned").length;

  const act = (product) => {
    const meta = encodingStatusMeta[product.status];
    if (!meta?.next) return;
    if (meta.next === "tested") onTest(product);
    else onAdvance(product, meta.next);
  };

  return (
    <div className="pilot-view pilot-encoding-view">
      <section className="pilot-encoding-intro">
        <div>
          <span>ATELIER UNITAIRE</span>
          <h2>Un identifiant, un lien Tapote, trois tests.</h2>
          <p>La puce et le QR conservent la même URL courte. La destination reste modifiable dans Pilot sans réencoder le produit.</p>
        </div>
        <button className="pilot-primary" onClick={onCreate}><Plus size={16} />Créer un produit</button>
      </section>
      <div className="pilot-production-summary pilot-encoding-summary">
        <div><SmartphoneNfc size={18} /><span>À encoder ou tester</span><b>{pending}</b></div>
        <div><ClipboardCheck size={18} /><span>Contrôlés NFC + QR</span><b>{tested}</b></div>
        <div><PackageCheck size={18} /><span>Affectés</span><b>{assigned}</b></div>
      </div>
      <section className="pilot-list-surface pilot-encoding-list">
        <div className="pilot-section-head"><div><span>REGISTRE PRODUITS</span><h3>{products.length} unité{products.length > 1 ? "s" : ""}</h3></div><p>NTAG213 38 mm recommandé · URL HTTPS courte · contrôle croisé obligatoire</p></div>
        <div className="pilot-encoding-table" role="table" aria-label="Produits NFC encodés">
          <div className="pilot-encoding-row pilot-encoding-head" role="row">
            <span>Produit</span><span>Client / commande</span><span>Lien & puce</span><span>Contrôle</span><span>Statut</span><span>Action</span>
          </div>
          {products.map((product) => {
            const client = clientMap[product.clientId];
            const order = orderMap[product.orderId];
            const meta = encodingStatusMeta[product.status] || encodingStatusMeta.draft;
            return (
              <article className="pilot-encoding-row" role="row" key={product.id}>
                <div data-label="Produit"><b>{product.label}</b><code>{product.serialNumber}</code><small>{product.supportType}</small></div>
                <div data-label="Client / commande"><b>{client?.name || "Stock non affecté"}</b><small>{order?.id || "Sans commande liée"}</small></div>
                <div data-label="Lien & puce"><a href={`https://t.tapote.fr/a/${product.shortCode}`} target="_blank" rel="noreferrer">t.tapote.fr/a/{product.shortCode || "…"} <ExternalLink size={12} /></a><small>{product.chipType} · lot {product.chipBatch}</small></div>
                <div data-label="Contrôle" className="pilot-encoding-checks" aria-label="État des tests"><span className={product.iphoneTest ? "is-ok" : ""}>iPhone</span><span className={product.androidTest ? "is-ok" : ""}>Android</span><span className={product.qrTest ? "is-ok" : ""}>QR</span></div>
                <div data-label="Statut"><EncodingStatusBadge status={product.status} /></div>
                <div data-label="Action">{meta.action ? <button className="pilot-secondary" onClick={() => act(product)}>{meta.next === "tested" ? <ScanLine size={15} /> : <ArrowRight size={15} />}{meta.action}</button> : <span className="pilot-encoding-done"><CheckCircle2 size={15} />Terminé</span>}</div>
              </article>
            );
          })}
          {!products.length && <div className="pilot-inline-empty"><QrCode size={22} /><div><b>Aucun produit trouvé</b><span>Crée la première unité ou modifie ta recherche.</span></div></div>}
        </div>
      </section>
    </div>
  );
}

function SupplyView({ data, search, adjustStock, onNewInventory }) {
  const filtered = data.inventory.filter((item) => `${item.sku} ${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  const alerts = data.inventory.filter((item) => item.stock - item.reserved <= item.threshold);
  const nextReception = alerts.find((item) => item.incoming > 0) || alerts[0];
  return (
    <div className="pilot-view">
      <section className="pilot-supply-callout"><AlertTriangle size={20} /><div><b>{alerts.length} référence{alerts.length > 1 ? "s" : ""} demande{alerts.length > 1 ? "nt" : ""} votre attention</b><span>{nextReception ? `${nextReception.name} est sous son seuil de sécurité.` : "Tous les stocks sont au-dessus de leur seuil de sécurité."}</span></div>{nextReception && <button onClick={() => adjustStock(nextReception.id, nextReception.incoming || 10)}>Réceptionner {nextReception.incoming || 10} unités</button>}</section>
      <section className="pilot-list-surface">
        <div className="pilot-list-toolbar"><div><span className="pilot-eyebrow">INVENTAIRE CENTRAL</span><h2>Composants & packaging</h2></div><button className="pilot-secondary" onClick={onNewInventory}><Plus size={16} />Nouvelle référence</button></div>
        <div className="pilot-table-wrap"><table className="pilot-table pilot-stock-table"><thead><tr><th>Référence</th><th>Stock physique</th><th>Réservé</th><th>Disponible</th><th>Seuil</th><th>Prochaine réception</th><th>Action</th></tr></thead><tbody>
          {filtered.map((item) => {
            const available = item.stock - item.reserved;
            const low = available <= item.threshold;
            return <tr key={item.id}><td><div className="pilot-stock-name"><i><Boxes size={17} /></i><div><b>{item.name}</b><small>{item.sku} · {item.category}</small></div></div></td><td><b>{item.stock}</b></td><td><span>{item.reserved}</span></td><td><b className={cx(low && "pilot-urgent-text")}>{available}</b><small>{low ? "Sous le seuil" : "Disponible"}</small></td><td>{item.threshold}</td><td><b>{item.eta}</b><small>{item.incoming ? `+${item.incoming} unités` : "Non planifiée"}</small></td><td><button className="pilot-table-action" onClick={() => adjustStock(item.id, item.incoming || 10)}>Réception</button></td></tr>;
          })}
        </tbody></table>{!filtered.length && <div className="pilot-empty"><Boxes size={24} /><b>{search ? "Aucune référence trouvée" : "Inventaire vide"}</b><span>{search ? "Modifiez la recherche." : "Créez la première référence pour piloter les seuils et les réceptions."}</span></div>}</div>
      </section>
    </div>
  );
}

function ShippingView({ data, clientMap, markShipped, openOrder }) {
  const shipments = data.orders.filter((order) => ["ready", "shipped"].includes(order.status));
  const readyCount = shipments.filter((order) => order.status === "ready").length;
  const shipped = shipments.filter((order) => order.status === "shipped");
  const tracked = shipped.filter((order) => order.tracking).length;
  return (
    <div className="pilot-view pilot-shipping-layout">
      <section className="pilot-surface pilot-shipping-queue">
        <div className="pilot-section-head"><div><span>FILE D’EXPÉDITION</span><h2>Colis à traiter</h2></div><span className="pilot-cutoff"><Clock3 size={14} /> Cut-off {data.settings?.shippingCutoff || "16:00"}</span></div>
        {shipments.map((order) => <article key={order.id} className="pilot-shipment-row">
          <button className="pilot-shipment-main" onClick={() => openOrder(order.id)}><i>{order.status === "shipped" ? <Truck /> : <PackageOpen />}</i><div><span>{order.id}</span><h3>{clientMap[order.clientId]?.name}</h3><p>{order.product} · {clientMap[order.clientId]?.city}</p></div></button>
          <div className="pilot-shipment-state"><StatusBadge status={order.status} />{order.tracking && <small>{order.tracking}</small>}</div>
          {order.status === "ready" ? <button className="pilot-primary" onClick={() => markShipped(order.id)}><Truck size={16} />Expédier</button> : <button className="pilot-secondary" onClick={() => openOrder(order.id)}>Suivre <ExternalLink size={14} /></button>}
        </article>)}
        {!shipments.length && <div className="pilot-empty"><PackageCheck size={26} /><b>Aucun colis dans la file</b><span>Les commandes prêtes ou expédiées apparaîtront ici.</span></div>}
      </section>
      <aside className="pilot-surface pilot-shipping-aside">
        <span className="pilot-eyebrow">SUIVI LOGISTIQUE</span><h2>État de la file</h2>
        <div className="pilot-carrier"><div><b>À préparer</b><span>Commandes au statut prêt</span></div><strong>{readyCount}</strong></div>
        <div className="pilot-carrier"><div><b>Expédiées</b><span>Historique enregistré</span></div><strong>{shipped.length}</strong></div>
        <div className="pilot-carrier"><div><b>Avec suivi</b><span>Numéro transporteur renseigné</span></div><strong>{tracked}</strong></div>
        <div className="pilot-delivery-note"><Radio size={18} /><p><b>Suivi transporteur à connecter</b><span>Les délais et incidents ne seront affichés qu’après connexion d’une API logistique réelle.</span></p></div>
      </aside>
    </div>
  );
}

function EcommerceView({ data, toggleProduct, refreshData, syncing, lastSyncedAt }) {
  const onlineProducts = data.storefront.filter((product) => product.online);
  const catalogSales = data.storefront.reduce((sum, product) => sum + product.sales, 0);
  const averagePrice = data.storefront.length ? data.storefront.reduce((sum, product) => sum + product.price, 0) / data.storefront.length : 0;
  const blockedProducts = data.storefront.filter((product) => {
    const stock = data.inventory.find((item) => item.id === product.stockId);
    return product.online && (!stock || stock.stock - stock.reserved <= 0);
  });
  const linkedProducts = data.storefront.filter((product) => data.inventory.some((item) => item.id === product.stockId)).length;
  const bestProduct = [...data.storefront].filter((product) => product.conversionRate !== null).sort((a, b) => b.conversionRate - a.conversionRate)[0];
  return (
    <div className="pilot-view">
      <section className="pilot-store-banner"><div><span className="pilot-live-dot" />CATALOGUE CONNECTÉ</div><h2>tapote.fr</h2><p>Synchronisé {lastSyncedAt ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(lastSyncedAt) : "à l’ouverture"}</p><a href="/" target="_blank" rel="noreferrer">Voir le site <ExternalLink size={14} /></a></section>
      <section className="pilot-metrics pilot-store-metrics">
        <Metric label="Produits en ligne" value={`${onlineProducts.length}/${data.storefront.length}`} detail="publication Supabase" icon={Globe2} />
        <Metric label="Ventes cataloguées" value={catalogSales} detail="cumul par produit" icon={ShoppingCart} />
        <Metric label="Prix catalogue moyen" value={formatEuro(averagePrice)} detail="TTC" icon={CircleDollarSign} />
        <Metric label="Stocks bloquants" value={blockedProducts.length} detail={blockedProducts.length ? "publication à revoir" : "aucun blocage"} icon={AlertTriangle} />
      </section>
      <section className="pilot-store-grid">
        <div className="pilot-list-surface pilot-catalog-panel">
          <div className="pilot-list-toolbar"><div><span className="pilot-eyebrow">CATALOGUE</span><h2>Produits publiés</h2></div><button className="pilot-secondary" onClick={() => refreshData()} disabled={syncing}><RefreshCw className={syncing ? "is-spinning" : ""} size={15} />{syncing ? "Synchronisation…" : "Synchroniser"}</button></div>
          <div className="pilot-product-list">
            {data.storefront.map((product) => {
              const stock = data.inventory.find((item) => item.id === product.stockId);
              const available = stock ? stock.stock - stock.reserved : null;
              return <div key={product.id}><i><Store size={18} /></i><div><b>{product.name}</b><small>{formatEuro(product.price)} · {available === null ? "stock non lié" : `${available} disponible${available > 1 ? "s" : ""}`}</small></div><span>{product.sales} ventes<small>{product.conversion} conv.</small></span><label className="pilot-switch"><span className="sr-only">{product.online ? "Masquer" : "Publier"} {product.name}</span><input type="checkbox" checked={product.online} onChange={() => toggleProduct(product.id)} /><span /></label></div>;
            })}
            {!data.storefront.length && <div className="pilot-empty"><Store size={25} /><b>Catalogue vide</b><span>Ajoutez les produits dans Supabase avant leur publication.</span></div>}
          </div>
        </div>
        <aside className="pilot-surface pilot-funnel-panel">
          <span className="pilot-eyebrow">QUALITÉ CATALOGUE</span><h2>Couverture opérationnelle</h2>
          <div className="pilot-catalog-health"><div><span>Produits liés au stock</span><b>{linkedProducts}/{data.storefront.length}</b></div><div><span>Produits publiés</span><b>{onlineProducts.length}/{data.storefront.length}</b></div><div><span>Produits bloqués</span><b>{blockedProducts.length}</b></div></div>
          <div className="pilot-insight"><BadgeCheck size={17} /><p><b>{bestProduct ? "Meilleure conversion enregistrée" : "Analytics à connecter"}</b><span>{bestProduct ? `${bestProduct.name} · ${bestProduct.conversion} de conversion.` : "Ajoutez une source analytics réelle pour mesurer sessions, paniers et abandons."}</span></p></div>
        </aside>
      </section>
    </div>
  );
}

function OrderDrawer({ order, client, onClose, advanceOrder, onOpenClient }) {
  if (!order || !client) return null;
  const currentIndex = statusFlow.indexOf(order.status);
  return (
    <div className="pilot-drawer-layer" role="presentation">
      <button className="pilot-drawer-backdrop" onClick={onClose} aria-label="Fermer la fiche" />
      <aside className="pilot-order-drawer" role="dialog" aria-modal="true" aria-labelledby="pilot-order-title">
        <header><div><span>COMMANDE</span><h2 id="pilot-order-title">{order.id}</h2></div><button onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
        <div className="pilot-drawer-client"><span>{initials(client.name)}</span><div><b>{client.name}</b><small>{client.contact} · {client.email}</small></div><button onClick={() => onOpenClient(client.id)} aria-label={`Ouvrir le client ${client.name}`}><ExternalLink size={15} /></button></div>
        <div className="pilot-drawer-status"><StatusBadge status={order.status} /><span>Échéance <b>{order.due}</b></span></div>
        {order.sourceOrderId && <div className={`pilot-integration-state pilot-integration-${order.pilotStatus || "paid"}`}><Radio size={17} /><div><b>{order.pilotStatus === "active" ? "Pilot activé" : order.pilotStatus === "ready_for_activation" ? "Pilot prêt à activer" : "Commande web synchronisée"}</b><span>{order.pilotStatus === "active" ? "Le client dispose de son espace et de ses liens actifs." : "Le suivi tapote.fr → production → Pilot est relié automatiquement."}</span></div></div>}
        <section className="pilot-drawer-section"><span>DÉTAILS</span><dl><div><dt>Produit</dt><dd>{order.product}</dd></div><div><dt>Quantité</dt><dd>{order.quantity}</dd></div><div><dt>Destination</dt><dd>{order.destination}</dd></div><div><dt>Montant</dt><dd>{formatEuro(order.total)}</dd></div><div><dt>Responsable</dt><dd>{order.owner}</dd></div><div><dt>Canal</dt><dd>{order.channel}</dd></div></dl></section>
        <section className="pilot-drawer-section"><span>AVANCEMENT</span><div className="pilot-timeline">
          {statusFlow.map((status, index) => <div key={status} className={cx(index <= currentIndex && "is-done", index === currentIndex && "is-current")}><i>{index < currentIndex ? <Check size={12} /> : null}</i><p><b>{statusMeta[status].label}</b><small>{index < currentIndex ? "Terminé" : index === currentIndex ? "Étape actuelle" : "À venir"}</small></p></div>)}
        </div></section>
        <section className="pilot-drawer-note"><span>NOTE ATELIER</span><p>{order.note}</p></section>
        <footer>{!isClosedOrder(order) ? <button className="pilot-primary" onClick={() => advanceOrder(order.id)}>{statusMeta[order.status]?.action || "Étape suivante"}<ArrowRight size={16} /></button> : <button className="pilot-secondary" onClick={onClose}><CheckCircle2 size={16} />Commande {order.status === "cancelled" ? "annulée" : "terminée"}</button>}<button className="pilot-secondary" onClick={() => window.print()}><Download size={16} />Bon de production</button></footer>
      </aside>
    </div>
  );
}

function NewClientModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "", city: "", segment: "Restaurant" });
  const submit = (event) => { event.preventDefault(); onCreate(form); };
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><form className="pilot-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pilot-new-client-title">
      <header><div><span>NOUVEAU COMPTE</span><h2 id="pilot-new-client-title">Ajouter un client</h2><p>Le client sera disponible immédiatement pour les commandes.</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-form-grid"><label className="is-wide"><span>Entreprise</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label><span>Contact</span><input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /></label><label><span>Segment</span><select value={form.segment} onChange={(event) => setForm({ ...form, segment: event.target.value })}><option>Restaurant</option><option>Café</option><option>Salon</option><option>Beauté</option><option>Boutique</option><option>Autre</option></select></label><label><span>E-mail</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label><span>Téléphone</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label className="is-wide"><span>Ville</span><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label></div>
      <footer><button type="button" className="pilot-secondary" onClick={onClose}>Annuler</button><button className="pilot-primary" type="submit"><Plus size={16} />Créer le client</button></footer>
    </form></div>
  );
}

function NewInventoryModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ sku: "", name: "", category: "Support", stock: 0, threshold: 10 });
  const submit = (event) => { event.preventDefault(); onCreate(form); };
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><form className="pilot-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pilot-new-stock-title">
      <header><div><span>INVENTAIRE</span><h2 id="pilot-new-stock-title">Nouvelle référence</h2><p>Ajoute un composant, un support ou un emballage au stock central.</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-form-grid"><label><span>SKU</span><input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} placeholder="SUP-A6-CLR" required /></label><label><span>Catégorie</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Support</option><option>Électronique</option><option>Impression</option><option>Packaging</option><option>Autre</option></select></label><label className="is-wide"><span>Désignation</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label><span>Stock initial</span><input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required /></label><label><span>Seuil d’alerte</span><input type="number" min="0" value={form.threshold} onChange={(event) => setForm({ ...form, threshold: event.target.value })} required /></label></div>
      <footer><button type="button" className="pilot-secondary" onClick={onClose}>Annuler</button><button className="pilot-primary" type="submit"><Plus size={16} />Créer la référence</button></footer>
    </form></div>
  );
}

function NewEncodedProductModal({ clients, orders, onClose, onCreate }) {
  const [form, setForm] = useState({
    clientId: clients[0]?.id || "",
    orderId: "",
    supportType: "Comptoir A6",
    chipType: "NTAG213 · 38 mm",
    chipBatch: "",
    label: "",
    targetUrl: "https://",
    notes: "",
  });
  const updateOrder = (orderId) => {
    const order = orders.find((candidate) => (candidate.recordId || candidate.id) === orderId);
    setForm((current) => ({ ...current, orderId, clientId: order?.clientId || current.clientId }));
  };
  const submit = (event) => {
    event.preventDefault();
    onCreate(form);
  };
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><form className="pilot-modal pilot-encoding-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pilot-new-encoded-title">
      <header><div><span>CRÉATION PRODUIT</span><h2 id="pilot-new-encoded-title">Sérialiser un Tapote</h2><p>Une URL courte unique sera créée pour la puce NFC et le QR.</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-form-grid">
        <label><span>Client</span><select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}><option value="">Stock non affecté</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label><span>Commande liée</span><select value={form.orderId} onChange={(event) => updateOrder(event.target.value)}><option value="">Sans commande</option>{orders.filter((order) => !isClosedOrder(order)).map((order) => <option key={order.recordId || order.id} value={order.recordId || order.id}>{order.id} · {order.product}</option>)}</select></label>
        <label><span>Support</span><select value={form.supportType} onChange={(event) => setForm({ ...form, supportType: event.target.value })}><option>Comptoir A6</option><option>Plaque 12 × 12</option><option>Carte NFC</option><option>Vitrine NFC</option><option>Mini Comptoir</option></select></label>
        <label><span>Puce / antenne</span><select value={form.chipType} onChange={(event) => setForm({ ...form, chipType: event.target.value })}><option>NTAG213 · 38 mm</option><option>NTAG213 anti-métal · 38 mm</option></select></label>
        <label><span>Lot de puces</span><input value={form.chipBatch} onChange={(event) => setForm({ ...form, chipBatch: event.target.value })} placeholder="N213-2607-A" maxLength="80" /></label>
        <label><span>Nom atelier</span><input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Café Noma · Avis" minLength="2" maxLength="120" required /></label>
        <label className="is-wide"><span>Destination initiale HTTPS</span><input type="url" value={form.targetUrl} onChange={(event) => setForm({ ...form, targetUrl: event.target.value })} placeholder="https://g.page/.../review" pattern="https://.*" required /></label>
        <label className="is-wide"><span>Note atelier</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Position de pose, variante de visuel, consigne client…" maxLength="1200" rows="3" /></label>
      </div>
      <div className="pilot-encoding-rule"><SmartphoneNfc size={18} /><p><b>À écrire dans la puce :</b> uniquement l’URL courte Tapote générée. La destination ci-dessus restera modifiable dans Pilot.</p></div>
      <footer><button type="button" className="pilot-secondary" onClick={onClose}>Annuler</button><button className="pilot-primary" type="submit"><QrCode size={16} />Créer l’unité</button></footer>
    </form></div>
  );
}

function EncodingTestModal({ product, onClose, onValidate }) {
  const [tests, setTests] = useState({ iphone: false, android: false, qr: false });
  const complete = tests.iphone && tests.android && tests.qr;
  const submit = (event) => {
    event.preventDefault();
    if (complete) onValidate(tests);
  };
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><form className="pilot-modal pilot-test-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pilot-encoding-test-title">
      <header><div><span>CONTRÔLE CROISÉ</span><h2 id="pilot-encoding-test-title">Tester NFC + QR</h2><p>{product.serialNumber} · {product.label}</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-test-checklist">
        <label className={tests.iphone ? "is-checked" : ""}><input type="checkbox" checked={tests.iphone} onChange={(event) => setTests({ ...tests, iphone: event.target.checked })} /><SmartphoneNfc size={21} /><span><b>Lecture iPhone</b><small>Depuis l’écran verrouillé, au point NFC indiqué.</small></span><CheckCircle2 size={18} /></label>
        <label className={tests.android ? "is-checked" : ""}><input type="checkbox" checked={tests.android} onChange={(event) => setTests({ ...tests, android: event.target.checked })} /><SmartphoneNfc size={21} /><span><b>Lecture Android</b><small>NFC activé, sans application spécifique.</small></span><CheckCircle2 size={18} /></label>
        <label className={tests.qr ? "is-checked" : ""}><input type="checkbox" checked={tests.qr} onChange={(event) => setTests({ ...tests, qr: event.target.checked })} /><QrCode size={21} /><span><b>Scan du QR imprimé</b><small>Même destination, contraste et distance réels.</small></span><CheckCircle2 size={18} /></label>
      </div>
      <p className="pilot-form-help"><AlertTriangle size={16} /> Ne verrouille la puce en lecture seule qu’après ces trois contrôles.</p>
      <footer><button type="button" className="pilot-secondary" onClick={onClose}>Annuler</button><button className="pilot-primary" type="submit" disabled={!complete}><ClipboardCheck size={16} />Valider les trois tests</button></footer>
    </form></div>
  );
}

function NewOrderModal({ clients, onClose, onCreate }) {
  const [today] = useState(() => Date.now());
  const [form, setForm] = useState({ clientId: clients[0]?.id || "", product: "Comptoir A6", quantity: 1, due: dateInputValue(today, 3), channel: "Boutique", destination: "Avis Google" });
  const total = (productPrices[form.product] || 0) * Number(form.quantity);
  const submit = (event) => { event.preventDefault(); onCreate({ ...form, quantity: Number(form.quantity), total }); };
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><form className="pilot-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pilot-new-order-title">
      <header><div><span>NOUVELLE VENTE</span><h2 id="pilot-new-order-title">Créer une commande</h2><p>Elle sera ajoutée à la file opérationnelle immédiatement.</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-form-grid"><label><span>Client</span><select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label><span>Canal</span><select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}><option>Boutique</option><option>Devis</option><option>Téléphone</option></select></label><label className="is-wide"><span>Produit</span><select value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })}>{Object.keys(productPrices).map((product) => <option key={product}>{product}</option>)}</select></label><label><span>Quantité</span><input type="number" min="1" max="50" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label><span>Échéance</span><input type="date" min={dateInputValue(today)} value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} required /></label><label className="is-wide"><span>Destination programmée</span><select value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })}><option>Avis Google</option><option>Menu</option><option>Réservation</option><option>Instagram</option><option>Fidélité</option></select></label></div>
      <div className="pilot-order-total"><span>Total TTC</span><strong>{formatEuro(total)}</strong></div>
      <footer><button type="button" className="pilot-secondary" onClick={onClose}>Annuler</button><button className="pilot-primary" type="submit"><Plus size={16} />Créer la commande</button></footer>
    </form></div>
  );
}

function ShipmentModal({ order, client, onClose, onShip }) {
  const [tracking, setTracking] = useState("");
  const submit = (event) => { event.preventDefault(); onShip(tracking.trim()); };
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><form className="pilot-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pilot-shipment-title">
      <header><div><span>EXPÉDITION</span><h2 id="pilot-shipment-title">Confirmer la remise transporteur</h2><p>{order.id} · {client?.name}</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-form-grid pilot-form-single"><label><span>Numéro de suivi réel</span><input autoFocus value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Ex. 6A12345678901" minLength="5" maxLength="80" required /></label><p className="pilot-form-help"><Truck size={16} /> Le statut expédié et la date de remise seront enregistrés ensemble dans Supabase.</p></div>
      <footer><button type="button" className="pilot-secondary" onClick={onClose}>Annuler</button><button className="pilot-primary" type="submit"><Truck size={16} />Marquer expédiée</button></footer>
    </form></div>
  );
}

function StockReceiptModal({ item, suggestedQuantity, onClose, onReceive }) {
  const [quantity, setQuantity] = useState(suggestedQuantity || 1);
  const submit = (event) => { event.preventDefault(); onReceive(Number(quantity)); };
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><form className="pilot-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pilot-stock-receipt-title">
      <header><div><span>RÉCEPTION FOURNISSEUR</span><h2 id="pilot-stock-receipt-title">Réceptionner le stock</h2><p>{item.name} · {item.sku}</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-form-grid pilot-form-single"><label><span>Quantité réellement reçue</span><input autoFocus type="number" min="1" max="100000" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label><div className="pilot-stock-receipt-summary"><span>Stock actuel <b>{item.stock}</b></span><ArrowRight size={17} /><span>Nouveau stock <b>{item.stock + Number(quantity || 0)}</b></span></div><p className="pilot-form-help"><Boxes size={16} /> La quantité entrante sera diminuée automatiquement, sans jamais passer sous zéro.</p></div>
      <footer><button type="button" className="pilot-secondary" onClick={onClose}>Annuler</button><button className="pilot-primary" type="submit"><PackageCheck size={16} />Confirmer la réception</button></footer>
    </form></div>
  );
}

function SettingsModal({ access, settings, onClose, onSync, onSignOut, syncing, lastSyncedAt }) {
  const roleLabel = { owner: "Owner · administration complète", admin: "Administration", manager: "Gestion opérationnelle" }[access.role] || access.role;
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><section className="pilot-modal pilot-settings-modal" role="dialog" aria-modal="true" aria-labelledby="pilot-settings-title">
      <header><div><span>ESPACE PRIVÉ</span><h2 id="pilot-settings-title">Réglages & connexions</h2><p>État du compte et paramètres opérationnels actifs.</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-settings-body">
        <div className="pilot-settings-identity"><img src="/brand/tapote-logo.svg" alt="tapote." /><span>GESTION</span></div>
        <dl className="pilot-settings-list">
          <div><dt>Organisation</dt><dd>{access.organizationName}</dd></div>
          <div><dt>Compte</dt><dd>{access.email}</dd></div>
          <div><dt>Rôle</dt><dd>{roleLabel}</dd></div>
          <div><dt>Préfixe commandes</dt><dd>{settings?.orderPrefix || "TPT"}</dd></div>
          <div><dt>Cut-off expédition</dt><dd>{settings?.shippingCutoff || "16:00"}</dd></div>
          <div><dt>Fuseau horaire</dt><dd>{settings?.timezone || "Europe/Paris"}</dd></div>
        </dl>
        <div className="pilot-connection-state"><Radio size={18} /><div><b>Supabase & Realtime connectés</b><span>Dernière synchronisation {lastSyncedAt ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(lastSyncedAt) : "à l’ouverture"}</span></div></div>
      </div>
      <footer><button type="button" className="pilot-secondary pilot-danger-button" onClick={onSignOut}><LogOut size={16} />Se déconnecter</button><button type="button" className="pilot-primary" onClick={onSync} disabled={syncing}><RefreshCw className={syncing ? "is-spinning" : ""} size={16} />{syncing ? "Synchronisation…" : "Synchroniser maintenant"}</button></footer>
    </section></div>
  );
}

export default function TapoteManagementApp() {
  const [referenceTime] = useState(() => Date.now());
  const [view, setView] = useState("dashboard");
  const [data, setData] = useState(() => import.meta.env.MODE === "test" ? initialData : { clients: [], orders: [], inventory: [], storefront: [], activity: [], encodedProducts: [], settings: null });
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authState, setAuthState] = useState(isManagementConfigured ? "loading" : "configuration");
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [access, setAccess] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newInventoryOpen, setNewInventoryOpen] = useState(false);
  const [newEncodedProductOpen, setNewEncodedProductOpen] = useState(false);
  const [encodingTestProduct, setEncodingTestProduct] = useState(null);
  const [shippingOrder, setShippingOrder] = useState(null);
  const [stockReceipt, setStockReceipt] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "TAPOTE · Gestion interne";
    document.body.classList.add("pilot-body");
    return () => {
      document.title = previousTitle;
      document.body.classList.remove("pilot-body");
    };
  }, []);
  useEffect(() => {
    if (!isManagementConfigured) return undefined;
    let active = true;
    getManagementSession()
      .then((currentSession) => {
        if (!active) return;
        setSession(currentSession);
        setSessionReady(true);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setSessionReady(true);
        setAuthState("signedOut");
      });
    const unsubscribe = onManagementAuthChange((nextSession, event) => {
      if (!active) return;
      setSession(nextSession);
      setSessionReady(true);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!sessionReady) return undefined;
    let active = true;
    Promise.resolve().then(async () => {
      if (!session) {
        if (active) {
          setAccess(null);
          setAuthState("signedOut");
        }
        return;
      }
      if (active) setAuthState("loading");
      try {
        const nextAccess = await getManagementAccess(session.user);
        if (!active) return;
        if (!nextAccess) {
          setAccess(null);
          setAuthState("unauthorized");
          return;
        }
        const workspace = await loadManagementData(nextAccess.organizationId);
        if (!active) return;
        setAccess(nextAccess);
        setData(workspace);
        setLastSyncedAt(new Date());
        setSelectedClient((current) => current || workspace.clients[0]?.id || null);
        setAuthState("ready");
      } catch (error) {
        if (!active) return;
        setToast(toUserMessage(error, "Impossible de charger les données Supabase."));
        setAuthState("error");
      }
    });
    return () => { active = false; };
  }, [session, sessionReady]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!selectedOrder && !newOrderOpen && !newClientOpen && !newInventoryOpen && !newEncodedProductOpen && !encodingTestProduct && !shippingOrder && !stockReceipt && !settingsOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setSelectedOrder(null);
      setNewOrderOpen(false);
      setNewClientOpen(false);
      setNewInventoryOpen(false);
      setNewEncodedProductOpen(false);
      setEncodingTestProduct(null);
      setShippingOrder(null);
      setStockReceipt(null);
      setSettingsOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [encodingTestProduct, newClientOpen, newEncodedProductOpen, newInventoryOpen, newOrderOpen, selectedOrder, settingsOpen, shippingOrder, stockReceipt]);

  const refreshData = useCallback(async ({ quiet = false } = {}) => {
    if (!access) return;
    if (!quiet) setSyncing(true);
    try {
      const workspace = await loadManagementData(access.organizationId);
      setData(workspace);
      setLastSyncedAt(new Date());
      setSelectedClient((current) => current || workspace.clients[0]?.id || null);
    } catch (error) {
      setToast(toUserMessage(error, "Synchronisation impossible."));
    } finally {
      if (!quiet) setSyncing(false);
    }
  }, [access]);

  useEffect(() => {
    if (!access || authState !== "ready") return undefined;
    let timer;
    const unsubscribe = subscribeToManagement(access.organizationId, () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => refreshData({ quiet: true }), 220);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [access, authState, refreshData]);

  const clientMap = useMemo(() => Object.fromEntries(data.clients.map((client) => [client.id, client])), [data.clients]);
  const navCounts = useMemo(() => ({
    orders: data.orders.filter((item) => !isClosedOrder(item)).length,
    production: data.orders.filter((item) => ["bat", "supply", "assembly", "quality"].includes(item.status)).length,
    encoding: (data.encodedProducts || []).filter((item) => ["draft", "encoded"].includes(item.status)).length,
    shipping: data.orders.filter((item) => item.status === "ready").length,
    stockAlerts: data.inventory.filter((item) => item.stock - item.reserved <= item.threshold).length,
  }), [data.encodedProducts, data.inventory, data.orders]);
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const orders = data.orders.filter((item) => `${item.id} ${item.product} ${clientMap[item.clientId]?.name}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, kind: "order", label: "Commande", title: `${item.id} · ${clientMap[item.clientId]?.name || "Client"}`, subtitle: `${item.product} · ${statusMeta[item.status]?.label || item.status}` }));
    const clients = data.clients.filter((item) => `${item.name} ${item.contact} ${item.city} ${item.segment}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, kind: "client", label: "Client", title: item.name, subtitle: `${item.contact} · ${item.city}` }));
    const stocks = data.inventory.filter((item) => `${item.sku} ${item.name} ${item.category}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, kind: "stock", label: "Stock", title: item.name, subtitle: `${item.stock - item.reserved} disponible${item.stock - item.reserved > 1 ? "s" : ""} · ${item.sku}` }));
    return [...orders, ...clients, ...stocks].slice(0, 7);
  }, [clientMap, data.clients, data.inventory, data.orders, search]);
  const operationalAlerts = useMemo(() => {
    const ready = data.orders.filter((item) => item.status === "ready");
    const lowStock = data.inventory.filter((item) => item.stock - item.reserved <= item.threshold);
    const bat = data.orders.filter((item) => item.status === "bat");
    return [
      ready.length > 0 && { id: "shipping", icon: "shipping", tone: "green", view: "shipping", title: `${ready.length} colis prêt${ready.length > 1 ? "s" : ""} à expédier`, detail: "À remettre au transporteur avant 16 h" },
      lowStock.length > 0 && { id: "stock", icon: "stock", tone: "orange", view: "supply", title: `${lowStock.length} alertes de stock`, detail: `${lowStock[0].name} est sous son seuil de sécurité` },
      bat.length > 0 && { id: "bat", icon: "bat", tone: "blue", view: "production", title: `${bat.length} BAT en attente`, detail: "Validation nécessaire avant lancement atelier" },
    ].filter(Boolean);
  }, [data.inventory, data.orders]);
  const order = data.orders.find((item) => item.id === selectedOrder);

  const showToast = (message) => setToast(message);
  const navigate = (nextView) => { setView(nextView); setSearch(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openOrder = (orderId) => setSelectedOrder(orderId);
  const openSearchResult = (result) => {
    setSearch("");
    if (result.kind === "order") {
      setView("orders");
      setSelectedOrder(result.id);
      return;
    }
    if (result.kind === "client") {
      setSelectedClient(result.id);
      setView("clients");
      return;
    }
    setView("supply");
  };
  const advanceOrder = async (orderId, trackingNumber = "") => {
    const currentOrder = data.orders.find((item) => item.id === orderId);
    if (!currentOrder || !access) return;
    const index = statusFlow.indexOf(currentOrder.status);
    if (index < 0 || isClosedOrder(currentOrder)) {
      showToast("Cette commande ne peut plus avancer dans le flux.");
      return;
    }
    const nextStatus = statusFlow[Math.min(index + 1, statusFlow.length - 1)];
    if (nextStatus === "shipped" && !trackingNumber) {
      setShippingOrder(orderId);
      return;
    }
    const tracking = nextStatus === "shipped" ? trackingNumber : currentOrder.tracking;
    setSyncing(true);
    try {
      const updated = await updateManagementOrderStatus(access.organizationId, currentOrder, nextStatus, tracking);
      setData((current) => ({ ...current, orders: current.orders.map((item) => item.id === orderId ? updated : item) }));
      setShippingOrder(null);
      showToast(`Commande ${orderId} mise à jour dans Supabase.`);
    } catch (error) {
      showToast(toUserMessage(error, `Impossible de mettre à jour ${orderId}.`));
      await refreshData({ quiet: true });
    } finally {
      setSyncing(false);
    }
  };
  const createOrder = async (form) => {
    if (!access) return;
    setSyncing(true);
    try {
      const created = await createManagementOrder(access.organizationId, form, access.displayName);
      await refreshData({ quiet: true });
      setNewOrderOpen(false);
      setSelectedOrder(created.id);
      showToast(`${created.id} a été créée dans Supabase.`);
    } catch (error) {
      showToast(toUserMessage(error, "La commande n’a pas pu être créée."));
    } finally {
      setSyncing(false);
    }
  };
  const createClient = async (form) => {
    if (!access) return;
    setSyncing(true);
    try {
      const clientId = await createManagementClient(access.organizationId, form);
      await refreshData({ quiet: true });
      setNewClientOpen(false);
      setSelectedClient(clientId);
      setView("clients");
      showToast(`${form.name} a été ajouté aux clients.`);
    } catch (error) {
      showToast(toUserMessage(error, "Le client n’a pas pu être créé."));
    } finally {
      setSyncing(false);
    }
  };
  const createInventory = async (form) => {
    if (!access) return;
    setSyncing(true);
    try {
      const created = await createManagementInventoryItem(access.organizationId, form);
      setData((current) => ({ ...current, inventory: [...current.inventory, created].sort((a, b) => a.name.localeCompare(b.name, "fr")) }));
      setNewInventoryOpen(false);
      showToast(`${created.name} a été ajouté au stock.`);
    } catch (error) {
      showToast(toUserMessage(error, "La référence n’a pas pu être créée."));
    } finally {
      setSyncing(false);
    }
  };
  const receiveStock = async (stockId, amount) => {
    const item = data.inventory.find((candidate) => candidate.id === stockId);
    if (!item || !access) return;
    setSyncing(true);
    try {
      const updated = await receiveManagementStock(access.organizationId, item, amount);
      setData((current) => ({ ...current, inventory: current.inventory.map((candidate) => candidate.id === stockId ? updated : candidate) }));
      setStockReceipt(null);
      showToast(`${amount} unités ajoutées dans Supabase.`);
    } catch (error) {
      showToast(toUserMessage(error, "La réception n’a pas pu être enregistrée."));
    } finally {
      setSyncing(false);
    }
  };
  const requestStockReceipt = (stockId, suggestedQuantity) => setStockReceipt({ stockId, suggestedQuantity });
  const markShipped = (orderId) => advanceOrder(orderId);
  const createEncodedProduct = async (form) => {
    if (!access) return;
    setSyncing(true);
    try {
      await createManagementEncodedProduct(access.organizationId, form);
      await refreshData({ quiet: true });
      setNewEncodedProductOpen(false);
      setView("encoding");
      showToast("Produit sérialisé. L’URL courte est prête à encoder.");
    } catch (error) {
      showToast(toUserMessage(error, "Le produit NFC n’a pas pu être créé."));
    } finally {
      setSyncing(false);
    }
  };
  const advanceEncodedProduct = async (product, nextStatus, tests = {}) => {
    if (!access) return;
    setSyncing(true);
    try {
      await advanceManagementEncodedProduct(access.organizationId, product, nextStatus, tests);
      await refreshData({ quiet: true });
      setEncodingTestProduct(null);
      const message = { encoded: "Encodage enregistré.", tested: "Tests iPhone, Android et QR validés.", locked: "Fiche atelier verrouillée.", assigned: "Produit affecté au client." }[nextStatus];
      showToast(message || "Produit mis à jour.");
    } catch (error) {
      showToast(toUserMessage(error, "L’étape d’encodage n’a pas pu être validée."));
      await refreshData({ quiet: true });
    } finally {
      setSyncing(false);
    }
  };
  const toggleProduct = async (productId) => {
    const nextOnline = !data.storefront.find((product) => product.id === productId)?.online;
    if (!access) return;
    setSyncing(true);
    try {
      await setStorefrontProductOnline(access.organizationId, productId, nextOnline);
      setData((current) => ({ ...current, storefront: current.storefront.map((product) => product.id === productId ? { ...product, online: nextOnline } : product) }));
      showToast(nextOnline ? "Produit publié sur la boutique." : "Produit masqué de la boutique.");
    } catch (error) {
      showToast(toUserMessage(error, "Le catalogue n’a pas pu être mis à jour."));
    } finally {
      setSyncing(false);
    }
  };
  const exportOrders = () => {
    const header = "Commande,Client,Produit,Quantité,Montant,Statut,Échéance";
    const rows = data.orders.map((item) => [item.id, clientMap[item.clientId]?.name, item.product, item.quantity, item.total, statusMeta[item.status].label, item.due].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "commandes-tapote.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Export CSV généré.");
  };

  if (passwordRecovery && session) {
    return <ManagementPasswordSetup onComplete={() => setPasswordRecovery(false)} />;
  }
  if (authState === "configuration") {
    return <main className="management-state"><Brand /><AlertTriangle size={30} /><h1>Configuration Supabase requise</h1><p>Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY à l’environnement de déploiement.</p></main>;
  }
  if (authState === "loading") {
    return <main className="management-state"><Brand /><LoaderCircle className="is-spinning" size={32} /><h1>Ouverture de l’espace privé</h1><p>Vérification du compte et synchronisation Supabase…</p></main>;
  }
  if (authState === "signedOut" || authState === "unauthorized") {
    return <ManagementAuth unauthorized={authState === "unauthorized"} />;
  }
  if (authState === "error" || !access) {
    return <main className="management-state"><Brand /><AlertTriangle size={30} /><h1>Chargement impossible</h1><p>La connexion est valide, mais les données Gestion ne sont pas disponibles.</p><button className="pilot-primary" onClick={() => window.location.reload()}>Réessayer</button></main>;
  }

  const viewProps = { data, clientMap, search, openOrder, advanceOrder, showToast, referenceTime };
  return (
    <div className="pilot-app">
      <a className="pilot-skip" href="#pilot-main">Aller au contenu</a>
      <Sidebar currentView={view} onNavigate={navigate} open={navOpen} onClose={() => setNavOpen(false)} openSettings={() => setSettingsOpen(true)} counts={navCounts} access={access} onSignOut={async () => { await signOutManager(); setAuthState("signedOut"); }} />
      <div className="pilot-workspace" aria-busy={syncing}>
        <Topbar view={view} search={search} setSearch={setSearch} onMenu={() => setNavOpen(true)} onNewOrder={() => { if (data.clients.length) setNewOrderOpen(true); else showToast("Ajoute d’abord un client à l’espace Gestion."); }} searchResults={searchResults} onSearchResult={openSearchResult} alerts={operationalAlerts} onAlertAction={(alert) => { setView(alert.view); setSearch(""); }} referenceTime={referenceTime} />
        <main id="pilot-main">
          {view === "dashboard" && <DashboardView {...viewProps} onNavigate={navigate} onNewClient={() => setNewClientOpen(true)} onNewInventory={() => setNewInventoryOpen(true)} />}
          {view === "orders" && <OrdersView {...viewProps} exportOrders={exportOrders} />}
          {view === "clients" && <ClientsView {...viewProps} selectedClient={selectedClient} setSelectedClient={setSelectedClient} clientOrders={(id) => data.orders.filter((item) => item.clientId === id)} onNewClient={() => setNewClientOpen(true)} />}
          {view === "production" && <ProductionView {...viewProps} />}
          {view === "encoding" && <EncodingView {...viewProps} onCreate={() => setNewEncodedProductOpen(true)} onAdvance={advanceEncodedProduct} onTest={setEncodingTestProduct} />}
          {view === "supply" && <SupplyView {...viewProps} adjustStock={requestStockReceipt} onNewInventory={() => setNewInventoryOpen(true)} />}
          {view === "shipping" && <ShippingView {...viewProps} markShipped={markShipped} />}
          {view === "ecommerce" && <EcommerceView {...viewProps} toggleProduct={toggleProduct} refreshData={refreshData} syncing={syncing} lastSyncedAt={lastSyncedAt} />}
        </main>
      </div>
      <OrderDrawer order={order} client={order ? clientMap[order.clientId] : null} onClose={() => setSelectedOrder(null)} advanceOrder={advanceOrder} onOpenClient={(clientId) => { setSelectedOrder(null); setSelectedClient(clientId); setView("clients"); }} />
      {newOrderOpen && <NewOrderModal clients={data.clients} onClose={() => setNewOrderOpen(false)} onCreate={createOrder} />}
      {newClientOpen && <NewClientModal onClose={() => setNewClientOpen(false)} onCreate={createClient} />}
      {newInventoryOpen && <NewInventoryModal onClose={() => setNewInventoryOpen(false)} onCreate={createInventory} />}
      {newEncodedProductOpen && <NewEncodedProductModal clients={data.clients} orders={data.orders} onClose={() => setNewEncodedProductOpen(false)} onCreate={createEncodedProduct} />}
      {encodingTestProduct && <EncodingTestModal product={encodingTestProduct} onClose={() => setEncodingTestProduct(null)} onValidate={(tests) => advanceEncodedProduct(encodingTestProduct, "tested", tests)} />}
      {shippingOrder && <ShipmentModal order={data.orders.find((item) => item.id === shippingOrder)} client={clientMap[data.orders.find((item) => item.id === shippingOrder)?.clientId]} onClose={() => setShippingOrder(null)} onShip={(tracking) => advanceOrder(shippingOrder, tracking)} />}
      {stockReceipt && data.inventory.some((item) => item.id === stockReceipt.stockId) && <StockReceiptModal item={data.inventory.find((item) => item.id === stockReceipt.stockId)} suggestedQuantity={stockReceipt.suggestedQuantity} onClose={() => setStockReceipt(null)} onReceive={(quantity) => receiveStock(stockReceipt.stockId, quantity)} />}
      {settingsOpen && <SettingsModal access={access} settings={data.settings} onClose={() => setSettingsOpen(false)} onSync={() => refreshData()} syncing={syncing} lastSyncedAt={lastSyncedAt} onSignOut={async () => { await signOutManager(); setSettingsOpen(false); setAuthState("signedOut"); }} />}
      <div className={cx("pilot-sync-status", syncing && "is-visible")} aria-hidden={!syncing}><LoaderCircle className="is-spinning" size={15} />Synchronisation Supabase</div>
      <div className={cx("pilot-toast", toast && "is-visible")} role="status"><CheckCircle2 size={17} />{toast}</div>
    </div>
  );
}
