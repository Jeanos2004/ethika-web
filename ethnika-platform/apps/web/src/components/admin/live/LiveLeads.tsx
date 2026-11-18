import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { leadTypes } from "@/lib/schemas/lead";
import { liveDigest } from "@/lib/admin/account";
import type { ApiLeadList, ApiLeadStatus } from "@/lib/admin/types";
import { uiStatus } from "@/lib/admin/types";
import { Icon } from "@/components/ui/Icon";
import { LeadRows } from "@/components/admin/live/LeadRows";
import { statusDot } from "@/components/admin/status";

const statuses: ApiLeadStatus[] = ["new", "in_progress", "confirmed", "cancelled"];

function withParam(query: URLSearchParams, key: string, value?: string) {
  const next = new URLSearchParams(query);
  next.delete("pageSize");
  next.delete("page");
  if (value) next.set(key, value);
  else next.delete(key);
  const s = next.toString();
  return `/admin/demandes${s ? `?${s}` : ""}`;
}

/** Demandes reçues par l'API : filtres (statut, type, attribution, recherche), tableau, pagination. */
export async function LiveLeads({ list, query, me }: { list: ApiLeadList; query: URLSearchParams; me: string }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin" });
  const status = query.get("status") ?? undefined;
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const filtered = ["status", "type", "assignee", "q"].some((k) => query.has(k));
  const exportQuery = new URLSearchParams([...query].filter(([k]) => k !== "page" && k !== "pageSize")).toString();
  const pageHref = (p: number) => {
    const next = new URLSearchParams(query);
    next.delete("pageSize");
    next.set("page", String(p));
    return `/admin/demandes?${next.toString()}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("leads.title")}</h1>
          <p className="text-sm text-muted">{t("live.leads.subtitle", { count: list.total })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Link href="/admin/demandes/nouvelle" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover">
          <Icon name="plus" size={16} /> {t("leads.new")}
        </Link>
        <details className="relative">
          <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-full border-[1.5px] border-night px-5 text-sm font-semibold text-night hover:bg-night hover:text-white">
            <Icon name="download" size={16} /> {t("live.leads.exportMenu")} <Icon name="chevronDown" size={15} />
          </summary>
          <div className="absolute right-0 z-20 mt-2 flex w-72 flex-col rounded-xl border border-line bg-white p-1.5 text-sm shadow-lg">
            {(["xlsx", "csv"] as const).map((f) => (
              <a key={f} href={`/admin/demandes/export?${new URLSearchParams([...new URLSearchParams(exportQuery), ["format", f]]).toString()}`} className="flex flex-col rounded-lg px-3 py-2.5 hover:bg-sand">
                <strong className="text-night">{t(`live.leads.formats.${f}.label`)}</strong>
                <span className="text-xs text-muted">{t(`live.leads.formats.${f}.hint`)}</span>
              </a>
            ))}
            <span className="px-3 pt-1.5 pb-1 text-[11px] text-muted">{t("live.leads.exportScope", { count: list.total })}</span>
          </div>
        </details>
        </div>
      </div>

      {/* Compteurs = filtres de statut */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statuses.map((s) => (
          <li key={s}>
            <Link
              href={withParam(query, "status", status === s ? undefined : s)}
              aria-current={status === s ? "true" : undefined}
              className={clsx("flex flex-col gap-2 rounded-2xl border bg-white px-4 py-4 sm:px-5", status === s ? "border-night ring-1 ring-night" : "border-line hover:border-line-strong")}
            >
              <span className="flex items-center gap-2 text-[13px] text-muted">
                <span aria-hidden="true" className={clsx("size-2 rounded-full", statusDot[uiStatus[s]])} />
                {t(`statusesPlural.${uiStatus[s]}`)}
              </span>
              <strong className="text-[28px] leading-none font-semibold tracking-tight text-night tabular-nums">{list.byStatus[s] ?? 0}</strong>
            </Link>
          </li>
        ))}
      </ul>

      <form method="get" action="/admin/demandes" role="search" className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-3 sm:flex-row sm:items-center">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="sr-only" htmlFor="lead-q">
          {t("leads.search")}
        </label>
        <input
          id="lead-q"
          name="q"
          defaultValue={query.get("q") ?? ""}
          maxLength={80}
          placeholder={t("leads.searchPlaceholder")}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night"
        />
        <label className="sr-only" htmlFor="lead-type">
          {t("leads.typeFilter")}
        </label>
        <select id="lead-type" name="type" defaultValue={query.get("type") ?? ""} className="h-11 rounded-xl border border-line-strong bg-white px-3 text-[15px]">
          <option value="">{t("live.leads.allTypes")}</option>
          {leadTypes.map((ty) => (
            <option key={ty} value={ty}>
              {t(`types.${ty}`)}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="lead-assignee">
          {t("live.leads.assigneeFilter")}
        </label>
        <select id="lead-assignee" name="assignee" defaultValue={query.get("assignee") ?? ""} className="h-11 rounded-xl border border-line-strong bg-white px-3 text-[15px]">
          <option value="">{t("live.leads.everyone")}</option>
          <option value="me">{t("live.leads.mine")}</option>
          <option value="none">{t("live.leads.unassigned")}</option>
        </select>
        <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-night px-5 text-sm font-semibold text-white hover:bg-night-2">
          <Icon name="search" size={16} /> {t("live.leads.apply")}
        </button>
        {filtered && (
          <Link href="/admin/demandes" className="inline-flex h-11 items-center justify-center px-3 text-sm font-semibold text-night underline-offset-2 hover:underline">
            {t("leads.clearFilters")}
          </Link>
        )}
      </form>

      <section aria-label={t("leads.listLabel")} className="overflow-hidden rounded-2xl border border-line bg-white">
        {list.items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">{t("leads.noRows")}</p>
        ) : (
          <LeadRows
            me={me}
            rows={list.items.map((l) => {
              const d = liveDigest(l);
              return { reference: l.reference, type: l.type, status: l.status, fullName: l.fullName, phone: l.phone, email: l.email, createdAt: l.createdAt, assignedTo: l.assignedTo, source: l.source, summary: d.summary, tripLine: d.tripLine, note: d.note };
            })}
          />
        )}
      </section>

      {pages > 1 && (
        <nav aria-label={t("live.leads.pagination")} className="flex items-center justify-between gap-3 text-sm">
          {list.page > 1 ? (
            <Link href={pageHref(list.page - 1)} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 font-semibold text-night">
              <Icon name="chevronLeft" size={16} /> {t("live.leads.previous")}
            </Link>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1">
            {pageWindow(list.page, pages).map((p, i) =>
              p === null ? (
                <span key={`gap-${i}`} className="px-1 text-muted">
                  …
                </span>
              ) : (
                <Link
                  key={p}
                  href={pageHref(p)}
                  aria-current={p === list.page ? "page" : undefined}
                  aria-label={t("live.leads.page", { page: p, pages })}
                  className={clsx("flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums", p === list.page ? "bg-night text-white" : "text-night hover:bg-white")}
                >
                  {p}
                </Link>
              ),
            )}
          </span>
          {list.page < pages ? (
            <Link href={pageHref(list.page + 1)} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 font-semibold text-night">
              {t("live.leads.next")} <Icon name="chevronRight" size={16} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

/** Numéros de page affichés : première, dernière, et deux autour de la page courante (null = ellipse). */
function pageWindow(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1]! > 1 ? [null, p] : [p]));
}
