#!/bin/bash
# Database restore script for Stride
#
# Restores a database backup
#
# Usage: ./scripts/deploy/restore-db.sh <backup-file>
#
# WARNING: This will replace all existing data in the database!

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

# Check arguments
if [ $# -lt 1 ]; then
  echo -e "${RED}Error: Backup file not specified${NC}"
  echo "Usage: $0 <backup-file>"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${RED}WARNING: This will replace all existing data in the database!${NC}"
read -p "Are you sure you want to continue? (yes/NO) " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Restore cancelled"
  exit 0
fi

echo -e "${YELLOW}Restoring database from backup...${NC}"

# Source environment variables
if [ -f ".env.production" ]; then
  source .env.production
elif [ -f ".env" ]; then
  source .env
fi

# Check if database container is running
if ! docker compose ps stride-postgres | grep -q "Up"; then
  echo -e "${RED}Error: Database container is not running${NC}"
  exit 1
fi

# Decompress if gzipped
TEMP_BACKUP=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo -e "${YELLOW}Decompressing backup...${NC}"
  TEMP_BACKUP=$(mktemp)
  gunzip -c "$BACKUP_FILE" > "$TEMP_BACKUP"
  BACKUP_FILE="$TEMP_BACKUP"
fi

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
docker compose exec -T stride-postgres psql -U stride -d stride < "$BACKUP_FILE"

# Cleanup temp file
if [ -n "$TEMP_BACKUP" ]; then
  rm -f "$TEMP_BACKUP"
fi

echo -e "${GREEN}Database restored successfully!${NC}"

# Run migrations to ensure schema is up to date
echo -e "${YELLOW}Running migrations to ensure schema is up to date...${NC}"
docker compose exec -T web pnpm --filter @stride/database prisma migrate deploy || {
  echo -e "${YELLOW}Warning: Migrations may have failed (this is normal if backup already includes latest schema)${NC}"
}

echo -e "${GREEN}Restore completed!${NC}"
