import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, FilterChip, KpiGrid, KpiTile, ListCard, PageHeader, Pager, SearchBar, listHref, readParams } from "@/components/admin/live/ListKit";
import { PaymentRow } from "@/components/admin/live/PaymentRow";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { formatMoney } from "@/lib/admin/money";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import type { ApiPayment } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Paiements" };

const PAGE_SIZE = 12;
const statuses = ["pending", "paid", "failed", "expired", "cancelled"] as const;
const DAY = 24 * 3600_000;

/** Somme par devise (unités entières) → « 3 000 000 GNF · 812,40 € ». */
function totals(list: ApiPayment[]) {
  const by = new Map<string, bigint>();
  for (const p of list) by.set(p.currency, (by.get(p.currency) ?? BigInt(0)) + BigInt(p.amount));
  return [...by.entries()].map(([c, v]) => formatMoney(v.toString(), c)).join(" · ") || "–";
}

/** Paiements des devis : encaissements, liens en attente, échecs ; filtres, recherche, pagination. */
export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (adminMode !== "live") notFound();
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.payments" });
  const tl = await getTranslations({ locale: "fr", namespace: "admin.live.list" });
  const [payments, config] = await Promise.all([api<ApiPayment[]>("/v1/payments", { session }), api<{ enabled: boolean }>("/v1/payments/config", { session })]);
  const { one, page } = readParams(await searchParams);
  const status = (statuses as readonly string[]).includes(one("status")) ? one("status") : "";
  const q = one("q").trim().toLowerCase();
  const now = new Date().getTime();

  const paid30 = payments.filter((p) => p.status === "paid" && p.paidAt && now - new Date(p.paidAt).getTime() < 30 * DAY);
  const pending = payments.filter((p) => p.status === "pending");
  const failed = payments.filter((p) => p.status === "failed" || p.status === "expired");
  const filtered = payments.filter((p) => (!status || p.status === status) && (!q || `${p.reference} ${p.label} ${p.lead.reference} ${p.lead.fullName}`.toLowerCase().includes(q)));
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const href = (over: Record<string, string | number | undefined>) => listHref("/admin/paiements", { status, q: one("q"), ...over });

  return (
    <AdminShell section="payments" title={t("pageTitle")} live={await liveAccount(user, session)}>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      {!config.enabled && (
        <p className="flex items-start gap-2.5 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-ink">
          <Icon name="infoMark" size={17} className="mt-0.5 shrink-0" /> {t("disabledBanner")}
        </p>
      )}
      <KpiGrid>
        <KpiTile icon="check" tone="good" label={t("kpiPaid")} value={paid30.length} note={totals(paid30)} href={href({ status: "paid", page: 1 })} />
        <KpiTile icon="clock" label={t("kpiPending")} value={pending.length} note={totals(pending)} href={href({ status: "pending", page: 1 })} />
        <KpiTile icon="alert" tone={failed.length ? "alert" : "default"} label={t("kpiFailed")} value={failed.length} note={t("kpiFailedNote")} href={href({ status: "failed", page: 1 })} />
        <KpiTile icon="grid" label={t("kpiTotal")} value={payments.length} note={t("kpiTotalNote")} />
      </KpiGrid>

      <SearchBar action="/admin/paiements" query={one("q")} keep={{ status }} placeholder={t("searchPlaceholder")}>
        <FilterChip href={href({ status: undefined, page: 1 })} active={!status} count={payments.length}>
          {tl("all")}
        </FilterChip>
        {statuses.map((s) => (
          <FilterChip key={s} href={href({ status: s, page: 1 })} active={status === s} count={payments.filter((p) => p.status === s).length}>
            {t(`status.${s}`)}
          </FilterChip>
        ))}
      </SearchBar>

      <ListCard footer={<Pager page={current} pageSize={PAGE_SIZE} total={filtered.length} hrefFor={(p) => href({ page: p })} />}>
        {shown.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title={payments.length ? tl("noMatch") : t("empty")}
            text={payments.length ? undefined : t("emptyHint")}
            action={
              payments.length ? (
                <Link href="/admin/paiements" className="text-sm font-semibold text-night underline underline-offset-2">
                  {tl("reset")}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line px-4 sm:px-5">
            {shown.map((p) => (
              <PaymentRow key={p.id} p={p} showLead />
            ))}
          </ul>
        )}
      </ListCard>
    </AdminShell>
  );
}
