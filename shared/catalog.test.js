import { describe, expect, it } from "vitest";
import {
  ACTIONS,
  calculateShipping,
  DESIGN_STYLES,
  formatMoney,
  MULTISITE_TIERS,
  PILOT_PLANS,
  PRODUCTS,
  SHIPPING,
  TARGETS,
} from "./catalog.js";

describe("catalogue Tapote", () => {
  it("propose les trois supports en version prête à l’emploi et personnalisée", () => {
    expect(PRODUCTS.plaque_standard).toMatchObject({
      baseProductId: "plaque",
      personalization: "ready",
      kind: "support",
      price: 2900,
    });
    expect(PRODUCTS.comptoir_standard).toMatchObject({
      baseProductId: "comptoir",
      personalization: "ready",
      kind: "support",
      price: 2900,
    });
    expect(PRODUCTS.carte_standard).toMatchObject({
      baseProductId: "carte",
      personalization: "ready",
      kind: "card",
      price: 1900,
    });

    expect(PRODUCTS.plaque).toMatchObject({ personalization: "custom", price: 3900 });
    expect(PRODUCTS.comptoir).toMatchObject({ personalization: "custom", price: 3900 });
    expect(PRODUCTS.carte).toMatchObject({ personalization: "custom", price: 2900 });
    expect(PRODUCTS.comptoir.name).toContain("A6");
    expect(PRODUCTS.comptoir.format).toContain("A6");
  });

  it("applique les prix et compositions exactes des packs 2 et 5", () => {
    expect(PRODUCTS.pack_duo_standard).toMatchObject({
      personalization: "ready",
      price: 5500,
      supportCount: 2,
      defaultComposition: { comptoir: 1, plaque: 1 },
    });
    expect(PRODUCTS.pack_cinq_standard).toMatchObject({
      personalization: "ready",
      price: 8900,
      supportCount: 5,
      defaultComposition: { comptoir: 2, plaque: 3 },
    });
    expect(PRODUCTS.pack_duo).toMatchObject({
      personalization: "custom",
      price: 6900,
      supportCount: 2,
      defaultComposition: { comptoir: 1, plaque: 1 },
    });
    expect(PRODUCTS.pack_cinq).toMatchObject({
      personalization: "custom",
      price: 10900,
      supportCount: 5,
      defaultComposition: { comptoir: 2, plaque: 3 },
    });
  });

  it("réserve la carte assortie à une commande de support", () => {
    expect(PRODUCTS.carte_assortie).toMatchObject({
      baseProductId: "carte",
      personalization: "matched",
      kind: "addon",
      price: 1900,
      requiresSupportOrder: true,
    });
  });

  it("offre la livraison exactement à partir de 69 €", () => {
    expect(SHIPPING).toEqual({ freeThreshold: 6900, standardPrice: 490 });
    expect(calculateShipping(6899)).toBe(490);
    expect(calculateShipping(6900)).toBe(0);
    expect(calculateShipping(PRODUCTS.pack_duo.price)).toBe(0);
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
    expect(DESIGN_STYLES.platform.name).toBe("Action");
    expect(Object.keys(TARGETS).length).toBeGreaterThanOrEqual(20);
    expect(PILOT_PLANS.pilot.price).toBe(900);
    expect(PILOT_PLANS.annual.price).toBe(8900);
    expect(formatMoney(2900)).toContain("29");
  });

  it("réserve les commandes de dix supports et plus au devis", () => {
    expect(MULTISITE_TIERS).toEqual([
      expect.objectContaining({ quantity: 10, price: null, label: "Sur devis" }),
    ]);
  });
});
