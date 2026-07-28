// Préparation des logos importés par le client dans le studio.
// Le SVG est rasterisé côté navigateur : l'imprimeur reçoit toujours un bitmap
// contrôlé plutôt qu'un vectoriel dont on ne maîtrise ni les polices ni les
// références externes.

const LOGO_MIME_ALIASES = new Map([
  ["image/png", "image/png"],
  ["image/x-png", "image/png"],
  ["image/jpeg", "image/jpeg"],
  ["image/jpg", "image/jpeg"],
  ["image/pjpeg", "image/jpeg"],
  ["image/webp", "image/webp"],
  ["image/svg+xml", "image/svg+xml"],
]);

const LOGO_EXTENSION_TYPES = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["svg", "image/svg+xml"],
]);

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lecture du logo impossible."));
    reader.readAsDataURL(file);
  });
}

async function convertSvgLogo(file) {
  const source = await file.text();
  const unsafeSvg = /<(?:script|foreignObject|iframe|object|embed)\b|\bon[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["']\s*(?:javascript:|https?:|data:)/i;
  if (!/<svg(?:\s|>)/i.test(source) || unsafeSvg.test(source)) {
    throw new Error("Ce SVG contient des éléments non pris en charge. Exportez-le en PNG depuis votre outil de création.");
  }

  const sourceUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
  try {
    const image = await new Promise((resolve, reject) => {
      const preview = new Image();
      preview.onload = () => resolve(preview);
      preview.onerror = () => reject(new Error("Ce fichier SVG ne peut pas être affiché."));
      preview.src = sourceUrl;
    });
    const naturalWidth = image.naturalWidth || 1200;
    const naturalHeight = image.naturalHeight || 600;
    const scale = Math.min(1, 1600 / Math.max(naturalWidth, naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Conversion du SVG impossible sur ce navigateur.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Conversion du SVG impossible."));
    }, "image/png"));
    const name = `${file.name.replace(/\.svg$/i, "") || "logo"}.png`;
    return new File([blob], name, { type: "image/png", lastModified: file.lastModified });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function prepareLogoFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const canonicalType = LOGO_MIME_ALIASES.get(file.type.toLowerCase()) || LOGO_EXTENSION_TYPES.get(extension) || "";
  if (!canonicalType || file.size > MAX_LOGO_BYTES) {
    throw new Error("PNG, JPG, WebP ou SVG uniquement, 2 Mo maximum.");
  }
  const normalizedFile = file.type === canonicalType ? file : new File([file], file.name, { type: canonicalType, lastModified: file.lastModified });
  return canonicalType === "image/svg+xml" ? convertSvgLogo(normalizedFile) : normalizedFile;
}
