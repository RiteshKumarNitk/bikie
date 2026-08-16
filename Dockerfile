# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/database/package.json ./packages/database/
COPY packages/services/package.json ./packages/services/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validation/package.json ./packages/validation/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web ./apps/web
COPY packages ./packages
COPY docker ./docker
# Re-link after source overlay so workspace deps resolve on Linux
RUN pnpm install --frozen-lockfile
ENV NEXT_TELEMETRY_DISABLED=1

# DATABASE_URL/DIRECT_URL are deliberately NOT build args: DB-backed route handlers
# now render at request time (see apps/web/app/api/categories/route.ts), so `next build`
# never touches Postgres. Runtime connectivity comes from the "postgres" Compose service,
# supplied via docker-compose.yml's env_file at container start, after `docker compose up`.
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG MESSAGE_ENCRYPTION_KEY
ARG NEXT_PUBLIC_MSG91_WIDGET_ID
ARG NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH

ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV MESSAGE_ENCRYPTION_KEY=$MESSAGE_ENCRYPTION_KEY
ENV NEXT_PUBLIC_MSG91_WIDGET_ID=$NEXT_PUBLIC_MSG91_WIDGET_ID
ENV NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH=$NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH

RUN pnpm db:generate
RUN pnpm build --filter=web

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app ./

# Strip Windows CRLF if present (common on Windows hosts)
RUN sed -i 's/\r$//' /app/docker/entrypoint.sh && chmod +x /app/docker/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["pnpm", "--filter", "web", "start"]
