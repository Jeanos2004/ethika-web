import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { durationBucket, type CircuitInput, type OfferInput } from "./content.schemas";

type Locale = "fr" | "en";
type I18n<T> = { fr: T; en?: Partial<T> };

/** Textes dans la langue demandée : l'anglais complète le français champ par champ (repli si non traduit). */
export function localize<T extends object>(i18n: unknown, locale: Locale): T {
  const v = i18n as I18n<T>;
  if (locale === "fr" || !v.en) return v.fr;
  const merged = { ...v.fr } as Record<string, unknown>;
  for (const [k, value] of Object.entries(v.en)) {
    if (value !== undefined && !(Array.isArray(value) && value.length === 0)) merged[k] = value;
  }
  return merged as T;
}

/** BigInt n'est pas sérialisable en JSON : montants renvoyés en chaîne. */
function money(v: bigint | null) {
  return v === null ? null : v.toString();
}

/**
 * Offres et circuits : administration (brouillons compris) et lecture publique (publiés uniquement, localisés)
 * pour le site, qui les affichera à la place des contenus statiques une fois branché à l'API.
 */
@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /* ---------- Offres ---------- */

  async listOffers() {
    const rows = await this.prisma.offer.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
    return rows.map((o) => ({ ...o, priceAmount: money(o.priceAmount) }));
  }

  async publicOffers(locale: Locale) {
    const today = new Date(new Date().toISOString().slice(0, 10));
    const rows = await this.prisma.offer.findMany({
      where: { published: true, OR: [{ validUntil: null }, { validUntil: { gte: today } }] },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    return rows.map((o) => ({
      slug: o.slug,
      type: o.type,
      href: o.href,
      image: o.imageUrl,
      price: money(o.priceAmount),
      currency: o.currency,
      validUntil: o.validUntil?.toISOString().slice(0, 10) ?? null,
      ...localize<{ kicker: string; title: string; description: string; imageAlt: string }>(o.i18n, locale),
    }));
  }

  async createOffer(input: OfferInput, actorId: string) {
    const offer = await this.unique(() =>
      this.prisma.offer.create({ data: { ...this.offerData(input), slug: input.slug, type: input.type, i18n: input.i18n as Prisma.InputJsonValue, imageUrl: input.imageUrl, href: input.href } }),
    );
    await this.audit.log("content.created", { actorId, target: `offer:${offer.slug}` });
    return { ...offer, priceAmount: money(offer.priceAmount) };
  }

  async updateOffer(id: string, input: Partial<OfferInput>, actorId: string) {
    await this.exists("offer", id);
    const offer = await this.unique(() =>
      this.prisma.offer.update({
        where: { id },
        data: { ...this.offerData(input), ...(input.slug && { slug: input.slug }), ...(input.type && { type: input.type }), ...(input.i18n && { i18n: input.i18n as Prisma.InputJsonValue }), ...(input.imageUrl && { imageUrl: input.imageUrl }), ...(input.href && { href: input.href }) },
      }),
    );
    await this.audit.log("content.updated", { actorId, target: `offer:${offer.slug}`, meta: { fields: Object.keys(input) } });
    return { ...offer, priceAmount: money(offer.priceAmount) };
  }

  async deleteOffer(id: string, actorId: string) {
    await this.exists("offer", id);
    const offer = await this.prisma.offer.delete({ where: { id } });
    await this.audit.log("content.deleted", { actorId, target: `offer:${offer.slug}` });
    return { ok: true };
  }

  private offerData(input: Partial<OfferInput>) {
    return {
      ...(input.priceAmount !== undefined && { priceAmount: input.priceAmount === null ? null : BigInt(input.priceAmount) }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.validUntil !== undefined && { validUntil: input.validUntil ? new Date(`${input.validUntil}T00:00:00Z`) : null }),
      ...(input.published !== undefined && { published: input.published }),
      ...(input.position !== undefined && { position: input.position }),
    };
  }

  /* ---------- Circuits ---------- */

  async listCircuits() {
    const rows = await this.prisma.circuit.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
    return rows.map((c) => ({ ...c, priceFrom: money(c.priceFrom) }));
  }

  async publicCircuits(locale: Locale) {
    const rows = await this.prisma.circuit.findMany({ where: { published: true }, orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
    return rows.map((c) => this.toPublicCircuit(c, locale, false));
  }

  async publicCircuit(slug: string, locale: Locale) {
    const c = await this.prisma.circuit.findFirst({ where: { slug, published: true } });
    if (!c) throw new NotFoundException();
    return this.toPublicCircuit(c, locale, true);
  }

  async createCircuit(input: CircuitInput, actorId: string) {
    const circuit = await this.unique(() => this.prisma.circuit.create({ data: { ...this.circuitData(input), slug: input.slug, theme: input.theme, region: input.region, durationDays: input.durationDays, imageUrl: input.imageUrl, i18n: input.i18n as Prisma.InputJsonValue, departures: input.departures as Prisma.InputJsonValue } }));
    await this.audit.log("content.created", { actorId, target: `circuit:${circuit.slug}` });
    return { ...circuit, priceFrom: money(circuit.priceFrom) };
  }

  async updateCircuit(id: string, input: Partial<CircuitInput>, actorId: string) {
    await this.exists("circuit", id);
    const circuit = await this.unique(() =>
      this.prisma.circuit.update({
        where: { id },
        data: {
          ...this.circuitData(input),
          ...(input.slug && { slug: input.slug }),
          ...(input.theme && { theme: input.theme }),
          ...(input.region && { region: input.region }),
          ...(input.durationDays && { durationDays: input.durationDays }),
          ...(input.imageUrl && { imageUrl: input.imageUrl }),
          ...(input.i18n && { i18n: input.i18n as Prisma.InputJsonValue }),
        },
      }),
    );
    await this.audit.log("content.updated", { actorId, target: `circuit:${circuit.slug}`, meta: { fields: Object.keys(input) } });
    return { ...circuit, priceFrom: money(circuit.priceFrom) };
  }

  async deleteCircuit(id: string, actorId: string) {
    await this.exists("circuit", id);
    const circuit = await this.prisma.circuit.delete({ where: { id } });
    await this.audit.log("content.deleted", { actorId, target: `circuit:${circuit.slug}` });
    return { ok: true };
  }

  private circuitData(input: Partial<CircuitInput>) {
    return {
      ...(input.priceFrom !== undefined && { priceFrom: input.priceFrom === null ? null : BigInt(input.priceFrom) }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.departures !== undefined && { departures: input.departures as Prisma.InputJsonValue }),
      ...(input.published !== undefined && { published: input.published }),
      ...(input.position !== undefined && { position: input.position }),
    };
  }

  private toPublicCircuit(c: { slug: string; theme: string; region: string; durationDays: number; imageUrl: string; priceFrom: bigint | null; currency: string | null; i18n: unknown; departures: unknown }, locale: Locale, detail: boolean) {
    const texts = localize<Record<string, unknown>>(c.i18n, locale);
    const { days, included, excluded, intro, ...summary } = texts;
    return {
      slug: c.slug,
      theme: c.theme,
      region: c.region,
      durationDays: c.durationDays,
      durationBucket: durationBucket(c.durationDays),
      image: c.imageUrl,
      priceFrom: money(c.priceFrom),
      currency: c.currency,
      ...summary,
      ...(detail && { intro, days, included, excluded, departures: c.departures }),
    };
  }

  /* ---------- Outils ---------- */

  private async exists(kind: "offer" | "circuit", id: string) {
    const found = kind === "offer" ? await this.prisma.offer.findUnique({ where: { id }, select: { id: true } }) : await this.prisma.circuit.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException();
  }

  /** Slug déjà pris → 409 explicite plutôt qu'une erreur 500. */
  private async unique<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new ConflictException({ error: "slug_taken" });
      throw e;
    }
  }
}
