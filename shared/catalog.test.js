import { describe, expect, it } from "vitest";
import { ACTIONS, formatMoney, PILOT_PLANS, PRODUCTS } from "./catalog.js";

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
    expect(formatMoney(5900)).toContain("59");
  });
});
