"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { commitPending } from "@/lib/demo/store";

/**
 * Mode démo, page /merci : enregistre la demande en attente sous sa référence (formulaires redirigés)
 * et propose de la retrouver dans le back-office de démonstration.
 */
export function DemoThanks({ reference }: { reference?: string }) {
  const t = useTranslations("demo");
  useEffect(() => {
    if (reference) commitPending(reference);
  }, [reference]);
  return (
    <Link
      href={reference ? `/admin/demandes?ref=${encodeURIComponent(reference)}` : "/admin/demandes"}
      className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover"
    >
      {t("seeRequest")} →
    </Link>
  );
}
