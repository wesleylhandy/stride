#!/bin/bash
# Database backup script for Stride
#
# Creates a timestamped backup of the PostgreSQL database
#
# Usage: ./scripts/deploy/backup-db.sh [backup-directory]

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

# Set backup directory
BACKUP_DIR="${1:-./backups}"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/stride_db_backup_${TIMESTAMP}.sql"

echo -e "${YELLOW}Creating database backup...${NC}"

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

# Create backup
echo -e "${YELLOW}Dumping database to ${BACKUP_FILE}...${NC}"
docker compose exec -T stride-postgres pg_dump -U stride -d stride > "$BACKUP_FILE"

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo -e "${GREEN}Database backup created successfully!${NC}"
echo "Backup file: $BACKUP_FILE"
echo "Backup size: $BACKUP_SIZE"

# Optional: Keep only last N backups
if [ -n "${KEEP_BACKUPS:-}" ] && [ "$KEEP_BACKUPS" -gt 0 ]; then
  echo -e "${YELLOW}Cleaning up old backups (keeping last $KEEP_BACKUPS)...${NC}"
  ls -t "${BACKUP_DIR}"/stride_db_backup_*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
fi
