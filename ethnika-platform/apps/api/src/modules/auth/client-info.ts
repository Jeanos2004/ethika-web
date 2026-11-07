import type { Request } from "express";

/** Adresse et navigateur du client final, transmis par le serveur du site (X-Client-IP, X-Client-UA) ou vus directement. */
export function clientInfo(req: Request) {
  const forwardedIp = req.header("x-client-ip");
  const ip = (forwardedIp && /^[0-9a-fA-F:.]{3,64}$/.test(forwardedIp) ? forwardedIp : req.ip) ?? null;
  return { ip, userAgent: (req.header("x-client-ua") ?? req.header("user-agent") ?? null)?.slice(0, 255) ?? null };
}
