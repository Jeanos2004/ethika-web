import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, type PageKey } from "@/content/pages";
import { site } from "@/lib/site";

/*
 * Images Open Graph (1200 × 630) générées au build par next/og, aux couleurs de la marque.
 * Volontairement sans photo : un PNG photographique pèse 1 à 2 Mo, trop lourd pour les aperçus WhatsApp
 * (canal principal des clients) ; cette composition reste sous ~100 Ko.
 * Satori ne lit pas les variables CSS : les couleurs reprennent les tokens de globals.css (@theme).
 */
const ogSize = { width: 1200, height: 630 };
const color = { night: "#16211c", red: "#b0121b", gold: "#e3a935", cream: "#fffbf5", muted: "#c9c2b4" } as const;

async function publicDataUrl(path: string, mime: string) {
  const file = await readFile(join(process.cwd(), "public", path));
  return `data:${mime};base64,${file.toString("base64")}`;
}

/** Image OG générique : `kicker` en capitales mono dorées, `title` en grand, `caption` en pied. */
export async function renderOg({ title, kicker, caption = "ethnikatour.com" }: { title: string; kicker?: string; caption?: string }) {
  const [logo, symbol, mono] = await Promise.all([
    publicDataUrl("/brand/logo-horizontal-inverse.svg", "image/svg+xml"),
    publicDataUrl("/brand/symbole-or.svg", "image/svg+xml"),
    readFile(join(process.cwd(), "node_modules/@fontsource/dm-mono/files/dm-mono-latin-ext-500-normal.woff")),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: color.night }}>
        <div style={{ width: 18, height: "100%", display: "flex", backgroundColor: color.red }} />
        {/* eslint-disable-next-line @next/next/no-img-element -- rendu Satori, pas de next/image */}
        <img src={symbol} alt="" width={520} height={520} style={{ position: "absolute", right: -90, top: 55, opacity: 0.16 }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "60px 72px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendu Satori, pas de next/image */}
          <img src={logo} alt="" width={285} height={90} />
          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 940 }}>
            {kicker && <span style={{ fontFamily: "DM Mono", color: color.gold, fontSize: 26, letterSpacing: 3, textTransform: "uppercase" }}>{kicker}</span>}
            <span style={{ color: color.cream, fontSize: title.length > 48 ? 60 : 76, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>{title}</span>
          </div>
          <span style={{ fontFamily: "DM Mono", color: color.muted, fontSize: 22 }}>{caption}</span>
        </div>
      </div>
    ),
    { ...ogSize, fonts: [{ name: "DM Mono", data: mono, weight: 500, style: "normal" }] },
  );
}

/** Image OG d'une page du registre (titre et accroche traduits, photo de bannière). */
export async function pageOg(key: PageKey, locale: Locale) {
  const page = await getPage(key, locale);
  const t = await getTranslations({ locale, namespace: "site" });
  return renderOg({ title: page.heading, kicker: key === "home" ? t("tagline") : page.kicker || site.name });
}

/** Raccourci pour un fichier `opengraph-image.tsx` de page : `export default ogFor("faq");` */
export function ogFor(key: PageKey) {
  return async function Image({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return pageOg(key, locale as Locale);
  };
}
