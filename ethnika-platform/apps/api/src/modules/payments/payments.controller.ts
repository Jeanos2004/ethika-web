import { Body, Controller, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Post, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AgencyService } from "../agency/agency.service";
import { PdfService } from "../pdf/pdf.service";
import { footerTemplate } from "../pdf/templates/html";
import { receiptHtml } from "../pdf/templates/receipt";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { SessionGuard } from "../auth/session.guard";
import { PAYMENT_REFERENCE, REFERENCE_PATTERN } from "../leads/reference";
import { QUOTE_NUMBER } from "../quotes/quotes.schemas";
import { PaymentsService } from "./payments.service";

const createInput = z.strictObject({ amount: z.number().int().min(1).max(1_000_000_000_000).optional(), label: z.string().trim().max(160).optional() });
const listQuery = z.strictObject({ status: z.enum(["pending", "paid", "failed", "cancelled", "expired"]).optional(), leadRef: z.string().regex(REFERENCE_PATTERN).optional() });
const tokenInput = z.strictObject({ token: z.string().regex(/^[A-Za-z0-9_-]{30,100}$/) });
const simulateInput = tokenInput.extend({ outcome: z.enum(["paid", "failed"]) });

/** Reçu PDF (Puppeteer) envoyé tel quel au serveur du site. */
async function sendReceipt(res: Response, pdf: PdfService, agency: AgencyService, data: Awaited<ReturnType<PaymentsService["receipt"]>>) {
  const file = await pdf.render(receiptHtml(data, await agency.pdfInfo()), { footer: footerTemplate(`ETHNIKA · ${data.reference}`) });
  res.status(200);
  res.setHeader("content-type", "application/pdf");
  res.setHeader("content-disposition", `inline; filename="recu-${data.reference}.pdf"`);
  res.setHeader("cache-control", "no-store");
  res.send(file);
}

function checkRef(reference: string) {
  if (!PAYMENT_REFERENCE.test(reference)) throw new NotFoundException();
  return reference;
}

/** Back-office : liens de paiement des devis, suivi, relance, annulation (agents et admins). */
@Controller("v1")
@UseGuards(InternalKeyGuard, SessionGuard)
@Roles("agent", "admin")
export class PaymentsAdminController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly pdf: PdfService,
    private readonly agency: AgencyService,
  ) {}

  @Get("payments/config")
  config() {
    return { enabled: this.payments.enabled };
  }

  @Post("quotes/:number/payments")
  @HttpCode(201)
  create(@Param("number") number: string, @Body(new ZodPipe(createInput)) body: z.infer<typeof createInput>, @CurrentUser() me: AuthContext) {
    if (!QUOTE_NUMBER.test(number)) throw new NotFoundException();
    return this.payments.createForQuote(number, body, me.userId);
  }

  @Get("payments")
  list(@Query(new ZodPipe(listQuery)) q: z.infer<typeof listQuery>) {
    return this.payments.list(q);
  }

  @Post("payments/:id/renew")
  @HttpCode(200)
  renew(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthContext) {
    return this.payments.renewLink(id, me.userId);
  }

  @Get("payments/:id/receipt")
  async receipt(@Param("id", ParseUUIDPipe) id: string, @Res() res: Response) {
    await sendReceipt(res, this.pdf, this.agency, await this.payments.receipt({ id }));
  }

  @Post("payments/:id/cancel")
  @HttpCode(200)
  cancel(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthContext) {
    return this.payments.cancel(id, me.userId);
  }
}

/**
 * Page de paiement du site (serveur du site, clé interne) : lecture par jeton, redirection chez le prestataire,
 * et simulation tant que le prestataire réel n'est pas branché. Les notifications des vrais prestataires
 * arriveront sur une route dédiée, authentifiée par leur signature.
 */
@Controller("v1/public/payments")
@UseGuards(InternalKeyGuard)
export class PaymentsPublicController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly pdf: PdfService,
    private readonly agency: AgencyService,
  ) {}

  @Post(":reference")
  @HttpCode(200)
  view(@Param("reference") reference: string, @Body(new ZodPipe(tokenInput)) body: z.infer<typeof tokenInput>) {
    return this.payments.publicView(checkRef(reference), body.token);
  }

  @Post(":reference/checkout")
  @HttpCode(200)
  checkout(@Param("reference") reference: string, @Body(new ZodPipe(tokenInput)) body: z.infer<typeof tokenInput>) {
    return this.payments.checkout(checkRef(reference), body.token);
  }

  @Post(":reference/receipt")
  async publicReceipt(@Param("reference") reference: string, @Body(new ZodPipe(tokenInput)) body: z.infer<typeof tokenInput>, @Res() res: Response) {
    await sendReceipt(res, this.pdf, this.agency, await this.payments.receipt({ reference: checkRef(reference), token: body.token }));
  }

  @Post(":reference/simulate")
  @HttpCode(200)
  simulate(@Param("reference") reference: string, @Body(new ZodPipe(simulateInput)) body: z.infer<typeof simulateInput>) {
    return this.payments.simulate(checkRef(reference), body.token, body.outcome);
  }
}
