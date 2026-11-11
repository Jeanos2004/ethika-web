import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { Icon } from "@/components/ui/Icon";
import { formatLong } from "@/components/admin/status";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiAuditEntry, ApiUser } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Journal d'audit" };

const PAGE_SIZE = 50;
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

/** Journal d'audit (connexions, comptes, demandes, devis, contenus, vols) : sans donnée client. Admin uniquement. */
export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.audit" });
  const raw = Number((await searchParams).page);
  const page = Number.isInteger(raw) && raw > 1 && raw <= 10_000 ? raw : 1;
  const [entries, users] = await Promise.all([
    api<ApiAuditEntry[]>(`/v1/audit?page=${page}&pageSize=${PAGE_SIZE}`, { session }),
    api<ApiUser[]>("/v1/users?pageSize=100", { session }),
  ]);
  const names = new Map(users.map((u) => [u.id, u.name]));

  return (
    <AdminShell section="audit" title={t("title")} live={await liveAccount(user, session)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        {entries.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {entries.map((e) => (
              <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-5 py-3 text-sm lg:grid-cols-[11rem_minmax(0,1fr)_minmax(0,14rem)_8rem]">
                <span className="font-mono text-xs text-muted lg:order-first">{formatLong(e.createdAt)}</span>
                <span className="text-right text-xs text-muted lg:order-last lg:text-left">{e.ip ?? ""}</span>
                <span className="min-w-0 font-semibold text-night">
                  {knownActions.has(e.action) ? t(`actions.${e.action.replace(".", "_")}`) : e.action}
                  {e.target && <span className="ml-1.5 font-mono text-xs font-normal text-muted">{e.target.length > 20 ? `${e.target.slice(0, 8)}…` : e.target}</span>}
                </span>
                <span className="min-w-0 truncate text-muted">{e.actorId ? (names.get(e.actorId) ?? t("unknownActor")) : t("system")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 text-sm">
        {page > 1 ? (
          <Link href={`/admin/journal?page=${page - 1}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 font-semibold text-night">
            <Icon name="chevronLeft" size={16} /> {t("newer")}
          </Link>
        ) : (
          <span />
        )}
        {entries.length === PAGE_SIZE && (
          <Link href={`/admin/journal?page=${page + 1}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 font-semibold text-night">
            {t("older")} <Icon name="chevronRight" size={16} />
          </Link>
        )}
      </nav>
    </AdminShell>
  );
}
