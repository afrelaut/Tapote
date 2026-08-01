import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Menu, ShieldCheck, ShoppingBag, UserRound, X } from "lucide-react";
import { ProductArt } from "../scenes/ProductArt.jsx";
import { SHOP_MENU_PREVIEWS } from "../data/content.js";

function Brand() {
  return <a className="v3-brand" href="/" aria-label="Tapote, accueil"><img src="/brand/tapote-logo.svg" alt="tapote." /></a>;
}

function UtilityBar() {
  return (
    <div className="v3-utility">
      <span><CheckCircle2 size={14} /> NFC + QR inclus · Tapote Pilot inclus</span>
    </div>
  );
}

const MOBILE_MENU_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Header({ cartCount, compact = false }) {
  const [open, setOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [activeShopPreviewId, setActiveShopPreviewId] = useState("comptoir");
  const headerRef = useRef(null);
  const navigationRef = useRef(null);
  const shopMenuRef = useRef(null);
  const shopToggleRef = useRef(null);
  const shopCloseTimerRef = useRef(null);
  const toggleRef = useRef(null);
  const returnFocusRef = useRef(null);
  const menuId = useId();
  const activeShopPreview = SHOP_MENU_PREVIEWS[activeShopPreviewId] || SHOP_MENU_PREVIEWS.comptoir;
  const cancelShopMenuClose = () => {
    if (shopCloseTimerRef.current) {
      window.clearTimeout(shopCloseTimerRef.current);
      shopCloseTimerRef.current = null;
    }
  };
  const openShopMenu = (previewId) => {
    cancelShopMenuClose();
    if (previewId && SHOP_MENU_PREVIEWS[previewId]) setActiveShopPreviewId(previewId);
    setShopMenuOpen(true);
  };
  const scheduleShopMenuClose = () => {
    cancelShopMenuClose();
    shopCloseTimerRef.current = window.setTimeout(() => {
      setShopMenuOpen(false);
      shopCloseTimerRef.current = null;
    }, 260);
  };
  useEffect(() => () => {
    if (shopCloseTimerRef.current) window.clearTimeout(shopCloseTimerRef.current);
  }, []);
  useEffect(() => {
    document.body.classList.toggle("v3-menu-open", open);
    return () => document.body.classList.remove("v3-menu-open");
  }, [open]);
  useEffect(() => {
    if (!shopMenuOpen) return undefined;
    const closeShopMenu = (event) => {
      if (event.key === "Escape") {
        setShopMenuOpen(false);
        shopToggleRef.current?.focus();
      }
    };
    const closeOutside = (event) => {
      if (!shopMenuRef.current?.contains(event.target)) setShopMenuOpen(false);
    };
    document.addEventListener("keydown", closeShopMenu);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeShopMenu);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [shopMenuOpen]);
  useEffect(() => {
    if (!open) return undefined;

    returnFocusRef.current = document.activeElement;
    const header = headerRef.current;
    const navigation = navigationRef.current;
    const toggle = toggleRef.current;
    if (!header || !navigation || !toggle) return undefined;
    const pageElements = [...document.querySelectorAll(".v3-site > :not(.v3-header)"), ...header.querySelectorAll(".v3-brand, .v3-login, .v3-cart-button")];
    const previousInertState = pageElements.map((element) => ({
      element,
      inert: element.hasAttribute("inert"),
    }));
    pageElements.forEach((element) => element.setAttribute("inert", ""));

    const focusableElements = () => [...navigation.querySelectorAll(MOBILE_MENU_FOCUSABLE_SELECTOR), toggle]
      .filter((element) => element && !element.hasAttribute("disabled"));
    const firstLink = navigation.querySelector("a[href]");
    firstLink?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!focusable.includes(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousInertState.forEach(({ element, inert }) => {
        if (!inert) element.removeAttribute("inert");
      });
      const returnTarget = returnFocusRef.current;
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [open]);
  if (compact) return (
    <header className="v3-header v3-checkout-header">
      <Brand />
      <div><span><ShieldCheck /> Paiement sécurisé</span><a href="/panier">Retour au panier</a></div>
    </header>
  );
  return (
      <header className="v3-header" ref={headerRef}>
        <Brand />
        <nav id={menuId} ref={navigationRef} className={open ? "is-open" : ""} aria-label="Navigation principale">
          <div
            className="v3-shop-nav"
            ref={shopMenuRef}
            onMouseEnter={() => openShopMenu()}
            onMouseLeave={scheduleShopMenuClose}
            onFocus={cancelShopMenuClose}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) scheduleShopMenuClose();
            }}
          >
            <button ref={shopToggleRef} type="button" aria-expanded={shopMenuOpen} aria-controls="v3-shop-mega" onClick={() => setShopMenuOpen((value) => !value)}>
              Boutique <ChevronDown />
            </button>
            <a className="v3-shop-mobile-link" href="/boutique" onClick={() => setOpen(false)}>Boutique</a>
            <div className="v3-mobile-products" aria-label="Produits Tapote">
              <a href="/produits/comptoir" onClick={() => setOpen(false)}>Comptoir</a>
              <a href="/produits/plaque" onClick={() => setOpen(false)}>Plaque</a>
              <a href="/produits/carte" onClick={() => setOpen(false)}>Card</a>
              <a href="/boutique#packs" onClick={() => setOpen(false)}>Pack Local</a>
            </div>
            <div className={shopMenuOpen ? "v3-shop-mega is-open" : "v3-shop-mega"} id="v3-shop-mega">
              <div className="v3-shop-mega-column">
                <strong>Les supports</strong>
                <a href="/produits/comptoir" onMouseEnter={() => openShopMenu("comptoir")} onFocus={() => openShopMenu("comptoir")}><span>Tapote Comptoir</span><small>Caisse · accueil · table</small></a>
                <a href="/produits/plaque" onMouseEnter={() => openShopMenu("plaque")} onFocus={() => openShopMenu("plaque")}><span>Tapote Plaque</span><small>Entrée · mur · miroir</small></a>
                <a href="/produits/carte" onMouseEnter={() => openShopMenu("carte")} onFocus={() => openShopMenu("carte")}><span>Tapote Card</span><small>Terrain · rendez-vous</small></a>
              </div>
              <div className="v3-shop-mega-column">
                <strong>Deux modes</strong>
                <a href="/boutique" onMouseEnter={() => openShopMenu("comptoir")} onFocus={() => openShopMenu("comptoir")}><span>Prêt à poser</span><small>Composition Tapote prête à commander</small></a>
                <a href="/personnaliser" onMouseEnter={() => openShopMenu("plaque")} onFocus={() => openShopMenu("plaque")}><span>À votre image</span><small>Personnalisation dans Tapote Studio</small></a>
              </div>
              <div className="v3-shop-mega-column">
                <strong>Packs & entreprises</strong>
                <a href="/boutique#packs" onMouseEnter={() => openShopMenu("packs")} onFocus={() => openShopMenu("packs")}><span>Pack Local</span><small>Comptoir + Plaque</small></a>
                <a href="/devis" onMouseEnter={() => openShopMenu("packs")} onFocus={() => openShopMenu("packs")}><span>10 supports ou plus</span><small>Composition et devis</small></a>
              </div>
              <a className={`v3-shop-mega-feature is-${activeShopPreview.surface}`} href={activeShopPreview.href}>
                <span>{activeShopPreview.eyebrow}</span>
                <div className="v3-shop-mega-product" aria-hidden="true">
                  <ProductArt
                    key={activeShopPreviewId}
                    surface={activeShopPreview.surface}
                    actionId={activeShopPreview.actionId}
                    brandName="tapote."
                    theme={activeShopPreview.theme}
                    personalization="ready"
                  />
                </div>
                <strong>{activeShopPreview.title}</strong>
                <em>{activeShopPreview.detail}</em>
                <small>Découvrir le produit <ArrowRight /></small>
              </a>
            </div>
          </div>
          <a href="/comment-ca-marche" onClick={() => setOpen(false)}>Comment ça marche</a>
          <a href="/tapote-pilot" onClick={() => setOpen(false)}>Tapote Pilot</a>
          <a href="/devis" onClick={() => setOpen(false)}>Entreprises & devis</a>
          <a className="v3-mobile-login" href="/connexion" onClick={() => setOpen(false)}>Accéder à Tapote Pilot</a>
        </nav>
        <div className="v3-header-actions">
          <a className="v3-login" href="/connexion"><UserRound size={16} /> Connexion</a>
          <a className="v3-header-primary" href="/boutique"><span>Commander</span><i aria-hidden="true"><ArrowRight /></i></a>
          <a className="v3-cart-button" href="/panier" aria-label={`Voir le panier, ${cartCount} article(s)`}>
            <ShoppingBag size={18} /><span>Panier</span>{cartCount > 0 && <b>{cartCount}</b>}
          </a>
          <button ref={toggleRef} className="v3-mobile-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-controls={menuId} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
  );
}

function Footer() {
  return (
    <footer className="v3-footer">
      <div className="v3-footer-main">
        <div><Brand /><p>Transformez chaque visite<br />en la bonne action.</p><small>NFC + QR · Prêt à poser ou à votre image · Tapote Pilot inclus.</small></div>
        <div><strong>Acheter</strong><a href="/boutique">Toute la boutique</a><a href="/produits/comptoir">Tapote Comptoir</a><a href="/produits/plaque">Tapote Plaque</a><a href="/produits/carte">Tapote Card</a><a href="/boutique#packs">Pack Local</a></div>
        <div><strong>Découvrir</strong><a href="/boutique">Choisir un support</a><a href="/comment-ca-marche">Comment ça marche</a><a href="/tapote-pilot">Tapote Pilot</a><a href="/secteurs">Solutions par métier</a><a href="/devis">Devis dès 10 supports</a></div>
        <div><strong>Aide</strong><a href="/faq">Questions fréquentes</a><a href="mailto:aymeric@tapote.fr">Nous contacter</a><a href="/cgv">Livraison et garanties</a><a href="/confidentialite">Données et confidentialité</a><a href="/connexion">Accéder à Pilot</a></div>
      </div>
      <div className="v3-footer-bottom"><span>© 2026 Tapote</span><a href="/mentions-legales">Mentions légales</a><a href="/cgv">CGV</a><a href="/confidentialite">Confidentialité</a></div>
    </footer>
  );
}

function CartNotice({ notice, onClose }) {
  if (!notice) return null;
  return <aside className="v3-cart-notice" role="status" aria-live="polite"><div><CheckCircle2 /><span><strong>Ajouté au panier</strong><small>{notice}</small></span><button type="button" onClick={onClose} aria-label="Fermer"><X /></button></div><span><button type="button" onClick={onClose}>Continuer mes achats</button><a href="/panier">Voir le panier <ArrowRight /></a></span></aside>;
}

function focusMainContent() {
  const main = document.getElementById("main-content");
  if (!main) return;
  main.tabIndex = -1;
  main.focus({ preventScroll: true });
  main.scrollIntoView?.({ block: "start" });
}

export function Shell({ cartCount, cartNotice, onCloseNotice, compactCheckout = false, catalogStatus = "loading", children }) {
  return <div className="v3-site" data-catalog-status={catalogStatus}><a className="v3-skip" href="#main-content" onClick={focusMainContent}>Aller au contenu</a>{!compactCheckout && <UtilityBar />}<Header cartCount={cartCount} compact={compactCheckout} />{children}<CartNotice notice={cartNotice} onClose={onCloseNotice} />{!compactCheckout && <Footer />}</div>;
}
