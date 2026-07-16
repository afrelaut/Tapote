import dotenv from "dotenv";
import { randomBytes } from "node:crypto";
import process from "node:process";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: false });

const { Client } = pg;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const databaseUrl = process.env.DATABASE_URL;
const missingVariables = [
  !supabaseUrl && "SUPABASE_URL ou VITE_SUPABASE_URL",
  !secretKey && "SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY",
  !publishableKey && "VITE_SUPABASE_PUBLISHABLE_KEY",
  !databaseUrl && "DATABASE_URL",
].filter(Boolean);
if (missingVariables.length) throw new Error(`Variables Supabase de vérification manquantes : ${missingVariables.join(", ")}.`);

const suffix = randomBytes(6).toString("hex");
const email = `codex-management-${suffix}@tapote.invalid`;
const password = `Tmp-${randomBytes(18).toString("base64url")}!9`;
const admin = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const browserClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
const database = new Client({
  connectionString: databaseUrl,
  ssl: String(process.env.DATABASE_SSL || "true").toLowerCase() === "true" ? { rejectUnauthorized: true } : false,
  application_name: "tapote-management-verify",
});

let userId;
let organizationId;
let databaseConnected = false;
try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError) throw createError;
  userId = created.user.id;
  await database.connect();
  databaseConnected = true;
  const organization = await database.query("insert into public.organizations (name, created_by) values ($1, $2) returning id", [`TAPOTE Verify ${suffix}`, userId]);
  organizationId = organization.rows[0].id;
  await database.query("insert into public.management_settings (organization_id) values ($1)", [organizationId]);
  const client = await database.query(
    `insert into public.management_clients (organization_id, client_code, name, email)
     values ($1, 'VERIFY-1', 'Client de vérification', 'client@tapote.invalid') returning id`,
    [organizationId],
  );
  const inventory = await database.query(
    `insert into public.management_inventory_items (
      organization_id, sku, name, stock_quantity, incoming_quantity, threshold_quantity
    ) values ($1, 'VERIFY-STOCK', 'Stock de vérification', 10, 8, 3) returning id`,
    [organizationId],
  );

  const anonymous = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const anonymousRead = await anonymous.from("management_clients").select("id").limit(1);
  if (!anonymousRead.error && anonymousRead.data.length > 0) throw new Error("RLS invalide : une lecture anonyme a renvoyé des données.");

  const { error: signInError } = await browserClient.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  const { data: visibleClients, error: readError } = await browserClient.from("management_clients").select("id, name").eq("organization_id", organizationId);
  if (readError) throw readError;
  if (visibleClients.length !== 1) throw new Error("Le gérant ne voit pas son client de test.");

  const { data: order, error: orderError } = await browserClient.rpc("create_management_order", {
    target_organization_id: organizationId,
    target_client_id: client.rows[0].id,
    target_product_name: "Comptoir A6",
    target_quantity: 1,
    target_total_cents: 5900,
    target_due_on: "2026-07-22",
    target_channel: "Vérification",
    target_destination: "Avis Google",
    target_owner_name: "Codex Verify",
  });
  if (orderError) throw orderError;
  if (order.order_number !== "TPT-1049") throw new Error("La numérotation transactionnelle des commandes est invalide.");

  const { data: advancedOrder, error: advanceError } = await browserClient.rpc("advance_management_order", {
    target_organization_id: organizationId,
    target_order_id: order.id,
    expected_status: "paid",
    target_status: "bat",
    target_tracking_number: null,
  });
  if (advanceError) throw advanceError;
  if (advancedOrder.status !== "bat") throw new Error("La transition atomique de commande est invalide.");

  const { error: conflictError } = await browserClient.rpc("advance_management_order", {
    target_organization_id: organizationId,
    target_order_id: order.id,
    expected_status: "paid",
    target_status: "bat",
    target_tracking_number: null,
  });
  if (!conflictError || conflictError.code !== "40001") throw new Error("Le conflit de commande concurrente n’est pas détecté.");

  const { data: receivedStock, error: stockError } = await browserClient.rpc("receive_management_stock", {
    target_organization_id: organizationId,
    target_inventory_item_id: inventory.rows[0].id,
    target_quantity: 5,
  });
  if (stockError) throw stockError;
  if (receivedStock.stock_quantity !== 15 || receivedStock.incoming_quantity !== 3) throw new Error("La réception atomique de stock est invalide.");

  process.stdout.write("Supabase Gestion vérifié : Auth, RLS, transactions commande/stock et écritures opérationnelles.\n");
} finally {
  await browserClient.auth.signOut().catch(() => undefined);
  if (organizationId && databaseConnected) await database.query("delete from public.organizations where id = $1", [organizationId]).catch(() => undefined);
  if (databaseConnected) await database.end().catch(() => undefined);
  if (userId) await admin.auth.admin.deleteUser(userId).catch(() => undefined);
}
