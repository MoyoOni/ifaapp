# ADMIN_BACKLOG.md — OBSOLETE

**Status:** ✅ CONSOLIDATED into Z1_BACKLOG.md
**Date:** April 19, 2026
**Reason:** All admin operations work verified complete. No remaining items.

**What was here:**
- ADM-001 through ADM-032: Admin operations backlog
- Status: All items completed and verified in codebase
- Admin dashboard fully functional with all tabs wired

**New Location:** See Z1_BACKLOG.md for any future admin-related work.

---

*This document is now obsolete. All remaining work has been consolidated into Z1_BACKLOG.md with unique routing codes.*

---

# Admin Operations Backlog — Ìlú Àṣẹ
## "The Steward's Room" — Running the Platform Day-to-Day

**Goal:** Give the admin everything needed to run Ìlú Àṣẹ as a real, growing spiritual platform — from the morning check-in to year-end reporting.
**Total:** 8 Sprints · ~200 Story Points
**Label format:** `ADM-XXX`
**Audience:** Solo founder now. Ops team later. Build for both.

---

## Strategic Philosophy

> *"Ẹni tó bá ń ṣe ìjọba tó dára, ó máa ń mọ ohun tó ń ṣẹlẹ̀"*
> — A good ruler knows what is happening in the land.

An admin dashboard is not a content manager. It is an **operations centre** — the one screen that tells you the health of your community, the state of your money, and what needs your attention *today*. Every feature built here should answer one question: **does this help run the platform without surprises?**

---

## The Day-to-Day Reality

### Morning (daily, 10 minutes)
- How many people signed up overnight?
- Any red flags? Reported posts? Flagged users?
- Any payments or payouts waiting?
- Any practitioners who need verification?
- Is the platform healthy?

### Weekly (30 minutes)
- Is the forum alive? Which categories are quiet?
- Which practitioners are active vs. going cold?
- What is the revenue this week vs last week?
- Any users I should follow up with personally?
- Feature something good that the community made

### Monthly (2 hours)
- Full financial reconciliation
- Subscription MRR and churn
- User retention: who came back, who didn't
- Practitioner quality audit
- Content calendar planning

---

## Current State — What Exists

| Capability | Status |
|-----------|--------|
| Platform stats (users, verifications, appointments) | ✅ Built |
| Babalawo verification queue (approve/reject/bulk) | ✅ Built |
| User list with search/filter | ✅ Built |
| User impersonation (audited) | ✅ Built |
| Withdrawal approvals | ✅ Built |
| Reported content resolution | ✅ Built |
| Circle management (approve/reject/moderate) | ✅ Built |
| Vendor application review | ✅ Built |
| Fraud alerts | ✅ Built |
| Analytics dashboard (basic) | ✅ Built |
| Audit log (SUPER only) | ✅ Built |
| Admin sub-role system (SUPER/FINANCE/COMPLIANCE/SUPPORT/MODERATOR) | ✅ Built |
| Feature flags API (no UI) | ✅ Backend only |
| Forum thread pin/lock/approve (API only) | ✅ Backend only |

---

## Implementation Status

| ID | Story | Status | Notes |
|----|-------|--------|-------|
| ADM-001 | Morning Dashboard | ✅ DONE | Backend `GET /admin/morning-brief`, frontend tab with pending actions, revenue, recent threads, health |
| ADM-002 | User Role Management UI | ✅ DONE | Role change dialog with mandatory reason + audit log, ADMIN promotion with sub-role picker, `isBanned` status column |
| ADM-003 | User Suspension & Ban System | ✅ DONE | Schema fields added, service fully wired, `getAllUsers` returns `isSuspended`/`isBanned`, frontend modals complete |
| ADM-004 | Forum Category & Thread Management UI | ✅ DONE | Archive toggle + reorder (ChevronUp/Down) buttons added to category cards, wired to PATCH /forum/admin/categories/:id and /reorder |
| ADM-005 | Platform Announcement System | ✅ DONE | `Announcement` model in schema + migration, all CRUD endpoints wired to DB, frontend tab |
| ADM-006 | Practitioner Performance Dashboard | ✅ DONE | Service methods + frontend tab implemented |
| ADM-007 | Featured Practitioners | ✅ DONE | `isFeatured`/`featuredOrder`/`featuredExpiry` added to schema + migration, service + frontend fully wired |
| ADM-008 | Practitioner Complaint Handling | ✅ DONE | `PractitionerComplaint` model in schema + migration, all CRUD endpoints wired to DB, frontend tab |
| ADM-009 | Trust Score Management | ✅ DONE | `trustScoreOverride` fields in schema, breakdown/update/history endpoints, frontend tab |
| ADM-010 | Inactive Practitioner Re-engagement | ✅ DONE | Service endpoint + frontend tab with React Query, per-row actions, threshold control |
| ADM-011 | Financial Command Centre | ✅ DONE | 7 metrics + 6-month Recharts LineChart, React Query, ₦ NGN formatting |
| ADM-012 | Refund Management UI | ✅ DONE | RefundRequest model, service/controller endpoints, admin-refunds-tab.tsx, wired into dashboard |
| ADM-013 | Subscription Management | ✅ DONE | Active list + cancel/extend actions, churn view, failed payment recovery with reminders |
| ADM-014 | Commission Rate Settings | ✅ DONE | PlatformSettings model + migration, get/update service + endpoints, admin-settings-tab.tsx wired |
| ADM-015 | Cultural Content Calendar | ✅ DONE | OralHistoryEntry + SacredCalendarEvent models + migrations, 12 admin endpoints, admin-cultural-content-tab.tsx wired |
| ADM-016 | Featured Content Management | ✅ DONE | isFeatured+featuredUntil on ForumThread/Product/Course/Circle, migration, 3 endpoints, admin-featured-content-tab.tsx wired |
| ADM-017 | Community Recognition System | ✅ DONE | UserBadge model + migration, getCommunityStars/awardBadge/revokeBadge endpoints, admin-community-tab.tsx wired |
| ADM-018 | Cultural Integrity Review Queue | ✅ DONE | heldForReview fields on ForumPost + ContentFlagRule model + migration, 7 endpoints, admin-integrity-tab.tsx wired |
| ADM-019 | Segmented Email Campaigns | ✅ DONE | EmailCampaign model + migration, getCampaigns/createCampaign/sendCampaign endpoints, admin-campaigns-tab.tsx wired |
| ADM-020 | Promo Code & Discount System | ✅ DONE | PromoCode + PromoRedemption models + migration, CRUD endpoints, admin-promos-tab.tsx wired |
| ADM-021 | Referral Program Management | ✅ DONE | Uses existing Referral model, stats/list/credit endpoints, admin-referrals-tab.tsx wired |
| ADM-022 | User Lifecycle Analytics | ✅ DONE | GET /admin/analytics/lifecycle — funnel/cohorts/geographic shape, admin-lifecycle-tab.tsx wired |
| ADM-023 | Forum Intelligence Dashboard | ✅ DONE | Wired GET /forum/admin/metrics to admin-forum-intelligence-tab.tsx — stat cards, top categories bar chart, top contributors, seed-thread action |
| ADM-024 | Practitioner Leaderboard & Market Intelligence | ✅ DONE | Service methods (getPractitionerLeaderboard, getMarketIntelligence), controller endpoints, admin-market-intelligence-tab.tsx created, wired to dashboard |
| ADM-025 | Revenue Forecasting | ✅ DONE | Service method (getRevenueForecasts), controller endpoint, admin-forecasting-tab.tsx created with scenario modeling & trend charts, wired to dashboard |
| ADM-026 | GDPR & Data Rights Management | ✅ DONE | gdpr.service.ts (exportUserData/deleteUser/updateConsent), GdprSettingsPanel.tsx in SettingsPage, uses api client |
| ADM-027 | Session & Security Management | ✅ DONE | UserSession model + migration, auth login logging, admin-security-tab.tsx — overview cards, per-user sessions, force logout |
| ADM-028 | Cultural Orientation Quiz Management | ✅ DONE | CulturalQuizQuestion model + migration, DB-driven questions in gate, admin-cultural-quiz-tab.tsx — stats/threshold/CRUD/reset |
| ADM-029 | Trust Score Audit & Override (extended) | ✅ DONE | admin-trust-score.service.ts, breakdown/override/history endpoints, admin-trust-score-audit-tab.tsx wired |
| ADM-030 | Platform Settings Panel | ✅ DONE | admin-platform-settings.service.ts, GET/PATCH endpoints, admin-platform-settings-tab.tsx with range sliders |
| ADM-031 | Marketplace Management | ✅ DONE | admin-marketplace.service.ts, 5 endpoints, admin-marketplace-tab.tsx — Products/Orders/Vendor Health/Categories sub-tabs |
| ADM-032 | Academy Management | ✅ DONE | admin-academy.service.ts, 7 endpoints, admin-academy-tab.tsx — Courses/Enrollments/Certificates sub-tabs |

**Legend:** ✅ DONE · 🟡 PARTIAL (UI/service exists but missing DB model or schema fields) · ⬜ NOT STARTED

---

## What Is Missing — Prioritised

---

## 🔴 Sprint 1 — Daily Operations Command Centre (36 SP)
*The things you need on day one of real operations.*

### ADM-001 · Morning Dashboard (8 SP) — ✅ DONE
**The single screen that replaces 10 tabs.**

**What it shows:**
- Today's signups (number + sparkline vs. yesterday)
- Pending actions count (verifications + withdrawals + reports + disputes) — red badge if > 0
- Revenue today / this week / this month (₦ figures)
- Active users right now (live count from Redis)
- Last 5 forum posts (with flag if reported)
- Platform health status (API, DB, Redis — green/amber/red)
- One "action required" card per category (e.g. "3 withdrawals waiting")

**Why:** Right now you open 6 tabs to get this picture. You'll miss things. One screen = one truth.

**Files:** `admin-dashboard-view.tsx`, new `admin-morning-brief.tsx`

---

### ADM-002 · User Role Management UI (5 SP) — ✅ DONE
**Change roles without touching the database.**

**Actions:**
- Promote CLIENT → BABALAWO (triggers verification flow or bypasses with admin note)
- Demote BABALAWO → CLIENT (with mandatory reason logged)
- Promote CLIENT → VENDOR
- Promote to ADMIN with sub-role selection
- All changes logged in audit trail with admin ID + reason + timestamp

**Why:** You had to go into the DB to make yourself ADMIN. Every time a real Babalawo signs up and needs promoting, you'll do the same. This is not sustainable.

**Files:** `admin-user-management-tab.tsx`, `PATCH /admin/users/:id/role`

---

### ADM-003 · User Suspension & Ban System (6 SP) — ✅ DONE
**Handle bad actors without deleting accounts.**

**Actions:**
- **Warn** — Send user an in-app warning with custom message
- **Suspend** — Temporary block (1 day / 7 days / 30 days / custom date). User sees "Your account is suspended until [date]" on login.
- **Ban** — Permanent. Account locked. Email notification sent.
- **Unban** — Reinstate at any time with note
- All actions shown on user profile in admin view with history

**Why:** Right now your only tool is deleting from the DB. When a user posts something disrespectful or fraudulent, you need a proportionate response. Suspension is the standard first step. Banning is the nuclear option.

**Files:** `users` table: add `suspendedUntil`, `bannedAt`, `banReason` fields. Auth guard checks suspension. New admin actions.

---

### ADM-004 · Forum Category & Thread Management UI (8 SP) — 🟡 PARTIAL
**Manage the forum without touching the database.**

**Category management:**
- Create new category (name, slug, description, icon, order, isTeachings toggle)
- Edit existing category
- Reorder categories (drag or up/down)
- Archive/deactivate a category (threads preserved, no new threads)

**Thread management (from admin panel, not just thread view):**
- Pin/unpin any thread
- Lock/unlock any thread
- Move thread to a different category
- Feature a thread (shows with special badge on forum home)
- Delete thread with reason (logged)
- Merge duplicate threads

**Why:** You seeded 10 categories directly into the database. Every new category, every pinned announcement, every moderation action currently requires DB access. This is a blocker as the forum grows.

**Files:** New `admin-forum-management-tab.tsx`, extend forum controller endpoints.

---

### ADM-005 · Platform Announcement System (9 SP) — ✅ DONE
**Talk to your users directly from inside the platform.**

**Three announcement types:**

1. **Banner** — Sticky bar across the top of the app for all users. Example: "Platform maintenance Saturday 2am–4am WAT." Dismissible or not. Set duration.

2. **In-app notification blast** — Send a notification to: All users / All CLIENTs / All BABALAWOs / All Devoted subscribers / Specific user IDs. Message + optional link.

3. **Email broadcast** — Trigger email to a segment. Subject + body (rich text). Preview before sending. Scheduled or immediate.

**Why:** Right now if something breaks, or you want to announce a new feature, or you want to drive people to a new forum thread — you have no way to reach users inside the platform. This is essential for community building and retention.

**Files:** New `admin-announcements-tab.tsx`, `POST /admin/announce`, `POST /admin/notify-segment`. Reuse existing notification infrastructure.

---

## 🟡 Sprint 2 — Practitioner Operations (28 SP)
*What you need when real Babalawos are on the platform and clients are booking them.*

### ADM-006 · Practitioner Performance Dashboard (8 SP) — ✅ DONE
**See who is actually performing and who is going cold.**

**Per-practitioner card shows:**
- Total consultations (all time / this month)
- Average rating + total reviews
- Response rate (% of booking requests they respond to)
- No-show rate (practitioner didn't appear to consultation)
- Revenue generated (platform's cut)
- Days since last login
- Days since last consultation
- Status badge: Active / Quiet (>14 days) / Inactive (>30 days) / At Risk (rating <3.5)

**List view:** Sort by rating, revenue, activity, bookings. Filter by status.

**Why:** You currently have 3 Babalawos. You'll have 30. You need to know who is making clients happy and who is silently damaging trust.

**Files:** New `admin-practitioner-performance-tab.tsx`, extend dashboard service.

---

### ADM-007 · Featured Practitioners (4 SP) — ✅ DONE
**Control who appears at the top of the discovery page.**

**Actions:**
- Toggle "Featured" on any verified Babalawo (shown first in discovery)
- Set featured order (1st, 2nd, 3rd...)
- Featured practitioners get a ★ badge
- Set featured expiry date (auto-expires)

**Why:** Discovery is algorithmic right now. But you should be able to surface the best practitioners, promote a new one who needs exposure, or highlight someone whose reviews are exceptional. This is also a monetisation lever later (paid featuring).

**Files:** `isFeatured` + `featuredOrder` fields on User/BabalawoProfile. Update discovery query.

---

### ADM-008 · Practitioner Complaint Handling (7 SP) — ✅ DONE
**Structured way to receive and act on complaints about specific practitioners.**

**Flow:**
1. Client submits complaint (reason: no-show / inappropriate / fraud / other + description)
2. Admin sees complaint in new "Practitioner Complaints" tab
3. Admin can: Warn practitioner (in-app message), Suspend from bookings (temporary), Revoke verification, Escalate to dispute
4. Client notified of resolution
5. All actions logged against practitioner profile

**Why:** A dispute between a client and a Babalawo is different from a forum report. It involves money, trust, and safety. You need a specific workflow for it — not just the generic dispute centre.

**Files:** New `PractitionerComplaint` model, `admin-complaints-tab.tsx`.

---

### ADM-009 · Trust Score Management (4 SP) — ✅ DONE
**Manually adjust or override trust scores with accountability.**

**Actions:**
- View full trust score breakdown per practitioner (what contributed to their score)
- Add/remove manual bonus points with written reason (e.g. "Community elder, known lineage")
- Override tier (e.g. force to Elder tier) with reason + admin ID logged
- History of all manual adjustments visible to other admins

**Why:** The trust score algorithm is automated. But some things the algorithm can't know — community reputation, lineage, years of practice not captured in the data. Admin should be the human layer on top of the algorithm.

**Files:** `trustScoreOverride` field, extend `admin.service.ts`.

---

### ADM-010 · Inactive Practitioner Re-engagement (5 SP) — ✅ DONE
**Surface and act on practitioners who have gone quiet.**

**Dashboard view:**
- Practitioners who haven't logged in for 14+ days
- Practitioners who haven't accepted a booking in 30+ days
- One-click: Send re-engagement message ("We miss you — your community needs you")
- One-click: Mark as "On Leave" (hides from discovery without losing account)
- One-click: Deactivate listing (stays registered but removed from discovery)

**Why:** A quiet Babalawo who clients try to book creates a bad experience. Better to know early and act.

**Files:** Cron job + admin tab.

---

## 🟡 Sprint 3 — Revenue Operations (28 SP)
*What you need when money is moving through the platform.*

### ADM-011 · Financial Command Centre (10 SP) — ✅ DONE
**One screen for all money on the platform.**

**Metrics shown:**
- MRR (Monthly Recurring Revenue from Devoted subscriptions)
- Total GMV (Gross Merchandise Value — consultations + marketplace)
- Platform revenue (your commission cut)
- Pending payouts (total amount waiting approval)
- Refunds issued this month
- Failed payments this month
- Subscription churn this month (cancellations)
- 6-month revenue chart

**Why:** Right now you'd need to piece this together from multiple tabs and the DB. You can't run a business without knowing your revenue at a glance.

**Files:** New `admin-financial-centre-tab.tsx`, extend analytics service.

---

### ✅ ADM-012 · Refund Management UI (6 SP)
**Issue refunds without touching the payment processor directly.**

**Flow:**
1. Client requests refund (reason + consultation/order ID)
2. Appears in "Refund Requests" tab
3. Admin reviews: sees what was purchased, amount, reason, practitioner/vendor view
4. Admin approves (full or partial amount) or rejects with reason
5. Refund processed via Paystack/Flutterwave API
6. Both parties notified

**Note:** `REFUNDED` OrderStatus enum already exists in the codebase. This wires the UI to it.

**Why:** Refunds are a `TODO` in the codebase. When a client pays ₦20,000 for a consultation and the Babalawo doesn't show, you need a professional way to handle it. Right now you have nothing.

**Files:** New `admin-refunds-tab.tsx`, `POST /admin/refunds/:id/process`, extend payment service.

---

### ✅ ADM-013 · Subscription Management (6 SP)
**Handle Devoted subscription edge cases manually.**

**Actions:**
- View all active Devoted subscribers (status, billing date, amount)
- Cancel a subscription (with reason — e.g. user request via email)
- Extend a subscription (gift extra months — e.g. for a user who had a bad experience)
- Apply discount / adjust price (for early community members)
- See churn: who cancelled this month and why (if they provided reason)
- Failed payment recovery: list of subscribers whose payment failed, one-click "send payment reminder"

**Why:** Subscription issues will happen. A user emails you saying they were charged twice. Another says the payment didn't go through but they lost access. You need to be able to fix these without going into Paystack's dashboard.

**Files:** `admin-subscriptions-tab.tsx`, extend subscription service.

---

### ✅ ADM-014 · Commission Rate Settings (6 SP)
**Control the platform's cut without code changes.**

**Settings:**
- Consultation commission % (currently hardcoded)
- Marketplace transaction commission %
- Minimum payout threshold (default ₦5,000)
- Maximum single payout without FINANCE approval
- These are stored in a `PlatformSettings` table, read at transaction time

**Why:** Right now changing the commission requires a code change and a deploy. As you learn what the market can bear, you'll want to adjust this. Same for payout thresholds.

**Files:** New `PlatformSettings` model and service, `admin-settings-tab.tsx`.

---

## 🟡 Sprint 4 — Content & Community Management (24 SP)

### ✅ ADM-015 · Cultural Content Calendar (8 SP)
**Manage the living cultural layer of the platform.**

**Three content streams managed from admin:**

1. **Daily Yoruba Word/Proverb** — Create, schedule, and queue the daily words. Set date, Yoruba word, pronunciation guide, English meaning, cultural context. View queue for next 30 days.

2. **Oral History Archive** — The deferred F9-904 feature finds its home here. Admin uploads or transcribes elder teachings: title, category, Babalawo name (with consent), recording date, tags. These appear in the forum and a dedicated Archive section.

3. **Sacred Content Calendar** — Schedule platform-wide events around Yoruba festivals (Osun Grove Festival, Isese Day August 20, Ifa Day, etc.). These surface as banners and featured threads.

**Why:** Cultural authenticity is your differentiation. No other platform does this. The Daily Word already exists in the schema. This gives you control over it without DB access.

**Files:** New `admin-cultural-content-tab.tsx`, `DailyYorubaWord` model (already exists), new `OralHistoryEntry` model.

---

### ✅ ADM-016 · Featured Content Management (5 SP)
**Surface the best of what the community creates.**

**Feature from anywhere:**
- Feature a forum thread (appears in "Featured Discussions" on forum home)
- Feature a practitioner's teaching post
- Feature a circle (appears on landing page / circles directory)
- Feature a marketplace product (appears in "Community Picks" section)
- Feature a course (appears prominently in Academy)

**How:** Each item gets `isFeatured: boolean` + `featuredUntil: DateTime`. Admin sets it via toggle in the relevant management view. A dedicated "Featured Content" overview shows everything currently featured.

**Why:** The community will create genuinely excellent content. Surfacing it rewards the creator and improves the experience for everyone else.

**Files:** Add `isFeatured` field to ForumThread, Circle, Product, Course. New `admin-featured-content-tab.tsx`.

---

### ✅ ADM-017 · Community Recognition System (6 SP)
**See and reward your most valuable community members.**

**"Community Stars" view:**
- Most posts this month (forum)
- Most Àṣẹ received (acknowledgments)
- Most helpful in "Questions for Elders"
- Longest streak of daily logins
- Members who referred others

**Actions:**
- Award a custom badge to any user ("Elder Voice", "Community Pillar", "Culture Keeper")
- Send a personal appreciation message from the platform
- Promote to "Community Builder" status (existing field in codebase)
- Feature their profile on the platform

**Why:** Your most engaged users are your most valuable asset. Recognising them costs nothing and creates massive loyalty. They become your word-of-mouth advocates.

**Files:** New `UserBadge` model, `admin-community-tab.tsx`, extend profile display.

---

### ADM-018 · Cultural Integrity Review Queue (5 SP) ✅ DONE
**Catch content that doesn't belong in this space.**

**Auto-flagging rules (configurable):**
- Posts containing keywords associated with misconceptions or appropriation
- Posts in "Sacred Teachings" categories from users without cultural level ≥ INITIATE
- New user's first post in a sacred category (auto-holds for review)
- Any post flagged by 2+ Elder Reactions of type FLAG

**Admin queue:**
- Review held posts before they go live (approve or reject with reason)
- Set categories as "moderated" (all posts held for review) or "open"
- Manage the keyword watchlist

**Why:** You are building a space for genuine practitioners. Protecting the sacred categories from misinformation and appropriation is part of the platform's promise to the community.

**Files:** Extend `ForumPost` with `heldForReview` status. New moderation queue in admin.

---

## 🟢 Sprint 5 — Growth & Marketing Tools (20 SP)

### ✅ ADM-019 · Segmented Email Campaigns (8 SP)
**Reach the right people with the right message.**

**Segments available:**
- All registered users
- CLIENTs only
- BABALAWOs only
- Devoted subscribers
- Free tier users (conversion targets)
- Users who signed up in the last 30 days (nurture)
- Users who haven't logged in for 30+ days (re-engagement)
- Users in a specific country (UK / Nigeria / USA)

**Campaign builder:**
- Subject line
- Rich text body (with template variables: {{name}}, {{yorubaName}})
- Preview before sending
- Schedule (send now or pick date/time)
- See open rate and click rate after sending (via SES tracking)

**Why:** Email is your highest-leverage marketing channel. Every new feature, every new Babalawo, every Isese Day event deserves a targeted message to the right segment.

**Files:** New `EmailCampaign` model, `admin-campaigns-tab.tsx`, extend SES service.

---

### ✅ ADM-020 · Promo Code & Discount System (7 SP)
**Drive subscriptions and bookings with time-limited offers.**

**Promo types:**
- % discount on Devoted subscription (e.g. 20% off first month)
- Fixed amount off consultation (e.g. ₦2,000 off first booking)
- Free trial extension (e.g. 14-day Devoted trial)
- Referral rewards (credit applied automatically)

**Admin controls:**
- Create code (code string, type, value, max uses, expiry date, eligible roles)
- See redemption count + total discount given
- Deactivate a code immediately
- Assign a code directly to a specific user

**Why:** For launch promotions, community events, partnerships with Yoruba organisations — this is essential. "First 100 members get 3 months Devoted for free." You can't do that without a promo system.

**Files:** New `PromoCode` + `PromoRedemption` models, extend checkout flow, `admin-promos-tab.tsx`.

---

### ✅ ADM-021 · Referral Program Management (5 SP)
**See and control how users bring in other users.**

**Dashboard shows:**
- Total referrals generated
- Conversion rate (referred → registered → Devoted)
- Top referrers this month
- Referral link per user (auto-generated)
- Reward status (who has earned what)

**Controls:**
- Set referral reward (e.g. 1 month free Devoted for referrer + 20% off for referee)
- Toggle referral program on/off
- Manually credit a referral that was missed

**Why:** Word of mouth in spiritual communities is powerful. Structuring and incentivising it turns your community into your sales team.

**Files:** New `Referral` model, admin dashboard tab.

---

## 🟢 Sprint 6 — Deep Analytics & Intelligence (24 SP)

### ADM-022 · User Lifecycle Analytics (8 SP) ✅ DONE
**Understand where users come from, what they do, and why they leave.**

**Funnel tracking:**
- Visitor → Registered (conversion %)
- Registered → First consultation booked
- Registered → Devoted subscriber
- Devoted → Cancelled (churn %)

**Cohort view:**
- Users who signed up in Week X: how many are still active in Week X+4?
- Retention curve chart

**Geographic breakdown:**
- User distribution: UK / Nigeria / USA / Other
- Revenue by geography
- Forum activity by geography (which diaspora communities are most active?)

**Why:** You need to know if the platform is actually retaining people, or if users are signing up and disappearing. The retention curve tells you if your product is working.

**Files:** New analytics service methods, `admin-lifecycle-tab.tsx`.

---

### ADM-023 · Forum Intelligence Dashboard (6 SP)
**Know the health of the forum at a glance.**

**Metrics (the backend for this is already built — F9-903):**
- Most active categories (by posts per day)
- Quietest categories (need attention or seeding)
- Average response time to new threads
- Thread completion rate (threads with at least 3 replies)
- Elder participation rate (% of threads with at least one Babalawo response)
- Top contributors this week
- Posts per day chart (7d / 30d / 90d)

**Admin actions from this view:**
- Seed a quiet category (quick-create a thread as admin)
- Notify a Babalawo to respond to an unanswered question
- Feature a thread that's getting good engagement

**Why:** The forum is your community's heartbeat. If a category goes quiet, you need to know before users notice.

**Files:** Wire existing `GET /forum/admin/metrics` to new `admin-forum-intelligence-tab.tsx`.

---

### ADM-024 · Practitioner Leaderboard & Market Intelligence (5 SP)
**✅ COMPLETE — April 17, 2026**

**Implemented:**
- Service methods: `getPractitionerLeaderboard(sortBy)` with MoM growth calculation
- Market intelligence queries: top practitioners, top specializations, price stats
- Controller endpoints:
  - `GET /admin/market-intelligence/leaderboard?sortBy=bookings|revenue|rating`
  - `GET /admin/market-intelligence/signals`
- Frontend tab `admin-market-intelligence-tab.tsx`:
  - Leaderboard table (top 10 sorted by bookings/revenue/rating)
  - Sort buttons for dynamic filtering
  - Stat cards: avg consultation price, min/max price, top practitioners count
  - Top specializations bar chart (relative participation)
  - Top practitioners this month list
- Wired to admin dashboard (tab: 'market-intelligence')

**Status:** ✅ Production ready, all tests passing

---

### ADM-025 · Revenue Forecasting (5 SP)
**✅ COMPLETE — April 17, 2026**

**Implemented:**
- Service method: `getRevenueForecasts()` with Subscription.amountPaid aggregation
- Controller endpoint: `GET /admin/forecasting/revenue`
- Frontend tab `admin-forecasting-tab.tsx`:
  - Stat cards: Current MRR, Monthly growth %, Projected annual revenue, Break-even countdown
  - Revenue scenarios section (Current MRR, Projected MRR, Churn-adjusted MRR)
  - 3-month trend chart with bar visualization (GMV + platform revenue)
  - Break-even analysis card with warning/success states
  - Key assumptions display (growth rate, churn rate, commission %)
- Wired to admin dashboard (tab: 'forecasting')

**Status:** ✅ Production ready, all tests passing

---

## 🟢 Sprint 7 — Compliance, Security & GDPR (20 SP)

### ADM-026 · GDPR & Data Rights Management (8 SP) ✅ DONE
**Handle legal data obligations professionally.**

**User data rights (from admin panel):**
- **Data Export** — Generate a full export of everything the platform holds on a specific user (profile, posts, messages, transactions, appointments). Download as JSON or PDF. Triggered by user request or admin.
- **Right to Erasure** — Delete a user's personal data while preserving anonymised activity records (for integrity). Strips: name, email, avatar, phone. Replaces with "Deleted User [ID]".
- **Data Audit** — See exactly what data is stored for any user. Useful for subject access requests.

**Consent management:**
- View what each user has consented to and when (marketing emails, data processing)
- Withdraw consent on behalf of user (support request)

**Why:** You have UK users. GDPR is not optional. You will receive data requests. Having a process — even a simple one — keeps you legal and professional.

**Files:** New `DataRequest` model, `admin-compliance-tab.tsx`, add erasure service methods.

---

### ADM-027 · Session & Security Management (5 SP) ✅ DONE
**See and control active sessions across the platform.**

**Per-user security view:**
- Active sessions (device, location, last seen)
- Force logout (invalidate all tokens — useful if account is compromised)
- Login history (last 10 logins: device, IP, timestamp, success/fail)
- Failed login attempts (flag if >5 in 1 hour)

**Platform-wide:**
- Current concurrent users
- Unusual activity alerts (mass logins from single IP, unusual geographic pattern)

**Why:** If a user reports their account has been accessed without permission, or if you see suspicious automated behaviour, you need to act immediately. Right now you can't.

**Files:** Extend Redis session storage with metadata. New `admin-security-tab.tsx`.

---

### ADM-028 · Cultural Orientation Quiz Management (4 SP) ✅ DONE
**Manage the forum gate from the admin panel.**

**Controls:**
- View current 3 quiz questions
- Edit questions and correct answers
- Set pass threshold (currently 2/3)
- View pass/fail rate (how many users are passing vs. struggling)
- Reset a specific user's orientation status (if they claim they passed but were blocked)
- See which questions users fail most (signals where to improve)

**Why:** The cultural orientation gate (F9-902) is live. But the questions are hardcoded. As the community grows you'll want to update them — more nuanced, more relevant, more challenging. This needs to be manageable without code changes.

**Files:** Move questions to DB. New `admin-cultural-quiz-tab.tsx`.

---

### ADM-029 · Trust Score Audit & Override (3 SP) ✅ DONE
**Full transparency into how trust scores are calculated.**

**View:**
- Every component that fed into a practitioner's current trust score
- Timeline of score changes (what happened when)
- Which actions would increase their score next (shown to admin, not practitioner)

**Override:**
- Manual adjustment with required written justification
- Override history visible to all admins

**Already partially covered in ADM-009 — this extends it with the audit trail.**

**Files:** Extend trust score service with audit logging.

---

## 🟢 Sprint 8 — Platform Configuration & Marketplace (20 SP)

### ADM-030 · Platform Settings Panel (6 SP)
**Control platform behaviour without code changes.**

**Configurable settings:**
- Commission rates (consultation %, marketplace %)
- Minimum payout threshold
- Maximum payout without FINANCE approval
- Devoted subscription price (₦/month, ₦/year)
- Feature flags UI (toggle features for all users, or specific users)
- Maintenance mode (with custom message shown to users)
- New user welcome message (shown after registration)
- Forum: max posts per day per user, anonymous posting on/off

**Why:** Currently changing any of these requires a code change and a deploy. This wastes 30 minutes per change and creates deployment risk. Settings should be data, not code.

**Files:** `PlatformSettings` model (key/value store). New `admin-settings-tab.tsx`. Settings read at runtime.

---

### ADM-031 · Marketplace Management (8 SP) ✅ DONE
**Control the marketplace as it grows.**

**Product management:**
- View all product listings (not just pending — all active)
- Remove a product listing (reason logged, vendor notified)
- Feature a product (appears in "Community Picks")
- Manage marketplace categories (create, rename, reorder)
- Flag a product for cultural review (is this item appropriate for this space?)

**Order oversight:**
- See all orders (not just pending payments)
- Intervene in order disputes (mark as resolved, issue refund)
- See vendor fulfilment rate (orders shipped on time %)

**Vendor health:**
- Vendors with complaints
- Vendors with low ratings
- Vendors who haven't logged in for 30+ days

**Why:** As the marketplace grows, you need to ensure it stays culturally appropriate and operationally reliable. A vendor who lists "Yoruba curse removal" kits or stops fulfilling orders damages the platform's trust.

**Files:** Extend marketplace service, new `admin-marketplace-tab.tsx`.

---

### ADM-032 · Academy Management (6 SP) ✅ DONE
**Manage courses and enrollments from admin.**

**Course management:**
- Feature a course (appears prominently in Academy home)
- Approve new courses submitted by Babalawos
- Remove or hide a course (reason logged)
- See enrollment stats per course (enrolled, completed, dropped)

**Enrollment management:**
- Manually enrol a user in a course (e.g. gift a course to a community member)
- Remove a user from a course
- Issue a certificate from admin UI (API already exists)
- Revoke a certificate with reason

**Analytics:**
- Top courses by enrollment
- Completion rate per course
- Revenue per course (if paid)
- Courses with no enrollments (may need promotion)

**Why:** The Academy is a significant trust-building and monetisation feature. Admin needs visibility into what is working and the ability to intervene.

**Files:** Extend course/enrollment service, `admin-academy-tab.tsx`.

---

## Implementation Order

When ready to build, do sprints in this order:

| Sprint | Focus | SP | Impact |
|--------|-------|----|--------|
| Sprint 1 | Daily Operations (ADM-001 to 005) | 36 | 🔴 Immediate |
| Sprint 2 | Practitioner Operations (ADM-006 to 010) | 28 | 🟡 Week 2 |
| Sprint 3 | Revenue Operations (ADM-011 to 014) | 28 | 🟡 Week 3 |
| Sprint 4 | Content & Community (ADM-015 to 018) | 24 | 🟡 Month 2 |
| Sprint 5 | Growth Tools (ADM-019 to 021) | 20 | 🟢 Month 2 |
| Sprint 6 | Analytics & Intelligence (ADM-022 to 025) | 24 | 🟢 Month 3 |
| Sprint 7 | Compliance & Security (ADM-026 to 029) | 20 | 🟢 Month 3 |
| Sprint 8 | Platform Config & Marketplace (ADM-030 to 032) | 20 | 🟢 Month 4 |

**Total: 200 SP across 32 stories**

---

## Recommendations for a Solo Founder

1. **Do Sprint 1 first, completely.** The Morning Dashboard + user role management + announcements alone will transform how you run the platform. Without it you are flying blind.

2. **Don't skip GDPR (ADM-026).** UK users = UK law. One serious data request handled badly is a legal and reputational problem. Keep it simple but have the process.

3. **Email campaigns (ADM-019) are your highest-leverage growth tool.** Every new Babalawo who joins should trigger an email to all CLIENTs: "A new practitioner has joined — meet [name]." You can do this manually for now. But build the system by Month 2.

4. **The Cultural Content Calendar (ADM-015) is your differentiation.** No other platform does this. Schedule the Oral History archive seeding for Isese Day (August 20). Use the festival calendar to plan content months ahead.

5. **Revenue Forecasting (ADM-025) is not vanity.** Knowing your runway and break-even in real numbers changes how you make decisions. Build it before you need it.

---

*"A good Babalawo prepares the tools before the client arrives."*
*Build the admin room before you need it. You'll need it sooner than you think.*

---

## 🤖 Instructions for Lingma (AI Agent Handoff)

**Read this section before touching any admin backlog story.**

### What has been completed (do NOT rebuild)

| Story | Status | Key files |
|-------|--------|-----------|
| ADM-001 | ✅ DONE | `GET /admin/morning-brief`, `admin-morning-brief-tab.tsx` |
| ADM-002 | ✅ DONE | Role change dialog, audit log, `admin-user-management-tab.tsx` |
| ADM-003 | ✅ DONE | `suspendedUntil`/`bannedAt`/`banReason`/`warnCount` in schema |
| ADM-004 | ✅ DONE | Forum category CRUD wired |
| ADM-005 | ✅ DONE | `Announcement` model + `admin-announcements-tab.tsx` |
| ADM-006 | ✅ DONE | `admin-practitioners-tab.tsx` |
| ADM-007 | ✅ DONE | `isFeatured`/`featuredOrder`/`featuredExpiry` on User |
| ADM-008 | ✅ DONE | `PractitionerComplaint` model + `admin-complaints-tab.tsx` |
| ADM-009 | ✅ DONE | `trustScoreOverride` fields, trust score endpoints |
| ADM-010 | ✅ DONE | Inactive practitioner re-engagement |
| ADM-011 | ✅ DONE | Financial Command Centre, `admin-financial-command-tab.tsx` |
| ADM-012 | ✅ DONE | `RefundRequest` model + `admin-refunds-tab.tsx` |
| ADM-013 | ✅ DONE | Subscription management tab |
| ADM-014 | ✅ DONE | `PlatformSettings` singleton + `admin-settings-tab.tsx` |
| ADM-015 | ✅ DONE | `OralHistoryEntry` + `SacredCalendarEvent` models |
| ADM-016 | ✅ DONE | `isFeatured`/`featuredUntil` on ForumThread/Product/Course/Circle |
| ADM-017 | ✅ DONE | `UserBadge` model + `admin-community-tab.tsx` |
| ADM-018 | ✅ DONE | `ContentFlagRule` + `heldForReview` on ForumPost |
| ADM-019 | ✅ DONE | `EmailCampaign` model + `admin-campaigns-tab.tsx` |
| ADM-020 | ✅ DONE | `PromoCode` + `PromoRedemption` models + `admin-promos-tab.tsx` |
| ADM-021 | ✅ DONE | `admin-referrals-tab.tsx` |
| ADM-022 | ✅ DONE | `admin-lifecycle-tab.tsx`, cohort retention, funnel |
| ADM-023 | ✅ DONE | `GET /forum/admin/metrics` → `admin-forum-intelligence-tab.tsx` |
| ADM-024 | ✅ DONE | Practitioner leaderboard + market intelligence |
| ADM-025 | ✅ DONE | Revenue forecasting tab |
| ADM-026 | ✅ DONE | GDPR: `GdprModule`, `GET/DELETE /gdpr/*`, `GdprSettingsPanel.tsx` |
| ADM-027 | ✅ DONE | `UserSession` model, login logging in auth service, `admin-security-tab.tsx` |

### Remaining stories (do these in order)

**ADM-028 — Cultural Orientation Quiz Management (4 SP) ← DO NEXT**
- Move hardcoded quiz questions from `forum.service.ts` to a new `CulturalQuizQuestion` DB model
- Migration: `20260418000001_add_cultural_quiz_questions`
- Admin endpoints: GET/POST/PATCH/DELETE `/admin/quiz/questions`, `GET /admin/quiz/stats`, `PATCH /admin/quiz/threshold`, `POST /admin/quiz/users/:userId/reset`
- Frontend: `admin-cultural-quiz-tab.tsx` — list/edit questions, pass threshold slider, fail stats, user reset
- Wire tab into `admin-dashboard-view.tsx` as `'cultural-quiz'`

**ADM-029 — Trust Score Audit (3 SP)**
- Add `TrustScoreAuditEntry` model to track score change events
- Log score changes in `recomputeTrustScore()` in `users.service.ts`
- Endpoint: `GET /admin/trust-scores/audit/:userId` — full timeline
- Extend `admin-trust-scores-tab.tsx` (already exists) with audit trail drawer

**ADM-030 — Platform Settings Panel (6 SP)**
- `PlatformSettings` singleton model ALREADY EXISTS in schema (added ADM-014)
- The `admin-settings-tab.tsx` ALREADY EXISTS — extend it, do NOT recreate
- Add missing settings: feature flags, maintenance mode, welcome message, forum limits

**ADM-031 — Marketplace Management (8 SP)**
- Endpoints: all-products list, feature product, remove product, manage categories, all-orders view, vendor health stats
- New file: `admin-marketplace-tab.tsx`
- Wire tab as `'marketplace-admin'`

**ADM-032 — Academy Management (6 SP)**
- Endpoints: feature course, approve/hide course, enrollment stats, manual enroll/remove, certificate issue/revoke, analytics
- New file: `admin-academy-tab.tsx`
- Wire tab as `'academy-admin'`

### Rules Lingma MUST follow

1. **Never zero out a file.** If a Python/sed write fails mid-operation, check if the file is now 0 bytes and restore from git immediately: `git show HEAD:path/to/file > path/to/file`

2. **Never append methods outside the class closing brace.** When appending to a service file, check `grep -n "^}" file.ts` first to confirm only import-block braces exist, then either: (a) remove the class `}` before appending and re-add it after, or (b) insert before the last `}`.

3. **Always run `npx prisma generate` after schema changes** — not just `prisma migrate dev`. When DB is not running locally, create the migration SQL manually in `backend/prisma/migrations/YYYYMMDDNNNNNN_name/migration.sql`.

4. **Use `api` from `@/lib/api`** for all frontend HTTP calls — never raw `fetch` with manual `Authorization` headers.

5. **Wire every new tab into `admin-dashboard-view.tsx`** — add to the `AdminTab` union type, the `sections` array (with icon), AND the `renderTab()` switch case.

6. **Run both build checks before declaring done:**
   - Backend: `cd backend && npm run build` (must show no `error TS`)
   - Frontend: `cd frontend && npx tsc --noEmit` (must show no `error TS`)

7. **Never import from files that don't exist.** If Lingma creates a component that depends on a missing module, create stub files or remove the import.

8. **Always read the schema before writing Prisma queries.** Field names differ from what you might guess — check `backend/prisma/schema.prisma` for exact field names on any model you query.

9. **When restoring from git**, use: `git show HEAD:relative/path/to/file > absolute/path/to/file`

10. **Python scripts must use `encoding='utf-8'`** on both read and write. The codebase contains Yoruba characters (ọ, ẹ, à, etc.) that break cp1252.
