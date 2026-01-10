#!/bin/bash
# Update deployment script for Stride
#
# Updates an existing deployment with zero downtime (rolling update)
#
# Usage: ./scripts/deploy/update.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo -e "${GREEN}Starting Stride deployment update...${NC}"

# Check prerequisites
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed${NC}"
  exit 1
fi

if ! command -v docker compose &> /dev/null; then
  echo -e "${RED}Error: Docker Compose is not installed${NC}"
  exit 1
fi

# Check if services are running
if ! docker compose ps | grep -q "Up"; then
  echo -e "${RED}Error: Services are not running. Use deploy.sh for initial deployment.${NC}"
  exit 1
fi

# Source environment variables
if [ -f ".env.production" ]; then
  source .env.production
  cp .env.production .env
elif [ -f ".env" ]; then
  source .env
else
  echo -e "${RED}Error: .env or .env.production file not found${NC}"
  exit 1
fi

# Backup database before update
echo -e "${YELLOW}Creating database backup before update...${NC}"
if [ -f "scripts/deploy/backup-db.sh" ]; then
  ./scripts/deploy/backup-db.sh || {
    echo -e "${YELLOW}Warning: Database backup failed, continuing anyway...${NC}"
  }
else
  echo -e "${YELLOW}Backup script not found, skipping backup...${NC}"
fi

# Pull latest code (if in git repo)
if [ -d ".git" ]; then
  echo -e "${YELLOW}Pulling latest code...${NC}"
  git pull || {
    echo -e "${YELLOW}Warning: Git pull failed, continuing with existing code...${NC}"
  }
fi

# Build new images
echo -e "${YELLOW}Building new Docker images...${NC}"
docker compose build

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker compose exec -T web pnpm --filter @stride/database prisma migrate deploy || {
  echo -e "${RED}Error: Database migrations failed${NC}"
  exit 1
}

# Restart services with zero downtime (rolling update)
echo -e "${YELLOW}Restarting services...${NC}"

# Restart web service first (database stays up)
docker compose up -d --no-deps web

# Wait for web service to be ready
echo -e "${YELLOW}Waiting for web service to be ready...${NC}"
sleep 10

# Health check
if [ -f "scripts/deploy/health-check.sh" ]; then
  ./scripts/deploy/health-check.sh || {
    echo -e "${RED}Error: Health check failed after update${NC}"
    echo -e "${YELLOW}You may want to rollback to the previous version${NC}"
    exit 1
  }
fi

echo -e "${GREEN}Update completed successfully!${NC}"
echo ""
echo "Services status:"
docker compose ps
