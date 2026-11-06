import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ReactNode } from "react";
import { slugify, textOf } from "@/lib/slug";

/*
 * Composants autorisés dans les articles MDX (src/content/blog).
 * Le contenu riche passe par ces composants contrôlés, jamais par du HTML brut (docs/SECURITY.md).
 * Les liens externes reçoivent rel="noopener noreferrer" ; seuls http(s), mailto et tel sont acceptés.
 */

const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/;

function A({ href = "", children }: ComponentProps<"a">) {
  if (!SAFE_HREF.test(href)) return <span>{children}</span>;
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className="font-semibold text-brand-red underline underline-offset-4">
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-red underline underline-offset-4">
      {children}
    </a>
  );
}

/** Image d'article avec légende. Sources limitées aux images du site. */
function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  if (!src.startsWith("/images/")) return null;
  return (
    <figure className="my-2">
      <div className="relative h-[260px] overflow-hidden rounded-3xl sm:h-[380px]">
        <Image src={src} alt={alt} fill sizes="(min-width: 1100px) 760px, 100vw" className="object-cover" />
      </div>
      {caption && <figcaption className="mt-2.5 text-sm text-subtle">{caption}</figcaption>}
    </figure>
  );
}

/** Encart d'appel à l'action en fin d'article (lien interne uniquement). */
function CtaCard({ href, title, text, label }: { href: string; title: string; text: string; label: string }) {
  if (!href.startsWith("/")) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-[18px] rounded-[var(--radius-card)] bg-night p-7 text-white">
      <div className="flex flex-col gap-1.5">
        <strong className="text-[22px] leading-tight">{title}</strong>
        <span className="text-[15px] leading-normal text-on-dark">{text}</span>
      </div>
      <Link href={href} className="inline-flex h-[52px] items-center rounded-full bg-brand-gold px-6 text-[15px] font-bold text-ink hover:bg-brand-gold-hover">
        {label}
      </Link>
    </div>
  );
}

/** Mention d'un contenu encore à rédiger par l'agence. */
function Todo({ children }: { children: ReactNode }) {
  return <p className="rounded-[var(--radius-md)] border-[1.5px] border-dashed border-line-strong p-6 text-base text-muted">{children}</p>;
}

const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 id={slugify(textOf(children))} className="mt-4 scroll-mt-[calc(var(--header-h)+24px)] text-[clamp(26px,3vw,32px)] leading-[1.15] font-bold tracking-[-0.025em] text-night">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="mt-2 text-[22px] font-bold text-night">{children}</h3>,
  p: ({ children }) => <p>{children}</p>,
  a: A,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-6">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 rounded-[var(--radius-md)] border-l-[6px] border-brand-gold bg-sand px-7 py-6 font-serif text-[26px] leading-[1.4] text-night italic [&>p]:m-0">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div role="region" aria-label="Tableau" tabIndex={0} className="overflow-x-auto rounded-[var(--radius-md)] border border-line bg-white text-base leading-normal">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-night text-left text-white">{children}</thead>,
  th: ({ children }) => (
    <th scope="col" className="px-[18px] py-3.5">
      {children}
    </th>
  ),
  tr: ({ children }) => <tr className="border-t border-line even:bg-cream">{children}</tr>,
  td: ({ children }) => <td className="px-[18px] py-3.5">{children}</td>,
  img: () => null, // images uniquement via <Figure> (sources contrôlées)
  Figure,
  CtaCard,
  Todo,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
