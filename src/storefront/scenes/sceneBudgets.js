export const SCENE_BUDGETS = Object.freeze({
  desktop: Object.freeze({
    maxDpr: 1.5,
    maxCanvasPixels: 2200000,
    antialias: true,
  }),
  mobile: Object.freeze({
    maxDpr: 1,
    maxCanvasPixels: 1000000,
    antialias: false,
  }),
  compact: Object.freeze({
    maxDpr: 1,
    maxCanvasPixels: 700000,
    imageLoading: "lazy",
  }),
});
