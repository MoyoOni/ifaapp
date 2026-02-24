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
- **Automated tests:** All new backend logic gets unit/integration tests
- **ESLint rules:** Added incrementally to prevent `Math.random()`, `alert()`, `console.log`, hardcoded colors, `as any`

---

## 📈 Overall Progress

```
PRODUCTION LAUNCH:  0 / 129 SP  ░░░░░░░░░░░░░░░░░░░░  0%
```

| Sprint | Focus | SP | Status |
|--------|-------|----|--------|
| Sprint 1 | 🔥 Foundational Trust and Cleanup | 24 | ⬜ READY |
| Sprint 2 | 🎨 Design System and UI Consistency | 18 | ⬜ READY |
| Sprint 3 | ✨ User Experience Polish | 26 | ⬜ READY |
| Sprint 4 | ♿ Accessibility and Mobile | 21 | ⬜ READY |
| Sprint 5 | 🔌 Backend and Real-Time Features | 20 | ⬜ READY |
| Sprint 6 | 🚢 Production and Infrastructure Hardening | 20 | ⬜ READY |

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
Sprint 1:  0 / 24 SP  ░░░░░░░░░░░░░░░░░░░░  0%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 1 | ⬜ **V4-501** Delete dead code (orphaned files, misspelled dirs, console.log) | 3 | READY |
| 2 | ⬜ **V4-101** Fix random data flickering (81 Math.random calls) | 5 | READY |
| 3 | ⬜ **V4-102** Fix frozen date and daily Odu in header | 3 | READY |
| 4 | ⬜ **V4-103** Fix fake dashboard stats (hardcoded Level 3 / 75% / 67%) | 5 | READY |
| 5 | ⬜ **V4-104** Fix messaging to use temporary persistence | 5 | READY |
| 6 | ⬜ **V4-105** Fix profile to load real users (not just demo data) | 3 | READY |

### 📋 Task Breakdown

**V4-501** Delete Dead Code 🧹 ⬜
- ⬜ 501.1 Delete orphaned messaging files (3 files)
- ⬜ 501.2 Delete orphaned dashboard duplicate
- ⬜ 501.3 Fix misspelled `bablaawo-hub` directory
- ⬜ 501.4 Consolidate duplicate hook paths
- ⬜ 501.5 Replace all 30 `console.log` with logger
- ⬜ 501.6 Run dead code detection tool

**V4-101** Fix Random Data Flickering 🎲 ⬜
- ⬜ 101.1 Create `seeded-random.ts` utility
- ⬜ 101.2 Fix Babalawo discovery ratings (fixed values per user)
- ⬜ 101.3 Fix admin monitoring dashboard
- ⬜ 101.4 Audit and fix all 81 `Math.random()` calls
- ⬜ 101.5 Add ESLint rule to block `Math.random()` in components

**V4-102** Fix Frozen Date and Odu 📅 ⬜
- ⬜ 102.1 Create Odu data file (256 Odu with names and meanings)
- ⬜ 102.2 Create `useDailyOdu` hook (deterministic, date-based)
- ⬜ 102.3 Create Yoruba day name mapper
- ⬜ 102.4 Replace hardcoded date in sidebar
- ⬜ 102.5 Write unit tests

**V4-103** Fix Fake Dashboard Stats 📊 ⬜
- ⬜ 103.1 Create user stats calculator
- ⬜ 103.2 Create `useUserStats` hook
- ⬜ 103.3 Update PersonalDashboardView with real stats
- ⬜ 103.4 Add stats variation to demo users
- ⬜ 103.5 Write unit tests

**V4-104** Fix Messaging 💬 ⬜
- ⬜ 104.1 Add sessionStorage message persistence
- ⬜ 104.2 Add optimistic message display
- ⬜ 104.3 Add simulated replies (demo mode)
- ⬜ 104.4 Add demo mode banner

**V4-105** Fix Profiles 👤 ⬜
- ⬜ 105.1 Add API call to profile view (demo fallback)
- ⬜ 105.2 Create backend profile endpoint
- ⬜ 105.3 Create profile skeleton loader
- ⬜ 105.4 Improve empty profile state
- ⬜ 105.5 Write integration test

---

## 🎨 SPRINT 2 — Design System and UI Consistency (18 SP)

> Make every pixel intentional. Establish a single source of truth for design.

```
Sprint 2:  0 / 18 SP  ░░░░░░░░░░░░░░░░░░░░  0%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 7 | ⬜ **V4-201** Migrate 1,121 hardcoded colors to design tokens | 8 | READY |
| 8 | ⬜ **V4-202** Unify loading states (kill 15 duplicate spinners) | 3 | READY |
| 9 | ⬜ **V4-203** Replace 38 alert() and 10 confirm() with Toast/Modal | 5 | READY |
| 10 | ⬜ **V4-204** Remove fake UI elements (search bar, badge "3") | 2 | READY |

### 📋 Task Breakdown

**V4-201** Migrate Hardcoded Colors 🎨 ⬜
- ⬜ 201.1 Create color mapping reference
- ⬜ 201.2 Run automated migration script
- ⬜ 201.3 Manual review of changed files
- ⬜ 201.4 Remove CSS override hacks from `index.css`
- ⬜ 201.5 Add ESLint rule to prevent raw Tailwind colors

**V4-202** Unify Loading States ⏳ ⬜
- ⬜ 202.1 Create skeleton component library
- ⬜ 202.2 Create page-specific skeleton layouts (6 pages)
- ⬜ 202.3 Replace 15 inline spinner implementations
- ⬜ 202.4 Standardize spinner color to `border-primary`

**V4-203** Replace Browser Dialogs 🔔 ⬜
- ⬜ 203.1 Create ConfirmDialog component (focus trap, keyboard support)
- ⬜ 203.2 Create `useConfirm` hook
- ⬜ 203.3 Replace 38 `alert()` with Toast
- ⬜ 203.4 Replace 10 `confirm()` with ConfirmDialog
- ⬜ 203.5 Add ESLint rule to block `alert/confirm/prompt`

**V4-204** Remove Fake UI 🚫 ⬜
- ⬜ 204.1 Remove desktop search bar
- ⬜ 204.2 Fix hardcoded message badge "3" (real count or hide)
- ⬜ 204.3 Extract and deduplicate sidebar profile dropdown

---

## ✨ SPRINT 3 — User Experience Polish (26 SP)

> Make it feel alive, responsive, and professional.

```
Sprint 3:  0 / 26 SP  ░░░░░░░░░░░░░░░░░░░░  0%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 11 | ⬜ **V4-301** Add skeleton loading screens (6 pages) | 5 | READY |
| 12 | ⬜ **V4-302** Lazy load all images (`OptimizedImage` component) | 3 | READY |
| 13 | ⬜ **V4-303** Persist shopping cart to localStorage | 2 | READY |
| 14 | ⬜ **V4-304** Move orphan pages (Settings, Help) into app shell | 3 | READY |
| 15 | ⬜ **V4-305** Add subtle page transition animations | 5 | READY |
| 16 | ⬜ **V4-306** Add search debounce to all search inputs | 3 | READY |
| 17 | ⬜ **V4-307** Add 3-step user onboarding flow | 5 | READY |

### 📋 Task Breakdown

**V4-301** Skeleton Loading 💀 ⬜
- ⬜ 301.1 Build base skeleton primitives
- ⬜ 301.2 Build page skeletons for 6 key pages
- ⬜ 301.3 Wire skeletons into each page's loading state

**V4-302** Lazy Load Images 🖼️ ⬜
- ⬜ 302.1 Create OptimizedImage component
- ⬜ 302.2 Add `loading="lazy"` to all `<img>` tags
- ⬜ 302.3 Move 28 hardcoded Unsplash URLs to constants file

**V4-303** Persist Cart 🛒 ⬜
- ⬜ 303.1 Add localStorage sync to CartProvider (7-day expiry)
- ⬜ 303.2 Handle edge cases (full storage, corrupted data)
- ⬜ 303.3 Update cart badge to read from storage across tabs

**V4-304** Move Orphan Pages 🏠 ⬜
- ⬜ 304.1 Identify all orphan routes in App.tsx
- ⬜ 304.2 Move routes inside SidebarLayout wrapper
- ⬜ 304.3 Add sidebar nav items for Settings and Help

**V4-305** Page Transitions 🎬 ⬜
- ⬜ 305.1 Create PageTransition wrapper (framer-motion)
- ⬜ 305.2 Wrap lazy-loaded routes
- ⬜ 305.3 Respect `prefers-reduced-motion`

**V4-306** Search Debounce 🔍 ⬜
- ⬜ 306.1 Create `useDebounce` hook (300ms)
- ⬜ 306.2 Apply to Temple Directory
- ⬜ 306.3 Apply to Babalawo Discovery
- ⬜ 306.4 Apply to Marketplace

**V4-307** User Onboarding 👋 ⬜
- ⬜ 307.1 Create OnboardingFlow (3-step wizard)
- ⬜ 307.2 Create interest categories with icons
- ⬜ 307.3 Wire to dashboard (show if not completed)
- ⬜ 307.4 Store preferences (localStorage + API)

---

## ♿ SPRINT 4 — Accessibility and Mobile (21 SP)

> Usable by everyone, on every device.

```
Sprint 4:  0 / 21 SP  ░░░░░░░░░░░░░░░░░░░░  0%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 18 | ⬜ **V4-401** Add keyboard navigation (Tab, Enter, focus rings) | 5 | READY |
| 19 | ⬜ **V4-402** Add ARIA landmarks and labels for screen readers | 3 | READY |
| 20 | ⬜ **V4-403** Add focus traps to modals and drawers | 3 | READY |
| 21 | ⬜ **V4-404** Fix mobile touch and scroll (double scrollbars, touch targets) | 5 | READY |
| 22 | ⬜ **V4-405** Add touch gestures (swipe drawer, pull-to-refresh) | 5 | READY |

### 📋 Task Breakdown

**V4-401** Keyboard Navigation ⌨️ ⬜
- ⬜ 401.1 Add skip-to-content link
- ⬜ 401.2 Fix interactive `<div>` elements (tabIndex + onKeyDown)
- ⬜ 401.3 Add visible focus indicators
- ⬜ 401.4 Fix tab order in sidebar
- ⬜ 401.5 Full keyboard-only test pass

**V4-402** ARIA Landmarks 🏷️ ⬜
- ⬜ 402.1 Add `<nav>` and `<main>` landmarks to sidebar layout
- ⬜ 402.2 Add `aria-label` to all icon-only buttons
- ⬜ 402.3 Add `aria-live` to dynamic content (badges, toasts)
- ⬜ 402.4 Add meaningful `alt` text to all images

**V4-403** Focus Traps 🔒 ⬜
- ⬜ 403.1 Install `focus-trap-react`
- ⬜ 403.2 Add focus trap to mobile drawer
- ⬜ 403.3 Add focus trap to ConfirmDialog
- ⬜ 403.4 Escape key closes all modals/drawers

**V4-404** Mobile Touch and Scroll 📱 ⬜
- ⬜ 404.1 Fix double-scroll (remove `min-h-screen` inside layout)
- ⬜ 404.2 Fix 19 `overflow-x-hidden` masks (fix root causes)
- ⬜ 404.3 Audit touch target sizes (min 44x44px)
- ⬜ 404.4 Test on iPhone SE, iPad viewports

**V4-405** Touch Gestures 👆 ⬜
- ⬜ 405.1 Swipe-to-close on mobile drawer
- ⬜ 405.2 Pull-to-refresh on list pages
- ⬜ 405.3 Swipe-to-action on messages

---

## 🔌 SPRINT 5 — Backend and Real-Time Features (20 SP)

> Evolve from demo backend to a real, stateful service.

```
Sprint 5:  0 / 20 SP  ░░░░░░░░░░░░░░░░░░░░  0%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 23 | ⬜ **V5-101** Real-time messaging with WebSockets | 8 | READY |
| 24 | ⬜ **V5-102** Job queue for background tasks (BullMQ) | 4 | READY |
| 25 | ⬜ **V5-103** Email notifications (SendGrid/Mailgun) | 5 | READY |
| 26 | ⬜ **V5-104** Push notification triggers (Service Worker) | 3 | READY |

### 📋 Task Breakdown

**V5-101** Real-Time Messaging 💬 ⬜
- ⬜ 101.1 Create message + conversation DB schema (Prisma)
- ⬜ 101.2 Create message service (send, list, paginate, mark read)
- ⬜ 101.3 Create WebSocket gateway (NestJS, Socket.IO, JWT auth)
- ⬜ 101.4 Create REST endpoints (POST, GET, PATCH)
- ⬜ 101.5 Update frontend (WebSocket connection, real-time display)
- ⬜ 101.6 Update unread badge (real count from API + WebSocket)
- ⬜ 101.7 Write integration tests

**V5-102** Job Queue ⚙️ ⬜
- ⬜ 102.1 Install and configure BullMQ + Redis
- ⬜ 102.2 Create email queue processor
- ⬜ 102.3 Create notification queue processor
- ⬜ 102.4 Wire existing code to use queues (no inline sending)
- ⬜ 102.5 Add admin queue dashboard endpoint

**V5-103** Email Notifications 📧 ⬜
- ⬜ 103.1 Configure email provider (SendGrid or Mailgun)
- ⬜ 103.2 Create branded HTML templates (booking, welcome, reset, order)
- ⬜ 103.3 Wire email triggers to key events
- ⬜ 103.4 Route all emails through job queue
- ⬜ 103.5 Write integration tests (mock provider)

**V5-104** Push Notifications 🔔 ⬜
- ⬜ 104.1 Create Service Worker for push notifications
- ⬜ 104.2 Create push subscription endpoint
- ⬜ 104.3 Create notification preferences UI in Settings
- ⬜ 104.4 Wire push triggers (new message, booking confirmed, plan approved)

---

## 🚢 SPRINT 6 — Production and Infrastructure Hardening (20 SP)

> Prepare for a secure, monitored, automated production launch.

```
Sprint 6:  0 / 20 SP  ░░░░░░░░░░░░░░░░░░░░  0%
```

| # | Task | SP | Status |
|---|------|----|--------|
| 27 | ⬜ **V4-502** Fix type safety (220 `any` casts, target under 20) | 5 | READY |
| 28 | ⬜ **V4-504** Decompose giant components (913+ lines, target under 400) | 3 | READY |
| 29 | ⬜ **V4-601** Redesign error boundary fallback UI | 2 | READY |
| 30 | ⬜ **V6-101** Configure CI/CD pipeline (GitHub Actions) | 4 | READY |
| 31 | ⬜ **V6-102** Integrate Sentry error monitoring (frontend + backend) | 3 | READY |
| 32 | ⬜ **V6-103** Run dependency and vulnerability scans | 3 | READY |

### 📋 Task Breakdown

**V4-502** Type Safety ⚡ ⬜
- ⬜ 502.1 Fix user type casts (add rating, reviews, services to User type)
- ⬜ 502.2 Fix error casts (`unknown` not `any`)
- ⬜ 502.3 Fix event handler casts (proper React types)
- ⬜ 502.4 Fix remaining casts in batches
- ⬜ 502.5 Add ESLint rule `no-explicit-any: warn`

**V4-504** Decompose Components 🔪 ⬜
- ⬜ 504.1 Split `circle-detail-view.tsx` (913 lines)
- ⬜ 504.2 Split `vendor-dashboard-view.tsx` (816 lines)
- ⬜ 504.3 Split `admin-dashboard-view.tsx` (674 lines)
- ⬜ 504.4 Extract duplicate sidebar dropdown
- ⬜ 504.5 Verify no regressions

**V4-601** Error Boundary UI 🛑 ⬜
- ⬜ 601.1 Redesign with design tokens + Lucide icons + Try Again / Go Home / Report buttons

**V6-101** CI/CD Pipeline 🔄 ⬜
- ⬜ 101.1 Create `.github/workflows/ci.yml` (lint, typecheck, test, build)
- ⬜ 101.2 Add branch protection rules (CI must pass before merge)
- ⬜ 101.3 Add deployment workflow (optional — Vercel/Railway)
- ⬜ 101.4 Add Slack/Discord notification on failure (optional)

**V6-102** Sentry Monitoring 🔍 ⬜
- ⬜ 102.1 Install `@sentry/react` in frontend + `@sentry/nestjs` in backend
- ⬜ 102.2 Add user context (role, userId, page)
- ⬜ 102.3 Upload source maps in CI pipeline
- ⬜ 102.4 Configure alerts (new error type, error spike)

**V6-103** Vulnerability Scans 🛡️ ⬜
- ⬜ 103.1 Run `npm audit`, fix high/critical vulnerabilities
- ⬜ 103.2 Configure Dependabot for automated security PRs
- ⬜ 103.3 OWASP Top 10 review (XSS, CSRF, auth, headers)
- ⬜ 103.4 Add `npm audit` to CI pipeline

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

| # | Story | Sprint | Why This Order |
|---|-------|--------|----------------|
| 1 | V4-501 Delete dead code | Sprint 1 | Clean slate before big changes |
| 2 | V4-101 Fix random data | Sprint 1 | Data must stop flickering first |
| 3 | V4-102 Fix date and Odu | Sprint 1 | Most visible fix, instant credibility |
| 4 | V4-103 Fix dashboard stats | Sprint 1 | Dashboard is the home page |
| 5 | V4-104 Fix messaging | Sprint 1 | Core feature must work |
| 6 | V4-105 Fix profiles | Sprint 1 | Users need to see real profiles |
| 7 | V4-201 Color token migration | Sprint 2 | Biggest design impact |
| 8 | V4-202 Loading states | Sprint 2 | Skeletons + unified spinners |
| 9 | V4-203 Replace alert/confirm | Sprint 2 | Professional feel |
| 10 | V4-204 Remove fake UI | Sprint 2 | No more lies |
| 11 | V4-301 Skeleton screens | Sprint 3 | Perceived performance |
| 12 | V4-302 Lazy images | Sprint 3 | Real performance |
| 13 | V4-303 Cart persistence | Sprint 3 | Quick win, 1 hour |
| 14 | V4-304 Orphan pages | Sprint 3 | Navigation consistency |
| 15 | V4-305 Page transitions | Sprint 3 | UX polish |
| 16 | V4-306 Search debounce | Sprint 3 | Performance |
| 17 | V4-307 Onboarding | Sprint 3 | New user experience |
| 18 | V4-401 Keyboard nav | Sprint 4 | Accessibility foundation |
| 19 | V4-402 ARIA landmarks | Sprint 4 | Screen readers |
| 20 | V4-403 Focus traps | Sprint 4 | Modal accessibility |
| 21 | V4-404 Mobile scroll | Sprint 4 | Mobile quality |
| 22 | V4-405 Touch gestures | Sprint 4 | Mobile polish |
| 23 | V5-101 WebSocket messaging | Sprint 5 | Real-time core feature |
| 24 | V5-102 Job queue | Sprint 5 | Background processing |
| 25 | V5-103 Email notifications | Sprint 5 | User communication |
| 26 | V5-104 Push notifications | Sprint 5 | Engagement |
| 27 | V4-502 Type safety | Sprint 6 | Code quality |
| 28 | V4-504 Decompose components | Sprint 6 | Maintainability |
| 29 | V4-601 Error boundary | Sprint 6 | Production UX |
| 30 | V6-101 CI/CD pipeline | Sprint 6 | Automated quality gates |
| 31 | V6-102 Sentry monitoring | Sprint 6 | Error visibility |
| 32 | V6-103 Vulnerability scans | Sprint 6 | Security |

---

*Last updated: 2026-02-24*
*Full details: [V4_QUALITY_BACKLOG.md](V4_QUALITY_BACKLOG.md)*