import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, FilterChip, KpiGrid, KpiTile, ListCard, PageHeader, Pager, listHref, readParams } from "@/components/admin/live/ListKit";
import { Icon, type IconName } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiAuditPage, ApiAuditSummary, ApiUser } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Journal d'audit" };

const PAGE_SIZE = 25;
const categories = ["auth", "user", "lead", "quote", "content", "flight", "maintenance"] as const;
const categoryIcon: Record<(typeof categories)[number], IconName> = { auth: "shieldCheck", user: "users", lead: "mail", quote: "ticket", content: "image", flight: "plane", maintenance: "refresh" };
const sensitive = new Set(["auth.login_failed", "auth.locked", "user.disabled", "auth.mfa_reset", "content.deleted", "flight.cancelled"]);
const knownActions = new Set([
  "auth.login",
  "auth.login_failed",
  "auth.locked",
  "auth.logout",
  "auth.mfa_enabled",
  "auth.mfa_reset",
  "auth.password_changed",
  "user.created",
  "user.updated",
  "user.disabled",
  "lead.created",
  "lead.status_changed",
  "lead.assigned",
  "lead.exported",
  "lead.pdf",
  "quote.created",
  "content.created",
  "content.updated",
  "content.deleted",
  "flight.hold",
  "flight.cancelled",
  "maintenance.purge",
]);
const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Conakry" });
const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Conakry" });

/** Journal d'audit : indicateurs, filtres (catégorie, personne), entrées groupées par jour, pagination. Sans donnée client. Admin uniquement. */
export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.audit" });
  const tl = await getTranslations({ locale: "fr", namespace: "admin.live.list" });
  const { one, page } = readParams(await searchParams);
  const category = (categories as readonly string[]).includes(one("cat")) ? one("cat") : "";
  const users = await api<ApiUser[]>("/v1/users?pageSize=100", { session });
  const actor = users.some((u) => u.id === one("actor")) ? one("actor") : "";
  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), ...(category && { category }), ...(actor && { actorId: actor }) });
  const [result, summary] = await Promise.all([api<ApiAuditPage>(`/v1/audit/search?${query}`, { session }), api<ApiAuditSummary>("/v1/audit/summary", { session })]);
  const names = new Map(users.map((u) => [u.id, u.name]));
  const href = (over: Record<string, string | number | undefined>) => listHref("/admin/journal", { cat: category, actor, ...over });

  // Regroupement par jour (heure de Conakry).
  const groups = new Map<string, typeof result.items>();
  for (const e of result.items) {
    const key = dayFmt.format(new Date(e.createdAt));
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <AdminShell section="audit" title={t("title")} live={await liveAccount(user, session)}>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <KpiGrid>
        <KpiTile icon="users" label={t("kpiLogins")} value={summary.last24h.logins} note={t("last24h")} href={href({ cat: "auth", page: 1 })} />
        <KpiTile icon="alert" tone={summary.last24h.failedLogins ? "alert" : "default"} label={t("kpiFailed")} value={summary.last24h.failedLogins} note={t("last24h")} href={href({ cat: "auth", page: 1 })} />
        <KpiTile icon="shieldCheck" tone={summary.last7d.locked ? "alert" : "good"} label={t("kpiLocked")} value={summary.last7d.locked} note={t("last7d")} />
        <KpiTile icon="grid" label={t("kpiTotal")} value={summary.last7d.total} note={t("kpiTotalNote")} />
      </KpiGrid>

      <form method="get" action="/admin/journal" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip href={href({ cat: undefined, page: 1 })} active={!category} count={summary.last7d.total}>
            {tl("all")}
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c} href={href({ cat: category === c ? undefined : c, page: 1 })} active={category === c} count={summary.last7d.byCategory[c] ?? 0}>
              {t(`categories.${c}`)}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {category && <input type="hidden" name="cat" value={category} />}
          <label htmlFor="audit-actor" className="text-[13px] font-semibold text-ink sm:whitespace-nowrap">
            {t("actorFilter")}
          </label>
          <select id="audit-actor" name="actor" defaultValue={actor} className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-white px-3 text-[15px] sm:max-w-xs">
            <option value="">{t("everyone")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-night px-5 text-sm font-semibold text-white hover:bg-night-2">
            {tl("apply")}
          </button>
          <span className="text-xs text-muted sm:ml-auto">{t("countHint")}</span>
        </div>
      </form>

      <ListCard footer={<Pager page={result.page} pageSize={PAGE_SIZE} total={result.total} hrefFor={(p) => href({ page: p })} />}>
        {result.items.length === 0 ? (
          <EmptyState
            icon="shieldCheck"
            title={t("empty")}
            action={
              <Link href="/admin/journal" className="text-sm font-semibold text-night underline underline-offset-2">
                {tl("reset")}
              </Link>
            }
          />
        ) : (
          [...groups.entries()].map(([day, entries]) => (
            <div key={day}>
              <h2 className="sticky top-14 z-10 border-b border-line bg-cream px-5 py-2 text-xs font-semibold tracking-wide text-muted uppercase first-letter:uppercase lg:top-0">{day}</h2>
              <ul className="divide-y divide-line">
                {entries.map((e) => {
                  const cat = e.action.split(".")[0] as (typeof categories)[number];
                  return (
                    <li key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-0.5 px-4 py-3 text-sm sm:px-5">
                      <span className={clsx("flex size-9 items-center justify-center rounded-xl", sensitive.has(e.action) ? "bg-red-50 text-red-700" : "bg-sand text-night")}>
                        <Icon name={categoryIcon[cat] ?? "grid"} size={16} />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <strong className="truncate font-semibold text-night">
                          {knownActions.has(e.action) ? t(`actions.${e.action.replace(".", "_")}`) : e.action}
                          {e.target && <span className="ml-1.5 font-mono text-xs font-normal text-muted">{e.target.length > 22 ? `${e.target.slice(0, 10)}…` : e.target}</span>}
                        </strong>
                        <span className="truncate text-xs text-muted">
                          {e.actorId ? (names.get(e.actorId) ?? t("unknownActor")) : t("system")}
                          {e.ip && <> · {e.ip}</>}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-muted tabular-nums">{timeFmt.format(new Date(e.createdAt))}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </ListCard>
    </AdminShell>
  );
}
