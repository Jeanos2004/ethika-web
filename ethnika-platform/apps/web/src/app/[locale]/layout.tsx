import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { isDemo } from "@/lib/demo/mode";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

/** Une version statique par langue (FR sans préfixe, EN sous /en). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.name} · ${t("tagline")}`, template: `%s · ${site.name}` },
    description: t("description"),
    applicationName: site.name,
    icons: {
      icon: [{ url: "/favicon.ico" }, { url: "/icons/icon.svg", type: "image/svg+xml" }],
      apple: "/icons/apple-touch-icon.png",
    },
    openGraph: { type: "website", locale: locale === "en" ? "en_US" : "fr_GN", siteName: site.name },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    // Démo : placeholders et données fictives, à ne pas indexer.
    ...(isDemo && { robots: { index: false, follow: false } }),
  };
}

/**
 * Espaces de messages utilisés par des composants client. Les textes propres aux pages sont rendus côté serveur :
 * inutile de les sérialiser dans chaque page (environ 100 Ko de moins par document).
 * Ajouter ici tout nouvel espace lu par un composant client (sinon : erreur MISSING_MESSAGE au rendu client).
 */
const clientNamespaces = ["cards", "common", "demo", "cookies", "errors", "faq", "flight", "forms", "header", "mobileBar", "nav", "newsletter", "notFound", "pro", "quote", "search", "share", "site", "slider", "ui", "video"] as const;

async function clientMessages() {
  const all = await getMessages();
  return Object.fromEntries(clientNamespaces.map((ns) => [ns, all[ns]]));
}

export const viewport: Viewport = {
  themeColor: "#16211C",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <html lang={locale}>
      <body className="overflow-x-hidden">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:font-semibold">
          {t("skipToContent")}
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "TravelAgency",
            name: site.name,
            url: site.url,
            email: site.contact.email,
            logo: `${site.url}/brand/logo-vertical-couleur.svg`,
            address: { "@type": "PostalAddress", addressLocality: "Conakry", addressCountry: "GN" },
          }}
        />
        {isDemo && <DemoBanner />}
        <NextIntlClientProvider messages={await clientMessages()}>
          <SiteHeader />
          <main id="contenu">{children}</main>
          <SiteFooter />
          <WhatsAppFab />
          <MobileActionBar />
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
