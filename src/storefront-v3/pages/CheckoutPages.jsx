import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle2, CreditCard, FileCheck2, Info, Layers3, Link2, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react";
import { ACTIONS, calculateShipping, formatMoney, PRODUCTS, SHIPPING } from "../../../shared/catalog.js";
import { THEME_LABELS, resolveThemeId } from "../../deviceThemes.js";
import { trackStorefrontEvent } from "../../storefront/analytics.js";
import { ProductArt } from "../scenes/ProductArt.jsx";
import { cartEditDescriptor, compositionLabel, getCachedLogoPreview, itemFingerprint, physicalSupportCount, previewId, saveCartItemAsDraft } from "../commerce/cart.js";
import { shippingPolicyReady, taxLabel } from "../data/content.js";

function CartLine({ item, index, onQuantity, onRemove }) {
  const product = PRODUCTS[item.productId];
  const action = ACTIONS[item.actionId];
  const editable = onQuantity && product.personalization !== "matched";
  const edit = editable ? cartEditDescriptor(item, index) : null;
  const cartTitle = product.kind === "pack"
    ? `${product.supportCount} supports · ${product.personalization === "ready" ? "Prêt à poser" : "À votre image"}`
    : product.name.replace(/ · .+$/, "");
  return (
    <article className="v3-cart-line">
      <div className="v3-cart-art"><ProductArt surface={previewId(item.productId)} actionId={item.actionId} brandName={item.brandName || "VOTRE MARQUE"} brandLogo={getCachedLogoPreview(item.brandLogoId)} theme={item.theme} primaryColor={item.primaryColor} secondaryColor={item.secondaryColor} textColor={item.textColor} customHeadline={item.customHeadline} customSubline={item.customSubline} customTapLabel={item.customTapLabel} personalization={product.personalization === "ready" ? "ready" : "custom"} /></div>
      <div className="v3-cart-copy">
        <span>{product.personalization === "ready" ? "PRÊT À POSER" : product.personalization === "matched" ? "HISTORIQUE" : "À VOTRE IMAGE"}</span>
        <h2>{cartTitle}</h2>
        <dl className="v3-cart-configuration">
          <div><dt>Ouverture</dt><dd>{action.name}{product.kind === "pack" && item.supportComposition ? ` · ${compositionLabel(item.supportComposition)}` : ""}</dd></div>
          {product.personalization === "ready" && <div><dt>Design</dt><dd>{THEME_LABELS[resolveThemeId(item.theme)]}</dd></div>}
          {item.brandName && <div><dt>Marque</dt><dd>{item.brandName}</dd></div>}
          <div><dt>Destination</dt><dd className={item.destinationUrl ? "is-ready" : "is-pending"}>{item.destinationUrl ? "Lien configuré" : "À préciser avant production"}</dd></div>
        </dl>
        <strong>{formatMoney(product.price * item.quantity)}</strong>
      </div>
      {onQuantity && <div className="v3-cart-actions">{edit && <a className="v3-cart-edit" href={edit.href} onClick={() => saveCartItemAsDraft(item, edit)}><FileCheck2 /> Modifier</a>}<div className="v3-cart-quantity"><button type="button" onClick={() => onQuantity(-1)} disabled={item.quantity <= 1} aria-label={`Diminuer la quantité de ${cartTitle}`}><Minus /></button><b aria-label={`Quantité ${item.quantity}`}>{item.quantity}</b><button type="button" onClick={() => onQuantity(1)} aria-label={`Augmenter la quantité de ${cartTitle}`}><Plus /></button></div><button className="v3-cart-remove" type="button" onClick={onRemove} aria-label={`Supprimer ${cartTitle} du panier`}><Trash2 /> Supprimer</button></div>}
    </article>
  );
}

function OrderSummary({ cart, action }) {
  const subtotal = cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0);
  const shipping = shippingPolicyReady ? calculateShipping(subtotal) : 0;
  const freeShippingRemaining = Math.max(0, SHIPPING.freeThreshold - subtotal);
  const hasCustom = cart.some((item) => ["custom", "matched"].includes(PRODUCTS[item.productId].personalization));
  return <aside className="v3-order-summary"><span>RÉCAPITULATIF</span><dl><div><dt>Sous-total</dt><dd>{formatMoney(subtotal)}</dd></div><div><dt>Livraison</dt><dd>{shippingPolicyReady ? (shipping ? formatMoney(shipping) : "Offerte") : "À confirmer"}</dd></div><div><dt>{shippingPolicyReady ? `Total ${taxLabel}` : "Total provisoire"}</dt><dd>{formatMoney(subtotal + shipping)}</dd></div></dl>{shippingPolicyReady && (freeShippingRemaining > 0 ? <div className="v3-shipping-progress"><span>Encore <strong>{formatMoney(freeShippingRemaining)}</strong> pour la livraison offerte</span><i><b style={{ width: `${Math.min(100, subtotal / SHIPPING.freeThreshold * 100)}%` }} /></i></div> : <div className="v3-shipping-progress is-complete"><span><Check /> Livraison offerte</span></div>)}<ul><li><ShieldCheck /> Paiement sécurisé par Stripe</li><li><PackageCheck /> NFC testé et QR inclus</li>{!shippingPolicyReady && <li><Info /> Livraison confirmée avant paiement</li>}{hasCustom && <li><FileCheck2 /> Personnalisation enregistrée</li>}<li><Link2 /> Tapote Pilot inclus pour suivre la destination</li></ul>{action}</aside>;
}

export function CartPage({ cart, setCart }) {
  const changeQuantity = (index, delta) => setCart((current) => {
    const item = current[index];
    if (!item) return current;
    const nextQuantity = item.quantity + delta;
    trackStorefrontEvent("update_cart_quantity", {
      product_id: item.productId,
      quantity: Math.max(0, nextQuantity),
      quantity_change: delta,
      currency: "EUR",
      value: Math.max(0, nextQuantity) * PRODUCTS[item.productId].price / 100,
    });
    return current
      .map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: nextQuantity } : entry)
      .filter((entry) => entry.quantity > 0);
  });
  const removeItem = (index) => setCart((current) => {
    const item = current[index];
    if (!item) return current;
    trackStorefrontEvent("remove_from_cart", {
      product_id: item.productId,
      quantity: item.quantity,
      currency: "EUR",
      value: item.quantity * PRODUCTS[item.productId].price / 100,
    });
    return current.filter((_, itemIndex) => itemIndex !== index);
  });
  const supportTotal = physicalSupportCount(cart);
  const requiresQuote = supportTotal >= 10;
  return (
    <main id="main-content" className="v3-purchase-page">
      <header><span className="v3-eyebrow">VOTRE COMMANDE</span><h1>Votre panier.</h1><p>Vérifiez votre choix avant de continuer.</p></header>
      {!cart.length ? <section className="v3-empty-cart"><ShoppingBag /><h2>Votre panier est vide.</h2><p>Commencez par le support le plus utile à votre activité.</p><a href="/boutique">Voir les produits <ArrowRight /></a></section> : <div className="v3-purchase-layout"><section className="v3-cart-lines">{cart.map((item, index) => <CartLine item={item} index={index} onQuantity={(delta) => changeQuantity(index, delta)} onRemove={() => removeItem(index)} key={`${itemFingerprint(item)}-${index}`} />)}{requiresQuote && <div className="v3-volume-notice"><Layers3 /><span><strong>{supportTotal} supports : un devis sera plus juste.</strong><small>À partir de 10, nous vérifions la composition, les lieux et les coûts avant de vous proposer le tarif le plus juste.</small></span></div>}</section><OrderSummary cart={cart} action={requiresQuote ? <a className="v3-primary-cta" href="/devis">Demander un devis <ArrowRight /></a> : <a className="v3-primary-cta" href="/commande" onClick={() => trackStorefrontEvent("begin_checkout", { value: cart.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0) / 100, currency: "EUR", item_count: physicalSupportCount(cart) })}>Continuer vers la commande <ArrowRight /></a>} /></div>}
    </main>
  );
}

export function CheckoutPage({ cart }) {
  const checkoutCanceled = new URLSearchParams(window.location.search).get("commande") === "annulee";
  const [attemptId] = useState(() => window.crypto.randomUUID());
  const [form, setForm] = useState({ businessName: "", email: "", professionalCustomer: false, termsAccepted: false });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setStatus("loading"); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, items: cart, customer: { businessName: form.businessName, email: form.email, destinationUrl: cart.find((item) => item.destinationUrl)?.destinationUrl || "" }, professionalCustomer: form.professionalCustomer, termsAccepted: form.termsAccepted }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Le paiement est indisponible.");
      window.location.assign(data.url);
    } catch (requestError) { setStatus("error"); setError(requestError.message); }
  };
  if (!cart.length) return <main id="main-content" className="v3-purchase-page"><section className="v3-empty-cart"><ShoppingBag /><h1>Votre panier est vide.</h1><a href="/">Voir les produits <ArrowRight /></a></section></main>;
  if (physicalSupportCount(cart) >= 10) return <main id="main-content" className="v3-purchase-page"><section className="v3-empty-cart"><Layers3 /><span className="v3-eyebrow">10 SUPPORTS OU PLUS</span><h1>Votre projet mérite un devis.</h1><p>Nous validons la composition et les coûts avant de vous proposer le tarif le plus juste.</p><a href="/devis">Demander un devis <ArrowRight /></a></section></main>;
  return (
    <main id="main-content" className="v3-purchase-page">
      <header><span className="v3-eyebrow">COORDONNÉES & PAIEMENT</span><h1>Finalisez votre commande.</h1><p>Stripe recueillera ensuite vos adresses de facturation et de livraison.</p>{checkoutCanceled && <p className="v3-checkout-canceled" role="status">Le paiement a été annulé. Votre panier est intact et rien n’a été débité.</p>}</header>
      <div className="v3-purchase-layout"><form className="v3-checkout-form" onSubmit={submit} aria-label="Coordonnées de commande"><div className="v3-checkout-form-title"><span>1</span><div><h2>Vos informations</h2><p>Le lien obligatoire est déjà enregistré avec chaque support.</p></div></div><label><span>Nom de l’entreprise *</span><input name="businessName" value={form.businessName} onChange={update} required aria-required="true" autoComplete="organization" /></label><label><span>E-mail de commande *</span><input type="email" name="email" value={form.email} onChange={update} required aria-required="true" autoComplete="email" /></label><div className="v3-checkout-help"><Info /><span>Tapote Pilot est inclus pour retrouver vos supports et vérifier leur destination. Le changement de lien à distance est une option Pilot Pro.</span></div><label className="v3-checkbox"><input type="checkbox" name="professionalCustomer" checked={form.professionalCustomer} onChange={update} required aria-required="true" /><span>Je commande pour mon activité professionnelle.</span></label><label className="v3-checkbox"><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} required aria-required="true" /><span>J’accepte les <a href="/cgv" target="_blank">CGV</a> et la <a href="/confidentialite" target="_blank">politique de confidentialité</a>.</span></label><button className="v3-primary-cta" type="submit" disabled={status === "loading"}>{status === "loading" ? "Connexion à Stripe…" : <>Payer en toute sécurité <ArrowRight /></>}</button><div className="v3-checkout-payment-note"><ShieldCheck /><strong>Paiement par carte sécurisé via Stripe</strong></div>{error && <p className="v3-form-error" role="alert">{error}</p>}</form><div className="v3-checkout-order"><h2>Votre commande</h2><section className="v3-checkout-lines">{cart.map((item, index) => <CartLine item={item} key={`${itemFingerprint(item)}-${index}`} />)}</section><OrderSummary cart={cart} /></div></div>
    </main>
  );
}

export function QuotePage() {
  const emptyForm = {
    locationCount: "",
    volume: "",
    primaryAction: "",
    targetDate: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    need: "",
    consent: false,
    website: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const websiteFieldId = useId();
  const projectReady = Boolean(form.locationCount && form.volume && form.primaryAction);
  const contactReady = Boolean(form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()));
  const update = (event) => setForm((current) => ({
    ...current,
    [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
  }));
  const submit = async (event) => {
    event.preventDefault();
    if (!projectReady || !contactReady || !form.need.trim() || !form.consent) return;
    setStatus("loading");
    setMessage("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        company: form.company,
        need: [
          `Nombre de lieux : ${form.locationCount}`,
          `Volume estimé : ${form.volume}`,
          `Action principale : ${form.primaryAction}`,
          form.targetDate ? `Date souhaitée : ${form.targetDate}` : "",
          form.phone ? `Téléphone : ${form.phone}` : "",
          "",
          form.need,
        ].filter((line) => line !== "").join("\n"),
        consent: form.consent,
        website: form.website,
      };
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi impossible.");
      setStatus("success");
      setMessage("Demande reçue. Nous revenons vers vous avec une proposition précise.");
      trackStorefrontEvent("lead_submit", { lead_type: "volume_quote" });
      setForm(emptyForm);
    } catch (requestError) {
      setStatus("error");
      setMessage(requestError.message);
    }
  };
  return (
    <main id="main-content" className="v3-quote-page">
      <section className="v3-quote-intro">
        <nav className="v3-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span>/</span><b>Devis</b></nav>
        <span className="v3-eyebrow v3-eyebrow-dark">10 SUPPORTS OU PLUS</span>
        <h1>Votre projet.<br />Un tarif clair.</h1>
        <p>Indiquez vos lieux, le volume et l’usage recherché. Nous préparons une proposition adaptée à votre projet.</p>
        <div className="v3-quote-routing" aria-label="Choisir le bon parcours">
          <a href="/boutique"><span>1–9 supports</span><b>Commandez directement en ligne</b><small>Voir la boutique <ArrowRight /></small></a>
          <div><span>10+ ou plusieurs lieux</span><b>Recevez une proposition adaptée</b><small>Vous êtes au bon endroit <CheckCircle2 /></small></div>
        </div>
        <ul><li><Check /> Comptoirs et Plaques combinables</li><li><Check /> Une identité cohérente pour chaque lieu</li><li><Check /> Une destination différente par support si besoin</li></ul>
      </section>
      <form className="v3-quote-form" onSubmit={submit}>
        <div className="v3-quote-form-head"><span>DEMANDE PROFESSIONNELLE</span><h2>Parlons de votre projet.</h2><p>Trois étapes courtes. Aucun engagement.</p></div>
        <nav className="v3-quote-progress" aria-label="Étapes de la demande">
          {[
            [1, "Projet"],
            [2, "Contact"],
            [3, "Brief"],
          ].map(([number, label]) => (
            <button
              type="button"
              className={step === number ? "is-active" : step > number ? "is-complete" : ""}
              aria-current={step === number ? "step" : undefined}
              disabled={number > step}
              onClick={() => setStep(number)}
              key={number}
            >
              <b>{step > number ? <Check /> : number}</b>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <label className="v3-form-honeypot" htmlFor={websiteFieldId} aria-hidden="true"><span>Site web</span><input id={websiteFieldId} name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" aria-hidden="true" /></label>
        {step === 1 && (
          <section className="v3-quote-step" aria-labelledby="v3-quote-project-title">
            <div><span>01</span><h3 id="v3-quote-project-title">Le périmètre</h3><p>Les éléments essentiels pour préparer la bonne composition.</p></div>
            <div className="v3-quote-field-grid">
              <label><span>Nombre de lieux *</span><input type="number" min="1" max="200" name="locationCount" value={form.locationCount} onChange={update} placeholder="Ex. 3" required aria-required="true" /></label>
              <label><span>Volume estimé *</span><select name="volume" value={form.volume} onChange={update} required aria-required="true"><option value="">Choisir</option><option>10–24 supports</option><option>25–49 supports</option><option>50–99 supports</option><option>100 supports ou plus</option></select></label>
              <label><span>Action principale *</span><select name="primaryAction" value={form.primaryAction} onChange={update} required aria-required="true"><option value="">Choisir</option><option>Avis Google</option><option>Menu ou commande</option><option>Réservation</option><option>Contact ou portfolio</option><option>Wi-Fi ou informations</option><option>Plusieurs actions</option></select></label>
              <label><span>Date souhaitée <small>(facultatif)</small></span><input type="date" name="targetDate" value={form.targetDate} onChange={update} /></label>
            </div>
            <button className="v3-quote-next" type="button" disabled={!projectReady} onClick={() => setStep(2)}>Continuer vers vos coordonnées <ArrowRight /></button>
          </section>
        )}
        {step === 2 && (
          <section className="v3-quote-step" aria-labelledby="v3-quote-contact-title">
            <div><span>02</span><h3 id="v3-quote-contact-title">Vos coordonnées</h3><p>Pour vous envoyer la proposition au bon endroit.</p></div>
            <div className="v3-quote-field-grid">
              <label><span>Votre nom *</span><input name="name" value={form.name} onChange={update} required aria-required="true" autoComplete="name" /></label>
              <label><span>E-mail professionnel *</span><input type="email" name="email" value={form.email} onChange={update} required aria-required="true" autoComplete="email" /></label>
              <label><span>Entreprise</span><input name="company" value={form.company} onChange={update} autoComplete="organization" /></label>
              <label><span>Téléphone <small>(facultatif)</small></span><input type="tel" name="phone" value={form.phone} onChange={update} autoComplete="tel" /></label>
            </div>
            <div className="v3-quote-step-actions"><button type="button" onClick={() => setStep(1)}>Retour</button><button className="v3-quote-next" type="button" disabled={!contactReady} onClick={() => setStep(3)}>Continuer vers le brief <ArrowRight /></button></div>
          </section>
        )}
        {step === 3 && (
          <section className="v3-quote-step" aria-labelledby="v3-quote-brief-title">
            <div><span>03</span><h3 id="v3-quote-brief-title">Le brief utile</h3><p>Ajoutez les contraintes ou différences entre vos lieux.</p></div>
            <dl className="v3-quote-summary">
              <div><dt>Lieux</dt><dd>{form.locationCount}</dd></div>
              <div><dt>Volume</dt><dd>{form.volume}</dd></div>
              <div><dt>Action</dt><dd>{form.primaryAction}</dd></div>
            </dl>
            <label><span>Précisions utiles *</span><textarea name="need" value={form.need} onChange={update} rows="6" placeholder="Ex. 3 restaurants, une identité commune, avis à la caisse et menu à table…" required aria-required="true" /></label>
            <label className="v3-checkbox"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required aria-required="true" /><span>J’accepte que Tapote utilise ces informations pour répondre à ma demande, conformément à la <a href="/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</a>.</span></label>
            <p className="v3-quote-commitment"><ShieldCheck /> Nous étudions le besoin avant de confirmer matière, délai et prix. Aucun engagement à l’envoi.</p>
            <div className="v3-quote-step-actions"><button type="button" onClick={() => setStep(2)}>Retour</button><button className="v3-primary-cta" type="submit" disabled={status === "loading" || !form.need.trim() || !form.consent}>{status === "loading" ? "Envoi…" : <>Recevoir une proposition <ArrowRight /></>}</button></div>
          </section>
        )}
        {message && <p className={`v3-form-message is-${status}`} role="status" aria-live="polite">{message}</p>}
      </form>
    </main>
  );
}

export function ConfirmationPage({ setCart }) {
  const sessionId = new URLSearchParams(window.location.search).get("session_id") || "";
  const [status, setStatus] = useState(sessionId ? "checking" : "error");
  const [orderReference, setOrderReference] = useState("");
  const purchaseTrackedRef = useRef(false);
  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    let timer;
    let attempt = 0;
    const verify = async () => {
      try {
        const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`); const data = await response.json();
        if (!response.ok) throw new Error();
        if (!active) return;
        const nextStatus = ["paid", "demo", "expired", "payment_failed", "processing"].includes(data.status) ? data.status : "error";
        setStatus(nextStatus);
        if (data.reference) setOrderReference(`TAP-${String(data.reference).split("-")[0].toUpperCase()}`);
        if (["paid", "demo"].includes(data.status)) {
          if (data.status === "paid" && !purchaseTrackedRef.current) {
            purchaseTrackedRef.current = true;
            trackStorefrontEvent("purchase", { transaction_id: data.reference || sessionId });
          }
          setCart([]);
          return;
        }
        if (["expired", "payment_failed"].includes(nextStatus)) return;
        attempt += 1;
        if (attempt < 5) timer = window.setTimeout(verify, 1500);
        else setStatus("pending");
      } catch { if (active) setStatus("error"); }
    };
    void verify(); return () => { active = false; window.clearTimeout(timer); };
  }, [sessionId, setCart]);
  const success = ["paid", "demo"].includes(status);
  const content = {
    checking: ["VÉRIFICATION", "Nous vérifions votre paiement.", "Ne relancez pas le paiement tant que la vérification est en cours."],
    processing: ["VÉRIFICATION", "Le paiement est en traitement.", "La confirmation peut prendre quelques instants. Ne relancez pas encore la commande."],
    pending: ["TOUJOURS EN ATTENTE", "Stripe n’a pas encore confirmé le paiement.", "Vérifiez votre e-mail. En cas de doute, contactez Tapote avant toute nouvelle tentative."],
    paid: ["COMMANDE CONFIRMÉE", "Merci. On s’occupe de la suite.", "Votre configuration est enregistrée. Nous contrôlons maintenant le NFC et le QR avant production."],
    demo: ["COMMANDE DE DÉMONSTRATION", "Le parcours de test est terminé.", "Aucune somme n’a été débitée."],
    expired: ["SESSION EXPIRÉE", "La session de paiement a expiré.", "Aucun paiement n’a été confirmé. Votre panier est conservé et vous pouvez reprendre la commande."],
    payment_failed: ["PAIEMENT NON ABOUTI", "Le paiement n’a pas été confirmé.", "Aucune commande ne partira en production. Votre panier est conservé pour réessayer."],
    error: ["VÉRIFICATION IMPOSSIBLE", "Nous ne pouvons pas confirmer la commande.", "Vérifiez votre e-mail ou contactez Tapote avant de recommencer un paiement."],
  }[status] || ["VÉRIFICATION", "Nous vérifions votre paiement.", "Patientez quelques instants."];
  const retryAllowed = ["expired", "payment_failed"].includes(status);
  return <main id="main-content" className={`v3-confirmation ${success ? "is-success" : ""}`}><div>{success ? <CheckCircle2 /> : ["checking", "processing", "pending"].includes(status) ? <CreditCard /> : <X />}</div><span className="v3-eyebrow">{content[0]}</span><h1>{content[1]}</h1>{orderReference && <strong className="v3-order-reference">Référence {orderReference}</strong>}<p>{content[2]}</p>{retryAllowed && <a href="/commande">Reprendre la commande <ArrowRight /></a>}{!retryAllowed && <a href={status === "error" ? "/panier" : "/"}>{status === "error" ? "Voir mon panier" : "Retour à l’accueil"} <ArrowRight /></a>}</main>;
}
