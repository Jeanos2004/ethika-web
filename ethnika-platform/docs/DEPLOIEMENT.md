# Déploiement du site (`apps/web`)

> Rien n'est déployé automatiquement. Ce document décrit les deux options de `docs/ARCHITECTURE.md` (§ Hébergement) ; le choix reste à valider par l'agence.

## Variables d'environnement

| Variable | Moment | Obligatoire | Rôle |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **build** | oui | URL publique sans slash final (`https://ethnikatour.com`). Sert aux URL canoniques, au sitemap, à hreflang et aux images OG. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | **build** | oui | Numéro international sans « + » ni espaces. Placeholder tant que l'agence ne l'a pas fourni. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **build** | non | Clé publique Cloudflare Turnstile. |
| `NEXT_PUBLIC_DEMO_MODE` | **build** | non | `1` = site de démonstration : bandeau, site non indexé, demandes gardées dans le navigateur, back-office de démo sur `/admin`. À laisser vide en production réelle. |
| `API_BASE_URL` | exécution | non (phase 1) | URL de l'API NestJS. Vide = demandes validées puis journalisées sans données personnelles. |
| `API_INTERNAL_KEY` | exécution | si `API_BASE_URL` | Secret partagé web → API, 32 caractères minimum (`openssl rand -hex 32`). |
| `TURNSTILE_SECRET_KEY` | exécution | non | Secret Turnstile. |

Les variables `NEXT_PUBLIC_*` sont **figées dans le JavaScript au moment du build** : les changer impose de reconstruire. Les secrets ne doivent jamais être préfixés par `NEXT_PUBLIC_` (voir `docs/SECURITY.md`). Toute configuration invalide fait échouer le démarrage (`src/lib/env.ts`).

## Option A : Vercel (simple)

1. Importer le dépôt et choisir **Root Directory** `ethnika-platform/apps/web` (le projet est dans le sous-dossier `ethnika-platform/` du dépôt). Vercel détecte pnpm et Next.js, sans fichier de configuration.
2. Région de calcul : `cdg1` (Paris), la plus proche de Conakry.
3. Renseigner les variables ci-dessus dans *Settings → Environment Variables* (Production et Preview). `NEXT_PUBLIC_SITE_URL` est facultative sur Vercel : à défaut, le domaine de production Vercel est utilisé.
4. Domaine : `ethnikatour.com` + redirection `www` → apex.

### Démo pour la propriétaire (sans back-end)
- Variables : `NEXT_PUBLIC_DEMO_MODE=1`, `NEXT_PUBLIC_WHATSAPP_NUMBER=<numéro>` ; rien d'autre (pas d'`API_BASE_URL`).
- Parcours : envoyer une demande depuis le site → page /merci avec la référence → « Voir ma demande dans le back-office » → `/admin/demandes` (statuts, aperçu de l'e-mail, export CSV, saisie manuelle). Le tableau de bord `/admin` explique le parcours.
- Les demandes restent dans le navigateur de la personne qui teste (rien n'est transmis) ; « Réinitialiser la démo » remet les exemples.

## Option B : Docker sur un VPS derrière Cloudflare (maîtrisée)

Image multi-étapes `apps/web/Dockerfile` : sortie Next « standalone », Node 22 Alpine, utilisateur non-root, healthcheck.

```bash
# Depuis la racine du dépôt
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_SITE_URL=https://ethnikatour.com \
  --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER=224XXXXXXXXX \
  -t ethnika-web .

# Secrets serveur au démarrage, jamais dans l'image
docker run -d --name ethnika-web --restart unless-stopped \
  -p 127.0.0.1:3000:3000 --env-file /etc/ethnika/web.env ethnika-web
```

- Un reverse proxy (Caddy ou Nginx) termine TLS et transmet à `127.0.0.1:3000`. Cloudflare en mode « Full (strict) ».
- Le port 3000 n'est **jamais** exposé publiquement : le serveur fait confiance aux en-têtes `cf-connecting-ip`, `x-real-ip` et `x-forwarded-for` pour la limitation de débit (`src/lib/security/client-ip.ts`). Le reverse proxy doit écraser ces en-têtes ; sinon un client pourrait choisir son adresse et contourner la limite.
- En local, `NEXT_OUTPUT=standalone pnpm build` reproduit la sortie de l'image.

## Points d'attention

- **Une seule instance** tant que la limitation de débit est en mémoire (`src/lib/security/rate-limit.ts`). Pour plusieurs instances ou du serverless (Vercel), passer à un stockage partagé (Upstash Redis) avant d'ouvrir les formulaires au public.
- **CSP** : tout nouveau domaine tiers (analytics, cartes, CDN) s'ajoute explicitement dans `next.config.ts`.
- **Images OG** : générées au build pour chaque page et chaque langue (`opengraph-image.tsx`, `src/lib/og.tsx`), environ 60 Ko chacune, donc compatibles avec les aperçus WhatsApp.
- **Avant la mise en ligne** : remplacer les placeholders `[…]` (téléphone, WhatsApp, adresse, horaires, licence, RCCM, prix), faire valider les textes légaux par un juriste, renseigner `NEXT_PUBLIC_SITE_URL`, vérifier `robots.txt` et `sitemap.xml`, et déclarer le site dans Google Search Console.
- **CI** : `.github/workflows/ci.yml` (à la racine du dépôt) lance lint, typecheck, tests unitaires, build et audit. Les tests navigateur se lancent en local (`pnpm test:e2e`, ou `E2E_BASE_URL=… pnpm test:e2e` contre un build).

## API (`apps/api`) sur VPS

Le site reste sur Vercel ; l'API, sa base et le reverse proxy HTTPS tournent sur le VPS avec Docker Compose (`deploy/`).

### Mise en route (une fois)
1. VPS Linux avec Docker ; DNS : `api.ethnikatour.com` (A/AAAA) → IP du VPS ; pare-feu : 22, 80, 443 seulement.
2. Copier le dépôt sur le VPS, puis préparer les secrets (fichiers ignorés par git) :
   ```bash
   cp deploy/postgres.env.example deploy/postgres.env   # POSTGRES_PASSWORD : openssl rand -hex 24
   cp deploy/api.env.example deploy/api.env             # DATABASE_URL (même mot de passe), INTERNAL_API_KEY, DATA_ENCRYPTION_KEY…
   chmod 600 deploy/*.env
   ```
   Sauvegarder `DATA_ENCRYPTION_KEY` **hors du serveur** : sans elle, les 2FA sont à reconfigurer.
3. Adapter le domaine dans `deploy/Caddyfile`, puis démarrer :
   ```bash
   docker compose -f deploy/docker-compose.prod.yml up -d --build
   docker compose -f deploy/docker-compose.prod.yml exec api node dist/cli/create-admin.js admin@ethnikatour.com "Prénom Nom"
   ```
   Les migrations Prisma s'appliquent à chaque démarrage. Caddy obtient et renouvelle seul les certificats Let's Encrypt.
4. Sauvegardes chiffrées chaque nuit (`deploy/backup.sh`, cron décrit dans le script) ; **tester une restauration** avant la mise en ligne.

### Sécurité de la pile
- PostgreSQL sur un réseau Docker interne, sans port publié.
- API en utilisateur non privilégié, système de fichiers en lecture seule (`/tmp` en mémoire), `no-new-privileges`.
- Caddy : TLS, HSTS, corps de requête limités à 256 Ko, en-tête `Server` retiré.
- Image : environ 1,9 Go (Chromium pour les PDF + CLI Prisma pour les migrations) ; testée en lecture seule, PDF compris.

### Brancher le site
Sur Vercel : `API_BASE_URL=https://api.ethnikatour.com`, `API_INTERNAL_KEY=<INTERNAL_API_KEY>`, puis **retirer** `NEXT_PUBLIC_DEMO_MODE` et redéployer. Dès lors :
- les formulaires du site (demandes, newsletter) écrivent en base ; les liens des e-mails pointent vers `/newsletter/confirmer` et `/newsletter/desinscription` ;
- `/admin` est le back-office réel : connexion (`/admin/connexion`), 2FA, demandes (liste, fiche, statut, attribution, notes, PDF, devis, export CSV, saisie d'une demande reçue par téléphone), vols (recherche, option, suivi), et pour les administrateurs : circuits, offres, utilisateurs, journal d'audit ;
- les pages Circuits, Offres et l'accueil lisent les contenus **publiés** depuis le back-office (cache 60 s). Tant que rien n'est publié, le site garde ses contenus actuels.

Première connexion :
1. Créer le premier administrateur (commande `create-admin` ci-dessus) ; il choisit son mot de passe et active la 2FA à la première connexion.
2. Dans **Circuits** puis **Offres**, cliquer sur « Importer » pour reprendre les contenus actuels du site avant toute publication : dès qu'un élément est publié, le site n'affiche plus que les contenus publiés.
3. Créer les comptes des agents dans **Utilisateurs** (mot de passe temporaire affiché une fois, à transmettre de vive voix).
4. Renseigner **Paramètres > Agence** (adresse, téléphone, horaires, position sur la carte, licence, modalités de règlement) : elles remplacent les coordonnées fictives sur le site public et sur les PDF.
5. E-mails : créer un compte Resend, vérifier le domaine de `MAIL_FROM` (SPF/DKIM), puis renseigner `RESEND_API_KEY` dans `deploy/api.env` et redémarrer l'API. Paramètres > Système affiche le service d'envoi actif.
5. Paiements : `PAYMENT_PROVIDER=none` tant que le prestataire n'est pas choisi (liens désactivés, `mock` est refusé en production). Le brancher = un adaptateur dans `apps/api/src/modules/payments` (voir README de l'API).

Limite connue : sur Vercel (serverless), la limitation de débit du site est par instance ; celle de l'API (VPS, instance unique) reste exacte.
