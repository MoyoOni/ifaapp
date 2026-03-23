# V8: MONETISATION & THE DEVOTED TIER
## Ìlú Àṣẹ — Subscription, Billing & Premium Features Backlog

**Phase:** V8 — Turning the platform into a sustainable business
**Goal:** Real recurring revenue. Real subscriber data. Real premium features.
**Total Story Points:** 102 SP across 5 sprints
**Labels:** `V8-XXX` (this phase)
**Branch:** `v8/monetisation` → merge to `IfaAppV1` after each sprint smoke test

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
- [ ] `prisma migrate deploy` runs with no errors
- [ ] `User` table has `subscriptionStatus`, `subscriptionEnd`, `referralCode` columns
- [ ] `subscriptions` table exists with all columns
- [ ] Existing users unaffected (default `subscriptionStatus = 'FREE'`)

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
- [ ] Module registers without errors on backend start
- [ ] `GET /subscriptions/me` returns `{ status: 'FREE' }` for non-subscribers
- [ ] Module imported in `AppModule`

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
- [ ] Both plans exist in Paystack dashboard
- [ ] Plan codes stored in Secrets Manager
- [ ] Backend can read `process.env.PAYSTACK_SECRET_KEY`

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
- [ ] `POST /subscriptions/initiate { plan: "QUARTERLY" }` returns `{ checkoutUrl }`
- [ ] Requires auth (JWT guard)
- [ ] Uses correct plan code per plan type
- [ ] Error if user not found

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
- [ ] Webhook endpoint is public (no JWT guard — Paystack cannot authenticate)
- [ ] Signature verified on every request — invalid signatures return 401
- [ ] `subscription.create` → row created, user marked DEVOTED
- [ ] `subscription.disable` → row updated, user marked EXPIRED
- [ ] Returns 200 to Paystack within 10 seconds (even on error — log, don't throw)
- [ ] Test with Paystack CLI: `paystack events trigger subscription.create`

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
- [ ] Returns correct status for FREE users
- [ ] Returns correct status + endDate for DEVOTED users
- [ ] `daysRemaining` is calculated correctly
- [ ] Requires auth

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
- [ ] Cancels subscription in Paystack via API
- [ ] Sets `autoRenew = false` locally
- [ ] User's `subscriptionStatus` stays `DEVOTED` until `endDate`
- [ ] Returns updated subscription object

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
- [ ] `/subscription/confirm` route exists
- [ ] Makes fresh `GET /subscriptions/me` call (not URL params)
- [ ] Shows correct plan name
- [ ] CTA navigates to role dashboard

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
- [ ] Hook returns `isDevoted: true` for DEVOTED users
- [ ] Hook returns `isDevoted: false` for FREE users
- [ ] No extra API calls — single fetch per session, cached by React Query
- [ ] Returns `status: 'FREE'` if API fails (fail open — don't accidentally block Devoted users)

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
- [ ] Shows children when user `isDevoted`
- [ ] Shows `fallback` when user `isFree`
- [ ] `fallback` defaults to `<UpgradePrompt />` if not provided
- [ ] UpgradePrompt links to `/pricing`

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
- [ ] Courses marked `isDevoted: true` in DB show lock icon for FREE users
- [ ] FREE user clicking a locked course sees UpgradePrompt, not an error
- [ ] DEVOTED user can open and play any course
- [ ] Existing free courses unaffected

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
- [ ] Devoted circles show gold lock badge in directory
- [ ] FREE user clicking "Join" sees UpgradePrompt
- [ ] DEVOTED user can join normally
- [ ] Admin can mark any circle as Devoted in admin panel

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
- [ ] DEVOTED user's profile shows the badge
- [ ] FREE user's profile does not
- [ ] Badge renders in both light and dark mode

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
- [ ] FREE user: after 10 threads, new message attempt → UpgradePrompt
- [ ] Existing threads are NEVER blocked (only new threads)
- [ ] DEVOTED user: no limit, no counter shown
- [ ] Counter resets on 1st of each month
- [ ] Counter shown subtly in compose UI for FREE users

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
- [ ] FREE user sees their free status + upgrade CTA
- [ ] DEVOTED user sees plan type, end date, days remaining
- [ ] "Manage Subscription" links to `/subscription/manage`
- [ ] "Cancel Plan" triggers cancel flow with confirmation modal

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
- [ ] `GET /users/:id/profile` logs a row in `profile_views` (unless self or duplicate within 24h)
- [ ] `GET /profile-views/mine` returns list (Devoted only — 403 for FREE)
- [ ] Returns: viewer name, avatar, role, when they visited
- [ ] Only shows last 30 days of views

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
- [ ] DEVOTED user sees real visitor list
- [ ] FREE user sees blurred teaser + upgrade prompt
- [ ] Clicking a visitor navigates to their profile
- [ ] Updates in real time (react-query refetch every 5 minutes)

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
- [ ] DEVOTED user's appointment has `isPriority: true` in DB
- [ ] FREE user's appointment has `isPriority: false`
- [ ] Babalawo sees gold badge on priority appointments
- [ ] Priority appointments sorted first in babalawo's incoming list
- [ ] Booking confirmation shows priority status to DEVOTED users

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
- [ ] DEVOTED + ₦100k+ order → delivery = ₦0 in checkout
- [ ] FREE + ₦100k+ order → standard delivery + upgrade nudge
- [ ] Orders below ₦100k → no free delivery regardless of tier
- [ ] International orders → not eligible (local delivery only)
- [ ] Free delivery shown on order confirmation and receipt

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
- [ ] DEVOTED user earns 2× points from Academy completion
- [ ] FREE user earns standard points
- [ ] Cultural level display correct for both
- [ ] No retroactive recomputation of past points

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
- [ ] Every new user gets a referral code on signup
- [ ] Existing users get one generated on next login (backfill)
- [ ] Codes are unique (DB constraint enforced)
- [ ] `GET /users/me` includes `referralCode`

---

### V8-307 — Referral Code Capture on Signup (2 SP)

**What:** Signup URL can include `?ref=adewale-3k9xp2`. The code is stored on the new user's account and linked to the referrer. Reward logic is in Sprint 5.

**Files:**
- `frontend/src/pages/SignupPage.tsx` — read `?ref=` from URL, store in form state
- `backend/src/auth/auth.service.ts` — accept `referredByCode` in signup DTO, resolve to referrer userId, create `Referral` row

**Acceptance Criteria:**
- [ ] Signing up via `/signup?ref=xxx` links new user to referrer
- [ ] `Referral` row created with `referrerId`, `referredId`, `rewardGranted: false`
- [ ] Invalid or missing ref code → ignored (no error)

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
- [ ] Shows correct plan, end date, days remaining
- [ ] Billing history table with all past payments
- [ ] Toggle auto-renewal (calls `PATCH /subscriptions/auto-renew`)
- [ ] Cancel button → confirmation modal → calls `POST /subscriptions/cancel`
- [ ] After cancellation: message changes to "Plan cancelled — access until [date]"

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
- [ ] Shows active subscriber count
- [ ] Shows MRR (monthly recurring revenue)
- [ ] Churn rate (% cancelled in last 30 days)
- [ ] Plan breakdown (quarterly vs annual)
- [ ] Subscriber list (name, plan, joined date, end date, status)
- [ ] Export to CSV button

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
- [ ] Email sent within 2 minutes of `subscription.create` webhook
- [ ] Correct plan name and dates
- [ ] Correct amount
- [ ] Link to dashboard works

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
- [ ] Cron runs daily at 9am
- [ ] Email sent to users whose subscription ends within 3 days
- [ ] Different email copy for autoRenew ON vs OFF
- [ ] No duplicate emails (track `reminderSent` flag on subscription)

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
- [ ] Referrer gets 30 days added to their subscription when referred user pays
- [ ] `rewardGranted` set to `true` — no double rewards
- [ ] Email sent to referrer on reward
- [ ] Reward works whether referrer is FREE (starts a 30-day Devoted) or DEVOTED (extends)
- [ ] `GET /referrals/mine` shows stats: links shared, referrals converted, months earned

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
- [ ] Referral link auto-generated and copyable
- [ ] Shows referred count, converted count, months earned
- [ ] Accessible from Settings page

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
- [ ] Cancel button triggers pause modal first
- [ ] Pause extends `endDate` by 30 days, logs event
- [ ] User can only pause once per subscription period
- [ ] "Cancel Anyway" proceeds to standard cancellation

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
- [ ] Sent exactly once, 7 days after expiry
- [ ] Only to users who haven't re-subscribed
- [ ] Links to pricing page with correct plan pre-selected
- [ ] Not sent to users who explicitly cancelled

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

*Last updated: March 2026*
*Labels: V8-XXX*
*Branch: v8/monetisation*
