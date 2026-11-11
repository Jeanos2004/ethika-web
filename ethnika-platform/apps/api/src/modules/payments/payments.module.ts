import { Module } from "@nestjs/common";
import { ENV, type Env } from "../../config/env";
import { DisabledPaymentProvider, MockPaymentProvider, PAYMENT_PROVIDER } from "./payment-provider";
import { PaymentsAdminController, PaymentsPublicController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

/** Prestataire choisi par PAYMENT_PROVIDER ; un nouveau prestataire = une classe qui implémente PaymentProvider. */
@Module({
  controllers: [PaymentsAdminController, PaymentsPublicController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env) => (env.PAYMENT_PROVIDER === "mock" ? new MockPaymentProvider(env.SITE_URL) : new DisabledPaymentProvider()),
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
