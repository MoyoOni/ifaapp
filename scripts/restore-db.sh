#!/bin/bash
# ============================================================
# Database Restore Script for Ìlú Àṣẹ Platform
#
# Restores a PostgreSQL backup created by backup-db.sh
#
# Usage:
#   ./scripts/restore-db.sh                          # Lists available backups
#   ./scripts/restore-db.sh <backup-file>            # Restores specific backup
#   ./scripts/restore-db.sh --latest                 # Restores most recent backup
# ============================================================

set -euo pipefail

BACKUP_DIR="/home/ubuntu/backups/ilu-ase"
ENV_FILE="/home/ubuntu/ifa_app/backend/.env"

# --- Functions ---
log_info() {
    echo "[RESTORE $(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_error() {
    echo "[RESTORE $(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

log_success() {
    echo "[RESTORE $(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1"
}

# --- No args: list available backups ---
if [ $# -eq 0 ]; then
    echo ""
    echo "Available backups:"
    echo "-------------------"
    if [ -d "$BACKUP_DIR" ]; then
        ls -lhrt "$BACKUP_DIR"/ilu-ase_*.sql.gz 2>/dev/null || echo "  No backups found in $BACKUP_DIR"
    else
        echo "  Backup directory does not exist: $BACKUP_DIR"
    fi
    echo ""
    echo "Usage:"
    echo "  $0 <backup-file>    # Restore a specific backup"
    echo "  $0 --latest         # Restore the most recent backup"
    echo ""
    exit 0
fi

# --- Determine backup file ---
if [ "$1" = "--latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/ilu-ase_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        log_error "No backups found in $BACKUP_DIR"
        exit 1
    fi
    log_info "Using latest backup: $BACKUP_FILE"
else
    BACKUP_FILE="$1"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# --- Load database config ---
if [ ! -f "$ENV_FILE" ]; then
    log_error "Backend .env not found at $ENV_FILE"
    exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^@]*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^/]*/\([^?]*\).*|\1|p')

# --- Safety confirmation ---
echo ""
echo "========================================"
echo "  WARNING: DATABASE RESTORE"
echo "========================================"
echo "  Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo "  Backup:   ${BACKUP_FILE}"
echo "  This will OVERWRITE the current database!"
echo "========================================"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
    log_info "Restore cancelled."
    exit 0
fi

# --- Stop the application ---
log_info "Stopping application..."
pm2 stop ilu-ase-backend 2>/dev/null || true

# --- Restore ---
log_info "Restoring database from backup..."
export PGPASSWORD="$DB_PASS"

# Decompress and restore
gunzip -c "$BACKUP_FILE" | pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --verbose 2>&1 | tail -5

unset PGPASSWORD

# --- Restart the application ---
log_info "Restarting application..."
pm2 start ilu-ase-backend 2>/dev/null || true

log_success "Database restored from: ${BACKUP_FILE}"
echo ""
echo "Verify with: curl http://localhost:3000/health"
