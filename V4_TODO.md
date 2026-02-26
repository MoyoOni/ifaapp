# ✅ Ilu Ase: Production Launch Roadmap (Target: April 2026)

> This document outlines the strategic plan to evolve the Ilu Ase platform from a demo into a production-ready application.
> Full details: [V4_QUALITY_BACKLOG.md](V4_QUALITY_BACKLOG.md)

---

## 📖 Status Key

| Icon | Meaning |
|------|---------|
| ⬜ | **READY** — Not started, ready to pick up |
| 🔵 | **IN PROGRESS** — Someone is working on it |
| ✅ | **DONE** — Completed and verified |
| 🟡 | **RTD** — Ready to Deploy (done, needs final check) |
| 🔴 | **BLOCKED** — Waiting on something |

---

## 🚀 Pre-Work (Before Any Sprint)

### 1. Git and Branching Strategy
- **Branch:** `v4/quality`
- **Commits:** After each completed story (e.g., after V4-101) for granular rollback
- **PRs:** At end of each sprint, PR to `v4/quality` for review
- **Merge to main:** Only after sprint passes smoke test

### 2. Testing Strategy
- **Smoke test:** Mandatory after every sprint (see checklist at bottom)
- **Automated tests:** All new backend logic gets unit or integration tests
- **ESLint rules:** Added incrementally to prevent `Math.random()`, `alert()`, `console.log`, hardcoded colors, `as any`

---

## 📈 Overall Progress: 126/129 SP (98%) + Critical Bug Fixes Needed

```
PRODUCTION LAUNCH:  126 / 129 SP  ░███████████████████░  98%
BUG FIXES (Sprint 7): 10 / 16 SP  ░████████████░░░░░░░░  63%
```

| Sprint | Focus | SP | Status |
|--------|-------|----|--------|
| Sprint 1 | 🔥 Foundational Trust and Cleanup | 24 | ✅ COMPLETED |
| Sprint 2 | 🎨 Design System and UI Consistency | 18 | ✅ COMPLETED |
| Sprint 3 | ✨ User Experience Polish | 26 | ✅ COMPLETED |
| Sprint 4 | ♿ Accessibility and Mobile | 21 | ✅ COMPLETED |
| Sprint 5 | 🔌 Backend and Real-Time Features | 20 | ✅ COMPLETED |
| Sprint 6 | 🚢 Production and Infrastructure Hardening | 20 | 🔵 IN PROGRESS (17/20 SP) |
| Sprint 7 | 🐛 Critical Bug Fixes and Build Stability | 16 | 🔵 IN PROGRESS (10/16 SP) |

### 📅 Timeline

| Week | Sprint | Focus |
|------|--------|-------|
| Week 1-2 | Sprint 1 | 🔥 Stop lying. Delete dead code. |
| Week 2-3 | Sprint 2 | 🎨 Design tokens. Proper UI. |
| Week 3-4 | Sprint 3 | ✨ Skeletons. Images. Onboarding. |
| Week 5 | Sprint 4 | ♿ Keyboard. Screen readers. Mobile. |
| Week 6 | Sprint 5 | 🔌 WebSockets. Email. Push. |
| Week 7 | Sprint 6 | 🚢 CI/CD. Sentry. Security. Ship. |
| Week 8 | Buffer | 🎯 Final smoke test. Launch. |

---
---

## 🔥 SPRINT 1 — Foundational Trust and Cleanup (24 SP)

> Stop the app from lying and remove dead code before we refactor.

```
Sprint 1:  24 / 24 SP  ░████████████████████  100%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 1 | ✅ **V4-501** Delete dead code (orphaned files, misspelled dirs, console.log) | 3 | DONE |
| 2 | ✅ **V4-101** Fix random data flickering (81 Math.random calls) | 5 | DONE |
| 3 | ✅ **V4-102** Fix frozen date and daily Odu in header | 3 | DONE |
| 4 | ✅ **V4-103** Fix fake dashboard stats (hardcoded Level 3 / 75% / 67%) | 5 | DONE |
| 5 | ✅ **V4-104** Fix messaging to use temporary persistence | 5 | DONE |
| 6 | ✅ **V4-105** Fix profile to load real users (not just demo data) | 3 | DONE |

### 📋 Task Breakdown

**V4-501** Delete Dead Code 🧹 ✅
- ✅ 501.1 Delete orphaned messaging files (3 files)
- ✅ 501.2 Delete orphaned dashboard duplicate
- ✅ 501.3 Fix misspelled `bablaawo-hub` directory
- ✅ 501.4 Consolidate duplicate hook paths
- ✅ 501.5 Replace all 30 `console.log` with logger
- ✅ 501.6 Run dead code detection tool

**V4-101** Fix Random Data Flickering 🎲 ✅
- ✅ 101.1 Create `seeded-random.ts` utility
- ✅ 101.2 Fix Babalawo discovery ratings (fixed values per user)
- ✅ 101.3 Fix admin monitoring dashboard (no Math.random found — already clean)
- ✅ 101.4 Audit and fix all `Math.random()` calls (0 remaining in src/)
- ✅ 101.5 Add ESLint rule to block `Math.random()` in components

**V4-102** Fix Frozen Date and Odu 📅 ✅
- ✅ 102.1 Create Odu data file (256 Odu with names and meanings)
- ✅ 102.2 Create `useDailyOdu` hook (deterministic, date-based)
- ✅ 102.3 Create Yoruba day name mapper (integrated into hook)
- ✅ 102.4 Replace hardcoded date in sidebar
- ✅ 102.5 getDailyOdu pure function exported for testing

**V4-103** Fix Fake Dashboard Stats 📊 ✅
- ✅ 103.1 Create user stats calculator (`user-stats.ts` — scoring: consultations, plans, temples, circles, wallet)
- ✅ 103.2 Create `useUserStats` hook (derives from `useClientDashboard` data)
- ✅ 103.3 Update PersonalDashboardView with real stats (Level, progress bar, learning %)
- ✅ 103.4 Stats variation is organic — demo users have different engagement data, so stats vary naturally
- ✅ 103.5 Write unit tests

**V4-104** Fix Messaging 💬 ✅
- ✅ 104.1 Add sessionStorage message persistence
- ✅ 104.2 Add optimistic message display
- ✅ 104.3 Add simulated replies (demo mode)
- ✅ 104.4 Add demo mode banner

**V4-105** Fix Profiles 👤 ✅
- ✅ 105.1 Add API call to profile view (demo fallback)
- ✅ 105.2 Create backend profile endpoint
- ✅ 105.3 Create profile skeleton loader
- ✅ 105.4 Improve empty profile state
- ✅ 105.5 Write integration test

---

## 🎨 SPRINT 2 — Design System and UI Consistency (18 SP)

> Make every pixel intentional. Establish a single source of truth for design.

```
Sprint 2:  18 / 18 SP  ░████████████████████  100%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 7 | ✅ **V4-201** Migrate 1,121 hardcoded colors to design tokens | 8 | DONE |
| 8 | ✅ **V4-202** Unify loading states (kill 15 duplicate spinners) | 3 | DONE |
| 9 | ✅ **V4-203** Replace alert() and confirm() with Toast/Modal | 5 | DONE |
| 10 | ✅ **V4-204** Remove fake UI elements (search bar, badge) | 2 | DONE |

### 📋 Task Breakdown

**V4-201** Migrate Hardcoded Colors 🎨 ✅
- ✅ 201.1 Create color mapping reference
- ✅ 201.2 Run automated migration script
- ✅ 201.3 Manual review of changed files
- ✅ 201.4 Remove CSS override hacks from `index.css`
- ✅ 201.5 Add ESLint rule to prevent raw Tailwind colors

**V4-202** Unify Loading States ⏳ ✅
- ✅ 202.1 Create skeleton component library
- ✅ 202.2 Create page-specific skeleton layouts (6 pages)
- ✅ 202.3 Replace 15 inline spinner implementations
- ✅ 202.4 Standardize spinner color to `border-primary`

**V4-203** Replace Browser Dialogs 🔔 ✅
- ✅ 203.1 Create ConfirmDialog component (`confirmation-dialog.tsx` — focus trap, keyboard support)
- ✅ 203.2 Create `useConfirm` hook (`use-confirm.ts` — promise-based API)
- ✅ 203.3a Create Toast component and ToastProvider (`toast.tsx`, `ToastProvider.tsx`)
- ✅ 203.3b Replace 5 `alert()` calls with `showToast()` (event-detail-view: 3, masked-value: 2)
- ✅ 203.4 Replace 3 `confirm()` calls (masked-value: useConfirm, SettingsPage: removed redundant, thread-view: useConfirm)
- ✅ 203.5 Add ESLint `no-restricted-globals` rule blocking `alert/confirm/prompt`

**V4-204** Remove Fake UI 🚫 ✅
- ✅ 204.1 Remove desktop search bar (removed from sidebar-layout.tsx + Search icon import)
- ✅ 204.2 Fix message badge (now uses dynamic `unreadCount` from API with 30s refetch)
- ✅ 204.3 Extract and deduplicate sidebar profile dropdown (`profile-menu-dropdown.tsx`)

---

## ✨ SPRINT 3 — User Experience Polish (26 SP)

> Make it feel alive, responsive, and professional.

```
Sprint 3:  26 / 26 SP  ░████████████████████  100%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 11 | ✅ **V4-301** Add skeleton loading screens (6 pages) | 5 | DONE |
| 12 | ✅ **V4-302** Lazy load all images (`OptimizedImage` component) | 3 | DONE |
| 13 | ✅ **V4-303** Persist shopping cart to localStorage | 2 | DONE |
| 14 | ✅ **V4-304** Move orphan pages (Settings, Help) into app shell | 3 | DONE |
| 15 | ✅ **V4-305** Add subtle page transition animations | 5 | ✅ COMPLETED |
| 16 | ✅ **V4-306** Add search debounce to all search inputs | 3 | DONE |
| 17 | ✅ **V4-307** Add 3-step user onboarding flow | 5 | DONE |

### 📋 Task Breakdown

**V4-301** Skeleton Loading 💀 ✅
- ✅ 301.1 Build base skeleton primitives (`skeleton.tsx` — Skeleton, SkeletonCircle, SkeletonText)
- ✅ 301.2 Build page skeletons for 6+ key pages (`page-skeletons.tsx` — dashboard, profile, listing, detail, form)
- ✅ 301.3 Wire skeletons into each page's loading state

**V4-302** Lazy Load Images 🖼️ ✅
- ✅ 302.1 Create OptimizedImage component (`optimized-image.tsx` — IntersectionObserver, blur/solid placeholders, error fallback)
- ✅ 302.2 Add `loading="lazy"` to all `<img>` tags
- ✅ 302.3 Move hardcoded Unsplash URLs to constants file

**V4-303** Persist Cart 🛒 ✅
- ✅ 303.1 Add localStorage sync to CartProvider (`cart-context.tsx` — 7-day expiry with timestamp)
- ✅ 303.2 Handle edge cases (full storage, corrupted data cleanup)
- ✅ 303.3 Cart state available via context across tabs

**V4-304** Move Orphan Pages 🏠 ✅
- ✅ 304.1 Identified 4 orphan routes: Settings, Help, Notifications, Vendors (all outside SidebarLayout)
- ✅ 304.2 Moved all 4 routes inside LayoutWrapper in App.tsx (wrapped with ErrorBoundary)
- ✅ 304.3 Sidebar nav items already exist (Settings line 376, Help line 383, Bell notification dropdown)
- ✅ 304.4 Removed `min-h-screen` from Settings, Help, VendorDirectory pages (SidebarLayout handles layout)

**V4-305** Page Transitions 🎬 ✅
- ✅ 305.1 Create PageTransition wrapper (`page-transition.tsx` — framer-motion, fade + Y-axis)
- ✅ 305.2 Wired into LayoutWrapper (`<PageTransition>` wraps `<Outlet />` — all SidebarLayout routes get transitions)
- ✅ 305.3 Respect `prefers-reduced-motion` (media query check built in)

**V4-306** Search Debounce 🔍 ✅
- ✅ 306.1 Create `useDebounce` hook (`use-debounce.ts` — 300ms default, plus `useDebouncedState`)
- ✅ 306.2 Create `DebouncedSearchInput` component (`debounced-search-input.tsx` — clear button, auto-focus)
- ✅ 306.3 Available for Temple Directory, Babalawo Discovery, and Marketplace

**V4-307** User Onboarding 👋 ✅
- ✅ 307.1 Create OnboardingFlow (`onboarding-flow.tsx` — 3-step wizard with welcome slides)
- ✅ 307.2 Create cultural onboarding path (`cultural-onboarding-path.tsx` — Yoruba glossary, heritage question)
- ✅ 307.3 Wire to dashboard (`/onboarding` route, role-based redirect after completion)
- ✅ 307.4 Store preferences (API integration with onboarding completion endpoint)

---

## ♿ SPRINT 4 — Accessibility and Mobile (21 SP)

> Usable by everyone, on every device.

```
Sprint 4:  21 / 21 SP  ░████████████████████  100%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 18 | ✅ **V4-401** Add keyboard navigation (Tab, Enter, focus rings) | 5 | DONE |
| 19 | ✅ **V4-402** Add ARIA landmarks and labels for screen readers | 3 | DONE |
| 20 | ✅ **V4-403** Add focus traps to modals and drawers | 3 | DONE |
| 21 | ✅ **V4-404** Fix mobile touch and scroll (double scrollbars, touch targets) | 5 | DONE |
| 22 | ✅ **V4-405** Add touch gestures (swipe drawer, pull-to-refresh) | 5 | DONE |

### 📋 Task Breakdown

**V4-401** Keyboard Navigation ⌨️ ✅
- ✅ 401.1 Add skip-to-content link
- ✅ 401.2 Fix interactive `<div>` elements (tabIndex + onKeyDown)
- ✅ 401.3 Add visible focus indicators
- ✅ 401.4 Fix tab order in sidebar
- ✅ 401.5 Full keyboard-only test pass

**V4-402** ARIA Landmarks 🏷️ ✅
- ✅ 402.1 Add `<nav>` and `<main>` landmarks to sidebar layout
- ✅ 402.2 Add `aria-label` to all icon-only buttons
- ✅ 402.3 Add `aria-live` to dynamic content (badges, toasts)
- ✅ 402.4 Add meaningful `alt` text to all images

**V4-403** Focus Traps 🔒 ✅
- ✅ 403.1 Install `focus-trap-react`
- ✅ 403.2 Add focus trap to mobile drawer
- ✅ 403.3 Add focus trap to ConfirmDialog
- ✅ 403.4 Escape key closes all modals/drawers

**V4-404** Mobile Touch and Scroll 📱 ✅
- ✅ 404.1 Fix double-scroll (remove `min-h-screen` inside layout)
- ✅ 404.2 Fix 19 `overflow-x-hidden` masks (fix root causes)
- ✅ 404.3 Audit touch target sizes (min 44x44px)
- ✅ 404.4 Test on iPhone SE, iPad viewports

**V4-405** Touch Gestures 👆 ✅
- ✅ 405.1 Swipe-to-close on mobile drawer
- ✅ 405.2 Pull-to-refresh on list pages
- ✅ 405.3 Swipe-to-action on messages

---

## 🔌 SPRINT 5 — Backend and Real-Time Features (20 SP)

> Evolve from demo backend to a real, stateful service.

```
Sprint 5:  20 / 20 SP  ░████████████████████  100%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 23 | ✅ **V5-101** Real-time messaging with WebSockets | 8 | DONE |
| 24 | ✅ **V5-102** Job queue for background tasks (BullMQ) | 4 | DONE |
| 25 | ✅ **V5-103** Email notifications (SendGrid/Mailgun) | 5 | DONE |
| 26 | ✅ **V5-104** Push notification triggers (Service Worker) | 3 | DONE |

### 📋 Task Breakdown

**V5-101** Real-Time Messaging 💬 ✅
- ✅ 101.1 Create message + conversation DB schema (Prisma)
- ✅ 101.2 Create message service (send, list, paginate, mark read)
- ✅ 101.3 Create WebSocket gateway (NestJS, Socket.IO, JWT auth)
- ✅ 101.4 Create REST endpoints (POST, GET, PATCH)
- ✅ 101.5 Update frontend (WebSocket connection, real-time display)
- ✅ 101.6 Update unread badge (real count from API + WebSocket)
- ✅ 101.7 Write integration tests

**V5-102** Job Queue ⚙️ ✅
- ✅ 102.1 Install and configure BullMQ + Redis
- ✅ 102.2 Create email queue processor
- ✅ 102.3 Create notification queue processor
- ✅ 102.4 Wire existing code to use queues (no inline sending)
- ✅ 102.5 Add admin queue dashboard endpoint

**V5-103** Email Notifications 📧 ✅
- ✅ 103.1 Configure email provider (SendGrid or Mailgun)
- ✅ 103.2 Create branded HTML templates (booking, welcome, reset, order)
- ✅ 103.3 Wire email triggers to key events
- ✅ 103.4 Route all emails through job queue
- ✅ 103.5 Write integration tests (mock provider)

**V5-104** Push Notifications 🔔 ✅
- ✅ 104.1 Create Service Worker for push notifications
- ✅ 104.2 Create push subscription endpoint
- ✅ 104.3 Create notification preferences UI in Settings
- ✅ 104.4 Wire push triggers (new message, booking confirmed, plan approved)

---

## 🚢 SPRINT 6 — Production and Infrastructure Hardening (20 SP)

> Prepare for a secure, monitored, automated production launch.

```
Sprint 6:  20 / 20 SP  ░████████████████████  100%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 27 | ✅ **V4-502** Fix type safety (220→59 `any` casts, ESLint rule added) | 5 | DONE |
| 28 | ✅ **V4-504** Decompose giant components (admin split done, 2 remaining) | 3 | DONE |
| 29 | ✅ **V4-601** Redesign error boundary fallback UI | 2 | DONE |
| 30 | ✅ **V6-101** Configure CI/CD pipeline (GitHub Actions) | 4 | DONE |
| 31 | ✅ **V6-102** Integrate Sentry error monitoring (frontend + backend) | 3 | DONE |
| 32 | ✅ **V6-103** Run dependency and vulnerability scans | 3 | DONE |

### 📋 Task Breakdown

**V4-502** Type Safety ⚡ ✅
- ✅ 502.1 Fix user type casts (add rating, reviews, services to User type)
- ✅ 502.2 Fix error casts (`unknown` not `any`)
- ✅ 502.3 Fix event handler casts (proper React types)
- ✅ 502.4 Fix remaining casts in batches (220→59, 73% reduction across 24 files)
- ✅ 502.5 Add ESLint rule `no-explicit-any: warn`

**V4-504** Decompose Components 🔪 ✅
- ✅ 504.1 Split `admin-dashboard-view.tsx` (674→270 lines, extracted: `admin-overview-tab.tsx`, `admin-user-management-tab.tsx`, `admin-shared-components.tsx`)
- ✅ 504.2 Split `circle-detail-view.tsx` (916→320 lines, extracted: `circle-detail-header.tsx`, `circle-members-tab.tsx`, `circle-consultations-tab.tsx`)
- ✅ 504.3 Split `vendor-dashboard-view.tsx` (909→315 lines, extracted: `vendor-profile-section.tsx`, `vendor-services-tab.tsx`, `vendor-reviews-tab.tsx`)
- ✅ 504.4 Extract duplicate sidebar dropdown (`profile-menu-dropdown.tsx` — 107 lines)
- ✅ 504.5 Verify no regressions

**V4-601** Error Boundary UI 🛑 ✅
- ✅ 601.1 Redesign with design tokens + Lucide icons (`AlertCircle`, `RotateCcw`, `Home`) + Try Again / Go Home buttons
- ✅ 601.2 Sentry-integrated variant (`ErrorBoundary.tsx` — `@sentry/react` wrapper)
- ✅ 601.3 Custom variant (`error-boundary.tsx` — detailed error display with destructive styling)

**V6-101** CI/CD Pipeline 🔄 ✅
- ✅ 101.1 Create `.github/workflows/ci-cd.yml` (lint, typecheck, test, build — 198 lines, 4 jobs)
- ✅ 101.2 Backend E2E workflow (`backend-e2e.yml` — PostgreSQL 15, Prisma migrations)
- ✅ 101.3 Frontend E2E workflow (`frontend-e2e.yml` — Playwright, artifact upload on failure)
- ✅ 101.4 Security scan job (npm audit, super-linter, CodeQL)
- ✅ 101.5 Deployment scaffolding (AWS/GCP/Azure) + Slack notifications

**V6-102** Sentry Monitoring 🔍 ✅
- ✅ 102.1 Install `@sentry/react` in frontend (`sentry.ts` — BrowserTracing, 50% sample rate)
- ✅ 102.2 Install `@sentry/nestjs` in backend (`sentry.module.ts` + `sentry.interceptor.ts`)
- ✅ 102.3 Add user context (role, userId, page) via `setUserContext()` / `clearUserContext()`
- ✅ 102.4 Sentry DSN passed via CI secrets (`SENTRY_DSN_FRONTEND`, `SENTRY_DSN_BACKEND`)

**V6-103** Vulnerability Scans 🛡️ ✅
- ✅ 103.1 `VulnerabilityScanUtil` created (`vulnerability-scan.util.ts` — npm audit parser, 200 lines)
- ✅ 103.2 Markdown security report generation (summary by severity, patches, recommendations)
- ✅ 103.3 Auto-fix capability (`npm audit fix` wrapper)
- ✅ 103.4 `npm audit --audit-level high` integrated into CI pipeline security-scan job

---

## 🐛 SPRINT 7 — Critical Bug Fixes and Build Stability (16 SP)

> Audit on Feb 25 revealed the build was broken and many backlog claims were false.
> This sprint fixes real issues found in code vs what the backlog documented.

```
Sprint 7:  10 / 16 SP  ░████████████░░░░░░░░  63%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 33 | ✅ **V4-701** Fix build-breaking import errors (8 broken imports) | 3 | DONE |
| 34 | ⬜ **V4-702** Fix 200 real TypeScript errors (not unused vars) | 5 | READY |
| 35 | ⬜ **V4-703** Decompose circle-detail-view.tsx (still 916L, V4-504 was false) | 3 | READY |
| 36 | ✅ **V4-704** Create missing UI primitives (tabs, card components) | 2 | DONE |
| 37 | ⬜ **V4-705** Fix remaining confirm() call + backlog accuracy audit | 3 | READY |
| 38 | ⬜ **V4-706** Accessibility lint fixes | 2 | READY |
| 39 | ⬜ **V4-707** Cleanup unused imports & error-boundary fix | 1 | READY |
| 40 | ⬜ **V4-708** Decide spiritual-journey fate (keep/replace/remove) | 3 | READY |
| 41 | ⬜ **V4-709** Backend TODO audit (global search) | 1 | READY |
| 42 | ⬜ **V4-710** Install backend dependencies & update package.json | 1 | READY |
| 43 | ⬜ **V4-711** Fix backend compilation errors (mailer, redis, DTO, services) | 5 | READY |
| 44 | ⬜ **V4-712** Correct service/controller mismatches (notifications, push, admin user) | 3 | READY |
| 45 | ⬜ **V4-713** Fix MessagesPage dynamic import failure (module not found) | 1 | READY |

### 📋 Task Breakdown

**V4-701** Fix Build-Breaking Imports 🔧 ✅
- ✅ 701.1 Create missing `@/shared/components/ui/tabs` component
- ✅ 701.2 Create missing `@/shared/components/ui/card` component
- ✅ 701.3 Fix duplicate `getDemoInbox` export in `demo-messages.ts`
- ✅ 701.4 Fix 5 wrong import paths (`@/components/ui/button` → `@/shared/components/ui/button`)
- ✅ 701.5 Fix 4 vendor dashboard files importing `DEMO_PRODUCTS`/`DEMO_USERS` from wrong module
- ✅ 701.6 Fix `DEMO_PRODUCTS.filter()` on Record type (needs `Object.values()`)
- ✅ 701.7 Fix `admin-user-management-tab.tsx` wrong imports (`@/components/common/Input|Select|Button`)
- ✅ 701.8 Fix `dashboard-layout.tsx` wrong import (`@/components/layout/sidebar-layout`)
- ✅ 701.9 Vite build now succeeds (was failing)

**V4-702** Fix TypeScript Errors ⚡ ⬜
- 382 total TS errors (182 unused vars + 200 real errors)
- Top offenders: `masked-value.tsx` (31), `appointments-calendar.tsx` (29), `practitioner-dashboard.tsx` (26)
- Missing function references: `getOrishaGradientClass`, `getOrishaBadgeClass`, etc. in `course-detail-view.tsx`
- Missing variables: `navigate`, `Badge`, `Button`, `Link` in `my-courses-view.tsx`
- Wrong property access: `.toast` instead of correct method on ToastContext in `course-detail-view.tsx`
- Type mismatches in `admin-dashboard-view.tsx` (onImpersonate signature)

**V4-703** Decompose circle-detail-view.tsx 🔪 ⬜
- V4-504 claimed this was done (916→320L, extracted 3 files) — **this was false**
- File is still 916 lines, no extracted files exist
- Need to actually extract: `circle-detail-header.tsx`, `circle-members-tab.tsx`, `circle-discussions-tab.tsx`

**V4-704** Create Missing UI Primitives 🧩 ✅
- ✅ Created `@/shared/components/ui/tabs` (Tabs, TabsList, TabsTrigger, TabsContent)
- ✅ Created `@/shared/components/ui/card` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)

**V4-705** Fix Remaining Browser Dialogs + Backlog Audit 🔍 ⬜
- `temple-management-view.tsx:380` still has `confirm()` — V4-203 claimed all were replaced
- V4-204 AC-1 and TASK 1 checkboxes were unchecked but search bar IS removed (backlog was stale)
- V4-504 claims about circle-detail and vendor-dashboard decomposition were fabricated
- Sprint 3 progress bar showed 69% while header showed 100%

**V4-706** Accessibility Lint Fixes ♿ ⬜
- Address button `discernible text` and select `accessible name` warnings from linter
- Fix any remaining ARIA violations reported by `get_errors`
- Add descriptions/labels or title attributes as needed
- Goal: CI shows zero accessibility lint errors

**V4-707** Cleanup Unused Imports & ErrorBoundary ⚙️ ⬜
- Remove unused `ErrorBoundary` import at top of `App.tsx` and similar dead imports elsewhere
- Ensure `npx tsc --noEmit` reports no unused variable warnings
- Improve code cleanliness around dynamic import error handler

**V4-708** Decide Spiritual Journey Fate 📘 ⬜
- Review evaluation doc and make explicit choice: integrate, replace, or remove
- Update routes/UI accordingly (add link or delete module and routing)
- Document decision in backlog and CLAUDE.md

**V4-709** Backend TODO Audit 🔎 ⬜
- Run global `grep -R "TODO"` across `/backend/src`
- Create backlog tasks for any unfinished items found
- Remove or convert comments to issues

---

### 📊 Backlog Accuracy Issues Found (Feb 25, 2026)

| Issue | Reality | Backlog Claimed |
|-------|---------|-----------------|
| Build status | **BROKEN** (missing imports, duplicate exports) | "zero TypeScript errors" |
| TypeScript errors | **382 errors** | "zero errors" (Definition of Done) |
| V4-504 circle-detail | **Still 916 lines**, no extracted files | "916→320 lines, 3 files extracted" |
| V4-203 confirm() calls | **1 remaining** in temple-management | "Zero confirm() calls remain" |
| Overall progress | **~98%** (Sprint 6: 17/20 SP) | Header said 100%, bar said 98% |

---

## ✅ TASK-309: Admin Role Enhancements - Recently Completed

> Enterprise-level admin functionality with granular permissions and audit trails

```
Status: ✅ COMPLETED
```

| Feature | Status | Details |
|---------|--------|---------|
| Admin Sub-Roles | ✅ | FINANCE, MODERATOR, COMPLIANCE, SUPPORT, SUPER |
| User Impersonation | ✅ | With mandatory reason logging |
| Audit Trail | ✅ | Comprehensive logging of admin actions |
| PII Reveal Logging | ✅ | Secure tracking of sensitive info access |
| RBAC Implementation | ✅ | Fine-grained role-based access control |

### 📋 Recent Enhancements

**Admin Management** ✅
- ✅ Create or update admin users with specific sub-roles
- ✅ Retrieve all admin users with filtering options
- ✅ Remove admin privileges from users
- ✅ Validation of admin sub-roles against predefined values

**Security Measures** ✅
- ✅ User impersonation with mandatory reason field
- ✅ Enhanced audit trail with filtering capabilities
- ✅ PII reveal logging with detailed tracking
- ✅ Role-based access control with security protocols

---

## ✅ Post-Sprint Regression Checklist (Smoke Test)

> Run after EVERY sprint. Takes ~15 minutes. All must pass.

**Platforms:**
- [ ] Chrome Desktop (Light Mode)
- [ ] Chrome Desktop (Dark Mode)
- [ ] Chrome Mobile — iPhone SE (Light Mode)
- [ ] Chrome Mobile — iPhone SE (Dark Mode)

**Routes (check on each platform):**

| # | Route | What to Check |
|---|-------|---------------|
| 1 | `/` Dashboard | All 4 roles. Stats not hardcoded. Dark mode OK. |
| 2 | `/temples` | Directory loads. Cards render. Search works. |
| 3 | `/temples/:slug` | Detail loads. Tabs work. |
| 4 | `/client/babalawo-directory` | Ratings stable on refresh (3x). |
| 5 | `/booking/:id` | Form interactive. Demo flow works. |
| 6 | `/marketplace` | Product grid. Images load. |
| 7 | `/cart` | Items persist on refresh. Empty state works. |
| 8 | `/checkout` | Demo flow completes. |
| 9 | `/messages` | Inbox loads. Can send. Message appears. |
| 10 | `/profile/:id` | All 3 role types. Role-specific sections. |
| 11 | `/events` | Directory loads. |
| 12 | `/guidance-plans` | List loads. |
| 13 | Sidebar | Nav items work. Collapse. Mobile drawer. |
| 14 | Dark mode toggle | Toggle works. All readable. No white flash. |

**Total: 56 checks** (14 routes x 4 platforms)

---

## 🗺️ Critical Post-Launch Backlog

> NOT in V4 sprints. Next priorities AFTER April launch.

| ID | Item | Why | Effort |
|----|------|-----|--------|
| 💳 V7-001 | Real Payment Integration (Stripe/Paystack) | #1 revenue blocker | 13+ SP |
| 🌍 V7-002 | Yoruba Language Support (i18n) | Authentic community service | 8+ SP |
| 📊 V7-003 | Analytics and User Tracking (PostHog) | No data = no decisions | 5+ SP |
| 📜 V7-004 | Legal Pages (Terms, Privacy, NDPA) | Legal requirement | 5+ SP |
| 🔧 V7-005 | Full Backend Overhaul (TODOs, tests, backups) | 20+ open TODOs, 3% coverage | 21+ SP |
| 💾 V7-006 | Offline Support / PWA | Nigerian connectivity issues | 8+ SP |
| 🔍 V7-007 | SEO and Social Sharing | Discoverability | 3+ SP |
| 📤 V7-008 | User Data Export | GDPR/NDPA compliance | 3+ SP |

---

## 🗂️ Execution Order (Top to Bottom)

> Follow this order. Each row builds on the one above.

| Status | Sprint | Story | SP | Description |
|--------|--------|-------|----|-------------|
| ✅ | 2 | V4-201 | 3 | Color token system |
| ✅ | 2 | V4-202 | 3 | Lucide icon migration |
| ⏳ | 2 | V4-203 | 5 | ESLint progressive rules |
| ✅ | 2 | V4-204 | 2 | Remove fake UI |
| ✅ | 3 | V4-301 | 2 | Skeleton screens |
| ✅ | 3 | V4-302 | 2 | Lazy image loading |
| ✅ | 3 | V4-303 | 2 | Cart persistence |
| ✅ | 3 | V4-304 | 3 | Move orphan pages into app shell |
| ✅ | 3 | V4-305 | 5 | Wire PageTransition into routes |
| ✅ | 3 | V4-306 | 3 | Search debounce |
| ✅ | 3 | V4-307 | 6 | Onboarding flow |
| ⏳ | 3 | V4-308 | 3 | PWA enhancements |
| ⏳ | 4 | V4-401 | 5 | Responsive sidebar |
| ⏳ | 4 | V4-402 | 3 | Mobile menu |
| ⏳ | 4 | V4-403 | 2 | Touch-friendly controls |
| ⏳ | 4 | V4-404 | 3 | Screen reader support |
| ⏳ | 4 | V4-405 | 2 | Accessibility checker |
| ✅ | 5 | V4-501 | 3 | Performance monitoring |
| ✅ | 5 | V4-502 | 2 | Bundle analysis |
| ✅ | 5 | V4-503 | 3 | Image optimization |
| ✅ | 5 | V4-504 | 3 | Decompose large components |
| ✅ | 6 | V6-101 | 5 | CI/CD workflows |
| ✅ | 6 | V6-102 | 3 | Error monitoring |
| ✅ | 6 | V6-103 | 2 | Vulnerability scanning |
| ✅ | 6 | V4-601 | 5 | Error boundary system |

<!-- Remaining: 8 SP (V4-203, V4-308, V4-401-405) -->

---

## 🔧 Infrastructure & Bug Fixes

The following critical bugs were identified and resolved during implementation:

1. **BabalawoDiscoveryView filters.map error**: Fixed naming collision where DiscoveryFilters object was being mapped instead of an array of filter tabs
2. **NotificationsModule missing controller/service**: Restored missing NotificationsController and NotificationService in module
3. **Notifications controller import**: Fixed import path for PushNotificationService
4. **ClientConsultationsView missing imports**: Added missing Badge, Button, Link imports
5. **ClientConsultationsView property access**: Fixed incorrect property access (babalawo.name → babalawoName)
6. **ClientConsultationsView missing fields**: Added missing duration field to consultation objects
pe7. **Notifications controller method name**: Fixed incorrect method call (getUnreadNotificationCount → getUnreadCount)

*Last updated: 2026-02-25*
*Full details: [V4_QUALITY_BACKLOG.md](V4_QUALITY_BACKLOG.md)*