import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

/** Tuile photo cliquable avec dégradé, surtitre en italique et titre (« Autres destinations », « Destinations à combiner »…). */
export function PhotoTile({
  href,
  image,
  alt,
  title,
  eyebrow,
  className = "h-[300px]",
  sizes = "(min-width: 1100px) 33vw, 100vw",
}: {
  href: string;
  image: string;
  alt: string;
  title: string;
  eyebrow?: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <article className={clsx("group relative overflow-hidden rounded-[var(--radius-card)] text-white", cardFocus, className)}>
      <Image src={image} alt={alt} fill sizes={sizes} className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgb(18_24_21/0.88)_100%)]" />
      <div className="absolute right-[22px] bottom-5 left-[22px] flex flex-col gap-0.5">
        {eyebrow && <span className="font-serif text-xl text-brand-gold italic">{eyebrow}</span>}
        <h3 className="text-2xl font-bold">
          <Link href={href} className={stretchedLink}>
            {title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
