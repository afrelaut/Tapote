import { describe, expect, it, vi } from "vitest";
import { createRepository } from "./repository.js";

describe("PostgresRepository · séparation Pilot / Gestion", () => {
  it("exige un profil Gestion explicite pour lire les détails privés d’une commande", async () => {
    const repository = createRepository({
      databaseUrl: "postgres://tapote:test@localhost:5432/tapote",
      databaseSsl: false,
    });
    const query = vi.fn().mockResolvedValue({ rowCount: 0, rows: [] });
    repository.pool = { query };

    await expect(repository.getManagementOrderDetails("order-1", "user-1")).resolves.toBeNull();

    const [statement, parameters] = query.mock.calls[0];
    expect(statement).toMatch(/join platform_settings settings/i);
    expect(statement).toMatch(/settings\.management_organization_id = management\.organization_id/i);
    expect(statement).toMatch(/join management_profiles profile/i);
    expect(statement).toMatch(/profile\.user_id = membership\.user_id/i);
    expect(statement).toMatch(/membership\.role in \('owner', 'admin', 'manager'\)/i);
    expect(parameters).toEqual(["order-1", "user-1"]);
  });
});
