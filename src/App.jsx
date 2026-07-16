import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  CloudUpload,
  FileCheck2,
  Menu,
  Minus,
  Nfc,
  PackageCheck,
  Play,
  Plus,
  Radio,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { ACTIONS, formatMoney, PRODUCTS } from "../shared/catalog.js";

const TapoteManagementApp = lazy(() => import("./ManagementApp.jsx"));

const productOrder = ["comptoir", "table6", "carte", "sticker"];
const packOrder = ["pack_resto", "pack_salon", "pack_equipe"];
const actionOrder = ["avis", "menu", "reservation", "fidelite", "pourboire", "instagram", "wifi", "autre"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const productVisuals = {
  comptoir: { image: "/assets/tapote-hero-a6-hd.webp", alt: "Chevalet A6 transparent Tapote sur un comptoir" },
  table6: { image: "/assets/tapote-pack-a6.webp", alt: "Six chevalets A6 Tapote installés dans un restaurant" },
  carte: { image: "/assets/tapote-card-nfc.webp", alt: "Carte NFC Tapote personnalisée tenue par une commerçante" },
  sticker: { image: "/assets/tapote-sticker-nfc.webp", alt: "Sticker NFC et QR Tapote posé sur une vitrine" },
};

const packVisuals = {
  pack_resto: { image: "/assets/tapote-pack-a6.webp", alt: "Six chevalets Tapote répartis sur les tables d’un restaurant" },
  pack_salon: { image: "/assets/tapote-salon-a6.webp", alt: "Chevalet Tapote personnalisé posé sur le comptoir d’un salon" },
  pack_equipe: { image: "/assets/tapote-card-nfc.webp", alt: "Carte NFC Tapote personnalisée présentée par une commerçante" },
};

const legalDetails = {
  company: import.meta.env.VITE_LEGAL_COMPANY || "",
  capital: import.meta.env.VITE_LEGAL_CAPITAL || "",
  address: import.meta.env.VITE_LEGAL_ADDRESS || "",
  registration: import.meta.env.VITE_LEGAL_REGISTRATION || "",
  vat: import.meta.env.VITE_LEGAL_VAT || "",
  director: import.meta.env.VITE_LEGAL_DIRECTOR || "",
  contact: import.meta.env.VITE_LEGAL_CONTACT || "",
  host: import.meta.env.VITE_LEGAL_HOST || "",
  mediator: import.meta.env.VITE_LEGAL_MEDIATOR || "",
  privacyContact: import.meta.env.VITE_LEGAL_PRIVACY_CONTACT || "",
  returnsAddress: import.meta.env.VITE_LEGAL_RETURNS_ADDRESS || "",
  version: import.meta.env.VITE_LEGAL_VERSION || "",
};
const legalReady = Object.values(legalDetails).every(Boolean);

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem("tapote-cart") || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || !PRODUCTS[item.productId] || !ACTIONS[item.actionId]) return [];
      const quantity = Math.max(1, Math.min(50, Math.floor(Number(item.quantity) || 1)));
      return [{
        productId: item.productId,
        actionId: item.actionId,
        quantity,
        brandName: String(item.brandName || "").slice(0, 60),
        theme: ["blue", "rose", "green"].includes(item.theme) ? item.theme : "blue",
        brandLogoId: uuidPattern.test(item.brandLogoId || "") ? item.brandLogoId : "",
        logoFileName: String(item.logoFileName || "").slice(0, 120),
      }];
    }).slice(0, 20);
  } catch {
    return [];
  }
}

const faqs = [
  [
    "Est-ce que mes clients doivent installer une application ?",
    "Non. Un téléphone compatible NFC ouvre le lien au contact ; le QR code imprimé sert de solution de secours. Aucun compte Tapote ni aucune application ne sont nécessaires.",
  ],
  [
    "Comment mon objet est-il configuré ?",
    "Tu indiques le nom du commerce et le lien souhaité à la commande. Nous encodons la puce, générons le QR code, testons les deux parcours et expédions l’objet prêt à poser.",
  ],
  [
    "Puis-je changer le lien plus tard ?",
    "Oui avec Tapote Pilot, depuis ton espace. Sans Pilot, le lien direct inscrit sur la puce reste celui configuré à la commande ; une reprogrammation physique peut être proposée.",
  ],
  [
    "Est-ce autorisé par Google ?",
    "Inviter tous les vrais clients à partager une expérience authentique est permis. En revanche, Tapote ne doit jamais filtrer les clients, promettre une récompense, ni demander exclusivement des notes positives.",
  ],
  [
    "Combien de temps faut-il pour être livré ?",
    "L’objectif opérationnel de lancement est une préparation sous 2 jours ouvrés, puis 2 à 4 jours de transport en France métropolitaine. Le délai réel doit être confirmé dans les CGV avant ouverture officielle.",
  ],
  [
    "Et pour un réseau ou une franchise ?",
    "Le pack multi-site prévoit une production en série, un gabarit de marque partagé et un tableau de bord par établissement. Le devis dépend du volume et du niveau de personnalisation.",
  ],
];

function BrandMark({ light = false }) {
  return (
    <a className={`brand ${light ? "brand-light" : ""}`} href="#top" aria-label="Tapote, retour en haut">
      <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="13" />
        <path className="brand-star" d="M20 7l2.3 6.2 6.2 2.3-6.2 2.3L20 24l-2.3-6.2-6.2-2.3 6.2-2.3L20 7Z" />
        <path className="brand-wave" d="M11 29c5-4 13-4 18 0" />
      </svg>
      <span>tapote.</span>
    </a>
  );
}

function Button({ children, className = "", variant = "primary", type = "button", ...props }) {
  return (
    <button type={type} className={`button button-${variant} ${className}`} {...props}>
      <span>{children}</span>
      {variant !== "icon" && <ArrowRight size={17} aria-hidden="true" />}
    </button>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.14 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` }}>
      {children}
    </div>
  );
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function useModalA11y(open, onClose) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const restoreFocusRef = useRef(null);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusables = () => [...(dialog?.querySelectorAll(focusableSelector) || [])];
    const frame = window.requestAnimationFrame(() => (focusables()[0] || dialog)?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusables();
      if (!elements.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  return dialogRef;
}

function PreviewInsert({ action, brandName, brandLogo, colors, productId }) {
  const tapLabel = productId === "carte" ? "Approchez votre téléphone" : productId === "sticker" ? "Tapotez ou scannez" : "Posez votre téléphone ici";
  return (
    <div className="printed-insert" style={{ "--insert-paper": colors.paper, "--insert-ink": colors.ink, "--insert-accent": colors.accent }}>
      <div className={`customer-brand ${brandLogo ? "customer-brand-has-logo" : ""}`}>
        {brandLogo ? <img src={brandLogo} alt="Logo client importé" /> : <><span>{brandName.slice(0, 1).toUpperCase()}</span><b>{brandName || "VOTRE MARQUE"}</b></>}
      </div>
      <div className="device-headline">{action.headline}</div>
      <div className="device-subline">30 secondes suffisent</div>
      <div className="tap-zone">
        <Radio size={28} aria-hidden="true" />
        <strong>{tapLabel}</strong>
        <span>NFC · QR de secours</span>
      </div>
      <div className="maker-signature"><Sparkles size={6} /> TAPOTE <Sparkles size={6} /></div>
    </div>
  );
}

function DevicePreview({ productId = "comptoir", actionId = "avis", compact = false, brandName = "CAFÉ NOMA", brandLogo = "", theme = "blue" }) {
  const action = ACTIONS[actionId];
  const themes = {
    blue: { paper: "#111319", ink: "#f7f1e7", accent: "#2458ff" },
    rose: { paper: "#f0d6d3", ink: "#5a2d3c", accent: "#5a2d3c" },
    green: { paper: "#173b32", ink: "#f7edcf", accent: "#d88a20" },
  };
  const colors = themes[theme] || themes.blue;
  const product = PRODUCTS[productId] || PRODUCTS.comptoir;
  return (
    <div className={`device-preview device-preview-${productId} ${compact ? "device-preview-compact" : ""}`} aria-label={`Aperçu de ${product.name} pour ${action.name}`}>
      {productId === "table6" && <span className="device-quantity">×6</span>}
      <div className={productId === "comptoir" || productId === "table6" ? "acrylic-sheet" : "product-face"}>
        <PreviewInsert action={action} brandName={brandName} brandLogo={brandLogo} colors={colors} productId={productId} />
      </div>
      {(productId === "comptoir" || productId === "table6") && <div className="acrylic-foot" aria-hidden="true" />}
    </div>
  );
}

function ProductSilhouette({ productId }) {
  const visual = productVisuals[productId];
  return (
    <div className={`product-silhouette product-silhouette-${productId}`}>
      <img src={visual.image} alt={visual.alt} loading="lazy" decoding="async" />
    </div>
  );
}

function Header({ cartCount, onCart, mobileOpen, setMobileOpen }) {
  return (
    <header className="site-header">
      <BrandMark />
      <nav id="main-navigation" className={`nav-links ${mobileOpen ? "nav-links-open" : ""}`} aria-label="Navigation principale">
        <a href="#demo" onClick={() => setMobileOpen(false)}>Démo</a>
        <a href="#objets" onClick={() => setMobileOpen(false)}>Les objets</a>
        <a href="#pilot" onClick={() => setMobileOpen(false)}>Pilot</a>
        <a href="#packs" onClick={() => setMobileOpen(false)}>Packs métier</a>
        <a href="#faq" onClick={() => setMobileOpen(false)}>Questions</a>
      </nav>
      <div className="header-actions">
        <a className="header-cta" href="#configurateur">Créer mon Tapote</a>
        <button className="cart-trigger" onClick={onCart} aria-label={`Ouvrir le panier, ${cartCount} article(s)`}>
          <ShoppingBag size={18} />
          <span>Panier</span>
          {cartCount > 0 && <b>{cartCount}</b>}
        </button>
        <button className="menu-trigger" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileOpen} aria-controls="main-navigation">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <img src="/assets/tapote-hero-a6-hd.webp" srcSet="/assets/tapote-hero-a6.webp 1568w, /assets/tapote-hero-a6-hd.webp 2560w" sizes="100vw" alt="Chevalet Tapote A6 en plexiglas transparent, personnalisé pour un café" fetchPriority="high" />
      <div className="hero-shade" />
      <div className="hero-copy">
        <div className="eyebrow hero-enter hero-enter-1"><Sparkles size={14} fill="currentColor" /> NFC + QR · prêt à poser</div>
        <h1 className="hero-enter hero-enter-2">
          Le bon lien,<br />
          <span>au bon moment.</span>
        </h1>
        <p className="hero-enter hero-enter-3">Avis, menu, réservation ou fidélité. Un geste suffit pour faire passer tes clients du comptoir à l’action.</p>
        <div className="hero-ctas hero-enter hero-enter-4">
          <a className="button button-primary" href="#configurateur"><span>Créer mon Tapote</span><ArrowDown size={17} /></a>
          <a className="hero-demo-link" href="#demo"><i><Play size={11} fill="currentColor" /></i><span>Voir la démo<small>8 secondes</small></span></a>
          <span>Formats dès 29 € TTC · aucun abonnement obligatoire · livraison France incluse</span>
        </div>
      </div>
      <div className="hero-caption">
        <span>Aperçu en situation</span><span>59 € TTC</span>
        <strong>Le Comptoir A6 personnalisé</strong>
        <span>NFC + QR · prêt à poser</span><span>Livraison incluse</span>
      </div>
    </section>
  );
}

function SignalBand() {
  return (
    <div className="signal-band" aria-label="Caractéristiques principales">
      <div className="signal-proofs">
        <span><Check size={15} strokeWidth={3} /> Plexiglas A6 réel</span>
        <span><Check size={15} strokeWidth={3} /> NFC + QR de secours</span>
        <span><Check size={15} strokeWidth={3} /> Compatible iPhone & Android</span>
        <span><Check size={15} strokeWidth={3} /> Assemblé & testé en France</span>
      </div>
    </div>
  );
}

function TapDemo() {
  const [cycle, setCycle] = useState(0);

  return (
    <section className="tap-demo" id="demo">
      <Reveal className="tap-demo-copy">
        <span className="kicker kicker-light">LA DÉMO · 8 SECONDES</span>
        <h2>Un tap.<br /><span>Le lien s’ouvre.</span></h2>
        <p>Le client approche son téléphone. La bonne page s’ouvre immédiatement, sans application et sans compte à créer.</p>
        <div className="demo-proof-list">
          <div><span>01</span><p><strong>Approcher</strong> Le téléphone détecte le chevalet.</p></div>
          <div><span>02</span><p><strong>Ouvrir</strong> Le lien configuré apparaît.</p></div>
          <div><span>03</span><p><strong>Agir</strong> Avis, menu ou réservation.</p></div>
        </div>
        <a className="button button-yellow" href="#configurateur"><span>Créer mon Tapote</span><ArrowRight size={17} /></a>
      </Reveal>
      <Reveal className="tap-demo-stage" delay={120}>
        <div className="demo-scene" key={cycle} aria-label="Démonstration animée d’un client approchant son téléphone d’un chevalet Tapote">
          <div className="demo-wall-lines" aria-hidden="true" />
          <div className="demo-chevalet"><DevicePreview productId="comptoir" actionId="avis" compact brandName="CAFÉ NOMA" /></div>
          <div className="demo-ripples" aria-hidden="true"><i /><i /><i /></div>
          <div className="demo-phone" aria-hidden="true">
            <div className="demo-phone-speaker" />
            <div className="demo-lock-screen"><strong>19:24</strong><span>jeudi 16 juillet</span></div>
            <div className="demo-review-screen">
              <div className="demo-review-logo">CN</div>
              <strong>Café Noma</strong>
              <span>Comment s’est passée votre visite ?</span>
              <div className="demo-stars">★★★★★</div>
              <i />
              <b>Publier</b>
            </div>
          </div>
          <div className="demo-captions" aria-hidden="true">
            <span>Le chevalet est déjà prêt.</span>
            <span>Le client approche son téléphone.</span>
            <span>La page s’ouvre. Sans application.</span>
            <span>Le bon geste, au bon moment.</span>
          </div>
          <div className="demo-badge"><i /> DÉMO · 8 S</div>
          <button className="demo-replay" onClick={() => setCycle((value) => value + 1)} aria-label="Rejouer la démonstration">↻ Rejouer</button>
        </div>
      </Reveal>
    </section>
  );
}

function ProductSection({ onSelect }) {
  return (
    <section className="section products-section" id="objets">
      <Reveal className="section-heading wide-heading">
        <div>
          <span className="kicker">01 · LES OBJETS</span>
          <h2>Il y a toujours<br />un endroit où tapoter.</h2>
        </div>
        <p>Le même cœur NFC + QR, dans quatre formats pensés pour le rythme réel d’un commerce.</p>
      </Reveal>
      <div className="product-list">
        {productOrder.map((id, index) => {
          const product = PRODUCTS[id];
          return (
            <Reveal key={id} delay={index * 80}>
              <button className="product-row" onClick={() => onSelect(id)}>
                <span className="product-index">0{index + 1}</span>
                <ProductSilhouette productId={id} />
                <span className="product-copy">
                  <strong>{product.name}</strong>
                  <small>{product.description}</small>
                  <em>{product.format}</em>
                </span>
                <span className="product-price">{formatMoney(product.price)}<small>TTC</small></span>
                <span className="product-arrow"><ArrowRight /></span>
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function Configurator({ initialProduct, onAdd }) {
  const [productId, setProductId] = useState(initialProduct || "comptoir");
  const [actionId, setActionId] = useState("avis");
  const [added, setAdded] = useState(false);
  const [brandName, setBrandName] = useState("CAFÉ NOMA");
  const [theme, setTheme] = useState("blue");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandLogoId, setBrandLogoId] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoStatus, setLogoStatus] = useState("idle");
  const [logoError, setLogoError] = useState("");

  const product = PRODUCTS[productId];

  const add = () => {
    onAdd({ productId, actionId, quantity: 1, brandName, theme, brandLogoId, logoFileName });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError("");
    setLogoStatus("loading");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setBrandLogo("");
      setBrandLogoId("");
      setLogoStatus("error");
      setLogoError("PNG, JPG ou WebP uniquement, 2 Mo maximum.");
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Lecture du logo impossible."));
        reader.readAsDataURL(file);
      });
      setBrandLogo(dataUrl);
      const formData = new FormData();
      formData.append("logo", file, file.name);
      const response = await fetch("/api/uploads/logo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi du logo impossible.");
      setBrandLogoId(data.uploadId);
      setLogoFileName(file.name.slice(0, 120));
      setLogoStatus("success");
    } catch (error) {
      setBrandLogo("");
      setBrandLogoId("");
      setLogoFileName("");
      setLogoStatus("error");
      setLogoError(error.message);
    }
  };

  return (
    <section className="configurator" id="configurateur">
      <div className="configurator-preview">
        <div className="preview-orbit preview-orbit-one" />
        <div className="preview-orbit preview-orbit-two" />
        <DevicePreview productId={productId} actionId={actionId} brandName={brandName} brandLogo={brandLogo} theme={theme} />
        <span className="preview-note">{product.format} · aperçu à l’échelle du format · BAT final avant production</span>
      </div>
      <div className="configurator-panel">
        <span className="kicker kicker-light">02 · CONFIGURATEUR</span>
        <h2>Le tien, en<br />trois choix.</h2>
        <fieldset>
          <legend>1. L’objet</legend>
          <div className="choice-grid">
            {productOrder.map((id) => (
              <button key={id} className={productId === id ? "choice-active" : ""} onClick={() => setProductId(id)}>
                <span>{PRODUCTS[id].shortName}</span><b>{formatMoney(PRODUCTS[id].price)}</b>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>2. L’action</legend>
          <div className="action-grid">
            {actionOrder.map((id) => (
              <button key={id} className={actionId === id ? "action-active" : ""} onClick={() => setActionId(id)}>
                {ACTIONS[id].name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>3. La marque du client</legend>
          <div className="brand-controls">
            <input aria-label="Nom affiché sur l’objet" value={brandName} onChange={(event) => setBrandName(event.target.value.slice(0, 28))} placeholder="Nom du commerce" />
            <label className={`logo-upload ${logoStatus === "success" ? "logo-upload-success" : ""}`}><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} /><span>{logoStatus === "loading" ? "Envoi…" : logoStatus === "success" ? "Logo transmis ✓" : "Importer un logo"}</span></label>
          </div>
          {(logoStatus === "success" || logoError) && <p className={`logo-status logo-status-${logoStatus}`} role="status" aria-live="polite">{logoError || "Le fichier est conservé de manière privée avec la commande et apparaîtra sur le BAT."}</p>}
          <div className="theme-choices" aria-label="Palette du visuel">
            {["blue", "rose", "green"].map((id) => <button key={id} aria-label={`Palette ${id}`} className={`${id} ${theme === id ? "theme-active" : ""}`} onClick={() => setTheme(id)} />)}
            <span>Maquette affinée après commande</span>
          </div>
        </fieldset>
        <div className="config-summary">
          <div><span>{product.name}</span><small>{ACTIONS[actionId].name} · personnalisation + encodage + livraison France inclus</small></div>
          <strong>{formatMoney(product.price)}<small> TTC</small></strong>
        </div>
        <Button className={added ? "button-success" : ""} onClick={add} disabled={logoStatus === "loading"}>
          {logoStatus === "loading" ? "Envoi du logo…" : added ? "Ajouté au panier" : "Ajouter au panier"}
        </Button>
        <p className="micro-copy"><Check size={14} /> Prix TTC · livraison standard France incluse · paiement sécurisé</p>
      </div>
    </section>
  );
}

function ProductShowcaseSection() {
  const moments = [
    ["cafe", "/assets/tapote-hero-a6-hd.webp", "Chevalet Tapote personnalisé pour un café", "CAFÉ", "Avis Google", "Le bon geste juste après le paiement."],
    ["salon", "/assets/tapote-salon-a6.webp", "Chevalet Tapote rose personnalisé pour un salon", "SALON", "Réservation", "Le client repart avec son prochain rendez-vous."],
    ["restaurant", "/assets/tapote-restaurant-a6.webp", "Chevalet Tapote vert personnalisé pour un restaurant", "RESTAURANT", "Menu", "Une carte à jour sans réimprimer le support."],
    ["vitrine", "/assets/tapote-sticker-nfc.webp", "Sticker Tapote personnalisé posé sur une vitrine", "VITRINE", "Réseaux sociaux", "Le lien reste visible même après la fermeture."],
  ];
  const facts = [
    ["01", FileCheck2, "BAT avant production", "Le visuel final est validé avec le client avant impression ou fabrication."],
    ["02", CloudUpload, "Logo joint à la commande", "Le fichier importé est envoyé au serveur, enregistré et transmis avec la configuration."],
    ["03", PackageCheck, "Double contrôle", "Le lien NFC et le QR de secours sont testés avant l’expédition de chaque objet."],
  ];
  return (
    <section className="product-showcase" id="personnalisation">
      <div className="showcase-heading">
        <div><span>✦ VOTRE MARQUE, PAS LA NÔTRE</span><h2>Le support ne change pas.<br />Son visuel devient le vôtre.</h2></div>
        <p>Tapote reste discret. Ton logo, ta palette et ton ton prennent toute la place. Chaque exemple illustre une vraie direction de personnalisation.</p>
      </div>
      <div className="product-gallery">
        {moments.map(([id, image, alt, label, title, text]) => <figure key={id}>
          <img src={image} alt={alt} loading="lazy" decoding="async" />
          <figcaption><span>{label}</span><strong>{title}</strong><p>{text}</p></figcaption>
        </figure>)}
      </div>
      <div className="product-facts" id="controle-qualite">
        {facts.map(([number, Icon, title, text]) => <div key={number}>
          <span className="fact-index">{number}</span>
          <span className="fact-icon" aria-hidden="true"><Icon /></span>
          <div className="fact-copy"><strong>{title}</strong><p>{text}</p></div>
        </div>)}
      </div>
      <div className="sample-cta"><p><strong>Besoin de toucher le produit avant un déploiement ?</strong><span>Demande un échantillon ou un BAT adapté à ton commerce.</span></p><a className="button button-primary" href="#devis"><span>Demander un échantillon</span><ArrowRight size={17} /></a></div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Tu commandes", "Choisis l’objet et l’action. Indique simplement ton commerce et la destination souhaitée.", "Objet · action · lien"],
    ["On prépare", "On encode la puce, crée le QR de secours, personnalise et teste chaque parcours.", "BAT · encodage · contrôle"],
    ["Tu le poses", "Au comptoir, sur table ou en vitrine. Ensuite, ton équipe n’a qu’une phrase à dire : “vous pouvez tapoter ici”.", "Prêt à l’emploi"],
  ];
  return (
    <section className="section how-section" id="fonctionnement">
      <div className="how-layout">
        <div className="how-lead">
          <Reveal className="section-heading">
            <span className="kicker">03 · COMMENT ÇA MARCHE</span>
            <h2>Moins de friction.<br />Plus de vrais échanges.</h2>
          </Reveal>
          <Reveal className="how-process-visual" role="img" aria-label="Un téléphone approche un chevalet Tapote et ouvre une page d’avis">
            <div className="how-object" aria-hidden="true">
              <span>CAFÉ NOMA</span>
              <strong>Votre avis<br />compte.</strong>
              <small>30 secondes suffisent</small>
              <b><Nfc size={24} /> TAPOTEZ ICI</b>
            </div>
            <div className="how-tap-signal" aria-hidden="true"><i /><i /><i /></div>
            <div className="how-phone-card" aria-hidden="true">
              <span><Check size={13} /> Page ouverte</span>
              <strong>Avis Google</strong>
              <b>★★★★★</b>
            </div>
            <div className="how-visual-caption" aria-hidden="true"><Radio size={15} /> NFC + QR de secours</div>
          </Reveal>
        </div>
        <div className="how-flow">
          <div className="steps">
            {steps.map(([title, text, meta], index) => (
              <Reveal key={title} className="step" delay={index * 100}>
                <span>0{index + 1}</span>
                <div><h3>{title}</h3><p>{text}</p><small>{meta}</small></div>
                <ArrowRight aria-hidden="true" />
              </Reveal>
            ))}
          </div>
          <Reveal className="honesty-note">
            <Sparkles size={20} fill="currentColor" />
            <p><strong>Pas de promesse magique.</strong> Tapote enlève l’effort technique. La vraie différence vient encore de l’accueil, du bon moment et d’une demande humaine.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PilotSection() {
  return (
    <section className="pilot-section" id="pilot">
      <div className="pilot-copy">
        <Reveal>
          <span className="kicker kicker-light">04 · TAPOTE PILOT</span>
          <span className="pilot-beta"><b>BÊTA</b> Ouverture après les premiers déploiements terrain</span>
          <h2>L’objet reste.<br /><span>Le lien évolue.</span></h2>
          <p>Pilot est en bêta privée. Il permettra de changer la destination, suivre les interactions et piloter plusieurs établissements sans réimprimer les supports.</p>
          <div className="pilot-prices">
            <div><strong>Gratuit<small> en bêta</small></strong><span>Pour les premiers commerces pilotes</span></div>
            <div><strong>9 €<small>/mois ensuite</small></strong><span>Tarif cible · sans engagement</span></div>
          </div>
          <a href="#devis" className="text-link">Rejoindre la liste d’attente <ArrowRight size={16} /></a>
        </Reveal>
      </div>
      <Reveal className="pilot-interface">
        <div className="pilot-topline"><BrandMark light /><span>JUILLET · 30 JOURS</span></div>
        <div className="pilot-total"><span>Interactions</span><strong>294</strong><small>+18 % vs. période précédente</small></div>
        <div className="pilot-bars">
          {[42, 68, 51, 83, 62, 91, 74, 88, 66, 94, 77, 86].map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}
        </div>
        <div className="pilot-list">
          <div><span><i className="dot dot-blue" /> Menu · Tables</span><b>187</b></div>
          <div><span><i className="dot dot-yellow" /> Avis · Comptoir</span><b>76</b></div>
          <div><span><i className="dot dot-cream" /> Instagram · Vitrine</span><b>31</b></div>
        </div>
        <small className="demo-label">Données d’illustration — interface en cours de développement</small>
      </Reveal>
    </section>
  );
}

function Packs({ onAdd }) {
  return (
    <section className="section packs-section" id="packs">
      <Reveal className="section-heading wide-heading">
        <div><span className="kicker">05 · PACKS MÉTIER</span><h2>Tout le parcours,<br />pas juste un objet.</h2></div>
        <p>Des combinaisons simples pour couvrir les bons moments d’un métier sans acheter au hasard.</p>
      </Reveal>
      <div className="pack-grid">
        {packOrder.map((id, index) => {
          const product = PRODUCTS[id];
          const defaultAction = id === "pack_resto" ? "menu" : id === "pack_salon" ? "reservation" : "avis";
          const visual = packVisuals[id];
          return (
            <Reveal className={`pack pack-${index + 1}`} key={id} delay={index * 90}>
              <div className="pack-number">0{index + 1}</div>
              <div className="pack-art"><img className="pack-art-image" src={visual.image} alt={visual.alt} loading="lazy" decoding="async" /></div>
              <div className="pack-body">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <span>{product.format}</span>
                <div className="pack-buy"><strong>{formatMoney(product.price)}</strong><button onClick={() => onAdd({ productId: id, actionId: defaultAction, quantity: 1 })}>Ajouter <Plus size={16} /></button></div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function QuoteSection() {
  const [form, setForm] = useState({ name: "", email: "", company: "", need: "", consent: false, website: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const update = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi impossible.");
      setStatus("success");
      setMessage("Demande reçue. Aymeric pourra répondre avec une proposition précise.");
      setForm({ name: "", email: "", company: "", need: "", consent: false, website: "" });
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  };

  return (
    <section className="quote-section" id="devis">
      <Reveal className="quote-intro">
        <span className="kicker">06 · SUR MESURE</span>
        <h2>Plusieurs lieux ?<br />On construit le bon kit.</h2>
        <p>Réseaux, franchises, hôtels, conciergeries et équipes commerciales : décris le terrain, pas la solution.</p>
      </Reveal>
      <Reveal>
        <form className="quote-form" onSubmit={submit}>
          <label className="form-honeypot" aria-hidden="true"><span>Site web</span><input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" /></label>
          <label><span>Ton nom *</span><input name="name" value={form.name} onChange={update} required autoComplete="name" /></label>
          <label><span>E-mail pro *</span><input name="email" value={form.email} onChange={update} required type="email" autoComplete="email" /></label>
          <label><span>Entreprise</span><input name="company" value={form.company} onChange={update} autoComplete="organization" /></label>
          <label className="form-wide"><span>Le besoin, les lieux, les volumes *</span><textarea name="need" value={form.need} onChange={update} required rows="4" /></label>
          <label className="form-check form-wide"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required /><span>J’accepte que Tapote utilise ces informations pour répondre à ma demande.</span></label>
          <Button type="submit" className="form-wide" disabled={status === "loading"}>{status === "loading" ? "Envoi…" : "Recevoir une proposition"}</Button>
          {message && <p className={`form-message form-${status}`} role="status" aria-live="polite">{message}</p>}
        </form>
      </Reveal>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq-section" id="faq">
      <Reveal className="section-heading"><span className="kicker">07 · QUESTIONS</span><h2>Tout ce qu’il faut<br />savoir avant de poser.</h2></Reveal>
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <Reveal key={question} delay={index * 40}>
            <button className="faq-question" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index} aria-controls={`faq-answer-${index}`} id={`faq-question-${index}`}>
              <span>0{index + 1}</span><strong>{question}</strong><ChevronDown className={open === index ? "faq-chevron-open" : ""} />
            </button>
            <div id={`faq-answer-${index}`} className={`faq-answer ${open === index ? "faq-answer-open" : ""}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={open !== index}><p>{answer}</p></div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LegalDialog({ page, onClose }) {
  const dialogRef = useModalA11y(Boolean(page), onClose);
  if (!page) return null;
  const titles = { legal: "Mentions légales", cgv: "Conditions générales de vente", privacy: "Confidentialité" };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="legal-dialog" role="dialog" aria-modal="true" aria-labelledby="legal-title" aria-describedby="legal-content" tabIndex="-1">
        <button className="dialog-close" onClick={onClose} aria-label="Fermer"><X /></button>
        <span className={legalReady ? "legal-ready" : "legal-warning"}>{legalReady ? "INFORMATIONS DE L’ÉDITEUR" : "PRÉ-LANCEMENT · VENTE RÉELLE BLOQUÉE TANT QUE CES DONNÉES MANQUENT"}</span>
        <h2 id="legal-title">{titles[page]}</h2>
        <div id="legal-content" className="legal-content">
        {page === "legal" && <>
          <p>Éditeur : <strong>{legalDetails.company || "à renseigner"}</strong>, capital <strong>{legalDetails.capital || "à renseigner"}</strong>, siège <strong>{legalDetails.address || "à renseigner"}</strong>, SIREN/RCS/RNE <strong>{legalDetails.registration || "à renseigner"}</strong>, TVA <strong>{legalDetails.vat || "à renseigner"}</strong>.</p>
          <p>Direction de la publication : <strong>{legalDetails.director || "à renseigner"}</strong>. Contact : <strong>{legalDetails.contact || "à renseigner"}</strong>. Hébergeur : <strong>{legalDetails.host || "à renseigner"}</strong>.</p>
        </>}
        {page === "cgv" && <>
          <p>Version des conditions : <strong>{legalDetails.version || "à renseigner"}</strong>. Les prix affichés sont TTC et la livraison standard en France métropolitaine est incluse. Le délai annoncé est de 4 à 6 jours ouvrés après validation du BAT, sous réserve des conditions définitives validées.</p>
          <p>Adresse de retour et réclamations : <strong>{legalDetails.returnsAddress || "à renseigner"}</strong>. Médiateur de la consommation : <strong>{legalDetails.mediator || "à renseigner"}</strong>.</p>
          <p>Les produits réellement personnalisés peuvent relever de l’exception légale au droit de rétractation. Les garanties légales, modalités de retour et responsabilités restent applicables selon les CGV validées.</p>
        </>}
        {page === "privacy" && <>
          <p>Tapote collecte uniquement les informations nécessaires aux commandes, aux demandes de devis, à la sécurité et au support. Les prestataires techniques prévus sont Stripe pour le paiement, Supabase pour l’hébergement des données et Resend pour les notifications opérationnelles.</p>
          <p>Pour exercer un droit d’accès, de rectification, d’effacement ou d’opposition : <strong>{legalDetails.privacyContact || "à renseigner"}</strong>. Les durées de conservation et éventuels transferts internationaux doivent être détaillés dans la politique validée avant ouverture.</p>
        </>}
        </div>
      </section>
    </div>
  );
}

function Footer({ setLegal }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <BrandMark light />
        <h2>Ce soir, ils passent.<br /><span>Demain, ils reviennent.</span></h2>
        <a className="button button-yellow" href="#configurateur"><span>Créer mon Tapote</span><ArrowRight size={17} /></a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tapote · {legalReady ? legalDetails.company : "Pré-lancement — vente réelle verrouillée"}</span>
        <div><button onClick={() => setLegal("legal")}>Mentions légales</button><button onClick={() => setLegal("cgv")}>CGV</button><button onClick={() => setLegal("privacy")}>Confidentialité</button><a href="#devis">Contact pro</a></div>
      </div>
    </footer>
  );
}

function CartDrawer({ open, onClose, cart, setCart, onCheckout }) {
  const dialogRef = useModalA11y(open, onClose);
  const subtotal = cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0);

  const changeQuantity = (index, delta) => {
    setCart((current) => current
      .map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };

  return (
    <div className={`drawer-backdrop ${open ? "drawer-backdrop-open" : ""}`} aria-hidden={!open} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside ref={dialogRef} className={`cart-drawer ${open ? "cart-drawer-open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex="-1" inert={!open ? true : undefined}>
        <div className="drawer-header"><div><span id="cart-title">Ton panier</span><small>{cart.length} référence{cart.length > 1 ? "s" : ""}</small></div><button onClick={onClose} aria-label="Fermer le panier"><X /></button></div>
        <div className="drawer-content">
          {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={34} /><h3>Rien ici, pour l’instant.</h3><p>Choisis un objet et son action dans le configurateur.</p><a href="#configurateur" onClick={onClose}>Commencer <ArrowRight size={16} /></a></div> : cart.map((item, index) => {
            const product = PRODUCTS[item.productId];
            const action = ACTIONS[item.actionId];
            return (
              <div className="cart-item" key={`${item.productId}-${item.actionId}-${index}`}>
                <div className="cart-item-art"><img src={productVisuals[item.productId]?.image || productVisuals.comptoir.image} alt="" /></div>
                <div className="cart-item-copy"><strong>{product.name}</strong><span>{action.name}{item.brandLogoId ? " · logo transmis" : ""}</span><small>{formatMoney(product.price)} TTC</small></div>
                <div className="quantity"><button onClick={() => changeQuantity(index, -1)} aria-label="Retirer une unité"><Minus size={13} /></button><b>{item.quantity}</b><button onClick={() => changeQuantity(index, 1)} aria-label="Ajouter une unité"><Plus size={13} /></button></div>
              </div>
            );
          })}
        </div>
        {cart.length > 0 && <div className="drawer-footer"><div><span>Total objets TTC</span><strong>{formatMoney(subtotal)}</strong></div><small>TVA et livraison standard France métropolitaine incluses.</small><Button onClick={onCheckout}>Passer la commande</Button></div>}
      </aside>
    </div>
  );
}

function CheckoutDialog({ open, onClose, cart, onOpenLegal }) {
  const dialogRef = useModalA11y(open, onClose);
  const [form, setForm] = useState({ businessName: "", email: "", destinationUrl: "", termsAccepted: false });
  const [attemptId] = useState(() => window.crypto.randomUUID());
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const update = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const subtotal = cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0);

  const submit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          items: cart,
          customer: { businessName: form.businessName, email: form.email, destinationUrl: form.destinationUrl },
          termsAccepted: form.termsAccepted,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Paiement indisponible.");
      window.location.assign(data.url);
    } catch (requestError) {
      setStatus("error");
      setError(requestError.message);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title" aria-describedby="checkout-description" tabIndex="-1">
        <button className="dialog-close" onClick={onClose} aria-label="Fermer"><X /></button>
        <span className="kicker">COMMANDE SÉCURISÉE</span>
        <h2 id="checkout-title">On prépare<br />ton Tapote.</h2>
        <p id="checkout-description">Ces informations servent à configurer l’objet. L’adresse de livraison et le paiement sont saisis ensuite sur Stripe.</p>
        <form onSubmit={submit}>
          <label><span>Nom du commerce *</span><input name="businessName" value={form.businessName} onChange={update} required placeholder="Ex. Café des Amis" /></label>
          <label><span>E-mail de commande *</span><input type="email" name="email" value={form.email} onChange={update} required placeholder="aymeric@tapote.fr" /></label>
          <label><span>Lien à ouvrir</span><input type="url" name="destinationUrl" value={form.destinationUrl} onChange={update} placeholder="https://…" pattern="https://.*" title="Le lien doit commencer par https://" /></label>
          <div className="checkout-pilot-beta"><b>Pilot est en bêta privée.</b><span>Cette commande porte uniquement sur les objets : aucun abonnement n’est ajouté ni présélectionné.</span></div>
          <label className="checkout-terms"><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} required /><span>J’ai lu et j’accepte les <button type="button" onClick={() => onOpenLegal("cgv")}>CGV</button> et la <button type="button" onClick={() => onOpenLegal("privacy")}>politique de confidentialité</button>{legalDetails.version ? ` — version ${legalDetails.version}` : ""}.</span></label>
          <div className="checkout-total"><span>Objets · TVA et livraison France incluses</span><strong>{formatMoney(subtotal)} TTC</strong></div>
          <Button type="submit" disabled={status === "loading" || !attemptId}>{status === "loading" ? "Connexion à Stripe…" : "Continuer vers le paiement sécurisé"}</Button>
          {import.meta.env.DEV && <small>Mode développement : sans clés Stripe, aucune somme n’est débitée.</small>}
          {error && <p className="form-message form-error" role="alert">{error}</p>}
        </form>
      </section>
    </div>
  );
}

function StatusBanner() {
  const params = new URLSearchParams(window.location.search);
  const requestedStatus = params.get("commande");
  const sessionId = params.get("session_id") || "";
  const knownStatus = ["confirmee", "demo", "annulee"].includes(requestedStatus);
  const [visible, setVisible] = useState(knownStatus);
  const [verifiedStatus, setVerifiedStatus] = useState(requestedStatus === "annulee" ? "cancel" : sessionId ? "checking" : "error");

  useEffect(() => {
    if (!knownStatus || requestedStatus === "annulee" || !sessionId) {
      return undefined;
    }
    let cancelled = false;
    let timer;
    let attempts = 0;
    const verify = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Vérification impossible.");
        if (cancelled) return;
        if (data.status === "processing" && attempts < 5) {
          setVerifiedStatus("processing");
          timer = window.setTimeout(verify, 1_500);
          return;
        }
        setVerifiedStatus(["paid", "demo", "expired", "payment_failed"].includes(data.status) ? data.status : "processing");
      } catch {
        if (!cancelled) setVerifiedStatus("error");
      }
    };
    void verify();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [knownStatus, requestedStatus, sessionId]);

  if (!visible || !knownStatus) return null;
  const successful = verifiedStatus === "paid" || verifiedStatus === "demo";
  const content = {
    checking: ["Vérification du paiement…", "Nous confirmons la session avec Stripe."],
    processing: ["Paiement en cours de confirmation.", "La page se mettra à jour automatiquement."],
    paid: ["Commande confirmée.", "Le paiement a bien été vérifié avec Stripe."],
    demo: ["Commande de démonstration créée.", "Aucune somme n’a été débitée."],
    cancel: ["Paiement annulé.", "Ton panier reste disponible."],
    expired: ["Session de paiement expirée.", "Relance la commande depuis ton panier."],
    payment_failed: ["Paiement non confirmé.", "Aucune commande ne partira en production."],
    error: ["Confirmation indisponible.", "Consulte ton e-mail Stripe ou contacte Tapote avant de réessayer."],
  }[verifiedStatus] || ["Paiement en cours.", "Vérification en cours."];
  const close = () => {
    setVisible(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("commande");
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };
  return (
    <div className={`status-banner status-${successful ? "success" : "cancel"}`} role="status" aria-live="polite">
      <div>{successful ? <Check /> : <X />}<span><strong>{content[0]}</strong> {content[1]}</span></div>
      <button onClick={close} aria-label="Fermer"><X size={18} /></button>
    </div>
  );
}

function StorefrontApp() {
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("comptoir");
  const [legal, setLegal] = useState(null);
  const [returnToCheckout, setReturnToCheckout] = useState(false);

  useEffect(() => { localStorage.setItem("tapote-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    document.body.classList.toggle("no-scroll", cartOpen || checkoutOpen || Boolean(legal) || mobileOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [cartOpen, checkoutOpen, legal, mobileOpen]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const addToCart = (item) => {
    setCart((current) => {
      const existing = current.findIndex((entry) => entry.productId === item.productId
        && entry.actionId === item.actionId
        && entry.brandName === item.brandName
        && entry.theme === item.theme
        && entry.brandLogoId === item.brandLogoId);
      if (existing < 0) return [...current, item];
      return current.map((entry, index) => index === existing ? { ...entry, quantity: entry.quantity + item.quantity } : entry);
    });
    setCartOpen(true);
  };
  const selectProduct = (id) => {
    setSelectedProduct(id);
    document.getElementById("configurateur")?.scrollIntoView({ behavior: "smooth" });
  };
  const openFooterLegal = (page) => {
    setReturnToCheckout(false);
    setLegal(page);
  };
  const openCheckoutLegal = (page) => {
    setCheckoutOpen(false);
    setReturnToCheckout(true);
    setLegal(page);
  };
  const closeLegal = () => {
    setLegal(null);
    if (returnToCheckout) {
      setReturnToCheckout(false);
      setCheckoutOpen(true);
    }
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      <StatusBanner />
      <Header cartCount={cartCount} onCart={() => setCartOpen(true)} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main id="main-content">
        <Hero />
        <SignalBand />
        <TapDemo />
        <ProductSection onSelect={selectProduct} />
        <Configurator key={selectedProduct} initialProduct={selectedProduct} onAdd={addToCart} />
        <ProductShowcaseSection />
        <HowItWorks />
        <PilotSection />
        <Packs onAdd={addToCart} />
        <QuoteSection />
        <FAQ />
      </main>
      <Footer setLegal={openFooterLegal} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} cart={cart} onOpenLegal={openCheckoutLegal} />
      <LegalDialog page={legal} onClose={closeLegal} />
    </>
  );
}

export default function App() {
  const isManagementRoute = window.location.pathname === "/gestion" || window.location.pathname.startsWith("/gestion/");
  return isManagementRoute ? <Suspense fallback={<main className="route-loading" role="status"><span>Ouverture de la gestion…</span></main>}><TapoteManagementApp /></Suspense> : <StorefrontApp />;
}
