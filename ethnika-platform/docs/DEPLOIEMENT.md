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
