import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { LeadStatus } from "@/lib/demo/store";
import { statusDot } from "@/components/admin/status";

/** Statut d'une demande : pastille + libellé sur fond neutre. */
export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const t = useTranslations("admin");
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-ink", className)}>
      <span aria-hidden="true" className={clsx("size-2 rounded-full", statusDot[status])} />
      {t(`statuses.${status}`)}
    </span>
  );
}
