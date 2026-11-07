import { FieldCipher, sha256 } from "./crypto";

describe("FieldCipher", () => {
  const cipher = new FieldCipher("a".repeat(64));

  it("chiffre et déchiffre", () => {
    const enc = cipher.encrypt("JBSWY3DPEHPK3PXP");
    expect(enc).not.toContain("JBSWY3DP");
    expect(cipher.decrypt(enc)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("détecte une altération (GCM)", () => {
    const enc = cipher.encrypt("secret");
    const parts = enc.split(".");
    parts[3] = Buffer.from("autre").toString("base64url");
    expect(() => cipher.decrypt(parts.join("."))).toThrow();
  });

  it("refuse une clé de mauvaise taille", () => {
    expect(() => new FieldCipher("abcd")).toThrow();
  });
});

describe("sha256", () => {
  it("est déterministe", () => {
    expect(sha256("x")).toBe(sha256("x"));
    expect(sha256("x")).toHaveLength(64);
  });
});
