import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { clsx } from "clsx";
import { cancelBooking } from "@/lib/admin/actions";
import type { FlightBooking } from "@/lib/admin/types";
import { formatLong } from "@/components/admin/status";

const dot = { held: "bg-brand-gold", confirmed: "bg-brand-green", cancelled: "bg-brand-red" } as const;

/** Option de vol (PNR) : trajet, montant, échéance, demande liée, annulation. */
export async function BookingRow({ booking: b, showLead = false }: { booking: FlightBooking; showLead?: boolean }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.flights" });
  const route = b.itinerary.slices.map((s) => `${s.origin} → ${s.destination}`).join(" · ");
  const soon = b.status === "held" && b.payBefore && new Date(b.payBefore).getTime() - new Date().getTime() < 24 * 3600_000;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <strong className="font-mono text-[15px] text-night">{b.bookingReference ?? "—"}</strong>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs font-semibold">
            <span aria-hidden="true" className={clsx("size-2 rounded-full", dot[b.status])} />
            {t(`bookingStatus.${b.status}`)}
          </span>
        </span>
        <span className="truncate text-sm text-ink">
          {route} · {b.itinerary.airline} · {t("passengers", { count: b.passengerCount })}
        </span>
        <span className={clsx("text-xs", soon ? "font-semibold text-red-700" : "text-muted")}>
          {b.totalAmount} {b.currency}
          {b.payBefore && b.status === "held" && <> · {t("payBefore", { date: formatLong(b.payBefore) })}</>}
          {showLead && b.lead && (
            <>
              {" · "}
              <Link href={`/admin/demandes/${b.lead.reference}`} className="font-mono text-night hover:underline">
                {b.lead.reference}
              </Link>{" "}
              {b.lead.fullName}
            </>
          )}
        </span>
      </span>
      {b.status === "held" && (
        // Annulation irréversible chez la compagnie : confirmation explicite en deux temps.
        <details className="group relative">
          <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night hover:border-night">{t("cancel")}</summary>
          <form action={cancelBooking} className="absolute right-0 z-10 mt-2 flex w-64 flex-col gap-2 rounded-xl border border-line bg-white p-3 text-sm shadow-lg">
            <input type="hidden" name="id" value={b.id} />
            <span className="text-ink">{t("cancelConfirm")}</span>
            <button type="submit" className="min-h-10 rounded-full bg-brand-red px-3.5 text-[13px] font-semibold text-white">
              {t("cancelYes")}
            </button>
          </form>
        </details>
      )}
    </li>
  );
}
