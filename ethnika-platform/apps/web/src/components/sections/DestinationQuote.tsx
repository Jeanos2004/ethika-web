"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { CircuitQuoteDialog } from "@/components/forms/CircuitQuote";
import { Icon } from "@/components/ui/Icon";
import { whatsappLink } from "@/lib/site";

const travellerChoices = ["2", "1", "4", "10"] as const;

const field = "h-[52px] w-full rounded-[var(--radius-sm)] border-[1.5px] border-line-strong bg-white px-3.5 text-[15px] font-medium focus:border-night focus:ring-4 focus:ring-brand-gold/35 focus:outline-none";

/**
 * Encart de réservation collant d'une destination (Destination.dc.html § SIDEBAR).
 * Les trois champs préremplissent la modale de devis du circuit associé : aucun envoi depuis l'encart.
 */
export function DestinationQuote({ circuit, circuitTitle, durationLabel }: { circuit: string; circuitTitle: string; durationLabel: string }) {
  const uid = useId();
  const t = useTranslations("quote");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [travellers, setTravellers] = useState<(typeof travellerChoices)[number]>("2");
  const [phone, setPhone] = useState("");

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[0_24px_60px_rgb(18_24_21/0.14)]">
      <div className="flex items-end justify-between bg-night px-[26px] py-6 text-white">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-on-dark">{tc("startingFrom")}</span>
          <strong className="text-[30px] tracking-tight">{tc("price")}</strong>
          <span className="text-xs text-on-dark">{tc("perPerson")}</span>
        </div>
        <span className="rounded-full bg-brand-gold px-3 py-[7px] text-xs font-bold text-ink">{durationLabel}</span>
      </div>
      <div className="flex flex-col gap-3.5 px-[26px] py-6">
        <label htmlFor={`${uid}-date`} className="flex flex-col gap-1.5 text-sm font-semibold text-night">
          {t("travelDate")}
          <input id={`${uid}-date`} type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <label htmlFor={`${uid}-trav`} className="flex flex-col gap-1.5 text-sm font-semibold text-night">
          {t("travellers")}
          <select id={`${uid}-trav`} value={travellers} onChange={(e) => setTravellers(e.target.value as (typeof travellerChoices)[number])} className={field}>
            {travellerChoices.map((c) => (
              <option key={c} value={c}>
                {t(`choices.${c}`)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${uid}-tel`} className="flex flex-col gap-1.5 text-sm font-semibold text-night">
          {t("phone")}
          <input id={`${uid}-tel`} type="tel" autoComplete="tel" placeholder="+224" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        </label>
        <button type="button" onClick={() => setOpen(true)} className="h-14 rounded-full bg-brand-red text-base font-bold text-white hover:bg-brand-red-dark">
          {t("requestQuote")}
        </button>
        <a
          href={whatsappLink(t("whatsappMessage", { title: circuitTitle }))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[52px] items-center justify-center gap-2 rounded-full border-[1.5px] border-brand-green font-bold text-brand-green hover:bg-green-50"
        >
          <Icon name="whatsapp" size={18} /> {tc("writeWhatsapp")}
        </a>
        <span className="text-center text-xs leading-normal text-subtle">{tc("noPayment")}</span>
      </div>
      <CircuitQuoteDialog
        open={open}
        onClose={() => setOpen(false)}
        circuit={circuit}
        title={circuitTitle}
        summary={`${durationLabel} · ${t(`choices.${travellers}`)}`}
        defaults={{ travellers: Number(travellers), travelDate: date || undefined, phone: phone || undefined }}
      />
    </div>
  );
}
