#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."

# Extract host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\2|')

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

RETRIES=30
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null || [ $RETRIES -eq 0 ]; do
  echo "  Waiting for PostgreSQL at $DB_HOST:$DB_PORT... ($RETRIES attempts left)"
  RETRIES=$((RETRIES - 1))
  sleep 1
done

if [ $RETRIES -eq 0 ]; then
  echo "ERROR: Could not connect to PostgreSQL at $DB_HOST:$DB_PORT after 30 seconds"
  echo "Starting server anyway -- DB endpoints will return 503"
else
  echo "PostgreSQL is ready"

  echo "Running Prisma migrations..."
  npx prisma migrate deploy --schema=./prisma/schema.prisma
  echo "Migrations complete"

  if [ "${RUN_SEED:-false}" = "true" ]; then
    echo "Running database seed..."
    npx prisma db seed || echo "WARNING: Seed failed (non-fatal)"
  fi
fi

echo "Starting Ile Ase Backend on port ${PORT:-8080}..."
exec node dist/backend/src/main.js
