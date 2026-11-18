import type { RenderedEmail } from "./templates";

/**
 * Envoi par l'API HTTP de Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Un échec (réseau, 4xx, 5xx) lève une erreur : la file d'e-mails réessaie avec ses délais (1 min → 12 h).
 * Le domaine de MAIL_FROM doit être vérifié dans Resend (enregistrements SPF/DKIM du DNS).
 */
export class ResendTransport {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly baseUrl = "https://api.resend.com",
  ) {}

  async send(to: string, email: RenderedEmail): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/emails`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [to], subject: email.subject, html: email.html, text: email.text }),
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      // Message d'erreur de Resend sans l'adresse du destinataire (la file masque de toute façon les e-mails).
      const detail = ((await res.json().catch(() => null)) as { name?: string; message?: string } | null) ?? {};
      throw new Error(`Resend HTTP ${res.status}${detail.name ? ` (${detail.name})` : ""}`);
    }
  }
}
