import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

export type CircuitCardData = {
  href: string;
  title: string;
  image: string;
  imageAlt: string;
  /** Ex. « 4 jours · Fouta » */
  meta: string;
  theme?: { label: string; tone: BadgeTone };
  /** Placeholder conservé tant que le client n'a pas fourni le prix. */
  price?: string;
};

/** Carte circuit (Composants §08). Toute la carte est cliquable via le lien du titre. */
export function CircuitCard({ circuit, sizes = "(min-width: 1100px) 25vw, (min-width: 640px) 50vw, 100vw", className }: { circuit: CircuitCardData; sizes?: string; className?: string }) {
  return (
    <article className={clsx("group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-md", cardFocus, className)}>
      <div className="relative h-[180px] overflow-hidden">
        <Image src={circuit.image} alt={circuit.imageAlt} fill sizes={sizes} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
        {circuit.theme && (
          <Badge tone={circuit.theme.tone} className="absolute top-3 left-3">
            {circuit.theme.label}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-[18px]">
        <span className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{circuit.meta}</span>
        <h3 className="text-lg leading-snug font-bold text-night">
          <Link href={circuit.href} className={stretchedLink}>
            {circuit.title}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-line-strong pt-2.5">
          <strong className="text-brand-red">{circuit.price ?? "[PRIX] GNF"}</strong>
          <Icon name="arrowRight" size={18} strokeWidth={2.4} className="text-brand-red transition-transform motion-safe:group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
}
