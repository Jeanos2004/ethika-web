import { Global, Module } from "@nestjs/common";
import { AgencyController, PublicAgencyController } from "./agency.controller";
import { AgencyService } from "./agency.service";

@Global()
@Module({
  controllers: [AgencyController, PublicAgencyController],
  providers: [AgencyService],
  exports: [AgencyService],
})
export class AgencyModule {}
