# Image de production de l'API (VPS, docs/DEPLOIEMENT.md). Construire depuis la racine du projet :
#   docker build -f apps/api/Dockerfile -t ethnika-api .
# Secrets au démarrage uniquement (--env-file), jamais dans l'image.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @ethnika/api...
COPY apps/api apps/api
RUN pnpm --filter @ethnika/api exec prisma generate && pnpm --filter @ethnika/api build \
 && pnpm deploy --filter @ethnika/api --prod --legacy /out \
 && cp -r apps/api/dist apps/api/prisma apps/api/prisma.config.ts /out/ \
 && cp -r apps/api/src/generated /out/dist/generated 2>/dev/null || true

FROM node:22-alpine AS runner
# Chromium + polices pour le rendu PDF (puppeteer-core).
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont \
 && addgroup -S api -g 1001 && adduser -S api -u 1001 -G api
WORKDIR /app
ENV NODE_ENV=production PORT=4000 CHROME_PATH=/usr/bin/chromium-browser PDF_NO_SANDBOX=1
COPY --from=build --chown=api:api /out ./
USER api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:4000/health >/dev/null || exit 1
# Migrations appliquées au démarrage (idempotent), puis lancement.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
