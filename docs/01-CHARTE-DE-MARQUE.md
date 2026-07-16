# Tapote — Direction artistique et charte de marque

Version 1.0 — 15 juillet 2026

## 1. Idée de marque

**Tapote rend l’action numérique aussi naturelle qu’un geste au comptoir.**

La marque doit faire cohabiter deux mondes : la chaleur du commerce local et la précision d’un outil numérique. Elle n’est ni une startup “tech froide”, ni un accessoire promotionnel bon marché. Son territoire est celui de l’objet utile, immédiatement compréhensible, bien présenté et servi humainement.

- Promesse : **Le bon lien, au bon moment.**
- Signature commerciale : **Un geste suffit.**
- Personnalité : directe, vive, honnête, tactile, française sans folklore.
- Ton : tutoiement professionnel, phrases courtes, verbes d’action, pas de superlatifs invérifiables.
- Mots à privilégier : poser, tapoter, comptoir, vrai client, prêt, geste, lien, revenir.
- Mots à éviter : révolutionnaire, magique, “5 étoiles garanties”, booster automatique, intelligence artificielle quand elle n’apporte rien.

## 2. Architecture de marque

Il faut distinguer deux identités :

1. **Tapote, la marque mère** : site, emballage, mode d’emploi, espace Pilot, communications commerciales.
2. **La marque du client, sur le chevalet** : le recto A6 reprend d’abord son logo, ses couleurs et son ton. Tapote ne signe qu’en très petit en bas.

Règle non négociable : sur un insert client, le logo du client est visuellement au moins **3 fois plus présent** que la signature Tapote. Le produit doit donner l’impression d’avoir été créé pour le commerce, pas d’être une publicité Tapote posée chez lui.

## 3. Logo

### Construction

Le symbole réunit :

- une étincelle, pour le passage à l’action ;
- une onde basse, pour le geste NFC ;
- un carré bleu arrondi, pour la fiabilité et la reconnaissance en petit format ;
- le mot-symbole `tapote.` en Archivo Black, avec un point final assumé.

### Fichiers

- `public/brand/tapote-logo.svg` : version principale sur fond clair.
- `public/brand/tapote-logo-light.svg` : version sur fond sombre.
- `public/brand/tapote-mark.svg` : symbole seul, favicon et avatar.

### Zone de protection

Conserver autour du logo une marge au moins égale à la moitié de la hauteur du symbole. Taille minimale recommandée : 96 px pour le logo complet à l’écran, 18 mm à l’impression ; 20 px pour le symbole seul.

### Interdits

- Ne pas étirer, incliner ou changer les proportions.
- Ne pas placer le logo sur une photo trop chargée sans zone calme.
- Ne pas recolorer l’étincelle en une autre couleur dans les usages Tapote.
- Ne pas remplacer `tapote.` par une police décorative.

## 4. Couleurs

| Rôle | Nom | Hex | Usage |
|---|---|---:|---|
| Primaire | Bleu geste | `#2458FF` | CTA, zone NFC, liens, marqueur d’action |
| Fond fort | Encre | `#141414` | Hero, textes, Pilot, emballage |
| Accent | Beurre | `#F7C85D` | Étincelle, preuve, contraste ponctuel |
| Fond | Papier | `#F4EFE5` | Pages de marque, packaging |
| Fond clair | Papier blanc | `#FFFDF8` | Lecture longue, formulaires |
| Texte secondaire | Gris pierre | `#6C6860` | Légendes et descriptions |

Le bleu est une action, pas un décor. Le jaune sert à attirer l’œil une seule fois par composition. Pour le site Tapote, ne pas ajouter de troisième couleur vive.

### Couleurs des clients

Les inserts ne sont pas limités à la palette Tapote. Trois directions de démonstration sont prévues :

- Encre + bleu : café, retail, services.
- Rose poudré + prune : beauté, bien-être, hôtellerie.
- Vert forêt + ambre : restauration, artisanat, premium.

Toujours vérifier un contraste lisible, notamment dans la zone où le téléphone est posé.

## 5. Typographie

- **Titres et promesses** : Archivo Black, interlettrage légèrement négatif.
- **Textes, interface et données** : Archivo, graisses 400 à 800.
- Maximum : deux familles typographiques.
- Titres : courts, 2 à 4 lignes, ponctuation simple.
- Corps web : 15 à 18 px selon le contexte ; interligne 1,55 à 1,7.

Les polices sont chargées depuis Google Fonts sur le prototype. En production, les auto-héberger améliore la confidentialité, la performance et la continuité visuelle.

## 6. Photographie

La photographie doit toujours prouver la réalité du produit :

- chevalet de table **A6 transparent en plexiglas**, format portrait ;
- insert papier plat de 105 × 148 mm ;
- bords transparents visibles autour du papier ;
- pied arrière plié en L clairement perceptible ;
- échelle crédible sur une table ou un comptoir ;
- logo et palette du commerce visibles ;
- contexte réel : café, caisse, table, accueil de salon, réception.

À bannir : coque plastique noire moulée, tablette, faux écran lumineux, objet 3D flottant, grosse marque Tapote sur le recto, décor cyberpunk.

Les trois images de lancement sont dans `public/assets/` :

- `tapote-hero-a6.webp` — café ;
- `tapote-restaurant-a6.webp` — restaurant ;
- `tapote-salon-a6.webp` — beauté ;
- `tapote-pack-a6.webp` — lot de six chevalets ;
- `tapote-card-nfc.webp` — carte NFC ;
- `tapote-sticker-nfc.webp` — sticker vitrine NFC + QR.

## 7. Système graphique de l’insert A6

Fichier de départ : `public/brand/a6-template-avis.svg`.

### Structure recommandée

- Zone 1 — 0 à 28 mm : logo et nom client.
- Zone 2 — 28 à 75 mm : promesse principale et sous-texte.
- Zone 3 — 80 à 127 mm : grand bloc d’action NFC.
- Zone 4 — 134 à 143 mm : QR de secours, mentions et signature Tapote.
- Fond perdu : 3 mm si l’impression le nécessite ; garder une marge de sécurité de 5 mm.

### Fabrication

- Papier mat 200 à 250 g/m², de préférence certifié FSC ou PEFC.
- Impression recto haute densité ; pelliculage mat uniquement si le support ou l’encre l’exige.
- La pastille NFC NTAG213 est collée derrière l’insert, centrée sous le pictogramme NFC.
- Encoder une URL Tapote courte avant assemblage, puis tester NFC et QR sur iPhone et Android.

## 8. Voix et exemples

### Bon

- “Votre avis compte.”
- “On se revoit quand ?”
- “La carte, juste ici.”
- “Posez votre téléphone ici.”
- “Pas d’application. Pas de réglage.”

### À corriger

- “Boostez instantanément vos avis 5 étoiles.” → promesse excessive et risque de non-conformité Google.
- “La technologie NFC révolutionnaire.” → langage générique et centré sur la technologie.
- “Transformez tous vos clients en ambassadeurs.” → trop absolu.

## 9. Motion

Le mouvement suit le geste : approche, contact, réponse.

- Entrée : 400 à 700 ms, translation courte et opacité.
- Zone NFC : pulsation lente, jamais un clignotement agressif.
- Si une vidéo fiable est produite plus tard : plans courts, geste NFC visible, mouvements lents et texte minimal.
- Toujours proposer une lecture muette ; sous-titres requis si une voix est ajoutée.

La première version ne charge aucune vidéo : elle privilégie une galerie WebP légère des quatre produits. Une vidéo ne devra être réintroduite qu’après validation d’un vrai plan de démonstration NFC sur mobile et d’un fallback accessible.

## 10. Contrôle avant publication

- [ ] Le chevalet ressemble au produit réellement expédié.
- [ ] Le logo du client domine le recto.
- [ ] Les couleurs passent un contrôle de contraste.
- [ ] Le message n’incite pas uniquement aux avis positifs.
- [ ] Le QR et le NFC pointent vers la même URL courte.
- [ ] Le logo Tapote est discret sur l’insert et fort sur le packaging.
- [ ] Les photos n’affichent aucun commerce réel sans autorisation.
