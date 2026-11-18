import { Module } from "@nestjs/common";
import { ENV, type Env } from "../../config/env";
import { AmadeusFlightProvider } from "./amadeus.provider";
import { DuffelFlightProvider } from "./duffel.provider";
import { FLIGHT_PROVIDER } from "./flight-provider";
import { FlightsController } from "./flights.controller";
import { FlightsService } from "./flights.service";
import { FlightBookingsService } from "./flight-bookings.service";
import { MockFlightProvider } from "./mock.provider";

/** Le fournisseur est choisi par la configuration (FLIGHT_PROVIDER) : le reste de l'API n'en dépend pas. */
@Module({
  controllers: [FlightsController],
  providers: [
    {
      provide: FLIGHT_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env) => {
        if (env.FLIGHT_PROVIDER === "duffel" && env.DUFFEL_TOKEN) return new DuffelFlightProvider(env.DUFFEL_TOKEN);
        if (env.FLIGHT_PROVIDER === "amadeus" && env.AMADEUS_CLIENT_ID && env.AMADEUS_CLIENT_SECRET) {
          return new AmadeusFlightProvider({ baseUrl: env.AMADEUS_BASE_URL, clientId: env.AMADEUS_CLIENT_ID, clientSecret: env.AMADEUS_CLIENT_SECRET, timeoutMs: env.AMADEUS_TIMEOUT_MS });
        }
        return new MockFlightProvider();
      },
    },
    FlightsService,
    FlightBookingsService,
  ],
  exports: [FlightsService, FlightBookingsService],
})
export class FlightsModule {}
