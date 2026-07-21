function colorDistance(first, second) {
  return Math.sqrt(
    (first.r - second.r) ** 2
      + (first.g - second.g) ** 2
      + (first.b - second.b) ** 2,
  );
}

function toHex({ r, g, b }) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export async function pickScreenColor(onSelect) {
  if (typeof window === "undefined" || !("EyeDropper" in window)) return false;
  try {
    const result = await new window.EyeDropper().open();
    onSelect(result.sRGBHex.toLowerCase());
    return true;
  } catch {
    return false;
  }
}

export function extractLogoPalette(dataUrl) {
  if (typeof document === "undefined" || typeof Image === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return resolve(null);
        context.clearRect(0, 0, 64, 64);
        context.drawImage(image, 0, 0, 64, 64);
        const pixels = context.getImageData(0, 0, 64, 64).data;
        const buckets = new Map();
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3] < 170) continue;
          const raw = { r: pixels[index], g: pixels[index + 1], b: pixels[index + 2] };
          const brightness = (raw.r + raw.g + raw.b) / 3;
          if (brightness > 245 || brightness < 12) continue;
          const color = { r: Math.round(raw.r / 24) * 24, g: Math.round(raw.g / 24) * 24, b: Math.round(raw.b / 24) * 24 };
          color.r = Math.min(color.r, 255);
          color.g = Math.min(color.g, 255);
          color.b = Math.min(color.b, 255);
          const key = `${color.r}-${color.g}-${color.b}`;
          buckets.set(key, { color, count: (buckets.get(key)?.count || 0) + 1 });
        }
        const ranked = [...buckets.values()].sort((first, second) => second.count - first.count);
        if (!ranked.length) return resolve(null);
        const primary = ranked[0].color;
        const secondary = ranked.find(({ color }) => colorDistance(primary, color) > 105)?.color
          || ranked.find(({ color }) => colorDistance(primary, color) > 58)?.color
          || (primary.r + primary.g + primary.b > 420 ? { r: 32, g: 87, b: 243 } : { r: 244, g: 239, b: 230 });
        resolve({ primary: toHex(primary), secondary: toHex(secondary) });
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}
