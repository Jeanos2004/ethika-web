"use client";

import { useTranslations } from "next-intl";
import { Input, Textarea } from "@/components/ui/Field";
import { Counter } from "@/components/ui/Counter";
import { Modal } from "@/components/ui/Modal";
import { LeadFormShell } from "@/components/forms/LeadFormShell";
import { IdentityFields } from "@/components/forms/LeadForm";

export type QuoteDefaults = { travellers?: number; travelDate?: string; phone?: string };

const today = () => new Date().toISOString().slice(0, 10);

/** Formulaire de devis d'un circuit (modale de CircuitDetail.dc.html), prérempli depuis l'encart de réservation. */
export function CircuitQuoteForm({ circuit, defaults }: { circuit: string; defaults?: QuoteDefaults }) {
  const t = useTranslations("quote");
  return (
    <LeadFormShell type="circuit" hidden={{ circuit }} successText={t("successText")}>
      {(err) => (
        <>
          <IdentityFields err={err} columns="two" defaultPhone={defaults?.phone} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input label={t("travelDate")} name="travelDate" type="date" min={today()} defaultValue={defaults?.travelDate} error={err("travelDate")} />
            <Counter label={t("travellers")} name="travellers" min={1} max={12} defaultValue={defaults?.travellers ?? 2} />
          </div>
          <Textarea label={t("messageOptional")} name="message" rows={3} maxLength={3000} placeholder={t("messagePlaceholder")} error={err("message")} />
        </>
      )}
    </LeadFormShell>
  );
}

/** Modale de devis à en-tête sombre. Le formulaire est remonté à chaque ouverture (préremplissage à jour). */
export function CircuitQuoteDialog({
  open,
  onClose,
  circuit,
  title,
  summary,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  circuit: string;
  title: string;
  summary: string;
  defaults?: QuoteDefaults;
}) {
  const t = useTranslations("quote");
  return (
    <Modal open={open} onClose={onClose} tone="dark" eyebrow={t("eyebrow")} title={title} description={summary} className="w-[min(620px,calc(100%-32px))]">
      {open && <CircuitQuoteForm circuit={circuit} defaults={defaults} />}
    </Modal>
  );
}
