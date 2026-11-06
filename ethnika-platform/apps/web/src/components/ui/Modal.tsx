"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

/**
 * Modale sur <dialog> natif : `showModal()` fournit le piège de focus, la touche Échap
 * et l'inertie du reste de la page. On restaure explicitement le focus à la fermeture.
 * Le défilement de la page est bloqué en CSS (`html:has(dialog[open])`, globals.css).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  eyebrow,
  tone = "light",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Surtitre en capitales (ex. « DEMANDE DE DEVIS »). */
  eyebrow?: string;
  /** « dark » : en-tête nuit (modale de devis, CircuitDetail.dc.html). */
  tone?: "light" | "dark";
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const uid = useId();
  const t = useTranslations("common");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${uid}-title`}
      aria-describedby={description ? `${uid}-desc` : undefined}
      onClose={() => {
        returnFocus.current?.focus();
        onClose();
      }}
      onClick={(e) => {
        // Clic sur le fond (hors du contenu) : fermeture.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className={clsx(
        "m-auto max-h-[calc(100dvh-32px)] w-[min(640px,calc(100%-32px))] overflow-y-auto rounded-[var(--radius-lg)] bg-cream p-0 text-ink shadow-[0_30px_80px_rgb(18_24_21/0.4)] backdrop:bg-ink/70",
        className,
      )}
    >
      <div className={clsx("flex items-start justify-between gap-4", tone === "dark" ? "bg-night px-6 py-6 text-white sm:px-7" : "px-6 pt-6 sm:px-8 sm:pt-8")}>
        <div className="flex flex-col gap-1">
          {eyebrow && <span className="font-mono text-[11px] tracking-[0.12em] text-brand-gold">{eyebrow}</span>}
          <h2 id={`${uid}-title`} className={clsx("leading-tight font-bold tracking-tight", tone === "dark" ? "text-[22px]" : "text-[26px] text-night")}>
            {title}
          </h2>
          {description && (
            <p id={`${uid}-desc`} className={clsx(tone === "dark" ? "text-sm text-on-dark" : "text-[15px] text-muted")}>
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={t("close")}
          className={clsx(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            tone === "dark" ? "bg-night-2 text-white hover:bg-night-line" : "bg-sand text-night hover:bg-line",
          )}
        >
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className={clsx("flex flex-col gap-5", tone === "dark" ? "p-6 sm:p-7" : "px-6 pt-5 pb-6 sm:px-8 sm:pb-8")}>{children}</div>
    </dialog>
  );
}
