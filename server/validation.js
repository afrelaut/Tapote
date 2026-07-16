import { z } from "zod";
import { ACTIONS, DESIGN_STYLES, PRODUCTS, TARGETS } from "../shared/catalog.js";

const productIds = Object.keys(PRODUCTS);
const actionIds = Object.keys(ACTIONS);
const themes = ["blue", "rose", "green", "sand", "mono"];
const targetIds = Object.keys(TARGETS);
const designStyleIds = Object.keys(DESIGN_STYLES);

const requiredText = (maximum) => z.string().trim().min(1).max(maximum);
const optionalText = (maximum) => z.string().trim().max(maximum).optional().default("");
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
  theme: z.enum(themes).optional().default("blue"),
  targetId: z.enum(targetIds).optional().default("cafe"),
  designStyle: z.enum(designStyleIds).optional().default("signature"),
  customHeadline: optionalText(64),
  destinationUrl: optionalHttpsUrl,
  brandLogoId: z.uuid().optional().or(z.literal("")),
  logoFileName: optionalText(120),
}).strict();

export const checkoutSchema = z.object({
  attemptId: z.uuid(),
  items: z.array(cartItemSchema).min(1).max(20),
  customer: z.object({
    businessName: requiredText(100),
    email: z.email().trim().max(150).transform((value) => value.toLowerCase()),
    destinationUrl: optionalHttpsUrl,
  }).strict(),
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

export function parseRequest(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return { data: result.data };
  return {
    error: result.error.issues[0]?.message || "Les informations envoyées sont invalides.",
  };
}
