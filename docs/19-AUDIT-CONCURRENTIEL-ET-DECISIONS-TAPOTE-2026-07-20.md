# Tapote — audit concurrentiel et décisions de positionnement

Document interne — 20 juillet 2026

## Décision exécutive

Tapote ne doit être ni « la plaque Avis Google de plus », ni le produit NFC le moins cher d’Amazon. La position retenue est :

> **Le support NFC + QR professionnel qui arrive prêt, peut être entièrement à votre image et continue d’ouvrir le bon lien même lorsque votre besoin change.**

Le marché confirme qu’un prix public de 29 € pour un support prêt à l’emploi et 39 € pour un support personnalisé est vendable. Il ne confirme pas encore que ces prix sont rentables avec le prototype actuel : la production doit atteindre le coût cible défini dans le cahier produit.

## Offre publique retenue

| Produit | Prêt à l’emploi | À votre image |
| --- | ---: | ---: |
| Carte NFC + QR | 19 € | 29 € |
| Chevalet A6 NFC + QR | 29 € | 39 € |
| Plaque 12 × 12 NFC + QR | 29 € | 39 € |
| 2 plaques/chevalets au choix | 55 € | 69 € |
| 5 plaques/chevalets au choix | 89 € | 109 € |
| 10 supports et plus | Sur devis | Sur devis |

- Port : 4,90 € sous 69 €, offert à partir de 69 €.
- Carte assortie à une plaque ou un chevalet : 19 €.
- Prêt à l’emploi : modèle Tapote, action et lien choisis par le client.
- À votre image : logo, couleurs, message, BAT et une petite correction.
- NFC et QR : même lien court Tapote, unique par support.
- Changement manuel de destination : gratuit, illimité et inclus à vie.
- Pilot avancé : tarif cible de 9 €/mois ou 89 €/an, optionnel ; activation accompagnée pendant la bêta.

## Validation des prix par le marché

Prix vus directement sur les sites le 20 juillet 2026. Les prix HT sont indiqués comme tels. Les volumes de clients et résultats cités par les marques ne sont pas considérés comme vérifiés.

| Acteur | Prix d’appel observé | Pack ou personnalisé | Lecture pour Tapote |
| --- | ---: | ---: | --- |
| IziKard | plaque générique 30 € TTC | plaque logo autour de 42 € TTC | Tapote 29/39 est légèrement plus agressif et plus clair |
| Livid | 29,90 € | 2 à 54,90 € ; 5 à 89,90 € | valide presque exactement 29/55/89 |
| Swiipx | 39,90 € | 2 à 59,90 € ; 5 à 89,90 € | Tapote prêt est moins cher ; personnalisé comparable à l’unité |
| Viewup | plaque 24,99 € ; carte 14,99 € | plaque multi-liens 34,99 € | concurrent le plus agressif avec application ; Tapote doit justifier l’écart par le design et l’universalité |
| Plakode | plaque 24 € | 3 à 66 € ; 5 à 105 € ; 10 à 190 € | Tapote est plus fort en pack 5 prêt, mais pas au prix unitaire |
| MediaPush | 20 € HT | personnalisé 40 € HT ; pack 3 à 55 € HT | Tapote est compétitif TTC et plus simple à comparer |
| Avistag | 49 € HT | 4 à 98 € HT ; 10 à 196 € HT | Tapote personnalisé est nettement moins cher |
| Unisign | 18,90 € TTC en 10 × 10 | fortes remises jusqu’à 200 unités | prix bas, mais QR statique et pas de plateforme propriétaire |
| Otypo | 13,20 € TTC | QR personnalisé et remises volume | ne pas combattre un imprimeur QR sur son seul prix |
| Digifeel | 29,90 € HT | 2 à 54,90 € HT ; 5 à 89,90 € HT | plateforme forte mais prix réel supérieur en TTC et storefront lourd |
| Qoov | 29,90 €, fiscalité non affichée | 2 à 54,90 € ; 5 à 99,90 € | offre simple, mais commande observée comme cassée |
| Phanion | 34,90 € TTC | LED à 44,90 € | design produit fort, mais review gating et pas de dashboard public |
| Agorank | renvoi principalement vers Amazon | prix marketplace variable | utile comme canal, faible comme expérience de marque |

### Verdict prix

La grille est **cohérente commercialement comme grille bêta** : elle se situe dans le cœur du marché sans brader le personnalisé. Elle n’est pas encore validée définitivement par des commandes et coûts réels.

Avec TVA à 20 %, port actuel et objectif de marge contributive de 55 %, le coût variable maximal — fabrication, assemblage, emballage, paiement et expédition — est :

| Offre | Total payé | Coût variable maximal |
| --- | ---: | ---: |
| Carte prête 19 € | 23,90 € | 8,96 € |
| Support prêt ou carte personnalisée 29 € | 33,90 € | 12,71 € |
| Support personnalisé 39 € | 43,90 € | 16,46 € |
| Duo prêt 55 € | 59,90 € | 22,46 € total |
| Duo personnalisé 69 € livré | 69 € | 25,88 € total |
| Pack 5 prêt 89 € livré | 89 € | 33,38 € total |
| Pack 5 personnalisé 109 € livré | 109 € | 40,88 € total |

La carte prête à 19 € et les packs de cinq sont les offres les plus sensibles. Le pack personnalisé de cinq impose un coût moyen inférieur à 8,18 € par support, expédition et paiement compris. Les compositions tout-chevalets et tout-plaques devront être calculées séparément avant validation définitive.

Le calcul du PDF qui concluait à environ 39 % de marge sur le support à 39 € était incohérent sur le traitement du port. Avec 39 € + 4,90 € de port et le coût variable PDF de 19,90 €, la contribution est d’environ 16,68 €, soit 45,6 % du revenu HT : sous la cible de 55 %, mais pas dans une zone d’arrêt automatique.

- aucune campagne payante importante avant une série pilote de 25 unités avec coût complet mesuré ;
- aucun délai, matériau ou niveau de résistance public tant qu’un fournisseur ne l’a pas confirmé ;
- validation finale après échantillons iPhone/Android et 10 à 20 commandes réellement payées.

Si la cible industrielle n’est pas atteinte, il faut modifier le produit ou le pack, pas revenir à une grille publique confuse. Les options sont : insert plus industrialisable, achat par lot, gabarits verrouillés, production groupée et composition de pack mieux margée.

## Parts de marché : ce que l’on peut et ne peut pas affirmer

Les parts de marché exactes ne sont pas accessibles avec les pages publiques. La plupart des concurrents sont privés ; leurs chiffres de ventes, retours, commandes Amazon, revenus SaaS et doublons clients ne sont pas publiés de manière homogène.

Les mentions « 500+ », « 1 000+ », « 3 000+ » ou « 100 000+ entreprises » observées sont des **affirmations marketing**, pas des parts de marché auditées. Elles peuvent servir de signaux à vérifier, jamais de base pour calculer une part.

Un classement directionnel peut seulement utiliser :

- volume et fraîcheur des avis externes vérifiables ;
- ancienneté et fréquence de contenu ;
- profondeur du catalogue et du logiciel ;
- trafic estimé par un outil tiers ;
- comptes publiés lorsque l’entreprise les dépose ;
- ventes et avis des références Amazon identifiables.

## Le meilleur de chaque concurrent retenu dans Tapote

### IziKard

- première vue centrée sur le produit, le prix et l’achat ;
- galerie, options, preuve et FAQ autour d’une vraie fiche produit ;
- séparation catalogue, catégories, produits et application.

Tapote le dépasse par une navigation plus courte, des prix TTC lisibles, trois formats seulement, un aperçu réel et la distinction claire entre gratuit et Pilot.

### Otypo

- configurateur visuel ;
- modèles de départ ;
- détails matière/format et logique de volume.

Tapote conserve un éditeur plus simple, ajoute NFC, lien dynamique, analytics et gestion multi-sites.

### Unisign

- panier très rassurant ;
- progression livraison offerte ;
- options de pose et récit atelier.

Tapote ajoute l’aperçu instantané et évite NFC Tools ainsi que le QR statique.

### Swiipx et Qoov

- packs très faciles à comprendre ;
- discours orienté résultat ;
- vidéos UGC courtes chez Swiipx.

Tapote ne reprend pas leurs promesses chiffrées non démontrées. La marque doit produire une vraie vidéo de 8 à 15 secondes et des cas clients réels avant d’afficher des résultats.

### Viewup et Digifeel

- activation, suivi des objets et application ;
- analyse et administration de plusieurs supports ;
- modèle gratuit + avancé.

Tapote se différencie par le lien universel, la personnalisation à l’unité et un Pilot accessible, au lieu de devenir une suite uniquement centrée sur Google Avis. Pendant la bêta, seules les statistiques par lieu, les périodes 7/30/90 jours, la part NFC/QR, l’historique et l’export CSV doivent être annoncés.

### Livid et Plakode

- gamme physique courte ;
- activation compréhensible ;
- prix de packs crédibles.

Tapote permet soit de donner le lien avant l’envoi, soit après, avec une modification autonome et gratuite plutôt qu’un formulaire de reprogrammation.

### Phanion

- présence premium sur le comptoir ;
- intérêt d’une gamme matière/design future.

Tapote ne doit jamais filtrer les clients selon leur note avant Google. L’accès à l’avis public reste identique pour tous ; un feedback privé peut seulement exister en parallèle.

## Architecture du site retenue

1. **Accueil** : produit et achat immédiatement, puis démonstration.
2. **Boutique** : trois formats, deux finitions, deux packs, filtres simples.
3. **Catégories** : chevalets, plaques, cartes et packs.
4. **Fiches produit** : prix exacts, galerie, personnalisation, quantité, lien, caractéristiques, contenu, usages, FAQ et produits associés.
5. **Créer mon Tapote** : configurateur visuel conservé et simplifié.
6. **Secteurs** : annuaire et 15 familles métier regroupées avec décor cohérent, scénario, action par défaut, usages secondaires et pack recommandé.
7. **Comment ça marche** : encodage, lien court, QR de secours, changement à distance et distinction Pilot.
8. **Panier** : suppression explicite, progression livraison, carte assortie et récapitulatif.
9. **Commande** : écran court, adresse déléguée à Stripe, lien facultatif et aide après achat.
10. **Devis** : formulaire réel pour 10+ supports et multi-sites.
11. **Pilot** : lien gratuit en premier, fonctions avancées en second.

## Différenciation à défendre partout

- Tout lien HTTPS : avis, menu, réservation, paiement, Wi-Fi, site, réseaux, formulaire ou multi-liens.
- NFC + QR reliés au même lien court.
- Lien modifiable gratuitement, même sans abonnement.
- Produit préconfiguré ou activation après réception.
- Prêt à l’emploi ou personnalisé dès une pièce.
- Mix plaques/chevalets dans les packs.
- Aperçu avant achat et BAT sur le personnalisé.
- Pilot à prix accessible pour les besoins avancés.
- Pas de review gating, pas de faux compteurs, pas de logos clients sans autorisation.

## Ce qui manque encore avant une vraie ouverture commerciale

### Produit

- valider matière, finition, fixation, emballage et rendu réel avec ADH&Sign et deux autres fournisseurs ;
- tester NFC et QR sur iPhone/Android, métal, reflets, nettoyage et transport ;
- obtenir le coût complet de 10, 25, 50 et 100 unités ;
- figer un délai réaliste avant de l’afficher.

### Preuve

- équiper 10 commerces pilotes ;
- filmer trois usages réels : comptoir, salle d’attente et terrain ;
- obtenir des avis avec identité et autorisation ;
- produire deux cas avant/après documentés, sans promettre un résultat garanti.

### Opérations

- renseigner les mentions légales, la TVA, les CGV et l’adresse réelle ;
- brancher le SMTP, fermer les inscriptions publiques Supabase et tester les invitations ;
- surveiller `t.tapote.fr`, sauvegarder la base et définir une procédure d’incident ;
- automatiser ou formaliser l’encaissement de Pilot avant de vendre l’abonnement en libre-service.

## Plan pour battre Amazon sans entrer dans une guerre de prix

Amazon vend la commodité et le prix. Tapote doit vendre le résultat opérationnel complet :

- sur Tapote.fr : personnalisation, BAT, lien dynamique, support humain, packs mixtes et Pilot ;
- plus tard sur Amazon : uniquement la gamme prête à l’emploi, avec activation simple et emballage très clair ;
- dans le colis : guide court vers l’activation et l’espace Tapote, sans contourner les règles de la marketplace ;
- prix Amazon cohérent avec le site, sans y exposer le service personnalisé complexe ;
- garantie centrée sur le fonctionnement NFC/QR, jamais sur un nombre d’avis.

## Acquisition prioritaire

1. Salons de coiffure, boulangeries, auto-écoles, hôtels/gîtes, boutiques et cabinets : pages, démonstrations et scripts adaptés.
2. Vente locale directe : un échantillon réel, démonstration en 20 secondes, QR vers la fiche secteur.
3. Partenaires : imprimeurs, agences locales, consultants Google Business Profile et réseaux de commerçants.
4. SEO : une fiche produit propre par format et une page de fond par secteur, sans pages dupliquées.
5. Publicité : seulement après mesure du taux de conversion et du coût complet produit.
6. Preuve : vidéo réelle et avis vérifiables avant toute grosse promesse chiffrée.

## Sources principales auditées

- https://izikard.com/
- https://livid.fr/
- https://swiipx.fr/
- https://viewup.fr/
- https://mediapush.fr/
- https://plakode.fr/
- https://otypo.com/signaletique/sur-mesure/qr-code/avis-google/
- https://unisign.fr/products/support-menu-qr-code-nfc-personnalise-grave-10x10cm
- https://www.qoov.fr/plaque-avis-google
- https://digifeel.fr/products/plaque-google-avis
- https://phanion.fr/
- https://avistag.fr/
- https://agorank.com/
