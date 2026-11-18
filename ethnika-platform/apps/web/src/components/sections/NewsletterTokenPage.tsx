import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { NewsletterTokenForm } from "@/components/forms/NewsletterTokenForm";

/*
 * Pages des liens reçus par e-mail (alertes promo) : /newsletter/confirmer et /newsletter/desinscription.
 * Non indexées ; le jeton reste dans la page et n'est transmis qu'à l'API, par le serveur du site.
 */

export type TokenPageProps = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export function tokenMetadata(action: "confirm" | "unsubscribe") {
  return async ({ params }: TokenPageProps): Promise<Metadata> => {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "newsletter.token" });
    return { title: t(`${action}.title`), robots: { index: false, follow: false }, referrer: "no-referrer" };
  };
}

export async function NewsletterTokenPage({ params, searchParams, action }: TokenPageProps & { action: "confirm" | "unsubscribe" }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("newsletter.token");
  const raw = (await searchParams).token;
  const token = typeof raw === "string" && /^[A-Za-z0-9_-]{30,100}$/.test(raw) ? raw : "";
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[720px] flex-col justify-center gap-6 px-4 py-20 sm:px-6">
      <span className="kicker text-brand-red">{t("kicker")}</span>
      <h1 className="text-[clamp(36px,4.5vw,56px)] leading-[1.02] font-bold tracking-[-0.04em] text-night">{t(`${action}.title`)}</h1>
      {token ? (
        <NewsletterTokenForm action={action} token={token} />
      ) : (
        <p role="alert" className="text-lg text-muted">
          {t("errors.invalid")}
        </p>
      )}
    </section>
  );
}
