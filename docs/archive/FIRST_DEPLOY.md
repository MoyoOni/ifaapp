# First Production Deploy Guide — Ilé Àṣẹ

This document covers the exact steps to bring up Ilé Àṣẹ for the first time on a fresh server. Follow the steps in order.

For subsequent deploys, use `scripts/deploy.sh`. This document is for the **very first** time only.

> See also: [DEPLOYMENT_PROCEDURES.md](DEPLOYMENT_PROCEDURES.md) for full staging → production runbook.

---

## Prerequisites

Before starting, confirm you have:

- [ ] Server provisioned (EC2 / VPS) with Node.js 20+
- [ ] PostgreSQL 16 accessible (RDS or local)
- [ ] Redis accessible (ElastiCache or local)
- [ ] All environment variables ready (see `backend/.env.example` and `frontend/.env.example`)
- [ ] Domain DNS pointing to the server (for SSL)
- [ ] SSL certificate in place (or nginx configured for HTTP-only first deploy)
- [ ] SSH access to the server

---

## Step 1 — Clone the Repository

```bash
cd /home/ubuntu
git clone <repo-url> ifa_app
cd ifa_app
git checkout main          # or the branch you are deploying
```

---

## Step 2 — Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env          # Fill in all required values

# Frontend
cp frontend/.env.example frontend/.env
nano frontend/.env         # Fill in VITE_API_URL, VITE_GOOGLE_CLIENT_ID, etc.
```

### Critical variables to set before continuing

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full Postgres connection string with `connection_limit=10` |
| `JWT_SECRET` | 64-char random hex — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Same generation command, different value |
| `ENCRYPTION_KEY` | Exactly 32 chars — `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` |
| `SENTRY_DSN` | From your Sentry project settings |
| `FRONTEND_URL` | e.g. `https://app.ilu-ase.com` |
| `NODE_ENV` | Must be `production` |
| `VITE_API_URL` | e.g. `https://app.ilu-ase.com/api` |
| `VITE_DEMO_MODE` | Must be `false` |

---

## Step 3 — Install Dependencies

```bash
cd /home/ubuntu/ifa_app

# Common package (shared types)
cd common && npm ci && cd ..

# Backend
cd backend && npm ci && cd ..

# Frontend
cd frontend && npm ci && cd ..
```

---

## Step 4 — Run Database Migrations

```bash
cd /home/ubuntu/ifa_app/backend

# Apply all migrations (idempotent — safe to re-run)
npx prisma migrate deploy

# Verify migrations applied
npx prisma migrate status
```

Expected output: all migrations listed as `Applied`.

---

## Step 5 — Bootstrap the First Admin User

The database is empty on first deploy. Create the first admin account so you can log in and manage the platform.

```bash
cd /home/ubuntu/ifa_app

# Set bootstrap credentials (use values from your .env)
export DATABASE_URL="$(grep DATABASE_URL backend/.env | cut -d= -f2-)"
export BOOTSTRAP_ADMIN_EMAIL="admin@ilu-ase.com"
export BOOTSTRAP_ADMIN_PASSWORD="your-strong-password-min-12-chars"

# Run bootstrap (idempotent — safe to run again if something fails)
./scripts/bootstrap-production.sh
```

**After bootstrap:**
- Log in at `/login` with the admin credentials
- Immediately change the password in `/settings`
- Remove `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` from your `.env` file

---

## Step 6 — Build the Application

```bash
cd /home/ubuntu/ifa_app

# Build backend
cd backend && npm run build && cd ..

# Build frontend
cd frontend && npm run build && cd ..
```

---

## Step 7 — Start the Backend with PM2

```bash
cd /home/ubuntu/ifa_app/backend

# Install PM2 globally if not already installed
npm install -g pm2

# Start backend
pm2 start dist/main.js --name ilu-ase-backend

# Save PM2 process list so it restarts on server reboot
pm2 save
pm2 startup   # Follow the printed instructions to enable auto-start
```

Verify the backend is running:
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## Step 8 — Serve the Frontend with nginx

Configure nginx to:
1. Serve the frontend build from `frontend/dist/`
2. Proxy `/api/*` requests to the backend on port 3000

See `docker/nginx.staging.conf` for a reference nginx configuration.

```bash
# Copy frontend build to nginx's web root (or serve directly from dist/)
sudo cp -r frontend/dist/* /var/www/html/

# Test nginx config and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 9 — Verify the Deployment

Run through these checks manually:

```bash
# 1. Health endpoint
curl https://app.ilu-ase.com/api/health

# 2. Detailed health (DB + Redis)
curl https://app.ilu-ase.com/api/health/detailed
```

Then in the browser:
- [ ] Navigate to `https://app.ilu-ase.com` — landing page loads
- [ ] Navigate to `/login` — login form loads
- [ ] Sign in with the bootstrap admin credentials
- [ ] Confirm `/admin` dashboard is accessible
- [ ] Confirm HTTPS (padlock) is shown in the browser

---

## Step 10 — Schedule Automated Backups

```bash
# Edit crontab
crontab -e

# Add hourly backup (runs at :00 every hour)
0 * * * * /home/ubuntu/ifa_app/scripts/backup-db.sh >> /var/log/ilu-ase-backup.log 2>&1
```

Verify by running manually:
```bash
./scripts/backup-db.sh
# Should print "Backup completed" and upload to S3 (if S3_BACKUP_BUCKET is set)
```

---

## Step 11 — Post-Deploy Cleanup

After confirming the deployment works:

1. Remove bootstrap credentials from `.env`:
   ```bash
   # Remove these two lines from backend/.env
   # BOOTSTRAP_ADMIN_EMAIL=...
   # BOOTSTRAP_ADMIN_PASSWORD=...
   ```

2. Change the admin password in `/settings`

3. Run the full smoke test checklist in [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md)

---

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| `prisma migrate deploy` fails | Check `DATABASE_URL` is correct and Postgres is reachable |
| Backend starts but `/api/health` returns error | Check `PM2` logs: `pm2 logs ilu-ase-backend` |
| Frontend shows blank page | Check browser console; verify `VITE_API_URL` is not localhost |
| Cannot log in with bootstrap admin | Re-run `bootstrap-production.sh` — it is idempotent |
| Email verification links don't work | Verify `FRONTEND_URL` in `backend/.env` matches your actual domain |

For further help, see [DEPLOYMENT_PROCEDURES.md](DEPLOYMENT_PROCEDURES.md) and the incident runbook.
