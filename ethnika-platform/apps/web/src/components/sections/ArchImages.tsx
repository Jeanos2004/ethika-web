import Image from "next/image";
import { clsx } from "clsx";
import type { ReactNode } from "react";

type Img = { src: string; alt: string };

/**
 * Duo d'images : grande image en arche + petite image encadrée de crème (Home2, Guinee, À propos).
 * `badge` : encart optionnel posé sur la composition.
 */
export function ArchImages({ main, secondary, badge, className }: { main: Img; secondary: Img; badge?: ReactNode; className?: string }) {
  return (
    <div className={clsx("relative h-[420px] min-w-0 flex-[1_1_480px] sm:h-[540px]", className)}>
      <div className="absolute top-0 left-0 h-[360px] w-[66%] overflow-hidden rounded-[999px_999px_28px_28px] sm:h-[480px]">
        <Image src={main.src} alt={main.alt} fill sizes="(min-width: 1100px) 33vw, 66vw" className="object-cover" />
      </div>
      <div className="absolute right-0 bottom-0 h-[220px] w-[46%] overflow-hidden rounded-[var(--radius-lg)] border-8 border-cream sm:h-[300px]">
        <Image src={secondary.src} alt={secondary.alt} fill sizes="(min-width: 1100px) 23vw, 46vw" className="object-cover" />
      </div>
      {badge}
    </div>
  );
}
