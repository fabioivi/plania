# syntax=docker/dockerfile:1.4

# ============================================
# Stage 1: Base
# ============================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget \
    dumb-init

# Configure Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /monorepo

# ============================================
# Stage 2: Dependencies (com cache mount)
# ============================================
FROM base AS deps

# Cache do npm entre builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=bind,source=apps/backend/package.json,target=apps/backend/package.json \
    npm ci --workspace=apps/backend --include-workspace-root --prefer-offline

# ============================================
# Stage 3: Development
# ============================================
FROM base AS development

# Copy dependencies instaladas
COPY --from=deps /monorepo/node_modules ./node_modules
COPY --from=deps /monorepo/apps/backend/node_modules ./apps/backend/node_modules

# Copy apenas código backend
COPY apps/backend ./apps/backend

WORKDIR /monorepo/apps/backend

ENV NODE_ENV=development

EXPOSE 3001

# Use dumb-init para proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# ============================================
# Stage 4: Builder
# ============================================
FROM base AS builder

# Copy dependencies
COPY --from=deps /monorepo/node_modules ./node_modules
COPY --from=deps /monorepo/apps/backend/node_modules ./apps/backend/node_modules

# Copy código fonte
COPY apps/backend ./apps/backend

WORKDIR /monorepo/apps/backend

# Build
RUN npm run build

# Limpar dev dependencies
RUN npm prune --production

# ============================================
# Stage 5: Production
# ============================================
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy apenas o necessário para produção
COPY --from=builder --chown=nestjs:nodejs /monorepo/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /monorepo/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /monorepo/apps/backend/package.json ./package.json

USER nestjs

ENV NODE_ENV=production

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Use dumb-init para proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
