#!/bin/bash
# Script to stop the Stride PostgreSQL database
# Usage: ./scripts/db-stop.sh

set -e

echo "Stopping Stride PostgreSQL database..."
docker compose stop stride-postgres
echo "✓ Database stopped"

