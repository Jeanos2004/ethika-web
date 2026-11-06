import { clsx } from "clsx";
import type { ReactNode } from "react";

export function SectionHeading({
  kicker,
  title,
  intro,
  align = "center",
  tone = "light",
  as: Tag = "h2",
  className,
}: {
  kicker?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  tone?: "light" | "dark";
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1 sm:gap-2.5", align === "center" && "items-center text-center", className)}>
      {kicker && <span className={clsx("kicker", tone === "dark" ? "text-brand-gold" : "text-brand-red")}>{kicker}</span>}
      <Tag className={clsx("h-section max-w-[820px]", tone === "dark" ? "text-white" : "text-night")}>{title}</Tag>
      {intro && <p className={clsx("max-w-[620px] text-[17px] leading-relaxed", tone === "dark" ? "text-on-dark" : "text-muted")}>{intro}</p>}
    </div>
  );
}
