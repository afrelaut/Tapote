# Tapote — source de vérité

Version : 1.0  
Date d’autorité : 30 juillet 2026  
Propriétaire : fondateur de Tapote  
Périmètre : marque, offre publique, logiciel, prix, promesses, preuves et architecture du site

## 1. Statut et règle de préséance

Ce document est l’unique source d’autorité pour les sujets qu’il couvre.

Les documents `21` à `34` sont des **archives de recherche**. Ils peuvent expliquer l’origine d’une idée, d’un benchmark, d’un protocole ou d’une hypothèse, mais ils ne fixent plus :

- l’architecture de marque ;
- les noms publics ;
- le catalogue public ;
- les modes de personnalisation ;
- les fonctionnalités commerciales de Tapote Pilot ;
- les prix ;
- les promesses marketing ;
- la structure cible du site.

En cas de contradiction :

1. ce document prévaut ;
2. une décision explicite ultérieure du fondateur peut le modifier ;
3. le code, une maquette, un benchmark, un audit ou un ancien document ne peuvent pas modifier l’offre par eux-mêmes.

Une tâche de design ou de contenu ne peut jamais renommer une offre, ajouter un produit, modifier un prix ou élargir une promesse. Si une information nécessaire n’est pas tranchée ici, elle doit être ajoutée aux décisions bloquées, pas inventée.

## 2. Vocabulaire de statut

| Statut | Signification |
|---|---|
| **Décidé** | Règle produit ou commerciale à appliquer. |
| **Actuel, à valider** | Valeur utilisée aujourd’hui, mais dont l’économie ou la preuve marché n’est pas encore confirmée. |
| **Autorisé sous condition** | Formulation utilisable uniquement lorsque la condition indiquée est prouvée. |
| **Bloqué** | Aucune publication ni promesse définitive avant décision ou preuve. |
| **Interdit** | Ne doit pas apparaître comme offre, preuve ou affirmation publique. |

## 3. Architecture de marque

### 3.1 Marque mère

**Tapote** est la marque mère.

Tapote conçoit des points d’action physiques NFC + QR qui ouvrent une destination numérique au bon moment : au comptoir, à l’entrée, sur un mur, en rendez-vous ou sur le terrain.

Signature de marque autorisée :

> **Un geste. La bonne action.**

Description courte autorisée :

> Tapote relie un support physique à la destination utile : avis, menu, réservation, contact, Wi‑Fi ou lien choisi.

La formulation « action mesurable » ne peut être utilisée que pour une interaction effectivement instrumentée. Elle ne signifie jamais que Tapote garantit un avis, une réservation, une vente ou une hausse de chiffre d’affaires.

### 3.2 Architecture physique

La gamme publique comporte trois produits et un pack :

1. **Tapote Comptoir** ;
2. **Tapote Plaque** ;
3. **Tapote Card** ;
4. **Pack Local**.

Le Pack Local est une composition commerciale de produits existants. Ce n’est pas une quatrième technologie ni une famille de produit distincte.

### 3.3 Architecture logicielle

La gamme logicielle comporte deux niveaux :

1. **Tapote Pilot** — inclus ;
2. **Tapote Pilot Pro** — option avancée.

**Tapote Link n’existe plus.** Le nom, les sections, comparatifs, badges et promesses « Tapote Link » doivent être considérés comme obsolètes. Les fonctions auparavant attribuées à Link sont réintégrées dans Tapote Pilot lorsqu’elles relèvent de la gestion de base des supports et de leurs destinations.

### 3.4 Architecture de personnalisation

Il existe deux modes publics :

1. **Prêt à poser** ;
2. **À votre image**.

**Tapote Studio** est l’étape de personnalisation utilisée dans le parcours **À votre image**. Tapote Studio :

- n’est pas un produit autonome ;
- n’est pas une cinquième offre ;
- n’a pas de prix autonome ;
- ne doit pas être présenté dans le catalogue au même niveau que Comptoir, Plaque, Card ou Pack Local ;
- ne crée pas un troisième mode commercial.

Les anciens noms publics **Express**, **Signature**, **Prêt à servir**, **Personnaliser** comme niveau d’offre, **Card Builder** comme produit et **Studio Point d’action** comme produit sont abandonnés. Ils peuvent rester des noms internes de composants ou de méthodes uniquement si le visiteur ne les voit pas comme des offres supplémentaires.

## 4. Noms publics normatifs

| Type | Nom public exact | Usage |
|---|---|---|
| Marque | **Tapote** | Marque mère |
| Produit | **Tapote Comptoir** | Caisse, accueil, table ou point de contact posé |
| Produit | **Tapote Plaque** | Entrée, mur, miroir, porte ou point fixe |
| Produit | **Tapote Card** | Rendez-vous, équipe, poche et terrain |
| Pack | **Pack Local** | Un Tapote Comptoir + une Tapote Plaque |
| Logiciel inclus | **Tapote Pilot** | Gestion des supports et de leurs destinations |
| Option avancée | **Tapote Pilot Pro** | Organisation, analyse et pilotage avancés |
| Étape de parcours | **Tapote Studio** | Personnalisation du mode À votre image |
| Mode | **Prêt à poser** | Composition Tapote prête à commander |
| Mode | **À votre image** | Personnalisation de l’identité dans Tapote Studio |

Noms interdits comme offres publiques :

- Tapote Link ;
- Pack Parcours ;
- Pack Équipe ;
- Tapote Mini ;
- Tapote Signature ;
- Card Metal, Card Bois ou Card PVC comme produits autonomes ;
- Express ou Signature comme niveaux commerciaux.

Une matière ou une finition de Tapote Card peut être étudiée en laboratoire ou en pré-série sans devenir un nouveau produit public.

## 5. Tapote Pilot

### 5.1 Tapote Pilot — inclus

Tapote Pilot est inclus avec les supports Tapote. Sa promesse centrale est :

> Gérez vos supports Tapote et leurs destinations.

Périmètre fonctionnel autorisé :

| Fonction | Statut |
|---|---|
| Associer ou activer un support Tapote | Décidé, publication conditionnée à son fonctionnement réel |
| Voir les supports rattachés au compte ou à l’organisation | Décidé |
| Voir la destination active d’un support | Décidé |
| Modifier la destination à distance | Décidé |
| Modifier la destination sans réimprimer ni réencoder le support | Décidé |
| Vérifier l’état du support et tester sa destination | Décidé, publication conditionnée à son fonctionnement réel |
| Gérer des destinations différentes pour plusieurs supports | Décidé |

La gestion de la destination ne doit jamais être présentée comme une fonction payante de Pilot Pro.

Tapote Pilot n’autorise pas à promettre par défaut :

- des analyses avancées ;
- une comparaison détaillée de lieux ou de périodes ;
- des exports ;
- des alertes ;
- un gain commercial ;
- une disponibilité ou une conservation de données non documentée.

### 5.2 Tapote Pilot Pro — option avancée

Tapote Pilot Pro est une option. Il ne doit pas être ajouté automatiquement à une commande.

Périmètre avancé visé :

| Fonction | Statut de publication |
|---|---|
| Analyse sur des périodes définies | Autorisé uniquement si calcul et interface sont fonctionnels |
| Distinction NFC / QR | Autorisé uniquement si la collecte est fiable et expliquée |
| Comparaison entre supports | Autorisé uniquement si fonctionnel |
| Comparaison entre lieux | Autorisé uniquement si fonctionnel |
| Historique détaillé | Autorisé uniquement si durée et périmètre sont documentés |
| Export | Autorisé uniquement si le format exporté existe |
| Alertes | Bloqué tant que les alertes réelles ne sont pas définies et testées |
| Gestion avancée multi-site | Autorisé uniquement après validation du modèle d’organisation et des droits |

Les interfaces de démonstration doivent porter la mention :

> **Démonstration de l’interface — données illustratives**

Aucun chiffre visible dans une démonstration ne constitue une preuve client.

## 6. Produits et pack publics

### 6.1 Tapote Comptoir

Rôle :

> Le support posé pour la caisse, l’accueil, la table et les moments de décision dans un lieu.

Le produit public reste **Tapote Comptoir**, quels que soient le secteur, l’action, le décor ou le mode de personnalisation choisis.

### 6.2 Tapote Plaque

Rôle :

> Le point d’action fixe pour l’entrée, le mur, le miroir, la porte ou l’accueil.

Les modes de fixation, la compatibilité avec les surfaces métalliques et l’usage extérieur ne peuvent être affirmés qu’après validation physique de la variante vendue.

### 6.3 Tapote Card

Rôle :

> Le support mobile pour les rendez-vous, la remise en main propre et le terrain.

Le nom public reste **Tapote Card**. PVC, bois et métal sont des hypothèses de matière ou de finition, pas des produits publics autonomes. Seules les matières effectivement qualifiées et commandables peuvent apparaître dans le choix d’achat.

### 6.4 Pack Local

Composition :

- 1 Tapote Comptoir ;
- 1 Tapote Plaque.

Rôle :

> Équiper deux moments complémentaires d’un même lieu : l’entrée et le comptoir.

Le Pack Local peut utiliser le mode Prêt à poser ou À votre image. Il ne peut afficher une économie que si la comparaison avec les prix unitaires est exacte et que le prix a réellement été proposé.

### 6.5 Offres non publiques

Restent hors catalogue public :

- Pack Parcours ;
- Pack Équipe ;
- Tapote Mini ;
- Card Metal autonome ;
- Card Bois autonome ;
- stickers, badges ou accessoires présentés comme extension artificielle de gamme ;
- tout produit non qualifié physiquement.

Ils ne peuvent revenir qu’après décision explicite du fondateur et mise à jour de ce document.

## 7. Modèle Prêt à poser / À votre image

### 7.1 Prêt à poser

Le mode **Prêt à poser** correspond à une composition Tapote déjà conçue.

Le client choisit au minimum :

- le produit ou le Pack Local ;
- la quantité ;
- l’action ou la destination utile ;
- la destination maintenant ou selon le processus prévu après commande.

Ce mode n’est pas un produit de moindre qualité. La différence de prix avec À votre image rémunère la personnalisation, le contrôle graphique et le travail de préparation, pas une baisse volontaire de qualité matérielle.

Le terme « prêt à poser » n’est autorisé que si la commande arrive réellement :

- configurée ;
- encodée ;
- testée ;
- accompagnée des éléments de pose nécessaires lorsqu’ils font partie du produit.

### 7.2 À votre image

Le mode **À votre image** adapte le support à l’identité du client au moyen de Tapote Studio.

Le périmètre public comprend :

- logo ou nom de marque ;
- couleurs ;
- message principal ;
- action ;
- destination ;
- aperçu adapté au support ;
- contrôle technique ;
- BAT avant fabrication lorsque l’impression est personnalisée.

Tapote Studio protège les contraintes de fabrication : position NFC, QR, marges, contraste, taille minimale et zones techniques. Il n’est pas un logiciel de mise en page libre.

Le nombre de corrections incluses, le délai du BAT et le traitement d’un brief hors gabarit restent des décisions bloquées.

### 7.3 Règles communes

- Le produit est choisi avant la personnalisation.
- Le produit ne change pas lorsqu’un secteur, une action ou un décor change.
- L’aperçu du support et l’écran du téléphone doivent rester synchronisés lorsqu’ils sont présentés.
- Un aperçu web prépare la commande ; il ne remplace pas le contrôle de fabrication ni le BAT.
- Aucun mockup généré ne doit être utilisé.
- Une visualisation native du configurateur doit être nommée **aperçu** et ne doit jamais être présentée comme une photo ou une preuve physique.

## 8. Prix actuels et statut de validation

Les montants ci-dessous sont les prix actuels de référence. Une tâche de design, de contenu ou de développement ne peut pas les modifier.

| Offre | Prêt à poser | À votre image | Statut |
|---|---:|---:|---|
| Tapote Card | 39 € | 59 € | Actuel, à valider économiquement et commercialement |
| Tapote Plaque | 59 € | 79 € | Actuel, à valider économiquement et commercialement |
| Tapote Comptoir | 69 € | 89 € | Actuel, à valider économiquement et commercialement |
| Pack Local | 119 € | 159 € | Actuel, à valider économiquement et commercialement |
| Tapote Pilot | Inclus | Inclus | Décidé |
| Tapote Pilot Pro | 9 €/mois ou 89 €/an | — | Hypothèse commerciale contrôlée, non validée |

Les prix physiques ne deviennent validés qu’après :

1. devis comparables aux volumes utiles ;
2. prototype représentatif du produit vendu ;
3. coût complet incluant fabrication, personnalisation, contrôle, emballage, rebut, paiement et éventuelle subvention du transport ;
4. marge contributive approuvée ;
5. commandes payées et non seulement intentions d’achat.

Pour Pilot Pro, restent à valider :

- la valeur perçue ;
- le périmètre exact des fonctions disponibles ;
- le modèle de facturation ;
- la facturation par organisation ;
- le prix mensuel et annuel ;
- des paiements bêta réels.

Le statut fiscal des prix n’est pas tranché. Tant que le statut TVA n’est pas confirmé, ne pas transformer ces montants en prix « TTC », « HT » ou « net de TVA » par déduction.

## 9. Promesses autorisées

### 9.1 Autorisées

Les formulations suivantes sont autorisées si le produit ou la fonction correspondante existe réellement :

- « NFC + QR » ;
- « Le NFC et le QR ouvrent la même destination Tapote » ;
- « Aucune application à installer pour le visiteur » ;
- « Gérez vos supports et leurs destinations dans Tapote Pilot » ;
- « Changez la destination sans réimprimer ni réencoder le support » ;
- « Tapote Pilot est inclus » ;
- « Tapote Pilot Pro est optionnel » ;
- « BAT avant fabrication personnalisée » ;
- « Prêt à poser » lorsque les conditions de la section 7.1 sont respectées ;
- « Série pilote » ou « pré-série en validation » lorsque c’est le statut réel ;
- dimensions, matières, contenu de la boîte et méthode d’impression lorsqu’ils correspondent à la référence réellement vendue ;
- actions compatibles listées précisément : avis, menu, réservation, contact, Wi‑Fi ou URL choisie.

### 9.2 Autorisées uniquement avec preuve datée

- « Fabriqué en France » ;
- origine d’un composant ou d’une opération ;
- matière recyclée ou allégation environnementale ;
- compatibilité avec une surface métallique ;
- usage extérieur ;
- résistance à l’eau, aux UV, aux rayures ou à un produit de nettoyage ;
- durée de vie ;
- délai garanti ;
- garantie commerciale ;
- compatibilité universelle ;
- niveau de sécurité, chiffrement, audit, conformité ou certification ;
- chiffres d’interactions ;
- taux de conversion ;
- hausse d’avis, de réservations, de contacts ou de chiffre d’affaires ;
- résultat client ;
- comparaison de performance avec un concurrent.

### 9.3 Interdites sans exception documentaire

- faux avis ;
- faux client ;
- faux logo ;
- faux chiffre ;
- faux compteur ;
- faux cas client ;
- fausse apparition presse ;
- marque fictive présentée comme cliente ;
- note reconstruite ;
- témoignage sans consentement ;
- « meilleur du marché » ;
- « adopté par des centaines de commerces » sans preuve ;
- « incassable » ;
- garantie de résultat ;
- mockup généré présenté comme produit, installation ou preuve.

## 10. Preuves disponibles

### 10.1 Preuves utilisables aujourd’hui

| Preuve | Ce qu’elle permet de dire | Limite |
|---|---|---|
| Existence du logiciel et de ses parcours testés | Montrer le fonctionnement réellement accessible | Ne prouve ni adoption ni résultat client |
| Aperçus interactifs natifs | Expliquer support → téléphone → destination | Doivent être nommés « aperçu » ou « démonstration » |
| Protocoles NFC, QR, BAT et contrôle documentés | Expliquer comment Tapote prévoit de vérifier ses produits | Un protocole n’est pas un résultat d’essai |
| Sources techniques et fournisseurs archivées | Justifier une spécification de travail ou préparer un RFQ | Une page fournisseur n’est ni un devis ni une preuve sur le produit Tapote fini |
| Transparence « série pilote » ou « pré-série » | Prouver l’honnêteté du stade produit | Ne remplace pas une preuve physique ou client |
| Tests logiciels datés lorsqu’ils viennent d’être exécutés | Prouver la stabilité du build contrôlé | Ils expirent dès qu’un changement pertinent intervient |

### 10.2 Preuves non disponibles dans le corpus 21–34

Les archives ne démontrent pas :

- un client public autorisé ;
- un avis vérifié ;
- un logo client autorisé ;
- un volume de commandes ;
- un résultat commercial mesuré ;
- un cas client complet ;
- une apparition presse Tapote ;
- un fournisseur définitivement sélectionné ;
- un coût de revient final ;
- une origine complète et traçable ;
- une durabilité garantie ;
- une compatibilité universelle ;
- un délai contractuel stable.

En conséquence, aucun module de preuve sociale ne doit être rempli avec des données de démonstration.

### 10.3 Ordre d’acquisition des preuves

1. prototype réel ;
2. tests NFC, QR, pose, nettoyage, transport et emballage ;
3. micro-série contrôlée ;
4. pilote installé ;
5. autorisation écrite de publication ;
6. témoignage nominatif ;
7. résultat mesuré avec période et base de calcul ;
8. avis indépendant ou cas client complet.

## 11. Structure normative du site

### 11.1 Navigation principale

La navigation doit servir quatre intentions :

1. **Produits / Boutique** ;
2. **Comment ça marche** ;
3. **Tapote Pilot** ;
4. **Entreprises & devis**.

Utilitaires :

- Connexion ;
- Panier.

CTA marchand principal :

> **Commander**

Tapote Studio ne doit pas apparaître comme un produit autonome dans la navigation.

### 11.2 Arborescence fonctionnelle

```text
Accueil
├── Boutique
│   ├── Tapote Comptoir
│   ├── Tapote Plaque
│   ├── Tapote Card
│   └── Pack Local
├── Comment ça marche
├── Tapote Pilot
│   ├── Pilot inclus
│   └── Pilot Pro
├── Entreprises & devis
├── FAQ
├── Connexion / espace Pilot
├── Panier / commande
└── Pages légales
```

Pages éditoriales autorisées, sans créer de nouvelles offres :

- secteurs ;
- designs ou inspirations ;
- guides de pose ;
- cas clients uniquement lorsqu’ils sont réels et autorisés.

Une page secteur reste une page d’acquisition ou d’orientation. Elle ne peut pas inventer un produit, un prix, un client ou une preuve propre au secteur.

### 11.3 Accueil

Ordre recommandé :

1. promesse et geste Tapote ;
2. engagements vérifiés ;
3. Comptoir, Plaque, Card et Pack Local avec prix ;
4. démonstration du geste NFC + QR ;
5. fonctionnement ;
6. Prêt à poser / À votre image ;
7. matière et fabrication prouvées ;
8. Tapote Pilot inclus / Pilot Pro optionnel ;
9. preuve réelle ou statut série pilote ;
10. FAQ ;
11. Entreprises & devis ;
12. CTA final ;
13. footer.

Aucune section ne doit exister uniquement pour imiter VKARD. Chaque section doit répondre à une objection Tapote réelle.

### 11.4 Boutique et fiches produit

La boutique expose uniquement :

- Tapote Comptoir ;
- Tapote Plaque ;
- Tapote Card ;
- Pack Local.

Chaque fiche produit doit conserver :

- le bon produit verrouillé ;
- le secteur ou contexte sélectionnable ;
- le téléphone et son écran synchronisé ;
- le choix Prêt à poser / À votre image ;
- le prix ;
- la quantité ;
- l’action et la destination ;
- un seul CTA marchand principal ;
- le contenu exact ;
- les dimensions et matières validées ;
- la livraison et le délai avec leur vrai statut ;
- Tapote Pilot inclus ;
- le processus de personnalisation et de BAT ;
- la FAQ ;
- le lien devis lorsqu’un projet sort du parcours d’achat normal.

Tapote Studio s’ouvre dans le parcours À votre image de la fiche concernée. Il ne duplique pas le catalogue.

### 11.5 Petit volume et projet accompagné

Règle commerciale actuelle issue des archives :

- 1 à 9 supports : parcours d’achat en ligne ;
- 10 supports ou plus, plusieurs lieux ou déploiement complexe : devis.

Cette règle reste applicable tant qu’une décision commerciale ultérieure ne la remplace pas.

## 12. Contradictions tranchées

| Sujet contradictoire dans les archives | Décision d’autorité |
|---|---|
| Tapote Link inclus | **Supprimé.** Les fonctions de base appartiennent à Tapote Pilot inclus. |
| Pilot parfois présenté comme payant pour changer une destination | **Interdit.** Le changement de destination fait partie de Pilot inclus. |
| Trois niveaux Express / Personnaliser / Signature | **Remplacés** par Prêt à poser / À votre image. |
| Tapote Studio, Card Builder ou Signature comme produits | **Interdit.** Studio est une étape ; aucun moteur de personnalisation n’est un produit autonome. |
| Pack Local + Pack Parcours + Pack Équipe | **Seul Pack Local est public.** |
| Trois produits physiques contre six produits industriels | **Trois produits publics seulement** : Comptoir, Plaque, Card. Les variantes restent recherche ou pré-série. |
| Card PVC, Bois et Metal comme références publiques | **Tapote Card reste le nom public.** Une matière n’est affichée que si elle est qualifiée et disponible. |
| Prix uniques contre doubles prix | **Deux prix par offre physique**, selon Prêt à poser / À votre image. |
| Prix définitifs contre prix pilotes | Les montants sont **actuels et immuables depuis une tâche de design**, mais restent à valider économiquement et commercialement. |
| Pilot Pro validé contre hypothèse | Pilot Pro est une **option décidée**, mais ses fonctions publiables et son prix restent à valider. |
| Photos, rendus, mockups et marques fictives mélangés | **Aucun mockup généré.** Un aperçu natif doit être étiqueté ; seule une photo réelle prouve le produit. |
| Preuve sociale suggérée avant clients | **Interdite** tant qu’elle n’est pas réelle, sourcée et autorisée. |
| « Action mesurable » comme résultat commercial | Autorisé uniquement pour une interaction instrumentée, jamais comme garantie de résultat. |

## 13. Documents 21 à 34 : classement en archives

Les fichiers ci-dessous sont conservés pour traçabilité. Leur statut est **archive de recherche — non source d’autorité**.

| Document | Valeur conservée | Éléments rendus obsolètes par ce document |
|---|---|---|
| [`21-PLAN-DE-REPRISE-FONDATEUR-VKARD-2026-07-29.md`](docs/21-PLAN-DE-REPRISE-FONDATEUR-VKARD-2026-07-29.md) | Positionnement, gamme resserrée, sourcing, garde-fous | Tapote Link, fourchettes de prix, Duo/Pack 5 |
| [`22-CAHIER-DES-CHARGES-PROTOTYPES-ET-DEMANDE-DE-DEVIS.md`](docs/22-CAHIER-DES-CHARGES-PROTOTYPES-ET-DEMANDE-DE-DEVIS.md) | RFQ et protocoles de qualification | Aucune autorité commerciale ou marketing |
| [`23-PLAN-PRODUIT-SOURCING-PRIX-TAPOTE-2026-07-29.md`](docs/23-PLAN-PRODUIT-SOURCING-PRIX-TAPOTE-2026-07-29.md) | Modèle de coût, sourcing et prix de travail | Express/Signature, Pack Parcours, Pack Équipe, architecture Link |
| [`24-OFFRE-MARKETING-ET-PREUVES-TAPOTE-2026-07-29.md`](docs/24-OFFRE-MARKETING-ET-PREUVES-TAPOTE-2026-07-29.md) | Garde-fous de preuve et principes de funnel | Tapote Link, plusieurs packs publics, Signature autonome, trois moteurs comme offres |
| [`25-AUDIT-SITE-ENTIER-VKARD-VS-TAPOTE-2026-07-30.md`](docs/25-AUDIT-SITE-ENTIER-VKARD-VS-TAPOTE-2026-07-30.md) | Audit de complétude commerciale | Architecture Link/Pilot, Pack Parcours, Signature autonome |
| [`25-UX-IA-BOUTIQUE-ET-STUDIO-TAPOTE-2026-07-29.md`](docs/25-UX-IA-BOUTIQUE-ET-STUDIO-TAPOTE-2026-07-29.md) | Progressivité UX, contraintes du Studio et parcours | Prêt à servir/Personnaliser/Signature comme trois niveaux, moteurs comme destinations commerciales |
| [`26-SYSTEME-DESIGN-ET-PERSONNALISATION-TAPOTE-2026-07-29.md`](docs/26-SYSTEME-DESIGN-ET-PERSONNALISATION-TAPOTE-2026-07-29.md) | Contraintes de fabrication et de personnalisation | Card Builder, Studio Point d’action et Signature comme offres séparées |
| [`27-REGISTRE-DE-DECISIONS-VERIFIEES-TAPOTE-2026-07-29.md`](docs/27-REGISTRE-DE-DECISIONS-VERIFIEES-TAPOTE-2026-07-29.md) | Historique des décisions, prix implémentés et garde-fous | Ancienne autorité, Tapote Link, Pack Parcours |
| [`28-STACK-UI-UX-3D-TAPOTE-2026-07-29.md`](docs/28-STACK-UI-UX-3D-TAPOTE-2026-07-29.md) | Recherche d’implémentation et budgets de performance | Aucune autorité sur l’offre ou les noms |
| [`29-SHORTLIST-FOURNISSEURS-PRODUCTION-TAPOTE-2026-07-30.md`](docs/29-SHORTLIST-FOURNISSEURS-PRODUCTION-TAPOTE-2026-07-30.md) | Shortlist, RFQ et protocole fournisseur | Aucun fournisseur sélectionné, aucun prix de vente validé |
| [`30-CHECKLIST-QA-DESIGN-MOBILE-PERFORMANCE-2026-07-30.md`](docs/30-CHECKLIST-QA-DESIGN-MOBILE-PERFORMANCE-2026-07-30.md) | Méthode de QA desktop/mobile/performance | Références à Link et à deux packs, critères commerciaux obsolètes |
| [`31-BENCHMARK-VKARD-TOTAL-ET-PLAN-TAPOTE.md`](docs/31-BENCHMARK-VKARD-TOTAL-ET-PLAN-TAPOTE.md) | Benchmark commercial et structure des pages | Link, Pack Parcours, Signature autonome, ancienne arborescence |
| [`32-INDUSTRIALISATION-GAMME-PRODUITS-TAPOTE-2026-07-30.md`](docs/32-INDUSTRIALISATION-GAMME-PRODUITS-TAPOTE-2026-07-30.md) | Spécifications, BOM, gates et sourcing de recherche | Six produits publics, Tapote Mini, variantes Card autonomes |
| [`33-VKARD-LANDING-ET-VIDEOS-PREUVES-SECTION-PAR-SECTION.md`](docs/33-VKARD-LANDING-ET-VIDEOS-PREUVES-SECTION-PAR-SECTION.md) | Inventaire VKARD et séquence de landing | Link, deux packs, ancienne architecture de création |
| [`34-PDP-VKARD-VS-TAPOTE-EXECUTION-BRIEF-2026-07-30.md`](docs/34-PDP-VKARD-VS-TAPOTE-EXECUTION-BRIEF-2026-07-30.md) | Complétude PDP et interactions à préserver | Link, ancienne hiérarchie Pilot, anciens noms de modes |

Les décisions techniques encore utiles dans ces archives doivent être revalidées dans leur contexte avant implémentation. Elles ne peuvent jamais servir à contourner la présente source de vérité.

## 14. Décisions encore bloquées

Les points suivants ne doivent pas être tranchés implicitement :

### Offre et fiscalité

- statut TVA et libellé légal des prix ;
- livraison facturée ou offerte, seuil et zones concernées ;
- délai public par produit et par mode ;
- garantie commerciale, remplacement et conditions de retour ;
- nombre de corrections incluses dans À votre image ;
- délai et format du BAT ;
- traitement et prix d’une demande hors gabarit Studio ;
- modèle de facturation définitif de Pilot Pro.

### Produit et production

- fournisseur retenu par produit ;
- matière, épaisseur, procédé et origine de chaque référence vendue ;
- version définitive du Tapote Comptoir ;
- fixation standard de Tapote Plaque ;
- variante Plaque pour surface métallique ;
- matières de Tapote Card effectivement qualifiées et ouvertes à la vente ;
- coûts complets et marges réelles ;
- capacité hebdomadaire ;
- délai réel entre commande, BAT, fabrication et expédition ;
- contenu exact de l’emballage ;
- protocole de garantie après défaut NFC ou dommage transport.

### Logiciel

- disponibilité technique de chaque fonction Pilot listée comme conditionnelle ;
- frontière exacte entre historique de base et historique détaillé Pro ;
- présence ou non de statistiques essentielles dans Pilot inclus ;
- durée de conservation des données ;
- rôles, droits et modèle d’organisation ;
- fonctions multi-site réellement prêtes ;
- format d’export ;
- définition et canaux des alertes ;
- métriques considérées comme interactions ;
- conditions et prix définitifs de Pilot Pro.

### Preuve et marketing

- premiers clients publiables ;
- autorisations de logos, photos et citations ;
- première étude de cas ;
- compatibilité téléphones documentée ;
- résultats des tests physiques ;
- photos et vidéo réelles ;
- origine et allégations environnementales ;
- délais et garanties contractuels ;
- nombre et contenu des pages secteur à maintenir ;
- route canonique dédiée ou section Boutique pour Pack Local.

## 15. Contrôle avant toute publication

Avant chaque mise en ligne qui touche l’offre :

1. comparer les noms, produits, modes et prix à ce document ;
2. rechercher toute occurrence de `Tapote Link`, `Pack Parcours`, `Pack Équipe`, `Tapote Mini`, `Tapote Signature`, `Express` ou `Prêt à servir` utilisée comme offre publique ;
3. vérifier qu’aucune tâche de design n’a modifié l’offre ;
4. vérifier que toute donnée de démonstration est étiquetée ;
5. vérifier qu’aucun faux avis, client, chiffre ou logo n’est présent ;
6. vérifier qu’aucun mockup généré n’est utilisé ;
7. exécuter lint, tests et build ;
8. contrôler les parcours desktop et mobile ;
9. inscrire toute contradiction non résolue dans la section 14.

