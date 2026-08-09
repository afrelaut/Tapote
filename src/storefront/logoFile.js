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

const LOGO_TYPE_EXTENSIONS = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

async function detectBitmapType(file) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return "";
}

function nameForType(name, mimeType) {
  const extension = LOGO_TYPE_EXTENSIONS.get(mimeType);
  if (!extension) return name;
  const stem = name.replace(/\.[^.]+$/, "") || "logo";
  return `${stem}.${extension}`;
}

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
  const declaredType = LOGO_MIME_ALIASES.get(file.type.toLowerCase()) || LOGO_EXTENSION_TYPES.get(extension) || "";
  if (!declaredType || file.size > MAX_LOGO_BYTES) {
    throw new Error("PNG, JPG, WebP ou SVG uniquement, 2 Mo maximum.");
  }
  const detectedType = declaredType === "image/svg+xml" ? "" : await detectBitmapType(file);
  const canonicalType = detectedType || declaredType;
  const normalizedName = nameForType(file.name, canonicalType);
  const normalizedFile = file.type === canonicalType && file.name === normalizedName
    ? file
    : new File([file], normalizedName, { type: canonicalType, lastModified: file.lastModified });
  return canonicalType === "image/svg+xml" ? convertSvgLogo(normalizedFile) : normalizedFile;
}
