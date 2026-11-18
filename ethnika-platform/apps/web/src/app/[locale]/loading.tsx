import { getTranslations } from "next-intl/server";
import { BrandLoader } from "@/components/ui/BrandLoader";

/** Chargement d'une page du site : loader de marque seul, plein écran et centré (en-tête et pied de page masqués jusqu'à l'affichage de la page). */
export default async function Loading() {
  const t = await getTranslations("common");
  return <BrandLoader label={t("loading")} fullscreen />;
}
