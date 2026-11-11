import { Global, Module } from "@nestjs/common";
import { AgencyController } from "./agency.controller";
import { AgencyService } from "./agency.service";

@Global()
@Module({
  controllers: [AgencyController],
  providers: [AgencyService],
  exports: [AgencyService],
})
export class AgencyModule {}
