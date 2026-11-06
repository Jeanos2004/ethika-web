import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

export type ToastTone = "success" | "error" | "info";

const tones: Record<ToastTone, { box: string; dot: string; icon: IconName }> = {
  success: { box: "bg-night text-white shadow-toast", dot: "bg-brand-green text-white", icon: "check" },
  error: { box: "bg-red-50 text-red-700", dot: "bg-brand-red text-white", icon: "alert" },
  info: { box: "bg-gold-50 text-gold-700", dot: "bg-brand-gold text-ink", icon: "infoMark" },
};

/**
 * Message de retour (Composants §10).
 * Erreur → `role="alert"` (annoncé immédiatement) ; succès et info → `role="status"`.
 * À insérer dans le DOM au moment de l'événement pour être annoncé par les lecteurs d'écran.
 */
export function Toast({
  tone = "success",
  title,
  children,
  onDismiss,
  className,
}: {
  tone?: ToastTone;
  title: ReactNode;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx("flex items-start gap-3 rounded-[var(--radius-tile)] px-[18px] py-4 motion-safe:animate-toast-in", t.box, className)}
    >
      <span aria-hidden="true" className={clsx("flex size-7 shrink-0 items-center justify-center rounded-full", t.dot)}>
        <Icon name={t.icon} size={15} strokeWidth={2.6} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong>{title}</strong>
        {children && <div className={clsx("text-[13px]", tone === "success" && "text-on-dark")}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Fermer le message" className="-m-1.5 flex size-9 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
