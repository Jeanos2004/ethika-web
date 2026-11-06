# Image de production du site (option « Docker + VPS derrière Cloudflare », docs/DEPLOIEMENT.md).
# Construire depuis la RACINE du dépôt :
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://ethnikatour.com \
#     --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER=224XXXXXXXXX \
#     -t ethnika-web .
# Les variables NEXT_PUBLIC_* sont figées au build ; les secrets serveur se passent au démarrage (--env-file).

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS deps
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @ethnika/web...

FROM base AS build
WORKDIR /repo
COPY --from=deps /repo ./
COPY apps/web apps/web
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
ENV NEXT_OUTPUT=standalone NODE_ENV=production \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
RUN pnpm --filter @ethnika/web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
