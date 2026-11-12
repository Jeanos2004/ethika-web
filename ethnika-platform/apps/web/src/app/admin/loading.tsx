import { getTranslations } from "next-intl/server";
import { BrandLoader } from "@/components/ui/BrandLoader";

/** Chargement d'une page du back-office : loader de marque plein écran (chaque page porte sa propre coquille). */
export default async function Loading() {
  const t = await getTranslations({ locale: "fr", namespace: "common" });
  return <BrandLoader label={t("loading")} fullscreen />;
}
