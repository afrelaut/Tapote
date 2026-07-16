import "dotenv/config";
import assert from "node:assert/strict";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function required(value, label) {
  if (!String(value || "").trim()) throw new Error(`${label} est requis.`);
  return String(value).trim();
}

const supabaseUrl = required(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, "SUPABASE_URL");
const publishableKey = required(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY, "SUPABASE_PUBLISHABLE_KEY");
const managementEmail = required(process.env.TEST_MANAGEMENT_EMAIL, "TEST_MANAGEMENT_EMAIL").toLowerCase();
const managementPassword = required(process.env.TEST_MANAGEMENT_PASSWORD, "TEST_MANAGEMENT_PASSWORD");
const pilotEmail = required(process.env.TEST_PILOT_EMAIL, "TEST_PILOT_EMAIL").toLowerCase();
const pilotPassword = required(process.env.TEST_PILOT_PASSWORD, "TEST_PILOT_PASSWORD");

function client(storageKey) {
  return createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey },
  });
}

const management = client("tapote-verify-management");
const pilot = client("tapote-verify-pilot");

try {
  const { data: managementAuth, error: managementAuthError } = await management.auth.signInWithPassword({
    email: managementEmail,
    password: managementPassword,
  });
  assert.ifError(managementAuthError);
  assert.ok(managementAuth.user?.id, "Le compte Gestion doit être authentifié.");

  const { data: managementMemberships, error: membershipError } = await management
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", managementAuth.user.id);
  assert.ifError(membershipError);
  assert.equal(managementMemberships.length, 1, "Le compte Gestion doit avoir un tenant unique.");
  assert.ok(["owner", "admin", "manager"].includes(managementMemberships[0].role));
  const managementOrganizationId = managementMemberships[0].organization_id;

  const [{ data: clients, error: clientsError }, { data: orders, error: ordersError }] = await Promise.all([
    management.from("management_clients").select("id").eq("organization_id", managementOrganizationId),
    management.from("management_orders").select("id, status, source_order_id, pilot_status, pilot_organization_id").eq("organization_id", managementOrganizationId),
  ]);
  assert.ifError(clientsError);
  assert.ifError(ordersError);
  assert.ok(clients.length >= 1, "La commande web doit créer le client Gestion.");
  assert.ok(orders.some((order) => order.source_order_id), "La commande web doit être liée à Gestion.");
  assert.ok(orders.some((order) => order.pilot_status === "active" && order.pilot_organization_id), "Le lien Gestion → Pilot doit être actif.");

  const linkedOrder = orders.find((order) => order.source_order_id);
  const { error: managementUpdateError } = await management
    .from("management_orders")
    .update({ status: "assembly" })
    .eq("id", linkedOrder.id);
  assert.ifError(managementUpdateError);

  const { data: managementPilotProducts, error: managementPilotError } = await management
    .from("tapote_products")
    .select("id");
  assert.ifError(managementPilotError);
  assert.equal(managementPilotProducts.length, 0, "Gestion ne doit pas voir le tenant Pilot client.");

  const { data: pilotAuth, error: pilotAuthError } = await pilot.auth.signInWithPassword({
    email: pilotEmail,
    password: pilotPassword,
  });
  assert.ifError(pilotAuthError);
  assert.ok(pilotAuth.user?.id, "Le compte Pilot doit être authentifié.");

  const { data: pilotMemberships, error: pilotMembershipError } = await pilot
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", pilotAuth.user.id);
  assert.ifError(pilotMembershipError);
  assert.equal(pilotMemberships.length, 1, "Le compte Pilot doit avoir un tenant unique.");
  const pilotOrganizationId = pilotMemberships[0].organization_id;
  assert.notEqual(pilotOrganizationId, managementOrganizationId, "Gestion et Pilot doivent être isolés.");

  const [{ data: products, error: productsError }, { data: hiddenManagementClients, error: hiddenClientsError }] = await Promise.all([
    pilot.from("tapote_products").select("id, tapote_link_id").eq("organization_id", pilotOrganizationId),
    pilot.from("management_clients").select("id"),
  ]);
  assert.ifError(productsError);
  assert.ifError(hiddenClientsError);
  assert.equal(products.length, 7, "Le Pack Restaurant doit créer sept produits physiques.");
  assert.equal(hiddenManagementClients.length, 0, "Pilot ne doit voir aucune donnée Gestion.");

  const { data: link, error: linkError } = await pilot
    .from("tapote_links")
    .select("id, target_url")
    .eq("id", products[0].tapote_link_id)
    .single();
  assert.ifError(linkError);

  const { error: forbiddenUpdateError } = await pilot
    .from("tapote_links")
    .update({ label: "Modification interdite" })
    .eq("id", link.id);
  assert.ok(forbiddenUpdateError, "Pilot ne doit pas pouvoir modifier le libellé provisionné.");

  const verifiedUrl = `${link.target_url}${link.target_url.includes("?") ? "&" : "?"}verified=1`;
  const { error: allowedUpdateError } = await pilot
    .from("tapote_links")
    .update({ target_url: verifiedUrl })
    .eq("id", link.id);
  assert.ifError(allowedUpdateError);
  const { error: restoreError } = await pilot
    .from("tapote_links")
    .update({ target_url: link.target_url })
    .eq("id", link.id);
  assert.ifError(restoreError);

  const { data: dashboard, error: dashboardError } = await pilot.rpc("get_pilot_dashboard", {
    p_organization_id: pilotOrganizationId,
    p_since: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  });
  assert.ifError(dashboardError);
  assert.ok(Array.isArray(dashboard));

  process.stdout.write(JSON.stringify({
    ok: true,
    management: { clients: clients.length, linkedOrders: orders.filter((order) => order.source_order_id).length },
    pilot: { products: products.length, dashboardRows: dashboard.length },
    isolation: "verified",
  }, null, 2));
  process.stdout.write("\n");
} finally {
  await Promise.allSettled([
    management.auth.signOut({ scope: "local" }),
    pilot.auth.signOut({ scope: "local" }),
  ]);
}
