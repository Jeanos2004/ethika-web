import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { NewsletterService } from "./newsletter.service";

const subscribeInput = z.strictObject({ email: z.email().max(200), locale: z.enum(["fr", "en"]).optional() });
const tokenInput = z.strictObject({ token: z.string().regex(/^[A-Za-z0-9_-]{30,100}$/) });

/** Newsletter (appelée par le serveur du site, clé interne). */
@Controller("v1/newsletter")
@UseGuards(InternalKeyGuard)
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post()
  @HttpCode(201)
  subscribe(@Body(new ZodPipe(subscribeInput)) body: z.infer<typeof subscribeInput>) {
    return this.newsletter.subscribe(body.email, body.locale);
  }

  @Post("confirm")
  @HttpCode(200)
  confirm(@Body(new ZodPipe(tokenInput)) body: z.infer<typeof tokenInput>) {
    return this.newsletter.confirm(body.token);
  }

  @Post("unsubscribe")
  @HttpCode(200)
  unsubscribe(@Body(new ZodPipe(tokenInput)) body: z.infer<typeof tokenInput>) {
    return this.newsletter.unsubscribe(body.token);
  }
}
