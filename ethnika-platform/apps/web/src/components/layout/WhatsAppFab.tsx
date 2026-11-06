import { useTranslations } from "next-intl";
import { whatsappLink } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";

export function WhatsAppFab() {
  const t = useTranslations("common");
  return (
    <a
      href={whatsappLink(t("whatsappHello"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("writeWhatsapp")}
      className="fixed right-6 bottom-6 z-20 hidden size-16 items-center justify-center rounded-full bg-brand-green text-white sm:flex shadow-[0_12px_30px_rgb(18_24_21/0.35)] hover:bg-brand-green-dark"
    >
      <Icon name="whatsapp" size={28} />
    </a>
  );
}
