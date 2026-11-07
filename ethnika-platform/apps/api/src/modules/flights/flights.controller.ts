import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { RateLimiter } from "../../common/security/rate-limit";
import { ZodPipe } from "../../common/zod.pipe";
import { Roles } from "../auth/auth.decorators";
import { clientInfo } from "../auth/client-info";
import { SessionGuard } from "../auth/session.guard";
import { FlightsService } from "./flights.service";

const iata = z.string().regex(/^[A-Z]{3}$/);
const isoDate = z.iso.date();
const providerId = z.string().regex(/^[A-Za-z0-9_-]{4,80}$/);

export const searchInput = z
  .strictObject({
    slices: z.array(z.strictObject({ origin: iata, destination: iata, date: isoDate })).min(1).max(4),
    passengers: z.strictObject({ adults: z.number().int().min(1).max(9), children: z.number().int().min(0).max(8), infants: z.number().int().min(0).max(8) }),
    cabin: z.enum(["eco", "business", "first"]),
  })
  .refine((q) => q.passengers.infants <= q.passengers.adults, { path: ["passengers", "infants"], message: "infantsMax" })
  .refine((q) => q.slices.every((s) => s.origin !== s.destination), { path: ["slices"], message: "sameAirport" })
  .refine((q) => q.slices.every((s) => s.date >= new Date().toISOString().slice(0, 10)), { path: ["slices"], message: "datePast" });

const passenger = z.strictObject({
  type: z.enum(["adult", "child", "infant"]),
  title: z.enum(["mr", "ms", "mrs", "miss", "dr"]),
  givenName: z.string().trim().min(1).max(60),
  familyName: z.string().trim().min(1).max(60),
  bornOn: isoDate,
  gender: z.enum(["m", "f"]),
  email: z.email().max(200),
  phone: z.string().regex(/^\+[1-9][0-9]{7,14}$/, "phoneE164"),
});
export const holdInput = z.strictObject({ offerId: providerId, passengers: z.array(passenger).min(1).max(9) });

/**
 * Vols. Recherche et prix : appelés par le serveur du site (clé interne, limite par IP du client final).
 * Option, consultation et annulation de commande : réservées aux agents connectés (aucune émission automatique).
 */
@Controller("v1/flights")
@UseGuards(InternalKeyGuard)
export class FlightsController {
  private readonly searchLimiter = new RateLimiter(30, 10 * 60_000);

  constructor(private readonly flights: FlightsService) {}

  @Post("search")
  @HttpCode(200)
  search(@Body(new ZodPipe(searchInput)) body: z.infer<typeof searchInput>, @Req() req: Request) {
    this.searchLimiter.consume(`ip:${clientInfo(req).ip ?? "?"}`);
    return this.flights.search(body);
  }

  @Get("offers/:id")
  price(@Param("id", new ZodPipe(providerId)) id: string) {
    return this.flights.price(id);
  }

  @Post("orders")
  @HttpCode(201)
  @UseGuards(SessionGuard)
  @Roles("agent", "admin")
  hold(@Body(new ZodPipe(holdInput)) body: z.infer<typeof holdInput>) {
    return this.flights.hold(body.offerId, body.passengers);
  }

  @Get("orders/:id")
  @UseGuards(SessionGuard)
  @Roles("agent", "admin")
  order(@Param("id", new ZodPipe(providerId)) id: string) {
    return this.flights.getOrder(id);
  }

  @Post("orders/:id/cancel")
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @Roles("agent", "admin")
  cancel(@Param("id", new ZodPipe(providerId)) id: string) {
    return this.flights.cancel(id);
  }
}
