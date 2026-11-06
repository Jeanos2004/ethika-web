"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { site } from "@/lib/site";

/**
 * Ouvre la vidéo de présentation dans une modale.
 * Tant que `site.videoId` est vide, la modale affiche le placeholder de la maquette.
 * Lecteur YouTube en mode « nocookie » (domaine déjà autorisé par la CSP) : chargé seulement à l'ouverture.
 */
export function VideoButton({ className, children, ariaLabel }: { className?: string; children: ReactNode; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("video");
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={ariaLabel} className={className}>
        {children}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("title")} className="w-[min(960px,calc(100%-32px))]">
        {site.videoId ? (
          <div className="aspect-video overflow-hidden rounded-[var(--radius-md)] bg-ink">
            {open && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${site.videoId}?autoplay=1&rel=0`}
                title={t("iframeTitle")}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            )}
          </div>
        ) : (
          <p className="flex aspect-video items-center justify-center rounded-[var(--radius-md)] bg-night p-6 text-center text-on-dark">{t("placeholder")}</p>
        )}
      </Modal>
    </>
  );
}
