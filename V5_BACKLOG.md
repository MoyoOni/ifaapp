# V5: THE REAL PLATFORM
## Ìlú Àṣẹ — Full Functional Backlog & Implementation Guide

**Phase:** V5 — From Demo to Production
**Target:** April 1, 2026 (GO LIVE)
**Total Story Points:** 187 SP across 8 sprints
**Labels:** `V5-XXX` (this phase)
**Branch:** `v5/real-platform` → merge to `IfaAppV1` after each sprint smoke test

---

## TABLE OF CONTENTS

1. [Vision & Philosophy](#1-vision--philosophy)
2. [The Root Problem](#2-the-root-problem)
3. [System Architecture Map](#3-system-architecture-map)
4. [Sprint Overview & Math](#4-sprint-overview--math)
5. [Sprint 1 — Foundation & Quick Wins](#5-sprint-1--foundation--quick-wins-24-sp)
6. [Sprint 2 — Admin Dashboard: Full Real Data](#6-sprint-2--admin-dashboard-full-real-data-42-sp)
7. [Sprint 3 — User Profiles: Edit & Share](#7-sprint-3--user-profiles-edit--share-20-sp)
8. [Sprint 4 — Client Experience](#8-sprint-4--client-experience-18-sp)
9. [Sprint 5 — Babalawo Real Data](#9-sprint-5--babalawo-real-data-20-sp)
10. [Sprint 6 — Vendor Real Data](#10-sprint-6--vendor-real-data-18-sp)
11. [Sprint 7 — Advanced Platform Features](#11-sprint-7--advanced-platform-features-30-sp)
12. [Sprint 8 — Polish, Performance & UX](#12-sprint-8--polish-performance--ux-15-sp)
13. [Ideas & Recommendations](#13-ideas--recommendations)
14. [Risk Registry](#14-risk-registry)
15. [Definition of Done](#15-definition-of-done)

---

## 1. VISION & PHILOSOPHY

### What V5 Is
V4 built and launched the infrastructure. V1 built every feature. **V5 makes it all real.**

The platform currently operates with a hidden "demo data layer" — every time a real API call fails (or sometimes just by default), the app silently serves fake data from `frontend/src/demo/demo-ecosystem.ts`. This means:

- **Admin sees fake users** — they cannot actually manage real accounts
- **Payout approvals show fake transactions** — real money requests are invisible
- **Analytics shows fake numbers** — business decisions are based on fiction
- **Empty states look like errors** — real users with no data think the app is broken
- **Routes 404** — URLs shared between devs and users hit dead ends

V5 removes all demo fallbacks from production paths, connects every view to its real backend endpoint, adds proper empty states, and builds the platform features that real users need but haven't been exposed yet.

### Philosophy
1. **No silent fake data** — if the API fails, show the error. Never substitute fiction for fact.
2. **Empty ≠ Error** — "You have no seekers yet" is not a failure. Design for zero-state.
3. **Admin must operate** — the admin dashboard is the command center for a live platform. It must work.
4. **Every user role has a complete experience** — CLIENT, BABALAWO, VENDOR, ADMIN each have a fully wired journey.
5. **The backend already exists** — every feature in this backlog maps to an existing backend endpoint. This is wiring work, not invention work.
6. **Intentional UX** — text, icons, colors, and layouts are decisions. Make them deliberately.

---

## 2. THE ROOT PROBLEM

### The Demo Fallback Pattern (What to Kill)

Currently in `admin-dashboard-view.tsx` (lines 92–129) and across the app:

```typescript
// ❌ CURRENT PATTERN — silently serves fake data
queryFn: async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (e) {
    logger.warn('Using demo admin stats');  // only in console, user never knows
    return getDemoAdminStats();             // returns FAKE data
  }
}
```

### Why It's Happening
The API calls ARE wired. They attempt the real endpoint. But when they fail (CORS, auth token missing, backend not responding, wrong URL), the catch block silently returns demo data instead of surfacing the error.

### The Fix Pattern (What to Build)

```typescript
// ✅ V5 PATTERN — fail loudly, handle gracefully
queryFn: async () => {
  const response = await api.get('/admin/stats');
  return response.data;  // throws on failure → React Query handles error state
},
// In component: if (isError) return <ErrorState message="Could not load stats" onRetry={refetch} />
// In component: if (!data || data.length === 0) return <EmptyState message="No data yet" />
```

### Files Containing Demo Fallbacks to Remove

| File | Demo Imports to Remove | Real Endpoint |
|------|----------------------|---------------|
| `features/admin/admin-dashboard-view.tsx` | `getDemoAdminStats`, `getAllDemoUsers`, `getDemoVerifications` | `/admin/stats`, `/admin/users`, `/admin/verification-applications` |
| `features/admin/admin-overview-tab.tsx` | Any demo imports | `/admin/stats` |
| `features/admin/admin-user-management-tab.tsx` | Demo user data | `/admin/users` |
| `features/babalawo/earnings-report-view.tsx` | None (already real) | `/wallet/:userId/transactions` |
| `features/babalawo/my-seekers-view.tsx` | None (already real, bad empty state) | `/babalawo-client/:babalawoId/clients` |
| `features/babalawo/temple-connection-view.tsx` | Demo temple fallback | `/temples`, `/temples/followed/all` |
| `features/profile/hooks/use-profile-query.ts` | `DEMO_USERS` fallback | `/users/:id/profile` |
| `features/academy/academy-view.tsx` | `getAllCourses()` static fallback | `/academy/courses` |
| `features/academy/course-data.ts` | Static course array | Replaced by real API |
| `features/client-hub/personal-dashboard-view.tsx` | Demo data | `/dashboard/client/:userId/summary` |
| `features/marketplace/vendor-dashboard-view.tsx` | Demo data | `/dashboard/vendor/:userId/summary` |

---

## 3. SYSTEM ARCHITECTURE MAP

### Data Flow (Current vs V5)

```
CURRENT:
User Request → Frontend Component → API Call → [SUCCESS] Real Data
                                              → [FAIL]   Demo Data ← PROBLEM

V5:
User Request → Frontend Component → API Call → [SUCCESS] Real Data → Render
                                              → [FAIL]   Error State → Retry Button
                                              → [EMPTY]  Empty State → CTA
```

### Authentication Flow
```
User logs in → JWT issued (15min) → Stored in memory (not localStorage)
             → Refresh token (7d) → HttpOnly cookie
             → api.ts interceptor adds Bearer token to every request
             → 401 response → auto-refresh → retry original request
             → Refresh fails → redirect to /login
```

### Role-Based Routing Matrix
```
ADMIN   → /admin (dashboard command center)
BABALAWO → /practitioner/dashboard
VENDOR  → /vendor/dashboard
CLIENT  → /client/dashboard

Each role has protected routes. Non-matching role → redirect to own dashboard.
```

### Component Architecture (Admin Example)
```
AdminDashboardView (shell)
  ├── Tab navigation (13 tabs)
  ├── AdminOverviewTab          → GET /admin/stats
  ├── VerificationQueueView     → GET /admin/verification-applications
  ├── AdminUserManagementTab    → GET /admin/users
  ├── TempleManagementView      → GET /temples (admin filter)
  ├── VendorReviewView          → GET /admin/vendors/pending
  ├── CircleManagementView      → GET /admin/circles/pending
  ├── DisputeCenterView         → GET /admin/reported-content
  ├── PayoutApprovalsView       → GET /admin/withdrawals/pending
  ├── ReportedContentView       → GET /admin/reported-content
  ├── QualityAssuranceView      → GET /admin/audit-logs
  ├── PlatformHealthView        → GET /admin/analytics (health metrics)
  ├── AnalyticsDashboardView    → GET /admin/analytics
  └── FraudAlertsView           → GET /admin/fraud-alerts
```

---

## 4. SPRINT OVERVIEW & MATH

| Sprint | Theme | SP | Duration |
|--------|-------|----|----------|
| Sprint 1 | Foundation & Quick Wins | 24 | 2 days |
| Sprint 2 | Admin Dashboard Real Data | 42 | 5 days |
| Sprint 3 | User Profiles Edit & Share | 20 | 3 days |
| Sprint 4 | Client Experience | 18 | 2 days |
| Sprint 5 | Babalawo Real Data | 20 | 3 days |
| Sprint 6 | Vendor Real Data | 18 | 2 days |
| Sprint 7 | Advanced Platform Features | 30 | 4 days |
| Sprint 8 | Polish, Performance & UX | 15 | 2 days |
| **TOTAL** | | **187 SP** | **~23 days** |

### Story Point Legend
- **1 SP** = Trivial: text change, redirect, single-line fix (< 30 min)
- **2 SP** = Small: component wiring, empty state, rename (30min–2hr)
- **3 SP** = Medium: feature connection, new query hook, new view section (2–4hr)
- **5 SP** = Large: full tab/view wired with real data + error/empty states (4–8hr)
- **8 SP** = Very Large: multi-component feature with mutations + optimistic updates (1–2 days)
- **13 SP** = Epic: should be broken down further

---

## 5. SPRINT 1 — FOUNDATION & QUICK WINS (24 SP)

> **Goal:** Fix every user-visible embarrassment before touching data. Routes that 404, names that lie, errors that mislead. Zero API work needed — all frontend-only.

---

### V5-101 — Fix `/admin/dashboard` 404 (1 SP)

**Problem:** `/admin/dashboard` returns NotFound. Admin bookmarks this URL and gets a 404.
**Root cause:** Route is registered as `/admin`, not `/admin/dashboard`.

**Files:**
- `frontend/src/App.tsx`

**Fix:**
```typescript
// In App.tsx route definitions, add redirect:
<Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
// Place this BEFORE the <Route path="/admin" element={...} /> line
```

**Acceptance Criteria:**
- [ ] `/admin/dashboard` navigates to `/admin` without 404
- [ ] Browser history shows `/admin` (replace, not push)
- [ ] Existing `/admin` route unaffected

---

### V5-102 — Fix `/practitioner/earnings-report` 404 (1 SP)

**Problem:** `/practitioner/earnings-report` 404s. Real route is `/practitioner/earnings`.

**Files:**
- `frontend/src/App.tsx`

**Fix:**
```typescript
<Route path="/practitioner/earnings-report" element={<Navigate to="/practitioner/earnings" replace />} />
```

**Acceptance Criteria:**
- [ ] `/practitioner/earnings-report` redirects to `/practitioner/earnings`
- [ ] EarningsReportView loads correctly

---

### V5-103 — Rename "Professional Growth" → "Academy" (2 SP)

**Problem:** The Academy page and/or nav item is labeled "Professional Growth" in some places. The canonical name is "Academy" — used in routes (`/academy`), in CLAUDE.md, and in backend (`/academy/courses`). Mixed naming creates confusion.

**Files to search and fix:**
```bash
grep -r "Professional Growth" frontend/src/
grep -r "professionalGrowth" frontend/src/
```

**Expected locations:**
- `frontend/src/shared/components/sidebar-layout.tsx` — nav item label
- `frontend/src/features/academy/academy-view.tsx` — page title
- Any sidebar config file

**Fix:** Replace every instance of "Professional Growth" with "Academy"

**Acceptance Criteria:**
- [ ] Sidebar nav shows "Academy" (not "Professional Growth")
- [ ] `/academy` page title shows "Academy"
- [ ] No remaining "Professional Growth" text in UI

---

### V5-104 — My Seekers: Empty State vs Error State (3 SP)

**Problem:** `frontend/src/features/babalawo/my-seekers-view.tsx` — when a babalawo has 0 clients, the API returns an empty array `[]`. Currently this might trigger an error-like display. A new babalawo has NO seekers — that is correct and expected, not an error.

**Logic:**
```
API returns [] → Empty State (encouraging, with CTA)
API throws error → Error State (with retry button)
These are DIFFERENT states and must NEVER be conflated.
```

**Files:**
- `frontend/src/features/babalawo/my-seekers-view.tsx`

**Empty State Design:**
```tsx
// When data.length === 0 AND no error:
<div className="text-center py-16">
  <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
  <h3 className="text-lg font-semibold text-foreground mb-2">No seekers yet</h3>
  <p className="text-muted-foreground mb-6">
    Share your booking link to connect with your first seeker
  </p>
  <button onClick={copyBookingLink} className="btn-primary">
    Copy Booking Link
  </button>
</div>

// When isError === true:
<div className="text-center py-16">
  <AlertTriangle className="mx-auto mb-4 text-destructive" size={48} />
  <h3 className="text-lg font-semibold text-foreground mb-2">Could not load seekers</h3>
  <p className="text-muted-foreground mb-6">
    There was a problem connecting to the server. Please try again.
  </p>
  <button onClick={() => refetch()} className="btn-outline">
    Try Again
  </button>
</div>
```

**Acceptance Criteria:**
- [ ] New babalawo with 0 clients sees encouraging empty state with booking link CTA
- [ ] API failure shows error state with retry button
- [ ] No error-like language appears for empty array response
- [ ] Existing seeker display (when data exists) is unaffected

---

### V5-105 — Temple Connection: Empty State vs Error State (3 SP)

**Problem:** Same issue as V5-104. `temple-connection-view.tsx` shows "failed to load temples" when temples list may just be empty or API is slow.

**Files:**
- `frontend/src/features/babalawo/temple-connection-view.tsx`

**Three states:**
```
Loading  → Skeleton cards
No temples found (search returns []) → "No temples match your search" + clear search button
All temples, but none followed → "You haven't affiliated with a temple yet" + browse CTA
Error → "Could not load temples" + retry button
```

**Acceptance Criteria:**
- [ ] Search with no results shows "No temples match '...'" with clear button
- [ ] Unaffiliated tab with 0 temples shows helpful message
- [ ] Network error shows error state with retry
- [ ] Loading state shows skeletons (not blank)

---

### V5-106 — Client Temple View: Add Temple Browse to Client Nav (5 SP)

**Problem:** Clients cannot browse or follow temples from the app. The babalawo has `TempleConnectionView` but clients have nothing. Yet the backend supports client temple following (`POST /temples/:id/follow`, `GET /temples/followed/all`).

**Files to create/edit:**
- `frontend/src/features/client-hub/temple-browse-view.tsx` — NEW component
- `frontend/src/shared/components/sidebar-layout.tsx` — add nav item for CLIENT role
- `frontend/src/App.tsx` — add route `/client/temples`

**Data flow:**
```
GET /temples?search=&limit=20&offset=0
  → Display grid of temple cards

POST /temples/:id/follow
  → Optimistic update: add to "My Temples"
  → On success: toast "Joined [Temple Name]"
  → On error: rollback + toast error

GET /temples/followed/all
  → "My Temples" tab showing followed temples
```

**Component structure:**
```tsx
ClientTempleBrowseView
  ├── SearchBar
  ├── Tabs: "All Temples" | "My Temples"
  ├── TempleCard[] (name, description, location, member count, follow button)
  └── Pagination (20 per page)
```

**Acceptance Criteria:**
- [ ] Client sidebar shows "Temples" nav item
- [ ] `/client/temples` route loads temple browse view
- [ ] Client can search temples by name
- [ ] Client can follow/unfollow a temple
- [ ] "My Temples" tab shows followed temples
- [ ] Temple card links to `/temples/:slug` detail page

---

### V5-107 — Fix Admin Contrast: Grey Text on Grey Background (2 SP)

**Problem:** Admin dashboard has low-contrast text. The `TabFallback` component and several tab views use `text-muted` on light grey `bg-white/5` backgrounds, making text invisible.

**Files:**
- `frontend/src/features/admin/admin-dashboard-view.tsx` — `TabFallback` component (line 49–56)
- All admin tab view files — check for `text-muted` class

**Fix:**
- `TabFallback` text: change `text-muted` → `text-muted-foreground`
- Verify tab labels in nav use sufficient contrast in both active and inactive states
- Inactive tab label (line 251): `text-muted` → `text-foreground/60`

**Acceptance Criteria:**
- [ ] All admin tab text passes WCAG AA contrast (4.5:1 minimum)
- [ ] Inactive tab labels clearly readable
- [ ] "Feature coming soon" text in TabFallback is clearly visible

---

### V5-108 — Fix `try/catch` in `renderTabContent()` (2 SP)

**Problem:** `admin-dashboard-view.tsx` lines 172–188 use synchronous `try/catch` around JSX renders. This does NOT catch React rendering errors — React errors throw asynchronously during reconciliation, not during JSX evaluation. These try/catch blocks are false safety.

**Current (broken):**
```typescript
case 'temples':
  try { return <TempleManagementView />; } catch { return <TabFallback ... />; }
// This NEVER catches rendering errors. It only catches constructor errors.
```

**Fix:** Replace with React Error Boundaries per tab.

```typescript
// Create: frontend/src/shared/components/tab-error-boundary.tsx
class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { logger.error('Tab render error:', error); }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// In admin-dashboard-view.tsx:
case 'temples':
  return (
    <TabErrorBoundary fallback={<TabFallback icon={Building2} label="Temple Management" />}>
      <TempleManagementView />
    </TabErrorBoundary>
  );
```

**Acceptance Criteria:**
- [ ] `TabErrorBoundary` component created in shared/components
- [ ] All 10 try/catch tab renders replaced with TabErrorBoundary
- [ ] Rendering errors in a tab show fallback without crashing entire dashboard
- [ ] Errors are logged via `logger.error`

---

### V5-109 — Add `/admin/dashboard` to Sidebar Active State Detection (1 SP)

**Problem:** If sidebar uses `location.pathname` to highlight active nav items, `/admin` is the correct path but may not highlight if nav item is configured as `/admin/dashboard`.

**Files:**
- `frontend/src/shared/components/sidebar-layout.tsx`

**Fix:** Ensure admin nav item uses `startsWith('/admin')` for active detection, not exact match.

**Acceptance Criteria:**
- [ ] Admin nav item highlights on `/admin`, `/admin/users`, `/admin/verification`, all admin sub-routes
- [ ] No double-highlight issues

---

### V5-110 — Academy: Wire Real Course Data (5 SP)

**Problem:** `academy-view.tsx` initializes from `getAllCourses()` (hardcoded static data in `course-data.ts`). It attempts `GET /academy/courses` but the static courses are the "default" state. If the API returns real courses, they replace it — but if no one has created courses yet, users see 12 fake courses.

**Files:**
- `frontend/src/features/academy/academy-view.tsx`
- `frontend/src/features/academy/course-data.ts` — static courses (keep as DEMO ONLY, not default)

**Fix:**
```typescript
// Remove static initialization:
// BEFORE: const [courses, setCourses] = useState(getAllCourses());
// AFTER:
const { data: courses = [], isLoading, isError, refetch } = useQuery({
  queryKey: ['academy-courses', category, level, searchQuery],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (level) params.set('level', level);
    const response = await api.get(`/academy/courses?${params}`);
    return response.data;
  },
});

// Empty state when [] returned:
// "No courses available yet. Check back soon!"
// If user is BABALAWO: add CTA "Create a Course"
```

**Acceptance Criteria:**
- [ ] Academy loads courses from `/academy/courses` endpoint
- [ ] Loading skeleton shown while fetching
- [ ] Empty state shown when API returns empty array
- [ ] Error state with retry when API fails
- [ ] Search/filter still works with real data
- [ ] Static course data (`course-data.ts`) NOT used as default

---

Sprint 1 Total: **24 SP**

---

## 6. SPRINT 2 — ADMIN DASHBOARD: FULL REAL DATA (42 SP)

> **Goal:** Every admin tab connected to real data. Remove all demo fallbacks. Admin must be able to manage the live platform.

> **Pre-requisite:** Ensure admin user has valid JWT with ADMIN role. Test with the real admin account, not demo session.

---

### V5-201 — Admin Stats: Remove Demo Fallback (3 SP)

**File:** `frontend/src/features/admin/admin-dashboard-view.tsx` (lines 92–103)
**Backend:** `GET /admin/stats`

**Returns:**
```typescript
interface PlatformStats {
  totalUsers: number;
  verifiedBabalawos: number;
  pendingVerifications: number;
  activeRelationships: number;
  totalAppointments: number;
  totalMessages: number;
}
```

**Fix:**
1. Remove `getDemoAdminStats` import and catch fallback
2. Add `isError` handling: show error card in overview with retry button
3. Show skeleton numbers during loading (3 grey bars)
4. Show `0` for any null/undefined fields (handle partial data gracefully)

**Also fix `admin-overview-tab.tsx`:**
- Remove any demo data imports
- Stat cards must show real numbers

**Acceptance Criteria:**
- [ ] Overview stat cards show real platform counts
- [ ] Loading shows number skeletons (not "0" or old data)
- [ ] API failure shows error state with retry (not fake stats)
- [ ] Stats refresh on tab focus (set `staleTime: 60_000`)

---

### V5-202 — Admin Users: Remove Demo Fallback + Real Actions (5 SP)

**File:** `frontend/src/features/admin/admin-user-management-tab.tsx`
**Backend:** `GET /admin/users?role=&verified=`

**Returns:** Array of user objects with role, verified status, createdAt, etc.

**Fix:**
1. Remove `getAllDemoUsers` import and catch fallback in `admin-dashboard-view.tsx` (lines 105–116)
2. Move the query INTO `admin-user-management-tab.tsx` (self-contained, not passed as prop)
3. Add real filters: role dropdown (ALL / CLIENT / BABALAWO / VENDOR), verified toggle
4. Add search by name/email
5. Pagination: `GET /admin/users?page=1&limit=20&role=&search=`

**Table columns:**
```
Name | Email | Role | Verified | Joined | Actions
```

**Actions per user row:**
- View Profile → navigate to `/profile/:id`
- Impersonate → calls `POST /admin/impersonate/:id` (already implemented in parent)
- Suspend → `PATCH /users/:id` with `{ status: 'SUSPENDED' }` (check if endpoint exists)

**Math:**
- If total users > 20, show pagination: `Math.ceil(totalCount / 20)` pages
- Debounce search input: 300ms delay before querying

**Acceptance Criteria:**
- [ ] User list loads from real API
- [ ] Role filter works (CLIENT, BABALAWO, VENDOR, ADMIN, ALL)
- [ ] Search by name/email works (debounced)
- [ ] Pagination works when > 20 users
- [ ] Impersonate action works with reason prompt
- [ ] No demo user data ever shown
- [ ] Empty state when filters return 0 users

---

### V5-203 — Verification Queue: Remove Demo Fallback + Real Actions (5 SP)

**File:** `frontend/src/features/admin/verification-queue-view.tsx`
**Backend:**
- `GET /admin/verification-applications?stage=PENDING`
- `PATCH /admin/verification-applications/:id/approve`
- `POST /admin/verification-applications/:id/reject` (body: `{ reason: string }`)

**Fix:**
1. Remove `getDemoVerifications` from parent `admin-dashboard-view.tsx` (lines 118–129)
2. Move query into `verification-queue-view.tsx`
3. Wire approve button → `PATCH /admin/verification-applications/:id/approve`
4. Wire reject button → prompt for reason → `POST /admin/verification-applications/:id/reject`
5. After approve/reject: invalidate query → list auto-refreshes

**Optimistic update pattern:**
```typescript
onMutate: async (id) => {
  await queryClient.cancelQueries({ queryKey: ['admin-verifications'] });
  const previous = queryClient.getQueryData(['admin-verifications']);
  queryClient.setQueryData(['admin-verifications'], (old) =>
    old?.filter(v => v.id !== id)
  );
  return { previous };
},
onError: (_err, _id, context) => {
  queryClient.setQueryData(['admin-verifications'], context?.previous);
  toast.error('Action failed — please try again');
},
onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-verifications'] }),
```

**Stages:** PENDING → APPROVED / REJECTED (filter buttons in tab)

**Acceptance Criteria:**
- [ ] Pending verifications load from real API
- [ ] Approve action works and removes item from list
- [ ] Reject action prompts for reason, then removes item
- [ ] Toast confirms success/failure
- [ ] Empty state when no pending verifications: "All verifications processed ✓"
- [ ] No demo verification data

---

### V5-204 — Payout Approvals: Full Real Data + Actions (5 SP)

**File:** `frontend/src/features/admin/payout-approvals-view.tsx`
**Backend:**
- `GET /admin/withdrawals/pending`
- `POST /admin/withdrawals/:id/process` (body: `{ approve: boolean, rejectionReason?: string }`)

**Withdrawal object shape:**
```typescript
interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  amount: number;           // in kobo (Nigerian Naira × 100)
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}
```

**Display math:** `amount / 100` to convert kobo → naira. Format as `₦{amount.toLocaleString('en-NG')}`

**Flow:**
```
Approve button → Confirm modal "Approve ₦X,XXX payout to [Name]?" → POST with { approve: true }
Reject button  → Input modal "Reason for rejection" → POST with { approve: false, rejectionReason }
```

**Acceptance Criteria:**
- [ ] Pending payouts load from real API
- [ ] Amount displayed in ₦ (naira), formatted with commas
- [ ] Approve flow has confirmation modal
- [ ] Reject flow prompts for reason
- [ ] After action: item removed from list, toast shown
- [ ] Empty state: "No pending payout requests"
- [ ] Total pending amount shown in header: "₦X,XXX total pending"

---

### V5-205 — Dispute Center: Full Real Data + Actions (5 SP)

**File:** `frontend/src/features/admin/dispute-center-view.tsx`
**Backend:**
- `GET /admin/reported-content?type=DISPUTE&status=OPEN`
- `POST /admin/reported-content/:type/:id/resolve` (body: `{ action: 'DISMISS' | 'REMOVE' }`)

**Dispute card shows:**
- Reported by (user name + role)
- Reported against (user name + role)
- Type: BOOKING / MESSAGE / REVIEW / PRODUCT
- Description / reason
- Date reported
- Actions: Dismiss | Remove Content | View Thread

**Loading state:** 3 skeleton dispute cards
**Empty state:** "No open disputes — platform running smoothly ✓"

**Acceptance Criteria:**
- [ ] Disputes load from real API
- [ ] Filter by type (ALL / BOOKING / MESSAGE / REVIEW)
- [ ] Filter by status (OPEN / RESOLVED)
- [ ] Dismiss action resolves with DISMISS
- [ ] Remove Content resolves with REMOVE
- [ ] After action: invalidate query + toast

---

### V5-206 — Content Moderation: Full Real Data (5 SP)

**File:** `frontend/src/features/admin/reported-content-view.tsx`
**Backend:** `GET /admin/reported-content` (forum posts, reviews, messages)

**Content types to moderate:**
- Forum posts (flagged by users)
- Product reviews (potentially fake/abusive)
- Direct messages (reported as harassment)

**Display per item:**
```
Content type badge | Author | Content preview (100 chars) | Reports count | Reported at
[View Full] [Dismiss] [Remove] [Ban Author]
```

**"Ban Author" action:** `PATCH /users/:id` with suspension flag — confirm first with reason modal

**Acceptance Criteria:**
- [ ] Reported content loads from real API
- [ ] Filter by content type
- [ ] Sort by report count (most reported first)
- [ ] View Full expands content inline
- [ ] Dismiss / Remove actions work
- [ ] Empty state: "No reported content"

---

### V5-207 — Fraud Alerts: Full Real Data (3 SP)

**File:** `frontend/src/features/admin/fraud-alerts-view.tsx`
**Backend:** `GET /admin/fraud-alerts`

**Alert types:**
- Multiple accounts (same IP/email pattern)
- Unusual transaction volume
- Chargebacks / disputed payments
- Rapid booking/cancellation patterns

**Display:**
```
Alert severity badge (HIGH/MEDIUM/LOW) | User | Type | Details | Date | [Investigate] [Dismiss]
```

**Acceptance Criteria:**
- [ ] Fraud alerts load from real API
- [ ] Sorted by severity (HIGH first)
- [ ] Investigate → navigates to user profile
- [ ] Dismiss → marks alert as reviewed (if endpoint supports it)
- [ ] Empty state: "No active fraud alerts ✓"

---

### V5-208 — Analytics Dashboard: Real Data with Charts (5 SP)

**File:** `frontend/src/features/admin/analytics-dashboard-view.tsx`
**Backend:** `GET /admin/analytics?period=30d`

**Periods:** 7d / 30d / 90d / 1y

**Metrics to display:**
```typescript
interface Analytics {
  period: string;
  newUsers: number;
  newBabalawos: number;
  totalAppointments: number;
  completedAppointments: number;
  cancellationRate: number;    // completedAppointments / totalAppointments
  totalRevenue: number;        // in kobo
  platformFees: number;        // revenue × platform fee %
  avgSessionValue: number;     // totalRevenue / completedAppointments
  activeUsers: number;
}
```

**Calculated display metrics:**
```
Completion Rate = (completedAppointments / totalAppointments) × 100  → "78.3%"
Revenue = totalRevenue / 100  → "₦1,234,567"
Platform Fees = platformFees / 100  → "₦123,456"
Avg Session = avgSessionValue / 100  → "₦12,500"
```

**Charts (use recharts or existing chart lib in project):**
- New users over time (line chart)
- Revenue over time (area chart)
- Appointments: completed vs cancelled (bar chart)

**Acceptance Criteria:**
- [ ] Analytics loads from real API with period selector
- [ ] All calculated metrics display correctly
- [ ] Charts render with real data
- [ ] Period selector triggers new API call
- [ ] Loading state shows skeleton metrics

---

### V5-209 — Temple Management: Admin View (3 SP)

**File:** `frontend/src/features/admin/temple-management-view.tsx`
**Backend:**
- `GET /temples` (all temples including unverified)
- `PATCH /temples/:id/verify` (admin only)

**Display:**
- All temples with verified/unverified badge
- Unverified temples at top
- Actions: Verify | View Detail | Edit

**Acceptance Criteria:**
- [ ] All temples load (including unverified)
- [ ] Verify button works for unverified temples
- [ ] Filter: Verified / Unverified / All
- [ ] Empty state for each filter

---

### V5-210 — Vendor Review: Real Actions (3 SP)

**File:** `frontend/src/features/admin/vendor-review-view.tsx`
**Backend:**
- `GET /admin/vendors/pending`
- `POST /admin/vendors/:vendorId/review` (body: `{ approved: boolean, culturalAuthenticityNotes?: string }`)

**Review flow:**
1. View pending vendor application
2. Check products listed, cultural notes
3. Approve → `{ approved: true }`
4. Reject → prompt for `culturalAuthenticityNotes` → `{ approved: false, culturalAuthenticityNotes }`

**Acceptance Criteria:**
- [ ] Pending vendor applications load
- [ ] Approve/reject actions work
- [ ] Rejection requires note
- [ ] Empty state: "No pending vendor applications"

---

### V5-211 — Quality Assurance Tab: Real Data (2 SP)

**File:** `frontend/src/features/admin/quality-assurance-view.tsx`
**Backend:** `GET /admin/audit-logs?page=1&limit=50`

**Audit log entry:**
```
Timestamp | Actor | Action | Target | IP Address | Result
```

**Filters:**
- Action type: IMPERSONATION / VERIFICATION / SUSPENSION / PAYOUT
- Date range
- Actor (admin who performed action)

**Acceptance Criteria:**
- [ ] Audit logs load from real API
- [ ] Pagination works
- [ ] Filters work
- [ ] Export to CSV button (client-side, build from loaded data)

---

### V5-212 — Platform Health Tab: Real Metrics (3 SP)

**File:** `frontend/src/features/admin/platform-health-view.tsx`
**Backend:** `GET /admin/analytics` (health subset: unverified payments, error rates)
**Additional checks (client-side):**
- API response time (measure query durations)
- Last successful backup timestamp (from analytics)

**Health indicators:**
```
API Status:     ● HEALTHY / ● DEGRADED / ● DOWN
DB Status:      ● HEALTHY (derived from successful API calls)
Payment Flow:   X unverified payments pending
Last Backup:    [timestamp]
Error Rate:     [count in last 24h from analytics]
```

**Auto-refresh:** every 60 seconds (`refetchInterval: 60_000`)

**Acceptance Criteria:**
- [ ] Health indicators show real status
- [ ] Unverified payments count links to payment verification workflow
- [ ] Auto-refreshes every 60 seconds
- [ ] Manual refresh button

---

Sprint 2 Total: **42 SP**

---

## 7. SPRINT 3 — USER PROFILES: EDIT & SHARE (20 SP)

> **Goal:** Users can edit their own profile. Every profile has a shareable URL. Profile data comes from the real database.

---

### V5-301 — Profile Edit Form: PATCH /users/:id (8 SP)

**Problem:** Users cannot edit their own profile from `/profile`. A settings page exists at `/settings` but may not expose all profile fields.

**File:** `frontend/src/features/profile/public-profile-view.tsx`
**Backend:** `PATCH /users/:id` (authenticated, own profile only)

**Editable fields by role:**

**All Roles:**
- Display name (`name`)
- Yoruba name (`yorubaName`)
- Avatar / profile photo (file upload → S3)
- Bio (`bio`)
- Location (`location`)
- Cultural level (`culturalLevel`)

**BABALAWO additionally:**
- Specializations (array, tag input)
- Years active
- Services offered (with pricing)
- Availability note

**VENDOR additionally:**
- Business name
- Website
- Speciality description

**UX flow:**
```
/profile → View mode (read-only card)
  [Edit Profile] button (only shown when currentUser.id === profileUser.id)
  → Edit mode: form overlays OR dedicated /profile/edit route
  → [Save Changes] → PATCH /users/:id → toast "Profile updated"
  → [Cancel] → returns to view mode, no changes
```

**Form validation:**
```
name: required, min 2 chars, max 80 chars
yorubaName: optional, max 80 chars
bio: optional, max 500 chars
location: optional, max 100 chars
```

**Avatar upload flow:**
```
[Upload Photo] → file input (accept="image/*", max 5MB)
→ client-side resize to max 800×800px (use canvas API)
→ POST to /files/upload (or existing S3 presigned URL endpoint)
→ get back URL
→ include avatarUrl in PATCH /users/:id payload
```

**Check for file upload endpoint:**
```bash
grep -r "upload" backend/src/ --include="*.controller.ts"
```

**Acceptance Criteria:**
- [ ] Edit button appears only on own profile
- [ ] All listed fields are editable
- [ ] Form validates before submitting
- [ ] Avatar upload works (or gracefully disabled if no upload endpoint)
- [ ] PATCH /users/:id called on save
- [ ] Toast confirms success
- [ ] Optimistic update shows new data immediately
- [ ] Cancel reverts all changes
- [ ] Error handling if save fails

---

### V5-302 — Remove Profile Demo Fallback (3 SP)

**File:** `frontend/src/features/profile/hooks/use-profile-query.ts`

**Current:**
```typescript
// Falls back to DEMO_USERS[userId] when API fails
```

**Fix:**
```typescript
export function useProfileQuery(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    retry: 1,
  });
  // NO demo fallback — show error state if API fails
}
```

**Error state in `public-profile-view.tsx`:**
```tsx
if (isError) return (
  <div className="text-center py-20">
    <p className="text-muted-foreground">Profile not found or unavailable</p>
    <button onClick={() => navigate(-1)}>Go Back</button>
  </div>
);
```

**Acceptance Criteria:**
- [ ] Profile loads from real API
- [ ] No DEMO_USERS fallback
- [ ] Non-existent user ID shows "Profile not found"
- [ ] Network error shows retry option

---

### V5-303 — Shareable Profile URL (3 SP)

**Backend already built:** `/public/resolve/:slug` (no auth required)
**Slug field** exists on User in database
**BabalawoLandingPage** already exists for public profiles

**Problem:** The share mechanism is not surfaced in the UI. Users don't know their profile is shareable.

**Add to profile view (own profile only):**
```tsx
// Profile header section
<div className="flex items-center gap-2">
  <span className="text-muted-foreground text-sm">
    Your public link: iluase.com/@{user.slug}
  </span>
  <button
    onClick={() => {
      navigator.clipboard.writeText(`https://iluase.com/@${user.slug}`);
      toast.success('Link copied!');
    }}
    className="btn-ghost btn-sm"
  >
    <Copy size={14} /> Copy Link
  </button>
  <a
    href={`https://iluase.com/@${user.slug}`}
    target="_blank"
    rel="noopener noreferrer"
    className="btn-ghost btn-sm"
  >
    <ExternalLink size={14} /> Preview
  </a>
</div>
```

**If user has no slug yet:** Show "Set your username in Settings to get a shareable link"
**Route to settings:** `/settings#username`

**Acceptance Criteria:**
- [ ] Own profile shows shareable link
- [ ] Copy button copies `https://iluase.com/@{slug}` to clipboard
- [ ] Preview opens public profile in new tab
- [ ] If no slug: prompt to set username
- [ ] Other users' profiles do NOT show the share UI

---

### V5-304 — Profile: Role-Specific Sections (3 SP)

**Problem:** Profile view may not correctly differentiate between roles.

**Babalawo profile sections:**
1. Hero card (name, Yoruba name, rating, verified badge, years active)
2. About / Bio
3. Specializations (tags)
4. Services (list with pricing in ₦)
5. Availability
6. Recent reviews
7. [Book a Consultation] CTA button

**Vendor profile sections:**
1. Hero card (business name, rating, verified badge)
2. About
3. Products (grid, 6 max on profile, "View All" link)
4. [Visit Store] CTA button

**Client profile sections:**
1. Hero card (name, Yoruba name, cultural level)
2. About / Bio
3. Interests
4. Communities (temples, circles)
5. (No public CTA — client profiles may be private)

**Acceptance Criteria:**
- [ ] Babalawo profile shows all 7 sections
- [ ] Vendor profile shows all 4 sections
- [ ] Client profile shows sections appropriate for visibility
- [ ] Booking CTA on babalawo profile routes to `/booking/:babalawoId`
- [ ] Store CTA on vendor profile routes to `/marketplace?vendor=:vendorId`

---

### V5-305 — Profile Settings: Username/Slug Edit (3 SP)

**File:** `frontend/src/pages/SettingsPage.tsx`
**Backend:** `PATCH /users/:id/onboarding` (slug update) or `PATCH /users/:id`

**Add to settings page:**
```
Username (slug)
Current: @your-username
[Edit] → input field, validate: lowercase, alphanumeric + hyphens, 3-30 chars
        → check uniqueness (GET /public/resolve/:slug returns 404 if available)
        → PATCH /users/:id with { slug: newSlug }
```

**Validation:**
```typescript
const slugRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
// Must start and end with alphanumeric
// 3-30 characters total
// Only lowercase letters, numbers, hyphens
```

**Acceptance Criteria:**
- [ ] Username field in settings
- [ ] Validates format before submitting
- [ ] Shows if username is taken (check via resolve endpoint)
- [ ] Saves successfully
- [ ] Profile share link updates to show new slug

---

Sprint 3 Total: **20 SP**

---

## 8. SPRINT 4 — CLIENT EXPERIENCE (18 SP)

> **Goal:** The client's journey through the app is fully real — from dashboard to bookings to guidance plans to wallet.

---

### V5-401 — Client Dashboard: Real Summary Data (3 SP)

**File:** `frontend/src/features/client-hub/personal-dashboard-view.tsx`
**Backend:** `GET /dashboard/client/:userId/summary`

**Returns:**
```typescript
{
  upcomingAppointments: number;
  activeGuidancePlans: number;
  walletBalance: number;      // in kobo
  personalAwo: { id, name, avatar } | null;
  recentMessages: number;
}
```

**Remove demo data fallback. Add real data stat cards:**
```
Upcoming Sessions: [N]    → links to /client/consultations
Active Guidance Plans: [N] → links to /guidance-plans
Wallet Balance: ₦[X,XXX]  → links to /wallet
Personal Awo: [Name/photo] or "Find your Awo" CTA
```

**Acceptance Criteria:**
- [ ] Dashboard stats from real API
- [ ] Each stat card links to correct page
- [ ] "Find your Awo" shown if no personal babalawo assigned
- [ ] Balance in ₦ with correct kobo→naira conversion

---

### V5-402 — Client Consultations: Real Appointments (5 SP)

**File:** `frontend/src/features/client-hub/client-consultations-view.tsx`
**Backend:**
- `GET /appointments/client/:clientId` — all appointments
- `PATCH /appointments/:id/cancel` — cancel appointment

**Appointment card:**
```
Babalawo Name + Avatar | Date + Time | Type | Status Badge | Duration
[View Details] [Cancel] (if upcoming + > 24h away)
```

**Status badges:**
- `PENDING` → yellow "Awaiting Confirmation"
- `CONFIRMED` → green "Confirmed"
- `COMPLETED` → grey "Completed"
- `CANCELLED` → red "Cancelled"
- `DECLINED` → red "Declined"

**Tabs:** Upcoming | Past | All

**Cancel flow:**
```
[Cancel] → modal "Are you sure? Cancellations within 24h may incur a fee"
→ PATCH /appointments/:id/cancel
→ Toast "Appointment cancelled"
→ Optimistic update: move to Past tab with CANCELLED status
```

**Acceptance Criteria:**
- [ ] All appointments load from real API
- [ ] Tabs filter correctly (upcoming = future + PENDING/CONFIRMED, past = completed/cancelled/declined)
- [ ] Cancel works with confirmation
- [ ] Empty state per tab: "No upcoming appointments — [Book a Session] CTA"
- [ ] No demo appointments

---

### V5-403 — Client Wallet: Real Balance + Transactions (3 SP)

**File:** `frontend/src/features/wallet/wallet-dashboard-view.tsx` (or similar)
**Backend:**
- `GET /wallet/:userId/balance`
- `GET /wallet/:userId/transactions`

**Balance display:** Convert kobo → naira. `balance / 100` formatted as `₦X,XXX.XX`

**Transaction history:**
```
Date | Description | Type (CREDIT/DEBIT) | Amount | Balance After
Color: green for CREDIT, red for DEBIT
```

**Deposit flow:** (if client can top up)
```
[Add Funds] → amount input → payment modal (Paystack/Stripe) → POST /wallet/:userId/deposit
```

**Acceptance Criteria:**
- [ ] Real balance shown in ₦
- [ ] Transaction history from real API
- [ ] Correct CREDIT/DEBIT color coding
- [ ] Empty state for no transactions

---

### V5-404 — Client: Personal Awo Request Flow (3 SP)

**Backend:**
- `POST /babalawo-client/request-personal-awo/:clientId/:babalawoId`
- `GET /babalawo-client/personal-awo/:clientId`
- `GET /babalawo-client/can-switch/:clientId`

**Flow:**
```
Client views babalawo profile
→ [Request as Personal Awo] button (shown if client has no personal awo)
→ Confirmation: "Request [Babalawo Name] as your Personal Awo?"
→ POST /babalawo-client/request-personal-awo/:clientId/:babalawoId
→ Toast "Request sent to [Babalawo Name]"

Client dashboard → "Personal Awo: [Name]" (if assigned)
                 → "Find your Personal Awo" CTA (if not assigned)
                 → Can switch? Show "Change Awo" button
```

**Acceptance Criteria:**
- [ ] Personal awo displays on client dashboard if assigned
- [ ] Request button appears on babalawo profile for clients without a personal awo
- [ ] Switch flow works if `can-switch` returns true
- [ ] No demo data in any of these flows

---

### V5-405 — Client Guidance Plans: Remove Demo Fallback (2 SP)

**File:** Prescription/guidance plan views for client
**Backend:**
- `GET /guidance-plans/user/:userId`
- `POST /guidance-plans/:id/approve/:clientId`

**Remove demo fallbacks. Real states:**
- Loading → skeleton
- Empty → "No guidance plans yet. Your babalawo will create one after your consultation."
- Has plans → plan cards with status, progress, items

**Acceptance Criteria:**
- [ ] Plans load from real API
- [ ] Approve action works
- [ ] Empty state message appropriate
- [ ] No demo plan data

---

### V5-406 — Client Messaging: Remove Demo Fallback (2 SP)

**File:** Messages page / inbox
**Backend:** Messages API (check existing wiring)

**Focus:** Ensure demo inbox fallback is removed. If no real messages, show:
"No conversations yet. Book a consultation to start messaging your babalawo."

**Acceptance Criteria:**
- [ ] Inbox loads from real API
- [ ] Empty state with helpful message
- [ ] No demo inbox shown

---

Sprint 4 Total: **18 SP**

---

## 9. SPRINT 5 — BABALAWO REAL DATA (20 SP)

> **Goal:** Babalawo/Practitioner views fully connected. Revenue, clients, calendar, all real.

---

### V5-501 — Babalawo Dashboard Summary: Real Data (3 SP)

**File:** `frontend/src/features/babalawo/dashboard/practitioner-dashboard.tsx`
**Backend:** `GET /dashboard/babalawo/:userId/summary`

**Returns:**
```typescript
{
  upcomingAppointments: number;
  totalClients: number;
  totalEarnings: number;     // kobo
  pendingWithdrawals: number;
  completionRate: number;    // 0-1
  recentReviews: Review[];
}
```

**Calculated:**
- Completion rate: `(completionRate * 100).toFixed(1)%` → "87.5%"
- Earnings: `totalEarnings / 100` → "₦450,000"

**Acceptance Criteria:**
- [ ] Dashboard summary from real API
- [ ] All stats display correctly with real math
- [ ] No demo fallback

---

### V5-502 — Earnings Report: Empty + Error States (2 SP)

**File:** `frontend/src/features/babalawo/earnings-report-view.tsx`

Already uses real API. Needs better empty/error states:

**Empty state (no transactions in range):**
```
"No earnings in this period"
[time range selector still visible to change period]
```

**Error state:**
```
"Could not load earnings data"
[Try Again] button → refetch()
```

**Zero summaries:** Show ₦0 totals rather than blank cards when API returns empty array.

**Acceptance Criteria:**
- [ ] Empty period shows ₦0 totals + "No earnings" message
- [ ] Error shows retry button
- [ ] Switching time range always shows appropriate state

---

### V5-503 — My Seekers: Real API Connected (Already) + Enhancements (3 SP)

Already uses real API (`GET /babalawo-client/:babalawoId/clients`). Enhancements:

1. **Message button** — navigate to `/messages/:clientId` (not just display)
2. **Schedule button** — copy booking link (already done) + also navigate to calendar
3. **Cultural level display** — map numeric level to label: `1="Beginner"`, `2="Intermediate"`, `3="Practitioner"`, `4="Elder"`, `5="Master"`

**Invite seeker flow:**
```
[Invite Seeker] button → /practitioner/clients/invite
→ Enter client email
→ System sends invitation (POST /babalawo-client/:babalawoId/clients or email invite)
→ Toast "Invitation sent"
```

**Acceptance Criteria:**
- [ ] Message button navigates to direct message with that client
- [ ] Cultural level displays as label, not number
- [ ] Invite flow works end-to-end
- [ ] Booking link copy works in all browsers

---

### V5-504 — Practitioner Calendar: Real Appointments (5 SP)

**File:** `frontend/src/features/babalawo/practitioner-calendar-view.tsx`
**Backend:**
- `GET /appointments/babalawo/:babalawoId`
- `PATCH /appointments/:id/confirm`
- `PATCH /appointments/:id/decline` (body: `{ reason: string }`)
- `PATCH /appointments/:id/complete` (body: `{ notes?: string }`)

**Calendar view:**
- Monthly/weekly toggle
- Appointments shown as events on calendar
- Click appointment → side panel with details

**Appointment side panel:**
```
Client: [Name + Avatar]
Service: [Type]
Date/Time: [Date]
Duration: [N] minutes
Notes: [...]
Status: [badge]

Actions based on status:
PENDING   → [Confirm] [Decline with reason]
CONFIRMED → [Mark Complete] [Cancel]
COMPLETED → [View Notes]
```

**Confirm flow:** `PATCH /appointments/:id/confirm` → toast "Appointment confirmed"
**Decline flow:** prompt for reason → `PATCH /appointments/:id/decline` → toast
**Complete flow:** optional notes input → `PATCH /appointments/:id/complete`

**Acceptance Criteria:**
- [ ] Calendar shows real appointments
- [ ] Confirm/decline/complete actions all work
- [ ] Calendar highlights days with appointments
- [ ] Empty weeks show "No appointments scheduled"

---

### V5-505 — Set Availability: Persist to Backend (5 SP)

**File:** `frontend/src/features/babalawo/set-availability-view.tsx`
**Backend:** Check if availability CRUD endpoints exist

```bash
grep -r "availability" backend/src/ --include="*.controller.ts"
```

**Availability structure:**
```typescript
interface Availability {
  dayOfWeek: 0|1|2|3|4|5|6;   // 0 = Sunday
  startTime: string;            // "09:00"
  endTime: string;              // "17:00"
  isAvailable: boolean;
}
```

**UI:** Weekly schedule grid
- Each day: toggle ON/OFF + time range picker
- [Save Availability] → POST/PATCH to availability endpoint

**If no availability endpoint exists:** Document as V5-505-BLOCKED, add to risk registry.

**Acceptance Criteria:**
- [ ] Availability loads from API if endpoint exists
- [ ] Changes save to backend
- [ ] Client-facing booking page respects saved availability
- [ ] If endpoint missing: UI disabled with "Coming soon" + ticket created

---

### V5-506 — Babalawo Withdrawals: Request Payout (2 SP)

**File:** Earnings report view or wallet view
**Backend:**
- `GET /wallet/:userId/balance`
- `POST /wallet/:userId/withdraw` — create withdrawal request
- `GET /wallet/:userId/withdrawals` — see past requests

**Withdraw flow:**
```
Earnings summary shows: Available Balance ₦X,XXX
[Request Withdrawal] button
→ Modal: Amount input + Bank details (name, account number, bank name)
→ POST /wallet/:userId/withdraw
→ Toast "Withdrawal request submitted — admin will process within 2-3 business days"
→ Pending withdrawals list updates
```

**Acceptance Criteria:**
- [ ] Available balance shown
- [ ] Withdrawal request form works
- [ ] Pending withdrawals visible
- [ ] Clear messaging about processing time

---

Sprint 5 Total: **20 SP**

---

## 10. SPRINT 6 — VENDOR REAL DATA (18 SP)

> **Goal:** Vendors can manage products, view orders, and request payouts — all with real data.

---

### V5-601 — Vendor Dashboard: Real Summary (3 SP)

**File:** `frontend/src/features/marketplace/vendor-dashboard-view.tsx`
**Backend:** `GET /dashboard/vendor/:userId/summary`

**Returns:**
```typescript
{
  totalProducts: number;
  activeListings: number;
  pendingOrders: number;
  totalSales: number;        // kobo
  thisMonthRevenue: number;  // kobo
  rating: number;
  reviewCount: number;
}
```

**Remove demo fallback. Display real stats.**

---

### V5-602 — Product Management: Real CRUD (5 SP)

**File:** `frontend/src/features/marketplace/vendor-product-list-view.tsx`
**Backend:** Check product endpoints

```bash
grep -r "products" backend/src/ --include="*.controller.ts"
```

**Expected endpoints:**
- `GET /products?vendorId=:id` — vendor's products
- `POST /products` — create product
- `PATCH /products/:id` — update product
- `DELETE /products/:id` — delete product
- `POST /products/:id/images` — upload product images

**Product create/edit form fields:**
```
Name (required)
Description
Category (dropdown: Sacred Items / Herbs / Books / Jewelry / Art / Other)
Price (₦, stored as kobo: price × 100)
Stock quantity
Images (up to 5, file upload)
Cultural authenticity note
```

**Acceptance Criteria:**
- [ ] Product list shows vendor's real products
- [ ] Create product form works
- [ ] Edit product works
- [ ] Delete with confirmation works
- [ ] Image upload works (or gracefully disabled)

---

### V5-603 — Order Management: Real Orders (5 SP)

**File:** `frontend/src/features/marketplace/vendor-order-list-view.tsx`
**Backend:** Check order endpoints

```bash
grep -r "orders" backend/src/ --include="*.controller.ts"
```

**Order card:**
```
Order ID | Buyer name | Items | Total ₦ | Status | Date
[View Details] [Mark as Shipped] [Mark as Delivered]
```

**Order statuses:**
- `PENDING` → yellow
- `PROCESSING` → blue
- `SHIPPED` → purple
- `DELIVERED` → green
- `CANCELLED` → red
- `REFUNDED` → grey

**Mark as shipped flow:**
- Tracking number input (optional)
- Status update → buyer notified (email, if email service active)

**Acceptance Criteria:**
- [ ] All vendor orders load
- [ ] Status filters work
- [ ] Ship/deliver actions work
- [ ] Empty state: "No orders yet — your products are listed in the marketplace"

---

### V5-604 — Vendor Payout: Request Withdrawal (3 SP)

Same pattern as V5-506 (babalawo withdrawal). Vendors need to request payout from sales revenue.

**Backend:** `POST /wallet/:userId/withdraw`, `GET /wallet/:userId/balance`

**Acceptance Criteria:**
- [ ] Vendor can see available balance (sales minus platform fee)
- [ ] Withdrawal request works
- [ ] Withdrawal history visible

---

### V5-605 — Marketplace: Remove Demo Product Fallbacks (2 SP)

**File:** `frontend/src/pages/MarketplacePage.tsx` and related
**Backend:** `GET /products?status=ACTIVE&page=1&limit=20`

Remove static/demo product fallbacks. Show real products or empty state.

**Acceptance Criteria:**
- [ ] Marketplace shows real products
- [ ] Empty state: "No products listed yet"
- [ ] Filtering by category works with real data

---

Sprint 6 Total: **18 SP**

---

## 11. SPRINT 7 — ADVANCED PLATFORM FEATURES (30 SP)

> **Goal:** Surface the powerful features already built in the backend but not yet exposed in the UI.

---

### V5-701 — Admin Impersonation: Full UI (3 SP)

**Backend:** `POST /admin/impersonate/:targetUserId` (SUPER admin only)
**Already partially implemented** in `admin-dashboard-view.tsx` (lines 70–86)

**Gaps:**
1. Impersonation only accessible from user management table — add to user profile view too
2. "Stop Impersonating" banner styling is correct but should also show WHO you're impersonating in the header
3. Session timer: impersonation sessions should show how long active

**Add to user row in admin:**
```
[Impersonate] → reason prompt → start session → banner appears → all actions audited
```

**Acceptance Criteria:**
- [ ] Impersonate button in user management table AND user profile (admin view)
- [ ] Impersonation banner shows name + elapsed time
- [ ] All actions during impersonation logged to audit trail
- [ ] Stop impersonation returns to admin account

---

### V5-702 — Advisory Board Voting: Real Votes (5 SP)

**File:** `frontend/src/features/admin/advisory-board-voting-view.tsx`
**Backend:**
- `GET /admin/advisory-board/votes` — get active votes
- `POST /admin/advisory-board/votes/:voteId/cast` — cast vote

**Vote display:**
```
Resolution: "Should the platform allow group consultations?"
Proposed by: [Admin Name]
Deadline: March 30, 2026
Votes: 7 YES / 3 NO / 2 ABSTAIN   (progress bar)
Your vote: [YES] [NO] [ABSTAIN]
```

**Cast vote → optimistic update → invalidate query**

**Acceptance Criteria:**
- [ ] Active votes load from real API
- [ ] Vote casting works
- [ ] Results display in real time (or on refetch)
- [ ] Already-voted items show "Vote recorded: YES/NO/ABSTAIN"

---

### V5-703 — Admin: Manage Admin Sub-Roles (5 SP)

**Backend:**
- `GET /admin/admins` — list all admins
- `POST /admin/manage-admins` — create/update admin (email, name, adminSubRole, sendInvite)
- `DELETE /admin/admins/:userId` — remove admin privileges

**Sub-roles and their access:**
```
SUPER      → Full access (all tabs)
FINANCE    → Payout approvals, analytics, fraud
COMPLIANCE → Verification queue, quality assurance
SUPPORT    → User management, disputes
MODERATOR  → Content moderation, circle management
```

**Admin management UI:**
```
Current Admins table:
Name | Email | Sub-Role | Last Active | [Edit Role] [Remove]

[+ Add Admin] button:
→ Email input
→ Name input
→ Sub-role selector
→ [Send Invite] checkbox (sends email invite)
→ [Create Admin]
```

**Acceptance Criteria:**
- [ ] Admin list loads
- [ ] Add admin works with invite option
- [ ] Change sub-role works
- [ ] Remove admin privileges works with confirmation
- [ ] SUPER admin only sees this tab

---

### V5-704 — Circle Management: Admin Approvals (3 SP)

**File:** `frontend/src/features/admin/circle-management-view.tsx`
**Backend:**
- `GET /admin/circle-suggestions` — pending circle creation requests
- `POST /admin/circle-suggestions/:id/approve`
- `POST /admin/circle-suggestions/:id/reject`
- `GET /admin/circles/pending`
- `PATCH /admin/circles/:id/moderate` (action: ARCHIVE | DELETE | ACTIVATE)

**Two workflows:**
1. New circle REQUESTS (user wants to create a circle) → approve/reject
2. Existing circles moderation (activate/archive/delete)

**Acceptance Criteria:**
- [ ] Circle creation requests load and can be approved/rejected
- [ ] Existing circles can be moderated
- [ ] Circle event approvals accessible
- [ ] Empty states for each section

---

### V5-705 — Babalawo Course Creation: Academy (8 SP)

**Backend:**
- `POST /academy/courses`
- `POST /academy/courses/:courseId/lessons`
- `PATCH /academy/courses/:id`
- `PATCH /academy/lessons/:id`
- `DELETE /academy/lessons/:id`

**New route:** `/practitioner/courses` — babalawo's courses
**New component:** `CreateCourseView` — course creation form

**Course creation form:**
```
Title (required)
Slug (auto-generated from title, editable)
Description (rich text or textarea)
Category: Ifá Divination | Yoruba Culture | Sacred Arts | Spirituality | Herbalism
Level: BEGINNER | INTERMEDIATE | ADVANCED
Price (₦, 0 = free)
Thumbnail image (upload)
Status: DRAFT | PUBLISHED

Lessons section (ordered list):
+ Add Lesson
  → Title
  → Duration (minutes)
  → Video URL or file upload
  → Text content
  → Order (drag to reorder)
```

**Acceptance Criteria:**
- [ ] Babalawo can create a course with all fields
- [ ] Add/edit/delete lessons
- [ ] Drag-to-reorder lessons
- [ ] Publish/unpublish toggle
- [ ] Course appears in academy catalog when published
- [ ] Course edit page at `/practitioner/courses/:courseId`

---

### V5-706 — Payment Integration: Verify Payments Flow (3 SP)

**Backend:**
- `GET /admin/payments/unverified` — payments that need manual verification
- `POST /admin/payments/verify/:transactionId` — manually verify

**Context:** Paystack/payment webhooks may miss some payments. Admin can manually verify.

**Admin sub-tab under Platform Health OR Payout Approvals:**
```
Unverified Payments:
Amount | User | Date | Reference | [Verify] [Mark as Failed]
```

**Acceptance Criteria:**
- [ ] Unverified payments shown in admin
- [ ] Manual verify works
- [ ] Count shown in platform health

---

### V5-707 — PII Logging: Reveal Sensitive Data (3 SP)

**Backend:** `POST /admin/log-pii-reveal` (entityType, entityId, fieldLabel, reason)

**Context:** When admin views sensitive data (bank account numbers, personal IDs), this should be logged.

**Implementation:**
- When admin payout approvals tab shows account numbers → auto-log the reveal
- When admin user management shows emails → log on explicit "View Details" click
- Show audit note: "⚠ Viewing sensitive data — this access is logged"

**Acceptance Criteria:**
- [ ] Sensitive fields auto-log reveal when displayed
- [ ] User sees disclosure notice
- [ ] Log entries appear in quality assurance audit log

---

Sprint 7 Total: **30 SP**

---

## 12. SPRINT 8 — POLISH, PERFORMANCE & UX (15 SP)

---

### V5-801 — Loading Skeletons: Consistent Pattern (3 SP)

**Problem:** Some pages show blank while loading, others show spinners, others show "Loading..." text. Inconsistent.

**Standard pattern:**
```tsx
// Create: frontend/src/shared/components/skeleton.tsx
export const SkeletonCard = () => (
  <div className="animate-pulse bg-muted rounded-xl p-4 space-y-3">
    <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
    <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
    <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
  </div>
);

export const SkeletonStat = () => (
  <div className="animate-pulse bg-muted rounded-xl p-4">
    <div className="h-8 bg-muted-foreground/20 rounded w-20 mb-2" />
    <div className="h-3 bg-muted-foreground/20 rounded w-16" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="animate-pulse h-12 bg-muted rounded-lg" />
    ))}
  </div>
);
```

**Apply to:** Admin stats, user table, verification queue, all dashboard pages.

**Acceptance Criteria:**
- [ ] Skeleton components created and exported
- [ ] All major list/table/stats views use skeletons
- [ ] Consistent animation across app

---

### V5-802 — Toast Notifications: Consistent (2 SP)

**Audit current toast usage.** Ensure every mutation (create/update/delete) has:
- ✅ Success toast: "Saved" / "Updated" / "Deleted" (specific action name)
- ❌ Error toast: "Failed to save — please try again" (with error detail if available)

**No silent failures.**

**Acceptance Criteria:**
- [ ] Every mutation has success + error toasts
- [ ] Toast messages are specific (not generic "Error")
- [ ] No silent state changes

---

### V5-803 — Navigation: Active States & Breadcrumbs (3 SP)

**Problem:** Sidebar active states may not highlight correctly on all admin sub-routes.

**Fix sidebar active detection:**
```typescript
const isActive = (path: string) => {
  if (path === '/admin') return location.pathname.startsWith('/admin');
  if (path === '/practitioner/dashboard') return location.pathname.startsWith('/practitioner');
  return location.pathname === path;
};
```

**Add breadcrumbs to admin tab pages:**
```
Admin > Payout Approvals
Admin > User Management > User Detail
```

**Acceptance Criteria:**
- [ ] Sidebar highlights correct item on all routes
- [ ] Admin sub-pages show breadcrumb trail
- [ ] No double-active states

---

### V5-804 — Mobile Responsiveness Audit (3 SP)

**Check all V5 new components for mobile breakpoints:**
- Admin tables → horizontal scroll on mobile
- Profile edit form → single column on mobile
- Temple browse grid → 1-column on mobile
- Vendor product grid → 2-column on mobile

**Target:** Usable on 375px viewport (iPhone SE).

**Acceptance Criteria:**
- [ ] Admin dashboard scrolls horizontally on mobile without overflow
- [ ] Profile edit form usable on mobile
- [ ] No horizontal overflow/layout breaks on 375px

---

### V5-805 — Performance: Stale Time & Cache Strategy (2 SP)

**Optimize React Query cache settings:**

```typescript
// Admin stats: refresh every 5 minutes
staleTime: 5 * 60 * 1000

// User-specific data (appointments, wallet): refresh every 2 minutes
staleTime: 2 * 60 * 1000

// Static-ish data (temples, courses): refresh every 10 minutes
staleTime: 10 * 60 * 1000

// Fraud alerts, platform health: refresh every 60 seconds (already implemented)
refetchInterval: 60_000
```

**Also:** Add `refetchOnWindowFocus: false` to admin queries to prevent aggressive refetching.

**Acceptance Criteria:**
- [ ] Admin stats don't refetch on every tab focus
- [ ] Stale times set appropriately per data type
- [ ] No unnecessary API calls on navigation

---

### V5-806 — Error Boundary: App-Level Hardening (2 SP)

**Current:** `ErrorBoundary` exists in `App.tsx` wrapping the router.

**Add:** Per-route error boundaries so one page crash doesn't kill the whole app.

```tsx
// In App.tsx route wrapping:
<Route path="/admin" element={
  <ErrorBoundary fallback={<AdminErrorPage />}>
    <React.Suspense fallback={<FullPageSpinner />}>
      <AdminDashboardView />
    </React.Suspense>
  </ErrorBoundary>
} />
```

**Acceptance Criteria:**
- [ ] Admin crash shows admin error page (not white screen)
- [ ] Practitioner crash shows practitioner error page
- [ ] Error pages have "Return to Dashboard" button

---

Sprint 8 Total: **15 SP**

---

## 13. IDEAS & RECOMMENDATIONS

### Immediate (Do Now)
These are not in any sprint yet but are fast wins with high value:

**A. Real-time notification badges**
- Backend likely has a notifications table (check `/notifications` endpoint)
- Admin unread badge: pending verifications + pending payouts count in tab badge
- Client badge: new messages count in sidebar
- Implementation: `GET /notifications/unread/count` → sidebar badge

**B. Global search**
- Admin needs to search users/babalawos/orders across the whole platform
- Implement `GET /admin/search?q=&types=users,temples,vendors`
- Keyboard shortcut: Cmd+K opens search modal

**C. Bulk admin actions**
- Select multiple users → bulk suspend / bulk verify
- Select multiple disputes → bulk dismiss
- Saves huge time as platform scales

**D. Admin activity log**
- Show last 5 admin actions in overview sidebar
- "2 min ago: You approved Babalawo verification for Adekunle T."
- Builds admin confidence and accountability

### Near-Term (Sprint 9 if needed)
**E. Email notification templates**
- Backend has AWS SES configured (from CLAUDE.md)
- When admin approves verification → email babalawo "Congratulations, you are verified"
- When appointment confirmed → email client with details
- When payout processed → email vendor/babalawo with confirmation

**F. Babalawo availability calendar integration**
- Real-time slot availability on booking page
- Currently slots may be hardcoded or demo

**G. Platform announcements**
- Admin can broadcast a message to all users
- Shown as banner or notification on next login

**H. Subscription/recurring bookings**
- Client subscribes to monthly consultations with specific babalawo
- Auto-creates recurring appointments

### Architecture Recommendations
**I. API response envelope standardization**
Currently, some endpoints return `response.data` directly, others return `{ data: [...], total: N, page: N }`.
Standardize to: `{ data: T, meta: { total, page, limit, totalPages } }` for all list endpoints.
This enables consistent pagination across all views.

**J. Optimistic updates everywhere**
All mutations should use React Query's `onMutate` for instant UI feedback.
Pattern already established in V5-203 (verification queue) — apply to all mutations.

**K. WebSocket / real-time for admin**
Admin fraud alerts and platform health should update in real time without polling.
Consider Socket.io (already in backend) for:
- New fraud alert → notification
- New verification request → badge updates
- New withdrawal request → notification

**L. Offline detection**
Add a "You are offline" banner when `navigator.onLine` is false.
Prevents confusing errors when users lose connectivity mid-session.

---

## 14. RISK REGISTRY

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| Admin endpoints require SUPER role — test account may not have it | HIGH | MEDIUM | Verify admin role + sub-role in JWT before Sprint 2 |
| File upload endpoint may not exist (avatar, course thumbnails) | MEDIUM | MEDIUM | Check backend for S3 presigned URL endpoints before V5-301, V5-705 |
| Availability endpoint may not exist (babalawo schedule) | MEDIUM | HIGH | Grep backend before V5-505; document as blocked if missing |
| `PATCH /users/:id` may reject partial updates (strict DTO validation) | MEDIUM | LOW | Test with minimal payload first; check `UpdateUserDto` |
| WebSocket not connected on staging/prod (CORS config) | HIGH | LOW | Test real-time features on staging before enabling in production |
| Kobo/naira conversion errors (integer vs float) | HIGH | LOW | Always store as integers (kobo), only convert at display layer |
| Demo data still seeded in production database | HIGH | MEDIUM | Run `prisma db seed --env production` audit before launch |

---

## 15. DEFINITION OF DONE

A story is **DONE** when ALL of the following are true:

- [ ] **Code merged** to feature branch, no merge conflicts
- [ ] **No demo data imports** in the changed components (run `grep -r "getDemoAdminStats\|getAllDemoUsers\|getDemoVerifications\|DEMO_USERS" src/features/`)
- [ ] **Real API connected** — the component fetches from a real endpoint
- [ ] **Loading state** — skeleton or spinner shown while fetching
- [ ] **Empty state** — specific message when API returns empty array (NOT an error)
- [ ] **Error state** — specific message + retry button when API fails
- [ ] **Mutations have toasts** — success + error feedback
- [ ] **Mobile check** — usable at 375px viewport
- [ ] **Console clean** — no new `console.warn("Using demo...")` messages
- [ ] **Smoke tested** — tested manually in local dev against running backend
- [ ] **CLAUDE.md updated** — status section reflects new story completed

---

## QUICK REFERENCE: FILE → STORY MAP

| File | Stories |
|------|---------|
| `App.tsx` | V5-101, V5-102, V5-106, V5-109 |
| `admin-dashboard-view.tsx` | V5-108, V5-201, V5-202, V5-203 |
| `admin-overview-tab.tsx` | V5-201 |
| `admin-user-management-tab.tsx` | V5-202 |
| `verification-queue-view.tsx` | V5-203 |
| `payout-approvals-view.tsx` | V5-204 |
| `dispute-center-view.tsx` | V5-205 |
| `reported-content-view.tsx` | V5-206 |
| `fraud-alerts-view.tsx` | V5-207 |
| `analytics-dashboard-view.tsx` | V5-208 |
| `temple-management-view.tsx` | V5-209 |
| `vendor-review-view.tsx` | V5-210 |
| `quality-assurance-view.tsx` | V5-211 |
| `platform-health-view.tsx` | V5-212 |
| `my-seekers-view.tsx` | V5-104, V5-503 |
| `temple-connection-view.tsx` | V5-105 |
| `earnings-report-view.tsx` | V5-502 |
| `practitioner-calendar-view.tsx` | V5-504 |
| `set-availability-view.tsx` | V5-505 |
| `academy-view.tsx` | V5-103, V5-110 |
| `course-data.ts` | V5-110 |
| `public-profile-view.tsx` | V5-301, V5-303, V5-304 |
| `use-profile-query.ts` | V5-302 |
| `SettingsPage.tsx` | V5-305 |
| `personal-dashboard-view.tsx` | V5-401 |
| `client-consultations-view.tsx` | V5-402 |
| `wallet-dashboard-view.tsx` | V5-403 |
| `vendor-dashboard-view.tsx` | V5-601 |
| `vendor-product-list-view.tsx` | V5-602 |
| `vendor-order-list-view.tsx` | V5-603 |
| `advisory-board-voting-view.tsx` | V5-702 |
| `circle-management-view.tsx` | V5-704 |
| `sidebar-layout.tsx` | V5-103, V5-106, V5-109 |

---

*Last updated: 2026-03-20*
*Status: ✅ ALL 8 SPRINTS COMPLETE — 187/187 SP. Audited March 20, 2026.*
*Audit result: 95% real-data wired. One fix applied: circle feed demo fallback removed (circle-detail-view.tsx). All other views confirmed on real API endpoints. isDemoMode-guarded fallbacks in forum/temple are production-safe.*
