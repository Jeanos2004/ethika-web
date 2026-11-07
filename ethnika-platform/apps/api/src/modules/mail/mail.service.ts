import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { ENV, type Env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { templates, type AckPayload, type AgencyPayload, type RenderedEmail, type TemplateName } from "./templates";

type Payloads = { ack: AckPayload; agency: AgencyPayload };
export type OutboxItem = { [K in TemplateName]: { to: string; template: K; payload: Payloads[K] } }[TemplateName];

/** Envoi effectif : SMTP en production, journal (sans contenu) en développement. */
export interface MailTransport {
  send(to: string, email: RenderedEmail): Promise<void>;
}

/** Délais entre tentatives : 1 min, 5 min, 30 min, 2 h, 12 h, puis abandon (statut failed, visible pour l'équipe). */
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3600_000, 12 * 3600_000];
const POLL_MS = 15_000;
const BATCH = 20;

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("Mail");
  private timer?: NodeJS.Timeout;
  private running = false;
  private transport?: Promise<MailTransport>;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Ajoute des e-mails à la file, dans la transaction de l'appelant (aucun e-mail perdu, aucun envoi fantôme). */
  enqueue(tx: Prisma.TransactionClient, items: OutboxItem[]) {
    if (!items.length) return Promise.resolve();
    return tx.emailOutbox.createMany({ data: items.map((i) => ({ to: i.to, template: i.template, payload: i.payload as unknown as Prisma.InputJsonValue })) });
  }

  onModuleInit() {
    if (this.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.processBatch(), POLL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Traite les e-mails dus. Public pour les tests et un éventuel déclenchement manuel. */
  async processBatch(now = new Date()): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    let sent = 0;
    try {
      const due = await this.prisma.emailOutbox.findMany({ where: { status: "pending", nextAttemptAt: { lte: now } }, orderBy: { createdAt: "asc" }, take: BATCH });
      const transport = await this.getTransport();
      for (const item of due) {
        // Réservation optimiste : une seule instance traite chaque e-mail.
        const claimed = await this.prisma.emailOutbox.updateMany({ where: { id: item.id, attempts: item.attempts, status: "pending" }, data: { attempts: { increment: 1 } } });
        if (claimed.count === 0) continue;
        try {
          const render = templates[item.template as TemplateName] as (p: unknown) => RenderedEmail;
          if (!render) throw new Error(`gabarit inconnu : ${item.template}`);
          await transport.send(item.to, render(item.payload));
          await this.prisma.emailOutbox.update({ where: { id: item.id }, data: { status: "sent", sentAt: new Date(), lastError: null } });
          sent++;
        } catch (e) {
          const attempt = item.attempts + 1;
          const delay = BACKOFF_MS[attempt - 1];
          await this.prisma.emailOutbox.update({
            where: { id: item.id },
            data: delay ? { nextAttemptAt: new Date(Date.now() + delay), lastError: errorText(e) } : { status: "failed", lastError: errorText(e) },
          });
          this.logger.warn(`e-mail ${item.template} ${item.id} : échec ${attempt}${delay ? ", nouvel essai prévu" : ", abandonné"}`);
        }
      }
    } finally {
      this.running = false;
    }
    return sent;
  }

  private getTransport(): Promise<MailTransport> {
    this.transport ??= this.createTransport();
    return this.transport;
  }

  private async createTransport(): Promise<MailTransport> {
    if (!this.env.SMTP_URL) {
      const logger = this.logger;
      return {
        async send(_to, email) {
          // Développement : aucune adresse ni contenu journalisé.
          logger.log(`[sans SMTP] e-mail non envoyé : « ${email.subject.replace(/ETH-[A-Z0-9]+/, "ETH-…")} »`);
        },
      };
    }
    const nodemailer = await import("nodemailer");
    const smtp = nodemailer.createTransport(this.env.SMTP_URL);
    const from = this.env.MAIL_FROM;
    return {
      async send(to, email) {
        await smtp.sendMail({ from, to, subject: email.subject, html: email.html, text: email.text });
      },
    };
  }
}

function errorText(e: unknown) {
  return (e instanceof Error ? e.message : "erreur inconnue").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "<email>").slice(0, 500);
}
