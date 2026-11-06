# apps/api — NestJS (phase 2)

Vide volontairement. Créé au début de la phase 2 (voir `docs/PROMPT_CLAUDE_CODE.md` § 6) avec :

```bash
pnpm dlx @nestjs/cli new api --package-manager pnpm --skip-git --strict
```

Modules prévus :
- `leads` ;
- `auth` (argon2id, sessions, 2FA TOTP, RBAC) ;
- `flights` (interface `FlightProvider`, adaptateur Duffel test en premier) ;
- `mail` (React Email) ;
- `audit`.

Base de données PostgreSQL via Prisma. Files d'attente BullMQ (Redis).
