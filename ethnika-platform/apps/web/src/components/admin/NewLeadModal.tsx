"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { leadTypes, type LeadType } from "@/lib/schemas/lead";
import { addManualLead } from "@/lib/demo/store";

type Errors = Partial<Record<"name" | "phone" | "email" | "summary", string>>;

/** Saisie manuelle d'une demande reçue par téléphone, WhatsApp ou en agence. */
export function NewLeadModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (ref: string) => void }) {
  const t = useTranslations("admin.newLead");
  const tTypes = useTranslations("admin.types");
  const [errors, setErrors] = useState<Errors>({});

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const input = {
      type: get("type") as LeadType,
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      summary: get("summary"),
      note: get("note"),
    };
    const next: Errors = {};
    if (input.name.length < 2) next.name = t("errName");
    if (!/^\+?[0-9 ().-]{8,20}$/.test(input.phone)) next.phone = t("errPhone");
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) next.email = t("errEmail");
    if (input.summary.length < 3) next.summary = t("errSummary");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const ref = addManualLead({
      ...input,
      type: leadTypes.includes(input.type) ? input.type : "contact",
    });
    e.currentTarget.reset();
    onCreated(ref);
  }

  return (
    <Modal open={open} onClose={onClose} title={t("title")} description={t("description")}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select name="type" label={t("type")} defaultValue="billet" options={leadTypes.map((v) => ({ value: v, label: tTypes(v) }))} />
          <Input name="name" label={t("name")} autoComplete="off" maxLength={120} error={errors.name} />
          <Input name="phone" label={t("phone")} type="tel" inputMode="tel" placeholder="+224" maxLength={20} error={errors.phone} />
          <Input name="email" label={t("email")} type="email" maxLength={200} error={errors.email} />
        </div>
        <Input name="summary" label={t("summary")} hint={t("summaryHint")} maxLength={160} error={errors.summary} />
        <Textarea name="note" label={t("note")} rows={3} maxLength={1000} />
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <button type="submit" className="inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-6 text-[15px] font-bold text-white hover:bg-brand-red-dark">
            {t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
