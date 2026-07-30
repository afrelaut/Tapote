# Benchmark total VKARD et plan de dépassement Tapote

Date : 30 juillet 2026  
Périmètre : site public VKARD, vidéos publiques, catalogue, fiches produits, pages marketing et commerciales ; comparaison avec toutes les routes publiques Tapote présentes dans le workspace.  
Statut : audit et décisions de travail. Aucun code n’a été modifié. Les prix Tapote restent à valider par coûts réels et ventes payées.

## Décision de fondateur

Tapote ne dépassera pas VKARD en devenant une copie de VKARD avec davantage d’options.

VKARD vend très bien une catégorie déjà comprise :

> carte de visite NFC + profil digital + gestion d’équipe.

Tapote doit posséder une catégorie plus large et plus concrète :

> **des points d’action physiques NFC + QR, personnalisés et pilotables, placés au bon moment dans un lieu.**

La promesse reste :

> **Un geste. La bonne action.**

Et sa traduction commerciale :

> **Tapote transforme chaque point de contact de votre lieu en action mesurable.**

Le plan recommandé tient en six décisions :

1. conserver une **vraie boutique**, distincte de la personnalisation ;
2. faire choisir d’abord **l’objet ou le pack**, puis seulement son mode de création ;
3. remplacer le configurateur universel par **trois moteurs adaptés** : Card Builder, Studio Plaque & Comptoir, service Tapote Signature ;
4. produire une **pré-série réelle**, des photos et des vidéos macro avant de chercher un effet 3D complexe ;
5. séparer clairement **achat 1–9 supports** et **projet 10+, réseau ou multi-site** ;
6. publier uniquement les preuves que Tapote peut démontrer : matière, dimensions, délai, garantie, rendu, fonctionnement, pilotes et résultats mesurés.

L’objectif n’est pas d’ajouter des pages et des réglages. L’objectif est que chaque visiteur puisse répondre sans effort à cinq questions :

- Quel objet correspond à mon emplacement ?
- À quoi ressemblera-t-il réellement ?
- Que se passe-t-il quand on tapote ou scanne ?
- Combien cela coûte et quand vais-je le recevoir ?
- Que dois-je faire maintenant ?

---

## 1. Méthode, niveau de preuve et limites

### Légende

- **[V] Vérifié** : directement observé dans le navigateur, le DOM public, la vidéo publique ou le code Tapote.
- **[D] Déclaration vendeur** : affirmation affichée par VKARD, non vérifiée indépendamment.
- **[I] Inférence** : lecture stratégique ou recommandation à tester.
- **[ÀV] À vérifier** : point détecté mais insuffisamment robuste pour être présenté comme un défaut certain.

### Périmètre VKARD inspecté

L’audit a couvert :

- accueil ;
- catalogue global ;
- catégorie personnalisée ;
- catégorie prête à l’emploi ;
- fiche PVC personnalisée ;
- fiche métal hybride ;
- produit de comptoir pour avis ;
- fonctionnement ;
- Offre Pro ;
- Entreprises ;
- Démo & Devis ;
- cas clients et plusieurs détails ;
- FAQ ;
- presse ;
- compte ;
- panier vide ;
- vidéos publiques de présentation, produit et presse.

### Périmètre Tapote inspecté

Routes vérifiées dans le code et, pour les principales, dans le navigateur local :

- `/`
- `/boutique`
- `/categorie/*`
- `/produits/:slug`
- `/personnaliser`
- `/designs`
- `/secteurs`
- `/secteurs/:slug`
- `/comment-ca-marche`
- `/tapote-pilot`
- `/panier`
- `/devis`
- `/commande`
- `/commande/confirmee`
- `/mentions-legales`
- `/cgv`
- `/confidentialite`

Source interne : [src/StorefrontV3.jsx](../src/StorefrontV3.jsx).

### Limite responsive

Le responsive Tapote a pu être observé dans un viewport étroit d’environ 433 px. Aucun débordement horizontal évident n’a été constaté sur l’accueil et le Studio.

L’émulation étroite n’a pas été appliquée de façon fiable à l’onglet VKARD contrôlé : sa largeur interne est restée proche de 2 195 px. Ce benchmark **ne conclut donc pas** que VKARD est bon ou mauvais sur mobile. Une vérification manuelle sur iPhone et Android reste obligatoire.

---

## 2. Le système commercial VKARD

### 2.1 Architecture de navigation

Navigation principale observée **[V]** :

- Commander ;
- Comment ça marche ;
- Démo & Devis ;
- Offre Pro ;
- Entreprises ;
- compte ;
- panier.

VKARD sépare cinq intentions :

| Intention | Entrée |
| --- | --- |
| Acheter immédiatement | Commander |
| Comprendre | Comment ça marche |
| Parler à un commercial | Démo & Devis |
| Ajouter le logiciel avancé | Offre Pro |
| Déployer en équipe | Entreprises |

Cette séparation est l’un de ses plus grands avantages. Le visiteur n’a pas besoin de comprendre l’entreprise entière avant de choisir sa voie.

### 2.2 Parcours d’accueil

Ordre observé sur l’[accueil VKARD](https://vkard.io/) **[V]** :

1. origine annoncée et livraison ;
2. hero avec vidéo et deux CTA, achat et équipe ;
3. quatre blocs de rassurance ;
4. logos et avis Google ;
5. bénéfices ;
6. fonctionnement en trois étapes ;
7. gamme de produits ;
8. logiciel et dashboard ;
9. fonctionnalités entreprises ;
10. études de cas ;
11. témoignages ;
12. FAQ ;
13. avis produits ;
14. footer riche.

Le système répète toujours la même chaîne :

> objet réel → geste → résultat digital → gestion → preuve → achat.

Le site est parfois long et redondant, mais il réduit beaucoup plus d’objections que Tapote aujourd’hui.

### 2.3 Catalogue

Le [catalogue VKARD](https://vkard.io/produits-connectes-nfc/) présente **[V]** :

- cartes personnalisées ;
- produits prêts à l’emploi ;
- produits dédiés aux avis Google ;
- accessoires.

Prix publics observés le 30 juillet 2026 **[V]** :

| Produit VKARD | Prix affiché |
| --- | ---: |
| Custom PVC | 49 € HT |
| Custom bambou | 54 € HT |
| Custom métal | 79 € HT |
| Carte prête à l’emploi | 29 € HT |
| Desk | 49 € HT |
| Square | 29 € HT |
| Produit avis Google | 24,90 € HT |

Ces prix sont des points de repère concurrentiels, pas une raison d’aligner Tapote. Les coûts, la taille, le service graphique, la logistique et la valeur d’usage ne sont pas identiques.

La [catégorie personnalisée](https://vkard.io/produits-nfc-personnalises/) montre quatre cartes, des GIF, le prix et l’ajout panier **[V]**.

La [catégorie prête à l’emploi](https://vkard.io/produits-nfc-non-personnalises/) promet une livraison sous 72 h et regroupe cartes, porte-clés, nano-produits et produits d’avis **[D]**.

Tapote ne doit pas reprendre la dispersion par accessoires. Les packs par parcours sont plus cohérents avec sa promesse.

### 2.4 Fiche Custom PVC

La [fiche VKARD Custom PVC](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-pvc/) comprend **[V]** :

- galerie ;
- badge best-seller ;
- note et volume d’avis ;
- prix de 49 € HT ;
- choix de couleur ;
- unité ou pack ;
- compléments ;
- quantité et ajout panier ;
- délai annoncé de cinq jours après BAT ;
- garantie annoncée de deux ans ;
- onglets détails, livraison, caractéristiques et remises ;
- bénéfices ;
- aperçu du dashboard ;
- quatre étapes de commande ;
- vidéo ;
- plus de 430 avis affichés ;
- FAQ ;
- CTA final ;
- renvoi vers l’offre Pro.

Les nombres d’avis, le délai et la garantie sont bien affichés par VKARD **[V]**, mais leur exactitude opérationnelle reste une déclaration du vendeur **[D]**.

### 2.5 Fiche métal

La [fiche métal argent](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-hybride-metal-argent/) affiche **[V]** :

- prix de 79 € HT ;
- 113 avis ;
- galerie et GIF ;
- vidéo en boucle ;
- fonctionnement ;
- bénéfices ;
- dashboard ;
- FAQ ;
- produits liés ;
- CTA final.

La construction est décrite comme hybride : acier et couche plastique permettant le fonctionnement NFC **[D]**.

VKARD revendique également 20 000 entreprises **[D]**. Ce compteur ne doit pas être utilisé comme une preuve indépendante.

### 2.6 Produit de comptoir

La [fiche VKARD Desk Stars](https://vkard.io/produit/vkard-desk-stars-avis/) comprend **[V]** :

- plusieurs visuels, dont les dimensions ;
- prix de 49 € HT ;
- quatre avis affichés ;
- achat direct ;
- FAQ ;
- produits liés ;
- vidéo en boucle.

Le produit n’est pas fortement personnalisé. Tapote a donc une ouverture : faire du chevalet et de la plaque de vrais objets de marque, pas une carte collée sur un support générique.

### 2.7 Fonctionnement, logiciel et équipes

La page [Comment ça marche](https://vkard.io/comment-ca-marche/) explique **[V]** :

- le geste NFC ;
- le profil ;
- la mise à jour ;
- l’absence de carte papier ;
- la compatibilité générale ;
- l’achat.

La page [Offre Pro](https://vkard.io/plans-pricing/) présente **[V]** :

- Gratuit ;
- Pro ;
- Entreprise ;
- une matrice de fonctionnalités ;
- un prix Pro de 2,90 € par profil et par mois.

La page [Entreprises](https://vkard.io/lp/carte-de-visite-nfc-bl/) segmente **[V]** :

- 1 à 5 cartes ;
- 6 cartes et plus ;
- produits ;
- gestion de réseau ;
- partage ;
- CRM ;
- réduction du papier ;
- langues ;
- témoignages ;
- presse.

La page [Démo & Devis](https://vkard.io/devis-carte-de-visite-nfc-connectee/) combine choix produits et formulaire de qualification **[V]**.

### 2.8 Preuves

L’index des [cas clients VKARD](https://vkard.io/case-studies/) présente treize cartes sur sa première page et une pagination **[V]**.

Exemples de détails vérifiés :

- [BMW Paris](https://vkard.io/digitaliser-lexperience-client-avec-elegance-chez-bmw-paris/)
- [Banque Populaire](https://vkard.io/transition-vers-les-cartes-de-visite-digitales-chez-banque-populaire/)
- [Panasonic Connect](https://vkard.io/panasonic-connect-reinvente-son-networking-dans-lere-numerique/)

Logos et marques affichés : Turismo, BMW, LX, Aubergistes, Pandora, Banque Populaire, Gripple, Panasonic, Decathlon, WIIO et d’autres **[V]**.

Ces cas sont publiés par VKARD : ils sont utiles comme preuve commerciale, mais pas équivalents à une étude indépendante **[D]**.

La [FAQ](https://vkard.io/vos-questions/) traite **[V]** :

- envoi du design ;
- fonctionnement ;
- profil ;
- mises à jour ;
- application ;
- compatibilité téléphones ;
- sécurité ;
- abonnement ;
- prix entreprise.

La page [Presse](https://vkard.io/presse/) regroupe des apparitions France Bleu, France 3, Le Figaro TV, BFM, BSmart et Ouest-France **[V]**. La présence média crée de l’autorité, mais ne prouve ni la qualité du produit ni son impact client.

### 2.9 Compte et panier

La page [Mes comptes](https://vkard.io/mes-comptes/) sépare **[V]** :

- compte d’achat WooCommerce ;
- dashboard d’administration ;
- identifiants distincts explicitement annoncés.

C’est une friction architecturale que Tapote pourra dépasser avec un compte unifié lorsque le besoin sera réel.

Le panier vide VKARD s’ouvre en tiroir depuis le header et affiche simplement « Aucun article dans le panier » **[V]**. Aucun ajout produit n’a été réalisé pendant l’audit.

---

## 3. Design et composants VKARD

### Ce qui fonctionne

- typographie ronde et accessible ;
- palette bleu nuit, cyan, blanc et dégradés ;
- grands rayons d’angle ;
- espaces généreux ;
- alternance de fonds clairs et de bandes noires ;
- CTA répétés ;
- cartes produit explicites ;
- grilles de logos ;
- galeries riches ;
- FAQ et preuve près de la décision ;
- visuels de téléphone pour matérialiser le résultat digital ;
- prix, livraison et garantie à proximité du bouton.

### Ce qui est moins bon

- pages très longues ;
- répétitions de menus, produits liés et CTA ;
- coexistence de modèles de pages anciens et récents ;
- DOM lourd et nombreux composants WordPress/WooCommerce **[I]** ;
- fautes visibles, par exemple « Confidendialité » et certaines formulations ;
- éléments anglais résiduels dans certains composants ;
- boutique et logiciel séparés par deux comptes ;
- année 2025 encore visible dans le footer observé en 2026 ;
- preuves parfois davantage déclaratives que démontrées ;
- catalogue dispersé par accessoires ;
- vidéos au style parfois daté.

Conclusion : VKARD est commercialement complet, mais pas intouchable visuellement ni techniquement.

---

## 4. Vidéos, animations et fausse urgence autour de la 3D

### Ce qui est réellement présent

Sur l’accueil VKARD **[V]** :

- une vidéo MP4 en lecture automatique, muette et bouclée ;
- des photos ;
- des GIF produit.

Sur les fiches PVC et métal **[V]** :

- photos multi-angles ;
- GIF ;
- courte vidéo en boucle ;
- vidéo YouTube longue.

Aucun `canvas`, `model-viewer` ou moteur WebGL public n’a été détecté sur les pages inspectées **[V]**.

La sensation « 3D » vient donc surtout :

- de vraies prises de vue ;
- de rotations pré-rendues ;
- de GIF ;
- de vidéos multi-angles ;
- de lumière et de cadrages propres.

Tapote n’a pas besoin de financer une scène 3D interactive avant d’avoir de bons prototypes. Une pré-série photographiée professionnellement donnera beaucoup plus de crédibilité.

### Vidéo de présentation courte

Vidéo fournie par le fondateur : [VKARD Presentation Français](https://youtu.be/JBGCYMsMQMQ).

Éléments vérifiés **[V]** :

- durée affichée d’environ 38 secondes ;
- vidéo non répertoriée ;
- description centrée sur carte connectée NFC et plateforme SaaS.

Storyboard observé :

1. pile de cartes papier et problème des coordonnées ;
2. objet VKARD en rotation ;
3. geste NFC avec téléphone ;
4. profil personnalisé ;
5. dashboard de gestion ;
6. clôture de marque.

La structure à reprendre, sans copier les images :

> problème → objet réel → geste → résultat → gestion → CTA.

Pour Tapote, le scénario doit montrer un **lieu** :

1. une personne arrive au comptoir ;
2. elle tapote ou scanne ;
3. l’avis, le menu ou la réservation s’ouvre ;
4. le commerçant change le lien ;
5. plusieurs supports et moments sont visibles ;
6. « Un geste. La bonne action. »

### Vidéo produit longue

La vidéo [PVC VKARD](https://www.youtube.com/watch?v=DF3nP_7oko0) dure environ 3 min 33 s **[V]**. Elle part du problème des cartes perdues et des suivis oubliés, puis explique le système.

Usage recommandé pour Tapote :

- pas dans le hero ;
- en milieu de fiche produit ou page Fonctionnement ;
- chapitrée ;
- orientée objections et démonstration.

### Métal et presse

Deux identifiants YouTube métal ont renvoyé le même titre « VKARD Custom Metal » et une durée d’environ 2 min 01 s **[V]**. La redondance laisse penser à deux intégrations du même contenu.

La vidéo BFM publique [VKARD – BFM Le Pitch S](https://vimeo.com/832576826) dure 3 min 55 s **[V]**. Elle est décrite comme le pitch de Thibaut Oger devant Frédéric Mazzella, publiée le 2 juin 2023.

Fonction stratégique :

- autorité et presse ;
- rassurance de marque ;
- pas démonstration principale du produit.

Tapote ne doit pas chercher la presse avant d’avoir une démonstration et des clients pilotés.

---

## 5. Audit de Tapote, route par route

### 5.1 Accueil `/`

Présent **[V]** :

- bandeau NFC + QR ;
- livraison offerte dès 69 € ;
- Link inclus et Pilot optionnel ;
- navigation ;
- hero « Le bon geste, au bon moment » ;
- fonctionnement ;
- trois objets ;
- transparence matière ;
- Link / Pilot ;
- contenu du prix.

Forces :

- identité plus contemporaine que VKARD ;
- positionnement lieu/action plus distinctif ;
- transparence sur la pré-série ;
- architecture visuelle cohérente.

Manques P0 :

- entrée boutique concrète avec produits, prix ou packs ;
- preuve matérielle réelle ;
- FAQ ;
- trois moteurs de création ;
- preuve client honnête ;
- CTA final ;
- vraie démonstration vidéo de 20 à 35 secondes.

Le bouton « Voir le geste en 30 s » ouvre la page Fonctionnement au lieu d’une vidéo **[V]**. La formulation crée une attente non tenue.

### 5.2 Boutique `/boutique`

Présent **[V]** :

- trois objets ;
- deux packs ;
- prix ;
- modes prêt/personnalisé ;
- ajout rapide ;
- lien fiche produit ;
- devis volume.

Prix actuels observés dans la version locale **[V]** :

- Comptoir : 69 € ;
- Plaque : 59 € ;
- Card : 39 € ;
- Pack Local : 119 € ;
- Pack Parcours : 299 €.

Le problème n’est pas l’absence de boutique : elle existe déjà. Il faut la rendre crédible et plus simple.

Écarts :

- le choix prêt/personnalisé arrive trop tôt ;
- les vrais rendus matières manquent ;
- chaque produit ne montre pas clairement dimensions, délai, garantie et contenu ;
- les catégories ne sont pas réellement filtrées ;
- le mode « personnalisé » renvoie encore vers un moteur universel.

Décision :

> le visiteur choisit d’abord Comptoir, Plaque, Card ou Pack ; le bon parcours de création apparaît ensuite.

### 5.3 Catégories `/categorie/*`

Le routeur envoie toutes les URLs de catégorie vers la même boutique générique **[V]**.

Conséquences :

- promesse de catégorie non tenue ;
- mauvais potentiel SEO ;
- difficulté à partager une collection précise ;
- aucune progression claire vers la fiche produit.

P0 :

- filtrer réellement chaque catégorie, ou rediriger vers `/boutique` tant que les pages ne sont pas prêtes.

P1 :

- créer des pages indexables par produit et intention :
  - chevalets/comptoirs ;
  - plaques ;
  - cartes ;
  - packs.

### 5.4 Fiches `/produits/:slug`

Les fiches Comptoir, Plaque et Card partagent une structure **[V]** :

- scène produit ;
- prix ;
- quantité ;
- inclus ;
- détails ;
- caractéristiques ;
- contenu de la boîte ;
- usages.

Manques :

- galerie réelle ;
- zoom matière ;
- dimensions illustrées ;
- disponibilité ;
- délai précis ;
- garantie ;
- livraison ;
- FAQ ;
- preuve ;
- vidéos ;
- pack associé ;
- CTA final ;
- choix de création propre à l’objet.

Décision P0 :

> une fiche produit doit permettre d’acheter sans avoir besoin d’aller chercher l’information ailleurs.

### 5.5 Studio `/personnaliser`

Le Studio contient **[V]** :

- choix activité ;
- support ;
- quantité ;
- composition ;
- environ dix-huit actions ;
- destination ;
- prêt/personnalisé ;
- thèmes ;
- logo ;
- couleurs ;
- texte ;
- aperçu.

Le travail est riche, mais la richesse apparaît au mauvais moment.

Problèmes :

- même moteur pour une carte recto/verso, une plaque et un chevalet ;
- charge cognitive très forte ;
- trop d’actions en premier plan ;
- hiérarchie de production ambiguë ;
- risque de produire une interface de PAO qui ne garantit pas un fichier fabricable ;
- très longue page sur mobile.

Décision :

- ne pas supprimer la personnalisation ;
- la répartir entre trois moteurs ;
- garder des grilles verrouillées ;
- protéger zones NFC, QR, marges, contraste et lisibilité.

### 5.6 `/designs`, `/secteurs`, `/secteurs/:slug`

Ces routes rejoignent le même Studio **[V]**.

Problèmes :

- `/designs` ne montre pas une galerie de designs ;
- `/secteurs` ne présente pas un contenu sectoriel ;
- `/secteurs/restaurants` a retourné une page 404 pendant l’audit **[V]** ;
- plusieurs promesses SEO différentes conduisent à la même expérience.

P0 :

- masquer ces entrées de la navigation ;
- corriger les slugs et redirections ;
- ne conserver que des URLs dont le contenu correspond au titre.

P1 :

- `/designs` devient une vraie galerie filtrable ;
- `/secteurs/:slug` devient une landing avec moments, actions, produits et pack adapté ;
- commencer uniquement avec deux ou trois secteurs prouvés.

### 5.7 Fonctionnement `/comment-ca-marche`

Forces :

- geste NFC + QR clair ;
- fonctionnement en trois étapes ;
- Link inclus ;
- Pilot optionnel.

Défaut vérifié :

- « Créer mon Tapote » pointe vers `/` au lieu de la boutique ou d’un produit **[V]**.

P0 :

- envoyer vers `/boutique` ;
- remplacer une illustration par une vidéo réelle ;
- ajouter compatibilité, QR de secours, activation et délai.

### 5.8 Pilot `/tapote-pilot`

Forces :

- interface convaincante ;
- comparaison supports/lieux ;
- périodes 7, 30, 90 jours ;
- distinction Link inclus / Pilot Pro optionnel affichée.

Risques :

- le parcours Pilot met « changer le lien » au premier plan alors que cette fonction appartient déjà à Link inclus ;
- 675 interactions, +8 %, 72 % NFC, 3/3 actifs et « il y a 16 min » ressemblent à des données clients, alors qu’elles sont une démonstration **[V]** ;
- le compte est nommé « Tapote Pilot » à plusieurs endroits, créant une confusion entre connexion et produit payant.

P0 :

- écrire « Données de démonstration » dans l’interface ;
- vendre Pilot sur l’analyse, la comparaison, l’historique et l’export ;
- conserver le changement de destination sous Tapote Link ;
- renommer l’accès compte « Se connecter ».

### 5.9 Devis `/devis`

Forces :

- formulaire simple ;
- seuil 10+ ;
- promesse multi-site ;
- consentement et envoi.

Améliorations :

- segmenter 1–9 vers la boutique et 10+ vers le devis ;
- demander nombre de lieux, nombre de supports, date cible et action principale ;
- téléphone facultatif ;
- annoncer le délai de réponse ;
- proposer un créneau seulement après soumission ;
- vérifier visuellement que le honeypot « Site web » reste bien caché **[ÀV]**.

### 5.10 Panier et commande

Forces :

- panier, résumé, quantités, suppression ;
- proposition de carte assortie ;
- bascule devis pour gros volume ;
- Stripe ;
- consentements ;
- CGV et confidentialité ;
- destination facultative avant production.

Défauts vérifiés :

- panier vide : « Créer mon Tapote » renvoie vers `/` ;
- commande vide : « Voir les produits » renvoie vers `/` **[V]**.

P0 :

- renvoyer ces deux CTA vers `/boutique`.

### 5.11 Légal

Présent **[V]** :

- mentions légales ;
- CGV B2B ;
- politique de confidentialité ;
- clauses BAT, prix, production, annulation et responsabilité.

À compléter avant vente publique :

- identité légale définitive ;
- statut TVA ;
- délais réels ;
- transporteur et zone ;
- garantie commerciale éventuelle ;
- processus conformité/réclamation ;
- durée de conservation ;
- consentement analytics et cookies selon les outils réellement utilisés.

---

## 6. Matrice des écarts

| Domaine | VKARD | Tapote aujourd’hui | Décision Tapote |
| --- | --- | --- | --- |
| Positionnement | Carte + profil + équipe | Lieu + action | Conserver l’écart |
| Boutique | Large et éprouvée | Existe, encore peu crédible | En faire le chemin principal |
| Produits | Beaucoup de cartes/accessoires | 3 objets + packs | Rester resserré |
| Fiches | Très complètes | Trop courtes | Compléter sans surcharger |
| Personnalisation | Surtout carte | Très riche, tous supports | Scinder en 3 moteurs |
| Matériaux | Photos/GIF/vidéos | Pré-série numérique | Produire et photographier |
| Prix | Visibles et segmentés | Visibles, non validés | Valider par BOM et ventes |
| Preuves | Logos, avis, cas, presse | Presque aucune | Pilotes mesurés, sans faux logos |
| Vidéo | Courte + longue + presse | Pas de vraie démo | 25 s + 90 s + cas |
| Logiciel | Gratuit/Pro/Enterprise | Link/Pilot | Clarifier l’attribution |
| B2B | Pages dédiées | Devis simple | Pro & multi-sites |
| Compte | Deux comptes | Accès encore conceptuel | Compte unique plus tard |
| SEO | Nombreuses pages | Routes génériques | Pages utiles et cohérentes |
| Conversion | CTA et rassurance répétés | Funnel inachevé | Finir chaque décision |
| Analytics | Promesse SaaS | Interface démonstration | Événements + vrais pilotes |

---

## 7. Architecture cible Tapote

### Header

Bandeau :

> NFC + QR · Tapote Link inclus · Livraison offerte dès 69 €

Navigation principale :

- Produits
- Personnaliser
- Comment ça marche
- Pro & multi-sites

Utilitaires :

- Se connecter
- Panier

CTA principal :

> Voir la boutique

Ne pas avoir deux liens nommés « Tapote Pilot ».

### Arborescence cible

```text
/
├── boutique
│   ├── produits/comptoir
│   ├── produits/plaque
│   ├── produits/carte
│   └── packs
├── personnaliser
│   ├── carte
│   ├── plaque
│   └── comptoir
├── signature
├── comment-ca-marche
├── pro
│   ├── devis
│   └── pilot
├── cas-clients
├── faq
├── panier
├── commande
└── pages-legales
```

Les pages secteurs et designs ne reviennent que lorsqu’elles possèdent un contenu autonome.

### Deux chemins commerciaux

#### 1 à 9 supports

> Boutique → produit → création adaptée → panier → paiement → BAT éventuel → production.

#### 10 supports, réseau ou multi-site

> Pro → cas d’usage → devis → qualification → recommandation → BAT → production.

---

## 8. Blueprint des pages

### 8.1 Accueil

Ordre recommandé :

1. bandeau de service ;
2. hero avec vrai produit et geste ;
3. deux CTA : « Voir la boutique » et « Équiper plusieurs lieux » ;
4. preuve de fonctionnement : NFC + QR, sans application ;
5. trois produits avec prix ;
6. vidéo 25 secondes ;
7. « Choisissez votre manière de créer » ;
8. packs par parcours ;
9. Link inclus / Pilot optionnel ;
10. matériaux et fabrication, uniquement avec faits vérifiés ;
11. premier cas pilote ;
12. FAQ ;
13. CTA final.

Tant que Tapote n’a pas de clients publiables :

- montrer la pré-série ;
- expliquer le protocole de test ;
- ne pas afficher de faux logos ;
- ne pas maquiller des données de démonstration en résultats.

### 8.2 Boutique

Premier écran :

- titre ;
- phrase d’orientation ;
- quatre onglets maximum : Comptoir, Plaque, Card, Packs ;
- grille produits ;
- chaque carte : photo réelle, usage, dimensions, prix, délai, CTA.

Filtres autorisés :

- emplacement ;
- action ;
- prêt à l’emploi / à votre image.

Éviter :

- matières non disponibles ;
- dizaines d’accessoires ;
- moteur de design dans la grille ;
- choix technique NFC.

### 8.3 Fiche produit

Structure :

1. galerie photo et boucle 8–12 s ;
2. nom, usage, prix, délai, note réelle lorsqu’elle existe ;
3. quantité ;
4. « Prêt » ou « À votre image » ;
5. CTA ;
6. ce qui est inclus ;
7. dimensions et matière ;
8. comment le geste fonctionne ;
9. les trois modes de création disponibles pour ce produit ;
10. livraison, BAT et garantie ;
11. cas d’usage ;
12. FAQ ;
13. pack associé ;
14. CTA final ;
15. lien devis 10+.

### 8.4 Card Builder

Le client modifie :

- logo ;
- nom ou promesse ;
- couleur ;
- action ;
- destination.

Le système verrouille :

- format ;
- marges ;
- contraste ;
- NFC ;
- QR ;
- verso technique ;
- zone légale ou signature.

Aperçus obligatoires :

- recto ;
- verso ;
- taille en main ;
- rendu imprimé simulé, explicitement indiqué comme aperçu.

### 8.5 Studio Plaque & Comptoir

Le client choisit :

- action ;
- composition parmi 3 à 5 grilles ;
- logo ;
- couleurs ;
- texte ;
- destination ;
- variante Plaque ou Comptoir.

Le système verrouille :

- emplacement NFC ;
- QR ;
- contraste ;
- taille minimale ;
- marges de production ;
- découpe ;
- orientation ;
- hiérarchie.

Le Studio doit produire un brief de production et un BAT, pas un fichier arbitraire.

### 8.6 Tapote Signature

Service humain :

- brief ;
- direction graphique ;
- composition ;
- BAT ;
- une correction légère ;
- fichiers de production.

Prix test recommandé :

> **49 € par identité ou composition**, une seule fois par commande.

Ne pas facturer ce service par unité si le même visuel est reproduit.

### 8.7 Pro & multi-sites

Contenu :

- pour qui ;
- seuil et volume ;
- déploiement ;
- cohérence multi-supports ;
- gestion des destinations ;
- Pilot ;
- exemples ;
- délai de devis ;
- CTA.

Segment clair :

- 1–9 : acheter ;
- 10+ : demander un devis ;
- multi-site : parler du déploiement, pas seulement d’une remise.

### 8.8 Cas client

Format :

1. contexte ;
2. moment physique ;
3. problème ;
4. composition Tapote ;
5. installation ;
6. période de mesure ;
7. résultats ;
8. limites ;
9. citation ;
10. photo réelle ;
11. CTA pour le même secteur.

Un seul bon cas, avec protocole clair, vaut mieux que dix logos sans histoire.

---

## 9. Offre et prix

### Règle

Le prix public doit être calculé à partir de :

```text
matière
+ puce NFC / QR
+ impression / gravure
+ découpe / assemblage
+ rebut
+ emballage
+ préparation
+ temps graphique
+ paiement
+ transport subventionné
+ SAV / remplacement
+ marge
```

Les prix actuels ne doivent pas être considérés comme validés avant :

- devis fournisseurs à 1, 10, 25, 50 et 100 unités ;
- prototypes ;
- contrôle du taux de rebut ;
- coût du BAT et du temps humain ;
- marge contributive cible ;
- entretiens de prix ;
- au moins trois commandes payées.

### Architecture d’offre recommandée

| Offre | Rôle | Prix actuel / test | Statut |
| --- | --- | ---: | --- |
| Tapote Comptoir | Caisse, accueil, table | 69 € | À valider |
| Tapote Plaque | Mur, entrée, miroir | 59 € | À valider |
| Tapote Card | Équipe, relation directe | 39 € | À valider |
| Pack Local | Comptoir + Plaque | 119 € | À valider |
| Pack Parcours | Plusieurs moments | 299 € | À valider |
| Tapote Signature | Travail graphique | 49 € / identité | Test recommandé |
| Tapote Link | Activation et changement de destination | Inclus | Positionnement |
| Pilot Pro | Analyses avancées | 9 €/mois ou 89 €/an / organisation | Hypothèse |

### Présentation fiscale

Le libellé actuel « net de TVA » est inhabituel **[V]**.

Choisir l’un des deux modèles selon le statut réel :

- franchise : « TVA non applicable, art. 293 B du CGI » ;
- assujetti : prix HT et TTC selon le public et les obligations applicables.

Ce point doit être confirmé par le comptable avant publication.

### Comparaison VKARD

Ne pas gagner par un prix inférieur à 49 € HT.

Gagner par :

- objet adapté au lieu ;
- personnalisation réellement visible ;
- pack de parcours ;
- support prêt à poser ;
- destination modifiable ;
- preuve matière ;
- service de design clair ;
- expérience plus simple.

---

## 10. Pré-série, matières et preuve produit

Le problème actuel n’est pas seulement le matériau. C’est l’absence de preuve d’un **produit fini intentionnel**.

### Cahier des charges pré-série

Pour chaque produit :

- matière ;
- épaisseur ;
- dimensions ;
- poids ;
- finition ;
- méthode d’impression ;
- résistance à l’essuyage ;
- stabilité ;
- adhésif ou fixation ;
- emplacement de la puce ;
- portée NFC ;
- lisibilité QR ;
- compatibilité iOS et Android ;
- tolérance couleur ;
- emballage ;
- remplacement ;
- délai.

### Quantité de départ

Produire assez pour :

- contrôle qualité ;
- photos ;
- vidéo ;
- envoi à pilotes ;
- test de transport ;
- échantillon conservé ;
- comparaison de deux fournisseurs.

Il n’est pas nécessaire de commander une grande série pour créer la preuve. Une pré-série propre suffit.

### Shot list par SKU

Obligatoire :

1. hero trois-quarts ;
2. face ;
3. dos ;
4. tranche et épaisseur ;
5. main pour l’échelle ;
6. macro impression ;
7. zone NFC ;
8. QR ;
9. geste sur iPhone ;
10. geste sur Android ;
11. installation ;
12. produit dans son contexte ;
13. emballage ;
14. composition complète d’un pack ;
15. boucle 8–12 s ;
16. test d’essuyage ;
17. mesure illustrée.

### Critères visuels

- lumière douce et contrôlée ;
- couleurs calibrées ;
- pas de rendu plastique trompeur ;
- une photo neutre et une photo contexte ;
- pas de mockup 3D présenté comme photo ;
- alt text descriptif ;
- fichiers WebP/AVIF ;
- variantes desktop et mobile.

### Ce qu’il ne faut pas publier avant preuve

- « fabriqué en France » sans traçabilité ;
- « écoresponsable » sans périmètre ;
- « incassable » ;
- « waterproof » sans test ;
- portée NFC précise sans protocole ;
- délai fixe non contractuel ;
- sécurité de niveau élevé sans audit ;
- économie ou taux de conversion sans étude.

---

## 11. Preuve client et marketing

### Échelle de preuve

1. démonstration technique ;
2. prototype réel ;
3. pilote installé ;
4. témoignage nominatif autorisé ;
5. résultat mesuré ;
6. cas complet ;
7. avis indépendant ;
8. presse.

Tapote est aujourd’hui entre 1 et 2. Il faut progresser dans l’ordre.

### Programme pilote

Choisir cinq lieux maximum :

- deux restaurants/cafés ;
- deux beauté/coiffure ;
- un hébergement ou lieu d’accueil.

Pour chaque pilote :

- photographier avant ;
- définir l’action ;
- définir l’emplacement ;
- installer ;
- vérifier NFC et QR ;
- mesurer 30 jours ;
- interviewer J+7 et J+30 ;
- demander l’autorisation de publier ;
- distinguer visites, scans, taps et action finale lorsque mesurable.

### Message marketing

Éviter :

- « la meilleure solution » ;
- « révolutionnaire » ;
- « augmente vos avis » sans données ;
- « fait en France » par mimétisme ;
- faux compteurs.

Préférer :

- « NFC + QR, aucune application » ;
- « prêt à poser » lorsque vrai ;
- « votre logo, vos couleurs, votre action » ;
- « la destination peut évoluer » ;
- « pré-série en cours » tant que nécessaire ;
- résultats avec période et base de calcul.

### Contenu

Priorités :

1. vidéo de 25 secondes ;
2. photos matière ;
3. guide « où placer son Tapote » ;
4. FAQ ;
5. premier cas pilote ;
6. comparaison Comptoir / Plaque / Card ;
7. page secteur uniquement après preuve.

---

## 12. Conversion, analytics et expérience

### Événements minimaux

| Événement | Signification |
| --- | --- |
| `shop_view` | boutique vue |
| `product_view` | fiche vue |
| `product_media_play` | vidéo lancée |
| `creation_mode_select` | prêt, studio ou Signature |
| `customize_start` | première modification |
| `customize_complete` | configuration valide |
| `add_to_cart` | produit ajouté |
| `cart_view` | panier vu |
| `checkout_start` | commande commencée |
| `purchase` | paiement confirmé |
| `quote_start` | devis commencé |
| `quote_submit` | devis envoyé |
| `pilot_view` | Pilot consulté |
| `login_click` | compte demandé |

Dimensions utiles :

- produit ;
- pack ;
- quantité ;
- action ;
- création ;
- secteur déclaré ;
- appareil ;
- source.

Ne pas envoyer dans l’analytics :

- URL de destination complète ;
- fichier logo ;
- nom de client ;
- contenu libre ;
- e-mail.

### KPI

- passage accueil → boutique ;
- boutique → fiche ;
- fiche → configuration ;
- configuration → panier ;
- panier → paiement ;
- devis commencé → envoyé ;
- taux de choix Signature ;
- délai de production ;
- taux de rebut ;
- tickets SAV ;
- activation ;
- interactions par support ;
- rétention Pilot.

---

## 13. Outils professionnels recommandés

Les outils doivent réduire le risque, pas multiplier les abonnements.

| Besoin | Outil / méthode | Moment |
| --- | --- | --- |
| Architecture et UI | Figma ou Penpot | Maintenant |
| Design system | Figma + tokens du repo | Maintenant |
| Backlog et décisions | Notion ou documents versionnés | Maintenant |
| Calcul prix | Tableur BOM/marge | Maintenant |
| Prototypes | Deux fournisseurs comparés | Maintenant |
| Contrôle impression | BAT PDF + gabarit fournisseur | Maintenant |
| Photos | Photographe produit ou mini-studio calibré | Après pré-série |
| Vidéo courte | Tournage produit + montage simple | Après pré-série |
| Analytics web | Matomo, Plausible ou PostHog selon besoin | P1 |
| Paiement | Stripe déjà prévu | P0 |
| Support | Boîte e-mail + réponses modèles | P0 |
| CRM devis | Notion/Airtable au début | P1 |
| Tests UX | 5 sessions filmées par parcours | P0/P1 |
| Performance | Lighthouse + WebPageTest | Avant mise en ligne |

Un connecteur Figma peut accélérer la reprise des maquettes lorsque le compte et les fichiers seront disponibles. Il n’est pas nécessaire pour prendre les décisions d’offre présentes dans ce document.

---

## 14. Plan priorisé

### P0 — rendre Tapote achetable et crédible

#### Offre

- confirmer Comptoir, Plaque, Card et deux packs ;
- fixer le seuil boutique/devis ;
- attribuer clairement Link et Pilot ;
- décider du statut Tapote Signature ;
- retirer toute option non fabricable.

#### Produit et fournisseurs

- choisir deux solutions de pré-série par SKU ;
- obtenir prix par palier ;
- documenter matière, impression, NFC, QR et délai ;
- commander prototypes ;
- tester ;
- conserver les rapports de contrôle.

#### Site

- faire de la boutique le chemin principal ;
- corriger CTA `/` vers `/boutique` ;
- corriger routes catégories, designs et secteurs ;
- séparer Card Builder et Studio Plaque/Comptoir ;
- ajouter « données de démonstration » dans Pilot ;
- renommer l’accès « Se connecter » ;
- corriger le libellé TVA ;
- retirer « Voir le geste en 30 s » tant que la vidéo n’existe pas.

#### Fiches

- galerie ;
- dimensions ;
- délai ;
- livraison ;
- garantie ;
- contenu ;
- BAT ;
- FAQ ;
- choix de création ;
- CTA final.

#### Confiance

- aucune preuve inventée ;
- statut pré-série clair ;
- compatibilité testée ;
- CGV, confidentialité et mentions à jour ;
- coordonnées de contact.

### P1 — produire la preuve et la conversion

- photographier et filmer les vrais objets ;
- publier vidéo 25 s ;
- publier vidéo explicative 60–90 s ;
- lancer cinq pilotes ;
- obtenir premier témoignage ;
- publier premier cas ;
- créer vraie FAQ ;
- créer page Pro & multi-sites ;
- enrichir le devis ;
- instrumenter les événements ;
- tester le funnel sur cinq utilisateurs ;
- créer vraies pages catégories ;
- optimiser images, performance et SEO ;
- mettre en place e-mails commande, BAT, production, expédition et activation.

### P2 — construire l’avantage durable

- compte client unifié ;
- espace de gestion autonome ;
- Pilot facturable après validation de valeur ;
- cas clients par secteur ;
- exports ;
- gestion multi-sites ;
- intégrations seulement après demande récurrente ;
- internationalisation si traction ;
- recommandation automatisée produit/pack ;
- rendus 3D interactifs uniquement si leur impact conversion est prouvé.

---

## 15. Feuille de route 30 / 60 / 90 jours

### Jours 1 à 15

- figer l’offre courte ;
- créer BOM et marge ;
- demander les devis fournisseurs ;
- choisir prototypes ;
- corriger routes et CTA P0 ;
- écrire les fiches ;
- définir grilles de création ;
- recruter cinq pilotes.

Livrable :

> une boutique compréhensible, même si les photos finales ne sont pas encore prêtes.

### Jours 16 à 45

- recevoir et tester la pré-série ;
- choisir la version ;
- photographier ;
- filmer ;
- finaliser fiches ;
- ouvrir les pilotes ;
- instrumenter le funnel ;
- tester mobile réel ;
- lancer les premières commandes.

Livrable :

> un site qui prouve le produit réel et permet de commander sans hésitation.

### Jours 46 à 90

- analyser les ventes ;
- mesurer coûts et rebut ;
- ajuster prix ;
- publier le premier cas ;
- consolider Pro ;
- décider Pilot ;
- lancer le contenu sectoriel qui correspond aux pilotes ;
- améliorer uniquement les étapes avec perte mesurée.

Livrable :

> une machine simple : produit réel, achat, installation, résultat, preuve.

---

## 16. Ce qu’il faut demander au fondateur

Pour transformer ce plan en exécution, les données nécessaires sont :

1. photos de tous les prototypes actuels, face/dos/tranche ;
2. dimensions et matière exactes ;
3. fournisseurs actuels et devis ;
4. coût des puces et de l’encodage ;
5. méthode d’impression ;
6. emballage ;
7. délai réel ;
8. statut TVA ;
9. marge minimale ;
10. garantie envisagée ;
11. villes ou lieux accessibles pour les pilotes ;
12. autorisations de logos/témoignages existantes ;
13. fonctionnement réel de Tapote Link ;
14. état technique réel de Pilot ;
15. budget prototypes, photo et acquisition ;
16. capacité de préparation par semaine.

Sans ces éléments, le bon comportement n’est pas d’inventer. Il faut afficher une pré-série honnête et collecter des demandes.

---

## 17. Tests de validation avant publication

### Produit

- NFC sur cinq iPhone et cinq Android ;
- QR à 30, 50 et 100 cm selon le support ;
- lumière faible ;
- angle ;
- écran fissuré ;
- nettoyage ;
- transport ;
- stabilité ;
- adhésif ;
- couleur ;
- rayure ;
- emballage.

### Site

- iPhone Safari ;
- Android Chrome ;
- desktop 1366 px ;
- clavier seul ;
- contraste ;
- lecture d’écran ;
- paiement test ;
- devis ;
- e-mails ;
- erreur réseau ;
- panier vide ;
- retour ;
- reconfiguration ;
- performance.

### Offre

- cinq tests utilisateurs ;
- cinq entretiens de prix ;
- trois paiements réels ;
- questions fréquentes consignées ;
- motif d’abandon ;
- temps de configuration ;
- taux de demande Signature.

---

## 18. Sources publiques vérifiées

### VKARD

- [Accueil](https://vkard.io/)
- [Catalogue](https://vkard.io/produits-connectes-nfc/)
- [Produits personnalisés](https://vkard.io/produits-nfc-personnalises/)
- [Produits prêts à l’emploi](https://vkard.io/produits-nfc-non-personnalises/)
- [Custom PVC](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-pvc/)
- [Custom métal argent](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-hybride-metal-argent/)
- [Desk Stars](https://vkard.io/produit/vkard-desk-stars-avis/)
- [Comment ça marche](https://vkard.io/comment-ca-marche/)
- [Offre Pro](https://vkard.io/plans-pricing/)
- [Entreprises](https://vkard.io/lp/carte-de-visite-nfc-bl/)
- [Démo & Devis](https://vkard.io/devis-carte-de-visite-nfc-connectee/)
- [Cas clients](https://vkard.io/case-studies/)
- [FAQ](https://vkard.io/vos-questions/)
- [Presse](https://vkard.io/presse/)
- [Mes comptes](https://vkard.io/mes-comptes/)

### Vidéos

- [Présentation française courte](https://youtu.be/JBGCYMsMQMQ)
- [Démonstration PVC](https://www.youtube.com/watch?v=DF3nP_7oko0)
- [VKARD – BFM Le Pitch S](https://vimeo.com/832576826)

### Tapote

- [Implémentation actuelle](../src/StorefrontV3.jsx)
- [Offre, marketing et machine à preuves](24-OFFRE-MARKETING-ET-PREUVES-TAPOTE-2026-07-29.md)
- [Audit initial du site entier](25-AUDIT-SITE-ENTIER-VKARD-VS-TAPOTE-2026-07-30.md)

---

## Conclusion

VKARD est devant sur la complétude, la preuve et la distribution des intentions. Il n’est pas devant parce que ses pages seraient techniquement impossibles à reproduire.

Tapote possède déjà l’idée la plus différenciante :

> plusieurs objets physiques personnalisés, placés dans un lieu, chacun relié à la bonne action.

Le risque est de cacher cette idée dans un configurateur trop vaste et des mockups trop parfaits.

Le dépassement vient donc de cette séquence :

> **vraie boutique → vrai produit → bon moteur de création → vrai geste → vraie preuve → vrai achat.**

La prochaine victoire n’est pas une nouvelle animation. C’est une pré-série qui donne envie, une fiche qui répond à tout, un prix défendable et un premier client mesuré.
