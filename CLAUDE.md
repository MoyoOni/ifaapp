# AI Agent Development Guide - Ìlú Àṣẹ Platform

This document provides context for AI agents working on the Ìlú Àṣẹ platform. Read this before starting any development work.

**Project:** Ìlú Àṣẹ - Digital Sanctuary for Ifá Spiritual Community
**Production:** LIVE at https://iluase.com

---

## Required Reading Before Coding

**[ILUASE_V1_BACKLOG.md](ILUASE_V1_BACKLOG.md) is the single source of truth for what's left to build or fix.** Read it before picking up any task. It consolidates every open item from every other backlog doc in this repo (V8/ADMIN/VENDOR/SHOP/COMMUNITY/EXPERIENCE/Z1/ProBacklog-v1/V5/V9/HUMAN/MVP_PIVOT), each with its original story ID preserved so you can find the full detail in the source doc if you need it.

**All 13 of those source docs are superseded** — each has a banner at its own top saying so. They're still useful for the *detailed* per-story reasoning (file:line references, why a decision was made a certain way), but none of them should be used to decide what to work on next, and several of their own "✅ DONE"/completion headlines turned out to be wrong once someone actually checked the code. `ILUASE_V1_BACKLOG.md` explains its own confidence levels — read that doc's own intro before trusting any single line in isolation.

**Platform history, for context:** V1 (28 EPICs, feature development), V2 (production readiness, folded into V4), V4 (10 sprints, production launch), V5 (real-data wiring, 8 sprints), V8 (monetisation/Devoted tier), V9 (forum launch), and Z1 (final consolidated hardening sprints) are all effectively complete phases. Nothing about "what phase are we in" matters for day-to-day work anymore — `ILUASE_V1_BACKLOG.md` is phase-agnostic and organized by domain (money/security, structural debt, then feature area) instead.

**[SPIRITUAL_JOURNEY_EVALUATION.md](SPIRITUAL_JOURNEY_EVALUATION.md)** still holds the decision record on the deferred spiritual journey feature, referenced from the master backlog's MSP-021 entry.

---

## After Each Implementation

After completing any task:

1. **Update `ILUASE_V1_BACKLOG.md`** — move the item from wherever it sits into the ✅ "What's Actually Fully Done" section (don't delete it — keep a one-line note of what was wrong and what fixed it, the same way this doc's own items are annotated). If you found and fixed something not already tracked there, add it with a 🔵 "verified/fixed this session" tag.
2. **If the fix touched a source backlog doc's specific story** (e.g. a VND-XXX or FOR-XXX item), it's fine to also add a status note in that source doc for the detailed record — just make sure `ILUASE_V1_BACKLOG.md` reflects it too, since that's what the next session will actually read.
3. **Update this file's "Current Status" section below** if the change affects platform-wide facts (infrastructure, architecture conventions, what's paused).

---

## Current Status (Last Updated: November 2, 2026)

**Production is LIVE at https://iluase.com.**

**Browser testing is available** (Playwright is in the repo's `node_modules`; Chromium + WebKit are installed). Driving the real UI against production found bugs that months of unit and API tests did not — new users could not finish onboarding, sessions ended after ~30 minutes, logout never revoked anything, and checkout could report success for an order that failed. For anything that touches auth, onboarding, checkout or the marketplace, don't stop at unit tests. Do NOT push real money or public content through production: run the backend and Vite against a throwaway local Postgres/Redis instead, and delete any test accounts you create on production afterwards.

**Whole-app UX/UI wiring audit — 🟢 VERIFIED FULLY DONE (July 28, 2026).** A prior session found ~30 wiring issues across CLIENT/BABALAWO/VENDOR/ADMIN (403s from calling role-gated endpoints, dead links to unregistered routes, dead buttons, duplicate routes/components, fake data) and planned a 5-phase fix. Every item was independently re-verified against the actual current code on July 28 and all 30 were already fixed. That audit was done by reading code, not by clicking through the app, and it was **not** exhaustive: a September 21, 2026 browser pass found further wiring bugs it missed (every marketplace product link 404'd, `PATCH /users/:id/onboarding` always 403'd so no one could finish onboarding, checkout fabricated a "successful" demo order on any failure). Treat "verified done" claims here as "verified by inspection" and prefer a real browser run for anything user-facing.

**Payments, email and notifications (November 2, 2026):** production's Paystack key is a *test* key, so `backend/src/payments/live-payments.ts` refuses every payment and Devoted checkout (503) until a live key is set; Devoted plan codes are unset. SES production access was granted November 4, 2026 (email reaches any address; verified live November 5). WhatsApp has no credentials on production (nothing is sent; the UI hides it). Marketing email is opt-in (`NotificationPreferences.emailMarketing`, default false) and admin campaigns honour it. Check these before assuming members receive anything. `SesEmailService` silently skips reserved domains (`example.com`, `.invalid`, `.test`) — erased accounts get `@deleted.iluase.invalid`.

**Access control (November 6, 2026, live):** bans and suspensions are enforced on login, every request and token refresh (`accountBlock()` in `auth/strategies/jwt.strategy.ts`); admin force-logout sets `User.sessionsRevokedAt`. Before then neither ended access.

**Paused / Deprioritized Platform Dependencies — Single Source of Truth:**
- **Consultations & 1:1 Messaging** — paused platform-wide per `MVP_PIVOT_BACKLOG.md` (frontend-only, reversible; all 14 PIV-XXX stories verified done July 28, 2026). Blocks several items listed in `ILUASE_V1_BACKLOG.md` — see that doc's "📌 Paused Platform Features" section for the full current list rather than restating it here every time something new depends on it.
- **Spiritual Journey feature** — exists and is routed (`/client/spiritual-journey`), but is deprioritized for the current window, not actively paused. Confirm current priority with this feature's owner before scheduling dependent work.

**Demo/Quick-Access Mode is a permanent dev/QA feature, not legacy cruft** (formalized July 4, 2026). `devLogin()` in `use-auth.ts` (gated behind `dev_mode_role` in localStorage) is an intentional internal tool for demos and local QA. Every read of `dev_mode_role`/`VITE_DEMO_MODE`/`VITE_ENABLE_DEMO_MODE` across the frontend goes through `isDevModeActive()` (`shared/utils/dev-mode.ts`), which wraps the check in `import.meta.env.DEV` — statically `false` in a production build, so a stray `dev_mode_role` value in a real user's localStorage can never have any effect. `devLogin()` itself also refuses to run under `NODE_ENV=production`. When adding a new query/mutation that should be demo-mode-aware, follow this existing pattern rather than inventing a new gating mechanism.

**Infrastructure (verified September 21, 2026 against the live box — the ECS/RDS/ElastiCache/ALB setup this section used to describe was retired March 25, 2026; see `docs/active/DISASTER_RECOVERY_REBUILD_PLAN.md`):**
- **Production** — ONE EC2 instance, `iluase-prod-single` (`i-0ac1e9e2c4984af72`, t3.small), behind CloudFront (distribution `EHB5M2I36BDVR`, aliases iluase.com/www). Docker Compose at `/home/ubuntu/app/docker-compose.yml` runs `postgres`, `redis`, `backend`, `nginx` (the frontend; container `iluase-frontend`) and `proxy`. Postgres/Redis are self-hosted containers on the box's own EBS volume — there is no RDS, ElastiCache, ALB or ECS. Images come from ECR (`iluase/backend`, `iluase/frontend`, account `091653536932`).
- **Deploying** is manual, from a dev machine: build `--platform linux/amd64`, push to ECR, then on the box `docker compose pull <service> && docker compose up -d --no-deps <service>` (frontend service is `nginx`), then `docker compose exec -T proxy nginx -s reload` (since November 6, 2026 the proxy re-resolves the backend by itself — `docker/proxy.production.conf` — so this only makes it immediate; before that a recreate 502'd `/api/*`, October 31). Build with `scripts/build-push-images.sh`. Full steps in `docs/active/DEPLOYMENT_PROCEDURES.md`. Two other things have bitten real deploys: the box's ECR login expires after 12h (re-run `aws ecr get-login-password | docker login` there or `pull` fails with "authorization token has expired" — and piping/grepping its output hides it), and a piped `docker build | tail` reports success when the build failed. **Verify by digest**: the running container's image digest must equal the one in ECR. No shell key is kept for the box; use EC2 Instance Connect (documented in the deploy doc).
- **Disk** — the box has a 20 GB root disk shared by Postgres, images and logs. It filled on November 2, 2026 (a 3.8 GB unrotated proxy access log + dangling images) and broke a deploy. Container logs are capped at 3×50 MB (`scripts/cap-prod-logs.sh`, installed November 6, 2026); before a deploy check `df -h /` on the box, and `sudo docker image prune -f` clears old dangling images.
- **Backups** — `scripts/backup-prod-db.sh` runs on the box every 6h to a private S3 bucket (there is no RDS snapshotting).
- **Staging** — there is no staging server: the old box (100.52.200.113) no longer exists in the AWS account (verified October 27, 2026), and CI's `deploy-staging` job was removed. Use the local Docker staging stack (`docker-compose.staging.yml`).
- **CloudFront CDN** — iluase.com + www.iluase.com → CloudFront, `/api/*` uncached, statics CachingOptimized
- **Monitoring & alerts** — Route53 health checks + CloudWatch alarms `iluase-prod-uptime`, `iluase-prod-health-check` and `iluase-prod-db-backup-missing` (no successful backup in 12h), all notifying SNS topic `iluase-prod-alerts` (email). Until October 27, 2026 the uptime alarms had no actions and alerted nobody. **Sentry error tracking** runs on both frontend and backend (EU region); the backend's was never installed until October 30, 2026, so earlier backend errors exist only in container logs. The on-box backup script is `/home/ubuntu/app/backup-prod-db.sh`, not under `scripts/`.
- **Email** — AWS SES (us-east-1), sending only as `noreply@iluase.com` (inline policy `prod-ses-send-noreply` on role `iluase-ec2-ecr`); `iluase.com` is DKIM-verified. Until October 29, 2026 production could send no email at all (no SES permission, DKIM `FAILED`). **SES production access was granted November 4, 2026** (case `179329385400452`): email reaches any address. Bounces and complaints notify `iluase-prod-alerts`. When testing on production, register with AWS's simulator addresses (`success+<tag>@simulator.amazonses.com`), never `@example.com` — real bounces hurt the sending reputation.
- **Shareable profile URLs** — `slug` field on User, `GET /public/resolve/:slug` (no auth), `/:slug` route. The resolver was never registered until November 2, 2026 (every share link 404'd); it respects `profileVisibility`.

---

## Overview

npm-workspaces monorepo: `frontend` (React 19, Vite 6, Tailwind 3, TanStack Query, React Router 7 with `<BrowserRouter>`), `backend` (NestJS 11, Prisma 5, Postgres, Redis, Socket.IO), `common` (shared Zod schemas, built to `common/dist`). The same frontend build ships as the website and, wrapped by Capacitor 8, as the iOS and Android apps (see Mobile below). Node 20 is the default; the Capacitor CLI needs Node 22.

## Commands

All verified November 23, 2026. Run from the repo root unless noted.

```bash
npm install                          # all workspaces
(cd backend && npx prisma generate)  # REQUIRED after any npm install: installs wipe the
                                     # generated client and backend tsc then shows ~100 bogus errors

npm run dev               # backend + frontend together
npm run dev:frontend      # Vite on http://localhost:5173, proxies /api → http://localhost:8080
npm run dev:backend       # Nest on PORT from backend/.env (local dev uses 8080; built-in default 3000)

(cd frontend && npx tsc --noEmit)   # type-check — the real gate (lint is not, see below)
(cd backend && npx tsc --noEmit)
(cd frontend && npx vitest run)     # frontend unit tests (332)
(cd backend && npx jest)            # backend unit tests (~1,400)
npm run test:e2e -- --project=chromium   # Playwright; starts Vite itself. 8 known failures,
                                         # see ILUASE_V1_BACKLOG.md → Structural
npm run lint:check -w backend       # informational only: ~2,100 existing problems
```

- **Don't use `npm run lint` as a gate** (frontend ~2,265 problems, backend ~2,111; CI doesn't run it) and don't run the backend's `lint` without meaning to — it has `--fix`.
- **A backend with a real database, without touching anything you didn't create** (other projects' containers hold 5432/6379 on this machine): start a throwaway Postgres + Redis on free ports, override the env for that one process, and apply migrations. Environment variables win over `backend/.env`.
  ```bash
  docker run -d --rm --name iluase-verify-pg -e POSTGRES_PASSWORD=verify -e POSTGRES_DB=iluase_verify -p 5439:5432 postgres:16-alpine
  docker run -d --rm --name iluase-verify-redis -p 6389:6379 redis:7-alpine
  export DATABASE_URL='postgresql://postgres:verify@localhost:5439/iluase_verify?schema=public'
  (cd backend && npx prisma migrate deploy)
  (cd backend && REDIS_URL=redis://localhost:6389 REDIS_HOST=localhost REDIS_PORT=6389 REDIS_PASSWORD= npx nest start)
  # done: docker stop iluase-verify-pg iluase-verify-redis
  ```
- **Check cold-start/loading behaviour on a production build** (`npm run build -w frontend`, then `npx vite preview` in `frontend/`, port 4173), not on `vite` dev: React StrictMode's dev double-mount changes module-level state such as `RouteFallback`'s first-page flag.

## Architecture

```
backend/
  src/<domain>/          # Nest modules by domain (auth, forum, marketplace, circles, academy, admin, …)
  src/seeding/           # demo data ecosystem
  prisma/schema.prisma   # schema; prisma/migrations/ — never edit by hand
  prisma/seed-*.ts       # seeds (npm run seed:* -w backend)
  Dockerfile.production
frontend/
  src/features/<domain>/ # screens by domain
  src/shared/            # components (incl. ui/ primitives), hooks, utils, config
  src/lib/               # api.ts, api-base.ts, token-store.ts, native.ts, socket.ts
  src/demo/              # demo ecosystem data (frontend side)
  e2e/                   # Playwright tests
  ios/ android/          # Capacitor native projects (committed; build output inside them is ignored)
  capacitor.config.ts
  Dockerfile.production  # static build served by the box's nginx container
common/                  # shared Zod schemas/enums
docker/                  # nginx.production.conf, proxy.production.conf (do not edit casually)
docker-compose.production.yml, docker-compose.staging.yml
scripts/                 # deploy, backups, ssh-prod.sh, build-push-images.sh, seeding
docs/active/             # operational docs in current use; docs/archive/ = history
```

Production is one EC2 box behind CloudFront — see Current Status → Infrastructure above, and `docs/active/DEPLOYMENT_PROCEDURES.md`. The repo's `docker-compose.production.yml` has drifted from the box's own `/home/ubuntu/app/docker-compose.yml` (which hard-codes `CORS_ALLOWED_ORIGINS`); reconciling them is an open backlog item, so check the box's file before assuming the repo's is live.

## Conventions

- **API URLs** go through `apiUrl()` / `API_BASE_URL` in `frontend/src/lib/api-base.ts` (relative `/api` on the web, absolute in the native apps). Don't hard-code `/api/...` in `fetch` calls.
- **Session tokens** are read and written only through `tokenStore` (`frontend/src/lib/token-store.ts`) — never `localStorage.getItem('accessToken')` directly. On native it is a Keychain/Keystore-backed cache loaded before first render.
- **Native plugin calls** (haptics, status bar, keyboard, back button, splash) live in `frontend/src/lib/native.ts` and are no-ops on the web. Use `tapHaptic()` rather than importing `@capacitor/haptics` in a component.
- **Dialogs** use `shared/components/ui/dialog.tsx`, which is a bottom sheet below 640px. Prefer it over a hand-built `fixed inset-0` overlay. Confirmations use `useConfirm` + `ConfirmationDialog`, never `window.confirm()`.
- **Navigation** that should animate uses `navigateWithTransition()` (`shared/utils/nav-transition.ts`); React Router's `viewTransition` option does nothing with `<BrowserRouter>`.
- **Route-level Suspense fallbacks** are `<RouteFallback />` (branded on cold start, light spinner afterwards), not `<LoadingSpinner />`.
- **Demo mode** goes through `isDevModeActive()` (see Current Status). **No fabricated data** and **proper Yoruba names and diacritics** (see Engineering Principles).
- Lockfile: install with exact versions for Capacitor packages (`--save-exact`); a caret once pulled a second copy of `@capacitor/core`.

## Security

- **Never read or modify `.env` files or expose secrets.** That includes `.env.example`, `.env.production` and backups like `.env.bak`; `.claude/settings.json` denies reading them. If a value is needed, ask the user, or observe behaviour instead (e.g. which port the backend binds) without opening the file.
- Don't touch `prisma/migrations/`, `frontend/.env.production` or `docker/proxy.production.conf` without an explicit ask.
- Production changes (the box, CloudFront, AWS) need the user's explicit go-ahead each time. `scripts/ssh-prod.sh` temporarily opens port 22 to your IP and closes it afterwards; box commands need `sudo`.
- No real money or public content through production (see Current Status).

## Mobile (Capacitor 8 — iOS + Android)

App ID `com.iluase.app`, set in `frontend/capacitor.config.ts` (and the native projects). The apps load the bundled frontend build and call the production API.

**Readiness check before any mobile work** (each gap found mid-task cost hours on November 18):
```bash
. ~/.nvm/nvm.sh && nvm use 22 && node -v      # ≥ 22 (nvm is a shell function; `which nvm` finds nothing)
xcode-select -p && xcodebuild -version         # Xcode installed, licence accepted
xcrun simctl list runtimes                     # an iOS runtime is present
/usr/libexec/java_home -V                      # a JDK 21 for Gradle (or JAVA_HOME set)
cat frontend/android/local.properties          # sdk.dir=… (ignored file; ANDROID_HOME also works)
df -h ~ && docker system df                    # > 20 GB free; Docker build cache can reach 40 GB
```

**Build and run:**
```bash
cd frontend && . ~/.nvm/nvm.sh && nvm use 22
VITE_API_URL=https://iluase.com/api npm run build   # REQUIRED: without it the app calls relative /api and nothing loads
npx cap sync                     # copies the build + plugins into ios/ and android/
npx cap open ios                 # Xcode → pick a simulator → Run
(cd android && ./gradlew assembleDebug)   # → android/app/build/outputs/apk/debug/app-debug.apk
```

- **API URL strategy:** the web build uses relative `/api` (same origin through CloudFront). Native apps have no same origin, so `VITE_API_URL` must be set **in the shell** at build time (a shell variable overrides the `.env` files). Production CORS must allow `capacitor://localhost` (iOS) and `https://localhost` (Android) — it does, but on the box that list is hard-coded in its compose file (see Architecture).
- **Version bumps:** Android `versionCode`/`versionName` in `frontend/android/app/build.gradle`; iOS `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` in the Xcode target (General → Identity). `versionCode` must increase for every store upload.
- **Icons and splash** are generated from `frontend/assets/` with `@capacitor/assets` (background `#252423`).
- **Push notifications** are wired but gated off (`VITE_PUSH_ENABLED` must be `'true'`; no Firebase config is set).
- **Do not touch without an explicit ask:** `AndroidManifest.xml` permissions, signing configs and keystores, the app ID, iOS entitlements.
- **Versions:** `@capacitor/core`/`ios`/`android` 8.5.3, CLI 8.4.1 (deferred upgrade, see backlog). Install new Capacitor plugins with `--save-exact`, then `npx cap sync`.
- Current state of each platform (what's verified on iOS, what's never run on Android) is in `ILUASE_V1_BACKLOG.md` → Feature Gaps → Mobile App.

## Domain Context

### Demo Data Source of Truth
- **Location:** `backend/src/seeding/demo-ecosystem.ts`
- **Frontend:** `frontend/src/demo/demo-ecosystem.ts`
- All demo scenarios use this unified data.

### User Roles
- **Client:** Book consultations, receive guidance, purchase products
- **Babalawo:** Provide consultations, create guidance plans, manage availability
- **Vendor:** Sell sacred items, manage inventory, process orders
- **Admin:** Platform management, verification queue, disputes

---

## Engineering Principles

1. **No feature is "done" without tests.** Backend unit tests (Jest), frontend component tests where practical (Vitest + React Testing Library), and live/E2E verification for anything money- or security-adjacent — see `ILUASE_V1_BACKLOG.md`'s 🟠 Structural section for where test coverage still falls short of any stated target.
2. **Observability matters.** Structured logging + error tracking (Sentry, frontend and backend) on anything new.
3. **Demo mode must be explicit.** No silent fallbacks in production — production errors should surface, not get swallowed. Use the existing `isDevModeActive()` pattern (see Current Status above), don't invent a new one.
4. **Verify against real code, not doc claims.** This repo's backlog docs have repeatedly claimed things were "✅ DONE" when the backend endpoint didn't exist, or vice versa. Before relying on any status claim — including in `ILUASE_V1_BACKLOG.md` itself for anything marked 📄 rather than 🔵 — do a quick spot-check against the actual running code if the task depends on it being true.
5. **Don't fabricate data.** If a metric/feature can't be honestly computed from real data, say so in the UI ("not yet tracked") rather than inventing a plausible-looking number.
6. **Cultural authenticity matters** — use proper Yoruba names and terminology; this is a spiritual-community platform, not a generic marketplace/forum template.
