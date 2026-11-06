"use client";

import Image from "next/image";
import { useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { GalleryPhoto } from "@/content/gallery";
import { Lightbox } from "@/components/ui/Lightbox";

/** Mosaïque de la galerie (rangées de 240px, photos hautes sur deux rangées) ouvrant la visionneuse accessible. */
export function GalleryGrid({ photos }: { photos: readonly GalleryPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const t = useTranslations("ui");
  return (
    <>
      <ul className="grid grid-flow-dense auto-rows-[240px] grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-3.5">
        {photos.map((p, i) => (
          <li key={p.src} className={clsx("relative overflow-hidden rounded-[var(--radius-md)] bg-line", p.tall && "row-span-2")}>
            <button type="button" onClick={() => setIndex(i)} aria-label={t("enlarge", { alt: p.alt })} className="group absolute inset-0 cursor-zoom-in">
              <Image src={p.src} alt="" fill sizes="(min-width: 1100px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
              <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-semibold text-white">{p.place}</span>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox images={photos.map((p) => ({ src: p.src, alt: p.alt, caption: `${p.alt} · ${p.place}` }))} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} />
    </>
  );
}
