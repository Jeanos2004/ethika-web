import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { deleteContent, setPublished } from "@/lib/admin/content-actions";
import { formatMoney } from "@/lib/admin/money";
import { Icon } from "@/components/ui/Icon";

export type ContentRow = { id: string; slug: string; title: string; subtitle: string; published: boolean; position: number; amount: string | null; currency: string | null; image: string };

/** Liste des offres ou des circuits : statut de publication, ordre, prix, actions rapides. */
export async function ContentList({ kind, rows, newHref, saved }: { kind: "offers" | "circuits"; rows: ContentRow[]; newHref: string; saved: boolean }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  const base = kind === "offers" ? "/admin/offres" : "/admin/circuits";
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t(`${kind}Title`)}</h1>
          <p className="text-sm text-muted">{t(`${kind}Subtitle`)}</p>
        </div>
        <Link href={newHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover">
          <Icon name="plus" size={16} /> {t(`${kind}New`)}
        </Link>
      </div>
      {saved && (
        <p role="status" className="rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-brand-green-dark">
          {t("savedNotice")}
        </p>
      )}
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                {/* Vignette : chemin du site ou CDN https déjà validé par l'API. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt="" className="size-14 shrink-0 rounded-xl bg-sand object-cover" />
                <Link href={`${base}/${r.id}`} className="flex min-w-0 flex-1 flex-col hover:underline">
                  <strong className="truncate text-night">{r.title}</strong>
                  <span className="truncate text-xs text-muted">
                    {r.subtitle} · <span className="font-mono">{r.slug}</span> · {t("positionShort", { n: r.position })}
                    {r.amount !== null && r.currency && <> · {formatMoney(r.amount, r.currency)}</>}
                  </span>
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold">
                  <span aria-hidden="true" className={clsx("size-2 rounded-full", r.published ? "bg-brand-green" : "bg-subtle")} />
                  {r.published ? t("isPublished") : t("isDraft")}
                </span>
                <form action={setPublished}>
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="published" value={String(!r.published)} />
                  <button type="submit" className="min-h-10 rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night hover:border-night">
                    {r.published ? t("unpublish") : t("publish")}
                  </button>
                </form>
                <details className="relative">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night hover:border-brand-red hover:text-brand-red">
                    {t("delete")}
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
