# Production Readiness Report — Ìlú Àṣẹ Platform

**Report Date:** March 11, 2026  
**Target Launch:** April 1, 2026  
**Purpose:** Honest assessment of deploy readiness, gaps, and what’s missing for first real users.

---

## Executive Summary

| Area | Status | Notes |
|------|--------|--------|
| **Build & types** | ✅ Ready | Backend + frontend build clean, TS strict, no source maps in prod |
| **Database & migrations** | ✅ Ready | Prisma, idempotency, connection pooling, migrations documented |
| **Auth & security** | 🟡 Mostly ready | JWT/env validated; login throttle + email verification gaps |
| **Payments & wallet** | ✅ Ready | Atomic tx, idempotency, webhook verification (Paystack/Flutterwave) |
| **Monitoring & errors** | ✅ Ready | Sentry FE+BE, env requires SENTRY_DSN in prod |
| **Deploy & ops** | 🟡 Gaps | CI health URL wrong; staging/prod env and backups need verification |
| **Legal & trust** | ❌ Missing | No Terms of Service or Privacy Policy pages |
| **Email verification** | ❌ Not wired | Backend has `sendVerificationEmail` but register() doesn’t use it |

**Verdict:** The app is **close to production-ready** for a controlled launch. Fix the critical items below, then complete staging smoke tests and legal pages before opening to broad real users.

---

## 1. What’s Already in Good Shape

### 1.1 Build & compilation
- Backend: TypeScript strict, `validateEnv` at startup, no build errors.
- Frontend: Vite build succeeds, design tokens, logger instead of `console.log`.
- No hardcoded secrets in repo; `.env` in `.gitignore`; docker uses `${VAR}`.

### 1.2 Database & data safety
- Prisma migrations; idempotency keys on wallet transactions (migration + tests).
- Wallet operations in `Prisma.$transaction()` (atomic).
- `connection_limit=10` documented for `DATABASE_URL`.

### 1.3 Security
- **Helmet** (HSTS, X-Frame-Options, etc.) and security headers in `main.ts`.
- **CORS** from `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS`, not `*`.
- **JWT:** `JWT_SECRET` required and validated (min 32 chars) at startup.
- **Passwords:** bcrypt (10 rounds).
- **Rate limiting:** Global Throttler (100/min); **register** has 10/min; payments 20/min.
- **Webhooks:** Paystack and Flutterwave signatures verified before processing.
- **Production env:** `ENCRYPTION_KEY` and `SENTRY_DSN` required when `NODE_ENV=production`.

### 1.4 Monitoring & observability
- Sentry: backend `initSentry()` in `main.ts`, frontend in `main.tsx`; env validation requires DSN in prod.
- Health: `GET /api/health` and `GET /api/health/detailed` (DB + optional services).
- Graceful shutdown (SIGTERM/SIGINT), request IDs, structured logging.

### 1.5 Deployment assets
- `scripts/deploy.sh`: pull, install, migrate, build, PM2.
- `scripts/backup-db.sh`: timestamped backups, retention, optional S3.
- `docs/PRE_LAUNCH_CHECKLIST.md`, `docs/DEPLOYMENT_PROCEDURES.md`, incident runbook.
- Staging: `docker-compose.staging.yml`, `docker/nginx.staging.conf`, frontend Dockerfile.

### 1.6 Testing
- Wallet integration tests (9) cover deposits, idempotency, authz.
- Auth and payment idempotency suites exist (may need CI wiring).
- Backend unit tests run in CI.

---

## 2. Critical Fixes (Do Before First Real Users)

### 2.1 CI/CD health check URL — wrong path
**Issue:** Deploy step curls `http://localhost:3000/health`. Backend uses global prefix `api`, so the correct path is `/api/health`.  
**Action:** In `.github/workflows/ci-cd.yml`, change the post-deploy curl to:
`http://localhost:3000/api/health`  
**Status:** Fixed in this audit (see change in repo).

### 2.2 Rate limit on login
**Issue:** Register is throttled (10/min); login is only covered by global 100/min.  
**Risk:** Brute-force on passwords.  
**Action:** Add `@Throttle({ default: { limit: 10, ttl: 60000 } })` (or similar) to the login endpoint in `auth.controller.ts`.

### 2.3 Environment variable documentation
**Issue:**  
- Frontend: `VITE_GOOGLE_CLIENT_ID` is required for Google sign-in but not in `frontend/.env.example`.  
- Backend: Google server-side verify uses `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; not listed in `backend/.env.example`.  
**Action:**  
- Add `VITE_GOOGLE_CLIENT_ID=...` to `frontend/.env.example` with a short comment.  
- Add `GOOGLE_CLIENT_ID=...` and `GOOGLE_CLIENT_SECRET=...` to `backend/.env.example` (and ensure production env has them if Google login is used).

---

## 3. High‑Priority Gaps (Strongly Recommended)

### 3.1 Email verification not in signup flow
**Current:** `EmailService.sendVerificationEmail()` exists and builds a link to `/verify-email?token=...`. Registration in `auth.service.ts` does **not** call it; no `verificationToken` is created or stored; there is no `/verify-email` route or page in the frontend.  
**Impact:** You cannot enforce “verified email” for safety or support.  
**Options:**  
- **A)** Implement full flow: create/store verification token on register, send email, add `GET /auth/verify-email?token=...` and a frontend `/verify-email` page that calls it and marks user verified.  
- **B)** If you intentionally launch without email verification, document it and add a short-term roadmap item; ensure no UI claims “verify your email” unless you implement it.

### 3.2 Terms of Service and Privacy Policy
**Current:** No dedicated ToS or Privacy Policy routes/pages.  
**Impact:** Legal and trust risk in many jurisdictions; app stores and payment providers often require them.  
**Action:**  
- Add static (or CMS) pages, e.g. `/terms` and `/privacy`.  
- Link them in signup and footer.  
- If you use Google OAuth, ensure your OAuth consent screen links to a privacy policy URL.

### 3.3 Run integration tests in CI
**Current:** CI runs backend unit tests and frontend build/tests; it does **not** run `npm run test:integration` (e.g. wallet suite).  
**Action:** Add a CI job that runs backend integration tests with the same Postgres (and Redis if needed) used for unit tests, e.g.  
`cd backend && npm run test:integration -- --passWithNoTests` (or target wallet/auth suites).  
This protects against regressions in payments and auth.

---

## 4. Important but Not Blocking

### 4.1 Backend TODOs (non-blocking for launch)
- `academy.service.ts`: certificate URL is placeholder (“TODO: Generate actual certificate”).
- `order-notification.service.ts`: several “TODO: In production, send email” for order/fulfillment notifications.
- `payments/currency.service.ts`: “TODO: Implement Redis cache for production.”

These are acceptable for a soft launch if you accept delayed emails and no certificate generation; plan follow-up sprints.

### 4.2 Frontend production env checks
- No strict “fail fast” if `VITE_API_URL` is wrong in production (e.g. still pointing at localhost).  
- Consider a small runtime check on first API call or in a top-level component: if `import.meta.env.PROD` and `VITE_API_URL` is localhost or empty, show a clear error or warning. Optional but reduces misconfiguration risk.

### 4.3 Demo mode in production
- `VITE_DEMO_MODE` is documented; set to `false` in production.  
- Pre-launch checklist already says “Set to FALSE in production.”  
- Ensure staging/production build env actually sets `VITE_DEMO_MODE=false` so you never ship demo fallbacks to real users.

### 4.4 Backup script and DB port
- `backup-db.sh` uses `pg_dump` with parsed `DATABASE_URL`; ensure on EC2 the backend `.env` is the one used (path is correct).  
- If Postgres runs in Docker with a different port, `DATABASE_URL` must match (host/port).

---

## 5. What You Might Not Have Thought Of

### 5.1 First-run / empty state
- First deploy: no users, no temples, no products. Consider a seed or admin bootstrap (e.g. create first admin, or “welcome” content) so the first visitor sees a coherent experience.

### 5.2 Dependency and secret rotation
- Document how to rotate `JWT_SECRET`, `ENCRYPTION_KEY`, and DB password (invalidates existing sessions or requires re-encryption; do during maintenance).
- CI runs `npm audit` with `continue-on-error: true`. Schedule a recurring task to fix high/critical issues and optionally fail the build on critical.

### 5.3 Uptime and health checks
- Use the same URL you fixed in CI (`/api/health`) for UptimeRobot, Pingdom, or load balancer. If you add a separate “readiness” check (e.g. after DB connect), keep it lightweight.

### 5.4 Staging vs production parity
- Staging should mirror production (same env vars except values). Checklist: `NODE_ENV=production`, `VITE_DEMO_MODE=false`, real (or test) Sentry project, real (or test) payment webhooks. Run the same smoke tests on staging before each production deploy.

### 5.5 Post-launch monitoring
- Define “launch day” metrics: error rate &lt; 0.5%, p95 latency, signups, first payment. Use Sentry and your health/detailed endpoint; add a simple dashboard or alerts so you know within minutes if something breaks.

---

## 6. Recommended Order of Work

1. **Immediate (this week)**  
   - Fix CI health check to `http://localhost:3000/api/health`.  
   - Add login throttle (e.g. 10/min).  
   - Add `VITE_GOOGLE_CLIENT_ID` and Google server env vars to `.env.example` files.

2. **Before staging sign-off**  
   - Decide and implement or explicitly defer email verification (and document).  
   - Add `/terms` and `/privacy` pages and links (even minimal first versions).  
   - Run full staging smoke test (see `PRE_LAUNCH_CHECKLIST.md` Phase 10).

3. **Before production launch**  
   - Run integration tests in CI.  
   - Confirm production env: `VITE_DEMO_MODE=false`, `SENTRY_DSN`, `ENCRYPTION_KEY`, `JWT_SECRET`, Google client IDs if used.  
   - Verify backup script on target server and schedule (e.g. cron).

4. **Post-launch**  
   - Address backend TODOs (emails, certificate URL, Redis cache).  
   - Optional: frontend runtime check for `VITE_API_URL` in production.

---

## 7. Checklist Summary

| Item | Status |
|------|--------|
| CI health URL uses `/api/health` | ✅ Fixed in workflow |
| Login endpoint rate limited | ⬜ Add @Throttle |
| Google env vars in .env.example | ⬜ Add |
| Email verification (implement or document deferral) | ⬜ Decide + do |
| Terms of Service page + link | ⬜ Add |
| Privacy Policy page + link | ⬜ Add |
| Integration tests in CI | ⬜ Add job |
| Staging smoke test passed | ⬜ Run |
| Production env verified | ⬜ Pre-launch |
| Backups scheduled and tested | ⬜ Pre-launch |

---

**Document owner:** Engineering  
**Next review:** After completing critical and high-priority items, then again before April 1 launch.
