# syntax=docker/dockerfile:1.4

# ============================================
# Stage 1: Base
# ============================================
FROM node:20-alpine AS base

RUN apk add --no-cache \
    libc6-compat \
    wget \
    dumb-init

WORKDIR /monorepo

ENV NEXT_TELEMETRY_DISABLED=1

# ============================================
# Stage 2: Dependencies (com cache mount)
# ============================================
FROM base AS deps

# Cache do npm entre builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=bind,source=apps/frontend/package.json,target=apps/frontend/package.json \
    npm ci --workspace=apps/frontend --include-workspace-root --prefer-offline

# ============================================
# Stage 3: Development
# ============================================
FROM base AS development

# Copy dependencies instaladas
COPY --from=deps /monorepo/node_modules ./node_modules
COPY --from=deps /monorepo/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy apenas código frontend
COPY apps/frontend ./apps/frontend

WORKDIR /monorepo/apps/frontend

ENV NODE_ENV=development

EXPOSE 3000

# Use dumb-init para proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# ============================================
# Stage 4: Builder
# ============================================
FROM base AS builder

# Copy dependencies
COPY --from=deps /monorepo/node_modules ./node_modules
COPY --from=deps /monorepo/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy código fonte
COPY apps/frontend ./apps/frontend

WORKDIR /monorepo/apps/frontend

ENV NODE_ENV=production

# Build Next.js (gera standalone)
RUN npm run build

# ============================================
# Stage 5: Production (Next.js Standalone)
# ============================================
FROM base AS production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /monorepo/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /monorepo/apps/frontend/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /monorepo/apps/frontend/public ./public

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Use dumb-init para proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
