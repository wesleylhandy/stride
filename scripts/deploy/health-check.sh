#!/bin/bash
# Health check script for Stride deployment
#
# Checks the health of all services and endpoints
#
# Usage: ./scripts/deploy/health-check.sh

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

echo -e "${YELLOW}Running health checks...${NC}"

# Source environment variables
if [ -f ".env.production" ]; then
  source .env.production
elif [ -f ".env" ]; then
  source .env
fi

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
HEALTH_ENDPOINT="${APP_URL}/api/health"

# Check if Docker services are running
echo -e "${YELLOW}Checking Docker services...${NC}"
if ! docker compose ps | grep -q "Up"; then
  echo -e "${RED}Error: Docker services are not running${NC}"
  exit 1
fi

echo -e "${GREEN}Docker services are running${NC}"

# Check database
echo -e "${YELLOW}Checking database...${NC}"
if docker compose exec -T stride-postgres pg_isready -U stride -d stride > /dev/null 2>&1; then
  echo -e "${GREEN}Database is healthy${NC}"
else
  echo -e "${RED}Error: Database health check failed${NC}"
  exit 1
fi

# Check web service health endpoint
echo -e "${YELLOW}Checking web service health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_ENDPOINT" || echo -e "\n000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}Health endpoint returned 200 OK${NC}"
  echo "Response: $HEALTH_BODY"
  
  # Parse health status from JSON response
  STATUS=$(echo "$HEALTH_BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
  if [ "$STATUS" = "healthy" ]; then
    echo -e "${GREEN}Application health status: healthy${NC}"
  elif [ "$STATUS" = "degraded" ]; then
    echo -e "${YELLOW}Application health status: degraded${NC}"
  elif [ "$STATUS" = "unhealthy" ]; then
    echo -e "${RED}Application health status: unhealthy${NC}"
    exit 1
  fi
else
  echo -e "${RED}Error: Health endpoint returned HTTP $HTTP_CODE${NC}"
  if [ -n "$HEALTH_BODY" ]; then
    echo "Response: $HEALTH_BODY"
  fi
  exit 1
fi

# Check web service logs for errors
echo -e "${YELLOW}Checking for errors in web service logs...${NC}"
RECENT_ERRORS=$(docker compose logs web --tail=50 | grep -i "error" | wc -l || echo "0")
if [ "$RECENT_ERRORS" -gt 0 ]; then
  echo -e "${YELLOW}Warning: Found $RECENT_ERRORS error(s) in recent logs${NC}"
  docker compose logs web --tail=50 | grep -i "error" | tail -n 5
else
  echo -e "${GREEN}No recent errors in web service logs${NC}"
fi

echo -e "${GREEN}All health checks passed!${NC}"
