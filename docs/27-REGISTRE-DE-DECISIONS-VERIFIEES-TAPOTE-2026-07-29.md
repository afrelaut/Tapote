# Registre de décisions vérifiées — Tapote

Date : 29 juillet 2026  
Règle : une décision n'est « validée » que si elle est soit vérifiée dans le produit, soit testée dans le code, soit documentée par une source fournisseur. Les hypothèses physiques restent explicitement à prototyper.

## Décisions exécutées

| Domaine | Décision | État | Motif vérifié |
|---|---|---:|---|
| Positionnement | Tapote vend des points d'action physiques pour les lieux ; VKARD reste centré carte de visite et capture de contact | Validé | Évite une copie frontale et exploite Comptoir + Plaque + Card |
| Catalogue | Trois objets maîtres : Comptoir, Plaque, Card | Validé | Rend la boutique compréhensible sans accessoires parasites |
| Parcours | Boutique distincte du Studio | Validé | Un client peut acheter sans comprendre un configurateur |
| Fiche produit | Un CTA marchand principal : « Ajouter au panier » | Validé et testé | Réduit la friction ; la configuration peut rester facultative |
| Personnalisation | Paiement, collecte du logo/brief, BAT, validation, production | Validé et testé | Aucune impression personnalisée ne démarre avant accord |
| Studio | Aperçu live facultatif, jamais bloquant pour acheter | Validé | Différenciation Tapote sans imposer un logiciel de PAO |
| Link | Destination modifiable incluse sans abonnement | Validé | Sépare la valeur de base de l'analytics |
| Pilot Pro | 9 €/mois ou 89 €/an par organisation, optionnel | Hypothèse commerciale contrôlée | À confirmer par entretiens et paiements bêta avant acquisition payante |
| Prix unitaires | Card 39/59 €, Plaque 59/79 €, Comptoir 69/89 € | Implémenté | Cohérent avec les plafonds de coût et le travail de BAT ; marge à confirmer par devis |
| Packs | Local 119/159 €, Parcours 299/399 € | Implémenté | Les remises ne sont affichées que sur une composition productive réelle |
| Landing | Promesse + scène 3D explicative + CTA Boutique/30 s | Validé visuellement | Le mouvement explique support → téléphone → action → résultat |
| Preuves | Zéro logo client, note, volume ou média non autorisé | Validé | « 20 000 entreprises » et toute preuve inventée sont interdits |

## Décisions physiques à prototyper avant promesse publique

| Sujet | Décision de prototype | Critère de validation |
|---|---|---|
| Comptoir | PMMA imprimé en seconde surface, blanc de soutien, NFC masqué | Lecture iPhone/Android, stabilité, rayure, nettoyage, chants |
| Plaque | PMMA 12 × 12 cm, fixation documentée, ferrite si surface métallique | Scan/tap dans la position réelle et après pose |
| Card PVC | Puce intégrée au substrat, impression retransfer ou industrielle | Aucun sticker ajouté ; QR variable lisible ; recto/verso alignés |
| Card métal | Construction hybride métal + fenêtre/inlay non métallique | Lecture NFC fiable ; le métal intégral sans architecture RF est rejeté |
| Sticker durable | Vinyle documenté + blanc de soutien + lamination selon usage | Rendu sombre, adhérence, frottement, eau et vieillissement |

Tant que ces essais ne sont pas signés, le site doit parler de « série pilote », « prototype en validation » ou « délai confirmé », jamais de qualité, de durée ou de fabrication française non prouvée.

## Short-list de sourcing à interroger

1. [Shop NFC — personnalisation](https://www.shopnfc.com/fr/content/21-personnalisation-des-produits-nfc) : prototypes et petits lots NFC.
2. [Printags](https://www.printags.com/fr_fr/) : PVC personnalisé à l'unité et petites quantités.
3. [Smart Carte](https://s-carte.fr/) : séries de cartes et production française à qualifier par devis.
4. [RFID Connect](https://www.rfidconnectus.com/nfc-social-media-card/nfc-hybrid-metal-card.html) et [FOCUS RFID](https://www.focus-rfid.com/rfid-metal-card-product/) : métal hybride, échantillons obligatoires.
5. [ESI 3D — impression UV](https://www.esi-3d.fr/technologies/impression-uv-a-plat) et [Pluxi](https://pluxi.fr/votre-sur-mesure/) : PMMA/PLV à façon.

Un fournisseur n'est pas sélectionné sur son site. Il doit répondre au même RFQ, fournir un échantillon, annoncer la puce, la tolérance, la couche de blanc, le BAT, le prix rendu et le délai observé.

## Garde-fous de vérité

Rejeté tant qu'aucune preuve datée n'existe :

- « plus de 20 000 entreprises » ;
- « fabriqué en France » pour un produit ou composant non tracé ;
- « audité RGPD », « tests d'intrusion A+ » ou chiffrement total sans rapport ;
- durée extérieure de sept ans sans fiche matière et conditions d'exposition ;
- délai fixe avant observation du cycle brief → BAT → production ;
- logos clients, médias, notes ou témoignages sans autorisation.

## Validation logicielle au 29 juillet 2026

- 115 tests automatisés passent ;
- lint sans avertissement ;
- build Vite de production valide ;
- fiche personnalisée testée avec un seul CTA principal ;
- e-mails atelier/client testés avec attente du brief et validation du BAT ;
- fallback sans WebGL et préférence « réduire les animations » prévus ;
- scène 3D isolée dans un chunk chargé séparément.

## Prochaines preuves qui changent réellement la décision

1. Trois devis comparables et cinq jeux d'échantillons.
2. Deux prototypes Comptoir et deux Plaques avec variantes de blanc de soutien.
3. Dix Cards PVC et trois Cards métal hybrides testées sur matrice de téléphones.
4. Cinq commandes pilotes chronométrées jusqu'au BAT et à l'expédition.
5. Cinq entretiens sur Pilot Pro et trois tests de paiement.
6. Photos réelles, macro matière et vidéo de tap seulement après validation.

