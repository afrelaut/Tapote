export const PRODUCTS = {
  comptoir: {
    id: "comptoir",
    name: "Le Comptoir A6",
    shortName: "Comptoir A6",
    price: 5900,
    description: "Chevalet plexiglas transparent, insert client et NFC dissimulé.",
    format: "Plexiglas L · insert A6 105 × 148 mm",
  },
  table6: {
    id: "table6",
    name: "Les Chevalets A6 ×6",
    shortName: "A6 ×6",
    price: 13900,
    description: "Six chevalets A6 personnalisés pour menus, avis ou pourboires.",
    format: "6 chevalets plexiglas · 6 inserts A6",
  },
  carte: {
    id: "carte",
    name: "La Carte",
    shortName: "Carte",
    price: 3900,
    description: "Pour les artisans, agents et pros qui bougent.",
    format: "Format portefeuille · 85 × 54 mm",
  },
  sticker: {
    id: "sticker",
    name: "La Vitrine",
    shortName: "Vitrine",
    price: 2900,
    description: "Un sticker NFC + QR qui agit même après la fermeture.",
    format: "Sticker résistant · 9 × 9 cm",
  },
  pack_resto: {
    id: "pack_resto",
    name: "Pack Restaurant",
    shortName: "Pack Restaurant",
    price: 17900,
    description: "Un Comptoir + six Tables, configurés et prêts à poser.",
    format: "7 objets · économie de 19 €",
  },
  pack_salon: {
    id: "pack_salon",
    name: "Pack Salon",
    shortName: "Pack Salon",
    price: 10900,
    description: "Deux Comptoirs : avis et réservation.",
    format: "2 objets · économie de 9 €",
  },
  pack_equipe: {
    id: "pack_equipe",
    name: "Pack Équipe",
    shortName: "Pack Équipe",
    price: 21900,
    description: "Six Cartes + une Vitrine pour une équipe mobile.",
    format: "7 objets · économie de 44 €",
  },
};

export const ACTIONS = {
  avis: { id: "avis", name: "Avis Google", headline: "Votre avis compte." },
  menu: { id: "menu", name: "Menu", headline: "La carte, juste ici." },
  reservation: { id: "reservation", name: "Réservation", headline: "On se revoit quand ?" },
  fidelite: { id: "fidelite", name: "Fidélité", headline: "Vos points vous attendent." },
  pourboire: { id: "pourboire", name: "Pourboire", headline: "Un merci pour l’équipe ?" },
  instagram: { id: "instagram", name: "Instagram", headline: "Suivez le mouvement." },
  wifi: { id: "wifi", name: "Wi-Fi", headline: "Connectez-vous ici." },
  autre: { id: "autre", name: "Autre lien", headline: "Le bon lien. Maintenant." },
};

export const PILOT_PLANS = {
  pilot: { id: "pilot", name: "Tapote Pilot", price: 900 },
  pilot_plus: { id: "pilot_plus", name: "Tapote Pilot+", price: 1900 },
};

export const formatMoney = (cents) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
