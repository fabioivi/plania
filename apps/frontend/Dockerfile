# syntax=docker/dockerfile:1.4

# ============================================
# Stage 1: Pruner (Isolate App Scope)
# ============================================
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
# Prune the workspace to only include "plania-design-system" (frontend)
RUN npx turbo prune plania-design-system --docker

# ============================================
# Stage 2: Base (Shared Runtime)
# ============================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat wget dumb-init
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ============================================
# Stage 3: Dependencies (Install Pruned Deps)
# ============================================
FROM base AS deps
# Copy only package.json's from the pruned output
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
# Install dependencies (only what's needed for this app)
RUN npm install

# ============================================
# Stage 4: Builder (Build the App)
# ============================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy the full source code from pruned output
COPY --from=pruner /app/out/full/ .

# Build Next.js
# Note: Since we pruned, we don't need "--filter" technically, but good to keep consistency
# Bake in the API URL as relative path for production (Traefik compatibility)
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npx turbo run build --filter=plania-design-system

# ============================================
# Stage 5: Production Dependencies
# ============================================
FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install --omit=dev

# ============================================
# Stage 6: Production Runner
# ============================================
FROM base AS production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production node_modules
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy build artifacts
# Note: Paths are relative to root because 'out/full' preserved the structure
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/next.config.js ./apps/frontend/next.config.js
# Copy root package.json for workspace reference if needed
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
# Ensure NODE_ENV is set for production optimizations
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["dumb-init", "--"]

# Set working directory to the app folder
WORKDIR /app/apps/frontend

CMD ["npm", "start"]
