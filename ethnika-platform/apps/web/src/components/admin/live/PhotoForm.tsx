"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { savePhoto, type ContentState } from "@/lib/admin/content-actions";
import type { ApiPhoto, GalleryCategoryKey } from "@/lib/admin/types";
import { Field, SaveBar, Section, Select } from "@/components/admin/live/ContentFields";
import { ImageField } from "@/components/admin/live/ImageField";
import { keepValues } from "@/components/admin/live/keep-values";

const categories: GalleryCategoryKey[] = ["fouta", "cote", "loos", "vie"];

/** Ajout ou modification d'une photo de la galerie. */
export function PhotoForm({ photo }: { photo?: ApiPhoto }) {
  const t = useTranslations("admin.live.gallery");
  const tc = useTranslations("admin.live.content");
  const [state, action, pending] = useActionState<ContentState, FormData>(savePhoto, {});
  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      {photo && <input type="hidden" name="id" value={photo.id} />}
      <Section title={t("photo")}>
        <ImageField label={t("image")} defaultValue={photo?.imageUrl ?? ""} hint={t("imageHint")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select name="category" label={t("category")} defaultValue={photo?.category ?? "fouta"} options={categories.map((c) => [c, t(`categories.${c}`)])} />
          <Field name="position" label={tc("position")} type="number" defaultValue={photo?.position ?? 0} hint={tc("positionHint")} />
          <label className="flex items-center gap-2.5 self-end pb-3 text-sm text-ink sm:pb-2.5">
            <input type="checkbox" name="tall" defaultChecked={photo?.tall ?? false} className="size-4 accent-[var(--color-night)]" />
            <span>
              <strong className="text-night">{t("tall")}</strong> <span className="text-muted">— {t("tallHint")}</span>
            </span>
          </label>
        </div>
      </Section>

      <Section title={tc("textsFr")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="fr.alt" label={t("alt")} required maxLength={160} defaultValue={photo?.i18n.fr.alt} hint={t("altHint")} />
          <Field name="fr.place" label={t("place")} required maxLength={80} defaultValue={photo?.i18n.fr.place} placeholder="Fouta Djallon" hint={t("placeHint")} />
        </div>
      </Section>

      <Section title={tc("textsEn")} hint={tc("textsEnHint")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="en.alt" label={t("alt")} maxLength={160} defaultValue={photo?.i18n.en?.alt} />
          <Field name="en.place" label={t("place")} maxLength={80} defaultValue={photo?.i18n.en?.place} />
        </div>
      </Section>

      <SaveBar pending={pending} error={state.error} published={photo?.published ?? true} />
    </form>
  );
}
