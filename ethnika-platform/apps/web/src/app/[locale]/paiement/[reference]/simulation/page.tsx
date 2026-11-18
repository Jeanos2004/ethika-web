import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api/server";
import { simulatePayment } from "@/lib/actions/payment";
import { formatMoney } from "@/lib/admin/money";
import { AmountBlock, PaymentFrame } from "@/components/sections/PaymentCard";
import { Icon } from "@/components/ui/Icon";

type Props = { params: Promise<{ locale: Locale; reference: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = { title: "Simulation de paiement", robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * « Page du prestataire » simulée (recette) : remplace Orange Money, CinetPay ou la page carte tant que l'agence
 * n'a pas choisi son prestataire. N'existe que si l'API est en PAYMENT_PROVIDER=mock (interdit en production).
 */
export default async function PaymentSimulationPage({ params, searchParams }: Props) {
  const { locale, reference } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("payment.simulation");
  const q = await searchParams;
  const token = typeof q.t === "string" && /^[A-Za-z0-9_-]{30,100}$/.test(q.t) ? q.t : "";
  if (!/^PAY-[A-HJ-NP-Z2-9]{6}$/.test(reference) || !token) notFound();
  let p: { amount: string; currency: string; label: string; status: string; provider: string };
  try {
    p = await api(`/v1/public/payments/${reference}`, { method: "POST", body: { token } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (p.provider !== "mock") notFound();

  return (
    <PaymentFrame>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5 text-xs font-bold tracking-wide text-night uppercase">
          <Icon name="sliders" size={14} /> {t("badge")}
        </span>
        <span className="font-mono text-xs text-muted">{reference}</span>
      </div>
      <h1 className="text-[28px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
      <p className="-mt-3 text-[15px] leading-relaxed text-muted">{t("text")}</p>
      <AmountBlock label={p.label} amount={formatMoney(p.amount, p.currency)} />
      {p.status === "pending" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(["paid", "failed"] as const).map((outcome) => (
            <form key={outcome} action={simulatePayment}>
              <input type="hidden" name="reference" value={reference} />
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="outcome" value={outcome} />
              <button
                type="submit"
                className={
                  outcome === "paid"
                    ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-green px-6 font-bold text-white hover:bg-brand-green-dark"
                    : "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-night px-6 font-semibold text-night hover:bg-night hover:text-white"
                }
              >
                <Icon name={outcome === "paid" ? "check" : "close"} size={17} /> {t(outcome)}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">{t("closed")}</p>
      )}
    </PaymentFrame>
  );
}
