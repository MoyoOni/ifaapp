# 🚀 Deployment Procedures — Ìlú Àṣẹ Platform

**Version:** 1.3
**Last Updated:** September 20, 2026
**Production:** https://iluase.com (LIVE)

**Correction, September 18, 2026:** this doc's "Production Deployment" section previously described AWS ECS Fargate, Kubernetes, and Vercel as deploy targets, and its env var template listed Stripe. None of that matches reality and following it would either do nothing or fail outright. Real production is a **single EC2 instance** (`iluase-prod-single`) behind CloudFront, running Docker Compose (`postgres`, `redis`, `backend`, `nginx`, `proxy` services) with images pulled from ECR — no ECS, no Kubernetes, no Vercel, no Stripe (payments are Paystack + Flutterwave; email is AWS SES, not SendGrid). The "Real Production Deployment" section below reflects that and is verified against actual deploys performed this session. `AWS_SETUP_GUIDE.md` describes an earlier ECS-based architecture that was retired March 25, 2026 — don't cross-reference it for current deploy steps (it now carries its own stale banner too).

**Correction, September 20, 2026:** a pass through the rest of this doc found several more sections that survived the September 18 correction unedited — a "Staging Deployment" walkthrough built around a git branch (`v4/quality`) that no longer exists, a frontend env template with the wrong API domain, a "production Redis" note that still says to use ElastiCache (retired along with everything else in March), Post-Deployment Verification steps referencing APM tooling (Datadog/New Relic) that was never set up and a Sentry error-rate check when Sentry isn't actually initializing in production, and Log Rotation/Disk Space steps written for a bare-metal deployment instead of the real Docker Compose one. All fixed below; each fix is marked with what was checked to confirm it.

---

## 📋 Table of Contents

0. [Local Development (Docker)](#local-development-docker)
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Staging Locally (Docker)](#staging-locally-docker)
4. [Staging Deployment](#staging-deployment-remote-ec2-box) / [Real Production Deployment](#real-production-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)

---

## Local Development (Docker)

The **only** Docker container that should be running during normal local development is `ifa-postgres`.

```
ifa-postgres   port 5432   DB: ifa_app   (always running, healthy)
```

### Start local DB

```bash
# One-time: creates postgres container
docker run -d \
  --name ifa-postgres \
  -e POSTGRES_DB=ifa_app \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:16-alpine
```

If it already exists but is stopped:
```bash
docker start ifa-postgres
```

### Start backend & frontend (no Docker — hot reload)

```bash
# Terminal 1 — backend
cd backend && npm run start:dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Backend `.env` for local dev:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ifa_app"
REDIS_URL=redis://localhost:6379   # optional — only needed for WebSocket scaling
```

### Verify local state

```bash
docker ps   # should show only ifa-postgres (Up, healthy)
```

---

## Staging Locally (Docker)

**What is staging locally?** It's a full production-like stack running on your machine — Postgres + Redis + compiled backend + Nginx — all in Docker, isolated from your local dev setup. It mirrors what runs on the AWS EC2 staging server (http://100.52.200.113:4040).

**When to use it:**
- Testing Dockerised builds before pushing to ECR
- Verifying migrations on a clean DB
- Testing Nginx config changes
- QA sessions that need a stable (non-hot-reload) environment

**When NOT to use it:** Day-to-day development. Use the local dev setup above instead — it's faster and has hot reload.

### Port map (staging avoids clashing with local dev)

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL 16 | `ilu-ase-staging-postgres` | 5433 (host) → 5432 |
| Redis 7 | `ilu-ase-staging-redis` | 6380 (host) → 6379 |
| NestJS backend | `ilu-ase-staging-backend` | 8080 |
| Nginx (frontend) | `ilu-ase-staging-nginx` | **4040** ← browse here |

### Spin up

```bash
# From project root — starts all 4 containers together
docker-compose -f docker-compose.staging.yml up -d

# Watch logs
docker-compose -f docker-compose.staging.yml logs -f backend

# Tear down (keeps data volumes)
docker-compose -f docker-compose.staging.yml down

# Tear down + wipe DB (clean slate)
docker-compose -f docker-compose.staging.yml down -v
```

Then open http://localhost:4040

### Clean up staging containers when done

```bash
docker-compose -f docker-compose.staging.yml down
```

**Never leave staging containers running without their full stack** — an orphaned backend with no postgres will sit `unhealthy` indefinitely and waste memory.

### Staging volumes

| Volume | Contents |
|--------|----------|
| `ifa_app_postgres_staging_data` | Staging DB data |
| `ifa_app_redis_staging_data` | Staging Redis data |

To wipe staging data for a fresh run: `docker-compose -f docker-compose.staging.yml down -v`

---

## Pre-Deployment Checklist

Before deploying to any environment, ensure:

- [ ] All code merged to `main` (tracks `origin/july-2026-hardening-pass` as upstream — `v4/quality`, referenced by an earlier version of this checklist, no longer exists as a branch)
- [ ] All integration tests passing: `npm run test:integration`
- [ ] Frontend build successful: `npm run build` (0 errors)
- [ ] Backend build successful: `npm run build` (0 errors)
- [ ] No hardcoded secrets in commits: `git log -p --all -- | grep -i "secret\|password"`
- [ ] All migrations reviewed: `ls -la backend/prisma/migrations/`
- [ ] Team aware of deployment window
- [ ] Rollback plan prepared

---

## Environment Setup

### Infrastructure Requirements

**PostgreSQL 16**
```bash
# Minimum configuration
POSTGRES_DB=ilu_ase_prod
POSTGRES_USER=ilu_ase_user
POSTGRES_PASSWORD=<strong-password>
# Max connections for 50-100 concurrent users:
max_connections=200
```

**Redis (optional, required for WebSocket scaling)**
```bash
# For local development
redis-server --port 6379
# Production runs a self-hosted Redis 7 container ("redis" service in
# docker-compose.yml on iluase-prod-single) — NOT AWS ElastiCache.
# ElastiCache was part of the earlier ECS architecture, retired March 25, 2026.
```

**Node.js 20+ with npm**
```bash
node --version  # v20.x.x or higher
npm --version   # v10.x.x or higher
```

### Environment Variables

**Backend `.env` Template** (matches `backend/.env.example` — that file is the authoritative source, this is a quick-reference copy)
```env
# Database — on iluase-prod-single, "postgres" is the docker-compose service
# name for the self-hosted Postgres container, not an RDS endpoint.
DATABASE_URL="postgresql://iluase_admin:<password>@postgres:5432/iluase_production?schema=public&connection_limit=10"

# Authentication
JWT_SECRET=<generate-with-crypto.randomBytes(64).toString('hex')>
JWT_REFRESH_SECRET=<generate separately, same way>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Message encryption — required, exactly 32 characters
ENCRYPTION_KEY=<generate-with-crypto.randomBytes(16).toString('hex')>

# Frontend configuration
FRONTEND_URL=https://iluase.com
CORS_ALLOWED_ORIGINS=https://iluase.com

# Error Monitoring
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ENVIRONMENT=production

# Payment Gateways — Paystack and Flutterwave. There is no Stripe
# integration anywhere in this codebase.
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_WEBHOOK_SECRET=xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
FLUTTERWAVE_SECRET_HASH=xxxxx
PAYSTACK_DEVOTED_QUARTERLY_PLAN=PLN_xxxxx
PAYSTACK_DEVOTED_ANNUAL_PLAN=PLN_xxxxx

# Storage (AWS S3)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=<bucket-name>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>

# Email — AWS SES, not SendGrid/Mailgun. `ses-email.service.ts` reads
# SES_FROM_EMAIL (falls back to noreply@iluase.com if unset); it does not
# read an API key env var since it authenticates via the IAM role/creds
# above, the same way S3 does.
SES_FROM_EMAIL=noreply@iluase.com

# Cache (Redis) — "redis" is the docker-compose service name for the
# self-hosted Redis container on iluase-prod-single, not ElastiCache.
REDIS_URL=redis://:<password>@redis:6379
```

**Frontend `.env` Template** (checked against the real `frontend/.env.production`, which is the authoritative source — `VITE_WS_URL` in the old version of this template doesn't exist anywhere in the codebase, dropped)
```env
VITE_API_URL=https://iluase.com/api
VITE_DEMO_MODE=false
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_ENVIRONMENT=production
VITE_GOOGLE_CLIENT_ID=<from Google Cloud Console — public, not secret>
```

✅ **Never commit these files.** Store in secure vault (AWS Secrets Manager, HashiCorp Vault, GitHub Secrets).

---

## Staging Deployment (remote EC2 box)

**Status, verified September 20, 2026: this section is unreliable, don't follow it as written.** A separate EC2 staging box was documented at `http://100.52.200.113:4040` — a direct connectivity check just now timed out (`curl` exit 28, no response), consistent with `ILUASE_V1_BACKLOG.md`'s ⚪ Needs a Human note that it "may currently be unreachable." Beyond that, the deploy steps this section used to describe were never reconciled with reality: they referenced a `v4/quality` git branch that **does not exist** in this repo (`git branch -a` shows only `main`, `IfaAppV1`, `july-2026-hardening-pass`), a `staging-db.rds.amazonaws.com` RDS endpoint (RDS was retired platform-wide in March), and Vercel/Kubernetes deploy options that were never used for this app. None of it is safe to run as-is.

**If you need a staging-like environment today, use [Staging Locally (Docker)](#staging-locally-docker) above** — it's a real, working, verified Docker Compose stack you can run on your own machine right now.

**If the remote staging box needs to be brought back:** that's an infra decision (is it worth keeping vs. relying on local staging + production itself), not a doc fix — flag it to a human rather than guessing at new deploy steps for a box whose current state is unknown.

---

## Real Production Deployment

Production is one EC2 instance (`iluase-prod-single`, t3.small, instance ID `i-0ac1e9e2c4984af72`) behind CloudFront, running a 5-container Docker Compose stack at `/home/ubuntu/app/docker-compose.yml` on the box: `postgres`, `redis`, `backend`, `nginx` (frontend static files, container name `iluase-frontend`), `proxy`. Postgres and Redis are self-hosted containers on the box's own EBS volume — not RDS/ElastiCache. There is no orchestrator (no ECS, no Kubernetes) and no automated CD pipeline to this box; every deploy is a manual sequence run by a human.

### ⚠️ Before deploying

- [ ] Tests passing locally (`npm test` in `backend/`, `npx vitest run` in `frontend/`)
- [ ] `tsc --noEmit` clean in both `backend/` and `frontend/`
- [ ] Know which service(s) you're touching — deploy only what changed, not the whole stack, to minimize blast radius

### 1. Build and push to ECR

Run from the repo root, on a machine with Docker and AWS credentials for account `091653536932`. **Build for `linux/amd64`** — the EC2 instance is x86_64; building on an Apple Silicon Mac without `--platform linux/amd64` produces an image that won't run there.

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 091653536932.dkr.ecr.us-east-1.amazonaws.com

GIT_SHA=$(git rev-parse --short HEAD)

# Backend (only if backend/ changed)
docker build --platform linux/amd64 -f backend/Dockerfile \
  -t 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/backend:$GIT_SHA \
  -t 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/backend:latest .
docker push 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/backend:$GIT_SHA
docker push 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/backend:latest

# Frontend (only if frontend/ changed)
docker build --platform linux/amd64 -f frontend/Dockerfile.production \
  -t 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/frontend:$GIT_SHA \
  -t 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/frontend:latest .
docker push 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/frontend:$GIT_SHA
docker push 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/frontend:latest
```

Tagging by git SHA (not just `:latest`) matters — it's what makes rollback (below) possible.

### 2. SSH into the box and pull the new image(s)

If you have the `ile-ase-key` private key, SSH normally. If not, you can get in via **EC2 Instance Connect** without it (generates a short-lived keypair, pushes the public half via the API):

```bash
ssh-keygen -t ed25519 -f ./eic_temp_key -N ""
aws ec2-instance-connect send-ssh-public-key \
  --instance-id i-0ac1e9e2c4984af72 --instance-os-user ubuntu \
  --ssh-public-key file://./eic_temp_key.pub --availability-zone us-east-1a --region us-east-1
ssh -i ./eic_temp_key ubuntu@32.192.127.137   # window is short (~60s) — connect immediately after
```

Then, on the box:

```bash
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 091653536932.dkr.ecr.us-east-1.amazonaws.com
cd /home/ubuntu/app

# Backend
sudo docker compose pull backend
sudo docker compose up -d --no-deps backend

# Frontend — the compose SERVICE name is "nginx", not "frontend"
# (container_name: iluase-frontend, but the service key is nginx)
sudo docker compose pull nginx
sudo docker compose up -d --no-deps nginx
```

`docker-entrypoint.sh` runs `prisma migrate deploy` automatically on every backend container start — no separate migration step needed for routine deploys.

### 3. Verify

```bash
curl -sf https://iluase.com/api/health
curl -sf https://iluase.com/
sudo docker ps --format 'table {{.Names}}\t{{.Status}}'   # both should show "healthy"/"Up"
sudo docker logs iluase-backend --since 2m   # watch for startup errors
```

---

## Post-Deployment Verification

**Note, September 20, 2026:** the checklist below previously assumed a Sentry dashboard and an APM tool (Datadog/New Relic) were both live in production. Neither is. `SENTRY_DSN` is set as a backend env var, but the box's own logs show `[SentryInitializerService] Sentry module could not be loaded, skipping initialization` on every startup — error tracking is not actually active right now (worth a follow-up to find out why the module fails to load). No APM tool is set up at all. Until that's fixed, "logs check" below (real, via `docker logs`) is the only real signal you have — don't assume a dashboard is catching errors for you.

### Immediate (0-5 minutes)

- [ ] **No connection errors:** `sudo docker logs iluase-backend --since 5m | grep -iE "ECONNREFUSED|connection error"` — database, Redis, external APIs
- [ ] **Logs check:** `sudo docker logs iluase-backend --since 5m` — no repeating errors or stack traces
- [ ] **Containers healthy:** `sudo docker ps --format 'table {{.Names}}\t{{.Status}}'` — all should show "healthy"/"Up", none restarting

### First Hour

- [ ] **User signups flowing:** Check database for new user records
- [ ] **Wallet tests:** Quick manual test (deposit, check balance)
- [ ] **Marketplace test:** Browse vendor → buy a product (Consultations/booking is paused platform-wide, see `CLAUDE.md` — don't use it as a smoke test)
- [ ] **Admin test:** Log in as admin, verify dashboard loads

### Daily (Week 1)

- [ ] **Error rate trending:** no dashboard for this yet (Sentry isn't initializing — see note above); spot-check `docker logs iluase-backend` for repeating errors instead
- [ ] **User feedback:** Check support email/Slack for issues
- [ ] **Payment success rate:** Should be >99% (no automated tracking — check `Transaction`/`Payment` table status fields directly if this needs a real number)
- [ ] **Database size:** `sudo docker exec iluase-postgres psql -U <user> -d <db> -c "SELECT pg_size_pretty(pg_database_size(current_database()));"`, or `df -h` on the box for overall disk
- [ ] **API response times:** no APM tool set up — no real signal available for this yet

---

## Rollback Procedures

### If Something Goes Wrong on Launch Day

#### Option 1: Rollback via Git (Quick)

```bash
# Rollback to previous working tag
git revert HEAD  # Or revert to v0.9.0 if available

# Rebuild and redeploy
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# Redeploy (as above)
```

#### Option 2: Rollback Database (Careful)

```bash
# If a migration caused issues:
cd backend

# Revert last migration
npx prisma migrate resolve --rolled-back 20260301000000_problematic_migration

# Deploy previous schema
npx prisma migrate deploy

# DO NOT use this unless absolutely necessary; losing data is bad.
```

#### Option 3: Rollback the running container (real production process)

No Kubernetes, no ECS, no Vercel. Rollback means pointing the box's docker-compose service at the previous image tag — this is exactly why step 1 above tags by git SHA, not just `:latest`:

```bash
# On the box (see "Real Production Deployment" above for SSH/EC2 Instance
# Connect access), edit /home/ubuntu/app/docker-compose.yml to pin the
# service's image to the previous known-good tag, e.g.:
#   image: 091653536932.dkr.ecr.us-east-1.amazonaws.com/iluase/backend:<previous-sha>
# then:
cd /home/ubuntu/app
sudo docker compose pull backend      # or nginx, for the frontend
sudo docker compose up -d --no-deps backend
```

Revert the pin back to `:latest` (or the new SHA) once the fix ships properly — don't leave the compose file permanently pointed at an old tag.

---

## Maintenance Operations

### Secret Rotation

See **[SECRET_ROTATION.md](SECRET_ROTATION.md)** for the full runbook covering:
- `JWT_SECRET` / `JWT_REFRESH_SECRET` rotation (no downtime, users re-login)
- `ENCRYPTION_KEY` rotation (requires maintenance window + re-encryption script)
- Database password, payment API keys, and other secrets

### Database Backup

**Automated as of September 20, 2026** — `scripts/backup-prod-db.sh` (also deployed at `/home/ubuntu/app/backup-prod-db.sh` on `iluase-prod-single`) runs via cron every 6 hours, dumps `iluase-postgres` via `docker exec` + `pg_dump`, and uploads to a dedicated private/encrypted/versioned S3 bucket (`ilu-ase-prod-db-backups-091653536932`, 90-day lifecycle expiration). Before this date there was no automated backup at all for this self-hosted Postgres container — see `docs/active/DISASTER_RECOVERY_REBUILD_PLAN.md` for the full history of why this mattered.

Check it's running: `ssh` in and `crontab -l` (should show the `backup-prod-db.sh` line), or `aws s3 ls s3://ilu-ase-prod-db-backups-091653536932/` to see recent dumps directly.

Manual/on-demand backup:
```bash
# From the box (SSH or EC2 Instance Connect, see above)
/home/ubuntu/app/backup-prod-db.sh
```

### Log Rotation

**Checked September 20, 2026: this is a real, unaddressed gap.** The app runs in Docker containers (`/home/ubuntu/app/docker-compose.yml` on `iluase-prod-single`), not bare-metal — there's no `/var/log/ilu-ase/` and no `logrotate` config for it. Container logs use Docker's default `json-file` driver, and `docker-compose.yml` has no `logging:` block setting size/rotation limits, so container logs can grow unbounded on the box's own disk. This hasn't caused a problem yet but is worth fixing properly (add a `logging: { driver: json-file, options: { max-size: "10m", max-file: "3" } }` block per service) rather than just noting it here.

```bash
# View logs for a running container (what actually exists today)
sudo docker logs iluase-backend --since 1h
sudo docker logs iluase-backend -f          # follow, live tail

# Check how much disk a container's logs are actually using
sudo docker inspect --format='{{.LogPath}}' iluase-backend | xargs sudo du -h
```

### Monitor Disk Space

```bash
# Check disk usage on the box (checked September 20, 2026: 76% used, 4.8GB free of 20GB —
# worth watching, not yet critical)
df -h /

# Docker-specific usage breakdown — images/containers/volumes/build cache
sudo docker system df

# Reclaim space from old/unused images (safe — ECR lifecycle policy now
# prevents these from piling up going forward, see ILUASE_V1_BACKLOG.md)
sudo docker image prune -a -f
```

---

## Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| **CTO** | TBD | | |
| **DevOps Lead** | TBD | | |
| **On-Call Engineer** | TBD | | |
| **Support Lead** | TBD | | |

---

**Document Version:** 1.3 (see header — this footer previously showed a stale, inconsistent 1.0/March 2026 that never got updated alongside the header)
**Next Review:** whenever `iluase-prod-single`'s deploy mechanism changes, or in 3 months if nothing changes first
**Approved By:** ________ (CTO)
