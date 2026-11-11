import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { FlightSearch } from "@/components/admin/live/FlightSearch";
import { BookingRow } from "@/components/admin/live/BookingRow";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import type { FlightBooking } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Vols" };

const prefillKeys = ["origin", "destination", "departDate", "returnDate", "adults", "children", "infants", "cabin", "lead"] as const;

/** Vols : recherche chez le fournisseur (Amadeus, Duffel…), options posées et leur suivi. */
export default async function AdminFlightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (adminMode !== "live") notFound();
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.flights" });
  const params = await searchParams;
  const prefill = Object.fromEntries(prefillKeys.flatMap((k) => (typeof params[k] === "string" ? [[k, (params[k] as string).slice(0, 20)]] : [])));
  const bookings = await api<FlightBooking[]>("/v1/flights/bookings", { session });
  const created = typeof params.option === "string" ? bookings.find((b) => b.id === params.option) : undefined;

  return (
    <AdminShell section="flights" title={t("title")} live={await liveAccount(user, session)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>
      {created && (
        <p role="status" className="rounded-2xl border border-brand-green/40 bg-white px-5 py-4 text-sm text-ink">
          <strong className="text-night">{t("holdCreated", { pnr: created.bookingReference ?? "—" })}</strong>
        </p>
      )}
      <FlightSearch prefill={prefill} />
      <section className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-night">{t("holdsTitle")}</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted">{t("noHolds")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {bookings.map((b) => (
              <BookingRow key={b.id} booking={b} showLead />
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
