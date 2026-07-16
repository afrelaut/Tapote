import "dotenv/config";
import { randomBytes } from "node:crypto";
import process from "node:process";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { ACTIONS, PRODUCTS } from "../shared/catalog.js";

const { Client } = pg;

function readArguments(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Utilise des arguments sous la forme --email valeur.");
    }
    result[key.slice(2)] = value;
  }
  return result;
}

function requireValue(value, label) {
  if (!String(value || "").trim()) throw new Error(`Argument --${label} requis.`);
  return String(value).trim();
}

const args = readArguments(process.argv.slice(2));
const email = requireValue(args.email, "email").toLowerCase();
const organizationName = requireValue(args.organization, "organization");
const targetUrlInput = requireValue(args.target, "target");
const locationName = String(args.location || "Établissement principal").trim();
const productType = String(args.product || "comptoir").trim();
const actionId = String(args.action || "avis").trim();
const productLabel = String(args.label || PRODUCTS[productType]?.name || "Produit Tapote").trim();
const serialNumber = String(args.serial || `TAP-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`).trim();
const password = String(args.password || "");

if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("L’adresse e-mail n’est pas valide.");
if (!PRODUCTS[productType]) throw new Error(`Produit inconnu : ${productType}.`);
if (!ACTIONS[actionId]) throw new Error(`Action inconnue : ${actionId}.`);
if (!/^TAP-[A-Z0-9-]{6,40}$/.test(serialNumber)) throw new Error("Le numéro de série doit suivre le format TAP-XXXXXXXX.");
if (password && password.length < 12) throw new Error("--password doit contenir au moins 12 caractères.");
let targetUrl;
try {
  const parsedTarget = new URL(targetUrlInput);
  if (parsedTarget.protocol !== "https:") throw new Error();
  targetUrl = parsedTarget.href;
} catch {
  throw new Error("La destination doit être une URL HTTPS valide.");
}

const supabaseUrl = requireValue(process.env.SUPABASE_URL, "SUPABASE_URL (variable d’environnement)");
const supabaseSecretKey = requireValue(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SECRET_KEY (variable d’environnement)");
const databaseUrl = requireValue(process.env.DATABASE_URL, "DATABASE_URL (variable d’environnement)");
const publicUrl = String(process.env.PUBLIC_URL || "http://localhost:5173").replace(/\/$/, "");

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let user = null;
for (let page = 1; page <= 10 && !user; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email) || null;
  if (data.users.length < 100) break;
}
let userCreated = false;
let invitationSent = false;
if (!user) {
  const operation = password
    ? supabase.auth.admin.createUser({ email, password, email_confirm: true })
    : supabase.auth.admin.inviteUserByEmail(email, { redirectTo: `${publicUrl}/pilot` });
  const { data, error } = await operation;
  if (error) throw error;
  user = data.user;
  userCreated = true;
  invitationSent = !password;
} else if (password) {
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
  user = data.user;
}
if (!user?.id) throw new Error("Supabase n’a pas renvoyé l’identifiant de l’utilisateur.");

const database = new Client({
  connectionString: databaseUrl,
  ssl: String(process.env.DATABASE_SSL || "true").toLowerCase() === "true" ? { rejectUnauthorized: true } : false,
  application_name: "tapote-pilot-invite",
});

await database.connect();
try {
  await database.query("begin");
  const organization = await database.query(
    `insert into organizations (name, created_by)
     values ($1, $2)
     returning id`,
    [organizationName, user.id],
  );
  const organizationId = organization.rows[0].id;
  const location = await database.query(
    `insert into locations (organization_id, name)
     values ($1, $2)
     returning id`,
    [organizationId, locationName],
  );
  const locationId = location.rows[0].id;
  const link = await database.query(
    `insert into tapote_links (organization_id, location_id, label, target_url)
     values ($1, $2, $3, $4)
     returning id, short_code`,
    [organizationId, locationId, productLabel, targetUrl],
  );
  await database.query(
    `insert into tapote_products (
       organization_id, location_id, tapote_link_id, product_type,
       action_id, label, serial_number, status, activated_at
     ) values ($1, $2, $3, $4, $5, $6, $7, 'active', now())`,
    [organizationId, locationId, link.rows[0].id, productType, actionId, productLabel, serialNumber],
  );
  await database.query("commit");
  process.stdout.write(`${invitationSent ? "Invitation envoyée" : userCreated ? "Compte créé" : "Compte existant autorisé"} pour ${email}. Produit ${serialNumber} créé avec le lien ${link.rows[0].short_code}.\n`);
} catch (error) {
  await database.query("rollback");
  if (userCreated) {
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(user.id);
    if (cleanupError) {
      error.message = `${error.message} L’utilisateur créé n’a pas pu être nettoyé automatiquement : ${cleanupError.message}`;
    }
  }
  throw error;
} finally {
  await database.end();
}
