import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { InternalKeyGuard } from "./internal-key.guard";
import type { Env } from "../config/env";

const KEY = "k".repeat(40);
const guard = new InternalKeyGuard({ INTERNAL_API_KEY: KEY } as Env);
const ctx = (value?: string) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ header: (name: string) => (name === "x-internal-key" ? value : undefined) }) }) }) as unknown as ExecutionContext;

describe("InternalKeyGuard", () => {
  it("accepte la bonne clé", () => {
    expect(guard.canActivate(ctx(KEY))).toBe(true);
  });

  it.each([undefined, "", "mauvaise", KEY.slice(1), `${KEY}x`])("refuse %p", (value) => {
    expect(() => guard.canActivate(ctx(value))).toThrow(UnauthorizedException);
  });
});
