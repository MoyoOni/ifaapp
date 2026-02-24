# 📋 Ilu Ase — Production Launch Backlog

# 🏛️ From Demo to Production (Target: April 2026)

> 🔗 Quick reference: [V4_TODO.md](V4_TODO.md)

This backlog transforms Ilu Ase from a working demo into a production-ready application that real users will trust with their spiritual practice and real money.

---

## 📖 How to Read This Document

- Each **SPRINT** is a group of related work (1-2 weeks)
- Each sprint has **STORIES** (things to build or fix)
- Each story has **TASKS** (the actual steps to take)
- Status icons:
  - ⬜ = **READY** — Not started, ready to pick up
  - 🔵 = **IN PROGRESS** — Someone is working on it
  - ✅ = **DONE** — Completed and verified
  - 🟡 = **RTD** — Ready to Deploy (done, needs final check)
  - 🔴 = **BLOCKED** — Waiting on something else
- **SP** = Story Points (effort: 1 = tiny, 3 = small, 5 = medium, 8 = big, 13 = very big)

---

## 🚀 Pre-Work: Before Any Sprint Begins

### 1. Git and Branching Strategy

All work for this roadmap will be done in a dedicated branch to protect the current `main` branch.

- **Branch:** `v4/quality`
- **Commits:** After each completed story (not after each sprint) for granular rollback
- **Pull Requests:** At the end of each sprint, PR from sprint work to `v4/quality` for review
- **Merging:** Only merge to `main` after sprint passes the smoke test checklist

### 2. Testing and Quality Strategy

We are moving from 0% test coverage to continuous, multi-layered testing.

- **Manual Regression Checklist:** Mandatory smoke test after every sprint (see bottom of this document)
- **Automated Testing:** All new backend logic gets unit or integration tests
- **Linting Rules:** ESLint rules will be added incrementally to prevent:
  - `Math.random()` in components
  - `alert()` / `confirm()` / `prompt()` browser dialogs
  - `console.log` (use `logger` instead)
  - Hardcoded Tailwind colors (use design tokens)
  - `as any` type casts (use proper types)

### 3. Definition of Done (Every Story)

A story is DONE when ALL of these are true:

1. All acceptance criteria are met
2. Code compiles with zero TypeScript errors (`npx tsc --noEmit`)
3. The feature works in both light and dark mode
4. The feature works on mobile viewport (375px wide)
5. No new `any` types introduced
6. No new `console.log` calls (use logger)
7. No new hardcoded Tailwind colors (use design tokens)
8. Manual testing completed on the affected pages
9. Commit made with descriptive message referencing the story ID

---

## 📊 Overall Project Health

```
PRODUCTION LAUNCH PROGRESS
===========================================================================
Done        [                                                      ]   0%
Remaining   [||||||||||||||||||||||||||||||||||||||||||||||||||||||]  100%
===========================================================================

Total Story Points:   129 SP across 6 sprints
Completed:              0 SP
Remaining:            129 SP
Target:            April 2026
```

| Sprint | Name | Points | Status |
|--------|------|--------|--------|
| **Sprint 1** | **🔥 Foundational Trust and Cleanup** | **24 SP** | ⬜ READY |
| **Sprint 2** | **🎨 Design System and UI Consistency** | **18 SP** | ⬜ READY |
| **Sprint 3** | **✨ User Experience Polish** | **26 SP** | ⬜ READY |
| **Sprint 4** | **♿ Accessibility and Mobile** | **21 SP** | ⬜ READY |
| **Sprint 5** | **🔌 Backend and Real-Time Features** | **20 SP** | ⬜ READY |
| **Sprint 6** | **🚢 Production and Infrastructure Hardening** | **20 SP** | ⬜ READY |

### 📅 Timeline

| Week | Sprint | Focus |
|------|--------|-------|
| Week 1-2 | Sprint 1 (24 SP) | 🔥 Stop lying to users. Delete dead code. |
| Week 2-3 | Sprint 2 (18 SP) | 🎨 Design tokens. Proper UI components. |
| Week 3-4 | Sprint 3 (26 SP) | ✨ Skeletons. Images. Transitions. Onboarding. |
| Week 5 | Sprint 4 (21 SP) | ♿ Keyboard. Screen readers. Mobile. |
| Week 6 | Sprint 5 (20 SP) | 🔌 WebSockets. Email. Push notifications. |
| Week 7 | Sprint 6 (20 SP) | 🚢 CI/CD. Sentry. Security. Ship. |
| Week 8 | Buffer + launch prep | 🎯 Final smoke test. Launch. |

---
---

# 🔥 SPRINT 1 — FOUNDATIONAL TRUST AND CLEANUP

> **Goal:** Stop the app from lying to users. Delete dead code before we refactor.
> This sprint is the most important. Nothing else matters if users don't trust what they see.

```
Sprint 1 Progress
===========================================================================
[                                                                  ]   0%
===========================================================================
0 of 24 Story Points complete
```

| Story | Points | Priority | Status |
|-------|--------|----------|--------|
| V4-501 Delete Dead Code | 3 SP | 🔴 P0 BLOCKER | ⬜ READY |
| V4-101 Fix Random Data Flickering | 5 SP | 🔴 P0 BLOCKER | ⬜ READY |
| V4-102 Fix Frozen Date and Odu | 3 SP | 🔴 P0 BLOCKER | ⬜ READY |
| V4-103 Fix Fake Dashboard Stats | 5 SP | 🔴 P0 BLOCKER | ⬜ READY |
| V4-104 Fix Messaging | 5 SP | 🔴 P0 BLOCKER | ⬜ READY |
| V4-105 Fix Profile to Load Real Users | 3 SP | 🟠 P1 HIGH | ⬜ READY |

---

### V4-501: Delete Dead Code 🧹

**Priority:** 🔴 P0 BLOCKER
**Story Points:** 3
**Sprint:** Sprint 1 — Foundational Trust and Cleanup
**Why First:** Fewer files = smaller blast radius for everything that follows.

**As a** developer starting a major refactor,
**I want** all dead and orphaned code removed,
**So that** I'm only working with code that matters.

**The Problem:**
Several complete components exist but are never imported or routed to.
A misspelled directory (`bablaawo-hub`) exists alongside the correct one.
Duplicate hook paths create confusion about which import to use.
30 files use raw `console.log` instead of the logger utility.

**Acceptance Criteria:**

- [ ] AC-1: No component files exist that are not imported anywhere
- [ ] AC-2: No misspelled directory names
- [ ] AC-3: No duplicate hook paths (one canonical path per hook)
- [ ] AC-4: Zero `console.log` in `src/` (except test files and the logger itself)
- [ ] AC-5: Build output is smaller after cleanup

**Tasks:**

- [ ] TASK 1: Delete orphaned messaging files
  - DELETE: `frontend/src/features/messages/functional-messaging.tsx` (310 lines, never routed)
  - DELETE: `frontend/src/features/messages/enhanced-inbox.tsx` (verify not in routes first)
  - DELETE: `frontend/src/features/messages/enhanced-thread.tsx` (verify not in routes first)
  - Verify the app still compiles and routes work

- [ ] TASK 2: Delete orphaned dashboard
  - Verify `client-dashboard-view.tsx` is not imported in any route
  - If only imported in tests: update tests to use the actual routed component
  - DELETE the file if truly unused

- [ ] TASK 3: Fix misspelled directory
  - Rename: `frontend/src/features/bablaawo-hub/` to `frontend/src/features/babalawo-hub/`
  - Update all imports that reference the old path
  - Verify no broken references

- [ ] TASK 4: Consolidate duplicate hooks
  - `@/shared/hooks/dashboard` vs `@/shared/hooks/use-dashboard`
  - Pick one canonical path
  - Update all imports to use the canonical path
  - Delete the duplicate file

- [ ] TASK 5: Replace all `console.log` with logger
  - Search for `console.log(`, `console.warn(`, `console.error(` in `frontend/src/` (not test files)
  - Replace with `logger.info()`, `logger.warn()`, `logger.error()`
  - Add `import { logger } from '@/shared/utils/logger'` to each file
  - **Files:** ~30 files

- [ ] TASK 6: Run dead code detection
  - Use `ts-prune` or `knip` to find unused exports
  - Review each finding — delete if truly unused
  - Document any intentional "unused" exports

**How to Verify:**
1. `npx tsc --noEmit` — zero errors
2. `npm run build` — succeeds with smaller output
3. Search for deleted filenames — zero results
4. Search for `console.log` in `src/` (not test files) — zero results
5. No misspelled paths remain

---

### V4-101: Fix Random Data Flickering 🎲

**Priority:** 🔴 P0 BLOCKER
**Story Points:** 5
**Sprint:** Sprint 1 — Foundational Trust and Cleanup

**As a** user browsing Babalawos,
**I want** ratings and review counts to stay the same every time I visit,
**So that** I can trust the information and make informed decisions about who to consult.

**The Problem:**
There are 81 uses of `Math.random()` in the frontend code.
Every time a page loads, ratings, review counts, and other numbers change randomly.
A Babalawo might show 4.2 stars on one visit and 5.0 stars on the next.
This destroys all trust in the platform.

**Acceptance Criteria:**

- [ ] AC-1: No `Math.random()` calls exist in any render path or data generation
- [ ] AC-2: All demo data values are fixed and stable across page loads
- [ ] AC-3: Babalawo ratings stay the same every time you visit the page
- [ ] AC-4: Admin monitoring dashboard shows stable (not flickering) metrics
- [ ] AC-5: Demo user stats are consistent across all views (profile, directory, dashboard)

**Tasks:**

- [ ] TASK 1: Create `frontend/src/shared/utils/seeded-random.ts`
  - Takes a string seed (like a user ID)
  - Returns a number between 0 and 1 that is always the same for that seed
  - Write unit tests to prove same input always gives same output

- [ ] TASK 2: Fix Babalawo discovery ratings
  - Replace `Math.random()` on line 91-92 of `babalawo-discovery-view.tsx`
  - Use fixed ratings stored directly in `DEMO_USERS` data
  - Each Babalawo gets a permanent rating (example: Baba Adeyemi = 4.8, Iya Sade = 4.6)
  - **File:** `frontend/src/features/babalawo/discovery/babalawo-discovery-view.tsx`

- [ ] TASK 3: Fix admin monitoring dashboard
  - Replace all `Math.random()` calls in `platform-monitoring-dashboard.tsx`
  - Use seeded random based on current date (so values change daily, not per render)
  - **File:** `frontend/src/features/admin/platform-monitoring-dashboard.tsx`

- [ ] TASK 4: Audit and fix ALL remaining `Math.random()` calls
  - Search entire `frontend/src/` for `Math.random`
  - Replace each one with either fixed data or seeded random
  - Document every file changed
  - **Files:** Multiple (81 call sites across the frontend)

- [ ] TASK 5: Add ESLint rule to prevent future `Math.random()` in components
  - Custom lint rule or eslint-plugin restriction
  - Allowed only in test files and seeded-random utility

**How to Verify:**
1. Open Babalawo directory
2. Note all ratings and review counts
3. Refresh the page 5 times
4. All numbers must stay exactly the same every time

---

### V4-102: Fix Frozen Date and Odu 📅

**Priority:** 🔴 P0 BLOCKER
**Story Points:** 3
**Sprint:** Sprint 1 — Foundational Trust and Cleanup

**As a** spiritually engaged user,
**I want** to see today's actual date and a meaningful daily Odu,
**So that** the platform feels alive and spiritually authentic.

**The Problem:**
The app header shows "Monday, October 24th" and "Odu: Eji Ogbe" on every page.
It is February 2026. The date has been frozen for months.
For a spiritual platform, this is like a church displaying last year's sermon schedule.

**Acceptance Criteria:**

- [ ] AC-1: The header shows today's real date, formatted nicely
- [ ] AC-2: The Yoruba day name is shown (Ojo Aiku, Ojo Aje, Ojo Isegun, etc.)
- [ ] AC-3: The daily Odu changes each day (deterministic, not random)
- [ ] AC-4: All 256 Odu are represented in the rotation
- [ ] AC-5: The Odu includes a brief meaning or theme for the day

**Tasks:**

- [ ] TASK 1: Create Odu data file
  - File: `frontend/src/shared/data/odu-corpus.ts`
  - Array of 256 Odu objects: `{ name, meaning, theme }`
  - Example: `{ name: "Eji Ogbe", meaning: "The path of clarity and new beginnings", theme: "Fresh starts" }`
  - Use authentic Ifa Odu names in correct traditional order

- [ ] TASK 2: Create `useDailyOdu` hook
  - File: `frontend/src/shared/hooks/use-daily-odu.ts`
  - Calculate today's date as `YYYY-MM-DD` string
  - Hash the date string to a number between 0-255
  - Return the Odu at that index
  - Same day always returns same Odu
  - Include formatted date string with Yoruba day name

- [ ] TASK 3: Create Yoruba day name mapper
  - Map: Sunday = Ojo Aiku, Monday = Ojo Aje, Tuesday = Ojo Isegun, Wednesday = Ojo Riru, Thursday = Ojo Bo, Friday = Ojo Eti, Saturday = Ojo Abameta

- [ ] TASK 4: Replace hardcoded date in sidebar
  - File: `frontend/src/shared/components/sidebar-layout.tsx` (line 553)
  - Remove the static string
  - Use `useDailyOdu()` hook output
  - Format: "Ojo Aje, February 24th — Odu: Ogbe Meji"

- [ ] TASK 5: Write unit tests
  - Test that the same date always returns the same Odu
  - Test that different dates return different Odu (most of the time)
  - Test date formatting with Yoruba day names

**How to Verify:**
1. Open any page in the app
2. Check the header shows today's actual date
3. The Odu name should be different from yesterday
4. Refresh the page — same date, same Odu

---

### V4-103: Fix Fake Dashboard Stats 📊

**Priority:** 🔴 P0 BLOCKER
**Story Points:** 5
**Sprint:** Sprint 1 — Foundational Trust and Cleanup

**As a** client user viewing my dashboard,
**I want** my stats to reflect my actual activity,
**So that** my spiritual growth tracking is meaningful and personal.

**The Problem:**
Every user sees "Spiritual Growth: Level 3", a progress bar at 75%, and "Academy Progress: 67%".
These numbers are hardcoded constants. They never change.
A brand new user and a year-long user see the exact same dashboard.

**Acceptance Criteria:**

- [ ] AC-1: Dashboard stats are derived from the user's actual data (or demo data for that specific user)
- [ ] AC-2: Different demo users show different stat values
- [ ] AC-3: New users see Level 1 with 0% progress (not Level 3 at 75%)
- [ ] AC-4: Stats update when the user completes activities
- [ ] AC-5: Progress bars reflect real ratios, not hardcoded percentages

**Tasks:**

- [ ] TASK 1: Create user stats calculator
  - File: `frontend/src/shared/utils/user-stats.ts`
  - Function: `calculateUserStats(userId: string): UserStats`
  - Counts bookings, guidance plans, courses, community memberships from demo data
  - Derives "level" from total activity count
  - Calculates real progress percentages
  - Returns: `{ level, progress, sessionsCount, plansCount, coursesCompleted, totalCourses }`

- [ ] TASK 2: Create `useUserStats` hook
  - File: `frontend/src/shared/hooks/use-user-stats.ts`
  - In demo mode: calls `calculateUserStats` with demo data
  - In production mode: calls `GET /api/users/:id/stats`
  - Returns loading, error, and data states

- [ ] TASK 3: Update PersonalDashboardView
  - File: `frontend/src/features/client-hub/personal-dashboard-view.tsx`
  - Replace hardcoded "Level 3" with `stats.level`
  - Replace hardcoded 75% progress bar with `stats.progress`
  - Replace hardcoded "67%" academy progress with `stats.coursesCompleted / stats.totalCourses`
  - Replace hardcoded consultation count with `stats.sessionsCount`

- [ ] TASK 4: Add stats variation to demo users
  - File: `frontend/src/demo/profiles/users.ts`
  - Each demo user gets different activity counts
  - New client user: 2 sessions, 1 plan, Level 1
  - Active client user: 15 sessions, 5 plans, Level 4

- [ ] TASK 5: Write unit tests for stats calculator
  - User with no activity = Level 1, 0% progress
  - User with moderate activity = Level 2-3
  - User with high activity = Level 4-5

**How to Verify:**
1. Switch between different demo users
2. Each user should show different dashboard stats
3. A new user should show lower numbers than an active user
4. Progress bars should match the actual numbers

---

### V4-104: Fix Messaging 💬

**Priority:** 🔴 P0 BLOCKER
**Story Points:** 5
**Sprint:** Sprint 1 — Foundational Trust and Cleanup

**As a** client wanting to contact my Babalawo,
**I want** my messages to actually be sent and visible,
**So that** I can communicate about my spiritual guidance.

**The Problem:**
There are 3 separate messaging implementations. None of them actually send messages.
The send button calls `console.log()` and clears the input.
The user thinks they sent a message. They did not.

**Acceptance Criteria:**

- [ ] AC-1: Messages typed and sent appear in the conversation thread
- [ ] AC-2: Messages persist within the browser session (sessionStorage)
- [ ] AC-3: Demo mode shows a clear indicator that messages are simulated
- [ ] AC-4: Only ONE messaging implementation exists (dead ones deleted in V4-501)
- [ ] AC-5: Simulated replies appear after a short delay for realistic feel

**Tasks:**

- [ ] TASK 1: Add sessionStorage message persistence
  - File: The active messaging thread component
  - On send: store message in sessionStorage keyed by conversation ID
  - On load: read messages from sessionStorage and merge with demo messages
  - Messages survive page navigation within the same session
  - Clear on explicit logout

- [ ] TASK 2: Add optimistic message display
  - When user clicks send, message appears immediately in the thread
  - Message shows with a "sending" indicator (subtle clock icon)
  - After 500ms, indicator changes to "sent" (checkmark)

- [ ] TASK 3: Add simulated replies (demo mode only)
  - After user sends a message, wait 3-8 seconds
  - Show typing indicator ("Baba Adeyemi is typing...")
  - Show a contextual reply from a pool of warm, spiritually-themed demo responses
  - Example: "Thank you for sharing. Let us discuss this in our next session."

- [ ] TASK 4: Add demo mode banner
  - Small banner at top of messages: "Demo Mode — messages are simulated"
  - Uses `bg-secondary/10 text-secondary` styling (warm amber, not alarming)
  - Only shows when `isDemoMode` is true

**How to Verify:**
1. Open Messages, select a conversation
2. Type a message and send it — appears in the thread immediately
3. After a few seconds, a simulated reply appears
4. Navigate away and come back — your messages are still there
5. Demo mode banner is visible

---

### V4-105: Fix Profile to Load Real Users 👤

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 1 — Foundational Trust and Cleanup

**As a** user viewing another person's profile,
**I want** to see their real profile data,
**So that** I can learn about them before booking or connecting.

**The Problem:**
The profile page makes zero API calls.
It only reads from the `DEMO_USERS` hardcoded object.
Any real user who signs up gets "Profile Not Found" when someone views their page.

**Acceptance Criteria:**

- [ ] AC-1: Profile page attempts an API call first
- [ ] AC-2: Falls back to demo data only when in demo mode
- [ ] AC-3: Shows "This user hasn't set up their profile yet" instead of "Not Found" for empty profiles
- [ ] AC-4: Role-specific sections still work (Babalawo services, Vendor shop, Client journey)
- [ ] AC-5: Loading state shows a skeleton, not a spinner

**Tasks:**

- [ ] TASK 1: Add API call to profile view
  - File: `frontend/src/features/profile/public-profile-view.tsx`
  - Add `useQuery(['profile', userId], () => api.get('/users/' + userId + '/profile'))`
  - Use API response as primary data source
  - Fall back to `DEMO_USERS` only when `isDemoMode` is true and API fails

- [ ] TASK 2: Create backend profile endpoint (if missing)
  - File: `backend/src/users/users.controller.ts`
  - Endpoint: `GET /api/users/:id/profile`
  - Returns public profile fields: name, bio, avatar, role, interests, joinedAt
  - Does NOT return private data (email, phone, address)

- [ ] TASK 3: Create profile skeleton loader
  - File: `frontend/src/features/profile/profile-skeleton.tsx`
  - Matches the bento grid layout of the profile page
  - Pulsing placeholder blocks for avatar, name, bio, stats

- [ ] TASK 4: Improve empty profile state
  - When user exists but has no bio/details filled in:
  - Show: "This user hasn't completed their profile yet"
  - If viewing own empty profile: "Complete your profile" button

- [ ] TASK 5: Write integration test
  - Test: API returns data and it renders correctly
  - Test: API fails in demo mode and demo data renders
  - Test: Empty profile shows the right message

**How to Verify:**
1. Navigate to a demo user's profile — shows demo data
2. Navigate to a non-existent user — shows friendly empty state
3. Check network tab — an API call is being attempted
4. Loading state shows a skeleton, not a spinner

---
---

# 🎨 SPRINT 2 — DESIGN SYSTEM AND UI CONSISTENCY

> **Goal:** Make every pixel intentional.
> Migrate from hardcoded colors to design tokens so themes work perfectly everywhere.

```
Sprint 2 Progress
===========================================================================
[                                                                  ]   0%
===========================================================================
0 of 18 Story Points complete
```

| Story | Points | Priority | Status |
|-------|--------|----------|--------|
| V4-201 Migrate Hardcoded Colors to Design Tokens | 8 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-202 Unify Loading States | 3 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-203 Replace Browser Dialogs with Proper UI | 5 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-204 Remove Fake UI Elements | 2 SP | 🟠 P1 HIGH | ⬜ READY |

---

### V4-201: Migrate Hardcoded Colors to Design Tokens 🎨

**Priority:** 🟠 P1 HIGH
**Story Points:** 8
**Sprint:** Sprint 2 — Design System and UI Consistency

**As a** user switching between light and dark mode,
**I want** all pages to look correct in both themes,
**So that** I can use the app comfortably at any time of day.

**The Problem:**
The app has a beautiful token system (Osun green, Ogun amber, Yemoja blue, Shango pink).
But 1,121 places in the code bypass the tokens and use hardcoded Tailwind colors.
This means dark mode is broken in many places.
The CSS override hacks in `index.css` are a bandaid, not a fix.

**Acceptance Criteria:**

- [ ] AC-1: Hardcoded color usage drops from 1,121 to under 50
- [ ] AC-2: Dark mode works natively without CSS override hacks
- [ ] AC-3: The CSS override block in `index.css` can be removed
- [ ] AC-4: An ESLint rule prevents new hardcoded colors from being added
- [ ] AC-5: All pages look correct in both light and dark mode

**Tasks:**

- [ ] TASK 1: Create the color mapping reference
  - `text-stone-900` becomes `text-foreground`
  - `text-stone-700` / `text-stone-500` becomes `text-muted-foreground`
  - `text-gray-900` becomes `text-foreground`
  - `bg-white` becomes `bg-card` or `bg-background`
  - `bg-stone-50` / `bg-stone-100` becomes `bg-muted`
  - `border-stone-200` / `border-stone-300` becomes `border-border`
  - `bg-emerald-600` / `bg-emerald-700` becomes `bg-primary`
  - `text-emerald-600` / `text-emerald-700` becomes `text-primary`
  - `bg-amber-500` becomes `bg-secondary`
  - `bg-teal-*` becomes `bg-accent` variants
  - `from-emerald-50 to-teal-50` becomes `from-muted to-accent/5`

- [ ] TASK 2: Run automated migration script across all `.tsx` files
- [ ] TASK 3: Manual review of each changed file (some intentional accent colors should stay)
- [ ] TASK 4: Remove CSS override hacks from `index.css`
- [ ] TASK 5: Add ESLint rule to warn on raw Tailwind color classes

**How to Verify:**
1. Switch to dark mode
2. Visit every major page: Dashboard, Temples, Babalawos, Marketplace, Messages, Profile
3. No white backgrounds, no invisible text, no white flashes
4. `index.css` no longer has the `!important` override block

---

### V4-202: Unify Loading States ⏳

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 2 — Design System and UI Consistency

**As a** user waiting for content to load,
**I want** to see a consistent, professional loading experience,
**So that** the app feels polished and predictable.

**The Problem:**
15 components implement their own inline spinner, each with a different color.
No skeleton screens exist. Loading causes layout shift.

**Acceptance Criteria:**

- [ ] AC-1: Only ONE spinner implementation exists (the shared component)
- [ ] AC-2: All 15 inline spinner implementations are removed
- [ ] AC-3: Key pages have skeleton loaders that match their layout
- [ ] AC-4: No layout shift when content loads

**Tasks:**

- [ ] TASK 1: Create skeleton component library (`frontend/src/shared/components/skeleton.tsx`)
  - `<Skeleton />` — rectangular pulse block
  - `<SkeletonCircle />` — circular pulse (for avatars)
  - `<SkeletonText lines={3} />` — paragraph placeholder

- [ ] TASK 2: Create page-specific skeleton layouts for 6 key pages
  - Dashboard, Profile, Temple directory, Babalawo directory, Marketplace, Messages

- [ ] TASK 3: Replace all 15 inline spinner implementations with shared components
- [ ] TASK 4: Standardize spinner color to `border-primary`

**How to Verify:**
1. Throttle network to "Slow 3G" in DevTools
2. Navigate to dashboard — skeleton layout appears, then content fills in
3. No layout jump when content loads
4. All spinners use the same color

---

### V4-203: Replace Browser Dialogs with Proper UI 🔔

**Priority:** 🟠 P1 HIGH
**Story Points:** 5
**Sprint:** Sprint 2 — Design System and UI Consistency

**As a** user performing actions in the app,
**I want** feedback and confirmations to appear as styled UI,
**So that** the experience is seamless and accessible.

**The Problem:**
38 `alert()` calls and 10 `confirm()` calls use browser-native dialogs.
These block the main thread, cannot be styled, and are inaccessible.

**Acceptance Criteria:**

- [ ] AC-1: Zero `alert()` calls remain in production code
- [ ] AC-2: Zero `confirm()` calls remain in production code
- [ ] AC-3: Success feedback uses the existing Toast system
- [ ] AC-4: Destructive actions use a styled confirmation modal
- [ ] AC-5: All confirmations are keyboard accessible (Enter/Escape)

**Tasks:**

- [ ] TASK 1: Create `ConfirmDialog` component with focus trap, keyboard support, styled variants
- [ ] TASK 2: Create `useConfirm()` hook for easy usage
- [ ] TASK 3: Replace all 38 `alert()` calls with Toast notifications
- [ ] TASK 4: Replace all 10 `confirm()` calls with ConfirmDialog
- [ ] TASK 5: Add ESLint rule: `no-restricted-globals: ['alert', 'confirm', 'prompt']`

**How to Verify:**
1. Trigger a delete action — styled modal appears, not browser dialog
2. Press Escape to cancel, Enter to confirm
3. Success actions show toast notification
4. No browser-native popup boxes anywhere

---

### V4-204: Remove Fake UI Elements 🚫

**Priority:** 🟠 P1 HIGH
**Story Points:** 2
**Sprint:** Sprint 2 — Design System and UI Consistency

**As a** user interacting with the app,
**I want** every button, input, and link to actually do something,
**So that** I don't lose trust when things appear to work but don't.

**The Problem:**
- Desktop search bar does nothing (no handlers)
- Message badge always shows "3" (hardcoded)
- Profile dropdown is duplicated (80 lines x2)

**Acceptance Criteria:**

- [ ] AC-1: Search bar is removed (or functional)
- [ ] AC-2: Message badge shows actual unread count or is hidden
- [ ] AC-3: No duplicate dropdown code in sidebar

**Tasks:**

- [ ] TASK 1: Remove the desktop search bar from `sidebar-layout.tsx` (line 562-566)
- [ ] TASK 2: Fix message badge to show real count or hide when 0 (line 279)
- [ ] TASK 3: Extract `SidebarProfileMenu` component to eliminate 80-line duplication

**How to Verify:**
1. No search bar (or a working one)
2. Message badge is real or hidden
3. Every sidebar button does something when clicked

---
---

# ✨ SPRINT 3 — USER EXPERIENCE POLISH

> **Goal:** Make the app feel alive, responsive, and intentional.
> Every interaction should have feedback. Every load should feel fast.

```
Sprint 3 Progress
===========================================================================
[                                                                  ]   0%
===========================================================================
0 of 26 Story Points complete
```

| Story | Points | Priority | Status |
|-------|--------|----------|--------|
| V4-301 Add Skeleton Loading Screens | 5 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-302 Lazy Load All Images | 3 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-303 Persist Cart to Storage | 2 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-304 Move Orphan Pages into App Shell | 3 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-305 Add Page Transition Animations | 5 SP | 🟡 P2 MEDIUM | ⬜ READY |
| V4-306 Add Search Debounce | 3 SP | 🟡 P2 MEDIUM | ⬜ READY |
| V4-307 Add User Onboarding Flow | 5 SP | 🟡 P2 MEDIUM | ⬜ READY |

---

### V4-301: Add Skeleton Loading Screens 💀

**Priority:** 🟠 P1 HIGH
**Story Points:** 5
**Sprint:** Sprint 3 — User Experience Polish

**As a** user navigating between pages,
**I want** to see a placeholder layout while content loads,
**So that** the page doesn't jump around when data arrives.

**Tasks:**

- [ ] TASK 1: Build base skeleton primitives (`Skeleton`, `SkeletonCircle`, `SkeletonText`)
- [ ] TASK 2: Build page skeletons for 6 key pages (Dashboard, Profile, Temple, Babalawo, Marketplace, Messages)
- [ ] TASK 3: Wire skeletons into each page's loading state

**How to Verify:** Throttle to Slow 3G. Navigate to each page. Structured placeholder appears, then content fills in without layout shift.

---

### V4-302: Lazy Load All Images 🖼️

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 3 — User Experience Polish

**As a** user on a slow connection or mobile data,
**I want** images to load only when I scroll to them,
**So that** the page loads faster and uses less bandwidth.

**Tasks:**

- [ ] TASK 1: Create `OptimizedImage` component (loading="lazy", error fallback, alt text)
- [ ] TASK 2: Add `loading="lazy"` to all existing `<img>` tags
- [ ] TASK 3: Move 28 hardcoded Unsplash URLs to `frontend/src/shared/constants/images.ts`

**How to Verify:** Open DevTools Network tab. Scroll slowly. Images load on scroll, not all at once. Break a URL — styled fallback appears.

---

### V4-303: Persist Cart to Storage 🛒

**Priority:** 🟠 P1 HIGH
**Story Points:** 2
**Sprint:** Sprint 3 — User Experience Polish

**As a** customer shopping for sacred items,
**I want** my cart to survive page refreshes,
**So that** I don't lose my selections.

**Tasks:**

- [ ] TASK 1: Add localStorage sync to `CartProvider` (write on change, read on mount, 7-day expiry)
- [ ] TASK 2: Handle edge cases (full storage, corrupted data, stale prices)
- [ ] TASK 3: Update cart badge to reflect stored state across tabs

**How to Verify:** Add items to cart. Refresh page. Items still there. Open new tab — same cart.

---

### V4-304: Move Orphan Pages into App Shell 🏠

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 3 — User Experience Polish

**As a** user navigating to Settings, Notifications, or Help,
**I want** to still see the sidebar and header,
**So that** I can navigate back without using the browser back button.

**Tasks:**

- [ ] TASK 1: Identify all orphan routes in `App.tsx` (Settings, Help, Notifications, Vendors, Quick Access)
- [ ] TASK 2: Move each into the `SidebarLayout` wrapper
- [ ] TASK 3: Add sidebar navigation items for Settings and Help

**How to Verify:** Click Settings. Sidebar stays visible. Can navigate away from any page without browser back button.

---

### V4-305: Add Page Transition Animations 🎬

**Priority:** 🟡 P2 MEDIUM
**Story Points:** 5
**Sprint:** Sprint 3 — User Experience Polish

**As a** user navigating between pages,
**I want** smooth transitions instead of hard cuts,
**So that** the app feels fluid and modern.

**Tasks:**

- [ ] TASK 1: Create `PageTransition` wrapper using framer-motion (fade + subtle slide)
- [ ] TASK 2: Wrap lazy-loaded routes with `PageTransition` in `App.tsx`
- [ ] TASK 3: Respect `prefers-reduced-motion` (disable animation when set)

**How to Verify:** Click between pages. Smooth fade-in, not a hard cut. With "reduce motion" on, transitions become instant.

---

### V4-306: Add Search Debounce 🔍

**Priority:** 🟡 P2 MEDIUM
**Story Points:** 3
**Sprint:** Sprint 3 — User Experience Polish

**As a** user searching for temples or babalawos,
**I want** the search to wait until I finish typing,
**So that** the page doesn't spam API calls with every keystroke.

**Tasks:**

- [ ] TASK 1: Create `useDebounce` hook (300ms default, immediate on clear)
- [ ] TASK 2: Apply to Temple Directory search
- [ ] TASK 3: Apply to Babalawo Discovery search
- [ ] TASK 4: Apply to Marketplace search

**How to Verify:** Open DevTools Network. Type "Lagos". Only 1 request fires after you stop typing, not 5.

---

### V4-307: Add User Onboarding Flow 👋

**Priority:** 🟡 P2 MEDIUM
**Story Points:** 5
**Sprint:** Sprint 3 — User Experience Polish

**As a** new user arriving at the platform,
**I want** a guided introduction that asks about my interests,
**So that** I feel welcomed and the experience feels personalized.

**Tasks:**

- [ ] TASK 1: Create `OnboardingFlow` component (3-step wizard with progress indicator)
  - Step 1: "What brings you to Ilu Ase?" (seeking guidance / learning / community / shopping)
  - Step 2: "What interests you?" (Ifa divination, Orisha worship, Yoruba language, Herbal medicine, etc.)
  - Step 3: "Upload a photo and tell us about yourself" (optional bio + avatar)
- [ ] TASK 2: Create interest categories with icons and descriptions
- [ ] TASK 3: Wire to dashboard (show onboarding if not completed, persist to localStorage)
- [ ] TASK 4: Store preferences (`localStorage` in demo, `PATCH /api/users/:id/preferences` in production)

**How to Verify:** Clear localStorage. Navigate to dashboard. See welcome flow. Complete it. Dashboard appears. Refresh — onboarding does not reappear.

---
---

# ♿ SPRINT 4 — ACCESSIBILITY AND MOBILE

> **Goal:** Make the app usable by everyone, on every device.
> No user should be excluded because of their abilities or their device.

```
Sprint 4 Progress
===========================================================================
[                                                                  ]   0%
===========================================================================
0 of 21 Story Points complete
```

| Story | Points | Priority | Status |
|-------|--------|----------|--------|
| V4-401 Add Keyboard Navigation | 5 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-402 Add ARIA Landmarks and Labels | 3 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-403 Add Focus Traps to Modals and Drawers | 3 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-404 Fix Mobile Touch and Scroll | 5 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-405 Add Touch Gestures | 5 SP | 🟡 P2 MEDIUM | ⬜ READY |

---

### V4-401: Add Keyboard Navigation ⌨️

**Priority:** 🟠 P1 HIGH
**Story Points:** 5
**Sprint:** Sprint 4 — Accessibility and Mobile

**As a** user who navigates with a keyboard,
**I want** to reach every interactive element with Tab and activate it with Enter,
**So that** I can use the app without a mouse.

**Tasks:**

- [ ] TASK 1: Add skip-to-content link at top of `sidebar-layout.tsx`
- [ ] TASK 2: Fix all interactive `<div>` elements (add `tabIndex={0}`, `role="button"`, `onKeyDown`)
- [ ] TASK 3: Add visible focus indicators: `*:focus-visible { outline: 2px solid hsl(var(--primary)); }`
- [ ] TASK 4: Fix tab order in sidebar (items tabbable in visual order)
- [ ] TASK 5: Test with keyboard-only navigation (no mouse)

**How to Verify:** Unplug mouse. Tab through the entire app. Every element reachable. Enter activates. Focus ring visible.

---

### V4-402: Add ARIA Landmarks and Labels 🏷️

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 4 — Accessibility and Mobile

**As a** screen reader user,
**I want** the app to announce its structure,
**So that** I can understand the page layout and jump between sections.

**Tasks:**

- [ ] TASK 1: Add `<nav aria-label="Main navigation">` to sidebar, `<main>` to content area
- [ ] TASK 2: Add `aria-label` to all icon-only buttons
- [ ] TASK 3: Add `aria-live="polite"` to notification badge and toast container
- [ ] TASK 4: Add meaningful `alt` text to all images (decorative images get `alt=""` + `aria-hidden`)

**How to Verify:** Screen reader announces "Main navigation" for sidebar. Buttons announce their purpose. Notification count changes are announced.

---

### V4-403: Add Focus Traps to Modals and Drawers 🔒

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 4 — Accessibility and Mobile

**As a** keyboard user interacting with a modal,
**I want** my Tab key to stay within the modal,
**So that** I don't accidentally interact with content behind it.

**Tasks:**

- [ ] TASK 1: Install `focus-trap-react`
- [ ] TASK 2: Wrap mobile drawer in `<FocusTrap>`, return focus to hamburger on close
- [ ] TASK 3: Wrap ConfirmDialog in `<FocusTrap>`, auto-focus cancel button
- [ ] TASK 4: Add Escape key handler to all modals and drawers

**How to Verify:** Open mobile menu. Tab stays inside. Escape closes it. Focus returns to trigger button.

---

### V4-404: Fix Mobile Touch and Scroll 📱

**Priority:** 🟠 P1 HIGH
**Story Points:** 5
**Sprint:** Sprint 4 — Accessibility and Mobile

**As a** mobile user,
**I want** the app to scroll smoothly without double scrollbars,
**So that** the experience feels native.

**Tasks:**

- [ ] TASK 1: Remove `min-h-screen` from pages inside SidebarLayout (fix double-scroll)
- [ ] TASK 2: Fix 19 `overflow-x-hidden` masks (fix root overflow causes instead)
- [ ] TASK 3: Audit touch targets (minimum 44x44px, no `text-[10px]` on interactive elements)
- [ ] TASK 4: Test on iPhone SE, iPad, and Android viewports

**How to Verify:** Chrome DevTools responsive mode. iPhone SE. Only vertical scroll. All buttons easy to tap. No double scrollbar.

---

### V4-405: Add Touch Gestures 👆

**Priority:** 🟡 P2 MEDIUM
**Story Points:** 5
**Sprint:** Sprint 4 — Accessibility and Mobile

**As a** mobile user,
**I want** to swipe to close the menu and pull to refresh,
**So that** the app feels like a native mobile experience.

**Tasks:**

- [ ] TASK 1: Add swipe-to-close on mobile drawer (framer-motion `drag="x"`)
- [ ] TASK 2: Create pull-to-refresh component for list pages
- [ ] TASK 3: Add swipe-to-action on message items (swipe left = delete)

**How to Verify:** Mobile: open menu, swipe right to close. Pull down on list page — refresh indicator. Swipe message — delete reveals.

---
---

# 🔌 SPRINT 5 — BACKEND AND REAL-TIME FEATURES

> **Goal:** Evolve from a demo backend to a real, stateful service.
> Users need real messaging, real notifications, and real email delivery.
> This sprint turns the app from a frontend demo into a real platform.

```
Sprint 5 Progress
===========================================================================
[                                                                  ]   0%
===========================================================================
0 of 20 Story Points complete
```

| Story | Points | Priority | Status |
|-------|--------|----------|--------|
| V5-101 Real-Time Messaging with WebSockets | 8 SP | 🔴 P0 BLOCKER | ⬜ READY |
| V5-102 Job Queue for Background Tasks | 4 SP | 🟠 P1 HIGH | ⬜ READY |
| V5-103 Email Notifications | 5 SP | 🟠 P1 HIGH | ⬜ READY |
| V5-104 Push Notification Triggers | 3 SP | 🟡 P2 MEDIUM | ⬜ READY |

---

### V5-101: Real-Time Messaging with WebSockets 💬

**Priority:** 🔴 P0 BLOCKER
**Story Points:** 8
**Sprint:** Sprint 5 — Backend and Real-Time Features

**As a** client messaging my Babalawo,
**I want** messages to appear instantly without refreshing the page,
**So that** our conversations feel natural and real-time.

**The Problem:**
Sprint 1 adds sessionStorage messaging as a temporary fix. This sprint replaces it with real WebSocket-based messaging. Messages must persist in the database, be delivered in real-time, and survive browser restarts.

**Acceptance Criteria:**

- [ ] AC-1: Messages are persisted to the database (not sessionStorage)
- [ ] AC-2: Messages appear instantly for both sender and receiver (WebSocket)
- [ ] AC-3: Typing indicators show when the other user is typing
- [ ] AC-4: Read receipts mark messages as seen
- [ ] AC-5: Message history loads from the API on page open
- [ ] AC-6: Graceful fallback when WebSocket disconnects (polling)

**Tasks:**

- [ ] TASK 1: Create message database schema
  - Prisma model: `Message { id, conversationId, senderId, receiverId, content, createdAt, readAt }`
  - Prisma model: `Conversation { id, participants[], lastMessageAt, lastMessagePreview }`
  - Run migration

- [ ] TASK 2: Create backend message service
  - File: `backend/src/messages/messages.service.ts`
  - `sendMessage(senderId, receiverId, content)` — persist + emit via WebSocket
  - `getConversations(userId)` — list conversations with last message preview
  - `getMessages(conversationId, pagination)` — paginated message history
  - `markAsRead(conversationId, userId)` — update readAt timestamps

- [ ] TASK 3: Create WebSocket gateway
  - File: `backend/src/messages/messages.gateway.ts`
  - NestJS `@WebSocketGateway()` with Socket.IO
  - Events: `message:send`, `message:received`, `typing:start`, `typing:stop`, `message:read`
  - Room management: each conversation is a room
  - Authentication: validate JWT from WebSocket handshake

- [ ] TASK 4: Create REST endpoints
  - `POST /api/messages` — send a message
  - `GET /api/messages/conversations` — list user's conversations
  - `GET /api/messages/conversations/:id` — get messages in a conversation
  - `PATCH /api/messages/conversations/:id/read` — mark conversation as read

- [ ] TASK 5: Update frontend messaging
  - Replace sessionStorage logic with WebSocket connection
  - Connect to WebSocket on messages page mount
  - Listen for `message:received` events and update thread in real-time
  - Send messages via WebSocket (with REST fallback)
  - Show typing indicator when other user is typing
  - Show read receipts (single check = sent, double check = read)

- [ ] TASK 6: Update unread badge
  - Sidebar message badge shows real unread count from API
  - WebSocket updates badge count in real-time when new message arrives
  - Badge disappears when all conversations are read

- [ ] TASK 7: Write integration tests
  - Test: send message, verify it persists in DB
  - Test: WebSocket delivers message to connected recipient
  - Test: unread count updates correctly
  - Test: message history pagination works

**How to Verify:**
1. Open app in two browser windows (different users)
2. Send a message from User A
3. Message appears instantly for User B (no refresh)
4. Typing indicator shows when typing
5. Close browser, reopen — all messages still there

---

### V5-102: Job Queue for Background Tasks ⚙️

**Priority:** 🟠 P1 HIGH
**Story Points:** 4
**Sprint:** Sprint 5 — Backend and Real-Time Features

**As a** platform operator,
**I want** slow tasks (emails, notifications, image processing) to run in the background,
**So that** API responses stay fast and users don't wait for side effects.

**The Problem:**
Currently, actions like sending emails or processing notifications would block the API response. A booking confirmation that also sends an email would make the user wait for the email to send before seeing "Booking confirmed."

**Acceptance Criteria:**

- [ ] AC-1: A job queue system is configured and running (BullMQ or similar)
- [ ] AC-2: Email sending is processed via the queue (not inline)
- [ ] AC-3: Notification delivery is processed via the queue
- [ ] AC-4: Failed jobs are retried automatically (3 attempts, exponential backoff)
- [ ] AC-5: Admin can view queue status (pending, failed, completed counts)

**Tasks:**

- [ ] TASK 1: Install and configure BullMQ
  - `npm install bullmq` in backend
  - Configure Redis connection (use environment variable `REDIS_URL`)
  - Create `backend/src/queue/queue.module.ts` with queue registration

- [ ] TASK 2: Create email queue processor
  - File: `backend/src/queue/processors/email.processor.ts`
  - Processes jobs from the `email` queue
  - Calls the email service to actually send
  - Retries 3 times on failure with exponential backoff

- [ ] TASK 3: Create notification queue processor
  - File: `backend/src/queue/processors/notification.processor.ts`
  - Processes push notification delivery
  - Handles batching for bulk notifications

- [ ] TASK 4: Wire existing code to use queues
  - Find all places that would send emails inline
  - Replace with `emailQueue.add('send', { to, subject, body })`
  - Find all notification triggers and route through queue

- [ ] TASK 5: Add admin queue dashboard endpoint
  - `GET /api/admin/queues` — returns job counts (waiting, active, completed, failed)
  - Wire into admin dashboard

**How to Verify:**
1. Book a consultation
2. API responds immediately (under 500ms)
3. Email arrives within 30 seconds (processed in background)
4. Admin dashboard shows queue stats

---

### V5-103: Email Notifications 📧

**Priority:** 🟠 P1 HIGH
**Story Points:** 5
**Sprint:** Sprint 5 — Backend and Real-Time Features

**As a** user who booked a consultation,
**I want** to receive email confirmations and reminders,
**So that** I don't miss my appointments.

**The Problem:**
The backend has TODO comments where email sending should happen. No emails are actually sent. Users book consultations with no confirmation. Babalawos accept guidance plans with no notification to the client.

**Acceptance Criteria:**

- [ ] AC-1: Email service is configured with a provider (SendGrid, Mailgun, or AWS SES)
- [ ] AC-2: Booking confirmation emails are sent to both client and Babalawo
- [ ] AC-3: Guidance plan approval emails are sent to the client
- [ ] AC-4: Password reset emails work
- [ ] AC-5: Emails use branded HTML templates (Ilu Ase logo, colors, Yoruba greeting)
- [ ] AC-6: Email sending goes through the job queue (V5-102)

**Tasks:**

- [ ] TASK 1: Configure email provider
  - File: `backend/src/notifications/email.service.ts`
  - Support SendGrid (recommended) or Mailgun
  - Environment variables: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`
  - Fallback: log to console in development mode

- [ ] TASK 2: Create email templates
  - File: `backend/src/notifications/templates/`
  - `booking-confirmation.html` — booking details, date, time, Babalawo name
  - `guidance-plan-approved.html` — plan details, Babalawo notes
  - `password-reset.html` — reset link, expiry time
  - `welcome.html` — welcome message after signup
  - All templates include: Ilu Ase logo, brand colors, Yoruba greeting ("Ire o!")

- [ ] TASK 3: Wire email triggers to key events
  - On booking created: email to client + Babalawo
  - On guidance plan approved: email to client
  - On password reset requested: email with reset link
  - On signup: welcome email
  - On order placed: email to buyer + vendor

- [ ] TASK 4: Route all emails through the job queue
  - Use V5-102 email queue
  - Never send emails inline in the request handler

- [ ] TASK 5: Write integration tests
  - Mock the email provider
  - Verify correct template is used for each event
  - Verify correct recipients
  - Verify queue job is created (not sent inline)

**How to Verify:**
1. Book a consultation
2. Check email inbox — confirmation email with booking details
3. Email has Ilu Ase branding and Yoruba greeting
4. In development: email content logged to console

---

### V5-104: Push Notification Triggers 🔔

**Priority:** 🟡 P2 MEDIUM
**Story Points:** 3
**Sprint:** Sprint 5 — Backend and Real-Time Features

**As a** user who is not actively looking at the app,
**I want** to receive push notifications for important events,
**So that** I know when my Babalawo responds or a new message arrives.

**The Problem:**
The notification bell polls every 30 seconds, but only when the app is open. Users who close the tab miss everything.

**Acceptance Criteria:**

- [ ] AC-1: Service Worker is registered for push notifications
- [ ] AC-2: Users can opt in/out of push notifications
- [ ] AC-3: Key events trigger push: new message, booking confirmed, guidance plan approved
- [ ] AC-4: Notification click navigates to the relevant page

**Tasks:**

- [ ] TASK 1: Create Service Worker for push notifications
  - File: `frontend/public/sw.js`
  - Register in `main.tsx`
  - Handle `push` events — show notification with icon and action
  - Handle `notificationclick` — navigate to relevant route

- [ ] TASK 2: Create push subscription endpoint
  - `POST /api/notifications/subscribe` — save push subscription to DB
  - `DELETE /api/notifications/subscribe` — unsubscribe
  - Store: endpoint, p256dh key, auth key per user

- [ ] TASK 3: Create notification preferences UI
  - File: `frontend/src/features/settings/notification-preferences.tsx`
  - Toggle: Push notifications on/off
  - Granular: Messages, Bookings, Guidance Plans, Marketplace orders
  - Persist to backend: `PATCH /api/users/:id/notification-preferences`

- [ ] TASK 4: Wire push triggers
  - On new message: push to recipient (if subscribed and not currently viewing messages)
  - On booking confirmed: push to client
  - On guidance plan approved: push to client
  - Send via job queue (V5-102)

**How to Verify:**
1. Enable push notifications in Settings
2. Close the app tab
3. Have another user send a message
4. Browser push notification appears
5. Click notification — opens the messages page

---
---

# 🚢 SPRINT 6 — PRODUCTION AND INFRASTRUCTURE HARDENING

> **Goal:** Prepare for a secure, monitored, and automated production launch.
> This is the final sprint before going live. Everything here is about not embarrassing yourself on day one.

```
Sprint 6 Progress
===========================================================================
[                                                                  ]   0%
===========================================================================
0 of 20 Story Points complete
```

| Story | Points | Priority | Status |
|-------|--------|----------|--------|
| V4-502 Fix Type Safety (220 any casts) | 5 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-504 Decompose Giant Components | 3 SP | 🟠 P1 HIGH | ⬜ READY |
| V4-601 Redesign Error Boundary UI | 2 SP | 🟠 P1 HIGH | ⬜ READY |
| V6-101 Configure CI/CD Pipeline | 4 SP | 🟠 P1 HIGH | ⬜ READY |
| V6-102 Integrate Sentry Error Monitoring | 3 SP | 🟠 P1 HIGH | ⬜ READY |
| V6-103 Dependency and Vulnerability Scans | 3 SP | 🟠 P1 HIGH | ⬜ READY |

---

### V4-502: Fix Type Safety ⚡

**Priority:** 🟠 P1 HIGH
**Story Points:** 5
**Sprint:** Sprint 6 — Production and Infrastructure Hardening

**As a** developer,
**I want** proper types instead of `any` casts,
**So that** TypeScript can catch bugs before they reach users.

**The Problem:**
220 places use `as any` or `: any` to bypass TypeScript. This means bugs slip through silently.

**Acceptance Criteria:**

- [ ] AC-1: `any` usage drops from 220 to under 20
- [ ] AC-2: Remaining `any` usages have a comment explaining why
- [ ] AC-3: Catch blocks use `unknown` instead of `any`
- [ ] AC-4: ESLint rule: `@typescript-eslint/no-explicit-any: "warn"`

**Tasks:**

- [ ] TASK 1: Fix user type casts — add `rating?`, `reviewCount?`, `services?` to User type
- [ ] TASK 2: Fix error casts — `catch (error: unknown)` + type guards
- [ ] TASK 3: Fix event handler casts — proper `React.ChangeEvent<>` types
- [ ] TASK 4: Fix remaining casts in batches (20-30 per session)
- [ ] TASK 5: Add ESLint rule to warn on new `any` usage

**How to Verify:** Search for `: any` and `as any`. Count under 20. `npx tsc --noEmit` — zero errors.

---

### V4-504: Decompose Giant Components 🔪

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 6 — Production and Infrastructure Hardening

**As a** developer maintaining this codebase,
**I want** no component file to exceed 400 lines,
**So that** each component is focused and easy to understand.

**The Problem:**
6 files exceed 600 lines, with the largest at 913 lines.

**Acceptance Criteria:**

- [ ] AC-1: No component file exceeds 400 lines
- [ ] AC-2: Each extracted sub-component has a single responsibility
- [ ] AC-3: No functionality changes — pure refactor

**Tasks:**

- [ ] TASK 1: Decompose `circle-detail-view.tsx` (913 lines) into `CircleForum`, `CircleMembers`, `CircleEvents`, `CircleSettings`
- [ ] TASK 2: Decompose `vendor-dashboard-view.tsx` (816 lines) into `VendorOverview`, `VendorOrders`, `VendorProducts`, `VendorAnalytics`
- [ ] TASK 3: Decompose `admin-dashboard-view.tsx` (674 lines) into per-tab components
- [ ] TASK 4: Extract duplicate `SidebarProfileMenu` from `sidebar-layout.tsx`
- [ ] TASK 5: Verify no regressions — `npx tsc --noEmit` + manual test each page

**How to Verify:** No `.tsx` file in `features/` exceeds 400 lines. Every page works as before.

---

### V4-601: Redesign Error Boundary UI 🛑

**Priority:** 🟠 P1 HIGH
**Story Points:** 2
**Sprint:** Sprint 6 — Production and Infrastructure Hardening

**As a** user who encounters an error,
**I want** to see a helpful, branded error page,
**So that** I know the app is still working and can try again.

**Tasks:**

- [ ] TASK 1: Redesign `error-boundary.tsx` with design tokens, Lucide icon, and 3 buttons (Try Again, Go Home, Report Issue)
- [ ] TASK 2: Add collapsible error details section for developers

**How to Verify:** Throw an error intentionally. Error page matches app design. Try Again reloads. Go Home navigates to dashboard.

---

### V6-101: Configure CI/CD Pipeline 🔄

**Priority:** 🟠 P1 HIGH
**Story Points:** 4
**Sprint:** Sprint 6 — Production and Infrastructure Hardening

**As a** developer shipping code,
**I want** automated testing and builds on every push,
**So that** broken code never reaches production.

**The Problem:**
No CI/CD exists. Code is deployed manually. There's no automated check that the build passes or tests succeed before merging.

**Acceptance Criteria:**

- [ ] AC-1: GitHub Actions workflow runs on every push and PR
- [ ] AC-2: Pipeline runs: lint, type check, unit tests, build
- [ ] AC-3: PRs cannot be merged if pipeline fails
- [ ] AC-4: Build artifacts are stored for deployment
- [ ] AC-5: Pipeline completes in under 10 minutes

**Tasks:**

- [ ] TASK 1: Create GitHub Actions workflow
  - File: `.github/workflows/ci.yml`
  - Triggers: push to `main` and `v4/quality`, all PRs
  - Steps: checkout, install Node 20, install deps, lint, type-check (`tsc --noEmit`), test, build
  - Separate jobs for frontend and backend (run in parallel)

- [ ] TASK 2: Add branch protection rules
  - Require CI to pass before merging to `main`
  - Require at least 1 approval on PRs
  - No force pushes to `main`

- [ ] TASK 3: Add deployment workflow (optional)
  - Trigger: push to `main` only
  - Deploy frontend to Vercel / Netlify / S3
  - Deploy backend to Railway / Fly.io / EC2
  - Environment variables injected from GitHub Secrets

- [ ] TASK 4: Add Slack/Discord notification on pipeline failure (optional)

**How to Verify:**
1. Push a commit — GitHub Actions runs automatically
2. Intentionally break TypeScript — pipeline fails
3. Fix it and push — pipeline passes
4. PR shows green checkmark when CI passes

---

### V6-102: Integrate Sentry Error Monitoring 🔍

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 6 — Production and Infrastructure Hardening

**As a** developer operating the platform,
**I want** real-time error alerts with full context,
**So that** I can fix issues before users report them.

**The Problem:**
When something breaks in production, nobody knows until a user complains. There's no error tracking, no alerting, and no way to see what went wrong.

**Acceptance Criteria:**

- [ ] AC-1: Sentry SDK installed in both frontend and backend
- [ ] AC-2: Unhandled errors are captured automatically
- [ ] AC-3: Errors include user context (role, userId, current page)
- [ ] AC-4: Source maps are uploaded for readable stack traces
- [ ] AC-5: Alert sent (email/Slack) when error rate spikes

**Tasks:**

- [ ] TASK 1: Install Sentry in frontend
  - `npm install @sentry/react` in frontend
  - Initialize in `main.tsx` with DSN from environment variable
  - Wrap `App` in `Sentry.ErrorBoundary`
  - Configure: user context, release version, environment tag

- [ ] TASK 2: Install Sentry in backend
  - `npm install @sentry/nestjs` in backend
  - Initialize in `main.ts`
  - Add Sentry interceptor to catch all unhandled exceptions
  - Include request context (URL, method, user ID)

- [ ] TASK 3: Upload source maps in build pipeline
  - Add `@sentry/cli` to CI/CD
  - Upload frontend source maps after build
  - Tag release with git commit SHA

- [ ] TASK 4: Configure alerts
  - Alert on: new error type, error spike (>10 in 5 minutes)
  - Notify via email (Slack optional)

**How to Verify:**
1. Intentionally throw an error in production build
2. Error appears in Sentry dashboard within seconds
3. Stack trace shows original TypeScript (not minified JS)
4. User context is attached (which user, which page)

---

### V6-103: Dependency and Vulnerability Scans 🛡️

**Priority:** 🟠 P1 HIGH
**Story Points:** 3
**Sprint:** Sprint 6 — Production and Infrastructure Hardening

**As a** platform operator,
**I want** known security vulnerabilities in dependencies to be flagged and fixed,
**So that** the app is not exposed to published exploits.

**The Problem:**
No regular vulnerability scanning exists. Dependencies may have known CVEs that attackers can exploit.

**Acceptance Criteria:**

- [ ] AC-1: `npm audit` runs as part of CI and fails on high/critical vulnerabilities
- [ ] AC-2: All current high/critical vulnerabilities are fixed or documented
- [ ] AC-3: Dependabot (or similar) is configured for automated PR updates
- [ ] AC-4: OWASP Top 10 checklist reviewed for the application

**Tasks:**

- [ ] TASK 1: Run `npm audit` on both frontend and backend
  - Fix all high and critical vulnerabilities
  - Document any that cannot be fixed (transitive deps with no patch)
  - Update outdated packages to latest stable

- [ ] TASK 2: Configure Dependabot
  - File: `.github/dependabot.yml`
  - Auto-create PRs for security updates
  - Separate configs for frontend and backend
  - Weekly schedule for non-security updates

- [ ] TASK 3: OWASP Top 10 review
  - Check: SQL injection (Prisma handles this)
  - Check: XSS (React handles this, but check `dangerouslySetInnerHTML`)
  - Check: CSRF (verify tokens on state-changing endpoints)
  - Check: Broken auth (JWT validation, session management)
  - Check: Security misconfiguration (CORS, Helmet headers)
  - Document findings and fix any gaps

- [ ] TASK 4: Add `npm audit` to CI pipeline
  - Step in `.github/workflows/ci.yml`
  - Fail the build on high/critical vulnerabilities
  - Allow known exceptions with `npm audit --audit-level=high`

**How to Verify:**
1. `npm audit` — zero high/critical vulnerabilities
2. Dependabot PRs appear for outdated packages
3. OWASP review document exists with all checks passed

---
---

# ✅ Post-Sprint Regression Checklist (Smoke Test)

> Run this after EVERY sprint. Takes about 15 minutes.
> Check each box when verified. All must pass before the sprint is considered done.

### Platforms to Test:

- [ ] Chrome Desktop — Light Mode
- [ ] Chrome Desktop — Dark Mode
- [ ] Chrome Mobile Emulation (iPhone SE) — Light Mode
- [ ] Chrome Mobile Emulation (iPhone SE) — Dark Mode

### Routes to Check (on each platform):

| # | Route | What to Check |
|---|-------|---------------|
| 1 | `/` Dashboard | All 4 roles load. Stats are not hardcoded. No white backgrounds in dark mode. |
| 2 | `/temples` | Temple directory loads. Cards render. Search works. |
| 3 | `/temples/:slug` | Temple detail page loads. Tabs work. |
| 4 | `/client/babalawo-directory` | Babalawo list loads. Ratings are stable (refresh 3x). |
| 5 | `/booking/:id` | Booking page loads. Form is interactive. |
| 6 | `/marketplace` | Product grid loads. Images render. |
| 7 | `/cart` | Cart shows items (or empty state). Persists on refresh. |
| 8 | `/checkout` | Checkout form loads. Demo flow completes. |
| 9 | `/messages` | Inbox loads. Can select conversation. Can send message. |
| 10 | `/profile/:id` | Profile loads for all 3 roles. Role-specific sections visible. |
| 11 | `/events` | Events directory loads. |
| 12 | `/guidance-plans` | Plans list loads. |
| 13 | Sidebar | All nav items work. Collapse/expand works. Mobile drawer works. |
| 14 | Dark mode toggle | Toggle works. All pages readable. No white flashes. |

**Total: 56 checks** (14 routes x 4 platforms)

---

# 🗺️ Critical Post-Launch Backlog

> These are NOT in the V4 sprints. They are the next priorities AFTER April launch.
> Each one is a full sprint or epic on its own.

### 💳 Real Payment Integration (V7-001)
- **Why:** The #1 blocker to generating revenue. Currently checkout uses "demo completion."
- **What:** Integrate Stripe (international) and Paystack/Flutterwave (Nigeria)
- **Scope:** Consultation payments, marketplace purchases, wallet top-ups, vendor payouts
- **Effort:** 13+ SP (1-2 weeks)
- **Status:** 🔴 BLOCKED (pending launch)

### 🌍 Internationalization and Yoruba Language (V7-002)
- **Why:** The platform serves a Nigerian Yoruba-speaking community. English-only is limiting.
- **What:** Full i18n system using `react-i18next`. Yoruba translations for all UI strings.
- **Scope:** `LanguageProvider` already exists in `main.tsx`. Need translation files and language switcher.
- **Effort:** 8+ SP (1 week)
- **Status:** 🔴 BLOCKED (pending launch)

### 📊 Analytics and User Tracking (V7-003)
- **Why:** We have no data on what users do. Cannot make informed product decisions.
- **What:** Basic event tracking (page views, button clicks, funnel completion rates)
- **Scope:** PostHog or Mixpanel. Track: signup funnel, booking funnel, marketplace funnel, feature adoption.
- **Effort:** 5+ SP (3 days)
- **Status:** 🔴 BLOCKED (pending launch)

### 📜 Legal and Compliance (V7-004)
- **Why:** Required for any production app. Protects the business legally.
- **What:** Terms of Service page, Privacy Policy page, Cookie consent banner, NDPA compliance (Nigeria)
- **Scope:** Static pages + consent modal on first visit + data export endpoint (GDPR/NDPA)
- **Effort:** 5+ SP (3 days)
- **Status:** 🔴 BLOCKED (pending launch)

### 🔧 Full Backend Overhaul (V7-005)
- **Why:** Backend has 20+ TODO comments, 3% test coverage, no database backup strategy.
- **What:** Complete all TODOs, increase test coverage to 50%+, set up DB backups, add rate limiting
- **Scope:** Refund processing, certificate generation, fraud detection, subscription billing
- **Effort:** 21+ SP (2-3 weeks)
- **Status:** 🔴 BLOCKED (pending launch)

### 💾 Offline Support / PWA (V7-006)
- **Why:** Users in Nigeria may have intermittent connectivity. App should work offline for basic features.
- **What:** Service Worker caches app shell and recent data. Offline indicator. Queue actions for when online.
- **Effort:** 8+ SP (1 week)
- **Status:** 📋 PLANNED

### 🔍 SEO and Social Sharing (V7-007)
- **Why:** Temples, events, and Babalawo profiles should be discoverable via Google and shareable on social media.
- **What:** Meta tags, Open Graph images, structured data (JSON-LD), sitemap
- **Effort:** 3+ SP (2 days)
- **Status:** 📋 PLANNED

### 📤 User Data Export (V7-008)
- **Why:** GDPR and NDPA require users to be able to download their data.
- **What:** `GET /api/users/:id/export` returns a ZIP of all user data (profile, messages, bookings, orders)
- **Effort:** 3+ SP (2 days)
- **Status:** 📋 PLANNED

---

# 📚 APPENDIX — Quick Reference

## 🎯 Story Point Guide

| Points | Meaning | Example |
|--------|---------|---------|
| 1 | Trivial — less than 1 hour | Fix a typo |
| 2 | Small — 1 to 2 hours | Add localStorage to cart |
| 3 | Medium — half a day | Create a new hook + wire it up |
| 5 | Large — full day | Replace 38 alert() calls across codebase |
| 8 | Very Large — 2 days | Real-time WebSocket messaging |
| 13 | Epic — 3+ days | Full accessibility overhaul |

## 🚦 Priority Guide

| Priority | Meaning | When to Work On |
|----------|---------|-----------------|
| 🔴 P0 BLOCKER | Users will lose trust or the feature is broken | Do it NOW |
| 🟠 P1 HIGH | Significant UX or code quality issue | Do it THIS sprint |
| 🟡 P2 MEDIUM | Nice to have, improves polish | Do it if time allows |
| ⚪ P3 LOW | Future enhancement | Backlog for later |

## 🏷️ Labeling Convention

| Label | Meaning | Example |
|-------|---------|---------|
| V4-XXX | Quality and Trust sprint items | V4-101, V4-201 |
| V5-XXX | Backend and Real-Time items | V5-101, V5-102 |
| V6-XXX | Production Infrastructure items | V6-101, V6-102 |
| V7-XXX | Post-Launch backlog items | V7-001, V7-002 |

## 📝 Document History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-24 | Product Owner | Initial V4 backlog created from platform audit |
| 2026-02-24 | Product Owner | Added Sprint 5 (Backend), Sprint 6 (Production), Post-Launch backlog, Smoke Test, Pre-Work section. Restructured sprints: dead code cleanup moved to Sprint 1. Total: 129 SP across 6 sprints. |

---

*This backlog is a living document. Update it after every completed story.*