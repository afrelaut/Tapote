# Tapote — industrialisation de la gamme produits

Date de vérification : 30 juillet 2026  
Statut : spécification de pré-industrialisation ; devis, échantillons et essais physiques encore obligatoires  
Périmètre : six produits physiques exacts, leur construction, leur impression, leur contenu, leur contrôle et leur sourcing

## 0. Ce que ce document tranche

1. **NTAG213 est la puce standard de toute la gamme.** Ses 144 octets utilisateur suffisent pour une URL courte Tapote. NTAG215, avec 504 octets, n’est retenu que si un cas futur exige une donnée locale plus longue. Il n’améliore pas à lui seul la portée.
2. **NFC et QR contiennent la même URL courte unique**, par exemple `https://t.tapote.fr/a/AB12CD`. Les coordonnées, avis, menus et destinations restent côté serveur.
3. **La carte PVC est le produit de lancement le moins risqué.**
4. **La carte métal n’est acceptable qu’en construction hybride native métal + PVC/PET**, avec lecture du côté non métallique. Une carte métal improvisée avec un sticker au dos est rejetée.
5. **Le bois est gravé au laser par défaut.** L’UV couleur reste une variante Signature après essai d’adhérence et d’abrasion.
6. **Comptoir et plaque Signature utilisent une impression UV directe en seconde surface sur PMMA transparent**, puis un blanc de soutien. L’image est ainsi protégée par la matière.
7. **Un adhésif professionnel contrecollé n’est pas un bricolage** s’il est imprimé en miroir avec blanc de soutien, posé au gabarit sans bord visible et validé par essai. Il sert au prototype, aux petites séries très variables et aux visuels remplaçables.
8. **L’insert remplaçable n’est pas le produit grand public par défaut.** Il reste une variante B2B « campagnes » si le prototype ne ressemble pas à un porte-affiche générique.
9. **Le sticker téléphone doit être anti-métal avec ferrite.** Il n’est pas vendu comme compatible avec toutes les coques : silicone, TPU texturé et surfaces grasses nécessitent un test spécifique.
10. **Tapote peut assembler 1 à 10 prototypes pour apprendre. À partir de 25 unités, le façonnier doit intégrer ou au minimum poser le tag avec un gabarit et fournir l’objet fini contrôlé.**

Les valeurs de durée de vie, IP, résistance extérieure, origine ou matière recyclée publiées par les fournisseurs restent des **allégations fournisseur** jusqu’à validation sur la référence Tapote et dans son usage final.

## 1. Socle technique commun

### 1.1 Puce et encodage

| Décision | Spécification Tapote |
|---|---|
| Puce par défaut | NXP NTAG213, 13,56 MHz, ISO/IEC 14443-A, NFC Forum Type 2 |
| Mémoire | 144 octets utilisateur |
| Alternative | NTAG215, 504 octets, uniquement sur besoin documenté |
| Format logique | un enregistrement NDEF URI HTTPS |
| Contenu | URL courte Tapote unique ; aucune donnée personnelle dans la puce |
| QR | exactement la même URL que la puce |
| Identité | `support_id`, URL, QR, UID si lu, numéro de série et commande rapprochés dans le registre |
| Protection | protection réversible pendant le pilote ; verrouillage irréversible seulement après test du processus de remplacement |

NXP documente 144/504/888 octets utilisateur pour NTAG213/215/216, une conformité NFC Forum Type 2, une signature d’originalité ECC, la protection par mot de passe et les mécanismes de verrouillage. Ces propriétés composant ne constituent pas une promesse de sécurité du service Tapote.  
Sources : [page produit NXP NTAG213/215/216](https://www.nxp.com/products/NTAG213_215_216) · [fiche technique officielle NXP](https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf)

Android recommande NDEF et les NFC Forum Tag Types 1 à 4 pour la compatibilité la plus large. Apple documente la lecture d’un tag NFC par approche du téléphone. La compatibilité finale dépend néanmoins de l’antenne, de l’environnement et du téléphone.  
Sources : [Android — NFC basics](https://developer.android.com/develop/connectivity/nfc/nfc) · [Android — NDEF](https://developer.android.com/reference/android/nfc/tech/Ndef) · [Apple — utiliser un tag NFC](https://support.apple.com/guide/iphone/iphb3a73ec53/ios)

### 1.2 Règles radio

- Utiliser la plus grande antenne compatible avec le support.
- Ne pas découper, percer ou plier dans l’encombrement de l’antenne.
- Éviter feuille métallique, dorure conductrice, encre métallique ou aimant dans la zone antenne sans validation du fabricant.
- Ne pas placer un tag standard contre une surface métallique.
- Sur métal ou contre un téléphone, intercaler une ferrite dimensionnée par le fournisseur.
- Une ferrite change l’accord de l’antenne : la performance doit être retestée après toute modification de ferrite, colle, support, épaisseur ou position.
- Imprimer le repère « Tapotez ici » au centre réel de la zone active, avec une tolérance de position cible de ±1 mm.
- Tester en situation finale ; un tag bon « en l’air » peut être médiocre une fois assemblé.

NXP explique que le métal génère des courants qui absorbent l’énergie et désaccordent l’antenne, et qu’une ferrite peut servir d’écran. ST recommande une grande antenne, un emplacement optimisé, plusieurs marques de téléphones et des essais sur l’objet final.  
Sources : [NXP — environnement métal et ferrite](https://www.nxp.com/docs/en/application-note/AN13219.pdf) · [STMicroelectronics — NFC Touchpoints](https://www.st.com/content/st_com/en/support/learning/essentials-and-insights/connectivity/nfc/nfc-touchpoints.html)

### 1.3 QR commun

- QR Code Model 2, URL courte uniquement.
- Correction d’erreur M par défaut ; Q uniquement si le graphisme ou l’environnement le justifie.
- Noir 100 % sur fond blanc ou très clair, sans dégradé ni transparence.
- Aucun logo dans le QR pendant le pilote.
- Zone calme de **quatre modules** sur les quatre côtés.
- Taille du module de travail ≥ 0,40 mm pour les cartes et petits stickers, ≥ 0,50 mm pour les supports de comptoir/muraux.
- Toujours fournir le QR en vectoriel.
- La taille minimale Tapote est un **standard interne prudent**, à valider sur chaque procédé ; ce n’est pas un minimum universel garanti.

DENSO WAVE exige une marge de quatre modules et recommande d’imprimer le QR aussi grand que l’espace le permet.  
Sources : [DENSO WAVE — zone calme](https://www.qrcode.com/en/howto/code.html) · [DENSO WAVE — taille des modules](https://www.qrcode.com/en/howto/cell.html)

### 1.4 Données variables

Le fichier de production contient une ligne par support :

| Colonne | Exemple |
|---|---|
| `order_id` | `TP-2026-00421` |
| `support_id` | `AB12CD` |
| `sku` | `CARD-PVC-SIG` |
| `ndef_url` | `https://t.tapote.fr/a/AB12CD` |
| `qr_url` | `https://t.tapote.fr/a/AB12CD` |
| `serial_print` | `TP-AB12CD` |
| `client_name` | `Café Alba` |
| `template_id` | `CARD-A` |
| `artwork_file` | `TP-2026-00421_AB12CD.pdf` |

Contrôle automatique obligatoire : `ndef_url = qr_url`, identifiant unique, aucun doublon, URL HTTPS résolue et fichier d’impression présent.

## 2. Kit de fichiers imprimeur

### 2.1 Paquet maître

Chaque fournisseur reçoit :

1. `READ-ME_PRODUCTION.pdf` : matériau, dimensions, finition, quantité, faces, colorimétrie et tolérances ;
2. `ARTWORK.pdf` : graphisme final ;
3. `TECHNICAL.pdf` : coupe, pli, NFC, fixation, zones techniques ;
4. `WHITE.pdf` ou calque spot : blanc de soutien ;
5. `VARNISH.pdf` ou calque spot si nécessaire ;
6. `VARIABLES.csv` ;
7. dossier `QR_SVG/` ;
8. rendu JPEG de référence ;
9. photo ou schéma d’orientation « face utilisateur / face arrière / haut ».

### 2.2 Calques

| Calque | Contenu | Impression |
|---|---|---|
| `ART_CMYK` ou `ART_RGB` | graphisme | oui |
| `WHITE_INK` | blanc total ou sélectif | oui, selon RIP |
| `VARNISH` | vernis sélectif | oui, option |
| `QR_DYNAMIC` | QR vectoriel unique | oui |
| `SERIAL_DYNAMIC` | identifiant unique | oui |
| `CUT_CONTOUR` | découpe vectorielle | non comme couleur |
| `FOLD_LINE` | pliage | non |
| `NFC_ZONE` | antenne + centre de tap | non |
| `SAFE_AREA` | zone de sécurité | non |
| `FIXING_ZONE` | adhésif, entretoises ou pied | non |

Les noms de tons directs et l’ordre du blanc doivent être confirmés avec le RIP du fournisseur. Tapote ne doit pas supposer qu’un nom de calque générique sera interprété correctement.

### 2.3 Règles fichiers

- PDF vectoriel avec polices vectorisées.
- Images ≥ 300 ppp à taille finale.
- Traits positifs ≥ 0,20 mm ; traits en réserve ≥ 0,30 mm.
- Petits textes noirs en noir 100 %, pas en noir quadri.
- Fond perdu : 2 mm pour les cartes selon Shop NFC ; 3 mm de travail pour les plaques/chevalets, à confirmer par le façonnier.
- Zone sûre : 2 mm minimum sur cartes ; 4 mm minimum sur objets découpés.
- Aucun repère de coupe dans l’artwork fournisseur qui l’interdit.
- Pour le retransfer Shop NFC : fichier JPG/PNG/PDF accepté, au moins 300 ppp, 2 mm de fond perdu, 2 mm de marge interne et mode RGB demandé par son flux Express.
- Pour UV local : demander le profil CMJN, le ton direct blanc, le sens miroir et le taux de couverture.

Source : [Shop NFC — carte Express et instructions fichiers](https://shopnfc.com/en/nfc-cards/27-15-custom-nfc-cards-express-print.html)

## 3. Produit 1 — Tapote Card PVC

### 3.1 Définition

| Champ | Spécification |
|---|---|
| Format fini | CR80, 85,60 × 53,98 mm |
| Épaisseur | 0,76 à 0,80 mm |
| Coins | rayon nominal CR80, environ 3 mm |
| Poids cible | 5 à 7 g |
| Puce | NTAG213 |
| Antenne | inlay intégré de grand périmètre, position fournisseur documentée |
| Lecture | deux faces en principe, à vérifier sur l’échantillon imprimé |
| QR | 18 mm minimum, zone calme comprise |
| Numéro | `TP-XXXXXX`, 5,5 pt minimum |

### 3.2 Structure des couches

**Micro-série 10 à 100 — retransfer**

1. film de retransfert imprimé côté recto ;
2. carte PVC blanche finie ;
3. inlay PET avec antenne aluminium/cuivre et chip NTAG213 laminé dans le corps ;
4. film de retransfert imprimé côté verso.

**Série 500+ — impression industrielle laminée**

1. overlay transparent de protection ;
2. feuille PVC recto imprimée ;
3. inlay PET + antenne + chip ;
4. feuille PVC verso imprimée ;
5. overlay transparent de protection ;
6. lamination, découpe et contrôle.

La construction exacte, la matière de l’antenne et l’épaisseur des couches restent à demander au fabricant.

### 3.3 BOM cible à 25

| Composant/opération | Cible HT/unité |
|---|---:|
| Carte PVC NTAG213 imprimée recto-verso | 3,50 à 5,00 € |
| Encodage + lecture UID | 0,14 à 0,40 € |
| Données variables/QR | 0 à 0,75 € |
| Contrôle Tapote et activation | 1,25 à 2,00 € |
| Pochette + guide + mailer alloué | 1,25 à 2,00 € |
| Transport entrant + provision défaut | 0,75 à 1,25 € |
| **COGS Express cible** | **7 à 11 €** |
| Création/BAT Signature | **8 à 12 € additionnels** |

### 3.4 Impression et finition

- Retransfer 600 dpi pour 10–100.
- Éviter les grands aplats sombres continus : NFC.CARDS et Shop NFC signalent leurs limites sur ce procédé.
- Comparer mat et brillant ; préférer mat si les traces et reflets dégradent le QR.
- Pour 500+, demander offset/numérique industriel laminé avec données variables en deuxième passage.
- Refuser tout sticker NFC rapporté : la puce est intégrée au substrat.
- Refuser dorure ou feuille conductrice avant essai radio.

### 3.5 Durabilité cible

- 500 entrées/sorties de portefeuille sans perte de QR ni délamination.
- Cinq chutes de 80 cm sur bois/vinyle.
- 100 nettoyages chiffon microfibre + savon doux.
- Carte plane après 24 h à 40 °C en essai interne.
- Aucune promesse IP ou extérieure sans rapport du produit fini.

### 3.6 QA de libération

- Dimensions sur 5 pièces ; cible ±0,5 mm.
- Aspect, rayure, bord, centrage et recto-verso : 100 %.
- QR : 10/10 à 15, 25 et 40 cm sur trois téléphones.
- NFC : 20/20 lectures sur chacun des six téléphones de référence.
- Tap au centre puis à ±10 mm ; face avant et arrière.
- URL NFC = URL QR = ligne CSV.
- Contrôle d’unicité de tous les `support_id`.
- Taux de défaut micro-série ≤ 3 %.

### 3.7 Emballage

- Pochette papier ou glassine.
- Mini-guide recto-verso : activation, zone de tap, assistance.
- Mailer rigide C5 pour une carte ; séparateur pour plusieurs.
- Pas de coffret rigide avant volume prouvé.

### 3.8 Économie et sourcing

| Élément | Décision |
|---|---|
| Prix public cible | Express 39 € TTC ; Signature 59 € TTC |
| COGS plafond | 12 € Express ; 20 € Signature |
| MOQ pilote | 10 |
| Délai pilote | 1 à 5 jours de fabrication annoncé, hors BAT/transport |
| Principal | NFC.CARDS, France — `contact@nfc.cards` |
| Secours UE | Shop NFC, Italie — `info@shopnfc.com`, +39 039 894 6116 |
| Série française | Tag&Play, lot de 100, impression variable et encodage |
| Alternative France | Smart Carte, dès 20, chip exact à confirmer |

Pages vérifiées :

- [NFC.CARDS — NTAG213 recto-verso, MOQ 10, 3,99 € HT, 1–5 jours](https://nfc.cards/fr/impression-recto-et-verso/61-carte-nfc-personnalisee-ntag213-impression-recto-et-verso.html)
- [Shop NFC — Express, MOQ 10, à partir de 1,79 €, 1–4 jours](https://shopnfc.com/en/nfc-cards/27-15-custom-nfc-cards-express-print.html)
- [Tag&Play — PVC NTAG213, lot de 100, données variables](https://shop.tagandplay.com/cartes-pvc.html)
- [Smart Carte — NFC CR80 dès 20](https://s-carte.fr/)

**Inconnues à lever** : coût exact de chaque graphisme différent, BAT physique, profil couleur, type/position antenne, origine réelle de chaque opération et délai rendu Tapote.

## 4. Produit 2 — Tapote Card Metal

### 4.1 Définition

| Champ | Spécification |
|---|---|
| Format fini | 85,5 × 54 mm |
| Épaisseur cible | 0,9 à 1,2 mm |
| Poids cible | 18 à 24 g |
| Construction | une face métal + une face PVC/PET radio-transparente |
| Puce | NTAG213 |
| Lecture | **uniquement face PVC/PET** |
| QR | face PVC/PET, 18 mm minimum |
| Repère NFC | face PVC/PET, au centre de la zone active |
| Métal | acier inox ou aluminium, grade et épaisseur à déclarer |

### 4.2 Structure des couches, face métal vers face de lecture

1. couche de finition ou anodisation métal ;
2. tôle acier/aluminium gravée ou imprimée ;
3. adhésif/liaison ;
4. ferrite ou architecture de découplage si prévue par le fabricant ;
5. inlay PET avec antenne et NTAG213 ;
6. corps ou overlay PVC/PET radio-transparent ;
7. impression UV et protection de la face de lecture.

L’ordre réel peut varier. Le fournisseur doit fournir un schéma en coupe simplifié, la face de lecture et la position de l’antenne. Une fiche disant seulement « métal NFC » est insuffisante.

### 4.3 BOM cible à 10–25

| Composant/opération | Cible HT/unité |
|---|---:|
| Blank hybride NTAG213 | 8 à 13 € |
| Gravure métal et/ou UV PVC | 3 à 8 € |
| QR/numéro variables + encodage | 0,25 à 1,50 € |
| Contrôle renforcé huit téléphones | 3 à 5 € |
| Pochette anti-rayure + mailer | 2 à 3 € |
| Entrant + provision défaut | 2 à 4 € |
| **COGS cible** | **20 à 34 €** |

### 4.4 Impression et finition

- Face métal : laser pour logo, nom et motif simple ; UV couleur seulement après test d’adhérence.
- Face PVC/PET : UV couleur, QR, CTA et repère NFC.
- Aucun QR gravé uniquement sur métal réfléchissant comme solution principale.
- Arêtes cassées/polies ; aucun bord coupant.
- Finition métal mate ou brossée préférée au miroir pour limiter traces et reflets.
- Message non ambigu : `Tapotez de ce côté` sur la face PVC.
- Ne jamais promettre une lecture recto-verso.

### 4.5 Durabilité cible

- 500 entrées/sorties de poche.
- 500 frottements microfibre sur gravure et impression.
- Aucun décollement entre métal et PVC.
- Pas d’arête vive après chute.
- Rayures cosmétiques classées avec une limite acceptée sur golden sample.

### 4.6 QA de libération

- Huit téléphones minimum : iPhone récent, iPhone ancien compatible, deux Samsung, Pixel, Xiaomi et deux Android supplémentaires.
- Deux coques courantes en plus du téléphone nu.
- 20/20 lectures par appareil ; 100 lectures cumulées par prototype.
- Temps médian de détection < 1,5 seconde.
- Performance ≥ 90 % de la Card PVC appareil par appareil.
- Sens compris sans explication par 8 testeurs sur 10.
- QR 10/10 à 15, 25, 40 cm.
- Rejet si un téléphone courant fait moins de 19/20, si le repère est à plus de 10 mm de la zone active ou si la construction change après le golden sample.

### 4.7 Emballage

- Pochette non abrasive individuelle.
- Carton rigide fin séparant les faces.
- Mailer compact ; aucun contact métal contre métal.
- Notice montrant la seule face de lecture.

### 4.8 Économie et sourcing

| Élément | Décision |
|---|---|
| Prix public cible | 109 € TTC ; 119 € si COGS > 39 € |
| COGS plafond | 38,99 € |
| MOQ pilote | 5 à 10 selon fournisseur |
| Délai | 1–5 jours chez NFC.CARDS ; 1–3 semaines UV / 3–4 semaines laser annoncées chez Shop NFC |
| Principal UE | Shop NFC, Italie |
| Secours | NFC.CARDS, France |
| Volume Chine | RFID Connect, MOQ 100, après golden sample |
| Piste France | Smart Carte uniquement si vraie construction hybride prouvée ; « effet métal » refusé |

Pages vérifiées :

- [Shop NFC — hybride métal/PVC NTAG213, lecture côté PVC](https://shopnfc.com/en/nfc-cards/719-metal-nfc-cards-ntag213-customizable.html)
- [NFC.CARDS — métal/PVC NTAG213, gravure, 8,79 € HT](https://nfc.cards/fr/gravure-recto/167-carte-nfc-personnalisee-ntag213-metal-pvc-noir-gravure-recto.html)
- [RFID Connect — hybride métal/plastique, MOQ 100](https://www.rfidconnectus.com/nfc-social-media-card/nfc-hybrid-metal-card.html)
- [Contact RFID Connect](https://www.rfidconnectus.com/contacts/)

**Inconnues critiques** : matériau et épaisseur de chaque couche, géométrie antenne, ferrite, distance réelle, constance du lot, coût UV complet et explication de la mention « works on metal: no » de certaines fiches malgré la structure hybride. La carte n’est pas publiée avant réponse et essais.

## 5. Produit 3 — Tapote Card Bois

### 5.1 Définition

| Champ | Spécification |
|---|---|
| Format | 85,5 × 54 mm |
| Épaisseur cible | 1,2 à 1,5 mm |
| Matière de lancement | bambou laminé stable |
| Variante | noyer/hêtre seulement après comparaison |
| Puce | NTAG213 |
| Antenne | inlay intégré, non anti-métal |
| QR | 20 mm minimum, gravé ou imprimé à fort contraste |
| Usage | intérieur, portefeuille ; pas d’exposition prolongée à l’eau |

### 5.2 Structure des couches

1. finition protectrice mate éventuelle ;
2. placage ou feuille bambou face recto ;
3. âme bois/bambou stabilisée ;
4. inlay PET avec antenne + NTAG213 ;
5. placage ou feuille bambou face verso ;
6. finition protectrice éventuelle.

Demander si la carte est monobloc fraisée, multicouche laminée ou bois + cœur plastique. La mention « bois » ne suffit pas pour décrire le produit.

### 5.3 BOM cible à 25

| Composant/opération | Cible HT/unité |
|---|---:|
| Blank bambou NTAG213 | 1,50 à 3 € |
| Gravure recto-verso ou UV recto | 3 à 7 € |
| Données variables/QR/encodage | 0,25 à 1 € |
| Tri grain + contrôle | 1,50 à 2,50 € |
| Pochette + guide | 1,25 à 2 € |
| Entrant + provision défaut | 1 à 2 € |
| **COGS cible** | **9 à 16 €** |

### 5.4 Impression et finition

- **Standard recommandé : gravure laser** monochrome.
- Lignes ≥ 0,30 mm ; texte positif ≥ 8 pt ; texte inversé ≥ 9 pt gras.
- QR ≥ 20 mm, avec essai sur dix grains différents.
- UV couleur uniquement en variante Signature, de préférence avec sous-couche blanche sélective si l’encre doit rester fidèle.
- Aucun grand aplat UV couvrant la texture entière.
- Comparer finition naturelle, huile/cire et vernis aqueux ; exiger la composition et la tenue.
- Pas de claim « écologique », « durable » ou « certifié » sans certificat de matière de la série.

Shop NFC indique 85,5 × 54 × 1,4 mm, NTAG213, MOQ 10, laser ou UV, impression recto seulement sur son flux actuel et précise que la gravure résiste mieux que l’UV.  
Source : [Shop NFC — bambou NTAG213](https://shopnfc.com/fr/cartes-nfc/453-cartes-nfc-en-bamboo-ntag213-personnalisables.html)

### 5.5 Durabilité cible

- Stockage et usage au sec.
- 500 entrées/sorties de portefeuille.
- 100 frottements microfibre.
- Essai gouttes d’eau 10 minutes puis séchage, sans revendication d’étanchéité.
- Absence d’écharde et chants adoucis.
- Gauchissement mesuré après 48 h à humidité élevée de dépistage.

### 5.6 QA de libération

- Contrôle grain, brûlure laser, nœud et écharde : 100 %.
- Comparaison couleur/contraste sur dix cartes.
- NFC 20/20 par téléphone sur six téléphones.
- QR 10/10 à 15, 25, 40 cm.
- Planéité et épaisseur sur cinq.
- Rejet de toute carte dont le grain traverse une zone QR au point d’en réduire la lecture.

### 5.7 Emballage

- Pochette glassine/papier respirante.
- Séparateur anti-rayure.
- Ne pas enfermer humide dans un plastique étanche.
- Guide de soin : garder au sec, ne pas immerger.

### 5.8 Économie et sourcing

| Élément | Décision |
|---|---|
| Prix public cible | 69 € TTC |
| COGS plafond prudent | 24 € |
| MOQ pilote | 10 |
| Délai pilote | 1 à 5 jours annoncé selon technique |
| Principal | NFC.CARDS, France — gamme bambou/bois gravée |
| Secours UE | Shop NFC, Italie |
| Alternative France | Smart Carte sur devis, construction NFC exacte à confirmer |

Pages :

- [NFC.CARDS — gamme gravure bois](https://nfc.cards/fr/36-gravure)
- [Shop NFC — bambou personnalisable](https://shopnfc.com/fr/cartes-nfc/453-cartes-nfc-en-bamboo-ntag213-personnalisables.html)
- [Smart Carte — cartes bois annoncées](https://s-carte.fr/)

**Inconnues** : origine/certification du bois, colle et âme, sens du grain, finition, recto-verso réel, taux de gauchissement et coût du QR variable.

## 6. Produit 4 — Tapote Comptoir PVC/PMMA NFC

### 6.1 Deux versions à qualifier

| Version | Usage | Décision |
|---|---|---|
| Express PVC | commerce sensible au prix, design simple | OEM fini possible si rendu et données variables passent |
| Signature PMMA | produit héros Tapote | fabrication locale sur mesure, monobloc, UV seconde surface |

### 6.2 Dimensions

| Élément | Express PVC | Signature PMMA |
|---|---:|---:|
| Face visible | 105 × 148 mm | 110 × 160 mm cible |
| Hauteur finie | environ 148 mm | 160 à 175 mm |
| Base | 105 × 60 mm | largeur 110 mm, profondeur 50 à 60 mm |
| Épaisseur | PVC rigide 1,8 à 2 mm | PMMA coulé 3 mm, prototype 4 mm comparatif |
| Angles | R5 minimum | R8 minimum |
| Inclinaison | 65 à 75° à tester | 65 à 75° à tester |

Le benchmark Shop NFC est un chevalet PVC 148 × 105 mm, base 60 × 105 mm, 1,8 mm et NTAG213 frontal. Il coûte publiquement 12,90 € avant options.  
Source : [Shop NFC — Table Stand NTAG213](https://shopnfc.com/en/nfc-cards/745-1586-table-stand-in-pvc-with-ntag213-nfc-chip.html)

### 6.3 Placement

- Centre du tag : axe horizontal, 42 à 52 mm sous le bord supérieur.
- Antenne cible : Ø 30 à 38 mm ou inlay de surface équivalente.
- Repère NFC : cercle visuel de 32 à 40 mm centré sur l’antenne.
- QR : 28 à 32 mm, tiers inférieur, jamais sur le pli.
- Distance minimale QR–bord : 8 mm.
- Numéro de série : dos ou chant inférieur.
- Aucun métal, aimant ou masse métallique derrière le tag.

### 6.4 Structure Signature, face utilisateur vers arrière

1. PMMA transparent coulé 3 mm ;
2. impression CMJN miroir sur la face arrière ;
3. blanc de soutien total ou sélectif ;
4. zone opaque renforcée derrière le tag ;
5. tag NTAG213 30–35 mm posé au gabarit ;
6. cache arrière fin blanc/noir ou insert technique affleurant ;
7. pli à chaud formant la base ;
8. patins transparents optionnels non métalliques.

L’impression « seconde surface » protège l’image derrière le PMMA. Le blanc se dépose derrière la couleur vue depuis l’avant. Le cache technique doit masquer la silhouette du tag sans créer une bosse visible.

### 6.5 BOM Signature cible à 25

| Composant/opération | Cible HT/unité |
|---|---:|
| PMMA découpé, imprimé, blanc, plié | 12 à 18 € |
| Tag NTAG213 standard | 0,65 à 1,50 € |
| Cache technique/adhésif | 0,40 à 1,20 € |
| Assemblage au gabarit | 1,50 à 3 € |
| Encodage + QA | 2 à 3 € |
| Emballage | 2,50 à 3,50 € |
| Entrant + défaut | 1,50 à 2,50 € |
| **COGS Express cible** | **20 à 24 €** |
| **COGS Signature plafond** | **31 € incluant BAT amorti** |

### 6.6 Procédés comparés

**A — UV directe seconde surface : choix Signature**

- rendu le plus intégré ;
- aucun bord d’adhésif ;
- image protégée ;
- changement de visuel coûte le retirage de la pièce.

**B — film transparent imprimé miroir + blanc, contrecollé : choix prototype/variable**

- pertinent pour comparer des designs et petites séries ;
- exiger colle optiquement claire, pose au gabarit, aucun bord visible et aucun défaut ;
- abandon si bulles, poussière, liseré ou différence d’opacité.

**C — insert remplaçable rigide : B2B campagnes uniquement**

- deux faces ou une façade avec clips/aimants invisibles ;
- aucun papier, jeu ou bord ouvert ;
- NFC reste fixé sur la structure, pas sur la feuille ;
- ne gagne que si perception ≥ monobloc et coût de mise à jour au moins 15 % inférieur.

**D — OEM PVC fini : Express conditionnel**

- intéressant pour le coût et le délai ;
- rejet si aspect générique, tag visible, personnalisation limitée ou QR variable impossible.

ESI-3D documente l’impression UV directe, le blanc/vernis, le PMMA, le pliage et les petites séries ; son propre comparatif positionne l’UV directe comme plus intégrée et l’adhésif comme plus facile à remplacer.  
Source : [ESI-3D — impression UV à plat](https://www.esi-3d.fr/technologies/impression-uv-a-plat)

### 6.7 Durabilité et QA

- Stabilité sous poussée horizontale de 5 N au centre.
- Aucun basculement lors d’un tap normal.
- Angle identique ±2° sur cinq pièces.
- Pli sans bulle, blanchiment ni fissure.
- Chants non coupants.
- NFC 20/20 sur six téléphones, posé sur bois, pierre/verre et comptoir réel.
- QR 10/10 à 20, 40, 70 cm, éclairage naturel, chaud et faible.
- 500 taps, 100 nettoyages, cinq chutes emballées de dépistage.
- Pour un usage extérieur : référence séparée, encre/matière/adhésif documentés ; aucun transfert automatique des claims intérieurs.

### 6.8 Emballage

- Film protecteur PMMA conservé sur la face externe jusqu’à installation.
- Glassine ou papier de soie.
- Calage carton nid d’abeille/papier moulé.
- Boîte cible environ 220 × 160 × 70 mm, à mesurer.
- Guide unique et numéro de support.

### 6.9 Économie et sourcing

| Élément | Décision |
|---|---|
| Prix public cible | Express 69 € TTC ; Signature 89 € TTC |
| COGS plafond | 24 € / 31 € |
| MOQ prototype | 1 |
| MOQ pilote | 25 |
| Délai attendu | 7–15 jours local sur mesure ; OEM selon page/option |
| Principal France | ESI-3D, Sens — `contact@esi3d.fr` |
| Secours France | Pluxi, Landévant — 02 97 76 37 37 |
| Deuxième secours | Harmonyl, Jons — `contact@harmonyl.com`, 04 26 85 07 44 |
| OEM UE benchmark | Shop NFC, Italie |

Pages :

- [ESI-3D — PLV sur mesure](https://www.esi-3d.fr/communication/plv-sur-mesure)
- [ESI-3D — contact](https://www.esi-3d.fr/contact)
- [Pluxi — devis sur mesure](https://pluxi.fr/contact/demande-de-devis/)
- [Harmonyl — contact](https://www.harmonyl.com/contact)
- [Shop NFC — chevalet PVC fini](https://shopnfc.com/en/nfc-cards/745-1586-table-stand-in-pvc-with-ntag213-nfc-chip.html)

**Inconnues** : prix local 25/50/100, tenue du pli imprimé, opacité nécessaire pour masquer le tag, données variables, assemblage NFC accepté et délai rendu.

## 7. Produit 5 — Tapote Plaque PVC/PMMA NFC

### 7.1 Versions

| Version | Construction | Usage |
|---|---|---|
| Murale standard | PMMA 3 mm + adhésif/fixation | mur, porte, miroir |
| Murale métal | PMMA 3 mm + tag ferrite | porte/mobilier métallique |
| Sur pied | plaque 120 × 120 × 3 mm + pied non métallique | comptoir étroit |
| Signature | PMMA transparent 5 mm, seconde surface | accueil premium |

### 7.2 Dimensions et placement

- Format fini : 120 × 120 mm.
- Angles R8.
- PMMA 3 mm standard ; 5 mm Signature.
- Tag standard ou anti-métal : 30 à 35 mm.
- Centre tag : x = 60 mm, y = 31 mm depuis le haut.
- Repère NFC : 34 à 40 mm.
- QR : 28 à 32 mm, centré vers y = 82 mm.
- Zone de fixation distincte de l’antenne.
- Pied : profondeur cible 45 à 55 mm, sans métal dans l’axe du tag.

### 7.3 Structure murale standard, avant vers mur

1. PMMA transparent 3 mm ;
2. CMJN miroir ;
3. blanc de soutien ;
4. masque opaque tag ;
5. inlay NTAG213 standard ;
6. cache arrière ;
7. bandes adhésives/fixation ;
8. mur non métallique.

### 7.4 Structure murale métal

1. PMMA et impression comme ci-dessus ;
2. tag NTAG213 anti-métal ;
3. ferrite couvrant toute l’antenne selon fournisseur ;
4. adhésif haute performance ;
5. surface métallique.

Ne jamais ajouter une petite rondelle de ferrite artisanale à un tag standard et appeler le résultat « anti-métal ». Le composant complet doit être qualifié assemblé.

### 7.5 BOM cible à 25

| Composant/opération | Cible HT/unité |
|---|---:|
| PMMA découpé + UV + blanc | 8 à 13 € |
| NFC standard / anti-métal | 0,65 à 1,75 € |
| Cache et fixation | 0,60 à 1,50 € |
| Assemblage + encodage + QA | 3 à 5 € |
| Emballage + gabarit de pose | 1,50 à 3 € |
| Entrant + défaut | 1 à 2 € |
| **COGS Express cible** | **15 à 20 €** |
| **COGS Signature plafond** | **27 € incluant BAT amorti** |

### 7.6 Impression et finition

- Signature : UV seconde surface + blanc.
- Express : PMMA blanc imprimé face exposée possible, après test abrasion.
- Contrecollage pro autorisé au pilote avec film polyester transparent, quadri + blanc.
- Épaisseur, type de colle, blanc total/sélectif et sens miroir consignés sur le BAT.
- Fixation : adhésif préappliqué ou entretoises comme option de pose, pas comme gadget.
- Gabarit de pose papier fourni.

Un benchmark OEM existe en 60/90/120 mm, PMMA 3 mm, NTAG213, MOQ 24 et prix public de base 4,99 €, mais la fiche indique qu’il ne fonctionne pas sur métal ; la version Tapote métal exige donc un autre composant et une nouvelle qualification.  
Source : [Shop NFC — plaque Plexiglas NFC](https://shopnfc.com/en/nfc-gadgets/520-1183-adhesive-nfc-panel-in-plexiglass-uv-printed.html)

### 7.7 Durabilité et QA

- Surface lisse non métallique : 20/20 lectures sur six téléphones.
- Surface métallique : test séparé avec version ferrite, 20/20 sur six téléphones.
- Tap centre et ±10 mm.
- QR 10/10 à 20, 40, 70 cm.
- Adhésif : arrachement/fluage sur verre, PMMA, peinture lisse et métal test.
- 48 h après pose avant test final d’adhérence.
- Retrait sur surface témoin pour documenter dommage/résidu.
- Humidité, chaleur modérée et nettoyage comme dépistage.
- Usage extérieur interdit dans la fiche produit tant que matière, encres, colle, exposition et garantie ne sont pas documentées.

### 7.8 Emballage

- Film protecteur.
- Deux plaques carton micro-cannelure.
- Coins protégés.
- Sachet séparé pour fixation/entretoises.
- Gabarit et notice de pose.
- Boîte plate.

### 7.9 Économie et sourcing

| Élément | Décision |
|---|---|
| Prix public cible | Express 59 € TTC ; Signature 79 € TTC |
| COGS plafond | 20 € / 27 € |
| MOQ prototype | 1 local ; 24 OEM Shop NFC |
| MOQ pilote | 25 |
| Principal France | ESI-3D |
| Secours France | Pluxi puis Harmonyl |
| Benchmark/OEM UE | Shop NFC |
| Adhésif blanc local | Graphiscann, Vaulx-en-Velin |

Graphiscann annonce polyester/vinyle transparent, quadri + blanc de soutien, permanent ou repositionnable, feuille ou rouleau, et 3–5 jours ; prix sur devis.  
Source : [Graphiscann — transparent et blanc de soutien](https://www.graphiscann.fr/etiquettes-transparentes-impression.html)

**Inconnues** : colle adaptée à chaque mur, garantie extérieure, coût de la variante ferrite, capacité d’impression variable, Delta E, tenue du blanc et responsabilité de pose.

## 8. Produit 6 — Tapote Mini, sticker téléphone NFC anti-métal

### 8.1 Forme de lancement

| Champ | Spécification |
|---|---|
| Forme | rectangle arrondi 45 × 35 mm, R5 ; alternative ronde Ø39 mm |
| Épaisseur cible | ≤ 1,0 mm, à confirmer |
| Puce | NTAG213 |
| Antenne/ferrite | ferrite centrale Ø22 à 25 mm minimum |
| Fixation | acrylique haute performance avec liner |
| Surface cible | coque rigide lisse, verre ou métal propre |
| Surfaces exclues par défaut | silicone, TPU souple/texturé, cuir gras, tissu |
| QR | 14 mm minimum si données variables possibles |
| Zone NFC | centre du sticker |

La forme 45 × 35 mm donne assez d’espace pour un repère NFC, un QR exploitable et un numéro. Un rond de 29,5 mm est plus discret mais ne doit porter qu’un pictogramme NFC et un identifiant ; le QR reste alors sur la carte d’activation, ce qui réduit la redondance sur le support.

### 8.2 Structure des couches, face visible vers téléphone

1. surlamination PET mate ou vernis de protection ;
2. face imprimable PET/PVC ;
3. CMJN + blanc si support transparent ;
4. inlay avec antenne aluminium/cuivre + NTAG213 ;
5. feuille ferrite couvrant l’antenne ;
6. adhésif acrylique haute performance ;
7. liner siliconé retiré à la pose ;
8. coque/téléphone.

Le fournisseur doit donner l’épaisseur de chaque couche et le diamètre réel de ferrite. Une ferrite centrale de 22 mm est publiquement documentée sur le sticker Shop NFC personnalisable 35–90 × 60 mm.

### 8.3 BOM cible à 30

| Composant/opération | Cible HT/unité |
|---|---:|
| Sticker imprimé anti-métal NTAG213 | 1,20 à 2,50 € |
| QR/numéro variables + encodage | 0,20 à 1 € |
| Contrôle sur gabarit téléphone | 0,75 à 1,25 € |
| Carte d’activation + pochette | 0,60 à 1 € |
| Entrant + défaut | 0,50 à 1 € |
| **COGS cible standard** | **3,50 à 6,50 €** |

### 8.4 Impression et finition

- CMJN 600 dpi minimum ou vectoriel.
- Fond perdu 2 mm.
- QR vectoriel ≥ 14 mm avec zone calme complète.
- Pas de résine doming épaisse pour la version téléphone : elle accroche les poches et crée une marche.
- Préférer PET mat résistant à l’abrasion.
- Arêtes arrondies et aucun coin vif.
- Blanc de soutien si le film est transparent.
- Identifiant discret au dos du packaging et sur la face si le QR variable n’est pas possible.

Shop NFC publie :

- un sticker rond imprimé anti-métal Ø29,5 mm, MOQ 30, 1,39 €, 2–6 jours ;
- un sticker premium de dimensions personnalisables de 35 mm à 90 × 60 mm, ferrite Ø22 mm centrée, MOQ 30, 1,19 € avant options, 2–6 jours ;
- un tag PVC anti-métal Ø30 mm avec NTAG213, ferrite et adhésif 3M 467MP, MOQ 10, 1,49 €.

Sources :

- [Shop NFC — sticker anti-métal imprimé Ø29,5](https://shopnfc.com/en/on-metal-nfc-tags/96-76-custom-printed-nfc-stickers-for-metals-express.html)
- [Shop NFC — sticker premium dimension personnalisable](https://shopnfc.com/en/on-metal-nfc-tags/380-custom-printed-nfc-stickers-for-metal-premium-express.html)
- [Shop NFC — tag PVC anti-métal NTAG213 Ø30](https://shopnfc.com/fr/etiquettes-nfc-anti-metal/114-tags-nfc-pvc-anti-metal-ntag213.html)

### 8.5 Adhésif

3M décrit le 467MP comme un acrylique 200MP d’environ 0,05 mm, destiné notamment aux métaux et plastiques à haute énergie de surface, avec résistance à l’humidité, aux solvants, UV et température. Cela ne prouve pas son adhérence sur silicone ou TPU.

Sources : [3M France — 467MP](https://www.3mfrance.fr/3M/fr_FR/p/d/b40071696/) · [fiche technique 3M 467MP](https://multimedia.3m.com/mws/media/2366204O/3M-Adhesive-Transfer-Tape-467MP.pdf)

Procédure de pose :

1. confirmer la matière de la coque ;
2. nettoyer selon la notice de l’adhésif ;
3. sécher ;
4. poser au-dessus de 15 °C ;
5. presser uniformément ;
6. attendre la montée d’adhésion avant essais mécaniques ;
7. ne pas promettre un retrait sans trace sans test.

### 8.6 Durabilité et QA

- Test sur iPhone verre/métal, Samsung, Pixel et trois coques rigides.
- Test sur deux TPU et un silicone pour documenter les exclusions.
- Un second téléphone lit le sticker 20/20, appareil porteur nu puis avec coque.
- Vérifier que le téléphone porteur ne génère pas de comportement parasite.
- QR 10/10 à 10, 15, 25 cm.
- 1 000 frottements tissu, 100 nettoyages, cycles chaud/froid modérés.
- Contrôle du décollement d’arête à J1, J7 et J30.
- Rejet si la lecture varie selon la zone de la coque ou si une arête se lève.

### 8.7 Emballage

- Sticker sur liner.
- Carte rigide d’activation indiquant orientation et surfaces compatibles.
- Lingette seulement si sa composition et son transport sont maîtrisés ; sinon instruction de nettoyage.
- Pochette papier.
- QR de secours sur la carte d’activation uniquement en plus du QR support, jamais à sa place si la promesse Tapote exige la redondance.

### 8.8 Économie et sourcing

| Élément | Décision |
|---|---|
| Prix public cible | 19 € TTC standard, port séparé |
| Personnalisation client | lot de 30 minimum sur devis ; pas de one-shot tant que le QR variable n’est pas prouvé |
| COGS plafond unitaire | 6,50 € |
| MOQ pilote | 30 imprimés ; 10 pour tag non personnalisé |
| Délai | 2 à 6 jours annoncés |
| Principal UE | Shop NFC, Italie |
| Secours composant France | NFC.CARDS, Ø25, MOQ 15, 0,99 € |
| Impression locale de face | Graphiscann, uniquement après validation d’un laminage propre |

Page secours : [NFC.CARDS — sticker NTAG213 anti-métal Ø25](https://nfc.cards/fr/anti-metal/97-sticker-nfc-ntag213-anti-metal-transparent.html)

**Porte de lancement bloquante** : le fournisseur doit confirmer QR/numéro variables par pièce sans facturer chaque carte graphique comme un nouveau design. Sinon, Tapote Mini reste en prototype ou passe par un convertisseur local capable de données variables.

## 9. Que mettre vraiment sur chaque support

### 9.1 Principes

- L’objet ne doit pas expliquer toute l’offre.
- Une action principale, un repère NFC, un QR et une marque suffisent.
- Ne pas imprimer téléphone, e-mail et réseaux si ces informations doivent pouvoir changer.
- Éviter les faux boutons et les rangées d’icônes sociales minuscules.
- Le texte répond à trois questions : **qui**, **pourquoi approcher**, **où approcher/scanner**.
- Maximum deux familles de caractères et trois graisses.
- Contraste texte/fond testé sur le matériau final.

### 9.2 Card PVC — trois templates simples

#### Template A — carte de visite Tapote

**Recto**

- logo entreprise, largeur 14 à 24 mm ;
- prénom + nom, une ligne, 9 à 12 pt ;
- fonction ou société, une ligne, 7 à 9 pt ;
- petit repère NFC dans l’angle supérieur droit.

**Verso**

- `Approchez ou scannez`, une ligne, 8 à 10 pt ;
- QR 18 à 22 mm ;
- `Coordonnées · site · rendez-vous`, une ligne, 6,5 à 8 pt ;
- numéro Tapote discret, 5,5 à 6 pt.

**Maximum** : quatre lignes informatives sur toute la carte hors CTA.

#### Template B — marque forte

**Recto**

- logo centré ou monogramme ;
- baseline, une ligne de six mots maximum ;
- repère NFC.

**Verso**

- prénom + nom, une ligne ;
- rôle, une ligne ;
- QR 18 à 22 mm ;
- `Voir mon profil`, une ligne ;
- numéro discret.

#### Template C — commercial

**Recto**

- prénom + nom ;
- société ;
- bénéfice court : `Échangeons en 1 geste` ;
- repère NFC.

**Verso**

- QR ;
- `Coordonnées · brochure · RDV` ;
- URL courte lisible seulement si elle tient sans réduire le QR ;
- numéro discret.

**À bannir** : six réseaux sociaux, adresse postale complète, longue liste de services, photo minuscule, QR décoré ou textes sous 5,5 pt.

### 9.3 Card Metal

**Face métal**

- logo ou monogramme ;
- prénom + nom maximum ;
- éventuellement fonction sur une seule ligne ;
- aucune instruction de tap qui ferait croire que cette face est active.

**Face PVC/PET**

- `Tapotez de ce côté` ;
- repère NFC ;
- QR 18 à 22 mm ;
- `Ou scannez` ;
- numéro discret.

**Maximum** : trois lignes côté métal, trois lignes côté lecture.

### 9.4 Card Bois

**Recto**

- logo simplifié ;
- prénom + nom ;
- fonction ou baseline, pas les deux si la place manque ;
- repère NFC.

**Verso**

- QR ≥ 20 mm ;
- `Approchez ou scannez` ;
- numéro.

**Minimums** : texte 8 pt ; réserve 9 pt gras ; trait 0,30 mm. Utiliser une version de logo sans détails fins.

### 9.5 Comptoir

Ordre visuel :

1. marque/client ;
2. CTA de résultat : `Laissez-nous un avis`, `Voir le menu`, `Prendre rendez-vous` ;
3. zone `Tapotez ici` ;
4. séparateur `ou` ;
5. QR ;
6. microtexte optionnel `Sans application`.

| Élément | Minimum |
|---|---:|
| Logo | largeur 25 mm |
| CTA | 18 pt, deux lignes maximum |
| Instruction NFC | 14 pt |
| QR | 28 à 32 mm |
| Microtexte | 8 pt |
| Nombre total de lignes | 5 hors logo |

Un seul résultat par comptoir. Ne pas imprimer à la fois avis, menu, Wi-Fi, Instagram et paiement.

### 9.6 Plaque

Ordre :

1. logo ;
2. CTA, deux lignes maximum ;
3. repère NFC ;
4. QR ;
5. microtexte/numéro.

| Élément | Minimum |
|---|---:|
| CTA | 16 pt |
| Instruction | 12 pt |
| QR | 28 à 32 mm |
| Microtexte | 7,5 pt |
| Nombre total de lignes | 4 hors logo |

Pour une porte ou un mur, le message se comprend à 1 mètre. La destination détaillée apparaît après le tap, pas sur la plaque.

### 9.7 Sticker téléphone

**45 × 35 mm**

- côté gauche/centre : pictogramme NFC + `Tapotez` ;
- côté droit : QR 14 mm ;
- dessous : numéro de 5,5 pt, si lisible ;
- aucun nom long, fonction ou liste d’actions.

**Rond Ø29,5 mm**

- pictogramme NFC ;
- `Tapotez` ;
- pas de QR si sa zone calme ne tient pas proprement ;
- QR de secours sur carte d’activation.

Le rectangle 45 × 35 mm est le vrai produit Tapote ; le rond est une variante minimaliste, pas le support de démonstration principal.

## 10. Décision build vs buy pour chevalet et plaque

### 10.1 Peut-on cacher le tag actuel ?

**Oui, pour un prototype non métallique**, si le tag :

- est un vrai NTAG213 de 30 à 38 mm ;
- n’est ni plié ni découpé ;
- est collé à plat ;
- reste séparé de toute pièce métallique ;
- est centré avec un gabarit ;
- est masqué par une zone opaque dédiée ;
- est encodé puis retesté sur l’objet fini.

**Non, pour la série**, si « le tag actuel » signifie :

- une vieille carte NFC entière collée ;
- un sticker dont la puce, l’antenne ou la colle sont inconnues ;
- un composant visible à travers le PMMA ;
- un tag standard posé contre une porte métallique ;
- une pose manuelle sans gabarit et sans test 100 %.

### 10.2 Matrice de décision

| Architecture | Rendu | Mise à jour | Risque | Coût | Décision |
|---|---|---|---|---|---|
| UV directe seconde surface, tag masqué | excellent | retirage complet | faible après qualification | moyen | **Signature par défaut** |
| Sticker pro miroir + blanc, contrecollé | bon à excellent | retirage film | bulles/colle/opacité | bas à moyen | **prototype et variable** |
| Insert rigide remplaçable | variable | excellente | aspect porte-affiche/jeu | moyen | **B2B campagnes seulement** |
| OEM fini PVC/PMMA | dépend du BAT | faible | produit générique/données variables | bas | **Express si QA passe** |
| Carte/sticker artisanal collé sur chevalet | faible | facile | visible, instable, non répétable | trompeusement bas | **rejeté** |

### 10.3 Seuil d’externalisation

- **1–3 pièces** : assemblage Tapote admis pour apprendre.
- **10 pièces** : assemblage Tapote seulement avec gabarit, fiche suiveuse et QA 100 %.
- **25+ pièces** : demander au façonnier objet fini, tag intégré ou pose industrialisée.
- **100+ pièces** : golden sample, AQL contractuel ou contrôle 100 % NFC/QR, lot et traçabilité fournisseur.

### 10.4 Choix final

- **Comptoir Signature** : PMMA monobloc UV seconde surface, fabriqué et assemblé localement.
- **Plaque Signature** : même procédé.
- **Express** : tester OEM PVC/PMMA et contrecollage professionnel ; conserver seulement celui dont l’aspect et la marge passent.
- **Aucun insert papier** dans la gamme standard.
- **Aucune ancienne carte NFC collée** dans un produit vendu.

## 11. Protocole QA commun iPhone, Android et QR

### 11.1 Matrice appareils minimale

- iPhone récent ;
- iPhone de trois à cinq générations ;
- Samsung Galaxy récent ;
- Samsung milieu de gamme ;
- Google Pixel ;
- Xiaomi ou Android très diffusé.

Ajouter deux Android et deux coques pour Metal. Pour Tapote Mini, tester également le téléphone porteur et le téléphone lecteur.

### 11.2 Script NFC

Pour chaque couple produit/téléphone :

1. écran allumé et déverrouillé ;
2. approcher selon la zone d’antenne du téléphone ;
3. mesurer succès/échec et délai ;
4. répéter 20 fois ;
5. recommencer face/orientation utile ;
6. tap centré puis à ±10 mm ;
7. tester support en main puis installé ;
8. confirmer l’URL ouverte ;
9. enregistrer modèle, OS, coque, résultat et temps.

### 11.3 Script QR

- dix scans consécutifs ;
- lumière naturelle, commerce chaud et faible ;
- reflet latéral ;
- Card : 15/25/40 cm ;
- Comptoir/Plaque : 20/40/70 cm ;
- Sticker : 10/15/25 cm ;
- plusieurs angles ;
- aucun échec répété toléré à la distance d’usage.

### 11.4 Contrôle lot

- Aspect : 100 %.
- NFC : 100 %.
- QR : 100 %.
- Destination : 100 %.
- Dimensions : 5 pièces par lot de 25.
- Destructif/mécanique : échantillon séparé.
- Enregistrer date, opérateur, téléphone, UID, support_id, résultat.

## 12. Séquence exacte de commandes et RFQ

### Vague 0 — cette semaine, composants et benchmarks

1. NFC.CARDS : 10 Card PVC NTAG213 recto-verso.
2. Shop NFC : 10 Card PVC NTAG213 Express.
3. NFC.CARDS : 10 Card bois/bambou gravées.
4. Shop NFC : 10 Card bambou gravées ou UV.
5. Shop NFC : 5 ou 10 Card Metal selon panier, UV/laser comparés.
6. NFC.CARDS : 10 Card métal/PVC gravées.
7. Shop NFC : 10 tags anti-métal Ø30 non imprimés.
8. NFC.CARDS : 15 tags anti-métal Ø25.
9. Shop NFC : 30 stickers premium anti-métal 45 × 35 mm, si données variables acceptées.
10. Un chevalet PVC OEM Shop NFC comme benchmark fonctionnel.
11. Un kit/plaque PMMA OEM si accessible sans acheter 24 personnalisés.

### Vague 1 — RFQ local identique

Envoyer à ESI-3D, Pluxi et Harmonyl :

- Comptoir 110 × 160 mm, PMMA 3 et 4 mm ;
- Plaque 120 × 120 mm, PMMA 3 et 5 mm ;
- UV seconde surface, CMJN + blanc ;
- tag standard et variante ferrite ;
- QR/numéro variables ;
- prototype A UV direct ;
- prototype B film pro contrecollé ;
- prix 1/10/25/50/100/500 ;
- assemblage, contrôle, emballage et délai séparés.

Envoyer à Graphiscann :

- film polyester transparent ;
- impression miroir, quadri + blanc total et sélectif ;
- adhésif permanent optiquement clair compatible PMMA ;
- une planche A4, puis 10/25/50/100/500/1 000 ;
- données variables et QR par pièce ;
- finition mate/brillante ;
- fiche adhésif et opacité du blanc.

### Vague 2 — présérie

- Choisir un seul Comptoir et une seule Plaque.
- Corriger le dossier après prototype, puis commander 25.
- Mesurer temps de BAT, assemblage, QA, rebut et emballage.
- Ne pas modifier simultanément matière, encre, tag et forme entre prototype et présérie.

### Vague 3 — qualification série

- PVC 100 chez Tag&Play pour comparer le coût industriel.
- PMMA 100 chez le gagnant local.
- Metal 100 chez RFID Connect uniquement après golden sample.
- Sticker 100/500 chez Shop NFC ou convertisseur retenu.

## 13. Questions RFQ bloquantes

### Pour tous les NFC

- Fabricant et référence exacte de la puce ?
- Géométrie, dimensions et matériau de l’antenne ?
- NDEF URI et lecture UID possibles ?
- Données variables par pièce ?
- Encodage et rapport de contrôle ?
- Tag verrouillé, protégé ou vierge à la livraison ?
- Test NFC réel sur produit fini, avec quels téléphones ?
- Taux de rebut et remplacement ?
- La construction de série est-elle identique au prototype ?

### Pour métal et anti-métal

- Face de lecture exacte ?
- Ferrite : matière, épaisseur, dimensions et couverture ?
- Distance mesurée sur iPhone/Android ?
- Effet d’une coque ?
- Que signifie précisément « works on metal » ou « anti-metal: no » sur la fiche ?

### Pour impression

- Procédé, résolution, profil couleur ?
- Blanc total ou sélectif, nombre de passes et densité ?
- Sens miroir pour seconde surface ?
- Données variables sans coût de changement par pièce ?
- Tolérance de coupe, pli, position QR/NFC ?
- BAT écran, photo du premier article ou BAT physique ?
- Garantie abrasion, humidité, UV et produits de nettoyage ?

### Pour origine

- Pays de fabrication du support ?
- Pays d’impression, encodage et assemblage ?
- Fiche matière et certificat éventuel ?
- Une allégation « France », « recyclé » ou « extérieur » peut-elle être reliée au SKU du devis ?

## 14. Fournisseurs et contacts vérifiés

| Fournisseur | Rôle | Contact |
|---|---|---|
| NFC.CARDS / SAS WAKDEV | PVC, bois, métal/PVC, anti-métal | `contact@nfc.cards` · [contact](https://nfc.cards/fr/nous-contacter) |
| Shop NFC / Sinfotech.it | PVC, bois, métal hybride, sticker, benchmark OEM | `info@shopnfc.com` · +39 039 894 6116 · [présentation](https://shopnfc.com/en/content/4-about-us) |
| Tag&Play | PVC série et données variables | [carte PVC](https://shop.tagandplay.com/cartes-pvc.html) · [contact](https://tagandplay.com/contact/) |
| Smart Carte | alternative cartes France | `contact@s-carte.fr` · 09 53 03 80 00 · [site](https://s-carte.fr/) |
| ESI-3D | PMMA sur mesure, UV, pliage, assemblage | `contact@esi3d.fr` · [contact](https://www.esi-3d.fr/contact) |
| Pluxi | PMMA industriel et PLV | 02 97 76 37 37 · [devis](https://pluxi.fr/contact/demande-de-devis/) |
| Harmonyl | PMMA, laser, numérique, pliage | `contact@harmonyl.com` · 04 26 85 07 44 · [contact](https://www.harmonyl.com/contact) |
| Graphiscann | film transparent + blanc | `contact@graphiscann.com` · 04 72 33 60 70 · [produit](https://www.graphiscann.fr/etiquettes-transparentes-impression.html) |
| RFID Connect | métal hybride volume Chine | `info@rfidconnectus.com` · +86 185 7641 2074 · [contact](https://www.rfidconnectus.com/contacts/) |

## 15. Gates de lancement

| Produit | Gate technique | Gate coût |
|---|---|---:|
| Card PVC | 20/20 sur six téléphones, QR 10/10 | COGS ≤ 12/20 € |
| Card Metal | lecture face PVC intuitive, huit téléphones, performance ≥ 90 % PVC | COGS ≤ 39 € |
| Card Bois | grain compatible QR, aucun gauchissement/écharde | COGS ≤ 24 € |
| Comptoir | stable à 5 N, pli/UV/tag invisibles | COGS ≤ 24/31 € |
| Plaque | lecture installée sur support réel, version métal séparée | COGS ≤ 20/27 € |
| Tapote Mini | adhésion J30, lecture 20/20, QR variable faisable | COGS ≤ 6,50 € |

Un produit qui échoue une gate reste hors boutique. Le QR ne sert pas à masquer un NFC médiocre, et la personnalisation ne sert pas à masquer un objet générique.

## 16. Acheter une machine ? Décision industrielle

### 16.1 Réponse courte

**Pas de machine de production chère maintenant.** Tapote n'a pas encore validé assez de volume par procédé, ni figé assez de références, pour savoir si la contrainte dominante sera l'impression UV, la carte, la gravure métal ou la découpe PMMA/bois.

La bonne cellule interne immédiate est une cellule de **préparation, encodage et contrôle**, pas une mini-usine :

- 1 à 2 lecteurs/encodeurs NFC USB ;
- gabarits CR80 et gabarits de positionnement QR/NFC ;
- smartphones iPhone/Android de référence ;
- pied à coulisse, balance, loupe et éclairage photo constant ;
- nuancier imprimé et golden samples ;
- poste d'emballage, étiqueteuse et suivi des numéros de série.

Budget interne à demander par devis : **500 à 1 500 € HT**, hors téléphones déjà disponibles. Cette cellule produit immédiatement de la valeur : contrôle à réception, réencodage, petites urgences et apprentissage radio. Elle ne prétend pas fabriquer le support.

Une machine ne produit jamais à elle seule un objet NFC fini :

1. l'inlay/tag NFC reste acheté ;
2. le support doit être acheté ou découpé ;
3. l'impression ou la gravure doit être faite ;
4. l'adhésif, la ferrite et l'assemblage restent à gérer ;
5. l'encodage, le QA, l'emballage et la traçabilité restent obligatoires.

### 16.2 Impression couleur, gravure et découpe : ne pas les confondre

| Besoin | Technologie pertinente | Ce qu'elle ne fait pas |
|---|---|---|
| Logo, photo, couleur Pantone approchée, blanc sous-couche sur PMMA/métal/bois | Jet d'encre UV à plat, CMJN + blanc ; vernis/primer selon configuration | Ne découpe pas, ne plie pas, ne fabrique pas l'inlay |
| Marquage noir/blanc ou gravure de métal | Laser fibre ; MOPA pour davantage de réglages matière | Ne fait pas une impression couleur CMJN fidèle |
| Découpe et gravure de PMMA coulé ou bois | Laser CO2 | Ne doit jamais traiter le PVC ; ne fait pas de couleur |
| Carte PVC standard imprimée bord à bord | Imprimante cartes directe ou retransfert | Ne fabrique ni le sandwich PVC ni l'antenne NFC |
| Carte compatible spécialement enduite pour transfert thermique | Sublimation/pressage validé par le fabricant du blank | Incompatible par défaut avec une carte NFC PVC générique |

Une couleur obtenue par oxydation au laser MOPA n'est pas une impression couleur. Elle dépend de l'alliage, du polissage et des paramètres ; elle ne remplace pas un logo de marque en CMJN/Pantone.

### 16.3 Hypothèses communes du modèle économique

Les prix et calculs ci-dessous sont des **ordres de grandeur HT au 30 juillet 2026**, à confirmer par devis. Ils servent à décider, pas à comptabiliser.

- amortissement interne : 36 mois ;
- main-d'œuvre chargée : 35 €/h ;
- coût fixe mensuel : amortissement + contrat/service + nettoyage + filtres de base ;
- coût variable : consommables, énergie, temps opérateur direct et rebut courant ;
- loyer, assurance, financement, TVA et coût d'opportunité non inclus ;
- coût à 50/100/300/1 000 = `coût variable + coût fixe mensuel / quantité` ;
- les lignes UV/fibre/CO2 chiffrent **seulement l'opération réalisée par la machine**, sans blank, NFC, pliage ni emballage ;
- les lignes imprimante cartes incluent un blank NFC standard indicatif, mais pas l'encodage et l'emballage final.

Une machine doit être achetée sur les **volumes récurrents d'un même procédé**, pas sur le volume total de la boutique.

## 17. UV à plat : couleur sur PVC, PMMA, métal et bois

### 17.1 Ce que l'UV permet vraiment

Une UV à plat peut imprimer :

- CMJN sur face blanche ;
- un blanc de soutien sous une couleur sur support transparent ou sombre ;
- un blanc sélectif ;
- du vernis relief, si la configuration d'encre comporte du gloss ;
- un primaire, si la configuration comporte du primer ;
- des QR, numéros et prénoms variables avec un RIP et un workflow correctement paramétrés.

Applications Tapote :

- face arrière imprimée en miroir d'un PMMA transparent ;
- couleur directe sur blank PVC, PMMA, bois préparé ou métal peint ;
- petites séries personnalisées et prototypes ;
- gabarits multi-poses pour cartes et stickers rigides.

Limites :

- le primer intégré améliore certaines adhérences mais ne garantit pas la tenue : test quadrillage, rub test, alcool/nettoyant et vieillissement restent nécessaires ;
- le PMMA doit être qualifié par référence ; extrusion et coulé ne réagissent pas toujours pareil ;
- le blanc se décante, les buses se bouchent et la machine ne doit pas rester de longues périodes sans entretien ;
- l'impression directe sur bois laisse voir le grain et absorbe différemment selon la finition ;
- l'impression sur métal ne crée pas la construction radio hybride nécessaire au NFC ;
- la machine n'effectue ni découpe, ni polissage, ni pliage à chaud, ni collage, ni pose de ferrite.

### 17.2 Modèles crédibles et prix vérifiés

| Niveau | Modèle | Capacité utile | Prix neuf / occasion observé |
|---|---|---|---|
| Compact professionnel | Roland VersaSTUDIO BD-12 | 305 × 210 mm, objets ≤ 102 mm/5 kg, CMJN + blanc + primer **ou** gloss, 1 440 dpi | **8 900 € catalogue** avec un an de RolandCare ; BD-8 210 × 148 mm à 6 900 €, trop petit pour certaines développées Tapote |
| Production A3/A2 | Roland VersaOBJECT MO-180/MO-240 | MO-240 : 610 × 458 mm, hauteur 204 mm, jusqu'à 2,39 m²/h, blanc/gloss/primer selon configuration | Sur devis ; benchmark officiel de la génération LEF2 : LEF2-200 24 900 €, LEF2-300 33 900 €, LEF2-300D 37 900 € |
| Production A3 | Mimaki UJF-3042MkII e | plateau environ 300 × 420 mm, CMJN + blanc + clair, primer selon configuration | prix catalogue revendeur observé **25 538 € HT** ; devis France obligatoire |
| Occasion reconditionnée | Mimaki UJF-3042MkII | même famille, machine installée à auditer | annonce pro juillet 2026 : **8 999 € HT**, garantie 6 mois et formation ; marché d'annonces observé autour de 5 650 à 9 950 € selon état |

Sources :

- [Roland BD, prix, formats, encres et sécurité](https://www.rolanddg.eu/fr/produits/impression/versastudio-serie-bd)
- [Roland MO, formats et productivité](https://www.rolanddg.eu/en/products/printers/versaobject-mo-series)
- [Roland LEF2, benchmark prix catalogue](https://www.rolanddg.eu/fr/produits/impression/imprimantes-uv-a-plat-versaobject-lef2)
- [Mimaki UJF MkII e](https://www.mimaki.fr/products/imprimantes-uv/ujf-mkii-e-series/)
- [UJF-3042MkII reconditionnée, annonce pro datée](https://www.kleinanzeigen.de/s-anzeige/mimaki-ujf-3042-mkii-generalueberholter-uv-flachbettdrucker/3184845871-225-1672)

### 17.3 Coût caché et exploitation

À budgéter avec la machine :

- jeu complet d'encres, liquide de nettoyage et bacs de déchets ;
- plusieurs plateaux/gabarits : CR80, Mini, plaques 120 × 120, blanks de comptoir ;
- aspiration du plateau si non intégrée ;
- extraction/filtration et validation du local, même si l'encre est certifiée à faibles émissions ;
- ordinateur/RIP, spectrophotomètre ou au minimum charte de contrôle ;
- table stable, dégagement de maintenance et stockage tempéré des encres ;
- contrat d'entretien, tête d'impression et déplacement technicien ;
- lots de matière pour profilage et tests destructifs.

La BD-12 mesure environ 995 × 710 × 583 mm et pèse 80 kg. Une machine « de bureau » exige donc un meuble adapté, un accès frontal et une zone propre. Les MO/UJF demandent une vraie zone de production.

Routine :

- chaque jour d'utilisation : nozzle check, agitation/contrôle du blanc, nettoyage du plateau ;
- chaque changement de matière : test adhérence et hauteur ;
- chaque série : premier article signé puis contrôle du dernier ;
- chaque semaine : nettoyage cap/wiper selon manuel ;
- arrêt prolongé : procédure constructeur, jamais une simple mise hors tension.

Apprentissage réaliste : **2 à 4 semaines** pour des sorties convenables ; **6 à 12 semaines** pour obtenir des profils, gabarits et résultats répétables sur quatre matières. La vitesse constructeur n'est pas le débit Tapote : les passages blanc + couleur + vernis, le chargement et le QA réduisent fortement le nombre de pièces par heure.

Débit de planification, à valider par chrono :

- BD-12 : 6 à 20 objets/heure selon taille, nombre de passes et gabarit ;
- MO/UJF : 20 à 80 petits objets/heure en multi-pose ;
- QR variable : ajouter le temps de préparation de données et de contrôle, pas seulement le temps d'impression.

### 17.4 Verdict UV

Le **BD-12** est la seule UV neuve dont le ticket paraît compatible avec une première internalisation, mais elle ne doit être envisagée qu'après :

- 300 faces rigides UV par mois pendant trois mois ;
- ou plus de 2 000 €/mois dépensés en impression UV courte série ;
- et deux familles de produits déjà stabilisées.

Une MO/UJF neuve devient rationnelle vers **500 à 800 impressions rigides/mois**, ou si Tapote vend aussi une vraie prestation B2B d'impression. Une occasion n'est intéressante qu'avec :

- nozzle test daté ;
- historique d'entretien ;
- démonstration blanc + couleur + vernis/primer ;
- pièces et technicien disponibles en France ;
- transport, installation, calibration et formation inclus ;
- clause de reprise ou garantie.

## 18. Laser fibre : marquage et gravure métal

### 18.1 Capacité et limites

Le laser fibre est pertinent pour :

- logo, prénom, numéro de série et QR gravés ou marqués sur carte métal ;
- marquage rapide de métal anodisé, peint ou nu après création d'une bibliothèque de paramètres ;
- personnalisation tardive d'un blank métal/hybride déjà fabriqué.

Il ne :

- fabrique pas l'antenne ni la couche ferrite ;
- n'imprime pas un logo couleur ;
- ne garantit pas la même couleur sur deux alliages ;
- ne découpe pas proprement et économiquement une carte métallique épaisse avec un simple 20 W ;
- ne traite pas le bois ou le PMMA transparent comme un CO2.

Pour Tapote, on achète donc un **blank métal hybride NFC fini**, puis on grave seulement la face autorisée par le plan radio.

### 18.2 Modèles et budget

| Niveau | Modèle | Capacité utile | Prix |
|---|---|---|---|
| Prosumer fermé, double source | xTool F1 Ultra | fibre 20 W + diode 20 W, zone annoncée 220 × 220 mm, jusqu'à 10 000 mm/s | page France observée : standard **2 999 €**, avec convoyeur 3 389 €, deluxe 4 399 € ; prix/promotions à reconfirmer |
| Professionnel classe 1 | Gravotech WeLase Fibre/MOPA | fibre 20/30 W ou MOPA 30 W, marquage 110 × 110 mm, objet jusqu'à 340 × 200 × 100 mm | devis ; station fermée classe 1 |
| Industriel d'occasion | Trotec SpeedMarker 300 MOPA | galvo industriel, automatisation possible | annonce pro juillet 2026 sans prix ferme ; prix neuf historique déclaré 75 500 € HT ; exemples d'occasion européens autour de 14 900 € à auditer |

Sources :

- [xTool F1 Ultra France](https://fr.xtool.com/products/xtool-f1-ultra-graveur-laser-double-fibre-et-diode-20w)
- [comparaison et zone F1 Ultra](https://fr.xtool.com/pages/xtool-f1-ultra-et-autres-lasers-fibre)
- [Gravotech WeLase](https://www.gravotech.fr/produits/stations-de-marquage-laser/welase)
- [brochure WeLase, puissances et encombrement](https://www.gravotech.fr/sites/default/files/2025-11/Gravotech-WELASE-fr-FR-web.pdf)
- [Trotec SpeedMarker 300 MOPA d'occasion, annonce professionnelle](https://www.kleinanzeigen.de/s-anzeige/trotec-speedmarker-300-mopa-fiber-faser-lasermaschine-galvo-speedy/3108976588-249-8425)

### 18.3 Atelier, sécurité et débit

Équipement complémentaire :

- enceinte intégrale interverrouillée ; ne pas exploiter un galvo ouvert dans un atelier partagé ;
- extraction adaptée aux fumées métalliques et revêtements ;
- gabarit CR80 non réfléchissant, butées X/Y et contrôle de focus ;
- lunettes appropriées seulement comme protection supplémentaire, jamais comme remplacement d'une enceinte ;
- caméra ou viseur, lentille protégée, filtres et pièces de rechange ;
- analyse des revêtements avant marquage : aucune matière inconnue.

Une station industrielle fermée telle que WeLase reste classe 1 porte fermée. Une machine prosumer doit tout de même faire l'objet d'une évaluation de risques, d'une ventilation et d'une procédure opérateur en contexte professionnel.

Apprentissage : 1 à 2 semaines pour des marquages simples ; 4 à 8 semaines pour une bibliothèque fiable alliage × finition × rendu. Débit interne de planification, non garanti constructeur : **30 à 80 cartes/heure** avec gabarit, après validation du marquage et du NFC.

Consommables :

- électricité faible ;
- lentille/protection et filtres d'extraction ;
- gabarits ;
- produits de nettoyage ;
- rebut de blanks métal coûteux pendant le réglage.

### 18.4 Verdict fibre

Seuil financier brut : environ 70 cartes métal gravées/mois face à une gravure sous-traitée estimée 4 €/pièce. Seuil opérationnel recommandé : **150 cartes métal/mois pendant trois mois**, avec au moins 70 % des designs compatibles gravure monochrome.

Ne pas acheter de fibre avant le lancement validé de Card Metal. Le risque principal n'est pas la vitesse de gravure ; c'est de rebuter un blank hybride cher ou de dégrader sa performance radio.

## 19. Laser CO2 : bois et PMMA, jamais PVC

### 19.1 Capacité et limites

Un CO2 peut :

- découper et graver du PMMA adapté ;
- découper et graver bois/bambou ;
- produire gabarits, calages et prototypes ;
- donner une arête polie à certains PMMA avec des paramètres corrects.

Il ne :

- doit **jamais** découper ou graver du PVC, du vinyle ou une matière halogénée inconnue ;
- n'imprime pas de couleur ni de blanc ;
- ne marque pas directement du métal nu sans procédé additionnel ;
- ne plie pas le PMMA ;
- ne remplace pas le ponçage, le polissage, le nettoyage et l'assemblage NFC.

Le PVC libère des gaz chlorés toxiques et corrosifs sous laser. Exiger une fiche matière avant toute découpe ; une mention commerciale « plastique » ne suffit pas.

### 19.2 Modèles et prix

| Niveau | Modèle | Capacité utile | Prix |
|---|---|---|---|
| Prosumer fermé | xTool P2S CO2 55 W | zone de travail annoncée environ 680 × 360 mm ; caméra et accessoires | standard **3 599 €** ; packs observés 4 819 à 6 839 € selon convoyeur/filtration/accessoires |
| Reconditionné constructeur | xTool P2/P2S | même famille | offre reconditionnée officielle observée **2 159,28 €**, stock variable |
| Professionnel | Gravotech LS100 | CO2 de production compacte, réseau SAV | devis |
| Occasion professionnelle | Trotec Speedy 100 / Gravograph LS100 | machines à auditer avec extraction | annonces européennes juillet 2026 : Speedy 100 autour de 4 500 à 11 300 € ; LS100 Energy observée 8 900 € TTC |

Sources :

- [xTool P2S France](https://fr.xtool.com/collections/nouvelle-serie-blanche/products/xtool-p2-decoupeur-laser-co2-de-55w)
- [xTool P2/P2S reconditionné](https://fr.xtool.com/products/reconditionne-xtool-p2-p2s-decoupeur-laser-co2-de-bureau-de-55w)
- [Gravotech LS100](https://www.gravotech.fr/produits/graveurs-laser-decoupeurs-laser/ls100)
- [annonces Trotec Speedy 100](https://www.kleinanzeigen.de/s-trotec-speedy-100/k0)
- [Gravograph LS100 Energy d'occasion](https://www.ebay.de/itm/287190761817)
- [Trotec : matières non adaptées au laser](https://www.troteclaser.com/en-ca/resources/faqs/unsuitable-materials-laser-processing)

### 19.3 Atelier, maintenance et débit

À ajouter :

- extraction extérieure ou filtration dimensionnée, tuyauterie et filtres ;
- air assist et refroidissement/chiller selon machine ;
- extincteur adapté, détection incendie et surveillance permanente ;
- stock matière déclaré, séparé et étiqueté ;
- grille nid d'abeille, lames, lentilles, miroirs et consommables ;
- gabarits de pose, aspiration/masquage anti-fumée et zone de nettoyage ;
- marge autour de la machine, convoyeur éventuel et espace de stockage des plaques.

Maintenance :

- nettoyage lentille/miroirs et lit ;
- contrôle air assist et extraction ;
- alignement optique selon machine ;
- remplacement filtres et, à terme, tube CO2 ;
- nettoyage des dépôts de bois inflammables.

Apprentissage : 2 à 4 semaines pour la découpe simple ; 6 à 10 semaines pour tenir des arêtes, tolérances, fumées, protection de surface et cadence. Débit indicatif interne :

- cartes bois : 15 à 50 blanks/heure selon épaisseur, gravure et nesting ;
- petites plaques PMMA : 10 à 40 pièces/heure ;
- débit fini nettement inférieur après nettoyage, UV, pliage, tag et QA.

### 19.4 Verdict CO2

Le CO2 n'est pas la première machine Tapote. L'acheter ne résout ni l'impression couleur ni le pliage. L'achat ne devient pertinent qu'au-delà de **300 découpes/graves PMMA ou bois par mois**, pendant trois mois, si :

- les fichiers et matières sont stabilisés ;
- la sous-traitance de découpe dépasse 1 200 €/mois ;
- un atelier ventilé et assuré existe ;
- la machine sert aussi à des gabarits et prototypes.

## 20. Imprimantes cartes : directe, retransfert et « sublimation »

### 20.1 Trois procédés différents

**Impression directe sur carte, dye-sublimation + résine**

- la tête dépose la couleur directement sur une carte CR80 ;
- rapide et économique ;
- léger bord blanc possible et rendu moins homogène sur surface imparfaite ;
- pertinente pour badges et cartes standard, moins premium pour Card Signature.

**Retransfert**

- l'image est imprimée sur un film, puis transférée sur la carte ;
- vrai débord, 600 dpi sur Evolis Agilia, meilleure tolérance aux surfaces et puces ;
- rendu plus premium, mais film + ruban, machine plus chère et cycle plus lent.

**Presse à chaud / sublimation sur blank enduit**

- uniquement si le blank porte un revêtement polyester certifié et une plage température/pression du fabricant ;
- une carte PVC NFC générique peut gondoler, se délaminer ou voir sa performance radio changer ;
- pas de production Tapote sans validation écrite du fabricant du blank et test de 100 pièces.

### 20.2 Modèles, prix et consommables

| Procédé | Modèle | Capacité | Prix observé |
|---|---|---|---|
| Directe | Evolis Primacy 2 | 300 dpi standard, jusqu'à 280 cartes/h simple face, 170/h double face, chargeur 100/200 | neuf Europe environ **1 155 à 1 700 €** selon version ; annonce juillet 2026 à partir de 999 € HT chez un revendeur ; occasion récente observée 900 à 1 250 € |
| Retransfert | Evolis Agilia | 600 dpi, débord, jusqu'à 150 cartes/h simple face, 100/h double face, chargeur 200 | revendeurs observés **2 780 à 4 470 € HT** selon configuration et canal |
| Presse chaleur | presse plate professionnelle + imprimante sublimation | dépend du gabarit et du blank | cellule complète indicative **1 000 à 2 500 €**, sans qualification NFC |

Consommables vérifiés :

- Primacy 2 YMCKO : 56,10 € HT/200 faces ou 73,95 € HT/300 faces, soit environ **0,25 à 0,28 €/face** ;
- Agilia YMCK : 159 à 190 € HT/600 faces, soit **0,27 à 0,32 €/face** ;
- film Agilia : 78,50 à 110 € HT/1 200 faces, soit **0,07 à 0,09 €/face** ;
- ajouter cartes de nettoyage, rebut, tête, transport, et blank NFC.

Sources :

- [Evolis Primacy 2, spécifications officielles](https://fr.evolis.com/solutions/imprimantes-cartes-plastiques/imprimante-cartes-primacy2/)
- [Evolis Agilia, spécifications officielles](https://de.evolis.com/losungen/drucker/agilia-kartendrucker/)
- [brochure officielle Agilia](https://fr.evolis.com/wp-content/uploads/2025/02/brochure-agilia-eng.pdf)
- [prix Primacy 2, comparateur européen](https://www.idealo.de/preisvergleich/OffersOfProduct/204111950_-primacy-2-evolis.html)
- [prix Agilia et consommables, revendeur](https://www.jarltech.com/en/evolis-agilia)
- [prix consommables Primacy 2](https://www.barcoda.fr/100307-primacy-2)
- [prix consommables Agilia](https://shop.heydensecurit.de/evolis__retransfer)
- [Primacy 2 d'occasion, annonce datée](https://www.kleinanzeigen.de/s-anzeige/evolis-primacy-2-kartendrucker/3364630223-225-16331)

### 20.3 Ce que l'imprimante cartes change dans le BOM

Elle impose l'achat de **blanks NFC CR80 déjà laminés**, compatibles avec :

- épaisseur acceptée par l'imprimante ;
- température du procédé ;
- position d'antenne ;
- planéité ;
- éventuellement couche de retransfert.

Avant achat :

1. faire imprimer 50 blanks Tapote chez un démonstrateur Evolis ;
2. mesurer la lecture NFC avant/après sur les six téléphones ;
3. contrôler QR 10/10 ;
4. vérifier bord, noir, gradient, petit texte et abrasion ;
5. obtenir la référence exacte du ruban, du film et du blank ;
6. faire chiffrer tête, maintenance et intervention sur site.

Débit réaliste Tapote, incluant chargement, données variables et QA :

- Primacy 2 : 80 à 180 cartes/heure ;
- Agilia : 50 à 100 cartes/heure ;
- presse chaleur : 15 à 40 cartes/heure, avec risque opérateur supérieur.

### 20.4 Verdict cartes

La Primacy 2 gagne sur le coût mais pas automatiquement sur le rendu. Elle est adaptée à une future gamme Essential, si le test visuel est au niveau.

L'Agilia est la seule candidate interne cohérente pour une carte premium imprimée, mais uniquement après **300 à 500 cartes PVC/mois pendant trois mois** ou dépenses d'impression externe supérieures à 1 500 €/mois. Le blank NFC reste sous-traité.

La presse à chaud n'est pas recommandée pour la gamme principale. Elle peut rester un test R&D sur un blank certifié, jamais un raccourci vers une carte premium.

## 21. Coût unitaire machine aux volumes Tapote

### 21.1 Coûts de cellule estimés

| Cellule | CAPEX installé estimé | Fixe/mois | Variable/pièce | 50/mois | 100/mois | 300/mois | 1 000/mois |
|---|---:|---:|---:|---:|---:|---:|---:|
| UV compacte BD-12 + gabarits | 12 000 € | 430 € | 3,10 € | 11,70 € | 7,40 € | 4,53 € | 3,53 € |
| UV production MO/UJF | 35 000 € | 1 200 € | 2,70 € | 26,70 € | 14,70 € | 6,70 € | 3,90 € |
| Fibre prosumer fermée + extraction | 5 000 € | 210 € | 0,90 € | 5,10 € | 3,00 € | 1,60 € | 1,11 € |
| CO2 prosumer + extraction | 6 500 € | 280 € | 1,80 € | 7,40 € | 4,60 € | 2,73 € | 2,08 € |
| Primacy 2 + blank NFC | 2 500 € | 120 € | 2,10 € | 4,50 € | 3,30 € | 2,50 € | 2,22 € |
| Agilia + blank NFC | 6 000 € | 250 € | 2,20 € | 7,20 € | 4,70 € | 3,03 € | 2,45 € |
| Presse sublimation + blank compatible | 1 500 € | 85 € | 2,60 € | 4,30 € | 3,45 € | 2,88 € | 2,69 € |

Interprétation :

- l'UV, le laser fibre et le CO2 ne comprennent pas le support, le tag, l'assemblage ni l'emballage ;
- la ligne carte inclut un blank NFC indicatif, mais pas toutes les opérations de fulfilment ;
- le CAPEX installé est supérieur au prix machine : extraction, gabarits, première encre, formation et installation sont inclus ;
- le coût externe comparable doit être isolé sur le devis. Comparer une « impression seule » à un « produit fini livré » donnerait une fausse économie.

### 21.2 Break-even prudent

| Procédé | Sous-traitance comparable retenue pour le calcul | Break-even arithmétique | Seuil d'achat Tapote |
|---|---:|---:|---:|
| UV compacte | 5,50 €/face UV | ~180/mois | 300/mois, 3 mois |
| UV production | 5,50 €/face UV | ~430/mois | 500–800/mois, 3 mois |
| Gravure fibre | 4,00 €/marquage | ~70/mois | 150 cartes métal/mois, 3 mois |
| Découpe/grave CO2 | 4,00 €/pièce | ~130/mois | 300/mois + atelier conforme |
| Primacy 2 | 3,49 €/carte imprimée externalisée | ~90/mois | seulement si le rendu passe la gate |
| Agilia | 3,49 €/carte imprimée externalisée | ~195/mois | 300–500/mois, 3 mois |
| Presse chaleur | Pas de comparateur tant que le blank n'est pas certifié | non pertinent | ne pas acheter pour la gamme |

Le break-even arithmétique n'est pas le feu vert. Tapote applique un facteur de prudence pour :

- variation des commandes ;
- congés et panne opérateur ;
- maintenance et panne machine ;
- rebut d'apprentissage ;
- changements de gamme ;
- capacité inutilisée ;
- trésorerie immobilisée.

## 22. Plan A maintenant, Plan B après preuve

### Plan A — de maintenant à la validation produit

**Décision : externaliser toute fabrication lourde.**

1. Acheter les six familles en prototype/petite série chez les fournisseurs qualifiés.
2. Utiliser les méthodes de série dès le prototype : UV seconde surface, blank hybride, découpe réelle, véritable ferrite.
3. Garder en interne fichiers, données variables, encodage correctif, QA, photo et emballage.
4. Obtenir sur chaque facture le coût séparé :
   - blank/support ;
   - impression/gravure ;
   - tag/ferrite ;
   - assemblage ;
   - encodage ;
   - QA ;
   - emballage ;
   - transport.
5. Chronométrer temps interne et taux de rebut.
6. Tenir un journal mensuel `volume par procédé`, pas seulement `volume par produit`.

Équipement autorisé :

- cellule QA/encodage 500–1 500 € ;
- gabarits de contrôle ;
- échantillons matière ;
- aucun laser ni UV de production.

### Plan B — internalisation sélective

Ordre conseillé, uniquement si les gates sont atteintes :

1. **Agilia ou Primacy 2** si Card PVC devient un volume récurrent ; choix par test qualité, pas par prix.
2. **Fibre fermée** si Card Metal dépasse 150/mois et reste majoritairement gravée.
3. **BD-12** si PMMA/rigides personnalisés dépassent 300 faces/mois et si le format développé tient réellement dans 305 × 210 mm.
4. **CO2** si la découpe bois/PMMA dépasse 300/mois et qu'un atelier conforme est disponible.
5. **MO/UJF de production en dernier**, au-delà de 500–800 faces/mois ou si Tapote ouvre une activité d'impression B2B.

Il ne faut pas acheter deux machines la même année avant que la première cellule atteigne :

- taux de service ≥ 95 % ;
- rebut ≤ 3 % ;
- marge réelle conforme pendant trois mois ;
- au moins un opérateur de secours formé ;
- maintenance et traçabilité documentées.

### 22.1 Décision irrévocable avant bon de commande

Pour toute machine supérieure à 2 500 € :

- démonstration avec **les vrais blanks Tapote** ;
- 25 pièces bonnes consécutives ;
- NFC mesuré avant/après ;
- devis installation, formation, extraction et reprise ;
- contrat de maintenance et délai d'intervention ;
- preuve CE, manuel, fiche de données de sécurité et exigences du local ;
- simulation 12 mois avec scénario de volume -30 % ;
- solution de sous-traitance de secours conservée.

Si le vendeur refuse le test avec le blank réel, la machine est éliminée.

## 23. Conclusion industrielle

L'avantage Tapote ne viendra pas d'une rangée de machines. Il viendra d'une spécification plus précise, de meilleurs objets, d'une personnalisation guidée et d'un contrôle réel.

La trajectoire solide est :

1. **acheter le savoir avant d'acheter l'outil** ;
2. sous-traiter en détaillant chaque opération ;
3. consolider les volumes par procédé ;
4. internaliser une seule contrainte prouvée ;
5. garder un second fournisseur qualifié même après internalisation.

Aujourd'hui, la meilleure décision financière et produit est donc **Plan A : sous-traitance qualifiée + cellule QA/encodage interne**. Le premier achat de production probable, si les volumes le justifient, sera une imprimante cartes retransfert ou directe après test. L'UV, le laser fibre et le CO2 restent des options de Plan B déclenchées par des seuils mesurés, pas des achats de panique.
