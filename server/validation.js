import { z } from "zod";
import { ACTIONS, PRODUCTS, TARGETS } from "../shared/catalog.js";

const productIds = Object.keys(PRODUCTS);
const actionIds = Object.keys(ACTIONS);
// Le design Tapote n'a plus que deux déclinaisons. Les identifiants d'avant la
// refonte restent acceptés — un panier déjà enregistré dans le navigateur d'un
// client ne doit pas être refusé au moment de payer — puis ramenés sur la
// déclinaison correspondante.
const THEMES = ["nuit", "creme"];
const LEGACY_THEMES = { blue: "nuit", green: "nuit", mono: "creme", sand: "creme", rose: "creme" };
const themeSchema = z.preprocess(
  (value) => LEGACY_THEMES[value] || value,
  z.enum(THEMES),
).optional().default("nuit");
const targetIds = Object.keys(TARGETS);

const requiredText = (maximum) => z.string().trim().min(1).max(maximum);
const optionalText = (maximum) => z.string().trim().max(maximum).optional().default("");
const optionalHexColor = z.union([z.literal(""), z.string().regex(/^#[0-9a-f]{6}$/i)]).optional().default("");
const optionalHttpsUrl = z.string().trim().max(500).optional().default("").superRefine((value, context) => {
  if (!value) return;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") context.addIssue({ code: "custom", message: "Le lien doit commencer par https://." });
  } catch {
    context.addIssue({ code: "custom", message: "Le lien indiqué n’est pas valide." });
  }
});

const cartItemSchema = z.object({
  productId: z.enum(productIds),
  actionId: z.enum(actionIds),
  quantity: z.coerce.number().int().min(1).max(50),
  brandName: optionalText(60),
  theme: themeSchema,
  primaryColor: optionalHexColor,
  secondaryColor: optionalHexColor,
  textColor: optionalHexColor,
  targetId: z.enum(targetIds).optional().default("cafe"),
  // Champ retiré de l'offre : encore accepté pour ne pas rejeter un panier
  // enregistré avant la refonte, mais ignoré partout ensuite.
  designStyle: z.string().max(20).optional(),
  customHeadline: optionalText(64),
  customSubline: optionalText(90),
  customTapLabel: optionalText(32),
  destinationUrl: optionalHttpsUrl,
  brandLogoId: z.uuid().optional().or(z.literal("")),
  logoFileName: optionalText(120),
  supportComposition: z.object({
    comptoir: z.coerce.number().int().min(0).max(5),
    plaque: z.coerce.number().int().min(0).max(5),
  }).strict().optional(),
}).strict();

export const checkoutSchema = z.object({
  attemptId: z.uuid(),
  items: z.array(cartItemSchema).min(1).max(20),
  customer: z.object({
    businessName: requiredText(100),
    email: z.email().trim().max(150).transform((value) => value.toLowerCase()),
    destinationUrl: optionalHttpsUrl,
  }).strict(),
  professionalCustomer: z.literal(true, { error: "La boutique Tapote est réservée aux clients professionnels." }),
  termsAccepted: z.literal(true),
}).strict();

export const leadSchema = z.object({
  name: requiredText(100),
  email: z.email().trim().max(150).transform((value) => value.toLowerCase()),
  company: optionalText(150),
  need: requiredText(1500),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(""),
}).strict();

export const checkoutStatusSchema = z.object({
  session_id: z.string().trim().min(8).max(255),
}).strict();

export const tapoteRedirectSchema = z.object({
  code: z.string().trim().regex(/^[a-f0-9]{10}$/i, "Ce lien Tapote n’est pas valide."),
  source: z.enum(["nfc", "qr", "unknown"]).default("unknown"),
}).strict();

export const pilotActivationSchema = z.object({
  locationName: z.string().trim().min(1, "Indique le nom de l’établissement.").max(150),
  targetUrl: optionalHttpsUrl,
}).strict();

export function parseRequest(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return { data: result.data };
  return {
    error: result.error.issues[0]?.message || "Les informations envoyées sont invalides.",
  };
}
