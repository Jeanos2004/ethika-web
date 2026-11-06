import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { metadataFor } from "@/content/pages";
import { LegalLayout } from "@/components/layout/LegalLayout";

export const generateMetadata = metadataFor("cookies");

/* Référence : design/maquettes/Legal.dc.html (onglet « cookies »). */
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  setRequestLocale((await params).locale);
  return <LegalLayout doc="cookies" />;
}
