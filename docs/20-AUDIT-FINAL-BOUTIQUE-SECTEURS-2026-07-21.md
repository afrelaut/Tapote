# Audit final — boutique, produits et secteurs Tapote

Date : 21 juillet 2026  
Périmètre : nouvelle boutique V3, accueil, fiches produit, personnalisation, annuaire de secteurs, scènes d’usage, front, back, offre, marketing et préparation commerciale.

## Verdict

- **Qualité du site pour une bêta accompagnée : 8,9/10 — GO.**
- **Préparation à une ouverture publique sans surveillance : 7,2/10 — NO-GO temporaire.**

La boutique est désormais au niveau d’un vrai parcours e-commerce : achat dès l’accueil, trois formats physiques immédiatement reconnaissables, personnalisation progressive, prix lisibles, pages produit, 15 familles de secteurs et démonstration synchronisée support + design + téléphone.

Le frein principal n’est plus l’interface. Il reste à remplacer ou compléter les mockups réalistes par des photos des unités finales produites, confirmer la matière et les coûts avec l’imprimeur, publier des preuves clients autorisées et configurer l’environnement de production.

## Notes par domaine

| Domaine | Note | Verdict |
| --- | ---: | --- |
| Direction artistique | 9,2 | Identité Tapote cohérente, premium et plus distinctive que les catalogues NFC génériques. |
| Réalisme et cohérence produit | 8,8 | Chevalet vertical, plaque PMMA à plat et carte CR80 sont clairement différenciés ; les scènes et écrans sont cohérents. Les images restent des mockups tant que les produits finis n’ont pas été photographiés. |
| UX e-commerce | 9,0 | Produit et achat immédiatement accessibles, offre prête/personnalisée progressive, unité + packs, réassurance et panier clairs. |
| Personnalisation | 9,2 | Logo, nom, deux couleurs, extraction automatique de palette, pipette, lisibilité automatique et BAT. L’interface reste la même entre standard et personnalisé. |
| Architecture secteurs | 9,3 | 15 regroupements compréhensibles, un décor par famille, meilleur usage par défaut, usages secondaires et trois supports interchangeables. |
| Frontend | 9,1 | Responsive, aucune erreur navigateur, aucun débordement, médias chargés, composants dynamiques et build propre. |
| Accessibilité | 9,4 | 0 violation Axe WCAG A/AA sur les sept vues auditées après correction des contrastes. Un audit clavier humain reste recommandé. |
| Backend et données | 8,1 | Validations et tests solides, couleurs conservées dans la commande, sécurité applicative déjà structurée. La configuration production et le test Stripe/Supabase réel restent à faire. |
| Offre et pricing | 8,4 | Grille 19/29/39 €, duo et pack 5 dans le cœur du marché, plus simple que beaucoup de concurrents. Rentabilité à confirmer avec le coût complet ADH&Sign. |
| Marketing | 7,0 | Positionnement et cas d’usage forts ; manque encore vidéos humaines réelles, avis vérifiables, cas clients et instrumentation du tunnel. |
| Commercial | 7,7 | Démonstration locale très vendable et pages métier utiles ; scripts, preuves, délais, garanties et cadence pilote doivent être validés sur le terrain. |
| Production et opérations | 6,4 | Cahier produit crédible mais matériau, finition, encodage, nettoyage, emballage, délai et coût doivent être mesurés sur une série réelle. |

## Position face aux concurrents

### IziKard

Tapote atteint maintenant le même principe fort — produit, prix et achat immédiatement visibles — avec une personnalisation plus fluide, trois formats mieux distingués et une démonstration secteur/action plus riche. IziKard garde l’avantage des références physiques et de la preuve commerciale déjà installée.

### Viewup et Digifeel

Tapote est plus lisible, plus design et moins enfermé dans le seul avis Google. Viewup/Digifeel restent devant sur la maturité perçue de l’application et les preuves d’usage logiciel. Pilot devra prouver sa valeur avec des données réelles.

### Swiipx

Tapote dispose d’une architecture produit et métier plus complète. Swiipx garde un avantage de vente directe grâce aux vidéos humaines, aux témoignages et à une promesse très simple. La priorité Tapote est donc la preuve réelle, pas l’ajout de nouvelles fonctionnalités.

### Unisign et imprimeurs QR/NFC

Tapote est devant sur le lien dynamique, le BAT, le système de marque et les scénarios métier. Les imprimeurs gardent l’avantage de la preuve matière, des photos de fabrication et des tarifs volume. La rencontre ADH&Sign doit fermer cet écart.

### Amazon et plaques génériques

Tapote ne doit pas chercher à être le moins cher. Son avantage est la solution complète : choix du bon usage, design, double accès NFC + QR, BAT, lien modifiable, support et packs cohérents.

## Décisions produit retenues

1. **Chevalet** : A6 vertical, visible à distance, pour accueil, caisse et table.
2. **Plaque** : environ 12 × 12 cm, PMMA de qualité, toujours complètement posée à plat.
3. **Carte** : 85 × 54 mm, tenue ou transmise en mobilité.
4. **Prêt à l’emploi** : designs Tapote verrouillés et professionnels pour avis, menu, réservation, Instagram, Facebook, LinkedIn, Wi-Fi, contact, WhatsApp et multi-liens.
5. **À votre image** : même interface, puis nom, logo, palette, style et brief ; BAT obligatoire avant fabrication.
6. **Secteurs** : le décor ne change qu’avec le secteur ; le support change avec le format ; le design imprimé et l’écran changent avec l’usage.
7. **Auto-écoles** : famille dédiée, réservation par défaut, avis et formulaire en usages secondaires, duo recommandé sans bloquer l’achat à l’unité.

## Validation automatisée finale

- `npm run ci` : lint OK, 61 tests OK, build production OK, 0 vulnérabilité connue.
- Playwright Chrome réel : sept vues contrôlées, dont desktop, mobile, restaurant, auto-école et fiche plaque.
- 0 erreur console ou erreur de page.
- 0 image cassée après chargement réel du scroll.
- 0 débordement horizontal.
- 0 violation Axe WCAG A/AA sur les vues auditées.
- 12 assertions métier passées : achat direct, vraie image produit, 15 secteurs, synchronisation support/action/écran, couleurs personnalisées et parcours Auto-écoles.

Rapport automatisé : `output/playwright/v3-final/report.json`.

## Bloqueurs avant ouverture publique

1. Faire produire un chevalet, une plaque et une carte définitifs, puis les photographier dans les trois gabarits de scène validés. Les mockups actuels sont suffisamment bons pour prototyper et vendre en rendez-vous, mais ne doivent pas être présentés comme des photographies d’unités déjà produites.
2. Valider avec ADH&Sign : PMMA, impression, épaisseur, bords, insert chevalet, carte, NFC, QR, nettoyage, rayures, assemblage, emballage et coûts par volume.
3. Tester NFC + QR sur iPhone et Android, sur chaque support, puis conserver une fiche de contrôle par unité.
4. Équiper 10 clients pilotes, filmer trois démonstrations humaines réelles et recueillir au moins deux cas clients publiables.
5. Configurer les mentions légales, Stripe, Supabase, email, Sentry, sauvegardes et domaine public ; exécuter un paiement complet jusqu’au webhook et à l’email.
6. Installer les événements `view_product`, `start_configurator`, `add_to_cart`, `begin_checkout`, `purchase` et `lead_submit` avec conservation des UTM.

## Priorité immédiate

Ne plus élargir le catalogue avant le rendez-vous imprimeur. Utiliser les trois masters et les 15 scènes comme cahier visuel, obtenir les prototypes finaux, remplacer les images stratégiques par les vraies photos, puis lancer une bêta locale accompagnée.
