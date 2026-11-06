"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

export type LightboxImage = { src: string; alt: string; caption?: string };

/**
 * Visionneuse plein écran accessible (<dialog> natif) : flèches gauche/droite, Échap, focus piégé
 * par le navigateur et rendu à l'élément déclencheur. La position est annoncée (« 3 sur 12 »).
 */
export function Lightbox({ images, index, onIndexChange, onClose }: { images: readonly LightboxImage[]; index: number | null; onIndexChange: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useTranslations("ui");
  const returnFocus = useRef<HTMLElement | null>(null);
  const open = index !== null;
  const count = images.length;
  const current = index !== null ? images[index] : undefined;

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

  const go = (delta: number) => {
    if (index === null) return;
    onIndexChange((index + delta + count) % count);
  };

  return (
    <dialog
      ref={ref}
      aria-label={t("viewer")}
      onClose={() => {
        returnFocus.current?.focus();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-white backdrop:bg-ink/80"
    >
      {current && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p aria-live="polite" className="font-mono text-sm text-on-dark">
              {t("viewerPosition", { current: index !== null ? index + 1 : 0, total: count })}
            </p>
            <button type="button" onClick={() => ref.current?.close()} aria-label={t("closeViewer")} className="flex size-11 items-center justify-center rounded-full bg-night-2 hover:bg-night-line">
              <Icon name="close" size={20} />
            </button>
          </div>
          <figure className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 pb-6 sm:px-20">
            <div className="relative h-full w-full">
              <Image key={current.src} src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
            </div>
            {current.caption && <figcaption className="text-center text-[15px] text-on-dark-2">{current.caption}</figcaption>}
          </figure>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t("previousPhoto")}
                className="absolute top-1/2 left-3 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 sm:left-6"
              >
                <Icon name="arrowLeft" size={20} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t("nextPhoto")}
                className="absolute top-1/2 right-3 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-night hover:bg-cream sm:right-6"
              >
                <Icon name="arrowRight" size={20} />
              </button>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
