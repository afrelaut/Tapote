import { managementSupabase } from "./supabase.js";

const managementRoles = ["owner", "admin", "manager"];

function assertClient() {
  if (!managementSupabase) throw new Error("Supabase n’est pas configuré pour TAPOTE Gestion.");
  return managementSupabase;
}

function throwIfError(error) {
  if (error) throw error;
}

function formatShortDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" })
    .format(new Date(`${value}T12:00:00`))
    .replace(".", "");
}

function formatRelativeTime(value) {
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (elapsedMinutes < 1) return "À l’instant";
  if (elapsedMinutes < 60) return `Il y a ${elapsedMinutes} min`;
  if (elapsedMinutes < 1440) return `Il y a ${Math.round(elapsedMinutes / 60)} h`;
  return formatShortDate(String(value).slice(0, 10));
}

function mapOrder(row) {
  return {
    recordId: row.id,
    id: row.order_number,
    clientId: row.client_id,
    product: row.product_name,
    quantity: row.quantity,
    total: row.total_cents / 100,
    status: row.status,
    payment: row.payment_status,
    channel: row.channel,
    created: formatShortDate(row.ordered_on),
    due: formatShortDate(row.due_on),
    dueDate: row.due_on,
    priority: row.priority,
    owner: row.owner_name || "Non assignée",
    destination: row.destination || "—",
    tracking: row.tracking_number || "",
    note: row.note || "Aucune note atelier.",
  };
}

function mapInventory(row) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category || "Autre",
    stock: row.stock_quantity,
    reserved: row.reserved_quantity,
    threshold: row.threshold_quantity,
    incoming: row.incoming_quantity,
    eta: formatShortDate(row.eta_date),
    etaDate: row.eta_date,
  };
}

export async function getManagementSession() {
  const client = assertClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  throwIfError(sessionError);
  if (!sessionData.session) return null;
  const { data: userData, error: userError } = await client.auth.getUser();
  throwIfError(userError);
  return userData.user ? { ...sessionData.session, user: userData.user } : null;
}

export function onManagementAuthChange(callback) {
  const client = assertClient();
  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signInManager(email, password) {
  const { data, error } = await assertClient().auth.signInWithPassword({ email, password });
  throwIfError(error);
  return data.session;
}

export async function sendManagerPasswordReset(email) {
  const redirectTo = `${window.location.origin}/gestion`;
  const { error } = await assertClient().auth.resetPasswordForEmail(email, { redirectTo });
  throwIfError(error);
}

export async function signOutManager() {
  const { error } = await assertClient().auth.signOut({ scope: "local" });
  throwIfError(error);
}

export async function getManagementAccess(user) {
  const client = assertClient();
  const { data: membership, error: membershipError } = await client
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", managementRoles)
    .limit(1)
    .maybeSingle();
  throwIfError(membershipError);
  if (!membership) return null;

  const [{ data: organization, error: organizationError }, { data: profile, error: profileError }] = await Promise.all([
    client.from("organizations").select("id, name").eq("id", membership.organization_id).single(),
    client.from("management_profiles").select("display_name, job_title").eq("organization_id", membership.organization_id).eq("user_id", user.id).maybeSingle(),
  ]);
  throwIfError(organizationError);
  throwIfError(profileError);
  return {
    organizationId: membership.organization_id,
    organizationName: organization.name,
    role: membership.role,
    displayName: profile?.display_name || user.email?.split("@")[0] || "Gérant TAPOTE",
    jobTitle: profile?.job_title || ({ owner: "Propriétaire", admin: "Administrateur", manager: "Gérant" }[membership.role]),
    email: user.email,
  };
}

export async function loadManagementData(organizationId) {
  const client = assertClient();
  const [clientsResult, ordersResult, inventoryResult, storefrontResult, activityResult] = await Promise.all([
    client.from("management_clients").select("*").eq("organization_id", organizationId).is("archived_at", null).order("name"),
    client.from("management_orders").select("*").eq("organization_id", organizationId).order("ordered_on", { ascending: false }).order("created_at", { ascending: false }),
    client.from("management_inventory_items").select("*").eq("organization_id", organizationId).is("archived_at", null).order("name"),
    client.from("management_storefront_products").select("*").eq("organization_id", organizationId).order("name"),
    client.from("management_activity").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(12),
  ]);
  [clientsResult, ordersResult, inventoryResult, storefrontResult, activityResult].forEach((result) => throwIfError(result.error));

  const orders = ordersResult.data.map(mapOrder);
  const clientMetrics = orders.reduce((totals, order) => {
    const current = totals[order.clientId] || { orders: 0, revenue: 0 };
    totals[order.clientId] = { orders: current.orders + 1, revenue: current.revenue + order.total };
    return totals;
  }, {});
  const clients = clientsResult.data.map((row) => ({
    id: row.id,
    name: row.name,
    contact: row.contact_name || "Contact à compléter",
    email: row.email || "—",
    phone: row.phone || "—",
    city: row.city || "—",
    segment: row.segment || "Autre",
    health: row.health,
    joined: formatShortDate(row.joined_on),
    orders: clientMetrics[row.id]?.orders || 0,
    revenue: clientMetrics[row.id]?.revenue || 0,
  }));
  return {
    clients,
    orders,
    inventory: inventoryResult.data.map(mapInventory),
    storefront: storefrontResult.data.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price_cents / 100,
      online: row.online,
      stockId: row.inventory_item_id,
      sales: row.sales_count,
      conversion: row.conversion_rate === null ? "—" : `${Number(row.conversion_rate).toLocaleString("fr-FR")} %`,
    })),
    activity: activityResult.data.map((row) => ({ id: String(row.id), icon: row.kind, text: row.description, time: formatRelativeTime(row.created_at) })),
  };
}

async function recordActivity(organizationId, kind, description, metadata = {}) {
  const { error } = await assertClient().from("management_activity").insert({
    organization_id: organizationId,
    kind,
    description,
    metadata,
  });
  throwIfError(error);
}

export async function createManagementOrder(organizationId, form, ownerName) {
  const { data, error } = await assertClient().rpc("create_management_order", {
    target_organization_id: organizationId,
    target_client_id: form.clientId,
    target_product_name: form.product,
    target_quantity: Number(form.quantity),
    target_total_cents: Math.round(Number(form.total) * 100),
    target_due_on: form.due,
    target_channel: form.channel,
    target_destination: form.destination,
    target_owner_name: ownerName,
  });
  throwIfError(error);
  const order = mapOrder(data);
  await recordActivity(organizationId, "order", `Nouvelle commande ${order.id} créée`, { order_id: data.id });
  return order;
}

export async function createManagementClient(organizationId, form) {
  const clientCode = `CLI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { data, error } = await assertClient().from("management_clients").insert({
    organization_id: organizationId,
    client_code: clientCode,
    name: form.name.trim(),
    contact_name: form.contact.trim() || null,
    email: form.email.trim().toLowerCase() || null,
    phone: form.phone.trim() || null,
    city: form.city.trim() || null,
    segment: form.segment,
    health: "Nouveau",
  }).select("*").single();
  throwIfError(error);
  await recordActivity(organizationId, "client", `Nouveau client : ${data.name}`, { client_id: data.id });
  return data.id;
}

export async function createManagementInventoryItem(organizationId, form) {
  const { data, error } = await assertClient().from("management_inventory_items").insert({
    organization_id: organizationId,
    sku: form.sku.trim().toUpperCase(),
    name: form.name.trim(),
    category: form.category,
    stock_quantity: Number(form.stock),
    reserved_quantity: 0,
    threshold_quantity: Number(form.threshold),
    incoming_quantity: 0,
  }).select("*").single();
  throwIfError(error);
  await recordActivity(organizationId, "stock", `Nouvelle référence stock : ${data.name}`, { inventory_item_id: data.id });
  return mapInventory(data);
}

export async function updateManagementOrderStatus(organizationId, order, nextStatus, trackingNumber) {
  const updates = {
    status: nextStatus,
    tracking_number: trackingNumber || null,
    shipped_at: nextStatus === "shipped" ? new Date().toISOString() : null,
  };
  const { data, error } = await assertClient().from("management_orders")
    .update(updates)
    .eq("organization_id", organizationId)
    .eq("id", order.recordId)
    .select("*")
    .single();
  throwIfError(error);
  await recordActivity(organizationId, nextStatus === "shipped" ? "ship" : "order", `${order.id} est passée au statut « ${nextStatus} »`, { order_id: order.recordId, status: nextStatus });
  return mapOrder(data);
}

export async function receiveManagementStock(organizationId, item, amount) {
  const quantity = Number(amount);
  const { data, error } = await assertClient().from("management_inventory_items")
    .update({ stock_quantity: item.stock + quantity, incoming_quantity: Math.max(0, item.incoming - quantity) })
    .eq("organization_id", organizationId)
    .eq("id", item.id)
    .select("*")
    .single();
  throwIfError(error);
  await recordActivity(organizationId, "stock", `${quantity} unités de ${item.name} réceptionnées`, { inventory_item_id: item.id, quantity });
  return mapInventory(data);
}

export async function setStorefrontProductOnline(organizationId, productId, online) {
  const { error } = await assertClient().from("management_storefront_products")
    .update({ online })
    .eq("organization_id", organizationId)
    .eq("id", productId);
  throwIfError(error);
}

export function subscribeToManagement(organizationId, onChange) {
  const client = assertClient();
  const tables = ["management_clients", "management_orders", "management_inventory_items", "management_storefront_products", "management_activity"];
  let channel = client.channel(`management:${organizationId}`);
  tables.forEach((table) => {
    channel = channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `organization_id=eq.${organizationId}` }, onChange);
  });
  channel.subscribe();
  return () => client.removeChannel(channel);
}
