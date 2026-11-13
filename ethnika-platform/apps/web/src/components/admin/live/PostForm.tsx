"use client";

import { useActionState, useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { savePost, type ContentState } from "@/lib/admin/content-actions";
import type { ApiPost, BlogCategoryKey } from "@/lib/admin/types";
import { Markdown } from "@/lib/markdown";
import { Area, Field, SaveBar, Section, Select, area } from "@/components/admin/live/ContentFields";
import { ImageField } from "@/components/admin/live/ImageField";
import { keepValues } from "@/components/admin/live/keep-values";

const categories: BlogCategoryKey[] = ["destinations", "conseils", "culture", "billetterie", "actualites"];

/** Corps de l'article : saisie Markdown, aperçu fidèle au site et aide-mémoire de la syntaxe. */
function BodyEditor({ name, label, defaultValue = "", required, hint }: { name: string; label: string; defaultValue?: string; required?: boolean; hint?: string }) {
  const t = useTranslations("admin.live.blog");
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const id = `f-${name}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-ink">
          {label}
        </label>
        <div role="group" aria-label={t("bodyMode")} className="inline-flex rounded-full bg-sand p-1 text-[13px] font-semibold">
          {[false, true].map((p) => (
            <button key={String(p)} type="button" aria-pressed={preview === p} onClick={() => setPreview(p)} className={clsx("min-h-8 rounded-full px-3", preview === p ? "bg-white text-night shadow-sm" : "text-muted")}>
              {p ? t("preview") : t("write")}
            </button>
          ))}
        </div>
      </div>
      {/* Le champ reste dans le formulaire pendant l'aperçu (envoyé à l'enregistrement). */}
      <textarea id={id} name={name} value={value} onChange={(e) => setValue(e.target.value)} required={required} maxLength={40000} rows={18} className={clsx(area, "font-mono text-[14px] leading-relaxed", preview && "hidden")} aria-describedby={`${id}-hint`} />
      {preview && (
        <div lang="fr" className="flex min-h-[18rem] flex-col gap-5 rounded-xl border border-line bg-cream p-5 text-[17px] leading-[1.75] text-ink">
          {value.trim() ? <Markdown source={value} /> : <p className="text-muted">{t("previewEmpty")}</p>}
        </div>
      )}
      <span id={`${id}-hint`} className="text-xs text-muted">
        {hint}
      </span>
    </div>
  );
}

function SyntaxHelp() {
  const t = useTranslations("admin.live.blog");
  const rows: [string, string][] = [
    ["## Intertitre", t("syntax.h2")],
    ["### Sous-titre", t("syntax.h3")],
    ["**gras**   *italique*", t("syntax.emphasis")],
    ["[texte](/contact)", t("syntax.link")],
    ["- élément", t("syntax.list")],
    ["> citation", t("syntax.quote")],
    ['![description](/media/… "légende")', t("syntax.image")],
    ["| A | B |\n| --- | --- |\n| 1 | 2 |", t("syntax.table")],
    [":::cta /circuits\nTitre\nTexte\nBouton\n:::", t("syntax.cta")],
  ];
  return (
    <details className="rounded-xl border border-line bg-cream px-4 py-3 text-sm">
      <summary className="cursor-pointer font-semibold text-night">{t("syntax.title")}</summary>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-[minmax(0,16rem)_1fr]">
        {rows.map(([code, label]) => (
          <div key={code} className="contents">
            <dt>
              <code className="block rounded-lg bg-white px-2.5 py-1.5 font-mono text-[12.5px] whitespace-pre-wrap text-night">{code}</code>
            </dt>
            <dd className="self-center text-muted">{label}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** Création ou modification d'un article du blog. */
export function PostForm({ post }: { post?: ApiPost }) {
  const t = useTranslations("admin.live.blog");
  const tc = useTranslations("admin.live.content");
  const [state, action, pending] = useActionState<ContentState, FormData>(savePost, {});
  const fr = post?.i18n.fr;
  const en = post?.i18n.en;
  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      {post && <input type="hidden" name="id" value={post.id} />}
      <Section title={tc("general")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field name="slug" label={tc("slug")} required maxLength={80} defaultValue={post?.slug} hint={t("slugHint")} />
          <Select name="category" label={t("category")} defaultValue={post?.category ?? "conseils"} options={categories.map((c) => [c, t(`categories.${c}`)])} />
          <Field name="publishedAt" label={t("publishedAt")} type="date" defaultValue={post?.publishedAt ?? undefined} hint={t("publishedAtHint")} />
          <Field name="position" label={tc("position")} type="number" defaultValue={post?.position ?? 0} hint={tc("positionHint")} />
        </div>
        <ImageField label={t("cover")} defaultValue={post?.imageUrl ?? "/images/"} />
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input type="checkbox" name="featured" defaultChecked={post?.featured ?? false} className="mt-0.5 size-4 accent-[var(--color-night)]" />
          <span>
            <strong className="text-night">{t("featured")}</strong> <span className="text-muted">— {t("featuredHint")}</span>
          </span>
        </label>
      </Section>

      <Section title={tc("textsFr")}>
        <Field name="fr.title" label={tc("title")} required maxLength={140} defaultValue={fr?.title} />
        <Area name="fr.lead" label={t("lead")} required maxLength={300} defaultValue={fr?.lead} rows={2} hint={t("leadHint")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="fr.excerpt" label={t("excerpt")} maxLength={200} defaultValue={fr?.excerpt} hint={t("excerptHint")} />
          <Field name="fr.tag" label={t("tag")} required maxLength={40} defaultValue={fr?.tag} placeholder="Îles · Guide" hint={t("tagHint")} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="fr.imageAlt" label={tc("imageAlt")} required maxLength={160} defaultValue={fr?.imageAlt} hint={tc("imageAltHint")} />
          <Field name="fr.tags" label={t("tags")} maxLength={260} defaultValue={fr?.tags.join(", ")} placeholder="Loos, Conakry, Plages" hint={t("tagsHint")} />
        </div>
        <BodyEditor name="fr.body" label={t("body")} defaultValue={fr?.body} required hint={t("bodyHint")} />
        <SyntaxHelp />
      </Section>

      <Section title={tc("textsEn")} hint={t("textsEnHint")}>
        <Field name="en.title" label={tc("title")} maxLength={140} defaultValue={en?.title} />
        <Area name="en.lead" label={t("lead")} maxLength={300} defaultValue={en?.lead} rows={2} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="en.excerpt" label={t("excerpt")} maxLength={200} defaultValue={en?.excerpt} />
          <Field name="en.tag" label={t("tag")} maxLength={40} defaultValue={en?.tag} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="en.imageAlt" label={tc("imageAlt")} maxLength={160} defaultValue={en?.imageAlt} />
          <Field name="en.tags" label={t("tags")} maxLength={260} defaultValue={en?.tags?.join(", ")} />
        </div>
        <BodyEditor name="en.body" label={t("body")} defaultValue={en?.body} hint={t("bodyEnHint")} />
      </Section>

      <SaveBar pending={pending} error={state.error} published={post?.published ?? false} />
    </form>
  );
}
