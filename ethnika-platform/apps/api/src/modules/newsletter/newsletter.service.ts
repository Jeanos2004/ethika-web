import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ENV, type Env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { randomToken, sha256 } from "../../common/security/crypto";
import { MailService } from "../mail/mail.service";
import { newReference } from "../leads/reference";

/** Pas plus d'un e-mail de confirmation toutes les 10 minutes pour une même adresse (anti-harcèlement). */
const RESEND_MS = 10 * 60_000;

/**
 * Newsletter en double opt-in :
 * - inscription → e-mail avec lien de confirmation (jetons stockés hachés) ;
 * - réponse identique que l'adresse soit nouvelle, en attente ou déjà inscrite (pas d'énumération) ;
 * - lien de désinscription valable à tout moment.
 * Pages du site : /newsletter/confirmer et /newsletter/desinscription (action sur clic explicite).
 */
@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async subscribe(rawEmail: string, locale: "fr" | "en" = "fr") {
    const email = rawEmail.trim().toLowerCase();
    const reference = { reference: `NL-${newReference().slice(4)}` };
    const existing = await this.prisma.subscriber.findUnique({ where: { email } });
    if (existing?.confirmedAt && !existing.unsubscribedAt) return reference;
    if (existing && Date.now() - existing.createdAt.getTime() < RESEND_MS && !existing.unsubscribedAt) return reference;

    const confirm = randomToken();
    const unsubscribe = randomToken();
    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.subscriber.update({
          where: { id: existing.id },
          data: { locale, confirmTokenHash: sha256(confirm), unsubscribeTokenHash: sha256(unsubscribe), confirmedAt: null, unsubscribedAt: null, createdAt: new Date() },
        });
      } else {
        await tx.subscriber.create({ data: { email, locale, confirmTokenHash: sha256(confirm), unsubscribeTokenHash: sha256(unsubscribe) } });
      }
      await this.mail.enqueue(tx, [{ to: email, template: "newsletter_confirm", payload: { locale, confirmUrl: this.link(locale, "confirmer", confirm), unsubscribeUrl: this.link(locale, "desinscription", unsubscribe) } }]);
    });
    return reference;
  }

  async confirm(token: string) {
    const sub = await this.prisma.subscriber.findUnique({ where: { confirmTokenHash: sha256(token) } });
    if (!sub) throw new NotFoundException({ error: "token_invalid" });
    await this.prisma.subscriber.update({ where: { id: sub.id }, data: { confirmedAt: new Date(), confirmTokenHash: null, unsubscribedAt: null } });
    return { ok: true };
  }

  async unsubscribe(token: string) {
    const sub = await this.prisma.subscriber.findUnique({ where: { unsubscribeTokenHash: sha256(token) } });
    if (!sub) throw new NotFoundException({ error: "token_invalid" });
    if (!sub.unsubscribedAt) await this.prisma.subscriber.update({ where: { id: sub.id }, data: { unsubscribedAt: new Date(), confirmTokenHash: null } });
    return { ok: true };
  }

  /** Abonnés actifs (confirmés, non désinscrits) : base d'envoi des campagnes. */
  activeCount() {
    return this.prisma.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } });
  }

  private link(locale: "fr" | "en", action: "confirmer" | "desinscription", token: string) {
    return `${this.env.SITE_URL}${locale === "en" ? "/en" : ""}/newsletter/${action}?token=${encodeURIComponent(token)}`;
  }
}
