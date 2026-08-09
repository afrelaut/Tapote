import { CircleDollarSign, FileCheck2, Link2, SmartphoneNfc } from "lucide-react";
import { ACTIONS } from "../../../shared/catalog.js";

export const ACTION_ORDER = ["avis", "formulaire", "menu", "reservation", "commande", "paiement", "pourboire", "fidelite", "instagram", "tiktok", "facebook", "linkedin", "wifi", "site", "contact", "whatsapp", "multiliens", "autre"];

export const STOREFRONT_PROMISES = {
  fulfillment: "Délai confirmé à la prise en charge",
  quality: "NFC encodé + QR contrôlé avant envoi",
  support: "Prise en charge selon les conditions validées",
};

export const READY_ACTION_IDS = [...ACTION_ORDER];

/* Les six actions autorisées telles quelles par la source de vérité §9.1
   (avis, menu, réservation, contact, Wi-Fi, URL choisie). Les douze autres
   restent commandables, mais repliées : dix-huit boutons d'un bloc repoussaient
   l'étape « Mode » de 174 px sous la ligne de flottaison. */
export const FEATURED_ACTION_IDS = ["avis", "menu", "reservation", "wifi", "contact", "autre"];

export const campaignHeadlineForAction = (actionId) => ACTIONS[actionId]?.campaignHeadline || ACTIONS[actionId]?.headline || "";

export const readyHeadlineForAction = (actionId) => (
  actionId === "avis" ? "Votre avis compte, tapotez." : campaignHeadlineForAction(actionId)
);

export const PRODUCT_PAGES = {
  chevalet: {
    key: "comptoir",
    name: "Tapote Comptoir",
    kicker: "VISIBLE AU BON MOMENT",
    title: "Le support qui fait passer à l’action.",
    description: "À la caisse, à l’accueil ou sur une table : votre marque reste visible et le bon lien s’ouvre en un geste.",
    placements: "Caisse · accueil · table",
    size: "Format posé · caractéristiques confirmées avant production",
    technical: ["Support visible au comptoir", "Finition confirmée avant production"],
    uses: ["Avis et fidélité à la caisse", "Menu ou réservation sur table", "Accueil, Wi-Fi et informations pratiques", "Contact ou page de votre choix"],
    inBox: "1 Tapote Comptoir avec NFC configuré et QR code associé.",
  },
  plaque: {
    key: "plaque",
    name: "Tapote Plaque",
    kicker: "COMPACTE ET TOUJOURS LÀ",
    title: "Un point de contact, sans prendre de place.",
    description: "Un point de contact fixe, placé là où votre client a naturellement le téléphone en main.",
    placements: "Entrée · mur · miroir · point fixe",
    size: "Format et fixation confirmés avant production",
    technical: ["Point de contact fixe", "Finition confirmée avant production"],
    uses: ["Avis à la sortie", "Réservation à l’accueil", "Informations pratiques à un emplacement fixe", "Menu ou page de votre choix"],
    inBox: "1 Tapote Plaque avec NFC configuré et QR code associé.",
  },
  carte: {
    key: "carte",
    name: "Tapote Card",
    kicker: "TAPOTE DANS LA POCHE",
    title: "Le bon lien vous suit partout.",
    description: "Pour les rendez-vous, livraisons, visites et équipes terrain. Elle se tend, se tapote et se range en une seconde.",
    placements: "Terrain · rendez-vous · livraison",
    size: "Format poche · caractéristiques confirmées avant production",
    technical: ["Support mobile remis en main propre", "Finition confirmée avant production"],
    uses: ["Coordonnées en rendez-vous", "Avis après une prestation", "Catalogue, paiement ou réservation sur le terrain", "Site ou page de votre choix"],
    inBox: "1 Tapote Card imprimée, avec NFC configuré et QR code associé.",
  },
};

export const resolveProductPageSlug = (slug) => slug === "comptoir" ? "chevalet" : slug;

export const LEGAL_DETAILS = {
  // L'article L526-22 du Code de commerce impose la mention « EI » dans la
  // dénomination, et l'article R123-237 du même code le RCS avec sa ville.
  company: import.meta.env.VITE_LEGAL_COMPANY || "Aymeric Frelaut EI (Tapote)",
  capital: import.meta.env.VITE_LEGAL_CAPITAL || "Entrepreneur individuel (EI) — capital social non applicable",
  address: import.meta.env.VITE_LEGAL_ADDRESS || "24 rue Labouret, 92700 Colombes, France",
  registration: import.meta.env.VITE_LEGAL_REGISTRATION || "SIREN 105 019 103 — SIRET 105 019 103 00016 — RCS Nanterre 105 019 103 — immatriculé au RNE le 15 mai 2026",
  vat: import.meta.env.VITE_LEGAL_VAT || "",
  director: import.meta.env.VITE_LEGAL_DIRECTOR || "Aymeric Frelaut",
  contact: import.meta.env.VITE_LEGAL_CONTACT || "aymeric@tapote.fr — +33 6 63 15 04 49",
  privacyContact: import.meta.env.VITE_LEGAL_PRIVACY_CONTACT || import.meta.env.VITE_LEGAL_CONTACT || "aymeric@tapote.fr",
  returnsAddress: import.meta.env.VITE_LEGAL_RETURNS_ADDRESS || "24 rue Labouret, 92700 Colombes, France",
  dataRetention: import.meta.env.VITE_LEGAL_DATA_RETENTION || "Les demandes commerciales sans commande sont conservées au maximum trois ans après le dernier contact ; les journaux de sécurité, au maximum douze mois hors incident ou obligation légale ; les fichiers de personnalisation, pendant l’exécution de la commande puis trois ans pour le support et la défense des droits.",
  // L'article L616-1 du Code de la consommation impose de communiquer le
  // médiateur sur le site ET dans les CGV. L'adhésion à un médiateur agréé
  // CECMC est une démarche externe : tant qu'elle n'a pas abouti, le champ
  // reste vide et la mention correspondante n'est pas publiée.
  mediator: import.meta.env.VITE_LEGAL_MEDIATOR || "",
  version: import.meta.env.VITE_LEGAL_VERSION || "22 juillet 2026",
  host: import.meta.env.VITE_LEGAL_HOST || "HOSTINGER INTERNATIONAL LIMITED, 61 Lordou Vironos str., 6023 Larnaca, Chypre — compliance@hostinger.com",
};

// Le repli « prix actuel » ne veut rien dire fiscalement et s'affichait tel
// quel en production (« 89 € prix actuel »), ce qui contrevient à l'obligation
// d'information sur les prix. Le repli retenu correspond au régime le plus
// probable pour une entreprise individuelle immatriculée en 2026 : la
// franchise en base de TVA.
// À CONFIRMER : si Tapote est assujettie à la TVA, renseigner
// VITE_LEGAL_TAX_LABEL (« HT » en B2B, « TTC » sinon) et STRIPE_TAX_BEHAVIOR.
export const taxLabel = import.meta.env.VITE_LEGAL_TAX_LABEL || "TVA non applicable, art. 293 B du CGI";
export const shippingPolicyReady = import.meta.env.VITE_SHIPPING_POLICY_READY === "true";

export const SHOP_MENU_PREVIEWS = {
  comptoir: {
    eyebrow: "CHEVALET · POSE LIBRE",
    title: "Tapote Comptoir",
    detail: "Le support héros pour déclencher un avis, une réservation ou une commande au bon moment.",
    href: "/produits/comptoir",
    surface: "comptoir",
    actionId: "avis",
    brandName: "VOTRE MARQUE",
    theme: "nuit",
    customHeadline: "Votre avis compte.",
  },
  plaque: {
    eyebrow: "POINT FIXE · PLAQUE",
    title: "Tapote Plaque",
    detail: "Un point de contact fixe, lisible et toujours disponible dans le parcours client.",
    href: "/produits/plaque",
    surface: "plaque",
    actionId: "instagram",
    brandName: "VOTRE MARQUE",
    theme: "creme",
    customHeadline: "Réservez ici.",
  },
  carte: {
    eyebrow: "FORMAT POCHE · MOBILE",
    title: "Tapote Card",
    detail: "Une carte NFC au vrai format portefeuille pour partager un contact ou recueillir un avis.",
    href: "/produits/carte",
    surface: "carte",
    actionId: "linkedin",
    brandName: "VOTRE MARQUE",
    theme: "creme",
    customHeadline: "Gardons le contact.",
  },
  packs: {
    eyebrow: "DUO COMPTOIR + PLAQUE",
    title: "Pack Local",
    detail: "Un Comptoir et une Plaque coordonnés, avec une destination indépendante par support.",
    href: "/boutique#packs",
    surface: "comptoir",
    actionId: "avis",
    brandName: "VOTRE MARQUE",
    theme: "nuit",
    customHeadline: "Votre avis compte.",
  },
};

export const HOME_SCENES = {
  comptoir: {
    slug: "comptoir",
    label: "Tapote Comptoir",
    image: "/assets/products/tapote-bg-cafe-v1.webp",
    brandName: "VOTRE MARQUE",
    theme: "nuit",
    nativeAction: "avis",
  },
  plaque: {
    slug: "plaque",
    label: "Tapote Plaque",
    image: "/assets/products/tapote-bg-beaute-v1.webp",
    brandName: "VOTRE MARQUE",
    theme: "creme",
    nativeAction: "reservation",
  },
  carte: {
    slug: "carte",
    label: "Tapote Card",
    image: "/assets/products/tapote-bg-agence-v1.webp",
    brandName: "VOTRE MARQUE",
    theme: "creme",
    nativeAction: "contact",
  },
};

export const STOREFRONT_FAQ = [
  ["Tapote Studio est-il un produit séparé ?", "Non. Tapote Studio intervient uniquement pendant la personnalisation d’un Comptoir, d’une Plaque, d’une Card ou d’un Pack Local. Le support reste toujours le produit acheté."],
  ["Le NFC fonctionne-t-il sans application ?", "Oui. Sur un téléphone compatible, le client approche son appareil de la zone indiquée. Le QR code reste présent comme solution de secours."],
  ["Puis-je changer la destination après la livraison ?", "Oui, avec Tapote Pilot Pro. Tapote Pilot est inclus pour retrouver vos supports et voir la destination active ; le remplacement du lien à distance, sans réimprimer ni réencoder, fait partie de l’option Pro."],
  ["Quelle différence entre Tapote Pilot et Pilot Pro ?", "Tapote Pilot couvre l’activation, les supports et le suivi des destinations. Pilot Pro ajoute le changement de lien à distance, les statistiques, périodes, lieux, équipes, exports et multi-sites."],
  ["Quels sont les délais ?", "Le délai est confirmé à la prise en charge. Une version personnalisée démarre seulement après validation du BAT ; une série de 10 supports ou plus passe par un devis documenté."],
];

export const FAQ_GROUPS = [
  {
    id: "choisir",
    title: "Choisir",
    items: [
      ["Quel support choisir ?", "Tapote Comptoir convient à une caisse, un accueil ou une table. Tapote Plaque s’installe sur un mur, une entrée ou un miroir. Tapote Card accompagne les rendez-vous et les équipes terrain."],
      ["Quelle différence entre Prêt à poser et À votre image ?", "Prêt à poser utilise une composition Tapote déjà conçue. À votre image adapte le logo, les couleurs et les textes dans Tapote Studio, avec un BAT validé avant fabrication."],
      ["Puis-je mixer plusieurs supports ?", "Oui. Un même projet peut réunir Comptoir, Plaque et Card, avec une identité cohérente et une destination différente pour chaque emplacement."],
      ["Que contient le prix affiché ?", "Le support, le design choisi, le NFC, le QR, la configuration initiale, le contrôle avant expédition et Tapote Pilot sont inclus. Pilot Pro reste une option séparée."],
    ],
  },
  {
    id: "fonctionnement",
    title: "Fonctionnement",
    items: [
      ["Faut-il installer une application ?", "Non. Le client approche son téléphone ou scanne le QR code, puis la destination s’ouvre dans son navigateur habituel."],
      ["Le NFC fonctionne-t-il sur tous les téléphones ?", "La grande majorité des smartphones récents lisent le NFC. Le QR code ouvre la même destination et reste toujours disponible comme second chemin."],
      ["Puis-je changer le lien après la livraison ?", "Oui, avec Tapote Pilot Pro. Le suivi de vos supports et de leur destination reste inclus dans Tapote Pilot ; le changement de lien à distance est une fonction Pro."],
      ["Quelle différence entre Tapote Pilot et Pilot Pro ?", "Tapote Pilot couvre l’activation, les supports et le suivi des destinations. Pilot Pro ajoute le changement de lien à distance, les statistiques, périodes, lieux, équipes, exports et multi-sites."],
    ],
  },
  {
    id: "creation",
    title: "Création & production",
    items: [
      ["Qu’est-ce qu’un BAT ?", "Le bon à tirer est le fichier de contrôle envoyé avant impression. Il permet de valider le logo, les textes, les marges, le contraste, le QR et la zone NFC."],
      ["Quand la production commence-t-elle ?", "Après le paiement et, pour une version personnalisée, seulement après validation du BAT."],
      ["Quels fichiers puis-je transmettre ?", "Un logo vectoriel est idéal. Un PNG haute définition peut aussi convenir. Tapote vérifie le fichier avant de préparer le BAT."],
    ],
  },
  {
    id: "livraison",
    title: "Livraison & projets",
    items: [
      ["Quels sont les délais ?", "Le délai est confirmé à la prise en charge. Pour une personnalisation, il commence après validation du BAT."],
      ["Que se passe-t-il si le NFC est défectueux ?", "Chaque support est contrôlé avant l’envoi. Si un défaut est confirmé à réception, Tapote organise sa prise en charge selon les conditions de vente."],
      ["Comment équiper plusieurs lieux ?", "À partir de 10 supports, le devis précise la composition, les emplacements, les quantités, les identités et les destinations initiales."],
      ["Puis-je tester avant un déploiement complet ?", "Oui. La série pilote permet de valider la matière, le geste NFC + QR, l’emplacement et le protocole de mesure avant d’étendre le dispositif."],
    ],
  },
];

export const SHOP_ITEMS = [
  {
    surface: "comptoir",
    slug: "comptoir",
    title: "Tapote Comptoir",
    eyebrow: "CHEVALET · POSE LIBRE",
    promise: "Le produit héros pour déclencher l’action au moment où le téléphone est déjà en main.",
    spec: "Format posé · NFC + QR",
  },
  {
    surface: "plaque",
    slug: "plaque",
    title: "Tapote Plaque",
    eyebrow: "POINT FIXE · FORMAT PLAQUE",
    promise: "Un point d’action fixe, lisible et toujours placé au même endroit.",
    spec: "Point fixe · NFC + QR",
  },
  {
    surface: "carte",
    slug: "carte",
    title: "Tapote Card",
    eyebrow: "FORMAT POCHE · MOBILE",
    promise: "Le format poche avec puce intégrée, pour partager le bon lien en déplacement.",
    spec: "Format mobile · NFC + QR",
  },
];

export const PRODUCT_FAQ_COMMON = [
  ["Faut-il une application pour utiliser Tapote ?", "Non. Le client approche son téléphone ou scanne le QR, puis la destination s’ouvre dans son navigateur habituel."],
  ["Que se passe-t-il si le NFC est désactivé ?", "Le QR code visible sur le support ouvre la même destination. Il reste disponible comme second chemin, sans application Tapote."],
  ["Puis-je changer le lien après la livraison ?", "Oui, avec Tapote Pilot Pro. Tapote Pilot, inclus, vous montre le support et la page qu’il ouvre ; remplacer cette page à distance relève de l’option Pro."],
  ["Que contient le prix affiché ?", "Le support, le design choisi, le NFC, le QR, la configuration initiale, le contrôle avant expédition et Tapote Pilot sont réunis dans le prix. Pilot Pro reste optionnel."],
  ["Quand la production commence-t-elle ?", "Après paiement et, pour une version personnalisée, après validation du BAT. Le délai applicable est confirmé lors de la prise en charge."],
  ["Que se passe-t-il si le NFC ne fonctionne pas ?", "Chaque support est contrôlé avant l’envoi. Si un défaut est confirmé à réception, Tapote organise sa prise en charge selon les conditions de vente."],
  ["Puis-je commander plusieurs destinations ?", "Oui. Chaque support d’un même projet peut ouvrir une destination différente, tout en conservant une identité visuelle cohérente."],
  ["Comment équiper plusieurs lieux ?", "À partir de 10 supports, le devis précise la composition, les quantités, les emplacements et la destination initiale de chaque point d’action."],
];

export const PRODUCT_FAQ_SPECIFIC = {
  comptoir: [
    ["Où placer Tapote Comptoir ?", "À la caisse, sur un comptoir d’accueil ou sur une table, à proximité du moment où le client peut naturellement sortir son téléphone."],
    ["Le support reste-t-il stable pendant le geste ?", "La stabilité, la surface d’appui et la lecture NFC font partie des contrôles physiques de la série pilote avant validation définitive de la production."],
  ],
  plaque: [
    ["La Plaque peut-elle être fixée au mur ?", "Le mode de pose dépend de la version retenue. La fiche et le BAT précisent si le support est posé, adhésivé ou fixé, ainsi que la surface recommandée."],
    ["Peut-on l’utiliser près d’un miroir ou dans une zone humide ?", "La pose, le nettoyage et la résistance doivent être validés pour le lieu exact. Signalez l’environnement dans le devis afin de choisir la finition adaptée."],
  ],
  carte: [
    ["La Card montre-t-elle le recto et le verso avant impression ?", "Le BAT final présente les faces produites et les zones techniques. La galerie produit distingue également le format portefeuille, le geste et la matière."],
    ["Puis-je la garder dans un portefeuille ?", "Tapote Card vise un usage mobile et un rangement facile. Le format, la matière et l’épaisseur sont confirmés sur la référence physique vendue."],
  ],
};

export const WHY_TAPOTE = [
  { icon: CircleDollarSign, title: "Un prix produit complet", copy: "Support, impression, NFC, QR, configuration du lien initial et contrôle sont réunis dans le prix affiché." },
  { icon: FileCheck2, title: "Votre Studio sur la fiche", copy: "Vous personnalisez le support choisi sans repartir dans un configurateur séparé. Un BAT technique final contrôle les marges et le QR avant impression." },
  { icon: Link2, title: "Pilot inclus", copy: "Activez vos supports et retrouvez la destination que chacun ouvre. Le changement de lien à distance relève de l’option Pilot Pro." },
  { icon: SmartphoneNfc, title: "NFC + QR testés un par un", copy: "Les deux accès sont vérifiés sur téléphone, support par support, avant la livraison." },
];
