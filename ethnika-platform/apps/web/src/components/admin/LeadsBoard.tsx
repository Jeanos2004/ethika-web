"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { leadTypes, type LeadType } from "@/lib/schemas/lead";
import { leadStatuses, useDemoLeads, useHydrated, type DemoLead, type LeadStatus } from "@/lib/demo/store";
import { digest } from "@/lib/demo/summary";
import { toCsv } from "@/lib/csv";
import { slugify } from "@/lib/slug";
import { formatLong, formatShort } from "@/components/admin/status";
import { StatusBadge } from "@/components/admin/StatusBadge";

import { LeadDetail } from "@/components/admin/LeadDetail";
import { NewLeadModal } from "@/components/admin/NewLeadModal";
import { AckEmail } from "@/components/admin/AckEmail";
import { StatCards } from "@/components/admin/StatCards";

type StatusFilter = "all" | LeadStatus;
type TypeFilter = "all" | LeadType;

/**
 * Demandes (AdminDemandes.dc.html), entièrement responsive :
 * - < 768 px : cartes ; ≥ 768 px : tableau ;
 * - ≥ 1280 px : détail à droite ; en dessous : détail en panneau superposé (plein écran sur mobile).
 */
export function LeadsBoard() {
  const t = useTranslations("admin");
  const leads = useDemoLeads();
  const hydrated = useHydrated();
  const params = useSearchParams();
  const router = useRouter();
  // Arrivée par l'onglet « Nouvelle » (barre mobile) ou le bouton du tableau de bord.
  const wantsNew = params.get("nouvelle") === "1";
  const initialRef = params.get("ref") ?? undefined;
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | undefined>(initialRef);
  const [sheetOpen, setSheetOpen] = useState(Boolean(initialRef));
  const [newOpen, setNewOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const filtered = useMemo(() => {
    const words = slugify(query).split("-").filter(Boolean);
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (type !== "all" && l.type !== type) return false;
      if (!words.length) return true;
      const hay = slugify(`${l.ref} ${l.name} ${l.phone} ${l.email ?? ""} ${digest(l).summary}`);
      return words.every((w) => hay.includes(w));
    });
  }, [leads, status, type, query]);

  const current = leads.find((l) => l.ref === selected) ?? filtered[0];
  const typeOptions: TypeFilter[] = ["all", ...leadTypes];

  function open(ref: string) {
    setSelected(ref);
    setSheetOpen(true);
  }

  function exportCsv() {
    const rows = filtered.map((l) => {
      const d = digest(l);
      return [l.ref, formatLong(l.createdAt), t(`statuses.${l.status}`), t(`types.${l.type}`), l.name, l.phone, l.email ?? "", d.summary, d.note ?? "", t(`sources.${l.source}`)];
    });
    const csv = toCsv(["Référence", "Reçue le", "Statut", "Type", "Client", "Téléphone", "E-mail", "Détail", "Note", "Source"], rows);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ethnika-demandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-night sm:text-[34px]">{t("leads.title")}</h1>
          <span className="text-[13px] text-muted">{hydrated ? t("leads.subtitle", { count: leads.length }) : " "}</span>
        </div>
        <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto">
          <button
            type="button"
            onClick={exportCsv}
            className="flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-night px-4 text-sm font-semibold text-night hover:bg-night hover:text-white"
          >
            <Icon name="download" size={16} /> {t("leads.export")}
          </button>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-night px-4 text-sm font-semibold text-white hover:bg-night-line"
          >
            <Icon name="plus" size={16} /> {t("leads.new")}
          </button>
        </div>
      </div>

      <StatCards leads={leads} />

      {/* FILTRES */}
      <div className="flex flex-col gap-3">
        <div role="group" aria-label={t("leads.statusFilter")} className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <div className="flex shrink-0 gap-1 rounded-full border border-line bg-white p-1">
            {(["all", ...leadStatuses] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={clsx("h-10 shrink-0 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap", status === s ? "bg-night text-white" : "text-night hover:bg-sand")}
              >
                {t(`statusesPlural.${s}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t("leads.typeFilter")} className="flex flex-wrap gap-1.5">
            {typeOptions.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={type === v}
                onClick={() => setType(v)}
                className={clsx(
                  "h-10 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold",
                  type === v ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-line-strong",
                )}
              >
                {t(`typeFilters.${v}`)}
              </button>
            ))}
          </div>
          <label className="relative w-full md:ml-auto md:w-[280px]">
            <span className="sr-only">{t("leads.search")}</span>
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("leads.searchPlaceholder")}
              className="h-11 w-full rounded-full border-[1.5px] border-line-strong bg-white pr-4 pl-10 text-sm focus:border-night focus:ring-4 focus:ring-brand-gold/35 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* LISTE + DÉTAIL */}
      <div className="flex items-start gap-4">
        <section aria-label={t("leads.listLabel")} className="min-w-0 flex-1">
          {!hydrated ? (
            <div className="h-64 animate-pulse rounded-2xl border border-line bg-white" />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-10 text-center text-muted">
              {t("leads.noRows")}
              <button
                type="button"
                onClick={() => {
                  setStatus("all");
                  setType("all");
                  setQuery("");
                }}
                className="h-10 rounded-full border-[1.5px] border-night px-4 text-sm font-semibold text-night hover:bg-night hover:text-white"
              >
                {t("leads.clearFilters")}
              </button>
            </div>
          ) : (
            <>
              {/* Cartes (< 768 px) */}
              <ul className="flex flex-col gap-2.5 md:hidden">
                {filtered.map((l) => (
                  <li key={l.ref}>
                    <LeadCard lead={l} selected={l.ref === current?.ref} onOpen={() => open(l.ref)} />
                  </li>
                ))}
              </ul>
              {/* Tableau (≥ 768 px) */}
              <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <caption className="sr-only">{t("leads.tableCaption")}</caption>
                  <thead>
                    <tr className="text-left font-mono text-[11px] tracking-[0.08em] text-muted">
                      {(["colRef", "colClient", "colType", "colDetail", "colDate", "colStatus"] as const).map((c) => (
                        <th key={c} scope="col" className="px-4 py-3.5 font-medium">
                          {t(`leads.${c}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l) => {
                      const isSel = l.ref === current?.ref;
                      return (
                        <tr key={l.ref} onClick={() => open(l.ref)} className={clsx("cursor-pointer border-t border-line align-top hover:bg-cream", isSel && "bg-cream")}>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              aria-current={isSel ? "true" : undefined}
                              aria-label={t("leads.open", { ref: l.ref })}
                              onClick={(e) => {
                                e.stopPropagation();
                                open(l.ref);
                              }}
                              className="font-mono font-medium whitespace-nowrap text-night underline-offset-2 hover:underline"
                            >
                              {l.ref}
                            </button>
                          </td>
                          <td className="px-4 py-3.5">
                            <strong className="block">{l.name}</strong>
                            <span className="text-xs whitespace-nowrap text-muted">{l.phone}</span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">{t(`types.${l.type}`)}</td>
                          <td className="max-w-[280px] px-4 py-3.5 text-muted">{digest(l).summary}</td>
                          <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap text-muted">{formatShort(l.createdAt)}</td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={l.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Détail à droite (≥ 1280 px) */}
        <aside aria-label={t("leads.detailLabel")} className="sticky top-6 hidden w-[360px] shrink-0 rounded-2xl border border-line bg-white p-[22px] xl:block">
          {hydrated && current ? <LeadDetail lead={current} onPreviewEmail={() => setEmailOpen(true)} /> : <p className="text-sm text-muted">{t("leads.noSelection")}</p>}
        </aside>
      </div>

      {hydrated && current && sheetOpen && <DetailSheet lead={current} onClose={() => setSheetOpen(false)} onPreviewEmail={() => setEmailOpen(true)} />}

      <NewLeadModal
        open={newOpen || wantsNew}
        onClose={() => {
          setNewOpen(false);
          if (wantsNew) router.replace("/admin/demandes", { scroll: false });
        }}
        onCreated={(ref) => {
          setNewOpen(false);
          if (wantsNew) router.replace("/admin/demandes", { scroll: false });
          setStatus("all");
          setType("all");
          setQuery("");
          open(ref);
        }}
      />
      {current && (
        <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title={t("leads.previewEmail")} eyebrow={t("email.eyebrow")} className="w-[min(720px,calc(100%-24px))]">
          <AckEmail lead={current} />
        </Modal>
      )}
    </>
  );
}

function LeadCard({ lead, selected, onOpen }: { lead: DemoLead; selected: boolean; onOpen: () => void }) {
  const t = useTranslations("admin");
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={selected ? "true" : undefined}
      aria-label={t("leads.open", { ref: lead.ref })}
      className={clsx("flex w-full flex-col gap-2 rounded-2xl border bg-white p-4 text-left transition-colors hover:border-line-strong", selected ? "border-night" : "border-line")}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium text-night">{lead.ref}</span>
        <StatusBadge status={lead.status} />
      </span>
      <span className="flex flex-col">
        <strong className="text-[15px] break-words text-night">{lead.name}</strong>
        <span className="text-xs text-muted">
          {t(`types.${lead.type}`)} · {formatShort(lead.createdAt)}
        </span>
      </span>
      <span className="line-clamp-2 text-sm break-words text-muted">{digest(lead).summary}</span>
    </button>
  );
}

/** Détail en panneau superposé (< 1280 px) : plein écran sur mobile, tiroir à droite dès 768 px. */
function DetailSheet({ lead, onClose, onPreviewEmail }: { lead: DemoLead; onClose: () => void; onPreviewEmail: () => void }) {
  const t = useTranslations("admin");
  const back = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    back.current?.focus();
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // Une modale (aperçu de l'e-mail) gère sa propre touche Échap.
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) close.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 xl:hidden">
      <button type="button" aria-hidden="true" tabIndex={-1} onClick={onClose} className="absolute inset-0 hidden bg-ink/50 md:block" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("leads.detailLabel")}
        className="absolute inset-0 flex flex-col overflow-y-auto bg-white md:left-auto md:w-[440px] md:shadow-[0_0_60px_rgb(18_24_21/0.3)]"
      >
        <div className="sticky top-0 z-10 flex items-center border-b border-line bg-white px-3 py-2">
          <button ref={back} type="button" onClick={onClose} className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-night hover:bg-sand">
            <Icon name="arrowLeft" size={18} /> {t("leads.back")}
          </button>
        </div>
        <div className="p-5">
          <LeadDetail lead={lead} onPreviewEmail={onPreviewEmail} />
        </div>
      </div>
    </div>
  );
}
