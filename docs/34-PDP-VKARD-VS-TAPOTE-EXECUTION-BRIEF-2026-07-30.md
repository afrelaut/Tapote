# Fiches produit Tapote — benchmark VKARD et brief d’exécution

Date : 30 juillet 2026  
Périmètre : Tapote Comptoir, Tapote Plaque, Tapote Card, boutique et relances Pro  
Statut : brief d’exécution indépendant, sans modification des composants en cours

## 1. Verdict

VKARD ne gagne pas par une interface plus sophistiquée. VKARD gagne parce que sa fiche produit accumule les réponses commerciales dans le bon ordre :

1. produit identifiable ;
2. prix ;
3. variantes ;
4. quantité et remise ;
5. ajout au panier ;
6. délai et garantie ;
7. spécifications ;
8. logiciel ;
9. mode d’emploi ;
10. vidéo ;
11. avis vérifiés ;
12. FAQ ;
13. relance entreprise.

Tapote possède déjà des briques plus différenciantes :

- un support qui change selon le format ;
- un décor qui change selon le secteur ;
- un téléphone dont l’écran suit l’action choisie ;
- un Studio de personnalisation intégré ;
- un aperçu imprimé synchronisé ;
- Tapote Link inclus ;
- Tapote Pilot pour le multi-support et la mesure ;
- des pages métier qui nomment l’emplacement et le moment d’usage.

La priorité n’est donc pas de copier le style VKARD. Il faut reprendre sa complétude commerciale tout en remettant les forces interactives de Tapote au centre de chaque fiche.

## 2. Ce que VKARD fait bien sur ses fiches

Sources inspectées :

- [VKARD Custom PVC](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-pvc/)
- [VKARD Desk Stars](https://vkard.io/produit/vkard-desk-stars-avis/)
- [Catalogue VKARD](https://vkard.io/produits-connectes-nfc/)
- [Landing entreprises VKARD](https://vkard.io/lp/carte-de-visite-nfc-bl/)

### Premier écran

La fiche Custom PVC expose immédiatement :

- badge best-seller ;
- livraison offerte ;
- nom du produit ;
- note et volume d’avis ;
- résumé commercial ;
- couleur ;
- pack ;
- produits complémentaires ;
- prix ;
- quantité ;
- ajout au panier ;
- délai ;
- garantie.

La densité est forte mais la décision est autonome : le visiteur n’a pas besoin de descendre pour comprendre ce qu’il achète.

### Galerie

VKARD montre plusieurs angles et contextes :

- produit isolé ;
- recto et verso ;
- main ;
- téléphone ;
- matière ;
- contexte professionnel.

La galerie sert la preuve physique, pas seulement l’ambiance.

### Architecture longue

Après l’achat, VKARD développe :

- détails ;
- délais et livraison ;
- caractéristiques ;
- remises volume ;
- bénéfices ;
- plateforme logicielle ;
- fonctions avancées ;
- quatre étapes de commande ;
- vidéo ;
- avis vérifiés ;
- FAQ produit ;
- CTA final ;
- offre entreprise.

Cette longueur est justifiée parce que chaque bloc lève une objection distincte.

### Segmentation

VKARD distingue clairement :

- achat individuel ;
- pack ;
- équipe ;
- devis volume ;
- logiciel gratuit ;
- plan Pro.

Tapote doit conserver sa propre règle plus simple :

- 1 à 9 supports : achat en ligne ;
- 10 supports ou plus : devis ;
- Tapote Link : inclus ;
- Tapote Pilot : option séparée.

## 3. État actuel des fiches Tapote

Composants inspectés :

- `ProductPage`
- `ProductPurchaseVisual`
- `BuyBox`
- `ProductExamplesSection`
- `ProductDesignShowcase`
- `ProductScene`
- `LivePhoneScreen`
- `SectorSelector`
- `PilotMarketingSection`

### Forces

1. Le BuyBox réunit produit, design, quantité, action et prix.
2. Le Studio peut modifier logo, couleurs, textes et rendu.
3. Le prix change avec la finition et la quantité.
4. Le NFC et le QR sont explicitement inclus.
5. Tapote Link est distingué de Pilot.
6. Les fiches contiennent des exemples, des détails et des produits associés.
7. Le showcase de designs diversifie déjà les univers de marque.

### Régression principale

Le hero de la fiche utilise désormais un objet isolé via `ProductPurchaseVisual`.

Cette composition perd trois avantages historiques :

- le décor métier ;
- le téléphone ;
- l’écran qui change avec l’action.

La fiche devient plus proche d’une boutique NFC générique alors que Tapote possède déjà une démonstration propriétaire beaucoup plus forte.

### Autres écarts

- Le prix, le délai et la garantie ne forment pas encore une ligne de décision aussi nette que VKARD.
- La preuve physique mélange encore visualisation, pré-série et contexte réel.
- Les matières non validées apparaissent trop près de l’achat.
- La preuve sociale ne peut pas être remplacée par des chiffres ou logos inventés.
- Les scènes métier ne sont pas assez présentes dans les fiches produit.
- La Card doit montrer explicitement recto, verso et usage en rendez-vous.
- La Plaque doit montrer fixation, tranche et pose.
- Le Comptoir doit montrer stabilité, profil et usage près du terminal de paiement.

## 4. Thèse visuelle

Un atelier numérique premium : noir encre, blanc papier, cobalt Tapote, lumière réelle, objets cadrés comme des pièces de design et interfaces montrées uniquement lorsqu’elles prouvent une action.

Deux familles d’images doivent coexister :

- preuve physique : face, dos, tranche, main, fixation, emballage ;
- preuve d’usage : lieu, téléphone, écran, action obtenue.

Une image ne doit pas essayer de remplir les deux rôles à la fois.

## 5. Architecture cible d’une fiche Tapote

### 0. Topbar et navigation

Afficher uniquement des engagements confirmés :

- NFC + QR inclus ;
- Tapote Link inclus ;
- livraison offerte dès 69 €.

### 1. Hero produit vivant

Desktop :

- gauche, 56 % : scène métier vivante ;
- droite, 44 % : identité produit et BuyBox ;
- hauteur contenue dans le premier écran autant que possible.

La scène de gauche contient :

- décor sélectionné ;
- support verrouillé sur la fiche ;
- téléphone ;
- écran synchronisé avec l’action ;
- impression synchronisée ;
- bouton ou onglets de secteur ;
- trois vues : « En situation », « Face produit », « Détail ».

Le produit ne doit jamais changer lorsqu’on change de secteur. Seuls changent :

- le décor ;
- la marque de démonstration ;
- l’action initiale ;
- le contenu du téléphone ;
- le conseil de pose.

### 2. BuyBox

Ordre recommandé :

1. prêt à servir / à votre image ;
2. action ;
3. style ou Studio ;
4. quantité ;
5. destination facultative ;
6. résumé prix ;
7. ajout au panier.

Sous le CTA :

- prix net de TVA ;
- livraison calculée ;
- délai confirmé à la prise en charge ;
- NFC + QR testés ;
- remplacement si défaut NFC confirmé.

Ne pas inventer une garantie « 2 ans » ou un délai « 5 jours » tant qu’ils ne sont pas contractuellement validés.

### 3. Rail de décision

Quatre informations maximum :

- format ;
- emplacement ;
- NFC + QR ;
- Tapote Link.

### 4. Démonstration du geste

Titre :

> Tapotez. La bonne page s’ouvre.

Trois états synchronisés :

1. le téléphone approche ;
2. la notification apparaît ;
3. la destination s’ouvre.

Actions disponibles :

- avis ;
- menu ;
- réservation ;
- contact ;
- Wi-Fi ;
- page multi-liens.

Le visiteur doit pouvoir changer l’action et constater le changement sur :

- le support ;
- l’écran ;
- la légende.

### 5. Galerie de preuve physique

Chaque fiche a sa propre grille.

#### Comptoir

- face ;
- profil ;
- base et stabilité ;
- main et téléphone ;
- caisse ou table ;
- emballage.

#### Plaque

- face ;
- tranche ;
- fixation ;
- mur ou miroir ;
- comptoir ;
- QR et zone NFC.

#### Card

- recto ;
- verso ;
- tranche ;
- portefeuille ;
- main ;
- rendez-vous.

Chaque image porte une légende factuelle. Une visualisation doit être marquée comme telle.

### 6. Designs

Conserver le showcase actuel, avec six directions maximum.

Règles :

- aucun faux client ;
- marques de démonstration explicitement fictives ;
- un secteur différent par direction ;
- action, texte et palette synchronisés ;
- CTA vers le Studio avec cette direction préchargée.

### 7. Matière et fabrication

Afficher uniquement :

- dimensions ;
- matière disponible ;
- impression ;
- épaisseur validée ;
- nettoyage ;
- test NFC ;
- test QR ;
- contenu de la boîte.

Le bois et le métal hybride doivent vivre dans une section « Laboratoire / pré-série », pas dans le choix principal achetable.

### 8. Tapote Link et Pilot

Hiérarchie :

1. Tapote Link est inclus ;
2. le support reste ;
3. la destination change ;
4. Pilot ajoute organisation et mesure.

Éviter de transformer chaque fiche en page SaaS. Un bloc de 600 à 800 px suffit, suivi d’un lien vers la page Pilot complète.

### 9. Processus

Quatre étapes :

1. commande ;
2. éléments de marque et destination ;
3. BAT ;
4. préparation, contrôle et livraison.

La date ou le délai doit être présenté comme une donnée de commande, pas comme une promesse générique.

### 10. Preuve marché

Avant les premiers avis vérifiés :

- ne pas afficher de note ;
- ne pas afficher de compteur ;
- ne pas afficher de faux logos ;
- ne pas inventer de cas.

Bloc de remplacement :

> Série pilote en cours

Montrer :

- protocole ;
- nombre de supports à tester si confirmé ;
- éléments contrôlés ;
- statut des prototypes ;
- invitation à participer.

Quand les preuves existent, remplacer ce bloc par :

- avis liés à une commande ;
- produit ;
- date ;
- consentement ;
- photo ou lieu autorisé ;
- résultat mesuré avec période et base de calcul.

### 11. FAQ produit

Questions minimales :

1. Quels téléphones sont compatibles ?
2. Que se passe-t-il sans NFC ?
3. Faut-il une application ?
4. Puis-je changer le lien ?
5. Que contient le prix ?
6. Quand la production commence-t-elle ?
7. Comment transmettre mon design ?
8. Qu’est-ce que le BAT ?
9. Comment nettoyer le support ?
10. Que se passe-t-il si le NFC ne fonctionne pas ?
11. Puis-je équiper plusieurs lieux ?
12. Puis-je utiliser une destination différente par support ?

### 12. Fermeture commerciale

Deux chemins :

- acheter 1 à 9 supports ;
- demander un devis pour 10+.

Ne pas ajouter un troisième CTA concurrent.

## 6. Adaptation par produit

### Tapote Comptoir

Positionnement :

> Le support signature pour la caisse, l’accueil et la table.

Secteurs initiaux :

- café ;
- restaurant ;
- boulangerie ;
- hôtel ;
- coworking ;
- événement.

Actions :

- avis ;
- menu ;
- fidélité ;
- Wi-Fi ;
- réservation ;
- multi-liens.

### Tapote Plaque

Positionnement :

> Le point d’action fixe pour l’entrée, le mur, le miroir et l’accueil.

Secteurs initiaux :

- beauté ;
- santé ;
- boutique ;
- hôtel ;
- sport ;
- vétérinaire.

Actions :

- réservation ;
- avis ;
- contact ;
- Wi-Fi ;
- fidélité ;
- informations pratiques.

### Tapote Card

Positionnement :

> Le bon lien dans la poche, pour les rendez-vous et le terrain.

Secteurs initiaux :

- artisan ;
- immobilier ;
- photographe ;
- consultant ;
- événement ;
- hôtellerie.

Actions :

- contact ;
- avis ;
- portfolio ;
- réservation ;
- LinkedIn ;
- multi-liens.

## 7. Plan d’implémentation sans nouvelle dépendance

### P0 — restaurer la différence Tapote

1. Dans `ProductPage`, remplacer la scène isolée par `SectorScene`.
2. Ajouter un état `sector`.
3. Initialiser le secteur selon le produit.
4. Verrouiller `preview.surface` sur le produit courant.
5. Passer `productPreview` à `SectorScene`.
6. Afficher `SectorSelector` sous ou au-dessus de la scène.
7. Lors du changement de secteur, mettre à jour :
   - décor ;
   - `sectorId` ;
   - marque de démonstration ;
   - action initiale ;
   - conseil de pose.
8. Conserver le BuyBox et son `onPreviewChange`.

### P0 — rétablir la synchronisation

Vérifier que :

- changer d’action change l’impression ;
- changer d’action change le téléphone ;
- changer de couleur change le support ;
- charger un logo change le support ;
- changer de secteur change uniquement le contexte ;
- le produit reste Comptoir, Plaque ou Card selon la route.

### P0 — rendre la décision autonome

Dans le premier écran, rendre visibles :

- prix ;
- fiscalité ;
- livraison ;
- statut du délai ;
- BAT ;
- NFC + QR ;
- CTA.

### P1 — vues du hero

Ajouter trois boutons accessibles :

- En situation ;
- Face produit ;
- Détail.

Réutiliser :

- `SectorScene` pour « En situation » ;
- `ProductPurchaseVisual` pour « Face produit » ;
- la galerie produit pour « Détail ».

### P1 — preuve et FAQ

- ajouter une FAQ propre à chaque produit ;
- ajouter le bloc série pilote ;
- conserver l’absence de faux avis ;
- préparer le composant d’avis pour des données vérifiées futures.

### P2 — média réel

Quand un vrai prototype est disponible :

- remplacer les visualisations par des photos ;
- tourner une seule vidéo de 20 à 30 secondes ;
- livrer WebM + MP4 + poster ;
- ajouter sous-titres ;
- différer le chargement.

## 8. Critères d’acceptation

### Commerce

- produit, prix et CTA visibles dans le premier écran desktop ;
- choix prêt/personnalisé compréhensible sans ouvrir le Studio ;
- frais de livraison déterministes ;
- 1 à 9 en achat, 10+ en devis ;
- aucun abonnement ajouté automatiquement.

### Interaction

- changement d’action visible sur le support et le téléphone ;
- changement de secteur visible sur le décor ;
- changement de secteur ne change pas de produit ;
- navigation clavier complète ;
- état actif lisible sans dépendre uniquement de la couleur ;
- `prefers-reduced-motion` respecté.

### Mobile

- scène visible avant ou immédiatement après le BuyBox ;
- bascule Aperçu / Configurer ;
- CTA panier persistant sans masquer le contenu ;
- aucun débordement horizontal ;
- secteur sélectionnable au pouce ;
- téléphone et support restent lisibles à 360 px.

### Preuve

- aucune marque réelle sans autorisation ;
- aucun chiffre de démonstration présenté comme réel ;
- aucune matière non commandable dans le sélecteur principal ;
- aucune visualisation présentée comme photo ;
- aucun délai ou garantie non relié aux conditions.

### Performance

- une seule scène lourde active ;
- images WebP ou AVIF ;
- tailles réservées pour éviter le CLS ;
- galerie lazy-loadée ;
- fallback statique si l’écran dynamique échoue ;
- aucune nouvelle bibliothèque nécessaire.

## 9. Conclusion

Le standard à viser n’est pas « une fiche aussi longue que VKARD ». Le standard est :

> À chaque étape, le visiteur voit l’objet, comprend le geste, connaît le prix, croit la promesse et sait quoi faire ensuite.

VKARD apporte la structure commerciale. Tapote doit conserver la supériorité de son expérience :

> secteur vivant + support synchronisé + téléphone synchronisé + Studio + Link + Pilot.

La meilleure fiche Tapote n’est pas une copie de VKARD. C’est une fiche VKARD complète, avec un moteur de démonstration que VKARD ne possède pas.
