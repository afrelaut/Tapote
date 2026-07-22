import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260722014028_separate_pilot_management_access.sql", import.meta.url),
  "utf8",
);
const rpcHardeningMigration = readFileSync(
  new URL("../../supabase/migrations/20260722014338_harden_pilot_membership_rpcs.sql", import.meta.url),
  "utf8",
);
const platformPointerMigration = readFileSync(
  new URL("../../supabase/migrations/20260722015310_point_platform_to_production_management_org.sql", import.meta.url),
  "utf8",
);

function policyBlock(name, nextName) {
  const start = migration.indexOf(`create policy ${name}`);
  const end = nextName ? migration.indexOf(`drop policy if exists ${nextName}`, start) : migration.length;
  return migration.slice(start, end);
}

describe("migration de séparation Pilot / Gestion", () => {
  it("exige le profil, le rôle et le lien de commande pour lire un espace Pilot depuis Gestion", () => {
    const start = migration.indexOf("create or replace function private.can_management_access_pilot_org");
    const end = migration.indexOf("create or replace function private.is_management_storage_member", start);
    const accessFunction = migration.slice(start, end);

    expect(accessFunction).toMatch(/join public\.management_profiles/i);
    expect(accessFunction).toMatch(/memberships\.role in \('owner', 'admin', 'manager'\)/i);
    expect(accessFunction).toMatch(/join public\.management_orders/i);
    expect(accessFunction).toMatch(/orders\.pilot_organization_id = target_pilot_organization_id/i);
  });

  it("laisse Gestion consulter les liens Pilot mais jamais modifier leur destination", () => {
    expect(policyBlock("tapote_links_select", "tapote_links_update"))
      .toContain("private.can_management_access_pilot_org(organization_id)");
    expect(policyBlock("tapote_links_update", "tap_events_select"))
      .not.toContain("can_management_access_pilot_org");
  });

  it("ne mélange pas les organisations ni leurs membres entre les deux domaines", () => {
    expect(policyBlock("organizations_select", "organizations_update")).toContain("private.is_pilot_member(id)");
    expect(policyBlock("organizations_select", "organizations_update")).toContain("private.is_management_member(id)");
    expect(policyBlock("memberships_select", "memberships_insert")).not.toContain("can_management_access_pilot_org");
  });

  it("échoue fermé si un compte client possède plusieurs organisations Pilot ambiguës", () => {
    const start = migration.indexOf("create or replace function public.get_my_pilot_membership");
    const end = migration.indexOf("revoke all on function public.get_my_pilot_membership", start);
    expect(migration.slice(start, end)).toMatch(/where \(select count\(\*\) from pilot_memberships\) = 1/i);
  });

  it("expose seulement des façades RPC en sécurité invoker", () => {
    expect(rpcHardeningMigration).toMatch(/function public\.get_my_pilot_membership\(\)[\s\S]*?security invoker/i);
    expect(rpcHardeningMigration).toMatch(/function public\.get_my_management_pilot_organizations\(\)[\s\S]*?security invoker/i);
    expect(rpcHardeningMigration).not.toMatch(/security definer/i);
  });

  it("pointe le singleton vers Gestion sans absorber l'espace de démonstration", () => {
    expect(platformPointerMigration).toContain("organizations.name = 'TAPOTE Gestion'");
    expect(platformPointerMigration).not.toContain("TAPOTE · Démonstration Gestion");
    expect(platformPointerMigration).toMatch(/into strict production_management_organization_id/i);
  });
});
