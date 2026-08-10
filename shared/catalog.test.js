import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACTIONS,
  calculateProductPrice,
  calculateShipping,
  formatMoney,
  LAUNCH_OFFER,
  MULTISITE_TIERS,
  PILOT_PLANS,
  PRODUCT_OPTIONS,
  PRODUCTS,
  PUBLIC_PRODUCT_IDS,
  SHIPPING,
  TARGETS,
} from "./catalog.js";

describe("catalogue Tapote", () => {
  it("publie les trois formats et les trois packs dans les deux finitions", () => {
    expect(PUBLIC_PRODUCT_IDS).toEqual([
      "chevalet_pret",
      "chevalet_personnalise",
      "plaque_prete",
      "plaque_personnalisee",
      "carte_prete",
      "carte_personnalisee",
      "pack_essentiel_pret",
      "pack_essentiel",
      "pack_comptoir_pret",
      "pack_comptoir",
      "pack_equipe_pret",
      "pack_equipe",
    ]);
    expect(PUBLIC_PRODUCT_IDS.map((id) => [id, PRODUCTS[id].price, PRODUCTS[id].defaultComposition])).toEqual([
      ["chevalet_pret", 4900, { comptoir: 1, plaque: 0, carte: 0 }],
      ["chevalet_personnalise", 5900, { comptoir: 1, plaque: 0, carte: 0 }],
      ["plaque_prete", 2900, { comptoir: 0, plaque: 1, carte: 0 }],
      ["plaque_personnalisee", 3900, { comptoir: 0, plaque: 1, carte: 0 }],
      ["carte_prete", 1900, { comptoir: 0, plaque: 0, carte: 1 }],
      ["carte_personnalisee", 2900, { comptoir: 0, plaque: 0, carte: 1 }],
      ["pack_essentiel_pret", 7900, { comptoir: 1, plaque: 1, carte: 1 }],
      ["pack_essentiel", 9900, { comptoir: 1, plaque: 1, carte: 1 }],
      ["pack_comptoir_pret", 11900, { comptoir: 2, plaque: 1, carte: 1 }],
      ["pack_comptoir", 14900, { comptoir: 2, plaque: 1, carte: 1 }],
      ["pack_equipe_pret", 17900, { comptoir: 2, plaque: 2, carte: 3 }],
      ["pack_equipe", 21900, { comptoir: 2, plaque: 2, carte: 3 }],
    ]);
  });

  it("calcule les options uniquement en centimes côté source de vérité", () => {
    expect(PRODUCT_OPTIONS).toEqual({
      ready: { additionalStand: 4000, additionalPlaque: 2000, additionalCard: 1500 },
      custom: { additionalStand: 5000, additionalPlaque: 3000, additionalCard: 2000 },
    });
    expect(calculateProductPrice("carte_prete", { comptoir: 0, plaque: 0, carte: 1 })).toBe(1900);
    expect(calculateProductPrice("carte_personnalisee", { comptoir: 0, plaque: 0, carte: 3 })).toBe(6900);
    expect(calculateProductPrice("pack_comptoir_pret", { comptoir: 3, plaque: 1, carte: 1 })).toBe(15900);
    expect(calculateProductPrice("pack_comptoir", { comptoir: 3, plaque: 1, carte: 1 })).toBe(19900);
    expect(calculateProductPrice("pack_comptoir", { comptoir: 1, plaque: 1, carte: 1 })).toBeNull();
    expect(calculateProductPrice("chevalet_personnalise", { comptoir: 1, plaque: 1, carte: 0 })).toBeNull();
  });

  it("conserve toutes les anciennes références hors ligne pour l’historique", () => {
    const retired = ["pack_duo", "pack_duo_standard", "carte_standard", "plaque", "plaque_standard", "comptoir", "comptoir_standard", "pack_cinq", "pack_cinq_standard", "carte_assortie"];
    retired.forEach((id) => expect(PRODUCTS[id]).toMatchObject({ online: false, public: false }));
    retired.forEach((id) => expect(PUBLIC_PRODUCT_IDS).not.toContain(id));
  });

  it("centralise la limite de l’offre de lancement", () => {
    expect(LAUNCH_OFFER).toEqual({ maximumBusinesses: 50, endsOn: "2026-09-30", rule: "first_limit_reached" });
  });

  it("offre la livraison exactement à partir de 69 €", () => {
    expect(SHIPPING).toEqual({ freeThreshold: 6900, standardPrice: 490 });
    expect(calculateShipping(6899)).toBe(490);
    expect(calculateShipping(6900)).toBe(0);
    expect(calculateShipping(PRODUCTS.chevalet_pret.price)).toBe(490);
    expect(calculateShipping(PRODUCTS.pack_essentiel.price)).toBe(0);
  });

  it("n’expose aucun produit Vitrine dans le catalogue actif", () => {
    expect(PRODUCTS).not.toHaveProperty("sticker");
    expect(PRODUCTS).not.toHaveProperty("vitrine");
    expect(Object.values(PRODUCTS).some((product) => /vitrine/i.test(product.name))).toBe(false);
  });

  it("garde tous les prix actifs en centimes entiers positifs", () => {
    for (const product of Object.values(PRODUCTS)) {
      expect(Number.isInteger(product.price)).toBe(true);
      expect(product.price).toBeGreaterThan(0);
    }
  });

  it("couvre les actions, secteurs et l’option Pilot annoncés", () => {
    expect(ACTIONS.avis.name).toBe("Avis Google");
    expect(ACTIONS.instagram.category).toBe("relation");
    expect(Object.keys(TARGETS).length).toBeGreaterThanOrEqual(20);
    expect(PILOT_PLANS.pilotPro).toMatchObject({ name: "Tapote Pilot Pro", price: 900 });
    expect(PILOT_PLANS.pilotProAnnual).toMatchObject({ name: "Tapote Pilot Pro annuel", price: 8900 });
    expect(formatMoney(2900)).toContain("29");
  });

  it("réserve les commandes de dix supports et plus au devis", () => {
    expect(MULTISITE_TIERS).toEqual([
      expect.objectContaining({ quantity: 10, price: null, label: "Sur devis" }),
    ]);
  });

  it("garde la migration Supabase alignée avec le catalogue public", () => {
    const migration = readFileSync(
      new URL("../supabase/migrations/20260809211444_align_launch_pricing_catalog.sql", import.meta.url),
      "utf8",
    );
    const insertBlock = migration.match(
      /insert into tapote_launch_catalog[\s\S]*?;\r?\n/,
    )?.[0];

    expect(insertBlock).toBeTruthy();
    for (const productId of PUBLIC_PRODUCT_IDS) {
      const productLine = insertBlock
        .split(/\r?\n/)
        .find((line) => line.includes(`('${productId}',`));
      expect(productLine, `${productId} doit exister dans la migration`).toBeTruthy();
      expect(productLine).toContain(`, ${PRODUCTS[productId].price},`);
    }

    for (const retiredId of [
      "pack_duo",
      "pack_duo_standard",
      "carte_standard",
      "plaque",
      "plaque_standard",
      "comptoir",
      "comptoir_standard",
    ]) {
      expect(insertBlock).not.toContain(`('${retiredId}',`);
    }

    expect(migration).toContain("item.customization -> 'supportComposition' ->> 'comptoir'");
    expect(migration).toContain("item.customization -> 'supportComposition' ->> 'plaque'");
    expect(migration).toContain("item.customization -> 'supportComposition' ->> 'carte'");
  });
});
