import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

export type OfferType = "vol" | "pack" | "last";

/** Couleur d'étiquette par type d'offre (maquette Offres.dc.html) ; libellés dans les messages (cards.offerTypes). */
export const offerTypes: Record<OfferType, { tone: BadgeTone }> = {
  vol: { tone: "night" },
  pack: { tone: "green" },
  last: { tone: "gold" },
};

export type OfferCardData = {
  type: OfferType;
  href: string;
  title: string;
  /** Ex. « Conakry → Paris » */
  kicker: string;
  description: string;
  image: string;
  imageAlt: string;
  price?: string;
  validUntil?: string;
};

/** Carte offre (maquette Offres.dc.html) : prix « à partir de » et bouton d'action. */
export function OfferCard({ offer, sizes = "(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 100vw", className }: { offer: OfferCardData; sizes?: string; className?: string }) {
  const type = offerTypes[offer.type];
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  return (
    <article className={clsx("flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-md", className)}>
      <div className="relative h-[210px]">
        <Image src={offer.image} alt={offer.imageAlt} fill sizes={sizes} className="object-cover" />
        <Badge tone={type.tone} className="absolute top-3.5 left-3.5 py-[7px]">
          {t(`offerTypes.${offer.type}`)}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
        <span className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{offer.kicker}</span>
        <h3 className="text-[21px] leading-tight font-bold text-night">{offer.title}</h3>
        <p className="text-sm leading-relaxed text-muted">{offer.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-line-strong pt-3.5">
          <div className="flex flex-col">
            <span className="text-xs text-subtle">{tc("startingFrom")}</span>
            <strong className="text-[22px] tracking-tight text-brand-red">{offer.price ?? tc("price")}</strong>
          </div>
          <Link href={offer.href} className="inline-flex h-11 items-center rounded-full bg-night px-[18px] text-sm font-semibold text-white hover:bg-night-line">
            {t("enjoy")}
            <span className="sr-only"> : {offer.title}</span>
          </Link>
        </div>
        <span className="text-xs text-subtle">{t("validUntil", { date: offer.validUntil ?? tc("date") })}</span>
      </div>
    </article>
  );
}
