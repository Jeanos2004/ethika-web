# Déploiement du site (`apps/web`)

> Rien n'est déployé automatiquement. Ce document décrit les deux options de `docs/ARCHITECTURE.md` (§ Hébergement) ; le choix reste à valider par l'agence.

## Variables d'environnement

| Variable | Moment | Obligatoire | Rôle |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **build** | oui | URL publique sans slash final (`https://ethnikatour.com`). Sert aux URL canoniques, au sitemap, à hreflang et aux images OG. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | **build** | oui | Numéro international sans « + » ni espaces. Placeholder tant que l'agence ne l'a pas fourni. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **build** | non | Clé publique Cloudflare Turnstile. |
| `API_BASE_URL` | exécution | non (phase 1) | URL de l'API NestJS. Vide = demandes validées puis journalisées sans données personnelles. |
| `API_INTERNAL_KEY` | exécution | si `API_BASE_URL` | Secret partagé web → API, 32 caractères minimum (`openssl rand -hex 32`). |
| `TURNSTILE_SECRET_KEY` | exécution | non | Secret Turnstile. |

Les variables `NEXT_PUBLIC_*` sont **figées dans le JavaScript au moment du build** : les changer impose de reconstruire. Les secrets ne doivent jamais être préfixés par `NEXT_PUBLIC_` (voir `docs/SECURITY.md`). Toute configuration invalide fait échouer le démarrage (`src/lib/env.ts`).

## Option A : Vercel (simple)

1. Importer le dépôt et choisir **Root Directory** `apps/web`. Vercel détecte pnpm et Next.js, sans fichier de configuration.
2. Région de calcul : `cdg1` (Paris), la plus proche de Conakry.
3. Renseigner les variables ci-dessus dans *Settings → Environment Variables* (Production et Preview).
4. Domaine : `ethnikatour.com` + redirection `www` → apex.

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
- **CI** : `.github/workflows/ci.yml` lance lint, typecheck, build et audit, mais ni `pnpm test` ni `pnpm test:e2e`. Ajout proposé, non appliqué (la CI n'est pas modifiée sans demande).
