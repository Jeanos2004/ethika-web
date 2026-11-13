import { ResendTransport } from "./resend.transport";

const email = { subject: "Nous avons bien reçu votre demande ETH-ABC234", html: "<p>Bonjour</p>", text: "Bonjour" };

describe("ResendTransport", () => {
  it("envoie au format de l'API Resend, avec la clé en Bearer", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: "re_123" }), { status: 200 });
    }) as unknown as typeof fetch;
    await new ResendTransport("re_test_key", "ETHNIKA <contact@ethnikatour.com>", fetchImpl).send("aminata@example.com", email);
    expect(calls[0]!.url).toBe("https://api.resend.com/emails");
    expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ from: "ETHNIKA <contact@ethnikatour.com>", to: ["aminata@example.com"], subject: email.subject, html: email.html, text: email.text });
    expect(calls[0]!.init.redirect).toBe("error");
  });

  it("lève une erreur exploitable (sans l'adresse) pour que la file réessaie", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ name: "validation_error", message: "The aminata@example.com address is invalid" }), { status: 422 })) as unknown as typeof fetch;
    const err = await new ResendTransport("k", "ETHNIKA <x@y.z>", fetchImpl).send("aminata@example.com", email).catch((e: Error) => e);
    expect((err as Error).message).toBe("Resend HTTP 422 (validation_error)");
  });
});
