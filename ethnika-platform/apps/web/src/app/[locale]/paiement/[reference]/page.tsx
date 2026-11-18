import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { clsx } from "clsx";
import type { Locale } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api/server";
import { startCheckout } from "@/lib/actions/payment";
import { formatMoney } from "@/lib/admin/money";
import { whatsappLink } from "@/lib/site";
import { AmountBlock, PaymentFrame } from "@/components/sections/PaymentCard";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Props = { params: Promise<{ locale: Locale; reference: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

type PublicPayment = { reference: string; amount: string; currency: string; label: string; status: "pending" | "paid" | "failed" | "cancelled" | "expired"; expiresAt: string; paidAt: string | null; leadReference: string; firstName: string; provider: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment" });
  // Lien personnel : jamais indexé, jeton jamais transmis en Referer.
  return { title: t("title"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/** Page de paiement d'un devis (lien personnel reçu par le client) : état relu en base à chaque affichage. */
export default async function PaymentPage({ params, searchParams }: Props) {
  const { locale, reference } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("payment");
  const q = await searchParams;
  const token = typeof q.t === "string" && /^[A-Za-z0-9_-]{30,100}$/.test(q.t) ? q.t : "";
  const error = typeof q.e === "string" ? q.e : "";

  let p: PublicPayment | null = null;
  if (/^PAY-[A-HJ-NP-Z2-9]{6}$/.test(reference) && token) {
    try {
      p = await api<PublicPayment>(`/v1/public/payments/${reference}`, { method: "POST", body: { token } });
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e;
    }
  }

  if (!p) {
    return (
      <PaymentFrame>
        <Status icon="alert" tone="bad" title={t("invalid.title")} text={t("invalid.text")} />
        <ButtonLink href={whatsappLink(t("whatsappMessage", { ref: reference }))} variant="secondary">
          {t("contact")}
        </ButtonLink>
      </PaymentFrame>
    );
  }

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Conakry" });
  const amount = formatMoney(p.amount, p.currency);

  return (
    <PaymentFrame>
      <div className="flex flex-col gap-1.5">
        <span className="kicker text-brand-red">{t("kicker")}</span>
        <h1 className="text-[clamp(28px,4vw,38px)] leading-tight font-bold tracking-[-0.03em] text-night">{p.status === "paid" ? t("paid.title", { name: p.firstName }) : t("hello", { name: p.firstName })}</h1>
      </div>

      <AmountBlock label={p.label} amount={amount} sub={t("forRequest", { ref: p.leadReference, payment: p.reference })} />

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" /> {t(`errors.${error === "rate" ? "rate" : "checkout"}`)}
        </p>
      )}

      {p.status === "pending" && (
        <>
          <ul className="flex flex-col gap-2.5 text-[15px] text-ink">
            {(["step1", "step2", "step3"] as const).map((k, i) => (
              <li key={k} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand font-mono text-xs font-semibold text-night">{i + 1}</span>
                {t(k)}
              </li>
            ))}
          </ul>
          <form action={startCheckout} className="flex flex-col gap-3">
            <input type="hidden" name="reference" value={p.reference} />
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand-red px-8 text-[16px] font-bold text-white hover:bg-brand-red-dark">
              <Icon name="shieldCheck" size={18} /> {t("pay", { amount })}
            </button>
            <span className="text-center text-xs text-muted">{t("expires", { date: dateFmt.format(new Date(p.expiresAt)) })}</span>
          </form>
          {p.provider === "mock" && <p className="rounded-xl border border-dashed border-line-strong bg-sand px-4 py-3 text-center text-xs text-muted">{t("mockNotice")}</p>}
        </>
      )}

      {p.status === "paid" && (
        <>
          <Status icon="check" tone="good" title={t("paid.subtitle")} text={t("paid.text", { date: p.paidAt ? dateFmt.format(new Date(p.paidAt)) : "" })} />
          <a
            href={`${locale === "en" ? "/en" : ""}/paiement/${p.reference}/recu?t=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-night px-6 font-semibold text-white hover:bg-night-2"
          >
            <Icon name="download" size={17} /> {t("receipt")}
          </a>
        </>
      )}
      {p.status === "failed" && <Status icon="alert" tone="bad" title={t("failed.title")} text={t("failed.text")} />}
      {(p.status === "expired" || p.status === "cancelled") && <Status icon="clock" tone="neutral" title={t(`${p.status}.title`)} text={t(`${p.status}.text`)} />}

      {p.status !== "pending" && (
        <ButtonLink href={whatsappLink(t("whatsappMessage", { ref: p.leadReference }))} variant="secondary">
          <Icon name="whatsapp" size={17} /> {t("contact")}
        </ButtonLink>
      )}
    </PaymentFrame>
  );
}

function Status({ icon, tone, title, text }: { icon: "check" | "alert" | "clock"; tone: "good" | "bad" | "neutral"; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <span className={clsx("flex size-12 shrink-0 items-center justify-center rounded-2xl", tone === "good" ? "bg-brand-green text-white" : tone === "bad" ? "bg-red-50 text-red-700" : "bg-sand text-night")}>
        <Icon name={icon} size={22} strokeWidth={2.2} />
      </span>
      <div className="flex flex-col gap-1">
        <strong className="text-lg text-night">{title}</strong>
        <p className="text-[15px] leading-relaxed text-muted">{text}</p>
      </div>
    </div>
  );
}
