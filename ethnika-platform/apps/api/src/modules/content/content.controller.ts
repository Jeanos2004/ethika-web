import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { SessionGuard } from "../auth/session.guard";
import { circuitInput, circuitUpdate, localeQuery, offerInput, offerUpdate, type CircuitInput, type OfferInput } from "./content.schemas";
import { ContentService } from "./content.service";

const slugParam = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);

/** Lecture publique (serveur du site, clé interne) : contenus publiés, dans la langue demandée. */
@Controller("v1/public")
@UseGuards(InternalKeyGuard)
export class PublicContentController {
  constructor(private readonly content: ContentService) {}

  @Get("offers")
  offers(@Query(new ZodPipe(localeQuery)) q: z.infer<typeof localeQuery>) {
    return this.content.publicOffers(q.locale);
  }

  @Get("circuits")
  circuits(@Query(new ZodPipe(localeQuery)) q: z.infer<typeof localeQuery>) {
    return this.content.publicCircuits(q.locale);
  }

  @Get("circuits/:slug")
  circuit(@Param("slug", new ZodPipe(slugParam)) slug: string, @Query(new ZodPipe(localeQuery)) q: z.infer<typeof localeQuery>) {
    return this.content.publicCircuit(slug, q.locale);
  }
}

/** Administration des contenus : administrateurs uniquement, chaque modification est auditée. */
@Controller("v1/admin")
@UseGuards(InternalKeyGuard, SessionGuard)
@Roles("admin")
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get("offers")
  listOffers() {
    return this.content.listOffers();
  }

  @Post("offers")
  @HttpCode(201)
  createOffer(@Body(new ZodPipe(offerInput)) body: OfferInput, @CurrentUser() me: AuthContext) {
    return this.content.createOffer(body, me.userId);
  }

  @Patch("offers/:id")
  updateOffer(@Param("id", ParseUUIDPipe) id: string, @Body(new ZodPipe(offerUpdate)) body: Partial<OfferInput>, @CurrentUser() me: AuthContext) {
    return this.content.updateOffer(id, body, me.userId);
  }

  @Delete("offers/:id")
  deleteOffer(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthContext) {
    return this.content.deleteOffer(id, me.userId);
  }

  @Get("circuits")
  listCircuits() {
    return this.content.listCircuits();
  }

  @Post("circuits")
  @HttpCode(201)
  createCircuit(@Body(new ZodPipe(circuitInput)) body: CircuitInput, @CurrentUser() me: AuthContext) {
    return this.content.createCircuit(body, me.userId);
  }

  @Patch("circuits/:id")
  updateCircuit(@Param("id", ParseUUIDPipe) id: string, @Body(new ZodPipe(circuitUpdate)) body: Partial<CircuitInput>, @CurrentUser() me: AuthContext) {
    return this.content.updateCircuit(id, body, me.userId);
  }

  @Delete("circuits/:id")
  deleteCircuit(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthContext) {
    return this.content.deleteCircuit(id, me.userId);
  }
}
