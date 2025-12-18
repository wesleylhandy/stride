#!/bin/bash
# Script to start the Stride PostgreSQL database
# Usage: ./scripts/db-start.sh

set -e

echo "Starting Stride PostgreSQL database..."

# Start the database container
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

echo "✓ Database is ready!"
echo ""
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: stride"
echo "  User: stride"
echo "  Password: stride_dev_password"
echo ""
echo "Connection string:"
echo "  DATABASE_URL=postgresql://stride:stride_dev_password@localhost:5433/stride"
echo ""
echo "To view logs: docker compose logs -f stride-postgres"
echo "To stop: docker compose stop stride-postgres"
echo "To remove: docker compose down stride-postgres"

