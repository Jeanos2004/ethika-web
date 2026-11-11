import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { getClientIp } from "@/lib/security/client-ip";

/** Erreur renvoyée par l'API : statut HTTP et code métier (`error`) quand il existe. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`API HTTP ${status}${code ? ` (${code})` : ""}`);
  }
}

type Options = { method?: "GET" | "POST" | "PATCH"; body?: unknown; session?: string; timeoutMs?: number };

/**
 * Appel serveur → API : clé interne, jeton de session éventuel, IP et navigateur du client final (journal, limites),
 * sans redirection ni cache. Le navigateur ne parle jamais directement à l'API.
 */
export async function apiFetch(path: string, { method = "GET", body, session, timeoutMs = 10_000 }: Options = {}): Promise<Response> {
  if (!env.API_BASE_URL) throw new ApiError(503, "api_not_configured");
  const ua = (await headers()).get("user-agent") ?? "";
  const res = await fetch(new URL(path, env.API_BASE_URL), {
    method,
    headers: {
      accept: "application/json",
      "x-internal-key": env.API_INTERNAL_KEY ?? "",
      "x-client-ip": await getClientIp(),
      "x-client-ua": ua.slice(0, 255),
      ...(session && { "x-session-token": session }),
      ...(body !== undefined && { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
    throw new ApiError(res.status, typeof data?.error === "string" ? data.error : undefined);
  }
  return res;
}

/** Variante JSON de `apiFetch`. */
export async function api<T>(path: string, options?: Options): Promise<T> {
  const res = await apiFetch(path, options);
  return (res.status === 204 ? undefined : await res.json()) as T;
}
