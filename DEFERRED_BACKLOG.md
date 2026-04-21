# DEFERRED_BACKLOG.md — OBSOLETE

**Status:** ✅ CONSOLIDATED into Z1_BACKLOG.md
**Date:** April 19, 2026
**Reason:** Deferred features catalogued and prioritized for completion.

**What was here:**
- D1 through D11: Features deferred during MVP development
- Status: D3 and D4 completed, D1-D2,D5-D11 remaining
- All items verified against current codebase status

**Remaining Work:**
- Z1-802 — Spiritual Journey Tracker (30 SP)
- Z1-501 — Elder Oversight Panel (20 SP)
- Z1-801 — Circle Patron Tier (20 SP)
- Z1-502 — Granular RBAC Matrix (25 SP)
- Z1-201 — Flutterwave Live Keys (5 SP)
- Z1-503 — Push Notifications (15 SP)
- Z1-101 — Sentry Production Integration (8 SP)
- Z1-601 — Backend Unit Tests 80% (40 SP)
- Z1-602 — Frontend Component Tests 60% (25 SP)

**New Location:** See Z1_BACKLOG.md for all deferred feature work with implementation priorities.

---

*This document is now obsolete. All remaining work has been consolidated into Z1_BACKLOG.md with unique routing codes.*

---

# Deferred Feature Backlog — Ìlú Àṣẹ

---

## D1 — Spiritual Journey (EPIC-014 / V4-708)
**Origin:** V1_PRODUCT_BACKLOG.md EPIC-014; V4-708 explicitly deferred in CLAUDE.md
**Priority:** P3 — "may revisit later in 2026"
**Route exists:** `/journey/*` ✅ (routed but feature inactive)

**What it is:** A guided multi-stage spiritual development tracker. Users log initiations, Odù study milestones, ceremony attendance. Visualised as a journey map.

**Why deferred:** Scope too large for launch. Sacred content gatekeeping design decisions needed from platform owner.

**When to revisit:** After community establishes active forum + consultation usage patterns. Requires elder advisory input on what stages to track.

**Estimated effort:** 30–40 SP

---

## D2 — Elder Oversight Panel
**Origin:** Sprint M2 plan file (deferred section)
**Priority:** P2

**What it is:** A dedicated dashboard tab for verified elders (BABALAWO role, high trust score) to review and endorse forum threads, flag content, and weigh in on disputes — without full ADMIN access.

**Why deferred:** Requires new permission layer between BABALAWO and ADMIN. RBAC matrix needs to be defined first (see D5).

**Estimated effort:** 20 SP

---

## D3 — Sentiment / Risk Alerts in Forum ✅ DONE
**Origin:** Sprint M2 plan file (deferred section)
**Priority:** P2

**What it is:** Keyword/pattern matching on new forum posts to surface crisis signals (e.g. suicidal ideation, exploitation language) to admins in real-time. A `crisisSignal` flag already exists on `ForumPost` in the schema.

**Schema:** `hasCrisisSignal Boolean @default(false)` on `ForumPost` ✅

**What was built:**
- `detectCrisis()` keyword engine in `forum.service.ts` (English + Yoruba patterns)
- `hasCrisisSignal` set on flagged posts at creation time
- `notifyAdmins()` fires in-app notifications to all ADMIN users on flag
- `GET /forum/admin/crisis-signals` — paginated list of flagged posts
- `PATCH /forum/admin/crisis-signals/:postId/clear` — mark reviewed
- `admin-crisis-alerts-tab.tsx` — admin UI with post content, author, thread link, "Mark as Reviewed" action
- Crisis resources modal in `thread-view.tsx` shown to the user who triggered the flag

**Estimated effort:** 15 SP

---

## D4 — Practitioner Performance Dashboard ✅ DONE
**Origin:** Sprint M2 plan file (deferred section)
**Priority:** P2

**What it is:** A Babalawo-facing analytics view: consultation volume, average rating, repeat client rate, income over time, guidance plan completion rates.

**Why deferred:** Requires aggregation queries across appointments, reviews, and prescriptions. Needs enough real data to be meaningful.

**Estimated effort:** 12 SP

---

## D5 — Circle Patron Tier
**Origin:** Sprint M2 plan file (deferred section)
**Priority:** P2

**What it is:** A paid membership tier for Circles (community groups). Patrons get exclusive threads, early event access, and direct messaging with circle leaders.

**Why deferred:** Requires Devoted/subscription system integration with Circles. Devoted system (V8) is complete — the wiring between the two is the missing piece.

**Estimated effort:** 10 SP

---

## D6 — Granular RBAC Matrix
**Origin:** Sprint M2 plan file (deferred section)
**Priority:** P2

**What it is:** Replace the current role-based guards (CLIENT/BABALAWO/VENDOR/ADMIN) with a permission matrix. E.g. a BABALAWO with `canModerateTemple` permission can moderate their own temple's forum threads without being a full ADMIN.

**Why deferred:** Current role system is sufficient for launch. Fine-grained permissions are needed once Elder Oversight Panel (D2) and Circle Patron (D5) are built.

**Estimated effort:** 25 SP

---

## D7 — Flutterwave Live Payment Integration
**Origin:** CLAUDE.md ("Stripe live keys in Secrets Manager — BLOCKING launch")
**Priority:** P1 — Blocking real transactions

**What it is:** The payment gateway code exists and Flutterwave is the configured provider. The marketplace checkout flow has a demo completion path. Live keys need to be configured in AWS Secrets Manager and the actual Flutterwave webhook for payment confirmation needs to be hardened.

**Why deferred:** Live keys held by platform owner. AWS Secrets Manager configuration needed on infrastructure side.

**What's needed:**
- `FLUTTERWAVE_SECRET_KEY` in AWS Secrets Manager (production)
- Webhook endpoint `POST /payments/flutterwave/webhook` — verify, harden
- Remove demo payment completion fallback in checkout

**Estimated effort:** 5 SP (config + hardening, code largely exists)

---

## D8 — Push Notifications (Firebase)
**Origin:** V2 production hardening backlog
**Priority:** P2

**What it is:** Firebase Cloud Messaging for mobile/browser push notifications. The `firebase-admin` package is installed and configured. Notification triggers exist (appointments, orders, messages) but only email/WhatsApp channels are active.

**Why deferred:** FCM requires device token registration flow on the frontend (service worker + permission prompt). Not built yet.

**Estimated effort:** 12 SP

---

## D9 — Sentry Error Tracking
**Origin:** CLAUDE.md V2 status — "Error tracking: ❌ None (target: ✅ Sentry)"
**Priority:** P1 — Production observability gap

**What it is:** Sentry SDK integration for both frontend (React) and backend (NestJS). Captures unhandled exceptions, API errors, and slow transactions in production.

**Why deferred:** Not critical to launch functionality. Operational debt.

**What's needed:**
- `SENTRY_DSN` in AWS Secrets Manager
- `@sentry/react` + `@sentry/nestjs` installed and initialised
- Source maps uploaded on deploy

**Estimated effort:** 4 SP

---

## D10 — Backend Unit Test Coverage
**Origin:** CLAUDE.md V2 status — "Backend unit test coverage: 3% (target: 80%)"
**Priority:** P2

**What it is:** Jest unit tests for core backend services: auth, appointments, marketplace, payments, prescriptions, wallet, forum.

**Why deferred:** Platform was built feature-first for April 2026 launch. Test coverage was acknowledged as technical debt.

**Estimated effort:** 40–60 SP

---

## D11 — Frontend Component Test Coverage
**Origin:** CLAUDE.md V2 status — "Frontend component coverage: 0% (target: 60%)"
**Priority:** P2

**What it is:** Vitest + React Testing Library tests for key components: booking flow, checkout, forum post/thread, auth forms, vendor product form.

**Estimated effort:** 30–40 SP

---

## Summary Table

| ID | Feature | Priority | Effort | Blocking? |
|----|---------|----------|--------|-----------|
| D1 | Spiritual Journey | P3 | 30–40 SP | No |
| D2 | Elder Oversight Panel | P2 | 20 SP | No |
| D3 | Forum Sentiment/Risk Alerts | P2 | 15 SP | No | ✅ DONE |
| D4 | Practitioner Performance Dashboard | P2 | 12 SP | No |
| D5 | Circle Patron Tier | P2 | 10 SP | No |
| D6 | Granular RBAC Matrix | P2 | 25 SP | No |
| D7 | Flutterwave Live Keys | P1 | 5 SP | **YES — real transactions** |
| D8 | Push Notifications (Firebase) | P2 | 12 SP | No |
| D9 | Sentry Error Tracking | P1 | 4 SP | No (observability gap) |
| D10 | Backend Unit Tests | P2 | 40–60 SP | No |
| D11 | Frontend Component Tests | P2 | 30–40 SP | No |

**P1 items to address next:** D7 (Flutterwave live keys), D9 (Sentry)
