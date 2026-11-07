"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { leadStatuses, setLeadStatus, type DemoLead } from "@/lib/demo/store";
import { digest } from "@/lib/demo/summary";
import { formatLong, whatsappTo } from "@/components/admin/status";
import { StatusBadge } from "@/components/admin/StatusBadge";

/** Détail d'une demande (colonne de droite de AdminDemandes.dc.html). */
export function LeadDetail({ lead, onPreviewEmail }: { lead: DemoLead; onPreviewEmail: () => void }) {
  const t = useTranslations("admin");
  const d = digest(lead);
  const wa = whatsappTo(lead.phone, t("leads.whatsappMessage", { name: lead.name, ref: lead.ref }));
  const mail = lead.email ? `mailto:${lead.email}?subject=${encodeURIComponent(t("leads.emailSubject", { ref: lead.ref }))}` : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xl text-night">{lead.ref}</span>
        <StatusBadge status={lead.status} />
      </div>
      <div className="flex flex-col gap-0.5">
        <strong className="text-xl break-words">{lead.name}</strong>
        <span className="text-sm break-words text-muted">
          {lead.phone} · {lead.email ?? t("leads.noEmail")}
        </span>
        {lead.source === "site" && <span className="mt-1 self-start rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-muted">{t("leads.yours")}</span>}
      </div>
      <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-cream p-3.5 text-sm">
        <span className="font-mono text-[11px] text-muted uppercase">{t(`types.${lead.type}`)}</span>
        <strong className="break-words">{d.summary}</strong>
        {d.tripLine && <span className="text-muted">{d.tripLine}</span>}
        {d.note && <span className="whitespace-pre-line break-words text-muted">{d.note}</span>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold">{t("leads.changeStatus")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {leadStatuses.map((s) => {
            const on = lead.status === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => setLeadStatus(lead.ref, s)}
                className={clsx(
                  "min-h-10 rounded-full border-[1.5px] px-3 text-[13px] font-semibold transition-colors",
                  on ? "border-night bg-night text-white" : "border-line-strong bg-white text-night hover:border-night",
                )}
              >
                {t(`statuses.${s}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">{t("leads.historyTitle")}</span>
        <ol className="flex flex-col gap-1 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-muted">
          {lead.history.map((h, i) => (
            <li key={`${h.at}-${i}`}>
              <span className="font-mono text-xs">{formatLong(h.at)}</span> · {h.status === "received" ? t("history.received", { source: t(`sources.${lead.source}`) }) : t(`history.${h.status}`)}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-green px-4 text-sm font-bold text-white hover:bg-brand-green-dark"
          >
            <Icon name="whatsapp" size={16} /> {t("leads.whatsapp")}
          </a>
        ) : null}
        {mail ? (
          <a
            href={mail}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-night px-4 text-sm font-semibold text-night hover:bg-night hover:text-white"
          >
            <Icon name="mail" size={16} /> {t("leads.replyEmail")}
          </a>
        ) : null}
      </div>
      <button type="button" onClick={onPreviewEmail} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-sand px-4 text-sm font-semibold text-night hover:bg-line">
        <Icon name="mail" size={16} /> {t("leads.previewEmail")}
      </button>
    </div>
  );
}
