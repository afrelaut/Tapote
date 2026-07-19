# Tapote — Étude de marché France

Version 2.0 — 19 juillet 2026

Périmètre : supports physiques NFC + QR personnalisés et logiciel de pilotage pour commerces, établissements de services et réseaux.

> Cette étude distingue les données publiées, les observations concurrentielles et les hypothèses de travail. Les calculs TAM/SAM/SOM sont un modèle de décision, pas une prévision comptable garantie.

**Mises à jour de la version 2.0 :**

- prix concurrents revérifiés en ligne le 19 juillet 2026, dont Amazon (plaques génériques 12 × 12 observées entre 21,99 et 26,99 € TTC) ;
- bascule de la chaîne NFC : abandon des pastilles autocollantes NTAG213 au profit de **cartes NFC à 19 € les 50** (0,38 € l’unité) ;
- coûts unitaires et marges recalculés produit par produit ;
- imprimeur local pressenti : **ADH&Sign à Colombes** (rendez-vous à venir), en remplacement de la piste Avenir Numérique du brief du 16 juillet ;
- décision de prix formalisée face à l’ancre Amazon ~22–29 € : maintien du Comptoir à 49 €, Pilot offert quelques mois plutôt qu’inclus à vie ;
- point bloquant identifié sur La Vitrine (sticker) : sans pastille plate, l’intégration NFC est à trancher au rendez-vous imprimeur.

## 1. Synthèse exécutive

Tapote entre sur un marché **réel mais déjà banalisé**. Les plaques NFC “avis Google” seules sont devenues une commodité vendue autour de 25 à 60 €. La place à prendre n’est donc pas “la puce NFC”, mais une offre plus complète : **un chevalet A6 vraiment personnalisé à la marque du commerce, plusieurs actions possibles, une préparation sans friction et un lien pilotable dans le temps**.

Le terrain est favorable : la France comptait 6,29 millions d’établissements économiquement actifs en 2023, dont 1,50 million dans le commerce, les transports, l’hébergement et la restauration. En 2025, 84 % des TPE-PME interrogées utilisaient au moins une solution de visibilité en ligne, mais seulement 27 % une solution de vente en ligne. Le besoin n’est donc pas d’expliquer “Internet” aux commerçants ; il est de convertir une présence numérique existante en actions sur place. [Insee](https://www.insee.fr/fr/statistiques/2011101?geo=FRANCE-1), [Baromètre France Num 2025](https://www.francenum.gouv.fr/files/2025-09/Barom%C3%A8tre%20France%20Num%202025%20-%20Rapport.pdf)

### Verdict

- **Opportunité** : bonne pour une petite marque rentable, avec potentiel SaaS ; insuffisante pour une croissance forte si Tapote reste une simple plaque d’avis.
- **Produit d’appel** : Le Comptoir A6 personnalisé à 49 €.
- **Segment de départ recommandé** : salons de coiffure/beauté et restauration indépendante en Île-de-France, puis hôtellerie et réseaux.
- **Différenciation à défendre** : “la marque du client devant, Tapote derrière”, gabarits métier, livraison prête à poser, redirecteur Pilot, SAV humain.
- **Modèle** : marge sur objet + abonnement optionnel + packs multi-sites ; éviter l’abonnement obligatoire.
- **Risque principal** : comparaison directe avec les plaques génériques Amazon à ~22–29 € et les offres personnalisées dès 18,90 €. La réponse doit être visible dans le produit, le service et la preuve, pas seulement dans le discours — s’aligner sur ces prix est chiffré et écarté en section 9.
- **Décision de prix (19/07)** : Comptoir maintenu à 49 € ; Pilot offert 1 à 3 mois à la sortie de bêta plutôt qu’inclus à vie ou que baisse de prix ; entrée de gamme assurée par La Carte à 29,90 €.
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
- **Carte NFC (PVC, NTAG) glissée derrière l’insert**, invisible de face et remplaçable sans outil — remplace la pastille autocollante depuis juillet 2026.
- QR de secours imprimé vers la même URL courte.
- Configuration, encodage et contrôle qualité inclus.

> Changement d’approvisionnement du 19 juillet : Tapote n’utilise plus de pastilles NFC autocollantes. La carte NFC devient le composant unique pour tous les supports, ce qui simplifie le stock (une seule référence NFC) et facilite le SAV sur le Comptoir (la carte se remplace sans décoller quoi que ce soit). Les impacts par produit sont détaillés en section 9.

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

### Observation des offres publiques — revérifiée le 19 juillet 2026

Amazon est traité en premier : c’est l’ancre de prix que les clients (et l’entourage) ont en tête, et le concurrent le plus visible pour un commerçant qui compare rapidement.

| Concurrent/offre | Prix public observé | Promesse dominante | Lecture pour Tapote |
|---|---:|---|---|
| **Amazon — plaques génériques 12 × 12** | **21,99 à 26,99 € TTC** (époxy/PVC, NFC + QR) | plaque préprogrammée, configuration après réception, livraison Prime | ancre psychologique du marché ; zéro personnalisation, zéro BAT, zéro marque du commerce |
| Amazon — Cardzprinter plexiglas 14 × 14 | ~30–40 € TTC | plexiglas 3 mm, NFC intégrée | le générique « monte en gamme » sans service |
| Unisign | 18,90 € TTC en 10 × 10, dégressif jusqu’à 9,45 € à 200+ | gravure laser, fabrication française | plancher de prix du personnalisé ; agressif en volume |
| Skale Lab | 29,90 € TTC | plaque NFC préprogrammée, sans abonnement | discours très direct, prix d’appel |
| NFC France | 29 € HT | plaque d’avis, prix dégressifs | concurrence B2B et volume |
| Digifeel | 29,90 € HT soit 35,88 € TTC | plexiglas 12 × 12, sans abonnement, application, garanties | la réassurance comme argument principal |
| Swiipx | 39,90 € annoncé pour 1 plaque | plaque pro sans abonnement | milieu de gamme et contenu SEO offensif |
| Plaqueo | prix non visible dans l’extrait public | plaque personnalisée + option Plaqueo+ | modèle le plus proche matériel + logiciel |

Sources : [Amazon 12 × 12](https://www.amazon.fr/Plaque-Code-pour-Google-Avis/dp/B0CWJF558T), [Amazon époxy](https://www.amazon.fr/Plaque-NFC-Code-Epoxy-12x12cm/dp/B0CPKLP93Z), [Cardzprinter](https://www.amazon.fr/plexiglass-caract%C3%A8res-140x140mm-%C3%A9paisseur-Cardzprinter/dp/B0CJ891XMD), [Skale Lab](https://skale-lab.fr/product/plaque-nfc-avis-google/), [NFC France](https://nfcfrance.com/produit/plaque-nfc-avis-google/), [Unisign](https://unisign.fr/products/chevalet-nfc-qr-code-personnalise-avis-google-professionnels), [Digifeel](https://digifeel.fr/products/plaque-avis-google), [Swiipx](https://swiipx.fr/blog/plaque-avis-google-sans-abonnement), [Plaqueo](https://plaqueo.com/). Les prix et conditions peuvent changer.

### Lecture Amazon — pourquoi c’est le concurrent fort, et pourquoi on ne s’aligne pas

La revérification du 19 juillet confirme la fourchette générique : **~19 à 36 € TTC** pour une plaque NFC + QR sans personnalisation. Le contenu de référence du secteur ([Swiipx, « Prix plaque NFC avis Google 2026 »](https://swiipx.fr/blog/prix-plaque-nfc-avis-google)) situe le budget d’une plaque « pro » entre **35 et 60 €** et déconseille explicitement les plaques à moins de 25 € (qualité variable) ainsi que les modèles à abonnement obligatoire.

Ce qu’Amazon vend et que Tapote ne vend pas : un objet standard identique chez tous les commerçants, configuré par le client lui-même après réception, sans design à sa marque, sans BAT, sans SAV humain, sans lien pilotable. Ce que Tapote vend et qu’Amazon ne peut pas vendre : la maquette aux couleurs du commerce, le contrôle avant expédition, le support en français, le lien modifiable via Pilot et la cohérence d’un parc multi-supports. **La bataille contre Amazon se gagne sur la page produit (montrer la différence), pas sur l’étiquette de prix.**

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

La fourchette publique observée de produits simples se situe principalement entre 19 et 36 € (Amazon en tête à 21,99–26,99 €). Le prix Tapote de 49 € reste premium et doit donc montrer : chevalet A6, maquette client, impression, NFC, QR, encodage, contrôle, emballage et support.

### Chaîne d’approvisionnement actualisée — 19 juillet 2026

Nouveaux repères fournisseurs confirmés :

- **Cartes NFC : 19 € les 50, soit 0,38 € l’unité.** Elles remplacent les pastilles autocollantes NTAG213 (0,16 € l’unité), qui ne sont plus utilisées.
- **Chevalets A6 : 17,49 € les 6, soit 2,92 € l’unité** (inchangé).
- Impression, maquette et assemblage : hypothèses inchangées en attendant les devis ADH&Sign.

Le surcoût de la carte par rapport à la pastille est de +0,22 € par unité : négligeable sur la marge. En échange, une seule référence NFC couvre tout le catalogue, la carte se glisse derrière l’insert du Comptoir sans collage, et un support défectueux se répare en remplaçant la carte.

**Impact de la bascule carte NFC par produit :**

| Produit | Intégration avec la carte NFC | Statut |
|---|---|---|
| Le Comptoir A6 / Chevalets ×6 | carte glissée derrière l’insert papier, dans le chevalet | ✅ plus simple qu’avant, SAV facilité |
| La Plaque 12 × 12 / Le Mini | carte collée au dos du PMMA ; lecture à travers 3 mm à valider sur iPhone et Android | ⚠️ test physique requis avant série |
| La Carte | le support **est** une carte NFC ; reste à trancher l’impression (par ADH&Sign ou prestataire carte) | ⚠️ devis impression PVC à demander |
| **La Vitrine (sticker)** | **bloquée : un sticker vinyle plat ne peut pas embarquer une carte PVC** | ❌ décision requise, voir ci-dessous |

**La Vitrine — trois options à trancher au rendez-vous ADH&Sign :**

1. **Vitrine QR seul** : vitrophanie/adhésif extérieur laminé (cœur de métier ADH&Sign) avec QR variable, sans NFC. Baisser le prix ou enrichir le format (plus grand, découpe à la forme) pour justifier 29,90 € — le brief du 16 juillet mettait déjà en garde contre « vendre un simple autocollant au même prix ».
2. **Garder une micro-référence de pastilles** uniquement pour la Vitrine (7,99 € les 50 en retail) — contredit la simplification du stock mais préserve la promesse NFC.
3. **Retirer la Vitrine du catalogue** au lancement et concentrer le message sur Comptoir + Plaque + Carte, quitte à la réintroduire plus tard en version validée.

Recommandation provisoire : option 1 si ADH&Sign produit une vitrophanie de qualité à bon prix (c’est leur spécialité affichée), option 3 sinon. L’option 2 n’est acceptable que comme transition.

### Production locale — ADH&Sign (Colombes)

[ADH&Sign](https://adhandsign.fr/) est un atelier d’enseignes, signalétique et vitrophanie à Colombes (92), travaillant le Dibond, le PVC, le PMMA, l’adhésif et l’impression grand format, avec étude sur mesure et maquettes avant fabrication. Le profil couvre potentiellement la Plaque, le Mini, les inserts et la Vitrine — soit l’essentiel du catalogue hors chevalets et cartes. La proximité (Colombes, Île-de-France) permet le contrôle qualité en direct, les petites séries et le réassort rapide, cohérent avec la phase « preuve locale ».

**Devis à demander au rendez-vous (par 10 / 25 / 50 / 100) :**

1. Plaque PMMA ou PVC 3 mm, 120 × 120 mm, coins arrondis, impression UV une face, **QR différent sur chaque pièce** (données variables depuis CSV/PDF individualisé).
2. Mini plaque 80 × 80 mm, même cahier des charges.
3. Inserts A6 105 × 148 mm en petite série, plusieurs designs par lot (hypothèse actuelle : 0,60 € pièce).
4. Vitrophanie/adhésif extérieur laminé ~90 × 90 mm avec QR variable ; poser la question NFC (peuvent-ils intégrer une solution, sinon QR seul).
5. Impression sur cartes PVC 85 × 54 fournies (cartes NFC Tapote) ou fourniture de cartes NFC imprimées.
6. Pour chaque poste : frais de calage/fichier, délai, BAT, tolérance de coupe, taux de reprise, emballage neutre, conditions de réassort.

Ne pas s’engager sur un volume avant d’avoir un échantillon physique validé (lecture NFC comprise) et au moins un devis comparatif (Unisign/Otypo en secours, comme au brief du 16 juillet).

### Estimation de coût — unité A6 (base cartes NFC)

Prix retail constatés, pas des devis sécurisés :

| Poste | Hypothèse par unité |
|---|---:|
| Chevalet A6 (17,49 € les 6) | 2,92 € |
| Carte NFC (19 € les 50) | 0,38 € |
| Impression A6 | 0,60 € |
| Maquette amortie | 2,00 € |
| Encodage + contrôle + assemblage | 4,00 € |
| Emballage | 2,50 € |
| Transport moyen | 5,50 € |
| Paiement/incident | 2,00 € |
| **Coût variable estimé** | **19,90 €** |

Au tarif actuel de 49 € TTC, la commande unitaire supporte 4,90 € de livraison, soit 53,90 € TTC facturés. Avec une hypothèse de TVA à 20 %, le revenu facturé est de 44,92 € HT. La marge contributive indicative avant acquisition et frais fixes est alors de **25,02 €, soit environ 56 % du HT** — sur la cible. Si la livraison était offerte sans réduction de coût, le produit seul dégagerait 20,93 €, soit environ **51 % du HT**, sous la cible de 55 %. Si Tapote relève temporairement de la franchise en base, le calcul change ; ne pas piloter la marge en TTC.

### Scénario « s’aligner sur Amazon » — chiffré et écarté

Objection reçue : « le même produit est à ~29 € sur Amazon, 49 € c’est trop cher ». Simulation avec la structure de coûts actuelle (19,90 € de coût variable, TVA 20 %, livraison facturée à prix coûtant) :

| Prix du Comptoir | CA HT | Marge contributive | % du HT | Verdict (grille section 14) |
|---:|---:|---:|---:|---|
| 49 € (actuel) | 44,92 € | 25,02 € | ~56 % | ✅ Go |
| 39 € | 32,50 € | 12,60 € | ~39 % | ❌ Stop/pivot (< 40 %) |
| 29 € | 24,17 € | 4,27 € | ~18 % | ❌ Très en dessous du seuil |

À 29 €, chaque vente laisse ~4 € avant même le coût d’acquisition (plafonné à 25 € par commande en phase 1) : **le modèle est structurellement perdant**. La comparaison n’est de toute façon pas à produit égal : la plaque Amazon est générique et configurée par le client ; le Comptoir Tapote est maquetté, BAT-é, encodé, testé et accompagné. La réponse à l’objection est déjà dans le catalogue :

- **prix d’entrée à 29,90 €** : La Carte et La Vitrine occupent le point de prix Amazon ;
- **valeur rendue visible** : bloc comparatif « plaque générique vs Tapote » sur la page produit ;
- **Pilot offert quelques mois** plutôt qu’une baisse de prix (voir décision ci-dessous).

### Décision de prix — 19 juillet 2026

1. **Le Comptoir A6 reste à 49 €.** C’est le plancher compatible avec la marge cible ; toute baisse passe sous les seuils de la section 14.
2. **Pilot n’est pas inclus « à vie » dans le prix matériel.** L’abonnement à 9 €/mois est le moteur récurrent du modèle (cible d’attachement 20–30 %). Le support reste fonctionnel sans abonnement — c’est la protection anti-péage — mais les statistiques et les changements autonomes restent payants.
3. **À la sortie de la bêta Pilot, offrir 1 à 3 mois de Pilot sur toute commande** (déjà le cas sur les Packs Commerce et Restaurant). Le client perçoit « Pilot inclus », le prix est préservé et l’offre devient l’entonnoir de conversion vers l’abonnement. Pendant la bêta, Pilot est de fait gratuit : l’objection « 49 € sans Pilot » est déjà résolue aujourd’hui.
4. **Les tests de prix se font vers le haut, pas vers le bas** (voir ci-dessous).

### Pack de 6

Coût estimé : 6 chevalets 17,49 €, 6 cartes NFC 2,28 €, impressions 3,60 €, conception/production 10 €, emballage 4 €, transport 7 €, paiement/incident 4,50 € = **48,87 €**. À 139 € TTC, revenu HT 115,83 €, marge contributive indicative 66,96 €, soit **58 % du HT**.

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

Ne pas faire de fausse promotion permanente. Tester plutôt “livraison incluse”, “maquette offerte”, “mois de Pilot offerts” ou packs.

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

Tapote doit lancer **un produit signature avant un catalogue** : le chevalet A6 personnalisé. La Carte reste l’extension d’entrée de gamme au point de prix Amazon ; la Vitrine est suspendue à la décision NFC du rendez-vous ADH&Sign (section 9) et ne doit pas diluer le message. La preuve de marché repose sur trois choses : qualité du produit réel, usage régulier à J30 et attachement à Pilot.

Sur le prix : tenir 49 € face à l’ancre Amazon, rendre l’écart de valeur visible sur la page produit, offrir des mois de Pilot plutôt que des euros de remise, et ne tester que des prix supérieurs. Les actions immédiates sont opérationnelles, pas tarifaires : obtenir les devis ADH&Sign, valider physiquement la lecture NFC de la carte derrière chaque support, et trancher le sort de la Vitrine.

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
- [Swiipx — Prix plaque NFC avis Google 2026](https://swiipx.fr/blog/prix-plaque-nfc-avis-google) — fourchettes de marché et budget conseillé, observé le 19/07/2026
- [ADH&Sign — Colombes](https://adhandsign.fr/) — imprimeur/signalétique local pressenti ; capacités exactes et tarifs à confirmer par devis
