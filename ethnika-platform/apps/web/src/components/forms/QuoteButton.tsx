"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CircuitQuoteDialog } from "@/components/forms/CircuitQuote";

/** Bouton ouvrant la modale de devis d'un circuit (fiches destination et circuit). */
export function QuoteButton({ circuit, title, summary, className, children }: { circuit: string; title: string; summary: string; className?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("quote");
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children ?? t("requestQuote")}
      </button>
      <CircuitQuoteDialog open={open} onClose={() => setOpen(false)} circuit={circuit} title={title} summary={summary} />
    </>
  );
}
