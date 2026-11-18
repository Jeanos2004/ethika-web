import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";

/** Cadre commun des pages de paiement : bandeau aux couleurs de la marque, sceau « sécurisé ». */
export async function PaymentFrame({ children }: { children: ReactNode }) {
  const t = await getTranslations("payment");
  return (
    <section className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 pt-14 pb-20 sm:pt-20">
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <div aria-hidden="true" className="flex h-1.5">
          <span className="flex-1 bg-brand-red" />
          <span className="flex-1 bg-brand-gold" />
          <span className="flex-1 bg-brand-green" />
        </div>
        <div className="flex flex-col gap-6 p-6 sm:p-8">{children}</div>
      </div>
      <p className="flex items-center justify-center gap-2 text-center text-[13px] text-muted">
        <Icon name="shieldCheck" size={15} /> {t("secureNote")}
      </p>
    </section>
  );
}

/** Montant mis en avant + libellé. */
export function AmountBlock({ label, amount, sub }: { label: string; amount: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-night px-5 py-5 text-white">
      <span className="text-[13px] text-on-dark-muted">{label}</span>
      <strong className="text-[34px] leading-none font-bold tracking-[-0.02em] text-brand-gold tabular-nums">{amount}</strong>
      {sub && <span className="mt-1 text-sm text-on-dark">{sub}</span>}
    </div>
  );
}
