import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Role } from "../../generated/prisma/client";
import type { AuthContext, AuthedRequest } from "./auth.types";

export const ROLES_KEY = "roles";
export const ALLOW_PENDING_KEY = "allowPending";

/** Rôles autorisés sur une route (par défaut : tout compte authentifié). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Route accessible avant la 2FA ou le changement de mot de passe obligatoire (configuration du compte). */
export const AllowPending = () => SetMetadata(ALLOW_PENDING_KEY, true);

/** Identité de l'agent connecté. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthContext => {
  const auth = ctx.switchToHttp().getRequest<AuthedRequest>().auth;
  if (!auth) throw new Error("CurrentUser sans SessionGuard");
  return auth;
});
