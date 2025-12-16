# syntax=docker/dockerfile:1.4

# ============================================
# Stage 1: Pruner (Isolate App Scope)
# ============================================
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
# Prune the workspace to only include "plania-backend"
RUN npx turbo prune plania-backend --docker

# ============================================
# Stage 2: Base (Shared Runtime)
# ============================================
FROM node:20-alpine AS base
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget \
    dumb-init

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# ============================================
# Stage 3: Dependencies (Install Pruned Deps)
# ============================================
FROM base AS deps
# Copy only package.json's from the pruned output
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

# ============================================
# Stage 4: Builder (Build the App)
# ============================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy the full source code from pruned output
COPY --from=pruner /app/out/full/ .

RUN npx turbo run build --filter=plania-backend

# ============================================
# Stage 5: Production Dependencies
# ============================================
FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
# Install production dependencies only
RUN npm install --omit=dev

# ============================================
# Stage 6: Production Runner
# ============================================
FROM base AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy production node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application and package files
# Paths are maintained by turbo prune: apps/backend/...
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Copy additional configs if needed (e.g., nest-cli.json)
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/nest-cli.json ./apps/backend/nest-cli.json

USER nestjs

ENV NODE_ENV=production
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

WORKDIR /app/apps/backend
CMD ["npm", "run", "start:prod"]
