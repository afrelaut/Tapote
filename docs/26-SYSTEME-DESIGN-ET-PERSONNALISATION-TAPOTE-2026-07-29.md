# Système design et personnalisation Tapote

Date : 29 juillet 2026  
Statut : décision produit à implémenter

## Verdict

Tapote ne doit pas utiliser un configurateur universel pour tous les objets.

- Une **carte** sert d'abord à identifier une personne et transmettre un contact.
- Une **plaque** et un **comptoir** servent à déclencher une action dans un lieu.
- Un visuel réellement sur mesure demande une prestation de design et ne doit pas être présenté comme une personnalisation instantanée.

La bonne architecture comprend donc trois moteurs distincts :

1. **Card Builder** pour les cartes.
2. **Studio Point d'action** pour les plaques et comptoirs.
3. **Signature** pour les créations sur mesure réalisées avec un designer et l'IA.

## 1. Card Builder — simple comme une carte de visite

### Objectif

Permettre de créer une carte professionnelle crédible en moins de deux minutes, sans transformer l'utilisateur en graphiste.

### Structure physique et visuelle

**Recto — identité**

- logo ;
- prénom et nom ;
- fonction ;
- entreprise ;
- e-mail ;
- téléphone ;
- éventuellement une URL courte.

**Verso — geste Tapote**

- logo Tapote discret ;
- symbole NFC et texte d'action ;
- QR code dynamique ;
- URL courte de secours ;
- fond simple, sans scène illustrée complexe.

### Personnalisation autorisée

- trois mises en page maximum ;
- logo ;
- photo facultative ;
- nom, fonction et coordonnées ;
- couleur principale ;
- couleur secondaire ;
- police parmi trois duos validés ;
- CTA parmi une petite liste : « Gardez mon contact », « Découvrez mon profil », « Échangeons », « Voir mes liens ».

### Personnalisation interdite

- placement libre de chaque bloc ;
- génération d'un décor IA ;
- motifs complexes et textes longs ;
- plus de deux couleurs principales ;
- déplacement libre de la zone NFC ou du QR code.

### Règle de fabrication

Le PVC reste le produit de référence pour la portée NFC. Le QR code est obligatoire sur toutes les cartes.

La carte métal doit rester en phase 2. Avant commercialisation :

- inlay compatible métal ou couche ferrite qualifiée ;
- zone d'antenne non imprimée ou gravée si nécessaire ;
- tests iPhone et Android sur plusieurs générations ;
- test sur dix lectures consécutives ;
- mesure du temps de réaction et de la distance ;
- comparaison directe avec la carte PVC ;
- seuil go/no-go défini avant lancement.

Un avis client VKARD visible dans les éléments de recherche signale une lecture plus lente de la carte métal que de la carte plastique. Tapote doit traiter ce point comme un risque technique majeur et non comme un simple détail de design.

## 2. Studio Point d'action — plaques et comptoirs

### Objectif

Transformer la qualité visuelle du prototype Bulle de Jeux en système personnalisable sans avoir à régénérer une création IA pour chaque client.

### Grille fixe

Le support utilise quatre zones dont la taille et la position sont verrouillées :

1. **Zone marque** : logo, nom, micro-description.
2. **Zone promesse** : une phrase principale courte.
3. **Zone réassurance** : étoiles, bénéfice ou instruction secondaire.
4. **Zone geste** : bloc NFC et bloc QR côte à côte.

Le client personnalise le contenu de la grille ; il ne redessine pas la grille.

### Ce que l'utilisateur choisit

- objectif : avis, menu, réservation, Wi-Fi, paiement, réseaux, lien ;
- format : Comptoir ou Plaque ;
- style : Essentiel, Commerce, Élégant ;
- logo ;
- deux couleurs récupérées automatiquement depuis le logo puis modifiables ;
- message principal ;
- courte ligne secondaire ;
- motif de fond parmi une bibliothèque ;
- QR code et lien dynamique générés automatiquement.

### Ce que Tapote verrouille

- marges de sécurité ;
- contraste minimal ;
- taille minimale des textes ;
- taille et quiet zone du QR code ;
- position et zone du lecteur NFC ;
- signature Tapote ;
- hiérarchie typographique ;
- fond perdu et traits de coupe ;
- résolution et espace colorimétrique du fichier imprimé.

### Traduction du prototype Bulle de Jeux

Le visuel est à conserver comme archétype **Commerce / Chaleureux** :

- identité de l'établissement immédiatement visible ;
- phrase « Votre avis compte, tapotez » très efficace ;
- étoiles comme preuve visuelle ;
- séparation claire NFC / QR ;
- couleurs de marque bien reprises.

Ce qu'il faut remplacer :

- le porte-affiche transparent générique ;
- la feuille glissée dans l'acrylique ;
- la transparence et le texte visibles par l'arrière ;
- l'impression qui semble rapportée sur un accessoire standard.

Le design doit être imprimé directement sur un objet fini : plaque rigide imprimée UV, acrylique imprimé au verso avec blanc de soutien, ou coque/face remplaçable conçue spécialement pour Tapote.

## 3. Signature — le vrai sur-mesure

### Pourquoi

Un design créé avec direction artistique et IA ne peut pas devenir honnêtement un bouton « en un clic ». Il nécessite du temps, des choix et un contrôle humain.

### Offre

**Signature Tapote**

- brief guidé ;
- une proposition ;
- deux séries de retours ;
- adaptation au support ;
- BAT numérique ;
- livraison du fichier de production ;
- délai cible de 48 à 72 heures ouvrées.

Prix de test recommandé : **+39 € HT par identité visuelle**, valable sur plusieurs supports d'une même commande. Le prix devra être validé par le temps réel passé sur dix dossiers.

Le supplément rémunère le service graphique, pas une fausse différence de qualité matérielle.

## 4. Parcours sur le site

### Depuis une fiche produit

Le client choisit d'abord le produit et la quantité. Ensuite seulement :

1. **Prêt à servir** — design Tapote déjà prêt.
2. **Personnaliser** — ouverture du bon éditeur selon le support.
3. **Signature** — dépôt du logo et du brief, puis prise en charge par Tapote.

### Pour la carte

`Choisir la carte → Choisir un des 3 layouts → Renseigner l'identité → Choisir 2 couleurs → Vérifier recto/verso → Ajouter au panier`

### Pour la plaque ou le comptoir

`Choisir le support → Choisir l'objectif → Choisir un style → Ajouter logo et couleurs → Modifier la phrase → Vérifier l'aperçu → Ajouter au panier`

### Pour Signature

`Choisir le support → Déposer logo et inspirations → Répondre à 5 questions → Payer produit + service → Recevoir le BAT → Valider la production`

## 5. Données nécessaires à la génération

### Modèle carte

```json
{
  "product": "card-pvc",
  "layout": "identity-split-01",
  "identity": {
    "logo": "asset-id",
    "firstName": "Aymeric",
    "lastName": "Frelaut",
    "role": "Fondateur",
    "company": "Tapote",
    "email": "aymeric@tapote.fr",
    "phone": "06 63 15 04 49"
  },
  "theme": {
    "primary": "#2864ff",
    "secondary": "#111111",
    "fontPair": "tapote-grotesk"
  },
  "action": {
    "type": "contact",
    "cta": "Gardez mon contact",
    "shortUrl": "tapote.fr/aymeric",
    "qr": "generated"
  }
}
```

### Modèle plaque/comptoir

```json
{
  "product": "comptoir-a6",
  "template": "commerce-warm-01",
  "brand": {
    "logo": "asset-id",
    "name": "Bulle de Jeux",
    "descriptor": "Librairie BD · Jeux de société · Figurines"
  },
  "theme": {
    "primary": "#7b201a",
    "secondary": "#f2dfc2",
    "pattern": "brand-watermark"
  },
  "action": {
    "type": "review",
    "headline": "Votre avis compte, tapotez.",
    "nfcLabel": "Posez votre téléphone ici",
    "qrLabel": "Ou scannez",
    "shortUrl": "tapote.fr/bulle"
  }
}
```

Ces données doivent produire :

- un aperçu web ;
- un PDF de BAT ;
- un fichier d'impression ;
- un manifeste de production avec URL NFC/QR ;
- une miniature de commande.

## 6. Catalogue initial recommandé

### Cartes

- PVC blanc personnalisé ;
- PVC noir personnalisé ;
- carte Tapote prête à servir ;
- métal uniquement après validation technique.

### Points d'action

- Comptoir prêt à servir ;
- Comptoir personnalisable ;
- Plaque prête à servir ;
- Plaque personnalisable.

### Packs

- **Pack Local** : 1 Comptoir + 1 Plaque ;
- **Pack Parcours** : 2 Comptoirs + 3 Plaques.

Les stickers et badges peuvent exister ensuite comme produits prêts à l'emploi. Ils ne doivent pas consommer l'énergie de lancement et n'ont pas besoin d'un configurateur complet.

## 7. Ordre d'implémentation

1. Remplacer le configurateur universel par le choix du produit.
2. Implémenter le Studio Plaque/Comptoir à grille verrouillée.
3. Implémenter le Card Builder recto/verso à trois layouts.
4. Ajouter Signature comme service avec brief et BAT.
5. Générer les fichiers de production à partir des mêmes données que l'aperçu.
6. Faire produire trois prototypes par support.
7. Photographier les objets finis en situation réelle.
8. Ouvrir la boutique seulement avec des photos et performances vérifiées.

## Décision finale

Tapote ne doit pas promettre que n'importe quel design peut être créé en un clic. La promesse crédible est plus forte :

> Choisissez un modèle pensé pour convertir, appliquez votre marque en deux minutes, ou confiez-nous une création Signature.

Cette architecture conserve la beauté du prototype Bulle de Jeux, simplifie radicalement la carte, rend la personnalisation industrialisable et crée une vraie prestation premium facturable.
