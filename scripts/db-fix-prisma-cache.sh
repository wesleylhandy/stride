#!/bin/bash
# Script to fix Prisma client cache issues with Next.js
# Usage: ./scripts/db-fix-prisma-cache.sh

set -e

echo "🔧 Fixing Prisma client cache issues..."

# Stop any running dev servers
echo "Stopping dev servers..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "turbo" 2>/dev/null || true

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf apps/web/.next
rm -rf apps/site/.next 2>/dev/null || true

# Reinstall dependencies first (ensures @prisma/client is available)
echo "Reinstalling dependencies..."
pnpm install

# Regenerate Prisma client (this will overwrite any cached version)
echo "Regenerating Prisma client..."
pnpm --filter @stride/database db:generate

echo "✅ Done! You can now restart the dev server with: pnpm dev"
