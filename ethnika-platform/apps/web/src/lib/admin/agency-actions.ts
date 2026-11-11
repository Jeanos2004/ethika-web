"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { requireAdmin } from "@/lib/admin/session";

export type AgencyState = { error?: string; saved?: number };

const fields = ["address", "phone", "whatsapp", "email", "licence", "rccm", "openingHours", "hoursWeekdays", "hoursSaturday", "hoursSunday", "latitude", "longitude", "paymentInstructions", "quoteTerms"] as const;
const schema = z.object({
  address: z.string().trim().min(3).max(200),
  phone: z.string().trim().min(6).max(40),
  whatsapp: z.string().trim().max(40),
  email: z.email().max(200),
  licence: z.string().trim().max(80),
  rccm: z.string().trim().max(80),
  openingHours: z.string().trim().max(200),
  hoursWeekdays: z.string().trim().max(60),
  hoursSaturday: z.string().trim().max(60),
  hoursSunday: z.string().trim().max(60),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  paymentInstructions: z.string().trim().min(10).max(1200),
  quoteTerms: z.string().trim().max(1200),
});

/** Coordonnées de l'agence (Paramètres > Agence) : reprises sur les récapitulatifs et les devis PDF. */
export async function saveAgency(_prev: AgencyState, formData: FormData): Promise<AgencyState> {
  const { session } = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(fields.map((k) => [k, String(formData.get(k) ?? "").replace(",", ".")])));
  if (!parsed.success) return { error: "agencyForm" };
  try {
    await api("/v1/agency", { method: "PATCH", session, body: parsed.data });
  } catch (e) {
    return { error: e instanceof ApiError && e.status === 400 ? "agencyForm" : "unavailable" };
  }
  revalidatePath("/admin/parametres/agence");
  return { saved: Date.now() };
}
