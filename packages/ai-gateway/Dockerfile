# Multi-stage Dockerfile for AI Gateway service
# Build context: root of monorepo (as specified in docker-compose.yml)

# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ai-gateway/package.json ./packages/ai-gateway/
COPY packages/ui/package.json ./packages/ui/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/yaml-config/package.json ./packages/yaml-config/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/ai-gateway/node_modules ./packages/ai-gateway/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY packages/ai-gateway ./packages/ai-gateway
COPY packages/ai-gateway/tsconfig.json ./packages/ai-gateway/

# Set build-time environment variables
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Build the TypeScript code
WORKDIR /app/packages/ai-gateway
RUN pnpm build

# Stage 3: Runner
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 aigateway

# Copy built application
COPY --from=builder --chown=aigateway:nodejs /app/packages/ai-gateway/dist ./dist
COPY --from=builder --chown=aigateway:nodejs /app/packages/ai-gateway/package.json ./

# Copy production dependencies
# Note: For now copying all node_modules. Can be optimized with pnpm deploy later
COPY --from=deps --chown=aigateway:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=aigateway:nodejs /app/packages/ai-gateway/node_modules ./node_modules

USER aigateway

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Start the AI Gateway service
CMD ["node", "dist/index.js"]

