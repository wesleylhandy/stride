# Multi-stage Dockerfile for Next.js application
# Build context: root of monorepo (as specified in docker-compose.yml)

# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/yaml-config/package.json ./packages/yaml-config/
COPY packages/ai-gateway/package.json ./packages/ai-gateway/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Set build-time environment variables
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client (required before building)
# prisma.config.ts now has a fallback, but set DATABASE_URL anyway for clarity
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
# Generate Prisma client - this creates types that other packages need
# Use the db:generate script or run prisma directly in the database package
WORKDIR /app/packages/database
RUN pnpm prisma generate
WORKDIR /app

# Verify Prisma client was generated (for debugging)
RUN ls -la packages/database/node_modules/.prisma/client 2>/dev/null || echo "Prisma client not in expected location, checking pnpm store..."

# Build the application
# This will build all workspace dependencies and the Next.js app
RUN pnpm --filter @stride/web build

# Stage 3: Runner
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from builder
# Next.js standalone output structure:
# - .next/standalone/ contains server.js and minimal node_modules
# - .next/static/ needs to be at .next/static/ relative to server.js
# - public/ needs to be at public/ relative to server.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
# Create public directory (Next.js may not create it if empty, but server expects it)
# Only copy public if it exists in builder stage
RUN mkdir -p ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js server
# The standalone output puts server.js in the root of the standalone directory
CMD ["node", "server.js"]

