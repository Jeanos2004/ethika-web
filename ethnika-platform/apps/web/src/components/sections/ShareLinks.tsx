"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

/**
 * Partage d'un article par liens natifs (aucun script tiers ni traceur) + copie du lien.
 * La confirmation de copie est annoncée aux lecteurs d'écran.
 */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("share");
  const enc = encodeURIComponent;
  const round = "flex size-[42px] items-center justify-center rounded-full";
  const links = [
    { label: t("whatsapp"), href: `https://wa.me/?text=${enc(`${title} ${url}`)}`, className: "bg-brand-green text-white", content: <Icon name="whatsapp" size={18} /> },
    { label: t("facebook"), href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, className: "bg-night text-white font-bold", content: "f" },
    { label: t("linkedin"), href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, className: "bg-night text-white text-[13px] font-bold", content: "in" },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-[11px] tracking-[0.14em] text-subtle">{t("title")}</span>
      <div className="flex gap-2">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} className={`${round} ${l.className}`}>
            {l.content}
          </a>
        ))}
        <button type="button" onClick={copy} aria-label={t("copy")} className={`${round} border-[1.5px] border-line-strong text-night hover:border-night`}>
          <Icon name={copied ? "check" : "link"} size={18} />
        </button>
      </div>
      <span aria-live="polite" className="text-xs text-brand-green">
        {copied ? t("copied") : ""}
      </span>
    </div>
  );
}
