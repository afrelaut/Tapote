# Tapote — Étude de marché France

Version 1.1 — 17 juillet 2026

Périmètre : supports physiques NFC + QR personnalisés et logiciel de pilotage pour commerces, établissements de services et réseaux.

> Cette étude distingue les données publiées, les observations concurrentielles et les hypothèses de travail. Les calculs TAM/SAM/SOM sont un modèle de décision, pas une prévision comptable garantie.

## 1. Synthèse exécutive

Tapote entre sur un marché **réel mais déjà banalisé**. Les plaques NFC “avis Google” seules sont devenues une commodité vendue autour de 25 à 60 €. La place à prendre n’est donc pas “la puce NFC”, mais une offre plus complète : **un chevalet A6 vraiment personnalisé à la marque du commerce, plusieurs actions possibles, une préparation sans friction et un lien pilotable dans le temps**.

Le terrain est favorable : la France comptait 6,29 millions d’établissements économiquement actifs en 2023, dont 1,50 million dans le commerce, les transports, l’hébergement et la restauration. En 2025, 84 % des TPE-PME interrogées utilisaient au moins une solution de visibilité en ligne, mais seulement 27 % une solution de vente en ligne. Le besoin n’est donc pas d’expliquer “Internet” aux commerçants ; il est de convertir une présence numérique existante en actions sur place. [Insee](https://www.insee.fr/fr/statistiques/2011101?geo=FRANCE-1), [Baromètre France Num 2025](https://www.francenum.gouv.fr/files/2025-09/Barom%C3%A8tre%20France%20Num%202025%20-%20Rapport.pdf)

### Verdict

- **Opportunité** : bonne pour une petite marque rentable, avec potentiel SaaS ; insuffisante pour une croissance forte si Tapote reste une simple plaque d’avis.
- **Produit d’appel** : Le Comptoir A6 personnalisé à 49 €.
- **Segment de départ recommandé** : salons de coiffure/beauté et restauration indépendante en Île-de-France, puis hôtellerie et réseaux.
- **Différenciation à défendre** : “la marque du client devant, Tapote derrière”, gabarits métier, livraison prête à poser, redirecteur Pilot, SAV humain.
- **Modèle** : marge sur objet + abonnement optionnel + packs multi-sites ; éviter l’abonnement obligatoire.
- **Risque principal** : comparaison directe avec des produits à 25–40 €. La réponse doit être visible dans le produit, le service et la preuve, pas seulement dans le discours.
- **Go/no-go** : lancer un pilote de 100 unités et viser 30 clients payants, 20 retours d’usage documentés et au moins 20 % d’attachement Pilot avant d’investir dans du stock ou du développement lourd.

## 2. Problème client

Les commerces ont déjà des destinations numériques : fiche Google, menu, Planity, Instagram, formulaire de réservation, Wi-Fi ou page de fidélité. Le problème se situe entre le moment physique et ce lien :

1. le client est satisfait mais ne pense pas à agir ;
2. l’employé doit expliquer, épeler ou montrer un QR ;
3. le lien envoyé plus tard perd le contexte et l’intention ;
4. les supports imprimés deviennent obsolètes ;
5. les petites équipes ne mesurent pas l’usage de leurs supports.

Tapote réduit cette friction par un objet visible, une phrase simple et une URL courte modifiable. La valeur perçue est maximale lorsque l’action se produit à un **moment naturel** : paiement, attente, table, sortie, remise des clés, fin d’un rendez-vous.

## 3. Produit et proposition de valeur

### Produit physique réel

- Chevalet portrait en plexiglas transparent.
- Insert papier A6, 105 × 148 mm, aux couleurs et au logo du client.
- Pastille NTAG213 dissimulée derrière la zone d’action.
- QR de secours imprimé vers la même URL courte.
- Configuration, encodage et contrôle qualité inclus.

### Couche logicielle Pilot

- URL de redirection stable par objet.
- Changement de destination sans réimpression.
- Comptage des interactions par objet et établissement.
- Gestion multi-sites et historique des changements.
- À terme : rôles équipe, exports et aide aux réponses aux avis, sous réserve des API et règles des plateformes.

### Bénéfice par segment

| Segment | Moment | Action dominante | Bénéfice acheté |
|---|---|---|---|
| Restaurant/café | table ou paiement | menu, avis, pourboire | rapidité et visibilité locale |
| Coiffure/beauté | fin du rendez-vous | réservation, avis, fidélité | récurrence client |
| Hôtel/conciergerie | réception/chambre | Wi-Fi, guide, avis | baisse des questions répétitives |
| Retail | caisse/vitrine | avis, Instagram, fidélité | prolonger la visite |
| Immobilier | visite/agence | fiche bien, contact | capter l’intention immédiatement |
| Artisans/pros mobiles | fin de prestation | avis, contact | crédibilité locale |
| Réseaux/franchises | multi-sites | plusieurs actions | standardisation et pilotage |

## 4. Taille de marché

### Données de base

L’Insee recense pour 2023 :

- **6 292 961 établissements** économiquement actifs en France ;
- **1 500 604 établissements** dans l’ensemble commerce de gros/détail, transports, hébergement et restauration ;
- **604 009 établissements** dans les autres activités de services ;
- **329 547 établissements** d’activités immobilières.

Le regroupement Insee est plus large que la cible Tapote : il inclut notamment des structures sans accueil du public. Il sert donc de plafond, pas de fichier de prospection. [Insee, tableau DEN T4](https://www.insee.fr/fr/statistiques/2011101?geo=FRANCE-1)

### Modèle TAM/SAM/SOM

#### TAM — plafond national

Hypothèse : 1,50 million d’établissements du bloc commerce/transport/hébergement/restauration, avec 1,4 support en moyenne et 45 € de revenu matériel moyen.

`1 500 604 × 1,4 × 45 € = 94,5 M€` de marché matériel théorique.

Si 10 % de ces établissements prenaient Pilot à 9 €/mois, plafond logiciel :

`1 500 604 × 10 % × 108 € = 16,2 M€ d’ARR`.

Ce TAM ne doit pas être présenté comme “le marché actuel des plaques NFC” : c’est le potentiel maximal des établissements physiques du regroupement, sous hypothèses Tapote.

#### SAM — marché accessible aux segments de lancement

Hypothèse prudente : 20 % du bloc principal possède un accueil client fréquent, une destination numérique utile et une capacité d’achat immédiate.

`1 500 604 × 20 % = 300 121 établissements`.

À 78 € de panier matériel moyen, le SAM matériel modélisé est de **23,4 M€**. Cette hypothèse devra être remplacée par un comptage SIRENE par codes NAF et zones géographiques avant un dossier investisseur.

#### SOM — objectif atteignable à 36 mois

Scénario central : 0,30 % du SAM, soit **900 clients actifs**.

- Matériel : `900 × 78 € = 70 200 €` de chiffre d’affaires cumulé par vague d’équipement.
- Pilot : 25 % d’attachement, soit 225 abonnés à 9 €/mois = **24 300 € d’ARR**.
- Réachat/multi-supports non inclus.

Scénario haut : 1 % du SAM, soit environ 3 000 clients : **234 k€** de matériel par vague et **81 k€ d’ARR** à 25 % d’attachement. L’enjeu devient alors la distribution, pas la technologie.

### Dynamique de création

En 2025, la France a enregistré 1 165 795 créations d’entreprises, dont 332 759 dans commerce, transports, hébergement et restauration. L’hébergement-restauration représentait 47 300 créations. Le flux de nouveaux établissements fournit un segment “nouvelle ouverture” particulièrement réceptif à un pack prêt à poser. [Insee — créations 2025](https://www.insee.fr/fr/statistiques/2134432), [Insee Première 2092](https://www.insee.fr/fr/statistiques/fichier/8721354/IP2092.pdf)

## 5. Demande et comportements numériques

Le Baromètre France Num 2025, fondé sur 11 021 répondants, indique :

- 84 % utilisent au moins une solution de visibilité en ligne ;
- 66 % sont présents sur les réseaux sociaux ;
- 65 % ont un site internet ;
- 50 % sont inscrits sur un annuaire gratuit ;
- 27 % disposent d’au moins une solution de vente en ligne ;
- 48 % des entreprises avec un site citent l’acquisition de clients comme bénéfice, proportion qui atteint 57 % dans l’hébergement-restauration et 54 % dans le commerce.

Tapote se branche donc sur des actifs existants. L’argument commercial ne doit pas être “créez votre présence en ligne”, mais “rendez enfin cette présence actionnable au moment où le client est devant vous”. [France Num 2025](https://www.francenum.gouv.fr/files/2025-09/Barom%C3%A8tre%20France%20Num%202025%20-%20Rapport.pdf)

Dans l’hébergement-restauration, France Num rapporte 70 % de sites web, 82 % de présence sociale, 61 % d’inscription sur au moins un annuaire gratuit et 38 % d’équipement en paiement en ligne. Le secteur est numérisé mais fragmenté : un support qui rassemble le bon lien au bon moment répond mieux qu’un nouvel outil isolé. [Infographie hébergement-restauration](https://www.francenum.gouv.fr/files/2026-04/Infographie_Barometre_FNum_HR_2025_WEB_VF_Access.pdf)

## 6. Paysage concurrentiel

### Observation des offres publiques au 15 juillet 2026

| Concurrent/offre | Prix public observé | Promesse dominante | Lecture pour Tapote |
|---|---:|---|---|
| Skale Lab | 29,90 € TTC | plaque NFC préprogrammée, sans abonnement | ancre prix basse et discours très direct |
| NFC France | 29 € HT | plaque d’avis, prix dégressifs | concurrence B2B et volume |
| Unisign | 24,90 € par chevalet 1–9 | chevalet NFC + QR, personnalisation | concurrence matérielle directe |
| Swiipx | 39,90 € annoncé pour 1 plaque | plaque pro sans abonnement | milieu de gamme et contenu SEO offensif |
| Plaqueo | prix non visible dans l’extrait public | plaque personnalisée + option Plaqueo+ | modèle le plus proche matériel + logiciel |

Sources : [Skale Lab](https://skale-lab.fr/product/plaque-nfc-avis-google/), [NFC France](https://nfcfrance.com/produit/plaque-nfc-avis-google/), [Unisign](https://unisign.fr/products/chevalet-nfc-qr-code-personnalise-avis-google-professionnels), [Swiipx](https://swiipx.fr/blog/plaque-avis-google-sans-abonnement), [Plaqueo](https://plaqueo.com/). Les prix et conditions peuvent changer.

### Concurrence indirecte

- QR code gratuit généré par le commerçant.
- Impression maison dans un porte-affiche.
- Cartes de visite NFC génériques.
- Logiciels de réputation et SMS/e-mail post-visite.
- Plateformes de réservation et fidélité qui fournissent leur propre QR.
- Google Business Profile lui-même, qui permet de partager un lien d’avis.

Le principal concurrent économique n’est pas une autre marque : c’est le “je peux le faire moi-même pour moins de 10 €”. Tapote doit donc vendre **le temps gagné, la qualité du design, la fiabilité, la cohérence de marque et le pilotage**, pas le coût de la puce.

### Carte de positionnement

| | Faible service | Fort service |
|---|---|---|
| Sans logiciel | Amazon/DIY, plaques génériques | Tapote Basic, chevalets personnalisés |
| Avec logiciel | liens/QR SaaS abstraits | Tapote Pilot, Plaqueo+, solutions réputation |

Position recommandé : **design et service élevés, abonnement optionnel**.

## 7. Politique de plateforme et conformité des avis

Google exige que les avis reflètent une expérience réelle et soient authentiques. Sont notamment interdits les avis payés ou obtenus contre remise/cadeau, ainsi que les sollicitations qui ne correspondent pas à une expérience réelle. Les profils qui violent la politique peuvent être restreints, avec suspension temporaire de nouveaux avis, dépublication ou avertissement. [Politique Google Maps](https://support.google.com/contributionpolicy/answer/7400114?hl=fr), [Restrictions Business Profile](https://support.google.com/business/answer/14114287?hl=fr)

Conséquences produit :

- Tapote doit être présenté à tous les clients concernés, pas uniquement aux satisfaits.
- Aucun avantage, tirage au sort, cadeau ou réduction en échange d’un avis.
- Aucun écran intermédiaire qui redirige les satisfaits vers Google et les mécontents vers un formulaire privé.
- Éviter “Donnez-nous 5 étoiles” et les statistiques non démontrées.
- L’aide à la réponse aux avis ne doit pas publier automatiquement sans contrôle tant que l’intégration, les droits et la qualité ne sont pas maîtrisés.

## 8. Analyse des segments

### 1 — Beauté/coiffure : segment de départ recommandé

**Pourquoi** : rendez-vous récurrents, paiement en face-à-face, forte dépendance à la réservation et aux avis, décisionnaire souvent présent sur place, esthétique du support importante.

**Offre** : Pack Salon à 89 €, un chevalet réservation et un chevalet avis ; mois Pilot offert.

**Canaux** : prospection locale, Instagram, partenariats formateurs/écoles, distributeurs de produits professionnels, communautés Planity.

**Risque** : univers déjà saturé d’outils et de QR. La qualité visuelle doit être immédiatement supérieure.

### 2 — Restaurants/cafés : volume d’interactions

**Pourquoi** : nombre élevé de passages, menu numérique, avis et pourboire ; plusieurs emplacements par établissement.

**Offre** : un Comptoir + six chevalets A6. Upsell saisonnier : changement de carte, terrasse, événement.

**Risque** : forte sensibilité au prix et produits salissants/cassants ; nécessité de tester nettoyage, stabilité et encombrement.

### 3 — Hôtels/conciergeries : panier élevé

**Pourquoi** : plusieurs chambres et besoins d’information récurrents ; valeur du multi-lien et du multi-site.

**Offre** : support réception + inserts chambres, Pilot inclus dans le devis.

**Risque** : cycle de vente plus long, exigences d’intégration et de personnalisation.

### 4 — Immobilier et équipes mobiles

**Pourquoi** : les cartes NFC suivent l’agent ; le sticker vitrine prolonge l’agence après fermeture.

**Risque** : besoins plus proches d’une carte de visite numérique ; concurrence de nombreux acteurs.

### 5 — Réseaux/franchises : levier de croissance

**Pourquoi** : volume, standardisation, tableau de bord central, renouvellement de campagne.

**Risque** : référencement fournisseur, délais, validation juridique, SLA et support multi-sites.

## 9. Prix et économie unitaire

### Ancrage marché

La fourchette publique observée de produits simples se situe principalement entre 25 et 40 €. Le prix Tapote de 49 € reste premium et doit donc montrer : chevalet A6, maquette client, impression, NFC, QR, encodage, contrôle, emballage et support.

### Estimation de coût — unité A6

Les captures fournisseur transmises indiquent à titre de repère un lot de 6 chevalets à 17,49 € et 50 pastilles NTAG213 à 7,99 €. Ces prix retail ne sont pas des devis sécurisés.

| Poste | Hypothèse par unité |
|---|---:|
| Chevalet A6 | 2,92 € |
| NTAG213 | 0,16 € |
| Impression A6 | 0,60 € |
| Maquette amortie | 2,00 € |
| Encodage + contrôle + assemblage | 4,00 € |
| Emballage | 2,50 € |
| Transport moyen | 5,50 € |
| Paiement/incident | 2,00 € |
| **Coût variable estimé** | **19,68 €** |

Au tarif actuel de 49 € TTC, la commande unitaire supporte 4,90 € de livraison, soit 53,90 € TTC facturés. Avec une hypothèse de TVA à 20 %, le revenu facturé est de 44,92 € HT. La marge contributive indicative avant acquisition et frais fixes est alors de 25,24 €, soit environ **56 % du HT**. Si la livraison était offerte sans réduction de coût, le produit seul dégagerait 21,15 €, soit environ **52 % du HT**, sous la cible de 55 %. Si Tapote relève temporairement de la franchise en base, le calcul change ; ne pas piloter la marge en TTC.

### Pack de 6

Coût estimé : 6 chevalets 17,52 €, 6 tags 0,96 €, impressions 3,60 €, conception/production 10 €, emballage 4 €, transport 7 €, paiement/incident 4,50 € = **47,58 €**. À 139 € TTC, revenu HT 115,83 €, marge contributive indicative 68,25 €, soit **59 % du HT**.

### Seuils de décision

- Marge contributive cible matériel : ≥ 55 % du CA HT.
- Coût d’acquisition maximal phase 1 : 25 € sur commande unitaire, 50 € sur pack.
- Taux d’attachement Pilot cible : 20 à 30 %.
- Churn Pilot cible à 3 mois : < 6 % mensuel au lancement, puis < 3 %.
- Retour/SAV : < 4 % des commandes.

### Tests de prix

Tester sur trafic comparable :

- 49 € + 4,90 € de livraison : scénario de référence actuel.
- 54,90 € + 4,90 € de livraison : test de valeur perçue et de marge.
- 59 € avec livraison offerte : test d’un prix tout compris plus simple à communiquer.

Ne pas faire de fausse promotion permanente. Tester plutôt “livraison incluse”, “maquette offerte” ou packs.

## 10. SWOT

### Forces

- Produit simple à comprendre et à démontrer.
- Faible coût matière, forte valeur de personnalisation.
- Plusieurs cas d’usage sur une plateforme commune.
- Logiciel récurrent possible sans rendre le matériel inutilisable.
- DA différenciante centrée sur la marque du client.

### Faiblesses

- Barrière technologique très faible.
- Dépendance à des supports et tags génériques.
- Valeur de Pilot à prouver ; le simple changement de lien peut sembler insuffisant.
- Production personnalisée difficile à automatiser au début.
- Peu de preuves clients au lancement.

### Opportunités

- Flux continu de nouvelles entreprises.
- Besoin de visibilité locale et de réservation.
- Réseaux multi-sites et franchises.
- Distribution via imprimeurs, agences web, consultants Google Business et installateurs de caisse.
- Gabarits saisonniers et réimpressions comme revenus complémentaires.

### Menaces

- Guerre des prix et copies.
- Modifications des politiques Google ou des OS mobiles.
- Commerçants déçus par des promesses exagérées du secteur.
- Casse, rayure, nettoyage ou déplacement du chevalet.
- Dépendance au domaine de redirection Tapote : une panne rend tous les objets inopérants.

## 11. PESTEL synthétique

- **Politique/réglementaire** : RGPD, e-commerce, REP, facturation électronique, règles des plateformes.
- **Économique** : TPE sensibles au prix ; argument ROI nécessaire mais à démontrer par des cas réels.
- **Socioculturel** : gestes sans contact désormais connus ; fatigue des QR et demandes d’avis trop insistantes.
- **Technologique** : compatibilité NFC large mais non universelle ; QR indispensable en secours ; redirecteur critique.
- **Environnemental** : objet plastique + emballage ; privilégier longévité, réemploi du chevalet et remplacement du seul insert.
- **Légal** : marque, droit de la consommation, conformité des avis, données de clic, obligations contractuelles.

## 12. Stratégie go-to-market

### Phase 1 — preuve locale, 0 à 90 jours

- Produire 30 prototypes de qualité constante.
- Équiper 10 salons et 10 restaurants avec un protocole identique.
- Facturer au moins 70 % des pilotes ; les gratuits déforment la demande.
- Mesurer : taps, emplacement, phrase utilisée, avis/réservations attribuables, satisfaction du commerçant.
- Photographier les vrais points de vente avec autorisation.
- Obtenir 10 verbatims nominatifs validés et 5 études de cas chiffrées.

### Phase 2 — acquisition répétable, 3 à 9 mois

- Landing pages verticales : `/salon`, `/restaurant`, `/hotel`.
- Prospection par quartier : visite courte + démo en main + QR vers paiement.
- Offre parrainage : crédit d’impression, pas récompense contre avis.
- Contenu SEO : gabarits, conformité Google, placement optimal, mode d’emploi.
- Partenaires : imprimeurs, agences locales, freelances Google Business, consultants réseaux sociaux.

### Phase 3 — réseaux, 9 à 24 mois

- Catalogue de gabarits verrouillés par marque.
- Import CSV des établissements et liens.
- SLA du redirecteur et statut public.
- Tarifs volume, échantillon validé avant production.
- Tableau de bord multi-sites, rôles et exports.

### Entonnoir cible phase 1

Pour 100 prospects locaux contactés :

- 40 conversations ;
- 20 démonstrations ;
- 8 commandes ;
- 2 abonnements Pilot.

Ces ratios sont des objectifs de test. Après 200 prospects, remplacer le modèle par les taux réels par segment.

## 13. Recherche client à mener

### 20 questions essentielles

1. À quel moment demandes-tu aujourd’hui un avis ou une réservation ?
2. Qui le demande dans l’équipe ?
3. Qu’est-ce qui empêche de le faire à chaque fois ?
4. Quel lien veux-tu ouvrir en priorité ?
5. Combien de clients passent par jour ?
6. Quel emplacement est visible sans gêner ?
7. Un QR seul a-t-il déjà été testé ?
8. Comment mesures-tu les résultats ?
9. À quelle fréquence changes-tu de menu/lien/campagne ?
10. Le support doit-il être nettoyé chaque jour ?
11. Le risque de casse ou de vol est-il important ?
12. Le logo client doit-il être validé par un siège ?
13. Qui paie et qui décide ?
14. 49, 59 ou 69 € : à quel niveau faut-il réfléchir ?
15. Un abonnement à 9 € est-il compréhensible ?
16. Quelle donnée Pilot serait réellement consultée ?
17. Quel délai de livraison est acceptable ?
18. Qu’est-ce qui déclencherait un retour ?
19. Qu’est-ce qui rendrait la recommandation à un confrère naturelle ?
20. Accepterais-tu une étude de cas publique ?

Ne pas demander “est-ce que tu achèterais ?”. Présenter une offre réelle et demander le paiement ou un acompte.

## 14. Indicateurs de validation

| Indicateur | Go | À revoir | Stop/pivot |
|---|---:|---:|---:|
| Conversion démo → achat | ≥ 30 % | 15–29 % | < 15 % |
| Marge contributive HT | ≥ 55 % | 40–54 % | < 40 % |
| Attachement Pilot | ≥ 20 % | 10–19 % | < 10 % |
| Produit encore visible à J30 | ≥ 85 % | 65–84 % | < 65 % |
| Clients prêts à recommander | ≥ 60 % | 35–59 % | < 35 % |
| SAV/retours | < 4 % | 4–8 % | > 8 % |

## 15. Recommandation finale

Tapote doit lancer **un produit signature avant un catalogue** : le chevalet A6 personnalisé. La Carte et la Vitrine restent des extensions, mais ne doivent pas diluer le message. La preuve de marché repose sur trois choses : qualité du produit réel, usage régulier à J30 et attachement à Pilot.

Le meilleur angle n’est pas “obtenir plus d’avis Google”. Il est trop encombré, trop facile à copier et exposé aux abus. L’angle durable est :

> **Tapote crée le point de passage entre un lieu et toutes ses actions numériques.**

Les avis deviennent un cas d’usage, pas la dépendance entière du business.

## Sources principales

- [Insee — Dossier complet France, établissements et créations](https://www.insee.fr/fr/statistiques/2011101?geo=FRANCE-1)
- [Insee — Créations d’entreprises par secteur en 2025](https://www.insee.fr/fr/statistiques/2134432)
- [France Num — Baromètre 2025](https://www.francenum.gouv.fr/files/2025-09/Barom%C3%A8tre%20France%20Num%202025%20-%20Rapport.pdf)
- [France Num — Hébergement-restauration 2025](https://www.francenum.gouv.fr/files/2026-04/Infographie_Barometre_FNum_HR_2025_WEB_VF_Access.pdf)
- [Insee — Économie numérique, édition 2025](https://www.insee.fr/fr/statistiques/fichier/8616835/NUM25-F18.pdf)
- [Google Maps — Contenus interdits et restreints](https://support.google.com/contributionpolicy/answer/7400114?hl=fr)
- [Google Business Profile — Restrictions pour violation](https://support.google.com/business/answer/14114287?hl=fr)
