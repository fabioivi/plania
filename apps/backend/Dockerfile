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

WORKDIR /app

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
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/turbo.json ./turbo.json

COPY . .

RUN rm -f apps/backend/.env

ENV NODE_ENV=development
EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
# Run specifically the backend dev script via turbo
CMD ["npx", "turbo", "run", "dev", "--filter=plania-backend"]

# ============================================
# Stage 4: Builder
# ============================================
# ============================================
# Stage 4: Builder
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .

RUN npx turbo run build --filter=plania-backend && \
    echo "=== Build completed, checking output ===" && \
    ls -la /app/apps/backend/dist/ && \
    ls -la /app/apps/backend/dist/src/ || echo "Dist/src folder not found"

# ============================================
# Stage 5: Production Dependencies
# ============================================
FROM base AS prod-deps

COPY package*.json turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

# Debug: Check files
RUN ls -la && ls -la apps/backend

# Use npm install instead of ci to tolerate potential lockfile inconsistencies in this context
RUN npm install --omit=dev

# ============================================
# Stage 6: Production
# ============================================
FROM base AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy package files for reference
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/

# Copy production node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist

# Check contents for debugging
RUN echo "=== Checking Production Build Contents ===" && \
    ls -la /app/apps/backend/dist && \
    ls -la /app/node_modules

USER nestjs

ENV NODE_ENV=production
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

WORKDIR /app/apps/backend
CMD ["npm", "run", "start:prod"]
