import { describe, expect, it } from "vitest";
import { prepareLogoFile } from "./logoFile.js";

describe("prepareLogoFile", () => {
  it("corrige automatiquement une image WebP téléchargée avec une extension PNG", async () => {
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
    ]);
    const mislabeledLogo = new File([webpHeader], "logo.png", { type: "image/png" });

    const prepared = await prepareLogoFile(mislabeledLogo);

    expect(prepared.type).toBe("image/webp");
    expect(prepared.name).toBe("logo.webp");
  });
});
