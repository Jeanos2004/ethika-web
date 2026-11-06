import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

export type DestinationCardData = {
  href: string;
  title: string;
  /** Ex. « Basse Guinée » */
  region: string;
  image: string;
  imageAlt: string;
};

/** Carte destination sur photo (Composants §08). Hauteur pilotable via `className` (330px par défaut). */
export function DestinationCard({ destination, sizes = "(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 100vw", className }: { destination: DestinationCardData; sizes?: string; className?: string }) {
  return (
    <article className={clsx("group relative h-[330px] overflow-hidden rounded-[var(--radius-card)] text-white", cardFocus, className)}>
      <Image src={destination.image} alt={destination.imageAlt} fill sizes={sizes} className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgb(18_24_21/0.9)_100%)]" />
      <div className="absolute right-[18px] bottom-[18px] left-[18px] flex flex-col gap-1">
        <span className="font-mono text-[11px] tracking-[0.12em] text-brand-gold uppercase">{destination.region}</span>
        <h3 className="text-[22px] leading-tight font-bold">
          <Link href={destination.href} className={stretchedLink}>
            {destination.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
