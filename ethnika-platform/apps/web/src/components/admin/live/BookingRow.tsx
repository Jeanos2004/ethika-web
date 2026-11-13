import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import type { FlightBooking } from "@/lib/admin/types";
import { formatShort } from "@/components/admin/status";
import { Icon } from "@/components/ui/Icon";

export const bookingDot = { held: "bg-brand-gold", confirmed: "bg-brand-green", cancelled: "bg-brand-red" } as const;

/** Ligne d'une option de vol : PNR, trajet, compagnie, montant, échéance ; ouvre la fiche de l'option. */
export async function BookingRow({ booking: b, showLead = false }: { booking: FlightBooking; showLead?: boolean }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.flights" });
  const route = b.itinerary.slices.map((s) => `${s.origin} → ${s.destination}`).join(" · ");
  const dueMs = b.payBefore ? new Date(b.payBefore).getTime() - new Date().getTime() : null;
  const soon = b.status === "held" && dueMs !== null && dueMs < 24 * 3600_000;
  return (
    <li>
      <Link href={`/admin/vols/options/${b.id}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 px-4 py-3.5 hover:bg-cream sm:px-5 lg:grid-cols-[auto_minmax(0,1.3fr)_minmax(0,1fr)_9rem_auto]">
        <span className={clsx("flex size-10 items-center justify-center rounded-xl", soon ? "bg-red-50 text-red-700" : "bg-sand text-night")}>
          <Icon name="plane" size={17} />
        </span>
        <span className="flex min-w-0 flex-col">
          <strong className="truncate text-night">
            <span className="font-mono">{b.bookingReference ?? "—"}</span> · {route}
          </strong>
          <span className="truncate text-xs text-muted">
            {b.itinerary.airline} · {t("passengers", { count: b.passengerCount })}
            {showLead && b.lead && (
              <>
                {" · "}
                <span className="font-mono">{b.lead.reference}</span> {b.lead.fullName}
              </>
            )}
          </span>
        </span>
        <span className="col-span-3 flex flex-wrap items-center gap-1.5 text-xs lg:col-span-1">
          <strong className="text-night tabular-nums">
            {b.totalAmount} {b.currency}
          </strong>
          {b.status === "held" && b.payBefore && <span className={clsx("rounded-full px-2 py-0.5 font-semibold", soon ? "bg-red-50 text-red-700" : "bg-sand text-night")}>{t("payBeforeShort", { date: formatShort(b.payBefore) })}</span>}
        </span>
        <span className="hidden text-xs text-muted lg:block">{formatShort(b.createdAt)}</span>
        <span className="col-start-3 row-start-1 inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold lg:col-start-auto lg:row-start-auto">
          <span aria-hidden="true" className={clsx("size-2 rounded-full", bookingDot[b.status])} />
          {t(`bookingStatus.${b.status}`)}
        </span>
      </Link>
    </li>
  );
}
