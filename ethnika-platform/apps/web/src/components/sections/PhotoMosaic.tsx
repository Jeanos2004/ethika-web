"use client";

import Image from "next/image";
import { useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Lightbox, type LightboxImage } from "@/components/ui/Lightbox";

/**
 * Mosaïque de 5 photos (grande à gauche) ouvrant la visionneuse (Destination.dc.html).
 * La dernière vignette indique le nombre de photos supplémentaires.
 */
export function PhotoMosaic({ images }: { images: readonly LightboxImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const t = useTranslations("ui");
  const shown = images.slice(0, 5);
  const extra = images.length - shown.length;

  return (
    <>
      <ul className="grid auto-rows-[120px] grid-cols-2 gap-3 sm:auto-rows-[170px] sm:grid-cols-4">
        {shown.map((img, i) => {
          const last = i === shown.length - 1 && extra > 0;
          return (
            <li key={img.src} className={clsx("relative overflow-hidden", i === 0 ? "col-span-2 row-span-2 rounded-[var(--radius-md)]" : "rounded-[18px]")}>
              <button type="button" onClick={() => setIndex(i)} className="group absolute inset-0" aria-label={last ? t("seeAllPhotos", { count: images.length }) : t("enlarge", { alt: img.alt })}>
                <Image src={img.src} alt="" fill sizes={i === 0 ? "(min-width: 1100px) 400px, 100vw" : "(min-width: 1100px) 200px, 50vw"} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
                {last && <span className="absolute inset-0 flex items-center justify-center bg-ink/60 text-base font-bold text-white">{t("morePhotos", { count: extra })}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <Lightbox images={images} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} />
    </>
  );
}
