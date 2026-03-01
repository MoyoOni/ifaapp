#!/bin/bash
# ============================================================
# Database Backup Script for Ìlú Àṣẹ Platform
#
# Creates timestamped PostgreSQL backups, compresses them,
# and retains only the last N days of backups.
#
# Usage:
#   chmod +x scripts/backup-db.sh
#   ./scripts/backup-db.sh                  # Manual run
#
# Cron (add with: crontab -e):
#   # Daily at 2 AM
#   0 2 * * * /home/ubuntu/ifa_app/scripts/backup-db.sh >> /var/log/ilu-ase/backup.log 2>&1
#
#   # Every 6 hours (recommended for production)
#   0 */6 * * * /home/ubuntu/ifa_app/scripts/backup-db.sh >> /var/log/ilu-ase/backup.log 2>&1
# ============================================================

set -euo pipefail

# --- Configuration ---
BACKUP_DIR="/home/ubuntu/backups/ilu-ase"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ilu-ase_${TIMESTAMP}.sql.gz"
LOG_PREFIX="[BACKUP $(date '+%Y-%m-%d %H:%M:%S')]"

# Load database URL from backend .env
ENV_FILE="/home/ubuntu/ifa_app/backend/.env"

# --- Functions ---
log_info() {
    echo "${LOG_PREFIX} INFO: $1"
}

log_error() {
    echo "${LOG_PREFIX} ERROR: $1" >&2
}

log_success() {
    echo "${LOG_PREFIX} SUCCESS: $1"
}

# --- Validate environment ---
if [ ! -f "$ENV_FILE" ]; then
    log_error "Backend .env file not found at ${ENV_FILE}"
    exit 1
fi

# Extract DATABASE_URL from .env
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not found in ${ENV_FILE}"
    exit 1
fi

# Parse DATABASE_URL: postgresql://user:pass@host:port/dbname?params
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^@]*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^/]*/\([^?]*\).*|\1|p')

if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
    log_error "Could not parse DATABASE_URL"
    exit 1
fi

# --- Create backup directory ---
mkdir -p "$BACKUP_DIR"

# --- Run backup ---
log_info "Starting backup of database '${DB_NAME}' on ${DB_HOST}:${DB_PORT}..."

export PGPASSWORD="$DB_PASS"

if pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    --compress=6 \
    --no-owner \
    --no-privileges \
    --verbose 2>/dev/null \
    | gzip > "$BACKUP_FILE"; then

    unset PGPASSWORD

    # Verify backup file exists and has content
    BACKUP_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)

    if [ "$BACKUP_SIZE" -gt 100 ]; then
        log_success "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE} bytes)"
    else
        log_error "Backup file is suspiciously small (${BACKUP_SIZE} bytes). Check database connection."
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    unset PGPASSWORD
    log_error "pg_dump failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# --- Cleanup old backups ---
log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "ilu-ase_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
log_info "Removed ${DELETED_COUNT} old backup(s)"

# --- Summary ---
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "ilu-ase_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log_success "Backup complete. Total backups: ${TOTAL_BACKUPS}, Total size: ${TOTAL_SIZE}"

# --- Optional: Upload to S3 ---
# Uncomment and configure if using AWS S3 for offsite backups:
#
# S3_BUCKET="s3://ilu-ase-backups/database/"
# if command -v aws &> /dev/null; then
#     log_info "Uploading to S3: ${S3_BUCKET}"
#     aws s3 cp "$BACKUP_FILE" "$S3_BUCKET"
#     log_success "S3 upload complete"
# fi
