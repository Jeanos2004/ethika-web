import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";

/**
 * Écrans d'accès au back-office (connexion, sécurisation du premier accès).
 * ≥ 1024 px : photo de marque à gauche, formulaire à droite. Mobile : bandeau de marque compact puis formulaire.
 */
export async function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.auth" });
  return (
    <div className="min-h-dvh bg-sand lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-night lg:block">
        <Image src="/images/fouta-plateau-couchant.jpg" alt="" fill priority sizes="50vw" className="object-cover opacity-80" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_24_21/0.55)_0%,rgb(18_24_21/0.15)_40%,rgb(18_24_21/0.9)_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <Image src="/brand/logo-horizontal-inverse.svg" alt="ETHNIKA" width={170} height={54} className="h-12 w-auto self-start" />
          <div className="flex max-w-md flex-col gap-3">
            <span className="font-mono text-[11px] tracking-[0.16em] text-white/70 uppercase">{t("kicker")}</span>
            <p className="text-[30px] leading-[1.15] font-bold tracking-[-0.03em] xl:text-[34px]">{t("tagline")}</p>
            <p className="text-[15px] leading-relaxed text-white/80">{t("taglineText")}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:min-h-0">
        <header className="flex h-16 items-center bg-night px-5 lg:hidden">
          <Image src="/brand/logo-horizontal-inverse.svg" alt="ETHNIKA" width={130} height={41} className="h-9 w-auto" priority />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className={wide ? "w-full max-w-xl" : "w-full max-w-[400px]"}>{children}</div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 pb-6 text-[13px] text-muted sm:px-10">
          <span className="flex items-center gap-1.5">
            <Icon name="shieldCheck" size={15} /> {t("secure")}
          </span>
          <Link href="/" className="inline-flex items-center gap-1.5 font-semibold text-night hover:underline">
            <Icon name="arrowLeft" size={15} /> {t("backToSite")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
