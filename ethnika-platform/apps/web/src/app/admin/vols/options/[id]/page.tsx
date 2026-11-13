import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { bookingDot } from "@/components/admin/live/BookingRow";
import { SettingRow, SettingsCard } from "@/components/admin/live/SettingsShell";
import { localTime } from "@/components/admin/live/OfferSummary";
import { formatLong } from "@/components/admin/status";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/server";
import { cancelBooking } from "@/lib/admin/actions";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import type { FlightBooking } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Option de vol" };

function remaining(ms: number) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600_000);
  return h >= 48 ? `${Math.floor(h / 24)} j` : `${h} h ${Math.floor((ms % 3600_000) / 60_000)} min`;
}

/** Fiche d'une option (PNR) : resynchronisée avec le fournisseur à chaque ouverture ; trajet, échéance, demande liée, annulation. */
export default async function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  if (adminMode !== "live") notFound();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.flights" });
  let b: FlightBooking;
  let stale = false;
  try {
    b = await api<FlightBooking>(`/v1/flights/bookings/${id}`, { session, timeoutMs: 60_000 });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    // Fournisseur injoignable : on affiche la dernière version connue (liste locale), signalée comme non actualisée.
    const local = (await api<FlightBooking[]>("/v1/flights/bookings", { session })).find((x) => x.id === id);
    if (!local) throw e;
    b = local;
    stale = true;
  }
  const left = b.payBefore ? new Date(b.payBefore).getTime() - new Date().getTime() : null;

  return (
    <AdminShell section="flights" title={b.bookingReference ?? t("bookingTitle")} live={await liveAccount(user, session)}>
      <Link href="/admin/vols" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("title")}
      </Link>

      <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-night p-5 text-white sm:p-7">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.14em] text-on-dark-muted uppercase">{t("pnr")}</span>
          <h1 className="font-mono text-[32px] leading-none font-semibold tracking-wide text-brand-gold">{b.bookingReference ?? "—"}</h1>
          <span className="text-on-dark">
            {b.itinerary.slices.map((s) => `${s.origin} → ${s.destination}`).join(" · ")} · {b.itinerary.airline}
          </span>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
            <span aria-hidden="true" className={clsx("size-2 rounded-full", bookingDot[b.status])} />
            {t(`bookingStatus.${b.status}`)}
          </span>
          <strong className="text-2xl tabular-nums">
            {b.totalAmount} {b.currency}
          </strong>
        </div>
      </section>

      {stale && (
        <p role="status" className="flex items-center gap-2 rounded-2xl border border-gold-50 bg-white px-5 py-3 text-sm text-gold-700">
          <Icon name="alert" size={16} /> {t("stale")}
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <SettingsCard title={t("itinerary")}>
            <ol className="flex flex-col gap-3">
              {b.itinerary.slices.map((s, i) => (
                <li key={i} className="flex items-center gap-4 rounded-xl bg-sand px-4 py-3">
                  <span className="font-mono text-xl font-semibold text-night">{s.origin}</span>
                  <span className="flex flex-1 items-center gap-2 text-muted">
                    <span className="h-px flex-1 bg-line-strong" />
                    <Icon name="plane" size={16} />
                    <span className="h-px flex-1 bg-line-strong" />
                  </span>
                  <span className="font-mono text-xl font-semibold text-night">{s.destination}</span>
                  <span className="hidden text-sm text-muted sm:block">{localTime(s.departAt)}</span>
                </li>
              ))}
            </ol>
          </SettingsCard>
          <SettingsCard title={t("details")}>
            <dl>
              <SettingRow label={t("airline")}>{b.itinerary.airline}</SettingRow>
              <SettingRow label={t("passengersLabel")}>{t("passengers", { count: b.passengerCount })}</SettingRow>
              <SettingRow label={t("provider")}>
                <span className="font-mono">{b.provider}</span>
              </SettingRow>
              <SettingRow label={t("createdAt")}>{formatLong(b.createdAt)}</SettingRow>
              <SettingRow label={t("lead")}>
                {b.lead ? (
                  <Link href={`/admin/demandes/${b.lead.reference}`} className="font-semibold text-night hover:underline">
                    <span className="font-mono">{b.lead.reference}</span> · {b.lead.fullName}
                  </Link>
                ) : (
                  <span className="text-muted">{t("noLead")}</span>
                )}
              </SettingRow>
            </dl>
          </SettingsCard>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <SettingsCard title={t("deadline")} hint={t("deadlineHint")}>
            {b.status === "held" && b.payBefore ? (
              <div className={clsx("flex flex-col gap-1 rounded-xl px-4 py-3", left !== null && left < 24 * 3600_000 ? "bg-red-50 text-red-800" : "bg-sand text-night")}>
                <strong className="text-lg">{formatLong(b.payBefore)}</strong>
                <span className="text-sm">{left !== null && remaining(left) ? t("remaining", { time: remaining(left)! }) : t("expired")}</span>
              </div>
            ) : (
              <p className="text-sm text-muted">{b.status === "confirmed" ? t("ticketed") : b.status === "cancelled" ? t("cancelledInfo") : t("noDeadline")}</p>
            )}
          </SettingsCard>
          <SettingsCard title={t("nextSteps")}>
            <ol className="flex flex-col gap-2 text-sm text-ink">
              {(["step1", "step2", "step3"] as const).map((k, i) => (
                <li key={k} className="flex gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand font-mono text-xs font-semibold">{i + 1}</span>
                  {t(k)}
                </li>
              ))}
            </ol>
            {b.status === "held" && (
              <details className="relative border-t border-line pt-4">
                <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border-[1.5px] border-line-strong bg-white px-4 text-[13px] font-semibold text-night hover:border-brand-red hover:text-brand-red">
                  {t("cancel")}
                </summary>
                <form action={cancelBooking} className="mt-3 flex flex-col gap-2 rounded-xl border border-line bg-white p-3 text-sm">
                  <input type="hidden" name="id" value={b.id} />
                  <span className="text-ink">{t("cancelConfirm")}</span>
                  <button type="submit" className="min-h-10 self-start rounded-full bg-brand-red px-4 text-[13px] font-semibold text-white">
                    {t("cancelYes")}
                  </button>
                </form>
              </details>
            )}
          </SettingsCard>
        </div>
      </div>
    </AdminShell>
  );
}
