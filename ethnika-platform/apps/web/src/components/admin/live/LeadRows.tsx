"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { assignLead, setLeadStatus } from "@/lib/admin/actions";
import type { ApiLeadStatus, ApiLeadType } from "@/lib/admin/types";
import { uiStatus } from "@/lib/admin/types";
import { Icon } from "@/components/ui/Icon";
import { formatLong, formatShort, whatsappTo } from "@/components/admin/status";
import { StatusBadge } from "@/components/admin/StatusBadge";

export type LeadRowData = {
  reference: string;
  type: ApiLeadType;
  status: ApiLeadStatus;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
  source: string;
  summary: string;
  tripLine?: string;
  note?: string;
};

const statuses: ApiLeadStatus[] = ["new", "in_progress", "confirmed", "cancelled"];

/** Lignes de la liste des demandes ; un clic ouvre un panneau d'aperçu avec les actions rapides. */
export function LeadRows({ rows, me }: { rows: LeadRowData[]; me: string }) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState<string | null>(null);
  const current = rows.find((r) => r.reference === open);

  return (
    <>
      <ul className="divide-y divide-line">
        {rows.map((l) => (
          <li key={l.reference}>
            <button
              type="button"
              onClick={() => setOpen(l.reference)}
              aria-haspopup="dialog"
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 text-left hover:bg-cream sm:px-5 lg:grid-cols-[7.5rem_minmax(0,12rem)_minmax(0,1fr)_7rem_8rem]"
            >
              <span className="font-mono text-[13px] font-medium text-night">{l.reference}</span>
              <StatusBadge status={uiStatus[l.status]} className="justify-self-end lg:order-last" />
              <span className="flex min-w-0 flex-col">
                <strong className="truncate text-sm text-night">{l.fullName}</strong>
                <span className="truncate text-xs text-muted">{l.assignedTo ? l.assignedTo.name : t("live.leads.unassigned")}</span>
              </span>
              <span className="col-span-2 min-w-0 truncate text-sm text-muted lg:col-span-1">
                <span className="font-mono text-[11px] text-subtle uppercase">{t(`types.${l.type}`)}</span> · {l.summary}
              </span>
              <span className="hidden font-mono text-xs text-muted lg:block">{formatShort(l.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>
      {current && <LeadDrawer lead={current} me={me} onClose={() => setOpen(null)} />}
    </>
  );
}

/** Panneau latéral sur <dialog> natif : focus piégé, Échap, page inerte ; le focus revient à la ligne à la fermeture. */
function LeadDrawer({ lead, me, onClose }: { lead: LeadRowData; me: string; onClose: () => void }) {
  const t = useTranslations("admin");
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    const onCancel = () => close.current();
    dialog?.addEventListener("close", onCancel);
    return () => {
      // Pas de dialog.close() ici : en mode strict, l'effet est rejoué et l'événement « close » refermerait aussitôt
      // le panneau. Le démontage retire l'élément, ce qui suffit à quitter le mode modal.
      dialog?.removeEventListener("close", onCancel);
      previous?.focus();
    };
  }, []);

  const wa = whatsappTo(lead.phone, t("leads.whatsappMessage", { name: lead.fullName, ref: lead.reference }));
  const mine = lead.assignedTo?.id === me;

  return (
    <dialog
      ref={ref}
      aria-labelledby="drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-[440px] bg-sand p-0 text-ink shadow-2xl backdrop:bg-ink/40"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-line bg-white px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-mono text-[13px] text-muted">{lead.reference}</span>
            <h2 id="drawer-title" className="truncate text-xl font-bold text-night">
              {lead.fullName}
            </h2>
            <StatusBadge status={uiStatus[lead.status]} className="self-start" />
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label={t("closeMenu")} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-night hover:bg-line">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <section className="flex flex-col gap-1.5 rounded-xl border border-line bg-white p-4 text-sm">
            <span className="font-mono text-[11px] text-muted uppercase">{t(`types.${lead.type}`)}</span>
            <strong className="break-words text-night">{lead.summary}</strong>
            {lead.tripLine && <span className="text-muted">{lead.tripLine}</span>}
            {lead.note && <span className="line-clamp-4 break-words whitespace-pre-line text-muted">{lead.note}</span>}
          </section>

          <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-xl border border-line bg-white p-4 text-sm">
            <dt className="text-muted">{t("live.drawer.phone")}</dt>
            <dd className="break-words text-night">{lead.phone}</dd>
            <dt className="text-muted">{t("live.drawer.email")}</dt>
            <dd className="break-words text-night">{lead.email ?? t("leads.noEmail")}</dd>
            <dt className="text-muted">{t("live.drawer.received")}</dt>
            <dd className="text-night">{formatLong(lead.createdAt)}</dd>
            <dt className="text-muted">{t("live.drawer.source")}</dt>
            <dd className="text-night">{lead.source === "manual" ? t("live.drawer.sourceManual") : t("live.drawer.sourceSite")}</dd>
            <dt className="text-muted">{t("live.leads.assignedTo")}</dt>
            <dd className="text-night">{lead.assignedTo?.name ?? t("live.leads.unassigned")}</dd>
          </dl>

          <section className="flex flex-col gap-2">
            <h3 className="text-[13px] font-semibold text-ink">{t("leads.changeStatus")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((s) => (
                <form key={s} action={setLeadStatus}>
                  <input type="hidden" name="ref" value={lead.reference} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    aria-pressed={lead.status === s}
                    disabled={lead.status === s}
                    className={clsx(
                      "min-h-10 rounded-full border-[1.5px] px-3 text-[13px] font-semibold",
                      lead.status === s ? "border-night bg-night text-white" : "border-line-strong bg-white text-night hover:border-night",
                    )}
                  >
                    {t(`statuses.${uiStatus[s]}`)}
                  </button>
                </form>
              ))}
            </div>
            <form action={assignLead} className="mt-1">
              <input type="hidden" name="ref" value={lead.reference} />
              <input type="hidden" name="to" value={mine ? "none" : "me"} />
              <button type="submit" className="min-h-10 rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night hover:border-night">
                {mine ? t("live.leads.release") : t("live.leads.takeIt")}
              </button>
            </form>
          </section>
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t border-line bg-white p-4">
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-green px-4 text-sm font-bold text-white hover:bg-brand-green-dark">
              <Icon name="whatsapp" size={16} /> {t("leads.whatsapp")}
            </a>
          ) : (
            <span />
          )}
          <Link href={`/admin/demandes/${lead.reference}`} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-night px-4 text-sm font-semibold text-white hover:bg-night-2">
            {t("live.drawer.open")} <Icon name="arrowRight" size={16} />
          </Link>
        </footer>
      </div>
    </dialog>
  );
}
