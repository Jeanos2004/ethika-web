import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AgencyForm } from "@/components/admin/live/AgencyForm";
import { SettingsShell } from "@/components/admin/live/SettingsShell";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiAgency } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Agence · Paramètres" };

const fields = ["address", "phone", "whatsapp", "email", "licence", "rccm", "openingHours", "hoursWeekdays", "hoursSaturday", "hoursSunday", "paymentInstructions", "quoteTerms"] as const;

/** Paramètres · Agence (administrateurs) : coordonnées et mentions reprises sur les documents PDF. */
export default async function SettingsAgencyPage() {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.agency" });
  const agency = await api<ApiAgency>("/v1/agency", { session });
  const missing = fields.filter((k) => !agency[k] || /\[[^\]]+\]/.test(agency[k]));
  return (
    <SettingsShell tab="agency" live={await liveAccount(user, session)}>
      {!agency.verified && (
        <p className="flex items-start gap-2.5 rounded-2xl border border-brand-gold bg-cream px-5 py-4 text-sm text-ink">
          <Icon name="infoMark" size={17} className="mt-0.5 shrink-0 text-gold-700" />
          <span>
            <strong className="text-night">{t("fictitiousTitle")}</strong> {t("fictitiousText")}
          </span>
        </p>
      )}
      {missing.length > 0 ? (
        <p className="flex items-start gap-2.5 rounded-2xl border border-gold-50 bg-white px-5 py-4 text-sm text-ink">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-gold-700" />
          <span>
            <strong className="text-night">{t("missingTitle", { count: missing.length })}</strong> {t("missingList", { fields: missing.map((k) => t(k)).join(", ") })}
          </span>
        </p>
      ) : agency.verified ? (
        <p className="flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-brand-green-dark">
          <Icon name="check" size={16} /> {t("complete")}
        </p>
      ) : null}
      <AgencyForm agency={agency} />
    </SettingsShell>
  );
}
