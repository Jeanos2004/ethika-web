import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { MediaService } from "../media/media.service";
import { readingMinutes, type PhotoInput, type PostInput } from "./content.schemas";
import { localize } from "./content.service";

type Locale = "fr" | "en";
type PostTexts = { title: string; lead: string; excerpt: string; tag: string; imageAlt: string; body: string; tags: string[] };

const day = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;
const today = () => new Date(new Date().toISOString().slice(0, 10));
const order = [{ position: "asc" as const }, { publishedAt: "desc" as const }, { createdAt: "desc" as const }];

/**
 * Articles du blog et photos de la galerie : administration (brouillons compris) et lecture publique (publiés,
 * localisés). Une image envoyée depuis le back-office (/media/<id>) est supprimée avec le dernier contenu qui l'utilise.
 */
@Injectable()
export class EditorialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly media: MediaService,
  ) {}

  /* ---------- Articles ---------- */

  async listPosts() {
    const rows = await this.prisma.blogPost.findMany({ orderBy: order });
    return rows.map((p) => ({ ...p, publishedAt: day(p.publishedAt), readingMinutes: readingMinutes((p.i18n as { fr: PostTexts }).fr.body) }));
  }

  async publicPosts(locale: Locale) {
    const rows = await this.prisma.blogPost.findMany({ where: { published: true }, orderBy: order });
    return rows.map((p) => this.toPublicPost(p, locale, false));
  }

  async publicPost(slug: string, locale: Locale) {
    const p = await this.prisma.blogPost.findFirst({ where: { slug, published: true } });
    if (!p) throw new NotFoundException();
    return this.toPublicPost(p, locale, true);
  }

  async createPost(input: PostInput, actorId: string) {
    const post = await this.unique(() =>
      this.prisma.blogPost.create({
        data: {
          slug: input.slug,
          category: input.category,
          imageUrl: input.imageUrl,
          i18n: input.i18n as Prisma.InputJsonValue,
          featured: input.featured,
          published: input.published,
          publishedAt: input.publishedAt ? new Date(`${input.publishedAt}T00:00:00Z`) : input.published ? today() : null,
          position: input.position,
        },
      }),
    );
    await this.audit.log("content.created", { actorId, target: `post:${post.slug}` });
    return { ...post, publishedAt: day(post.publishedAt) };
  }

  async updatePost(id: string, input: Partial<PostInput>, actorId: string) {
    const before = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!before) throw new NotFoundException();
    // Date fixée à la première publication si l'agence n'en a pas choisi.
    const publishedAt =
      input.publishedAt !== undefined ? (input.publishedAt ? new Date(`${input.publishedAt}T00:00:00Z`) : null) : input.published && !before.publishedAt ? today() : undefined;
    const post = await this.unique(() =>
      this.prisma.blogPost.update({
        where: { id },
        data: {
          ...(input.slug && { slug: input.slug }),
          ...(input.category && { category: input.category }),
          ...(input.imageUrl && { imageUrl: input.imageUrl }),
          ...(input.i18n && { i18n: input.i18n as Prisma.InputJsonValue }),
          ...(input.featured !== undefined && { featured: input.featured }),
          ...(input.published !== undefined && { published: input.published }),
          ...(publishedAt !== undefined && { publishedAt }),
          ...(input.position !== undefined && { position: input.position }),
        },
      }),
    );
    await this.audit.log("content.updated", { actorId, target: `post:${post.slug}`, meta: { fields: Object.keys(input) } });
    if (input.imageUrl && input.imageUrl !== before.imageUrl) await this.media.releaseIfUnused(before.imageUrl);
    return { ...post, publishedAt: day(post.publishedAt) };
  }

  async deletePost(id: string, actorId: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException();
    await this.prisma.blogPost.delete({ where: { id } });
    await this.audit.log("content.deleted", { actorId, target: `post:${post.slug}` });
    await this.media.releaseIfUnused(post.imageUrl);
    return { ok: true };
  }

  private toPublicPost(p: { slug: string; category: string; imageUrl: string; i18n: unknown; featured: boolean; publishedAt: Date | null; updatedAt: Date }, locale: Locale, detail: boolean) {
    const texts = localize<PostTexts>(p.i18n, locale);
    const fr = (p.i18n as { fr: PostTexts }).fr;
    const en = (p.i18n as { en?: Partial<PostTexts> }).en;
    const { body, ...summary } = texts;
    return {
      slug: p.slug,
      category: p.category,
      image: p.imageUrl,
      featured: p.featured,
      publishedAt: day(p.publishedAt),
      updatedAt: day(p.updatedAt),
      readingMinutes: readingMinutes(fr.body),
      ...summary,
      tags: texts.tags ?? [],
      ...(detail && { body, bodyLocale: locale === "en" && en?.body ? "en" : "fr" }),
    };
  }

  /* ---------- Galerie ---------- */

  listPhotos() {
    return this.prisma.galleryPhoto.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  }

  async publicPhotos(locale: Locale) {
    const rows = await this.prisma.galleryPhoto.findMany({ where: { published: true }, orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
    return rows.map((p) => ({ id: p.id, image: p.imageUrl, category: p.category, tall: p.tall, ...localize<{ alt: string; place: string }>(p.i18n, locale) }));
  }

  async createPhoto(input: PhotoInput, actorId: string) {
    const photo = await this.prisma.galleryPhoto.create({ data: { ...input, i18n: input.i18n as Prisma.InputJsonValue } });
    await this.audit.log("content.created", { actorId, target: `photo:${photo.id}` });
    return photo;
  }

  async updatePhoto(id: string, input: Partial<PhotoInput>, actorId: string) {
    const before = await this.prisma.galleryPhoto.findUnique({ where: { id } });
    if (!before) throw new NotFoundException();
    const { i18n, ...rest } = input;
    const photo = await this.prisma.galleryPhoto.update({ where: { id }, data: { ...rest, ...(i18n && { i18n: i18n as Prisma.InputJsonValue }) } });
    await this.audit.log("content.updated", { actorId, target: `photo:${photo.id}`, meta: { fields: Object.keys(input) } });
    if (input.imageUrl && input.imageUrl !== before.imageUrl) await this.media.releaseIfUnused(before.imageUrl);
    return photo;
  }

  async deletePhoto(id: string, actorId: string) {
    const photo = await this.prisma.galleryPhoto.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException();
    await this.prisma.galleryPhoto.delete({ where: { id } });
    await this.audit.log("content.deleted", { actorId, target: `photo:${photo.id}` });
    await this.media.releaseIfUnused(photo.imageUrl);
    return { ok: true };
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
