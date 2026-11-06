import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

export type PostCardData = {
  href: string;
  title: string;
  category: string;
  readingMinutes: number;
  excerpt: string;
  image: string;
  imageAlt: string;
};

/** Carte article de blog (Composants §08). Extrait limité à deux lignes. */
export function PostCard({ post, sizes = "(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 100vw", className }: { post: PostCardData; sizes?: string; className?: string }) {
  return (
    <article className={clsx("group relative flex flex-col gap-2.5 rounded-[var(--radius-md)]", cardFocus, className)}>
      <div className="relative h-[180px] overflow-hidden rounded-[var(--radius-md)]">
        <Image src={post.image} alt={post.imageAlt} fill sizes={sizes} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
      </div>
      <span className="font-mono text-[11px] tracking-[0.12em] text-brand-red uppercase">
        {post.category} · {post.readingMinutes} min
      </span>
      <h3 className="text-lg leading-snug font-bold text-night">
        <Link href={post.href} className={stretchedLink}>
          {post.title}
        </Link>
      </h3>
      <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{post.excerpt}</p>
    </article>
  );
}
