# AI Agent Development Guide - Ìlú Àṣẹ Platform

This document provides context for AI agents working on the Ìlú Àṣẹ platform. Read this before starting any development work.

**Project:** Ìlú Àṣẹ - Digital Sanctuary for Ifá Spiritual Community
**Demo Deadline:** February 12, 2026
**Launch Deadline:** February 29, 2026

---

## Required Reading Before Coding

### V1 Phase (Feature Development) — ✅ COMPLETE

Before implementing any V1 feature, AI agents MUST read these documents in order:

1. **[V1_PRODUCT_BACKLOG.md](V1_PRODUCT_BACKLOG.md)** - Product backlog with EPIC-XXX / PB-XXX.Y labels; includes Codebase Audit findings
2. **[V1_DEVELOPMENT_PROGRESS.md](V1_DEVELOPMENT_PROGRESS.md)** - Current status; what's routed vs orphaned (CODE EXISTS but not reachable)
3. **[V1_AI_SESSION_HANDOFF.md](V1_AI_SESSION_HANDOFF.md)** - Handoff context for AI agents
4. **[SPIRITUAL_JOURNEY_EVALUATION.md](SPIRITUAL_JOURNEY_EVALUATION.md)** - Decision on deferred features (spiritual journey is P3, deferred)

**Status:** V1 feature development is COMPLETE. All 28 EPICs built and routed.

---

### V2 Phase (Production Readiness) — 🚧 ACTIVE

Before working on production readiness, AI agents MUST read these documents in order:

1. **[V2_PRODUCT_BACKLOG.md](V2_PRODUCT_BACKLOG.md)** - Production readiness backlog (6 EPICs: Testing, Observability, Code Quality, Security, Performance, TODOs)
2. **[V2_DEVELOPMENT_PROGRESS.md](V2_DEVELOPMENT_PROGRESS.md)** - Metrics dashboard and progress tracking
3. **[V2_AI_SESSION_HANDOFF.md](V2_AI_SESSION_HANDOFF.md)** - Production context and TDD workflow
4. **This file (CLAUDE.md)** - V2 workflow and current status

**Focus:** V2 is about depth (production-ready), not breadth (new features)

---

### V4 Phase (Production Launch) — 📋 PLANNED (Target: April 2026)

Before working on production launch tasks, AI agents MUST read:

1. **[V4_QUALITY_BACKLOG.md](V4_QUALITY_BACKLOG.md)** - Full detailed backlog (6 sprints, 32 stories, 129 story points)
2. **[V4_TODO.md](V4_TODO.md)** - Quick reference with execution order and task breakdowns

**6 Sprints:**
- Sprint 1: 🔥 Foundational Trust and Cleanup (24 SP) — dead code, random data, fake stats, messaging, profiles
- Sprint 2: 🎨 Design System and UI Consistency (18 SP) — 1,121 color migrations, loading states, browser dialogs
- Sprint 3: ✨ User Experience Polish (26 SP) — skeletons, images, cart, transitions, onboarding
- Sprint 4: ♿ Accessibility and Mobile (21 SP) — keyboard nav, ARIA, focus traps, touch gestures
- Sprint 5: 🔌 Backend and Real-Time (20 SP) — WebSocket messaging, email, push notifications, job queue
- Sprint 6: 🚢 Production Hardening (20 SP) — CI/CD, Sentry, type safety, vulnerability scans

**Labeling:** V4-XXX (frontend quality), V5-XXX (backend), V6-XXX (infrastructure), V7-XXX (post-launch)
**Branch:** `v4/quality` — commits per story, PR per sprint, merge to main after smoke test

---

## Current Status (Last Updated: February 5, 2026)

**Note:** See V1_PRODUCT_BACKLOG.md and V1_DEVELOPMENT_PROGRESS.md for full status. The Feb 2026 Codebase Audit found most features exist as code but are **unreachable** (no routes).

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
└── docs/
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

| Priority | Epic | Target | Status |
|----------|------|--------|--------|
| P0 | EPIC-001 Platform Restoration | — | DONE |
| P0 | EPIC-002 Role Dashboards | — | ROUTED, QA COMPLETE |
| P0 | EPIC-003 Temple Discovery | — | ROUTED, QA COMPLETE |
| P0 | EPIC-004 Profile | — | PARTIAL (routed, links need review) |
| P0 | EPIC-005 Booking | — | PARTIAL (routed, verify end-to-end) |
| P1 | EPIC-006 through EPIC-013 | — | See V1_DEVELOPMENT_PROGRESS.md |

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

## V2 Status (Production Readiness Progress)

**Current Phase:** Phase 1 — Foundation (CORE Priority)

| Epic | Focus | Progress | Status |
|------|-------|----------|--------|
| **EPIC-201** | Testing & QA 🧪 | 0/5 items | ⚪ NOT STARTED |
| **EPIC-202** | Error Handling 🔍 | 0/5 items | 🟠 PARTIAL (logger exists) |
| **EPIC-203** | Code Quality 🏗️ | 0/5 items | ⚪ NOT STARTED |
| **EPIC-204** | Security 🔒 | 0/5 items | ⚪ NOT STARTED |
| **EPIC-205** | Performance ⚡ | 0/5 items | ⚪ NOT STARTED |
| **EPIC-206** | Unfinished TODOs 🚧 | 0/5 items | ⚪ NOT STARTED |

**Production Metrics:**
- Backend unit test coverage: **3%** (target: 80%)
- Frontend component coverage: **0%** (target: 60%)
- E2E critical flows: **0 scenarios** (target: 20+)
- Error tracking: **❌ None** (target: ✅ Sentry)
- Unfinished TODOs: **20+** (target: 0)
- Largest file: **12,481 LOC** (target: <1,000 LOC)

**Next V2 Actions:**
1. ⚪ PB-201.1 — Unit Test Coverage (auth, appointments, payments, prescriptions, wallet)
2. ⚪ PB-202.1 — Sentry Integration (frontend + backend)
3. ⚪ PB-206.1 — Complete Payment Refunds

---

## Notes for Handoff

### V1 Phase (Feature Development) — ✅ COMPLETE
- All 28 EPICs built and routed
- Platform restoration (EPIC-001) complete
- Discovery flow working (Temple → Babalawo → Booking)
- Demo ecosystem unified and aligned
- Cultural authenticity maintained (Yoruba terminology)
- The spiritual journey feature is DEFERRED to post-MVP (see SPIRITUAL_JOURNEY_EVALUATION.md)

### V2 Phase (Production Readiness) — 🚧 ACTIVE
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
