# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Projet : site et plateforme de l'agence **ETHNIKA** (ethnikatour.com, Conakry).
Le prompt complet et la feuille de route par lots sont dans `docs/PROMPT_CLAUDE_CODE.md`.

> La racine du dépôt est `ethnika-platform/ethnika-platform/` (dossier imbriqué). Toutes les commandes s'y lancent.

## Commandes
- `pnpm install` : installe les dépendances. pnpm 10 (via `corepack enable`) et Node ≥ 22 (`.nvmrc`) sont requis.
- `cp apps/web/.env.example apps/web/.env.local` : configuration locale. Les variables sont validées au démarrage par `src/lib/env.ts`.
- `pnpm dev` : lance le site sur http://localhost:3000.
- `pnpm check` : lint + typecheck + tests unitaires + build. **Doit passer avant chaque livraison.** La CI (`.github/workflows/ci.yml`) lance lint, typecheck, build et `pnpm audit --prod --audit-level high`, mais pas encore les tests.
- `pnpm audit:deps` : audit des dépendances de production.
- Ciblage d'un paquet : `pnpm --filter @ethnika/web <script>` (`lint`, `typecheck`, `build`, `start`).
- **Tests unitaires** (Vitest + Testing Library, jsdom) : `pnpm test`. Fichiers `src/**/*.test.{ts,tsx}` à côté du code. Un seul fichier : `pnpm --filter @ethnika/web exec vitest run src/components/ui/Tabs.test.tsx` ; un seul test : ajouter `-t "nom du test"`. `<dialog>` est simulé dans `vitest.setup.ts`.
- **Tests navigateur** (Playwright + `@axe-core/playwright`, dossier `apps/web/e2e/`) : `pnpm test:e2e`. Ils utilisent le Chrome installé (`channel: "chrome"`, aucun navigateur à télécharger) et réutilisent `pnpm dev` sur le port 3000. Deux projets : `desktop` (1440 px) et `mobile` (390 px). Filtrer : `pnpm --filter @ethnika/web exec playwright test -g "modale" --project=mobile`. Les captures de référence sont écrites dans `apps/web/test-results/`.

## Architecture
- **Monorepo pnpm** : `apps/web` (Next.js 16, App Router, React 19, Tailwind v4, Zod 4) est actif. `apps/api` (NestJS + Prisma + PostgreSQL + BullMQ) et `packages/shared` (schémas Zod partagés) sont prévus en phase 2 et volontairement vides.
- **Phase 1 = site « sur demande »** : aucune réservation en ligne. Formulaire → Server Action → back-end → agent. Le navigateur ne parle jamais à l'API : seul le serveur Next l'appelle.
- **Flux d'un lead** : `LeadForm` (client) → `src/app/contact/actions.ts` (`sendLead` : rate-limit → Zod `src/lib/schemas/lead.ts` → pot de miel → envoi) → `src/lib/leads.ts` (`submitLead`).
  - Sans `API_BASE_URL`, `submitLead` journalise un résumé sans données personnelles et renvoie `ETH-DEV-…`.
  - Avec `API_BASE_URL`, il fait un `POST /v1/leads` avec `X-Internal-Key`, un timeout et `redirect: "error"`.
- **Registre des pages** : `src/content/pages.ts`. Chaque route y a une entrée : maquette, SEO, bannière, `headerVariant`, `status`. Une page non intégrée vaut `export const metadata = pageMetadata("clé")` + `<TodoPage pageKey="clé" />`. L'intégrer, c'est remplacer `TodoPage` par le contenu de la maquette, passer `status: "done"` et mettre à jour `docs/PAGES.md`.
- **Routes dynamiques** (`circuits/[slug]`, `blog/[slug]`) : `generateStaticParams` + `dynamicParams = false`. Les données sont provisoires et en ligne, à déplacer vers `src/content/*.ts`.
- **Layout racine** (`src/app/layout.tsx`) : polices `@fontsource` auto-hébergées, JSON-LD `TravelAgency`, `SiteHeader`, `SiteFooter`, `WhatsAppFab`, lien d'évitement vers `#contenu`.
- **Sécurité transverse** : CSP et en-têtes dans `next.config.ts`. Tout domaine tiers doit y être ajouté explicitement. Une CSP à nonce passerait par `src/proxy.ts` (Next 16, ex-`middleware.ts`), voir `docs/SECURITY.md` § 4. Le rate-limit de `src/lib/security/rate-limit.ts` est en mémoire, donc inadapté au multi-instances.
- **Maquettes** (`design/maquettes/*.dc.html`) : HTML à styles inline. `<sc-for>`, `<sc-if>` et la classe `DCLogic` du `<script>` final décrivent les boucles, les conditions et l'état interactif. Les chemins d'images correspondent déjà à `apps/web/public`. La correspondance route ↔ maquette est dans `docs/PAGES.md`. `Composants.dc.html` = tokens, déjà traduits dans `@theme` de `src/app/globals.css`. `HomeMobile.dc.html` = référence 390 px.

## Où est quoi
- Tokens : `apps/web/src/app/globals.css` (`@theme`).
- Configuration éditoriale et placeholders `[…]` : `apps/web/src/lib/site.ts`.
- Kit UI : `src/components/ui/` (champs dans `Field.tsx`, interactifs en `"use client"` : `Tabs`, `Accordion`, `Modal`, `Counter`) et `src/components/cards/`. Vitrine : `/kit` (dev uniquement, 404 en production). Un dossier `_kit` serait privé dans l'App Router.
- Composants de référence à imiter : `SiteHeader`, `SiteFooter`, `PageHero`, `Button`, `Icon`, `LeadForm`.
- `design/brand` : pack logo HD complet.
- `docs/` : prompt, sécurité, architecture, pages, Amadeus et tests.

## Règles
1. **Sécurité d'abord** : appliquer `docs/SECURITY.md`. Chaque Server Action ou Route Handler suit le patron de `src/app/contact/actions.ts`, dans l'ordre : rate-limit → Zod → pot de miel / Turnstile → logique → réponse générique.
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
10. Code et identifiants en anglais, textes d'interface en français. Messages de commit au format Conventional Commits.
