# VKARD — landing et vidéos, preuves section par section

Date : 30 juillet 2026  
Périmètre : seconde passe probatoire de l’accueil VKARD, desktop et mobile, puis inventaire des médias visibles sur les principales routes publiques VKARD et comparaison avec la landing Tapote actuelle.  
Livrables : ce document et les captures du dossier [`output/benchmark-vkard-total`](../output/benchmark-vkard-total/).  
Mutation externe : aucune. Aucun login, ajout panier, formulaire ou achat. Aucun code Tapote modifié.

## Verdict visible

L’écart n’est pas que VKARD aurait un site techniquement plus avancé.

L’écart visible est le suivant :

- VKARD déroule **près de 9 760 px** de réponse commerciale sur desktop ;
- Tapote déroule actuellement **environ 6 236 px** ;
- VKARD fait se succéder promesse, garanties, logos, avis, bénéfice, geste, produit, logiciel, entreprise, cas, FAQ et avis produits ;
- Tapote s’arrête après le hero, le processus de commande, les trois objets, la transparence matière, Pilot et ce que le prix comprend ;
- Tapote ne ferme pas encore la décision avec une FAQ, une preuve client, une vidéo réelle, des prix visibles dans la landing, un segment Pro et un CTA final ;
- VKARD n’utilise pas de scène WebGL publique sur les pages inspectées : son effet « premium 3D » vient principalement de MP4, WebM, GIF, photos et rendus pré-calculés ;
- Tapote possède déjà un **vrai hero WebGL** via React Three Fiber, mais cette avance technique ne remplace pas les photos, prototypes et preuves réels.

La décision n’est donc pas :

> ajouter plus d’animation à Tapote.

La décision est :

> **garder le vrai 3D Tapote, puis construire dessous une landing commerciale complète, physique, prouvée et achetable.**

---

## 1. Niveau de preuve

- **[V] Vérifié** : lu dans le DOM, observé dans le navigateur, mesuré ou capturé.
- **[D] Déclaration vendeur** : affirmation affichée par VKARD, sans vérification indépendante.
- **[I] Inférence** : lecture stratégique ou proposition Tapote.
- **[ÀV] À vérifier** : média ou comportement repéré, mais non visionné de bout en bout.

La capture desktop complète de référence est :

- [VKARD desktop, page complète](../output/benchmark-vkard-total/vkard-00-desktop-full.png)

La capture mobile complète est :

- [VKARD mobile, page complète](../output/benchmark-vkard-total/vkard-mobile-00-full.png)

La landing Tapote actuelle est archivée ici :

- [Tapote desktop, page complète](../output/benchmark-vkard-total/tapote-current-00-desktop-full.png)
- [Tapote mobile, page complète](../output/benchmark-vkard-total/tapote-current-mobile-00-full.png)

---

## 2. Mesures globales

### VKARD desktop

Mesures navigateur **[V]** :

- viewport : 2 195 × 1 066 px ;
- largeur capturée : 2 190 px ;
- hauteur totale : 9 760 px ;
- header : 140 px ;
- contenu Elementor : 9 011 px ;
- footer : 609 px ;
- aucun `canvas` dans les quinze sections de l’accueil ;
- une vidéo HTML5 dans le hero ;
- quatre familles de GIF chargées sur l’accueil.

### VKARD mobile

Mesures navigateur **[V]** :

- viewport demandé : 390 × 844 px ;
- largeur de document : 375 px ;
- hauteur totale : 13 024 px ;
- aucun débordement horizontal mesuré ;
- header mobile : environ 129 px ;
- hero : 1 142 px ;
- garanties : 764 px ;
- fonctionnement : 1 576 px ;
- cas clients : 1 308 px ;
- FAQ : 943 px.

La landing est environ **33 % plus longue** sur mobile que sur desktop. Les grandes sections deviennent de longues piles verticales.

### Tapote actuelle

Mesures navigateur **[V]** :

- desktop : viewport 2 439 × 1 122 px, document d’environ 6 236 px ;
- mobile contrôlé : largeur interne 433 px, hauteur document 8 656 px ;
- aucun débordement horizontal mesuré ;
- sept sections principales seulement ;
- un `canvas` WebGL dans le hero ;
- aucune vidéo, aucun GIF, aucun iframe ;
- aucun bloc FAQ, cas client, avis, logos ou presse sur l’accueil.

---

## 3. Header et navigation VKARD

### Desktop

Hauteur : 140 px **[V]**.

Structure :

1. bande noire ;
2. « Made in Vendée & Frais de port offerts pour l’Europe » ;
3. barre blanche ;
4. logo ;
5. Commander ;
6. Comment ça marche ;
7. Démo & Devis ;
8. Offre Pro ;
9. Entreprises ;
10. langue ;
11. compte ;
12. panier.

Le menu « Commander » ouvre une taxonomie très riche :

- quatre cartes personnalisées ;
- accessoires ;
- cartes prêtes ;
- Nano ;
- KeyChain ;
- Stars ;
- Desk ;
- Square.

Cette largeur rassure sur l’existence commerciale de la gamme, mais disperse aussi l’attention.

Preuve :

- [header et hero desktop](../output/benchmark-vkard-total/vkard-01-header-hero.png)

### Mobile

Le header devient :

- burger ;
- logo ;
- langue ;
- compte ;
- panier.

Les CTA du hero sont empilés et la vidéo passe sous le texte.

Preuve :

- [header et hero mobile](../output/benchmark-vkard-total/vkard-mobile-01-header-hero.png)

### Décision Tapote

Header recommandé :

- Produits ;
- Personnaliser ;
- Comment ça marche ;
- Pro & multi-sites ;
- Se connecter ;
- Panier.

CTA :

> **Voir la boutique**

Ne pas afficher dans le mega-menu des matières qui ne sont pas encore qualifiées.

---

## 4. Accueil VKARD — table complète et ordonnée

Les positions et hauteurs desktop proviennent du DOM public le 30 juillet 2026 **[V]**.

| # | Position / hauteur desktop | Section et contenu | CTA | Média / comportement | Rythme, couleurs et preuve |
| ---: | ---: | --- | --- | --- | --- |
| 0 | 0–140 / 140 px | Header, topbar, navigation, compte et panier | Commander, pages commerciales | Mega-menu au survol/clic, panier en tiroir | Noir puis blanc. [Capture](../output/benchmark-vkard-total/vkard-01-header-hero.png) |
| 1 | y 140 / 710 px | Hero : « La carte de visite NFC, digitale & connectée » | Commander ; Pour les équipes | MP4 13,33 s, autoplay, loop, muted, sans contrôle | Grand écran noir, texte blanc, cyan. [Capture](../output/benchmark-vkard-total/vkard-01-header-hero.png) |
| 2 | y 850 / 158 px | Quatre garanties : sécurité, RGPD, écologie, France | Aucun | Icônes et texte statiques | Bande noire compacte. [Capture](../output/benchmark-vkard-total/vkard-02-garanties.png) |
| 3 | y 1 008 / 505 px | « Ces entreprises nous font confiance », avis Google, carousel de logos | Plus de 200 avis | Carousel de treize logos ; Google et étoiles | Dégradé cyan/lilas très pâle. [Capture](../output/benchmark-vkard-total/vkard-03-logos-avis.png) |
| 4 | y 1 513 / 321 px | Headline dynamique « Il est temps de… » | Aucun | Texte tapé en boucle, trois phrases | Grand blanc de respiration. [Capture](../output/benchmark-vkard-total/vkard-04-headline-transition.png) |
| 5 | y 1 854 / 670 px | Bénéfice NFC + profil digital modifiable | « Commandez la vôtre ! » | Image de trois écrans | Bloc éditorial clair. [Capture](../output/benchmark-vkard-total/vkard-05-benefice-nfc.png) |
| 6 | y 2 544 / 589 px | Trois étapes : badgez, créez l’engagement, échangez/synchronisez | Aucun | Trois visuels, dont un GIF CRM | Grille 3 colonnes. [Capture](../output/benchmark-vkard-total/vkard-06-comment-ca-marche.png) |
| 7 | y 3 153 / 787 px | Matières PVC, bambou, métal ; fabrication annoncée | « Commandez la vôtre ! » | Grand visuel produit et liens matières | Blanc, grande respiration. [Capture](../output/benchmark-vkard-total/vkard-07-produits-matieres.png) |
| 8 | y 4 020 / 870 px | Transition « carte digitale + solution SaaS » | Aucun | Grande scène logicielle décorative | Transition visuelle longue. [Capture](../output/benchmark-vkard-total/vkard-08-saas-transition.png) |
| 9 | y 4 970 / 1 251 px | Dashboard, administration, stats, lot, entités, 2FA, chiffrement, SSO, ISO 27001 | Dashboard externe | Cinq images et icônes ; section sombre | Plus grosse section desktop. [Captures A](../output/benchmark-vkard-total/vkard-09-dashboard-a.png) et [B](../output/benchmark-vkard-total/vkard-10-dashboard-b.png) |
| 10 | y 6 221 / 674 px | Entreprises exigeantes, rapidité, sécurité, API | Option Pro & Entreprise | Tableau comparatif en image | Retour fond clair. [Capture](../output/benchmark-vkard-total/vkard-11-entreprises.png) |
| 11 | y 6 895 / 864 px | Études de cas + deux témoignages Banque Populaire/Panasonic | Voir plus de témoignages | Carousel de cas et citations | Bloc gris clair, cartes arrondies. [Capture](../output/benchmark-vkard-total/vkard-12-cas-clients.png) |
| 12 | y 7 759 / 729 px | Six questions fréquentes | Accordéons | Interaction ouverture/fermeture | Blanc, section de désobjection. [Capture](../output/benchmark-vkard-total/vkard-13-faq.png) |
| 13 | y 8 488 / 112 px | Intro « Des vrais avis par des vrais clients » | Aucun | Statique | Transition courte. [Capture](../output/benchmark-vkard-total/vkard-14-avis-intro.png) |
| 14 | y 8 600 / 531 px | Carousel d’avis acheteurs vérifiés | Produits liés, afficher plus/moins | Slick carousel ; photos/GIF miniatures | Dernière preuve avant footer. [Capture](../output/benchmark-vkard-total/vkard-15-avis-produits.png) |
| 15 | y 9 131 / 20 px | Séparateur vide | Aucun | Aucun | Simple marge technique |
| 16 | y 9 151 / 609 px | Contact, réseaux, FAQ, presse, comptes, blog, cas, légal, newsletter | Liens de service | Formulaire newsletter | Fond #222529 puis bande noire. [Capture](../output/benchmark-vkard-total/vkard-16-footer.png) |

### Section 1 — hero

Texte **[V]** :

> Le meilleur outil pour développer votre réseau, fabriqué en France  
> La carte de visite NFC, digitale & connectée  
> qui va transformer vos rencontres professionnelles à jamais.

CTA :

- Commander ;
- Pour les équipes.

Hiérarchie desktop :

- H1 54,4 px ;
- poids 600 ;
- texte blanc ;
- deux CTA côte à côte ;
- produit et téléphone à droite ;
- bande de garanties directement intégrée en bas de l’écran.

Mobile :

- H1 28 px ;
- interligne 42 px ;
- CTA empilés ;
- vidéo sous les CTA ;
- hero total 1 142 px.

Rôle de conversion :

- catégorie ;
- promesse ;
- auto-segmentation achat/équipe ;
- première preuve physique.

### Section 2 — garanties

Affirmations affichées **[D]** :

- données chiffrées ;
- tests d’intrusion niveau A+ ;
- conformité RGPD ;
- approche écoresponsable ;
- matériaux durables et recyclables ;
- conçu et fabriqué en France.

Le site présente ces affirmations comme quatre garanties en une seule ligne. Elles réduisent le risque perçu, mais ne constituent pas une preuve indépendante.

Tapote ne doit pas reproduire cette bande tant que ses justificatifs ne sont pas disponibles.

### Section 3 — logos et avis

Contenu **[V]** :

- Google ;
- étoiles ;
- « Plus de 200 avis » ;
- carousel de treize logos.

Exemples observés :

- Banque Populaire ;
- Gripple ;
- Panasonic ;
- Paris La Défense Arena ;
- Decathlon Pro ;
- Fidal ;
- Lido ;
- SPIE ;
- BMW ;
- Renault Trucks ;
- Pretto ;
- Forté Pharma ;
- Pandora.

Rôle :

- transférer la confiance des marques vers VKARD ;
- donner une impression de volume ;
- créer une pause après le hero noir.

### Section 4 — headline dynamique

Le composant public contient **[V]** :

> Il est temps de…

Phrases tapées en boucle :

1. faire une impression inoubliable ;
2. transformer vos rencontres en prospects ;
3. moderniser votre networking.

Paramètres DOM **[V]** :

- transition `typing` ;
- vitesse 40 ;
- délai 2 500 ms ;
- boucle activée.

Le mouvement sert uniquement de transition. Il n’ajoute aucune preuve.

### Section 5 — bénéfice

Le bloc relie :

- technologie NFC ;
- profil digital ;
- modification gratuite ;
- plateforme annoncée sécurisée.

Il explique le bénéfice avant de détailler le geste.

### Section 6 — fonctionnement

Étapes **[V]** :

1. badge NFC ou QR ;
2. partage d’informations, rendez-vous, brochures et landing pages ;
3. récupération du prospect et synchronisation CRM.

La troisième étape est une étape de valeur commerciale, pas seulement une instruction technique. C’est ce qui manque dans le fonctionnement Tapote actuel, encore centré sur préparation, destination et BAT.

### Section 7 — produits et matières

Matières citées **[D]** :

- bambou ;
- métal gravé ;
- PVC recyclable.

Le bloc ne montre pas les prix. Il sert de pont vers la boutique.

### Sections 8 et 9 — SaaS et dashboard

La transition SaaS occupe 870 px, puis le dashboard 1 251 px.

VKARD donne donc au logiciel **2 121 px consécutifs** sur desktop.

Fonctions affichées **[D]** :

- statistiques ;
- vues de profil ;
- édition en lot ;
- groupement par entité ;
- 2FA ;
- chiffrement ;
- SSO ;
- ISO 27001.

La longueur montre que VKARD vend autant la gestion que la carte.

Tapote ne doit pas donner autant de place à Pilot avant d’avoir prouvé que le visiteur comprend d’abord l’objet et le geste.

### Section 10 — entreprise

Promesses **[D]** :

- mise à jour rapide ;
- sécurité ;
- SLA ;
- SSO ;
- MFA ;
- ISO ;
- RGPD ;
- API.

Le CTA renvoie vers Démo & Devis.

### Section 11 — cas et témoignages

Le composant combine :

- quatre cas visibles dans un carousel ;
- lien vers l’index ;
- témoignage Banque Populaire ;
- témoignage Panasonic Connect.

Ce mélange est efficace :

> histoires visuelles à gauche + autorité de marque à droite.

### Section 12 — FAQ

Questions visibles **[V]** :

1. abonnement ;
2. modification des informations ;
3. traduction ;
4. QR Code ;
5. export du QR ;
6. avantages NFC.

La FAQ arrive après le produit, le logiciel, l’entreprise et les preuves. Elle traite les objections restantes.

### Sections 13 et 14 — avis produits

Le widget affiche :

- nom ou anonyme ;
- badge acheteur vérifié ;
- note ;
- commentaire ;
- date relative ;
- produit.

Il inclut des avis positifs mais aussi des réserves. Cette imperfection renforce la crédibilité.

### Section 16 — footer

Le footer contient **[V]** :

- adresse ;
- horaires ;
- contact ;
- réseaux ;
- FAQ ;
- presse ;
- comptes ;
- équipe ;
- recrutement ;
- blog ;
- cas ;
- légal ;
- gestion cookies ;
- newsletter.

Faiblesse visible :

- copyright 2025 observé en juillet 2026.

### Presse

Il n’y a **pas de bloc presse distinct sur l’accueil VKARD actuel** **[V]**.

La presse apparaît :

- dans le footer ;
- sur la page dédiée ;
- sur la landing Entreprises.

Il faut donc distinguer :

- preuve visible dans le funnel d’accueil ;
- preuve accessible ailleurs.

---

## 5. Comportement mobile VKARD, section par section

| Section | Hauteur mobile | Comportement observé |
| --- | ---: | --- |
| Hero | 1 142 px | texte, CTA empilés, puis vidéo |
| Garanties | 764 px | quatre garanties empilées |
| Logos/avis | 480 px | carousel conservé |
| Headline | 274 px | animation de saisie conservée |
| Bénéfice | 858 px | texte et image empilés |
| Trois étapes | 1 576 px | trois cartes verticales |
| Produits/matières | 1 050 px | visuel et texte empilés |
| Transition SaaS | 415 px | fortement raccourcie |
| Dashboard | 996 px | visuel puis bénéfices |
| Entreprise | 890 px | tableau/texte empilés |
| Cas | 1 308 px | carousel puis témoignages |
| FAQ | 943 px | accordéons pleine largeur |
| Intro avis | 176 px | transition |
| Avis | 554 px | carousel horizontal |

Captures :

- [garanties mobile](../output/benchmark-vkard-total/vkard-mobile-02-garanties.png)
- [logos mobile](../output/benchmark-vkard-total/vkard-mobile-03-logos.png)
- [headline mobile](../output/benchmark-vkard-total/vkard-mobile-04-headline.png)
- [bénéfice mobile](../output/benchmark-vkard-total/vkard-mobile-05-benefice.png)
- [étapes mobile A](../output/benchmark-vkard-total/vkard-mobile-06-etapes-a.png)
- [étapes mobile B](../output/benchmark-vkard-total/vkard-mobile-07-etapes-b.png)
- [produits mobile](../output/benchmark-vkard-total/vkard-mobile-08-produits.png)
- [SaaS mobile](../output/benchmark-vkard-total/vkard-mobile-09-saas.png)
- [dashboard mobile](../output/benchmark-vkard-total/vkard-mobile-10-dashboard.png)
- [entreprise mobile](../output/benchmark-vkard-total/vkard-mobile-11-entreprises.png)
- [cas mobile](../output/benchmark-vkard-total/vkard-mobile-12-cas.png)
- [FAQ mobile](../output/benchmark-vkard-total/vkard-mobile-13-faq.png)
- [avis mobile](../output/benchmark-vkard-total/vkard-mobile-14-avis.png)
- [footer mobile](../output/benchmark-vkard-total/vkard-mobile-15-footer.png)

Conclusion mobile :

- aucun débordement horizontal ;
- navigation correctement réduite ;
- parcours très long ;
- les trois étapes et les cas deviennent particulièrement verticaux ;
- la preuve est conservée jusqu’au footer ;
- VKARD accepte la longueur plutôt que de supprimer les arguments.

---

## 6. Inventaire exhaustif des médias détectés

Routes inspectées :

- accueil ;
- catalogue ;
- personnalisés ;
- prêts à l’emploi ;
- PVC ;
- métal ;
- Desk ;
- Comment ça marche ;
- plans ;
- Entreprises ;
- devis ;
- cas ;
- BMW ;
- FAQ ;
- presse.

### 6.1 Vidéos HTML5

| Média | Route | Durée | Attributs vérifiés | Storyboard observé | Rôle |
| --- | --- | ---: | --- | --- | --- |
| [`VKARD-Carte-de-visite-digitale-et-connectee.mp4`](https://vkard.io/wp-content/uploads/2024/05/VKARD-Carte-de-visite-digitale-et-connectee.mp4) | Accueil | 13,33 s | autoplay, loop, muted, sans contrôles, sans poster | téléphone et carte flottent ; profil apparaît ; notification « new lead » ; QR, wallet et CRM apparaissent | Expliquer objet + profil + résultat sans ralentir le hero |
| [`Metal-Black-Silver-V3.webm`](https://vkard.io/wp-content/uploads/2024/01/Metal-Black-Silver-V3.webm) | Fiche métal | 16,04 s | autoplay, loop, muted, contrôles présents, sans poster | verso QR ; vue éclatée des couches ; recto/verso sur plateau ; rotation matière | Donner une impression de matière premium et expliquer l’hybride |
| [`VKARD-STARS-Avis-Google.webm`](https://vkard.io/wp-content/uploads/2023/03/VKARD-STARS-Avis-Google.webm) + [fallback MP4](https://vkard.io/wp-content/uploads/2023/03/VKARD-STARS-Avis-Google.mp4) | Desk Stars | 10,95 s | autoplay, loop, muted, sans contrôles, sans poster | chevalet blanc vierge ; révélation NFC/QR ; retour neutre ; face finale Google | Montrer la transformation du support et le résultat final |

Preuves par plans :

- [hero plan 1](../output/benchmark-vkard-total/media-video-home-plan-1.png)
- [hero plan 2](../output/benchmark-vkard-total/media-video-home-plan-2.png)
- [hero plan 3](../output/benchmark-vkard-total/media-video-home-plan-3.png)
- [hero plan 4](../output/benchmark-vkard-total/media-video-home-plan-4.png)
- [métal plan 1](../output/benchmark-vkard-total/media-video-metal-plan-1.png)
- [métal plan 2](../output/benchmark-vkard-total/media-video-metal-plan-2.png)
- [métal plan 3](../output/benchmark-vkard-total/media-video-metal-plan-3.png)
- [métal plan 4](../output/benchmark-vkard-total/media-video-metal-plan-4.png)
- [Desk plan 1](../output/benchmark-vkard-total/media-video-desk-plan-1.png)
- [Desk plan 2](../output/benchmark-vkard-total/media-video-desk-plan-2.png)
- [Desk plan 3](../output/benchmark-vkard-total/media-video-desk-plan-3.png)
- [Desk plan 4](../output/benchmark-vkard-total/media-video-desk-plan-4.png)

### 6.2 Familles de GIF

Les versions `150x150`, `300x300` et `85x85` sont des dérivés du même média source et sont regroupées.

| Famille GIF | Routes détectées | Contenu / storyboard | Rôle | Preuve |
| --- | --- | --- | --- | --- |
| [`crm-carte-de-visite-digitale.gif`](https://vkard.io/wp-content/uploads/2024/04/crm-carte-de-visite-digitale.gif) | Accueil, Comment ça marche | formulaire d’échange devant le profil ; logos CRM apparaissent/se succèdent | Matérialiser la capture de prospect et la synchronisation | [Capture](../output/benchmark-vkard-total/media-gif-01-crm.png) |
| [`cartes-de-visite-NFC-VKARD.gif`](https://vkard.io/wp-content/uploads/2021/12/cartes-de-visite-NFC-VKARD.gif) | Accueil, catalogue, personnalisés, PVC, métal, avis | recto « Your design », verso QR + NFC, alternance/rotation | Montrer personnalisation recto/verso | [Capture](../output/benchmark-vkard-total/media-gif-02-pvc.png) |
| [`cartes-de-visite-NFC-en-Bois-VKARD.gif`](https://vkard.io/wp-content/uploads/2021/12/cartes-de-visite-NFC-en-Bois-VKARD.gif) | Accueil, catalogue, personnalisés, métal, avis | carte bambou, recto/verso et matière | Donner une preuve de gamme | [Capture](../output/benchmark-vkard-total/media-gif-03-bamboo.png) |
| [`VKARD-carte-metal-gold.gif`](https://vkard.io/wp-content/uploads/2021/12/VKARD-carte-metal-gold.gif) | Catalogue, personnalisés, métal | rotation or, recto/verso | Monter en gamme | [Capture](../output/benchmark-vkard-total/media-gif-04-metal-gold.png) |
| [`VKARD-carte-metal-silver-v2-1.gif`](https://vkard.io/wp-content/uploads/2021/12/VKARD-carte-metal-silver-v2-1.gif) | Accueil, catalogue, personnalisés, métal, avis | rotation argent, QR, NFC et design | Preuve matière + cross-sell | [Capture](../output/benchmark-vkard-total/media-gif-05-metal-silver.png) |
| [`iphone-nano-noir-s-Gif-v2.gif`](https://vkard.io/wp-content/uploads/2024/02/iphone-nano-noir-s-Gif-v2.gif) | Catalogue, prêts, PVC, métal, Desk | iPhone, Nano collé, vue face/profil | Expliquer le format Nano | [Capture](../output/benchmark-vkard-total/media-gif-06-nano.png) |
| [`91597-validacion-1.gif`](https://vkard.io/wp-content/uploads/2022/11/91597-validacion-1.gif) | Métal, Desk | animation graphique de validation **[ÀV]** | Micro-rassurance visuelle | [Capture d’un état](../output/benchmark-vkard-total/media-gif-07-validation.png) |
| [`animation600x600.gif`](https://vkard.io/wp-content/uploads/2025/09/animation600x600.gif) | Offre Pro | carte glissant vers un téléphone puis interface prospect | Expliquer échange et logiciel | [Capture](../output/benchmark-vkard-total/media-gif-08-plans.png) |
| [`iphone-dans-main-1.gif`](https://vkard.io/wp-content/uploads/2023/06/iphone-dans-main-1.gif) | Entreprises | téléphone en main, profil, boutons de partage et rendez-vous | Donner l’échelle et le résultat digital | [Capture](../output/benchmark-vkard-total/media-gif-09-iphone-main.png) |

### 6.3 YouTube

| ID / titre | Route | Durée vérifiée | Structure / storyboard | Fonction |
| --- | --- | ---: | --- | --- |
| [`DF3nP_7oko0`](https://www.youtube.com/watch?v=DF3nP_7oko0) — « Cartes perdues, contacts oubliés ? » | PVC et Entreprises | 3 min 34 s ; départ à 44 s sur la PDP | problème des cartes et suivis ; démonstration NFC ; profil ; échange ; automatisation | Vidéo longue de milieu de funnel |
| [`af5DKqN3aOQ`](https://www.youtube.com/watch?v=af5DKqN3aOQ) — « VKARD Custom Metal » | Métal | 2 min 02 s | présentation carte métal, plans produit, NFC/QR, profil | Détailler produit premium |
| [`h22-fhrPyWU`](https://www.youtube.com/watch?v=h22-fhrPyWU) — « VKARD Custom Metal » | Métal | 2 min 02 s | titre et description identiques ; modèle V1 visible au début | Deuxième intégration métal, probablement variante/duplication |
| [`LpRP-ZuY2Ng`](https://www.youtube.com/watch?v=LpRP-ZuY2Ng) — BMW Paris | Cas BMW | 1 min 48 s | showroom ; interview ; usage VKARD ; qualité de l’interaction client | Transformer un logo en histoire client |
| [`JBGCYMsMQMQ`](https://youtu.be/JBGCYMsMQMQ) — présentation française | fournie séparément par le fondateur, non détectée dans le DOM des routes auditées | environ 38 s dans le player observé | cartes papier ; produit ; geste ; profil ; dashboard ; marque | Bonne structure courte, mais pas intégrée à l’accueil actuel |

Les vidéos YouTube ne sont pas en autoplay sur les pages auditées. Les players affichent les contrôles.

### 6.4 Vimeo et Dailymotion

| Média | Route | Durée | Type / storyboard éditorial | Fonction |
| --- | --- | ---: | --- | --- |
| Dailymotion [`x8pg810`](https://www.dailymotion.com/video/x8pg810) | Presse | 7 084,2 s, soit environ 1 h 58 min | émission France Bleu complète ; segment VKARD dans un programme long **[ÀV]** | Autorité locale, très faible usage conversion directe |
| Vimeo [`1070257811`](https://vimeo.com/1070257811) | Presse | 3 min 24 s | reportage France 3 Régions, produit et fondateurs | Preuve média / fabrication locale |
| Vimeo [`838831343`](https://vimeo.com/838831343) | Presse | 9 min 32 s | interview Figaro TV du CEO/cofondateur | Autorité et discours fondateur |
| Vimeo [`832576826`](https://vimeo.com/832576826) | Presse et Entreprises | 3 min 55 s | pitch BFM Business devant Frédéric Mazzella ; plans plateau et échange | Crédibilité entrepreneuriale |
| Vimeo `832711575` | Presse et Entreprises | 7 min 21 s | Smart Job, interview de Thibaut Oger par Arnaud Ardoin | Marque employeur / fondateur |
| Vimeo `832711646` | Presse | 2 min 02 s | interview Ouest-France de Thibaut et Nicolas Oger par Marie Petit | Histoire locale et fondateurs |
| Vimeo [`832576887`](https://vimeo.com/832576887) | Presse | 5 min 13 s | BFM Business, sujet recrutement **[ÀV]** | Marque employeur |

Les iframes Vimeo audités ont :

- contrôles ;
- autoplay désactivé ;
- loop désactivé ;
- muted désactivé.

Les séquences presse n’expliquent pas le produit avec l’efficacité de la boucle hero. Leur rôle est l’autorité.

---

## 7. Verdict 3D / WebGL

### VKARD

Sur les routes inspectées :

- aucun `canvas` dans l’accueil ;
- aucun `model-viewer` détecté ;
- aucun player 3D interactif détecté ;
- aucune scène WebGL publique détectée.

Le média métal montre des vues éclatées et rotations qui ressemblent à de la 3D, mais elles sont livrées dans un fichier WebM de 16,04 s.

Conclusion **[V]** :

> **VKARD utilise des rendus 3D pré-calculés, pas une 3D WebGL interactive.**

### Tapote

Le hero Tapote actuel charge :

- `@react-three/fiber` ;
- `@react-three/drei` ;
- `three` ;
- un composant `Hero3D` ;
- un `Canvas` WebGL ;
- `Float`, `RoundedBox`, `ContactShadows` et textures générées.

Source :

- [src/storefront/Hero3D.jsx](../src/storefront/Hero3D.jsx)
- [src/StorefrontV3.jsx](../src/StorefrontV3.jsx)

Conclusion **[V]** :

> **Tapote possède déjà la technologie 3D réellement interactive que VKARD n’a pas sur son site public.**

Décision :

- garder le hero WebGL ;
- ajouter un fallback image ;
- respecter `prefers-reduced-motion` ;
- ne pas multiplier les scènes WebGL ;
- investir ensuite dans des photos et boucles réelles ;
- utiliser une boucle pré-rendue pour les fiches si elle charge plus vite.

---

## 8. La landing Tapote actuelle, section par section

| # | Section | Hauteur desktop | Ce qui fonctionne | Ce qui est faible ou manquant |
| ---: | --- | ---: | --- | --- |
| 1 | Hero WebGL | 1 013 px | positionnement distinctif, vraie 3D, CTA boutique/personnalisation | aucun produit réel, aucun prix, aucune vidéo réelle |
| 2 | Bande preuve | 76 px | Link, NFC+QR, BAT | ce sont des engagements internes, pas des preuves externes |
| 3 | Processus de commande | 879 px | clair, quatre étapes | explique surtout fabrication/BAT, pas le geste client ni le résultat |
| 4 | Trois objets | 1 110 px | gamme resserrée, Comptoir/Plaque/Card | titre « Pas un catalogue » contredit le besoin d’une vraie boutique ; mockups, prix absents |
| 5 | Matière / pilote | 768 px | honnêteté remarquable | texte sans photos, prototypes ni dimensions ; le doute reste entier |
| 6 | Link / Pilot | 899 px | distinction incluse/optionnelle | arrive avant preuve client ; chiffres de démonstration ressemblent à de vraies données |
| 7 | Ce que le prix comprend | 1 030 px | valeur du BAT, encodage, test | aucun prix visible ; aucune livraison/garantie ; la landing finit brutalement |
| 8 | Footer | environ 461 px desktop | boutique, produits, légal | pas de FAQ, cas, adresse, newsletter, preuve ou CTA final |

Captures :

- [hero](../output/benchmark-vkard-total/tapote-current-01-hero.png)
- [bande preuve](../output/benchmark-vkard-total/tapote-current-02-proof-band.png)
- [processus](../output/benchmark-vkard-total/tapote-current-03-process.png)
- [produits](../output/benchmark-vkard-total/tapote-current-04-products.png)
- [matière](../output/benchmark-vkard-total/tapote-current-05-material.png)
- [Pilot](../output/benchmark-vkard-total/tapote-current-06-pilot.png)
- [prix inclus](../output/benchmark-vkard-total/tapote-current-07-price-included.png)
- [footer](../output/benchmark-vkard-total/tapote-current-08-footer.png)

### Ce qui manque sous la ligne de flottaison

#### 1. Une vraie entrée boutique

Le visiteur doit voir :

- produit ;
- photo ;
- prix ;
- dimensions ;
- délai ;
- CTA.

Aujourd’hui il voit une déclaration de gamme, pas un rayon achetable.

#### 2. Le geste réel

Le processus actuel dit :

> choisissez, indiquez, contrôlez, posez.

Le visiteur doit aussi voir :

> une personne tapote, la bonne page s’ouvre, l’action est réalisée.

#### 3. La preuve matière

Le texte dit que les mockups sont des visualisations. C’est honnête, mais cela laisse le visiteur sans réponse visuelle.

Il faut :

- macro impression ;
- tranche ;
- main ;
- fixation ;
- stabilité ;
- NFC ;
- QR ;
- emballage.

#### 4. Les prix

Le titre « Ce que le prix comprend » sans prix dans la landing demande un effort supplémentaire.

La landing doit montrer au minimum :

- à partir de 39 € pour la Card ;
- 59 € pour la Plaque ;
- 69 € pour le Comptoir ;
- prix à valider avant publication définitive.

#### 5. La livraison et la garantie

Elles ne sont pas suffisamment visibles dans la landing.

#### 6. La preuve client

Absents :

- logo autorisé ;
- témoignage ;
- pilote ;
- résultat ;
- avis ;
- étude de cas.

#### 7. La FAQ

Absente de l’accueil.

#### 8. La fin de décision

La page se termine sans :

- dernier rappel de gamme ;
- segmentation 1–9 / 10+ ;
- CTA final ;
- rassurance paiement/livraison.

#### 9. La vidéo

Aucune vidéo réelle, GIF ou iframe.

Le hero 3D montre une intention de produit. Il ne prouve pas le geste, la matière ni l’installation.

#### 10. Le rythme mobile

Mesures **[V]** :

- processus : 1 272 px ;
- produits : 1 975 px ;
- matière : 1 046 px ;
- Pilot : 1 302 px ;
- prix inclus : 1 431 px.

Ces blocs sont longs alors qu’ils ne contiennent encore aucune preuve indépendante.

---

## 9. Mapping exact VKARD → Tapote

| Section VKARD | Ce qu’elle accomplit | Version Tapote spécifique | Ce qu’il faut éviter |
| --- | --- | --- | --- |
| Topbar | origine/livraison | NFC+QR, Link inclus, livraison | fausse origine France |
| Header | distribue les intentions | Produits, Personnaliser, Fonctionnement, Pro | mega-menu avec matières non validées |
| Hero | catégorie + achat/équipe | lieu + action, boutique/pro | hero seulement esthétique |
| Garanties | réduit le risque | engagements vérifiés : app, Link, BAT, QR | sécurité/écologie non prouvées |
| Logos + avis | preuve sociale | pilotes autorisés + avis réels | faux logos ou compteurs |
| Headline dynamique | rythme et aspiration | moments d’usage : entrée, table, caisse | animation texte inaccessible |
| Bénéfice | explique la valeur | « chaque emplacement ouvre la bonne action » | expliquer uniquement le NFC |
| Trois étapes | geste → valeur → CRM | tapoter → ouvrir → agir | processus seulement interne |
| Matières/produits | gamme physique | Comptoir, Plaque, Card + prix | accessoires |
| Transition SaaS | élargit la valeur | « le lien évolue, le support reste » | donner 2 000 px à Pilot |
| Dashboard | prouve gestion | Pilot en 600–800 px max | fausses données |
| Entreprise | capte gros volume | Pro & multi-sites, seuil 10+ | CRM/SSO avant demande |
| Cas | raconte la réussite | premier pilote documenté | logos nus |
| FAQ | lève objections | 8–10 questions Tapote | réponses juridiques vagues |
| Avis produits | dernière preuve | avis commandes vérifiées | avis internes maquillés |
| Footer | confiance et navigation | boutique, support, légal, contact | footer sans CTA/contact |

---

## 10. Ordre final complet de la landing Tapote

### 0. Topbar

Texte de travail :

> NFC + QR · Tapote Link inclus · Livraison offerte dès 69 €

Média :

- aucun.

Données requises :

- seuil livraison réel ;
- zone géographique.

Critères d’acceptation :

- une seule ligne desktop ;
- deux lignes maximum mobile ;
- aucune affirmation d’origine non justifiée.

### 1. Header

Navigation :

- Produits ;
- Personnaliser ;
- Comment ça marche ;
- Pro & multi-sites ;
- Se connecter ;
- Panier.

CTA :

> Voir la boutique

Critères :

- quatre intentions maximum dans le menu principal ;
- burger fonctionnel ;
- panier accessible ;
- aucune duplication Pilot/connexion.

### 2. Hero

Eyebrow :

> NFC + QR · PENSÉ POUR LES LIEUX

H1 :

> **Le bon geste, au bon moment.**

Texte :

> Au comptoir, à l’entrée ou en rendez-vous, Tapote ouvre l’avis, le menu, la réservation ou votre lien utile. Sans application.

CTA :

- Voir la boutique ;
- Équiper plusieurs lieux.

Média :

- WebGL actuel ;
- fallback photo de pré-série ;
- pas de son ;
- mouvement réduit si demandé.

Preuves requises :

- vraie forme/dimensions ;
- texture correspondant au prototype ;
- pas de matériau fictif.

Critères :

- produit identifiable en moins de deux secondes ;
- H1 et CTA visibles dans le premier viewport desktop ;
- LCP mobile acceptable ;
- fallback si WebGL indisponible.

### 3. Bande d’engagement

Texte :

- NFC + QR sur chaque support ;
- aucune application ;
- Tapote Link inclus ;
- BAT avant impression personnalisée.

Preuve :

- compatibilité testée ;
- fonctionnement Link réel ;
- processus BAT documenté.

Critères :

- quatre items maximum ;
- pas de claims sécurité/écologie génériques.

### 4. « Quel moment voulez-vous équiper ? »

Titre :

> **Un lieu. Plusieurs moments. Une action utile à chaque fois.**

Trois cartes :

- Entrée → informer ou guider ;
- Comptoir → avis, fidélité, réservation ;
- Rendez-vous → contact ou présentation.

Média :

- trois photos contextuelles réelles ;
- aucun mockup isolé.

CTA :

> Trouver mon support

Preuves :

- lieux pilotes photographiés.

Critères :

- chaque carte nomme emplacement, action et support ;
- clic vers produit filtré.

### 5. Produits et prix

Titre :

> **Trois objets. Deux packs. Pas de gadget.**

Cartes :

1. Tapote Comptoir — 69 € ;
2. Tapote Plaque — 59 € ;
3. Tapote Card — 39 € ;
4. Pack Local — 119 € ;
5. Pack Parcours — 299 €.

Les prix restent à valider avant mise en production.

Média :

- photo réelle ;
- face ;
- tranche ;
- contexte.

Données :

- dimensions ;
- matière ;
- délai ;
- garantie ;
- fiscalité.

Critères :

- prix près du CTA ;
- « prêt » ou « à votre image » expliqué après choix produit ;
- accès direct à la PDP ;
- CTA « Voir le produit » ;
- CTA secondaire devis 10+.

### 6. Démonstration 25 secondes

Titre :

> **Tapote. La bonne page s’ouvre.**

Storyboard :

1. lieu et moment ;
2. main/téléphone ;
3. tap NFC ;
4. notification ;
5. page avis/menu/réservation ;
6. action terminée ;
7. propriétaire change le lien ;
8. pack dans le lieu ;
9. marque.

Média :

- MP4 + WebM ;
- 20 à 30 s ;
- autoplay uniquement muted ;
- loop ;
- poster photo ;
- bouton lecture/arrêt ;
- sous-titres.

Preuves :

- vrai support ;
- vrai téléphone ;
- vraie URL Tapote.

Critères :

- compréhensible sans son ;
- moins de 3 Mo mobile si possible ;
- aucune interface fictive non marquée.

### 7. Fonctionnement en trois étapes

Titre :

> **Un geste. Une ouverture. Une action.**

Étapes :

1. Le client tapote ou scanne ;
2. Tapote ouvre la destination active ;
3. Il laisse un avis, réserve, consulte ou contacte.

Texte secondaire :

> Vous pourrez changer la destination plus tard sans remplacer le support.

Média :

- photos réelles ;
- mini-animation NFC/QR ;
- pas de longue démonstration CRM.

Critères :

- résultat client visible ;
- QR présenté comme secours ;
- compatibilité sans application.

### 8. Création

Titre :

> **Prêt à poser, composé par vous ou confié à Tapote.**

Trois voies :

- design prêt ;
- Studio adapté à l’objet ;
- Tapote Signature.

Média :

- avant/après ;
- recto/verso Card ;
- grille Plaque/Comptoir.

Preuves :

- fichiers réellement fabricables ;
- règles de marge, QR, NFC et contraste.

Critères :

- le visiteur a déjà choisi un produit ;
- aucun configurateur universel ;
- Signature facturée une fois par identité.

### 9. Packs

Titre :

> **Équipez un parcours, pas une étagère.**

Pack Local :

> entrée + comptoir.

Pack Parcours :

> plusieurs points d’action dans un même lieu.

Média :

- composition photographiée dans un lieu ;
- plan simplifié entrée/table/caisse.

Critères :

- une image montre tous les supports ;
- prix et économie éventuelle justifiés ;
- chaque destination peut être indépendante.

### 10. Matière et fabrication

Titre :

> **La matière d’abord. Les promesses ensuite.**

Conserver l’honnêteté actuelle, mais ajouter :

- photos macro ;
- dimensions ;
- épaisseur ;
- méthode d’impression ;
- fixation ;
- entretien ;
- emballage ;
- test NFC/QR.

Critères :

- aucune visualisation présentée comme photo ;
- statut pré-série clair ;
- origine exacte ;
- matériaux uniquement disponibles.

### 11. Tapote Link et Pilot

Titre :

> **Le support reste. Le lien évolue.**

Colonne Link inclus :

- activation ;
- destination modifiable ;
- état du support ;
- stats essentielles.

Colonne Pilot Pro :

- 7/30/90 jours ;
- lieux ;
- supports ;
- NFC/QR ;
- export ;
- historique.

Média :

- interface ;
- données marquées « démonstration ».

Critères :

- Link n’est jamais présenté comme fonction payante ;
- Pilot prend moins de place que le produit ;
- prix et statut bêta clairs.

### 12. Ce que le prix comprend

Titre :

> **Prêt à poser, pas seulement imprimé.**

Inclure :

- support ;
- impression ;
- NFC ;
- QR ;
- encodage ;
- destination initiale ;
- test ;
- BAT si personnalisé ;
- Link.

Ajouter :

- délai ;
- livraison ;
- garantie.

Critères :

- prix visible dans ou juste avant la section ;
- aucun élément vendu deux fois ;
- conditions accessibles.

### 13. Premier cas client

Titre de travail :

> **Chez [Lieu], chaque passage en caisse peut devenir un avis.**

Structure :

- problème ;
- emplacement ;
- support ;
- durée ;
- interactions ;
- actions finales si mesurables ;
- citation ;
- photo.

Critères :

- autorisation écrite ;
- période ;
- base de calcul ;
- distinction NFC/QR ;
- aucun résultat extrapolé.

Si aucun cas n’est prêt :

> « Série pilote en cours » + protocole, sans faux logo.

### 14. Avis

Titre :

> **Des retours de lieux qui l’utilisent vraiment.**

Média :

- avis commande vérifiée ;
- photo utilisateur facultative.

Critères :

- source ;
- date ;
- produit ;
- consentement ;
- aucun avis généré.

### 15. FAQ

Questions minimales :

1. quels téléphones sont compatibles ?
2. que se passe-t-il sans NFC ?
3. faut-il une application ?
4. puis-je changer le lien ?
5. que contient le prix ?
6. quel délai ?
7. comment envoyer le design ?
8. qu’est-ce que le BAT ?
9. puis-je équiper plusieurs lieux ?
10. que se passe-t-il si le support arrive endommagé ?

Critères :

- réponses de deux à cinq phrases ;
- liens vers CGV et devis ;
- données structurées FAQ seulement si contenu visible.

### 16. Pro & multi-sites

Titre :

> **10 supports, plusieurs lieux ou plusieurs équipes ?**

Texte :

> Nous préparons la composition, les destinations, le BAT, la production et le déploiement dans une seule proposition.

Deux CTA :

- Demander un devis ;
- Acheter 1 à 9 supports.

Critères :

- auto-segmentation explicite ;
- délai de réponse annoncé ;
- champs volume, lieux, action et date.

### 17. CTA final

Titre :

> **Quel est le premier moment que vous voulez équiper ?**

CTA :

- Voir la boutique ;
- Parler d’un déploiement.

Rassurance :

- NFC + QR ;
- Link inclus ;
- paiement sécurisé ;
- BAT personnalisé.

Critères :

- visible avant footer ;
- pas de nouvelle information ;
- deux chemins seulement.

### 18. Footer

Colonnes :

- Acheter ;
- Découvrir ;
- Pro ;
- Aide ;
- Légal.

Ajouter :

- FAQ ;
- cas ;
- contact ;
- délais ;
- garanties ;
- compte ;
- cookies si utilisés.

Critères :

- année dynamique ;
- contact réel ;
- aucune newsletter sans consentement et stratégie.

---

## 11. Critères d’acceptation globaux

### Preuve

- aucune marque sans autorisation ;
- aucune donnée de démonstration non étiquetée ;
- aucune matière non commandable ;
- aucune origine non justifiée ;
- aucun mockup présenté comme photo ;
- chaque délai et garantie relié aux CGV.

### Média

- hero WebGL avec fallback ;
- une seule vidéo autoplay, muted et contrôlable ;
- poster ;
- sous-titres ;
- `prefers-reduced-motion` ;
- images AVIF/WebP ;
- alt text ;
- aucune vidéo presse dans le chemin principal.

### Conversion

- produit et prix avant le premier tiers de page ;
- CTA boutique dans le hero ;
- CTA Pro dans le hero ou immédiatement après ;
- FAQ avant le CTA final ;
- CTA final avant footer ;
- 1–9 et 10+ toujours distingués.

### Mobile

- aucun débordement ;
- CTA empilés ;
- sections produits sous 1 500 px si possible ;
- FAQ maniable au pouce ;
- menu fermé par défaut ;
- WebGL dégradé proprement ;
- vidéo non bloquante.

### Performance

- LCP mobile mesuré ;
- poids WebGL maîtrisé ;
- vidéo différée ;
- images responsives ;
- CLS nul ou faible ;
- chat non prioritaire ;
- scripts marketing consentis.

---

## 12. Sources

### Pages VKARD

- [Accueil](https://vkard.io/)
- [Catalogue](https://vkard.io/produits-connectes-nfc/)
- [Produits personnalisés](https://vkard.io/produits-nfc-personnalises/)
- [Produits prêts](https://vkard.io/produits-nfc-non-personnalises/)
- [PVC](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-pvc/)
- [Métal](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-hybride-metal-argent/)
- [Desk](https://vkard.io/produit/vkard-desk-stars-avis/)
- [Comment ça marche](https://vkard.io/comment-ca-marche/)
- [Plans](https://vkard.io/plans-pricing/)
- [Entreprises](https://vkard.io/lp/carte-de-visite-nfc-bl/)
- [Devis](https://vkard.io/devis-carte-de-visite-nfc-connectee/)
- [Cas](https://vkard.io/case-studies/)
- [BMW](https://vkard.io/digitaliser-lexperience-client-avec-elegance-chez-bmw-paris/)
- [FAQ](https://vkard.io/vos-questions/)
- [Presse](https://vkard.io/presse/)

### Tapote

- [Landing actuelle](../src/StorefrontV3.jsx)
- [Hero WebGL](../src/storefront/Hero3D.jsx)
- [Benchmark total précédent](31-BENCHMARK-VKARD-TOTAL-ET-PLAN-TAPOTE.md)

---

## Conclusion

VKARD gagne aujourd’hui par accumulation cohérente :

> promesse → sécurité → logos → aspiration → bénéfice → geste → produit → logiciel → entreprise → cas → FAQ → avis.

Tapote possède déjà :

- une meilleure différence de catégorie ;
- une identité plus actuelle ;
- un vrai WebGL ;
- une offre par lieu ;
- des packs ;
- une transparence honnête.

Ce qui lui manque est précisément visible :

> produit réel → prix → vidéo du geste → preuve matière → cas → avis → FAQ → fermeture commerciale.

La landing Tapote finale ne doit pas être une copie de 9 760 px de VKARD. Elle doit reprendre chaque fonction utile, éliminer les répétitions et ajouter ce que VKARD maîtrise moins :

- personnalisation des supports de lieu ;
- packs par parcours ;
- preuve physique ;
- séparation nette Link/Pilot ;
- transparence pré-série ;
- vrai 3D avec fallback ;
- décision boutique ou multi-site.

Le standard final est simple :

> **à n’importe quel endroit de la page, le visiteur comprend l’objet, voit le geste, croit le produit et sait quoi faire ensuite.**
