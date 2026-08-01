export const SCREEN_FAMILIES = Object.freeze({
  reputation: "reputation",
  commerce: "commerce",
  booking: "booking",
  contact: "contact",
  social: "social",
  access: "access",
});

export const ACTION_SCREEN_DATA = Object.freeze({
  avis: { family: SCREEN_FAMILIES.reputation, label: "Avis Google", title: "Ouvrir la fiche d’avis" },
  formulaire: { family: SCREEN_FAMILIES.booking, label: "Formulaire", title: "Commencer la demande" },
  menu: { family: SCREEN_FAMILIES.commerce, label: "Menu", title: "Consulter le menu" },
  reservation: { family: SCREEN_FAMILIES.booking, label: "Réservation", title: "Choisir un créneau" },
  commande: { family: SCREEN_FAMILIES.commerce, label: "Commande", title: "Ouvrir la commande" },
  paiement: { family: SCREEN_FAMILIES.commerce, label: "Paiement", title: "Ouvrir le paiement" },
  pourboire: { family: SCREEN_FAMILIES.commerce, label: "Pourboire", title: "Ouvrir le pourboire" },
  fidelite: { family: SCREEN_FAMILIES.commerce, label: "Fidélité", title: "Ouvrir la fidélité" },
  instagram: { family: SCREEN_FAMILIES.social, label: "Instagram", title: "Ouvrir le profil" },
  tiktok: { family: SCREEN_FAMILIES.social, label: "TikTok", title: "Ouvrir le profil" },
  facebook: { family: SCREEN_FAMILIES.social, label: "Facebook", title: "Ouvrir la page" },
  linkedin: { family: SCREEN_FAMILIES.social, label: "LinkedIn", title: "Ouvrir la page" },
  wifi: { family: SCREEN_FAMILIES.access, label: "Wi-Fi", title: "Rejoindre le réseau" },
  site: { family: SCREEN_FAMILIES.access, label: "Site internet", title: "Ouvrir le site" },
  contact: { family: SCREEN_FAMILIES.contact, label: "Contact", title: "Enregistrer le contact" },
  whatsapp: { family: SCREEN_FAMILIES.contact, label: "WhatsApp", title: "Ouvrir la conversation" },
  multiliens: { family: SCREEN_FAMILIES.contact, label: "Page multi-liens", title: "Choisir une destination" },
  autre: { family: SCREEN_FAMILIES.access, label: "Autre URL", title: "Ouvrir la destination" },
});

export const SECTOR_SCREEN_CONTENT = Object.freeze({
  cafe: { context: "Caisse, comptoir ou table", detail: "Le lien utile au moment du passage" },
  restaurant: { context: "Accueil, table ou retrait", detail: "Le service utile pendant le parcours client" },
  boulangerie: { context: "Vitrine, caisse ou retrait", detail: "Le lien utile avant de repartir" },
  salon: { context: "Accueil, miroir ou sortie", detail: "Le lien utile avant ou après la prestation" },
  cabinet_medical: { context: "Accueil ou salle d’attente", detail: "Le lien utile sans exposer de donnée sensible" },
  boutique: { context: "Entrée, rayon ou caisse", detail: "Le lien utile au moment de la visite" },
  hotel: { context: "Réception, chambre ou espace commun", detail: "Le service utile pendant le séjour" },
  auto_ecole: { context: "Accueil, bureau ou véhicule", detail: "Le lien utile avant ou après la leçon" },
  garage: { context: "Accueil, atelier ou restitution", detail: "Le lien utile pendant la prise en charge" },
  artisan: { context: "Rendez-vous ou intervention", detail: "Le lien utile directement sur le terrain" },
  immobilier: { context: "Agence, visite ou rendez-vous", detail: "Le lien utile au moment de l’échange" },
  salle_sport: { context: "Accueil, vestiaire ou studio", detail: "Le lien utile avant ou après la séance" },
  coworking: { context: "Accueil, salle ou poste de travail", detail: "Le lien utile pendant la présence sur place" },
  evenement: { context: "Entrée, stand ou sortie", detail: "Le lien utile pendant le parcours participant" },
  veterinaire: { context: "Accueil ou salle d’attente", detail: "Le lien utile avant ou après la consultation" },
});

const DEFAULT_ACTION = ACTION_SCREEN_DATA.autre;
const DEFAULT_SECTOR = Object.freeze({
  context: "Point de contact",
  detail: "La destination utile au bon moment",
});

export function isSafeDestination(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function resolveScreenModel({
  actionId = "autre",
  sectorId = "",
  sectorTitle = "",
  brandName = "",
  personalization = "ready",
  destinationUrl = "",
} = {}) {
  const action = ACTION_SCREEN_DATA[actionId] || DEFAULT_ACTION;
  const sector = SECTOR_SCREEN_CONTENT[sectorId] || DEFAULT_SECTOR;
  const visibleBrand = personalization === "custom" && brandName.trim()
    ? brandName.trim()
    : "Votre établissement";

  return {
    actionId,
    family: action.family,
    actionLabel: action.label,
    title: action.title,
    brandName: visibleBrand,
    context: sector.context,
    detail: sector.detail,
    sectorTitle: sectorTitle || "Votre activité",
    destinationUrl: isSafeDestination(destinationUrl) ? destinationUrl : "",
  };
}
