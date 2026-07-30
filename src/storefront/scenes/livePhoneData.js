// Contenus d'écran restaurés depuis la version en production : chaque secteur
// apporte ses propres services, prix, créneaux et messages pour que l'aperçu
// ressemble à une vraie destination ouverte par le client.

export const PHONE_SCREENS = Object.freeze({
  avis: { overline: "AVIS", title: "Comment s’est passée votre visite ?", detail: "★★★★★", helper: "Partagez votre expérience en quelques mots.", cta: "Publier mon avis" },
  formulaire: { overline: "FORMULAIRE", title: "Comment pouvons-nous vous aider ?", detail: "Devis · Inscription · Demande", helper: "Quelques informations suffisent", cta: "Commencer" },
  menu: { overline: "LA CARTE", title: "Aujourd’hui au menu", detail: "Entrées · Plats · Desserts", helper: "Allergènes et options disponibles", cta: "Voir le menu" },
  reservation: { overline: "RÉSERVATION", title: "Choisissez votre créneau", detail: "09:00   11:00   15:30", helper: "Confirmation immédiate", cta: "Réserver" },
  commande: { overline: "COMMANDE", title: "Votre sélection", detail: "3 produits disponibles", helper: "Retrait ou livraison", cta: "Commander" },
  paiement: { overline: "PAIEMENT", title: "Montant à régler", detail: "24,00 €", helper: "Paiement sécurisé", cta: "Payer" },
  pourboire: { overline: "POURBOIRE", title: "Merci pour l’équipe", detail: "5 %   10 %   15 %", helper: "Choisissez librement", cta: "Valider" },
  fidelite: { overline: "FIDÉLITÉ", title: "Votre prochain avantage", detail: "● ● ● ● ○", helper: "Encore un passage", cta: "Ajouter ma visite" },
  instagram: { overline: "INSTAGRAM", title: "Découvrez nos coulisses", detail: "Photos · Reels · Stories", helper: "@votre.marque", cta: "Voir le profil" },
  tiktok: { overline: "TIKTOK", title: "La suite se passe ici", detail: "Vidéos · Créations", helper: "@votre.marque", cta: "Voir le profil" },
  facebook: { overline: "FACEBOOK", title: "Retrouvez nos actualités", detail: "Événements · Photos", helper: "Votre page locale", cta: "Ouvrir la page" },
  linkedin: { overline: "LINKEDIN", title: "Gardons le contact", detail: "Entreprise · Équipe", helper: "Votre page professionnelle", cta: "Voir la page" },
  wifi: { overline: "WI-FI INVITÉ", title: "Vous êtes connecté.", detail: "Réseau : INVITES", helper: "Accès sécurisé", cta: "Se connecter" },
  site: { overline: "SITE INTERNET", title: "Bienvenue chez nous", detail: "Services · Équipe · Contact", helper: "Tout commence ici", cta: "Découvrir" },
  contact: { overline: "CONTACT", title: "Gardons le contact", detail: "Téléphone · E-mail", helper: "Coordonnées prêtes à enregistrer", cta: "Ajouter aux contacts" },
  whatsapp: { overline: "WHATSAPP", title: "Écrivez-nous ici", detail: "Bonjour, je vous contacte…", helper: "Message prérempli", cta: "Envoyer le message" },
  multiliens: { overline: "VOS LIENS", title: "Tout est juste ici", detail: "Menu · Horaires · Réserver", helper: "Choisissez votre destination", cta: "Ouvrir" },
  autre: { overline: "LIEN PERSONNALISÉ", title: "Votre destination", detail: "Une page faite pour ce moment", helper: "Ouverture sécurisée", cta: "Continuer" },
});

export const RESTAURANT_PHONE_MEDIA = Object.freeze({
  burrata: "/assets/phone/restaurant-burrata-v1.webp",
  duck: "/assets/phone/restaurant-canard-v1.webp",
  fish: "/assets/phone/restaurant-dorade-v1.webp",
  dessert: "/assets/phone/restaurant-creme-brulee-v1.webp",
  tiktok: "/assets/phone/restaurant-chef-tiktok-v1.webp",
});

const PHONE_SCENE_SECTORS = Object.freeze({
  "/assets/products/tapote-bg-cafe-v1.webp": "cafe",
  "/assets/products/tapote-bg-cafe-restaurant-phone-v2.webp": "cafe",
  "/assets/products/tapote-bg-cafe-empty-v3.png": "cafe",
  "/assets/products/tapote-bg-restaurant-live-screen-v1.webp": "restaurant",
  "/assets/products/tapote-bg-restaurant-v1.webp": "restaurant",
  "/assets/products/tapote-bg-boulangerie-v1.webp": "boulangerie",
  "/assets/products/tapote-bg-boulangerie-empty-v2.png": "boulangerie",
  "/assets/products/tapote-bg-beaute-v1.webp": "salon",
  "/assets/products/tapote-bg-medical-v1.webp": "cabinet_medical",
  "/assets/products/tapote-bg-retail-v1.webp": "boutique",
  "/assets/products/tapote-bg-hotel-v1.webp": "hotel",
  "/assets/products/tapote-bg-auto-ecole-v1.webp": "auto_ecole",
  "/assets/products/tapote-bg-automobile-v1.webp": "garage",
  "/assets/products/tapote-bg-artisan-v1.webp": "artisan",
  "/assets/products/tapote-bg-agence-v1.webp": "immobilier",
  "/assets/products/tapote-bg-agence-empty-v2.png": "immobilier",
  "/assets/products/tapote-bg-sport-v1.webp": "salle_sport",
  "/assets/products/tapote-bg-sport-empty-v2.png": "salle_sport",
  "/assets/products/tapote-bg-formation-v1.webp": "coworking",
  "/assets/products/tapote-bg-formation-empty-v2.png": "coworking",
  "/assets/products/tapote-bg-evenement-v1.webp": "evenement",
  "/assets/products/tapote-bg-evenement-empty-v2.png": "evenement",
  "/assets/products/tapote-bg-animaux-v1.webp": "veterinaire",
});

const DEFAULT_PHONE_SECTOR_PROFILE = Object.freeze({
  bookingTitle: "Choisissez votre créneau",
  bookingSubject: "1 rendez-vous",
  bookingService: "Prochaines disponibilités",
  reward: "Avantage de bienvenue",
  menuTitle: "Notre sélection",
  menuItems: [["Prestation essentielle", "Sur rendez-vous", "35 €"], ["Formule complète", "Conseil personnalisé", "59 €"], ["Option premium", "Selon vos besoins", "79 €"]],
  orderItems: [["Formule essentielle", "Disponible aujourd’hui", "35 €"], ["Option complémentaire", "Ajout à la demande", "12 €"]],
  paymentLabel: "Règlement sécurisé",
  paymentAmount: "35,00 €",
  formType: "Demande d’information",
  formPlaceholder: "Votre besoin, vos disponibilités, précisions…",
  siteKicker: "NOTRE SAVOIR-FAIRE",
  siteTitle: "Un service précis. Une réponse claire.",
  siteBody: "Découvrez nos services, nos disponibilités et les informations utiles.",
  links: [["Nos services", "Prestations et informations"], ["Prendre rendez-vous", "Disponibilités en ligne"], ["Venir sur place", "Adresse et horaires"], ["Nous contacter", "Téléphone et e-mail"]],
  phone: "01 84 80 20 20",
  email: "bonjour@votremarque.fr",
  address: "Voir l’itinéraire",
  wifi: "INVITÉS",
  socialCaption: "Un aperçu de notre quotidien et de notre savoir-faire.",
});

const PHONE_SECTOR_PROFILES = Object.freeze({
  cafe: { bookingSubject: "2 personnes", bookingService: "Ce soir", reward: "Boisson chaude offerte", menuTitle: "La carte du moment", menuItems: [["Espresso de spécialité", "Brésil · notes chocolatées", "2,50 €"], ["Cappuccino", "Double shot · lait fermier", "4,50 €"], ["Cookie noisette", "Cuit ce matin", "3,80 €"]], orderItems: [["Cappuccino", "Lait entier", "4,50 €"], ["Cookie noisette", "Quantité · 1", "3,80 €"]], paymentLabel: "Commande au comptoir", paymentAmount: "8,30 €", formType: "Privatisation", formPlaceholder: "Date, nombre de personnes, ambiance souhaitée…", siteKicker: "CAFÉ DE SPÉCIALITÉ", siteTitle: "Torréfié avec soin. Servi simplement.", siteBody: "La carte, nos horaires et les cafés du moment.", links: [["Voir la carte", "Cafés, boissons et douceurs"], ["Réserver une table", "Disponibilités ce soir"], ["Nos horaires", "Ouvert aujourd’hui"], ["Nous appeler", "Une question rapide"]], phone: "01 42 60 11 25", email: "bonjour@cafenoma.fr", address: "18 rue du Bac, Paris", wifi: "CAFE_NOMA_GUEST", socialCaption: "Du grain à la tasse, les coulisses du comptoir." },
  restaurant: { bookingSubject: "2 personnes", bookingService: "Service du soir", reward: "Dessert maison offert", menuTitle: "Aujourd’hui au menu", menuItems: [["Velouté de potimarron", "Châtaigne · huile de noisette", "9 €"], ["Burrata crémeuse", "Tomates anciennes · basilic", "12 €"], ["Magret de canard", "Pommes grenaille · jus corsé", "24 €"]], orderItems: [["Burrata du marché", "Tomates anciennes", "12 €"], ["Magret de canard", "Pommes grenaille", "24 €"], ["Crème brûlée", "Vanille de Madagascar", "8 €"]], paymentLabel: "Règlement de la table", paymentAmount: "44,00 €", formType: "Privatisation", formPlaceholder: "Date, nombre de personnes, précisions…", siteKicker: "CUISINE DE SAISON", siteTitle: "Le goût du produit, simplement.", siteBody: "Produits frais, gestes précis et accueil chaleureux.", links: [["Voir la carte", "Menu du jour et allergènes"], ["Réserver une table", "Disponibilités en temps réel"], ["Venir au restaurant", "Itinéraire et horaires"], ["Nous contacter", "Appel et e-mail"]], phone: "01 42 18 21 21", email: "bonjour@latelier21.fr", address: "21 rue du Marché, Paris", wifi: "ATELIER21_INVITES", socialCaption: "En cuisine : le produit du jour, sauce montée minute ✨" },
  boulangerie: { bookingSubject: "1 commande", bookingService: "Retrait en boutique", reward: "Baguette tradition offerte", menuTitle: "Sorties du four", menuItems: [["Tradition au levain", "Farine Label Rouge", "1,30 €"], ["Croissant pur beurre", "Feuilletage maison", "1,40 €"], ["Tarte citron", "Format individuel", "4,90 €"]], orderItems: [["Pain de campagne", "Tranché · 500 g", "4,20 €"], ["6 croissants", "Retrait demain matin", "8,40 €"]], paymentLabel: "Commande à retirer", paymentAmount: "12,60 €", formType: "Commande spéciale", formPlaceholder: "Produit, quantité, date et heure de retrait…", siteKicker: "FABRIQUÉ ICI", siteTitle: "Du levain, du beurre, du temps.", siteBody: "Nos pains, pâtisseries et commandes pour vos événements.", links: [["Commander", "Pains et pâtisseries"], ["Voir les créations", "La sélection du moment"], ["Horaires", "Cuissons et ouvertures"], ["Nous appeler", "Commande spéciale"]], phone: "01 43 21 08 14", email: "commande@maisonlevain.fr", address: "8 place du Marché, Lyon", wifi: "MAISON_LEVAIN", socialCaption: "Ce matin au fournil : feuilletage pur beurre et levain naturel." },
  salon: { bookingTitle: "Réservez votre prestation", bookingSubject: "Coupe & coiffage", bookingService: "Cette semaine", reward: "Soin profond offert", menuTitle: "Nos prestations", menuItems: [["Coupe & coiffage", "Diagnostic inclus", "48 €"], ["Couleur signature", "Soin protecteur inclus", "85 €"], ["Rituel bien-être", "Massage du cuir chevelu", "35 €"]], orderItems: [["Shampoing éclat", "250 ml", "24 €"], ["Masque réparateur", "200 ml", "29 €"]], paymentLabel: "Prestation du jour", paymentAmount: "48,00 €", formType: "Diagnostic personnalisé", formPlaceholder: "Votre longueur, votre envie, vos disponibilités…", siteKicker: "BEAUTÉ & SOIN", siteTitle: "Votre style, jusque dans le détail.", siteBody: "Prestations, inspirations et réservation avec votre équipe.", links: [["Réserver", "Choisir une prestation"], ["Nos tarifs", "Coupes, couleurs et soins"], ["Voir Instagram", "Inspirations et réalisations"], ["Nous contacter", "Conseil avant rendez-vous"]], phone: "01 45 20 22 40", email: "bonjour@studiolune.fr", address: "32 rue de Charonne, Paris", wifi: "STUDIO_LUNE", socialCaption: "Avant / après : une coupe pensée pour le mouvement." },
  cabinet_medical: { bookingTitle: "Prendre rendez-vous", bookingSubject: "Consultation", bookingService: "Créneaux disponibles", reward: "Rappel prévention activé", menuTitle: "Informations pratiques", menuItems: [["Consultation", "Sur rendez-vous", "Secteur 1"], ["Téléconsultation", "Selon le motif", "25 €"], ["Documents utiles", "Ordonnance et carte Vitale", "—"]], orderItems: [["Téléconsultation", "Créneau confirmé", "25 €"]], paymentLabel: "Téléconsultation", paymentAmount: "25,00 €", formType: "Demande administrative", formPlaceholder: "Objet de la demande, disponibilité, informations utiles…", siteKicker: "INFORMATIONS PATIENTS", siteTitle: "Votre parcours, clairement expliqué.", siteBody: "Horaires, accès, spécialités et préparation du rendez-vous.", links: [["Prendre rendez-vous", "Créneaux disponibles"], ["Préparer ma visite", "Documents nécessaires"], ["Accès au cabinet", "Adresse et transports"], ["Contacter le secrétariat", "Demandes administratives"]], phone: "01 40 18 72 10", email: "secretariat@cabinetrivoli.fr", address: "14 rue de Rivoli, Paris", wifi: "CABINET_INVITES", socialCaption: "Informations de prévention et actualités du cabinet." },
  boutique: { bookingSubject: "Conseil privé", bookingService: "Cette semaine", reward: "-15 % sur votre prochain achat", menuTitle: "La sélection", menuItems: [["Veste en laine", "Coupe droite · marine", "149 €"], ["Chemise popeline", "Coton biologique", "79 €"], ["Sac atelier", "Cuir pleine fleur", "189 €"]], orderItems: [["Chemise popeline", "Taille M · blanc", "79 €"], ["Ceinture atelier", "Cuir cognac", "59 €"]], paymentLabel: "Commande boutique", paymentAmount: "138,00 €", formType: "Conseil taille", formPlaceholder: "Article, taille habituelle et préférence…", siteKicker: "NOUVELLE COLLECTION", siteTitle: "Des pièces choisies pour durer.", siteBody: "La collection, les nouveautés et le retrait en boutique.", links: [["Voir la collection", "Nouveautés et essentiels"], ["Réserver en boutique", "Essayage personnalisé"], ["Notre adresse", "Horaires et accès"], ["Nous écrire", "Disponibilité d’un article"]], phone: "01 84 25 16 90", email: "bonjour@maisoneclat.fr", address: "6 rue Vieille-du-Temple, Paris", wifi: "MAISON_ECLAT_GUEST", socialCaption: "Nouvelle silhouette : matières naturelles et coupe précise." },
  hotel: { bookingTitle: "Réserver un service", bookingSubject: "2 voyageurs", bookingService: "Pendant votre séjour", reward: "Départ tardif offert", menuTitle: "Services de l’hôtel", menuItems: [["Petit-déjeuner", "Servi de 7 h à 10 h 30", "18 €"], ["Room service", "Jusqu’à 22 h 30", "À la carte"], ["Départ tardif", "Selon disponibilité", "25 €"]], orderItems: [["Petit-déjeuner", "2 personnes · demain", "36 €"], ["Départ tardif", "Jusqu’à 14 h", "25 €"]], paymentLabel: "Services du séjour", paymentAmount: "61,00 €", formType: "Demande à la réception", formPlaceholder: "Numéro de chambre, service et horaire souhaité…", siteKicker: "VOTRE SÉJOUR", siteTitle: "Tout l’hôtel dans votre poche.", siteBody: "Wi-Fi, services, bonnes adresses et informations pratiques.", links: [["Guide d’accueil", "Services et informations"], ["Commander un service", "Petit-déjeuner et chambre"], ["Bonnes adresses", "La sélection de la réception"], ["Contacter l’accueil", "Disponible 24 h / 24"]], phone: "01 58 90 14 14", email: "reception@hotelrivage.fr", address: "4 quai de la Loire, Nantes", wifi: "RIVAGE_GUEST", socialCaption: "Une adresse calme, pensée pour prendre le temps." },
  auto_ecole: { bookingTitle: "Réserver une leçon", bookingSubject: "Leçon de conduite", bookingService: "Mon planning", reward: "1 h de simulateur offerte", menuTitle: "Nos formations", menuItems: [["Permis B", "Boîte manuelle", "Dès 1 190 €"], ["Conduite accompagnée", "Dès 15 ans", "Dès 1 290 €"], ["Heure de conduite", "Leçon individuelle", "52 €"]], orderItems: [["Heure de conduite", "Moniteur confirmé", "52 €"], ["Livret numérique", "Inclus", "0 €"]], paymentLabel: "Leçon de conduite", paymentAmount: "52,00 €", formType: "Inscription permis", formPlaceholder: "Permis visé, disponibilités et expérience…", siteKicker: "PRENEZ LE VOLANT", siteTitle: "Une formation claire, à votre rythme.", siteBody: "Formules, planning des leçons et inscription en ligne.", links: [["Voir les formations", "Permis et formules"], ["Réserver une leçon", "Planning en ligne"], ["Dossier d’inscription", "Pièces à fournir"], ["Contacter l’agence", "Une question sur le permis"]], phone: "01 46 70 31 20", email: "contact@driveclub.fr", address: "27 avenue Jean-Jaurès, Lille", wifi: "DRIVE_CLUB", socialCaption: "Conseils de conduite, réussites et vie de l’agence." },
  garage: { bookingTitle: "Planifier l’entretien", bookingSubject: "Révision véhicule", bookingService: "Atelier", reward: "Contrôle sécurité offert", menuTitle: "Nos prestations", menuItems: [["Révision constructeur", "Garantie préservée", "Dès 189 €"], ["Diagnostic électronique", "Compte-rendu inclus", "79 €"], ["Pneumatiques", "Montage et équilibrage", "Sur devis"]], orderItems: [["Diagnostic électronique", "Durée estimée · 1 h", "79 €"], ["Contrôle sécurité", "Inclus", "0 €"]], paymentLabel: "Facture atelier", paymentAmount: "189,00 €", formType: "Demande de devis", formPlaceholder: "Immatriculation, kilométrage et intervention…", siteKicker: "L’ATELIER AUTO", siteTitle: "Votre véhicule, suivi sans surprise.", siteBody: "Entretien, diagnostic, devis et prochain rendez-vous.", links: [["Prendre rendez-vous", "Entretien et diagnostic"], ["Demander un devis", "Réponse de l’atelier"], ["Suivre mon véhicule", "État de l’intervention"], ["Appeler la réception", "Une urgence mécanique"]], phone: "01 70 26 45 80", email: "atelier@atelierauto.fr", address: "12 route de Lyon, Dijon", wifi: "ATELIER_AUTO", socialCaption: "Diagnostic, entretien et conseils de l’équipe atelier." },
  artisan: { bookingTitle: "Planifier un rendez-vous", bookingSubject: "Visite technique", bookingService: "Sur place", reward: "Diagnostic offert", menuTitle: "Nos prestations", menuItems: [["Dépannage", "Intervention rapide", "Sur devis"], ["Installation", "Étude personnalisée", "Sur devis"], ["Entretien annuel", "Contrôle complet", "129 €"]], orderItems: [["Diagnostic sur place", "Déplacement inclus", "69 €"], ["Compte-rendu", "Envoyé par e-mail", "Inclus"]], paymentLabel: "Acompte intervention", paymentAmount: "69,00 €", formType: "Demande de devis", formPlaceholder: "Adresse, travaux souhaités, photos et délai…", siteKicker: "SAVOIR-FAIRE ARTISAN", siteTitle: "Un travail propre, expliqué et durable.", siteBody: "Réalisations, zones d’intervention et demande de devis.", links: [["Voir les réalisations", "Chantiers et finitions"], ["Demander un devis", "Décrivez votre projet"], ["Zone d’intervention", "Secteurs desservis"], ["Appeler l’artisan", "Disponible sur le terrain"]], phone: "06 12 34 56 78", email: "contact@ateliermartin.fr", address: "Interventions en Île-de-France", wifi: "ATELIER_MARTIN", socialCaption: "Les étapes d’un chantier soigné, du diagnostic à la finition." },
  immobilier: { bookingTitle: "Planifier une visite", bookingSubject: "Visite immobilière", bookingService: "Avec votre conseiller", reward: "Avis de valeur offert", menuTitle: "Nos services", menuItems: [["Estimation", "Avis de valeur détaillé", "Offert"], ["Mise en vente", "Photos et diffusion", "Sur mandat"], ["Recherche acquéreur", "Accompagnement complet", "Sur mesure"]], orderItems: [["Dossier d’estimation", "Analyse du marché", "Offert"]], paymentLabel: "Acompte prestation", paymentAmount: "90,00 €", formType: "Demande d’estimation", formPlaceholder: "Adresse, surface, type de bien et projet…", siteKicker: "VOTRE PROJET IMMOBILIER", siteTitle: "Estimer, vendre, trouver le bon lieu.", siteBody: "Biens disponibles, estimation et contact direct avec votre conseiller.", links: [["Voir les biens", "Sélection disponible"], ["Estimer mon bien", "Avis de valeur offert"], ["Prendre rendez-vous", "Visite ou échange conseil"], ["Enregistrer le contact", "Votre conseiller dédié"]], phone: "06 24 18 72 30", email: "bonjour@agencehorizon.fr", address: "9 place Bellecour, Lyon", wifi: "HORIZON_CLIENTS", socialCaption: "Nouveau bien : lumière, volumes et emplacement recherché." },
  salle_sport: { bookingTitle: "Réserver une séance", bookingSubject: "Cours collectif", bookingService: "Planning du studio", reward: "1 séance offerte", menuTitle: "Le planning", menuItems: [["HIIT Express", "45 min · tous niveaux", "18 €"], ["Pilates Flow", "50 min · petit groupe", "20 €"], ["Coaching individuel", "Bilan inclus", "65 €"]], orderItems: [["Carnet 10 séances", "Valable 4 mois", "160 €"], ["Bilan forme", "30 min", "Offert"]], paymentLabel: "Carnet de séances", paymentAmount: "160,00 €", formType: "Séance d’essai", formPlaceholder: "Objectif, niveau et créneaux préférés…", siteKicker: "BOUGEZ À VOTRE RYTHME", siteTitle: "Un studio, une équipe, votre progression.", siteBody: "Planning, réservation et formules d’entraînement.", links: [["Voir le planning", "Cours et disponibilités"], ["Réserver une séance", "Confirmation immédiate"], ["Nos formules", "À la séance ou abonnement"], ["Rejoindre la communauté", "Actualités du studio"]], phone: "01 82 83 46 20", email: "hello@motionclub.fr", address: "5 rue Oberkampf, Paris", wifi: "MOTION_CLUB", socialCaption: "Séance du jour : énergie, précision et progression collective." },
  coworking: { bookingTitle: "Réserver une salle", bookingSubject: "Salle de réunion", bookingService: "Aujourd’hui", reward: "1 h de salle offerte", menuTitle: "Espaces & services", menuItems: [["Poste nomade", "Journée complète", "29 €"], ["Salle Horizon", "Jusqu’à 8 personnes", "45 €/h"], ["Studio visio", "Équipement inclus", "30 €/h"]], orderItems: [["Salle Horizon", "2 heures", "90 €"], ["Café d’accueil", "8 personnes", "24 €"]], paymentLabel: "Réservation d’espace", paymentAmount: "114,00 €", formType: "Inscription formation", formPlaceholder: "Programme, participants et besoins techniques…", siteKicker: "TRAVAILLER AUTREMENT", siteTitle: "Des espaces prêts quand vous l’êtes.", siteBody: "Salles, bureaux, événements et ressources des membres.", links: [["Réserver une salle", "Disponibilités en direct"], ["Programme des formations", "Sessions à venir"], ["Ressources membres", "Documents et accès"], ["Contacter l’accueil", "Aide sur place"]], phone: "01 76 40 22 18", email: "accueil@bureaulibre.fr", address: "22 rue du Sentier, Paris", wifi: "BUREAU_LIBRE_GUEST", socialCaption: "Atelier, rencontre et nouveaux projets dans les espaces partagés." },
  evenement: { bookingTitle: "Réserver une place", bookingSubject: "1 participant", bookingService: "Prochaine session", reward: "Accès prioritaire offert", menuTitle: "Le programme", menuItems: [["Ouverture des portes", "Accueil du public", "18:30"], ["Temps fort", "Scène principale", "20:00"], ["Rencontre artistes", "Après la représentation", "22:00"]], orderItems: [["Billet plein tarif", "Placement libre", "24 €"], ["Soutien à l’association", "Don libre", "10 €"]], paymentLabel: "Billetterie", paymentAmount: "34,00 €", formType: "Inscription bénévole", formPlaceholder: "Disponibilités, mission souhaitée et expérience…", siteKicker: "AU PROGRAMME", siteTitle: "Une soirée à vivre ensemble.", siteBody: "Programme, billetterie, accès et informations pratiques.", links: [["Voir le programme", "Horaires et scènes"], ["Prendre un billet", "Billetterie sécurisée"], ["Informations pratiques", "Accès et horaires"], ["Soutenir le projet", "Adhésion et dons"]], phone: "01 88 32 14 60", email: "bonjour@lebonmoment.fr", address: "Parvis des Arts, Bordeaux", wifi: "BON_MOMENT_PUBLIC", socialCaption: "Montage en cours : les coulisses avant l’ouverture des portes." },
  veterinaire: { bookingTitle: "Prendre rendez-vous", bookingSubject: "Consultation vétérinaire", bookingService: "Créneaux disponibles", reward: "Bilan prévention offert", menuTitle: "Soins & conseils", menuItems: [["Consultation", "Chien, chat et NAC", "42 €"], ["Vaccination", "Bilan inclus", "Dès 58 €"], ["Toilettage soin", "Sur rendez-vous", "Dès 45 €"]], orderItems: [["Alimentation conseil", "Sac 3 kg", "29 €"], ["Antiparasitaire", "Selon le poids", "18 €"]], paymentLabel: "Consultation du jour", paymentAmount: "42,00 €", formType: "Demande de rendez-vous", formPlaceholder: "Animal, motif, âge et disponibilités…", siteKicker: "PRENDRE SOIN D’EUX", siteTitle: "Une équipe attentive, à chaque étape.", siteBody: "Rendez-vous, urgences, conseils et informations pratiques.", links: [["Prendre rendez-vous", "Consultations et soins"], ["Conseils pratiques", "Prévention et bien-être"], ["Accès à la clinique", "Adresse et urgences"], ["Appeler l’équipe", "Une question sur votre animal"]], phone: "01 49 72 18 30", email: "contact@cliniquedeslilas.fr", address: "3 avenue des Lilas, Lille", wifi: "CLINIQUE_INVITES", socialCaption: "Conseils de prévention et nouvelles de nos patients à quatre pattes." },
});

// Dedicated in-phone media. Lifestyle hero photographs deliberately never
// appear here: reusing them would put a second phone inside the first one.
const PHONE_SECTOR_MEDIA = Object.freeze({
  cafe: "/assets/phone/sector-cafe-media-v1.webp",
  boulangerie: "/assets/phone/sector-boulangerie-media-v1.webp",
  salon: "/assets/phone/sector-salon-media-v1.webp",
  cabinet_medical: "/assets/phone/sector-medical-media-v1.webp",
  boutique: "/assets/phone/sector-boutique-media-v1.webp",
  hotel: "/assets/phone/sector-hotel-media-v1.webp",
  auto_ecole: "/assets/phone/sector-auto-ecole-media-v1.webp",
  garage: "/assets/phone/sector-garage-media-v1.webp",
  artisan: "/assets/phone/sector-artisan-media-v1.webp",
  immobilier: "/assets/phone/sector-immobilier-media-v1.webp",
  salle_sport: "/assets/phone/sector-sport-media-v1.webp",
  coworking: "/assets/phone/sector-coworking-media-v1.webp",
  evenement: "/assets/phone/sector-evenement-media-v1.webp",
  veterinaire: "/assets/phone/sector-veterinaire-media-v1.webp",
});

const PHONE_SECTOR_EXPERIENCE = Object.freeze({
  cafe: { times: ["08:30", "10:00", "11:30"], tabs: ["Boissons", "Douceurs", "Infos"], location: "Paris", incoming: "Bonjour 👋 Vous souhaitez réserver une table ou connaître le café du jour ?", outgoing: "Bonjour, avez-vous encore une table pour deux vers 18 h ?" },
  restaurant: { times: ["19:00", "19:30", "20:00"], tabs: ["Entrées", "Plats", "Desserts"], location: "Paris", incoming: "Bonsoir 👋 Souhaitez-vous réserver ou nous signaler une allergie ?", outgoing: "Bonsoir, une table pour deux à 20 h serait-elle disponible ?" },
  boulangerie: { times: ["08:00", "09:30", "11:00"], tabs: ["Pains", "Viennoiseries", "Pâtisseries"], location: "Lyon", incoming: "Bonjour 👋 Que souhaitez-vous faire préparer ?", outgoing: "Bonjour, je voudrais réserver six croissants pour demain matin." },
  salon: { times: ["09:30", "13:00", "16:30"], tabs: ["Coiffure", "Couleur", "Soins"], location: "Paris", incoming: "Bonjour 👋 Quelle prestation souhaitez-vous réserver ?", outgoing: "Bonjour, avez-vous un créneau coupe et coiffage cette semaine ?" },
  cabinet_medical: { times: ["09:00", "11:20", "15:40"], tabs: ["Consultations", "Pratique", "Accès"], location: "Paris", incoming: "Bonjour, le secrétariat vous répond pour les demandes administratives.", outgoing: "Bonjour, je souhaite déplacer mon rendez-vous de jeudi." },
  boutique: { times: ["11:00", "14:30", "17:00"], tabs: ["Nouveautés", "Collection", "Guide"], location: "Paris", incoming: "Bonjour 👋 Souhaitez-vous vérifier une taille ou réserver un essayage ?", outgoing: "Bonjour, la chemise popeline est-elle disponible en taille M ?" },
  hotel: { times: ["07:30", "09:00", "10:30"], tabs: ["Séjour", "Services", "Infos"], location: "Nantes", incoming: "Bonjour 👋 La réception est disponible. Indiquez-nous votre numéro de chambre.", outgoing: "Bonjour, chambre 204 : deux petits-déjeuners pour demain, s’il vous plaît." },
  auto_ecole: { times: ["10:00", "14:00", "17:30"], tabs: ["Permis B", "Conduite", "Dossier"], location: "Lille", incoming: "Bonjour 👋 Avez-vous déjà un numéro NEPH ?", outgoing: "Bonjour, je souhaite réserver une leçon de conduite samedi." },
  garage: { times: ["08:30", "11:00", "14:30"], tabs: ["Entretien", "Diagnostic", "Devis"], location: "Dijon", incoming: "Bonjour 👋 Pouvez-vous nous préciser le modèle et l’immatriculation ?", outgoing: "Bonjour, je souhaite un devis pour la révision de mon véhicule." },
  artisan: { times: ["08:00", "13:30", "16:00"], tabs: ["Services", "Réalisations", "Zone"], location: "Île-de-France", incoming: "Bonjour 👋 Envoyez votre adresse et quelques photos du projet.", outgoing: "Bonjour, je souhaiterais un devis pour une intervention à domicile." },
  immobilier: { times: ["10:00", "14:00", "17:00"], tabs: ["Biens", "Estimation", "Conseil"], location: "Lyon", incoming: "Bonjour 👋 Souhaitez-vous visiter un bien ou demander une estimation ?", outgoing: "Bonjour, je voudrais visiter l’appartement présenté cette semaine." },
  salle_sport: { times: ["07:30", "12:15", "18:30"], tabs: ["Cours", "Coaching", "Tarifs"], location: "Bordeaux", incoming: "Bonjour 👋 Quel cours souhaitez-vous essayer ?", outgoing: "Bonjour, reste-t-il une place au Pilates de 18 h 30 ?" },
  coworking: { times: ["09:00", "13:00", "15:30"], tabs: ["Espaces", "Salles", "Pass"], location: "Toulouse", incoming: "Bonjour 👋 Pour combien de personnes souhaitez-vous réserver ?", outgoing: "Bonjour, je cherche une salle pour six personnes jeudi après-midi." },
  evenement: { times: ["18:30", "19:30", "20:30"], tabs: ["Billets", "Programme", "Accès"], location: "Marseille", incoming: "Bonjour 👋 Une question sur le programme ou l’accessibilité ?", outgoing: "Bonjour, reste-t-il des places pour la séance de samedi ?" },
  veterinaire: { times: ["09:20", "11:40", "16:10"], tabs: ["Soins", "Prévention", "Urgences"], location: "Lille", incoming: "Bonjour 👋 Quel animal souhaitez-vous faire examiner ?", outgoing: "Bonjour, mon chat doit recevoir son rappel de vaccin." },
});

export function phoneSectorExperience(sectorId) {
  return PHONE_SECTOR_EXPERIENCE[sectorId] || { times: ["09:00", "13:30", "17:00"], tabs: ["Sélection", "Services", "Infos"], location: "France", incoming: "Bonjour 👋 Comment pouvons-nous vous aider ?", outgoing: "Bonjour, je souhaiterais obtenir un renseignement." };
}

export function phoneSectorMedia(sectorId) {
  if (sectorId === "restaurant") return [RESTAURANT_PHONE_MEDIA.burrata, RESTAURANT_PHONE_MEDIA.tiktok, RESTAURANT_PHONE_MEDIA.duck, RESTAURANT_PHONE_MEDIA.fish, RESTAURANT_PHONE_MEDIA.dessert, RESTAURANT_PHONE_MEDIA.burrata];
  const asset = PHONE_SECTOR_MEDIA[sectorId] || PHONE_SECTOR_MEDIA.cafe;
  return [asset, asset, asset, asset, asset, asset];
}

export function resolvePhoneSectorId(sectorId, sceneImage) {
  return sectorId || PHONE_SCENE_SECTORS[sceneImage] || "";
}

export function phoneSectorProfile(sectorId, sceneImage) {
  return { ...DEFAULT_PHONE_SECTOR_PROFILE, ...(PHONE_SECTOR_PROFILES[resolvePhoneSectorId(sectorId, sceneImage)] || {}) };
}

export function parseEuroAmount(value) {
  const normalized = String(value || "").replace(/\s/g, "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  return normalized ? Number(normalized[0]) : 0;
}

export function compactEuro(value) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;
}
