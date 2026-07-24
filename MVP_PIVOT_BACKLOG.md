# MVP Pivot Backlog — Ìlú Àṣẹ
## Narrowing to a Focused 8-Feature Surface

**Goal:** Pause Consultations, Messaging, and (as a consequence) Guidance Plans
creation, while keeping Forum, Marketplace, Temple Directory, Academy, Events,
and Pod Network fully live. A frontend-only, fully-reversible scope pivot —
nothing is deleted, only hidden, so re-enabling later is fast.
**Total:** 5 Sprints · 14 stories · ~23 SP
**Label format:** `PIV-XXX`
**Audience:** Frontend only — backend untouched throughout
**Status:** 🔵 Planned

---

## Strategic Philosophy

> *"Bí a bá n lé ọ̀pọ̀lọpọ̀ ehoro, a kì í mú ọ̀kankan."*
> — If you chase many rabbits at once, you catch none.

Ìlú Àṣẹ launched broad — 28 EPICs, every feature a spiritual community platform
could plausibly need. Depth beats breadth right now: fewer things, done well,
build more trust than many things half-alive. Consultations and Messaging
aren't being cut because they failed — they're being paused because Forum,
Marketplace, Temple Directory, and Academy deserve the full weight of
attention until they're unmistakably the heart of the platform. Nothing here
is thrown away. Every route, every component, stays in the codebase, ready to
come back the moment it's time.

---

## Current State — Target 8-Feature Table

| Feature | Status | Notes |
|---|---|---|
| Forum | Live | Includes "Ask a Babalawo" |
| Marketplace | Live | Verified vendors only, physical goods focus |
| Temple Directory | Live | Searchable list of recognized temples/practitioners |
| Academy | Live | Courses and digital guides, sellable via Marketplace |
| Consultations | Teased | "Coming Soon," collects interest |
| Pod Network | Paused (2027) | Already live as a teaser at `/pods` — no work needed |
| Messaging | Paused | Use Forum replies or external email for now |
| Events | Live (Simple) | Basic calendar for community happenings |
| Guidance Plans *(not in original table)* | Paused | Hard-depends on a real, completed Consultation — pauses as a consequence |

---

## 🔴 Sprint PIV-1 — Teaser Infrastructure (4 SP)

### PIV-001 · Shared `PausedFeatureNotice` component (2 SP)

**The gap:** There's no reusable "this feature isn't live yet" component that
fits *inside* the authenticated app shell. The only existing precedent,
`PodsPage.tsx`, is built for the standalone marketing-page shell (its own
header/footer) — dropping it as-is into a route nested under `SidebarLayout`
would double up navigation chrome.

**The fix:** One presentational component,
`frontend/src/shared/components/paused-feature-notice.tsx`, styled like
`PodsPage.tsx`'s "Coming Soon" hero (badge + icon, heading, body copy,
`mailto:` CTA built via `encodeURIComponent`, same as `PodsPage.tsx`'s
`handleWaitlist()`) but scaled to sit inside `SidebarLayout`'s content area.
Props: `{ icon, eyebrow, title, body, mailtoSubject, mailtoBody,
secondaryAction? }`. Keeping `mailto:` (not a native form) for now, since a
proper interest-capture form needs a URL that doesn't exist yet — swapping
the CTA to `window.open(formUrl)` later is a one-prop change here, not a
rebuild.

### PIV-002 · `ConsultationsPausedPage` (1 SP)

**The gap:** Consultations needs a "Coming Soon" landing point for every
booking-related route, for both clients and practitioners.

**The fix:** `frontend/src/pages/ConsultationsPausedPage.tsx`, rendering
`<PausedFeatureNotice>` with consultation-specific copy. Varies copy slightly
by role (derived via `useAuth()`) rather than existing as four separate page
files for the four route contexts it covers.

### PIV-003 · `MessagesPausedPage` (1 SP)

**The gap:** `/messages` and `/messages/:otherUserId` need a landing point
that doesn't redirect (per product decision: a specific conversation link
should show the pause notice in place, not bounce somewhere generic).

**The fix:** `frontend/src/pages/MessagesPausedPage.tsx`, rendering
`<PausedFeatureNotice>` with messaging-specific copy — "Messaging is paused,
use the Forum or email hello@iluase.com." The `:otherUserId` param is simply
ignored; both routes render the same static content.

---

## 🔴 Sprint PIV-2 — Routing Cutover (5 SP)

### PIV-004 · Swap `App.tsx` route elements (3 SP)

**The gap:** Ten routes currently render live booking/messaging components:
`/consultations`, `/client/consultations`, `/practitioner/consultations`,
`/practitioner/calendar`, `/practitioner/availability`,
`/practitioner/earnings`, `/booking/:babalawoId`,
`/booking/:appointmentId/confirmation`, `/messages`, `/messages/:otherUserId`.

**The fix:** Swap each route's rendered `element=` to
`<ConsultationsPausedPage />` or `<MessagesPausedPage />` as appropriate,
keeping each route's existing `<ProtectedRoute allowedRoles=...>` wrapper
exactly as-is (role gating still applies — a client hitting a practitioner
route still gets redirected before ever seeing the teaser). This single
change alone makes the app functionally safe: nobody can complete a booking
or send a message anywhere in the app, regardless of what any individual
button still says.

**Also guard `/prescriptions/create`** the same way, swapped to
`<ConsultationsPausedPage />` (or a small variant copy). It's a pure creation
form with no in-app entry point once `appointments-calendar.tsx`'s "Create
Guidance Plan" button is paused — but the route itself stays live and
reachable by a typed/bookmarked URL. Without this, a practitioner can load a
fully interactive form that only fails once they hit submit (the backend
still requires a real `COMPLETED` appointment), a much worse experience than
never seeing the form at all. **Do not** apply the same guard to
`/prescriptions/approve/:id` or `/prescriptions/history` — those process
*existing* plans (possibly still mid-approval at the moment this ships) and
correctly stay live per decision #2's "existing plans stay viewable."

### PIV-005 · `lazy-views.tsx` cleanup + revert-instructions comment (1 SP)

**The gap:** `BookingPage`, `BookingConfirmation`, `MessagesPage`,
`PractitionerCalendarView`, `SetAvailabilityView`, `EarningsReportView`,
`ConsultationList`, `AppointmentsCalendar` stay lazy-imported even though
nothing renders them post-PIV-004 — dead weight in the bundle, and a
confusing trail for whoever revisits this in 2027.

**The fix:** Remove those lazy exports. Add direct (non-lazy) imports for
`ConsultationsPausedPage`/`MessagesPausedPage` in `App.tsx` — small static
components, no need to code-split, and this drops `socket.io-client` and
calendar-heavy dependencies from routes nobody can reach. Add a comment block
at the top of both `lazy-views.tsx` and `App.tsx`:

    // ============================================
    // PAUSED FEATURES (2026 scope pivot — see MVP_PIVOT_BACKLOG.md):
    // To re-enable Consultations/Messaging:
    // 1. Restore the removed lazy imports below / at the top of App.tsx.
    // 2. Swap <ConsultationsPausedPage />/<MessagesPausedPage /> back to
    //    the original route elements (see git history for this commit).
    // 3. Restore the removed items in navigation.ts and sidebar-layout.tsx.
    // ============================================

Turns re-enablement into a scoped grep/uncomment job, not a rediscovery
effort.

### PIV-006 · `page-wrappers.tsx` cleanup (1 SP)

**The gap:** `ClientConsultationsPage` and `PractitionerConsultationsPage`
glue components exist solely to wrap `ConsultationList`/`AppointmentsCalendar`
— both now unused post-PIV-004. `PersonalAwoDashboardPage` also still wires
an `onMessage={() => navigate('/messages')}` prop.

**The fix:** Delete the two now-dead glue components and their imports.
Remove `PersonalAwoDashboardPage`'s `onMessage` prop entirely (mandatory —
it's a Messaging CTA, not a Tier-1 fallthrough). Leave `onRequestConsultation`
and `onViewDocuments` as-is.

---

## 🟠 Sprint PIV-3 — Navigation Cleanup (3 SP)

### PIV-007 · `navigation.ts`: remove paused items across 4 role configs (2 SP)

**The gap:** `CLIENT_NAV_ITEMS`, `BABALAWO_NAV_ITEMS`, `VENDOR_NAV_ITEMS`, and
`ADMIN_NAV_ITEMS` all still list a `messages` nav item; `CLIENT_NAV_ITEMS`
also lists `my-consultations`; `BABALAWO_NAV_ITEMS` also lists
`consultation-schedule` (Calendar) and `practice-earnings`.

**The fix:** Remove `messages` from all four role arrays. Remove
`my-consultations` from `CLIENT_NAV_ITEMS`. Remove `consultation-schedule`
and `practice-earnings` from `BABALAWO_NAV_ITEMS`. **Keep** `find-guide`
(`/babalawo`, "Find My Guide") on `CLIENT_NAV_ITEMS` and `service-offerings`
on `BABALAWO_NAV_ITEMS` — discovery/browsing and pricing setup stay live,
only booking itself is paused. No Guidance Plans nav entry exists to remove
— it was never a top-level item; its only "create new" entry point lives
inside a route already being paused (`appointments-calendar.tsx`).

### PIV-008 · `sidebar-layout.tsx`: mobile tabs + quick actions (1 SP)

**The gap:** `getMobileBottomTabs()` still returns a Messages tab for
BABALAWO, VENDOR, and ADMIN/ADVISORY_BOARD_MEMBER roles (CLIENT never had
one). The mobile "Quick actions" row also has a Messages entry.

**The fix:** Remove the Messages tab entry from those three role cases in
`getMobileBottomTabs()`, and remove the Messages entry from the quick-actions
array. The `unreadCount`-badge injection logic keyed on `item.id ===
'messages'` becomes a harmless no-op once nothing has that id — safe to
leave or delete, low priority either way.

---

## 🟠 Sprint PIV-4 — CTA Sweep (8 SP)

### PIV-009 · Remove Messaging CTAs, ~13 files (3 SP)

**The gap:** "Message X" buttons/links are scattered across practitioner
tools, marketplace, temple detail, profile pages, and dashboards —
`my-seekers-view.tsx`, `practitioner-dashboard.tsx` (`onMessageClient`),
`product-detail-view.tsx` ("Message Vendor"), `profile-menu-dropdown.tsx`,
`personal-awo-panel.tsx`, `temple-detail-view.tsx` (uses
`window.location.href`, not `navigate` — different removal shape),
`personal-awo-dashboard.tsx`, `ProfilePage.tsx` / `public-profile-view.tsx`.

**The fix:** Remove each CTA element outright — not a redirect, a deletion,
per product decision. Clean up any icon imports (`MessageSquare`/
`MessageCircle`) or handler props left unused afterward so lint's
unused-import rule doesn't fail the build.

### PIV-010 · `notification-dropdown.tsx`: follow_up/rebooking_nudge handling (1 SP)

**The gap:** The `follow_up` notification type (fired 24h after a completed
appointment, prompting a follow-up message) has a "Send Message" action
button. The backend keeps generating this notification type indefinitely
since it's untouched — this is a permanent state, not a transitional one, so
it deserves more care than a blanket Tier-1 fallthrough.

**The fix:** Keep the mark-as-read/close behavior for `follow_up`, remove its
"Send Message" button (mandatory). Leave `rebooking_nudge`'s "Book Again" and
`follow_up`'s "Update Plan" buttons as Tier-1 fallthroughs to the
Consultations teaser — landing there is honest, not broken.

### PIV-011 · Consultations copy/CTA pass, incl. hero CTAs (3 SP)

**The gap:** ~15 files have "Book a Consultation"-style CTAs or copy that's
no longer accurate. The two highest-traffic offenders — `Home.tsx`'s and
`BabalawoLandingPage.tsx`'s hero CTAs — say "Book a Consultation" and route
straight to the teaser, setting up every visitor for a bounce.

**The fix:** On `Home.tsx` and `BabalawoLandingPage.tsx`, change the hero CTA
label to "Browse Verified Guides" and repoint it to `/babalawo` — an honest
promise that's still kept. Since Messaging is paused too, add a secondary CTA
next to it: "Have a question? Ask a Babalawo in the Forum" → `/forum` —
Forum's "Ask a Babalawo" category is now the only sanctioned way to get a
direct answer, worth surfacing at the exact moment a visitor was reaching for
Consultations or Messaging. Elsewhere: `search-modal.tsx`'s babalawo search
result path changes from `/booking/:id` to `/profile/:id` (the profile page's
own "Book Session" CTA already correctly falls through to the teaser per this
same pass, so a search result still lands somewhere with a clear next step,
not a dead end); `search-context.tsx`'s static seeded "Book a personalized
consultation session" entry gets removed; `HelpPage.tsx`, `PricingPage.tsx`,
`SettingsPage.tsx`, and `role-selection-view.tsx` get their booking-related
copy reworded; `first-steps-checklist.tsx` (the one actually imported — its
sibling in `src/components/` is pre-existing dead code, don't touch it) drops
or rewords the CLIENT `'booking'` step and BABALAWO `'availability'` step.
Lower-priority Tier-1-safe fallthroughs (shareable booking links, "book
again" buttons) are left as-is.

### PIV-012 · Quarantine `booking.spec.ts` + `messaging.spec.ts` E2E tests (1 SP)

**The gap:** These Playwright specs assert against UI flows that no longer
exist post-PIV-004. Since the backend stays live, they won't fail fast or
cleanly — they'll hang or time out trying to interact with removed elements,
breaking CI for everything after this change lands.

**The fix:** `test.skip('<name>', ...)` per test, not a blanket
`test.describe.skip` — `booking.spec.ts` also covers Temple Discovery and
"View Babalawo Profile" scenarios that are genuinely unaffected and still
pass. Skipped: booking.spec.ts Scenarios 6/7/8 (Book/Cancel/Reschedule),
messaging.spec.ts Scenarios 19/20 (Send/Receive Message) — Scenarios 7, 8,
19, and 20 only ever asserted on the URL (not real cancel/refund/message
content), so they'd technically still pass against the paused pages, but
their names claim coverage that no longer exists — skipped rather than left
green and misleading. Not optional cleanup — must ship in the same change
as PIV-004.

---

## 🟡 Sprint PIV-5 — Dashboard & UX Polish (3 SP)

### PIV-013 · `personal-dashboard-view.tsx`: remove stat cards, resize grid (1 SP)

**The gap:** The client dashboard's stat-card row shows "My Consultations,"
"Guidance Plans," and "Unread Messages" side by side in a grid sized for
more cards than will remain.

**The fix:** Remove the "My Consultations" and "Unread Messages" cards, keep
"Guidance Plans" (view-only). Down to one card, change the row's grid class
to `lg:grid-cols-1` — a firm choice, since `-2`/`-3` would leave a visually
awkward empty gap. Elsewhere in the same file: reword the "Find Babalawo"
quick-link tile's copy ("personalized consultations" → "browse verified
spiritual guides"); "Book again" links on the "My Babalawo" list stay as
Tier-1 fallthrough (that block already renders `null` with no consultation
history, so it naturally disappears for new users going forward).

### PIV-014 · Practice Center: "paused for platform updates" banner (2 SP)

**The gap:** Once PIV-007/PIV-008 remove Calendar/Availability/Earnings nav
items, a practitioner who's used to seeing them will just find them gone
with zero explanation — reads as broken, not intentional.

**The fix:** Add a small notice banner at the top of the Practice Center
overview dashboard (`practitioner-dashboard.tsx`) — reuse
`PausedFeatureNotice` in a compact/inline variant. Text: "⚠️ Consultations
are paused for platform updates until 2027. Your historical data remains
visible below." Dismissible via an "X," with dismissal persisted to
`localStorage` under key `iluase_practice_banner_dismissed` — without this,
a dismiss button that doesn't persist reappears on every refresh, which reads
as broken, not as respecting the practitioner's choice. The stat cards and
Recent Appointments list underneath stay exactly as they are today: real,
read-only historical data, same treatment as Guidance Plans.

---

## Verification (applies across all sprints, run after PIV-012)

1. `cd frontend && npm run build` — catches broken JSX/route-type mismatches.
2. `npm run lint` — fails on any warning, catches unused imports/handlers.
3. Grep sweep for dead references:
   - `grep -rn "'/messages" frontend/src --include="*.tsx" --include="*.ts"` → only `MessagesPausedPage.tsx`/`App.tsx` route registration
   - `grep -rn "'/booking/" frontend/src --include="*.tsx" --include="*.ts"` → only route registration + deliberately-kept Tier-1 fallthroughs
   - `grep -rln "features/messages" frontend/src --include="*.tsx" --include="*.ts"` → nothing outside `features/messages/**` itself
   - `grep -rn "practitioner-calendar-view\|set-availability-view\|earnings-report-view" frontend/src/App.tsx frontend/src/routes` → nothing
4. `npm run test:run` (Vitest) — Guidance Plans tests unaffected; check for tests targeting removed route wiring.
5. Playwright run — `booking.spec.ts`/`messaging.spec.ts` show as skipped, not red/hanging.
6. Manual smoke pass (dev server): CLIENT — `/babalawo` still shows practitioners, a practitioner's "Book" CTA shows the teaser not a crash, `/client/consultations` and `/messages` show paused notices directly, mobile tabs drop Messages. BABALAWO — `/practitioner/{calendar,availability,earnings}` show the teaser (still role-gated), sidebar drops Calendar/Earnings/Messages, Practice Center shows the new banner.
