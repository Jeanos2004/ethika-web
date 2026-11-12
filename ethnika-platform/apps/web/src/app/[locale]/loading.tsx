import { getTranslations } from "next-intl/server";
import { BrandLoader } from "@/components/ui/BrandLoader";

/** Chargement d'une page du site : loader de marque sous l'en-tête (le layout reste affiché). */
export default async function Loading() {
  const t = await getTranslations("common");
  return <BrandLoader label={t("loading")} />;
}
