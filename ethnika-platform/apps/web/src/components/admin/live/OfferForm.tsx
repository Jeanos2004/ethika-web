"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveOffer, type ContentState } from "@/lib/admin/content-actions";
import { fromMinorUnits } from "@/lib/admin/money";
import type { ApiOffer } from "@/lib/admin/types";
import { Area, Field, PriceFields, SaveBar, Section, Select } from "@/components/admin/live/ContentFields";
import { ImageField } from "@/components/admin/live/ImageField";
import { keepValues } from "@/components/admin/live/keep-values";

/** Création ou modification d'une offre (carte de la page Offres du site). */
export function OfferForm({ offer }: { offer?: ApiOffer }) {
  const t = useTranslations("admin.live.content");
  const [state, action, pending] = useActionState<ContentState, FormData>(saveOffer, {});
  const fr = offer?.i18n.fr;
  const en = offer?.i18n.en;
  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      {offer && <input type="hidden" name="id" value={offer.id} />}
      <Section title={t("general")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field name="slug" label={t("slug")} required maxLength={80} defaultValue={offer?.slug} hint={t("slugHint")} />
          <Select
            name="type"
            label={t("offerType")}
            defaultValue={offer?.type ?? "vol"}
            options={[
              ["vol", t("offerTypes.vol")],
              ["pack", t("offerTypes.pack")],
              ["last", t("offerTypes.last")],
            ]}
          />
          <Field name="position" label={t("position")} type="number" defaultValue={offer?.position ?? 0} hint={t("positionHint")} />
          <Field name="validUntil" label={t("validUntil")} type="date" defaultValue={offer?.validUntil?.slice(0, 10)} />
        </div>
        <ImageField label={t("imageUrl")} defaultValue={offer?.imageUrl ?? "/images/"} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="href" label={t("href")} required maxLength={300} defaultValue={offer?.href ?? "/billetterie#demande"} hint={t("hrefHint")} />
        </div>
        <PriceFields name="price" label={t("price")} amount={fromMinorUnits(offer?.priceAmount ?? null, offer?.currency ?? null)} currency={offer?.currency ?? null} />
      </Section>

      <Section title={t("textsFr")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="fr.kicker" label={t("kicker")} required maxLength={80} defaultValue={fr?.kicker} placeholder="Conakry → Paris" />
          <Field name="fr.title" label={t("title")} required maxLength={120} defaultValue={fr?.title} />
        </div>
        <Area name="fr.description" label={t("description")} required maxLength={300} defaultValue={fr?.description} rows={2} />
        <Field name="fr.imageAlt" label={t("imageAlt")} required maxLength={160} defaultValue={fr?.imageAlt} hint={t("imageAltHint")} />
      </Section>

      <Section title={t("textsEn")} hint={t("textsEnHint")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="en.kicker" label={t("kicker")} maxLength={80} defaultValue={en?.kicker} />
          <Field name="en.title" label={t("title")} maxLength={120} defaultValue={en?.title} />
        </div>
        <Area name="en.description" label={t("description")} maxLength={300} defaultValue={en?.description} rows={2} />
        <Field name="en.imageAlt" label={t("imageAlt")} maxLength={160} defaultValue={en?.imageAlt} />
      </Section>

      <SaveBar pending={pending} error={state.error} published={offer?.published ?? false} />
    </form>
  );
}
