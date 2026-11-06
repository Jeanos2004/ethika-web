import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** Bandeau du mode démonstration (lib/demo/mode.ts) : prévient que rien n'est transmis et mène au back-office de démo. */
export async function DemoBanner() {
  const t = await getTranslations("demo");
  return (
    <div role="note" className="relative z-[45] bg-brand-gold px-4 py-2 text-center text-[13px] leading-snug font-semibold text-ink">
      {t("banner")} {/* Back-office hors i18n (français) : lien natif, pas de préfixe de langue. */}
      <Link href="/admin" className="inline-flex min-h-6 items-center underline underline-offset-2 hover:no-underline">
        {t("backOffice")} →
      </Link>
    </div>
  );
}
