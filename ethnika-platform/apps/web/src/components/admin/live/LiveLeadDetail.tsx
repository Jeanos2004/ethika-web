import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { extractIata } from "@/content/airports";
import { liveDigest } from "@/lib/admin/account";
import { assignLead, setLeadStatus } from "@/lib/admin/actions";
import type { ApiLead, ApiLeadStatus, FlightBooking } from "@/lib/admin/types";
import { uiStatus } from "@/lib/admin/types";
import { Icon } from "@/components/ui/Icon";
import { formatLong, whatsappTo } from "@/components/admin/status";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { eventLabel } from "@/components/admin/live/LiveDashboard";
import { NoteForm } from "@/components/admin/live/NoteForm";
import { BookingRow } from "@/components/admin/live/BookingRow";

const statuses: ApiLeadStatus[] = ["new", "in_progress", "confirmed", "cancelled"];

/** Lien « Rechercher un vol » prérempli à partir d'une demande de billet. */
function flightSearchHref(lead: ApiLead) {
  const d = lead.details as Record<string, unknown>;
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  const q = new URLSearchParams({ lead: lead.reference });
  const from = extractIata(s("from")) ?? s("from");
  const to = extractIata(s("to")) ?? s("to");
  if (/^[A-Z]{3}$/.test(from)) q.set("origin", from);
  if (/^[A-Z]{3}$/.test(to)) q.set("destination", to);
  if (s("departDate")) q.set("departDate", s("departDate").slice(0, 10));
  if (s("trip") === "rt" && s("returnDate")) q.set("returnDate", s("returnDate").slice(0, 10));
  for (const k of ["adults", "children", "infants", "cabin"]) if (d[k] !== undefined) q.set(k, String(d[k]));
  return `/admin/vols?${q.toString()}`;
}

/** Fiche d'une demande : coordonnées, détail, statut, attribution, notes, historique, options de vol. */
export async function LiveLeadDetail({ lead, bookings, me }: { lead: ApiLead; bookings: FlightBooking[]; me: string }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin" });
  const d = liveDigest(lead);
  const wa = whatsappTo(lead.phone, t("leads.whatsappMessage", { name: lead.fullName, ref: lead.reference }));
  const mail = lead.email ? `mailto:${lead.email}?subject=${encodeURIComponent(t("leads.emailSubject", { ref: lead.reference }))}` : undefined;
  const mine = lead.assignedTo?.id === me;

  return (
    <>
      <Link href="/admin/demandes" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("leads.back")}
      </Link>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="font-mono text-xl text-night">{lead.reference}</h1>
              <StatusBadge status={uiStatus[lead.status]} />
            </div>
            <div className="flex flex-col gap-0.5">
              <strong className="text-xl break-words">{lead.fullName}</strong>
              <span className="text-sm break-words text-muted">
                {lead.phone} · {lead.email ?? t("leads.noEmail")}
              </span>
              <span className="text-xs text-muted">{t("live.leads.receivedOn", { date: formatLong(lead.createdAt) })}</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-cream p-3.5 text-sm">
              <span className="font-mono text-[11px] text-muted uppercase">{t(`types.${lead.type}`)}</span>
              <strong className="break-words">{d.summary}</strong>
              {d.tripLine && <span className="text-muted">{d.tripLine}</span>}
              {d.note && <span className="break-words whitespace-pre-line text-muted">{d.note}</span>}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-green px-4 text-sm font-bold text-white hover:bg-brand-green-dark">
                  <Icon name="whatsapp" size={16} /> {t("leads.whatsapp")}
                </a>
              )}
              {mail && (
                <a href={mail} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-night px-4 text-sm font-semibold text-night hover:bg-night hover:text-white">
                  <Icon name="mail" size={16} /> {t("leads.replyEmail")}
                </a>
              )}
              <a
                href={`/admin/demandes/${lead.reference}/pdf`}
                target="_blank"
                rel="noopener"
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-sand px-4 text-sm font-semibold text-night hover:bg-line"
              >
                <Icon name="download" size={16} /> {t("live.leads.pdf")}
              </a>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-bold text-night">{t("live.flights.holdsTitle")}</h2>
              <Link href={flightSearchHref(lead)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-gold px-4 text-sm font-bold text-ink hover:bg-brand-gold-hover">
                <Icon name="plane" size={16} /> {t("live.flights.searchForLead")}
              </Link>
            </div>
            {bookings.length === 0 ? <p className="text-sm text-muted">{t("live.flights.noHoldsForLead")}</p> : <ul className="divide-y divide-line">{bookings.map((b) => <BookingRow key={b.id} booking={b} />)}</ul>}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-night">{t("leads.changeStatus")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((s) => {
                const on = lead.status === s;
                return (
                  <form key={s} action={setLeadStatus}>
                    <input type="hidden" name="ref" value={lead.reference} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      type="submit"
                      aria-pressed={on}
                      disabled={on}
                      className={clsx("min-h-10 rounded-full border-[1.5px] px-3 text-[13px] font-semibold", on ? "border-night bg-night text-white" : "border-line-strong bg-white text-night hover:border-night")}
                    >
                      {t(`statuses.${uiStatus[s]}`)}
                    </button>
                  </form>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
              <span className="text-muted">
                {t("live.leads.assignedTo")} <strong className="text-night">{lead.assignedTo?.name ?? t("live.leads.unassigned")}</strong>
              </span>
              <form action={assignLead}>
                <input type="hidden" name="ref" value={lead.reference} />
                <input type="hidden" name="to" value={mine ? "none" : "me"} />
                <button type="submit" className="min-h-10 rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night hover:border-night">
                  {mine ? t("live.leads.release") : t("live.leads.takeIt")}
                </button>
              </form>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-night">{t("leads.historyTitle")}</h2>
            <ol className="flex flex-col gap-2 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-muted">
              {lead.events.map((e) => (
                <li key={e.id}>
                  <span className="font-mono text-xs">{formatLong(e.createdAt)}</span> · {eventLabel(t, e)}
                  {e.note && <span className="mt-0.5 block break-words whitespace-pre-line text-ink">{e.note}</span>}
                </li>
              ))}
            </ol>
            <NoteForm reference={lead.reference} />
          </section>
        </div>
      </div>
    </>
  );
}
