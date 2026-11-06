import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import type { ComponentProps, ReactNode } from "react";

type ChipOwnProps = { active?: boolean; count?: number; className?: string; children: ReactNode };

function chipClasses(active: boolean | undefined, className?: string) {
  return clsx(
    "inline-flex h-11 items-center gap-2 rounded-full px-[18px] font-semibold whitespace-nowrap transition-colors",
    active ? "bg-night text-white" : "border-[1.5px] border-line-strong text-ink hover:border-night",
    className,
  );
}

function Count({ value, active }: { value: number; active?: boolean }) {
  return <span className={clsx("font-mono", active ? "text-on-dark-muted" : "text-subtle")}>{value}</span>;
}

/**
 * Filtre en pastille.
 * - Avec `href` : lien (filtre reflété dans l'URL, fonctionne sans JS), `aria-current` sur l'actif.
 * - Sans `href` : bouton bascule avec `aria-pressed`.
 */
export function Chip({ active, count, className, children, href, ...rest }: ChipOwnProps & { href?: string } & Omit<ComponentProps<"button">, "className" | "children">) {
  const content = (
    <>
      {children}
      {count !== undefined && <Count value={count} active={active} />}
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-current={active ? "true" : undefined} className={chipClasses(active, className)} scroll={false}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" aria-pressed={active ?? false} className={chipClasses(active, className)} {...rest}>
      {content}
    </button>
  );
}
