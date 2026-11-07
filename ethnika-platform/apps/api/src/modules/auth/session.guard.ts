import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "../../generated/prisma/client";
import { ALLOW_PENDING_KEY, ROLES_KEY } from "./auth.decorators";
import { AuthService } from "./auth.service";
import type { AuthedRequest } from "./auth.types";

/**
 * Session du back-office, vérifiée côté serveur à chaque requête (expiration absolue, inactivité, compte actif).
 * Le jeton arrive dans X-Session-Token (relayé par le serveur du site depuis son cookie HttpOnly).
 * Ensuite : 2FA validée et mot de passe définitif exigés, puis contrôle du rôle (RBAC).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = req.header("x-session-token");
    if (!token) throw new UnauthorizedException({ error: "unauthenticated" });
    const auth = await this.auth.validateSession(token);
    if (!auth) throw new UnauthorizedException({ error: "unauthenticated" });
    req.auth = auth;

    const allowPending = this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_KEY, [context.getHandler(), context.getClass()]);
    if (!allowPending) {
      if (!auth.mfaVerified) throw new ForbiddenException({ error: "mfa_required" });
      if (auth.mustChangePassword) throw new ForbiddenException({ error: "password_change_required" });
    }
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(auth.role)) throw new ForbiddenException({ error: "forbidden" });
    return true;
  }
}
