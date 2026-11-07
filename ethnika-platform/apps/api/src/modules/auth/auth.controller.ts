import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { AllowPending, CurrentUser } from "./auth.decorators";
import { codeInput, loginInput, mfaInput, passwordInput } from "./auth.schemas";
import { AuthService } from "./auth.service";
import type { AuthContext } from "./auth.types";
import { clientInfo } from "./client-info";
import { SessionGuard } from "./session.guard";

/**
 * Authentification du back-office. Le serveur du site relaie les appels (clé interne) et garde le jeton de session
 * dans un cookie HttpOnly, Secure, SameSite=Strict ; il le renvoie ensuite dans X-Session-Token.
 */
@Controller("v1/auth")
@UseGuards(InternalKeyGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  login(@Body(new ZodPipe(loginInput)) body: z.infer<typeof loginInput>, @Req() req: Request) {
    return this.auth.login(body.email, body.password, clientInfo(req));
  }

  @Post("mfa")
  @HttpCode(200)
  mfa(@Body(new ZodPipe(mfaInput)) body: z.infer<typeof mfaInput>, @Req() req: Request) {
    return this.auth.verifyMfa(body.challenge, body.code, clientInfo(req));
  }

  @Get("me")
  @UseGuards(SessionGuard)
  @AllowPending()
  me(@CurrentUser() user: AuthContext) {
    const { sessionId: _s, ...rest } = user;
    return rest;
  }

  @Post("logout")
  @HttpCode(204)
  @UseGuards(SessionGuard)
  @AllowPending()
  async logout(@CurrentUser() user: AuthContext, @Req() req: Request) {
    await this.auth.logout(user, clientInfo(req));
  }

  @Post("mfa/setup")
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @AllowPending()
  setup(@CurrentUser() user: AuthContext) {
    return this.auth.setupMfa(user);
  }

  @Post("mfa/enable")
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @AllowPending()
  enable(@CurrentUser() user: AuthContext, @Body(new ZodPipe(codeInput)) body: z.infer<typeof codeInput>, @Req() req: Request) {
    return this.auth.enableMfa(user, body.code, clientInfo(req));
  }

  @Post("password")
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @AllowPending()
  password(@CurrentUser() user: AuthContext, @Body(new ZodPipe(passwordInput)) body: z.infer<typeof passwordInput>, @Req() req: Request) {
    return this.auth.changePassword(user, body.current, body.next, clientInfo(req));
  }
}
