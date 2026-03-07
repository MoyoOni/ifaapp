# Phase 1: Staging Setup - Step-by-Step Guide

**Timeline:** March 7-15, 2026  
**Owner:** You (until AWS confirmation)

---

## What You're Doing

You're setting up a **production-like staging environment** where you can:
- ✅ Test the full application stack
- ✅ Verify database migrations work
- ✅ Test real API responses (Sentry integration)
- ✅ Catch bugs before production
- ✅ Validate deployment procedures

---

## Prerequisites

Before starting, verify you have:

```powershell
# Check Docker
docker --version          # Should be 20.10+
docker-compose --version  # Should be 1.29+

# Check Node
node --version            # Should be 18+
npm --version

# Check PostgreSQL (local)
psql --version            # Should be 16+
```

If missing anything:
```bash
# Install Docker: https://www.docker.com/download
# Install Node: https://nodejs.org (v18+ LTS)
```

---

## Step 1: Configure Environment

### 1a. Copy environment template

```powershell
cd c:\Users\Test\ifa_app
Copy-Item .env.staging .env.staging.local
```

### 1b. Edit `.env.staging.local` with REAL values

```env
# REQUIRED - Change these!
POSTGRES_PASSWORD=your_secure_db_password_here           # min 12 chars
REDIS_PASSWORD=your_secure_redis_password_here           # min 12 chars
JWT_SECRET=your_minimum_32_character_secure_key_here     # exactly 32+ chars
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_STRIPE_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_ACTUAL_SECRET
SENTRY_DSN=https://your_actual_sentry_dsn_unlessyoudonthaveone

# OPTIONAL (use defaults for testing)
API_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
```

**⚠️ SECURITY:** Never commit `.env.staging.local` to git! It contains secrets.

---

## Step 2: Build & Start Staging

### 2a. Start all services

```powershell
cd c:\Users\Test\ifa_app

# Start staging environment (builds Docker images, starts all containers)
.\start-staging.ps1 -Force

# If you want to also seed demo data:
.\start-staging.ps1 -Force -Seed
```

**What this does:**
- 🐘 Starts PostgreSQL container
- 🔴 Starts Redis container
- 🔵 Builds & starts backend (NestJS)
- 🟢 Builds & starts nginx proxy
- 🚀 Runs database migrations
- 📊 Performs health checks

### 2b. Wait for services to be ready

Watch the output for:
```
✅ Staging environment started!
```

Typically takes 30-60 seconds first time.

---

## Step 3: Verify Services

### 3a. Frontend

```bash
# Open browser to:
http://localhost:3000
```

You should see the login page. ✅

### 3b. API Health

```bash
# Open browser or curl:
http://localhost:8080/health
```

Should return: `{"status":"ok"}`  ✅

### 3c. Database Connection

```powershell
# Connect to staging database
docker-compose -f docker-compose.staging.yml exec postgres psql -U staging_user -d ilu_ase_staging

# At psql prompt, run:
SELECT version();
SELECT COUNT(*) FROM "User";  -- Check migrations ran
\q                            -- Exit
```

You should see PostgreSQL 16. ✅

### 3d. Swagger API Docs

```bash
# Open browser to see all API endpoints:
http://localhost:8080/api/docs
```

All endpoints documented. ✅

---

## Step 4: Run Smoke Tests

Use the [PRE_LAUNCH_CHECKLIST.md](../docs/PRE_LAUNCH_CHECKLIST.md) Phase 1 section:

```
☐ Health check: GET /health → 200 OK
☐ Signup: POST /auth/signup → 201 Created
☐ Login: POST /auth/login → 200 + JWT token
☐ Get user: GET /users/me → 200 user object
☐ Create appointment: POST /appointments → 201 
☐ Database: psql shows tables created
☐ Sentry: Check dashboard for 0 errors
☐ Response time: All endpoints <2s
```

---

## Step 5: Troubleshooting

### Services won't start

```powershell
# 1. Check Docker is running
docker ps

# 2. View logs
docker-compose -f docker-compose.staging.yml logs -f backend

# 3. Stop and try again
docker-compose -f docker-compose.staging.yml down
.\start-staging.ps1 -Force
```

### Database migration failed

```powershell
# Check migration status
docker-compose -f docker-compose.staging.yml exec backend npm run migrate:status

# Reset database (WARNING: deletes all staging data)
docker-compose -f docker-compose.staging.yml down -v
.\start-staging.ps1 -Force
```

### Backend crashes (port 8080 in use)

```powershell
# Find what's using port 8080
Get-NetTCPConnection -LocalPort 8080 | Select-Object -Property State, OwningProcess

# Kill process (replace PID)
Stop-Process -Id PID -Force

# Or use different port in docker-compose.staging.yml
# Change "8080:8080" to "8081:8080"
```

### Frontend won't load

```powershell
# Rebuild frontend
cd frontend
npm run build
cd ..

# Restart nginx
docker-compose -f docker-compose.staging.yml restart nginx
```

---

## Step 6: Data Management

### Seed demo data (for QA testing)

```powershell
# Seeds: temples, users, babalawos, products, courses, etc.
.\start-staging.ps1 -Seed
```

### Connect with DB tool (DBeaver, pgAdmin)

```
Host: localhost
Port: 5433
Database: ilu_ase_staging
User: staging_user
Password: (from .env.staging.local)
```

### Backup database

```powershell
docker-compose -f docker-compose.staging.yml exec postgres \
  pg_dump -U staging_user ilu_ase_staging > backup_staging_mar7.sql
```

### Restore database

```powershell
docker-compose -f docker-compose.staging.yml exec -T postgres \
  psql -U staging_user ilu_ase_staging < backup_staging_mar7.sql
```

---

## Step 7: Test Key Features

Create a test script to verify core flows:

```powershell
# 1. Signup
curl -X POST http://localhost:8080/auth/signup `
  -H "Content-Type: application/json" `
  -d '{"email":"test@ilu-ase.com","password":"Test123!@#"}'

# 2. Login
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@ilu-ase.com","password":"Test123!@#"}'

# 3. Create appointment (use JWT token from login)
curl -X POST http://localhost:8080/appointments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"babalawoId":"...","date":"2026-03-15","time":"10:00"}'
```

---

## Step 8: Cleanup

When done testing:

```powershell
# Stop all services (keep data)
docker-compose -f docker-compose.staging.yml down

# Stop and remove all data
docker-compose -f docker-compose.staging.yml down -v

# View Docker disk usage
docker system df

# Clean up (removes unused images/volumes)
docker system prune
```

---

## Next: AWS Transition (When Confirmed)

Once AWS confirmation arrives, follow [STAGING_TO_AWS.md](./STAGING_TO_AWS.md):

1. Create RDS PostgreSQL 16 instance
2. Create ElastiCache Redis cluster
3. Create EC2 for backend (Docker + ECS)
4. Create S3 + CloudFront for frontend
5. Migrate Docker Compose → AWS infrastructure

---

## Timeline Check

| Date | Task | Status |
|------|------|--------|
| Mar 7 | ✅ Set up Docker staging (you are here) | 🟢 |
| Mar 9 | Deploy to staging locally | 📋 |
| Mar 10-14 | Run smoke tests, find bugs | 📋 |
| Mar 15 | All tests passing, staging verified | 📋 |
| Mar 22 | AWS provisioned (when confirmed) | 📋 |
| Mar 28 | Final production checks | 📋 |
| Apr 1 | 🚀 Launch | 📋 |

---

## Quick Reference Commands

```powershell
# Start staging
.\start-staging.ps1 -Force

# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Stop staging
docker-compose -f docker-compose.staging.yml down

# Access database
docker-compose -f docker-compose.staging.yml exec postgres psql -U staging_user -d ilu_ase_staging

# Restart backend
docker-compose -f docker-compose.staging.yml restart backend

# Check health
curl http://localhost:8080/health
```

---

**Ready?** Run:
```powershell
.\start-staging.ps1 -Force
```

Then open http://localhost:3000 🎉
