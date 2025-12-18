#!/bin/bash
# Script to run Prisma migrations with environment variables loaded from project root
set -e

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$PACKAGE_DIR/../.." && pwd)"

# Load environment variables from project root .env file
if [ -f "$PROJECT_ROOT/.env" ]; then
  # Use a safer method to export variables
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Please check your .env file."
  exit 1
fi

echo "Using DATABASE_URL: ${DATABASE_URL%%@*}@***" # Mask password in output

# Run the migration command
cd "$PACKAGE_DIR"

# Check if first argument is "deploy" for production migrations
if [ "$1" = "deploy" ]; then
  shift # Remove "deploy" from arguments
  exec npx prisma migrate deploy "$@"
else
  exec npx prisma migrate dev "$@"
fi
