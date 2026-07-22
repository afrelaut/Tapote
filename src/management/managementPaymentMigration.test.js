import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260722043000_pending_manual_order_payment.sql", import.meta.url),
  "utf8",
);

describe("sécurité de paiement des commandes Gestion", () => {
  it("crée les ventes manuelles en attente de paiement", () => {
    expect(migration).toContain("alter column status set default 'payment_pending'");
    expect(migration).toContain("alter column payment_status set default 'En attente'");
  });

  it("exige une transition explicite pour confirmer le règlement", () => {
    expect(migration).toMatch(/flow constant text\[\] := array\[[\s\S]*?'payment_pending', 'paid'/);
    expect(migration).toMatch(/when target_status = 'paid' then 'Payé'/);
  });

  it("refuse d'affecter un support Pilot à une commande non encaissée", () => {
    expect(migration).toContain("management_product_unit_payment_guard");
    expect(migration).toContain("raise exception 'order_payment_required'");
  });
});
