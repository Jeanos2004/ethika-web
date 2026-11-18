import { Controller, Get, Headers, HttpCode, Module, Param, ParseUUIDPipe, PayloadTooLargeException, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { SessionGuard } from "../auth/session.guard";
import { MAX_MEDIA_BYTES, MediaService } from "./media.service";

/** Corps brut de la requête (l'image elle-même), borné : la lecture s'arrête dès que la limite est dépassée. */
async function readBody(req: Request, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > limit) throw new PayloadTooLargeException({ error: "too_large" });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Envoi d'une image (administrateurs). Corps : l'image brute (image/jpeg, image/png ou image/webp). */
@Controller("v1/admin/media")
@UseGuards(InternalKeyGuard, SessionGuard)
@Roles("admin")
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @HttpCode(201)
  async upload(@Req() req: Request, @Headers("x-file-name") name: string | undefined, @CurrentUser() me: AuthContext) {
    const bytes = await readBody(req, MAX_MEDIA_BYTES);
    let decoded: string | undefined;
    try {
      decoded = name ? decodeURIComponent(name) : undefined;
    } catch {
      decoded = undefined;
    }
    return this.media.upload(bytes, decoded, me.userId);
  }
}

/** Lecture d'une image par le serveur du site (clé interne), qui la sert sous /media/<id> avec un long cache. */
@Controller("v1/public/media")
@UseGuards(InternalKeyGuard)
export class PublicMediaController {
  constructor(private readonly media: MediaService) {}

  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) id: string, @Res() res: Response) {
    const { mimeType, bytes } = await this.media.get(id);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(bytes);
  }
}

@Module({ controllers: [AdminMediaController, PublicMediaController], providers: [MediaService], exports: [MediaService] })
export class MediaModule {}
