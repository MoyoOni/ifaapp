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

in_s3() { aws s3api head-object --bucket "$BUCKET" --key "$1" >/dev/null 2>&1; }

cd "$BACKUP_DIR"

# Catch-up: upload any earlier dump whose upload failed. From 2026-10-20 to
# 10-26 the box's instance-role credentials were unavailable, every upload
# failed, and those dumps never reached S3.
for f in iluase_production_*.sql.gz; do
  [ -e "$f" ] || continue
  if ! in_s3 "$f"; then
    if aws s3 cp "$f" "s3://${BUCKET}/${f}" --only-show-errors; then
      log_success "Caught up earlier dump: ${f}"
    else
      log_error "Catch-up upload failed for ${f} (kept locally)"
    fi
  fi
done

# Local retention: keep the most recent N dumps on-disk, and never delete one
# that isn't confirmed in S3. This used to delete by age alone -- on 10-27 it
# removed every 10-19..10-26 dump, none of which had ever been uploaded.
ls -1t iluase_production_*.sql.gz 2>/dev/null | tail -n +$((LOCAL_RETENTION + 1)) | while read -r old; do
  if in_s3 "$old"; then
    log_info "Removing old local backup: ${old}"
    rm -f "${old}"
  else
    log_error "Keeping ${old}: not confirmed in S3"
  fi
done

# Heartbeat for alerting: a CloudWatch alarm on this metric going missing is
# what catches a silent week of failures (nothing alerted on 10-20..10-26).
# Best-effort -- needs cloudwatch:PutMetricData on the instance role.
if aws cloudwatch put-metric-data --region us-east-1 --namespace Iluase/Backups \
     --metric-name BackupSucceeded --value 1 --unit Count 2>/dev/null; then
  log_info "Heartbeat metric sent"
else
  log_error "Could not send heartbeat metric (check instance role permissions)"
fi

log_success "Backup cycle complete"
