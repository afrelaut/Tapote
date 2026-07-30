import { PRODUCTS } from "../../shared/catalog.js";

const DAY = 86_400_000;

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function buildDemoMetrics(products) {
  const rows = [];
  const today = new Date();
  today.setUTCMinutes(0, 0, 0);
  for (let offset = 89; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * DAY);
    products.forEach((product, index) => {
      const pulse = (offset * (index + 3) + index * 11) % 9;
      const interactions = Math.max(0, 8 - pulse + index * 2 + (offset % 7 === 0 ? 5 : 0));
      if (!interactions) return;
      const nfc = Math.max(1, Math.round(interactions * 0.72));
      rows.push({
        day: isoDay(day),
        tapoteLinkId: product.linkId,
        source: "nfc",
        interactions: nfc,
        lastInteraction: day.toISOString(),
      });
      if (interactions - nfc > 0) {
        rows.push({
          day: isoDay(day),
          tapoteLinkId: product.linkId,
          source: "qr",
          interactions: interactions - nfc,
          lastInteraction: day.toISOString(),
        });
      }
    });
  }
  return rows;
}

const demoProducts = [
  {
    id: "demo-product-1",
    organizationId: "demo-org",
    locationId: "demo-location-1",
    locationName: "Café Mistral · République",
    linkId: "demo-link-1",
    productType: "comptoir",
    actionId: "avis",
    label: "Avis · Comptoir",
    serialNumber: "TAP-MISTRAL-001",
    status: "active",
    targetUrl: "https://example.com/avis-mistral",
    shortCode: "a6cafe0001",
    linkActive: true,
    createdAt: "2026-06-02T09:00:00.000Z",
  },
  {
    id: "demo-product-2",
    organizationId: "demo-org",
    locationId: "demo-location-1",
    locationName: "Café Mistral · République",
    linkId: "demo-link-2",
    productType: "plaque",
    actionId: "menu",
    label: "Menu · Salle",
    serialNumber: "TAP-MISTRAL-002",
    status: "active",
    targetUrl: "https://example.com/menu-mistral",
    shortCode: "a6cafe0002",
    linkActive: true,
    createdAt: "2026-06-02T09:05:00.000Z",
  },
  {
    id: "demo-product-3",
    organizationId: "demo-org",
    locationId: "demo-location-2",
    locationName: "Café Mistral · Bastille",
    linkId: "demo-link-3",
    productType: "plaque",
    actionId: "instagram",
    label: "Instagram · Plaque",
    serialNumber: "TAP-MISTRAL-003",
    status: "active",
    targetUrl: "https://example.com/mistral-social",
    shortCode: "a6cafe0003",
    linkActive: true,
    createdAt: "2026-06-19T11:00:00.000Z",
  },
];

export function createDemoWorkspace() {
  return {
    organization: { id: "demo-org", name: "Café Mistral" },
    membership: { role: "owner" },
    // Le changement de destination relève de Tapote Pilot Pro. La bêta et la
    // démonstration tournent sur ce niveau : aucun compte existant ne perd la
    // main sur ses liens tant que la facturation Pro n'est pas branchée.
    plan: "pro",
    locations: [
      { id: "demo-location-1", name: "Café Mistral · République" },
      { id: "demo-location-2", name: "Café Mistral · Bastille" },
    ],
    products: demoProducts.map((product) => ({ ...product })),
    metrics: buildDemoMetrics(demoProducts),
    auditLogs: [
      {
        id: 3,
        action: "tapote_link.updated",
        entityId: "demo-link-2",
        createdAt: new Date(Date.now() - DAY * 2).toISOString(),
        changes: { target_url: { from: "https://example.com/menu-printemps", to: "https://example.com/menu-mistral" } },
      },
      {
        id: 2,
        action: "tapote_link.updated",
        entityId: "demo-link-1",
        createdAt: new Date(Date.now() - DAY * 12).toISOString(),
        changes: { target_url: { from: "https://example.com/avis", to: "https://example.com/avis-mistral" } },
      },
    ],
  };
}

function throwIf(error) {
  if (error) throw error;
}

function isMissingMembershipRpc(error) {
  if (!error) return false;
  if (["PGRST202", "42883"].includes(error.code)) return true;
  const message = `${error.message || ""} ${error.details || ""}`.toLowerCase();
  return message.includes("get_my_pilot_membership")
    && (message.includes("could not find") || message.includes("does not exist") || message.includes("schema cache"));
}

function isMissingManagementOrganizationsRpc(error) {
  if (!error) return false;
  if (["PGRST202", "42883"].includes(error.code)) return true;
  const message = `${error.message || ""} ${error.details || ""}`.toLowerCase();
  return message.includes("get_my_management_pilot_organizations")
    && (message.includes("could not find") || message.includes("does not exist") || message.includes("schema cache"));
}

async function loadLegacyPilotMembership(client) {
  const userResult = await client.auth.getUser();
  throwIf(userResult.error);
  const userId = userResult.data?.user?.id;
  if (!userId) return null;

  const [membershipsResult, managementProfilesResult] = await Promise.all([
    client
      .from("organization_members")
      .select("organization_id,role,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    client
      .from("management_profiles")
      .select("organization_id")
      .eq("user_id", userId),
  ]);
  throwIf(membershipsResult.error);
  throwIf(managementProfilesResult.error);

  const managementOrganizationIds = new Set(
    (managementProfilesResult.data || []).map((profile) => profile.organization_id),
  );
  const pilotMemberships = (membershipsResult.data || []).filter(
    (membership) => !managementOrganizationIds.has(membership.organization_id),
  );
  // Compatibility path for projects where the new RPC has not reached the
  // schema cache yet. It may resolve a real Pilot membership only; it must
  // never manufacture Gestion access from client-visible membership tables.
  if (pilotMemberships.length === 1) return { ...pilotMemberships[0], access_scope: "pilot" };
  return null;
}

async function loadManagementPilotMembership(client, requestedOrganizationId) {
  const result = await client.rpc("get_my_management_pilot_organizations");
  if (result.error) {
    if (isMissingManagementOrganizationsRpc(result.error)) {
      return { rpcMissing: true, membership: null };
    }
    throw result.error;
  }
  const organizations = result.data || [];
  if (!organizations.length) return { rpcMissing: false, membership: null };
  const selected = requestedOrganizationId
    ? organizations.find((organization) => organization.organization_id === requestedOrganizationId)
    : organizations[0];
  if (!selected) return { rpcMissing: false, membership: null };
  return {
    rpcMissing: false,
    membership: {
      organization_id: selected.organization_id,
      role: selected.role,
      access_scope: "management",
      available_organizations: organizations.map((organization) => ({
        id: organization.organization_id,
        name: organization.organization_name,
      })),
    },
  };
}

async function loadPilotMembership(client, requestedOrganizationId) {
  const membershipResult = await client.rpc("get_my_pilot_membership");
  if (!membershipResult.error && membershipResult.data?.[0]) {
    return { ...membershipResult.data[0], access_scope: "pilot" };
  }
  if (!membershipResult.error) {
    const managementResult = await loadManagementPilotMembership(client, requestedOrganizationId);
    return managementResult.membership;
  }
  if (!isMissingMembershipRpc(membershipResult.error)) throw membershipResult.error;
  const managementResult = await loadManagementPilotMembership(client, requestedOrganizationId);
  if (managementResult.membership) return managementResult.membership;
  if (!managementResult.rpcMissing) return null;
  return loadLegacyPilotMembership(client);
}

export async function loadPilotWorkspace(client, options = {}) {
  const membership = await loadPilotMembership(client, options.organizationId);
  if (!membership) return null;

  const organizationId = membership.organization_id;
  // The 90-day comparison needs the preceding 90 days as its baseline.
  const since = new Date(Date.now() - DAY * 180).toISOString();
  const [organizationResult, locationsResult, linksResult, productsResult, metricsResult, auditResult] = await Promise.all([
    client.from("organizations").select("id,name").eq("id", organizationId).single(),
    client.from("locations").select("id,name,address,timezone").eq("organization_id", organizationId).order("name"),
    client.from("tapote_links").select("id,location_id,label,target_url,active,short_code,updated_at").eq("organization_id", organizationId),
    client.from("tapote_products").select("id,organization_id,location_id,tapote_link_id,product_type,action_id,label,serial_number,status,activated_at,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    client.rpc("get_pilot_dashboard", { p_organization_id: organizationId, p_since: since }),
    client.from("audit_logs").select("id,action,entity_id,changes,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  [organizationResult, locationsResult, linksResult, productsResult, metricsResult, auditResult].forEach((result) => throwIf(result.error));
  const locations = locationsResult.data || [];
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const linksById = new Map((linksResult.data || []).map((link) => [link.id, link]));
  const products = (productsResult.data || []).map((product) => {
    const link = linksById.get(product.tapote_link_id);
    return {
      id: product.id,
      organizationId: product.organization_id,
      locationId: product.location_id,
      locationName: locationsById.get(product.location_id)?.name || "Sans établissement",
      linkId: product.tapote_link_id,
      productType: product.product_type,
      actionId: product.action_id,
      label: product.label,
      serialNumber: product.serial_number,
      status: product.status,
      targetUrl: link?.target_url || "",
      shortCode: link?.short_code || "",
      linkActive: Boolean(link?.active),
      createdAt: product.created_at,
    };
  });

  const visibleLinkIds = new Set(products.map((product) => product.linkId));
  return {
    organization: organizationResult.data,
    membership: { role: membership.role, accessScope: membership.access_scope || "pilot" },
    plan: membership.plan || "pro",
    availableOrganizations: membership.available_organizations || [],
    locations,
    products,
    metrics: (metricsResult.data || []).map((row) => ({
      day: row.day,
      tapoteLinkId: row.tapote_link_id,
      source: row.source,
      interactions: Number(row.interactions) || 0,
      lastInteraction: row.last_interaction,
    })),
    auditLogs: (auditResult.data || []).filter((row) => visibleLinkIds.has(row.entity_id)).map((row) => ({
      id: row.id,
      action: row.action,
      entityId: row.entity_id,
      changes: row.changes,
      createdAt: row.created_at,
    })),
  };
}

export async function updatePilotDestination(client, linkId, targetUrl) {
  const parsed = new URL(targetUrl.trim());
  if (parsed.protocol !== "https:" || targetUrl.length > 500) throw new Error("Indique une URL HTTPS valide.");
  const result = await client
    .from("tapote_links")
    .update({ target_url: parsed.href })
    .eq("id", linkId)
    .select("id,target_url,updated_at")
    .single();
  throwIf(result.error);
  return result.data;
}

export function productName(productType) {
  return PRODUCTS[productType]?.name || "Produit Tapote";
}
