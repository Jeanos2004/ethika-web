import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import type { PageEntry } from "@/content/pages";

export type Crumb = { href?: string; label: string };

type HeroProps = {
  page: PageEntry;
  crumbs: Crumb[];
  children?: ReactNode;
  /** Remplace l'accroche en italique (ex. étiquettes de thème sur une fiche circuit). */
  eyebrow?: ReactNode;
  /** Marge basse du contenu (ex. pour laisser chevaucher une barre de recherche). */
  bottomClassName?: string;
  /** « center » : contenu centré (bannière Contact). */
  align?: "left" | "center";
};

/** Bannière photo des pages intérieures (en-tête transparent posé dessus). */
export function PageHero({ page, crumbs, children, eyebrow, bottomClassName = "pb-16 lg:pb-[72px]", align = "left" }: HeroProps) {
  if (!page.image) return <PlainHero page={page} crumbs={crumbs} eyebrow={eyebrow}>{children}</PlainHero>;
  return (
    <section className="relative flex min-h-[560px] flex-col overflow-hidden text-white lg:min-h-[640px]">
      <Image src={page.image} alt={page.imageAlt ?? ""} fill priority sizes="100vw" quality={90} className="object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_24_21/0.8)_0%,rgb(18_24_21/0.32)_40%,rgb(18_24_21/0.88)_100%)]" />
      <div className={`container-site relative flex flex-1 flex-col justify-end gap-4 pt-44 ${bottomClassName} ${align === "center" ? "items-center text-center" : ""}`}>
        <Breadcrumbs crumbs={crumbs} tone="dark" />
        {eyebrow ?? <span className="kicker text-brand-gold">{page.kicker}</span>}
        <h1 className="h-display max-w-[920px]">{page.heading}</h1>
        {children}
      </div>
    </section>
  );
}

function PlainHero({ page, crumbs, children, eyebrow }: Omit<HeroProps, "bottomClassName" | "align">) {
  return (
    <section className="container-site flex flex-col gap-3 pt-16 pb-10">
      <Breadcrumbs crumbs={crumbs} tone="light" />
      {eyebrow ?? <span className="kicker text-brand-red">{page.kicker}</span>}
      <h1 className="h-display text-night">{page.heading}</h1>
      {children}
    </section>
  );
}

export function Breadcrumbs({ crumbs, tone }: { crumbs: Crumb[]; tone: "dark" | "light" }) {
  const t = useTranslations("common");
  const muted = tone === "dark" ? "text-on-dark-2" : "text-subtle";
  const current = tone === "dark" ? "text-brand-gold" : "text-brand-red";
  return (
    <nav aria-label={t("breadcrumb")} className={`text-sm ${muted}`}>
      <ol className="flex flex-wrap gap-2">
        {crumbs.map((c, i) => (
          <li key={c.label} className="flex gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.href ? (
              <Link href={c.href} className="hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className={current}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
