# apps/api — API ETHNIKA (NestJS)

API métier : demandes, back-office (comptes, 2FA, rôles, audit), devis et PDF, e-mails, vols.
Le site (`apps/web`) l'appelle **côté serveur uniquement**, avec la clé partagée `X-Internal-Key` ; le navigateur ne parle jamais à l'API.
Spécification : `docs/PROMPT_CLAUDE_CODE.md` § 6 et `docs/SECURITY.md` § 5. Déploiement : `docs/DEPLOIEMENT.md`.

> Développée **indépendamment du site** : tant que le VPS n'existe pas, le site tourne en mode démo et ne l'appelle pas.

## Démarrer en local
```bash
cp apps/api/.env.example apps/api/.env   # INTERNAL_API_KEY et DATA_ENCRYPTION_KEY : openssl rand -hex 32
cd apps/api && docker compose up -d       # PostgreSQL local sur 127.0.0.1:54329
pnpm --filter @ethnika/api prisma:generate
pnpm --filter @ethnika/api prisma:migrate
pnpm --filter @ethnika/api user:create-admin admin@ethnikatour.com "Prénom Nom"   # affiche un mot de passe temporaire
pnpm --filter @ethnika/api dev            # http://localhost:4000
```

## Authentification du back-office
1. `POST /v1/auth/login` `{ email, password }` → `ok` (session), `mfa_required` (défi), ou `mfa_setup_required` (admin sans 2FA : session limitée).
2. `POST /v1/auth/mfa` `{ challenge, code }` → session.
3. Le serveur du site garde le jeton dans un cookie `HttpOnly; Secure; SameSite=Strict` et le renvoie dans `X-Session-Token`.

Règles : argon2id ; 2FA TOTP obligatoire pour les admins (secret chiffré AES-256-GCM, code à usage unique) ; mot de passe temporaire à changer à la première connexion (12 caractères minimum) ; verrouillage 15 min après 5 échecs, doublé à chaque récidive (24 h maximum) ; sessions de 12 h, coupées après 30 min d'inactivité, rotation après changement de mot de passe ou activation de la 2FA ; réponses identiques que le compte existe ou non ; limitation de débit par IP et par compte.

## Routes (`/v1`)
| Accès | Méthode | Route | Rôle |
|---|---|---|---|
| clé | POST | `/leads` | Demande du site (revalidée par Zod, référence `ETH-XXXXXX`, e-mails mis en file) |
| clé | POST | `/newsletter` | Inscription aux alertes |
| clé | POST | `/flights/search` | Recherche de vols (cache 5 min, limite par IP) |
| clé | GET | `/flights/offers/:id` | Prix et conditions d'une offre |
| clé | POST | `/auth/login`, `/auth/mfa` | Connexion |
| session | GET / POST | `/auth/me`, `/auth/logout`, `/auth/password`, `/auth/mfa/setup`, `/auth/mfa/enable` | Compte courant |
| agent, admin | GET | `/leads?status=&type=&q=&page=&pageSize=` | Liste paginée (25 par défaut, 100 max.) + compteurs |
| agent, admin | GET | `/leads/export.csv` | Export CSV (formules neutralisées, audité) |
| agent, admin | GET / PATCH | `/leads/:ref`, `/leads/:ref/status` | Détail, changement de statut (historisé, audité) |
| agent, admin | GET | `/leads/:ref/pdf` | Récapitulatif PDF |
| agent, admin | POST / GET | `/leads/:ref/quotes` | Devis (numéro `DEV-AAAA-NNNN`, montants entiers) |
| agent, admin | GET | `/quotes/:number/pdf` | Devis PDF |
| agent, admin | POST / GET | `/flights/orders`, `/flights/orders/:id`, `/flights/orders/:id/cancel` | Option (hold) sans émission, consultation, annulation |
| admin | GET / POST / PATCH | `/users`, `/users/:id`, `/users/:id/reset-mfa`, `/users/:id/reset-password` | Comptes |
| admin | GET | `/audit` | Journal d'audit |
| public | GET | `/health` | Santé (accès base) |

## Modules
- **leads** : demandes, statuts `new → in_progress → confirmed / cancelled`, historique, CSV.
- **auth** : comptes, sessions, 2FA, RBAC (`admin`, `agent`), commande `user:create-admin` (aucun compte par défaut).
- **audit** : connexions, échecs, verrouillages, statuts, exports, devis, comptes — sans donnée client.
- **mail** : file d'envoi en base (outbox) écrite dans la transaction de la demande ; worker toutes les 15 s, reprises à 1 min, 5 min, 30 min, 2 h, 12 h. Accusé client (FR/EN, d'après `EmailAccuse.dc.html`) et notification agence sans coordonnées client. Sans `SMTP_URL`, rien n'est envoyé (journal sans contenu).
- **pdf** : Puppeteer (`puppeteer-core` + Chrome du système). Gabarits HTML dans `src/modules/pdf/templates` (récapitulatif, devis), polices et logos embarqués ; JavaScript désactivé et réseau bloqué au rendu. Nouveau document = un gabarit + une route.
- **quotes** : devis par demande ; montants en unités entières (GNF, centimes d'euro), totaux en `BigInt`.
- **flights** : interface `FlightProvider` ; `mock` (développement) ou `duffel` (jeton `duffel_test_…`). Délais, reprises à backoff, journal sans donnée personnelle. Une « réservation » est une option : ni paiement ni émission sans un agent.
- **maintenance** : chaque heure, purge des sessions et défis expirés, des e-mails envoyés de plus de 90 jours et des demandes clôturées au-delà de `LEAD_RETENTION_DAYS`.

## Tests
- `pnpm --filter @ethnika/api test` : tests unitaires (Jest) — TOTP (vecteurs RFC 6238), chiffrement, garde de clé, schémas, CSV, gabarits (échappement), montants, Duffel (requêtes, reprises), vols.
- `pnpm --filter @ethnika/api test:e2e` : API complète contre PostgreSQL (`docker compose up -d`, migrations appliquées) — authentification, 2FA, verrouillage, RBAC, demandes, e-mails en file, devis, vols, PDF si `CHROME_PATH`.

## Pour plus tard
- Limitation de débit et cache des vols dans Redis (plusieurs instances).
- Paiement : hors périmètre tant que l'agence n'a pas choisi son prestataire (jamais de donnée de carte stockée).
- Adaptateur Amadeus Enterprise ou consolidateur (même interface `FlightProvider`).
