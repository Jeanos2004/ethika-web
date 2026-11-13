import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 * - Polices auto-hébergées (@fontsource) : aucun appel à Google Fonts.
 * - Cloudflare Turnstile autorisé (anti-spam des formulaires).
 * - 'unsafe-inline' sur script-src est requis par Next sans nonce. Passage à une CSP
 *   à nonce via src/proxy.ts documenté dans docs/SECURITY.md (§ CSP stricte).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' https://challenges.cloudflare.com${isDev ? " ws: wss:" : ""}`,
  "frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.openstreetmap.org",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/** Sortie autonome pour l'image Docker (NEXT_OUTPUT=standalone, voir docs/DEPLOIEMENT.md). Vercel n'en a pas besoin. */
const standalone = process.env.NEXT_OUTPUT === "standalone";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Développement uniquement : test sur téléphone via un tunnel ngrok (sans effet sur le build de production).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app"],
  ...(standalone && {
    output: "standalone" as const,
    // Monorepo pnpm : tracer les dépendances depuis la racine du dépôt.
    outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
    // Fichiers lus à l'exécution par les images OG (src/lib/og.tsx).
    outputFileTracingIncludes: {
      "/**/opengraph-image": ["./public/brand/**", "./node_modules/@fontsource/dm-mono/files/dm-mono-latin-ext-500-normal.woff"],
      // Reprise des articles MDX dans le back-office (lecture des fichiers à l'exécution).
      "/admin/blog": ["./src/content/blog/**"],
    },
  }),
  poweredByHeader: false,
  experimental: {
    // CSS (≈ 16 Ko) intégré au HTML : une requête bloquante de moins, précieux avec la latence Conakry ↔ Europe.
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // 75 par défaut, 90 pour les grandes photos plein écran (accueil, en-têtes, visionneuse). Tailles jusqu'à 3840 px (écrans 4K).
    qualities: [75, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2560, 3840],
    // Ajouter ici les domaines distants (CMS, CDN) au cas par cas — jamais de joker.
    remotePatterns: [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

/** Articles du blog en MDX local (src/content/blog), rendus par des composants contrôlés (src/mdx-components.tsx). */
const withMDX = createMDX({});

/** Traductions FR / EN (src/i18n/request.ts, messages/*.json). */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(withMDX(nextConfig));
