import { describe, expect, it } from "vitest";
import { ACTIONS, calculateShipping, DESIGN_STYLES, formatMoney, MULTISITE_TIERS, PILOT_PLANS, PRODUCTS, TARGETS } from "./catalog.js";

describe("catalogue Tapote", () => {
  it("contient le chevalet A6 réel et ses déclinaisons", () => {
    expect(PRODUCTS.comptoir.name).toContain("A6");
    expect(PRODUCTS.comptoir.format).toContain("105 × 148");
    expect(PRODUCTS.table6.price).toBe(13900);
  });

  it("garde des prix entiers en centimes", () => {
    for (const product of Object.values(PRODUCTS)) {
      expect(Number.isInteger(product.price)).toBe(true);
      expect(product.price).toBeGreaterThan(0);
    }
  });

  it("propose les actions et plans Pilot attendus", () => {
    expect(ACTIONS.avis.name).toBe("Avis Google");
    expect(ACTIONS.reservation.name).toBe("Réservation");
    expect(PILOT_PLANS.pilot.price).toBe(900);
    expect(PILOT_PLANS.annual.price).toBe(8900);
    expect(formatMoney(5900)).toContain("59");
  });

  it("couvre les nouveaux supports et scénarios métier", () => {
    expect(PRODUCTS.plaque.price).toBe(3900);
    expect(PRODUCTS.mini.format).toContain("80 × 80");
    expect(Object.keys(TARGETS)).toHaveLength(8);
    expect(ACTIONS.instagram.category).toBe("relation");
    expect(DESIGN_STYLES.platform.name).toBe("Action");
  });

  it("applique la gamme de packs et la livraison validées", () => {
    expect(PRODUCTS.pack_essentiel.price).toBe(5900);
    expect(PRODUCTS.pack_commerce.price).toBe(13900);
    expect(PRODUCTS.pack_resto.price).toBe(18900);
    expect(PRODUCTS.pack_salon.price).toBe(10900);
    expect(PRODUCTS.pack_equipe.price).toBeLessThan(PRODUCTS.pack_equipe.value);
    expect(PRODUCTS.sticker.price).toBe(2990);
    expect(calculateShipping(5899)).toBe(490);
    expect(calculateShipping(5900)).toBe(0);
  });

  it("garde un prix unitaire multi-sites strictement décroissant", () => {
    const unitPrices = MULTISITE_TIERS.map((tier) => tier.price / tier.quantity);
    expect(unitPrices[0]).toBeGreaterThan(unitPrices[1]);
    expect(unitPrices[1]).toBeGreaterThan(unitPrices[2]);
  });
});
