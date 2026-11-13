"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";
import type { FlightOffer } from "@/lib/admin/types";

/*
 * Actions du back-office connecté. La session est revérifiée par l'API à chaque appel (rôle, 2FA) ;
 * les entrées sont validées ici puis de nouveau par l'API. Les erreurs renvoyées sont des clés (admin.live.errors).
 */

const ref = z.string().regex(/^ETH-[A-HJ-NP-Z2-9]{6}$/);
const uuid = z.uuid();

function apiErrorKey(e: unknown) {
  if (e instanceof ApiError) {
    if (e.code === "offer_not_holdable") return "notHoldable";
    if (e.status === 404) return "notFound";
    if (e.status === 409 || e.status === 410) return "offerExpired";
    if (e.status === 422 || e.status === 400) return "providerRefused";
    if (e.status === 429) return "rateLimited";
  }
  if (e instanceof Error && e.name === "TimeoutError") return "timeout";
  return "unavailable";
}

export async function setLeadStatus(formData: FormData) {
  const { session } = await requireUser();
  const reference = ref.parse(formData.get("ref"));
  const status = z.enum(["new", "in_progress", "confirmed", "cancelled"]).parse(formData.get("status"));
  await api(`/v1/leads/${reference}/status`, { method: "PATCH", session, body: { status } });
  revalidatePath(`/admin/demandes/${reference}`);
  revalidatePath("/admin/demandes");
}

export type NoteState = { error?: string; ok?: number };

export async function addLeadNote(_prev: NoteState, formData: FormData): Promise<NoteState> {
  const { session } = await requireUser();
  const reference = ref.parse(formData.get("ref"));
  const note = z.string().trim().min(2).max(2000).safeParse(formData.get("note"));
  if (!note.success) return { error: "noteLength" };
  try {
    await api(`/v1/leads/${reference}/notes`, { method: "POST", session, body: { note: note.data } });
  } catch (e) {
    return { error: apiErrorKey(e) };
  }
  revalidatePath(`/admin/demandes/${reference}`);
  return { ok: Date.now() };
}

export async function assignLead(formData: FormData) {
  const { user, session } = await requireUser();
  const reference = ref.parse(formData.get("ref"));
  const target = formData.get("to") === "me" ? user.userId : null;
  await api(`/v1/leads/${reference}/assign`, { method: "PATCH", session, body: { userId: target } });
  revalidatePath(`/admin/demandes/${reference}`);
  revalidatePath("/admin/demandes");
}

/* ---------- Vols ---------- */

const iata = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/);
const searchForm = z.object({
  origin: iata,
  destination: iata,
  departDate: z.iso.date(),
  returnDate: z.union([z.literal(""), z.iso.date()]),
  adults: z.coerce.number().int().min(1).max(9),
  children: z.coerce.number().int().min(0).max(8),
  infants: z.coerce.number().int().min(0).max(8),
  cabin: z.enum(["eco", "business", "first"]),
});

export type SearchState = { error?: string; offers?: FlightOffer[]; tookMs?: number; query?: Record<string, string> };

export async function searchFlights(_prev: SearchState, formData: FormData): Promise<SearchState> {
  const { session } = await requireUser();
  const raw = Object.fromEntries(["origin", "destination", "departDate", "returnDate", "adults", "children", "infants", "cabin"].map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = searchForm.safeParse(raw);
  if (!parsed.success) return { error: "searchForm", query: raw };
  const q = parsed.data;
  if (q.origin === q.destination || q.infants > q.adults || (q.returnDate && q.returnDate < q.departDate)) return { error: "searchForm", query: raw };

  const slices = [{ origin: q.origin, destination: q.destination, date: q.departDate }];
  if (q.returnDate) slices.push({ origin: q.destination, destination: q.origin, date: q.returnDate });
  const started = Date.now();
  try {
    // Le bac à sable Amadeus simulé répond en 10 à 70 s : délai large côté site, l'API borne ses propres appels.
    const res = await api<{ offers: FlightOffer[] }>("/v1/flights/search", {
      method: "POST",
      session,
      timeoutMs: 180_000,
      body: { slices, passengers: { adults: q.adults, children: q.children, infants: q.infants }, cabin: q.cabin },
    });
    return { offers: res.offers.slice(0, 30), tookMs: Date.now() - started, query: raw };
  } catch (e) {
    return { error: apiErrorKey(e), query: raw };
  }
}

const passengerForm = z.object({
  type: z.enum(["adult", "child", "infant"]),
  title: z.enum(["mr", "ms", "mrs", "miss", "dr"]),
  givenName: z.string().trim().min(1).max(60),
  familyName: z.string().trim().min(1).max(60),
  bornOn: z.iso.date(),
  gender: z.enum(["m", "f"]),
  email: z.email().max(200),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .pipe(z.string().regex(/^\+[1-9][0-9]{7,14}$/)),
});

export type HoldState = { error?: string };

export async function holdFlight(_prev: HoldState, formData: FormData): Promise<HoldState> {
  const { session } = await requireUser();
  const offerId = z
    .string()
    .regex(/^[A-Za-z0-9_-]{4,80}$/)
    .safeParse(formData.get("offerId"));
  const leadRef = String(formData.get("leadRef") ?? "").trim();
  const count = z.coerce.number().int().min(1).max(9).safeParse(formData.get("count"));
  if (!offerId.success || !count.success || (leadRef && !ref.safeParse(leadRef).success)) return { error: "holdForm" };

  const passengers = [];
  for (let i = 0; i < count.data; i++) {
    const p = passengerForm.safeParse(Object.fromEntries(["type", "title", "givenName", "familyName", "bornOn", "gender", "email", "phone"].map((k) => [k, formData.get(`p${i}.${k}`) ?? ""])));
    if (!p.success) return { error: "holdForm" };
    passengers.push(p.data);
  }

  let booking: { id: string };
  try {
    booking = await api<{ id: string }>("/v1/flights/orders", { method: "POST", session, timeoutMs: 180_000, body: { offerId: offerId.data, passengers, ...(leadRef && { leadRef }) } });
  } catch (e) {
    return { error: apiErrorKey(e) };
  }
  revalidatePath("/admin/vols");
  redirect(`/admin/vols?option=${booking.id}`);
}

export async function cancelBooking(formData: FormData) {
  const { session } = await requireUser();
  const id = uuid.parse(formData.get("id"));
  await api(`/v1/flights/bookings/${id}/cancel`, { method: "POST", session, timeoutMs: 60_000 });
  revalidatePath("/admin/vols");
  revalidatePath(`/admin/vols/options/${id}`);
}
