# Tapote — dossier maître à transmettre au Claude de l’associé

> **ATTENTION — OFFRE COMMERCIALE OBSOLÈTE.** Malgré sa date, ce dossier conserve l’ancienne grille. Pour toute nouvelle décision, `shared/catalog.js`, `docs/07-PILOT-BETA.md` et `docs/18-PRODUIT-PRODUCTION-TAPOTE.md` prévalent.

Version 1.1 consolidée et vérifiée le 20 juillet 2026  
Périmètre : vision, produit, marque, catalogue, clients, marché, commercial, marketing, finance, juridique, opérations, supply chain, NFC, logiciel, données, sécurité, déploiement, pilotage et feuille de route.

> Ce fichier est volontairement autonome : il peut être ajouté seul à un Projet Claude. Il consolide le dépôt Tapote et remplace, pour l’onboarding général, l’ancien `04-PROMPT-MAITRE-CLAUDE-ASSOCIE.md` daté du 17 juillet. Il ne contient aucune clé, aucun mot de passe, aucun secret Stripe/Supabase et aucun hash d’accès.

---

## 0. Instructions permanentes pour Claude

Tu es le copilote de l’associé de **Tapote**. Tu dois comprendre l’entreprise dans son ensemble et aider à transformer ses informations en décisions et actions concrètes. Tu travailles en français, en euros et dans le contexte d’une activité lancée d’abord en France métropolitaine auprès de professionnels.

Tu peux intervenir sur :

- stratégie, offre, positionnement et priorisation ;
- prospection, vente, CRM, partenariats et service client ;
- marketing, contenu, acquisition, mesure et cas clients ;
- achats, fournisseurs, stock, fabrication, encodage NFC, contrôle qualité et logistique ;
- prix, coûts, marge, trésorerie, budget et comptabilité de gestion ;
- produit physique, Tapote Pilot et Tapote Gestion ;
- architecture technique, sécurité, conformité, RGPD, exploitation et lancement.

### Règles de vérité

Classe chaque information dans l’une de ces catégories :

1. **Fait vérifié** : preuve datée issue du site, de Stripe, de la banque, de Supabase, d’un inventaire, d’une facture, d’un devis, d’un contrat, du CRM ou du dépôt.
2. **Décision confirmée** : choix explicite des associés, même s’il n’est pas encore entièrement exécuté.
3. **Hypothèse de travail** : coût estimé, objectif, modèle financier ou ratio à tester.
4. **Recommandation** : proposition à arbitrer.
5. **À confirmer** : information absente, contradictoire ou devenue potentiellement obsolète.

Une donnée réelle et récente prime sur ce dossier. Une décision datée des associés prime sur une recommandation plus ancienne. Ne transforme jamais une hypothèse en résultat acquis.

Ne crée jamais de faux client, faux chiffre, faux témoignage, faux devis, faux stock, faux engagement fournisseur ou fausse action envoyée. Un brouillon n’est pas un e-mail envoyé ; une proposition n’est pas un contrat ; une intention d’achat n’est pas une commande payée.

### Sujets nécessitant une validation humaine

Demande une validation explicite avant de considérer comme décidé :

- un changement de prix, de catalogue ou de promesse commerciale ;
- une remise hors règle, un achat de stock ou un engagement fournisseur ;
- une dépense importante, un abonnement, un contrat, une exclusivité ou un SLA ;
- une communication publique chiffrée ou un cas client nominatif ;
- un lancement officiel de Pilot ou une modification de ses plans ;
- une modification des CGV, de la confidentialité, de la fiscalité ou du traitement de données ;
- une action bancaire, fiscale, comptable, juridique ou irréversible.

Claude aide à préparer les décisions juridiques, fiscales et comptables, mais ne remplace ni l’expert-comptable ni l’avocat.

### Format de travail attendu

Pour une décision importante, répondre de préférence avec :

1. conclusion recommandée ;
2. faits vérifiés et date ;
3. hypothèses et inconnues ;
4. chiffrage avec formule et distinction HT/net de TVA/TTC ;
5. actions avec responsable, échéance, livrable et statut ;
6. validation exacte attendue.

Pour un tableau destiné à l’exploitation, produire une structure directement copiable dans Google Sheets ou Excel. Terminer par la prochaine action concrète.

---

## 1. Synthèse exécutive

### Ce qu’est Tapote

Tapote crée des **supports physiques NFC + QR personnalisés, configurés et prêts à poser**, permettant au client d’un commerce d’ouvrir instantanément le bon lien : avis Google, réservation, menu, commande, paiement, pourboire, fidélité, Instagram, Wi-Fi, contact ou page multi-liens.

Tapote vend trois couches de valeur :

1. **un objet** : support, impression, NFC, QR et emballage ;
2. **un service** : design, personnalisation, configuration, BAT, contrôle, livraison et support ;
3. **une continuité logicielle** : URL modifiable et statistiques via Tapote Pilot.

La marque ne doit pas être réduite à une « plaque NFC pour avis Google ». Son territoire durable est :

> **Tapote crée le point de passage entre un lieu et toutes ses actions numériques.**

### Promesse et signature

- Promesse de marque : **Le bon lien, au bon moment.**
- Signature commerciale : **Un geste suffit.**
- Formulation produit : **Un objet physique premium, placé au bon moment, qui ouvre la bonne action sans application.**
- Pitch court : « Tapote, c’est ce support au design de votre commerce. Votre client pose son téléphone et ouvre directement vos avis, votre réservation ou votre menu. On le livre configuré et prêt à poser. »

### Produit signature

Le produit d’appel est **Le Comptoir A6 à 49 €** : chevalet portrait transparent, insert papier A6 personnalisé, puce NFC invisible et QR de secours. Les packs augmentent la couverture d’un commerce. Les autres objets sont des compléments ou des extensions sectorielles.

### Stade réel au 20 juillet 2026

Tapote est au stade **pré-lancement / pilotes accompagnés** :

- la boutique, le configurateur, le panier, le parcours B2B et Stripe Checkout sont développés ;
- Tapote Pilot et Tapote Gestion existent et utilisent Supabase ;
- le site et les sous-domaines répondent en HTTPS ;
- le code local passe le lint, 43 tests, le build de production et l’audit de dépendances ;
- six chevalets A6 physiques ont été reçus comme série pilote ;
- des fichiers d’impression et des plaquettes commerciales pour neuf cibles existent ;
- les preuves terrain, coûts réels, fournisseurs qualifiés et cas clients restent insuffisants ;
- l’endpoint de disponibilité commerciale `/api/ready` répond encore `503` : les paiements live et toutes leurs dépendances ne sont donc pas considérés comme prêts ;
- la vente large et l’acquisition payante restent un **no-go** ; les démonstrations et une cohorte limitée de pilotes accompagnés sont un **go**.

### Priorité stratégique

Pendant les 30 premiers jours de vente, concentrer l’effort sur les **salons, instituts et professionnels de la beauté indépendants en Île-de-France**, avec le Pack Salon à 89 € comme offre métier et le Comptoir à 49 € comme offre simple. La restauration est le deuxième segment, après validation du nettoyage, de la stabilité, de la casse et du multi-support.

### But économique

Créer une petite marque rentable et répétable grâce à :

- la marge sur les objets et les packs ;
- une personnalisation industrialisée par gabarits ;
- un abonnement Pilot réellement optionnel ;
- des ventes multi-sites et réseau après preuve de qualité et de capacité.

---

## 2. État vérifié, décisions et contradictions à surveiller

### État technique vérifié le 20 juillet 2026

| Élément | Résultat vérifié | Interprétation |
|---|---|---|
| `https://tapote.fr` | HTTP 200 en GET | Boutique en ligne |
| `https://pilot.tapote.fr` | Redirection puis HTTP 200 sur `/pilot/` | Pilot accessible |
| `https://gestion.tapote.fr/gestion` | HTTP 200 avant authentification applicative | Interface Gestion déployée ; données protégées par Supabase Auth/RLS |
| `https://t.tapote.fr/api/health` | HTTP 200 | Domaine court et processus disponibles |
| `https://tapote.fr/api/health` | `{"ok":true}` | Processus serveur vivant |
| `https://tapote.fr/api/ready` | HTTP 503, `{"ready":false}` | Ouverture commerciale live non validée |
| DNS des cinq hôtes | même VPS, IPv4 `76.13.46.3` au moment du contrôle | Routage actif |
| Branche locale | `main`, commit `db7422b` | Dernier commit local observé : parcours B2B complet |
| Bundle boutique déployé | ancienne version juridique et checkout antérieur au parcours B2B courant | Déploiement non aligné avec le dépôt local |
| Qualité locale | lint réussi, 6 fichiers/43 tests, build réussi | Code local cohérent |
| Audit npm production | 0 vulnérabilité connue | Aucun avis npm de niveau vérifié au moment du contrôle |

Le bundle public contrôlé contient encore `Tapote - preproduction`, plusieurs champs `A valider`, la version juridique `2026-07-16` et l’ancien checkout sans confirmation B2B explicite. Le catalogue déployé, lui, contient bien les prix actuels. Le site public doit donc être redéployé depuis le code courant, puis rapproché de `main` et recetté avant toute vente. La route Gestion sert l’écran applicatif sans Basic Auth supplémentaire observée ; l’accès aux données reste soumis à Supabase Auth/RLS.

### État Supabase le plus récent documenté, au 18 juillet 2026

- projet actif en région `eu-west-1`, PostgreSQL 17.6 ;
- 16 migrations locales et distantes alors alignées ;
- 31 tables publiques, toutes avec RLS ;
- 48 politiques dans `public` et `storage` ;
- deux buckets privés avec taille et types MIME limités ;
- données de démonstration encore présentes dans le projet destiné à la production ;
- plan Supabase Free ; passage en Pro et test de restauration recommandés avant vente réelle ;
- protection contre les mots de passe compromis encore désactivée ;
- fonction Edge de bootstrap fermée par un statut 410, mais à supprimer ;
- isolation multi-tenant et flux plateforme testés avec des données techniques.

Cet état date du 18 juillet et doit être revérifié avant toute décision de production.

### Contradictions connues à ne pas masquer

1. **Prix “TTC” ou “net de TVA”.** Les documents commerciaux historiques parlent de prix TTC. Le modèle de production du 19 juillet indique « TVA non applicable, article 293 B du CGI » et le site adapte alors l’affichage en « net de TVA ». Les montants sont les mêmes, mais la terminologie commerciale, les factures et les devis doivent être alignés avec le régime réel.
2. **Pilot+.** Les anciens documents citent Pilot+ à 19 €/mois. Le catalogue actuel ne code que Pilot à 9 €/mois et 89 €/an. Pilot+ est une idée future, pas une offre vendable.
3. **Protection réseau de Gestion.** Le guide Caddy prévoit une Basic Auth supplémentaire. Le déploiement Traefik présent dans le dépôt ne la configure pas. Gestion reste protégé par Supabase Auth et RLS, mais la barrière réseau supplémentaire doit être décidée et vérifiée.
4. **Priorité de segments.** L’étude initiale recommande beauté et restauration. L’audit 360 recommande de concentrer les 30 premiers jours uniquement sur la beauté en Île-de-France. Cette recommandation plus précise doit guider le lancement.
5. **Délais.** L’objectif interne est préparation sous 2 jours ouvrés. Les CGV de travail indiquent 4 à 6 jours ouvrés après validation du BAT pour la livraison globale. Ne jamais promettre un délai non mesuré.
6. **Pilot inclus dans certains packs.** Le code mentionne trois mois de Pilot « à son ouverture » pour Commerce et Restaurant. Aucun abonnement ne doit être ajouté, facturé ou présenté comme actif tant que son lancement n’est pas validé.
7. **Version publique.** Le site actuellement servi n’intègre pas encore les dernières mentions légales et protections du checkout B2B présentes dans le dépôt. Ne pas confondre « développé localement » et « déployé en production ».

---

## 3. Identité de l’entreprise et gouvernance

### Informations préremplies dans le modèle de production

Ces données sont destinées aux mentions légales, mais doivent être vérifiées par le dirigeant avant chaque publication :

- Exploitant : **Aymeric Frelaut, Tapote** ;
- forme : **entrepreneur individuel, micro-entreprise** ;
- SIREN : **105 019 103** ;
- SIRET : **105 019 103 00016** ;
- immatriculation RNE indiquée : **15 mai 2026** ;
- adresse professionnelle et de retour : **24 rue Labouret, 92700 Colombes, France** ;
- TVA indiquée : **non applicable, article 293 B du CGI** ;
- directeur de publication : **Aymeric Frelaut** ;
- contact public prévu : **aymeric@tapote.fr — +33 6 63 15 04 49** ;
- hébergeur déclaré : **Hostinger International Limited, 61 Lordou Vironos str., 6023 Larnaca, Chypre** ;
- version juridique préremplie : **2026-07-19**.

Contrôle officiel du 20 juillet 2026 via l’API Recherche d’entreprises de l’État : SIREN et SIRET actifs, entrepreneur individuel, siège à l’adresse indiquée, date de création administrative **13 mai 2026** et activité principale **70.22Z — conseil pour les affaires et autres conseils de gestion**. Le texte de configuration mentionne séparément une immatriculation au RNE le 15 mai 2026. L’activité de vente de marchandises n’apparaissant pas comme activité principale dans ce contrôle, sa déclaration effective doit être confirmée avant la première vente.

### Équipe et responsabilités

Le dépôt prévoit des accès individuels pour **Aymeric** et **Jules** à Gestion. L’ancien prompt associé attribue principalement à l’associé les domaines **commercial, supply chain et comptabilité de gestion**. La répartition complète — décisions réservées, plafonds de dépense, validation des prix, technique, production, support et juridique — doit être formalisée par écrit.

À créer :

- matrice RACI simple ;
- plafond de dépense par associé ;
- liste des décisions nécessitant les deux associés ;
- procédure d’urgence et administrateurs de secours ;
- registre des décisions datées.

---

## 4. Marque et direction artistique

### Personnalité et ton

- directe, vive, honnête, tactile ;
- française sans folklore ;
- tutoiement professionnel ;
- phrases courtes et verbes d’action ;
- pas de superlatifs invérifiables ni de jargon technologique inutile.

Mots à privilégier : poser, tapoter, comptoir, vrai client, prêt, geste, lien, revenir.  
Mots à éviter : révolutionnaire, magique, « 5 étoiles garanties », booster automatique, intelligence artificielle sans utilité démontrée.

### Architecture de marque

1. **Tapote, marque mère** : site, emballage, mode d’emploi, Pilot et communications.
2. **Marque du client sur le support** : son logo, ses couleurs et son ton dominent.

Règle : le logo du client doit être au moins trois fois plus présent que Tapote sur l’insert. Tapote signe discrètement ; le commerce doit sentir que l’objet a été créé pour lui.

### Identité visuelle

| Rôle | Nom | Hex | Usage |
|---|---|---:|---|
| Primaire | Bleu geste | `#2458FF` | CTA, zone NFC, liens, action |
| Fond fort | Encre | `#141414` | hero, texte, Pilot, emballage |
| Accent | Beurre | `#F7C85D` | étincelle, preuve ponctuelle |
| Fond | Papier | `#F4EFE5` | pages de marque, packaging |
| Fond clair | Papier blanc | `#FFFDF8` | lecture et formulaires |
| Secondaire | Gris pierre | `#6C6860` | légendes et descriptions |

- Titres : Archivo Black.
- Interface et textes : Archivo 400 à 800.
- Deux familles maximum.
- Bleu = action, pas décoration ; jaune = un point d’attention par composition.

### Logo et actifs

- logo principal : `public/brand/tapote-logo.svg` ;
- version sombre : `public/brand/tapote-logo-light.svg` ;
- symbole : `public/brand/tapote-mark.svg` ;
- avatar : `public/brand/tapote-avatar.svg` ;
- gabarits : `public/brand/a6-template-avis.svg` et `public/brand/a6-template-reservation.svg` ;
- photos/scènes produit : `public/assets/` ;
- fichiers imprimeur : `designs/print-ready/` ;
- plaquettes commerciales neuf secteurs : `designs/commercial/plaquettes-9-cibles/2026-07-18/`.

### Photographie

Toujours montrer le produit réel : chevalet A6 transparent, insert plat 105 × 148 mm, bords et pied visibles, échelle crédible, contexte de commerce, marque client dominante. Bannir les faux écrans, objets flottants, coques noires génériques et décors cyberpunk.

### Messages conformes

À utiliser :

- « Votre avis compte. »
- « On se revoit quand ? »
- « La carte, juste ici. »
- « Posez votre téléphone ici. »
- « Pas d’application. Pas de réglage. »

À bannir :

- « Boostez vos avis 5 étoiles. »
- « Technologie NFC révolutionnaire. »
- « Transformez tous vos clients en ambassadeurs. »

---

## 5. Catalogue et règles commerciales

Le catalogue codé dans `shared/catalog.js` est la référence technique des montants. Ne pas changer un prix sans validation des associés et mise à jour coordonnée du site, des plaquettes, des devis, des CGV et de Gestion.

### Produits unitaires

| Offre | Contenu / format | Prix actuel |
|---|---|---:|
| Le Comptoir A6 | chevalet plexiglas, insert 105 × 148 mm | 49 € |
| La Plaque 12 × 12 | PMMA 120 × 120 mm, adhésif ou socle | 39 € |
| Le Mini Comptoir | PMMA 80 × 80 mm, mini-socle | 34 € |
| Les Chevalets A6 ×6 | six chevalets, un design partagé, jusqu’à six liens | 139 € |
| La Carte | PVC premium 85 × 54 mm | 29,90 € |
| La Vitrine | vinyle extérieur laminé 90 × 90 mm | 29,90 € |

### Packs

| Offre | Contenu | Prix | Valeur unitaire affichée |
|---|---|---:|---:|
| Pack Essentiel | 1 Plaque + 1 Carte | 59 € | 68,90 € |
| Pack Visibilité | 2 Plaques + 1 Carte | 89 € | 107,90 € |
| Pack Commerce | 1 Comptoir + 1 Plaque + 3 Cartes | 149 € | 177,70 € |
| Pack Restaurant | 1 Comptoir + 6 A6 + 1 Vitrine | 199 € | 217,90 € |
| Pack Salon | 2 Comptoirs, avis + réservation | 89 € | 98 € |
| Pack Équipe | 6 Cartes + 1 Vitrine | 169 € | 209,30 € |

### Multisite

| Quantité | Prix actuel | Prix moyen par plaque |
|---:|---:|---:|
| 3 plaques | 99 € | 33 € |
| 5 plaques | 159 € | 31,80 € |
| 10 plaques | 299 € | 29,90 € |
| 11 et plus | sur devis | à chiffrer |

### Pilot

- bêta : gratuite uniquement pour les commerces pilotes explicitement acceptés ;
- prix envisagé et codé : **9 €/mois** ;
- annuel envisagé et codé : **89 €/an** ;
- sans abonnement, le dernier lien configuré doit rester actif ;
- abonnement optionnel, jamais imposé, ajouté ou présélectionné ;
- Pilot+ à 19 €/mois : ancien concept, non commercialisable en l’état.

### Livraison

- France métropolitaine : **4,90 €** sous 59 € ;
- offerte à partir de **59 €** ;
- délai de travail affiché dans les CGV : 4 à 6 jours ouvrés après validation du BAT ;
- objectif atelier distinct : préparation standard sous 2 jours ouvrés.

### Inclus par défaut

- une proposition graphique à partir du logo ;
- un aller-retour de correction ;
- impression standard ;
- NFC et QR configurés ;
- contrôle qualité ;
- support de mise en route ;
- BAT avant fabrication définitive.

À chiffrer séparément : seconde direction, retouche de logo, urgence, multi-visuels, plusieurs langues, sur-mesure, expédition internationale.

### Règle de remise

Une remise doit acheter une contrepartie mesurable : volume, paiement anticipé, délai flexible, engagement annuel ou droit d’utiliser un cas client validé. Ne jamais accorder une remise simplement parce qu’elle est demandée.

---

## 6. Usages, cibles et proposition par segment

### Actions prises en charge

Avis Google, satisfaction, menu, réservation, commande, paiement, pourboire, fidélité, Instagram, TikTok, Facebook, LinkedIn, Wi-Fi, site, contact, WhatsApp, page multi-liens ou autre URL HTTPS.

### Segments présents dans le produit

- café et bar ;
- restaurant ;
- beauté et bien-être ;
- boutique et commerce ;
- hôtel et location ;
- artisan et terrain ;
- immobilier ;
- événement et équipe.

Les plaquettes commerciales ajoutent explicitement **réseaux et franchises**, soit neuf cibles de prospection.

### Priorisation

| Priorité | Segment | Problème dominant | Offre recommandée | Risque principal |
|---:|---|---|---|---|
| 1 | Beauté / coiffure | réservation récurrente et avis | Pack Salon 89 € | marché déjà équipé, exigence esthétique |
| 2 | Restaurant / café | menu, avis, pourboire, multi-zones | Comptoir ou Pack Restaurant | nettoyage, casse, sensibilité au prix |
| 3 | Hôtel / conciergerie | Wi-Fi, guide, services, satisfaction | offre multisite sur devis | cycle de vente et personnalisation |
| 4 | Artisans / immobilier / équipes mobiles | contact et crédibilité immédiate | Carte + Vitrine | forte concurrence de cartes digitales |
| 5 | Réseaux / franchises | standardisation et pilotage | volume + Pilot | SLA, support, référencement fournisseur |

### ICP de départ

Un bon compte pilote réunit :

- dirigeant ou décisionnaire présent ;
- flux régulier d’au moins 20 interactions clients par semaine ;
- action numérique claire à déclencher ;
- identité visuelle existante ;
- emplacement physique évident ;
- décision possible sous 14 jours ;
- accord pour un entretien de retour à J+7/J+30 ;
- idéalement accord photo et cas client, sans conditionner le service à un avis positif.

---

## 7. Marché et concurrence

### Lecture du marché

Le marché des plaques NFC simples est déjà banalisé, généralement autour de 25 à 40 €. Tapote ne peut pas défendre 49 € par la puce seule. La différence doit être visible dans la personnalisation, le BAT, l’encodage, le QR de secours, le contrôle, le support et la continuité Pilot.

### Modèle de taille de marché, à ne pas présenter comme une prévision

- 6,29 millions d’établissements actifs en France en 2023 ;
- 1,50 million dans commerce, transport, hébergement et restauration ;
- TAM matériel modélisé : environ 94,5 M€ ;
- SAM modélisé : environ 300 121 établissements et 23,4 M€ de matériel à 78 € de panier ;
- SOM central à 36 mois : 900 clients, 70,2 k€ de matériel par vague d’équipement et 24,3 k€ d’ARR si 25 % prennent Pilot ;
- ces calculs sont des hypothèses d’orientation, pas des revenus prévus.

### Indicateurs de demande numérique vérifiés

Le Baromètre France Num 2025, fondé sur 11 021 répondants, indique :

- 84 % utilisent au moins une solution de visibilité en ligne ;
- 66 % utilisent un compte sur les réseaux sociaux ;
- 65 % disposent d’un site internet ;
- 50 % utilisent une inscription gratuite à un annuaire ;
- 27 % disposent d’au moins une solution de vente en ligne ;
- parmi les entreprises ayant un site, 48 % citent l’acquisition de clients comme bénéfice, contre 57 % dans l’hébergement-restauration et 54 % dans le commerce.

Lecture Tapote : les commerces possèdent souvent déjà leurs destinations numériques. Tapote doit rendre ces actifs actionnables sur place, pas leur « apporter Internet ».

### Concurrents publics revérifiés le 20 juillet 2026

| Concurrent | Prix observé | Lecture |
|---|---:|---|
| Unisign | 24,90 € le chevalet | concurrence matérielle directe |
| NFC France | 29 € HT la plaque | B2B et volume |
| Skale Lab | 29,90 € TTC | ancre prix basse |
| Swiipx | 39,90 € annoncé | milieu de gamme et SEO |
| Plaqueo | prix non confirmé | modèle matériel + logiciel proche |

Les quatre prix affichés ont été revérifiés sur les pages des vendeurs le 20 juillet 2026. Plaqueo reste sans prix confirmé dans ce dossier. Toute comparaison destinée au public doit néanmoins être datée et contrôlée à nouveau.

### Concurrence indirecte

- QR gratuit ;
- impression maison et porte-affiche ;
- plaque ou tag générique Amazon ;
- carte de visite NFC ;
- logiciel de réputation par SMS/e-mail ;
- QR fourni par une plateforme de réservation ;
- lien Google Business Profile.

Le principal concurrent économique est : **« Je peux le faire moi-même pour moins de 10 €. »** Répondre par le temps gagné, la qualité, la fiabilité, la cohérence de marque et le service.

### SWOT synthétique

**Forces** : démonstration simple, faible coût matière, personnalisation visible, usages multiples, logiciel optionnel, marque distinctive.  
**Faiblesses** : faible barrière technologique, supports génériques, production personnalisée, valeur Pilot à prouver, peu de preuves clients.  
**Opportunités** : nouvelles entreprises, visibilité locale, réseaux, partenaires imprimeurs/agences, réimpressions et gabarits saisonniers.  
**Menaces** : guerre des prix, copies, politique Google, casse/rayures, panne du redirecteur, promesses excessives du secteur.

---

## 8. Stratégie commerciale

### Processus recommandé

1. **Cibler** un commerce compatible avec l’ICP.
2. **Qualifier** le lien prioritaire, le moment, le volume, l’emplacement, le décideur et le délai.
3. **Démontrer** avec un vrai objet sur le téléphone du prospect.
4. **Projeter** avec une maquette à sa marque.
5. **Proposer** une seule offre cohérente, sans noyer dans le catalogue.
6. **Conclure** avec prix total, BAT et prochaine date.
7. **Activer** : test au commerce et accompagnement J+7.
8. **Prouver** : mesure, photo et entretien J+30.
9. **Développer** : réachat, deuxième action, autre site ou Pilot.

### Questions de qualification

- Quel lien faut-il ouvrir en priorité ?
- À quel moment précis le client doit-il agir ?
- Combien de passages par jour et combien d’emplacements ?
- Qui décide, paie et valide le design ?
- Comment le résultat est-il mesuré aujourd’hui ?
- Un QR a-t-il déjà été testé ?
- Quelle fréquence de changement du lien ?
- Quelles contraintes de nettoyage, casse, vol ou fixation ?
- Un ou plusieurs établissements ?
- Quel délai est acceptable ?

### Démonstration 90 secondes

1. Montrer le vrai chevalet.
2. Demander : « Quel lien aimeriez-vous ouvrir à la fin d’une visite ? »
3. Faire tapoter le prospect.
4. Montrer sa personnalisation.
5. Proposer le produit exact et le délai.
6. Demander : « On part sur un comptoir ou le pack métier ? »

### E-mail de prospection de référence

**Objet : Une idée pour le comptoir de [Commerce]**

> Bonjour [Prénom],  
> J’ai préparé un exemple de support aux couleurs de [Commerce]. Le client pose son téléphone et arrive directement sur [avis/réservation/menu], sans application. Le support arrive configuré et prêt à poser.  
> Je passe dans [quartier] [jour]. Je peux vous montrer le geste en 3 minutes ?  
> Aymeric — Tapote

### Pipeline CRM minimal

`Cible → Contacté → Répondu → Démo → Proposition → Relance → Gagné/Perdu → Activation → Réachat`

Chaque opportunité doit contenir : segment, source, décideur, problème, offre, montant, probabilité, prochaine action, date, motif de perte, consentement/contact et potentiel multi-site.

### Objectifs des 30 premiers jours

| Indicateur | Cible de test |
|---|---:|
| Comptes qualifiés | 50 |
| Conversations avec décideur | 20 |
| Démonstrations | 10 |
| Pilotes payants | 5 |
| Activations sans incident | 5 |
| Cas clients publiables | 2 |
| Taux démo → vente | ≥ 30 % |
| Marge contributive | ≥ 55 % du CA HT/net |

Autre cadence proposée à tester : 30 commerces contactés, 10 démonstrations, 5 BAT et 2 ventes par semaine. Remplacer ces objectifs par les ratios réels après un échantillon suffisant.

### Partenaires

1. imprimeurs et enseignistes ;
2. graphistes et agences locales ;
3. installateurs de caisse et prestataires web ;
4. consultants restauration et réseaux ;
5. photographes de commerce ;
6. revendeurs après stabilisation.

Un partenariat commence par cinq ventes test et une convention simple : attribution, commission, paiement, durée, marque et responsabilité SAV. Commission d’apport envisagée : 10 à 15 %, à valider avec la marge réelle.

---

## 9. Marketing et acquisition

### Angle central

Ne pas vendre uniquement « plus d’avis ». Montrer le **moment physique**, le geste et la page ouverte. La technologie reste en arrière-plan.

### Piliers de contenu

1. produit réel : matière, impression, fabrication ;
2. geste : téléphone → NFC/QR → page ;
3. métier : salon, restaurant, hôtel, agence ;
4. preuve : installation, usage à J30, témoignage autorisé ;
5. conseil : placement, phrase, règles Google, QR de secours.

### Plan de lancement marketing

- page courte « Tapote pour salons et instituts » avec un CTA ;
- cinq installations pilotes réelles ;
- deux cas clients publiables minimum ;
- prospection locale et démonstration fondateur ;
- Instagram organique et coulisses produit ;
- partenaires/formateurs beauté ;
- pages verticales `/salon`, puis `/restaurant` et `/hotel` après preuve ;
- publicité payante seulement après mesure fiable et au moins cinq ventes organiques.

### Calendrier éditorial simple

- lundi : cas client ;
- mercredi : conseil opérationnel ;
- vendredi : coulisses de production ;
- mensuel : étude chiffrée ;
- trimestriel : guide métier.

### Mesure à installer

Outil recommandé : **Plausible**, sous réserve de validation RGPD et de configuration.

Événements :

- `view_product` ;
- `start_configurator` ;
- `add_to_cart` ;
- `begin_checkout` ;
- `purchase` ;
- `lead_submit` ;
- `pilot_demo`.

Conserver `utm_source`, `utm_medium` et `utm_campaign` dans les leads et commandes. Ne pas installer simultanément GA, Meta Pixel, Hotjar et Plausible au lancement.

### Preuve client

À J+7 et J+30, recueillir avec consentement : photo, emplacement, usage, nombre d’interactions, résultat métier attribuable avec prudence, verbatim exact, incidents, recommandation et autorisation de publication.

Ne jamais récompenser, filtrer ou solliciter sélectivement un avis Google. Aucune promesse de « cinq étoiles ».

---

## 10. Produit physique, impression et NFC

### Spécifications de départ

| Produit | Spécification | Test obligatoire |
|---|---|---|
| Comptoir A6 | chevalet PMMA transparent, insert 105 × 148 mm, NTAG213 caché | stabilité, rayures, coque, chute, transport |
| Plaque 12 × 12 | PMMA 3 mm, coins doux, adhésif 3M ou socle | collage 72 h, nettoyage, lecture murale |
| Mini | PMMA 80 × 80 mm sur socle | stabilité et lecture |
| Carte | PVC 0,76 mm, 85,6 × 54 mm, NTAG213 intégré | flexion, portefeuille, abrasion |
| Vitrine | vinyle 90 × 90 mm, posé à l’intérieur | verre, soleil, nettoyage, métal |
| A6 ×6 / Restaurant | supports numérotés ou liens distincts | cohérence série et contrôle unitaire |

### Puce recommandée

- A6/plaque/papier : NXP NTAG213, inlay rond 38 mm, antenne proche de 35 mm ;
- vitrine ou proximité métal : version anti-métal avec ferrite ;
- carte : NTAG213 intégré au PVC ;
- NTAG215/216 : plus de mémoire, pas nécessairement plus de portée ;
- NTAG 424 DNA : futur besoin anti-copie, pas pour le lancement.

### URL et architecture de redirection

NFC : `https://t.tapote.fr/a/XXXXXXXXXX?s=nfc`  
QR : `https://t.tapote.fr/a/XXXXXXXXXX?s=qr`

La puce et le QR ouvrent la même route stable. Pilot change la destination côté serveur sans réencoder l’objet. Le redirecteur ne doit pas stocker d’IP brute et une panne de statistique ne doit jamais bloquer la redirection.

### Montage A6

Ordre des couches : téléphone → plaque acrylique avant → feuille imprimée → sticker NFC au dos de la feuille → plaque arrière.

- puce derrière le pictogramme NFC, plane et éloignée du QR ;
- position indicative : 30 à 35 mm depuis la gauche et 112 à 120 mm depuis le haut ;
- éviter le métal ;
- QR visible et contrasté à droite ;
- plan B : puce sur la face intérieure avant, masquée par un vinyle opaque.

### Encodage

1. créer produit, série et URL dans Gestion ;
2. encoder en NDEF URI avec Chrome Android/Web NFC ou un outil fiable ;
3. relire avec un second téléphone ;
4. vérifier la redirection ;
5. monter le support ;
6. tester NFC et QR sur iPhone et Android ;
7. passer `À encoder → Encodée → Testée → Prête à affecter → Affectée` ;
8. ne verrouiller la puce qu’après validation complète.

Une puce passive ne s’écrit jamais à distance : seul le lien derrière l’URL courte se modifie à distance.

### Critères d’acceptation

- neuf lectures NFC sur dix en moins de deux secondes ;
- au moins trois iPhone et trois Android ;
- test avec coques, NFC désactivé, lumière faible/forte et connexion lente ;
- QR lisible à 30, 50 et 80 cm ;
- 100 % des unités testées avant expédition ;
- aucun métal perturbateur non compensé.

### Fichiers imprimeur

| Famille | Format fini | Fichier |
|---|---:|---|
| Chevalet | 105 × 148 mm | exact, sans fond perdu |
| Plaque | 120 × 120 mm | fichier 126 × 126 mm, fond perdu 3 mm |
| Vitrine | 90 × 90 mm | fichier 96 × 96 mm, fond perdu 3 mm |
| Carte | 85 × 54 mm, R3 | fichier 89 × 58 mm, fond perdu 2 mm |

Attention : les QR génériques des prototypes pointent vers `https://tapote.fr`. Une livraison client exige l’URL courte dédiée générée dans Gestion.

---

## 11. Supply chain, fabrication et qualité

### Nomenclature d’un Comptoir A6

- un chevalet plexiglas portrait A6 ;
- un insert imprimé ;
- un tag NTAG213 adhésif ;
- une solution antiglisse si le test la valide ;
- une carte mode d’emploi ;
- une protection anti-rayure ;
- un emballage d’expédition ;
- une étiquette commande/lot.

### Qualification fournisseur

Pour chaque composant, collecter : prix à 50/100/500/1 000, MOQ, délai, origine, incoterm, port, paiement, taux de défaut, tolérances, certificats, stabilité de référence, échantillon et procédure de réclamation.

Ne pas acheter 500 tags avant un comparatif de dix échantillons par fournisseur. Qualifier deux sources pour PMMA, NFC, impression et emballage avant passage à l’échelle.

Fournisseurs à tester issus du plan : Tag&Play, Shop NFC et RFID Nation pour les tags ; RETIF comme repère rapide pour le porte-affiche ; fabricants PMMA directs pour la série ; RAJA comme repère emballage. Aucun n’est considéré comme fournisseur contractuellement retenu sans devis et test.

### Stock

`Point de commande = stock de sécurité + consommation prévue pendant le délai fournisseur`

Ne jamais mélanger : théorique, commandé, reçu, quarantaine, réservé et disponible.

- tracer chaque lot NFC par fournisseur et date ;
- contrôle entrant : dix unités ou racine carrée du lot, au plus grand ;
- quarantaine si plus de 2 % d’échecs de lecture ;
- aucun changement matière sans revalider lecture, collage, impression et transport.

### Flux atelier

1. paiement confirmé ;
2. données client contrôlées ;
3. BAT généré ;
4. accord écrit ;
5. composants réservés ;
6. impression et contrôle ;
7. série et URL créées ;
8. encodage et lecture croisée ;
9. assemblage propre ;
10. contrôle final ;
11. photo de preuve ;
12. expédition et suivi.

### Contrôle qualité unitaire

- nom et logo exacts ;
- impression identique au BAT ;
- aucune coupe dangereuse, rayure, fissure ou instabilité ;
- NFC et QR ouvrent la même bonne destination ;
- produit associé au bon compte Pilot ;
- lot, opérateur et horodatage tracés ;
- emballage, quantité et adresse corrects ;
- photo finale archivée.

### Capacité et externalisation

- 1–10 colis/mois : manuel ;
- 10–100 : balance, imprimante thermique, boîtes standardisées ;
- 100–500 : intégration transporteur, picking par lot, scan ;
- 500+ : étudier un logisticien, en conservant l’encodage et le contrôle sous maîtrise tant que le défaut n’est pas stabilisé.

Sous-traiter d’abord l’impression, la découpe et la préparation colis. Garder au lancement : design système, vente, relation client, contrôle final et produit Pilot.

---

## 12. Logistique, livraison et SAV

### Emballage

**A6** : film/protection, pochette non abrasive, cale du pied, boîte environ 220 × 160 × 50 mm, test de chute six faces à 80 cm.  
**Carte** : étui rigide et enveloppe cartonnée suivie.  
**Plaque/Vitrine** : protection de face, deux cartons rigides, adhésif et gabarit séparés.  
**Packs** : numéros de série, intercalaires doux, liste de colisage et double cannelure si nécessaire.

### Expédition

1. peser le colis fini ;
2. choisir le tarif réel ;
3. scanner la série ;
4. photographier le contenu ;
5. fermer avec témoin d’intégrité ;
6. saisir un vrai suivi avant statut `Expédiée` ;
7. envoyer suivi et guide d’installation ;
8. classifier tout incident ;
9. prévoir remplacement et réaffectation du lien.

Transporteur de départ : à confirmer. Colissimo ou un agrégateur avec suivi est recommandé pour le pilote. L’API transporteur ne doit être connectée qu’après validation du flux manuel.

### Support

- accusé de réception immédiat ;
- réponse humaine sous un jour ouvré ;
- incident redirecteur en priorité absolue ;
- remplacement sous deux jours si défaut confirmé, sous réserve de capacité ;
- historique par commande.

Catégories d’incident : NFC, mauvaise destination, QR, casse/rayure, erreur d’impression, transport, accès Pilot, paiement/remboursement.

---

## 13. Parcours client et e-commerce

### Parcours actuel

`Boutique → configurateur → panier → coordonnées professionnelles → acceptation CGV/confidentialité → Stripe Checkout → webhook → commande → e-mail → brief/BAT → production → expédition → activation Pilot si éligible`

### Décisions produit

- boutique réservée aux professionnels ;
- commande invitée, sans compte Tapote obligatoire ;
- Stripe peut créer un Customer, mais ce n’est pas un compte Tapote ;
- compte Pilot créé uniquement si le service est activé ;
- aucun abonnement Pilot dans le checkout matériel ;
- prix recalculés côté serveur ;
- vente de production fermée par défaut tant que toutes les dépendances ne sont pas prêtes.

### Site public

Le site présente : hero Comptoir A6, démonstration, choix principaux, configurateur, preuves produit, toutes les offres, produits unitaires, fabrication/livraison, Pilot, devis, FAQ et contenus légaux.

Friction UX connue : page longue et catalogue encore dense. L’audit recommande de privilégier dans le parcours principal **Comptoir 49 €**, **Pack Salon 89 €** et **Pack Commerce 149 €**, les autres offres restant secondaires.

### API publique utile

- `GET /api/health` : vie du processus ;
- `GET /api/ready` : conditions commerciales de production ;
- `GET /a/:code` : redirecteur NFC/QR ;
- `POST /api/uploads/logo` : logo privé validé ;
- `POST /api/checkout` : création Checkout ;
- `GET /api/checkout/status` : confirmation ;
- `POST /api/lead` : devis/contact ;
- `POST /api/stripe/webhook` : événements Stripe signés.

---

## 14. Tapote Pilot

### Rôle

Espace client privé permettant :

- voir les produits et établissements ;
- changer une destination HTTPS sans réencoder ;
- activer ou suspendre un lien ;
- consulter les interactions sur 7/30/90 jours ;
- distinguer NFC et QR ;
- consulter l’historique ;
- exporter un CSV ;
- accéder au support.

### Authentification et données

- mot de passe ou lien magique ;
- aucune inscription publique souhaitée ;
- organisation séparée par client ;
- accès isolé par RLS ;
- navigateur limité à la lecture autorisée et aux colonnes `target_url`/`active` ;
- activation après commande par un flux serveur contrôlé.

### Statut

- application et données de démonstration opérationnelles ;
- bêta privée ;
- prix futur envisagé 9 €/mois ou 89 €/an ;
- onboarding réel, SMTP Auth, facturation récurrente, portail client et droits multi-rôles restent à valider ;
- aucune promesse de SaaS général avant test avec de vrais comptes.

### Critère de développement

Avant une fonction majeure : cinq clients doivent décrire le même problème et au moins deux accepter de payer ou renouveler pour sa résolution.

Ne pas prioriser : application native, IA générique, CRM complet, fidélité complète, réponse automatique aux avis ou segmentation avancée sans volume.

---

## 15. Tapote Gestion

### Rôle

Outil interne réservé aux collaborateurs autorisés. Navigation actuelle :

- vue d’ensemble ;
- commandes ;
- clients ;
- assemblage ;
- création et encodage ;
- supply et stocks ;
- expéditions ;
- site e-commerce ;
- réglages, recherche et activité.

### Statuts commande

`Payée → BAT à valider → Matériel réservé → Assemblage → Contrôle qualité → Prête à expédier → Expédiée`

`Annulée` est un état fermé.

### Statuts unité

`À encoder → Encodée → Testée → Prête à affecter → Affectée`

Une unité peut aussi être marquée `Remplacée`.

### Données métier

- clients et commandes ;
- catalogue et inventaire ;
- fournisseurs, achats et réceptions ;
- production et contrôles ;
- unités, puces, lots, séries et destinations ;
- expéditions et suivi ;
- activité et audit ;
- paramètres d’organisation ;
- liaison boutique → Gestion → Pilot.

### Sécurité et opérations

- rôles Gestion : `owner`, `admin`, `manager` ;
- les rôles Pilot `member`/`viewer` n’y accèdent pas ;
- rôles calculés depuis `organization_members`, jamais depuis des métadonnées modifiables ;
- RLS, transactions atomiques pour stock et transitions ;
- bucket privé pour BAT, PDF et étiquettes ;
- suivi réel obligatoire avant expédition ;
- aucune fausse donnée analytics ou transport.

À connecter : analytics, transporteur, pagination/agrégats à volume élevé, contrôle final atomique complet et politique de sauvegarde.

---

## 16. Architecture technique

### Stack

- Node.js 22.12 à 24, image runtime Node 24 Alpine ;
- React 19 et React DOM 19 ;
- Vite 8 ;
- Express 5 ;
- Supabase : PostgreSQL, Auth, Storage, Realtime et RLS ;
- Stripe Checkout et webhooks ;
- Resend pour les e-mails transactionnels ;
- Sentry préparé pour les erreurs ;
- Pino/Pino HTTP pour les logs ;
- Docker Compose ;
- reverse proxy Traefik sur le VPS partagé, avec configurations Caddy également disponibles ;
- GitHub Actions, Dependabot, Vitest, ESLint, Testing Library, axe-core et Supertest.

### Surfaces

| URL | Fonction | Protection |
|---|---|---|
| `tapote.fr` | boutique | publique |
| `tapote.fr/pilot` | espace client | Supabase Auth + RLS |
| `pilot.tapote.fr` | raccourci vers Pilot | redirection |
| `gestion.tapote.fr/gestion` | outil interne | Supabase Auth + RLS ; barrière réseau à clarifier |
| `t.tapote.fr/a/...` | redirection NFC/QR | publique, route limitée |
| `tapote.fr/api/stripe/webhook` | réception Stripe | signature obligatoire |

### Flux de données

```text
Boutique tapote.fr
      │
      ├── logo privé ───────────────► Supabase Storage
      │
      └── Stripe Checkout
              │ webhook signé
              ▼
       orders + order_items + outbox
              │ synchronisation idempotente
              ▼
       Tapote Gestion
       production / stock / contrôle / expédition
              │ activation contrôlée
              ▼
       organisation cliente Pilot
       établissements / produits / liens / interactions
              ▲
              │ NFC ou QR
       t.tapote.fr/a/<code>
```

Une commande web possède au maximum une commande Gestion et un dossier de provisionnement. Un pack est développé en unités physiques. Pilot ne voit jamais les stocks ou clients internes ; Gestion voit l’état d’activation sans pouvoir lire les données du tenant client.

### Modèle de données synthétique

**Boutique/paiement** : `orders`, `order_items`, `stripe_events`, `leads`, `uploads`, `outbox_jobs`.  
**SaaS** : `organizations`, `organization_members`, `locations`, `tapote_links`, `tapote_products`, `tap_events`, `audit_logs`, `subscriptions`.  
**Gestion** : profils, clients, inventaire, catalogue storefront, commandes, événements, fournisseurs, achats, lignes d’achat, production, expéditions, activité, audit, réglages et unités physiques.  
**Convergence** : paramètres plateforme et `order_provisioning`.

### Résilience et principes

- une seule base Supabase comme source de vérité ;
- idempotence Stripe et synchronisation ;
- outbox durable avec reprises ;
- URL courte stable par objet ;
- redirection prioritaire sur la collecte statistique ;
- application conteneurisée non-root ;
- secrets uniquement au runtime ou dans le coffre, jamais dans le navigateur ni Git.

---

## 17. Sécurité, disponibilité et exploitation

### Protections intégrées

- checkout live fermé si une dépendance manque ;
- prix côté serveur ;
- validation Zod ;
- webhook Stripe signé sur corps brut ;
- idempotence des tentatives et événements ;
- uploads limités à 2 Mo, PNG/JPEG/WebP, contenu binaire contrôlé ;
- stockage privé ;
- RLS multi-tenant ;
- Helmet/CSP, CORS allowlist, limites de corps et rate limiting ;
- erreurs génériques et identifiants de requête ;
- logs structurés avec secrets masqués ;
- conteneur sans root et `no-new-privileges` ;
- versions et lockfile ;
- audit npm et Dependabot ;
- Sentry configuré sans PII par défaut.

### Conditions de `/api/ready`

En production, la disponibilité commerciale exige simultanément : HTTPS, contenu légal prêt et versions alignées, clé Stripe live, webhook, PostgreSQL durable, Storage privé et e-mail de commande opérationnel.

Le 20 juillet, `/api/ready` est encore à 503. Le checkout live doit rester fermé.

### P0 sécurité/exploitation

- Bitwarden partagé avec comptes individuels ;
- MFA : GitHub, Supabase, Stripe, Resend, Sentry, OVH et Hostinger ;
- utilisateur VPS non-root, SSH par clé, root/mot de passe désactivés après test ;
- pare-feu Hostinger + UFW, uniquement SSH/HTTP/HTTPS ;
- Fail2ban ;
- mises à jour de sécurité automatiques ;
- Supabase Pro et staging séparé ;
- protection des mots de passe compromis ;
- SMTP Resend pour Supabase Auth ;
- révocation des sessions et nettoyage des données de démonstration après décision ;
- sauvegarde chiffrée hors site et test réel de restauration ;
- Sentry avec alerte 5xx ;
- Better Stack Uptime sur boutique, ready, Pilot, Gestion et domaine court ;
- procédure d’incident et retour arrière.

### Cloudflare

Recommandé plus tard comme DNS/proxy/WAF/Turnstile, sans transférer le registrar OVH. Il ne remplace pas le pare-feu VPS, le reverse proxy, les sauvegardes, Sentry ou la supervision. Migrer les enregistrements mail avec soin et tester Stripe, Auth, uploads et redirections après bascule.

### Réponse à incident

1. fermer le checkout ;
2. révoquer la clé concernée ;
3. analyser Stripe/Sentry/logs avec l’ID de requête ;
4. identifier les commandes ou personnes touchées ;
5. préserver les preuves et informer selon obligation ;
6. corriger et ajouter un test ;
7. redéployer, vérifier puis rouvrir.

---

## 18. Juridique, RGPD et conformité

### Modèle commercial actuel

La boutique est réservée aux clients professionnels. Le client confirme son statut professionnel et accepte CGV/confidentialité avant Stripe. Le paiement est exigible à la commande. Le BAT doit être validé avant production.

### À faire ou revalider avant vente réelle

- activité de vente de marchandises déclarée au Guichet unique ;
- identité, statut, SIREN/SIRET et régime TVA ;
- CGV B2B validées ;
- mentions légales et confidentialité ;
- règles de personnalisation, annulation et BAT ;
- garanties, réclamations, retours, casse et défaut NFC ;
- pénalités B2B et indemnité de 40 € ;
- responsabilité sur les liens externes ;
- assurance RC exploitation/produit, cyber et transport à étudier ;
- dépôt et antériorité de la marque ;
- obligations REP et identifiants uniques ;
- facturation électronique 2026–2027 avec outil compatible.

### Données traitées

- commande : identité, coordonnées, adresses et référence de paiement ;
- production : logo, URL, nom, BAT ;
- Pilot : organisation, objet, destination, horodatage et données techniques minimales ;
- prospection : source, base légale/consentement et opposition.

Stripe traite les données de carte ; Tapote ne doit pas les stocker.

### Conservation proposée, à valider

- prospects sans suite : trois ans après dernier contact ;
- commandes et factures : durée légale, généralement dix ans ;
- fichiers de production : contrat + trois ans ou accord pour réimpression ;
- événements bruts Pilot : 13 mois maximum au départ ;
- logs sécurité : jusqu’à 12 mois sauf incident ;
- statistiques agrégées : plus longtemps uniquement si réellement anonymisées.

### Avis Google

- demander un avis uniquement après une expérience réelle ;
- présenter la sollicitation sans filtrer satisfaits/mécontents ;
- aucun cadeau, remise, tirage au sort ou contrepartie ;
- ne pas demander « 5 étoiles » ;
- ne pas envoyer les satisfaits vers Google et les autres vers un formulaire privé ;
- ne pas publier automatiquement une réponse générée sans contrôle.

---

## 19. Finance et comptabilité de gestion

### Séparation obligatoire

- vente d’objets ;
- personnalisation/service distinct s’il est facturé ;
- abonnement Pilot ;
- matières et impressions ;
- sous-traitance ;
- emballage et transport ;
- frais de paiement ;
- acquisition ;
- logiciels/hébergement ;
- retours, remboursements, avoirs et SAV.

Ne jamais mélanger HT, TTC et net de TVA. Le régime en franchise de TVA doit être confirmé et suivi par type d’activité mixte.

### Formule de marge contributive

`CA HT ou revenu net de TVA – matières – impression – main-d’œuvre directe – emballage – transport – frais de paiement – SAV moyen – acquisition variable`

### Hypothèses unitaires à remplacer par le réel

**Comptoir A6** :

| Poste | Hypothèse |
|---|---:|
| Chevalet | 2,92 € |
| NTAG213 | 0,16 € |
| Impression | 0,60 € |
| Maquette amortie | 2,00 € |
| Encodage/contrôle/assemblage | 4,00 € |
| Emballage | 2,50 € |
| Transport moyen | 5,50 € |
| Paiement/incident | 2,00 € |
| **Total estimé** | **19,68 €** |

**Lot de six** : coût variable estimé **47,58 €**.

Ces coûts proviennent de repères retail et de temps modélisés, pas de devis ou chronométrages sécurisés.

### Seuils

- marge contributive cible : au moins 55 % ;
- CAC maximal de départ : 25 € sur unité, 50 € sur pack ;
- retour/SAV : moins de 4 % ;
- attachement Pilot : 20 à 30 % ;
- churn Pilot initial : moins de 6 % mensuel, puis moins de 3 % ;
- panier matériel cible : au moins 78 €.

### Trésorerie

Maintenir une prévision glissante sur 13 semaines : solde initial, Stripe, fournisseurs, transport, logiciels, fiscal/social, rémunération et solde final. Mise à jour chaque lundi.

Réserver séparément : obligations fiscales, coût des commandes, réserve SAV/risque et charges fixes. Le pourcentage de réserve initial de 10 % du revenu est une règle prudente à ajuster avec l’expert-comptable.

### Facturation et rapprochement

- numérotation chronologique continue ;
- lignes matériel/service/abonnement séparées ;
- statut TVA exact ;
- rapprochement commandes ↔ Stripe ↔ remboursements ↔ factures ↔ banque ;
- référence BAT, transport et séries dans le dossier commande ;
- logiciel comptable/facturation à choisir ; Stripe n’est pas toute la comptabilité.

### Objectifs à 12 mois, non acquis

- 500 commandes payées ;
- panier moyen matériel ≥ 78 € ;
- marge contributive ≥ 55 % ;
- 20 à 30 % de clients Pilot après lancement ;
- 50 preuves/témoignages autorisés ;
- production sous 2 jours ouvrés ;
- moins de 4 % de SAV/retours ;
- aucun avis incité ou filtré.

---

## 20. KPI et rituels de pilotage

### KPI

**Acquisition/commercial** : prospects, réponses, démos, conversion, CAC, délai, panier, taux pack, remise, canal, segment, motif de perte, réachat.  
**Production/supply** : stock, couverture, délai fournisseur, défauts, reprises, coût réel, minutes/unité, commandes en retard.  
**Client** : activation J+7, objet visible J+30, interactions, tickets, retours, recommandation.  
**Finance** : revenu net/HT/TTC, marge, encaissements, décaissements, runway, créances, dettes, budget/réel.  
**Pilot** : MRR, nouveau MRR, churn logo/revenu, revenu moyen, activité 30 jours, coût pour 1 000 taps.

### Seuils de validation marché

| Indicateur | Go | À revoir | Stop/pivot |
|---|---:|---:|---:|
| Démo → achat | ≥ 30 % | 15–29 % | < 15 % |
| Marge contributive | ≥ 55 % | 40–54 % | < 40 % |
| Attachement Pilot | ≥ 20 % | 10–19 % | < 10 % |
| Objet visible à J30 | ≥ 85 % | 65–84 % | < 65 % |
| Clients prêts à recommander | ≥ 60 % | 35–59 % | < 35 % |
| SAV/retours | < 4 % | 4–8 % | > 8 % |

### Rituels

**Chaque jour** : commandes, BAT, production, blocages, expéditions, incidents, encaissements/remboursements, stock critique, actions commerciales.  
**Lundi** : trésorerie 13 semaines, stock/achats, pipeline, trois risques.  
**Vendredi** : KPI, rapprochements, incidents, prévision et décisions.  
**Mensuel** : résultat de gestion, marge par SKU, budget/réel, ventes gagnées/perdues, fournisseurs, qualité, capacité et priorité du mois.

---

## 21. Feuille de route et critères de lancement

### P0 — avant le premier client payant automatisé

1. redéployer le code courant afin de remplacer le bundle public de préproduction, puis vérifier le checkout B2B et les trois pages juridiques ;
2. aligner activité déclarée, régime TVA, factures, CGV et mentions ;
3. décider et nettoyer/séparer production et staging Supabase ;
4. passer Supabase Pro, activer sécurité Auth et tester une restauration ;
5. valider Stripe Sandbox de bout en bout : paiement, webhook, commande, fichier, e-mails, facture et idempotence ;
6. configurer Stripe Live puis faire un petit paiement réel et remboursement ;
7. obtenir `/api/ready` à 200 ;
8. activer Sentry, Better Stack, sauvegardes, MFA, coffre et durcissement VPS ;
9. confirmer la protection effective de Gestion ;
10. tester les six prototypes : NFC, QR, rayure, stabilité, nettoyage, chute et transport ;
11. documenter coûts et temps réels ;
12. choisir deux fournisseurs pour les composants critiques ;
13. installer analytics/UTM conformes ;
14. rapprocher formellement le commit déployé du dépôt ;
15. créer la procédure SAV et incident.

### Jours 1 à 30

- cinq pilotes beauté payants ;
- cinq installations sans incident ;
- deux preuves publiables ;
- offre principale simplifiée ;
- pipeline chiffré ;
- fournisseurs A/B en test ;
- emballage et chute validés ;
- coût réel chronométré.

### Jours 31 à 60

- première série de 50 unités si les seuils sont atteints ;
- Pilot activé pour les pilotes ;
- suivi colis connecté si le flux manuel est stable ;
- programme partenaire local ;
- décision Carte/Vitrine sur tests.

### Jours 61 à 90

- flux reproductible de 25 à 50 commandes/mois ;
- deux sources qualifiées par composant critique ;
- encodage par lot si plus de 100 unités/mois ;
- premières pages sectorielles et études de cas ;
- décision sur assemblage/logistique externe.

### Feu vert vente large

- neuf lectures NFC sur dix, six modèles, moins de deux secondes ;
- 100 % des QR lisibles ;
- moins de 2 % de défauts ;
- emballage sans casse/rayure ;
- coût variable complet et marge cible documentés ;
- lien court journalisé et surveillé ;
- BAT, encodage, contrôle, colis et suivi tracés ;
- CGV, paiement, e-mails, facturation et SAV validés ;
- sauvegarde/restauration et supervision testées ;
- deux preuves clients publiables minimum.

---

## 22. Registre des risques

| Risque | Signal | Réponse | Prévention |
|---|---|---|---|
| Redirecteur en panne | 5xx, chute de taps | bascule/incident, informer | monitoring, backup, runbook |
| Mauvaise URL | plainte | corriger immédiatement | double contrôle série/commande |
| Lot NFC défectueux | échecs lecture | quarantaine | contrôle entrant + 100 % final |
| Rupture support | sous seuil | fournisseur B | double sourcing, point commande |
| Casse/rayure | SAV transport | remplacement/réclamation | emballage et test de chute |
| Politique Google | restriction d’avis | arrêter le message concerné | aucune incitation/filtrage |
| Pic de commandes | BAT en retard | annoncer délai réel | capacité, gabarits, sous-traitance |
| Marge en baisse | coût réel > cible | prix/SKU/canal | coût réel mensuel |
| Fuite de données | alerte accès | isoler/révoquer/notifier | MFA, RLS, moindre privilège |
| Panne Supabase/VPS | ready/health rouge | retour arrière | Pro, backups, supervision |
| Compte compromis | connexion anormale | révoquer sessions/clés | MFA, Bitwarden, comptes uniques |
| Copie/guerre prix | comparaison prix | preuve/service/Pilot | marque, cas clients, partenaires |
| Surcharge fondateur | vente/support en retard | couper faible valeur | SOP, blocs vente, externalisation |
| Dilution de l’offre | conversion faible | recentrer 3 offres | produit signature d’abord |

---

## 23. Informations manquantes à obtenir de l’associé

Lors du premier échange avec Claude, vérifier seulement ce qui n’est pas déjà fourni :

1. répartition exacte Aymeric/Jules et droits de décision ;
2. activité et statut administratif effectivement à jour ;
3. régime TVA confirmé et libellé prix à appliquer ;
4. soldes banque/Stripe, charges fixes, dettes et budget disponible ;
5. prospects, commandes, chiffre d’affaires et pipeline réels ;
6. inventaire physique compté ;
7. fournisseurs testés, devis, MOQ, délais et conditions ;
8. coûts réels d’impression, emballage, transport et paiement ;
9. temps réel de BAT, encodage, assemblage et SAV ;
10. statut Stripe Sandbox/Live et cause exacte de `/api/ready=false` ;
11. statut Supabase Pro, staging, SMTP, MFA et sauvegardes ;
12. outil de facturation/comptabilité retenu ;
13. transporteur retenu ;
14. statut marque, assurance, REP et documents juridiques ;
15. clients pilotes, autorisations photo et résultats réels ;
16. commit actuellement déployé ;
17. statut Sentry, Better Stack, Plausible, Cloudflare et Bitwarden.

Créer et maintenir quatre registres :

- **référentiel maître** : prix, coûts, fournisseurs, délais, règles et responsables ;
- **décisions** : date, auteur, raison, effet et révision ;
- **risques** : impact, probabilité, responsable, action et échéance ;
- **données manquantes** : propriétaire, date attendue et décision bloquée.

---

## 24. Cartographie des sources du dépôt

Ordre de priorité conseillé :

1. `shared/catalog.js` — catalogue et prix codés ;
2. données réelles datées : Stripe, banque, CRM, stock, factures, devis, contrats ;
3. `docs/16-CHECKLIST-OUTILS-TAPOTE-2026-07-20.md` — état outils/déploiement le plus récent ;
4. `docs/15-AUDIT-PREDEPLOIEMENT-2026-07-18.md` — audit sécurité et Supabase ;
5. `docs/14-AUDIT-360-TAPOTE-2026-07-17.md` — diagnostic global ;
6. `docs/13-PLAN-MAITRE-LANCEMENT-TAPOTE.md` — produit, opérations, commercial et 90 jours ;
7. `docs/03-GUIDE-AYMERIC-A-Z.md` — manuel opérationnel ;
8. `docs/02-ETUDE-DE-MARCHE.md` — marché, concurrence et modèles ;
9. `docs/01-CHARTE-DE-MARQUE.md` — identité et ton ;
10. `README.md`, `docs/05` à `12` et `docs/CHECKLIST_MISE_EN_PRODUCTION.md` — technique et procédures spécialisées ;
11. `designs/print-ready/` — fabrication ;
12. `designs/commercial/` — supports de prospection.

### Références externes vérifiées

- [API Recherche d’entreprises de l’État — Tapote / SIREN 105019103](https://recherche-entreprises.api.gouv.fr/search?q=105019103) ;
- [Insee — nombre d’établissements économiquement actifs en 2023](https://www.insee.fr/fr/statistiques/8654305?geo=FRANCE-1) ;
- [France Num — Baromètre 2025](https://www.francenum.gouv.fr/files/2025-09/Barom%C3%A8tre%20France%20Num%202025%20-%20Rapport.pdf) ;
- [Google Maps — contenus interdits et manipulation des notes](https://support.google.com/contributionpolicy/answer/7400114?hl=fr) ;
- [CNIL — cookies et mesure d’audience](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience) ;
- [ADEME — identifiant unique des filières REP](https://filieres-rep.ademe.fr/identifiant-unique) ;
- [Supabase — mise en production](https://supabase.com/docs/guides/deployment/going-into-prod), [sauvegardes](https://supabase.com/docs/guides/platform/backups) et [sécurité des mots de passe](https://supabase.com/docs/guides/auth/password-security) ;
- [NXP — NTAG213/215/216](https://www.nxp.com/products/NTAG213_215_216) ;
- prix concurrents : [Unisign](https://unisign.fr/products/chevalet-nfc-qr-code-personnalise-avis-google-professionnels), [NFC France](https://nfcfrance.com/produit/plaque-nfc-avis-google/), [Skale Lab](https://skale-lab.fr/product/plaque-nfc-avis-google/) et [Swiipx](https://swiipx.fr/blog/plaque-avis-google-sans-abonnement).

### Fichiers techniques structurants

- `src/App.jsx` : boutique, panier, checkout, FAQ et juridique ;
- `src/pilot/PilotApp.jsx` : Pilot ;
- `src/ManagementApp.jsx` : Gestion et Web NFC ;
- `server/app.js` : API, Stripe et redirecteur ;
- `server/repository.js` : persistance ;
- `server/storage.js` : logos privés ;
- `server/notifications.js` : e-mails et reprises ;
- `supabase/migrations/` : schéma, RLS et transactions ;
- `deploy/` : Docker, Caddy et Traefik ;
- `.env.production.example` : liste de configuration publique/privée, jamais les vraies valeurs secrètes.

---

## 25. Première demande à faire à Claude

Après import de ce fichier dans un Projet Claude, commencer par :

> Fais l’onboarding Tapote à partir du dossier maître. Résume en dix lignes ce qui est réellement vérifié, sépare faits, décisions, hypothèses et inconnues, puis construis la liste minimale des informations manquantes pour piloter le commercial, la supply chain, la production et la comptabilité de gestion. Ne modifie aucun prix et ne considère aucune action externe comme exécutée sans preuve.

### Mission finale

Aider l’associé à :

> **vendre avec honnêteté, acheter avec méthode, produire sans erreur, protéger l’infrastructure et piloter la marge et la trésorerie à partir de faits réels.**
