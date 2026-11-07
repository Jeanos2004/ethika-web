# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Projet : site et plateforme de l'agence **ETHNIKA** (ethnikatour.com, Conakry).
Le prompt complet et la feuille de route par lots sont dans `docs/PROMPT_CLAUDE_CODE.md`.

> La racine du dépôt est `ethnika-platform/ethnika-platform/` (dossier imbriqué). Toutes les commandes s'y lancent.

## Commandes
- `pnpm install` : installe les dépendances. pnpm 10 (via `corepack enable`) et Node ≥ 22 (`.nvmrc`) sont requis.
- `cp apps/web/.env.example apps/web/.env.local` : configuration locale. Les variables sont validées au démarrage par `src/lib/env.ts`.
- `pnpm dev` : lance le site sur http://localhost:3000.
- `pnpm check` : lint + typecheck + tests unitaires + build. **Doit passer avant chaque livraison.** La CI (`.github/workflows/ci.yml` **à la racine du dépôt git**, un niveau au-dessus de ce dossier) lance lint, typecheck, tests unitaires, build et `pnpm audit --prod --audit-level high`.
- `pnpm audit:deps` : audit des dépendances de production.
- Formatage : Prettier, `printWidth` 200 (`.prettierrc.json`), pour rester aligné sur le code existant.
- Ciblage d'un paquet : `pnpm --filter @ethnika/web <script>` (`lint`, `typecheck`, `build`, `start`).
- **Tests unitaires** (Vitest + Testing Library, jsdom) : `pnpm test`. Fichiers `src/**/*.test.{ts,tsx}` à côté du code. Un seul fichier : `pnpm --filter @ethnika/web exec vitest run src/components/ui/Tabs.test.tsx` ; un seul test : ajouter `-t "nom du test"`. `<dialog>` est simulé dans `vitest.setup.ts`.
- **Tests navigateur** (Playwright + `@axe-core/playwright`, dossier `apps/web/e2e/`) : `pnpm test:e2e`. Ils utilisent le Chrome installé (`channel: "chrome"`, aucun navigateur à télécharger) et réutilisent `pnpm dev` sur le port 3000. Deux projets : `desktop` (1440 px) et `mobile` (390 px). Filtrer : `pnpm --filter @ethnika/web exec playwright test -g "modale" --project=mobile`. Les captures de référence (1440 et 390 px, FR et échantillon EN) sont écrites dans `apps/web/captures/`. Chaque parcours se présente avec sa propre IP (`x-real-ip`, plage TEST-NET-2) pour ne pas cumuler la limite de débit (5 demandes / 10 min) d'une exécution à l'autre.
- **Audit** : Lighthouse se lance sur un build de production (`pnpm build && pnpm --filter @ethnika/web start -p 3006`), pas sur `pnpm dev`. En local HTTP, l'erreur console `ERR_SSL_PROTOCOL_ERROR` vient de `upgrade-insecure-requests` et n'existe pas en production.

## Architecture
- **Monorepo pnpm** : `apps/web` (Next.js 16, App Router, React 19, Tailwind v4, Zod 4) est actif. `apps/api` (NestJS + Prisma + PostgreSQL + BullMQ) et `packages/shared` (schémas Zod partagés) sont prévus en phase 2 et volontairement vides.
- **Phase 1 = site « sur demande »** : aucune réservation en ligne. Formulaire → Server Action → back-end → agent. Le navigateur ne parle jamais à l'API : seul le serveur Next l'appelle.
- **Flux d'un lead** : formulaires (`LeadFormShell` + `LeadForm`, `CircuitQuote`, `FlightRequest`, `ProRequestForm`) → `src/lib/actions/lead.ts` (`sendLead` : rate-limit → Zod `src/lib/schemas/lead.ts` → pot de miel → envoi ; `after=merci` redirige vers `/merci?ref=…` par liste blanche) → `src/lib/leads.ts` (`submitLead`). Newsletter : `src/lib/actions/newsletter.ts`. Les erreurs renvoyées sont des **clés** (espace `errors`), traduites à l'affichage.
  - Sans `API_BASE_URL`, `submitLead` journalise un résumé sans données personnelles et renvoie une référence provisoire `ETH-XXXXXX`.
  - Avec `API_BASE_URL`, il fait un `POST /v1/leads` avec `X-Internal-Key`, un timeout et `redirect: "error"`.
- **i18n (next-intl)** : `src/i18n/routing.ts` (`fr` par défaut sans préfixe, `en` sous `/en`, pas de détection navigateur, `alternateLinks: false`), `src/proxy.ts` (attention : le `matcher` est une chaîne TS, l'échappement d'un point s'écrit `\\.`, sinon le proxy ne s'applique à aucune route). Toutes les routes vivent sous `src/app/[locale]/` ; chaque page appelle `setRequestLocale(locale)`. Textes d'interface : `messages/{fr,en}.json`, un espace de noms par page ou composant, mêmes clés dans les deux langues. Contenus structurés : `src/content/*.ts` avec une couche anglaise (`*.en.ts` fusionnée par `localize()`, ou `getX(locale)`). Liens : `Link`/`redirect` de `@/i18n/navigation` (jamais `next/link`). Le layout ne transmet au client que les espaces listés dans `clientNamespaces` (`src/app/[locale]/layout.tsx`) : un nouveau composant client qui lit un autre espace doit l'y ajouter.
- **Registre des pages** : `src/content/pages.ts` — structure (chemin, maquette, image, `headerVariant`, `status`) ; titres et descriptions dans `messages` (`meta.<clé>`). Une page : `export const generateMetadata = metadataFor("clé")` (canonique + hreflang) et `getPage("clé", locale)`. Images OG : un `opengraph-image.tsx` par route (`ogFor("clé")`, `src/lib/og.tsx`), statiques, sans photo pour rester légères (aperçus WhatsApp).
- **Routes dynamiques** (`circuits/[slug]`, `blog/[slug]`) : `generateStaticParams` (le paramètre propre seulement, la langue vient de `[locale]`) + `dynamicParams = false`. Données : `src/content/circuits.ts` (+ `.en.ts`), `src/content/blog.ts` (métadonnées validées par Zod) et corps d'articles en MDX (`src/content/blog/<slug>.mdx`, français uniquement, composants contrôlés dans `src/mdx-components.tsx`). Article en anglais : mention « French only » et `noindex`.
- **Layout** (`src/app/[locale]/layout.tsx`, pas de layout racine) : `<html lang>`, polices `@fontsource` auto-hébergées, JSON-LD `TravelAgency`, `SiteHeader`, `SiteFooter`, `WhatsAppFab`, `MobileActionBar`, `CookieBanner`, lien d'évitement vers `#contenu`. `sitemap.ts`, `robots.ts` et `manifest.ts` restent à la racine de `src/app`.
- **Mode démo** (`NEXT_PUBLIC_DEMO_MODE=1`, `src/lib/demo/`) : bandeau, noindex, demandes capturées à l'envoi (`LeadFormShell`) et gardées dans le localStorage, back-office de démo `src/app/admin/` (layout racine séparé, français, hors i18n : exclu du `matcher` du proxy, liens en `next/link`). Hors démo, `/admin` renvoie 404 jusqu'à l'authentification de la phase 2.
- **Déploiement** : `docs/DEPLOIEMENT.md` (Vercel ou Docker `apps/web/Dockerfile`, sortie standalone via `NEXT_OUTPUT=standalone`).
- **Sécurité transverse** : CSP et en-têtes dans `next.config.ts`. Tout domaine tiers doit y être ajouté explicitement. Une CSP à nonce passerait par `src/proxy.ts` (Next 16, ex-`middleware.ts`), voir `docs/SECURITY.md` § 4. Le rate-limit de `src/lib/security/rate-limit.ts` est en mémoire, donc inadapté au multi-instances.
- **Maquettes** (`design/maquettes/*.dc.html`) : HTML à styles inline. `<sc-for>`, `<sc-if>` et la classe `DCLogic` du `<script>` final décrivent les boucles, les conditions et l'état interactif. Les chemins d'images correspondent déjà à `apps/web/public`. La correspondance route ↔ maquette est dans `docs/PAGES.md`. `Composants.dc.html` = tokens, déjà traduits dans `@theme` de `src/app/globals.css`. `HomeMobile.dc.html` = référence 390 px.

## Où est quoi
- Tokens : `apps/web/src/app/globals.css` (`@theme`).
- Configuration éditoriale et placeholders `[…]` : `apps/web/src/lib/site.ts`.
- Kit UI : `src/components/ui/` (champs dans `Field.tsx`, interactifs en `"use client"` : `Tabs`, `Accordion`, `Modal`, `Counter`) et `src/components/cards/`. Vitrine : `/kit` (dev uniquement, 404 en production). Un dossier `_kit` serait privé dans l'App Router. Tests de composants qui utilisent `useTranslations` : `renderWithIntl` de `src/test/render.tsx`.
- Composants de référence à imiter : `SiteHeader`, `SiteFooter`, `PageHero`, `Button`, `Icon`, `LeadForm`.
- `design/brand` : pack logo HD complet.
- `docs/` : prompt, sécurité, architecture, pages, déploiement, Amadeus et tests.

## Règles
1. **Sécurité d'abord** : appliquer `docs/SECURITY.md`. Chaque Server Action ou Route Handler suit le patron de `src/lib/actions/lead.ts`, dans l'ordre : rate-limit → Zod → pot de miel / Turnstile → logique → réponse générique.
2. **Secrets** :
   - uniquement via `src/lib/env.ts` ;
   - jamais en `NEXT_PUBLIC_` ;
   - jamais committés (`.env*` est ignoré) ;
   - `import "server-only"` dans les modules qui les lisent.
3. **Interdits** :
   - `dangerouslySetInnerHTML` (sauf JSON-LD statique échappé) ;
   - `eval` ;
   - `any`, `@ts-ignore`, `console.log` (ESLint tolère `console.info`, `console.warn` et `console.error`) ;
   - hex en dur dans les composants (utiliser les tokens) ; gris `faint` interdit pour du texte sur fond clair (contraste < 4,5:1), utiliser `subtle` ;
   - nouvelle dépendance non justifiée ;
   - données personnelles dans les logs.
4. **Fidélité** : reproduire la maquette de référence de chaque page. Placeholders `[…]` conservés, jamais de prix ni de numéro inventé.
5. **Server Components par défaut**. `"use client"` au plus bas niveau, seulement pour l'interactivité.
6. **Accessibilité WCAG 2.2 AA** :
   - navigation clavier complète ;
   - ARIA correct sur onglets, accordéons et modales ;
   - un seul `h1` par page.
7. **Ne jamais dire « terminé » sans** :
   - `pnpm check` vert ;
   - tests du lot verts ;
   - captures 1440 px et 390 px comparées à la maquette.
8. Après chaque page intégrée :
   - `status: "done"` dans `src/content/pages.ts` ;
   - mise à jour de `docs/PAGES.md`.
9. Ne pas pousser, ne pas déployer, ne pas modifier la CI sans demande explicite.
10. Code et identifiants en anglais, textes d'interface dans `messages/fr.json` et `messages/en.json` (jamais en dur dans les composants). Messages de commit au format Conventional Commits.
