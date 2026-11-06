"use client";

import { useTranslations } from "next-intl";
import { resetConsent, useConsent } from "@/lib/consent";

/** « Gérer les cookies » (page Cookies) : rouvre le bandeau en effaçant le choix enregistré. */
export function ManageCookies() {
  const consent = useConsent();
  const t = useTranslations("cookies");
  const label = consent === "accepted" ? t("stateAccepted") : consent === "refused" ? t("stateRefused") : t("stateNone");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[18px] bg-sand p-5">
      <div className="flex flex-col">
        <span className="text-[15px] font-semibold text-night">{t("manageTitle")}</span>
        <span aria-live="polite" className="text-sm text-muted">
          {consent === "unknown" ? "" : label}
        </span>
      </div>
      <button type="button" data-manage-cookies onClick={resetConsent} className="h-[46px] rounded-full bg-night px-5 text-sm font-semibold text-white hover:bg-night-line">
        {t("manage")}
      </button>
    </div>
  );
}
