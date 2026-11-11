import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { LiveLeadDetail } from "@/components/admin/live/LiveLeadDetail";
import { api, ApiError } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import type { ApiLead, ApiQuote, FlightBooking } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Demande" };

export default async function AdminLeadPage({ params }: { params: Promise<{ ref: string }> }) {
  if (adminMode !== "live") notFound();
  const { ref } = await params;
  if (!/^ETH-[A-HJ-NP-Z2-9]{6}$/.test(ref)) notFound();
  const { user, session } = await requireUser();
  const [lead, bookings, quotes] = await Promise.all([
    api<ApiLead>(`/v1/leads/${ref}`, { session }).catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    }),
    api<FlightBooking[]>(`/v1/flights/bookings?leadRef=${ref}`, { session }),
    api<ApiQuote[]>(`/v1/leads/${ref}/quotes`, { session }).catch(() => []),
  ]);
  return (
    <AdminShell section="leads" title={lead.reference} live={await liveAccount(user, session)}>
      <LiveLeadDetail lead={lead} bookings={bookings} quotes={quotes} me={user.userId} />
    </AdminShell>
  );
}
