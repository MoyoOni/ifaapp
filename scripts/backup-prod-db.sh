#!/bin/bash
# ============================================================
# Production database backup — iluase-prod-single
#
# Postgres is self-hosted in the "iluase-postgres" Docker container on
# this box's own EBS volume (not RDS — there's no automated backup
# mechanism unless this script runs). Dumps via `docker exec` +
# `pg_dump`, uploads to S3, keeps a short local retention window as a
# fast-restore cache, and relies on the bucket's own 90-day lifecycle
# policy for long-term retention.
#
# Live on iluase-prod-single at /home/ubuntu/app/backup-prod-db.sh,
# installed September 20, 2026 (previously: no automated backup existed
# at all for this box's self-hosted Postgres). This copy in the repo is
# for version control / disaster-recovery reference — if you edit it,
# also scp the updated copy to the box.
#
# Full setup (already done once on iluase-prod-single; documented here
# for reproducing on a replacement box):
#   1. S3 bucket: aws s3api create-bucket --bucket ilu-ase-prod-db-backups-091653536932 --region us-east-1
#      (+ put-public-access-block, put-bucket-encryption AES256,
#      put-bucket-versioning Enabled, and a lifecycle rule expiring
#      objects after 90 days / noncurrent versions after 30)
#   2. IAM: the box's instance role (iluase-ec2-ecr) needs an inline
#      policy granting s3:PutObject/GetObject/ListBucket scoped to that
#      bucket's ARN + /* — it only had ECR read-only before this.
#   3. Copy this script to /home/ubuntu/app/backup-prod-db.sh, chmod +x
#   4. crontab -e (as ubuntu):
#        0 */6 * * * /home/ubuntu/app/backup-prod-db.sh >> /home/ubuntu/backup.log 2>&1
# ============================================================

set -euo pipefail

BUCKET="ilu-ase-prod-db-backups-091653536932"
BACKUP_DIR="/home/ubuntu/db-backups"
LOCAL_RETENTION=4   # keep the last N dumps on-disk; S3 handles long-term retention
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/iluase_production_${TIMESTAMP}.sql.gz"
LOG_PREFIX="[BACKUP $(date '+%Y-%m-%d %H:%M:%S')]"

log_info()    { echo "${LOG_PREFIX} INFO: $1"; }
log_error()   { echo "${LOG_PREFIX} ERROR: $1" >&2; }
log_success() { echo "${LOG_PREFIX} SUCCESS: $1"; }

mkdir -p "$BACKUP_DIR"

if ! sudo docker ps --filter name=iluase-postgres --filter status=running -q | grep -q .; then
  log_error "iluase-postgres container is not running — aborting backup"
  exit 1
fi

log_info "Dumping iluase_production from iluase-postgres..."
if ! sudo docker exec iluase-postgres pg_dump -U iluase_admin iluase_production | gzip > "$BACKUP_FILE"; then
  log_error "pg_dump failed"
  rm -f "$BACKUP_FILE"
  exit 1
fi

DUMP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log_success "Dump complete: ${BACKUP_FILE} (${DUMP_SIZE})"

log_info "Uploading to s3://${BUCKET}/..."
if ! aws s3 cp "$BACKUP_FILE" "s3://${BUCKET}/$(basename "$BACKUP_FILE")" --only-show-errors; then
  log_error "S3 upload failed — dump retained locally at ${BACKUP_FILE} for manual recovery"
  exit 1
fi
log_success "Uploaded to S3"

# Local retention: keep only the most recent N dumps on-disk
cd "$BACKUP_DIR"
ls -1t iluase_production_*.sql.gz 2>/dev/null | tail -n +$((LOCAL_RETENTION + 1)) | while read -r old; do
  log_info "Removing old local backup: ${old}"
  rm -f "${old}"
done

log_success "Backup cycle complete"
