# ILE ASE: COMPREHENSIVE PRODUCT BACKLOG
**Generated: January 29, 2026**
**Demo Deadline: February 12, 2026**
**Assessment Type: Critical App Review + Prioritized Backlog**

---

## PART 1: HARSH CRITICAL ASSESSMENT (Independent Review)

### Executive Summary: C+ (60/100)

**The Good**: Impressive technical architecture, thoughtful cultural consideration, comprehensive feature breadth.

**The Bad**: Demo-critical flows are broken, role permissions are inconsistent, duplicate data sources create confusion, and the "temple-first" narrative exists in docs but not in the actual user experience.

**The Ugly**: Clicking a Babalawo does nothing. Circles don't load. Forum threads show "not found". Profile routes fail. For a stakeholder demo, this is unacceptable.

---

### CRITICAL FAILURE #1: BABALAWO CLICK DOES NOTHING

**Location**: [babalawo-directory.tsx:234](frontend/src/features/babalawo/directory/babalawo-directory.tsx#L234)

**The Code**:
```tsx
<BabalawoProfileCard
  key={babalawo.id}
  babalawo={babalawo}
  onClick={() => onSelectBabalawo?.(babalawo.id)}  // Fires but goes nowhere useful
  onBookSession={(id) => onBookSession?.(id)}
/>
```

**The Problem**:
- `onSelectBabalawo` is called but in [App.tsx:364](frontend/src/App.tsx#L364):
  ```tsx
  <BabalawoDirectory onSelectBabalawo={(id) => nav(`view-babalawo`, id)} .../>
  ```
- The navigation adapter tries `nav('view-babalawo', id)` which falls through to `navigate('/view-babalawo')` - **A ROUTE THAT DOESN'T EXIST**
- User clicks Babalawo -> Nothing happens -> User confused -> Demo fails

**Expected Flow**:
1. Click Babalawo card -> Full profile modal/page
2. View lineage, temple affiliation, services
3. "Request Consultation" button -> Booking flow
4. Booking confirmation -> Contact options (call/video)

**Current Reality**: Dead click.

**Fix Required**: Either:
- A) Create modal profile overlay from directory
- B) Navigate to `/users/{babalawoId}` for full profile
- C) Create dedicated `/babalawo/{id}` detail route

---

### CRITICAL FAILURE #2: CIRCLES DON'T WORK

**Location**: [circle-directory.tsx](frontend/src/features/circles/circle-directory.tsx)

**The Problems**:

1. **Slug vs ID Mismatch** (Line 166-171):
   ```tsx
   onClick={() => onSelectCircle?.(circle.id)}  // Uses ID
   ```
   But demo data uses slugs:
   ```tsx
   { id: 'c1', slug: 'london-ifa', name: 'London Ifa Study Group', ... }
   ```
   And routes expect slugs:
   ```tsx
   <Route path="/circles/:slug" element={<CircleDetailRoute />} />
   ```

2. **Demo Data Has No Slugs**: `DEMO_CIRCLES` in [demo-data.ts:177](frontend/src/data/demo-data.ts#L177) doesn't include `slug` field - only `id`.

3. **API Endpoint Expects Slug**: `CircleDetailView` fetches via:
   ```tsx
   api.get(`/circles/${circleSlug}`)  // Uses slug, not ID
   ```

**Result**: Click "London Ifa Study Group" -> "Circle not found" -> Demo fails

**Missing Demo Content**:
- No pre-populated threads in circles
- No member discussions visible
- No event list within circle view
- No demonstration of the Egbe (community) experience

---

### CRITICAL FAILURE #3: FORUM THREAD "NOT FOUND"

**Location**: [thread-view.tsx:157-173](frontend/src/features/forum/thread-view.tsx#L157)

**The Problem**:
- Threads only load from API: `api.get('/forum/threads/${threadId}')`
- No demo data fallback for thread detail view
- Unlike other views, there's NO demo thread content preloaded

**Contrast With Directory**:
- `ForumHomeView` has demo threads via `DEMO_THREADS`
- But `ThreadView` has NO fallback - pure API dependency

**Result**: Click any thread -> "Thread not found" -> Brown/default error page -> Demo fails

**The "Brown Page" Issue**: Error states use default styling (`bg-ase-stone text-ase-stone-muted`) which doesn't match the cultural aesthetic of the rest of the app.

---

### CRITICAL FAILURE #4: CLIENT CAN CREATE CIRCLES/EVENTS

**Location**:
- [circle-directory.tsx:112-119](frontend/src/features/circles/circle-directory.tsx#L112)
- [events-directory.tsx:168-176](frontend/src/features/events/events-directory.tsx#L168)

**The Code** (Circles):
```tsx
{onCreateCircle && (
  <button onClick={onCreateCircle} className="...">
    <UserPlus size={20} />
    Create Circle
  </button>
)}
```

**The Code** (Events):
```tsx
{onCreateEvent && user && (
  <button onClick={onCreateEvent} className="...">
    <Plus size={20} />
    Host an Event
  </button>
)}
```

**The Problem**: No role check. ANY logged-in user sees these buttons.

**Cultural Violation**: Per your own docs:
> "Clients shouldn't have access to host an event or edit. Just view."
> "Client shouldn't be able to create circles! It would be over populated."

**Expected Behavior**:
- **Client**: View only. "Suggest Circle" button -> Admin queue
- **Babalawo**: Can host temple-affiliated events only
- **Admin**: Full create/edit access

---

### CRITICAL FAILURE #5: TEMPLE -> BABALAWO REDIRECTS AWAY

**Location**: [App.tsx:85](frontend/src/App.tsx#L85)

```tsx
<TempleDetailView
  ...
  onSelectBabalawo={(id) => navigate(`/users/${id}`)}  // FULL PAGE NAVIGATION
  ...
/>
```

**The Problem**: When viewing a temple and clicking an affiliated Babalawo, user is YANKED out of temple context to a completely different page.

**Expected Behavior** (per your docs):
> "in temple when the Babalawo is clicked it goes to Babalawo directory, it shouldn't... instead it should just be able to view the profile or then book the Babalawo straight from the temple view."

**Solution**: Babalawo click within temple should:
1. Open modal/panel overlay (temple still visible behind)
2. Show Babalawo profile IN CONTEXT
3. "Request Consultation" available without leaving temple

---

### CRITICAL FAILURE #6: USER PROFILE NOT FOUND

**Location**: [public-profile-view.tsx:378-388](frontend/src/features/profile/public-profile-view.tsx#L378)

```tsx
const { data: user, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: async () => {
    // Check for demo user first
    const demo = MOCK_USERS.find(u => u.id === userId) || MOCK_PRACTITIONERS.find(p => p.id === userId);
    if (demo) return demo;

    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
});
```

**The Problem**: Uses `MOCK_USERS` from `lib/demo-data.ts` which has DIFFERENT IDs than `DEMO_USERS` in `data/demo-data.ts`.

**Two Demo Data Files**:
| File | User IDs |
|------|----------|
| `frontend/src/lib/demo-data.ts` | `u1`, `admin_1`, `p1`, `friend-2`, `friend-3` |
| `frontend/src/data/demo-data.ts` | `demo-client-1`, `demo-baba-1`, `demo-vendor-1`, `demo-admin-1` |

**Result**: Profile lookup fails for half the demo users depending on which data source the calling component used.

---

### CRITICAL FAILURE #7: VENDOR DASHBOARD HAS NO DEMO DATA

**Location**: [vendor-dashboard-view.tsx](frontend/src/features/marketplace/vendor-dashboard-view.tsx)

**The Problem**:
```tsx
const { data: vendor } = useQuery<Vendor>({
  queryKey: ['vendor-profile', user?.id],
  queryFn: async () => {
    const response = await api.get('/marketplace/vendors', { params: { userId: user?.id } });
    return response.data[0] || null;  // Returns null if API fails
  },
});

if (!vendor) {
  return <div>No Store Found</div>;  // Demo shows empty state
}
```

**No Demo Fallback**: Unlike other views, vendor dashboard has NO demo vendor profile preloaded.

**Result**: Switch to Vendor role -> "No Store Found" -> Demo fails

**Missing Demo Content**:
- Pre-loaded vendor profile (Iya Omitonade)
- Demo products with images
- Mock order history
- Mock sales analytics

---

### CRITICAL FAILURE #8: ROLE-BASED VIEWS NOT DIFFERENTIATED

**The Question** (from user):
> "Should/IS Babalawo login view the same app as the client?"

**Current Reality**: Mostly YES. Same sidebar, same routes, minimal differentiation.

**Home Route Does Differentiate** ([App.tsx:246-296](frontend/src/App.tsx#L246)):
```tsx
if (user?.role === UserRole.CLIENT) {
  return <PersonalAwoDashboard /> + <FeaturedTemplesSection />
} else if (user?.role === UserRole.BABALAWO) {
  return <ClientList />
} else if (user?.role === UserRole.VENDOR) {
  return <VendorDashboardView />
} else {
  return <AdminDashboardView />
}
```

**But Other Routes Don't**:
- `/temples` shows same view for all roles
- No "Manage Temple" for Babalawo
- No "Verify Temple" for Admin
- No "Request Consultation" vs "Manage Clients" contextual actions

**Expected**:
| Route | Client | Babalawo | Admin |
|-------|--------|----------|-------|
| `/temples/:id` | "Find Babalawo" | "Manage My Affiliation" | "Verify/Edit Temple" |
| `/circles` | View only, "Suggest" | View only | Create/Edit |
| `/events` | View, Register | Host (temple events) | Full CRUD |

---

### CRITICAL FAILURE #9: TERMINOLOGY INCONSISTENCY

**Backend**: `prescriptions` module (`backend/src/prescriptions/`)
**Frontend**: `prescriptions` folder (`frontend/src/features/prescriptions/`)
**Database**: Likely `Prescription` model
**Docs**: "Guidance Plan (formerly Prescription)"
**Cultural Impact**: "Prescription" has medical/colonial connotations

**Components Still Use "Prescription"**:
- `prescription-creation-form.tsx`
- `prescription-approval-view.tsx`
- `prescription-history-view.tsx`

**Import Aliases Are Misleading**:
```tsx
import GuidancePlanCreationForm from './features/prescriptions/prescription-creation-form';
```
- Variable named "GuidancePlan" but file says "prescription"
- Confusing for developers, misleading in stack traces

---

### CRITICAL FAILURE #10: TWO DEMO DATA FILES (CHAOS)

**File 1**: [frontend/src/lib/demo-data.ts](frontend/src/lib/demo-data.ts)
- `MOCK_USERS`, `MOCK_PRACTITIONERS`, `MOCK_CIRCLES`, `MOCK_PRODUCTS`, `MOCK_EVENTS`, `MOCK_FORUM`
- Used by: `public-profile-view.tsx`, `forum-home-view.tsx`

**File 2**: [frontend/src/data/demo-data.ts](frontend/src/data/demo-data.ts)
- `DEMO_USERS`, `DEMO_TEMPLES`, `DEMO_CIRCLES`, `DEMO_EVENTS`, `DEMO_THREADS`, `DEMO_MESSAGES`
- Used by: `babalawo-directory.tsx`, `circle-directory.tsx`, `events-directory.tsx`

**Conflicts**:
| Entity | lib/demo-data | data/demo-data | Compatible? |
|--------|---------------|----------------|-------------|
| Users | `u1`, `admin_1` | `demo-client-1`, `demo-admin-1` | NO |
| Circles | `cir_1`, `cir_2` | `c1`, `c2` | NO |
| Events | `e1`, `e2` | `e1`, `e2`, `e3` | PARTIAL |

**Result**: Profile lookups fail, circles don't link, data inconsistency throughout demo.

---

## PART 2: COMPREHENSIVE PRODUCT BACKLOG

### PRIORITY LEGEND
- **P0 (BLOCKER)**: Demo cannot proceed without this
- **P1 (CRITICAL)**: Severely impacts demo quality
- **P2 (HIGH)**: Important for complete demo experience
- **P3 (MEDIUM)**: Nice to have for polish
- **P4 (LOW)**: Post-demo improvements

---

## EPIC 1: BABALAWO DISCOVERY & BOOKING FLOW

### P0-001: Fix Babalawo Card Click Handler
**Status**: NOT STARTED
**Effort**: 2 hours
**Description**: Clicking Babalawo in directory does nothing. Need to either:
- Open modal profile overlay, OR
- Navigate to working profile route

**Acceptance Criteria**:
- [ ] Click Babalawo card -> Profile visible
- [ ] "Request Consultation" button visible
- [ ] "View Full Profile" option available

**Files to Modify**:
- [frontend/src/App.tsx](frontend/src/App.tsx) (NavigationAdapter cases)
- [frontend/src/features/babalawo/directory/babalawo-directory.tsx](frontend/src/features/babalawo/directory/babalawo-directory.tsx)

---

### P0-002: Implement Full Booking Flow
**Status**: NOT STARTED
**Effort**: 4 hours
**Description**: Complete the booking journey from Babalawo selection to confirmation.

**Flow Required**:
1. View Babalawo profile (services, pricing, availability)
2. Select service type
3. Choose date/time
4. Payment stub (mock for demo)
5. Confirmation with contact options (call/video scheduling)

**Acceptance Criteria**:
- [ ] Service selection visible
- [ ] Date/time picker functional
- [ ] Payment stub shows "Processing..." -> "Confirmed"
- [ ] Confirmation shows contact methods

**Files to Modify**:
- [frontend/src/features/appointments/booking-flow.tsx](frontend/src/features/appointments/booking-flow.tsx)
- New: `frontend/src/features/babalawo/babalawo-profile-modal.tsx`

---

### P0-003: Temple -> Babalawo Modal (Not Redirect)
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: When viewing a temple and clicking affiliated Babalawo, show profile in modal overlay instead of navigating away.

**Acceptance Criteria**:
- [ ] Temple view remains visible/dimmed behind modal
- [ ] Babalawo modal shows full profile
- [ ] "Request Consultation" triggers booking within context
- [ ] Close modal returns to temple view

**Files to Modify**:
- [frontend/src/features/temple/temple-detail-view.tsx](frontend/src/features/temple/temple-detail-view.tsx)
- New: `frontend/src/shared/components/babalawo-profile-modal.tsx`

---

## EPIC 2: CIRCLES (EGBE) FUNCTIONALITY

### P0-004: Fix Circle Slug/ID Mismatch
**Status**: NOT STARTED
**Effort**: 1 hour
**Description**: Circle directory passes ID but routes expect slug.

**Acceptance Criteria**:
- [ ] Demo circles have `slug` field
- [ ] Click circle -> Detail view loads
- [ ] "London Ifa Study Group" fully functional

**Files to Modify**:
- [frontend/src/data/demo-data.ts](frontend/src/data/demo-data.ts) (add slugs to DEMO_CIRCLES)
- [frontend/src/features/circles/circle-directory.tsx](frontend/src/features/circles/circle-directory.tsx) (use slug for navigation)

---

### P0-005: Populate Circle Detail with Demo Content
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: CircleDetailView needs demo fallback data showing active community.

**Content Required**:
- Member list (with avatars)
- Active threads/discussions
- Upcoming events within circle
- Resources section

**Acceptance Criteria**:
- [ ] Click "London Ifa Study Group" -> Full content visible
- [ ] Members tab shows demo members
- [ ] Events tab shows circle-related events
- [ ] Resources tab shows sample resources

**Files to Modify**:
- [frontend/src/data/demo-data.ts](frontend/src/data/demo-data.ts) (expand DEMO_CIRCLES)
- [frontend/src/features/circles/circle-detail-view.tsx](frontend/src/features/circles/circle-detail-view.tsx) (add fallback)

---

### P1-006: Remove Client "Create Circle" Button
**Status**: NOT STARTED
**Effort**: 30 minutes
**Description**: Clients should not create circles. Replace with "Suggest Circle" that routes to admin queue.

**Acceptance Criteria**:
- [ ] CLIENT role: "Suggest Circle" button -> Suggestion form
- [ ] BABALAWO role: No create button
- [ ] ADMIN role: "Create Circle" button retained

**Files to Modify**:
- [frontend/src/features/circles/circle-directory.tsx](frontend/src/features/circles/circle-directory.tsx)
- New: `frontend/src/features/circles/circle-suggestion-form.tsx`

---

## EPIC 3: FORUM FUNCTIONALITY

### P0-007: Fix Thread "Not Found" Error
**Status**: NOT STARTED
**Effort**: 2 hours
**Description**: ThreadView has no demo fallback. Add demo thread content.

**Acceptance Criteria**:
- [ ] Click any demo thread -> Full thread loads
- [ ] OP content visible
- [ ] Replies visible with Ase counts
- [ ] Reply form functional (mock submit)

**Files to Modify**:
- [frontend/src/data/demo-data.ts](frontend/src/data/demo-data.ts) (expand DEMO_THREADS with full content)
- [frontend/src/features/forum/thread-view.tsx](frontend/src/features/forum/thread-view.tsx) (add demo fallback)

---

### P1-008: Redesign "Thread Not Found" Error Page
**Status**: NOT STARTED
**Effort**: 1 hour
**Description**: Replace brown/default error with culturally appropriate design.

**Design Requirements**:
- Illustration (scroll, wisdom motif)
- Message: "This wisdom is being prepared with care"
- "Return to Forum" button
- Consistent with app color palette

**Acceptance Criteria**:
- [ ] Error page matches app aesthetic
- [ ] Cultural messaging (not generic 404)
- [ ] Clear navigation back

**Files to Modify**:
- [frontend/src/features/forum/thread-view.tsx](frontend/src/features/forum/thread-view.tsx)
- New: `frontend/src/shared/components/wisdom-not-found.tsx`

---

### P2-009: Demo Forum with Full Threads
**Status**: NOT STARTED
**Effort**: 4 hours
**Description**: Pre-populate forum with realistic threads showing community engagement.

**Content Required** (3 full threads):
1. "Meaning of seeing white dove in dream?" - 12 replies, Babalawo answer
2. "Best resources for learning Odu Ifa?" - 8 replies, book recommendations
3. "Connecting with Egbe (Spirit Companions)" - 45 replies, deep discussion

**Acceptance Criteria**:
- [ ] Each thread has full reply chain
- [ ] Ase acknowledgments visible
- [ ] Mixed user types (client questions, Babalawo answers)
- [ ] Realistic timestamps

---

## EPIC 4: ROLE-BASED PERMISSIONS

### P0-010: Remove Client "Host Event" Button
**Status**: NOT STARTED
**Effort**: 30 minutes
**Description**: Same issue as circles. Add role guard.

**Acceptance Criteria**:
- [ ] CLIENT: View only (no "Host an Event" button)
- [ ] BABALAWO: "Host Temple Event" (if affiliated)
- [ ] ADMIN: Full "Host an Event" access

**Files to Modify**:
- [frontend/src/features/events/events-directory.tsx](frontend/src/features/events/events-directory.tsx)

---

### P1-011: Implement Role-Based Temple View
**Status**: NOT STARTED
**Effort**: 4 hours
**Description**: Temple detail view should adapt based on user role.

**Role-Specific Actions**:
| Role | Actions Available |
|------|-------------------|
| CLIENT | "Find Babalawo", "Request Consultation" |
| BABALAWO | "Manage My Affiliation", "Post Announcement" |
| ADMIN | "Verify Temple", "Assign Babalawos", "Edit Temple" |

**Acceptance Criteria**:
- [ ] Different buttons shown per role
- [ ] Babalawo sees management options if affiliated
- [ ] Admin sees verification/admin tools

**Files to Modify**:
- [frontend/src/features/temple/temple-detail-view.tsx](frontend/src/features/temple/temple-detail-view.tsx)

---

### P2-012: Circle/Event Suggestion Flow for Clients
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: Instead of create, clients can suggest. Suggestions go to admin queue.

**Flow**:
1. Client clicks "Suggest Circle/Event"
2. Form: Name, Description, Reason
3. Submit -> "Suggestion sent to Elders for review"
4. Admin sees in `/admin/suggestions`

**Acceptance Criteria**:
- [ ] Suggestion form functional
- [ ] Confirmation message shows
- [ ] Admin queue receives suggestions (mock for demo)

---

## EPIC 5: DEMO DATA CONSOLIDATION

### P0-013: Merge Demo Data Files
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: Consolidate `lib/demo-data.ts` and `data/demo-data.ts` into single source of truth.

**Target Structure**:
```
frontend/src/demo/
  profiles/
    amina-seeker.ts
    baba-femi.ts
    iya-omitonade-vendor.ts
    chief-adeyemi-admin.ts
  content/
    temples.ts
    circles.ts
    events.ts
    forum.ts
    marketplace.ts
  scenarios/
    first-consultation.ts
    marketplace-purchase.ts
  index.ts (unified exports)
```

**Acceptance Criteria**:
- [ ] Single demo data location
- [ ] All components import from same source
- [ ] IDs consistent across all entities
- [ ] Profile lookups work correctly

---

### P0-014: Add Demo Vendor Profile
**Status**: NOT STARTED
**Effort**: 2 hours
**Description**: VendorDashboardView needs demo vendor with products/orders.

**Demo Vendor**: Iya Omitonade (Yeye Osun)
- Business: Sacred Artifacts by Osun
- 4 products with images
- 5 mock orders (various statuses)
- Revenue analytics

**Acceptance Criteria**:
- [ ] Switch to Vendor -> Dashboard loads
- [ ] Products tab shows 4 items
- [ ] Orders tab shows 5 orders
- [ ] Earnings tab shows revenue

**Files to Modify**:
- [frontend/src/features/marketplace/vendor-dashboard-view.tsx](frontend/src/features/marketplace/vendor-dashboard-view.tsx)
- Demo data files

---

### P1-015: Add Demo Babalawo Profile with Clients
**Status**: NOT STARTED
**Effort**: 2 hours
**Description**: Babalawo home shows ClientList but no demo clients load.

**Demo Content**:
- Baba Femi's client list (3-5 clients)
- Upcoming appointments
- Active Guidance Plans
- Message threads

**Acceptance Criteria**:
- [ ] Babalawo home shows client cards
- [ ] Can click client -> View relationship details
- [ ] Appointments visible

---

## EPIC 6: USER PROFILE FIXES

### P0-016: Fix Profile Route/Lookup
**Status**: NOT STARTED
**Effort**: 2 hours
**Description**: Profile lookups fail due to ID mismatches between demo files.

**Acceptance Criteria**:
- [ ] `/profile` loads current user's profile
- [ ] `/users/:id` loads any demo user
- [ ] All demo user IDs work

---

### P1-017: Demo Profile with Full Journey
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: Demo client profile (Amina) should show completed journey.

**Content Required**:
- Completed onboarding
- Active Personal Awo relationship
- Upcoming appointments
- Guidance Plan history
- Temple affiliations
- Ase history (forum engagement)

**Acceptance Criteria**:
- [ ] Profile shows rich data, not empty states
- [ ] Each section has realistic content

---

## EPIC 7: ACADEMY COURSE FLOW

### P1-018: Complete Course Enrollment Flow
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: Demo the full course discovery -> enrollment -> learning journey.

**Flow**:
1. Browse `/academy`
2. Click course -> Detail view
3. "Enroll with Ase" button (NOT "Buy")
4. Payment stub -> Confirmation
5. Redirect to lesson player
6. Progress tracking visible

**Acceptance Criteria**:
- [ ] Course detail shows curriculum
- [ ] Enrollment flow completes
- [ ] Lesson player loads demo content
- [ ] Progress saves (localStorage for demo)

---

### P2-019: Add Demo Course Content
**Status**: NOT STARTED
**Effort**: 4 hours
**Description**: Pre-populated course with actual lesson content.

**Demo Course**: "Listening to Your Inner Voice" (from demo data)
- 5 modules
- Video placeholder for each
- Quiz/reflection at end
- Certificate on completion

---

## EPIC 8: TERMINOLOGY FIXES

### P1-020: Rename Prescription -> Guidance Plan (Global)
**Status**: NOT STARTED
**Effort**: 4 hours
**Description**: Replace all instances of "prescription" terminology.

**Changes Required**:
- Rename files: `prescription-*.tsx` -> `guidance-plan-*.tsx`
- Update imports in App.tsx
- Update route paths if any use "prescription"
- Update UI text (button labels, headings)

**Acceptance Criteria**:
- [ ] No "prescription" in user-visible text
- [ ] File names reflect "guidance-plan"
- [ ] Developers see consistent naming

---

### P2-021: Replace "Like" with "Ase" Globally
**Status**: PARTIAL
**Effort**: 2 hours
**Description**: Forum already uses `AseAcknowledgmentButton`. Ensure consistency elsewhere.

**Check**:
- [ ] Forum posts: Ase (done)
- [ ] Comments: Ase
- [ ] Reviews: Ase
- [ ] Any social interactions

---

## EPIC 9: STAKEHOLDER DEMO PAGES

### P1-022: Create Demo Control Panel
**Status**: NOT STARTED
**Effort**: 4 hours
**Description**: Floating panel for stakeholder demos.

**Features**:
- Profile switcher dropdown
- Scenario jump buttons
- Reset demo state button
- Only visible when `VITE_DEMO_MODE=true`

**Acceptance Criteria**:
- [ ] Panel appears in demo mode
- [ ] Switch profiles without logout
- [ ] Jump to specific scenarios
- [ ] Reset clears localStorage demo state

---

### P2-023: Cultural Integrity Showcase Page
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: `/demo/cultural-features` highlighting platform differentiators.

**Content**:
- Ase vs Like comparison
- Guidance Plan vs Prescription
- Diacritic preservation examples
- Temple verification process
- "No AI Divination" policy

---

### P2-024: Temple-First Journey Demo
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: Interactive guided walkthrough of core user journey.

**Steps**:
1. Temple Directory
2. Temple Detail
3. Babalawo Modal
4. Booking Flow
5. Guidance Plan Delivery

---

### P3-025: Metrics Dashboard for Stakeholders
**Status**: NOT STARTED
**Effort**: 3 hours
**Description**: `/demo/metrics` with mock platform analytics.

**Metrics**:
- Culturally Verified Temples: 12
- Active Babalawos: 45
- Guidance Plans Delivered: 87
- Diaspora Reconnection Rate: 68%

---

## EPIC 10: TECHNICAL DEBT

### P2-026: Add Error Boundaries
**Status**: NOT STARTED
**Effort**: 2 hours
**Description**: Graceful error handling throughout app.

**Acceptance Criteria**:
- [ ] Feature-level error boundaries
- [ ] User-friendly error messages
- [ ] "Report Issue" option
- [ ] Automatic recovery where possible

---

### P3-027: Loading States Consistency
**Status**: PARTIAL
**Effort**: 2 hours
**Description**: Standardize loading states across all views.

**Current Issues**:
- Some use `<Loader2 />` spinner
- Some use full-screen overlay
- Some have no loading state

**Standard**: Skeleton loaders for content, spinner for actions.

---

### P3-028: Mobile Responsiveness Audit
**Status**: NOT STARTED
**Effort**: 4 hours
**Description**: Test all views on mobile breakpoints.

**Known Issues**:
- Sidebar doesn't collapse properly
- Some modals don't fit mobile screens
- Touch targets too small in some areas

---

## PART 3: PRIORITIZED TODO LIST BY PHASE

### PHASE 1: CRITICAL FIXES (Feb 2-5) - MUST COMPLETE

| # | Task | Priority | Effort | Status |
|---|------|----------|--------|--------|
| 1 | P0-013: Merge demo data files | P0 | 3h | COMPLETED |
| 2 | P0-001: Fix Babalawo click handler | P0 | 2h | COMPLETED |
| 3 | P0-002: Implement booking flow | P0 | 4h | IN PROGRESS (booking exists, demo data connected) |
| 4 | P0-004: Fix circle slug/ID mismatch | P0 | 1h | COMPLETED |
| 5 | P0-005: Populate circle demo content | P0 | 3h | COMPLETED |
| 6 | P0-007: Fix thread "not found" | P0 | 2h | COMPLETED |
| 7 | P0-010: Remove client "Host Event" | P0 | 30m | COMPLETED |
| 8 | P0-014: Add demo vendor profile | P0 | 2h | COMPLETED |
| 9 | P0-016: Fix profile route/lookup | P0 | 2h | COMPLETED |
| 10 | P0-003: Temple -> Babalawo modal | P0 | 3h | COMPLETED |

**Phase 1 Total**: ~22.5 hours | **Progress**: 9/10 COMPLETED

---

### PHASE 2: DEMO POLISH (Feb 6-10)

| # | Task | Priority | Effort | Status |
|---|------|----------|--------|--------|
| 11 | P1-006: Replace client "Create Circle" with "Suggest" | P1 | 30m | NOT STARTED |
| 12 | P1-008: Redesign error pages | P1 | 1h | NOT STARTED |
| 13 | P1-011: Role-based temple view | P1 | 4h | NOT STARTED |
| 14 | P1-015: Demo Babalawo with clients | P1 | 2h | NOT STARTED |
| 15 | P1-017: Demo profile with journey | P1 | 3h | NOT STARTED |
| 16 | P1-018: Complete course flow | P1 | 3h | NOT STARTED |
| 17 | P1-020: Prescription -> Guidance Plan rename | P1 | 4h | NOT STARTED |
| 18 | P1-022: Demo control panel | P1 | 4h | NOT STARTED |

**Phase 2 Total**: ~21.5 hours

---

### PHASE 3: STAKEHOLDER READY (Feb 11-12)

| # | Task | Priority | Effort | Status |
|---|------|----------|--------|--------|
| 19 | P2-009: Full forum threads | P2 | 4h | NOT STARTED |
| 20 | P2-012: Suggestion flow for clients | P2 | 3h | NOT STARTED |
| 21 | P2-019: Demo course content | P2 | 4h | NOT STARTED |
| 22 | P2-023: Cultural showcase page | P2 | 3h | NOT STARTED |
| 23 | P2-024: Temple journey demo | P2 | 3h | NOT STARTED |
| 24 | Final testing & bug fixes | - | 4h | NOT STARTED |

**Phase 3 Total**: ~21 hours

---

## PART 4: ROLE PERMISSION MATRIX (CORRECTED)

| Feature | CLIENT | BABALAWO | VENDOR | ADMIN |
|---------|--------|----------|--------|-------|
| **Circles** |
| View circles | Yes | Yes | Yes | Yes |
| Join/Leave circles | Yes | Yes | Yes | Yes |
| Create circles | NO | NO | NO | Yes |
| Suggest circles | Yes | Yes | Yes | N/A |
| **Events** |
| View events | Yes | Yes | Yes | Yes |
| Register for events | Yes | Yes | Yes | Yes |
| Host events | NO | Yes* | NO | Yes |
| Edit any event | NO | NO | NO | Yes |
| **Temples** |
| View temples | Yes | Yes | Yes | Yes |
| Request consultation | Yes | NO | NO | NO |
| Manage affiliation | NO | Yes | NO | Yes |
| Verify temples | NO | NO | NO | Yes |
| Create temples | NO | Yes** | NO | Yes |
| **Forum** |
| Read threads | Yes | Yes | Yes | Yes |
| Create threads | Yes | Yes | Yes | Yes |
| Reply to threads | Yes | Yes | Yes | Yes |
| Moderate threads | NO | NO | NO | Yes |
| **Marketplace** |
| Browse products | Yes | Yes | Yes | Yes |
| Purchase products | Yes | Yes | Yes | Yes |
| Sell products | NO | NO | Yes | NO |
| **Admin** |
| Verification queue | NO | NO | NO | Yes |
| Dispute resolution | NO | NO | NO | Yes |
| User management | NO | NO | NO | Yes |

*Babalawo can host temple-affiliated events only
**Babalawo can create temples based on verification tier

---

## PART 5: DEMO FLOW CHECKLIST

### Client (Amina) Demo - 5 minutes
- [ ] Login as Amina (demo-client-1)
- [ ] View Personal Awo Dashboard (home)
- [ ] Navigate to Temples -> Select "Ile Ori Temple"
- [ ] Click Babalawo -> Modal shows profile
- [ ] Request Consultation -> Booking flow
- [ ] Payment stub -> Confirmation
- [ ] Check Messages for confirmation
- [ ] Navigate to Circles -> "London Ifa Study Group"
- [ ] View discussions, Ase interactions
- [ ] Navigate to Forum -> Click thread -> Full discussion
- [ ] Navigate to Academy -> View course -> Enroll preview
- [ ] Navigate to Marketplace -> Browse products

### Vendor (Iya Omitonade) Demo - 3 minutes
- [ ] Switch to Vendor role
- [ ] Dashboard loads with products/orders
- [ ] View order detail
- [ ] Add product flow
- [ ] Check earnings tab

### Babalawo (Baba Femi) Demo - 3 minutes
- [ ] Switch to Babalawo role
- [ ] Client list visible
- [ ] Click client -> Relationship details
- [ ] Create Guidance Plan flow
- [ ] Temple management (if affiliated)

### Admin (Chief Adeyemi) Demo - 2 minutes
- [ ] Switch to Admin role
- [ ] Verification queue visible
- [ ] Approve/reject sample
- [ ] Dispute center
- [ ] Create circle/event

---

## FINAL NOTES

### The "Temple-First" Narrative
Your docs emphasize "Temple-First Discovery" as the core differentiator. But in the current app:
1. Temples are just one sidebar item among many
2. Onboarding doesn't emphasize temple selection
3. Babalawo discovery bypasses temple context

**Recommendation**: Make the demo START at `/temples`, then flow naturally to Babalawo within temple context.

### Cultural Authenticity
Every click should feel like "stepping into a sacred space." Currently:
- Error pages feel generic
- Loading states don't reflect cultural motifs
- Some terminology still colonial ("Buy", "Subscribe")

### Stakeholder Confidence
The goal isn't feature completeness - it's demonstrating a coherent vision. Focus on:
1. ONE perfect Temple -> Babalawo -> Booking flow
2. ONE perfect Circle community experience
3. ONE perfect Forum thread with Ase engagement

**Quality over quantity. Depth over breadth. Ase.**

---

*Backlog Generated: January 29, 2026*
*Review Conducted By: Claude Code Critical Assessment*
