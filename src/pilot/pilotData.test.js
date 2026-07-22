import { describe, expect, it, vi } from "vitest";
import { loadPilotWorkspace } from "./pilotData.js";

function queryResult(data, calls, table) {
  const result = { data, error: null };
  const query = {
    select() { return query; },
    eq(field, value) { calls.push({ table, field, value }); return query; },
    order() { return query; },
    limit() { return query; },
    single() { return Promise.resolve(result); },
    maybeSingle() { return Promise.resolve(result); },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
  return query;
}

describe("séparation des espaces Pilot et Gestion", () => {
  it("charge uniquement l'organisation renvoyée par la frontière Pilot côté base", async () => {
    const calls = [];
    const dataByTable = {
      organizations: { id: "client-cafe", name: "Café Mistral" },
      locations: [],
      tapote_links: [],
      tapote_products: [],
      audit_logs: [],
    };
    const client = {
      from: vi.fn((table) => queryResult(dataByTable[table], calls, table)),
      rpc: vi.fn(async (name) => name === "get_my_pilot_membership"
        ? { data: [{ organization_id: "client-cafe", role: "owner" }], error: null }
        : { data: [], error: null }),
    };

    const workspace = await loadPilotWorkspace(client);

    expect(client.rpc).toHaveBeenCalledWith("get_my_pilot_membership");
    expect(workspace.organization.name).toBe("Café Mistral");
    expect(workspace.membership.accessScope).toBe("pilot");
    expect(calls.filter((call) => call.field === "organization_id").every((call) => call.value === "client-cafe")).toBe(true);
  });

  it("échoue fermé quand les RPC répondent sans espace Pilot autorisé", async () => {
    const client = {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
      rpc: vi.fn(async () => ({ data: [], error: null })),
    };

    const workspace = await loadPilotWorkspace(client);

    expect(workspace).toBeNull();
    expect(client.auth.getUser).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("donne à Gestion uniquement les espaces Pilot liés à ses commandes", async () => {
    const calls = [];
    const dataByTable = {
      organizations: { id: "client-hotel", name: "Hôtel Rivage" },
      locations: [],
      tapote_links: [],
      tapote_products: [],
      audit_logs: [],
    };
    const managementOrganizations = [
      { organization_id: "client-cafe", organization_name: "Café Mistral", role: "owner" },
      { organization_id: "client-hotel", organization_name: "Hôtel Rivage", role: "owner" },
    ];
    const client = {
      auth: { getUser: vi.fn() },
      from: vi.fn((table) => queryResult(dataByTable[table], calls, table)),
      rpc: vi.fn(async (name) => {
        if (name === "get_my_pilot_membership") return { data: [], error: null };
        if (name === "get_my_management_pilot_organizations") return { data: managementOrganizations, error: null };
        return { data: [], error: null };
      }),
    };

    const workspace = await loadPilotWorkspace(client, { organizationId: "client-hotel" });

    expect(workspace.organization).toEqual({ id: "client-hotel", name: "Hôtel Rivage" });
    expect(workspace.membership).toEqual({ role: "owner", accessScope: "management" });
    expect(workspace.availableOrganizations).toEqual([
      { id: "client-cafe", name: "Café Mistral" },
      { id: "client-hotel", name: "Hôtel Rivage" },
    ]);
    expect(client.from).not.toHaveBeenCalledWith("management_profiles");
    expect(calls.filter((call) => call.field === "organization_id").every((call) => call.value === "client-hotel")).toBe(true);
  });

  it("utilise temporairement les tables RLS quand le RPC Pilot n'est pas encore déployé", async () => {
    const calls = [];
    const dataByTable = {
      organization_members: [
        { organization_id: "management-org", role: "owner", created_at: "2026-01-01" },
        { organization_id: "client-cafe", role: "admin", created_at: "2026-02-01" },
      ],
      management_profiles: [{ organization_id: "management-org" }],
      organizations: { id: "client-cafe", name: "Café Mistral" },
      locations: [],
      tapote_links: [],
      tapote_products: [],
      audit_logs: [],
    };
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      from: vi.fn((table) => queryResult(dataByTable[table], calls, table)),
      rpc: vi.fn(async (name) => name === "get_pilot_dashboard"
        ? { data: [], error: null }
        : {
          data: null,
          error: {
            code: "PGRST202",
            message: `Could not find ${name} in the schema cache`,
          },
        }),
    };

    const workspace = await loadPilotWorkspace(client);

    expect(client.auth.getUser).toHaveBeenCalledOnce();
    expect(client.from).toHaveBeenCalledWith("organization_members");
    expect(client.from).toHaveBeenCalledWith("management_profiles");
    expect(workspace.organization).toEqual({ id: "client-cafe", name: "Café Mistral" });
    expect(workspace.membership.role).toBe("admin");
    expect(workspace.membership.accessScope).toBe("pilot");
    expect(calls.filter((call) => call.field === "organization_id").every((call) => call.value === "client-cafe")).toBe(true);
  });

  it("n'infère jamais l'accès Gestion depuis les anciennes tables client", async () => {
    const calls = [];
    const dataByTable = {
      organization_members: [{ organization_id: "management-org", role: "owner" }],
      management_profiles: [{ organization_id: "management-org" }],
      organizations: { id: "management-org", name: "TAPOTE Gestion" },
      locations: [],
      tapote_links: [],
      tapote_products: [],
      audit_logs: [],
    };
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "manager-1" } }, error: null })) },
      from: vi.fn((table) => queryResult(dataByTable[table], calls, table)),
      rpc: vi.fn(async (name) => name === "get_my_pilot_membership"
        ? { data: null, error: { code: "PGRST202", message: "Function missing from schema cache" } }
        : { data: [], error: null }),
    };

    const workspace = await loadPilotWorkspace(client);

    expect(workspace).toBeNull();
    expect(calls.some((call) => call.table === "organizations")).toBe(false);
  });

  it("n'accorde jamais l'override Gestion sans rôle opérationnel explicite", async () => {
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "pilot-1" } }, error: null })) },
      from: vi.fn((table) => queryResult(table === "organization_members"
        ? [{ organization_id: "management-org", role: "viewer" }]
        : table === "management_profiles" ? [{ organization_id: "management-org" }] : [], [], table)),
      rpc: vi.fn(async () => ({ data: [], error: null })),
    };

    await expect(loadPilotWorkspace(client)).resolves.toBeNull();
  });

  it("ne contourne jamais une erreur RPC d'authentification ou de permission", async () => {
    const forbidden = { code: "42501", message: "permission denied" };
    const client = {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
      rpc: vi.fn(async () => ({ data: null, error: forbidden })),
    };

    await expect(loadPilotWorkspace(client)).rejects.toBe(forbidden);
    expect(client.auth.getUser).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("échoue fermé si plusieurs espaces Pilot restent ambigus dans le fallback", async () => {
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      from: vi.fn((table) => queryResult(table === "organization_members"
        ? [
          { organization_id: "client-a", role: "owner" },
          { organization_id: "client-b", role: "owner" },
        ]
        : [], [], table)),
      rpc: vi.fn(async (name) => ({
        data: null,
        error: { code: "PGRST202", message: `Could not find ${name} in the schema cache` },
      })),
    };

    await expect(loadPilotWorkspace(client)).resolves.toBeNull();
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("refuse un espace demandé qui ne figure pas dans les liens Gestion", async () => {
    const client = {
      from: vi.fn(),
      rpc: vi.fn(async (name) => name === "get_my_pilot_membership"
        ? { data: [], error: null }
        : {
          data: [{ organization_id: "client-cafe", organization_name: "Café Mistral", role: "owner" }],
          error: null,
        }),
    };

    await expect(loadPilotWorkspace(client, { organizationId: "client-secret" })).resolves.toBeNull();
    expect(client.from).not.toHaveBeenCalled();
  });
});
