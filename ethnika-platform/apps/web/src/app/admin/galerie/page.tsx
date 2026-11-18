import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportContent } from "@/components/admin/live/ImportContent";
import { EmptyState, FilterChip, KpiGrid, KpiTile, ListCard, PageHeader, Pager, SearchBar, listHref, readParams } from "@/components/admin/live/ListKit";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { deleteContent, setPublished } from "@/lib/admin/content-actions";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiPhoto, GalleryCategoryKey } from "@/lib/admin/types";
import { gallery } from "@/content/gallery";

export const metadata: Metadata = { title: "Galerie" };

const PAGE_SIZE = 12;
const categories: GalleryCategoryKey[] = ["fouta", "cote", "loos", "vie"];

/** Galerie : indicateurs, filtres (statut, catégorie, recherche), mosaïque de vignettes, pagination. */
export default async function AdminGalleryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.gallery" });
  const tc = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  const tl = await getTranslations({ locale: "fr", namespace: "admin.live.list" });
  const photos = await api<ApiPhoto[]>("/v1/admin/gallery", { session });
  const { one, page } = readParams(await searchParams);
  const status = ["published", "draft"].includes(one("status")) ? one("status") : "";
  const category = categories.find((c) => c === one("cat")) ?? "";
  const q = one("q").trim().toLowerCase();
  const filtered = photos.filter(
    (p) => (!status || (status === "published" ? p.published : !p.published)) && (!category || p.category === category) && (!q || `${p.i18n.fr.alt} ${p.i18n.fr.place}`.toLowerCase().includes(q)),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const href = (over: Record<string, string | number | undefined>) => listHref("/admin/galerie", { status, cat: category, q: one("q"), ...over });
  const published = photos.filter((p) => p.published).length;
  const uploaded = photos.filter((p) => p.imageUrl.startsWith("/media/")).length;
  const importable = gallery.filter((g) => !photos.some((p) => p.imageUrl === g.src)).length;

  return (
    <AdminShell section="gallery" title={t("title")} live={await liveAccount(user, session)}>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Link href="/admin/galerie/nouvelle" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover">
            <Icon name="plus" size={16} /> {t("new")}
          </Link>
        }
      />
      {one("enregistre") === "1" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-brand-green-dark">
          <Icon name="check" size={16} /> {tc("savedNotice")}
        </p>
      )}

      <KpiGrid>
        <KpiTile icon="image" label={t("kpiTotal")} value={photos.length} note={t("kpiTotalNote")} href={href({ status: undefined, cat: undefined, q: undefined })} />
        <KpiTile icon="check" tone="good" label={tc("kpiPublished")} value={published} note={t("kpiPublishedNote")} href={href({ status: "published", page: 1 })} />
        <KpiTile icon="infoMark" label={t("kpiHidden")} value={photos.length - published} note={t("kpiHiddenNote")} href={href({ status: "draft", page: 1 })} />
        <KpiTile icon="plus" label={t("kpiUploaded")} value={uploaded} note={t("kpiUploadedNote")} />
      </KpiGrid>

      {importable > 0 && <ImportContent kind="gallery" count={importable} />}

      <SearchBar action="/admin/galerie" query={one("q")} keep={{ status, cat: category }} placeholder={t("searchPlaceholder")}>
        <FilterChip href={href({ status: undefined, page: 1 })} active={!status} count={photos.length}>
          {tl("all")}
        </FilterChip>
        <FilterChip href={href({ status: "published", page: 1 })} active={status === "published"} count={published}>
          {t("visible")}
        </FilterChip>
        <FilterChip href={href({ status: "draft", page: 1 })} active={status === "draft"} count={photos.length - published}>
          {t("hidden")}
        </FilterChip>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-line-strong" />
        {categories.map((c) => (
          <FilterChip key={c} href={href({ cat: category === c ? undefined : c, page: 1 })} active={category === c} count={photos.filter((p) => p.category === c).length}>
            {t(`categories.${c}`)}
          </FilterChip>
        ))}
      </SearchBar>

      <ListCard footer={<Pager page={current} pageSize={PAGE_SIZE} total={filtered.length} hrefFor={(p) => href({ page: p })} />}>
        {shown.length === 0 ? (
          <EmptyState
            icon="image"
            title={photos.length ? tl("noMatch") : t("empty")}
            text={photos.length ? tl("noMatchHint") : t("emptyHint")}
            action={
              photos.length ? (
                <Link href="/admin/galerie" className="text-sm font-semibold text-night underline underline-offset-2">
                  {tl("reset")}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 p-4 min-[480px]:grid-cols-2 sm:p-5 lg:grid-cols-3 2xl:grid-cols-4">
            {shown.map((p) => (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
                <Link href={`/admin/galerie/${p.id}`} className="group relative block aspect-[4/3] overflow-hidden bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element -- image du site ou envoyée depuis le back-office */}
                  <img src={p.imageUrl} alt="" loading="lazy" className={clsx("size-full object-cover transition-transform duration-500 group-hover:scale-105", !p.published && "opacity-60 grayscale")} />
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-night">
                    <span aria-hidden="true" className={clsx("size-2 rounded-full", p.published ? "bg-brand-green" : "bg-subtle")} />
                    {p.published ? t("visible") : t("hidden")}
                  </span>
                  {p.tall && <span className="absolute top-2.5 right-2.5 rounded-full bg-night/85 px-2.5 py-1 text-xs font-semibold text-white">{t("tallShort")}</span>}
                </Link>
                <div className="flex flex-1 flex-col gap-1 px-4 pt-3 pb-2">
                  <Link href={`/admin/galerie/${p.id}`} className="truncate font-semibold text-night hover:underline">
                    {p.i18n.fr.alt}
                  </Link>
                  <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                    <span className="rounded-full bg-sand px-2 py-0.5 font-semibold text-night">{t(`categories.${p.category}`)}</span>
                    <span className="truncate">{p.i18n.fr.place}</span>
                    <span className="rounded-full bg-sand px-2 py-0.5 tabular-nums">{tc("positionShort", { n: p.position })}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 border-t border-line px-3 py-2.5">
                  <form action={setPublished} className="flex-1">
                    <input type="hidden" name="kind" value="gallery" />
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="published" value={String(!p.published)} />
                    <button type="submit" className="min-h-9 w-full rounded-full border-[1.5px] border-line-strong bg-white px-3 text-[13px] font-semibold text-night hover:border-night">
                      {p.published ? t("hide") : t("show")}
                    </button>
                  </form>
                  <Link href={`/admin/galerie/${p.id}`} aria-label={t("editLabel", { alt: p.i18n.fr.alt })} className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-line-strong text-night hover:border-night">
                    <Icon name="sliders" size={15} />
                  </Link>
                  <details className="relative">
                    <summary aria-label={tc("delete")} className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full border-[1.5px] border-line-strong text-night hover:border-brand-red hover:text-brand-red">
                      <Icon name="close" size={15} />
                    </summary>
                    <form action={deleteContent} className="absolute right-0 bottom-full z-10 mb-2 flex w-60 flex-col gap-2 rounded-xl border border-line bg-white p-3 text-sm shadow-lg">
                      <input type="hidden" name="kind" value="gallery" />
                      <input type="hidden" name="id" value={p.id} />
                      <span className="text-ink">{t("deleteConfirm")}</span>
                      <button type="submit" className="min-h-10 rounded-full bg-brand-red px-3.5 text-[13px] font-semibold text-white">
                        {tc("deleteYes")}
                      </button>
                    </form>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ListCard>
    </AdminShell>
  );
}
