# AI Agent Development Guide - Ìlú Àṣẹ Platform

This document provides context for AI agents working on the Ìlú Àṣẹ platform. Read this before starting any development work.

**Project:** Ìlú Àṣẹ - Digital Sanctuary for Ifá Spiritual Community
**Demo Deadline:** February 12, 2026
**Launch Deadline:** APRIL 1, 2026

---

## Required Reading Before Coding

### V5 Phase (The Real Platform) — ✅ COMPLETE (Audited March 20, 2026)

Before working on any wiring, real-data, or UX fix work, AI agents MUST read:

1. **[V5_BACKLOG.md](V5_BACKLOG.md)** — Full backlog: 8 sprints, 187 SP, all stories with technical specs, file maps, API endpoints, logic flows, and acceptance criteria.

**Goal:** Remove all demo data fallbacks. Connect every view to the real backend. Make ADMIN, BABALAWO, VENDOR, and CLIENT fully functional.

**Labeling:** `V5-XXX` stories
**Branch:** `v5/real-platform`

**Sprint Status:**
- Sprint 1: Foundation & Quick Wins (24 SP) — ✅ COMPLETED
- Sprint 2: Admin Dashboard Real Data (42 SP) — ✅ COMPLETED
- Sprint 3: User Profiles Edit & Share (20 SP) — ✅ COMPLETED
- Sprint 4: Client Experience (18 SP) — ✅ COMPLETED
- Sprint 5: Babalawo Real Data (20 SP) — ✅ COMPLETED
- Sprint 6: Vendor Real Data (18 SP) — ✅ COMPLETED
- Sprint 7: Advanced Platform Features (30 SP) — ✅ COMPLETED
- Sprint 8: Polish, Performance & UX (15 SP) — ✅ COMPLETED

---

### V1 Phase (Feature Development) — ✅ COMPLETE

Before implementing any V1 feature, AI agents MUST read these documents in order:

1. **[V1_PRODUCT_BACKLOG.md](V1_PRODUCT_BACKLOG.md)** - Product backlog with EPIC-XXX / PB-XXX.Y labels; includes Codebase Audit findings
2. **[V1_DEVELOPMENT_PROGRESS.md](V1_DEVELOPMENT_PROGRESS.md)** - Current status; what's routed vs orphaned (CODE EXISTS but not reachable)
3. **[V1_AI_SESSION_HANDOFF.md](V1_AI_SESSION_HANDOFF.md)** - Handoff context for AI agents
4. **[SPIRITUAL_JOURNEY_EVALUATION.md](SPIRITUAL_JOURNEY_EVALUATION.md)** - Decision on deferred features (spiritual journey is P3, deferred)

**Status:** V1 feature development is COMPLETE. All 28 EPICs built and routed.

---

### V2 Phase (Production Readiness) — ✅ COMPLETE

V2 docs have been archived to `docs/archive/`. All production readiness work folded into V4 sprints 6-8.

---

### V4 Phase (Production Launch) — 🔵 IN PROGRESS (Target: April 2026)

Before working on production launch tasks, AI agents MUST read:

1. **[V4_QUALITY_BACKLOG.md](V4_QUALITY_BACKLOG.md)** - Full detailed backlog (10 sprints, stories, 241 story points)
2. **[V4_TODO.md](V4_TODO.md)** - Quick reference with execution order and task breakdowns

**10 Sprints (241/241 SP = 100% complete — ALL SPRINTS DONE):**
- Sprint 1: 🔥 Foundational Trust and Cleanup (24 SP) — ✅ COMPLETED
- Sprint 2: 🎨 Design System and UI Consistency (18 SP) — ✅ COMPLETED
- Sprint 3: ✨ User Experience Polish (26 SP) — ✅ COMPLETED
- Sprint 4: ♿ Accessibility and Mobile (21 SP) — ✅ COMPLETED
- Sprint 5: 🔌 Backend and Real-Time (20 SP) — ✅ COMPLETED
- Sprint 6: 🚢 Production Hardening (20 SP) — ✅ COMPLETED
- Sprint 7: 🐛 Critical Bug Fixes (16 SP) — ✅ COMPLETED
- Sprint 8: 🛡️ Production Hardening (27 SP) — ✅ COMPLETED
- Sprint 9: 🔐 Pre-Launch Polish / No AWS (20 SP) — ✅ COMPLETED
- Sprint 10: ☁️ AWS Infrastructure & Go-Live (45 SP) — ✅ COMPLETED (V6-201 through V6-209 all done)

**V4-708:** Spiritual journey — not shipping for launch, may revisit later in 2026.

**Labeling:** V4-XXX (frontend quality), V5-XXX (backend), V6-XXX (infrastructure), V7-XXX (bug fixes)
**Branch:** `v4/quality` — commits per story, PR per sprint, merge to main after smoke test

---

## Current Status (Last Updated: April 17, 2026)

**Production is LIVE at https://iluase.com**
**ALL 10 SPRINTS COMPLETE — 241/241 SP. V9 FORUM LAUNCH: 4/5 Stories DONE.**

### Experience Backlog — 🔵 IN PROGRESS (April 18, 2026)

Active work tracked in **[EXPERIENCE_BACKLOG.md](EXPERIENCE_BACKLOG.md)**.

**Completed stories (April 18, 2026):**
- ✅ EXP-028 · Smart Dashboard CTAs — `JourneyCtaCard` + `deriveDashboardState()`, wired to client dashboard
- ✅ EXP-015 · Guidance Plan Templates — `GuidancePlanTemplate` model, 3 endpoints, template chips UI in prescription form
- ✅ EXP-014 · Client Relationship Timeline — merged appointments + guidance plans endpoint, `ClientTimeline` in My Seekers
- ✅ EXP-017 · Advanced Availability Rules — extended availability JSON (blackout dates, advance booking window, min notice), full SetAvailability UI
- ✅ EXP-018 · Post-Session Follow-Up Prompt — `scheduledAt` on Notification, 24h delayed follow-up, action buttons in notification dropdown
- ✅ EXP-022 · Rebooking Shortcuts — real-data client consultations view, "Book Again" buttons, weekly cron nudge service
- ✅ EXP-027 · Referral Programme (All Clients) — universal referral panel, ₦500 first-booking reward, WhatsApp/Email share, reward on appointment complete
- ✅ EXP-029 · Spiritual Milestones & Badges — `GET /users/:id/badges` (7 computed milestones), badge strip with hover tooltips on profile

**Schema migrations added:**
- `20260418000003_add_guidance_plan_templates` — `GuidancePlanTemplate` table
- `20260418000004_add_notification_scheduled_at` — `scheduledAt` column on `Notification`

**Next:** EXP-030 (Onboarding A/B Test Infrastructure) or any Sprint 9 story

---

### Admin Operations Backlog — 🔵 IN PROGRESS (April 17, 2026)

Active work tracked in **[ADMIN_BACKLOG.md](ADMIN_BACKLOG.md)** — 32 stories (ADM-001 through ADM-032).

**Sprint 1 (Daily Operations) — ✅ COMPLETE:**
- ✅ ADM-001 Morning Dashboard — `GET /admin/morning-brief`, signups/revenue/pending-actions/forum/health
- ✅ ADM-002 User Role Management UI — role change dialog with mandatory reason, ADMIN sub-role picker, audit log
- ✅ ADM-003 User Suspension & Ban System — `suspendedUntil`/`bannedAt`/`banReason`/`warnCount` in schema, service wired, frontend modals
- ✅ ADM-004 Forum Category & Thread Management — backend API + frontend tab (category create/archive/reorder wired)
- ✅ ADM-005 Platform Announcement System — `Announcement` model + migration, full CRUD wired to DB

**Sprint 2 (Practitioner Operations) — ✅ COMPLETE:**
- ✅ ADM-006 Practitioner Performance Dashboard — service + frontend tab
- ✅ ADM-007 Featured Practitioners — `isFeatured`/`featuredOrder`/`featuredExpiry` in schema + migration, fully wired
- ✅ ADM-008 Practitioner Complaint Handling — `PractitionerComplaint` model + migration, full CRUD wired to DB
- ✅ ADM-009 Trust Score Management — `trustScoreOverride` fields, breakdown/update/history endpoints, frontend tab
- ✅ ADM-010 Inactive Practitioner Re-engagement — threshold control, mark-on-leave/deactivate/reactivate actions
- ✅ ADM-011 Financial Command Centre — 7 metrics + 6-month Recharts revenue chart, ₦ NGN

**Sprint 3 (Revenue Operations) — ✅ COMPLETE:**
- ✅ ADM-012 Refund Management UI — `RefundRequest` model + migration, full CRUD endpoints, `admin-refunds-tab.tsx`
- ✅ ADM-013 Subscription Management — active/churn/failed-payment views, cancel/extend/send-reminder actions
- ✅ ADM-014 Commission Rate Settings — `PlatformSettings` singleton model + migration, `admin-settings-tab.tsx` with live preview

**Sprint 4 (Content & Community Management) — ✅ COMPLETE:**
- ✅ ADM-015 Cultural Content Calendar — `OralHistoryEntry` + `SacredCalendarEvent` models, 12 endpoints, `admin-cultural-content-tab.tsx`
- ✅ ADM-016 Featured Content Management — `isFeatured`/`featuredUntil` on ForumThread/Product/Course/Circle, 3 endpoints, `admin-featured-content-tab.tsx`
- ✅ ADM-017 Community Recognition System — `UserBadge` model + migration, getCommunityStars/awardBadge/revokeBadge endpoints, `admin-community-tab.tsx`
- ✅ ADM-018 Cultural Integrity Review Queue — `heldForReview` on ForumPost + `ContentFlagRule` model, 7 endpoints, `admin-integrity-tab.tsx`
- ✅ ADM-023 Forum Intelligence Dashboard — wired `GET /forum/admin/metrics` to `admin-forum-intelligence-tab.tsx`

**Sprint 5 (Growth & Marketing Tools) — ✅ COMPLETE:**
- ✅ ADM-019 Segmented Email Campaigns — `EmailCampaign` model + migration, getCampaigns/createCampaign/sendCampaign/deleteCampaign endpoints, `admin-campaigns-tab.tsx`
- ✅ ADM-020 Promo Code & Discount System — `PromoCode` + `PromoRedemption` models + migration, CRUD endpoints, `admin-promos-tab.tsx`
- ✅ ADM-021 Referral Program Management — uses existing `Referral` model, stats/list/credit endpoints, `admin-referrals-tab.tsx`

**Sprint 6 (Deep Analytics & Intelligence) — ✅ COMPLETE:**
- ✅ ADM-023 Forum Intelligence Dashboard — wired `GET /forum/admin/metrics` to `admin-forum-intelligence-tab.tsx`
- ✅ ADM-024 Practitioner Leaderboard & Market Intelligence — `getPractitionerLeaderboard()`, `getMarketIntelligence()` service methods, controller endpoints, `admin-market-intelligence-tab.tsx` with leaderboard + demand signals
- ✅ ADM-025 Revenue Forecasting — `getRevenueForecasts()` service method, controller endpoint, `admin-forecasting-tab.tsx` with scenario modeling + trend charts

**Schema migrations (April 16–17):**
- `20260416000003_add_admin_suspension_featured_complaint` — `suspendedUntil`, `bannedAt`, `banReason`, `warnCount`, `isFeatured`, `featuredOrder`, `featuredExpiry` on `users`; `Announcement`, `PractitionerComplaint` tables
- `20260416000005_add_platform_settings` — `PlatformSettings` singleton table
- `20260417000001_add_cultural_content` — `OralHistoryEntry`, `SacredCalendarEvent` tables
- `20260417000002_add_featured_content` — `isFeatured`/`featuredUntil` on ForumThread/Product/Course/Circle
- `20260417000003_add_user_badges` — `UserBadge` table
- `20260417000004_add_cultural_integrity_queue` — `heldForReview`/`reviewReason`/`reviewedBy`/`reviewedAt` on ForumPost; `ContentFlagRule` table
- `20260417000005_add_sprint5_campaigns_promos_referrals` — `EmailCampaign`, `PromoCode`, `PromoRedemption` tables

**Next:** ADM-022 User Lifecycle Analytics (Sprint 7 — TBD)

### Demo Data Cleanup — 🟢 Demo/Quick-Access Mode Is a Permanent Dev/QA Feature (P2-02, formalized July 4, 2026)

The March 24 pass below removed demo *fallback data* from the real user-facing views. It did not remove — and was never intended to remove — the separate quick-access/dev-login mechanism (`devLogin()` in `use-auth.ts`, gated behind `dev_mode_role` in localStorage), which is an intentional, permanent internal tool for demos and local QA, not legacy cruft. As of July 4, 2026 that mechanism has been formalized rather than deleted:

- Every read of `dev_mode_role`/`VITE_DEMO_MODE`/`VITE_ENABLE_DEMO_MODE` across the frontend (46 files) now goes through `isDevModeActive()` (`shared/utils/dev-mode.ts`), which wraps the check in `import.meta.env.DEV` — statically `false` in a production build, so Rollup tree-shakes the branch out entirely. A stray `dev_mode_role` value in a production user's localStorage (however it got there) can never have any effect.
- `devLogin()` itself already refused to run under `NODE_ENV=production` (P0-02); this closes the same gap on every *read* site, not just the write site.
- `vite-env.d.ts`'s `VITE_DEMO_MODE`/`VITE_ENABLE_DEMO_MODE` type declarations restored (were commented out, describing behavior that no longer matched the code).

**What the March 24, 2026 pass originally did** (demo *fallback data* removal, separate from the above):
- Removed demo data fallbacks from: `temple-detail-view.tsx`, `circle-detail-view.tsx`, `thread-view.tsx`, `lesson-player-view.tsx`, `course-detail-view.tsx`, `prescription-creation-form.tsx`, `BookingConfirmation.tsx`, `BookingPage.tsx`, `BookingForm.tsx`
- Added `enabled: !localStorage.getItem('dev_mode_role')` guards to: `academy-view.tsx`, `babalawo-discovery-view.tsx`, `temple-connection-view.tsx` (both queries)
- Fixed React Rules of Hooks violation in `BookingForm.tsx` (hooks now declared before conditional return)
- Removed fake `demo-apt-*` sessionStorage appointment creation from booking flow

**Platform health (all roles verified — March 24, 2026):**
- ✅ **CLIENT** — Booking flow, consultations, academy, marketplace all working with real data
- ✅ **BABALAWO** — Discovery, profile, booking management working
- ✅ **VENDOR** — Marketplace, orders working
- ✅ **ADMIN** — Dashboard, reports, forum moderation working
- ✅ No 401 spam in dev mode (all queries properly gated)
- ✅ No demo content surfacing as real data to users

### V9 Forum Launch — Sprint 9 (Just Completed March 23, 2026)

✅ **F9-901: Practitioner Trust Score** — `trustScore` field added to User, `recomputeTrustScore()` and `getTrustScoreTier()` methods implemented, `trust-score-badge.tsx` component created

✅ **F9-902: Cultural Onboarding Gate** — `passedCulturalOrientation` field added, validation in `createPost()`, modal with 3 questions requiring 2/3 correct, `PATCH /users/:id/cultural-orientation` endpoint

✅ **F9-903: Forum Health Metrics** — `getDetailedMetrics(period)` method implemented, `GET /forum/admin/metrics?period=7d|30d|90d` endpoint for admin analytics

🟡 **F9-904: Oral History Archive** — Deferred to separate seeding task (structure ready)

✅ **F9-905: Youth Corner Category** — 10th category added to seed script, will appear after `npm run seed:forum-categories`

**Database:** Migration `20260323000010_add_sprint9_trust_and_onboarding` applied ✅  
**Backend Build:** PASS ✅  
**Frontend Build:** PASS ✅

### Infrastructure (March 16, 2026) — Still Valid

✅ **Staging** — EC2 t3.small, Docker Compose, http://100.52.200.113:4040
✅ **Production** — ECS Fargate (2×backend task def :8 / 2×frontend), multi-AZ RDS Postgres 16, Redis 7 cluster, ALB, ACM wildcard cert, Route53 DNS
✅ **CloudFront CDN** — Distribution EHB5M2I36BDVR (d1y1pwa2hdbebe.cloudfront.net), iluase.com + www.iluase.com → CloudFront, /api/* uncached, statics CachingOptimized
✅ **Uptime monitoring** — Route53 health checks (2 active) + CloudWatch alarms both OK, multi-region (us-east-1, us-west-1, eu-west-1, sa-east-1)
✅ **Security fixes** — passwordHash/emailVerificationToken stripped from user API, /users/me route added, ADMIN self-registration blocked (task def :8, image ses-20260316c)
✅ **Shareable profile URLs** — slug field on User, GET /public/resolve/:slug (no auth), BabalawoLandingPage, SubdomainRedirect, /:slug route, username onboarding step for babalawo

### Sprint 10 — ALL COMPLETE

| Task | Status |
|------|--------|
| V6-203: Staging smoke tests | ✅ DONE — 13 scenarios passed |
| V6-206: RDS backup restore test | ✅ DONE — RTO 4m19s, 54 tables intact |
| V6-207: Load test (100+ concurrent) | ✅ DONE — 175 req/s, p95=1152ms, 0.02% errors |
| V6-208: CloudFront CDN + uptime monitor | ✅ DONE — CloudFront live, Route53 + CloudWatch alarms OK |
| V6-209: Production cutover checklist | ✅ DONE — 12-point checklist passed March 16 |

**Timeline to April 1 Launch:**

| Date | Milestone | Status |
|------|-----------|--------|
| Mar 13 | Staging + Production live | ✅ DONE |
| Mar 16 | All Sprint 10 tasks complete | ✅ DONE |
| Apr 01 | **🚀 GO LIVE** | ⏳ READY |

---

### Critical: EPIC-001 Platform Restoration — DONE
- SidebarLayout integrated into app shell
- Dashboards, temples, circles, forum, academy, wallet, admin — routed

### Routed (Reachable in App)
- **EPIC-001** Platform Restoration: SidebarLayout + full routing ✅
- **EPIC-004** Profile: /profile, /profile/:userId ✅
- **EPIC-005** Booking: /booking/:babalawoId, /booking/:appointmentId/confirmation ✅
- **EPIC-006** Events: /events, /events/:slug, /events/create ✅ (create flow demo fallback added)
- **EPIC-007** Messaging: /messages, /messages/:otherUserId ✅
- **EPIC-008** Marketplace: /marketplace, /cart, /checkout ✅ (vendor routes routed + QA complete)
- **EPIC-009** Guidance Plans: /guidance-plans, /prescriptions/* ✅
- **EPIC-014** Spiritual Journey: /journey/* ✅ (deferred)
- Dashboard CTA links aligned to routed consultations and guidance plans ✅
- Profile community links now prefer slugs for temple/circle navigation ✅
- Home consultation CTA routes to `/client/consultations` ✅
- Booking page uses demo babalawo names when available ✅
- Booking confirmation uses demo/session fallback + correct CTAs ✅
- Babalawo directory demo temple filter aligned to demo temples ✅
- Messaging demo inbox/thread fallback added ✅
- Wallet dashboard demo balance/transactions fallback added ✅
- Guidance plans demo fallback added ✅
- Admin verification/dispute/vendor review demo fallback added ✅
- Admin analytics/fraud demo fallback added ✅
- Advisory board voting routed and demo fallback added ✅
- Discovery flow QA complete (Temple → Babalawo → Booking) ✅
- Dashboard QA complete across all roles ✅
- Single app shell verified; no bypass routes ✅
- Demo fallback audit complete ✅
- Backend demo IDs mapped to frontend demo ecosystem (seed cleanup pending) ✅
- Demo seed script executed; relationships verified (PB-015.1) ✅
- Messaging demo fallback aligned to unified demo users ✅
- Booking/confirmation demo lookup aligned to unified demo IDs ✅
- Guidance plan demo lookup aligned to unified demo IDs ✅
- Booking confirmation guard added for missing appointment ID ✅
- Demo bookings now surface in consultations list ✅
- Guidance plan approval/history demo/session fallback added ✅
- Guidance plan approval/creation now return to history ✅
- Approval view fallback CTA added ✅
- Profile demo lookup now supports backend IDs ✅
- Profile product display now uses name/title fallback ✅
- Profile internal links verified ✅
- Events directory now routes to detail by slug ✅
- Events detail registration now uses session fallback ✅
- Events directory/detail QA complete; registration closed messaging added ✅
- Marketplace cart/checkout navigation wired ✅
- Checkout order creation now falls back to demo IDs ✅
- Demo checkout now completes flow without payment gateway ✅
- Payment modal now offers demo completion on failure ✅
- Marketplace cart/checkout QA complete ✅
- Circles directory/detail QA complete ✅
- Forum home/thread QA complete ✅
- Academy catalog/detail/my-courses/lesson player QA complete ✅
- Wallet dashboard/transactions QA complete ✅
- Admin routes and tabs QA complete (analytics/fraud/content) ✅
- Guidance plan QA (PB-009.1) complete ✅
- Profile product link routed to marketplace detail ✅
- PB-005.1 Booking flow QA complete (confirmation error CTAs, ₦ display, Find a Babalawo client-side nav) ✅
- PB-003.2 Babalawo directory QA complete (temple filter aligned to DEMO_TEMPLES, View full profile from temple modal) ✅
- EPIC-002 Role dashboards complete: client dashboard demo fallback when not logged in; stat cards link to consultations, guidance-plans, messages, wallet ✅
- Admin/practitioner/vendor routes protected with ProtectedRoute (PB-016.2) ✅
- Logger utility added; all console replaced with logger across frontend (PB-016.1) ✅
- Temple directory/detail QA and demo fallback logging (PB-003.1) ✅
- Environment variable validation at backend startup (PB-016.4) ✅
- API error handling: parseApiError, reportApiError, useApiErrorHandler, api interceptor (PB-016.5) ✅
- Production build: no source maps, helmet HSTS, build:analyze, docs/PRODUCTION_BUILD.md (PB-016.6) ✅

### CODE EXISTS — NOT ROUTED (Orphaned)
- None currently tracked; verify end-to-end behavior

### Labeling (V1)
- **EPIC-XXX** = Epic (e.g. EPIC-001 Platform Restoration)
- **PB-XXX.Y** = User story (e.g. PB-001.1 Wire SidebarLayout)

---

## After Each Implementation

After completing any task, AI agents MUST update:

1. **V1_DEVELOPMENT_PROGRESS.md** - Mark PB items DONE, update status
2. **V1_AI_SESSION_HANDOFF.md** - Document what was done, decisions made, blockers
3. **This file (CLAUDE.md)** - Update "Current Status" section with new progress

---

## Key Technical Context

### Project Structure
```
ifa_app/
├── backend/           # NestJS backend
│   ├── src/
│   │   ├── appointments/    # Consultation booking
│   │   ├── seeding/         # Demo data ecosystem
│   │   └── ...
│   └── prisma/        # Database schema and seeds
├── frontend/          # React/TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── demo/      # Demo ecosystem data
│   │   └── ...
│   ├── Dockerfile.staging     # For EC2 staging (proxies to backend)
│   └── Dockerfile.production  # For ECS production (static files only)
├── docker/
│   ├── nginx.staging.conf     # Nginx with backend proxy (EC2)
│   └── nginx.production.conf  # Nginx static-only (ECS — ALB handles routing)
└── docs/
    ├── active/    # Operational docs in current use
    └── archive/   # Historical session summaries and completed phase docs
```

### Demo Data Source of Truth
- **Location:** `backend/src/seeding/demo-ecosystem.ts`
- **Frontend:** `frontend/src/demo/demo-ecosystem.ts`
- All demo scenarios use this unified data
- Old demo files (`frontend/src/data/demo-data.ts`, `frontend/src/lib/demo-data.ts`) should be DELETED

### User Roles
- **Client:** Book consultations, receive guidance, purchase products
- **Babalawo:** Provide consultations, create guidance plans, manage availability
- **Vendor:** Sell sacred items, manage inventory, process orders
- **Admin:** Platform management, verification queue, disputes

---

## Current Critical Path

All V1 EPICs routed and complete. Focus is now Sprint 10 infrastructure tasks.

| Task | Owner | Status |
|------|-------|--------|
| V6-203: Staging smoke tests (8 scenarios) | QA | ⬜ READY |
| V6-206: RDS backup restore test | DevOps | ⬜ READY |
| V6-207: Load test 100+ concurrent users | DevOps | ⬜ READY |
| V6-208: CloudFront CDN + uptime monitor | DevOps | ⬜ READY |
| Stripe live keys in Secrets Manager | Product | ⬜ BLOCKING launch |
| Sentry DSN in Secrets Manager | Engineering | ⬜ BLOCKING errors |
| V6-209: Go-live cutover | All | Apr 1 |

---

## Workflow for AI Agents

### V1 Workflow (Feature Development) — ✅ COMPLETE

```
1. Read documentation (this file + V1 docs above)
2. Identify next task from V1_DEVELOPMENT_PROGRESS.md / V1_PRODUCT_BACKLOG.md
3. Implement the feature
4. Test the implementation
5. Update documentation:
   - Mark PB item DONE in V1_DEVELOPMENT_PROGRESS.md
   - Add session notes to V1_AI_SESSION_HANDOFF.md
   - Update status in this file
6. Commit changes (if requested)
```

**Status:** V1 workflow complete. All platform features built and routed.

---

### V2 Workflow (Production Readiness) — 🚧 ACTIVE

**V2 is about making the platform production-ready, not adding new features.**

```
1. Read V2 documentation in order:
   - V2_PRODUCT_BACKLOG.md (6 EPICs: testing, observability, code quality, security, performance, TODOs)
   - V2_DEVELOPMENT_PROGRESS.md (metrics dashboard, progress tracking)
   - V2_AI_SESSION_HANDOFF.md (production context, TDD workflow)

2. Identify next PB item from V2 critical path:
   - Phase 1 (CORE): Testing, observability, complete TODOs
   - Phase 2 (HIGH): Code quality, security
   - Phase 3 (MEDIUM): Performance, monitoring
   - Phase 4 (LOW): Enhancements

3. ✅ WRITE TESTS FIRST (Test-Driven Development)
   - Unit tests for backend services (Jest)
   - Component tests for frontend (Vitest + React Testing Library)
   - Integration tests for DB relationships (Prisma + test DB)
   - E2E tests for user flows (Playwright)

4. Implement fix/enhancement to make tests pass
   - Follow TDD: Red → Green → Refactor
   - No shortcuts

5. Add monitoring/logging/observability
   - Structured logging with trace IDs
   - Error tracking (Sentry)
   - Performance metrics

6. Verify end-to-end with manual testing
   - Test in development with demo mode ON
   - Test behavior with demo mode OFF (errors surface)

7. Update V2 documentation with metrics:
   - Mark PB item DONE in V2_DEVELOPMENT_PROGRESS.md
   - Update metrics (test coverage %, scenarios count)
   - Add session notes to V2_AI_SESSION_HANDOFF.md
   - Update this file's V2 status section

8. Commit changes (if requested)
```

---

## V2 Key Principles 🎯

1. **No Feature is "Done" Without Tests** 🧪
   - Acceptance criteria must include test coverage metrics
   - 80% backend unit coverage, 60% frontend component coverage, 20+ E2E scenarios

2. **Observability is Non-Negotiable** 🔍
   - Every feature must have structured logging + error tracking
   - Sentry integration required (frontend + backend)
   - Trace IDs for debugging

3. **Demo Mode Must Be Explicit** 🎭
   - No silent fallbacks in production (fail loudly)
   - Use `VITE_DEMO_MODE` env flag
   - Production errors surface immediately (Sentry captures)

4. **Type Safety is Required** 🛡️
   - Backend must enable strict TypeScript (match frontend)
   - Fix 200+ type errors from enabling `strictNullChecks` and `noImplicitAny`

5. **Production-First Mindset** 🚀
   - Every task answers: "How will I know if this breaks in prod?"
   - Tests, monitoring, and logging come first

---

## V2 Status (Production Readiness Progress) — ✅ CONSOLIDATED

**Status:** All V2 production readiness work has been consolidated into Z1_BACKLOG.md with detailed sprint planning and implementation priorities.

**New Location:** See Z1_BACKLOG.md for complete V2 work breakdown:
- Sprint Z1-1: Foundation (Testing & Observability)
- Sprint Z1-4: Security & Performance Hardening
- Sprint Z1-6: Testing Coverage Ramp-Up
- Sprint Z1-7: Observability & Monitoring
- Sprint Z1-9: Performance & Scale

**Previous Status (for reference):**
- Backend unit test coverage: **3%** (target: 80%)
- Frontend component coverage: **0%** (target: 60%)
- E2E critical flows: **0 scenarios** (target: 20+)
- Error tracking: **❌ None** (target: ✅ Sentry)
- Unfinished TODOs: **20+** (target: 0)

---

## Notes for Handoff

### V1 Phase (Feature Development) — ✅ COMPLETE
- All 28 EPICs built and routed
- Platform restoration (EPIC-001) complete
- Discovery flow working (Temple → Babalawo → Booking)
- Demo ecosystem unified and aligned
- Cultural authenticity maintained (Yoruba terminology)
- The spiritual journey feature is DEFERRED to post-MVP (see SPIRITUAL_JOURNEY_EVALUATION.md)

### V2 Phase (Production Readiness) — ✅ CONSOLIDATED into Z1_BACKLOG.md
**Date:** April 19, 2026
**Status:** All V2 production readiness work catalogued and prioritized in Z1_BACKLOG.md
**Remaining:** 6 epics (testing, error handling, code quality, security, performance, TODOs)
**New Location:** See Z1_BACKLOG.md for complete V2 work breakdown with sprint planning.

- Focus on depth, not breadth
- Test-Driven Development required
- Complete 20+ TODO items (refunds, email notifications, push notifications, etc.)
- Eliminate technical debt (12K LOC hook, loose TypeScript, demo fallbacks)
- Achieve production-grade observability (Sentry, structured logging)
- Pass security audit (OWASP Top 10)

### Strategic Context
- V1 delivered breadth (28 features) → V2 delivers depth (production-ready)
- No new features in V2 — only testing, stabilization, and completing TODOs
- Cultural authenticity remains important - use proper Yoruba names and terminology
