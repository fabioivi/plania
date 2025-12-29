# syntax=docker/dockerfile:1.4

# -----------------------------------------------------------------------------
# Base Image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
RUN npm install -g turbo
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage: Pruner (Isolate scope)
# -----------------------------------------------------------------------------
FROM base AS pruner
COPY . .
RUN turbo prune --scope=plania-design-system --docker

# -----------------------------------------------------------------------------
# Stage: Dev Dependencies (For Building)
# -----------------------------------------------------------------------------
FROM base AS dev-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Install dependencies (cached)
RUN pnpm install --frozen-lockfile --shamefully-hoist

# -----------------------------------------------------------------------------
# Stage: Builder
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production

COPY --from=dev-deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

ARG TURBO_TOKEN
ARG TURBO_TEAM
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TURBO_TEAM=$TURBO_TEAM
ENV BUILD_STANDALONE=true

RUN turbo run build --filter=plania-design-system

# -----------------------------------------------------------------------------
# Stage: Development
# -----------------------------------------------------------------------------
FROM base AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# Run Next.js in dev mode
CMD ["pnpm", "turbo", "run", "dev", "--filter=plania-design-system"]

# -----------------------------------------------------------------------------
# Stage: Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
# Dockerfile in standalone output usually requires:
# - .next/standalone/package.json
# - .next/standalone/node_modules
# - .next/standalone/apps/frontend/server.js
# We copy explicitly from builder

COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/frontend/server.js"]
