import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Grande bannière d'appel à l'action sur photo (Guinee, Circuits « Sur mesure », etc.).
 * Dégradé de gauche à droite pour garder le texte lisible.
 */
export function CtaBanner({
  image,
  imageAlt,
  kicker,
  title,
  children,
  actions,
  className = "",
}: {
  image: string;
  imageAlt: string;
  kicker?: string;
  title: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <section className={`container-site py-16 sm:py-[110px] ${className}`}>
      <div className="relative flex min-h-[380px] items-center overflow-hidden rounded-[var(--radius-xl)] text-white">
        <Image src={image} alt={imageAlt} fill sizes="(min-width: 1320px) 1272px, 100vw" className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgb(18_24_21/0.92)_0%,rgb(18_24_21/0.55)_55%,rgb(18_24_21/0.1)_100%)]" />
        <div className="relative flex max-w-[640px] flex-col gap-[18px] p-[clamp(28px,5vw,64px)]">
          {kicker && <span className="kicker text-brand-gold">{kicker}</span>}
          <h2 className="text-[clamp(32px,3.8vw,52px)] leading-[1.02] font-bold tracking-[-0.035em]">{title}</h2>
          {children && <div className="text-[17px] leading-relaxed text-on-dark-2">{children}</div>}
          <div className="flex flex-wrap gap-3">{actions}</div>
        </div>
      </div>
    </section>
  );
}
