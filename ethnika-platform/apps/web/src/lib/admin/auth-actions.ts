"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { adminMode, clearCookie, MFA_COOKIE, requireUser, SESSION_COOKIE, setCookie } from "@/lib/admin/session";
import { cookies } from "next/headers";
import QRCode from "qrcode";

/*
 * Connexion au back-office. Chaque action suit le patron du site : limitation de débit → Zod → appel API → réponse
 * générique (aucune indication sur l'existence d'un compte). Les jetons ne quittent jamais le serveur du site.
 */

/** `error` : clé de traduction (admin.live.errors). */
export type AuthState = { error?: string; step?: "mfa"; saved?: boolean };

type LoginResult = { status: "ok" | "mfa_setup_required"; session: string; expiresAt: string } | { status: "mfa_required"; challenge: string };

async function limited(scope: string) {
  return !rateLimit(`admin-${scope}:${await getClientIp()}`, { limit: 10, windowMs: 10 * 60_000 }).ok;
}

function failure(e: unknown): AuthState {
  if (e instanceof ApiError && e.status === 429) return { error: "rateLimited" };
  if (e instanceof ApiError && (e.status === 401 || e.status === 400)) return { error: "invalid" };
  return { error: "unavailable" };
}

const loginForm = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });
const codeForm = z.object({ code: z.string().trim().regex(/^\d{6}$/) });

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (adminMode !== "live") return { error: "unavailable" };
  if (await limited("login")) return { error: "rateLimited" };
  const parsed = loginForm.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "invalid" };

  let result: LoginResult;
  try {
    result = await api<LoginResult>("/v1/auth/login", { method: "POST", body: parsed.data });
  } catch (e) {
    return failure(e);
  }
  if (result.status === "mfa_required") {
    await setCookie(MFA_COOKIE, result.challenge, new Date(Date.now() + 5 * 60_000));
    return { step: "mfa" };
  }
  await setCookie(SESSION_COOKIE, result.session, new Date(result.expiresAt));
  redirect(result.status === "ok" ? "/admin" : "/admin/securite");
}

export async function verifyCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited("mfa")) return { step: "mfa", error: "rateLimited" };
  const challenge = (await cookies()).get(MFA_COOKIE)?.value;
  const parsed = codeForm.safeParse({ code: formData.get("code") });
  if (!challenge) return { error: "expired" };
  if (!parsed.success) return { step: "mfa", error: "codeFormat" };

  let result: LoginResult;
  try {
    result = await api<LoginResult>("/v1/auth/mfa", { method: "POST", body: { challenge, code: parsed.data.code } });
  } catch (e) {
    return { ...failure(e), step: "mfa" };
  }
  if (result.status === "mfa_required") return { step: "mfa", error: "invalid" };
  await clearCookie(MFA_COOKIE);
  await setCookie(SESSION_COOKIE, result.session, new Date(result.expiresAt));
  redirect("/admin");
}

export async function logout() {
  const { session } = await requireUser({ allowPending: true });
  await api("/v1/auth/logout", { method: "POST", session }).catch(() => undefined);
  await clearCookie(SESSION_COOKIE);
  redirect("/admin/connexion");
}

const passwordForm = z.object({ current: z.string().min(1).max(200), next: z.string().min(12).max(200), confirm: z.string() }).refine((v) => v.next === v.confirm, { path: ["confirm"] });

const passwordErrors: Record<string, string> = {
  password_invalid: "passwordInvalid",
  password_reused: "passwordReused",
};

export async function changePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { session } = await requireUser({ allowPending: true });
  if (await limited("password")) return { error: "rateLimited" };
  const parsed = passwordForm.safeParse({ current: formData.get("current"), next: formData.get("next"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: "passwordForm" };
  let rotated: { session: string; expiresAt: string };
  try {
    rotated = await api("/v1/auth/password", { method: "POST", session, body: { current: parsed.data.current, next: parsed.data.next } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) return { error: passwordErrors[e.code ?? ""] ?? "passwordWeak" };
    return failure(e);
  }
  // Pas de redirection vers la même page : elle remonterait les formulaires (et effacerait une clé 2FA affichée).
  // Le cookie modifié suffit à rafraîchir la page.
  await setCookie(SESSION_COOKIE, rotated.session, new Date(rotated.expiresAt));
  return { saved: true };
}

export type MfaSetupState = { error?: string; secret?: string; uri?: string; qr?: string };

/** Nouveau secret 2FA (affiché une seule fois) ; il ne devient actif qu'après la saisie d'un premier code. */
export async function startMfaSetup(): Promise<MfaSetupState> {
  const { session } = await requireUser({ allowPending: true });
  if (await limited("mfa-setup")) return { error: "rateLimited" };
  try {
    const res = await api<{ secret: string; otpauthUri: string }>("/v1/auth/mfa/setup", { method: "POST", session });
    // QR code de l'URI otpauth, généré ici (aucun service tiers) et affiché en image data:.
    const qr = await QRCode.toDataURL(res.otpauthUri, { margin: 4, width: 320, errorCorrectionLevel: "M" });
    return { secret: res.secret, uri: res.otpauthUri, qr };
  } catch (e) {
    return failure(e);
  }
}

export async function enableMfa(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { session } = await requireUser({ allowPending: true });
  if (await limited("mfa-enable")) return { error: "rateLimited" };
  const parsed = codeForm.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "codeFormat" };
  let rotated: { session: string; expiresAt: string };
  try {
    rotated = await api("/v1/auth/mfa/enable", { method: "POST", session, body: { code: parsed.data.code } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) return { error: "mfaRefused" };
    return failure(e);
  }
  await setCookie(SESSION_COOKIE, rotated.session, new Date(rotated.expiresAt));
  redirect("/admin");
}
