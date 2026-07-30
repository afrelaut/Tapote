# UX / IA — Boutique et Studio Tapote

Date : 29 juillet 2026  
Périmètre : architecture du site marchand, parcours d'achat, Studio de personnalisation, Pilot, réseaux/devis, preuves et FAQ.  
Décision : document de conception. Aucun prix ni matériau n'est publiable avant validation des prototypes et des coûts.

## Décision fondatrice

Tapote doit proposer **deux portes d'entrée clairement séparées vers les trois mêmes objets** :

1. **Boutique** — acheter rapidement un Tapote déjà composé, choisir Noir ou Blanc, puis configurer le lien maintenant ou plus tard.
2. **Créer mon Tapote** — choisir l'objet, puis ouvrir le moteur de personnalisation adapté à sa géométrie ou demander une création Signature.

La Boutique rassure et réduit l'effort. La personnalisation différencie Tapote. Ils ne doivent ni se remplacer, ni reproduire deux catalogues concurrents.

### Décision après examen des vrais prototypes

Il ne faut **pas d'éditeur universel**. Une carte recto-verso et un objet de comptoir ne se composent pas de la même façon. « Créer mon Tapote » distribue donc trois offres créatives :

1. **Prêt à servir** — composition Tapote finie, choix Noir ou Blanc, achat immédiat.
2. **Personnaliser** — moteur contraint propre à l'objet :
   - Card Builder pour la carte ;
   - Studio à grille fixe pour Plaque et Comptoir.
3. **Signature** — création sur mesure réalisée avec accompagnement humain/IA, facturée, puis validée par BAT.

La matière reste la même qualité dans les trois offres. Ce qui change est le niveau de composition graphique et d'accompagnement.

Le site actuel mélange dans un seul écran :

- l'activité parmi 15 secteurs ;
- le support ;
- la quantité ;
- la composition d'un pack ;
- l'action parmi 18 destinations ;
- l'URL ;
- le mode de design ;
- le logo, les textes et les couleurs ;
- le prix et l'achat.

Cette puissance est réelle, mais elle est présentée avant que le visiteur ait seulement compris quel objet acheter. La bonne décision n'est pas de supprimer les fonctions. Il faut les **répartir dans le bon parcours et les révéler progressivement**.

## Ce qu'il faut apprendre de VKARD — et dépasser

VKARD paraît simple parce que son site sépare trois sujets :

- **acheter un produit** depuis « Commander » et une vraie page catalogue ;
- **comprendre la solution** depuis « Comment ça marche », « Offre Pro » et « Entreprises » ;
- **administrer le produit** depuis un dashboard séparé.

Sur une fiche Custom, VKARD demande peu de décisions avant l'achat : fond, pack, quantité. Le logo et les informations sont demandés ensuite, puis un BAT est envoyé. Cette approche réduit la friction, mais enlève aussi la visualisation immédiate. Tapote doit garder ce que VKARD n'a pas : **le rendu live**, sans le rendre obligatoire pour acheter.

Points d'architecture observés :

- navigation courte et orientée intentions ;
- menu « Commander » qui expose les familles de produits ;
- page catalogue divisée entre personnalisable et prêt à envoyer ;
- fiche produit avec galerie, avis, prix, quantité, garanties et détails ;
- preuves et FAQ après le catalogue ;
- offre logicielle expliquée sur une page distincte ;
- devis mis au même niveau que l'achat.

Sources officielles consultées :

- [Produits NFC connectés VKARD](https://vkard.io/produits-connectes-nfc/)
- [Fiche VKARD Custom PVC](https://vkard.io/produit/carte-de-visite-sans-contact-nfc-pvc/)
- [Comment fonctionne une carte connectée](https://vkard.io/comment-ca-marche/)
- [Plans Gratuit, Pro et Entreprise](https://vkard.io/plans-pricing/)

### Là où Tapote doit faire mieux

| Sujet | VKARD | Décision Tapote |
|---|---|---|
| Achat rapide | Simple, personnalisation après paiement | Aussi simple, avec « configurer plus tard » |
| Personnalisation | BAT différé, peu de rendu avant achat | Aperçu live facultatif, puis BAT de contrôle |
| Catalogue | Large, y compris accessoires | Trois objets maîtres et des packs utiles |
| Cas d'usage | Networking et avis Google | Avis, menu, réservation, Wi-Fi, paiement, formulaires et tout lien HTTPS |
| Compte | Compte achat et dashboard présentés comme deux applications | Une entrée « Connexion », puis orientation claire |
| Lien après achat | Modification gratuite incluse | Tapote Link inclus ; Pilot Pro seulement pour l'analyse avancée |
| Preuves | Avis, logos, cas clients, presse | Preuves réelles en situation et résultats de lieux, jamais de faux logos |
| Design | Simple mais générique par endroits | Matière et geste au centre, interface plus calme et plus éditoriale |

## Thèses de design

### Thèse visuelle

**Atelier tactile pour lieux réels** : noir encre, blanc cassé et bleu électrique seulement au moment de l'action ; gros plans de matière, chants, impression et main en situation ; chaque page s'organise autour d'un seul objet physique dominant.

Tant que les produits définitifs ne sont pas photographiés, les rendus doivent porter la mention « Visualisation de pré-série ».

### Plan de contenu

1. **Hero** — Tapote, la promesse, un objet dominant, deux chemins : Boutique ou Studio.
2. **Support** — le geste NFC + QR et le résultat immédiat.
3. **Détail** — trois objets, personnalisation, Tapote Link et Pilot.
4. **Preuve et conversion** — installations réelles, FAQ, achat ou devis.

### Thèse d'interaction

- entrée lente et nette de l'objet dans le hero ;
- une impulsion au point NFC au moment où le téléphone approche ;
- transition partagée entre miniature Boutique et aperçu Studio ;
- aucune animation décorative permanente ; toutes sont supprimées avec `prefers-reduced-motion`.

## Architecture d'information cible

```text
/
├── /boutique
│   ├── /produits/tapote-comptoir
│   ├── /produits/tapote-plaque
│   ├── /produits/tapote-card
│   └── /packs
├── /creer-mon-tapote
│   ├── /creer-mon-tapote/card
│   ├── /creer-mon-tapote/comptoir
│   ├── /creer-mon-tapote/plaque
│   └── /signature
├── /comment-ca-marche
├── /tapote-pilot
├── /reseaux-et-devis
│   └── /devis
├── /clients
│   └── /clients/:slug
├── /faq
├── /connexion
├── /pilot/*
├── /panier
├── /commande
│   └── /commande/confirmee
└── pages légales
```

### Routes historiques

- `/personnaliser` → redirection permanente vers `/creer-mon-tapote`.
- `/produits/chevalet` → `/produits/tapote-comptoir`.
- `/produits/plaque` → `/produits/tapote-plaque`.
- `/produits/carte` → `/produits/tapote-card`.
- `/categorie/*` → redirection vers la Boutique avec filtre correspondant.
- `/designs` → `/creer-mon-tapote`.
- `/secteurs` et `/secteurs/:slug` peuvent rester comme pages SEO lorsque de vraies preuves par secteur existent ; elles ne doivent plus rendre une copie de l'accueil.

Une ancienne URL peut être conservée pour le référencement, mais deux URL ne doivent pas afficher exactement la même page avec des métadonnées différentes.

`/creer-mon-tapote` n'est pas un éditeur : c'est une page d'orientation très courte. Le choix Card ouvre le Card Builder ; Comptoir et Plaque ouvrent le Studio à grille fixe ; Signature ouvre le brief assisté en conservant l'objet déjà choisi.

## Navigation

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Série pilote · disponibilité limitée             NFC + QR · Link inclus     │
├──────────────────────────────────────────────────────────────────────────────┤
│ tapote.  Boutique⌄  Comment ça marche  Pilot  Réseaux & devis   Connexion   │
│                                              [Créer mon Tapote]   [Panier 2] │
└──────────────────────────────────────────────────────────────────────────────┘
```

Le menu Boutique contient seulement :

```text
OBJETS
Tapote Comptoir     Caisse, accueil, table
Tapote Plaque       Mur, miroir, entrée
Tapote Card         Terrain, rendez-vous

ACHETER AUTREMENT
Voir toute la boutique
Packs pour un lieu
```

Règles :

- cinq destinations principales maximum ;
- « Créer mon Tapote » est le seul CTA bleu du header ;
- « Connexion » mène à une page qui explique ensuite Pilot ou la gestion de commande, pas à deux comptes concurrents ;
- le panier reste visible ;
- aucune liste de 15 secteurs dans le header.

### Mobile

```text
┌─────────────────────────────────┐
│ tapote.              [Panier] ☰ │
└─────────────────────────────────┘

Menu plein écran :
Boutique
Créer mon Tapote
Comment ça marche
Tapote Pilot
Réseaux & devis
────────────────
Clients · FAQ · Connexion
```

Le piège de focus et le retour de focus déjà présents dans `Header` sont à conserver.

## Wireframe — Accueil

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ HERO PLEIN ÉCRAN                                                            │
│ tapote.                                                                     │
│ Le bon geste. Au bon endroit.        [photo réelle du Comptoir, très grand] │
│ Avis, menu, réservation ou lien :                                            │
│ votre client ouvre l'action utile.                                          │
│ [Voir la boutique]  [Créer mon Tapote]                                      │
│ NFC + QR · lien modifiable inclus · sans application                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ UNE DÉMONSTRATION, PAS QUATRE CARTES                                        │
│ Approchez → la bonne page s'ouvre → changez le lien sans changer l'objet    │
│ [séquence visuelle en trois états sur un même axe]                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TROIS OBJETS                                                                │
│ Comptoir / Plaque / Card                                                     │
│ Grande image, usage, prix « à partir de » seulement après validation         │
│ [Voir le produit]                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ PERSONNALISATION                                                            │
│ Votre marque, visible avant de commander.                                   │
│ curseur avant/après ou un aperçu live réellement manipulable                │
│ [Ouvrir le Studio]                                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TAPOTE LINK INCLUS / PILOT PRO OPTIONNEL                                    │
│ Modifier le lien gratuitement | Mesurer plusieurs lieux avec Pilot           │
│ [Découvrir Pilot]                                                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ PREUVES RÉELLES : installation + citation + résultat                        │
│ N'afficher ce bloc qu'avec autorisations et données conservées.              │
│ [Voir les cas clients]                                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ FAQ COURTE (5 questions)               [Voir toute la FAQ]                   │
│ CTA FINAL : [Acheter un Tapote] [Parler de mon lieu]                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Copy clé

- H1 : **« Le bon geste. Au bon endroit. »**
- Soutien : **« Tapote ouvre l'avis, le menu, la réservation ou le lien utile au moment exact où votre client en a besoin. »**
- CTA primaire : **« Voir la boutique »**
- CTA secondaire : **« Créer mon Tapote »**
- Démonstration : **« Approchez. Ouvrez. C'est fait. »**
- Personnalisation : **« Votre identité, visible avant impression. »**
- Pilot : **« Le lien est inclus. Pilot mesure. »**

L'accueil ne contient plus le configurateur complet. Il donne envie et oriente.

## Wireframe — Boutique

### Objectif

Répondre en moins de dix secondes à trois questions :

1. quel objet correspond à mon emplacement ;
2. combien coûte-t-il ;
3. puis-je l'acheter sans le personnaliser maintenant.

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ BOUTIQUE                                                                    │
│ Trois objets. Une même qualité.                                              │
│ [Tous] [Comptoir] [Mur] [Terrain] [Packs]                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│ photo Comptoir       │ │ photo Plaque         │ │ photo Card           │
│ TAPOTE COMPTOIR      │ │ TAPOTE PLAQUE        │ │ TAPOTE CARD          │
│ Caisse · table       │ │ Mur · entrée         │ │ Terrain · rendez-vous│
│ à partir de XX €     │ │ à partir de XX €     │ │ à partir de XX €     │
│ [Acheter prêt]       │ │ [Acheter prêt]       │ │ [Acheter prêt]       │
│ Personnaliser        │ │ Personnaliser        │ │ Personnaliser        │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘

PACKS POUR UN LIEU
[Duo Comptoir + Plaque] [Pack 5 / sur devis selon coût réel]

COMMENT CHOISIR
Comptoir si... | Plaque si... | Card si...

FAQ PRODUIT + preuves + CTA devis
```

### Règles de catalogue

- pas d'accessoires au lancement ;
- pas de grille de 18 actions : toutes les destinations fonctionnent avec tous les objets ;
- pas de SKU public séparé uniquement parce que le graphisme est Noir, Blanc ou personnalisé ;
- utiliser le filtre pour l'emplacement, pas pour le métier ;
- une carte produit contient au maximum : image, nom, emplacement, prix, statut et un CTA ;
- le prix « à partir de » correspond à un produit réellement achetable, jamais à une option introuvable.

La Boutique expose les trois niveaux sans forcer un choix supplémentaire avant l'achat :

- CTA principal de la carte produit : **« Acheter prêt »** ;
- lien secondaire : **« Personnaliser »**, qui ouvre directement le moteur approprié ;
- bande éditoriale après les produits : **« Besoin d'une création unique ? Découvrir Signature »**.

Signature ne devient pas un troisième bouton de même poids sur chaque vignette : cela ralentirait le parcours le plus fréquent.

## Wireframe — Fiche produit

### Desktop

```text
┌───────────────────────────────┬──────────────────────────────────────────────┐
│ grande photo réelle           │ TAPOTE COMPTOIR                             │
│                               │ Le point d'action de la caisse et de l'accueil│
│ [miniature] [détail] [usage]  │ ★ avis réels seulement                      │
│                               │ XX €                                        │
│                               │                                              │
│                               │ Design                                      │
│                               │ (•) Tapote Noir  ( ) Tapote Blanc            │
│                               │                                              │
│                               │ Quantité  [−] 1 [+]                          │
│                               │                                              │
│                               │ [Ajouter au panier — XX €]                   │
│                               │ Je renseignerai mon lien après la commande   │
│                               │                                              │
│                               │ [Personnaliser]  [Demander Signature]        │
│                               │                                              │
│                               │ NFC + QR · Link inclus · contrôlé avant envoi│
└───────────────────────────────┴──────────────────────────────────────────────┘

MATIÈRE ET FINITION
[gros plan + spécifications vérifiées]

COMMENT IL S'UTILISE
[trois moments réels, pas trois cartes UI]

CE QUI EST INCLUS
Objet / NFC / QR / activation / Tapote Link / contrôle

PILOT, DÉLAIS, GARANTIE, FAQ, PREUVES
```

### Achat rapide

Le lien exact ne doit pas être obligatoire avant le paiement. La fiche propose :

- « Configurer le lien maintenant » — ouvre un champ ou une étape légère ;
- « Je le ferai après la commande » — valeur par défaut permise ;
- un rappel post-paiement et dans Pilot/Link.

Le CTA secondaire « Personnaliser » transmet le produit, la quantité et le design déjà choisis au moteur approprié. « Demander Signature » transmet les mêmes informations au brief assisté. Le client ne recommence jamais.

### Présentation des trois niveaux sur la fiche

```text
(•) Prêt à servir   Composition Tapote finie                  inclus
( ) Personnaliser   Logo, couleurs et message dans une grille + YY €
( ) Signature       Création accompagnée + BAT                + ZZ € / devis
```

Le niveau Prêt à servir est présélectionné. Le choix « Personnaliser » change le CTA en « Ouvrir le Card Builder » ou « Ouvrir le Studio ». Le choix « Signature » change le CTA en « Démarrer mon brief ». Aucun moteur lourd n'est chargé tant que le visiteur reste sur Prêt à servir.

### Mobile

- photo dominante puis titre, prix et CTA dans le premier écran utile ;
- galerie horizontale contrôlée par l'utilisateur ;
- barre d'achat fixe en bas : `XX € | Ajouter` ;
- la barre tient compte de `env(safe-area-inset-bottom)` et ne masque aucun champ ;
- « Personnaliser » reste un lien secondaire immédiatement sous le CTA principal ;
- aucun aperçu sticky qui occupe plus de 45 % de la hauteur lorsque le clavier est ouvert.

## Wireframe — Créer mon Tapote et ses trois moteurs

### Principe

`/creer-mon-tapote` oriente ; il n'essaie pas de dessiner tous les produits avec le même outil.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ CRÉER MON TAPOTE                                                            │
│ Comment voulez-vous commencer ?                                             │
│                                                                              │
│ [Prêt à servir]       [Personnaliser]        [Signature]                     │
│ Le plus rapide        Aperçu contraint       Création accompagnée + BAT      │
│ Noir ou Blanc         selon votre objet      service facturé                 │
│                                                                              │
│ Quel objet ? [Comptoir] [Plaque] [Card]                                      │
│                                               [Continuer]                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

Si le visiteur arrive depuis une fiche produit, l'objet est déjà sélectionné et cette question disparaît.

Les 15 secteurs deviennent une aide facultative « Recommandez-moi un Tapote selon mon activité », jamais un prérequis. Les compositions `2 chevalets / mix / 2 plaques` appartiennent à une fiche Pack ou au panier.

### Moteur 1 — Card Builder

La carte suit une logique recto-verso. Il n'y a ni grille libre, ni déplacement manuel.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ CARD BUILDER                         RECTO ●────────○ VERSO                  │
├───────────────────────────────────────┬──────────────────────────────────────┤
│                                       │ RECTO · IDENTITÉ                     │
│       APERÇU CARTE RECTO              │ Logo [Importer]                      │
│                                       │ Nom / fonction / société             │
│       [Retourner la carte]             │ Layout (•) 01 ( ) 02 ( ) 03          │
│                                       │ Noir / Blanc / palette du logo       │
│                                       │                          [Continuer] │
├───────────────────────────────────────┴──────────────────────────────────────┤
│ Brouillon enregistré · Card + personnalisation YY €                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

Verso obligatoire et stable :

```text
┌───────────────────────────────────────┐
│ [zone NFC claire]   Tapotez ici       │
│                                       │
│                 [QR avec zone calme]  │
│ tapote.fr/t/nom-court                 │
└───────────────────────────────────────┘
```

Règles du Card Builder :

- recto : identité, trois layouts maximum ;
- verso : NFC, QR et URL courte toujours présents aux emplacements sûrs ;
- le client peut choisir les contenus, pas déplacer les composants techniques ;
- aucun drag-and-drop, rotation ou redimensionnement libre ;
- contraste, débord, zone calme du QR et repère NFC sont sécurisés par le moteur ;
- la destination exacte peut être transmise plus tard ;
- le recto et le verso sont vérifiés dans le résumé avant panier.

### Moteur 2 — Studio Plaque / Comptoir à grille fixe

Plaque et Comptoir partagent une grammaire de marque, inspirée du prototype Bulle de Jeux, mais chaque objet garde son gabarit d'impression.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ STUDIO COMPTOIR                     1 Marque — 2 Action — 3 Style — 4 BAT    │
├───────────────────────────────────────┬──────────────────────────────────────┤
│ ┌───────────────────────────────────┐ │ ZONE 1 · MARQUE                      │
│ │ LOGO / NOM                 24 %   │ │ [Importer le logo] [Nom de marque]   │
│ ├───────────────────────────────────┤ │                                      │
│ │ MESSAGE D'ACTION           48 %   │ │ ZONE 2 · ACTION                     │
│ │ sous-message                       │ │ [Avis] [Menu/Réserver] [Contact]     │
│ ├───────────────────────────────────┤ │ [Voir les 18 destinations]           │
│ │ NFC + TAPOTEZ     QR       28 %   │ │ Message principal [prérempli]        │
│ └───────────────────────────────────┘ │                                      │
│       APERÇU LIVE À GRILLE FIXE       │ ZONE 3 · STYLE                       │
│                                       │ Noir/Blanc · couleurs · pattern       │
│                                       │                          [Continuer] │
└───────────────────────────────────────┴──────────────────────────────────────┘
```

Zones fonctionnelles :

1. **zone marque** — logo ou nom, avec taille et marge maximales ;
2. **zone action** — message principal et phrase secondaire ;
3. **zone NFC / QR** — appel à l'action, repère NFC, QR et zone calme inviolable.

Choix accessibles :

- logo ;
- nom de marque ;
- destination ;
- message prérempli puis éditable ;
- Noir, Blanc ou palette issue du logo ;
- un pattern parmi une collection courte.

Choix interdits au client :

- déplacer librement le QR ou le NFC ;
- réduire le QR sous le seuil de production ;
- faire chevaucher une zone ;
- utiliser un contraste insuffisant ;
- sortir un élément du fond perdu ;
- transformer le Studio en logiciel de PAO.

Les 18 destinations restent disponibles dans une liste recherchable et groupée : confiance, vendre et servir, fidéliser, accès rapide. Quatre raccourcis couvrent les besoins les plus fréquents.

### Moteur 3 — Signature

Signature n'est pas un onglet « avancé » du Studio. C'est un service distinct et facturé.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TAPOTE SIGNATURE                                                            │
│ Une création conçue pour votre lieu, puis validée avec vous.                 │
│                                                                              │
│ Objet       [Comptoir / Plaque / Card / composition]                        │
│ Usage       [Avis / menu / réservation / autre]                             │
│ Identité    [Logo] [charte] [photos du lieu]                                │
│ Contexte    [où sera posé le Tapote ?]                                      │
│ Quantité    [ ]       Échéance [ ]                                           │
│ Brief       [................................................................]│
│                                                                              │
│ Service Signature : prix fixe publié ou devis explicite                     │
│ Comprend : proposition, contrôle technique, BAT et nombre de retours défini  │
│                                                [Envoyer mon brief]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

Processus :

1. brief court et paiement du service ou validation du devis ;
2. proposition conçue avec assistance humaine/IA ;
3. contrôle technique ;
4. BAT envoyé au client ;
5. nombre de retours inclus clairement annoncé ;
6. validation explicite ;
7. production.

L'IA accélère la création mais n'est pas la promesse commerciale. La promesse est le résultat, la cohérence avec le lieu et le contrôle humain.

### Résumé commun avant panier

```text
Objet        Tapote Comptoir
Usage        Avis Google
Création     Personnaliser · grille fixe
Quantité     1
Lien         À transmettre après commande / https://...
BAT          Contrôle inclus avant production
Prix         objet XX € + service YY €

[Modifier]                              [Ajouter au panier]
```

Ne pas écrire « Vous commandez ce que vous voyez, pas de validation ultérieure » tant que le processus de production prévoit un BAT. L'aperçu live prépare le BAT ; il ne remplace pas le contrôle de fabrication.

### Mobile des moteurs

Le système actuel « Aperçu / Configurer » reste utile pour Card Builder et Studio Plaque/Comptoir, avec ces ajustements :

- onglets collants sous le header, pas en doublon dans chaque section ;
- annonce de l'étape et du moteur : `Card Builder · Recto` ou `Studio Comptoir · Action` ;
- un seul CTA fixe `Continuer` ou `Ajouter` ;
- sur Card, bouton explicite « Voir le verso » ;
- sur Plaque/Comptoir, les trois zones de la grille sont nommées dans l'aperçu ;
- quand l'utilisateur revient à l'aperçu, un résumé compact nomme l'objet, l'usage et le prix ;
- à chaque changement de panneau, déplacer le focus vers le titre du panneau sans provoquer de saut visuel ;
- sauvegarde locale visible : « Brouillon enregistré » ;
- le bouton précédent est toujours disponible ;
- Signature utilise un formulaire mobile simple et n'embarque pas le moteur d'aperçu lourd.

## Deux parcours complets

### Parcours A — achat rapide

```text
Accueil
  → Voir la boutique
  → Fiche Tapote Comptoir
  → Noir / Blanc + quantité
  → Ajouter au panier
  → Paiement
  → Configurer le lien maintenant ou depuis l'e-mail
  → BAT / contrôle
  → Production
```

Budget cognitif avant panier : un objet, une finition, une quantité.

### Parcours B — personnalisé

```text
Accueil ou fiche produit
  → Créer mon Tapote
  → Objet
  → Card Builder OU Studio Plaque/Comptoir
  → Usage + identité dans la grille sécurisée
  → Vérifier recto/verso ou les trois zones
  → Panier
  → Paiement
  → BAT / contrôle
  → Production
```

### Parcours C — Signature

```text
Accueil, Boutique ou fiche produit
  → Signature
  → Objet + usage + identité + contexte du lieu
  → Brief envoyé
  → Service payé ou devis validé
  → Proposition humaine/IA
  → BAT et retours inclus
  → Validation
  → Production
```

Les deux moteurs peuvent être quittés et repris. Le panier permet « Modifier la personnalisation » sans ajouter une deuxième ligne. Signature garde son propre statut de projet et ne tente pas de rouvrir un éditeur universel.

## Tapote Pilot

Il faut conserver deux surfaces distinctes :

- `/tapote-pilot` — page marketing ;
- `/pilot/*` — logiciel après connexion.

### Wireframe page marketing

```text
HERO
Un seul poste. Tous vos Tapote.
[Voir la démo] [Se connecter]

TAPOTE LINK — INCLUS
Changer la destination, vérifier le support, historique essentiel.

PILOT PRO — OPTIONNEL
Périodes d'analyse, NFC/QR, lieux, export, alertes.
[comparatif lisible]

CAPTURE RÉELLE DU PRODUIT
Supports / lieux / interactions / changement de lien

TARIF TESTÉ, FAQ, CTA
```

La copy du checkout actuelle doit être corrigée partout : Tapote Link permet les modifications illimitées ; Pilot Pro n'est pas requis pour changer une destination.

## Réseaux et devis

Éviter « Entreprise » tant que Tapote ne propose ni SSO, ni CRM, ni SLA. La page doit parler à un responsable de plusieurs lieux sans imiter l'offre entreprise de VKARD.

### Nom

**Réseaux & devis**  
Sous-titre : **« Équipez plusieurs points de contact, sans multiplier la gestion. »**

### Structure

```text
HERO + [Demander un devis]
À QUI CELA S'ADRESSE : un lieu complet / plusieurs lieux / une équipe terrain
CE QUI EST LIVRÉ : composition, BAT, encodage, contrôle, déploiement
EXEMPLE DE DÉPLOIEMENT : 5 objets dans un restaurant
TAPOTE LINK / PILOT PRO
PREUVES RÉELLES
FORMULAIRE COURT
FAQ DEVIS
```

Le formulaire demande seulement :

- nom ;
- e-mail professionnel ;
- nombre de lieux ;
- volume approximatif ;
- besoin en texte libre ;
- consentement.

Le téléphone et le nom de société peuvent rester facultatifs. Le délai de réponse affiché doit être réellement tenu.

## Preuves et cas clients

### `/clients`

Chaque cas présente :

- le lieu et l'usage ;
- une photo réelle du Tapote installé ;
- le problème avant ;
- la composition installée ;
- la période observée ;
- un résultat chiffré contextualisé ;
- une citation autorisée ;
- la méthode de mesure.

Sur l'accueil, ne montrer que trois preuves maximum. Une collection de logos gris sans droit d'usage n'est pas une preuve.

Tant que les seuils ne sont pas atteints :

- remplacer le bloc « Ils nous font confiance » par « Série pilote en cours » ;
- montrer le protocole de test et les installations autorisées ;
- ne pas afficher une note ou un compteur non vérifié.

## FAQ

### Questions à mettre sur chaque fiche produit

1. Mon client doit-il installer une application ?
2. Que se passe-t-il si le NFC est désactivé ?
3. Puis-je changer le lien après réception ?
4. Que comprend la personnalisation ?
5. Vais-je valider un BAT ?
6. Quel est le matériau exact ?
7. Quel est le délai réel ?
8. Que se passe-t-il en cas de défaut NFC ?

### Questions de la page `/faq`

Ajouter :

- compatibilité iPhone et Android ;
- fonctionnement NFC et QR ;
- Tapote Link inclus / Pilot Pro optionnel ;
- données mesurées et confidentialité ;
- produits personnalisés et rétractation B2B ;
- encodage et verrouillage ;
- pose sur métal et version ferrite ;
- nettoyage ;
- commande de 10, 25, 50 ou 100 ;
- origine de fabrication, uniquement avec preuves documentées.

L'accordéon garde de vrais boutons, `aria-expanded`, `aria-controls`, titres structurés et fonctionnement clavier.

## Règles de simplification des commandes

| Situation | Contrôle recommandé | À éviter |
|---|---|---|
| 2 ou 3 choix exclusifs | boutons radio visuels / segmented control | liste déroulante opaque |
| 4 à 8 choix | grille courte ou radios | carrousel automatique |
| 18 destinations | recherche + liste groupée | 18 gros boutons dans la page |
| Quantité | stepper et remise visible | étape entière du Studio |
| Pack | fiche dédiée avec composition | recomposer un pack à chaque achat unitaire |
| Noir / Blanc | deux échantillons réels | noms de thèmes techniques |
| Layout Card | trois compositions verrouillées | canevas libre |
| Plaque / Comptoir | trois zones fixes et un pattern court | drag-and-drop |
| Couleurs exactes | panneau avancé replié | trois sélecteurs couleur au premier niveau |
| URL | facultative avant paiement | bloquer l'ajout au panier |
| Activité | aide de recommandation | obligation parmi 15 secteurs |
| Besoin hors grille | service Signature avec BAT | ajouter toujours plus de réglages |

Un choix ne doit jamais être à la fois un bouton, une carte, un onglet et un lien ailleurs sur le même écran.

## Responsive, accessibilité et performance

### Breakpoints

- `> 1180 px` : composition éditoriale large ;
- `761–1180 px` : deux colonnes lorsque l'aperçu reste lisible ;
- `≤ 760 px` : une colonne, navigation modale et barre d'action basse ;
- `≤ 370 px` : aucun texte essentiel masqué ; les contrôles passent sur une colonne.

### Accessibilité obligatoire

- zones tactiles d'au moins `44 × 44 px` ;
- inputs à `16 px` minimum sur mobile ;
- contraste WCAG AA : 4,5:1 pour le texte courant, 3:1 pour le grand texte et les composants ;
- aucun état communiqué uniquement par couleur ;
- `fieldset` et `legend` pour chaque groupe de choix ;
- `aria-pressed` ou radios natives pour les variantes ;
- l'aperçu décoratif reste `aria-hidden`, accompagné d'un résumé textuel actualisé ;
- annonces `aria-live="polite"` pour prix, ajout au panier et sauvegarde du brouillon, pas pour chaque frappe ;
- retour de focus après fermeture des menus et panneaux ;
- ordre clavier identique à l'ordre visuel ;
- erreurs près du champ, résumé d'erreurs au submit ;
- labels persistants, jamais remplacés uniquement par un placeholder ;
- respect de `prefers-reduced-motion`;
- support du zoom à 200 % sans perte d'action.

### Performance

- hero WebP/AVIF dimensionné, avec largeur et hauteur déclarées ;
- précharger une seule image LCP ;
- charger les scènes secondaires et captures Pilot à la demande ;
- ne pas faire tourner les simulations de téléphone hors écran ;
- objectif mobile : LCP < 2,5 s, CLS < 0,1, INP < 200 ms sur un appareil moyen ;
- chaque moteur de personnalisation peut être chargé dynamiquement ; Prêt à servir ne paie pas ce coût.

## Audit du repo actuel

### Actifs à réutiliser

| Existant | Réutilisation |
|---|---|
| `Shell`, `Header`, `Footer`, `UtilityBar` | base de layout, piège de focus mobile et panier |
| `ProductArt`, `InsertArtwork` | aperçu live des trois formes |
| `ProductScene`, `SectorScene` | hero, usages et contexte |
| `LivePhoneScreen` et applications simulées | démonstration du résultat ouvert |
| `BuyBox` | logique commune à extraire ; ne pas le conserver comme éditeur universel |
| upload logo + `prepareLogoFile` | étape Identité du Studio |
| `extractLogoPalette`, thèmes et contrôles de contraste | personnalisation avancée |
| sauvegarde `CONFIG_DRAFT_PREFIX` | reprise de brouillon |
| `PRODUCT_PAGES`, `HOME_SCENES` | données initiales des fiches et images |
| `OfferArchitectureSection` | base de la section trois objets |
| `HowStrip` | base du fonctionnement |
| `PilotMarketingSection` / `PilotMarketingPage` | base de la page Pilot |
| `CartPage`, `CheckoutPage`, `QuotePage`, `ConfirmationPage` | tunnel transactionnel |
| `PRODUCTS`, `ACTIONS`, `ACTION_CATEGORIES` | données centrales à normaliser |
| `sectorData.js` | moteur de recommandation facultatif et futures pages SEO |
| analytics existantes | base des événements e-commerce |

### Problèmes structurels

1. `isHomeSurface()` envoie `/`, `/boutique`, `/designs`, `/personnaliser`, les catégories, les fiches produit et les secteurs vers le même `HomePage`.
2. Les métadonnées font croire à des pages distinctes alors que le contenu principal est identique.
3. Le commentaire de `StorefrontV3.jsx` affirme volontairement « il n'y a donc pas de boutique » ; cette décision est désormais contraire au besoin fondateur.
4. `BuyBox` gère l'intégralité du parcours, de l'upload à la quantité et aux packs, dans un seul composant.
5. `StorefrontV3.jsx` dépasse 2 700 lignes et `storefront-v3.css` dépasse 6 500 lignes, avec plusieurs générations de styles de pages produit encore présentes.
6. `PRODUCT_PAGES` et de nombreux styles `.v3-product-*` existent, mais aucune vraie `ProductPage` n'est rendue.
7. le checkout contient encore une phrase indiquant que Pilot est nécessaire pour changer le lien, en contradiction avec la nouvelle offre Tapote Link.
8. le modèle de catalogue duplique `ready` et `custom` comme produits physiques différents, alors que la matière doit être identique.
9. les prix et formulations actuels sont liés aux anciens supports et ne doivent pas survivre automatiquement au changement de matière.
10. la navigation lit `window.location.pathname` sans routeur client et les liens provoquent des rechargements complets ; ce n'est pas bloquant pour le MVP, mais le bouton précédent, les transitions et la restauration de focus doivent être testés.

## Architecture de composants recommandée

```text
src/storefront/
├── StorefrontRouter.jsx
├── layout/
│   ├── SiteShell.jsx
│   ├── SiteHeader.jsx
│   └── SiteFooter.jsx
├── pages/
│   ├── HomePage.jsx
│   ├── ShopPage.jsx
│   ├── ProductPage.jsx
│   ├── StudioPage.jsx
│   ├── HowPage.jsx
│   ├── PilotMarketingPage.jsx
│   ├── NetworksPage.jsx
│   ├── ClientsPage.jsx
│   └── FaqPage.jsx
├── commerce/
│   ├── ProductCard.jsx
│   ├── ProductGallery.jsx
│   ├── ProductPurchase.jsx
│   ├── CartPage.jsx
│   └── CheckoutPage.jsx
├── studio/
│   ├── CreateEntryPage.jsx
│   ├── shared/
│   │   ├── useTapoteDraft.js
│   │   ├── DestinationPicker.jsx
│   │   ├── BrandInputs.jsx
│   │   └── ConfigurationSummary.jsx
│   ├── card/
│   │   ├── CardBuilder.jsx
│   │   ├── CardFrontEditor.jsx
│   │   ├── CardBackPreview.jsx
│   │   └── cardLayouts.js
│   ├── fixtures/
│   │   ├── FixtureStudio.jsx
│   │   ├── BrandZone.jsx
│   │   ├── ActionZone.jsx
│   │   ├── NfcQrZone.jsx
│   │   └── patterns.js
│   └── signature/
│       ├── SignatureBrief.jsx
│       └── SignatureSummary.jsx
└── data/
    ├── products.js
    ├── destinations.js
    └── routes.js
```

Il n'est pas nécessaire d'ajouter immédiatement une grosse dépendance de routage. Le routeur manuel peut d'abord rendre de vraies pages distinctes. En revanche, si une navigation sans rechargement est ajoutée, elle doit écouter `popstate`, mettre à jour le titre, déplacer le focus sur le `main` et conserver les URL partageables.

## Modèle catalogue cible

Séparer :

- **objet physique** : Comptoir, Plaque, Card ;
- **offre créative** : Prêt à servir, Personnaliser ou Signature ;
- **moteur** : aucun pour Prêt, Card Builder pour Card, grille fixe pour Comptoir/Plaque, brief pour Signature ;
- **service graphique** : composition contrainte ou création accompagnée ;
- **variante** : Noir / Blanc, finition réellement disponible ;
- **quantité** ;
- **destination** : donnée de configuration, pas SKU ;
- **Tapote Link / Pilot** : service logiciel, pas caractéristique physique ;
- **pack** : composition explicite de plusieurs objets.

Cela évite d'avoir `comptoir_standard` et `comptoir` comme deux produits de matière identique. Une migration devra cependant préserver les anciens paniers et les références de commandes.

## Priorités de changement

### P0 — avant toute réouverture

1. rendre `/boutique`, les trois fiches produit et `/creer-mon-tapote` réellement distincts ;
2. remplacer la navigation actuelle par Boutique / Fonctionnement / Pilot / Réseaux & devis / Studio ;
3. sortir le configurateur complet de l'accueil ;
4. autoriser l'achat rapide sans URL ni personnalisation ;
5. corriger toutes les contradictions Tapote Link / Pilot, y compris dans le checkout ;
6. remplacer les anciens prix et matières uniquement après devis ;
7. afficher « Visualisation de pré-série » sur les rendus non photographiques.

### P1 — conversion

1. remplacer `BuyBox` par Card Builder, Studio Plaque/Comptoir à grille fixe et brief Signature ;
2. créer les vraies galeries produit ;
3. normaliser le modèle catalogue ;
4. ajouter FAQ contextuelle et page FAQ ;
5. créer Réseaux & devis ;
6. instrumenter les deux parcours ;
7. publier les premières preuves autorisées.

### P2 — croissance

1. cas clients détaillés ;
2. pages secteur uniquement pour les verticales prouvées ;
3. comparaison Pilot ;
4. navigation client sans rechargement ou rendu statique/SSR pour les pages SEO ;
5. tests d'expérimentation sur l'ordre des CTA, pas sur des remises artificielles.

## Risques techniques et commerciaux

| Risque | Réponse |
|---|---|
| Anciens paniers liés aux IDs `*_standard` et `custom` | fonction de migration versionnée au chargement |
| API catalogue et stock liée aux IDs actuels | adapter contrat serveur avant suppression des IDs |
| Stripe ou gestion interne liée aux anciens prix | test de bout en bout avec environnement de test |
| Liens profonds existants vers `/?support=...` | redirection vers fiche ou Studio en conservant les paramètres |
| Perte d'un brouillon en quittant le Studio | stockage versionné + confirmation de reprise |
| Logo envoyé puis route changée | conserver `uploadId`, afficher état et permettre suppression |
| Un brouillon Card ouvert dans le Studio Comptoir | schémas de brouillon et versions distincts par moteur |
| Grille fixe trop restrictive | orienter vers Signature, sans déverrouiller le canevas |
| Signature devient un devis flou | prix ou règle de devis, livrables, délai et retours affichés avant envoi |
| Doublons SEO entre anciennes et nouvelles routes | 301 + canonical unique |
| Aperçu trop lourd sur mobile | chargement dynamique, pause hors écran, image de secours |
| Produit rendu plus beau que le prototype | label pré-série puis remplacement par photos réelles |
| Personnalisation perçue comme supplément sans valeur | ligne de prix du service et BAT explicites |
| Achat rapide qui oublie le lien | séquence post-commande et statut « configuration requise » |
| Barre fixe qui masque le checkout | espace bas, safe area et test clavier ouvert |

## Mesure

Événements minimum :

- `view_item_list`;
- `select_item`;
- `view_item`;
- `quick_buy_start`;
- `studio_start`;
- `builder_type_selected` : card, fixture ou signature ;
- `studio_step_complete`;
- `select_destination`;
- `upload_logo`;
- `studio_complete`;
- `add_to_cart`;
- `begin_checkout`;
- `purchase`;
- `quote_start`;
- `quote_submit`.

Indicateurs :

- accueil → Boutique ;
- accueil → Studio ;
- fiche → panier ;
- Studio commencé → terminé ;
- abandon par étape ;
- part « lien plus tard » ;
- panier → paiement ;
- devis envoyé ;
- délai réel entre achat et configuration complète.

Ne pas optimiser uniquement le taux d'ajout au panier : une commande non configurable ou impossible à produire coûte plus cher qu'un abandon.

## Plan de tests

### Unitaires / intégration React

- chaque route affiche un H1 et un contenu uniques ;
- les anciennes routes redirigent sans perdre les paramètres utiles ;
- achat rapide : produit → panier sans URL ;
- personnalisé : fiche → Studio prérempli → panier ;
- modification depuis le panier remplace la ligne ;
- les trois layouts Card restent sûrs au recto et le verso technique ne peut pas être déplacé ;
- les zones marque, action et NFC/QR restent fixes sur Comptoir et Plaque ;
- les 18 destinations restent accessibles par recherche/liste ;
- un besoin hors grille passe à Signature avec les informations déjà saisies ;
- le choix de secteur reste une aide facultative ;
- chaque type de brouillon reprend dans le bon moteur et à la bonne étape ;
- Tapote Link est présenté comme inclus sur accueil, fiche, panier, checkout et Pilot ;
- le prix change une seule fois et est annoncé proprement ;
- le menu mobile garde son piège de focus ;
- les panneaux du Studio restaurent le focus ;
- aucun rendu décoratif n'ajoute un second `main`.

### E2E

- desktop 1440 × 900 ;
- tablette 834 × 1112 ;
- iPhone 390 × 844 ;
- petit Android 360 × 720 ;
- clavier seul ;
- zoom 200 % ;
- retour navigateur au milieu du Studio ;
- reprise après session Stripe expirée ;
- catalogue indisponible et produit en rupture ;
- upload logo valide, trop lourd et réseau interrompu dans Card Builder et Studio ;
- bascule Card recto/verso et lecture du résumé ;
- grille Plaque/Comptoir avec messages longs, logo horizontal et logo vertical ;
- brief Signature, tarif/livrables et accusé de réception ;
- URL invalide puis choix « plus tard » ;
- 1, 2, 5, 10 supports et bascule vers devis ;
- audit axe sans violation sérieuse ;
- budgets LCP, CLS et INP.

## Critères d'acceptation UX

La nouvelle architecture est prête lorsque :

1. un visiteur peut expliquer la différence entre Boutique et Studio après cinq secondes ;
2. il peut ajouter un produit standard au panier en trois décisions maximum ;
3. aucune URL n'est obligatoire avant paiement ;
4. les capacités utiles restent accessibles dans le moteur adapté, et les demandes hors grille passent à Signature ;
5. aucune page publique ne mélange achat, 15 secteurs, 18 actions et personnalisation complète dans le même premier écran ;
6. les trois fiches produit ont de vraies photos ou sont clairement marquées pré-série ;
7. Tapote Link inclus et Pilot Pro optionnel sont compris sans lire la FAQ ;
8. les preuves visibles sont vérifiables ;
9. le parcours mobile fonctionne à 360 px, au clavier et avec zoom ;
10. les anciennes commandes, paniers et liens profonds restent récupérables.
11. la Card ne peut utiliser que trois layouts recto et un verso technique sécurisé.
12. Plaque et Comptoir conservent les trois zones fixes marque / action / NFC-QR.
13. Prêt à servir reste achetable sans charger ni traverser un moteur de personnalisation.

## Recommandation finale

Il faut reprendre la **clarté structurelle** de VKARD, pas recopier son identité ni son catalogue. Tapote dépassera VKARD si le site permet simultanément :

- d'acheter plus vite que VKARD avec trois objets évidents ;
- de personnaliser mieux que VKARD grâce au rendu live facultatif ;
- de comprendre plus vite la valeur pour un lieu ;
- de modifier le lien gratuitement ;
- de voir des objets réels, des matières réelles et des résultats réels.

La Boutique vend l'objet. Card Builder, Studio fixe et Signature vendent trois niveaux de différence. Pilot prolonge la valeur. Les preuves rendent le tout crédible.
