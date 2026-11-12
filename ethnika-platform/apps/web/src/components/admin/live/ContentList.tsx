import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { deleteContent, setPublished } from "@/lib/admin/content-actions";
import { formatMoney } from "@/lib/admin/money";
import { Icon } from "@/components/ui/Icon";
import { ImportContent } from "@/components/admin/live/ImportContent";
import { EmptyState, FilterChip, KpiGrid, KpiTile, ListCard, PageHeader, Pager, SearchBar, listHref, readParams } from "@/components/admin/live/ListKit";

export type ContentRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  /** Thème (circuit) ou type (offre) : filtre par puce. */
  category: string;
  categoryLabel: string;
  published: boolean;
  /** Offre dont la date de validité est passée (masquée du site même si publiée). */
  expired?: boolean;
  /** Circuit sans aucun départ renseigné. */
  noDeparture?: boolean;
  /** Article mis en avant sur l'accueil. */
  featured?: boolean;
  /** Article dont le texte contient encore un bloc « à rédiger ». */
  todo?: boolean;
  position: number;
  amount: string | null;
  currency: string | null;
  image: string;
  updatedAt: string;
};

const PAGE_SIZE = 8;
const updated = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "Africa/Conakry" });

/** Offres, circuits ou articles : indicateurs, filtres (statut, catégorie, recherche), lignes compactes, pagination. */
export async function ContentList({
  kind,
  rows,
  newHref,
  importable,
  params,
}: {
  kind: "offers" | "circuits" | "posts";
  rows: ContentRow[];
  newHref: string;
  importable: number;
  params: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  const tl = await getTranslations({ locale: "fr", namespace: "admin.live.list" });
  const base = { offers: "/admin/offres", circuits: "/admin/circuits", posts: "/admin/blog" }[kind];
  const icon = ({ offers: "ticket", circuits: "mountain", posts: "globe" } as const)[kind];
  const flag = ({ offers: "Expired", circuits: "NoDeparture", posts: "Todo" } as const)[kind];
  const { one, page } = readParams(params);
  const status = ["published", "draft"].includes(one("status")) ? one("status") : "";
  const category = rows.some((r) => r.category === one("cat")) ? one("cat") : "";
  const q = one("q").trim().toLowerCase();

  const filtered = rows.filter(
    (r) =>
      (!status || (status === "published" ? r.published : !r.published)) &&
      (!category || r.category === category) &&
      (!q || `${r.title} ${r.slug} ${r.subtitle}`.toLowerCase().includes(q)),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const href = (over: Record<string, string | number | undefined>) => listHref(base, { status, cat: category, q: one("q"), ...over });
  const categories = [...new Map(rows.map((r) => [r.category, r.categoryLabel])).entries()];
  const published = rows.filter((r) => r.published).length;
  const flagged = rows.filter((r) => r.expired || r.noDeparture || r.todo).length;

  return (
    <>
      <PageHeader
        title={t(`${kind}Title`)}
        subtitle={t(`${kind}Subtitle`)}
        actions={
          <Link href={newHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover">
            <Icon name="plus" size={16} /> {t(`${kind}New`)}
          </Link>
        }
      />
      {one("enregistre") === "1" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-brand-green-dark">
          <Icon name="check" size={16} /> {t("savedNotice")}
        </p>
      )}

      <KpiGrid>
        <KpiTile icon={icon} label={t("kpiTotal")} value={rows.length} note={t("kpiTotalNote")} href={href({ status: undefined, cat: undefined, q: undefined })} />
        <KpiTile icon="check" tone="good" label={t("kpiPublished")} value={published} note={t("kpiPublishedNote")} href={href({ status: "published", page: 1 })} />
        <KpiTile icon="infoMark" label={t("kpiDraft")} value={rows.length - published} note={t("kpiDraftNote")} href={href({ status: "draft", page: 1 })} />
        <KpiTile icon="alert" tone={flagged ? "alert" : "default"} label={t(`kpi${flag}`)} value={flagged} note={t(`kpi${flag}Note`)} />
      </KpiGrid>

      {importable > 0 && <ImportContent kind={kind} count={importable} />}

      <SearchBar action={base} query={one("q")} keep={{ status, cat: category }} placeholder={t("searchPlaceholder")}>
        <FilterChip href={href({ status: undefined, page: 1 })} active={!status} count={rows.length}>
          {tl("all")}
        </FilterChip>
        <FilterChip href={href({ status: "published", page: 1 })} active={status === "published"} count={published}>
          {t("isPublished")}
        </FilterChip>
        <FilterChip href={href({ status: "draft", page: 1 })} active={status === "draft"} count={rows.length - published}>
          {t("isDraft")}
        </FilterChip>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-line-strong" />
        {categories.map(([key, label]) => (
          <FilterChip key={key} href={href({ cat: category === key ? undefined : key, page: 1 })} active={category === key}>
            {label}
          </FilterChip>
        ))}
      </SearchBar>

      <ListCard footer={<Pager page={current} pageSize={PAGE_SIZE} total={filtered.length} hrefFor={(p) => href({ page: p })} />}>
        {shown.length === 0 ? (
          <EmptyState
            icon={icon}
            title={rows.length ? tl("noMatch") : t("empty")}
            text={rows.length ? tl("noMatchHint") : undefined}
            action={
              rows.length ? (
                <Link href={base} className="text-sm font-semibold text-night underline underline-offset-2">
                  {tl("reset")}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
                {/* eslint-disable-next-line @next/next/no-img-element -- chemin du site ou CDN https validé par l'API */}
                <img src={r.image} alt="" className="h-14 w-20 shrink-0 rounded-xl bg-sand object-cover" />
                <Link href={`${base}/${r.id}`} className="group flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="truncate text-night group-hover:underline">{r.title}</strong>
                  <span className="truncate text-xs text-muted">
                    {r.subtitle} · <span className="font-mono">{r.slug}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted">
                    <span className="rounded-full bg-sand px-2 py-0.5 font-semibold text-night">{r.categoryLabel}</span>
                    <span className="rounded-full bg-sand px-2 py-0.5 tabular-nums">{t("positionShort", { n: r.position })}</span>
                    {r.amount !== null && r.currency && <span className="rounded-full bg-sand px-2 py-0.5 font-semibold text-night tabular-nums">{formatMoney(r.amount, r.currency)}</span>}
                    {r.expired && <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">{t("expired")}</span>}
                    {r.noDeparture && <span className="rounded-full bg-gold-50 px-2 py-0.5 font-semibold text-gold-700">{t("noDeparture")}</span>}
                    {r.featured && <span className="rounded-full bg-night px-2 py-0.5 font-semibold text-white">{t("featured")}</span>}
                    {r.todo && <span className="rounded-full bg-gold-50 px-2 py-0.5 font-semibold text-gold-700">{t("todo")}</span>}
                    <span>{t("updated", { date: updated.format(new Date(r.updatedAt)) })}</span>
                  </span>
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold">
                  <span aria-hidden="true" className={clsx("size-2 rounded-full", r.published ? "bg-brand-green" : "bg-subtle")} />
                  {r.published ? t("isPublished") : t("isDraft")}
                </span>
                <div className="flex items-center gap-1.5">
                  <form action={setPublished}>
                    <input type="hidden" name="kind" value={kind} />
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="published" value={String(!r.published)} />
                    <button type="submit" className="min-h-9 rounded-full border-[1.5px] border-line-strong bg-white px-3 text-[13px] font-semibold text-night hover:border-night">
                      {r.published ? t("unpublish") : t("publish")}
                    </button>
                  </form>
                  <Link href={`${base}/${r.id}`} aria-label={t("editLabel", { title: r.title })} className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-line-strong text-night hover:border-night">
                    <Icon name="sliders" size={15} />
                  </Link>
                  <details className="relative">
                    <summary aria-label={t("delete")} className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full border-[1.5px] border-line-strong text-night hover:border-brand-red hover:text-brand-red">
                      <Icon name="close" size={15} />
                    </summary>
                    <form action={deleteContent} className="absolute right-0 z-10 mt-2 flex w-64 flex-col gap-2 rounded-xl border border-line bg-white p-3 text-sm shadow-lg">
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={r.id} />
                      <span className="text-ink">{t("deleteConfirm")}</span>
                      <button type="submit" className="min-h-10 rounded-full bg-brand-red px-3.5 text-[13px] font-semibold text-white">
                        {t("deleteYes")}
                      </button>
                    </form>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ListCard>
    </>
  );
}
