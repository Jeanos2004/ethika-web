"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { api } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";
import { leadSchema } from "@/lib/schemas/lead";
import { readLeadForm } from "@/lib/lead-form";

/** `fields` : noms des champs à corriger (libellés traduits à l'affichage). */
export type ManualLeadState = { error?: "manualForm" | "unavailable"; fields?: string[] };

/**
 * Demande saisie par un agent (téléphone, WhatsApp, agence) : même lecture et même validation que les formulaires
 * du site ; le consentement est celui recueilli oralement par l'agent (case obligatoire).
 */
export async function createManualLead(_prev: ManualLeadState, formData: FormData): Promise<ManualLeadState> {
  const { session } = await requireUser();
  const raw = readLeadForm(formData);
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { error: "manualForm", fields: Object.keys(z.flattenError(parsed.error).fieldErrors) };
  const { website: _honeypot, ...lead } = parsed.data;
  void _honeypot;
  let reference: string;
  try {
    ({ reference } = await api<{ reference: string }>("/v1/leads/manual", { method: "POST", session, body: lead }));
  } catch {
    return { error: "unavailable" };
  }
  redirect(`/admin/demandes/${reference}`);
}
