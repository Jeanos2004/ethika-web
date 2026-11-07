import { Module } from "@nestjs/common";
import { PdfModule } from "../pdf/pdf.module";
import { LeadsAdminController, LeadsIntakeController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({ imports: [PdfModule], controllers: [LeadsIntakeController, LeadsAdminController], providers: [LeadsService], exports: [LeadsService] })
export class LeadsModule {}
