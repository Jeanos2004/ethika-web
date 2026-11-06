import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { Circuit, TagTone } from "@/content/circuits";
import { Icon } from "@/components/ui/Icon";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

const tagTones: Record<TagTone, string> = {
  red: "bg-brand-red text-white",
  night: "bg-night text-white",
  green: "bg-brand-green text-white",
  gold: "bg-brand-gold text-ink",
};

/**
 * Grande carte circuit (Home2 « Nos meilleures escapades », Circuits.dc.html).
 * Toute la carte mène à la fiche ; l'appel à l'action est visuel (un seul lien par carte).
 */
export function CircuitFeatureCard({
  circuit,
  cta = "pill",
  imageHeight = "h-[270px]",
  sizes = "(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
}: {
  circuit: Circuit;
  /** « link » : « Réserver → » (accueil) ; « pill » : bouton « Voir le circuit » (liste). */
  cta?: "link" | "pill";
  imageHeight?: string;
  sizes?: string;
  className?: string;
}) {
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  return (
    <article className={clsx("group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-md", cardFocus, className)}>
      <div className={clsx("relative overflow-hidden", imageHeight)}>
        <Image src={circuit.image} alt={circuit.imageAlt} fill sizes={sizes} className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
        <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-[7px] text-xs font-bold text-night">{circuit.durationLabel}</span>
        <span className={clsx("absolute top-4 right-4 rounded-full px-3 py-[7px] text-xs font-bold", tagTones[circuit.tag.tone])}>{circuit.tag.label}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <span className="flex items-center gap-1.5 text-[13px] text-subtle">
          <Icon name="pin" size={14} strokeWidth={2.2} className="text-brand-red" />
          {circuit.place}
        </span>
        <h3 className="text-[21px] leading-tight font-bold tracking-tight text-night sm:text-[23px]">
          <Link href={`/circuits/${circuit.slug}`} className={stretchedLink}>
            {circuit.title}
          </Link>
        </h3>
        <p className="text-[15px] leading-relaxed text-muted">{circuit.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-[13px] text-subtle">
            {tc("from")} <strong className="text-[19px] text-brand-red">{tc("price")}</strong>
          </span>
          {cta === "pill" ? (
            <span aria-hidden="true" className="flex h-11 items-center rounded-full bg-night px-[18px] text-sm font-bold text-white transition-colors group-hover:bg-night-line">
              {t("seeTour")}
            </span>
          ) : (
            <span aria-hidden="true" className="inline-flex items-center gap-1.5 font-bold text-night transition-colors group-hover:text-brand-red">
              {t("book")} <Icon name="arrowRight" size={16} strokeWidth={2.2} />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
