import { Module } from "@nestjs/common";
import { PdfModule } from "../pdf/pdf.module";
import { LeadsAdminController, LeadsIntakeController, StatsController } from "./leads.controller";
import { StatsService } from "./stats.service";
import { LeadsService } from "./leads.service";

@Module({ imports: [PdfModule], controllers: [LeadsIntakeController, LeadsAdminController, StatsController], providers: [LeadsService, StatsService], exports: [LeadsService] })
export class LeadsModule {}
