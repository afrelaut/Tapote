# Tapote — impressions des 4 produits — version du 18/07/2026

Ce dossier remplace intégralement l'ancien lot `designs/print-ready`.

## Contenu

Les quatre familles de produits sont déclinées en neuf fichiers prêts à contrôler :

1. Chevalets : avis Google et menu
2. Plaques : avis Google et réservation
3. Vitrines : avis Google et Instagram
4. Cartes : recto avis Google, recto contact et verso universel

Chaque déclinaison est fournie dans les formats suivants :

- `pdf/` : PDF à transmettre à l'imprimeur, à imprimer à 100 %
- `svg/` : source vectorielle modifiable
- `html/` : source de régénération et impression navigateur
- `previews/` : aperçu PNG à 300 dpi
- `scripts/` : scripts Python ayant servi à construire le lot

L'image `apercu-impressions-4-produits-v3-2026-07-18.png` réunit les neuf faces sur une seule planche de contrôle.

## Dimensions d'impression

| Produit | Fichier livré | Format fini | Fond perdu / remarques |
| --- | ---: | ---: | --- |
| Chevalet | 105 × 148 mm | 105 × 148 mm | Format exact, sans traits de coupe, prévu pour tirage photo |
| Plaque | 126 × 126 mm | 120 × 120 mm | Fond perdu de 3 mm sur chaque côté |
| Vitrine | 96 × 96 mm | 90 × 90 mm | Fond perdu de 3 mm sur chaque côté |
| Carte | 89 × 58 mm | 85 × 54 mm, coins R3 | Fond perdu de 2 mm sur chaque côté, recto et verso |

Pour les vitrines, le bloc d'action est volontairement très proche du bord de coupe. La tolérance de placement attendue est de ± 0,5 mm. Si l'imprimeur déconseille cette proximité, utiliser un format fini de 100 × 100 mm plutôt que de déformer le dessin.

## Supports et montage recommandés pour les prototypes

- Chevalet : papier mat ou satiné de 250 à 300 g/m². Tester la puce derrière la zone NFC avant fermeture.
- Plaque : PMMA blanc opaque de 3 mm, ou PVC expansé blanc de 3 mm pour un prototype rapide ; vinyle imprimé et pelliculage mat anti-rayure. Éviter un support métallique.
- Vitrine : vinyle polymère résistant aux UV, posé à l'intérieur et lisible depuis l'extérieur. Confirmer avec l'imprimeur si une impression miroir avec blanc de soutien est nécessaire.
- Carte : vinyle blanc permanent avec pelliculage mat anti-rayure à froid. Poser les adhésifs sans bulle et tester le NFC avant une série.

La puce NFC doit être testée seule, après montage, puis sur le support réel avec un iPhone et un téléphone Android. Ne pas verrouiller les puces pendant la phase prototype.

## Point critique avant une fabrication client

Les QR codes de ce lot prototype renvoient vers `https://tapote.fr`. Ils sont adaptés aux prototypes et aux démonstrations génériques, mais pas à la livraison personnalisée d'un client.

Pour une commande client définitive, le QR code et la puce NFC doivent tous les deux renvoyer vers la même URL Tapote dédiée, au format `https://t.tapote.fr/a/<shortcode>`, générée et vérifiée depuis Tapote Gestion avant l'envoi en production.

## Contrôles effectués

- présence des neuf variantes dans les quatre formats
- contrôle visuel de la planche complète
- contrôle des neuf PDF et de leurs dimensions physiques
- absence de formulaire, de JavaScript ou d'annotation dans les PDF
- conservation des scripts de génération pour la traçabilité

## Provenance

- Source reçue : `tapote-persos-v3 (1) (1).zip`
- SHA-256 de la source : `22C9C1BD4BCCF011FE04859DD355820F359F617CA46AB93FAE15D906E14FB720`
- Désignation source : série personnalisée v3 / métriques v3.1
