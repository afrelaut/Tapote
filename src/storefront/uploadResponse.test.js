import { describe, expect, it } from "vitest";
import { friendlyUploadError, readUploadPayload } from "./uploadResponse.js";

describe("uploadResponse", () => {
  it("remplace une réponse vide par un message produit compréhensible", async () => {
    const message = "Le logo est visible, mais son envoi n’a pas abouti.";
    const response = new Response("", { status: 502 });

    await expect(readUploadPayload(response, message)).rejects.toThrow(message);
  });

  it("ne présente jamais une erreur JSON brute au client", () => {
    const error = new SyntaxError("Unexpected end of JSON input");
    expect(friendlyUploadError(error, "Le logo")).toBe(
      "Le logo est bien visible dans l’aperçu, mais son envoi sécurisé est momentanément indisponible.",
    );
  });
});
