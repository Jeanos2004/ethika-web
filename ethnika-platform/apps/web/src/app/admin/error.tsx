"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

/**
 * Erreur dans le back-office (API momentanément injoignable, redémarrage, coupure réseau) :
 * message clair et bouton « Réessayer » au lieu d'une page technique. Aucun détail interne n'est affiché.
 */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("admin.live.failure");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-sand px-5 py-12 text-center">
      <Image src="/brand/logo-horizontal-couleur.svg" alt="ETHNIKA" width={150} height={48} className="h-10 w-auto" />
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-brand-red shadow-sm">
        <Icon name="alert" size={26} />
      </span>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
        <p className="text-[15px] leading-relaxed text-muted">{t("text")}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => reset()} className="inline-flex h-11 items-center gap-2 rounded-full bg-night px-6 text-sm font-semibold text-white hover:bg-night-2">
          <Icon name="refresh" size={16} /> {t("retry")}
        </button>
        <Link href="/admin" className="inline-flex h-11 items-center rounded-full border-[1.5px] border-night px-6 text-sm font-semibold text-night hover:bg-night hover:text-white">
          {t("home")}
        </Link>
      </div>
      <p className="max-w-md text-xs text-muted">{t("hint")}</p>
    </main>
  );
}
