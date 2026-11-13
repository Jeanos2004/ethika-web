import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { BookingRow } from "@/components/admin/live/BookingRow";
import { FlightSearch } from "@/components/admin/live/FlightSearch";
import { EmptyState, FilterChip, KpiGrid, KpiTile, ListCard, PageHeader, Pager, listHref, readParams } from "@/components/admin/live/ListKit";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import type { FlightBooking } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Vols" };

const PAGE_SIZE = 10;
const prefillKeys = ["origin", "destination", "departDate", "returnDate", "adults", "children", "infants", "cabin", "lead"] as const;
const statuses = ["held", "confirmed", "cancelled"] as const;

/** Vols : indicateurs des options, recherche chez le fournisseur, options posées (filtres, pagination). */
export default async function AdminFlightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (adminMode !== "live") notFound();
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.flights" });
  const tl = await getTranslations({ locale: "fr", namespace: "admin.live.list" });
  const params = await searchParams;
  const { one, page } = readParams(params);
  const prefill = Object.fromEntries(prefillKeys.flatMap((k) => (typeof params[k] === "string" ? [[k, (params[k] as string).slice(0, 20)]] : [])));
  const bookings = await api<FlightBooking[]>("/v1/flights/bookings", { session });
  const created = one("option") ? bookings.find((b) => b.id === one("option")) : undefined;
  const status = (statuses as readonly string[]).includes(one("status")) ? one("status") : "";

  const now = new Date().getTime();
  const held = bookings.filter((b) => b.status === "held");
  const dueSoon = held.filter((b) => b.payBefore && new Date(b.payBefore).getTime() - now < 24 * 3600_000).length;
  const filtered = bookings.filter((b) => !status || b.status === status);
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const href = (over: Record<string, string | number | undefined>) => listHref("/admin/vols", { status, ...over });
  const searchOpen = Boolean(prefill.lead || prefill.origin) || bookings.length === 0;

  return (
    <AdminShell section="flights" title={t("title")} live={await liveAccount(user, session)}>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {created && (
        <p role="status" className="flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-brand-green-dark">
          <Icon name="check" size={16} /> {t("holdCreated", { pnr: created.bookingReference ?? "—" })}
        </p>
      )}

      <KpiGrid>
        <KpiTile icon="plane" label={t("kpiHeld")} value={held.length} note={t("kpiHeldNote")} href={href({ status: "held", page: 1 })} />
        <KpiTile icon="clock" tone={dueSoon ? "alert" : "default"} label={t("kpiDue")} value={dueSoon} note={dueSoon ? t("kpiDueAlert") : t("kpiDueOk")} href={href({ status: "held", page: 1 })} />
        <KpiTile icon="check" tone="good" label={t("kpiConfirmed")} value={bookings.filter((b) => b.status === "confirmed").length} note={t("kpiConfirmedNote")} href={href({ status: "confirmed", page: 1 })} />
        <KpiTile icon="close" label={t("kpiCancelled")} value={bookings.filter((b) => b.status === "cancelled").length} note={t("kpiCancelledNote")} href={href({ status: "cancelled", page: 1 })} />
      </KpiGrid>

      <details open={searchOpen || undefined} className="group rounded-2xl border border-line bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gold text-ink">
              <Icon name="search" size={17} />
            </span>
            <span className="flex flex-col">
              <strong className="text-night">{t("searchCta")}</strong>
              <span className="text-xs text-muted">{t("searchSummary")}</span>
            </span>
          </span>
          <Icon name="chevronDown" size={18} className="text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-4 border-t border-line p-4 sm:p-5">
          <FlightSearch prefill={prefill} />
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-1.5">
        <h2 className="mr-2 text-base font-bold text-night">{t("holdsTitle")}</h2>
        <FilterChip href={href({ status: undefined, page: 1 })} active={!status} count={bookings.length}>
          {tl("all")}
        </FilterChip>
        {statuses.map((s) => (
          <FilterChip key={s} href={href({ status: s, page: 1 })} active={status === s} count={bookings.filter((b) => b.status === s).length}>
            {t(`bookingStatus.${s}`)}
          </FilterChip>
        ))}
      </div>
      <ListCard footer={<Pager page={current} pageSize={PAGE_SIZE} total={filtered.length} hrefFor={(p) => href({ page: p })} />}>
        {shown.length === 0 ? (
          <EmptyState
            icon="plane"
            title={bookings.length ? tl("noMatch") : t("noHolds")}
            text={bookings.length ? undefined : t("noHoldsHint")}
            action={
              bookings.length ? (
                <Link href="/admin/vols" className="text-sm font-semibold text-night underline underline-offset-2">
                  {tl("reset")}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((b) => (
              <BookingRow key={b.id} booking={b} showLead />
            ))}
          </ul>
        )}
      </ListCard>
    </AdminShell>
  );
}
