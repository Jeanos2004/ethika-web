# Architecture — ETHNIKA

```
ethnika-platform/
├─ apps/
│  ├─ web/            Next.js 16 — site public + back-office (/admin, phase 2)
│  └─ api/            NestJS — phase 2 : leads, auth, flights, e-mails
├─ packages/
│  └─ shared/         (phase 2) schémas Zod et types partagés web ↔ api
├─ design/
│  ├─ maquettes/      maquettes HTML validées (référence visuelle)
│  └─ brand/          pack logo HD
└─ docs/
```

## Pourquoi Next (front) + NestJS (back)
| Besoin | Où |
|---|---|
| Pages marketing, SEO, rendu statique, formulaires | **Next** (Server Components, Server Actions) |
| Logique métier, base de données, back-office, e-mails | **NestJS** |
| GDS / consolidateur (SOAP ou REST, retries, jobs longs) | **NestJS** + BullMQ |
| Futurs clients (app mobile, partenaires B2B) | **NestJS** (API versionnée `/v1`) |

Next seul (Route Handlers et Prisma) suffirait pour la phase 1 du site, qui fonctionne sur demande.
Dès qu'arrivent les vols en temps réel et le back-office, NestJS apporte la structure attendue : modules,
injection de dépendances, guards, files d'attente et tests e2e.

Le web n'appelle l'API **que côté serveur** (Server Actions et Server Components). Le navigateur ne parle jamais à l'API.

## Flux d'une demande (lead)
```
Navigateur ──form──▶ Server Action (Next)
                       │ rate-limit · Zod · Turnstile
                       ▼
                   API NestJS  POST /v1/leads  (X-Internal-Key)
                       │ Prisma → PostgreSQL
                       ├─▶ file "emails" → accusé client + notification agence
                       └─▶ back-office /admin (agents)
```

## Fournisseurs de vols : interface interchangeable
```ts
interface FlightProvider {
  search(q: FlightSearch): Promise<FlightOffer[]>;
  price(offerId: string): Promise<PricedOffer>;
  book(offerId: string, passengers: Passenger[]): Promise<Booking>; // PNR / commande, SANS émission auto
  getOrder(id: string): Promise<Booking>;
  cancel(id: string): Promise<void>;
}
// Adaptateurs : DuffelProvider (test d'abord) · AmadeusEnterpriseProvider · ConsolidatorProvider
```
L'agence peut ainsi commencer en mode test (Duffel), puis brancher Amadeus ou son consolidateur
sans toucher au front.

## Hébergement (proposition à valider)
| Brique | Option simple | Option maîtrisée |
|---|---|---|
| Web | Vercel (région CDG/fra) | Docker + VPS (Hetzner, OVH) derrière Cloudflare |
| API + workers | Render / Railway / Fly.io | Docker sur le même VPS |
| PostgreSQL | Neon / Supabase (UE) | PostgreSQL managé OVH / Scaleway |
| Redis | Upstash | Redis managé |
| E-mails | Resend / Brevo | SMTP de l'hébergeur |
| DNS / WAF / anti-spam | Cloudflare (Turnstile inclus) | idem |

Points d'attention en Guinée :
- latence vers l'Europe : CDN obligatoire, viser des images légères ;
- réseau mobile : les pages doivent rester légères ;
- WhatsApp est le canal principal des clients.
