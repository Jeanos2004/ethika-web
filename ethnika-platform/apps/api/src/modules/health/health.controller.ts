import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/** Sonde de santé (load balancer, Docker) : vérifie l'accès à la base, sans rien divulguer d'autre. */
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException({ status: "db_unavailable" });
    }
  }
}
