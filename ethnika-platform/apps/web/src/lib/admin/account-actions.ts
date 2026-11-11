"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";

/** Paramètres du compte connecté ; `error` est une clé (admin.live.errors). */
export type AccountState = { error?: string; saved?: number };

export async function renameAccount(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const { session } = await requireUser();
  const name = z.string().trim().min(2).max(120).safeParse(formData.get("name"));
  if (!name.success) return { error: "nameLength" };
  try {
    await api("/v1/account", { method: "PATCH", session, body: { name: name.data } });
  } catch {
    return { error: "unavailable" };
  }
  revalidatePath("/admin", "layout");
  return { saved: Date.now() };
}

export async function revokeSession(formData: FormData) {
  const { session } = await requireUser();
  const handle = z
    .string()
    .regex(/^[a-f0-9]{16}$/)
    .parse(formData.get("handle"));
  await api("/v1/account/sessions/revoke", { method: "POST", session, body: { handle } }).catch((e: unknown) => {
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  });
  revalidatePath("/admin/parametres/sessions");
}

export async function revokeOtherSessions() {
  const { session } = await requireUser();
  await api("/v1/account/sessions/revoke-others", { method: "POST", session });
  revalidatePath("/admin/parametres/sessions");
}
