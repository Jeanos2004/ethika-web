import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { CurrentUser, Roles } from "./auth.decorators";
import type { AuthContext } from "./auth.types";
import { AccountService } from "./account.service";
import { SessionGuard } from "./session.guard";

const renameInput = z.strictObject({ name: z.string().trim().min(2).max(120) });
const revokeInput = z.strictObject({ handle: z.string().regex(/^[a-f0-9]{16}$/) });

/** Paramètres du compte connecté (profil, sessions) et état du système (administrateurs). */
@Controller("v1")
@UseGuards(InternalKeyGuard, SessionGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get("account")
  profile(@CurrentUser() me: AuthContext) {
    return this.account.profile(me);
  }

  @Patch("account")
  rename(@CurrentUser() me: AuthContext, @Body(new ZodPipe(renameInput)) body: z.infer<typeof renameInput>) {
    return this.account.rename(me, body.name);
  }

  @Get("account/sessions")
  sessions(@CurrentUser() me: AuthContext) {
    return this.account.sessions(me);
  }

  @Post("account/sessions/revoke")
  @HttpCode(200)
  revoke(@CurrentUser() me: AuthContext, @Body(new ZodPipe(revokeInput)) body: z.infer<typeof revokeInput>) {
    return this.account.revoke(me, body.handle);
  }

  @Post("account/sessions/revoke-others")
  @HttpCode(200)
  revokeOthers(@CurrentUser() me: AuthContext) {
    return this.account.revokeOthers(me);
  }

  @Get("system")
  @Roles("admin")
  system() {
    return this.account.system();
  }
}
