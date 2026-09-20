# Secret Rotation Runbook — Ilé Àṣẹ

This document explains how to safely rotate the platform's critical secrets.
Follow these procedures when a secret is compromised, about to expire, or as part of a scheduled rotation.

> Related: [DEPLOYMENT_PROCEDURES.md](DEPLOYMENT_PROCEDURES.md) · [FIRST_DEPLOY.md](FIRST_DEPLOY.md)

**Corrected September 20, 2026:** this whole runbook previously assumed a PM2-managed Node process on bare metal (`/home/ubuntu/ifa_app/...`, `pm2 reload`/`pm2 stop`/`pm2 start`) and listed `SENDGRID_API_KEY` as a real secret. Neither matches reality: production (`iluase-prod-single`) runs the backend as a Docker container managed by Docker Compose, at `/home/ubuntu/app/` (not `/home/ubuntu/ifa_app/`), and email is AWS SES via IAM credentials — there's no SendGrid API key anywhere in this codebase. Fixed below.

---

## Summary of Secrets and Impact

| Secret | Impact of Rotation | Downtime Required? |
|--------|-------------------|--------------------|
| `JWT_SECRET` | All active sessions invalidated — users must re-login | No (container recreate, seconds) |
| `JWT_REFRESH_SECRET` | All refresh tokens invalidated — users must re-login | No (container recreate, seconds) |
| `ENCRYPTION_KEY` | Encrypted DB fields become unreadable until re-encrypted | Yes (maintenance window) |
| `DATABASE_URL` password | App loses DB access until updated | No (container recreate, seconds) |
| AWS credentials (SES / S3) | Outgoing email and file uploads stop | No (container recreate, seconds) |
| `PAYSTACK_SECRET_KEY` / `FLUTTERWAVE_SECRET_KEY` | Payment endpoints fail | No (container recreate, seconds) |
| `SENTRY_DSN` | No effect currently — see note below; Sentry isn't initializing in production regardless of this value | N/A |

---

## 1. Rotating `JWT_SECRET` and `JWT_REFRESH_SECRET`

**Impact:** All currently logged-in users will be signed out and must re-login. This is expected and safe.

**Steps:**

```bash
# 1. Generate a new secret (do this for JWT_SECRET and JWT_REFRESH_SECRET separately)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Update the secret on the server (SSH or EC2 Instance Connect — see
#    DEPLOYMENT_PROCEDURES.md's "Real Production Deployment" for access)
nano /home/ubuntu/app/.env
# Replace JWT_SECRET=... with the new value

# 3. Recreate the backend container to pick it up
cd /home/ubuntu/app
sudo docker compose up -d --no-deps backend

# 4. Verify the backend is healthy
curl -sf https://iluase.com/api/health

# 5. Check logs for unexpected errors after the restart
sudo docker logs iluase-backend --since 2m
```

**Notes:**
- The old `JWT_SECRET` is no longer valid the moment the backend restarts — tokens signed with the old secret will be rejected, forcing users to re-authenticate.
- No database migration is required.
- Schedule this during low-traffic hours (e.g. 3–5 AM WAT) to minimise user disruption.

---

## 2. Rotating `ENCRYPTION_KEY`

> ⚠️ **This is the most sensitive rotation. Take a database backup first.**

**Impact:** The `ENCRYPTION_KEY` is used to encrypt sensitive fields (e.g. message content) stored in the database. Rotating it requires decrypting all encrypted fields with the old key and re-encrypting them with the new key. The app **cannot serve encrypted data** while the keys are mismatched.

**Recommended approach:** Maintenance window (brief planned downtime).

**Steps:**

```bash
# STEP 1 — Take a full database backup BEFORE anything else
# (on the box, or trigger the real automated backup script directly — see
# DEPLOYMENT_PROCEDURES.md's "Database Backup" section)
/home/ubuntu/app/backup-prod-db.sh
# Verify the dump landed in S3: aws s3 ls s3://ilu-ase-prod-db-backups-091653536932/

# STEP 2 — Stop the backend (maintenance window begins)
cd /home/ubuntu/app
sudo docker compose stop backend

# STEP 3 — Generate the new key (must be exactly 32 characters / 16 hex bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Example output: a3f8c2d1e0b94f67a1d2e3f4b5c6d7e8

# STEP 4 — Run the re-encryption migration script
#          This script reads OLD_ENCRYPTION_KEY, decrypts all fields,
#          then re-encrypts them with NEW_ENCRYPTION_KEY.
OLD_ENCRYPTION_KEY="<current-key>" \
NEW_ENCRYPTION_KEY="<new-key>" \
  node scripts/re-encrypt-fields.js
# NOTE: this script still does not exist (checked September 20, 2026 —
# unchanged since this doc was first written). Until it's built, the safest
# path is: take the backup (STEP 1), test the new key against a restored
# copy of the DB, and defer rotating the live key unless the old one is
# actually compromised.

# STEP 5 — Update the .env with the new key
nano /home/ubuntu/app/.env
# Replace ENCRYPTION_KEY=... with the new value

# STEP 6 — Restart the backend
sudo docker compose up -d --no-deps backend

# STEP 7 — Verify the app functions correctly (health check + test login)
curl -sf https://iluase.com/api/health

# STEP 8 — Monitor logs for decryption errors in the first 30 minutes
sudo docker logs iluase-backend -f
```

**Post-Launch TODO:** Build `backend/scripts/re-encrypt-fields.js` that:
1. Fetches all rows with encrypted fields
2. Decrypts each with `OLD_ENCRYPTION_KEY`
3. Re-encrypts each with `NEW_ENCRYPTION_KEY`
4. Updates the row in a transaction

Until that script exists, the safest rotation path is: take a backup → restore to a dev DB → test the new key → schedule a proper maintenance window with the script ready.

---

## 3. Rotating the Database Password

**Impact:** The app loses DB connectivity until the new password is in the backend's env and the container restarts.

**Corrected September 20, 2026:** the steps below previously referenced an RDS console and a PM2 process manager — neither applies. Real production (`iluase-prod-single`) runs a **self-hosted Postgres container** (`iluase-postgres`) managed by Docker Compose, not RDS; RDS was retired platform-wide March 25, 2026. The backend also runs as a Docker container, not under PM2.

**Steps** (via SSH or EC2 Instance Connect, see `DEPLOYMENT_PROCEDURES.md`'s "Real Production Deployment" section for access):

```bash
# 1. Change the password inside the self-hosted Postgres container
sudo docker exec -it iluase-postgres psql -U <admin_user> -c \
  "ALTER USER <db_user> PASSWORD 'new-strong-password';"

# 2. Update DATABASE_URL in /home/ubuntu/app/.env on the box
#    (change only the password component of the connection string —
#    the host stays "postgres", the docker-compose service name, not an RDS endpoint)

# 3. Recreate the backend container to pick up the new env value
cd /home/ubuntu/app
sudo docker compose up -d --no-deps backend

# 4. Verify connectivity
curl -sf https://iluase.com/api/health
sudo docker logs iluase-backend --since 1m   # should show "Connected to PostgreSQL", no auth errors
```

---

## 4. Rotating Payment API Keys (Paystack / Flutterwave)

**Impact:** Payment endpoints return errors until the new key is live.

**Steps:**
1. Log in to the Paystack/Flutterwave dashboard
2. Generate a new secret key (the old key remains valid briefly — check provider policy)
3. Update `PAYSTACK_SECRET_KEY`/`PAYSTACK_WEBHOOK_SECRET` or `FLUTTERWAVE_SECRET_KEY`/`FLUTTERWAVE_SECRET_HASH` in `/home/ubuntu/app/.env` on the box
4. Recreate the backend container: `cd /home/ubuntu/app && sudo docker compose up -d --no-deps backend`
5. Make a small test payment to verify the new key works
6. Revoke the old key in the dashboard

---

## 5. Rotating Other Secrets (AWS credentials, Sentry, Agora)

For all other API keys/credentials, the process is the same. There's no SendGrid anywhere in this codebase — email is AWS SES via the box's IAM role/credentials, not a standalone API key.

1. Generate a new key/credential in the provider's dashboard (or rotate the IAM access key for AWS-backed ones)
2. Update the value in `/home/ubuntu/app/.env` on the box (and `frontend/.env.production` + rebuild for frontend-side `VITE_*` keys)
3. Recreate the backend container: `cd /home/ubuntu/app && sudo docker compose up -d --no-deps backend`
4. Verify the feature works with the new key
5. Revoke the old key in the provider's dashboard

---

## 6. Scheduled Rotation Recommendations

| Secret | Rotation Frequency |
|--------|-------------------|
| `JWT_SECRET` | Every 90 days, or immediately on suspected compromise |
| `JWT_REFRESH_SECRET` | Every 90 days, or immediately on suspected compromise |
| `ENCRYPTION_KEY` | Only on suspected compromise (requires maintenance window) |
| Database password | Every 180 days |
| Payment API keys | On provider's recommendation, or on suspected compromise |
| AWS credentials (SES/S3) | Per your IAM key-rotation policy, or on suspected compromise |

---

## 7. After Any Rotation

- [ ] Verify `/api/health` returns `{"status":"ok"}`
- [ ] Test login (JWT rotation) or a payment (payment key rotation)
- [ ] Check `docker logs iluase-backend` for new errors in the 30 minutes following rotation — Sentry isn't currently a reliable signal for this (see `DEPLOYMENT_PROCEDURES.md`'s Post-Deployment Verification note: `SentryInitializerService` fails to initialize in production as of September 20, 2026)
- [ ] Update the secret in all environments (local, and production separately — the remote staging box's reachability is currently unconfirmed, see `DEPLOYMENT_PROCEDURES.md`)
- [ ] Note the rotation date in your internal security log
- [ ] Verify CI/CD still has the correct secrets set in GitHub Secrets (if used in CI)
