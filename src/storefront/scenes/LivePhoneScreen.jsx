import { useId } from "react";
import {
  Bookmark, CalendarDays, Camera, Check, CheckCircle2, CircleDollarSign, Clapperboard, ClipboardList,
  ContactRound, CreditCard, Gift, Globe2, Grid3X3, Heart, Home, Inbox, Info, Layers3, Link2, LockKeyhole,
  MapPin, Menu, MessageCircle, Mic, Music2, PhoneCall, Plus, Search, Share2, ShoppingBag, UserRound,
  UsersRound, UtensilsCrossed, Video, Wifi,
} from "lucide-react";
import { GeneratedBrandMark, PlatformGlyph } from "../BrandMark.jsx";
import { contrastRatio, normalizeHexColor } from "../../deviceThemes.js";
import {
  compactEuro,
  parseEuroAmount,
  phoneSectorExperience,
  phoneSectorMedia,
  phoneSectorProfile,
  PHONE_SCREENS,
  RESTAURANT_PHONE_MEDIA,
  resolvePhoneSectorId,
} from "./livePhoneData.js";
import "./live-phone.css";

// Écrans d'application restaurés depuis la version en production : Google Avis,
// Instagram, TikTok, Facebook, LinkedIn, WhatsApp, Apple Pay, Safari et les
// réglages Wi-Fi reprennent la vraie interface, avec le logo et les couleurs du
// client. Le cadre du téléphone, lui, reste géré par DeviceFrame.
const PLACEHOLDER_BRANDS = ["", "VOTRE MARQUE", "VOTRE ETABLISSEMENT"];

// Une capture d'application ne montre jamais un gabarit : sans nom saisi, on
// parle de « Votre établissement » plutôt que d'afficher « VOTRE MARQUE » ou la
// pastille pointillée « ajouter un logo ».
function displayBrandName(value) {
  const normalized = String(value || "").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  return PLACEHOLDER_BRANDS.includes(normalized) ? "Votre établissement" : value.trim();
}

function PhoneActionPreview({ actionId, screen, sceneImage = "", brandName = "", sectorId = "" }) {
  const safeBrandName = displayBrandName(brandName);
  const resolvedSectorId = resolvePhoneSectorId(sectorId, sceneImage);
  const profile = phoneSectorProfile(resolvedSectorId, sceneImage);
  const experience = phoneSectorExperience(resolvedSectorId);
  const media = phoneSectorMedia(resolvedSectorId);
  const isRestaurant = resolvedSectorId === "restaurant";
  if (actionId === "avis") return <div className="v3-phone-google-card">
    <header><PlatformGlyph id="google" /><span><b>Publier un avis</b><small>{safeBrandName} · Google Maps</small></span></header>
    <div className="v3-phone-google-user"><i>R</i><span><b>Votre compte Google</b><small>Publication publique</small></span></div>
    <div className="v3-phone-google-stars" aria-label="5 étoiles"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></div>
    <span className="v3-phone-review-copy">Partagez des détails sur votre expérience</span>
    <span className="v3-phone-google-photo-action"><Camera /> Ajouter des photos</span>
  </div>;
  if (actionId === "menu") {
    return <div className="v3-phone-menu-card"><nav><b>{experience.tabs[0]}</b><span>{experience.tabs[1]}</span><span>{experience.tabs[2]}</span></nav>{profile.menuItems.map(([name, detail, price]) => <div key={name}><span><b>{name}</b><small>{detail}</small></span><strong>{price}</strong></div>)}</div>;
  }
  if (actionId === "reservation") return <div className="v3-phone-booking-card">
    <header><span><UserRound />{profile.bookingSubject}</span><small>Modifier</small></header>
    <div className="v3-phone-booking-days"><span>Lun<small>21</small></span><span className="is-selected">Mar<small>22</small></span><span>Mer<small>23</small></span><span>Jeu<small>24</small></span></div>
    <strong>{profile.bookingService}</strong>
    <nav>{experience.times.map((time, index) => <span className={index === 1 ? "is-selected" : ""} key={time}>{time}</span>)}</nav>
    <footer><CheckCircle2 /> Confirmation immédiate</footer>
  </div>;
  if (actionId === "commande") {
    const items = isRestaurant ? [
      { name: "Burrata du marché", detail: "Tomates anciennes", price: "12 €", image: RESTAURANT_PHONE_MEDIA.burrata },
      { name: "Magret de canard", detail: "Pommes grenaille", price: "24 €", image: RESTAURANT_PHONE_MEDIA.duck },
      { name: "Crème brûlée", detail: "Vanille de Madagascar", price: "8 €", image: RESTAURANT_PHONE_MEDIA.dessert },
    ] : profile.orderItems.map(([name, detail, price], index) => ({ name, detail, price, image: media[index % media.length] }));
    const calculatedTotal = items.reduce((sum, item) => sum + parseEuroAmount(item.price), 0);
    return <div className="v3-phone-order-card">{items.map((item, index) => <div key={item.name}><img src={item.image} alt="" style={socialCropStyle(item.image, index + 1)} /><span><b>{item.name}</b><small>{item.detail}</small><em>× 1</em></span><strong>{item.price}</strong></div>)}<footer><span><small>{items.length} article{items.length > 1 ? "s" : ""}</small>Total</span><b>{calculatedTotal ? compactEuro(calculatedTotal) : profile.paymentAmount}</b></footer></div>;
  }
  if (actionId === "pourboire") {
    const bill = parseEuroAmount(profile.paymentAmount);
    return <div className="v3-phone-payment-card is-pourboire">
    <header><span>{profile.paymentLabel}</span><b>{profile.paymentAmount}</b></header>
    <small>POUR L’ÉQUIPE</small><strong>Merci !</strong>
    <nav><span>0 %<small>Aucun</small></span>{[5, 10, 15].map((rate) => <span className={rate === 10 ? "is-selected" : ""} key={rate}>{rate} %<small>{compactEuro((bill * rate) / 100)}</small></span>)}</nav>
    <span>Le pourboire est intégralement reversé à l’équipe.</span>
  </div>;
  }
  if (actionId === "fidelite") return <div className="v3-phone-loyalty-card">
    <header><span>Carte de fidélité</span><b>4 / 5 visites</b></header>
    <div>{[1, 2, 3, 4, 5].map((step) => <span className={step < 5 ? "is-complete" : ""} key={step}>{step < 5 ? "✓" : step}</span>)}</div>
    <section><Gift /><span><small>PROCHAINE RÉCOMPENSE</small><strong>{profile.reward}</strong></span></section>
    <small>Encore une visite chez {safeBrandName}.</small>
  </div>;
  if (actionId === "wifi") return <div className="v3-phone-wifi-card"><i>⌁</i><span><small>RÉSEAU</small><b>INVITÉS</b></span><strong>Connecté</strong></div>;
  if (actionId === "site") return <div className="v3-phone-website-card"><div><span>NOTRE SAVOIR-FAIRE</span><strong>Des gestes précis.<br />Un résultat durable.</strong></div><nav><span>Services</span><span>Réalisations</span><span>Contact</span></nav></div>;
  if (actionId === "contact") return <div className="v3-phone-contact-card">
    <div><span><PhoneCall /></span><p><small>APPELER</small><b>{profile.phone}</b></p></div>
    <div><span><ContactRound /></span><p><small>E-MAIL</small><b>{profile.email}</b></p></div>
    <div><span><MapPin /></span><p><small>ITINÉRAIRE</small><b>{profile.address}</b></p></div>
  </div>;
  if (actionId === "whatsapp") return <div className="v3-phone-whatsapp-card"><div><PlatformGlyph id="whatsapp" /><b>WhatsApp</b><span>en ligne</span></div><p>Bonjour ! Comment pouvons-nous vous aider ?</p><small>Écrivez votre message…</small></div>;
  if (actionId === "multiliens") {
    const LinkIcons = [Globe2, CalendarDays, MapPin, PhoneCall];
    return <div className="v3-phone-links-card">{profile.links.map(([title, detail], index) => { const LinkIcon = LinkIcons[index]; return <div key={title}><span><LinkIcon /></span><p><b>{title}</b><small>{detail}</small></p><strong>›</strong></div>; })}</div>;
  }
  if (actionId === "formulaire") return <div className="v3-phone-form-card">
    <label><small>NOM COMPLET</small><span>Votre nom</span></label>
    <label><small>VOTRE DEMANDE</small><span>{profile.formType} <b>⌄</b></span></label>
    <label><small>MESSAGE</small><span className="is-large">{profile.formPlaceholder}</span></label>
    <p><Check /> Réponse habituelle sous 24 h</p>
  </div>;
  return <strong className={`v3-phone-detail is-${actionId}`}>{screen.detail}</strong>;
}

function instagramPostImages(sceneImage, sectorId = "") {
  return phoneSectorMedia(resolvePhoneSectorId(sectorId, sceneImage));
}

const SOCIAL_CROP_POSITIONS = ["18% 22%", "52% 18%", "82% 28%", "20% 72%", "54% 66%", "82% 76%"];
const socialCropStyle = (image, index) => ({
  "--v3-phone-post-image": `url(${image})`,
  "--v3-phone-post-position": SOCIAL_CROP_POSITIONS[index % SOCIAL_CROP_POSITIONS.length],
  "--v3-phone-post-size": index % 3 === 1 ? "220%" : "185%",
});

function InstagramPhoneApp({ brandAvatar, brandName, handle, sceneImage, profile, sectorId }) {
  const posts = instagramPostImages(sceneImage, sectorId);
  return <div className="v3-instagram-app">
    <header><strong>{handle.replace(/^@/, "")}⌄</strong><span><Plus /><Menu /></span></header>
    <section className="v3-instagram-profile">
      {brandAvatar}
      <dl><div><dt>128</dt><dd>publications</dd></div><div><dt>4,8 k</dt><dd>followers</dd></div><div><dt>246</dt><dd>suivi(e)s</dd></div></dl>
      <div className="v3-instagram-bio"><b>{brandName}</b><span>{profile.siteKicker.toLowerCase()}</span><small>Ouvert aujourd’hui</small></div>
      <nav><b>Suivre</b><span>Contacter</span></nav>
      <div className="v3-instagram-highlights" aria-hidden="true">{posts.slice(0, 3).map((post, index) => <i key={`${post}-${index}`} style={{ "--v3-highlight-image": `url(${post})`, backgroundPosition: SOCIAL_CROP_POSITIONS[index] }} />)}</div>
    </section>
    <div className="v3-instagram-tabs"><Grid3X3 /><Clapperboard /></div>
    <div className="v3-live-social-grid" aria-label="Aperçu des publications">{posts.map((post, index) => <i key={`${post}-${index}`} style={socialCropStyle(post, index)} />)}</div>
    <footer><Home /><Search /><Plus /><Clapperboard /><span className="v3-instagram-footer-avatar">{brandAvatar}</span></footer>
  </div>;
}

function TikTokPhoneApp({ brandAvatar, brandName, handle, sceneImage, profile, sectorId }) {
  const poster = phoneSectorMedia(resolvePhoneSectorId(sectorId, sceneImage))[1];
  return <div className="v3-tiktok-app" style={{ "--v3-tiktok-poster": poster ? `url(${poster})` : "none" }}>
    <div className="v3-tiktok-poster" />
    <header><span>Abonnements</span><b>Pour toi</b><Search /></header>
    <aside>
      {brandAvatar}
      <span><Heart fill="currentColor" /><b>12,4 K</b></span>
      <span><MessageCircle fill="currentColor" /><b>386</b></span>
      <span><Bookmark fill="currentColor" /><b>1 208</b></span>
      <span><Share2 fill="currentColor" /><b>Partager</b></span>
      <i className="v3-tiktok-disc"><Music2 /></i>
    </aside>
    <footer>
      <b>{handle}</b>
      <p>{profile.socialCaption}</p>
      <small>♫ son original · {brandName}</small>
      <nav><span><Home /><small>Accueil</small></span><span><UsersRound /><small>Amis</small></span><strong><Plus /></strong><span><Inbox /><small>Boîte de réception</small></span><span><UserRound /><small>Profil</small></span></nav>
    </footer>
  </div>;
}

function FacebookPhoneApp({ brandAvatar, brandName, sceneImage, profile, sectorId }) {
  const posts = instagramPostImages(sceneImage, sectorId);
  return <div className="v3-facebook-app">
    <header><strong>facebook</strong><span><Search /><Menu /></span></header>
    <div className="v3-facebook-cover" style={{ "--v3-social-cover": `url(${posts[1]})` }} />
    <section>
      {brandAvatar}
      <div><h3>{brandName}</h3><p>{profile.siteKicker}</p><small>4,8 ★ · 246 avis</small></div>
      <nav><b>Suivre</b><span>Message</span><i>•••</i></nav>
      <menu><b>Accueil</b><span>Publications</span><span>Photos</span><span>À propos</span></menu>
    </section>
    <article>
      <header>{brandAvatar}<span><b>{brandName}</b><small>À l’instant · Public</small></span><i>•••</i></header>
      <p>{profile.socialCaption}</p>
      <div style={{ "--v3-social-cover": `url(${posts[2]})` }} />
      <footer><span>👍 ❤️ 128</span><span>12 commentaires · 4 partages</span></footer>
      <nav><b>J’aime</b><span>Commenter</span><span>Partager</span></nav>
    </article>
    <footer className="v3-facebook-tabbar"><span><Home /><b>Accueil</b></span><span><Video /><b>Vidéos</b></span><span><Inbox /><b>Notifications</b></span><span><Menu /><b>Menu</b></span></footer>
  </div>;
}

function LinkedInPhoneApp({ brandAvatar, brandName, sceneImage, profile, sectorId }) {
  const posts = instagramPostImages(sceneImage, sectorId);
  const experience = phoneSectorExperience(resolvePhoneSectorId(sectorId, sceneImage));
  return <div className="v3-linkedin-app">
    <header><PlatformGlyph id="linkedin" /><span><Search />Rechercher</span><MessageCircle /></header>
    <div className="v3-linkedin-cover" style={{ "--v3-social-cover": `url(${posts[0]})` }} />
    <section>
      {brandAvatar}
      <h3>{brandName}</h3>
      <p>{profile.siteTitle}</p>
      <small>{experience.location} · 4,8 k abonnés</small>
      <nav><b>+ Suivre</b><span>Voir le site</span><i>•••</i></nav>
      <menu><b>Accueil</b><span>À propos</span><span>Publications</span><span>Emplois</span></menu>
    </section>
    <article>
      <header>{brandAvatar}<span><b>{brandName}</b><small>4 812 abonnés · 1 h</small></span><i>•••</i></header>
      <p>{profile.socialCaption}</p>
      <div style={{ "--v3-social-cover": `url(${posts[1]})` }} />
      <footer><span>👍 💡 ❤️ 86</span><span>8 commentaires</span></footer>
      <nav><b>J’aime</b><span>Commenter</span><span>Republier</span><span>Envoyer</span></nav>
    </article>
    <footer className="v3-linkedin-tabbar"><span><Home /><b>Accueil</b></span><span><UserRound /><b>Réseau</b></span><span><Plus /><b>Publier</b></span><span><Inbox /><b>Notifications</b></span><span><ShoppingBag /><b>Emplois</b></span></footer>
  </div>;
}

function WifiSettingsApp({ brandName, profile }) {
  const privateNetwork = brandName.replace(/[^A-Z0-9]+/gi, "_").replace(/^_|_$/g, "").toUpperCase().slice(0, 22) || "ENTREPRISE";
  return <div className="v3-ios-wifi-app">
    <header><span>‹ Réglages</span><b>Wi‑Fi</b><i>Modifier</i></header>
    <section className="v3-ios-settings-group"><div><b>Wi‑Fi</b><i className="is-on"><span /></i></div></section>
    <small>RÉSEAUX</small>
    <section className="v3-ios-settings-group v3-ios-network-list">
      <div><Check /><b>{profile.wifi}</b><Wifi /><Info /></div>
      <div><span /><b>{privateNetwork}</b><LockKeyhole /><Wifi /><Info /></div>
    </section>
    <small>AUTRES RÉSEAUX</small>
    <section className="v3-ios-settings-group v3-ios-network-list"><div><span /><b>Orange_5G</b><LockKeyhole /><Wifi /><Info /></div></section>
  </div>;
}

function WhatsAppPhoneApp({ brandAvatar, brandName, sectorId }) {
  const experience = phoneSectorExperience(sectorId);
  return <div className="v3-whatsapp-app">
    <header><span className="v3-whatsapp-back">‹</span>{brandAvatar}<div><b>{brandName}</b><small>compte professionnel</small></div><Video /><PhoneCall /></header>
    <section><time>AUJOURD’HUI</time><p className="is-incoming">{experience.incoming}<small>11:24</small></p><p className="is-outgoing">{experience.outgoing}<small>11:25 · ✓✓</small></p></section>
    <footer><Plus /><span>Message<Camera /></span><Mic /></footer>
  </div>;
}

function ApplePayPhoneApp({ brandAvatar, brandName, profile }) {
  return <div className="v3-apple-pay-app">
    <div className="v3-apple-pay-checkout">
      <header>{brandAvatar}<span><b>{brandName}</b><small>{profile.paymentLabel}</small></span></header>
      <div><span>Total</span><b>{profile.paymentAmount}</b></div>
    </div>
    <section className="v3-apple-pay-sheet">
      <i className="v3-apple-pay-grabber" />
      <header><b>Apple Pay</b><strong>{profile.paymentAmount}</strong></header>
      <div><small>CARTE</small><span><b>•••• 4242</b><em>Visa</em></span></div>
      <div><small>CONTACT</small><span><b>Compte Apple · contact masqué</b><em>›</em></span></div>
      <footer><span>Confirmer avec le bouton latéral</span><i /></footer>
    </section>
  </div>;
}

function SafariPhoneApp({ brandAvatar, brandName, actionId, sceneImage, profile, sectorId }) {
  const isOther = actionId === "autre";
  const heroImage = phoneSectorMedia(resolvePhoneSectorId(sectorId, sceneImage))[0];
  const domain = brandName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 18) || "votre-lien";
  return <div className="v3-safari-app">
    <div className="v3-safari-page">
      <header>{brandAvatar}<span>{brandName}</span><Menu /></header>
      <div className="v3-safari-hero" style={{ "--v3-safari-image": `url(${heroImage})` }}>
        <small>{isOther ? "VOTRE ESPACE" : profile.siteKicker}</small>
        <h3>{isOther ? "Un lien, votre univers." : profile.siteTitle}</h3>
      </div>
      <section><b>{isOther ? "Bienvenue" : "À découvrir"}</b><p>{isOther ? "Horaires, actualités et informations utiles au même endroit." : profile.siteBody}</p><span>{isOther ? "Découvrir" : "Voir les services"}</span></section>
    </div>
    <footer>
      <div><LockKeyhole /><span>{isOther ? "votre-lien.fr" : `${domain}.fr`}</span><i>↻</i></div>
      <nav><span>‹</span><span>›</span><Share2 /><Bookmark /><Layers3 /></nav>
    </footer>
  </div>;
}

function PhoneServiceMark({ actionId, label }) {
  const platformId = actionId === "avis" ? "google" : ["instagram", "facebook", "linkedin", "tiktok", "whatsapp"].includes(actionId) ? actionId : "";
  const ServiceIcon = {
    formulaire: ClipboardList,
    menu: UtensilsCrossed,
    reservation: CalendarDays,
    commande: ShoppingBag,
    paiement: CreditCard,
    pourboire: CircleDollarSign,
    fidelite: Gift,
    wifi: Wifi,
    site: Globe2,
    contact: ContactRound,
    multiliens: Layers3,
    autre: Link2,
  }[actionId];
  return <span className="v3-live-phone-service">{platformId ? <PlatformGlyph id={platformId} /> : ServiceIcon ? <ServiceIcon /> : null}<b>{actionId === "avis" ? "Avis Google" : label}</b></span>;
}

const NATIVE_APP_ACTIONS = ["instagram", "tiktok", "facebook", "linkedin", "whatsapp", "wifi", "paiement", "site", "autre"];

// Ces actions affichent une interface complète : y ajouter la phrase d'aide
// répétait l'information de la carte et laissait un vide au milieu de l'écran.
const RICH_PREVIEW_ACTIONS = ["avis", "menu", "reservation", "commande", "pourboire", "fidelite", "contact", "multiliens", "formulaire"];

// Le contenu de l'écran vit dans un viewport logique de 390 x 844 : c'est
// DeviceFrame qui l'incruste, à l'échelle ou dans la photo, sans que le rendu
// ait besoin de connaître sa taille finale.
export default function LivePhoneScreen({
  actionId = "avis",
  brandName = "",
  brandLogo = "",
  primaryColor = "",
  secondaryColor = "",
  textColor = "",
  sceneImage = "",
  sectorId = "",
  destinationUrl = "",
  showStatusBar = true,
}) {
  const resolvedSectorId = resolvePhoneSectorId(sectorId, sceneImage);
  const profile = phoneSectorProfile(resolvedSectorId, sceneImage);
  const baseScreen = PHONE_SCREENS[actionId] || PHONE_SCREENS.autre;
  const screen = {
    ...baseScreen,
    title: actionId === "menu"
      ? profile.menuTitle
      : actionId === "reservation"
        ? profile.bookingTitle
        : baseScreen.title,
  };
  const socialNetwork = ["instagram", "facebook", "linkedin", "tiktok"].includes(actionId) ? actionId : "";
  const safeBrandName = displayBrandName(brandName);
  const handle = `@${safeBrandName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "votre.marque"}`;
  const instanceId = useId().replace(/:/g, "");

  // L'interface imite une vraie application en mode clair : le nom de marque et
  // la pastille du logo se posent sur du blanc, il leur faut donc une couleur
  // foncée. Selon la déclinaison, c'est le papier ou l'encre qui est sombre :
  // on garde celle qui lit le mieux sur blanc, sinon un quasi-noir.
  const brandCandidates = [primaryColor, textColor]
    .map((value) => normalizeHexColor(value, ""))
    .filter(Boolean);
  const strongestBrandColor = brandCandidates.reduce((best, candidate) => (
    !best || contrastRatio(candidate, "#ffffff") > contrastRatio(best, "#ffffff") ? candidate : best
  ), "");
  const brandDark = strongestBrandColor && contrastRatio(strongestBrandColor, "#ffffff") >= 4.5
    ? strongestBrandColor
    : "#161310";
  const normalizedSecondary = normalizeHexColor(secondaryColor, "#2057f3");
  const brandAccent = contrastRatio(normalizedSecondary, "#ffffff") >= 3
    ? normalizedSecondary
    : contrastRatio(normalizeHexColor(primaryColor, brandDark), "#ffffff") >= 3
      ? normalizeHexColor(primaryColor, brandDark)
      : brandDark;
  const phoneStyle = {
    "--v3-phone-primary": brandDark,
    "--v3-phone-accent": brandAccent,
    "--v3-phone-copy": brandDark,
  };

  const bareBrandAvatar = (
    <div className="v3-live-brand-avatar" key={`avatar-${instanceId}`}>
      {brandLogo ? <img src={brandLogo} alt="" /> : <GeneratedBrandMark name={safeBrandName} />}
    </div>
  );
  const brandAvatar = (
    <div className="v3-live-brand-avatar">
      {brandLogo ? <img src={brandLogo} alt="" /> : <GeneratedBrandMark name={safeBrandName} />}
      {socialNetwork && <b className={`is-${socialNetwork}`}><PlatformGlyph id={socialNetwork} /></b>}
    </div>
  );
  const socialPosts = instagramPostImages(sceneImage, resolvedSectorId);

  const application = actionId === "instagram"
    ? <InstagramPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} handle={handle} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} />
    : actionId === "tiktok"
      ? <TikTokPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} handle={handle} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} />
      : actionId === "facebook"
        ? <FacebookPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} />
        : actionId === "linkedin"
          ? <LinkedInPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} />
          : actionId === "whatsapp"
            ? <WhatsAppPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} sectorId={resolvedSectorId} />
            : actionId === "wifi"
              ? <WifiSettingsApp brandName={safeBrandName} profile={profile} />
              : actionId === "paiement"
                ? <ApplePayPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} profile={profile} />
                : ["site", "autre"].includes(actionId)
                  ? <SafariPhoneApp brandAvatar={bareBrandAvatar} brandName={safeBrandName} actionId={actionId} sceneImage={sceneImage} profile={profile} sectorId={resolvedSectorId} />
                  : socialNetwork
                    ? (
                      <div className="v3-live-phone-social">
                        {brandAvatar}
                        <div><h3>{safeBrandName}</h3><span>{handle}</span></div>
                        <dl><div><dt>128</dt><dd>publications</dd></div><div><dt>4,8 k</dt><dd>abonnés</dd></div><div><dt>246</dt><dd>abonnements</dd></div></dl>
                        <span className="v3-live-phone-cta">{socialNetwork === "linkedin" ? "Suivre la page" : "Suivre"}</span>
                        <div className="v3-live-social-grid">{socialPosts.map((post, index) => <i key={`${post}-${index}`} style={{ "--v3-phone-post-image": `url(${post})` }} />)}</div>
                      </div>
                    )
                    : (
                      <div className={`v3-live-phone-content is-${actionId}${RICH_PREVIEW_ACTIONS.includes(actionId) ? " has-rich-preview" : ""}`}>
                        <div className="v3-live-phone-brand">{brandAvatar}<small>{safeBrandName}</small></div>
                        <h3>{screen.title}</h3>
                        <PhoneActionPreview actionId={actionId} screen={screen} sceneImage={sceneImage} brandName={safeBrandName} sectorId={resolvedSectorId} />
                        {!RICH_PREVIEW_ACTIONS.includes(actionId) && <p>{screen.helper}</p>}
                        {destinationUrl
                          ? <a className="v3-live-phone-cta" href={destinationUrl} target="_blank" rel="noreferrer">{screen.cta}</a>
                          : <span className="v3-live-phone-cta">{screen.cta}</span>}
                      </div>
                    );

  const showBrowserBar = !NATIVE_APP_ACTIONS.includes(actionId);

  return (
    <div
      className={`tapote-device__screen v3-live-phone-ui is-action-${actionId}`}
      style={phoneStyle}
      data-phone-action={actionId}
      data-phone-sector={resolvedSectorId || undefined}
    >
      {showStatusBar && (
        <div className="v3-live-phone-status">
          <span>11:25</span>
          <div><i className="is-signal" /><Wifi /><i className="is-battery" /></div>
        </div>
      )}
      {showBrowserBar && (
        <div className="v3-live-phone-browser">
          <span>‹</span>
          <strong><PhoneServiceMark actionId={actionId} label={screen.overline} /></strong>
          <i>•••</i>
        </div>
      )}
      {application}
      <i className="v3-live-phone-home" />
    </div>
  );
}
