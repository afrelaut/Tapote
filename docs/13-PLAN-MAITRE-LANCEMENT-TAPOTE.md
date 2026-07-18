# Plan maître de lancement Tapote

Date : 17 juillet 2026 — tarifs alignés sur le catalogue en production

## 1. Décision de positionnement

Tapote ne doit pas être vendu comme une collection de gadgets NFC. La promesse est : **un objet physique premium, placé au bon moment, qui ouvre la bonne action sans application**.

Le produit d'entrée est le **Comptoir A6 à 49 € TTC**. Les packs servent à augmenter la couverture d'un commerce. Les produits à l'unité sont des compléments. Tapote Pilot apporte la destination dynamique et les mesures. Tapote Gestion reste l'outil interne de production, d'encodage, de contrôle et d'expédition.

### Ce que l'audit ChatGPT a correctement identifié

- La page mobile mesurait environ 18 350 px et demandait trop d'effort de lecture.
- Le visiteur rencontrait trop de recommandations et d'offres concurrentes avant de comprendre quoi acheter.
- Les offres principales, les packs et les produits à l'unité se disputaient le rôle d'entrée de gamme.
- Le configurateur exposait trop de décisions avant l'ajout au panier.
- Les microtextes de 7 à 10 px étaient trop petits pour un usage mobile confortable.
- Le JSON-LD devait être réaligné avec le catalogue et le statut de pré-lancement.

### Ce qui devait être nuancé

- Tapote possède déjà six chevalets A6 physiques : il est légitime de parler de « série pilote reçue ».
- Il est trop tôt pour parler de produit industrialisé, de portée garantie ou de lot définitivement validé tant que les tests NFC, rayures, transport et usage terrain ne sont pas documentés.
- Un carrousel peut convenir aux scènes d'usage, mais pas à une comparaison de prix et de contenu. Les offres doivent rester comparables verticalement ou dans un tableau.

## 2. Architecture finale du site

Objectif mobile : moins de 11 500 px avant ouverture des détails, corps de texte à 15–17 px et texte fonctionnel à 12 px minimum.

1. Hero : Comptoir A6, prix 49 €, promesse, CTA « Créer mon Tapote ».
2. Démonstration de huit secondes : téléphone, NFC, QR et page ouverte.
3. Trois choix : Comptoir A6, Pack Commerce, Pack Restaurant.
4. Preuve produit : matière, taille réelle, série pilote reçue, contrôle NFC + QR et BAT.
5. Configurateur en trois étapes : usage, action/lien, identité. Les réglages graphiques avancés restent optionnels.
6. « Voir toutes les offres » : Essentiel, Salon, Équipe, Visibilité, multisite.
7. Produits à l'unité : compléments, derrière une section dépliable.
8. Production et livraison : BAT, assemblage, contrôle et expédition.
9. Pilot : changer la destination après l'achat, suivre les interactions, gérer plusieurs objets.
10. Devis réseau, FAQ et CTA final.

La direction visuelle reste : photographie de commerces réels, objet physique crédible, typographie Archivo forte, crème/noir et un bleu Tapote unique.

## 3. Plan NFC et encodage

### Choix de puce

Pour le lancement, la meilleure base n'est pas la puce avec le plus de mémoire mais la plus grande antenne compatible avec le support :

| Usage | Recommandation | Pourquoi |
| --- | --- | --- |
| A6, plaque PMMA, papier | NXP NTAG213, inlay rond 38 mm, antenne proche de 35 mm | Compatibilité iPhone/Android, prix bas, antenne assez grande, 144 octets suffisants pour une URL courte |
| Vitrine ou proximité de métal | NTAG213 38 mm anti-métal avec ferrite | Évite l'effondrement du champ RF près des montants ou surfaces métalliques |
| Carte PVC | Carte PVC 85,6 × 54 mm intégrant un NTAG213 | Antenne plus grande et protégée, produit fini plus fiable qu'un sticker ajouté à la main |
| Futur produit anti-copie | NTAG 424 DNA | À réserver aux cas nécessitant authentification/anti-clonage ; plus cher et sans gain automatique de portée |

Le NTAG215/216 apporte surtout plus de mémoire, pas une meilleure portée. La portée dépend principalement de la taille et de la qualité de l'antenne, de son orientation, des matériaux et du téléphone.

### Fournisseurs à tester

| Fournisseur | Échantillon conseillé | Indication publique observée le 16/07/2026 | Décision |
| --- | --- | --- | --- |
| [Shop NFC](https://shopnfc.com/fr/etiquettes-nfc-anti-metal/537-nfc-anti-metal-ntag213-ronds-adhesifs-38mm.html) | 10 NTAG213 Bullseye 38 mm anti-métal | 0,99 € pièce, remises volume, antenne 35 mm | Test métal/vitrine et référence de secours |
| [Tag&Play](https://shop.tagandplay.com/tag-38-mm-blanc.html) | Échantillons NTAG213 38 mm standard | 0,42 € affiché, puis 0,38 € à 500 ; encodage variable disponible | Candidat série France pour A6/plaque |
| [RFID Nation](https://rfidnation.com/nfc-labels-inlays/69-nfc-tag-ntag213-round-38-mm.html) | 10 NTAG213 38 mm | 0,75 € HT, 0,52 € à 100 | Fournisseur B européen |

Ne pas acheter 500 unités avant un comparatif réel de 10 tags par fournisseur.

### Architecture d'encodage

La puce contient une seule URL NDEF courte :

`https://t.tapote.fr/a/XXXXXXXXXX?s=nfc`

Le QR contient la même route avec `?s=qr`. Le serveur Tapote redirige ensuite vers Google, un menu, une réservation, Instagram, un paiement ou une page multi-liens. Pilot modifie la destination côté serveur sans toucher à la puce.

### Processus économique

1. Tapote Gestion crée le produit, le numéro de série et l'URL courte.
2. Pour les 50 premières unités, encoder avec un téléphone Android et une application NDEF fiable comme NFC Tools.
3. Relire immédiatement la puce avec un second téléphone.
4. Vérifier la redirection, puis poser la puce dans le support final.
5. Tester NFC et QR sur au moins un iPhone et un Android.
6. Passer l'unité aux statuts `Encodée`, `Testée`, puis `Verrouillée` seulement après contrôle.
7. À partir de 100 unités/mois, utiliser un lecteur USB PC/SC de type ACS ACR1252U/ACR122U et un outil d'encodage par lot relié à Tapote Gestion.

Le verrouillage définitif de la mémoire n'est pas obligatoire au début. L'URL courte limite déjà le risque d'erreur et permet de remplacer la destination dans Pilot.

## 4. Plan produits, supports et matières

### Gamme de lancement

| Produit | Spécification de départ | Test obligatoire |
| --- | --- | --- |
| Comptoir A6 | Porte-visuel PMMA transparent vertical, insert 105 × 148 mm, tag NTAG213 38 mm caché derrière l'impression | stabilité, rayures, lecture avec coque, chute de 70 cm, transport |
| Plaque 12 × 12 | PMMA 3 mm imprimé ou contrecollé, coins doux, adhésif 3M ou petit socle | collage 72 h, nettoyage, UV intérieur, lecture sur mur réel |
| Carte | PVC 0,76 mm, 85,6 × 54 mm, NTAG213 intégré, finition mate | flexion, portefeuille, lecture iPhone/Android, abrasion |
| Vitrine | Vinyle 90 × 90 mm lisible de l'extérieur, QR contrasté, tag placé côté intérieur | lecture à travers le verre, soleil, nettoyage, montant métallique |
| Pack Restaurant | A6 identiques avec numéros ou destinations distincts | cohérence série, contrôle unitaire, inventaire des numéros |

Pour le prototype A6, [RETIF](https://www.retif.eu/c-5089-porte-affiche-a-poser/) constitue une bonne source de comparaison rapide. Pour la série, demander des échantillons et devis directs à deux fabricants de PMMA avec : épaisseur, tolérance, traitement anti-UV, rayon des angles, protection pelable, emballage unitaire et délai.

### Matériaux cibles

- PMMA coulé transparent plutôt qu'un plastique mince et cassant pour les produits premium.
- Insert papier 250–350 g mat ou satiné, avec noir profond et protection contre les traces.
- Vinyle vitrine polymère laminé mat, colle adaptée au verre et retrait propre.
- Carte PVC mate ; éviter la carte métallique pour le lancement NFC.
- Adhésif 3M documenté pour les plaques, avec languette ou gabarit de pose.

## 5. Design, personnalisation et assemblage

### Niveaux de personnalisation

1. **Essentiel inclus** : logo, couleur principale, action, URL, nom du commerce.
2. **Signature inclus** : adaptation par un designer Tapote à partir d'un gabarit contrôlé.
3. **Sur mesure payant** : création complète, plusieurs zones, plusieurs langues ou réseau de points de vente.

### Flux atelier

1. Commande payée et données client validées.
2. Contrôle du logo et de l'URL.
3. Génération du BAT avec QR de production.
4. Validation écrite du BAT.
5. Réservation du support, de la puce, de l'impression et de l'emballage.
6. Impression et contrôle colorimétrique visuel.
7. Création du produit dans Gestion, numéro de série et URL courte.
8. Encodage, lecture croisée et collage selon gabarit.
9. Assemblage sans poussière, traces ou rayures.
10. Contrôle final NFC, QR, destination, identité, quantité et état physique.
11. Photo de preuve du colis avant fermeture.
12. Expédition et transmission automatique du suivi.

Une fiche suiveuse avec cases et signature de contrôle accompagne chaque commande.

## 6. Plan d'envoi colis

### Conditionnement par produit

**Comptoir A6**

- conserver ou remettre un film de protection sur le PMMA ;
- glisser le chevalet dans une pochette papier cristal ou mousse fine non abrasive ;
- immobiliser le pied avec une cale carton ;
- ajouter une fiche de pose/test et un chiffon microfibre si la marge le permet ;
- utiliser une boîte postale d'environ 220 × 160 × 50 mm, sans vide latéral ;
- réaliser un test de chute emballé sur six faces à 80 cm.

**Carte**

- étui papier rigide, puis enveloppe cartonnée avec suivi ;
- ne pas expédier seule dans une simple enveloppe papier.

**Plaque et Vitrine**

- papier de protection sur la face imprimée ;
- plaque prise entre deux cartons rigides ;
- adhésif et gabarit de pose dans une pochette séparée ;
- mention « ne pas plier » uniquement en complément d'une vraie rigidité.

**Packs**

- chaque unité porte son numéro de série ;
- séparation par intercalaires doux ;
- liste de colisage indiquant numéro, destination et emplacement prévu ;
- double cannelure si le poids ou le vide interne l'exige.

[RAJA](https://www.raja.fr/caisses-cartons-boites/caisses-documents/caisse-documents-a5-a6-a7_C115010.html) propose des boîtes et caisses adaptées aux formats A6/A5, à partir de 0,52 € HT selon le modèle et la quantité observés.

### Transport et tarification

Pour le lancement, utiliser Colissimo en ligne ou un agrégateur avec suivi. Les tarifs publics 2026 observés sont notamment de 5,49 € jusqu'à 250 g et 7,59 € jusqu'à 500 g à domicile ; le point retrait est légèrement moins cher. Un contrat entreprise devient pertinent lorsque le volume et le processus de collecte le justifient.

Au tarif actuel de 49 €, la boutique facture 4,90 € de livraison sous 59 €. Avec le coût variable complet estimé à 19,68 €, transport inclus, la marge contributive indicative est d’environ 56 % du revenu HT facturé. Offrir la livraison sur cette commande unitaire ferait tomber l’estimation autour de 52 %, sous la cible de 55 % : ne pas le faire sans réduire le coût rendu.

### Procédure d'expédition

1. Peser le colis fini, pas les composants séparés.
2. Comparer poids/format avec le barème avant impression de l'étiquette.
3. Scanner le numéro de série dans Gestion.
4. Photographier l'état et le contenu.
5. Fermer avec un témoin d'intégrité simple.
6. Enregistrer le numéro de suivi avant de passer la commande à `Expédiée`.
7. Envoyer le suivi et une page « installer mon Tapote ».
8. Sur incident, distinguer casse transport, erreur de destination et défaut NFC.
9. Prévoir une unité de remplacement et une procédure de réaffectation de l'URL.

### Passage à l'échelle

- 1–10 colis/mois : préparation manuelle, Colissimo en ligne, stock en bacs.
- 10–100 : imprimante thermique 10 × 15, balance connectée, ramasse ou dépôt quotidien, boîtes standardisées.
- 100–500 : intégration Sendcloud/Boxtal/Colissimo, picking par lots, emplacements codés, contrôle par scan.
- 500+ : étude d'un logisticien, mais garder l'encodage et le contrôle NFC dans un atelier maîtrisé tant que le taux de défaut n'est pas stabilisé.

## 7. Gestion logistique et fournisseurs

- Une fiche fournisseur par composant : prix, MOQ, délai, pays, incoterm, défauts, contact, dernier test.
- Deux fournisseurs qualifiés pour chaque composant bloquant : PMMA, NFC, impression et emballage.
- Stock minimum : ventes prévues pendant le délai fournisseur + marge de sécurité.
- Lots NFC tracés par fournisseur et date de réception.
- Contrôle entrant : 10 unités ou racine carrée du lot, au plus grand des deux.
- Quarantaine des lots présentant plus de 2 % d'échecs de lecture.
- Aucun changement de matière sans revalider NFC, collage, impression et transport.

## 8. Plan commercial

### ICP de départ

Commerces indépendants avec passage physique et action simple : boulangeries, cafés, restaurants, salons, instituts, cabinets et boutiques. Priorité aux établissements où le dirigeant est présent et peut décider rapidement.

### Offre de lancement

- Comptoir A6 : 49 € TTC, BAT et préparation inclus ; livraison 4,90 €.
- Installation commerce : Pack Commerce 149 € TTC.
- Installation restaurant : Pack Restaurant 199 € TTC.
- Série pilote : cinq commerces maximum, contre entretien de retour, photos et autorisation d'utiliser les résultats.

### Séquence terrain

1. Montrer un vrai chevalet, pas une présentation.
2. Demander quelle action est la plus difficile à obtenir aujourd'hui.
3. Faire tester NFC et QR sur le téléphone du prospect.
4. Créer un aperçu avec son nom en moins de deux minutes.
5. Proposer un seul produit correspondant au moment identifié.
6. Relancer avec le mockup, le prix total et une date de BAT.

Objectif de départ hebdomadaire : 30 commerces contactés, 10 démonstrations, 5 BAT, 2 ventes. Mesurer les raisons de refus avant d'élargir la gamme.

## 9. Plan marketing

- Contenu principal : vidéos courtes « geste → page ouverte » dans de vrais commerces.
- Preuve : photos des six chevalets, tests sur téléphones variés, emballage et premier déploiement.
- Série « le bon moment » : après paiement, avant de repartir, à table, devant la vitrine.
- Pages SEO par usage uniquement après preuve : avis Google, menu NFC, réservation, vitrine, carte d'équipe.
- Référencement local et prospection fondateur avant publicité payante.
- Retargeting seulement après un volume suffisant de visiteurs et une page de vente stabilisée.
- Collecte systématique d'une photo, d'une citation et d'un résultat à J+7/J+30 avec consentement.

## 10. Plan partenaires

1. Imprimeurs et enseignistes : fabrication, pose vitrine et volumes.
2. Graphistes et agences locales : personnalisation, commission d'apport de 10–15 %.
3. Installateurs de caisse et prestataires web : accès aux commerçants au moment d'un changement d'outil.
4. Consultants restauration et réseaux professionnels : packs sectoriels.
5. Photographes de commerce : contenu de preuve et offre combinée.
6. Revendeurs : uniquement après stabilisation du produit, des délais, du SAV et de la marge.

Chaque partenariat commence par un test de cinq ventes et une convention simple : prospect attribué, commission, paiement, durée, usage de marque et responsabilité SAV.

## 11. Tapote Pilot

### MVP utile

- modifier la destination sans réencoder ;
- activer, suspendre ou remplacer un objet ;
- afficher les interactions NFC et QR par objet et lieu ;
- gérer plusieurs liens et établissements ;
- alerter lorsqu'un lien cible échoue ;
- exporter les données essentielles.

### À ne pas prioriser maintenant

- tableaux de bord décoratifs ;
- IA générique ;
- segmentation avancée sans volume ;
- automatisations marketing avant d'avoir des clients actifs.

Pilot doit être présenté après la preuve matérielle : l'objet fonctionne seul, Pilot évite de le réimprimer et donne du contrôle.

## 12. Tapote Gestion

Ajouter un onglet **Création & encodage** avec :

- commande et client associés ;
- support, puce et lot fournisseur ;
- numéro de série Tapote ;
- URL courte NFC et URL QR ;
- destination actuelle ;
- états `À créer`, `Encodée`, `Testée`, `Verrouillée`, `Affectée` ;
- contrôle iPhone, Android et QR ;
- responsable et horodatage ;
- impression d'une fiche suiveuse et remplacement d'une unité défectueuse.

La création du lien doit être atomique, journalisée et limitée aux rôles Gestion. Le secret Supabase ne doit jamais être exposé au navigateur.

## 13. Risques et éléments souvent oubliés

- CGV, mentions légales, politique de confidentialité et procédure de rétractation B2C/B2B.
- Assurance responsabilité civile professionnelle et procédure de rappel produit.
- Garantie, échange en cas de puce défectueuse et délai SAV.
- TVA, facturation, comptabilité analytique par produit et coût réel de la main-d'œuvre.
- RGPD pour les statistiques de clic et sous-traitants ; minimisation des données.
- Éco-contributions, emballages et obligations de tri à vérifier avec un conseil compétent.
- Dépôt de marque et disponibilité des noms de domaine.
- Sauvegardes Supabase, rotation des secrets, Sentry et plan de restauration.
- Accessibilité, performance web, tests de paiement et surveillance des liens courts.

## 14. Feuille de route 30/60/90 jours

### Jours 1 à 15

- tester trois références NFC 38 mm sur les six chevalets reçus ;
- finaliser le gabarit et le protocole de contrôle ;
- déployer cinq commerces pilotes ;
- simplifier le site et corriger les données structurées ;
- mettre en service Création & encodage dans Gestion ;
- mesurer coût et temps réel par unité.

### Jours 16 à 30

- sélectionner fournisseurs A/B ;
- consolider emballage et test de chute ;
- obtenir cinq retours terrain et deux preuves publiables ;
- ouvrir la vente du Comptoir A6 et des deux packs principaux ;
- stabiliser l'envoi et le SAV.

### Jours 31 à 60

- produire une première série de 50 unités ;
- activer Pilot pour les commerces pilotes ;
- connecter étiquettes et suivi colis à Gestion ;
- lancer le programme partenaires local ;
- décider de la Carte et de la Vitrine sur la base des tests.

### Jours 61 à 90

- atteindre un flux reproductible de 25–50 commandes/mois ;
- qualifier un second fournisseur pour chaque composant critique ;
- automatiser l'encodage par lot si le volume le justifie ;
- publier études de cas et pages sectorielles ;
- décider si un logisticien ou un assembleur externe est pertinent.

## 15. Critères de feu vert avant vente large

- 9 lectures NFC réussies sur 10, sur au moins six modèles de téléphone, en moins de deux secondes.
- 100 % des QR lisibles aux distances prévues.
- Moins de 2 % de défauts à réception et après assemblage.
- Aucun chevalet cassé ou fortement rayé après le test d'expédition.
- Coût variable complet documenté et marge brute cible atteinte.
- Lien court modifiable, journalisé et surveillé.
- BAT, encodage, contrôle, colis et suivi tracés dans Gestion.
- CGV, paiement, e-mails et procédure SAV validés avant ouverture publique.
