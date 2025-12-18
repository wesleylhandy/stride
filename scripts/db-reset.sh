#!/bin/bash
# Script to reset the Stride PostgreSQL database (WARNING: Deletes all data!)
# Usage: ./scripts/db-reset.sh

set -e

read -p "⚠️  This will DELETE ALL DATA in the database. Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "Stopping and removing database container..."
docker compose down -v stride-postgres

echo "Starting fresh database..."
docker compose up -d stride-postgres

# Wait for database to be ready
echo "Waiting for database to be ready..."
timeout=30
counter=0
until docker compose exec -T stride-postgres pg_isready -U stride -d stride > /dev/null 2>&1; do
  sleep 1
  counter=$((counter + 1))
  if [ $counter -ge $timeout ]; then
    echo "Error: Database failed to start within ${timeout} seconds"
    exit 1
  fi
done

echo "✓ Database reset complete!"
echo ""
echo "Now run migrations:"
echo "  pnpm --filter @stride/database db:migrate"

