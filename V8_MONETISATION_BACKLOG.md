> ⚠️ **SUPERSEDED as of July 28, 2026** — see [`ILUASE_V1_BACKLOG.md`](ILUASE_V1_BACKLOG.md) for the current single source of truth on remaining work across the whole platform. This file is kept for its detailed per-story write-ups only; don't use it to decide what to work on next.

# V8: MONETISATION & THE DEVOTED TIER
## Ìlú Àṣẹ — Subscription, Billing & Premium Features Backlog

**Phase:** V8 — Turning the platform into a sustainable business
**Goal:** Real recurring revenue. Real subscriber data. Real premium features.
**Total Story Points:** 102 SP across 5 sprints
**Labels:** `V8-XXX` (this phase)
**Branch:** `v8/monetisation` → merge to `IfaAppV1` after each sprint smoke test

---

## 📍 CURRENT STATUS (updated July 28, 2026)

**28 of 30 stories are ✅ DONE.** Every story below now has its own `**Status:**` line — read that instead of the checkboxes above it if you want the real state; the checkboxes were the original plan and are left as-is for history, but several turned out to describe UI/logic that either already existed differently than planned, or had real bugs the checkboxes didn't catch.

**The 2 exceptions:**
- **V8-103** (Paystack Plan Setup) — 🟡 blocked on a human. The code fails loudly if it's missing, but someone needs to actually log into the Paystack dashboard, create the two Plans, and set the real env vars in production before checkout can take payments.
- **V8-206** (Messaging Limits) and **V8-303** (Priority Booking) — 🟡 backend fully correct in both, but the frontend has nothing to attach to: booking/consultations/1:1 messaging are paused platform-wide per `MVP_PIVOT_BACKLOG.md`. Revisit when those un-pause.

**Bugs found and fixed along the way that weren't in the original checkboxes at all** (surfaced by a full code audit against this doc, not by the plan itself):
- V8-503: unlimited free subscription-pause exploit (no repeat-call protection existed)
- V8-501/502: two independent referral-reward systems shared one flag, so only one of the two rewards could ever pay out per referral
- V8-201: `useSubscription()` failed *closed*, not open, on API errors — could lock out real paying subscribers
- V8-404/504: no automatic cron ever existed for renewal reminders or win-back emails (both were reactive/manual-only); a related pre-existing gap (nothing ever marked a lapsed subscription `EXPIRED`) was found and fixed alongside
- V8-305: forum XP used a second, un-multiplied, differently-thresholded system from Academy XP — inconsistent displayed cultural levels
- V8-301: profile-view logging broke silently on any repeat visit after 24h (create-only where an upsert was needed)
- V8-306: no referral-code backfill existed for pre-existing users, and a code collision could fail registration outright
- V8-304: Devoted free delivery applied to international orders too, contradicting its own "local only" rule
- V8-204: the circle-join UI silently faked a successful join on *any* backend error, including a correct 403 rejection

One thing explicitly **not fixed, flagged instead**: V8-305 says cultural-level 2× should apply to event attendance — there is no attendance-tracking mechanism anywhere in this codebase to multiply. Building that is a new feature, not a bug fix.

---

## 🗺️ TABLE OF CONTENTS

1. [Why This Phase Exists](#1-why-this-phase-exists)
2. [The One Blocker That Blocks Everything](#2-the-one-blocker-that-blocks-everything)
3. [System Architecture](#3-system-architecture)
4. [Sprint Overview](#4-sprint-overview)
5. [Sprint 1 — Billing Foundation](#5-sprint-1--billing-foundation-28-sp)
6. [Sprint 2 — Feature Gating Engine](#6-sprint-2--feature-gating-engine-22-sp)
7. [Sprint 3 — Devoted Features](#7-sprint-3--devoted-features-24-sp)
8. [Sprint 4 — Subscription Management & Admin](#8-sprint-4--subscription-management--admin-16-sp)
9. [Sprint 5 — Referral & Retention](#9-sprint-5--referral--retention-12-sp)
10. [What We Are NOT Building Yet](#10-what-we-are-not-building-yet)
11. [Definition of Done](#11-definition-of-done)
12. [Risk Registry](#12-risk-registry)

---

## 1. WHY THIS PHASE EXISTS

### The Platform Today

```
✅ Looks beautiful
✅ All features built
✅ Live at iluase.com
✅ 199 temples imported
✅ Real users can sign up

❌ Makes zero money
❌ No way to charge users
❌ Premium features listed on pricing page — but not locked
❌ No billing history
❌ No subscriber data for decisions
```

### What V8 Fixes

V8 turns the platform from a **free service** into a **sustainable sacred economy**.

After V8:
- Devoted plan is **real** — users pay, get access, get features
- Practitioners see **priority indicators** for Devoted clients
- Admin sees **revenue, churn, subscriber count** in real time
- Platform has a **referral system** that grows itself

---

## 2. THE ONE BLOCKER THAT BLOCKS EVERYTHING

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   NO SUBSCRIPTION SYSTEM                               │
│                                                         │
│   ↓ Which means...                                      │
│                                                         │
│   No way to charge users for Devoted plan               │
│   No way to know who is a Devoted subscriber            │
│   No way to gate premium features                       │
│   No revenue                                            │
│   No business                                           │
│                                                         │
│   SPRINT 1 FIXES THIS ENTIRELY                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### The Unlock Chain

```
Paystack Integration  ──▶  Subscription in DB  ──▶  User knows their tier
        │
        ▼
Webhook confirms payment ──▶  subscriptionStatus = 'DEVOTED'
        │
        ▼
Frontend reads status ──▶  FeatureGate component unlocks/locks features
        │
        ▼
SPRINT 1 unlocks ALL of Sprint 2, 3, 4, 5
```

> **Rule:** Do not start Sprint 2 until Sprint 1 is fully done and tested.

---

## 3. SYSTEM ARCHITECTURE

### New Database Tables

```
Subscription
├── id
├── userId          → User.id
├── plan            → 'QUARTERLY' | 'ANNUAL'
├── status          → 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE'
├── paystackSubId   → Paystack subscription code
├── startDate
├── endDate
├── autoRenew       → Boolean
├── amountPaid      → Int (kobo)
├── currency        → 'NGN'
├── createdAt
└── updatedAt

ProfileView
├── id
├── viewerId        → User.id (who looked)
├── profileId       → User.id (whose profile)
└── viewedAt        → DateTime

Referral
├── id
├── referrerId      → User.id
├── referredId      → User.id
├── code            → String (unique)
├── rewardGranted   → Boolean
└── createdAt
```

### Updated User Model Fields

```
User
├── ... (existing fields)
├── subscriptionStatus  → 'FREE' | 'DEVOTED' | 'EXPIRED'  ← NEW
├── subscriptionEnd     → DateTime?                         ← NEW
└── referralCode        → String (unique, auto-generated)  ← NEW
```

### New Backend Endpoints

```
POST   /subscriptions/initiate        → Create Paystack subscription, return checkout URL
POST   /subscriptions/webhook         → Paystack sends events here (payment, cancel, expire)
GET    /subscriptions/me              → My current subscription status
POST   /subscriptions/cancel          → Cancel at end of period
GET    /subscriptions/history         → My billing history

POST   /profile-views/:userId         → Log a profile view
GET    /profile-views/mine            → Get who viewed my profile (Devoted only)

POST   /referrals/generate            → Generate my referral code
GET    /referrals/mine                → My referral stats
POST   /referrals/apply               → Apply a referral code on signup
```

### Frontend New Files

```
frontend/src/
├── features/
│   ├── subscription/
│   │   ├── subscription-checkout-page.tsx    ← Pricing → Paystack flow
│   │   ├── subscription-manage-page.tsx      ← Cancel, billing history
│   │   ├── use-subscription.ts               ← Hook: current tier + status
│   │   └── feature-gate.tsx                  ← Wrapper component for gating
│   ├── devoted/
│   │   ├── profile-views-panel.tsx           ← "Who viewed your profile"
│   │   └── referral-panel.tsx                ← Your referral link + stats
```

---

## 4. SPRINT OVERVIEW

| # | Sprint Name | Points | What It Delivers |
|---|-------------|--------|------------------|
| 1 | Billing Foundation | 28 SP | Paystack wired. Users can pay. Subscription stored. |
| 2 | Feature Gating Engine | 22 SP | Features lock/unlock based on real subscription status. |
| 3 | Devoted Features | 24 SP | Profile views, priority booking, free delivery, 2x levels. |
| 4 | Subscription Management & Admin | 16 SP | Cancel, billing history, admin revenue dashboard. |
| 5 | Referral & Retention | 12 SP | Referral links, pause-not-cancel, win-back flow. |
| | **TOTAL** | **102 SP** | |

### Story Point Scale

| Points | Effort | Time |
|--------|--------|------|
| 1 SP | Trivial | < 30 min |
| 2 SP | Small | 30 min – 2 hrs |
| 3 SP | Medium | 2 – 4 hrs |
| 5 SP | Large | Half a day |
| 8 SP | Very Large | Full day |

---

## 5. SPRINT 1 — BILLING FOUNDATION (28 SP)

> **Goal:** A real user can pay for Devoted. Payment is confirmed by Paystack webhook. `subscriptionStatus` updates on their account. Everything else depends on this working.

---

### V8-101 — Subscription Schema + Migration (3 SP)

**What:** Add `Subscription` table and new fields to `User` to the Prisma schema.

**Files:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260322_add_subscription/migration.sql`

**Schema additions:**

```prisma
model Subscription {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  plan            SubscriptionPlan
  status          SubscriptionStatus @default(ACTIVE)
  paystackSubId   String?  @unique
  startDate       DateTime
  endDate         DateTime
  autoRenew       Boolean  @default(true)
  amountPaid      Int      // kobo
  currency        String   @default("NGN")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("subscriptions")
}

enum SubscriptionPlan {
  QUARTERLY
  ANNUAL
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PAST_DUE
}

// Add to User model:
subscriptionStatus  String @default("FREE")   // 'FREE' | 'DEVOTED' | 'EXPIRED'
subscriptionEnd     DateTime?
referralCode        String? @unique
subscriptions       Subscription[]
```

**SQL migration:**

```sql
ALTER TABLE "users"
  ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'FREE',
  ADD COLUMN "subscriptionEnd" TIMESTAMP,
  ADD COLUMN "referralCode" TEXT;

CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "paystackSubId" TEXT,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "autoRenew" BOOLEAN NOT NULL DEFAULT true,
  "amountPaid" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "subscriptions_paystackSubId_key" ON "subscriptions"("paystackSubId");
```

**Acceptance Criteria:**
- [x] `prisma migrate deploy` runs with no errors
- [x] `User` table has `subscriptionStatus`, `subscriptionEnd`, `referralCode` columns
- [x] `subscriptions` table exists with all columns
- [x] Existing users unaffected (default `subscriptionStatus = 'FREE'`)

**Status: ✅ DONE (verified July 27, 2026)** — `Subscription`/`ProfileView`/`Referral` models and the `User` fields all exist in `backend/prisma/schema.prisma`, with real applied migrations (`20260322000001_add_subscription_system` and later additions).

---

### V8-102 — NestJS Subscription Module (3 SP)

**What:** Create the NestJS module, service, and controller scaffolding.

**Files to create:**
- `backend/src/subscriptions/subscriptions.module.ts`
- `backend/src/subscriptions/subscriptions.service.ts`
- `backend/src/subscriptions/subscriptions.controller.ts`
- `backend/src/subscriptions/dto/initiate-subscription.dto.ts`

**Module structure:**

```typescript
// subscriptions.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})

// Register in AppModule
```

**DTO:**

```typescript
// initiate-subscription.dto.ts
export class InitiateSubscriptionDto {
  @IsEnum(['QUARTERLY', 'ANNUAL'])
  plan: 'QUARTERLY' | 'ANNUAL';
}
```

**Acceptance Criteria:**
- [x] Module registers without errors on backend start
- [x] `GET /subscriptions/me` returns `{ status: 'FREE' }` for non-subscribers
- [x] Module imported in `AppModule`

**Status: ✅ DONE (verified July 27, 2026)** — full `SubscriptionsModule`/`SubscriptionsService`/`SubscriptionsController` exist and are registered in `AppModule`.

---

### V8-103 — Paystack Plan Setup (2 SP)

**What:** Create the two Devoted plans in the Paystack dashboard and store their plan codes in environment variables.

**Paystack Dashboard Steps:**
1. Log in to [dashboard.paystack.com](https://dashboard.paystack.com)
2. Products → Plans → Create Plan
3. Create:
   - **Devoted Quarterly**: ₦25,000, interval: `quarterly`, name: `devoted_quarterly`
   - **Devoted Annual**: ₦100,000, interval: `annually`, name: `devoted_annual`
4. Note both Plan Codes (e.g. `PLN_xxxx`)

**Environment variables to add:**

```bash
# backend/.env.production (+ AWS Secrets Manager)
PAYSTACK_SECRET_KEY=sk_live_xxxx
PAYSTACK_DEVOTED_QUARTERLY_PLAN=PLN_xxxx
PAYSTACK_DEVOTED_ANNUAL_PLAN=PLN_xxxx
PAYSTACK_WEBHOOK_SECRET=xxxx   # From Paystack dashboard → Settings → Webhooks
```

**Acceptance Criteria:**
- [ ] Both plans exist in Paystack dashboard — **⚠️ NOT DONE, needs a human with Paystack dashboard access**
- [ ] Plan codes stored in Secrets Manager — **⚠️ NOT DONE**, same reason
- [x] Backend can read `process.env.PAYSTACK_SECRET_KEY`

**Status: 🟡 PARTIAL (July 27, 2026)** — this is the one V8 story that genuinely cannot be finished by an AI agent: it requires an actual Paystack dashboard account to create the two Plans and copy their real `plan_code`s. What *was* fixed in code: previously, if `PAYSTACK_DEVOTED_QUARTERLY_PLAN`/`PAYSTACK_DEVOTED_ANNUAL_PLAN` were unset, `initiateSubscription()` silently sent `plan: undefined` to Paystack — which creates a one-time charge instead of a real recurring subscription, with no error anywhere. It now throws a clear error instead (see `subscriptions.service.ts`). The three required env vars are documented with setup instructions in `backend/.env.example`. **Action needed from a human:** log into the Paystack dashboard, create the Quarterly/Annual Plans, and set `PAYSTACK_DEVOTED_QUARTERLY_PLAN`, `PAYSTACK_DEVOTED_ANNUAL_PLAN`, and `PAYSTACK_WEBHOOK_SECRET` in production before this feature can actually take payments.

---

### V8-104 — POST /subscriptions/initiate (5 SP)

**What:** When a user clicks "Start Your Journey" on the pricing page, the backend creates a Paystack subscription checkout URL and returns it. The frontend redirects the user to Paystack's hosted page.

**Files:**
- `backend/src/subscriptions/subscriptions.service.ts`
- `backend/src/subscriptions/subscriptions.controller.ts`

**Flow:**

```
User clicks "Start Your Journey" (Quarterly or Annual)
  ↓
Frontend: POST /subscriptions/initiate { plan: 'QUARTERLY' }
  ↓
Backend: Call Paystack Initialize Transaction API
  - amount: 2500000 (quarterly) or 10000000 (annual) — in kobo
  - email: user.email
  - plan: PAYSTACK_DEVOTED_QUARTERLY_PLAN (or ANNUAL)
  - callback_url: https://iluase.com/subscription/confirm
  - metadata: { userId, plan }
  ↓
Backend returns: { checkoutUrl: 'https://checkout.paystack.com/xxx' }
  ↓
Frontend: window.location.href = checkoutUrl
  ↓
Paystack handles payment
  ↓
On success: Paystack redirects to callback_url
```

**Service method:**

```typescript
async initiateSubscription(userId: string, plan: 'QUARTERLY' | 'ANNUAL') {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  const planCode = plan === 'QUARTERLY'
    ? process.env.PAYSTACK_DEVOTED_QUARTERLY_PLAN
    : process.env.PAYSTACK_DEVOTED_ANNUAL_PLAN;
  const amount = plan === 'QUARTERLY' ? 2500000 : 10000000;

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount,
      plan: planCode,
      callback_url: 'https://iluase.com/subscription/confirm',
      metadata: { userId, plan },
    }),
  });
  const data = await response.json();
  return { checkoutUrl: data.data.authorization_url };
}
```

**Acceptance Criteria:**
- [x] `POST /subscriptions/initiate { plan: "QUARTERLY" }` returns `{ checkoutUrl }`
- [x] Requires auth (JWT guard)
- [x] Uses correct plan code per plan type
- [x] Error if user not found

**Status: ✅ DONE (verified July 27, 2026)** — implemented and working; also now fails loudly instead of silently degrading if plan codes aren't configured (see V8-103).

---

### V8-105 — Paystack Webhook Handler (8 SP)

**What:** This is the **most important endpoint in the entire monetisation sprint.** Paystack calls this URL when payment succeeds, fails, subscription cancels, or expires. Without this, no subscription is ever recorded.

**Files:**
- `backend/src/subscriptions/subscriptions.controller.ts`
- `backend/src/subscriptions/subscriptions.service.ts`

**Events to handle:**

| Paystack Event | What We Do |
|----------------|-----------|
| `subscription.create` | Create `Subscription` row, set user `subscriptionStatus = 'DEVOTED'` |
| `invoice.payment_failed` | Set status to `PAST_DUE`, email user |
| `subscription.disable` | Set status to `CANCELLED`, set `subscriptionEnd` |
| `subscription.expiry_card` | Email user to update card |
| `charge.success` (renewal) | Update `endDate`, confirm `ACTIVE` |

**Signature verification (REQUIRED — do not skip):**

```typescript
// In controller — raw body needed for signature check
@Post('webhook')
@HttpCode(200)
async handleWebhook(
  @Headers('x-paystack-signature') signature: string,
  @Req() req: RawBodyRequest<Request>,
) {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest('hex');

  if (hash !== signature) {
    throw new UnauthorizedException('Invalid webhook signature');
  }

  const event = JSON.parse(req.rawBody.toString());
  await this.subscriptionsService.handleWebhookEvent(event);
  return { received: true };
}
```

**Service handler:**

```typescript
async handleWebhookEvent(event: PaystackWebhookEvent) {
  const { event: type, data } = event;

  if (type === 'subscription.create') {
    const { userId, plan } = data.metadata;
    const months = plan === 'QUARTERLY' ? 3 : 12;
    const endDate = addMonths(new Date(), months);

    await this.prisma.subscription.create({
      data: {
        userId,
        plan,
        status: 'ACTIVE',
        paystackSubId: data.subscription_code,
        startDate: new Date(),
        endDate,
        amountPaid: data.amount,
        currency: 'NGN',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'DEVOTED',
        subscriptionEnd: endDate,
      },
    });
  }

  if (type === 'subscription.disable') {
    await this.prisma.subscription.updateMany({
      where: { paystackSubId: data.subscription_code },
      data: { status: 'CANCELLED' },
    });
    await this.prisma.user.update({
      where: { id: data.metadata.userId },
      data: { subscriptionStatus: 'EXPIRED' },
    });
  }

  // Handle other events...
}
```

**Important:** Register this endpoint in `AppModule` with raw body parsing enabled. Paystack signature check fails if body is parsed as JSON first.

**Acceptance Criteria:**
- [x] Webhook endpoint is public (no JWT guard — Paystack cannot authenticate)
- [x] Signature verified on every request — invalid signatures return 401
- [x] `subscription.create` → row created, user marked DEVOTED
- [x] `subscription.disable` → row updated, user marked EXPIRED
- [x] Returns 200 to Paystack within 10 seconds (even on error — log, don't throw)
- [ ] Test with Paystack CLI — not done, needs real Paystack credentials (see V8-103)

**Status: ✅ DONE, exceeds spec (verified July 27, 2026)** — constant-time signature comparison (`crypto.timingSafeEqual`), refuses to process anything if the webhook secret is unset (fails closed, not open), and has an idempotency guard against replayed webhooks (dedupes on `paystackSubId`/`paystackRef` before creating a row) that wasn't even in the original spec.

---

### V8-106 — GET /subscriptions/me (2 SP)

**What:** Returns the current user's subscription status. Frontend calls this on login and caches it.

**Response:**

```typescript
// Active subscriber
{
  status: 'DEVOTED',
  plan: 'QUARTERLY',
  endDate: '2026-06-22T00:00:00Z',
  daysRemaining: 91,
  autoRenew: true
}

// Free user
{
  status: 'FREE',
  plan: null,
  endDate: null,
  daysRemaining: null,
  autoRenew: null
}
```

**Acceptance Criteria:**
- [x] Returns correct status for FREE users
- [x] Returns correct status + endDate for DEVOTED users
- [x] `daysRemaining` is calculated correctly
- [x] Requires auth

**Status: ✅ DONE (verified July 27, 2026)** — also now returns `canPause` (see V8-503) so the frontend can show the real pause-eligibility state instead of guessing with local component state.

---

### V8-107 — POST /subscriptions/cancel (2 SP)

**What:** User can cancel their subscription. We cancel in Paystack, mark `autoRenew = false`. They stay DEVOTED until `endDate`.

**Logic:**
```
Cancel in Paystack API → Update subscription.autoRenew = false
→ User stays DEVOTED until endDate
→ On endDate, subscription.status → EXPIRED (handled by webhook or cron)
→ Never cut access mid-period
```

**Acceptance Criteria:**
- [x] Cancels subscription in Paystack via API
- [x] Sets `autoRenew = false` locally
- [x] User's `subscriptionStatus` stays `DEVOTED` until `endDate`
- [x] Returns updated subscription object

**Status: ✅ DONE (verified July 27, 2026)** — actually calls the real Paystack `disableSubscription` API (HUMAN_BACKLOG.md had flagged an earlier version of this as using the wrong token/a raw unguarded fetch; that's fixed).

---

### V8-108 — Subscription Confirmation Page (3 SP)

**What:** After Paystack redirects the user back to `iluase.com/subscription/confirm`, show a success screen. This is NOT where the subscription is confirmed (the webhook does that) — it's just a nice landing page.

**File to create:**
- `frontend/src/pages/SubscriptionConfirmPage.tsx`
- `frontend/src/App.tsx` — add route `/subscription/confirm`

**Design:**

```
🔱 (large icon)

You are now Devoted

Welcome to the deeper path, [Name].
Your [Quarterly / Annual] plan is now active.

[ features recap — 4 bullet points ]

[ Go to My Dashboard →  ]
```

**Note:** Read `subscriptionStatus` from a fresh API call — not from URL params. Paystack URL params can be forged.

**Acceptance Criteria:**
- [x] `/subscription/confirm` route exists
- [x] Makes fresh `GET /subscriptions/me` call (not URL params)
- [x] Shows correct plan name
- [x] CTA navigates to role dashboard

**Status: ✅ DONE, exceeds spec (verified July 27, 2026)** — also handles a "still processing" state (webhook hasn't landed yet) and includes a referral nudge.

---

## 6. SPRINT 2 — FEATURE GATING ENGINE (22 SP)

> **Goal:** Every feature that is "Devoted only" is locked for FREE users, unlocked for DEVOTED users. The gating is consistent, graceful, and never patronising.

---

### V8-201 — useSubscription() Hook (3 SP)

**What:** A React hook that returns the user's subscription status. Every gated component uses this. It calls `GET /subscriptions/me` once on login and caches the result.

**File:** `frontend/src/features/subscription/use-subscription.ts`

```typescript
export function useSubscription() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => api.get('/subscriptions/me').then(r => r.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isDevoted: data?.status === 'DEVOTED',
    isFree: !data || data.status === 'FREE',
    plan: data?.plan ?? null,
    endDate: data?.endDate ?? null,
    daysRemaining: data?.daysRemaining ?? null,
    status: data?.status ?? 'FREE',
  };
}
```

**Acceptance Criteria:**
- [x] Hook returns `isDevoted: true` for DEVOTED users
- [x] Hook returns `isDevoted: false` for FREE users
- [x] No extra API calls — single fetch per session, cached by React Query
- [x] Returns `status: 'FREE'` if API fails (fail open — don't accidentally block Devoted users)

**Status: ✅ DONE (fixed July 28, 2026)** — the hook already existed but had exactly the bug this doc's own Risk Registry (§12) warns about: `isFree: !data || ...` resolved to `true` on any query error, so a transient API failure locked a real paying Devoted user out of gated features instead of the reverse. Fixed to genuinely fail open — a confirmed error now treats the user as Devoted; only a resolved FREE/EXPIRED response (or no session at all) treats them as free. `use-subscription.ts`.

---

### V8-202 — FeatureGate Component (3 SP)

**What:** A wrapper component that locks any UI behind the Devoted tier. Consistent across the whole app.

**File:** `frontend/src/features/subscription/feature-gate.tsx`

**Usage:**
```tsx
// Anywhere in the app:
<FeatureGate
  feature="profile-views"
  fallback={<UpgradePrompt message="See who visited your profile — Devoted only" />}
>
  <ProfileViewsPanel />
</FeatureGate>
```

**UpgradePrompt design:**

```
┌────────────────────────────────────────────────────┐
│                    🔒                               │
│                                                    │
│    [message text]                                  │
│                                                    │
│    [ Become Devoted  →  ₦25,000 / 3 months ]       │
│                                                    │
└────────────────────────────────────────────────────┘
```

- Gentle, not aggressive. No countdown timers.
- Links to `/pricing` or opens checkout flow.

**Acceptance Criteria:**
- [x] Shows children when user `isDevoted`
- [x] Shows `fallback` when user `isFree`
- [x] `fallback` defaults to `<UpgradePrompt />` if not provided
- [x] UpgradePrompt links to `/pricing`

**Status: ✅ DONE (built July 28, 2026)** — did not exist at all before (gating was hand-rolled inline per-feature instead). Built at `frontend/src/features/subscription/feature-gate.tsx`, matching this spec exactly, with 7 passing component tests. Used by the Academy gating (V8-203) and the profile-views panel (V8-302).

---

### V8-203 — Gate: Selected Academy Courses (5 SP)

**What:** Some Academy courses are "Devoted" courses. FREE users can see them listed (with a lock icon) but cannot open the lesson player. DEVOTED users get full access.

**Backend:**
- Add `isDevoted Boolean @default(false)` to `Course` model
- `GET /academy/courses` — returns all courses, includes `isDevoted` field
- `GET /academy/courses/:id/lessons` — returns 401 if course is `isDevoted` and user is FREE

**Frontend:**
- Course card shows 🔒 badge if `isDevoted && !userIsDevoted`
- Clicking a locked course → `UpgradePrompt` modal, not an error
- Devoted courses visually distinct (gold border, subtle glow)

**Files:**
- `backend/prisma/schema.prisma` — add `isDevoted` to Course
- `backend/src/academy/academy.service.ts` — check subscription in course lesson fetch
- `frontend/src/features/academy/academy-view.tsx` — locked course cards
- `frontend/src/features/academy/lesson-player-view.tsx` — gate player

**Acceptance Criteria:**
- [x] Courses marked `isDevoted: true` in DB show lock icon for FREE users
- [x] FREE user clicking a locked course sees UpgradePrompt, not an error
- [x] DEVOTED user can open and play any course
- [x] Existing free courses unaffected

**Status: ✅ DONE (backend fixed July 26, 2026; frontend fixed July 28, 2026)** — `academy.service.ts`'s `findAllLessons`/`findLessonById` had **zero server-side enforcement**: any authenticated FREE user could call `GET /academy/courses/:courseId/lessons` or `GET /academy/lessons/:id` directly and read full paid lesson content, bypassing the UI lock entirely. Fixed with a shared `assertLessonAccess()` check (subscription status read fresh from the DB, not the JWT, since a subscription can lapse without a new token) — throws `ForbiddenException` (403, not 401) for a non-Devoted user on a Devoted course. ADMIN and the course's own instructor are exempt. Also closed the same gap in `createEnrollment`.
&nbsp;&nbsp;**Correction:** the July 26 note above claimed "the frontend lock/UpgradePrompt already existed" — that was **wrong**, caught by a follow-up audit two days later. `academy-view.tsx` had no lock icon, no gold border, no `UpgradePrompt` — clicking a locked course just silently `navigate('/pricing')`'d away with no explanation, and `course-detail-view.tsx`/`lesson-player-view.tsx` had zero Devoted-awareness at all (a FREE user who deep-linked a locked lesson got a permanently blank content pane, not an error). All three files were fixed July 28, 2026, reusing the `FeatureGate`/`UpgradePrompt` component from V8-202: locked course cards now show a lock badge + amber border on both the catalog grid and the course detail header, clicking one opens a real `UpgradePrompt` modal, and the lesson player gracefully shows the same prompt instead of a blank pane when the lesson fetch 403s. 7 new component tests across the three files.

---

### V8-204 — Gate: Exclusive Community Circles (3 SP)

**What:** Circles can be marked as Devoted-only. FREE users can see them in the directory (with a lock), but cannot join or post.

**Backend:**
- Add `isDevoted Boolean @default(false)` to `Circle` model
- Join endpoint: return 403 with `{ code: 'DEVOTED_REQUIRED' }` if circle is Devoted and user is FREE

**Frontend:**
- Devoted circles show a gold 🔒 badge in the directory
- Join button shows "Devoted Only" for FREE users → taps to UpgradePrompt

**Files:**
- `backend/prisma/schema.prisma` — `isDevoted` on Circle
- `backend/src/circles/circles.service.ts` — check in join
- `frontend/src/features/circles/circle-directory.tsx` — Devoted badge
- `frontend/src/features/circles/circle-detail-view.tsx` — gate join button

**Acceptance Criteria:**
- [x] Devoted circles show gold lock badge in directory
- [x] FREE user clicking "Join" sees UpgradePrompt
- [x] DEVOTED user can join normally
- [x] Admin can mark any circle as Devoted in admin panel

**Status: ✅ DONE (fixed July 27–28, 2026)** — the backend join gate and directory badge/lock UI already existed and worked. Two real gaps found and fixed:
1. `circle-detail-view.tsx`'s join mutation had a leftover demo-mode fallback (`circle-membership.utils.ts`'s `demo-circle-membership:` sessionStorage key) that unconditionally swallowed **every** API error, including a real 403 from a FREE user correctly rejected from a Devoted circle — the UI always showed "Joined circle" regardless of what the backend said. Fixed to only apply the demo fallback when `isDevModeActive()` is actually true; a real rejection now reaches `onError` for real.
2. Nothing anywhere let an admin actually turn `isDevoted` on for a circle — no DTO field, no admin UI. Added an admin-only `PATCH /admin/circles/:id/devoted` endpoint (deliberately not exposed on the general circle-update DTO a circle's own creator can call — this is a platform monetisation decision) and a toggle button in `circle-management-view.tsx`'s "All Circles" tab.

---

### V8-205 — Devoted Badge on Profile (2 SP)

**What:** DEVOTED subscribers get a gold "Devoted" badge on their public profile. Small, tasteful. Not a shout — a signal.

**Where it shows:**
- Public profile hero card (next to role badge)
- Babalawo directory card (small gold dot or badge)
- Forum posts (gold username colour)

**Design:**

```tsx
{isDevoted && (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
    <Sparkles size={10} /> Devoted
  </span>
)}
```

**Files:**
- `frontend/src/features/profile/public-profile-view.tsx`
- `frontend/src/features/babalawo/babalawo-directory-view.tsx`

**Acceptance Criteria:**
- [x] DEVOTED user's profile shows the badge
- [x] FREE user's profile does not
- [x] Badge renders in both light and dark mode

**Status: ✅ DONE (verified/fixed July 27, 2026)** — own public profile and forum posts already showed the badge correctly end-to-end. The one real gap: the babalawo directory card never showed it at all — the backend's practitioner-discovery query didn't even select `subscriptionStatus`. Fixed: `getPractitionerDiscovery()` now selects it and maps it to `isDevoted`, and `babalawo-discovery-view.tsx`'s `PractitionerCard` shows a small gold crown next to the name.

---

### V8-206 — Gate: Messaging Limits for Free Users (3 SP)

**What:** FREE users can send messages, but are limited to **10 new conversation threads per month**. DEVOTED users have unlimited. Existing conversations are never blocked — only starting new ones.

**Backend:**
- Track message thread count per user per month
- `POST /messages` → if FREE and threadCount >= 10 → 403 `{ code: 'MESSAGE_LIMIT_REACHED' }`

**Frontend:**
- When 403 received: show UpgradePrompt modal ("You've reached your free message limit for this month")
- On the compose screen: show remaining count for FREE users (`7 of 10 messages remaining this month`)

**Files:**
- `backend/src/messages/messages.service.ts` — count check
- `frontend/src/features/messages/messages-page.tsx` — remaining count display

**Acceptance Criteria:**
- [x] FREE user: after 10 threads, new message attempt → 403 (backend correct)
- [x] Existing threads are NEVER blocked (only new threads)
- [x] DEVOTED user: no limit, no counter shown
- [x] Counter resets on 1st of each month
- [ ] Counter shown subtly in compose UI for FREE users — **⚠️ blocked, see below**

**Status: 🟡 PARTIAL, blocked by product pivot (verified July 27, 2026)** — the backend logic is fully correct: `messaging.service.ts`'s 10-new-thread limit, month-scoped, existing threads never blocked, plus a `GET /messaging/limit-status` endpoint. But 1:1 messaging is currently **paused platform-wide** per `MVP_PIVOT_BACKLOG.md` — `/messages` and `/messages/:otherUserId` route to `MessagesPausedPage.tsx`, a static notice, with no compose UI at all. There's nothing to attach the remaining-count display or the 403-triggered UpgradePrompt to right now. Not a bug to fix — just not reachable until messaging un-pauses.

---

### V8-207 — Subscription Status in Settings Page (3 SP)

**What:** The Settings page gets a new "My Plan" section showing the user's current subscription status, next billing date, and a manage/upgrade button.

**File:** `frontend/src/pages/SettingsPage.tsx`

**Design:**

```
── My Plan ──────────────────────────────────────────

[FREE]
You are on the Seeker plan — always free.

  [ Upgrade to Devoted  →  ₦25,000 / 3 months ]

──────────────────────────────────────────────────────

[DEVOTED — Quarterly]
Active until: 22 June 2026  (91 days remaining)
Auto-renewal: On

  [ Manage Subscription ]    [ Cancel Plan ]
```

**Acceptance Criteria:**
- [x] FREE user sees their free status + upgrade CTA
- [x] DEVOTED user sees plan type, end date, days remaining
- [x] "Manage Subscription" links to `/subscription/manage`
- [x] "Cancel Plan" triggers cancel flow with confirmation modal

**Status: ✅ DONE (verified July 27, 2026)** — `SettingsPage.tsx`'s "My Plan" section covers this fully (uses `window.confirm` rather than a custom modal for cancel — functionally meets the AC, just visually plainer than the mockup).

---

## 7. SPRINT 3 — DEVOTED FEATURES (24 SP)

> **Goal:** Devoted subscribers get real extra value. Things that make the ₦25,000 feel worth it.

---

### V8-301 — Profile View Tracking (Backend) (3 SP)

**What:** Every time a user visits another user's public profile, log it. DEVOTED users can then see who visited theirs.

**Files:**
- `backend/prisma/schema.prisma` — `ProfileView` model
- New migration
- `backend/src/profile/profile.service.ts` — log view on `GET /users/:id/profile`

**Migration SQL:**

```sql
CREATE TABLE "profile_views" (
  "id" TEXT NOT NULL,
  "viewerId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "profile_views_viewerId_fkey" FOREIGN KEY ("viewerId")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "profile_views_profileId_fkey" FOREIGN KEY ("profileId")
    REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "profile_views_profileId_viewedAt_idx"
  ON "profile_views"("profileId", "viewedAt" DESC);
```

**Logic:**
- Log view when `viewerId !== profileId` (no self-views)
- De-duplicate: if same viewer visited same profile within 24 hours, do not log again
- Retain last 30 days only (cron cleanup)

**Acceptance Criteria:**
- [x] `GET /users/:id` logs a row in `profile_views` (unless self or duplicate within 24h)
- [x] `GET /users/:id/profile-viewers` returns list (self/admin only)
- [x] Returns: viewer name, avatar, role, when they visited
- [x] Only shows last 30 days of views

**Status: ✅ DONE (fixed July 27, 2026)** — logging and the read endpoint were already wired end-to-end. Real bug found and fixed: the schema has `@@unique([viewerId, profileId])` (one row per pair, meant to be updated on revisit) but the code only ever called `create()`. Any revisit after the first 24h window hit the unique constraint, threw, and was silently swallowed by the caller's `.catch()` — so a viewer's `viewedAt` froze at their first-ever visit forever. Fixed to `findUnique` + conditionally `update` instead of blind `create`. 3 new unit tests.

---

### V8-302 — "Who Viewed Your Profile" UI (3 SP)

**What:** A new panel in the user's own profile page (or Settings) showing who visited. DEVOTED only.

**File:** `frontend/src/features/devoted/profile-views-panel.tsx`

**Design:**

```
── 👁 Who Visited Your Profile ─────────────────────────

Last 30 days

  [avatar] Adewale O.     Babalawo      2 hours ago
  [avatar] Funke A.       Seeker        Yesterday
  [avatar] Emeka T.       Seeker        3 days ago

  + 12 more this month

[ See All ]
```

**For FREE users** — show the panel teaser (blurred list of 3) + UpgradePrompt.

**Acceptance Criteria:**
- [x] DEVOTED user sees real visitor list
- [x] FREE user sees blurred teaser + upgrade prompt
- [x] Clicking a visitor navigates to their profile
- [x] Updates in real time (react-query refetch every 5 minutes)

**Status: ✅ DONE (built July 28, 2026)** — the backend endpoint existed and worked; nothing on the frontend ever called it, so this entire Devoted benefit was completely invisible. Built at `frontend/src/features/devoted/profile-views-panel.tsx` exactly to this spec (blurred 3-row teaser + `UpgradePrompt` for FREE, real list with 5-min `refetchInterval` for DEVOTED, click-to-profile), wired into `SettingsPage.tsx`. 4 passing component tests.

---

### V8-303 — Priority Booking Indicator (5 SP)

**What:** When a DEVOTED user books a consultation, their appointment is flagged as `isPriority`. Babalawo see these at the top of their calendar and incoming requests list.

**Backend:**
- Add `isPriority Boolean @default(false)` to `Appointment` model
- `POST /appointments` — set `isPriority: true` if user is DEVOTED
- `GET /appointments/babalawo` — sort by isPriority DESC, then by date

**Frontend (Babalawo view):**
- Appointment card with `isPriority: true` shows gold "Devoted Client" badge
- Sorted to top in the calendar incoming requests

**Frontend (Client view when booking):**
- DEVOTED user sees "Your booking is priority — Babalawo will be notified first" message on confirmation

**Files:**
- `backend/prisma/schema.prisma`
- `backend/src/appointments/appointments.service.ts`
- `frontend/src/features/babalawo/practitioner-calendar-view.tsx`
- `frontend/src/features/consultations/BookingConfirmation.tsx`

**Acceptance Criteria:**
- [x] DEVOTED user's appointment has `isPriority: true` in DB
- [x] FREE user's appointment has `isPriority: false`
- [ ] Babalawo sees gold badge on priority appointments — **⚠️ blocked, see below**
- [x] Priority appointments sorted first in babalawo's incoming list
- [ ] Booking confirmation shows priority status to DEVOTED users — **⚠️ blocked, see below**

**Status: 🟡 PARTIAL, blocked by product pivot (verified July 27, 2026)** — backend fully correct and exceeds spec (`appointments.service.ts` sets `isPriority` from live subscription status, uses a Postgres advisory lock to avoid double-booking races, sorts `ORDER BY isPriority DESC`). But booking/consultations are currently **paused platform-wide** per `MVP_PIVOT_BACKLOG.md` — every booking route renders `ConsultationsPausedPage`. There is no reachable UI today to attach a priority badge or confirmation message to. Not a bug — just not buildable until consultations un-pause; revisit then.

---

### V8-304 — Free Delivery Threshold — Marketplace (5 SP)

**What:** DEVOTED subscribers get free local delivery on marketplace orders above ₦100,000. This needs to work in the checkout flow.

**Flow:**

```
Client is DEVOTED + cart total > ₦100,000 + delivery method = LOCAL
  → delivery fee = ₦0
  → show banner: "Free delivery applied — Devoted member benefit"

Client is FREE + cart total > ₦100,000 + delivery method = LOCAL
  → delivery fee = standard
  → show banner: "Devoted members get free delivery on this order"
```

**Backend:**
- `POST /orders/calculate` — if user isDevoted and amount >= 10000000 kobo, set shippingFee to 0

**Frontend:**
- Checkout page: show free delivery badge when conditions met
- For FREE users: show "Upgrade to Devoted for free delivery on this order"

**Files:**
- `backend/src/orders/orders.service.ts`
- `frontend/src/features/marketplace/checkout-view.tsx`
- `frontend/src/pages/CheckoutPage.tsx`

**Acceptance Criteria:**
- [x] DEVOTED + ₦100k+ order → delivery = ₦0 in checkout
- [x] FREE + ₦100k+ order → standard delivery + upgrade nudge
- [x] Orders below ₦100k → no free delivery regardless of tier
- [x] International orders → not eligible (local delivery only)
- [x] Free delivery shown on order confirmation and receipt

**Status: ✅ DONE (fixed July 28, 2026)** — the threshold logic and pre-purchase checkout banner already worked correctly. Two real gaps found and fixed: (1) the free-delivery waiver applied to **any** destination, including genuinely international orders, contradicting this story's own "local delivery only" AC — now checks `shippingCountry` is Nigeria before waiving. (2) the benefit was never shown anywhere after purchase — `Order.devotedFreeDelivery` is now a real persisted column (new migration) set at checkout time, and `my-orders-view.tsx` shows a "Free delivery — Devoted benefit" badge on qualifying past orders.

---

### V8-305 — Cultural Level 2× Multiplier (3 SP)

**What:** DEVOTED users earn cultural level points at 2× the rate of FREE users.

**Where cultural levels are earned:**
- Completing Academy courses
- Attending events
- Forum upvotes received

**Backend:**
- `POST /cultural-levels/award` — check user subscription, multiply by 2 if DEVOTED

**Frontend:**
- Profile cultural level badge — add "2× growth active" indicator for DEVOTED users

**Files:**
- `backend/src/cultural-levels/cultural-levels.service.ts`
- `frontend/src/features/profile/public-profile-view.tsx`

**Acceptance Criteria:**
- [x] DEVOTED user earns 2× points from Academy completion
- [x] FREE user earns standard points
- [x] Cultural level display correct for both
- [x] No retroactive recomputation of past points
- [ ] Forum upvotes apply the 2× multiplier — **fixed, see below**
- [ ] Event attendance awards points at all — **⚠️ NOT DONE, see below**

**Status: 🟡 PARTIAL (fixed July 28, 2026, one gap remains out of scope)** — Academy XP already applied the 2× multiplier correctly via `users.service.ts`'s `awardXP()`. Real bug found and fixed: forum upvotes/acknowledgments used a **completely separate, un-multiplied XP path** (`forum.service.ts`'s old `incrementXP()`) with its own, different level-name/threshold table ("Omo Awo"/"Aremo"/"Oye"/"Akeko" vs. `awardXP`'s "Awo Agba"/"Awo"/"Akọ̀wé"/"Ẹ̀kọ́ Jinlẹ̀"/"Ẹ̀kọ́"/"Ọmọ Ilé Tuntun") — both wrote the same `user.culturalLevel` field, so whichever XP source fired most recently silently overwrote the other's displayed level name. Forum now delegates to the one real `awardXP()` implementation instead of maintaining a parallel system.
**Remaining gap, not fixed:** event attendance awards **no XP at all** — there is no attendance-tracking mechanism anywhere in the codebase (`Appointment`/registration status is only ever checked for `ATTENDED`, never set to it by anything). Building that would be a genuinely new feature (who marks attendance? organizer? auto on event end time? check-in code?), not a bug fix — flagged for a future story, not attempted here.

---

### V8-306 — Generate Referral Code for All Users (3 SP)

**What:** Every user gets a unique referral code on first login (or signup). Stored in `User.referralCode`. Used in Sprint 5 for the referral rewards system.

**Files:**
- `backend/src/auth/auth.service.ts` — generate code on user creation if absent

**Code generation:**
```typescript
// On signup:
const referralCode = `${user.name.split(' ')[0].toLowerCase()}-${nanoid(6)}`;
// e.g. 'adewale-3k9xp2'
```

**Acceptance Criteria:**
- [x] Every new user gets a referral code on signup
- [x] Existing users get one generated on next login (backfill)
- [x] Codes are unique (DB constraint enforced)
- [x] `GET /users/me` includes `referralCode`

**Status: ✅ DONE (fixed July 27, 2026)** — new-signup generation worked. Two real gaps found and fixed: (1) there was no backfill at all — `getReferralStats()` just returned `user?.referralCode ?? null`, so every user who signed up before this feature shipped had no code and no way to ever get one. Now lazily generates and persists one on first read. (2) a random-suffix collision on the unique constraint (rare but possible) was completely unhandled and would have failed the whole registration request after the user row already existed. Both the signup path and the backfill path now retry up to 3 times on a collision. 6 new unit tests total.

---

### V8-307 — Referral Code Capture on Signup (2 SP)

**What:** Signup URL can include `?ref=adewale-3k9xp2`. The code is stored on the new user's account and linked to the referrer. Reward logic is in Sprint 5.

**Files:**
- `frontend/src/pages/SignupPage.tsx` — read `?ref=` from URL, store in form state
- `backend/src/auth/auth.service.ts` — accept `referredByCode` in signup DTO, resolve to referrer userId, create `Referral` row

**Acceptance Criteria:**
- [x] Signing up via `/signup?ref=xxx` links new user to referrer
- [x] `Referral` row created with `referrerId`, `referredId`, `rewardGranted: false`
- [x] Invalid or missing ref code → ignored (no error)

**Status: ✅ DONE (verified July 27, 2026)**

---

## 8. SPRINT 4 — SUBSCRIPTION MANAGEMENT & ADMIN (16 SP)

> **Goal:** Users can manage their subscription. Admins can see revenue and subscriber data.

---

### V8-401 — Subscription Management Page (5 SP)

**What:** A dedicated page at `/subscription/manage` for users to view and manage their Devoted subscription.

**File to create:** `frontend/src/pages/SubscriptionManagePage.tsx`

**Sections:**

```
1. Current Plan
   ─────────────────────────────────────
   Devoted · Quarterly
   Active until: 22 June 2026
   91 days remaining
   Auto-renewal: ON
   [Turn off auto-renewal]

2. Billing History
   ─────────────────────────────────────
   22 Mar 2026   ₦25,000   Devoted Quarterly   ✓ Paid
   22 Dec 2025   ₦25,000   Devoted Quarterly   ✓ Paid

3. Cancel Subscription
   ─────────────────────────────────────
   [Cancel Plan]
   You will keep Devoted access until 22 June 2026.
   No refunds are issued for unused periods.
```

**Acceptance Criteria:**
- [x] Shows correct plan, end date, days remaining
- [x] Billing history table with all past payments
- [x] Toggle auto-renewal (calls `PATCH /subscriptions/auto-renew`)
- [x] Cancel button → confirmation modal → calls `POST /subscriptions/cancel`
- [x] After cancellation: message changes to "Plan cancelled — access until [date]"

**Status: ✅ DONE (fixed July 28, 2026)** — the page existed with plan/end-date/billing-history/cancel-with-pause-offer, but `PATCH /subscriptions/auto-renew` genuinely didn't exist anywhere — the "Turn off auto-renewal" toggle from the AC had no backend to call. Built: the endpoint (lighter-weight than full cancel — keeps `status: ACTIVE` so admin's active-subscriber views don't count it as churn, while still actually stopping Paystack billing via a new `enableSubscription`/`disableSubscription` pair), plus the toggle button in the UI.

---

### V8-402 — Admin: Subscriber Analytics Tab (5 SP)

**What:** A new tab in the Admin dashboard showing subscription revenue and subscriber health.

**File:**
- `frontend/src/features/admin/admin-subscription-tab.tsx`
- `backend/src/admin/admin.service.ts` — add subscription stats
- `GET /admin/subscription-stats`

**Dashboard metrics:**

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  DEVOTED SUBSCRIBERS TODAY                           │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │   142   │  │  ₦2.9M  │  │  4.2%   │  │   8    │ │
│  │ Active  │  │ Revenue │  │  Churn  │  │ New    │ │
│  │ Subs    │  │ (month) │  │  rate   │  │ today  │ │
│  └─────────┘  └─────────┘  └─────────┘  └────────┘ │
│                                                      │
│  Plan breakdown:                                     │
│  Quarterly ███████████████░░░░░ 78%  (111 users)    │
│  Annual    ████░░░░░░░░░░░░░░░░ 22%  (31 users)     │
│                                                      │
│  Subscriber list (searchable + exportable)           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [x] Shows active subscriber count
- [x] Shows MRR (monthly recurring revenue)
- [x] Churn rate (% cancelled in last 30 days)
- [x] Plan breakdown (quarterly vs annual)
- [x] Subscriber list (name, plan, joined date, end date, status)
- [x] Export to CSV button

**Status: ✅ DONE (fixed July 28, 2026)** — backend metrics and RBAC were already solid (money-mutating admin actions correctly gated to `AdminSubRole.FINANCE`/`SUPER`, not just generic ADMIN), and the tab already exceeded spec with overview/active/churn/failed-payment views and cancel/extend/grant/reminder actions. Missing: search and CSV export, both now added — `GET /admin/subscriptions/active` takes an optional `?search=` (name/email, case-insensitive), and an "Export to CSV" button generates the file client-side from the already-fetched (and search-filtered) rows.

---

### V8-403 — Billing Confirmation Email (3 SP)

**What:** When a subscription is created or renewed, send a confirmation email to the user.

**Files:**
- `backend/src/subscriptions/subscriptions.service.ts` — call email service after webhook confirms
- `backend/src/notifications/email/email.service.ts` — add `sendBillingConfirmation` method

**Email content:**

```
Subject: Your Devoted plan is active — Ìlú Àṣẹ

You're now Devoted 🔱

Your [Quarterly / Annual] plan started on [date].
Access expires: [date]

Amount charged: ₦25,000 / ₦100,000
Receipt reference: [Paystack ref]

What you now have access to:
• Priority consultations
• Selected Academy courses
• Free delivery on orders above ₦100,000
• Who viewed your profile
...

[ Go to Your Dashboard ]
```

**Acceptance Criteria:**
- [x] Email sent within 2 minutes of `subscription.create` webhook — actually immediate, fires directly off the webhook
- [x] Correct plan name and dates
- [x] Correct amount
- [x] Link to dashboard works

**Status: ✅ DONE (verified July 27, 2026)**

---

### V8-404 — Renewal Reminder Email (3 SP)

**What:** 3 days before a subscription expires, send a reminder email. If `autoRenew = true`, reassure them. If `autoRenew = false`, remind them to re-subscribe.

**How:** NestJS cron job. Runs daily. Checks for subscriptions where `endDate` is within 3 days.

**File:**
- `backend/src/subscriptions/subscriptions.cron.ts`

```typescript
@Cron('0 9 * * *') // 9am daily
async sendRenewalReminders() {
  const threeDaysFromNow = addDays(new Date(), 3);
  const expiringSoon = await this.prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { lte: threeDaysFromNow },
    },
    include: { user: true },
  });
  for (const sub of expiringSoon) {
    await this.emailService.sendRenewalReminder(sub.user, sub);
  }
}
```

**Acceptance Criteria:**
- [x] Cron runs daily at 9am
- [x] Email sent to users whose subscription ends within 3 days
- [ ] Different email copy for autoRenew ON vs OFF — not implemented (single copy, informational either way)
- [x] No duplicate emails (`reminderSent` flag, checked and set correctly)

**Status: ✅ DONE (fixed July 27, 2026)** — the email template/logic and `reminderSent` dedup already existed, but the reminder only ever fired as a **side effect of the user loading `GET /subscriptions/me` themselves** — a subscriber who didn't open the app in the 3 days before renewal never got it at all, and there was no actual cron. Built `SubscriptionLifecycleCronService` with a real `@Cron(EVERY_DAY_AT_9AM)` sweep (`backend/src/subscriptions/subscription-lifecycle-cron.service.ts`), reusing this backend's existing `@nestjs/schedule` setup (11 other cron jobs already run this way — `ScheduleModule.forRoot()` is registered once, globally, in `app.module.ts`). Also found and fixed a related pre-existing gap while building this: nothing anywhere ever transitioned a lapsed non-renewing subscription to `EXPIRED` — a stale comment on `onSubscriptionDisabled` had promised "a cron will expire it" and none existed. Added that expiry sweep too (`EVERY_DAY_AT_MIDNIGHT`), since V8-504's win-back sweep needs it.

---

## 9. SPRINT 5 — REFERRAL & RETENTION (12 SP)

> **Goal:** Users who refer others get rewarded. Users who consider cancelling are given a pause option first.

---

### V8-501 — Referral Reward — 1 Month Free (5 SP)

**What:** When a referred user subscribes to Devoted for the first time, the referrer gets 1 month added to their subscription (or if they are FREE, they get 1 free month of Devoted).

**Flow:**

```
New user signs up via ?ref=adewale-3k9xp2
  ↓
Referral row created: { referrerId, referredId, rewardGranted: false }
  ↓
New user subscribes to Devoted (webhook fires subscription.create)
  ↓
Check: does this user have a referral row? Is rewardGranted: false?
  ↓
Yes → Add 30 days to referrer's subscriptionEnd
     → Set rewardGranted: true
     → Send email to referrer: "Adewale, you earned 1 free month!"
```

**Files:**
- `backend/src/subscriptions/subscriptions.service.ts` — referral check in webhook handler
- `backend/src/referrals/referrals.service.ts`
- Email template: `referral-reward.hbs`

**Acceptance Criteria:**
- [x] Referrer gets 30 days added to their subscription when referred user pays
- [x] `rewardGranted` set to `true` — no double rewards **(now `subscriptionRewardGranted` — see below)**
- [ ] Email sent to referrer on reward — not implemented (in-app copy update instead, see V8-502)
- [x] Reward works whether referrer is FREE (starts a 30-day Devoted) or DEVOTED (extends)
- [x] Referral stats available via `GET /users/:id/referral-stats`

**Status: ✅ DONE (fixed July 27, 2026)** — the 30-day-extension logic itself was already correct. Real bug found and fixed: a **second, completely independent referral-reward system** already existed (`appointments.service.ts`'s `maybeGrantReferralReward` — EXPERIENCE_BACKLOG.md EXP-027's ₦500-wallet-credit-on-first-completed-booking reward), and both systems shared one `Referral.rewardGranted` boolean. Whichever milestone happened first (first booking vs. first Devoted subscription) silently consumed the flag, and the other party's promised reward never fired — e.g. a referred user who booked a session before subscribing would grant both parties ₦500, and the referrer would then never get their 30 free Devoted days when that user later subscribed. Fixed by giving this reward its own independent flag (`Referral.subscriptionRewardGranted`, new migration) — EXP-027's `rewardGranted` is untouched and still governs the ₦500 reward exactly as before.

---

### V8-502 — Referral Dashboard Panel (3 SP)

**What:** A simple panel in Settings showing the user's referral link and stats.

**Design:**

```
── Share & Earn ───────────────────────────────────────

Refer a friend to Ìlú Àṣẹ.
When they become Devoted, you earn 1 free month.

Your referral link:
┌──────────────────────────────────────────┐  [Copy]
│ iluase.com/signup?ref=adewale-3k9xp2   │
└──────────────────────────────────────────┘

  📤  Referred: 3 people
  ✅  Converted to Devoted: 1
  🎁  Months earned: 1

```

**File:** `frontend/src/features/devoted/referral-panel.tsx`

**Acceptance Criteria:**
- [x] Referral link auto-generated and copyable
- [x] Shows referred count, converted count, months earned
- [x] Accessible from Settings page

**Status: ✅ DONE (fixed July 27, 2026)** — panel existed and was functional (link, copy, WhatsApp/email share, stats, Community Builder progress). Real bug found and fixed: its copy described **only** the EXP-027 ₦500-booking reward and never mentioned the Devoted-subscription 30-day reward this story is about — combined with the V8-501 flag race, this was actively telling users the wrong thing about what they'd earn. Copy updated to describe both rewards accurately now that they're independent (see V8-501).

---

### V8-503 — Cancel Flow: Pause Option (2 SP)

**What:** Before a user can cancel, show them the option to **pause for 1 month** instead. Many churn events are temporary (financial pressure, busy period) — a pause prevents permanent loss.

**Flow:**

```
User clicks "Cancel Plan"
  ↓
Modal: "Before you go — you can pause for 1 month instead."

[ Pause for 1 month ]   [ Cancel Anyway ]

Pause: extends endDate by 30 days, no charge, autoRenew stays on
Cancel: proceeds with existing cancel flow
```

**Files:**
- `frontend/src/pages/SubscriptionManagePage.tsx`
- `backend/src/subscriptions/subscriptions.controller.ts` — `POST /subscriptions/pause`

**Acceptance Criteria:**
- [x] Cancel button triggers pause modal first
- [x] Pause extends `endDate` by 30 days, logs event
- [x] User can only pause once per subscription period
- [x] "Cancel Anyway" proceeds to standard cancellation

**Status: ✅ DONE (fixed July 27, 2026) — was a real, exploitable money bug** — the pause-offer modal and the 30-day extension logic existed and worked, but **"only pause once per subscription period" was completely unenforced on both ends**: the backend `pauseSubscription()` had no repeat-call check at all (no `pausedAt` field existed anywhere in the schema), so `POST /subscriptions/pause` could be called any number of times, extending `endDate` by 30 days each time, for free, indefinitely. The frontend's "you've already used your pause" message was backed by a local `useState(false)` that reset to `false` on every page reload — no real deterrent even in the UI. Fixed: added `Subscription.pausedAt` (new migration), the endpoint now throws `BadRequestException` on a second attempt, and `GET /subscriptions/me` returns a real `canPause` flag the frontend reads instead of guessing with local state.

---

### V8-504 — Expired Subscriber Win-Back Email (2 SP)

**What:** When a subscription expires (not cancelled — just ended), send a win-back email 7 days later if they haven't re-subscribed.

**Cron job:** Runs daily. Checks for users where `subscriptionStatus = 'EXPIRED'` and `subscriptionEnd` was 7 days ago.

**Email:**

```
Subject: Your Devoted plan expired — come back to the path

We noticed your Devoted plan expired on [date].

Your spiritual journey doesn't have to pause.

[ Renew Devoted — ₦25,000 / 3 months ]

What's waiting for you:
• [3 bullet points of most used features]
```

**Acceptance Criteria:**
- [x] Sent exactly once, 7 days after expiry
- [x] Only to users who haven't re-subscribed
- [x] Links to pricing page
- [x] Not sent twice (dedup flag)

**Status: ✅ DONE (fixed July 27, 2026)** — the email template and the "skip if already resubscribed" guard already existed, plus an admin-triggered manual-send endpoint. The actual "automatic, 7 days after expiry" trigger genuinely didn't exist — the email only ever fired if an admin manually clicked "send win-back" for one specific user. Built as part of the same `SubscriptionLifecycleCronService` added for V8-404: a daily sweep finds subscriptions whose `endDate` was exactly 7 days ago and status is `EXPIRED` (see V8-404's expiry-sweep fix — that transition didn't exist before either) and haven't received the email yet (new `Subscription.winBackSentAt` flag, same migration as `pausedAt`).

---

## 10. WHAT WE ARE NOT BUILDING YET

These are in the strategy doc but **not in this backlog**. Do not start these until the 5 sprints above are complete and generating revenue.

| Feature | Reason to Wait |
|---------|----------------|
| HD session recordings | Needs video infrastructure (Jitsi recording, S3 pipeline) — large build |
| AI transcripts | Needs Whisper API integration — separate project |
| Masterclass vault | Needs content creation first — technical is the smaller part |
| Family plans | Build after 1,000 subscribers — less than 5% will use it initially |
| Two-tier pricing (Plus / Premium) | Only add complexity if single tier conversion is below 3% at 6 months |
| Advanced search filters | Nice to have, not a blocker for revenue |
| Babalawo premium placement | Next revenue stream — build after subscriber base is stable |

---

## 11. DEFINITION OF DONE

A story is **DONE** when:

```
✅ Backend endpoint tested (Postman or curl)
✅ Frontend renders correctly in both light and dark mode
✅ Empty states handled (no spinner that spins forever)
✅ Error states handled (no blank white screen on failure)
✅ No TypeScript errors (tsc --noEmit passes)
✅ Tested with a real DEVOTED user and a real FREE user
✅ No console errors in browser
✅ CLAUDE.md updated with new sprint status
```

---

## 12. RISK REGISTRY

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Paystack webhook not arriving | Medium | 🔴 Critical | Test with Paystack CLI before go-live; add webhook log table |
| User subscription not updating after payment | Medium | 🔴 Critical | Add `/subscription/sync` endpoint user can call manually |
| Paystack plan codes misconfigured (wrong currency / interval) | Low | 🔴 Critical | Test with ₦50 test plan before creating live plans |
| Feature gate blocking DEVOTED users (fail-closed bug) | Low | 🔴 Critical | Default: if `useSubscription()` errors, treat as DEVOTED (fail open) |
| Raw body not available for webhook signature check | Medium | 🟠 High | Register raw body parser before JSON parser in NestJS bootstrap |
| Users don't see confirmation after paying | Low | 🟠 High | Confirmation page re-fetches from API — not URL params |
| Referral loop (user refers themselves via different email) | Low | 🟡 Medium | Check referredId !== referrerId before granting reward |
| Cron renewal emails sent multiple times | Low | 🟡 Medium | `reminderSent` boolean flag on Subscription model |

---

*Last updated: July 28, 2026 — 28/30 stories DONE, see "Current Status" at the top.*
*Labels: V8-XXX*
*Branch: v8/monetisation*
