"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useRef } from "react";
import { useConsent, writeConsent } from "@/lib/consent";

/**
 * Bandeau cookies (Composants §09) : affiché tant que le choix n'est pas fait,
 * « Refuser » aussi simple que « Accepter ». Sur mobile, posé au-dessus de la barre d'actions.
 */
export function CookieBanner() {
  const consent = useConsent();
  const t = useTranslations("cookies");
  const heading = useRef<HTMLHeadingElement>(null);
  const visible = consent === null;

  // Réouverture via « Gérer les cookies » : le focus est placé sur le bandeau.
  useEffect(() => {
    if (visible && document.activeElement?.hasAttribute("data-manage-cookies")) heading.current?.focus();
  }, [visible]);

  if (!visible) return null;
  return (
    <section
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-[100px] z-30 flex flex-col gap-2.5 rounded-[var(--radius-panel)] bg-night p-4 text-[13px] leading-normal text-white shadow-[var(--shadow-toast)] sm:right-auto sm:bottom-6 sm:left-6 sm:max-w-[420px] sm:p-5"
    >
      <h2 id="cookie-title" ref={heading} tabIndex={-1} className="text-[15px] font-bold focus:outline-none">
        {t("title")}
      </h2>
      <p className="text-on-dark">
        {t("text")}{" "}
        <Link href="/cookies" className="underline">
          {t("more")}
        </Link>
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => writeConsent("accepted")} className="h-[42px] flex-1 rounded-full bg-brand-gold font-bold text-ink hover:bg-brand-gold-hover">
          {t("accept")}
        </button>
        <button type="button" onClick={() => writeConsent("refused")} className="h-[42px] flex-1 rounded-full border-[1.5px] border-on-dark-muted font-semibold hover:bg-night-2">
          {t("refuse")}
        </button>
      </div>
    </section>
  );
}
