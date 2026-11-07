import { Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { ENV, type Env } from "../../config/env";
import { AuditService } from "../audit/audit.service";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { clientInfo } from "../auth/client-info";
import { SessionGuard } from "../auth/session.guard";
import { PdfService } from "../pdf/pdf.service";
import { footerTemplate } from "../pdf/templates/html";
import { leadSummaryHtml } from "../pdf/templates/lead-summary";
import { leadInput, leadQuery, newsletterInput, statusChange, type LeadInput, type LeadQuery } from "./lead.schemas";
import { LeadsService } from "./leads.service";
import { REFERENCE_PATTERN } from "./reference";

/** Coordonnées de l'agence imprimées sur les documents (placeholders tant que l'agence ne les a pas fournies). */
export const agencyInfo = (env: Env) => ({ address: "[Quartier], Conakry", phone: "+224 [NUMÉRO]", email: "contact@ethnikatour.com", licence: "[À COMPLÉTER]", site: new URL(env.SITE_URL).host });

function checkRef(ref: string) {
  if (!REFERENCE_PATTERN.test(ref)) throw new NotFoundException();
  return ref;
}

/** Entrée des demandes depuis le site : clé interne uniquement (le serveur du site est le seul appelant). */
@Controller("v1")
@UseGuards(InternalKeyGuard)
export class LeadsIntakeController {
  constructor(private readonly leads: LeadsService) {}

  @Post("leads")
  @HttpCode(201)
  create(@Body(new ZodPipe(leadInput)) body: LeadInput) {
    return this.leads.create(body);
  }

  @Post("newsletter")
  @HttpCode(201)
  subscribe(@Body(new ZodPipe(newsletterInput)) body: z.infer<typeof newsletterInput>) {
    return this.leads.subscribe(body.email, body.locale);
  }
}

/** Back-office des demandes : clé interne + session (agent ou admin), actions historisées et auditées. */
@Controller("v1/leads")
@UseGuards(InternalKeyGuard, SessionGuard)
@Roles("agent", "admin")
export class LeadsAdminController {
  constructor(
    private readonly leads: LeadsService,
    private readonly pdf: PdfService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Get()
  list(@Query(new ZodPipe(leadQuery)) q: LeadQuery) {
    return this.leads.list(q);
  }

  @Get("export.csv")
  async exportCsv(@Query(new ZodPipe(leadQuery)) q: LeadQuery, @CurrentUser() me: AuthContext, @Req() req: Request, @Res() res: Response) {
    const { csv, count } = await this.leads.exportCsv(q);
    await this.audit.log("lead.exported", { actorId: me.userId, ip: clientInfo(req).ip, meta: { count, filters: { status: q.status, type: q.type, q: q.q ? "…" : undefined } } });
    // Avec @Res(), les en-têtes se posent à la main (les décorateurs @Header ne s'appliquent pas).
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-disposition", `attachment; filename="ethnika-demandes-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }

  @Get(":ref")
  get(@Param("ref") ref: string) {
    return this.leads.get(checkRef(ref));
  }

  @Patch(":ref/status")
  async setStatus(@Param("ref") ref: string, @Body(new ZodPipe(statusChange)) body: z.infer<typeof statusChange>, @CurrentUser() me: AuthContext, @Req() req: Request) {
    const lead = await this.leads.setStatus(checkRef(ref), body.status, me.userId, body.note);
    await this.audit.log("lead.status_changed", { actorId: me.userId, target: ref, ip: clientInfo(req).ip, meta: { status: body.status } });
    return lead;
  }

  /** Récapitulatif PDF de la demande (Puppeteer). */
  @Get(":ref/pdf")
  async summaryPdf(@Param("ref") ref: string, @CurrentUser() me: AuthContext, @Res() res: Response) {
    const lead = await this.leads.get(checkRef(ref));
    const pdf = await this.pdf.render(leadSummaryHtml(lead, agencyInfo(this.env)), { footer: footerTemplate(`ETHNIKA · ${lead.reference}`) });
    await this.audit.log("lead.pdf", { actorId: me.userId, target: ref });
    res.setHeader("content-type", "application/pdf");
    res.setHeader("content-disposition", `inline; filename="${lead.reference}.pdf"`);
    res.setHeader("cache-control", "no-store");
    res.send(pdf);
  }
}
