import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { SessionGuard } from "../auth/session.guard";
import { agencyInput, AgencyService, type AgencyInput } from "./agency.service";

/** Coordonnées publiques, lues par le serveur du site (clé interne) pour l'en-tête, le pied de page et la page Contact. */
@Controller("v1/public/agency")
@UseGuards(InternalKeyGuard)
export class PublicAgencyController {
  constructor(private readonly agency: AgencyService) {}

  @Get()
  get() {
    return this.agency.publicInfo();
  }
}

/** Coordonnées de l'agence : lecture pour toute l'équipe, modification par un administrateur. */
@Controller("v1/agency")
@UseGuards(InternalKeyGuard, SessionGuard)
export class AgencyController {
  constructor(private readonly agency: AgencyService) {}

  @Get()
  @Roles("agent", "admin")
  get() {
    return this.agency.get();
  }

  @Patch()
  @Roles("admin")
  update(@Body(new ZodPipe(agencyInput)) body: AgencyInput, @CurrentUser() me: AuthContext) {
    return this.agency.update(body, me.userId);
  }
}
