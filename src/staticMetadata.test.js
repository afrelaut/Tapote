import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const jsonLdSource = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1];

describe("métadonnées publiques Tapote", () => {
  it("expose la gamme, les routes et les prix actuels sans preuve sociale inventée", () => {
    expect(jsonLdSource).toBeTruthy();
    const schema = JSON.parse(jsonLdSource);
    const productList = schema["@graph"].find((entry) => entry["@type"] === "ItemList");
    const products = productList.itemListElement.map(({ item }) => item);

    expect(products.map((product) => product.offers.url)).toEqual([
      "https://tapote.fr/produits/comptoir",
      "https://tapote.fr/produits/plaque",
      "https://tapote.fr/produits/carte",
      "https://tapote.fr/boutique#packs",
      "https://tapote.fr/boutique#packs",
      "https://tapote.fr/boutique#packs",
    ]);
    expect(products.map((product) => [product.offers.lowPrice, product.offers.highPrice])).toEqual([
      ["49.00", "59.00"],
      ["29.00", "39.00"],
      ["19.00", "29.00"],
      ["79.00", "99.00"],
      ["119.00", "149.00"],
      ["179.00", "219.00"],
    ]);
    expect(products.every((product) => product.offers.availability === "https://schema.org/PreOrder")).toBe(true);
    expect(html).toContain("dès 19 €");
    expect(html).not.toContain("net de TVA");
    expect(html).not.toMatch(/AggregateRating|reviewCount|ratingValue/);
    expect(html).not.toContain("produits/chevalet#product");
  });
});
