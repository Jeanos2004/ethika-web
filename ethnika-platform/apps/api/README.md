# apps/api — API ETHNIKA (NestJS)

API métier : demandes, back-office (comptes, 2FA, rôles, audit), devis et PDF, e-mails, vols.
Le site (`apps/web`) l'appelle **côté serveur uniquement**, avec la clé partagée `X-Internal-Key` ; le navigateur ne parle jamais à l'API.
Spécification : `docs/PROMPT_CLAUDE_CODE.md` § 6 et `docs/SECURITY.md` § 5. Déploiement : `docs/DEPLOIEMENT.md`.

> Branchée au site (back-office connecté, contenus publics, newsletter) dès que `API_BASE_URL` est défini côté site ; sans cela, le site tourne en mode démo et ne l'appelle pas.

Pile : NestJS 11 (CommonJS), Prisma 7 + PostgreSQL, Zod 4, Jest. NestJS 12 et `puppeteer-core` 25 sont publiés en ESM uniquement :
on reste volontairement sur NestJS 11 et `puppeteer-core` 24 (CommonJS) tant que l'API n'est pas migrée en ESM.

## Démarrer en local
```bash
cp apps/api/.env.example apps/api/.env   # INTERNAL_API_KEY et DATA_ENCRYPTION_KEY : openssl rand -hex 32
cd apps/api && docker compose up -d       # PostgreSQL local sur 127.0.0.1:15432
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
| clé | POST | `/newsletter`, `/newsletter/confirm`, `/newsletter/unsubscribe` | Alertes promo en double opt-in (jetons hachés, pas d'énumération, 1 e-mail / 10 min) |
| clé | GET | `/public/offers?locale=`, `/public/circuits?locale=`, `/public/circuits/:slug` | Contenus publiés, localisés (repli EN → FR) |
| clé | GET | `/public/posts?locale=`, `/public/posts/:slug`, `/public/gallery?locale=` | Articles du blog (corps Markdown) et photos de la galerie publiés |
| clé | GET | `/public/media/:id` | Image envoyée depuis le back-office (servie par le site sous `/media/<id>.<ext>`, cache long) |
| clé | POST | `/flights/search` | Recherche de vols (cache 5 min, limite par IP) |
| clé | GET | `/flights/offers/:id` | Prix et conditions d'une offre |
| clé | POST | `/auth/login`, `/auth/mfa` | Connexion |
| session | GET / POST | `/auth/me`, `/auth/logout`, `/auth/password`, `/auth/mfa/setup`, `/auth/mfa/enable` | Compte courant |
| agent, admin | GET | `/leads?status=&type=&q=&assignee=me\|none\|<id>&page=&pageSize=` | Liste paginée (25 par défaut, 100 max.) + compteurs |
| agent, admin | POST | `/leads/manual` | Demande saisie par un agent (téléphone, WhatsApp) : même validation que le site, source `manual`, attribuée à l'agent, auditée |
| agent, admin | PATCH / POST | `/leads/:ref/assign`, `/leads/:ref/notes` | Attribution à un agent, notes internes (historisées) |
| agent, admin | GET | `/stats` | Indicateurs du tableau de bord (à traiter, en retard, taux de confirmation, 14 jours, file prioritaire, activité) |
| agent, admin | GET | `/leads/export.csv`, `/leads/export.xlsx` | Export CSV (formules neutralisées) ou Excel mis en forme (feuilles Demandes et Synthèse), audités |
| agent, admin | GET / PATCH | `/leads/:ref`, `/leads/:ref/status` | Détail, changement de statut (historisé, audité) |
| agent, admin | GET | `/leads/:ref/pdf` | Récapitulatif PDF |
| agent, admin | POST / GET | `/leads/:ref/quotes` | Devis (numéro `DEV-AAAA-NNNN`, montants entiers) |
| agent, admin | GET | `/quotes/:number/pdf` | Devis PDF |
| agent, admin | POST | `/flights/orders` | Pose une option (PNR) chez le fournisseur, enregistrée et rattachée à la demande (`leadRef`) ; refus explicite `offer_not_holdable` si paiement immédiat exigé |
| agent, admin | GET / POST | `/flights/bookings?status=&leadRef=`, `/flights/bookings/:id`, `/flights/bookings/:id/cancel` | Suivi des options (détail resynchronisé avec le fournisseur), annulation |
| admin | GET / POST / PATCH | `/users`, `/users/:id`, `/users/:id/reset-mfa`, `/users/:id/reset-password` | Comptes |
| admin | GET | `/audit`, `/audit/search?category=&actorId=`, `/audit/summary` | Journal d'audit (recherche paginée, volumes 24 h / 7 j) |
| session | GET / PATCH | `/account`, `/account/sessions`, `/account/sessions/revoke`, `/account/sessions/revoke-others` | Profil, sessions actives (déconnexion d'un appareil ou des autres) |
| admin | GET | `/system` | État de fonctionnement (configuration, file d'e-mails, volumes), sans secret |
| agent, admin / admin | GET / PATCH | `/agency` | Coordonnées de l'agence (site public et PDF ; modification : admin) |
| clé | GET | `/public/agency` | Coordonnées publiques lues par le site (en-tête, pied de page, Contact, carte) |
| agent, admin | GET / POST | `/notifications`, `/notifications/seen` | Cloche du back-office (7 derniers jours : demandes, attributions, paiements, échéances) |
| agent, admin / clé | GET / POST | `/payments/:id/receipt`, `/public/payments/:reference/receipt` | Reçu PDF d'un paiement encaissé |
| agent, admin | POST | `/quotes/:number/payments` | Lien de paiement d'un devis (reste dû ou acompte) |
| agent, admin | GET / POST | `/payments`, `/payments/config`, `/payments/:id/renew`, `/payments/:id/cancel` | Suivi, nouveau lien, annulation |
| clé | POST | `/public/payments/:reference` (+ `/checkout`, `/simulate`) | Page de paiement du site (jeton du lien), redirection chez le prestataire, simulation |
| admin | GET / POST / PATCH / DELETE | `/admin/offers`, `/admin/circuits`, `/admin/posts`, `/admin/gallery` (+ `/:id`) | Contenus : brouillon / publication, textes FR/EN, audités |
| admin | POST | `/admin/media` | Envoi d'une image (corps brut JPEG, PNG ou WebP, 15 Mo max, type reconnu par son contenu) |
| public | GET | `/health` | Santé (accès base) |

## Modules
- **leads** : demandes, statuts `new → in_progress → confirmed / cancelled`, historique, CSV.
- **auth** : comptes, sessions, 2FA, RBAC (`admin`, `agent`), commande `user:create-admin` (aucun compte par défaut).
- **audit** : connexions, échecs, verrouillages, statuts, exports, devis, comptes — sans donnée client.
- **mail** : file d'envoi en base (outbox) écrite dans la transaction de la demande ; worker toutes les 15 s, reprises à 1 min, 5 min, 30 min, 2 h, 12 h. Accusé client (FR/EN, d'après `EmailAccuse.dc.html`) et notification agence sans coordonnées client. Sans `SMTP_URL`, rien n'est envoyé (journal sans contenu).
- **pdf** : Puppeteer (`puppeteer-core` + Chrome du système). Gabarits HTML dans `src/modules/pdf/templates` (récapitulatif, devis), polices et logos embarqués ; JavaScript désactivé et réseau bloqué au rendu. Nouveau document = un gabarit + une route.
- **newsletter** : double opt-in, désinscription, abonnés actifs.
- **content** : offres, circuits, articles du blog et photos de la galerie gérés depuis le back-office (FR obligatoire, EN facultatif), liens internes et images vérifiés (pas de redirection ouverte, pas de `javascript:`). Corps des articles en Markdown limité, jamais de HTML.
- **media** : images envoyées, stockées en base (`Media`, pas de service de fichiers). Supprimées avec le dernier contenu qui les utilise ; celles jamais utilisées sont purgées après 24 h par la maintenance.
- **quotes** : devis par demande ; montants en unités entières (GNF, centimes d'euro), totaux en `BigInt`.
- **flights** : interface `FlightProvider` ; `mock` (développement, tests) ou `duffel` (`FLIGHT_PROVIDER=duffel`, jeton `duffel_test_…`). Délais, reprises à backoff, journal sans donnée personnelle ni identifiant. Chaque offre indique si une option est possible (`holdable`, `payBefore`). Les options posées sont enregistrées (PNR, montant, échéance, trajet résumé) sans copier les données des passagers, rattachées à la demande, et l'agence est alertée par e-mail 24 h avant l'échéance de paiement. Ni paiement ni émission de billet sans un agent.
  - Validé contre le **bac à sable Duffel** : recherche (50 offres Conakry → Paris), prix et conditions, option, consultation, annulation.
  - **Amadeus** (`FLIGHT_PROVIDER=amadeus`, `AMADEUS_BASE_URL`, `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`) : jeton OAuth2 en cache (une seule demande même en parallèle, renouvelé avant expiration ou après un 401). Amadeus étant sans état, les offres d'une recherche sont gardées 30 min sous un identifiant opaque (`am_…`) pour le prix et la réservation. Réservation avec émission différée (`DELAY_TO_QUEUE`) ; offres à émission immédiate refusées (`offer_not_holdable`). Adresses : `https://test.api.amadeus.com` (clés gratuites sur developers.amadeus.com), `https://api.amadeus.com` (production), ou le bac à sable simulé `https://amadeus-api.mock.beeceptor.com` (données aléatoires, réponses d'environ une minute : `AMADEUS_TIMEOUT_MS=150000`).
- **payments** : interface `PaymentProvider` (`PAYMENT_PROVIDER=none|mock` ; `mock` = simulation, refusée en production). Lien client `/paiement/PAY-XXXXXX?t=…` (jeton haché, 7 jours, renouvelable), redirection chez le prestataire (aucune donnée de carte chez ETHNIKA), résultat idempotent, historique de la demande, demande confirmée quand le devis est soldé, alerte agence. Brancher un prestataire réel : une classe `PaymentProvider` + une route de notification authentifiée par sa signature, qui appelle `PaymentsService.applyResult`.
- **agency** : coordonnées et mentions de l'agence (ligne unique), reprises sur le site public et les PDF ; valeurs fictives (`verified = false`) jusqu'au premier enregistrement.
- **mail** : file d'envoi ; transport Resend (`RESEND_API_KEY`, prioritaire), SMTP (`SMTP_URL`) ou journal en développement. Reçu de paiement au client (FR/EN).
- **notifications** : calculées à la volée (aucune table), compteur non lu par compte (`User.notificationsSeenAt`).
- **maintenance** : chaque heure, purge des sessions et défis expirés, des e-mails envoyés de plus de 90 jours et des demandes clôturées au-delà de `LEAD_RETENTION_DAYS`.

## Tests
- `pnpm --filter @ethnika/api test` : tests unitaires (Jest) — TOTP (vecteurs RFC 6238), chiffrement, garde de clé, schémas, CSV, gabarits (échappement), montants, Duffel (requêtes, reprises), vols.
- `AMADEUS_LIVE=1 pnpm --filter @ethnika/api exec jest --config test/jest-e2e.json amadeus.live` : adaptateur Amadeus contre un vrai serveur (Beeceptor par défaut, ou `AMADEUS_BASE_URL` si `FLIGHT_PROVIDER=amadeus`) ; jamais en CI.
- `DUFFEL_LIVE=1 pnpm --filter @ethnika/api exec jest --config test/jest-e2e.json duffel.live` : adaptateur Duffel contre le vrai bac à sable (jeton `duffel_test_…` dans `.env` ; jamais en CI).
- `pnpm --filter @ethnika/api test:e2e` : API complète contre PostgreSQL (`docker compose up -d`, migrations appliquées) — authentification, 2FA, verrouillage, RBAC, demandes, e-mails en file, devis, vols, PDF si `CHROME_PATH`.

## Pour plus tard
- Limitation de débit et cache des vols dans Redis (plusieurs instances).
- Paiement : hors périmètre tant que l'agence n'a pas choisi son prestataire (jamais de donnée de carte stockée).
- Adaptateur Amadeus Enterprise ou consolidateur (même interface `FlightProvider`).
