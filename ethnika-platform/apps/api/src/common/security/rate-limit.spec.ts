import { HttpException } from "@nestjs/common";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  it("bloque au-delà de la limite puis libère après la fenêtre", () => {
    const rl = new RateLimiter(2, 1000);
    rl.consume("ip", 0);
    rl.consume("ip", 10);
    expect(() => rl.consume("ip", 20)).toThrow(HttpException);
    expect(() => rl.consume("autre", 20)).not.toThrow();
    expect(() => rl.consume("ip", 1011)).not.toThrow();
  });
});
