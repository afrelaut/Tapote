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
    label: "Avis · Chevalet",
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

export async function loadPilotWorkspace(client, userId) {
  const membershipResult = await client
    .from("organization_members")
    .select("organization_id,role,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  throwIf(membershipResult.error);
  if (!membershipResult.data) return null;

  const organizationId = membershipResult.data.organization_id;
  const since = new Date(Date.now() - DAY * 90).toISOString();
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

  return {
    organization: organizationResult.data,
    membership: { role: membershipResult.data.role },
    locations,
    products,
    metrics: (metricsResult.data || []).map((row) => ({
      day: row.day,
      tapoteLinkId: row.tapote_link_id,
      source: row.source,
      interactions: Number(row.interactions) || 0,
      lastInteraction: row.last_interaction,
    })),
    auditLogs: (auditResult.data || []).map((row) => ({
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
