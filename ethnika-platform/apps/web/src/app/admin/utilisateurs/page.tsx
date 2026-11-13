import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, FilterChip, KpiGrid, KpiTile, ListCard, PageHeader, Pager, SearchBar, listHref, readParams } from "@/components/admin/live/ListKit";
import { NewUserForm, UserRow } from "@/components/admin/live/UsersAdmin";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiUser } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Utilisateurs" };

const PAGE_SIZE = 10;
const states = ["active", "disabled", "nomfa", "attention"] as const;

/** Comptes du back-office : indicateurs, filtres (rôle, état, recherche), pagination ; actions dépliables. Admin uniquement. */
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.users" });
  const tl = await getTranslations({ locale: "fr", namespace: "admin.live.list" });
  const users = await api<ApiUser[]>("/v1/users?pageSize=100", { session });
  const { one, page } = readParams(await searchParams);
  const role = ["admin", "agent"].includes(one("role")) ? one("role") : "";
  const state = (states as readonly string[]).includes(one("state")) ? one("state") : "";
  const q = one("q").trim().toLowerCase();
  const now = new Date();
  const locked = (u: ApiUser) => Boolean(u.lockedUntil && new Date(u.lockedUntil) > now);
  const attention = (u: ApiUser) => !u.disabled && (locked(u) || u.mustChangePassword || (u.role === "admin" && !u.totpEnabled));
  const matchState = (u: ApiUser) =>
    !state || (state === "active" ? !u.disabled : state === "disabled" ? u.disabled : state === "nomfa" ? !u.totpEnabled && !u.disabled : attention(u));

  const filtered = users.filter((u) => (!role || u.role === role) && matchState(u) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)));
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const href = (over: Record<string, string | number | undefined>) => listHref("/admin/utilisateurs", { role, state, q: one("q"), ...over });

  const active = users.filter((u) => !u.disabled);
  const withMfa = active.filter((u) => u.totpEnabled).length;
  const toWatch = users.filter(attention).length;

  return (
    <AdminShell section="users" title={t("title")} live={await liveAccount(user, session)}>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <KpiGrid>
        <KpiTile icon="users" label={t("kpiActive")} value={active.length} note={t("kpiActiveNote", { disabled: users.length - active.length })} href={href({ state: "active", page: 1 })} />
        <KpiTile icon="shieldCheck" label={t("kpiAdmins")} value={active.filter((u) => u.role === "admin").length} note={t("kpiAgents", { count: active.filter((u) => u.role === "agent").length })} href={href({ role: "admin", page: 1 })} />
        <KpiTile icon="check" tone={withMfa === active.length ? "good" : "default"} label={t("kpiMfa")} value={`${active.length ? Math.round((withMfa / active.length) * 100) : 0} %`} note={t("kpiMfaNote", { count: withMfa, total: active.length })} href={href({ state: "nomfa", page: 1 })} />
        <KpiTile icon="alert" tone={toWatch ? "alert" : "default"} label={t("kpiAttention")} value={toWatch} note={t("kpiAttentionNote")} href={href({ state: "attention", page: 1 })} />
      </KpiGrid>

      <NewUserForm />

      <SearchBar action="/admin/utilisateurs" query={one("q")} keep={{ role, state }} placeholder={t("searchPlaceholder")}>
        <FilterChip href={href({ role: undefined, page: 1 })} active={!role} count={users.length}>
          {tl("all")}
        </FilterChip>
        <FilterChip href={href({ role: "admin", page: 1 })} active={role === "admin"}>
          {t("roles.admin")}
        </FilterChip>
        <FilterChip href={href({ role: "agent", page: 1 })} active={role === "agent"}>
          {t("roles.agent")}
        </FilterChip>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-line-strong" />
        {states.map((s) => (
          <FilterChip key={s} href={href({ state: state === s ? undefined : s, page: 1 })} active={state === s}>
            {t(`states.${s}`)}
          </FilterChip>
        ))}
      </SearchBar>

      <ListCard footer={<Pager page={current} pageSize={PAGE_SIZE} total={filtered.length} hrefFor={(p) => href({ page: p })} />}>
        {shown.length === 0 ? (
          <EmptyState
            icon="users"
            title={tl("noMatch")}
            text={tl("noMatchHint")}
            action={
              <Link href="/admin/utilisateurs" className="text-sm font-semibold text-night underline underline-offset-2">
                {tl("reset")}
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((u) => (
              <UserRow key={u.id} user={u} self={u.id === user.userId} />
            ))}
          </ul>
        )}
      </ListCard>
    </AdminShell>
  );
}
