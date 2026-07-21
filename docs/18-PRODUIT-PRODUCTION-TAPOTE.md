# Tapote — cahier produit et plan de production

Document interne — version du 20 juillet 2026

## Décision produit

Tapote commercialise trois formats, chacun en deux finitions simples :

| Format | Prêt à l’emploi | Personnalisé |
| --- | ---: | ---: |
| Carte NFC + QR | 19 € TTC | 29 € TTC |
| Chevalet A6 NFC + QR | 29 € TTC | 39 € TTC |
| Plaque NFC + QR | 29 € TTC | 39 € TTC |

- **Prêt à l’emploi** : le client choisit un modèle Tapote, une action et son lien. Pas de création graphique sur mesure ; le produit est néanmoins encodé et testé pour lui.
- **Personnalisé** : logo, couleurs et message du client, avec un BAT numérique et une correction légère inclus.

Les deux versions utilisent la même technologie et le même service gratuit de changement de lien. La différence de prix rémunère la préparation graphique, le BAT, la gestion des fichiers et la production à l’unité.

Le catalogue public doit les présenter comme deux choix achetables immédiatement, pas comme des essais en attente d’industrialisation. Les validations de fabrication, fournisseurs et coûts restent des sujets internes.

## Encodage durable et changement de lien

La puce NFC et le QR code ne pointent pas directement vers Google, un menu ou Instagram. Ils contiennent tous les deux une URL courte Tapote stable, par exemple `https://t.tapote.fr/a/AB12CD`. Le redirecteur Tapote envoie ensuite la personne vers la destination choisie par le client.

Cette architecture répond aux principaux cas après l’achat :

- si la destination change, Tapote modifie la redirection à distance ; le support ne doit être ni repris ni réimprimé ;
- si une plateforme ferme ou si un lien est erroné, une nouvelle destination peut être publiée immédiatement ;
- si le client arrête Pilot, la dernière destination reste active et il conserve les changements manuels gratuits ;
- si Tapote doit remplacer une carte ou un insert, le nouveau composant reprend le même support logique après contrôle du numéro de série.

Le lien court doit utiliser HTTPS, être unique par support, ne pas contenir de donnée personnelle et rester lisible sous forme de QR. Avant verrouillage de la puce, vérifier le numéro de série, le lien court, la destination et le QR. Ne verrouiller définitivement l’écriture NFC qu’après validation complète du processus de remplacement et de récupération.

## Architecture recommandée par format

### Chevalet A6 réutilisable

Architecture recommandée pour la première série commercialisable :

1. chevalet vertical A6 transparent réutilisable, en PETG ou PMMA, stable et nettoyable ;
2. insert premium imprimé, remplaçable, mat ou satiné pour limiter les reflets ;
3. carte NFC PVC positionnée derrière l’insert dans une zone repérée ;
4. QR code variable imprimé sur l’insert et relié au même lien court ;
5. repère visuel « Tapotez ici » placé exactement devant l’antenne.

Cette construction sépare le contenant durable, le visuel et la technologie. Une erreur d’impression ou une évolution de marque n’impose pas de jeter tout le chevalet. L’insert peut être imprimé sur papier couché épais protégé ou, de préférence, sur support synthétique résistant à l’humidité. Les bords, la tenue dans le chevalet et le rendu sous éclairage de commerce doivent être validés sur échantillon réel.

Points à figer après essais : épaisseur exacte du chevalet, grammage ou matière de l’insert, mode de maintien de la carte NFC, orientation de l’antenne, zone de tapotement et emballage anti-rayure.

### Plaque

Deux bases sont à chiffrer :

- PVC expansé ou compact de 2 mm, léger et économique ;
- PMMA de 3 mm, plus premium, avec impression directe UV ou contre-collage protégé.

La puce NFC est posée au dos dans un logement adhésif propre ou une réserve prévue à cet effet. Elle ne doit jamais être placée directement contre une surface métallique sans ferrite adaptée. Le QR code fait partie du visuel imprimé et reste suffisamment contrasté. Prévoir coins arrondis, adhésif de pose adapté, gabarit de positionnement et protection de surface pendant le transport.

### Carte

Format CR80 standard de 85,60 × 53,98 mm, en PVC blanc avec puce NFC adaptée à une URL courte. Pour une finition constante, préférer l’impression industrielle directe ou retransfer à l’assemblage d’un papier photo collé. Le QR code, le numéro de série discret et le repère NFC sont imprimés sur la carte.

Une puce de capacité modeste suffit si elle stocke uniquement l’URL courte Tapote. Le choix final de la référence doit toutefois être confirmé sur iPhone et Android avant la commande de série. Pour les cartes destinées à rester près de métal, chiffrer séparément une version anti-métal ; ne pas la généraliser si elle dégrade le coût et l’épaisseur.

## Flux de production

1. La commande crée un numéro de support et réserve une URL courte.
2. Le client choisit l’action, renseigne sa destination et, en version personnalisée, dépose son logo et ses couleurs.
3. Tapote prépare le fichier d’impression depuis un gabarit verrouillé.
4. Pour le personnalisé, un BAT numérique est envoyé ; une correction légère est incluse. Une refonte ou de nouvelles demandes après validation sont facturables.
5. Le visuel validé part en impression par lot.
6. La puce NFC est encodée avec l’URL courte, puis rapprochée de son QR et de son numéro de série.
7. Le support est assemblé, nettoyé, testé NFC + QR et emballé.
8. Un dernier contrôle compare la destination affichée dans Pilot, la fiche de production et le produit physique.

Le suivi interne doit permettre de retrouver, pour chaque numéro de série : commande, client, type de support, fichier imprimé, identifiant du lien court, identifiant de puce si disponible, résultat du contrôle et date d’expédition.

## Demande de devis fournisseur

ADH&Sign à Colombes est un candidat pertinent à interroger pour le PVC, le PMMA, l’impression, la découpe, les adhésifs et le BAT. Il ne faut pas supposer qu’ils maîtrisent l’intégration NFC ou l’encodage variable : le devis doit distinguer clairement ce qu’ils fabriquent de ce que Tapote assemble et contrôle.

Demander un chiffrage comparable à ADH&Sign et à au moins deux autres fournisseurs pour **10, 25, 50 et 100 unités** de chaque référence.

| Élément à chiffrer | 10 | 25 | 50 | 100 |
| --- | ---: | ---: | ---: | ---: |
| Chevalet A6 transparent seul |  |  |  |  |
| Insert A6 prêt à l’emploi, données variables |  |  |  |  |
| Insert A6 personnalisé, données variables |  |  |  |  |
| Plaque PVC 2 mm imprimée et découpée |  |  |  |  |
| Plaque PMMA 3 mm imprimée et découpée |  |  |  |  |
| Carte PVC NFC imprimée, QR variable |  |  |  |  |
| Pose de puce ou assemblage, si proposé |  |  |  |  |
| BAT, calage, emballage et transport |  |  |  |  |

Le brief doit préciser : dimensions finies, tolérances, coins arrondis, matière et épaisseur, impression recto/verso, profil colorimétrique, finition mate ou satinée, résistance au nettoyage, impression variable des QR et numéros, adhésif éventuel, emballage individuel et délai normal/urgent.

Exiger avant série : un échantillon matière, un exemplaire imprimé, un BAT dimensionnel et le prix des retirages. Ne revendiquer aucune origine de fabrication, certification ou résistance particulière sur le site tant que le fournisseur ne l’a pas confirmée par écrit.

## Protocole de validation

Chaque combinaison matière + impression + puce doit passer les contrôles suivants :

- lecture NFC sur plusieurs iPhone récents et plus anciens, avec indication de la bonne zone de lecture ;
- lecture NFC sur plusieurs Android, au minimum Samsung et Google Pixel, écran verrouillé puis déverrouillé selon les comportements natifs ;
- scan du QR à environ 30, 50 et 80 cm, en lumière naturelle, sous éclairage chaud de commerce et avec reflets ;
- vérification que NFC et QR ouvrent exactement le même lien court et la bonne destination ;
- 500 cycles de tapotement/manipulation sur le chevalet et la carte sans déplacement de la puce ni dégradation fonctionnelle ;
- nettoyage répété avec le produit recommandé au client, sans bavure, décollement ni opacification notable ;
- essais de rayure, chute de hauteur de comptoir et frottement dans l’emballage ;
- exposition raisonnable à la chaleur et au soleil derrière une vitre, avec contrôle de la déformation, des couleurs et de l’adhésif ;
- test sur comptoir métallique et non métallique pour identifier les besoins éventuels de ferrite ;
- contrôle final de dix unités consécutives avant autorisation du premier lot.

Écrire une fiche de contrôle courte par format. Aucun support ne quitte l’atelier sans un test réel NFC, un scan QR et une vérification de sa destination.

## Économie unitaire à atteindre

Pour vendre un support personnalisé 39 € TTC avec une marge saine, la cible est de ramener **support physique + impression + puce + assemblage + emballage à 8–10 € maximum par unité**, hors expédition, frais de paiement et acquisition client.

L’étude de marché actuelle estime encore environ **19,90 € de coût variable** pour un chevalet. À ce niveau, le prix de 39 € laisse trop peu de marge pour absorber service client, erreur, remplacement, marketing et temps de création. Le tarif peut rester l’objectif commercial, mais la production doit être simplifiée avant volume.

Leviers prioritaires :

- acheter chevalets, cartes NFC et emballages par lots plutôt qu’à l’unité ;
- conserver une seule architecture NFC et un nombre réduit de matières ;
- utiliser des gabarits de création verrouillés pour réduire le temps graphique ;
- grouper les impressions et séparer les données variables du travail de mise en page ;
- faire payer le port sur une unité et utiliser les packs pour amortir préparation et transport ;
- privilégier un emballage plat, léger et anti-rayure ;
- encoder et contrôler par série avec scan du numéro plutôt qu’avec ressaisie manuelle ;
- suivre séparément coût matière, temps humain, rebut, remplacement, paiement et expédition.

La décision industrielle se prend sur le coût complet observé après une série pilote interne de 25 unités, pas uniquement sur le prix d’impression annoncé.

## Présentation publique prête à vendre

Le site doit montrer des produits finis, des dimensions claires, le contenu de la boîte, le délai, les deux finitions, le prix TTC, l’ajout au panier, la personnalisation et les garanties près du bouton d’achat. La fabrication n’est pas racontée comme une expérimentation.

Formulation commune recommandée : **« À votre image. Vers le lien de votre choix. Modifiable à vie. »**

Preuves simples à afficher :

- NFC + QR configurés et testés avant l’envoi ;
- choix prêt à l’emploi ou personnalisé ;
- BAT inclus sur la version personnalisée ;
- changement de lien gratuit et illimité ;
- fonctionnement sans application pour le visiteur ;
- aide Tapote en cas de problème de destination.

Ne pas promettre « incassable », « tous téléphones », « fabriqué en France », un délai garanti ou une résistance extérieure tant que les essais et engagements fournisseur correspondants ne sont pas documentés.
