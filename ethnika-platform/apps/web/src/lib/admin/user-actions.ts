"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { requireAdmin } from "@/lib/admin/session";

/*
 * Comptes du back-office (administrateurs uniquement ; l'API revérifie le rôle). Les mots de passe temporaires
 * ne sont affichés qu'une fois, à l'administrateur qui les a générés, et ne sont jamais journalisés.
 */

export type UserState = { error?: string; temporaryPassword?: string; email?: string };

const uuid = z.uuid();

function errorKey(e: unknown) {
  if (e instanceof ApiError) {
    if (e.code === "cannot_demote_self") return "cannotDemoteSelf";
    if (e.status === 409) return "emailTaken";
    if (e.status === 400) return "userForm";
    if (e.status === 404) return "notFound";
  }
  return "unavailable";
}

const createForm = z.object({ email: z.email().max(200), name: z.string().trim().min(2).max(120), role: z.enum(["admin", "agent"]) });

export async function createUser(_prev: UserState, formData: FormData): Promise<UserState> {
  const { session } = await requireAdmin();
  const parsed = createForm.safeParse({ email: formData.get("email"), name: formData.get("name"), role: formData.get("role") });
  if (!parsed.success) return { error: "userForm" };
  try {
    const res = await api<{ user: { email: string }; temporaryPassword: string }>("/v1/users", { method: "POST", session, body: parsed.data });
    revalidatePath("/admin/utilisateurs");
    return { temporaryPassword: res.temporaryPassword, email: res.user.email };
  } catch (e) {
    return { error: errorKey(e) };
  }
}

/** Rôle, activation : une action par formulaire de ligne. */
export async function updateUser(_prev: UserState, formData: FormData): Promise<UserState> {
  const { session } = await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  const op = String(formData.get("op"));
  const body = op === "role" ? { role: z.enum(["admin", "agent"]).parse(formData.get("role")) } : op === "disable" ? { disabled: true } : op === "enable" ? { disabled: false } : null;
  if (!id.success || !body) return { error: "userForm" };
  try {
    await api(`/v1/users/${id.data}`, { method: "PATCH", session, body });
  } catch (e) {
    return { error: errorKey(e) };
  }
  revalidatePath("/admin/utilisateurs");
  return {};
}

export async function resetUserPassword(_prev: UserState, formData: FormData): Promise<UserState> {
  const { session } = await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return { error: "userForm" };
  try {
    const res = await api<{ temporaryPassword: string }>(`/v1/users/${id.data}/reset-password`, { method: "POST", session });
    revalidatePath("/admin/utilisateurs");
    return { temporaryPassword: res.temporaryPassword, email: String(formData.get("email") ?? "") };
  } catch (e) {
    return { error: errorKey(e) };
  }
}

export async function resetUserMfa(_prev: UserState, formData: FormData): Promise<UserState> {
  const { session } = await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return { error: "userForm" };
  try {
    await api(`/v1/users/${id.data}/reset-mfa`, { method: "POST", session });
  } catch (e) {
    return { error: errorKey(e) };
  }
  revalidatePath("/admin/utilisateurs");
  return {};
}
