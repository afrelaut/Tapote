export const DEVICE_THEMES = Object.freeze({
  blue: { paper: "#161310", ink: "#f4efe6", accent: "#2946f5", accentInk: "#ffffff" },
  rose: { paper: "#f0d6d3", ink: "#5a2d3c", accent: "#5a2d3c", accentInk: "#ffffff" },
  green: { paper: "#173b32", ink: "#f7edcf", accent: "#d88a20", accentInk: "#17110c" },
  sand: { paper: "#efe5d2", ink: "#402d24", accent: "#b95632", accentInk: "#ffffff" },
  mono: { paper: "#f4f1e9", ink: "#111111", accent: "#111111", accentInk: "#f4f1e9" },
});

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function normalizeHexColor(value, fallback) {
  const normalized = String(value || "").trim();
  return HEX_COLOR.test(normalized) ? normalized.toLowerCase() : fallback;
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color) {
  const normalized = normalizeHexColor(color, "#000000");
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue);
}

export function readableInk(background) {
  const dark = "#111111";
  const light = "#ffffff";
  return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
}

export function contrastRatio(first, second) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

export function resolveDeviceColors(theme = "blue", primaryColor = "", secondaryColor = "", textColor = "") {
  const base = DEVICE_THEMES[theme] || DEVICE_THEMES.blue;
  const paper = normalizeHexColor(primaryColor, base.paper);
  const accent = normalizeHexColor(secondaryColor, base.accent);
  const requestedInk = normalizeHexColor(textColor, primaryColor ? readableInk(paper) : base.ink);
  const requestedAccentInk = secondaryColor ? readableInk(accent) : base.accentInk;
  return {
    paper,
    accent,
    ink: contrastRatio(paper, requestedInk) >= 4.5 ? requestedInk : readableInk(paper),
    accentInk: contrastRatio(accent, requestedAccentInk) >= 4.5 ? requestedAccentInk : readableInk(accent),
  };
}
