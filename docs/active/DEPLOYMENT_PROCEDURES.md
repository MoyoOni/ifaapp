# 🚀 Deployment Procedures — Ìlú Àṣẹ Platform

**Version:** 1.1
**Last Updated:** March 23, 2026
**Production:** https://iluase.com (LIVE — April 1, 2026 go-live)

---

## 📋 Table of Contents

0. [Local Development (Docker)](#local-development-docker)
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Staging Locally (Docker)](#staging-locally-docker)
4. [Production Deployment (AWS ECS)](#production-deployment)
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

- [ ] All code merged to `v4/quality` branch
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
# For development/staging
redis-server --port 6379
# For production, use managed service (AWS ElastiCache, etc.)
```

**Node.js 20+ with npm**
```bash
node --version  # v20.x.x or higher
npm --version   # v10.x.x or higher
```

### Environment Variables

**Backend `.env` Template**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ilu_ase_prod?connection_limit=10"

# Authentication
JWT_SECRET=<generate-with-crypto.randomBytes(32).toString('hex')>
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Frontend configuration
FRONTEND_URL=https://app.ilu-ase.com  # or staging domain

# Error Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Payment Gateway (Stripe or similar)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Storage (AWS S3)
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=ilu-ase-prod
S3_REGION=us-east-1

# Email Service
EMAIL_SERVICE_PROVIDER=sendgrid  # or mailgun, aws-ses
EMAIL_SERVICE_API_KEY=SG.xxxxx
EMAIL_FROM=hello@ilu-ase.com

# Cache (Redis)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

**Frontend `.env` Template**
```env
VITE_API_URL=https://api.ilu-ase.com
VITE_WS_URL=wss://api.ilu-ase.com
VITE_DEMO_MODE=false
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

✅ **Never commit these files.** Store in secure vault (AWS Secrets Manager, HashiCorp Vault, GitHub Secrets).

---

## Production Deployment

> **Note:** Staging locally is documented above. This section covers deploying to the EC2 staging server (http://100.52.200.113:4040) and production (ECS Fargate / https://iluase.com).

### 1. Prepare Staging Environment

```bash
# Clone repository (if first time)
git clone https://github.com/MoyoOni/ifa_app.git
cd ifa_app

# Checkout v4/quality branch
git checkout v4/quality

# Pull latest changes
git pull origin v4/quality
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install common dependencies
cd common && npm install && cd ..
```

### 3. Build for Staging

```bash
# Build backend
cd backend && npm run build && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Verify builds succeeded (exit code 0)
echo $?
```

### 4. Database Migration (Staging)

```bash
# Set staging DATABASE_URL
export DATABASE_URL="postgresql://user:password@staging-db.rds.amazonaws.com:5432/ilu_ase_staging?connection_limit=10"

# Apply all migrations
cd backend
npx prisma migrate deploy

# Verify schema is in sync
npx prisma db push

# Check migration status
npx prisma migrate status

# Seed demo data (optional, for testing)
npx prisma db seed

cd ..
```

### 5. Deploy Backend (Staging)

Option A: **Container Deployment (Recommended)**
```bash
# Build Docker image
docker build -t ilu-ase-backend:staging-v1 backend/

# Push to registry
docker push <registry>/ilu-ase-backend:staging-v1

# Deploy via docker-compose or Kubernetes
docker-compose -f docker-compose.staging.yml up -d
```

Option B: **Direct Node.js Deployment**
```bash
# Navigate to backend
cd backend

# Start backend in production mode
NODE_ENV=production npm start

# Backend should be listening on port 3000
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

### 6. Deploy Frontend (Staging)

Option A: **Vercel Deployment (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy frontend
cd frontend
vercel --prod --env-file .env.staging

# Get staging URL from Vercel
# Update FRONTEND_URL in backend .env
```

Option B: **Traditional Web Server**
```bash
# Copy frontend dist to web server
scp -r frontend/dist/ user@staging-server:/var/www/ilu-ase/

# Configure nginx/Apache to serve frontend, proxy /api to backend
# Restart web server
sudo systemctl restart nginx
```

### 7. Verify Staging Deployment

```bash
# Check backend health
curl https://api-staging.ilu-ase.com/api/health

# Check frontend loads
open https://app-staging.ilu-ase.com

# Run essential tests
cd backend
npm run test:integration -- --testPathPattern="wallet"
# Expected: ✓ 9 passed

# Check logs for errors
docker logs ilu-ase-backend-staging  # or tail logs from PM2/systemd
```

---

## Production Deployment

### ⚠️ Production Deployment Requires Sign-Off

Before proceeding, ensure:
- [ ] CTO/Tech Lead approval
- [ ] Product approval
- [ ] DevOps approval
- [ ] All staging smoke tests passing
- [ ] Database backup scheduled and tested
- [ ] Incident response team standing by

### 1. Create Release

```bash
# Tag release
git tag -a v1.0.0 -m "Production release - April 1, 2026"

# Push tag
git push origin v1.0.0
```

### 2. Production Database Setup

```bash
# Create production database (one-time setup)
# Done by DevOps/DBA before deployment

# Verify production DATABASE_URL
echo $DATABASE_URL
# Should point to production PostgreSQL

# Apply all migrations
cd backend
npx prisma migrate deploy

# Verify all migrations applied
npx prisma migrate status

cd ..
```

### 3. Deploy Backend (Production)

```bash
# Set production environment
export NODE_ENV=production
export LOG_LEVEL=warn

# Option A: Container deployment
docker build -t ilu-ase-backend:v1.0.0 backend/
docker push <registry>/ilu-ase-backend:v1.0.0

# Deploy with orchestration tool (ECS, Kubernetes, etc.)
# kubectl apply -f k8s/backend-prod.yml
# OR
# aws ecs update-service --cluster prod --service backend --force-new-deployment

# Option B: Direct deployment
cd backend
npm install --production  # Only install production dependencies
npm start

# Backend should be listening on port 3000
# Verify: curl https://api.ilu-ase.com/api/health
```

### 4. Deploy Frontend (Production)

```bash
# Vercel deployment
cd frontend
vercel --prod --env-file .env.production

# OR Traditional deployment
scp -r frontend/dist/ user@prod-server:/var/www/ilu-ase/
sudo systemctl restart nginx
```

### 5. Verify Production Deployment

```bash
# Health check
curl https://api.ilu-ase.com/api/health

# Frontend loads
open https://ilu-ase.com

# Sentry receiving events
# Check Sentry dashboard: should see debug/info events, no errors

# Database connectivity
# Check Sentry for DB connection errors: should be none

# Monitor error rate
# Check Sentry dashboard for 5 minutes
# Expected: error rate < 0.5%
```

---

## Post-Deployment Verification

### Immediate (0-5 minutes)

- [ ] **Error rate normal:** Check Sentry dashboard (should be <0.5%)
- [ ] **Response times normal:** Check APM (Datadog, New Relic, Sentry, etc.)
- [ ] **No connection errors:** Database, Redis, external APIs
- [ ] **Logs check:** No critical errors in application logs

### First Hour

- [ ] **User signups flowing:** Check database for new user records
- [ ] **Wallet tests:** Quick manual test (deposit, check balance)
- [ ] **Booking test:** Browse babalawo → Book consultation
- [ ] **Messages test:** Send test message between users, verify real-time
- [ ] **Admin test:** Log in as admin, verify dashboard loads

### Daily (Week 1)

- [ ] **Error rate trending:** Sentry showing <0.5%
- [ ] **User feedback:** Check support email/Slack for issues
- [ ] **Payment success rate:** Should be >99%
- [ ] **Database size:** Monitor disk usage
- [ ] **API response times:** p95 < 2s for most endpoints

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

#### Option 3: Rollback Infrastructure

```bash
# If using container orchestration (Kubernetes, ECS)
kubectl rollout undo deployment/ilu-ase-backend
# OR
aws ecs update-service --cluster prod --service backend --force-new-deployment --image k8s/backend:previous-tag

# If using Vercel
vercel rollback  # Automatically redeploy previous version
```

---

## Maintenance Operations

### Secret Rotation

See **[SECRET_ROTATION.md](SECRET_ROTATION.md)** for the full runbook covering:
- `JWT_SECRET` / `JWT_REFRESH_SECRET` rotation (no downtime, users re-login)
- `ENCRYPTION_KEY` rotation (requires maintenance window + re-encryption script)
- Database password, payment API keys, and other secrets

### Weekly Database Backup

```bash
# Automated backups (AWS RDS, Azure Database, etc.)
# Verify backup completed:
aws rds describe-db-snapshots --db-instance-identifier ilu-ase-prod

# For manual backup:
pg_dump -U ilu_ase_user -h prod-db.rds.amazonaws.com ilu_ase_prod > backup-$(date +%Y%m%d).sql
```

### Log Rotation

```bash
# If using file-based logging
logrotate /etc/logrotate.d/ilu-ase

# Check logs
tail -f /var/log/ilu-ase/backend.log
tail -f /var/log/ilu-ase/frontend.log
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# If >80% used, archive old logs:
gzip /var/log/ilu-ase/*.log
tar czf logs-archive-$(date +%Y%m%d).tar.gz /var/log/ilu-ase/
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

**Document Version:** 1.0  
**Next Review:** March 25, 2026  
**Approved By:** ________ (CTO)
