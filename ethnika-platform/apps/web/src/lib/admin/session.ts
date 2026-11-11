import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { isDemo } from "@/lib/demo/mode";
import { api, ApiError } from "@/lib/api/server";

/*
 * Session du back-office connecté à l'API.
 * Le jeton vit dans un cookie HttpOnly, SameSite=Strict (Secure et préfixe __Host- en production) ;
 * le serveur du site le relaie dans X-Session-Token. L'API revérifie la session à chaque appel.
 */

/** « demo » : boîte locale du navigateur ; « live » : API ; « off » : back-office indisponible (404). */
export const adminMode: "demo" | "live" | "off" = isDemo ? "demo" : env.API_BASE_URL ? "live" : "off";

const secure = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = secure ? "__Host-eth_admin" : "eth_admin";
export const MFA_COOKIE = secure ? "__Host-eth_admin_mfa" : "eth_admin_mfa";

export type AdminUser = { userId: string; email: string; name: string; role: "admin" | "agent"; mfaVerified: boolean; mustChangePassword: boolean };

export async function setCookie(name: string, value: string, expires: Date) {
  (await cookies()).set(name, value, { httpOnly: true, secure, sameSite: "strict", path: "/", expires });
}

export async function clearCookie(name: string) {
  (await cookies()).delete({ name, path: "/" });
}

export async function sessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Compte connecté (une seule vérification par requête), ou null si la session est absente, expirée ou révoquée. */
export const currentUser = cache(async (): Promise<AdminUser | null> => {
  const session = await sessionToken();
  if (!session) return null;
  try {
    return await api<AdminUser>("/v1/auth/me", { session });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
});

/**
 * Garde des pages du back-office connecté : sans session → connexion ; 2FA ou mot de passe définitif
 * manquants → page Sécurité. Renvoie le compte et son jeton.
 */
export async function requireUser({ allowPending = false } = {}) {
  if (adminMode !== "live") notFound();
  const user = await currentUser();
  const session = await sessionToken();
  if (!user || !session) redirect("/admin/connexion");
  if (!allowPending && (!user.mfaVerified || user.mustChangePassword)) redirect("/admin/securite");
  return { user, session };
}
