import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { imageInfo } from "./image-info";

/** 5 Mo : une photo de téléphone compressée tient largement ; le site la redimensionne à l'affichage. */
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
const MEDIA_URL = /^\/media\/([0-9a-f-]{36})(?:\.[a-z]+)?$/;

/** Identifiant d'un média à partir de son adresse sur le site (/media/<id>.jpg), sinon null. */
export function mediaIdOf(url: string): string | null {
  return MEDIA_URL.exec(url)?.[1] ?? null;
}

const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

/** Images envoyées depuis le back-office, stockées en base. */
@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async upload(bytes: Buffer, name: string | undefined, actorId: string) {
    if (bytes.length === 0) throw new BadRequestException({ error: "empty" });
    if (bytes.length > MAX_MEDIA_BYTES) throw new PayloadTooLargeException({ error: "too_large" });
    const info = imageInfo(bytes);
    if (!info) throw new BadRequestException({ error: "unsupported_type" });
    const media = await this.prisma.media.create({
      data: { mimeType: info.mimeType, bytes: new Uint8Array(bytes), size: bytes.length, width: info.width, height: info.height, name: name?.slice(0, 160) || null, createdById: actorId },
      select: { id: true, mimeType: true, size: true, width: true, height: true },
    });
    await this.audit.log("content.created", { actorId, target: `media:${media.id}`, meta: { size: media.size } });
    return { ...media, url: `/media/${media.id}.${ext[info.mimeType]}` };
  }

  async get(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id }, select: { mimeType: true, bytes: true } });
    if (!media) throw new NotFoundException();
    return { mimeType: media.mimeType, bytes: Buffer.from(media.bytes) };
  }

  /** Images envoyées mais jamais utilisées (formulaire abandonné), plus anciennes que `before` : supprimées. */
  async purgeOrphans(before: Date) {
    const candidates = await this.prisma.media.findMany({ where: { createdAt: { lt: before } }, select: { id: true } });
    let removed = 0;
    for (const { id } of candidates) {
      await this.releaseIfUnused(`/media/${id}`);
      if (!(await this.prisma.media.count({ where: { id } }))) removed++;
    }
    return removed;
  }

  /** Supprime un média envoyé quand plus aucun contenu ne l'utilise (images de circuits, offres, articles, galerie). */
  async releaseIfUnused(url: string) {
    const id = mediaIdOf(url);
    if (!id) return;
    const prefix = `/media/${id}`;
    const [photos, posts, offers, circuits] = await Promise.all([
      this.prisma.galleryPhoto.count({ where: { imageUrl: { startsWith: prefix } } }),
      this.prisma.blogPost.findMany({ select: { imageUrl: true, i18n: true } }),
      this.prisma.offer.count({ where: { imageUrl: { startsWith: prefix } } }),
      this.prisma.circuit.count({ where: { imageUrl: { startsWith: prefix } } }),
    ]);
    // Le corps d'un article peut aussi l'insérer (![légende](/media/…)).
    const inPosts = posts.some((p) => p.imageUrl.startsWith(prefix) || JSON.stringify(p.i18n).includes(prefix));
    if (photos || offers || circuits || inPosts) return;
    await this.prisma.media.deleteMany({ where: { id } });
  }
}
