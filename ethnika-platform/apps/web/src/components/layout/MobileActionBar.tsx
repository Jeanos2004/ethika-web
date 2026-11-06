import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { phoneLink, whatsappLink } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";

/**
 * Barre d'actions fixe en bas d'écran sur mobile (HomeMobile.dc.html).
 * Remplace le bouton WhatsApp flottant sous 640px. Le pied de page réserve sa hauteur.
 */
export function MobileActionBar() {
  const tel = phoneLink();
  const t = useTranslations("mobileBar");
  const tCommon = useTranslations("common");
  return (
    <nav aria-label={t("label")} className="fixed inset-x-3 bottom-4 z-20 flex gap-2 rounded-[var(--radius-md)] bg-white p-2 shadow-[0_14px_34px_rgb(18_24_21/0.25)] sm:hidden">
      <a
        href={whatsappLink(tCommon("whatsappHello"))}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tCommon("writeWhatsapp")}
        className="flex size-[54px] shrink-0 items-center justify-center rounded-2xl bg-brand-green text-white"
      >
        <Icon name="whatsapp" size={24} />
      </a>
      <a
        href={tel}
        aria-label={tel.startsWith("tel:") ? t("call") : t("contact")}
        className="flex size-[54px] shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-line-strong text-night"
      >
        <Icon name="phone" size={22} />
      </a>
      <Link href="/billetterie" className="flex h-[54px] flex-1 items-center justify-center rounded-2xl bg-brand-red text-[15px] font-bold text-white">
        {t("ticket")}
      </Link>
    </nav>
  );
}
