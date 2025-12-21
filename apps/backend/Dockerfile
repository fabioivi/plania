# syntax=docker/dockerfile:1.4

# -----------------------------------------------------------------------------
# Base Image
# -----------------------------------------------------------------------------
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
RUN npm install -g turbo
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage: Pruner (Isolate scope)
# -----------------------------------------------------------------------------
FROM base AS pruner
COPY . .
RUN turbo prune --scope=plania-backend --docker

# -----------------------------------------------------------------------------
# Stage: Dev Dependencies (For Building)
# -----------------------------------------------------------------------------
FROM base AS dev-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Install full dependencies (dev + prod) for build
RUN pnpm install --frozen-lockfile --shamefully-hoist

# -----------------------------------------------------------------------------
# Stage: Development
# -----------------------------------------------------------------------------
FROM base AS dev
WORKDIR /app
ENV NODE_ENV=development
ENV PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

# Install Playwright dependencies (system deps) for dev
RUN apt-get update -y && \
    apt-get install -y openssl && \
    npx playwright install-deps chromium && \
    rm -rf /var/lib/apt/lists/*

COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Install Playwright Browsers
RUN npx playwright install chromium

# Symlink Chromium to a fixed path for reliable access
# We search for 'chrome' binary and link it. Fail if not found.
RUN CHROME_PATH=$(find /app/ms-playwright -name "chrome" -type f | head -n 1) && \
    if [ -z "$CHROME_PATH" ]; then \
    echo "Error: Chromium binary not found in /app/ms-playwright"; \
    ls -R /app/ms-playwright; \
    exit 1; \
    fi && \
    echo "Found Chromium at $CHROME_PATH" && \
    ln -sf "$CHROME_PATH" /usr/bin/chromium

# Create storage directory
RUN mkdir -p /app/apps/backend/storage && chmod -R 777 /app/apps/backend/storage

EXPOSE 3001
# We generally want to run hot-reload in dev
CMD ["pnpm", "turbo", "run", "dev", "--filter=plania-backend"]

# -----------------------------------------------------------------------------
# Stage: Prod Dependencies (For Runner)
# -----------------------------------------------------------------------------
FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Install ONLY production dependencies
# Note: --ignore-scripts to avoid heavy postinstall scripts if not needed, 
# but Playwright usually needs manually installed binaries anyway.
RUN pnpm install --prod --frozen-lockfile --shamefully-hoist

# -----------------------------------------------------------------------------
# Stage: Builder
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=dev-deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=plania-backend

# -----------------------------------------------------------------------------
# Stage: Runner
# -----------------------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

# Install system dependencies (Playwright + NestJS/Prisma deps)
RUN apt-get update -y && \
    apt-get install -y openssl && \
    npx playwright install-deps chromium && \
    rm -rf /var/lib/apt/lists/*

# Create user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nestjs && \
    mkdir -p /home/nestjs && chown nestjs:nodejs /home/nestjs

# Copy Production Dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=prod-deps /app/package.json ./package.json

# Copy Built Artifacts
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

# Install Playwright Browsers (Chromium only)
RUN npx playwright install chromium

# Ensure storage directories
RUN mkdir -p /app/apps/backend/storage && \
    mkdir -p /app/ms-playwright && \
    chown -R nestjs:nodejs /app/apps/backend/storage && \
    chown -R nestjs:nodejs /app/ms-playwright

USER nestjs
EXPOSE 3001

WORKDIR /app/apps/backend
CMD ["node", "dist/main"]
