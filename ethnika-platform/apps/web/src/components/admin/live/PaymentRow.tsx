import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { cancelPayment } from "@/lib/admin/payment-actions";
import { formatMoney } from "@/lib/admin/money";
import type { ApiPayment } from "@/lib/admin/types";
import { formatShort } from "@/components/admin/status";
import { RenewLink } from "@/components/admin/live/PaymentLink";

export const paymentDot = { pending: "bg-brand-gold", paid: "bg-brand-green", failed: "bg-brand-red", cancelled: "bg-subtle", expired: "bg-subtle" } as const;

/** Ligne d'un paiement : référence, libellé, montant, état ; relance ou annulation si encore ouvert. */
export async function PaymentRow({ p, showLead = false, phone, clientName }: { p: ApiPayment; showLead?: boolean; phone?: string; clientName?: string }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.payments" });
  const open = p.status === "pending" || p.status === "expired";
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-sm text-night">
            <span className="font-mono">{p.reference}</span> · {p.label}
          </strong>
          <span className="truncate text-xs text-muted">
            {p.status === "paid" && p.paidAt ? t("paidOn", { date: formatShort(p.paidAt) }) : t("createdOn", { date: formatShort(p.createdAt) })}
            {p.method && <> · {p.method}</>}
            {showLead && (
              <>
                {" · "}
                <Link href={`/admin/demandes/${p.lead.reference}`} className="font-mono text-night hover:underline">
                  {p.lead.reference}
                </Link>{" "}
                {p.lead.fullName}
              </>
            )}
          </span>
        </span>
        <strong className="text-night tabular-nums">{formatMoney(p.amount, p.currency)}</strong>
        {p.status === "paid" && (
          <a href={`/admin/paiements/${p.id}/recu`} target="_blank" rel="noopener" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-[13px] font-semibold text-night hover:bg-line">
            {t("receipt")}
          </a>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold">
          <span aria-hidden="true" className={clsx("size-2 rounded-full", paymentDot[p.status])} />
          {t(`status.${p.status}`)}
        </span>
      </div>
      {open && (
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1">
            <RenewLink id={p.id} phone={phone} clientName={clientName} />
          </div>
          {p.status === "pending" && (
            <details className="relative">
              <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-full border-[1.5px] border-line-strong bg-white px-3 text-[13px] font-semibold text-night hover:border-brand-red hover:text-brand-red">{t("cancel")}</summary>
              <form action={cancelPayment} className="absolute right-0 z-10 mt-2 flex w-60 flex-col gap-2 rounded-xl border border-line bg-white p-3 text-sm shadow-lg">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="ref" value={p.lead.reference} />
                <span className="text-ink">{t("cancelConfirm")}</span>
                <button type="submit" className="min-h-10 rounded-full bg-brand-red px-3.5 text-[13px] font-semibold text-white">
                  {t("cancelYes")}
                </button>
              </form>
            </details>
          )}
        </div>
      )}
    </li>
  );
}
