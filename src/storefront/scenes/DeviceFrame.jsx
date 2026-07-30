import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Ellipsis,
  ExternalLink,
  Flashlight,
  Globe2,
  Link2,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  RefreshCw,
  ShoppingBag,
  Star,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { resolveScreenModel, SCREEN_FAMILIES } from "./screenData.js";
import "./scene-engine.css";

function StatusBar() {
  return (
    <div className="tapote-device__status" aria-hidden="true">
      <span>9:41</span>
      <i className="tapote-device__island" />
      <span className="tapote-device__indicators">
        <i className="tapote-device__signal" />
        <Wifi />
        <b />
      </span>
    </div>
  );
}

function SafariDock() {
  return (
    <div className="tapote-device__safari" aria-hidden="true">
      <ArrowLeft />
      <Menu />
      <div className="tapote-device__safari-address">
        <span>tapote.fr</span>
        <RefreshCw />
      </div>
      <Ellipsis />
    </div>
  );
}

function ScreenStatus({ model }) {
  return model.destinationUrl ? (
    <a className="tapote-device__destination" href={model.destinationUrl} target="_blank" rel="noreferrer">
      Ouvrir la destination <ExternalLink aria-hidden="true" />
    </a>
  ) : (
    <p className="tapote-device__pilot-status">
      <span aria-hidden="true" />
      Destination à définir dans Tapote Pilot
    </p>
  );
}

function DestinationBrand({ model, label }) {
  return (
    <header className="tapote-destination__brand">
      <i aria-hidden="true"><Building2 /></i>
      <span><small>{label}</small><strong>{model.brandName}</strong></span>
    </header>
  );
}

function ReputationScreen({ model }) {
  return (
    <section className="tapote-device__family is-reputation">
      <div className="tapote-google-review__toolbar">
        <div className="tapote-device__google-lockup" role="img" aria-label="Google">
          <b><i>G</i><i>o</i><i>o</i><i>g</i><i>l</i><i>e</i></b>
        </div>
        <span><strong>Votre avis</strong><small>Visible publiquement</small></span>
        <span className="tapote-google-review__publish" aria-hidden="true">Publier</span>
      </div>
      <DestinationBrand model={model} label="Donner votre avis à" />
      <h3>Comment s’est passée votre visite&nbsp;?</h3>
      <p className="tapote-google-review__prompt">Appuyez sur une étoile pour noter votre expérience.</p>
      <div className="tapote-device__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => <Star key={value} aria-hidden="true" fill="currentColor" />)}
      </div>
      <div className="tapote-device__review-field">Partagez plus de détails sur votre expérience…</div>
      <div className="tapote-google-review__photo"><Camera aria-hidden="true" /> Ajouter des photos</div>
      <ScreenStatus model={model} />
    </section>
  );
}

function CommerceScreen({ model }) {
  const actionClass = `is-action-${model.actionId}`;

  if (model.actionId === "paiement") {
    return (
      <section className={`tapote-device__family is-commerce ${actionClass}`}>
        <DestinationBrand model={model} label="Paiement sécurisé" />
        <div className="tapote-destination__title-row">
          <span>PAIEMENT</span>
          <CreditCard aria-hidden="true" />
        </div>
        <h3>Régler en quelques secondes</h3>
        <div className="tapote-payment__amount">
          <span><small>Montant</small><strong>À confirmer</strong></span>
          <CheckCircle2 aria-hidden="true" />
        </div>
        <div className="tapote-payment__methods" aria-hidden="true">
          <span className="is-selected"><CreditCard /> Carte bancaire</span>
          <span><i></i> Pay</span>
        </div>
        <span className="tapote-device__primary-action" aria-hidden="true">Continuer vers le paiement</span>
        <p className="tapote-device__context">{model.context}</p>
        <ScreenStatus model={model} />
      </section>
    );
  }

  if (model.actionId === "pourboire") {
    return (
      <section className={`tapote-device__family is-commerce ${actionClass}`}>
        <DestinationBrand model={model} label="Remerciement" />
        <div className="tapote-destination__title-row">
          <span>POURBOIRE</span>
          <CreditCard aria-hidden="true" />
        </div>
        <h3>Ajouter un pourboire&nbsp;?</h3>
        <p className="tapote-device__intro-copy">Choisissez librement le montant avant de continuer.</p>
        <div className="tapote-tip__choices" aria-hidden="true">
          <span>5&nbsp;%</span><span className="is-selected">10&nbsp;%</span><span>15&nbsp;%</span><span>Autre</span>
        </div>
        <span className="tapote-device__primary-action" aria-hidden="true">Continuer</span>
        <span className="tapote-device__text-action" aria-hidden="true">Non merci</span>
        <ScreenStatus model={model} />
      </section>
    );
  }

  if (model.actionId === "fidelite") {
    return (
      <section className={`tapote-device__family is-commerce ${actionClass}`}>
        <DestinationBrand model={model} label="Carte fidélité" />
        <div className="tapote-destination__title-row">
          <span>FIDÉLITÉ</span>
          <Star aria-hidden="true" />
        </div>
        <h3>Votre carte, toujours avec vous</h3>
        <div className="tapote-loyalty__card">
          <small>PASSAGES</small>
          <div aria-hidden="true">{[1, 2, 3, 4, 5, 6].map((item) => <i className={item < 4 ? "is-filled" : ""} key={item}>{item < 4 ? <Check /> : item}</i>)}</div>
          <span>Encore quelques gestes avant la prochaine attention.</span>
        </div>
        <span className="tapote-device__primary-action" aria-hidden="true">Présenter ma carte</span>
        <ScreenStatus model={model} />
      </section>
    );
  }

  if (model.actionId === "commande") {
    return (
      <section className={`tapote-device__family is-commerce ${actionClass}`}>
        <DestinationBrand model={model} label="Commande en ligne" />
        <div className="tapote-destination__title-row">
          <span>COMMANDE</span>
          <ShoppingBag aria-hidden="true" />
        </div>
        <h3>Commander maintenant</h3>
        <nav className="tapote-device__category-tabs" aria-label="Catégories présentées">
          <b>À la carte</b><span>Formules</span><span>Panier</span>
        </nav>
        <div className="tapote-device__commerce-list" aria-hidden="true">
          <article><i /><span><strong>Sélection du moment</strong><small>Voir les choix disponibles</small></span><ChevronRight /></article>
          <article><i /><span><strong>Commander à emporter</strong><small>Choisir une heure de retrait</small></span><ChevronRight /></article>
        </div>
        <span className="tapote-device__primary-action" aria-hidden="true">Voir la carte</span>
        <ScreenStatus model={model} />
      </section>
    );
  }

  return (
    <section className={`tapote-device__family is-commerce ${actionClass}`}>
      <DestinationBrand model={model} label={model.actionId === "menu" ? "Menu en ligne" : model.actionLabel} />
      <div className="tapote-destination__title-row">
        <span>{model.actionLabel}</span>
        {model.actionId === "menu" ? <UtensilsCrossed aria-hidden="true" /> : <ShoppingBag aria-hidden="true" />}
      </div>
      <h3>{model.title}</h3>
      <nav className="tapote-device__category-tabs" aria-label="Catégories présentées">
        <b>À la carte</b><span>Boissons</span><span>Infos</span>
      </nav>
      <div className="tapote-device__commerce-list" aria-hidden="true">
        <article><i /><span><strong>La sélection du moment</strong><small>Découvrir la carte</small></span><ChevronRight /></article>
        <article><i /><span><strong>Boissons et accompagnements</strong><small>Voir les choix disponibles</small></span><ChevronRight /></article>
      </div>
      <span className="tapote-device__primary-action" aria-hidden="true">Consulter le menu</span>
      <ScreenStatus model={model} />
    </section>
  );
}

function BookingScreen({ model }) {
  if (model.actionId === "formulaire") {
    return (
      <section className="tapote-device__family is-booking is-action-formulaire">
        <DestinationBrand model={model} label="Formulaire en ligne" />
        <div className="tapote-destination__title-row">
          <span>VOTRE DEMANDE</span>
          <ExternalLink aria-hidden="true" />
        </div>
        <h3>Parlons de votre projet</h3>
        <p className="tapote-device__intro-copy">Quelques informations suffisent pour être recontacté.</p>
        <div className="tapote-form__fields" aria-hidden="true">
          <span><small>Nom</small><b>Votre nom</b></span>
          <span><small>E-mail</small><b>vous@entreprise.fr</b></span>
          <span className="is-large"><small>Votre demande</small><b>Décrivez votre besoin…</b></span>
        </div>
        <span className="tapote-device__primary-action" aria-hidden="true">Envoyer la demande</span>
        <ScreenStatus model={model} />
      </section>
    );
  }

  return (
    <section className="tapote-device__family is-booking">
      <DestinationBrand model={model} label="Réservation" />
      <div className="tapote-destination__title-row">
        <span>RÉSERVATION</span>
        <CalendarDays aria-hidden="true" />
      </div>
      <h3>{model.title}</h3>
      <div className="tapote-device__booking-calendar" aria-hidden="true">
        <header><b>Choisir un jour</b><span>Juillet</span></header>
        <div><i><small>Lun.</small>27</i><i><small>Mar.</small>28</i><i><small>Mer.</small>29</i><i className="is-selected"><small>Jeu.</small>30</i><i><small>Ven.</small>31</i></div>
      </div>
      <div className="tapote-device__booking-slots" aria-hidden="true">
        <span>09:30</span><span>11:00</span><span>14:30</span>
      </div>
      <span className="tapote-device__primary-action" aria-hidden="true">Continuer</span>
      <p className="tapote-device__context">{model.context}</p>
      <ScreenStatus model={model} />
    </section>
  );
}

function ContactScreen({ model }) {
  if (model.actionId === "whatsapp") {
    return (
      <section className="tapote-device__family is-contact is-action-whatsapp">
        <div className="tapote-whatsapp__bar">
          <ArrowLeft aria-hidden="true" />
          <i><Building2 aria-hidden="true" /></i>
          <span><strong>{model.brandName}</strong><small>Compte professionnel</small></span>
          <Phone aria-hidden="true" />
        </div>
        <div className="tapote-whatsapp__conversation" aria-hidden="true">
          <p>Bonjour, comment pouvons-nous vous aider&nbsp;?</p>
          <span>Aujourd’hui · 9:41</span>
        </div>
        <span className="tapote-device__primary-action" aria-hidden="true">
          <MessageCircle aria-hidden="true" /> Ouvrir WhatsApp
        </span>
        <ScreenStatus model={model} />
      </section>
    );
  }

  if (model.actionId === "multiliens") {
    return (
      <section className="tapote-device__family is-contact is-action-multiliens">
        <div className="tapote-multilinks__identity">
          <i><Building2 aria-hidden="true" /></i>
          <span><h3>{model.brandName}</h3><small>{model.sectorTitle}</small></span>
        </div>
        <p className="tapote-device__intro-copy">Retrouvez les liens utiles au même endroit.</p>
        <div className="tapote-multilinks__list" aria-hidden="true">
          <span><Globe2 /><b>Site internet</b><ChevronRight /></span>
          <span><CalendarDays /><b>Prendre rendez-vous</b><ChevronRight /></span>
          <span><MessageCircle /><b>Nous contacter</b><ChevronRight /></span>
        </div>
        <ScreenStatus model={model} />
      </section>
    );
  }

  return (
    <section className="tapote-device__family is-contact">
      <span className="tapote-contact__handle" aria-hidden="true" />
      <div className="tapote-device__contact-card">
        <i><Building2 aria-hidden="true" /></i>
        <span><small>Fiche de contact</small><h3>{model.brandName}</h3><b>{model.sectorTitle}</b></span>
      </div>
      <div className="tapote-device__contact-actions" aria-hidden="true">
        <span><i><Phone /></i><small>Appeler</small></span>
        <span><i><Mail /></i><small>E-mail</small></span>
        <span><i><MessageCircle /></i><small>Message</small></span>
        <span><i><Globe2 /></i><small>Site</small></span>
      </div>
      <span className="tapote-device__primary-action" aria-hidden="true"><Check /> Ajouter aux contacts</span>
      <ScreenStatus model={model} />
    </section>
  );
}

function SocialScreen({ model }) {
  return (
    <section className={`tapote-device__family is-social is-action-${model.actionId}`}>
      <div className="tapote-device__social-bar">
        <strong>{model.actionLabel}</strong>
        <span><ExternalLink aria-hidden="true" /><Ellipsis aria-hidden="true" /></span>
      </div>
      <div className="tapote-device__profile">
        <i aria-hidden="true"><Building2 /></i>
        <span><strong>{model.brandName}</strong><small>Profil professionnel</small></span>
      </div>
      <span className="tapote-device__primary-action" aria-hidden="true">Voir le profil</span>
      <div className="tapote-social__tabs" aria-hidden="true"><b>Publications</b><span>À propos</span><span>Contact</span></div>
      <div className="tapote-device__social-grid" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <ScreenStatus model={model} />
    </section>
  );
}

function AccessScreen({ model }) {
  const Icon = model.actionId === "wifi" ? Wifi : Link2;
  return (
    <section className={`tapote-device__family is-access is-action-${model.actionId}`}>
      <div className="tapote-device__web-hero">
        <i><Icon aria-hidden="true" /></i>
        <span><small>{model.actionLabel}</small><h3>{model.brandName}</h3><b>{model.title}</b></span>
      </div>
      {model.actionId === "wifi" ? (
        <div className="tapote-wifi__network">
          <span><Wifi aria-hidden="true" /><b>Réseau de l’établissement</b></span>
          <small>Réseau sécurisé · aucune application nécessaire</small>
        </div>
      ) : (
        <div className="tapote-device__web-content" aria-hidden="true"><i /><i /><i /></div>
      )}
      <span className="tapote-device__primary-action" aria-hidden="true">{model.actionId === "wifi" ? "Rejoindre le réseau" : "Continuer vers le site"}</span>
      <ScreenStatus model={model} />
    </section>
  );
}

const FAMILY_COMPONENTS = Object.freeze({
  [SCREEN_FAMILIES.reputation]: ReputationScreen,
  [SCREEN_FAMILIES.commerce]: CommerceScreen,
  [SCREEN_FAMILIES.booking]: BookingScreen,
  [SCREEN_FAMILIES.contact]: ContactScreen,
  [SCREEN_FAMILIES.social]: SocialScreen,
  [SCREEN_FAMILIES.access]: AccessScreen,
});

export default function DeviceFrame({
  actionId = "avis",
  sectorId = "",
  sectorTitle = "",
  brandName = "",
  personalization = "ready",
  destinationUrl = "",
  accentColor = "#2458ff",
  embedded = false,
  demonstration = false,
  className = "",
}) {
  const model = resolveScreenModel({
    actionId,
    sectorId,
    sectorTitle,
    brandName,
    personalization,
    destinationUrl,
  });
  const Screen = FAMILY_COMPONENTS[model.family] || AccessScreen;
  const isContact = model.family === SCREEN_FAMILIES.contact;
  const style = { "--tapote-device-accent": accentColor };
  const frameRef = useRef(null);

  useLayoutEffect(() => {
    if (embedded) return undefined;
    const frame = frameRef.current;
    if (!frame) return undefined;
    const syncScreenScale = () => {
      const frameWidth = frame.getBoundingClientRect().width;
      if (!frameWidth) return;
      const bezel = frameWidth * 0.034;
      const chromeInset = bezel * 2;
      const outerRadius = frameWidth * 0.152;
      const innerRadius = Math.max(outerRadius - bezel, frameWidth * 0.112);
      const scale = Math.max(0.18, (frameWidth - chromeInset) / 390);
      frame.style.setProperty("--tapote-device-bezel", `${bezel.toFixed(3)}px`);
      frame.style.setProperty("--tapote-device-outer-radius", `${outerRadius.toFixed(3)}px`);
      frame.style.setProperty("--tapote-device-inner-radius", `${innerRadius.toFixed(3)}px`);
      frame.style.setProperty("--tapote-device-scale", scale.toFixed(5));
      frame.style.setProperty("--tapote-device-height", `${(844 * scale) + chromeInset}px`);
    };
    syncScreenScale();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(syncScreenScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [embedded]);

  return (
    <div
      ref={frameRef}
      className={`tapote-device-frame v3-live-phone-screen ${embedded ? "is-embedded" : "is-standalone"} ${demonstration ? "is-demonstration" : ""} ${className}`}
      style={style}
      data-phone-action={model.actionId}
      data-phone-sector={sectorId || undefined}
      data-screen-family={model.family}
      data-phone-render-mode={embedded ? "screen-inlay" : "complete-device"}
      role={model.destinationUrl ? "group" : "img"}
      aria-label={`Écran du téléphone après ouverture : ${model.actionLabel}`}
    >
      <svg className="v3-live-phone-svg tapote-device__geometry" viewBox="0 0 390 844" aria-hidden="true">
        <rect x="1" y="1" width="388" height="842" rx="60" />
      </svg>
      <div className="v3-live-phone-canvas tapote-device__canvas">
        <div className="v3-live-phone-ui tapote-device__screen">
          {!embedded && <StatusBar />}
          {demonstration && (
            <div className="tapote-device__lock-sequence" aria-hidden="true">
              <StatusBar />
              <div className="tapote-device__lock-icon"><span /></div>
              <div className="tapote-device__lock-clock">
                <span>Jeudi 30 juillet</span>
                <strong>9:41</strong>
              </div>
              <div className="tapote-device__tap-notification">
                <i>t.</i>
                <span><small>TAPOTE · NFC</small><strong>{model.actionLabel}</strong><em>Toucher pour ouvrir</em></span>
                <b>maintenant</b>
              </div>
              <div className="tapote-device__lock-actions">
                <i><Flashlight /></i>
                <span>Balayez vers le haut pour ouvrir</span>
                <i><Camera /></i>
              </div>
              <i className="tapote-device__lock-home" />
            </div>
          )}
          <Screen model={model} />
          {!isContact && <SafariDock />}
          <i className="tapote-device__home" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
