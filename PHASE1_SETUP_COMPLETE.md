# Phase 1 Setup Complete - Ready to Deploy to Staging

**Date:** March 7, 2026  
**Status:** ✅ Infrastructure templates created, ready to execute

---

## What You Got

I've created a complete **local Docker staging environment** that mimics production:

### New Files Created

| File | Purpose |
|------|---------|
| `docker-compose.staging.yml` | Docker Compose configuration (PostgreSQL + Redis + Backend + Nginx) |
| `docker/nginx.staging.conf` | Nginx reverse proxy & frontend server config |
| `.env.staging` | Environment template with production-safe defaults |
| `start-staging.ps1` | PowerShell script to start all services |
| `smoke-tests.ps1` | Automated test suite to verify staging works |
| `STAGING_SETUP_PHASE1.md` | Comprehensive step-by-step guide |

---

## Quick Start (3 Steps)

### Step 1: Configure Environment

```powershell
# Copy template
Copy-Item .env.staging .env.staging.local

# Edit .env.staging.local with these REAL values:
# - POSTGRES_PASSWORD (min 12 random chars)
# - REDIS_PASSWORD (min 12 random chars)  
# - JWT_SECRET (min 32 random chars)
# - STRIPE_SECRET_KEY (sk_test_...)
# - SENTRY_DSN (optional, for error tracking)
```

**Example secure values:**
```env
POSTGRES_PASSWORD=K7x@9mL2pQ$vR5tW8zY3uJ6nH
REDIS_PASSWORD=A2b3C4d5E6f7G8h9I0j1K2l3M
JWT_SECRET=Th1sIs32CharactersLongJWTKey!@#$%
```

### Step 2: Start Staging

```powershell
cd c:\Users\Test\ifa_app
.\start-staging.ps1 -Force
```

**What happens:**
- 🐘 PostgreSQL starts (port 5433)
- 🔴 Redis starts (port 6380)
- 🔵 Backend compiles & starts (port 8080)
- 🏗️  Frontend builds & starts (via Nginx on port 4040)
- 🔄 Database migrations run automatically
- 📊 Health checks verify everything

**Time:** ~60 seconds first run, ~20 seconds subsequent runs

### Step 3: Verify & Test

Access the application:
```
Frontend:  http://localhost:4040
API Docs:  http://localhost:8080/api/docs
Health:    http://localhost:8080/health
```

Run automated smoke tests:
```powershell
.\smoke-tests.ps1
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Web Browser                                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Nginx (Port 4040)                                       │
│ - Serves React frontend                                 │
│ - Proxies /api/* to backend                            │
│ - Proxies /socket.io/* for WebSockets                  │
└──────────────┬──────────────────────────────┬───────────┘
               │                              │
        ┌──────▼──────┐                ┌──────▼──────┐
        │ Frontend     │                │ Backend API │
        │ (React app)  │                │ (NestJS)    │
        │ from dist/   │                │ (Port 8080) │
        └──────────────┘                └──────┬──────┘
                                               │
               ┌───────────────────────────────┼───────────────┐
               │                               │               │
        ┌──────▼─────┐               ┌─────────▼─────┐   ┌────▼─────┐
        │ PostgreSQL  │               │ Redis         │   │ Sentry   │
        │ (Port 5433) │               │ (Port 6380)   │   │ (cloud)  │
        │ - Users     │               │ - Cache       │   │ - Errors │
        │ - Data      │               │ - Sessions    │   │          │
        └─────────────┘               └───────────────┘   └──────────┘
```

---

## What Each Service Does

### PostgreSQL (Port 5433)
- **Purpose:** Production database
- **Access:** `localhost:5433` (use any DB tool)
- **Backups:** Data persists in Docker volume
- **Migrations:** Auto-run on startup

### Redis (Port 6380)
- **Purpose:** Cache, session store, WebSocket support
- **Access:** `redis-cli -h localhost -p 6380`
- **Persistence:** Optional RDB snapshots

### Backend (Port 8080)
- **Purpose:** NestJS API server
- **Features:** Swagger docs, real-time WebSockets, Sentry integration
- **Logs:** `docker-compose -f docker-compose.staging.yml logs -f backend`
- **Health:** `curl http://localhost:8080/health`

### Nginx (Port 3000)
- **Purpose:** Reverse proxy + static file server
- **Serves:** React frontend from `/dist` 
- **Routes:** `/api/*` → backend, `/socket.io/*` → backend (WebSocket)
- **Cache:** 30-day browser cache for assets

---

## Common Commands

```powershell
# Start staging
.\start-staging.ps1 -Force

# Start with demo data seeded
.\start-staging.ps1 -Force -Seed

# Stop all services (keep data)
docker-compose -f docker-compose.staging.yml down

# Stop and delete all data
docker-compose -f docker-compose.staging.yml down -v

# View backend logs
docker-compose -f docker-compose.staging.yml logs -f backend

# Connect to database
docker-compose -f docker-compose.staging.yml exec postgres psql -U staging_user -d ilu_ase_staging

# Restart a service
docker-compose -f docker-compose.staging.yml restart backend

# Run smoke tests
.\smoke-tests.ps1

# Check service health
docker-compose -f docker-compose.staging.yml ps
```

---

## Troubleshooting

### Port already in use
```powershell
# Find process using port 8080
Get-NetTCPConnection -LocalPort 8080 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### Docker not installed
```powershell
# Install Docker Desktop: https://www.docker.com/products/docker-desktop
```

### Network issues
```powershell
# Reset Docker networking
docker system prune --all --force
.\start-staging.ps1 -Force
```

### Database migration failed
```powershell
# Reset database (deletes all staging data)
docker-compose -f docker-compose.staging.yml down -v
.\start-staging.ps1 -Force
```

Detailed troubleshooting: See [STAGING_SETUP_PHASE1.md](./STAGING_SETUP_PHASE1.md)

---

## Testing Workflow

### 1. Manual Testing (UI)
```
Open http://localhost:3000
- Signup with test account
- Login
- Navigate features
- Check for errors in console
```

### 2. Automated Smoke Tests
```powershell
.\smoke-tests.ps1
```
Tests:
- ✅ Health checks
- ✅ Authentication (signup/login)
- ✅ API endpoints
- ✅ Database connectivity
- ✅ Redis cache
- ✅ Performance (<200ms avg)
- ✅ Sentry integration

### 3. API Testing (Manual)
```powershell
# Get all temples
curl http://localhost:8080/api/temples

# Signup new user
$body = @{
    email = "test@example.com"
    password = "Test123!@#"
    name = "Test User"
    role = "client"
} | ConvertTo-Json

curl -X POST http://localhost:8080/auth/signup `
  -H "Content-Type: application/json" `
  -d $body
```

### 4. Database Inspection
```powershell
# Connect to database
docker-compose -f docker-compose.staging.yml exec postgres psql -U staging_user -d ilu_ase_staging

# List all tables
\dt

# Check specific table
SELECT * FROM "User" LIMIT 5;
```

---

## Next Steps

### Immediate (Today)
1. ✅ Configure `.env.staging.local` with real values
2. ✅ Run `.\start-staging.ps1 -Force`
3. ✅ Open http://localhost:3000 and test login
4. ✅ Run `.\smoke-tests.ps1` to verify

### This Week (Mar 8-10)
1. Run comprehensive testing
2. Test key features (bookings, payments, messaging)
3. Document any issues found
4. Verify Sentry captures errors

### Next Week (Mar 11-15)
1. Complete testing checklist
2. Get AWS confirmation
3. Start AWS infrastructure setup
4. Plan production migration

---

## Environment for AWS Transition

When AWS confirmation arrives, you'll use the same `.env.staging.local` values, just update:

```env
# Change from localhost to AWS endpoints
DATABASE_URL=postgresql://user:pass@ilu-ase-staging.xxxx.rds.amazonaws.com:5432/ilu_ase_staging
REDIS_URL=redis://ilu-ase-staging.cache.amazonaws.com:6379
API_URL=https://api.staging.ilu-ase.com
FRONTEND_URL=https://app.staging.ilu-ase.com
WEBSOCKET_CORS_ORIGIN=https://app.staging.ilu-ase.com
```

The Docker setup now gives you a **blueprint** for what AWS infrastructure needs:
- ✅ PostgreSQL 16 database
- ✅ Redis 6+ cache
- ✅ Node.js backend (Docker container)
- ✅ Frontend CDN (static files)
- ✅ Nginx reverse proxy layer

---

## Security Notes

⚠️ **DO NOT commit `.env.staging.local` to git!**

It contains sensitive credentials:
- Database password
- Redis password
- JWT secret
- Stripe API keys
- Sentry DSN

Add to `.gitignore`:
```
.env.staging.local
*.local
secrets/
```

---

## Monitoring & Logs

### Real-time logs
```powershell
docker-compose -f docker-compose.staging.yml logs -f
```

### Backend logs only
```powershell
docker-compose -f docker-compose.staging.yml logs -f backend
```

### Database logs
```powershell
docker-compose -f docker-compose.staging.yml logs -f postgres
```

### Event stream monitoring
```powershell
docker-compose -f docker-compose.staging.yml events
```

---

## Success Criteria

You're ready for Phase 2 (AWS) when:

- ✅ `.\start-staging.ps1 -Force` starts without errors
- ✅ `http://localhost:3000` loads the login page
- ✅ Can signup → login → access dashboard
- ✅ `.\smoke-tests.ps1` passes all tests
- ✅ No errors in backend logs
- ✅ Database queries work (psql test)
- ✅ Response times under 200ms average
- ✅ All API docs visible at `/api/docs`

---

## Ready?

```powershell
cd c:\Users\Test\ifa_app
Copy-Item .env.staging .env.staging.local
# Edit .env.staging.local with real values...
.\start-staging.ps1 -Force
```

Then open: **http://localhost:3000** 🎉

---

**Next:** Follow [STAGING_SETUP_PHASE1.md](./STAGING_SETUP_PHASE1.md) for detailed instructions
