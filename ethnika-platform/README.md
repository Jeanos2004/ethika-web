# ETHNIKA — plateforme web

Site et plateforme de l'agence de tourisme et de voyage **ETHNIKA** (ethnikatour.com, Conakry).

## Démarrer
```bash
corepack enable                 # active pnpm (Node ≥ 22)
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev                        # http://localhost:3000
pnpm check                      # lint + typecheck + build
```

## Contenu du kit
- `apps/web` : Next.js 16 + Tailwind v4, prêt à coder.
  - Tokens de la charte, polices auto-hébergées.
  - En-tête, pied de page, bouton WhatsApp.
  - Toutes les routes avec leur SEO.
  - Accueil (début), Contact (formulaire sécurisé complet) et 404 intégrés.
  - En-têtes de sécurité et CSP.
- `apps/web/public` : logos (SVG), icônes et favicons, 25 photos d'illustration (Pixabay).
- `design/maquettes` : les 25 maquettes validées (référence d'intégration).
- `design/brand/ETHNIKA_Logo_Pack_HD.zip` : pack logo complet (SVG, PDF, PNG 4000 px, déclinaisons).
- `docs/` :
  - `PROMPT_CLAUDE_CODE.md` : prompt maître et feuille de route par lots ;
  - `SECURITY.md` ;
  - `ARCHITECTURE.md` ;
  - `PAGES.md` ;
  - `AMADEUS_ET_TESTS.md`.

## Travailler avec Claude Code
1. Ouvrir Claude Code à la racine du dépôt (`CLAUDE.md` est chargé automatiquement).
2. Coller le bloc « PROMPT » de `docs/PROMPT_CLAUDE_CODE.md`.
3. Avancer lot par lot (« Lot 1 », « Lot 2 »…) et valider chaque livraison.

## Placeholders à fournir par le client
Numéro de téléphone et WhatsApp, horaires, adresse, n° de licence, RCCM, prix, dates de départ,
photos réelles de l'agence, textes légaux validés par un juriste.
