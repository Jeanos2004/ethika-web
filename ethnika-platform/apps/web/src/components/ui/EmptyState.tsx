import Image from "next/image";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/** État vide (aucun résultat de filtre, liste vide). `action` : bouton ou lien de réinitialisation. */
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = useTranslations("ui");
  return (
    <div className={clsx("flex flex-col items-center gap-2.5 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line-strong px-[22px] py-8 text-center", className)}>
      <Image src="/brand/symbole-aplat.svg" alt="" width={70} height={70} className="h-auto w-[70px] opacity-50" />
      <p className="text-lg font-bold text-night">{title ?? t("emptyTitle")}</p>
      <p className="text-sm text-muted">{children ?? t("emptyText")}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
