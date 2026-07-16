import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
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
  RefreshCw,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  UserRound,
  UsersRound,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import ManagementAuth from "./management/ManagementAuth.jsx";
import {
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
};

const productPrices = {
  "Comptoir A6": 59,
  "Pack Restaurant ×6": 249,
  "Carte NFC": 29,
  "Sticker NFC": 35,
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
    { id: "s2", sku: "NFC-NTAG215", name: "Puce NFC NTAG215", category: "Électronique", stock: 42, reserved: 13, threshold: 25, incoming: 100, eta: "24 juil." },
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
  dashboard: ["Vue d’ensemble", "Jeudi 16 juillet · activité en temps réel"],
  orders: ["Commandes", "Suivre les ventes de la validation jusqu’à la livraison"],
  clients: ["Clients", "Historique, valeur et prochaine action par compte"],
  production: ["Assemblage", "Piloter la file atelier et les contrôles qualité"],
  supply: ["Supply & stocks", "Anticiper les ruptures et les réceptions fournisseurs"],
  shipping: ["Expéditions", "Préparer les colis et suivre les livraisons"],
  ecommerce: ["Site e-commerce", "Gérer la disponibilité et la performance de la boutique"],
};

function formatEuro(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function cx(...names) {
  return names.filter(Boolean).join(" ");
}

function StatusBadge({ status, label }) {
  const meta = statusMeta[status] || { label: label || status, tone: "dark" };
  return <span className={`pilot-status pilot-status-${meta.tone}`}><i />{label || meta.label}</span>;
}

function Brand() {
  return (
    <a className="pilot-brand" href="/gestion" aria-label="Tapote Gestion, accueil">
      <span className="pilot-brand-mark"><Sparkles size={15} fill="currentColor" /></span>
      <span><b>tapote.</b><small>GESTION</small></span>
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

function Topbar({ view, search, setSearch, onMenu, onNewOrder, searchResults, onSearchResult, alerts, onAlertAction }) {
  const [title, subtitle] = viewTitles[view];
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

function MiniBars() {
  const bars = [28, 42, 34, 61, 45, 72, 54, 83, 62, 76, 91, 68, 88, 96];
  return <div className="pilot-mini-bars" aria-label="Commandes sur les 14 derniers jours">{bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>;
}

function DashboardView({ data, clientMap, onNavigate, openOrder }) {
  const activeOrders = data.orders.filter((order) => order.status !== "shipped");
  const revenue = data.orders.reduce((sum, order) => sum + order.total, 0);
  const ready = data.orders.filter((order) => order.status === "ready").length;
  const lowStock = data.inventory.filter((item) => item.stock - item.reserved <= item.threshold).length;
  const urgent = activeOrders.filter((order) => order.priority === "Haute" || order.status === "ready").slice(0, 4);
  const productionCounts = statusFlow.slice(1, 6).map((status) => [status, data.orders.filter((order) => order.status === status).length]);
  return (
    <div className="pilot-view pilot-dashboard-view">
      <section className="pilot-metrics" aria-label="Indicateurs principaux">
        <Metric label="CA encaissé" value={formatEuro(revenue)} detail="12,4 % ce mois" trend icon={CircleDollarSign} />
        <Metric label="Commandes actives" value={activeOrders.length} detail="2 prioritaires" icon={ShoppingCart} />
        <Metric label="Prêtes à expédier" value={ready} detail="avant 16 h" icon={PackageCheck} />
        <Metric label="Alertes stock" value={lowStock} detail="1 rupture possible" icon={AlertTriangle} />
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
          </div>
          <div className="pilot-quick-note"><Zap size={17} fill="currentColor" /><span><b>Rythme du jour</b> 3 commandes doivent quitter l’atelier avant vendredi.</span></div>
        </div>

        <div className="pilot-surface pilot-sales-panel">
          <div className="pilot-section-head"><div><span>14 DERNIERS JOURS</span><h2>Ventes boutique</h2></div><button aria-label="Ouvrir les options"><ChevronDown size={17} /></button></div>
          <div className="pilot-sales-number"><strong>{formatEuro(1127)}</strong><span><ArrowUpRight size={14} /> +18,2 %</span></div>
          <MiniBars />
          <div className="pilot-chart-legend"><span>03 juil.</span><span>Aujourd’hui</span></div>
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
    const matchesFilter = filter === "all" || (filter === "active" && order.status !== "shipped") || order.status === filter;
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
        </div>
      </section>
      {selected && <section className="pilot-surface pilot-client-profile">
        <div className="pilot-profile-hero"><span>{initials(selected.name)}</span><div><small>CLIENT DEPUIS LE {selected.joined.toUpperCase()}</small><h2>{selected.name}</h2><p>{selected.segment} · {selected.city}</p></div><StatusBadge status="quality" label={selected.health} /></div>
        <div className="pilot-profile-metrics"><div><span>CA total</span><strong>{formatEuro(selected.revenue)}</strong></div><div><span>Commandes</span><strong>{selected.orders}</strong></div><div><span>Panier moyen</span><strong>{formatEuro(selected.orders ? Math.round(selected.revenue / selected.orders) : 0)}</strong></div></div>
        <div className="pilot-profile-grid">
          <div><span>CONTACT PRINCIPAL</span><b>{selected.contact}</b><a href={`mailto:${selected.email}`}>{selected.email}</a><a href={`tel:${selected.phone.replaceAll(" ", "")}`}>{selected.phone}</a></div>
          <div><span>PROCHAINE ACTION</span><b>{orders.some((order) => order.status !== "shipped") ? "Suivre la commande active" : "Relancer dans 30 jours"}</b><p>{orders.some((order) => order.status !== "shipped") ? "Une production est actuellement en cours." : "Aucune commande active pour ce client."}</p></div>
        </div>
        <div className="pilot-profile-orders"><div className="pilot-section-head"><div><span>HISTORIQUE</span><h3>Dernières commandes</h3></div></div>{orders.map((order) => <div key={order.id}><b>{order.id}</b><span>{order.product}</span><StatusBadge status={order.status} /><strong>{formatEuro(order.total)}</strong></div>)}</div>
      </section>}
    </div>
  );
}

function ProductionView({ data, clientMap, openOrder, advanceOrder }) {
  const stages = ["bat", "assembly", "quality", "ready"];
  return (
    <div className="pilot-view">
      <div className="pilot-production-summary"><div><Gauge size={18} /><span>Charge atelier</span><b>68 %</b><i><em style={{ width: "68%" }} /></i></div><div><Clock3 size={18} /><span>Délai moyen</span><b>2,4 jours</b></div><div><BadgeCheck size={18} /><span>Qualité semaine</span><b>98,2 %</b></div></div>
      <section className="pilot-board">
        {stages.map((status) => {
          const orders = data.orders.filter((order) => order.status === status);
          return <div className="pilot-board-column" key={status}>
            <header><div><i className={`pilot-stage-dot pilot-stage-${status}`} /><b>{statusMeta[status].label}</b><span>{orders.length}</span></div><button aria-label="Options"><ChevronDown size={15} /></button></header>
            <div className="pilot-board-stack">
              {orders.map((order) => <article key={order.id} className={cx(order.priority === "Haute" && "is-priority")}>
                <button className="pilot-board-main" onClick={() => openOrder(order.id)}><span><b>{order.id}</b>{order.priority === "Haute" && <em>URGENT</em>}</span><h3>{clientMap[order.clientId]?.name}</h3><p>{order.product}</p><small><CalendarDays size={13} /> Échéance {order.due}</small></button>
                <div className="pilot-board-progress"><span>{status === "bat" ? "Fichiers reçus" : status === "assembly" ? "Éléments assemblés" : status === "quality" ? "Points vérifiés" : "Colis préparé"}</span><b>{status === "bat" ? "1/2" : status === "assembly" ? "4/6" : status === "quality" ? "5/6" : "100 %"}</b></div>
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
            return <tr key={item.id}><td><div className="pilot-stock-name"><i><Boxes size={17} /></i><div><b>{item.name}</b><small>{item.sku} · {item.category}</small></div></div></td><td><b>{item.stock}</b></td><td><span>{item.reserved}</span></td><td><b className={cx(low && "pilot-urgent-text")}>{available}</b><small>{low ? "Sous le seuil" : "Disponible"}</small></td><td>{item.threshold}</td><td><b>{item.eta}</b><small>{item.incoming ? `+${item.incoming} unités` : "Non planifiée"}</small></td><td><button className="pilot-table-action" onClick={() => adjustStock(item.id, 10)}>+10</button></td></tr>;
          })}
        </tbody></table></div>
      </section>
    </div>
  );
}

function ShippingView({ data, clientMap, markShipped, openOrder }) {
  const shipments = data.orders.filter((order) => ["ready", "shipped"].includes(order.status));
  return (
    <div className="pilot-view pilot-shipping-layout">
      <section className="pilot-surface pilot-shipping-queue">
        <div className="pilot-section-head"><div><span>FILE D’EXPÉDITION</span><h2>Colis à traiter</h2></div><span className="pilot-cutoff"><Clock3 size={14} /> Collecte à 16:00</span></div>
        {shipments.map((order) => <article key={order.id} className="pilot-shipment-row">
          <button className="pilot-shipment-main" onClick={() => openOrder(order.id)}><i>{order.status === "shipped" ? <Truck /> : <PackageOpen />}</i><div><span>{order.id}</span><h3>{clientMap[order.clientId]?.name}</h3><p>{order.product} · {clientMap[order.clientId]?.city}</p></div></button>
          <div className="pilot-shipment-state"><StatusBadge status={order.status} />{order.tracking && <small>{order.tracking}</small>}</div>
          {order.status === "ready" ? <button className="pilot-primary" onClick={() => markShipped(order.id)}><Truck size={16} />Expédier</button> : <button className="pilot-secondary" onClick={() => openOrder(order.id)}>Suivre <ExternalLink size={14} /></button>}
        </article>)}
      </section>
      <aside className="pilot-surface pilot-shipping-aside">
        <span className="pilot-eyebrow">TRANSPORTEURS</span><h2>Performance 30 jours</h2>
        <div className="pilot-carrier"><div><b>La Poste</b><span>18 colis</span></div><strong>96 %<small> à l’heure</small></strong></div>
        <div className="pilot-carrier"><div><b>Chronopost</b><span>7 colis</span></div><strong>98 %<small> à l’heure</small></strong></div>
        <div className="pilot-delivery-note"><CheckCircle2 size={18} /><p><b>Aucun incident ouvert</b><span>Tous les colis expédiés sont en mouvement.</span></p></div>
      </aside>
    </div>
  );
}

function EcommerceView({ data, toggleProduct, showToast }) {
  return (
    <div className="pilot-view">
      <section className="pilot-store-banner"><div><span className="pilot-live-dot" />BOUTIQUE EN LIGNE</div><h2>tapote.fr</h2><p>Dernière publication aujourd’hui à 09:42</p><a href="/" target="_blank" rel="noreferrer">Voir le site <ExternalLink size={14} /></a></section>
      <section className="pilot-metrics pilot-store-metrics">
        <Metric label="Sessions" value="1 842" detail="8,4 % ce mois" trend icon={Activity} />
        <Metric label="Taux de conversion" value="3,8 %" detail="+0,6 point" trend icon={Gauge} />
        <Metric label="Panier moyen" value="74 €" detail="stable" icon={ShoppingCart} />
        <Metric label="Abandons panier" value="31 %" detail="-4,1 points" trend icon={ArrowLeft} />
      </section>
      <section className="pilot-store-grid">
        <div className="pilot-list-surface pilot-catalog-panel">
          <div className="pilot-list-toolbar"><div><span className="pilot-eyebrow">CATALOGUE</span><h2>Produits publiés</h2></div><button className="pilot-secondary" onClick={() => showToast("La boutique est déjà synchronisée.")}><RefreshCw size={15} />Synchroniser</button></div>
          <div className="pilot-product-list">
            {data.storefront.map((product) => {
              const stock = data.inventory.find((item) => item.id === product.stockId);
              return <div key={product.id}><i><Store size={18} /></i><div><b>{product.name}</b><small>{formatEuro(product.price)} · stock lié : {stock?.stock - stock?.reserved}</small></div><span>{product.sales} ventes<small>{product.conversion} conv.</small></span><label className="pilot-switch"><input type="checkbox" checked={product.online} onChange={() => toggleProduct(product.id)} /><span /></label></div>;
            })}
          </div>
        </div>
        <aside className="pilot-surface pilot-funnel-panel">
          <span className="pilot-eyebrow">PARCOURS D’ACHAT</span><h2>Entonnoir 30 jours</h2>
          <div className="pilot-funnel"><div style={{ width: "100%" }}><span>Visites produit</span><b>862</b></div><div style={{ width: "72%" }}><span>Ajouts panier</span><b>214</b></div><div style={{ width: "51%" }}><span>Checkouts</span><b>102</b></div><div style={{ width: "36%" }}><span>Achats</span><b>70</b></div></div>
          <div className="pilot-insight"><Sparkles size={17} /><p><b>Opportunité détectée</b><span>La Carte NFC convertit 1,4× mieux que la moyenne du catalogue.</span></p></div>
        </aside>
      </section>
    </div>
  );
}

function OrderDrawer({ order, client, onClose, advanceOrder }) {
  if (!order || !client) return null;
  const currentIndex = statusFlow.indexOf(order.status);
  return (
    <div className="pilot-drawer-layer" role="presentation">
      <button className="pilot-drawer-backdrop" onClick={onClose} aria-label="Fermer la fiche" />
      <aside className="pilot-order-drawer" role="dialog" aria-modal="true" aria-labelledby="pilot-order-title">
        <header><div><span>COMMANDE</span><h2 id="pilot-order-title">{order.id}</h2></div><button onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
        <div className="pilot-drawer-client"><span>{initials(client.name)}</span><div><b>{client.name}</b><small>{client.contact} · {client.email}</small></div><button aria-label="Ouvrir le client"><ExternalLink size={15} /></button></div>
        <div className="pilot-drawer-status"><StatusBadge status={order.status} /><span>Échéance <b>{order.due}</b></span></div>
        {order.sourceOrderId && <div className={`pilot-integration-state pilot-integration-${order.pilotStatus || "paid"}`}><Radio size={17} /><div><b>{order.pilotStatus === "active" ? "Pilot activé" : order.pilotStatus === "ready_for_activation" ? "Pilot prêt à activer" : "Commande web synchronisée"}</b><span>{order.pilotStatus === "active" ? "Le client dispose de son espace et de ses liens actifs." : "Le suivi tapote.fr → production → Pilot est relié automatiquement."}</span></div></div>}
        <section className="pilot-drawer-section"><span>DÉTAILS</span><dl><div><dt>Produit</dt><dd>{order.product}</dd></div><div><dt>Quantité</dt><dd>{order.quantity}</dd></div><div><dt>Destination</dt><dd>{order.destination}</dd></div><div><dt>Montant</dt><dd>{formatEuro(order.total)}</dd></div><div><dt>Responsable</dt><dd>{order.owner}</dd></div><div><dt>Canal</dt><dd>{order.channel}</dd></div></dl></section>
        <section className="pilot-drawer-section"><span>AVANCEMENT</span><div className="pilot-timeline">
          {statusFlow.map((status, index) => <div key={status} className={cx(index <= currentIndex && "is-done", index === currentIndex && "is-current")}><i>{index < currentIndex ? <Check size={12} /> : null}</i><p><b>{statusMeta[status].label}</b><small>{index < currentIndex ? "Terminé" : index === currentIndex ? "Étape actuelle" : "À venir"}</small></p></div>)}
        </div></section>
        <section className="pilot-drawer-note"><span>NOTE ATELIER</span><p>{order.note}</p></section>
        <footer>{order.status !== "shipped" ? <button className="pilot-primary" onClick={() => advanceOrder(order.id)}>{statusMeta[order.status].action}<ArrowRight size={16} /></button> : <button className="pilot-secondary" onClick={onClose}><CheckCircle2 size={16} />Commande terminée</button>}<button className="pilot-secondary" onClick={() => window.print()}><Download size={16} />Bon de production</button></footer>
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

function NewOrderModal({ clients, onClose, onCreate }) {
  const [form, setForm] = useState({ clientId: clients[0]?.id || "", product: "Comptoir A6", quantity: 1, due: "", channel: "Boutique", destination: "Avis Google" });
  const total = (productPrices[form.product] || 0) * Number(form.quantity);
  const submit = (event) => { event.preventDefault(); onCreate({ ...form, quantity: Number(form.quantity), total }); };
  return (
    <div className="pilot-modal-layer"><button className="pilot-modal-backdrop" onClick={onClose} aria-label="Fermer" /><form className="pilot-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pilot-new-order-title">
      <header><div><span>NOUVELLE VENTE</span><h2 id="pilot-new-order-title">Créer une commande</h2><p>Elle sera ajoutée à la file opérationnelle immédiatement.</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className="pilot-form-grid"><label><span>Client</span><select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label><span>Canal</span><select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}><option>Boutique</option><option>Devis</option><option>Téléphone</option></select></label><label className="is-wide"><span>Produit</span><select value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })}>{Object.keys(productPrices).map((product) => <option key={product}>{product}</option>)}</select></label><label><span>Quantité</span><input type="number" min="1" max="50" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label><span>Échéance</span><input type="date" value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} required /></label><label className="is-wide"><span>Destination programmée</span><select value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })}><option>Avis Google</option><option>Menu</option><option>Réservation</option><option>Instagram</option><option>Fidélité</option></select></label></div>
      <div className="pilot-order-total"><span>Total TTC</span><strong>{formatEuro(total)}</strong></div>
      <footer><button type="button" className="pilot-secondary" onClick={onClose}>Annuler</button><button className="pilot-primary" type="submit"><Plus size={16} />Créer la commande</button></footer>
    </form></div>
  );
}

export default function TapoteManagementApp() {
  const [view, setView] = useState("dashboard");
  const [data, setData] = useState(() => import.meta.env.MODE === "test" ? initialData : { clients: [], orders: [], inventory: [], storefront: [], activity: [] });
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authState, setAuthState] = useState(isManagementConfigured ? "loading" : "configuration");
  const [access, setAccess] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newInventoryOpen, setNewInventoryOpen] = useState(false);
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
    const unsubscribe = onManagementAuthChange((nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setSessionReady(true);
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
        setSelectedClient((current) => current || workspace.clients[0]?.id || null);
        setAuthState("ready");
      } catch (error) {
        if (!active) return;
        setToast(error.message || "Impossible de charger les données Supabase.");
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
    if (!selectedOrder && !newOrderOpen && !newClientOpen && !newInventoryOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setSelectedOrder(null);
      setNewOrderOpen(false);
      setNewClientOpen(false);
      setNewInventoryOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [newClientOpen, newInventoryOpen, newOrderOpen, selectedOrder]);

  const refreshData = useCallback(async ({ quiet = false } = {}) => {
    if (!access) return;
    if (!quiet) setSyncing(true);
    try {
      const workspace = await loadManagementData(access.organizationId);
      setData(workspace);
      setSelectedClient((current) => current || workspace.clients[0]?.id || null);
    } catch (error) {
      setToast(error.message || "Synchronisation impossible.");
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
    orders: data.orders.filter((item) => item.status !== "shipped").length,
    production: data.orders.filter((item) => ["bat", "assembly", "quality"].includes(item.status)).length,
    shipping: data.orders.filter((item) => item.status === "ready").length,
    stockAlerts: data.inventory.filter((item) => item.stock - item.reserved <= item.threshold).length,
  }), [data.inventory, data.orders]);
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const orders = data.orders.filter((item) => `${item.id} ${item.product} ${clientMap[item.clientId]?.name}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, kind: "order", label: "Commande", title: `${item.id} · ${clientMap[item.clientId]?.name}`, subtitle: `${item.product} · ${statusMeta[item.status].label}` }));
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
  const advanceOrder = async (orderId) => {
    const currentOrder = data.orders.find((item) => item.id === orderId);
    if (!currentOrder || !access) return;
    const index = statusFlow.indexOf(currentOrder.status);
    const nextStatus = statusFlow[Math.min(index + 1, statusFlow.length - 1)];
    const tracking = nextStatus === "shipped" ? `1K0284${String(Date.now()).slice(-7)}` : currentOrder.tracking;
    setSyncing(true);
    try {
      const updated = await updateManagementOrderStatus(access.organizationId, currentOrder, nextStatus, tracking);
      setData((current) => ({ ...current, orders: current.orders.map((item) => item.id === orderId ? updated : item) }));
      showToast(`Commande ${orderId} mise à jour dans Supabase.`);
    } catch (error) {
      showToast(error.message || `Impossible de mettre à jour ${orderId}.`);
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
      showToast(error.message || "La commande n’a pas pu être créée.");
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
      showToast(error.message || "Le client n’a pas pu être créé.");
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
      showToast(error.message || "La référence n’a pas pu être créée.");
    } finally {
      setSyncing(false);
    }
  };
  const adjustStock = async (stockId, amount) => {
    const item = data.inventory.find((candidate) => candidate.id === stockId);
    if (!item || !access) return;
    setSyncing(true);
    try {
      const updated = await receiveManagementStock(access.organizationId, item, amount);
      setData((current) => ({ ...current, inventory: current.inventory.map((candidate) => candidate.id === stockId ? updated : candidate) }));
      showToast(`${amount} unités ajoutées dans Supabase.`);
    } catch (error) {
      showToast(error.message || "La réception n’a pas pu être enregistrée.");
    } finally {
      setSyncing(false);
    }
  };
  const markShipped = (orderId) => advanceOrder(orderId);
  const toggleProduct = async (productId) => {
    const nextOnline = !data.storefront.find((product) => product.id === productId)?.online;
    if (!access) return;
    setSyncing(true);
    try {
      await setStorefrontProductOnline(access.organizationId, productId, nextOnline);
      setData((current) => ({ ...current, storefront: current.storefront.map((product) => product.id === productId ? { ...product, online: nextOnline } : product) }));
      showToast(nextOnline ? "Produit publié sur la boutique." : "Produit masqué de la boutique.");
    } catch (error) {
      showToast(error.message || "Le catalogue n’a pas pu être mis à jour.");
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

  const viewProps = { data, clientMap, search, openOrder, advanceOrder, showToast };
  return (
    <div className="pilot-app">
      <a className="pilot-skip" href="#pilot-main">Aller au contenu</a>
      <Sidebar currentView={view} onNavigate={navigate} open={navOpen} onClose={() => setNavOpen(false)} openSettings={() => showToast(`${access.organizationName} · ${access.email}`)} counts={navCounts} access={access} onSignOut={async () => { await signOutManager(); setAuthState("signedOut"); }} />
      <div className="pilot-workspace">
        <Topbar view={view} search={search} setSearch={setSearch} onMenu={() => setNavOpen(true)} onNewOrder={() => { if (data.clients.length) setNewOrderOpen(true); else showToast("Ajoute d’abord un client à l’espace Gestion."); }} searchResults={searchResults} onSearchResult={openSearchResult} alerts={operationalAlerts} onAlertAction={(alert) => { setView(alert.view); setSearch(""); }} />
        <main id="pilot-main">
          {view === "dashboard" && <DashboardView {...viewProps} onNavigate={navigate} />}
          {view === "orders" && <OrdersView {...viewProps} exportOrders={exportOrders} />}
          {view === "clients" && <ClientsView {...viewProps} selectedClient={selectedClient} setSelectedClient={setSelectedClient} clientOrders={(id) => data.orders.filter((item) => item.clientId === id)} onNewClient={() => setNewClientOpen(true)} />}
          {view === "production" && <ProductionView {...viewProps} />}
          {view === "supply" && <SupplyView {...viewProps} adjustStock={adjustStock} onNewInventory={() => setNewInventoryOpen(true)} />}
          {view === "shipping" && <ShippingView {...viewProps} markShipped={markShipped} />}
          {view === "ecommerce" && <EcommerceView {...viewProps} toggleProduct={toggleProduct} />}
        </main>
      </div>
      <OrderDrawer order={order} client={order ? clientMap[order.clientId] : null} onClose={() => setSelectedOrder(null)} advanceOrder={advanceOrder} />
      {newOrderOpen && <NewOrderModal clients={data.clients} onClose={() => setNewOrderOpen(false)} onCreate={createOrder} />}
      {newClientOpen && <NewClientModal onClose={() => setNewClientOpen(false)} onCreate={createClient} />}
      {newInventoryOpen && <NewInventoryModal onClose={() => setNewInventoryOpen(false)} onCreate={createInventory} />}
      <div className={cx("pilot-sync-status", syncing && "is-visible")} aria-hidden={!syncing}><LoaderCircle className="is-spinning" size={15} />Synchronisation Supabase</div>
      <div className={cx("pilot-toast", toast && "is-visible")} role="status"><CheckCircle2 size={17} />{toast}</div>
    </div>
  );
}
