# Audit urgent du site entier — VKARD vs Tapote

Date : 30 juillet 2026  
Périmètre : site public VKARD, accueil, boutique, fiche produit, fonctionnement, Pro, Entreprises et devis ; comparaison avec les routes et composants Tapote présents dans le workspace.  
Statut : recommandations de contenu et d’architecture. Aucun code modifié dans cet audit.

## Verdict

VKARD n’est pas meilleur parce que son interface est plus sophistiquée. Son design est parfois chargé et inégal.

VKARD est devant parce que son système commercial est complet :

1. la navigation distingue achat immédiat, compréhension, démo, Pro et Entreprises ;
2. l’accueil déroule promesse, rassurance, preuve, fonctionnement, produits, logiciel, cas, FAQ et avis ;
3. la fiche produit répond à presque toutes les objections au même endroit ;
4. le parcours sépare clairement le petit volume achetable du projet d’équipe à qualifier ;
5. les logos, avis, cas et apparitions presse réduisent le risque perçu.

Tapote est déjà devant sur trois points :

- identité plus contemporaine et plus cohérente ;
- positionnement plus net pour les lieux et leurs actions ;
- transparence sur la série pilote et sur Tapote Link.

Les écarts prioritaires ne demandent donc pas une refonte visuelle supplémentaire. Ils demandent de **finir le funnel**, supprimer les contradictions et faire apparaître le bon moteur de création au bon moment.

## 1. Benchmark VKARD — architecture observée

### Navigation

Navigation principale observée :

- Commander ;
- Comment ça marche ;
- Démo & Devis ;
- Offre Pro ;
- Entreprises ;
- compte ;
- panier.

Lecture :

- « Commander » sert le self-service ;
- « Démo & Devis » sert la qualification ;
- « Offre Pro » vend le logiciel ;
- « Entreprises » vend le déploiement.

VKARD ne demande pas au visiteur de comprendre toute l’entreprise avant de choisir son chemin.

### Séquence de l’accueil

Ordre observé :

1. bandeau origine et livraison ;
2. hero et deux CTA : achat / équipes ;
3. quatre blocs de rassurance ;
4. logos et volume d’avis ;
5. bénéfice et fonctionnement en trois étapes ;
6. gamme de produits ;
7. logiciel et dashboard ;
8. fonctions entreprise ;
9. études de cas ;
10. témoignages ;
11. FAQ ;
12. avis vérifiés ;
13. footer riche.

La force n’est pas chaque bloc pris séparément. C’est la répétition cohérente de :

> objet réel → geste → logiciel → preuve → achat.

### Boutique

La boutique est organisée par intentions compréhensibles :

- cartes personnalisables ;
- produits prêts à configurer ;
- produits pour les avis Google ;
- accessoires.

Les cartes affichent le nom, l’image, le prix HT et un bouton. Le catalogue est plus large que nécessaire, mais il rassure sur la réalité commerciale de la gamme.

### Fiche produit

La fiche VKARD Custom PVC comprend :

- galerie de plusieurs images ;
- badge best-seller ;
- note et volume d’avis ;
- choix de couleur ;
- unité ou pack ;
- produits complémentaires ;
- prix, quantité et ajout panier ;
- délai visible ;
- garantie visible ;
- onglets détails, livraison, caractéristiques et remises ;
- bénéfices ;
- aperçu du dashboard ;
- déroulé de commande ;
- vidéo ;
- avis vérifiés ;
- FAQ ;
- CTA final ;
- renvoi Pro.

Tapote ne doit pas reprendre leurs accessoires ni leurs promesses. Il doit reprendre cette **complétude de décision**.

### Pro et Entreprises

VKARD sépare :

- le plan Gratuit ;
- le plan Pro à prix public ;
- l’Entreprise sur devis ;
- une landing spécifique pour les équipes ;
- un formulaire Démo & Devis.

Le site peut donc convertir trois intentions sans les mélanger :

- acheter ;
- améliorer son logiciel ;
- déployer en équipe.

### Preuves et rassurance

VKARD affiche publiquement :

- logos ;
- avis Google ;
- avis produits ;
- cas clients ;
- citations ;
- presse ;
- matière et origine déclarées ;
- délai et garantie.

Attention : les déclarations VKARD sur la sécurité, l’origine, l’écologie et les résultats restent des affirmations du vendeur dans ce benchmark. Tapote ne doit pas les recopier sans ses propres justificatifs.

Sources officielles :

- [Accueil VKARD](https://vkard.io/)
- [Produits VKARD](https://vkard.io/produits-connectes-nfc/)
- [Fiche VKARD Custom](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-pvc/)
- [Fonctionnement VKARD](https://vkard.io/comment-ca-marche/)
- [Plans VKARD](https://vkard.io/plans-pricing/)
- [Entreprises VKARD](https://vkard.io/lp/carte-de-visite-nfc-bl/)
- [Démo et devis VKARD](https://vkard.io/devis-carte-de-visite-nfc-connectee/)
- [Presse VKARD](https://vkard.io/presse/)

## 2. Tapote aujourd’hui — ce qui est déjà bon

### Navigation

Le header Tapote contient actuellement :

- Boutique ;
- Créer mon Tapote ;
- Fonctionnement ;
- Tapote Pilot ;
- Devis dès 10 supports ;
- accès Pilot ;
- panier.

La structure est saine et plus courte que VKARD. Le problème est seulement la duplication « Tapote Pilot » en navigation et en accès compte.

Composant : `Header`, [src/StorefrontV3.jsx](../src/StorefrontV3.jsx) vers la ligne 363.

### Accueil

L’accueil actuel possède :

- hero clair ;
- promesses de processus ;
- fonctionnement ;
- trois objets ;
- transparence produit ;
- Link / Pilot ;
- contenu du prix.

Il est visuellement cohérent et honnête. Il manque cependant les blocs qui terminent la décision :

- vraie entrée boutique avec prix ou packs ;
- explication des trois moteurs de création ;
- preuve client réelle lorsqu’elle existe ;
- FAQ ;
- CTA final.

Composant : `LandingPage`, vers la ligne 1950.

### Boutique

La boutique actuelle est déjà solide :

- trois produits ;
- deux packs par parcours ;
- prix ;
- ajout rapide ;
- fiches produit ;
- devis volume.

Le Pack Local et le Pack Parcours sont une meilleure idée pour Tapote que le cross-sell d’accessoires de VKARD.

Composant : `ShopPage`, vers la ligne 1996.

### Produit

La fiche Comptoir actuelle possède :

- scène produit ;
- prix prêt / personnalisé ;
- ajout panier ;
- informations essentielles ;
- caractéristiques ;
- contenu de la boîte ;
- usages.

Elle est claire mais s’arrête beaucoup plus tôt que la fiche VKARD.

Composant : `ProductPage`, vers la ligne 2169.

### Studio

Le Studio actuel regroupe encore :

- support ;
- quantité ;
- composition ;
- destination ;
- design prêt ou personnalisé ;
- toutes les actions ;
- trois formats.

Ce configurateur est puissant mais il recommence à devenir le produit principal. Il ne correspond plus à la décision des trois moteurs distincts.

Composants : `HomePage` et `BuyBox`, vers les lignes 2225 et 1362.

## 3. Problèmes P0 — à corriger avant de présenter Tapote comme prêt

### P0.1 — Supprimer les contradictions Tapote Link / Pilot

Constat :

- l’accueil et la page fonctionnement disent que les changements de destination sont inclus ;
- le bas de la page Pilot dit que Pilot devient utile pour changer le lien après livraison ;
- la liste Pilot inclut encore « Changement de destination à distance ».

Risque :

- le client ne sait pas si son support est réellement modifiable sans abonnement ;
- la comparaison avec VKARD tourne immédiatement en défaveur de Tapote.

Décision copy :

**Tapote Link — inclus**

> Changez la destination de votre support sans le réencoder ni le réimprimer.

**Pilot Pro — optionnel**

> Comparez les supports, les lieux et les périodes pour comprendre où vos clients agissent.

Retirer le changement de lien de la liste payante. Pilot Pro ne vend que :

- analyses avancées ;
- plusieurs supports ;
- plusieurs lieux ;
- historique détaillé ;
- export et alertes lorsqu’ils existent réellement.

Zone concernée : `PilotMarketingPage`, vers la ligne 2468.

### P0.2 — Remplacer le configurateur universel par trois moteurs

Le visiteur ne doit plus configurer Comptoir, Plaque et Card dans le même outil.

#### Card Builder

CTA :

> Créer ma Card

Structure :

- recto : identité ;
- verso : NFC + QR fixe ;
- aperçu deux faces ;
- aucune mise en page libre.

#### Studio Plaque & Comptoir

CTA :

> Composer mon support

Structure :

- grille fixe ;
- action ;
- logo ;
- couleurs ;
- message ;
- zones NFC et QR protégées.

#### Tapote Signature

CTA :

> Confier mon design à Tapote

Structure :

- brief ;
- création humaine ;
- BAT ;
- une correction ;
- prix du service séparé.

Modèle à tester :

> Création Signature — 49 € par identité ou composition, une seule fois par commande.

Le produit reste facturé séparément. Le service ne doit pas être multiplié par le nombre de supports identiques.

Zones concernées : `BuyBox`, `HomePage`, routes `/personnaliser` et fiches produit.

### P0.3 — Recomposer l’accueil pour vendre avant d’expliquer tout

Ordre cible :

1. hero ;
2. rassurance prouvable ;
3. boutique et packs ;
4. fonctionnement ;
5. trois moteurs de création ;
6. matière et fabrication pilote ;
7. Link / Pilot ;
8. preuves réelles ;
9. FAQ ;
10. CTA final.

Copy recommandé :

**Sur-titre**

> NFC + QR POUR LES LIEUX

**H1**

> Un geste. La bonne action.

**Corps**

> Avis, menu, réservation, Wi‑Fi ou le lien de votre choix : Tapote place l’action utile exactement là où votre client peut la faire.

**CTA principal**

> Voir la boutique

**CTA secondaire**

> Créer mon Tapote

Remplacer « Voir le geste en 30 s » tant qu’il n’existe pas une vraie vidéo de 30 secondes. Utiliser :

> Voir comment ça marche

### P0.4 — Rendre tous les CTA produit cohérents

Constat accueil :

- Comptoir renvoie vers une boutique préconfigurée ;
- Plaque renvoie directement au Studio ;
- Card renvoie vers une boutique préconfigurée.

Décision :

Chaque objet de l’accueil doit avoir le même premier CTA :

> Voir le Comptoir  
> Voir la Plaque  
> Voir la Card

Ces CTA ouvrent les fiches produit.

Le CTA de création apparaît ensuite sur la fiche :

- Card → Card Builder ;
- Comptoir / Plaque → Studio ;
- tous → Signature.

### P0.5 — Compléter les fiches produit

Ordre cible exact :

1. galerie réelle ;
2. nom et usage ;
3. prix produit ;
4. quantité ;
5. CTA ;
6. moteur de création adapté ;
7. ce qui est inclus ;
8. matière, dimensions et pose ;
9. délai et livraison ;
10. garantie et remplacement ;
11. fonctionnement Link / Pilot ;
12. FAQ ;
13. Pack Local ou Pack Parcours associé ;
14. preuve réelle lorsqu’elle existe ;
15. CTA final.

Copy de prix :

> Le support — 69 €  
> Studio guidé inclus  
> Création Signature — +49 € par composition

Ne pas afficher « garantie 2 ans », délai garanti, origine ou matière définitive avant validation.

Tant que le produit est en pilote :

> Visualisation de pré-série. La matière, le délai et le prix final sont confirmés avant production.

Quand le produit est validé, cette phrase disparaît et est remplacée par des caractéristiques fermes.

### P0.6 — Ajouter les éléments de décision manquants sans fabriquer de preuve

#### Rassurance autorisée

- NFC + QR sur chaque support ;
- lien modifiable inclus ;
- destination contrôlée avant envoi ;
- BAT Signature avant impression ;
- aucune application nécessaire côté visiteur, après tests compatibles.

#### Preuve actuelle

La transparence de série pilote et le protocole de test sont des preuves de processus. Ce ne sont pas encore des preuves client.

Ne pas afficher :

- logos ;
- compteur clients ;
- note ;
- résultat moyen ;
- « testé par des centaines de commerces ».

Préparer le composant « Installations réelles », mais ne le publier qu’avec au moins trois autorisations.

Titre futur :

> Installé là où l’action compte.

Chaque cas doit montrer :

- lieu ;
- emplacement ;
- action ;
- photo ;
- période ;
- résultat ou retour exact ;
- source.

### P0.7 — Étiqueter toutes les données de démonstration

La maquette Pilot affiche actuellement :

- 675 interactions ;
- +8 % ;
- 72 % NFC ;
- 3/3 produits actifs.

Sans label, ces chiffres ressemblent à des résultats clients.

Ajouter au-dessus du mockup :

> Démonstration de l’interface — données illustratives

Même règle pour les marques fictives et écrans d’exemple :

> Exemple de rendu

### P0.8 — Corriger le CTA erroné de la page fonctionnement

La page `/comment-ca-marche` affiche « Créer mon Tapote » mais le lien pointe vers `/`.

Il doit pointer vers la page de choix des moteurs ou vers `/personnaliser`.

Zone concernée : `HowPage`, vers la ligne 2621.

### P0.9 — Clarifier les prix et la fiscalité

Le site affiche « net de TVA ». Cette formulation est inhabituelle pour une boutique.

Décision selon le statut fiscal réel :

- entreprise assujettie : prix HT sur le parcours B2B, avec TTC lorsque légalement requis ;
- franchise de TVA : « TVA non applicable, art. 293 B du CGI » près du prix ou dans le checkout ;
- ne jamais utiliser « net de TVA » sans explication.

Le bandeau « Livraison offerte dès 69 € » ne reste public que si l’économie réelle du produit et des packs le permet.

### P0.10 — Faire de la page devis un vrai aiguillage

La page actuelle est propre, mais elle doit aider le visiteur à savoir s’il doit acheter ou demander un devis.

Ajouter en tête :

**1 à 9 supports**

> Prix immédiat, commande en ligne et personnalisation après le choix du produit.

CTA :

> Voir la boutique

**10 supports ou plusieurs lieux**

> Composition, prototype, production et destinations regroupés dans une proposition.

CTA :

> Demander un devis

Ajouter au formulaire :

- nombre de lieux ;
- volume estimé ;
- action principale ;
- date souhaitée, sans garantie ;
- téléphone facultatif.

Ajouter après le bouton :

> Nous étudions le besoin avant de confirmer matière, délai et prix. Aucun engagement à l’envoi du formulaire.

Vérifier que le champ anti-spam « Site web » reste réellement masqué visuellement et pour les technologies d’assistance.

## 4. Problèmes P1 — juste après les P0

### P1.1 — Créer une page Pro & multi-sites

Le header doit afficher :

> Pro & multi-sites

Cette page ne copie pas la landing Entreprises de VKARD. Elle reste sobre :

1. pour qui ;
2. trois problèmes ;
3. déroulé du déploiement ;
4. prototype ;
5. gestion des liens ;
6. Pilot Pro si utile ;
7. devis.

H1 :

> Un même parcours. Dans tous vos lieux.

Corps :

> Tapote prépare les supports, les destinations et les fichiers d’un déploiement multi-site dans une seule proposition.

CTA :

> Préparer mon déploiement

Ne pas afficher SSO, SLA, CRM, API, sécurité entreprise ou annuaire tant que ces fonctions ne sont pas contractualisables.

### P1.2 — Transformer le doublon du header

Navigation :

- Boutique ;
- Créer ;
- Comment ça marche ;
- Pilot ;
- Pro & multi-sites.

Utilitaires :

- Se connecter ;
- Panier.

Le lien actuellement nommé « Tapote Pilot » à droite devient :

> Se connecter

### P1.3 — Ajouter une comparaison Link / Pilot

Table simple :

| Fonction | Tapote Link inclus | Pilot Pro |
| --- | --- | --- |
| Support actif | Oui | Oui |
| Changement de destination | Oui | Oui |
| Statistiques essentielles | Oui | Oui |
| Comparaison lieux / supports | — | Oui |
| Périodes avancées | — | Oui |
| Historique détaillé / export | — | Oui, lorsque disponible |

CTA Link :

> Accéder à mon compte

CTA Pilot :

> Essayer Pilot Pro

Le deuxième CTA ne doit exister que si l’essai est réellement possible.

### P1.4 — Ajouter une FAQ courte sur l’accueil et complète sur les produits

Questions accueil :

1. Faut-il une application ?
2. Puis-je changer le lien ?
3. NFC ou QR : quelle différence ?
4. Que comprend la personnalisation ?
5. Quel produit choisir ?
6. Quand mon support sera-t-il expédié ?

La réponse au délai doit rester conditionnelle tant que la production n’est pas stabilisée.

### P1.5 — Créer un hub de cas clients uniquement après preuve

Route future :

> `/installations`

Pas de page vide ni de faux cas.

Ouverture lorsque Tapote possède :

- trois installations autorisées ;
- cinq citations ;
- deux cas mesurés.

### P1.6 — Renforcer le panier et le checkout

Près du CTA de paiement :

- produit et moteur de création ;
- service Signature facturé une fois ;
- destination facultative avant production ;
- délai non confirmé tant que nécessaire ;
- lien inclus ;
- montant livraison ;
- étapes après paiement.

Bloc « après la commande » :

1. brief ou configuration ;
2. BAT si Signature ;
3. production ;
4. contrôle ;
5. expédition.

### P1.7 — N’ouvrir que trois pages secteur au départ

Ne pas remettre quinze secteurs dans la navigation.

Priorités :

- restaurants et cafés ;
- beauté et coiffure ;
- hôtels et hébergements.

Chaque page doit contenir un scénario, un pack, un emplacement et une preuve. Aucune page SEO générique sans cas réel.

### P1.8 — Ajouter un CTA final identique sur les pages éditoriales

Titre :

> Quel point de contact voulez-vous activer ?

CTA principal :

> Voir la boutique

CTA secondaire :

> Parler d’un déploiement

## 5. Architecture cible du site

```text
Accueil
├── Boutique
│   ├── Tapote Comptoir
│   │   ├── Studio Plaque & Comptoir
│   │   └── Signature
│   ├── Tapote Plaque
│   │   ├── Studio Plaque & Comptoir
│   │   └── Signature
│   ├── Tapote Card
│   │   ├── Card Builder
│   │   └── Signature
│   ├── Pack Local
│   └── Pack Parcours
├── Créer
│   ├── Card Builder
│   ├── Studio Plaque & Comptoir
│   └── Tapote Signature
├── Comment ça marche
├── Tapote Link & Pilot
├── Pro & multi-sites
│   └── Demande de devis
├── Installations réelles [non publié avant preuves]
└── Compte / Panier / Legal
```

## 6. Séquence cible de l’accueil — copy prête

### 1. Hero

> **Un geste. La bonne action.**  
> Avis, menu, réservation, Wi‑Fi ou le lien de votre choix : Tapote place l’action utile exactement là où votre client peut la faire.

CTA :

- Voir la boutique
- Créer mon Tapote

### 2. Rassurance

- NFC + QR sur chaque support
- Lien modifiable inclus
- Configuration contrôlée avant envoi
- BAT inclus avec Signature

### 3. Boutique

> **Choisissez l’endroit à équiper.**

- Comptoir
- Plaque
- Card
- Pack Local
- Pack Parcours

### 4. Fonctionnement

> **Vous choisissez. On prépare. Vous posez.**

1. choisissez l’action ;
2. composez le support ;
3. validez si nécessaire ;
4. Tapote encode et contrôle.

### 5. Création

> **Trois façons de créer. Une seule exigence physique.**

- Card Builder
- Studio Plaque & Comptoir
- Signature

### 6. Produit

> **La matière d’abord. Les promesses ensuite.**

Conserver la transparence actuelle jusqu’aux prototypes validés.

### 7. Logiciel

> **Le lien est inclus. Pilot mesure.**

Garder la séparation Link / Pilot sans contradiction.

### 8. Preuve

Avant preuves clients :

> **Testé avant d’être promis.**

Montrer le protocole réel et les prototypes.

Après preuves :

> **Installé là où l’action compte.**

### 9. FAQ

Six questions maximum sur l’accueil.

### 10. CTA final

> **Quel point de contact voulez-vous activer ?**

- Voir la boutique
- Parler d’un déploiement

## 7. Ordre d’exécution

### P0 immédiat

1. corriger Link / Pilot ;
2. corriger le CTA fonctionnement ;
3. étiqueter toutes les données illustratives ;
4. clarifier prix et TVA ;
5. aligner les CTA produits vers les fiches ;
6. intégrer les trois moteurs ;
7. compléter une fiche produit modèle ;
8. ajouter FAQ et CTA final ;
9. faire de Devis un aiguillage 1–9 / 10+.

### P1 juste après

1. page Pro & multi-sites ;
2. navigation finale ;
3. comparaison Link / Pilot ;
4. panier et checkout ;
5. trois pages secteur ;
6. hub installations lorsque les preuves existent.

## Conclusion

Tapote n’a pas besoin d’un site plus démonstratif que VKARD. Il a besoin d’un site plus net :

- moins de choix avant le produit ;
- plus de réponses près du prix ;
- trois moteurs de création distincts ;
- aucune contradiction d’abonnement ;
- aucune donnée fictive présentée comme réelle ;
- une vraie séparation achat / déploiement ;
- un funnel terminé par FAQ, rassurance et CTA.

La règle de design est désormais :

> **Simple comme une boutique. Personnalisable comme un studio. Crédible comme un produit réel.**
