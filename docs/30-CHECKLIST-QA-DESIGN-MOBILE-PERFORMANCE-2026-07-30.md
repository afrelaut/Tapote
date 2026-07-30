# Checklist QA — design, mobile et performance

Date : 30 juillet 2026  
Périmètre : landing, Hero3D, header, boutique et fiches produit  
Script dédié : `scripts/audit-storefront-experience.mjs`

## Verdict attendu

Le storefront est prêt pour revue finale uniquement si :

- `npm run build` passe ;
- `npm test` passe ;
- `npm run test:e2e` passe ;
- `node scripts/audit-storefront-experience.mjs` termine avec `"ok": true` ;
- la planche `03-hero-loop-contact-sheet.png` montre bien, dans l’ordre de la boucle, les trois supports distincts : Comptoir, Plaque et Card ;
- les captures 360, 390 et 430 px ne montrent ni texte rogné, ni CTA hors écran, ni collision du header, ni débordement horizontal ;
- un essai réel iPhone Safari et Android Chrome confirme les gestes, le menu et l’ajout au panier.

## Ce que le nouvel audit contrôle

### Hero 3D

- contrat local de trois groupes distincts : Comptoir, Plaque, Card ;
- un seul état actif : Canvas WebGL ou image de repli ;
- Canvas unique quand WebGL est actif ;
- trois captures espacées de 3,6 secondes et planche comparative ;
- mouvement réellement visible entre les captures ;
- image de repli chargée si WebGL est indisponible ;
- image de repli chargée, stable et sans Canvas avec `prefers-reduced-motion: reduce` ;
- H1 et CTA toujours utilisables dans les deux modes de repli ;
- aucune erreur JavaScript, console ou requête réseau échouée.

La planche comparative reste un contrôle humain obligatoire : une variation de pixels prouve que la scène bouge, mais seule une lecture visuelle confirme que les trois objets sont immédiatement identifiables et correctement cadrés.

### Header

- quatre entrées de navigation distinctes sur desktop ;
- CTA « Créer mon Tapote », connexion et panier visibles ;
- bouton mobile d’au moins 44 × 44 px ;
- ouverture du menu, focus envoyé dans la navigation ;
- contenu de page rendu inerte pendant l’ouverture ;
- fermeture avec Échap, retour du focus sur le bouton ;
- aucun débordement horizontal.

### Landing mobile

Profils exécutés :

| Profil | Viewport | Contrôle principal |
| --- | ---: | --- |
| compact | 360 × 720 | plus petit écran courant |
| iPhone | 390 × 844 | référence fonctionnelle et performance |
| large | 430 × 932 | grand mobile |

Pour les trois profils :

- H1 unique, visible et entièrement dans le premier écran ;
- CTA Boutique entièrement dans le premier écran ;
- aucun débordement horizontal ;
- aucune image visible cassée ;
- cibles principales du header et du hero à 44 px minimum ;
- menu mobile entièrement fonctionnel.

### Boutique

- H1 unique ;
- trois destinations PDP distinctes ;
- passage « Prêt à servir » → « À votre image » ;
- passage « Les 3 produits » → « Packs par parcours » ;
- deux packs présents ;
- aucun débordement horizontal aux trois largeurs.

### Fiches produit

Le script répartit les trois produits sur les trois largeurs :

- 360 px : Tapote Comptoir, prêt à servir ;
- 390 px : Tapote Plaque, personnalisée ;
- 430 px : Tapote Card, personnalisée.

Pour chaque PDP :

- H1 unique ;
- un seul bouton « Ajouter au panier » ;
- bouton de 44 px minimum ;
- prix et « Tapote Link inclus » présents ;
- visuel produit présent ;
- ajout fonctionnel et compteur panier mis à jour ;
- aucun débordement horizontal.

## Commandes exactes

### 1. Boucle fonctionnelle rapide sur Vite

Terminal A :

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
npm run dev
```

Terminal B :

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
npm run build
npm test
npm run test:e2e
node scripts/audit-storefront-experience.mjs
```

Le script cible par défaut `http://127.0.0.1:5173`.

### 2. Boucle de validation production

Construire puis servir `dist` :

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
npm run build
$env:API_PORT = '3001'
npm start
```

Dans un second terminal, activer les budgets de performance :

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
$env:TAPOTE_AUDIT_URL = 'http://127.0.0.1:3001'
$env:TAPOTE_PERF_STRICT = '1'
node scripts/audit-storefront-experience.mjs
```

### 3. Validation WebGL stricte sur une machine avec GPU

Cette commande doit échouer si Chromium ne rend pas le Canvas et utilise seulement le fallback :

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
$env:TAPOTE_AUDIT_URL = 'http://127.0.0.1:3001'
$env:TAPOTE_PERF_STRICT = '1'
$env:TAPOTE_REQUIRE_WEBGL = '1'
node scripts/audit-storefront-experience.mjs
```

Nettoyage facultatif des variables :

```powershell
Remove-Item Env:TAPOTE_AUDIT_URL -ErrorAction SilentlyContinue
Remove-Item Env:TAPOTE_PERF_STRICT -ErrorAction SilentlyContinue
Remove-Item Env:TAPOTE_REQUIRE_WEBGL -ErrorAction SilentlyContinue
Remove-Item Env:API_PORT -ErrorAction SilentlyContinue
```

## Sorties à examiner

Tous les fichiers sont créés dans :

`output/playwright/storefront-experience/`

Priorité de revue :

1. `report.json` — vérité automatisée et métriques ;
2. `03-hero-loop-contact-sheet.png` — identification visuelle des trois supports ;
3. `07-home-mobile-360.png`, `07-home-mobile-390.png`, `07-home-mobile-430.png` ;
4. `08-boutique-mobile-360.png`, `08-boutique-mobile-390.png`, `08-boutique-mobile-430.png` ;
5. `09-pdp-mobile-360.png`, `09-pdp-mobile-390.png`, `09-pdp-mobile-430.png` ;
6. `05-hero-reduced-motion.png` et `06-hero-webgl-fallback.png`.

## Budgets automatiques

Les budgets deviennent bloquants uniquement avec `TAPOTE_PERF_STRICT=1`.

| Mesure | Seuil bloquant du script | Cible produit |
| --- | ---: | ---: |
| LCP landing desktop | ≤ 3 500 ms | ≤ 2 500 ms |
| LCP landing mobile | ≤ 3 500 ms | ≤ 2 500 ms |
| CLS | ≤ 0,10 | ≤ 0,10 |
| Temps cumulé des longues tâches | ≤ 500 ms | ≤ 300 ms |

Le rapport collecte aussi le nombre de ressources et les volumes transférés JavaScript/images. Ces valeurs servent à détecter une régression entre deux builds ; elles ne sont pas bloquantes, car compression, cache et serveur de test peuvent les modifier fortement.

Ne pas juger la performance finale sur le serveur Vite de développement. Les seuils stricts doivent être lus sur le build servi par Express, idéalement répétés trois fois avec cache froid puis médiane conservée.

## Revue visuelle humaine — Hero

Sur la planche de boucle :

- chaque frame montre un support différent et reconnaissable en moins d’une seconde ;
- Comptoir garde sa silhouette de chevalet, Plaque reste frontale, Card garde les proportions CR80 ;
- le téléphone ne masque ni le produit ni sa zone NFC ;
- aucun flash blanc, scintillement, z-fighting ou changement brutal d’échelle ;
- le toast correspond à l’usage affiché sur le téléphone ;
- la scène ne concurrence pas le H1 et le CTA ;
- le fallback reste premium et cohérent avec la composition 3D.

## Revue réelle obligatoire avant mise en ligne

L’automatisation Chromium ne remplace pas ces cinq essais :

- iPhone Safari, mode normal ;
- iPhone Safari, « Réduire les animations » activé ;
- Android Chrome, mode normal ;
- desktop Safari ou Firefox sans WebGL accéléré ;
- connexion mobile ralentie et cache froid.

Pour chaque essai :

- ouvrir la landing ;
- attendre un cycle complet de 10,8 secondes ;
- ouvrir et fermer le menu au clavier ou au lecteur d’écran quand applicable ;
- ouvrir Boutique, choisir personnalisé, ouvrir un PDP ;
- changer la quantité si disponible ;
- ajouter au panier ;
- revenir en arrière et vérifier que le storefront reste stable.

## Diagnostic rapide

- `hero-webgl-requis` seul en échec : le navigateur de test utilise le fallback. Relancer sur une machine GPU ou retirer `TAPOTE_REQUIRE_WEBGL=1` pour la CI.
- `hero-boucle-visuellement-active` en échec : Canvas figé, contexte perdu ou boucle non rendue.
- `mobile-*-home-cta-premier-ecran` en échec : le hero est trop haut pour cette largeur.
- `mobile-*-sans-debordement` en échec : chercher un élément à largeur fixe, une grille non repliée ou un visuel absolu.
- `runtime-sans-erreur-*` en échec : corriger d’abord l’erreur console, page ou réseau ; les captures suivantes peuvent être trompeuses.
- LCP élevé avec CLS correct : charger la scène 3D après le contenu critique, garder le fallback immédiatement visible et vérifier le poids des modules Three.
- CLS élevé : réserver explicitement la hauteur du hero, des visuels produit et des polices avant leur chargement.
