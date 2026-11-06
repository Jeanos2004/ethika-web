import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "gold" | "outline-light" | "whatsapp" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:bg-line disabled:text-on-dark-muted";

const variants: Record<Variant, string> = {
  primary: "bg-brand-red text-white hover:bg-brand-red-dark",
  secondary: "bg-night text-white hover:bg-night-line",
  outline: "border-[1.5px] border-night text-night hover:bg-night hover:text-white font-semibold",
  gold: "bg-brand-gold text-ink hover:bg-brand-gold-hover",
  "outline-light": "border-[1.5px] border-white/70 text-white hover:bg-white hover:text-night font-semibold",
  whatsapp: "bg-brand-green text-white hover:bg-brand-green-dark",
  light: "bg-white text-brand-red hover:bg-cream",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[13px]",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-7 text-base",
};

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function buttonClasses({ variant = "primary", size = "md", className }: Omit<CommonProps, "children">) {
  return clsx(base, variants[variant], sizes[size], className);
}

export function Button({ variant, size, className, children, ...rest }: CommonProps & Omit<ComponentProps<"button">, "className">) {
  return (
    <button type="button" className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}

/** Lien stylé en bouton. Les liens externes reçoivent rel="noopener noreferrer". */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  external,
}: CommonProps & { href: string; external?: boolean }) {
  const cls = buttonClasses({ variant, size, className });
  if (external || href.startsWith("http")) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
