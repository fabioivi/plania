# syntax=docker/dockerfile:1.4

# ============================================
# Stage 1: Base
# ============================================
FROM node:20-alpine AS base

RUN apk add --no-cache \
    libc6-compat \
    wget \
    dumb-init

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS deps

# Install root dependencies
COPY package*.json turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

# Fallback to npm install if lockfile is missing from context
RUN npm install

# ============================================
# Stage 3: Development
# ============================================
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/turbo.json ./turbo.json

COPY . .

ENV NODE_ENV=development
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "turbo", "run", "dev", "--filter=plania-design-system"]

# ============================================
# Stage 4: Builder
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY . .

# Build Next.js (generates standalone output)
RUN npx turbo run build --filter=plania-design-system && \
    echo "=== Build completed, checking output ===" && \
    ls -la /app/apps/frontend/.next/ && \
    echo "=== Standalone Content ===" && \
    ls -R /app/apps/frontend/.next/standalone/ || echo "Standalone folder not found"

# ============================================
# Stage 5: Production (Next.js Standalone)
# ============================================
FROM base AS production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build
# Note: In a monorepo, .next/standalone usually contains "apps/frontend/server.js"
# But based on verification, it seems to be copied to root in this specific setup or dependent on Next.js version
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./

# Copy static assets (not included in standalone - must be copied separately)
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

# Copy public folder (static assets served by Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
