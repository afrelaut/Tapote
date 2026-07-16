import "dotenv/config";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function readArguments(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Utilise des arguments sous la forme --cle valeur.");
    }
    result[key.slice(2)] = value;
  }
  return result;
}

function required(value, label) {
  if (!String(value || "").trim()) throw new Error(`${label} est requis.`);
  return String(value).trim();
}

const args = readArguments(process.argv.slice(2));
const orderNumber = required(args.order, "--order");
const operatorEmail = required(args["operator-email"], "--operator-email").toLowerCase();
const operatorPassword = required(args["operator-password"], "--operator-password");
const locationName = String(args.location || "Établissement principal").trim();
const password = String(args.password || "");
const targetUrl = String(args.target || "").trim() || null;

if (password && password.length < 12) throw new Error("--password doit contenir au moins 12 caractères.");
if (targetUrl && !/^https:\/\//.test(targetUrl)) throw new Error("--target doit être une URL HTTPS.");

const supabaseUrl = required(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, "SUPABASE_URL");
const secretKey = required(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SECRET_KEY");
const publishableKey = required(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY, "SUPABASE_PUBLISHABLE_KEY");
const publicUrl = String(process.env.PUBLIC_URL || "http://localhost:5173").replace(/\/$/, "");

const admin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const operator = createClient(supabaseUrl, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: managementOrder, error: orderError } = await admin
  .from("management_orders")
  .select("id, source_order_id, order_number")
  .eq("order_number", orderNumber)
  .single();
if (orderError) throw orderError;
if (!managementOrder.source_order_id) throw new Error("Cette commande ne provient pas de tapote.fr.");

const { data: storefrontOrder, error: storefrontError } = await admin
  .from("orders")
  .select("customer_email, customer_business_name, destination_url")
  .eq("id", managementOrder.source_order_id)
  .single();
if (storefrontError) throw storefrontError;
if (!targetUrl && !storefrontOrder.destination_url) {
  throw new Error("Ajoute --target https://... : la commande ne contient pas encore de destination.");
}

let customerUser = null;
for (let page = 1; page <= 10 && !customerUser; page += 1) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  customerUser = data.users.find((candidate) => candidate.email?.toLowerCase() === storefrontOrder.customer_email.toLowerCase()) || null;
  if (data.users.length < 100) break;
}

let userCreated = false;
if (!customerUser) {
  const operation = password
    ? admin.auth.admin.createUser({
      email: storefrontOrder.customer_email,
      password,
      email_confirm: true,
      user_metadata: { business_name: storefrontOrder.customer_business_name },
    })
    : admin.auth.admin.inviteUserByEmail(storefrontOrder.customer_email, {
      redirectTo: `${publicUrl}/pilot`,
      data: { business_name: storefrontOrder.customer_business_name },
    });
  const { data, error } = await operation;
  if (error) throw error;
  customerUser = data.user;
  userCreated = true;
} else if (password) {
  const { data, error } = await admin.auth.admin.updateUserById(customerUser.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
  customerUser = data.user;
}

if (!customerUser?.id) throw new Error("Impossible de préparer le compte client.");

const { data: operatorAuth, error: signInError } = await operator.auth.signInWithPassword({
  email: operatorEmail,
  password: operatorPassword,
});
if (signInError) throw signInError;

try {
  const { data, error } = await admin.rpc("activate_customer_workspace_as_service", {
    target_actor_user_id: operatorAuth.user.id,
    target_management_order_id: managementOrder.id,
    target_customer_user_id: customerUser.id,
    target_location_name: locationName,
    target_url: targetUrl,
  });
  if (error) throw error;
  const result = data?.[0];
  process.stdout.write(
    `Pilot activé pour ${storefrontOrder.customer_email} · ${result?.products_created || 0} produit(s) · organisation ${result?.organization_id}.\n`,
  );
} catch (error) {
  if (userCreated) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(customerUser.id);
    if (cleanupError) error.message = `${error.message} Nettoyage du compte impossible : ${cleanupError.message}`;
  }
  throw error;
} finally {
  await operator.auth.signOut({ scope: "local" });
}
