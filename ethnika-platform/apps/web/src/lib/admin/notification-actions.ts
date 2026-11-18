"use server";

import { api } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";

/** Ouverture de la cloche : les notifications affichées sont marquées comme lues (compteur remis à zéro). */
export async function markNotificationsSeen() {
  const { session } = await requireUser();
  await api("/v1/notifications/seen", { method: "POST", session }).catch(() => undefined);
}
