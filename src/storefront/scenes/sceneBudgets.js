/* La 3D est le produit : un plafond de densité trop bas la rend floue avant de
   la rendre rapide. Les téléphones récents affichent en DPR 3 — rendre en DPR 1
   revenait à afficher un tiers de la résolution réelle sur l'écran où se fait
   l'essentiel des visites. Le rendu reste borné par `maxCanvasPixels`, qui
   protège les appareils modestes bien mieux qu'un plafond de densité. */
export const SCENE_BUDGETS = Object.freeze({
  desktop: Object.freeze({
    maxDpr: 2,
    maxCanvasPixels: 3000000,
    antialias: true,
  }),
  mobile: Object.freeze({
    maxDpr: 2.5,
    maxCanvasPixels: 2200000,
    antialias: true,
  }),
  compact: Object.freeze({
    maxDpr: 1,
    maxCanvasPixels: 700000,
    imageLoading: "lazy",
  }),
});
