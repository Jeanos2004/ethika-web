"use client";

import { useTranslations } from "next-intl";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { LeadFormShell, type FieldError } from "@/components/forms/LeadFormShell";

const subjectKeys = ["flight", "circuit", "group", "other"] as const;

/** Champs d'identité communs (nom, téléphone, e-mail). */
export function IdentityFields({
  err,
  emailRequired = true,
  columns = "auto",
  defaultPhone,
}: {
  err: FieldError;
  emailRequired?: boolean;
  columns?: "auto" | "two";
  defaultPhone?: string;
}) {
  const t = useTranslations("forms");
  return (
    <div className={columns === "two" ? "grid gap-3.5 sm:grid-cols-2" : "grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5"}>
      <Input label={t("fullName")} name="fullName" autoComplete="name" required maxLength={120} error={err("fullName")} />
      <Input label={t("phone")} name="phone" type="tel" autoComplete="tel" placeholder="+224" required maxLength={20} defaultValue={defaultPhone} error={err("phone")} />
      <Input label={emailRequired ? t("email") : t("emailOptional")} name="email" type="email" autoComplete="email" required={emailRequired} maxLength={200} error={err("email")} />
    </div>
  );
}

/** Formulaire de contact (Contact.dc.html). L'objet est envoyé dans la langue de la page. */
export function LeadForm() {
  const t = useTranslations("forms");
  const subjects = subjectKeys.map((k) => ({ value: t(`subjects.${k}`), label: t(`subjects.${k}`) }));
  return (
    <LeadFormShell type="contact" submitLabel={t("sendMessage")} thanksPage>
      {(err) => (
        <>
          <IdentityFields err={err} columns="two" />
          <Select label={t("subject")} name="subject" options={subjects} defaultValue={subjects[0]?.value} error={err("subject")} />
          <Textarea label={t("message")} name="message" required maxLength={3000} placeholder={t("messagePlaceholder")} error={err("message")} />
        </>
      )}
    </LeadFormShell>
  );
}
