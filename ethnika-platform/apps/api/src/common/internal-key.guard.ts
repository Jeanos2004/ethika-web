import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { ENV, type Env } from "../config/env";

/**
 * Seul le serveur du site appelle l'API : il présente la clé partagée dans `X-Internal-Key`.
 * Comparaison à temps constant sur des empreintes de même longueur (pas de fuite par la durée ni par la taille).
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor(@Inject(ENV) env: Env) {
    this.expected = digest(env.INTERNAL_API_KEY);
  }

  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest<Request>().header("x-internal-key");
    if (typeof header !== "string" || header.length === 0 || !timingSafeEqual(digest(header), this.expected)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}
