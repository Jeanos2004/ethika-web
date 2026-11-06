# Sécurité — ETHNIKA

Référentiel : **OWASP ASVS 4 niveau 2** et OWASP Top 10. Le site traite des données personnelles : identité,
téléphone, e-mail et, pour la billetterie, informations de passeport.

## 1. Déjà en place dans le kit
| Mesure | Où |
|---|---|
| En-têtes : CSP, HSTS (preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP | `apps/web/next.config.ts` |
| `poweredByHeader: false` | `next.config.ts` |
| Polices auto-hébergées (pas de fuite vers Google, CSP `font-src 'self'`) | `layout.tsx` |
| Variables d'environnement validées au démarrage, `server-only` | `src/lib/env.ts` |
| Patron de formulaire : rate-limit → Zod → pot de miel → envoi → réponse générique | `src/app/contact/actions.ts` |
| Logs sans données personnelles (référence et type seulement) | `src/lib/leads.ts` |
| Appel API sortant : timeout, `redirect: "error"`, `no-store`, clé interne | `src/lib/leads.ts` |
| Routes dynamiques fermées (`dynamicParams = false`) | `circuits/[slug]`, `blog/[slug]` |
| ESLint : `react/no-danger` en erreur | `eslint.config.mjs` |
| Scripts d'installation des dépendances bloqués par défaut (pnpm `onlyBuiltDependencies`) | `pnpm-workspace.yaml` |
| CI : lint, typecheck, build, audit ; Dependabot | `.github/` |

## 2. Règles de développement
- **Entrées** :
  - validation Zod côté serveur sur tout ce qui vient de l'extérieur, y compris `searchParams` et les réponses d'API tierces ;
  - longueurs maximales partout ;
  - listes blanches plutôt que listes noires.
- **Server Actions** :
  - ce sont des endpoints publics : ne jamais se fier à un champ caché ;
  - vérifier droits et rôle **dans** l'action ;
  - Next vérifie l'origine (protection CSRF). Ne pas ajouter de domaines dans `serverActions.allowedOrigins` sans raison.
- **Sortie** :
  - React échappe le texte ;
  - le contenu riche (blog) passe par MDX et des composants contrôlés, jamais par du HTML brut ;
  - les liens issus de données passent par une liste blanche de schémas (`http`, `https`, `mailto`, `tel`).
- **Redirections** : uniquement vers des chemins internes (`/…`), jamais vers une URL fournie par l'utilisateur.
- **Fichiers téléversés** (plus tard, passeports) :
  - taille maximale ;
  - type vérifié par signature, pas par extension ;
  - stockage privé (bucket non public) et URL signées à courte durée ;
  - jamais servis depuis `/public`.
- **Export CSV** (back-office) : neutraliser les cellules commençant par `= + - @` (injection de formules).
- **Erreurs** : message générique côté client, détail côté serveur sans données personnelles.
- **Dépendances** :
  - versions exactes ;
  - `pnpm audit` à chaque PR ;
  - revue avant toute nouvelle dépendance (popularité, maintenance, typosquatting).

## 3. Anti-spam et abus
- Pot de miel : fait.
- **Cloudflare Turnstile** à brancher avant la mise en ligne :
  - clés dans `.env` ;
  - vérification serveur `https://challenges.cloudflare.com/turnstile/v0/siteverify` ;
  - domaine déjà autorisé dans la CSP.
- Le rate-limit en mémoire ne tient pas en serverless ni en multi-instances. En production, utiliser Redis
  (Upstash ou équivalent) avec clé `ip + type`, et des limites par formulaire.

## 4. CSP stricte (étape recommandée avant mise en ligne)
La CSP actuelle autorise `'unsafe-inline'` pour les scripts : Next en a besoin sans nonce.
Pour la durcir :
1. Créer `src/proxy.ts` (Next 16, ex-`middleware.ts`) qui génère un nonce par requête.
2. Émettre `script-src 'self' 'nonce-…' 'strict-dynamic'`.
3. Retirer la CSP de `next.config.ts`.

Conséquence : les pages deviennent dynamiques, avec un coût en cache et en performance.
Alternative : rester sur la CSP actuelle et ajouter `report-to` pour surveiller les violations.
**Décision à prendre avec l'hébergement.**

## 5. Back-end (phase 2) — exigences
- **Authentification back-office** :
  - argon2id ;
  - session en cookie `HttpOnly`, `Secure`, `SameSite=Strict` ;
  - 2FA TOTP pour les administrateurs ;
  - verrouillage progressif ;
  - pas de JWT dans `localStorage`.
- **Autorisation** : RBAC vérifié côté API à chaque requête. Pas d'IDOR : toujours filtrer par droits.
- **API** :
  - `helmet` ;
  - CORS en liste blanche ;
  - `ValidationPipe` avec `whitelist` et `forbidNonWhitelisted` ;
  - pagination bornée ;
  - clé interne comparée à temps constant.
- **Données** :
  - TLS partout ;
  - chiffrement au repos (disque et sauvegardes) ;
  - champs sensibles (n° de passeport) chiffrés au niveau applicatif ;
  - durées de conservation définies et purge automatique.
- **Journal d'audit** : connexions, changements de statut, exports.
- **Secrets** : gestionnaire de secrets de l'hébergeur, rotation, aucun secret dans les images Docker.
- **Fournisseurs GDS et paiement** :
  - clés serveur uniquement ;
  - jamais de numéro de carte stocké (PCI-DSS SAQ A via champs hébergés ou redirection) ;
  - aucune émission de billet sans validation humaine.

## 6. Checklist avant mise en ligne
- [ ] `pnpm audit` sans vulnérabilité haute ou critique.
- [ ] Turnstile actif sur tous les formulaires.
- [ ] Rate-limit distribué (Redis).
- [ ] HTTPS + HSTS vérifiés. Domaine soumis à hstspreload.org seulement une fois sûr de garder HTTPS sur tous les sous-domaines.
- [ ] securityheaders.com et Mozilla Observatory : note A ou mieux.
- [ ] Pages légales validées par un juriste. Bandeau cookies conforme.
- [ ] Sauvegardes testées (restauration réelle).
- [ ] Comptes back-office avec 2FA. Aucun compte par défaut.
- [ ] Monitoring d'erreurs (Sentry ou équivalent) configuré **sans** données personnelles (`sendDefaultPii: false`).
