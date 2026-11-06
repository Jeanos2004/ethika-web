"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { CircuitQuoteDialog } from "@/components/forms/CircuitQuote";
import { Icon } from "@/components/ui/Icon";
import { whatsappLink } from "@/lib/site";

const MIN = 1;
const MAX = 12;

/**
 * Encart de réservation collant de la fiche circuit (CircuitDetail.dc.html § STICKY BOOKING).
 * Le nombre de voyageurs choisi est repris dans la modale de devis. Aucun paiement en ligne.
 */
export function CircuitBooking({ slug, title, durationLabel, priceBasis }: { slug: string; title: string; durationLabel: string; priceBasis: string }) {
  const uid = useId();
  const t = useTranslations("quote");
  const tc = useTranslations("common");
  const [travellers, setTravellers] = useState(2);
  const [open, setOpen] = useState(false);
  const label = t("travellersCount", { count: travellers });
  const step = "flex size-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] bg-white p-7 shadow-[0_24px_60px_rgb(22_33_28/0.12)]">
      <span className="font-mono text-xs tracking-[0.12em] text-subtle uppercase">{t("circuitLabel", { duration: durationLabel })}</span>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm text-muted">{tc("startingFrom")}</span>
        <strong className="text-4xl tracking-tight text-night">{tc("price")}</strong>
      </div>
      <span className="text-sm text-muted">{priceBasis}</span>
      <hr className="border-line" />
      <div role="group" aria-labelledby={`${uid}-label`} className="flex items-center justify-between">
        <span id={`${uid}-label`} className="font-semibold">
          {t("travellers")}
        </span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setTravellers((n) => Math.max(MIN, n - 1))} disabled={travellers <= MIN} aria-label={t("removeTraveller")} className={`${step} border-[1.5px] border-line-strong bg-white`}>
            <Icon name="minus" size={16} />
          </button>
          <output aria-live="polite" className="min-w-5 text-center font-mono text-lg">
            {travellers}
          </output>
          <button type="button" onClick={() => setTravellers((n) => Math.min(MAX, n + 1))} disabled={travellers >= MAX} aria-label={t("addTraveller")} className={`${step} bg-night text-white`}>
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>
      <button type="button" onClick={() => setOpen(true)} className="h-14 rounded-full bg-brand-red text-base font-bold text-white hover:bg-brand-red-dark">
        {t("requestQuote")}
      </button>
      <a
        href={whatsappLink(t("whatsappMessageCount", { title, count: label }))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-[54px] items-center justify-center gap-2 rounded-full border-[1.5px] border-brand-green font-bold text-brand-green hover:bg-green-50"
      >
        <Icon name="whatsapp" size={18} /> {tc("writeWhatsapp")}
      </a>
      <p className="text-[13px] leading-normal text-subtle">{t("reply24h")}</p>
      <CircuitQuoteDialog open={open} onClose={() => setOpen(false)} circuit={slug} title={title} summary={`${durationLabel} · ${label}`} defaults={{ travellers }} />
    </div>
  );
}
