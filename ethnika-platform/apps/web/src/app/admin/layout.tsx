import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "../globals.css";

/*
 * Back-office (AdminDemandes.dc.html) — en français, hors du routage i18n (src/proxy.ts l'exclut).
 * Phase 1 : démonstration locale uniquement (chaque page renvoie 404 hors NEXT_PUBLIC_DEMO_MODE=1).
 * Phase 2 : protégé côté serveur à chaque requête (session API, RBAC), voir docs/PROMPT_CLAUDE_CODE.md § 6.
 */

export const metadata: Metadata = {
  title: { default: "Back-office · ETHNIKA", template: "%s · Back-office ETHNIKA" },
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/icons/icon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = { themeColor: "#16211C", width: "device-width", initialScale: 1 };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages({ locale: "fr" });
  return (
    <html lang="fr">
      <body className="bg-sand text-ink antialiased">
        <NextIntlClientProvider locale="fr" timeZone="Africa/Conakry" messages={{ admin: messages.admin, common: messages.common }}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
