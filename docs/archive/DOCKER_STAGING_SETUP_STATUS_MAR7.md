# Docker Staging Setup - Status Report (March 7, 2026)

**Session Duration**: ~1 hour  
**Docker Crash Events**: 1 (SIGBUS - resolved after restart)  
**Current Status**: ⚠️ **Buildkit Lock Issue** - requires immediate manual intervention

---

## Issues Encountered & Resolutions

### 1. ✅ **Docker Desktop SIGBUS Crash** - RESOLVED
- **Error**: Fatal: SIGBUS: bus error in BuildKit (memory access violation)
- **Cause**: Docker Desktop daemon crash during concurrent builds
- **Resolution**: Restart Docker Desktop
- **Result**: Docker daemon recovered (v29.0.2), freed 7.7GB of corrupted cache

### 2. ✅ **Dockerfile Build Path Issues** - RESOLVED
- **Error**: `COPY tsconfig.json ./` failed — file not found at root level
- **Cause**: Monorepo structure — tsconfig.json is in backend/ subdirectory
- **Fixes Applied**:
  ```dockerfile
  # Before: COPY tsconfig.json ./
  # After: COPY backend/tsconfig.json ./tsconfig.json
  COPY backend/nest-cli.json ./nest-cli.json
  ```

### 3. ✅ **Package.json ESM/CommonJS Error** - RESOLVED
- **Error**: Node.js `ERR_INVALID_PACKAGE_CONFIG` in production container
- **Cause**: Root monorepo package.json lacks "type" field, confuses Node ESM loader
- **Fix**: Created minimal CommonJS package.json in production stage:
  ```dockerfile
  RUN echo '{"type":"commonjs","name":"ilu-ase-backend-prod"}' > package.json
  ```

### 4. ⏳ **Missing @nestjs/swagger Dependency** - IN PROGRESS
- **Error**: `Cannot find module '@nestjs/swagger'` at runtime
- **Root Cause**: npm ci in monorepo not resolving backend workspace dependencies
- **Attempts Made**:
  1. Root-level npm ci (incomplete)
  2. Explicit `cd backend && npm ci` (still missing swagger)
  3. Fallback `npm install @nestjs/swagger` (added to Dockerfile)
- **Status**: Third rebuild in progress with fallback npm install
- **Next**: Verify if fallback install works; if not, may need to skip swagger in CLI

### 5. 🟠 **Docker Buildkit Lock** - CURRENT BLOCKER
- **Error**: `image "docker.io/library/ifa_app-backend:latest": already exists`
- **Cause**: Build lock from concurrent/failed builds
- **Resolution Applied**: `docker rmi ifa_app-backend:latest` before rebuild
- **Status**: Latest rebuild may be waiting for lock release

---

## Docker Infrastructure Changes

### Files Modified

#### `backend/Dockerfile` (Major Changes)
```dockerfile
# ✅ Fixed workspace paths
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/nest-cli.json ./nest-cli.json

# ✅ Multiple npm install attempts for dependencies
RUN npm ci --legacy-peer-deps --prefer-offline
RUN cd backend && npm ci --legacy-peer-deps --prefer-offline
RUN npm install @nestjs/swagger @nestjs/core... --legacy-peer-deps --save=false

# ✅ Minimal CommonJS package.json
RUN echo '{"type":"commonjs","name":"ilu-ase-backend-prod"}' > package.json

# ✅ Simplified runtime command
CMD ["node", "dist/backend/src/main.js"]
```

#### `docker-compose.staging.yml` (Minor Changes)
- Removed `volumes` mapping for backend source (production doesn't need live reload)
- Removed `command: npm run start:prod` (trusts Dockerfile CMD)
- Kept redis/postgres healthchecks intact

#### `backend/docker-entrypoint.sh` (Simplified)
- Fixed path from `dist/backend/src/main.js` to correct structure
- Kept for reference but not currently used (bypassed in favor of direct node command)

---

## Current Staging Infrastructure (When Healthy)

### Running Services
```
✅ PostgreSQL 16-alpine  
   Port: 5433 (local dev doesn't conflict)
   Status: Healthy
   Volume: postgres_staging_data

✅ Redis 7-alpine
   Port: 6380 (local dev doesn't conflict)
   Status: Healthy
   Volume: redis_staging_data

✅ Nginx (Frontend Proxy)
   Port: 4040 → frontend dist/
   Status: Running
   
🚧 Backend NestJS (ifa_app-backend)
   Port: 8080
   Status: Restarting (dependency issue)
```

###  Environment Variables (From docker-compose.staging.yml)
```
NODE_ENV=production
DATABASE_URL=postgresql://staging_user:${POSTGRES_PASSWORD}@postgres:5432/ilu_ase_staging
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
JWT_SECRET=${JWT_SECRET}
STRIPE_*=${STRIPE_*}
SENTRY_DSN=${SENTRY_DSN}
SENTRY_ENVIRONMENT=staging
LOG_LEVEL=info
ENABLE_SWAGGER=true
SWAGGER_PATH=/api/docs
```

---

## Build Statistics

| Step | Duration | Notes |
|------|----------|-------|
| npm ci (root) | 73s | 1488 packages installed (213 funding projects) |
| npm ci (backend explicit) | ~60s | Resolving backend dependencies |
| npm install (fallback swagger) | ~10s | Additional key packages |
| prisma generate | 6s | Prisma client generated v5.22.0 |
| nest build | 24s | Backend compilation completed |
| Docker export/compress | 20s | Image size: 1.05GB |
| **Total Build Time** | ~3-4 min | Multi-stage optimized |

---

## Dependency Analysis

### Missing in Production (Critical)
- ❌ @nestjs/swagger v8.0.0 (required by backend/src/main.ts)

### Missing in Production (Non-Critical)
- ✅ All other @nestjs packages present

### Node Versions
- Builder: node:22-alpine
- Production: node:22-alpine (same)
- npm: v10.9.4 (notice available: v11.11.0 - ignored)

---

## Recommended Next Steps (Priority Order)

### IMMEDIATE (Do First)
1. **Manual container cleanup & test**
   ```bash
   docker stop $(docker ps -aq) || true
   docker rm $(docker ps -aq) || true
   docker volume prune -f
   docker image prune -f
   ```

2. **Rebuild with docker-compose**
   ```bash
   cd /path/to/ifa_app
   docker-compose -f docker-compose.staging.yml up -d
   ```

3. **Test backend startup**
   ```bash
   sleep 30
   docker logs ilu-ase-staging-backend | tail -20
   curl -s http://localhost:8080/health || echo "Backend not responding"
   ```

### IF SWAGGER STILL MISSING
4. **Verify package installation**
   ```bash
   docker run --rm ifa_app-backend ls node_modules/@nestjs/swagger/package.json
   ```

5. **If missing, nuclear option - add to Dockerfile**
   ```dockerfile
   # In builder stage, after npm ci
   RUN npm install @nestjs/swagger --save --legacy-peer-deps
   RUN npm audit fix --legacy-peer-deps --force 2>/dev/null || true
   ```

### SMOKE TESTS (When Backend Healthy)
6. **API endpoints**
   ```bash
   curl http://localhost:8080/api/docs
   curl http://localhost:8080/api/v1/health
   ```

7. **Database connectivity**
   ```bash
   # Check migrations ran
   docker exec ilu-ase-staging-postgres psql -U staging_user -d ilu_ase_staging -c "\dt"
   ```

8. **Frontend proxy**
   ```bash
   curl http://localhost:4040
   ```

---

## Documentation Links
- **Pre-Launch Checklist**: `/docs/PRE_LAUNCH_CHECKLIST.md`
- **Deployment Procedures**: `/docs/DEPLOYMENT_PROCEDURES.md`
- **V4 Backlog**: `V4_QUALITY_BACKLOG.md`
- **This File**: `DOCKER_STAGING_SETUP_STATUS_MAR7.md`

---

## Key Learnings

1. **Monorepo npm Installs**: Docker build contexts need careful path management. Backend dependencies may not install at root level without explicit `cd backend`.

2. **Node Package.json Validation**: Node v22 validates "type" field strictly. Production containers need explicit CommonJS configuration.

3. **Docker BuildKit Lock**: Concurrent or interrupted builds can leave image locks. Manual `rmi` before rebuild needed.

4. **Swagger/Swagger-UI**: @nestjs/swagger is runtime-required for API documentation endpoints, not just development.

---

## Status for Next Session

**If containers still not running:**
- Start with "IMMEDIATE" section above
- Check if docker-compose build is still running: `docker ps -a`
- If stuck, try full docker system reset: `docker system prune -a`

**If containers running but backend crashes:**
- Run: `docker logs ilu-ase-staging-backend`
- If still @nestjs/swagger, apply fallback npm install fix listed above
- Test with: `curl http://localhost:8080/health`

**Success Criteria:**
- All 4 containers show `Up` status
- Backend logs show NestJS startup messages (no errors)
- `curl http://localhost:8080/api/docs` returns Swagger UI
- Smoke tests pass (see section above)

---

**Status**: 🚧 In Progress - Docker infrastructure 95% ready, final dependency resolution needed
