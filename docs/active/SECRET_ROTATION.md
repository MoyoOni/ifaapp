# Secret Rotation Runbook — Ilé Àṣẹ

This document explains how to safely rotate the platform's critical secrets.
Follow these procedures when a secret is compromised, about to expire, or as part of a scheduled rotation.

> Related: [DEPLOYMENT_PROCEDURES.md](DEPLOYMENT_PROCEDURES.md) · [FIRST_DEPLOY.md](FIRST_DEPLOY.md)

---

## Summary of Secrets and Impact

| Secret | Impact of Rotation | Downtime Required? |
|--------|-------------------|--------------------|
| `JWT_SECRET` | All active sessions invalidated — users must re-login | No (rolling restart) |
| `JWT_REFRESH_SECRET` | All refresh tokens invalidated — users must re-login | No (rolling restart) |
| `ENCRYPTION_KEY` | Encrypted DB fields become unreadable until re-encrypted | Yes (maintenance window) |
| `DATABASE_URL` password | App loses DB access until updated | No (rolling restart) |
| `SENDGRID_API_KEY` | Outgoing email stops | No (rolling restart) |
| `PAYSTACK_SECRET_KEY` | Payment endpoints fail | No (rolling restart) |
| `SENTRY_DSN` | Error reporting stops | No (rolling restart) |

---

## 1. Rotating `JWT_SECRET` and `JWT_REFRESH_SECRET`

**Impact:** All currently logged-in users will be signed out and must re-login. This is expected and safe.

**Steps:**

```bash
# 1. Generate a new secret (do this for JWT_SECRET and JWT_REFRESH_SECRET separately)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Update the secret on the server
nano /home/ubuntu/ifa_app/backend/.env
# Replace JWT_SECRET=... with the new value

# 3. Restart the backend gracefully (PM2)
pm2 reload ilu-ase-backend --update-env

# 4. Verify the backend is healthy
curl http://localhost:3000/api/health

# 5. Confirm in Sentry/logs that no unexpected errors appeared after restart
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
./scripts/backup-db.sh
# Verify the backup file exists and is non-zero in S3 or local storage

# STEP 2 — Stop the backend (maintenance window begins)
pm2 stop ilu-ase-backend

# STEP 3 — Generate the new key (must be exactly 32 characters / 16 hex bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Example output: a3f8c2d1e0b94f67a1d2e3f4b5c6d7e8

# STEP 4 — Run the re-encryption migration script
#          This script reads OLD_ENCRYPTION_KEY, decrypts all fields,
#          then re-encrypts them with NEW_ENCRYPTION_KEY.
cd /home/ubuntu/ifa_app/backend
OLD_ENCRYPTION_KEY="<current-key>" \
NEW_ENCRYPTION_KEY="<new-key>" \
  node scripts/re-encrypt-fields.js
# NOTE: This script does not yet exist — see "Post-Launch TODO" below.
# For the current launch, document the old key and defer until script is built.

# STEP 5 — Update the .env with the new key
nano /home/ubuntu/ifa_app/backend/.env
# Replace ENCRYPTION_KEY=... with the new value

# STEP 6 — Restart the backend
pm2 start ilu-ase-backend

# STEP 7 — Verify the app functions correctly (health check + test login)
curl http://localhost:3000/api/health

# STEP 8 — Monitor Sentry for decryption errors in the first 30 minutes
```

**Post-Launch TODO:** Build `backend/scripts/re-encrypt-fields.js` that:
1. Fetches all rows with encrypted fields
2. Decrypts each with `OLD_ENCRYPTION_KEY`
3. Re-encrypts each with `NEW_ENCRYPTION_KEY`
4. Updates the row in a transaction

Until that script exists, the safest rotation path is: take a backup → restore to a dev DB → test the new key → schedule a proper maintenance window with the script ready.

---

## 3. Rotating the Database Password

**Impact:** The app loses DB connectivity until the new password is in `.env` and the backend restarts.

**Steps:**

```bash
# 1. Change the password in PostgreSQL (or RDS console)
#    In RDS: AWS Console → RDS → your instance → Modify → Master password
#    Or via psql:
psql -h <host> -U postgres -c "ALTER USER ilease_user PASSWORD 'new-strong-password';"

# 2. Update DATABASE_URL in backend/.env
#    Change the password component in the connection string:
#    postgresql://ilease_user:<new-password>@host:5432/ilease

# 3. Reload the backend (zero-downtime if PM2 cluster mode)
pm2 reload ilu-ase-backend --update-env

# 4. Verify connectivity
curl http://localhost:3000/api/health/detailed
# Should show "database": "connected"
```

---

## 4. Rotating Payment API Keys (Paystack / Flutterwave)

**Impact:** Payment endpoints return errors until the new key is live.

**Steps:**
1. Log in to the Paystack/Flutterwave dashboard
2. Generate a new secret key (the old key remains valid briefly — check provider policy)
3. Update `PAYSTACK_SECRET_KEY` or `FLUTTERWAVE_SECRET_KEY` in `backend/.env`
4. Reload the backend: `pm2 reload ilu-ase-backend --update-env`
5. Make a small test payment to verify the new key works
6. Revoke the old key in the dashboard

---

## 5. Rotating Other Secrets (SendGrid, Sentry, Agora)

For all other API keys, the process is the same:
1. Generate a new key in the provider's dashboard
2. Update the value in `backend/.env` (and `frontend/.env` for frontend-side keys)
3. Reload the backend: `pm2 reload ilu-ase-backend --update-env`
   Rebuild and redeploy the frontend if a `VITE_*` variable changed
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
| `SENDGRID_API_KEY` | On suspected compromise |

---

## 7. After Any Rotation

- [ ] Verify `/api/health` returns `{"status":"ok"}`
- [ ] Test login (JWT rotation) or a payment (payment key rotation)
- [ ] Check Sentry for new errors in the 30 minutes following rotation
- [ ] Update the secret in all environments (staging and production separately)
- [ ] Note the rotation date in your internal security log
- [ ] Verify CI/CD still has the correct secrets set in GitHub Secrets (if used in CI)
