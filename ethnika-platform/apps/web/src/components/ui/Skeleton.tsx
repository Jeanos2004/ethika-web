import { clsx } from "clsx";
import { useTranslations } from "next-intl";

/** Bloc de chargement (décoratif). La pulsation est coupée si l'utilisateur réduit les animations. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx("skeleton rounded-md motion-safe:animate-pulse", className)} />;
}

/** Carte en cours de chargement (Composants §10), annoncée une seule fois aux lecteurs d'écran. */
export function CardSkeleton({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <div role="status" aria-live="polite" className={clsx("overflow-hidden rounded-[var(--radius-card)] border border-line bg-white", className)}>
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-[170px] rounded-none" />
      <div className="flex flex-col gap-2.5 p-[18px]">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-[18px] w-[85%]" />
        <Skeleton className="h-3 w-[70%]" />
      </div>
    </div>
  );
}
