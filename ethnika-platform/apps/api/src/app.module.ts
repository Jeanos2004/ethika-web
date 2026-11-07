import { Module, type DynamicModule } from "@nestjs/common";
import { ENV, type Env } from "./config/env";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MailModule } from "./modules/mail/mail.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { FlightsModule } from "./modules/flights/flights.module";
import { QuotesModule } from "./modules/quotes/quotes.module";
import { NewsletterModule } from "./modules/newsletter/newsletter.module";
import { ContentModule } from "./modules/content/content.module";
import { HealthController } from "./modules/health/health.controller";
import { MaintenanceService } from "./modules/maintenance/maintenance.service";

@Module({})
class ConfigModule {}

/** Module racine. La configuration validée est injectée sous le jeton ENV, disponible partout. */
@Module({})
export class AppModule {
  static register(env: Env): DynamicModule {
    const config = { provide: ENV, useValue: env };
    return {
      module: AppModule,
      imports: [{ module: ConfigModule, providers: [config], exports: [config], global: true }, PrismaModule, AuditModule, AuthModule, MailModule, LeadsModule, QuotesModule, NewsletterModule, ContentModule, FlightsModule],
      controllers: [HealthController],
      providers: [MaintenanceService],
    };
  }
}
