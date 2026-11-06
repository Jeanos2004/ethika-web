import Image from "next/image";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";

/* Référence : design/maquettes/Page404.dc.html */
export default function NotFound() {
  const t = useTranslations("notFound");
  const tNav = useTranslations("nav");
  return (
    <section className="relative flex min-h-[760px] items-center overflow-hidden bg-night text-white">
      <Image src="/images/barque-calme.jpg" alt="" fill sizes="100vw" className="object-cover opacity-45" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_24_21/0.7)_0%,rgb(18_24_21/0.55)_50%,rgb(18_24_21/0.92)_100%)]" />
      <div className="container-site relative flex flex-col items-center gap-4 pt-40 pb-20 text-center">
        <span className="font-mono text-[clamp(90px,16vw,200px)] leading-[0.9] tracking-tight text-brand-gold">404</span>
        <span className="kicker text-brand-gold">{t("kicker")}</span>
        <h1 className="text-[clamp(34px,4.4vw,58px)] leading-none font-bold tracking-[-0.04em]">{t("title")}</h1>
        <p className="max-w-[540px] text-lg text-on-dark-2">{t("text")}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">
            {t("home")}
          </ButtonLink>
          <ButtonLink href="/circuits" variant="outline-light" size="lg">
            {tNav("circuits")}
          </ButtonLink>
          <ButtonLink href="/billetterie" variant="outline-light" size="lg">
            {tNav("billetterie")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
