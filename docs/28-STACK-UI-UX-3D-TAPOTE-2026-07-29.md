# Stack UI/UX et 3D — Tapote

Date : 29 juillet 2026

## Stack retenue maintenant

| Besoin | Outil | Décision |
|---|---|---|
| Scène produit 3D | `three` + `@react-three/fiber` | Retenu et intégré |
| Helpers 3D React | `@react-three/drei` | Retenu pour Float, RoundedBox, ombres et éclairage |
| Motion de l'interface | `motion` | Retenu pour entrées, orchestration, gestes et transitions DOM/SVG |
| Icônes | `lucide-react` | Retenu avec un vocabulaire d'icônes limité |
| Composants accessibles | shadcn/ui officiel | Retenu pour Studio, formulaires, panier et administration ; pas pour imposer un look à la landing |
| Design source/BAT | Figma | Recommandé comme source de vérité pour gabarits, tokens et exports imprimeur |
| Tests UX | Testing Library + Vitest + Playwright + axe | Déjà présents |

Le skill officiel shadcn a été installé dans Codex. Il permet de chercher, ajouter et composer les composants avec les règles d'accessibilité officielles. Le runtime shadcn/Tailwind n'est pas injecté aveuglément dans la landing actuelle : l'intégration doit commencer sur une zone bornée, idéalement le Studio, puis migrer les composants utiles un par un.

## Répartition claire des rôles

- **Three/R3F** : matière, lumière, perspective, rotation et scène support → téléphone.
- **Motion** : texte, CTA, panneaux, panier, changements d'étape et retours visuels.
- **shadcn/ui** : Dialog, Drawer mobile, Select, ToggleGroup, Accordion, Tooltip, formulaire, toast et états de chargement.
- **CSS Tapote** : direction artistique, typographie, grille, couleurs et proportions.
- **Figma** : composants de référence, variantes matière, gabarits imprimeur et BAT.

## Outils réservés à un besoin précis

| Outil | Quand l'ajouter | Pourquoi pas maintenant |
|---|---|---|
| GSAP + ScrollTrigger | Une histoire réellement pilotée par le scroll avec plusieurs scènes synchronisées | Motion + R3F couvrent la landing actuelle ; doubler les moteurs augmente le poids et les bugs |
| Theatre.js | Réglage visuel d'une séquence 3D longue par keyframes | La boucle actuelle est courte et déterministe |
| `@react-three/postprocessing` | Bloom/DOF subtil après mesure GPU | Le rendu actuel reste lisible sans effets coûteux |
| React Aria | Si le Studio exige des interactions complexes non couvertes | shadcn permet déjà de choisir une base Aria lors d'une vraie migration |

## Outils rejetés par défaut

- Lenis et le smooth scroll forcé : sensation artificielle, risques clavier/mobile et aucun gain de conversion prouvé.
- Spline embarqué en production : bon pour prototype, moins contrôlable et souvent plus lourd que la scène R3F native.
- collections de « animated components » copiées sans audit : identité générique et dette CSS.
- plusieurs bibliothèques d'icônes : incohérence visuelle.
- shadcn par défaut partout : Tapote doit utiliser ses primitives, pas ressembler à une démo shadcn.

## Contrat de performance de la scène

- chunk 3D séparé du storefront ;
- fallback statique si WebGL est absent ou si l'utilisateur réduit les animations ;
- `dpr` plafonné ;
- aucun contrôle caméra ou interaction indispensable pour comprendre l'offre ;
- animations continues limitées aux `transform`/frames 3D ;
- le H1 et les CTA restent de vrais éléments HTML, lisibles avant le canvas ;
- mobile : composition simplifiée et échelle réduite ;
- prochaine optimisation si nécessaire : chargement après le premier rendu et textures WebP/KTX2 uniquement sur modèles réels.

## Ordre d'intégration shadcn recommandé

1. Drawer panier mobile.
2. Dialog « Comment marche le BAT ? ».
3. ToggleGroup Prêt / Personnalisé.
4. Select matière et quantité.
5. Accordion FAQ.
6. Formulaire de brief avec FieldGroup et validation.
7. Dashboard Pilot, en dernier.

