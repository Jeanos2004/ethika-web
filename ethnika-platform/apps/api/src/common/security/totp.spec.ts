import { base32Decode, base32Encode, totpAt, verifyTotp, currentStep, generateTotpSecret } from "./totp";

describe("TOTP (RFC 6238)", () => {
  // Vecteur de test RFC 6238 (SHA-1) : secret ASCII « 12345678901234567890 », T = 59 s → 94287082 (8 chiffres) → 287082 (6 chiffres).
  const secret = base32Encode(Buffer.from("12345678901234567890"));

  it("respecte le vecteur de test officiel", () => {
    expect(totpAt(secret, Math.floor(59 / 30))).toBe("287082");
    expect(totpAt(secret, Math.floor(1111111109 / 30))).toBe("081804");
  });

  it("encode et décode le base32", () => {
    const buf = Buffer.from("ethnika-2fa");
    expect(base32Decode(base32Encode(buf)).toString()).toBe("ethnika-2fa");
  });

  it("accepte le code courant et refuse son rejeu", () => {
    const s = generateTotpSecret();
    const now = Date.now();
    const code = totpAt(s, currentStep(now));
    const step = verifyTotp(s, code, null, now);
    expect(step).toBe(currentStep(now));
    expect(verifyTotp(s, code, step, now)).toBeNull();
  });

  it("refuse un code mal formé ou faux", () => {
    const s = generateTotpSecret();
    expect(verifyTotp(s, "12345", null)).toBeNull();
    expect(verifyTotp(s, "abcdef", null)).toBeNull();
  });
});
