import { Module } from "@nestjs/common";
import { ENV, type Env } from "../../config/env";
import { DuffelFlightProvider } from "./duffel.provider";
import { FLIGHT_PROVIDER } from "./flight-provider";
import { FlightsController } from "./flights.controller";
import { FlightsService } from "./flights.service";
import { MockFlightProvider } from "./mock.provider";

/** Le fournisseur est choisi par la configuration (FLIGHT_PROVIDER) : le reste de l'API n'en dépend pas. */
@Module({
  controllers: [FlightsController],
  providers: [
    {
      provide: FLIGHT_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env) => (env.FLIGHT_PROVIDER === "duffel" && env.DUFFEL_TOKEN ? new DuffelFlightProvider(env.DUFFEL_TOKEN) : new MockFlightProvider()),
    },
    FlightsService,
  ],
  exports: [FlightsService],
})
export class FlightsModule {}
