import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { SessionGuard } from "../auth/session.guard";
import { localeQuery, photoInput, photoUpdate, postInput, postUpdate, type PhotoInput, type PostInput } from "./content.schemas";
import { EditorialService } from "./editorial.service";

const slugParam = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);

/** Blog et galerie publiés (serveur du site, clé interne), dans la langue demandée. */
@Controller("v1/public")
@UseGuards(InternalKeyGuard)
export class PublicEditorialController {
  constructor(private readonly editorial: EditorialService) {}

  @Get("posts")
  posts(@Query(new ZodPipe(localeQuery)) q: z.infer<typeof localeQuery>) {
    return this.editorial.publicPosts(q.locale);
  }

  @Get("posts/:slug")
  post(@Param("slug", new ZodPipe(slugParam)) slug: string, @Query(new ZodPipe(localeQuery)) q: z.infer<typeof localeQuery>) {
    return this.editorial.publicPost(slug, q.locale);
  }

  @Get("gallery")
  gallery(@Query(new ZodPipe(localeQuery)) q: z.infer<typeof localeQuery>) {
    return this.editorial.publicPhotos(q.locale);
  }
}

/** Administration du blog et de la galerie : administrateurs uniquement, modifications auditées. */
@Controller("v1/admin")
@UseGuards(InternalKeyGuard, SessionGuard)
@Roles("admin")
export class AdminEditorialController {
  constructor(private readonly editorial: EditorialService) {}

  @Get("posts")
  listPosts() {
    return this.editorial.listPosts();
  }

  @Post("posts")
  @HttpCode(201)
  createPost(@Body(new ZodPipe(postInput)) body: PostInput, @CurrentUser() me: AuthContext) {
    return this.editorial.createPost(body, me.userId);
  }

  @Patch("posts/:id")
  updatePost(@Param("id", ParseUUIDPipe) id: string, @Body(new ZodPipe(postUpdate)) body: Partial<PostInput>, @CurrentUser() me: AuthContext) {
    return this.editorial.updatePost(id, body, me.userId);
  }

  @Delete("posts/:id")
  deletePost(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthContext) {
    return this.editorial.deletePost(id, me.userId);
  }

  @Get("gallery")
  listPhotos() {
    return this.editorial.listPhotos();
  }

  @Post("gallery")
  @HttpCode(201)
  createPhoto(@Body(new ZodPipe(photoInput)) body: PhotoInput, @CurrentUser() me: AuthContext) {
    return this.editorial.createPhoto(body, me.userId);
  }

  @Patch("gallery/:id")
  updatePhoto(@Param("id", ParseUUIDPipe) id: string, @Body(new ZodPipe(photoUpdate)) body: Partial<PhotoInput>, @CurrentUser() me: AuthContext) {
    return this.editorial.updatePhoto(id, body, me.userId);
  }

  @Delete("gallery/:id")
  deletePhoto(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthContext) {
    return this.editorial.deletePhoto(id, me.userId);
  }
}
