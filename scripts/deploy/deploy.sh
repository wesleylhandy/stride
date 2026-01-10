#!/bin/bash
# Production deployment script for Stride
#
# This script handles full production deployment including:
# - Environment validation
# - Building Docker images
# - Running database migrations
# - Starting services
# - Health checks
#
# Usage: ./scripts/deploy/deploy.sh [--skip-build] [--skip-migrations]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_BUILD=false
SKIP_MIGRATIONS=false

for arg in "$@"; do
  case $arg in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-migrations)
      SKIP_MIGRATIONS=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      echo "Usage: $0 [--skip-build] [--skip-migrations]"
      exit 1
      ;;
  esac
done

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo -e "${GREEN}Starting Stride production deployment...${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed${NC}"
  exit 1
fi

if ! command -v docker compose &> /dev/null; then
  echo -e "${RED}Error: Docker Compose is not installed${NC}"
  exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo -e "${YELLOW}Warning: .env.production not found${NC}"
  echo "Creating .env.production from .env.production.example..."
  if [ -f ".env.production.example" ]; then
    cp .env.production.example .env.production
    echo -e "${RED}Please configure .env.production with your production values before continuing!${NC}"
    exit 1
  else
    echo -e "${RED}Error: .env.production.example not found${NC}"
    exit 1
  fi
fi

# Validate required environment variables
echo -e "${YELLOW}Validating environment variables...${NC}"
source .env.production

REQUIRED_VARS=("JWT_SECRET" "SESSION_SECRET" "DATABASE_URL" "NODE_ENV" "NEXT_PUBLIC_APP_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo -e "${RED}Error: Missing required environment variables:${NC}"
  printf '%s\n' "${MISSING_VARS[@]}"
  exit 1
fi

# Validate NODE_ENV is production
if [ "$NODE_ENV" != "production" ]; then
  echo -e "${YELLOW}Warning: NODE_ENV is not set to 'production' (current: $NODE_ENV)${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Copy .env.production to .env for docker-compose
echo -e "${YELLOW}Setting up environment...${NC}"
cp .env.production .env

# Build Docker images (if not skipped)
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${YELLOW}Building Docker images...${NC}"
  docker compose build --no-cache
else
  echo -e "${YELLOW}Skipping build (--skip-build flag set)${NC}"
fi

# Stop existing services
echo -e "${YELLOW}Stopping existing services...${NC}"
docker compose down

# Start database first
echo -e "${YELLOW}Starting database...${NC}"
docker compose up -d stride-postgres

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
timeout=60
elapsed=0
while ! docker compose exec -T stride-postgres pg_isready -U stride -d stride > /dev/null 2>&1; do
  if [ $elapsed -ge $timeout ]; then
    echo -e "${RED}Error: Database did not become ready within ${timeout} seconds${NC}"
    exit 1
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

echo -e "${GREEN}Database is ready${NC}"

# Run migrations (if not skipped)
if [ "$SKIP_MIGRATIONS" = false ]; then
  echo -e "${YELLOW}Running database migrations...${NC}"
  docker compose exec -T web pnpm --filter @stride/database prisma migrate deploy || {
    echo -e "${RED}Error: Database migrations failed${NC}"
    exit 1
  }
else
  echo -e "${YELLOW}Skipping migrations (--skip-migrations flag set)${NC}"
fi

# Start all services
echo -e "${YELLOW}Starting all services...${NC}"
docker compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}Running health check...${NC}"
if [ -f "scripts/deploy/health-check.sh" ]; then
  ./scripts/deploy/health-check.sh || {
    echo -e "${RED}Warning: Health check failed, but deployment completed${NC}"
  }
else
  echo -e "${YELLOW}Health check script not found, skipping...${NC}"
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Services status:"
docker compose ps

echo ""
echo -e "${GREEN}Application should be available at: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}${NC}"
