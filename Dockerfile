# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
# Generation needs a URL to load Prisma's config, but never connects to it.
# The optional CA mount is only for builds behind a trusted session proxy.
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    export DATABASE_URL=mysql://build:build@127.0.0.1:3306/build; \
    npm ci --omit=dev --no-audit --no-fund && npm run db:generate

COPY backend/src ./src
COPY backend/scripts ./scripts
COPY frontend /app/frontend
RUN mkdir -p public/products && chown -R node:node public

ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
