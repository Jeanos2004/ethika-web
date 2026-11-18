import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { SessionGuard } from "../auth/session.guard";
import { AgencyService } from "../agency/agency.service";
import { REFERENCE_PATTERN } from "../leads/reference";
import { PdfService } from "../pdf/pdf.service";
import { footerTemplate } from "../pdf/templates/html";
import { quoteHtml } from "../pdf/templates/quote";
import { QUOTE_NUMBER, quoteInput, type QuoteInput } from "./quotes.schemas";
import { QuotesService } from "./quotes.service";

/** Devis (agents et admins connectés) : création pour une demande, liste, PDF Puppeteer. */
@Controller("v1")
@UseGuards(InternalKeyGuard, SessionGuard)
@Roles("agent", "admin")
export class QuotesController {
  constructor(
    private readonly quotes: QuotesService,
    private readonly pdf: PdfService,
    private readonly agency: AgencyService,
  ) {}

  @Post("leads/:ref/quotes")
  @HttpCode(201)
  create(@Param("ref") ref: string, @Body(new ZodPipe(quoteInput)) body: QuoteInput, @CurrentUser() me: AuthContext) {
    if (!REFERENCE_PATTERN.test(ref)) throw new NotFoundException();
    return this.quotes.create(ref, body, me.userId);
  }

  @Get("leads/:ref/quotes")
  list(@Param("ref") ref: string) {
    if (!REFERENCE_PATTERN.test(ref)) throw new NotFoundException();
    return this.quotes.listForLead(ref);
  }

  @Get("quotes/:number/pdf")
  async pdfFile(@Param("number") number: string, @Res() res: Response) {
    if (!QUOTE_NUMBER.test(number)) throw new NotFoundException();
    const q = await this.quotes.forPdf(number);
    const file = await this.pdf.render(quoteHtml(q, await this.agency.pdfInfo()), { footer: footerTemplate(`ETHNIKA · ${q.number}`) });
    res.setHeader("content-type", "application/pdf");
    res.setHeader("content-disposition", `inline; filename="${q.number}.pdf"`);
    res.setHeader("cache-control", "no-store");
    res.send(file);
  }
}
