# Admin Backend Gaps — Backlog & Execution Plan for an AI Coding Agent

> **Written**: 2026-07-07
> **Audience**: an AI coding agent (e.g. Qoder) executing this work with no prior context on this codebase.
> **Author's note to the executing agent**: every fact in this document was verified against the real, running codebase — file contents were read directly, Prisma schema fields were read directly from `backend/prisma/schema.prisma`, and every currently-working endpoint referenced here was tested live against a running local backend. Nothing in the "Verified facts" sections is guessed. Sections marked **DECISION NEEDED** are places where the real codebase does not have an obvious answer and you must make (and document) a judgment call rather than invent an answer that sounds plausible.

---

## 0. Why this document exists

An audit of the admin panel (`frontend/src/features/admin/`, ~50 tabs/views) found that roughly a third of it is a fully-built, real-looking frontend — loading states, mutations, error toasts, the works — wired to backend endpoints that **do not exist anywhere in the codebase**. Not "exist at a different path." Not "exist but unwired." Genuinely absent: no controller route, no service method, nothing. This was confirmed by:

1. Extracting every `api.get/post/patch/delete(...)` call from every file in `frontend/src/features/admin/`.
2. Testing every GET call directly against a running local backend (`curl` with a real admin JWT).
3. For every 404, grepping the **entire backend `src/` directory** (not just the obvious controller) for any trace of the feature — service files, other controllers, anything.
4. Cross-referencing against `backend/prisma/schema.prisma` to check whether the underlying database tables exist (most do — they were created by real migrations), or whether the whole feature is missing top to bottom.

Project docs (`CLAUDE.md`, `ADMIN_BACKLOG.md`) mark most of these as "✅ COMPLETE" (e.g. "ADM-019 Segmented Email Campaigns — ... full CRUD endpoints"). **Do not trust those docs for this work.** They describe intent, not the current state of the code. Trust only what you verify yourself in the actual files, the same way this document's findings were produced.

---

## 1. Ground rules — read this before writing any code

These rules exist because a prior finding in this exact codebase was: an agent (or a stale doc) asserted a feature was "complete" when the backend for it was completely absent. The failure mode to avoid is **confident invention**. Follow these rules for every ticket below, no exceptions:

1. **Before writing a service method, open the Prisma model in `backend/prisma/schema.prisma` yourself and read the real field list.** This document quotes the fields as they existed at time of writing, but re-verify — do not assume they're still accurate, and do not paraphrase them from memory. Search for `^model <Name>` to jump straight to it.

2. **Before writing a service method, check whether the logic already partially exists.** Two of the tickets below (Inactive Practitioners, Trust Score Adjustments) turned out to have most or all of their core query logic already written in an existing service, just never exposed via a route. Grep the relevant existing `admin-*.service.ts` files for related method names before writing anything new. Do not duplicate logic that already exists.

3. **Never invent a field name.** If a frontend TypeScript interface expects a field that does not exist on the corresponding Prisma model (several are flagged explicitly below), that is a **mismatch to resolve**, not a hint to add a same-named column speculatively. Resolve mismatches by either (a) adapting the service response to map/rename fields to match the frontend, or (b) adapting the frontend interface — pick whichever is smaller and note which you chose in your PR/commit description. Never silently add unrelated columns to a Prisma model to make a mismatch disappear without checking whether other code already depends on the model's current shape (run `grep -rn "modelName\." backend/src --include="*.ts"` first).

4. **Never invent an endpoint path.** Every path in this document was copy-pasted from actual frontend source. Implement exactly that path. If you think a path is wrong, say so in your notes — do not silently "fix" it to something else.

5. **Follow the existing pattern exactly** — see Section 2. Every single existing admin route lives in **one file**: `backend/src/admin/admin.controller.ts` (764 lines at time of writing). There are no separate `admin-campaigns.controller.ts`-style files. Business logic is split into domain-grouped service files (`admin-finance.service.ts`, `admin-community.service.ts`, etc.), registered in `backend/src/admin/admin.module.ts`. **Do not invent a different architecture.** Add new routes to the existing `admin.controller.ts`, add new logic to either an existing domain service (if one fits — see each ticket's "Suggested home" note) or a new service file following the exact same class shape as the existing ones, and register any new service in `admin.module.ts`'s `providers` array.

6. **After every ticket, run the backend typecheck** (`cd backend && npx tsc --noEmit`) and confirm zero new errors before moving to the next ticket. Do not batch all 17 tickets and typecheck once at the end — you will not be able to tell which change broke what.

7. **After implementing each ticket, verify it against a real running instance, not just a typecheck.** Start the backend (`cd backend && npm run dev`, or however this project's dev script is invoked — check `package.json`), log in as an admin user via `POST /auth/register` then promote the resulting user's `role` to `'ADMIN'` directly in the database if no admin account exists yet, obtain a JWT via `POST /auth/login`, and `curl` the new endpoint with that token. A route that compiles but has never been called is not verified — this exact codebase has multiple instances of code that compiled fine and was still completely broken at runtime (wrong route registration order, wrong guard class, etc.). Do not mark a ticket done on typecheck alone.

8. **Do not touch working code while implementing an unrelated ticket.** Each ticket below is scoped to specific files. If you notice something else that looks wrong while working, note it separately — do not fix it inline as a "drive-by" change, since that makes your diff harder to review and harder to revert if it's wrong.

9. **When a ticket says a mismatch exists between the frontend interface and the Prisma model, do not proceed until you've decided how to resolve it and written that decision down as a code comment at the point where the mapping happens.** Future readers (human or AI) need to know this was a deliberate choice, not an oversight.

10. **Every new admin route must be guarded exactly like the existing ones**: class-level `@UseGuards(AuthGuard('jwt'), RolesGuard)` (already present on `AdminController`, you do not need to re-add it), and `@Roles(UserRole.ADMIN)` on each individual route method — copy this from any existing method in the file, e.g. `@Get('academy/courses') @Roles(UserRole.ADMIN)`.

---

## 2. The exact pattern to copy

Every new controller method must look like this (copied verbatim from the real file, `backend/src/admin/admin.controller.ts` lines ~669–694):

```typescript
  @Get('academy/courses')
  @Roles(UserRole.ADMIN)
  async getAllCourses(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.academyService.getAllCourses(Number(page), Number(limit));
  }

  @Patch('academy/courses/:id/feature')
  @Roles(UserRole.ADMIN)
  async featureCourse(@Param('id') id: string, @Body() dto: FeatureItemDto) {
    return this.academyService.featureCourse(
      id,
      dto.featuredUntil ? new Date(dto.featuredUntil) : null
    );
  }

  @Patch('academy/courses/:id/status')
  @Roles(UserRole.ADMIN)
  async updateCourseStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCourseStatusDto,
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.academyService.updateCourseStatus(id, dto.status, admin.id, dto.reason);
  }
```

The controller's class header (do not change this, it already applies to every method you add):

```typescript
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly marketplaceService: AdminMarketplaceService,
    private readonly academyService: AdminAcademyService,
    private readonly trustScoreService: AdminTrustScoreService,
    private readonly platformSettingsService: AdminPlatformSettingsService,
    private readonly gdprService: GdprService,
    private readonly outboxService: OutboxService,
    private readonly announcementsService: AdminAnnouncementsService
  ) {}
```

When you add a new service (e.g. `AdminCampaignsService`), you must:
1. Create `backend/src/admin/admin-campaigns.service.ts` following the exact same `@Injectable()` class shape as `backend/src/admin/admin-community.service.ts` (open that file and copy its structure: constructor injecting `PrismaService`, methods returning plain objects/arrays, no unusual patterns).
2. Add `private readonly campaignsService: AdminCampaignsService` to `AdminController`'s constructor.
3. Import and add `AdminCampaignsService` to both the `imports` list at the top of `admin.controller.ts` and the `providers` array in `backend/src/admin/admin.module.ts`.

DTOs go in `backend/src/admin/dto/`, one class per file, using `class-validator` decorators. Copy this exact pattern (real file, `backend/src/admin/dto/trust-score-override.dto.ts`):

```typescript
import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class TrustScoreOverrideDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  declare override: number | null;

  @IsString()
  @MinLength(5)
  declare reason: string;
}
```

---

## 3. Tickets

Each ticket lists: the frontend file (do not modify it unless the ticket explicitly says to — the goal is to make the existing frontend work, not redesign it), the exact endpoints it calls, the real current Prisma model fields, any mismatch to resolve, a suggested implementation home, and a verification command.

---

### TICKET 1 — Email Campaigns

**Frontend**: `frontend/src/features/admin/admin-campaigns-tab.tsx` (do not modify)

**Endpoints needed**:
- `GET /admin/campaigns?page={n}` → returns `{ items: Campaign[], total: number, page: number, pages: number }`
- `POST /admin/campaigns` → body `{ subject: string, body: string, segment: string, scheduledAt?: string }`, creates a campaign with `status: 'DRAFT'` if no `scheduledAt`, or `'SCHEDULED'` if provided. Returns the created campaign.
- `POST /admin/campaigns/:id/send` → sends the campaign now (see note on actual sending below), sets `status: 'SENT'`, `sentAt: now()`.
- `DELETE /admin/campaigns/:id` → deletes a campaign. Frontend only shows the delete button when `status !== 'SENT'` — enforce this server-side too (throw `BadRequestException` if trying to delete a sent campaign).

**Verified Prisma model** (`backend/prisma/schema.prisma`, model `EmailCampaign`) — **no mismatch, matches frontend exactly**:
```
id, subject, body, segment (String), status (String, default "DRAFT"),
scheduledAt (DateTime?), sentAt (DateTime?), recipientCount (Int, default 0),
openCount (Int, default 0), clickCount (Int, default 0),
createdBy (String, FK to User via relation "CampaignCreator"), createdAt, updatedAt
```

**Segment values the frontend sends** (must be accepted, no enum enforcement needed since the column is a plain String): `ALL`, `CLIENTS`, `BABALAWOS`, `DEVOTED`, `FREE_TIER`, `NEW_30D`, `INACTIVE_30D`, `COUNTRY_NG`, `COUNTRY_UK`, `COUNTRY_US`.

**Response shape**: the `Campaign` interface the frontend renders needs a `creator: { id: string, name: string }` nested object — `include: { creator: { select: { id: true, name: true } } }` in the Prisma query.

**DECISION NEEDED — actual email sending**: the `POST /admin/campaigns/:id/send` action needs to resolve the segment into an actual list of recipient users and send them an email. This codebase has existing email infrastructure — search for how other features send email (check `backend/src/notifications/` and search for any existing mailer/email service: `grep -rln "sendMail\|nodemailer\|EmailService" backend/src --include="*.ts"`). Do not invent a new email-sending mechanism if one already exists. If none exists, implement the segment-resolution query (translate each segment value into a Prisma `where` clause against the `User` model — e.g. `DEVOTED` → `subscriptionStatus: 'DEVOTED'`, `NEW_30D` → `createdAt: { gte: <30 days ago> }`, `INACTIVE_30D` → derive from `UserSession`/`lastSeenAt` the same way `admin-users.service.ts`'s `getInactivePractitioners` does it — see Ticket 16) and set `recipientCount` to the resolved count, but flag in your commit message that actual email delivery is stubbed/TODO if you cannot find existing mailer infrastructure, rather than silently faking success.

**Suggested home**: new file `backend/src/admin/admin-campaigns.service.ts`.

**Verify**:
```bash
curl -X POST http://localhost:8080/admin/campaigns -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"subject":"Test","body":"Hello {{name}}","segment":"ALL"}'
curl http://localhost:8080/admin/campaigns -H "Authorization: Bearer $TOKEN"
```
Confirm the created campaign appears in the list with `status: "DRAFT"`, then delete it via the DELETE endpoint and confirm it's gone.

---

### TICKET 2 — Promo Codes

**Frontend**: `frontend/src/features/admin/admin-promos-tab.tsx` (do not modify)

**Endpoints needed**:
- `GET /admin/promos?includeInactive={bool}` → returns `PromoCode[]`, each with nested `creator: {id, name}` and `_count: {redemptions}`. When `includeInactive` is falsy/absent, filter to `isActive: true` only.
- `POST /admin/promos` → body `{ code: string, type: string, value: number, maxUses?: number, expiresAt?: string, eligibleRoles: string[] }`. `code` should be uppercased and must be unique (the DB has a `@unique` constraint on `code` — let that throw naturally, or catch the Prisma unique-constraint error and rethrow as `BadRequestException('A promo code with this code already exists')`).
- `PATCH /admin/promos/:id` → body `{ isActive: boolean }` (this is the only PATCH the frontend sends — a simple toggle).
- `DELETE /admin/promos/:id`

**Verified Prisma model** (`PromoCode`) — **no mismatch**:
```
id, code (String, @unique), type (String), value (Float), maxUses (Int?),
usedCount (Int, default 0), expiresAt (DateTime?), eligibleRoles (String[], default []),
isActive (Boolean, default true), createdBy (FK to User via "PromoCodeCreator"),
createdAt, updatedAt, redemptions (relation to PromoRedemption[])
```

**Type values the frontend sends** (plain string, no enum enforcement needed): `PCT_SUBSCRIPTION`, `FIXED_CONSULTATION`, `FREE_TRIAL_DAYS`, `REFERRAL_CREDIT`.

**Suggested home**: new file `backend/src/admin/admin-promos.service.ts`.

**Verify**:
```bash
curl -X POST http://localhost:8080/admin/promos -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"code":"TEST2026","type":"PCT_SUBSCRIPTION","value":20,"eligibleRoles":[]}'
curl "http://localhost:8080/admin/promos?includeInactive=true" -H "Authorization: Bearer $TOKEN"
```
Then deactivate and delete it, confirming each step via a follow-up GET.

---

### TICKET 3 — Referrals Admin View

**Frontend**: `frontend/src/features/admin/admin-referrals-tab.tsx` (do not modify)

**Endpoints needed**:
- `GET /admin/referrals/stats` → returns `{ total: number, converted: number, rewarded: number, conversionRate: number, leaderboard: Array<{ user?: {id,name,email,avatar?}, count: number }> }`
- `GET /admin/referrals?page={n}` → returns `{ items: ReferralItem[], total, page, pages }` where `ReferralItem = { id, referrerId, referredId, code, rewardGranted, createdAt, referrer: {id,name,email}, referred: {id,name,email} }`
- `POST /admin/referrals/:id/credit` → marks a referral's `rewardGranted: true`. Check whether crediting should also trigger an actual wallet/balance credit — search for how the referral reward is granted elsewhere in the codebase first: `grep -rn "rewardGranted" backend/src --include="*.ts"` (this flag is set somewhere already, e.g. in the signup flow per `auth.service.ts`'s `linkReferral` method — read that method to understand what "granting a reward" actually does in this codebase, and replicate the same mechanism here rather than just flipping the boolean with no side effect).

**IMPORTANT — this is not a new table.** The `Referral` data already exists and is actively used elsewhere in the app (`auth.service.ts`'s `linkReferral`, `users.service.ts`, `subscriptions.service.ts`, `admin-trust-score.service.ts` all reference `prisma.referral`). This ticket is purely: add admin-facing **read** and **credit-action** endpoints on top of already-live data. Do not create a new model.

**Verified Prisma model** (`Referral`, mapped to table `referrals` via `@@map`) — **no mismatch**:
```
id, referrerId, referredId (String, @unique — each user can only be referred once),
code, rewardGranted (Boolean, default false), createdAt,
referrer (relation "ReferralsMade"), referred (relation "ReferralReceived")
```
Note the frontend's `ReferralItem.referredId` and its `referred` relation correspond to the schema's `referredId`/`referred` fields directly — no renaming needed.

**`conversionRate` calculation**: not stored anywhere, compute it as `rewarded / total * 100` rounded, matching what the frontend displays (`Conversion Rate ... referred → rewarded`).

**`leaderboard`**: group referrals by `referrerId`, count them, order descending, join user details, limit to a reasonable top-N (e.g. 10 — check if there's a similar leaderboard elsewhere, like `admin-market-intelligence`'s practitioner leaderboard, for a consistent limit convention).

**Suggested home**: new file `backend/src/admin/admin-referrals.service.ts`.

**Verify**:
```bash
curl http://localhost:8080/admin/referrals/stats -H "Authorization: Bearer $TOKEN"
curl "http://localhost:8080/admin/referrals?page=1" -H "Authorization: Bearer $TOKEN"
```
If there's no referral data in your test DB, the stats should return all zeros gracefully (not error) and the list should return `{items: [], total: 0, page: 1, pages: 1}` or similar — do not let an empty dataset throw.

---

### TICKET 4 — Community Stars & Badges — ⚠️ CONTAINS A REAL FIELD-NAME MISMATCH

**Frontend**: `frontend/src/features/admin/admin-community-tab.tsx` (do not modify)

**Endpoints needed**:
- `GET /admin/community/stars` → returns `{ topPosters: CommunityUser[], topStreaks: CommunityUser[], recentBadges: UserBadge[] }` where `CommunityUser = { id, name, email, avatar?, postCount?, contributionStreak?, longestStreak?, isCommunityBuilder? }`
- `POST /admin/community/badges/:userId` → body `{ badgeName: string, badgeSlug: string, description?: string, message?: string, promoteToBuilder?: boolean }`
- `DELETE /admin/community/badges/:badgeId` → revoke/delete a badge

**⚠️ MISMATCH — read this carefully before writing the service**: the frontend's `UserBadge` interface expects fields `badgeName`, `badgeSlug`, `description`, `message`. The **real** Prisma model is:
```
model UserBadge {
  id          String   @id @default(uuid())
  userId      String
  badgeKey    String   // Unique identifier for the badge type
  awardedAt   DateTime @default(now())
  awardedById String?
  reason      String?
  user        User     @relation("UserBadges", ...)
  awardedBy   User?    @relation("BadgeAwarder", ...)
}
```
There is **no `badgeName`, no `badgeSlug` (singular `badgeKey` only), no `description`, no `message` column.** Re-verify this yourself (`grep -n -A 15 "^model UserBadge" backend/prisma/schema.prisma`) before proceeding — do not take this document's word for it in case the schema has changed since this was written.

**Resolve it like this** (recommended, smallest change):
- On create (`POST .../badges/:userId`): persist only `badgeKey: dto.badgeSlug` and `reason: dto.message`. The `badgeName` and `description` inputs are display-only labels that the frontend already knows (they come from its own hardcoded `PRESET_BADGES` array, or from the custom-badge name the admin typed) — they don't need a database column, because on the way back out, you reconstruct them:
- On read (`GET /admin/community/stars`'s `recentBadges` field, and anywhere else `UserBadge` rows are serialized for this tab): map `badgeKey` back to a human `badgeName` using the **same preset list the frontend already has** — copy this exact list into your service (it's hardcoded in `admin-community-tab.tsx`, do not re-derive it differently):
  ```
  elder-voice → "Elder Voice"
  community-pillar → "Community Pillar"
  culture-keeper → "Culture Keeper"
  oral-historian → "Oral Historian"
  forum-guide → "Forum Guide"
  ```
  For any `badgeKey` not in this list (a custom badge an admin typed in), humanize it: `badgeKey.split('-').map(capitalize).join(' ')`. Map `reason` → the response's `message` field. There is no `description` to return — omit it or return `undefined`; the frontend only reads `description` inside its own preset list, not from the API response for `recentBadges`, so this is safe (re-check the frontend file yourself to confirm before assuming this).
- `promoteToBuilder`: the frontend's `CommunityUser.isCommunityBuilder` field corresponds to a real column — verify with `grep -n "isCommunityBuilder" backend/prisma/schema.prisma` and set it on the `User` row when `promoteToBuilder: true` is passed.

**`postCount` / `contributionStreak` / `longestStreak`**: check whether these are already-existing computed values elsewhere (search `grep -rn "contributionStreak\|longestStreak" backend/src --include="*.ts"` — there is at least a "digest opt-in and community builder" migration referenced in migration history, meaning this may already be tracked on the `User` model; verify the exact field names on `User` yourself before querying them).

**Suggested home**: extend the **existing** `backend/src/admin/admin-community.service.ts` (already registered in `admin.module.ts`, already handles circle-suggestions/advisory-board/reported-content — this is the same "community" domain) rather than creating a new service file.

**Verify**:
```bash
curl http://localhost:8080/admin/community/stars -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8080/admin/community/badges/<some-user-id> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"badgeName":"Elder Voice","badgeSlug":"elder-voice","message":"Thank you"}'
```
Confirm the badge shows up in a follow-up `GET /admin/community/stars` with the correct human-readable `badgeName` even though only `badgeKey` was stored.

---

### TICKET 5 — Cultural Content Calendar (3 sub-resources)

**Frontend**: `frontend/src/features/admin/admin-cultural-content-tab.tsx` (do not modify)

This tab has three independent sections. All three Prisma models **match the frontend exactly**, verified field-by-field — this is the cleanest ticket in this document.

#### 5a. Daily Words
- `GET /admin/cultural/daily-words` → `DailyWord[]` (no pagination in frontend, return all/upcoming — the frontend comment says "30-day queue", so filter to `date >= today` and reasonably `date <= today + 30 days`, ordered by `date` ascending)
- `POST /admin/cultural/daily-words` → body matches `DailyWord` minus `id`/`viewCount`: `{ word, pronunciation, definition, example, culturalContext, category, date }`
- `PATCH /admin/cultural/daily-words/:id` → same body shape, partial
- `DELETE /admin/cultural/daily-words/:id`

Model `DailyYorubaWord`: `id, word, pronunciation, definition, example, culturalContext, category, date (DateTime, @unique), viewCount (Int, default 0), createdAt, updatedAt`. Note `date` is `@unique` — a second word can't be scheduled for the same date; let the Prisma unique-constraint error surface as a 400 with a clear message ("A word is already scheduled for this date").

#### 5b. Oral History
- `GET /admin/cultural/oral-histories` → `OralHistory[]`, include `creator: {id, name}`
- `POST /admin/cultural/oral-histories` → body `{ title, category, babalawoName?, recordingDate?, tags: string[], content, sourceUrl?, publish: boolean }`
- `PATCH /admin/cultural/oral-histories/:id` → same body, partial, **plus** a special case: the frontend also calls this same PATCH endpoint with body `{ publish: boolean }` alone (the publish/unpublish toggle button) — your handler must support partial updates where only `publish` is sent.
- `DELETE /admin/cultural/oral-histories/:id`

Model `OralHistoryEntry`: `id, title, category, babalawoName (String?), recordingDate (DateTime?), tags (String[], default []), content, sourceUrl (String?), publishedAt (DateTime?), createdBy (FK to User, relation "OralHistoryCreator"), createdAt, updatedAt`.

**Translation needed**: the frontend sends `publish: true/false` — there is **no `publish` column**, only `publishedAt: DateTime?`. Translate: `publish: true` → set `publishedAt: new Date()`; `publish: false` → set `publishedAt: null`. Do this translation in the service layer, never try to write a `publish` field directly to Prisma (it will throw an unknown-field error).

`createdBy` is required — populate from `@CurrentUser()`.

#### 5c. Sacred Calendar Events
- `GET /admin/cultural/sacred-events` → `SacredEvent[]`
- `POST /admin/cultural/sacred-events` → body `{ title, yorubaName?, description, date, endDate?, type, bannerColor? }`
- `PATCH /admin/cultural/sacred-events/:id` → same body, partial, **plus** the frontend also sends `{ isActive: boolean }` alone for the activate/deactivate toggle — support that partial case too.
- `DELETE /admin/cultural/sacred-events/:id`

Model `SacredCalendarEvent`: `id, title, yorubaName (String?), description, date (DateTime), endDate (DateTime?), type (String, default "FESTIVAL"), bannerColor (String?), isActive (Boolean, default true), createdBy (FK, relation "SacredCalendarCreator"), createdAt, updatedAt`. `type` values the frontend sends: `FESTIVAL`, `CEREMONY`, `OBSERVANCE`, `ANNIVERSARY` (plain string, no enum enforcement required).

**Suggested home**: new file `backend/src/admin/admin-cultural-content.service.ts` with three logical groups of methods (or three small services if you prefer, but one file matching the one-tab-one-file frontend convention is simplest).

**Verify** (repeat the create → list → update → toggle → delete cycle for all three sub-resources):
```bash
curl -X POST http://localhost:8080/admin/cultural/daily-words -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"word":"Àṣẹ","pronunciation":"Ah-sheh","definition":"So it shall be","example":"Àṣẹ, my friend","culturalContext":"Sacred affirmation","category":"Spiritual","date":"2026-08-01"}'
curl -X POST http://localhost:8080/admin/cultural/oral-histories -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"Test Entry","category":"Elder Teaching","tags":[],"content":"Test content","publish":false}'
curl -X PATCH http://localhost:8080/admin/cultural/oral-histories/<id> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"publish":true}'
```
Confirm the second PATCH set `publishedAt` to a real timestamp, not that it errored on an unknown `publish` field.

---

### TICKET 6 — Featured Content

**Frontend**: `frontend/src/features/admin/admin-featured-content-tab.tsx` (do not modify)

**Endpoints needed**:
- `GET /admin/featured-content` → returns `{ threads: FeaturedItem[], products: FeaturedItem[], courses: FeaturedItem[], circles: FeaturedItem[] }` — the currently-featured items of each type (`isFeatured: true`).
- `GET /admin/featured-content/search?type={thread|product|course|circle}&q={query}` → returns `SearchResult[]` (items of the given type matching a text search on title/name, each annotated with `isFeatured: boolean`).
- `PATCH /admin/featured-content/:type/:id` → body `{ featured: boolean, featuredUntil: string | null }`. `:type` is one of `thread|product|course|circle` — route to the correct Prisma model based on this path param.

**Verified fields** — all four models have **matching** `isFeatured (Boolean, default false)` + `featuredUntil (DateTime?)` pairs (verify yourself: `grep -n "isFeatured\|featuredUntil" backend/prisma/schema.prisma` — at time of writing this appeared 4 times as matched pairs, corresponding to `ForumThread`, `Product`, `Course`, `Circle` — confirm the model names against the surrounding schema context yourself, do not assume the line numbers are still accurate).

**Search-by-type routing**: for `type=thread` search `ForumThread` (title contains query), `type=product` search `Product` (name/title — check the actual field name on `Product`, it may be `name` not `title`), `type=course` search `Course` (title), `type=circle` search `Circle` (name — check actual field name). **Do not assume the display field is called the same thing on every model** — check each one.

**Response item shape** — the frontend's `FeaturedItem` interface handles multiple possible "owner" shapes (`author`, `vendor`, `instructor`, `creator`) and multiple possible "label" fields (`title` or `name`) — include whichever relation is correct for each model type (e.g. threads have an `author`, products likely have a `vendor`, courses have an `instructor`, circles likely have a `creator` — verify each model's actual relation name in the schema before writing the `include` clause).

**Suggested home**: new file `backend/src/admin/admin-featured-content.service.ts`.

**Verify**:
```bash
curl http://localhost:8080/admin/featured-content -H "Authorization: Bearer $TOKEN"
curl "http://localhost:8080/admin/featured-content/search?type=thread&q=test" -H "Authorization: Bearer $TOKEN"
```

---

### TICKET 7 — Revenue Forecasting (analytics, no new table)

**Frontend**: `frontend/src/features/admin/admin-forecasting-tab.tsx` (do not modify)

**Endpoint needed**: `GET /admin/forecasting/revenue` → returns:
```typescript
{
  currentMRR: number; projectedMRR: number; churnAdjustedMRR: number;
  thisMonthGMV: number; monthlyGrowthRate: number;
  projectedAnnualGMV: number; projectedAnnualPlatformRevenue: number;
  platformCostNgn: number; breakEvenThreshold: number; monthsToBreakEven: number;
  churnRate: number; currentSubscribers: number;
  trend: Array<{ month: string; gmv: number; revenue: number }>;
}
```

This is a **computed analytics endpoint**, not CRUD — there is no dedicated table to query, you must derive every number from existing data. Real data sources to use (do not invent placeholder/fake numbers):
- `currentSubscribers` / `currentMRR`: query the `Subscription` model (see Ticket 17 for its exact fields) for `status: 'ACTIVE'`, sum `amountPaid` (note: **stored in kobo, an Int** — divide by 100 for Naira display, confirm this yourself by reading `Subscription.amountPaid`'s comment in the schema).
- `thisMonthGMV`: gross merchandise value — likely derived from completed `Appointment` records' price/fee this month, plus marketplace `Order` totals. Search `grep -rn "GMV\|gmv" backend/src --include="*.ts"` first — if another service already computes GMV (e.g. `admin-finance.service.ts` or `admin-marketplace.service.ts`), reuse that exact calculation rather than writing a second, possibly-different one.
- `monthlyGrowthRate`: compare this month's subscriber count/MRR to last month's.
- `churnRate`: subscriptions cancelled this month ÷ active subscriptions at start of month.
- `platformCostNgn`: **DECISION NEEDED** — there is likely no "platform operating cost" table in this app (it's a running cost like AWS/infra bills, not user data). Search `grep -rn "platformCost\|PLATFORM_COST" backend/src --include="*.ts"` first. If nothing exists, this needs either a hardcoded config value (check `backend/src/config/` or environment variables for something like this) or a new field on `PlatformSettings` (verify that model's existing fields first — `grep -n -A 20 "^model PlatformSettings" backend/prisma/schema.prisma`). Do not invent a specific Naira figure — if no source exists, add a configurable field to `PlatformSettings` and default it to `0` with a comment explaining an admin needs to set it via the settings tab, rather than hardcoding a guessed number into the service logic.
- `trend`: last 3 months of GMV/revenue, same computation as above grouped by month.

**Suggested home**: extend the **existing** `backend/src/admin/admin-finance.service.ts` (already handles disputes/withdrawals/fraud/subscription-stats — this is squarely the finance domain).

**Verify**: `curl http://localhost:8080/admin/forecasting/revenue -H "Authorization: Bearer $TOKEN"` — confirm every field is a real number (not `NaN`, not `undefined`) even against a test database with little/no data (all should gracefully compute to `0`, not throw).

---

### TICKET 8 — Cultural Integrity (2 sub-resources)

**Frontend**: `frontend/src/features/admin/admin-integrity-tab.tsx` (do not modify)

#### 8a. Review Queue
- `GET /admin/integrity/queue?page={n}` → `{ items: HeldPost[], total, page, pages }` where `HeldPost = { id, content, reviewReason?, createdAt, author: {id,name,email,avatar?,culturalLevel}, thread: {id,title,category:{id,name}} }`. Query `ForumPost` where `heldForReview: true`.
- `POST /admin/integrity/queue/:postId/approve` → set `heldForReview: false`, `reviewedBy: <admin id>`, `reviewedAt: now()` on the `ForumPost`.
- `POST /admin/integrity/queue/:postId/reject` → body `{ reason: string }`. Set `heldForReview: false` (post no longer shows in queue) but the post should presumably not become publicly visible either — check how forum post moderation/rejection is handled elsewhere (`grep -rn "heldForReview\|moderate" backend/src/forum --include="*.ts"`) and follow the same convention (e.g. does rejection set a `status: 'REJECTED'` or delete the post? Check `ForumPost`'s `status` field values first). Also: the frontend's reject reason is meant to be "sent to author" — check whether a notification-sending mechanism already exists for forum moderation actions and reuse it; do not silently drop the reason without notifying anyone if other moderation actions in this codebase do notify.

**Verified `ForumPost` fields relevant here** (re-verify yourself): `heldForReview (Boolean, default false), reviewReason (String?), reviewedBy (String?), reviewedAt (DateTime?)`.

#### 8b. Flag Rules
- `GET /admin/integrity/rules` → `FlagRule[]`, include `creator: {id, name}`
- `POST /admin/integrity/rules` → body `{ type: 'KEYWORD' | 'CATEGORY_MOD', value: string, reason?: string }`
- `PATCH /admin/integrity/rules/:id` → body `{ isActive: boolean }`
- `DELETE /admin/integrity/rules/:id`

**Verified Prisma model** (`ContentFlagRule`) — **no mismatch**: `id, type (String), value (String), reason (String?), isActive (Boolean, default true), createdBy (FK, relation "FlagRuleCreator"), createdAt, updatedAt`.

**Suggested home**: new file `backend/src/admin/admin-integrity.service.ts`.

**Verify**:
```bash
curl http://localhost:8080/admin/integrity/queue -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8080/admin/integrity/rules -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"type":"KEYWORD","value":"test-keyword","reason":"testing"}'
```

---

### TICKET 9 — Market Intelligence (analytics, no new table)

**Frontend**: `frontend/src/features/admin/admin-market-intelligence-tab.tsx` (do not modify)

**Endpoints needed**:
- `GET /admin/market-intelligence/leaderboard?sortBy={bookings|revenue|rating}` → `Practitioner[]` where each item is `{ id, name, trustScore, totalBookings, thisMonthBookings, momGrowth, thisMonthRevenue, avgConsultationPrice }`. Query `User` where `role: 'BABALAWO'`, joined/aggregated with `Appointment` (count + revenue, filtered to this calendar month for the "thisMonth" fields, all-time for `totalBookings`). `momGrowth` = percentage change in bookings vs. last month.
- `GET /admin/market-intelligence/signals` → `{ topPractitioners: [{name, bookings}], topSpecialisations: [{term, count}], avgConsultationPrice, minPrice, maxPrice }`. `topSpecialisations` — check the `User` model for a specialties/interests field on `BABALAWO` profiles (`grep -n "specialt\|interest" backend/prisma/schema.prisma`) to know what to aggregate on; do not invent a "specialisation" concept that doesn't map to a real column.

**Suggested home**: new file `backend/src/admin/admin-market-intelligence.service.ts`.

**Verify**: `curl "http://localhost:8080/admin/market-intelligence/leaderboard?sortBy=bookings" -H "Authorization: Bearer $TOKEN"` — confirm it returns an array (possibly empty) without erroring, and that sorting by each of the three `sortBy` values actually changes the order when there's more than one practitioner with appointments in the test data.

---

### TICKET 10 — Morning Brief (analytics aggregator, no new table)

**Frontend**: `frontend/src/features/admin/admin-morning-brief-tab.tsx` (do not modify)

**Endpoint needed**: `GET /admin/morning-brief` → returns:
```typescript
{
  signups: { today: number; yesterday: number; trend: number | null };
  pendingActions: { verifications: number; withdrawals: number; reports: number; disputes: number; total: number };
  revenue: { today: number; week: number; month: number };
  recentThreads: { id: string; title: string; createdAt: string; author: {id,name,avatar?}; hasReport: boolean }[];
  platformHealth: { database: 'ok'|'degraded'|'down'; api: 'ok'|'degraded'|'down' };
  generatedAt: string;
}
```

This is purely an aggregation of numbers **already computable from existing, working endpoints** — do not build new business logic, just call/reuse existing service methods:
- `pendingActions.verifications` — reuse whatever `admin.controller.ts`'s existing `GET verification-applications` endpoint counts (check `admin-users.service.ts` or wherever that's implemented).
- `pendingActions.withdrawals` — reuse `GET withdrawals/pending`'s underlying service method (`admin-finance.service.ts`'s `getPendingWithdrawals`).
- `pendingActions.reports` — reuse `GET reported-content`'s logic.
- `pendingActions.disputes` — reuse `getDisputes` from `admin-finance.service.ts` (or the real `/disputes` endpoint's service — see the disputes bug fix already applied in this codebase for context on where real dispute data lives).
- `revenue.*` — reuse whatever the financial-command-centre / forecasting tickets compute for GMV/revenue, filtered to today/this week/this month.
- `recentThreads` — query `ForumThread` ordered by `createdAt` desc, limit ~5-10, flag `hasReport` by checking for related `ForumReport` rows.
- `platformHealth` — check if there's an existing health-check mechanism (`backend/src/health/` — there is a real `/health` endpoint in this app already, reuse its underlying checks rather than reinventing).

**Suggested home**: a new thin method directly on `admin.service.ts` (the top-level orchestrator) that calls into the other already-injected services, since this ticket is explicitly "aggregate data that other tickets/services already compute" rather than owning any data itself. If Tickets 7/8/9 aren't done yet when you reach this one, implement this ticket last, after the others exist to call into.

**Verify**: `curl http://localhost:8080/admin/morning-brief -H "Authorization: Bearer $TOKEN"` — every nested field populated, no `undefined`/`NaN`.

---

### TICKET 11 — Featured Practitioners

**Frontend**: `frontend/src/features/admin/featured-practitioners-tab.tsx` (do not modify)

**Endpoints needed**:
- `GET /admin/practitioners/for-featuring` → `Practitioner[]` — all BABALAWO users with `{id, name, email, avatar?, bio?, averageRating, totalReviews, isFeatured, featuredOrder?, featuredExpiry?, createdAt, updatedAt}`.
- `GET /admin/practitioners/featured` → same shape, filtered to `isFeatured: true`.
- `PATCH /admin/practitioners/:id/featured` → body `{ userId, isFeatured, featuredOrder?, featuredExpiry? }`.

**Verified `User` fields** (re-verify: `grep -n "isFeatured\|featuredOrder\|featuredExpiry" backend/prisma/schema.prisma`) — these already exist on `User` (added for this exact purpose per this codebase's ADM-007 story): `isFeatured (Boolean, default false), featuredOrder (Int?), featuredExpiry (DateTime?)`. **No mismatch, this is the simplest ticket in this document** — straightforward `findMany`/`update` against existing columns.

**Suggested home**: extend `admin-trust-score.service.ts` (practitioner-quality domain) or `admin-users.service.ts` — pick whichever already has the least-cluttered `User`-querying logic for practitioners; check both files' current line counts and existing methods before deciding, per this codebase's stated preference (see `admin.module.ts`'s comment about `admin.service.ts` being split to stay under a line-count target) to avoid growing one file too large.

**Verify**:
```bash
curl http://localhost:8080/admin/practitioners/for-featuring -H "Authorization: Bearer $TOKEN"
curl -X PATCH http://localhost:8080/admin/practitioners/<id>/featured -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"userId":"<id>","isFeatured":true,"featuredOrder":1}'
curl http://localhost:8080/admin/practitioners/featured -H "Authorization: Bearer $TOKEN"
```
Confirm the featured practitioner appears in the second call.

---

### TICKET 12 — Financial Command Centre (analytics, no new table)

**Frontend**: `frontend/src/features/admin/financial-command-centre-tab.tsx` (do not modify)

**Endpoint needed**: `GET /admin/financial-command-centre` → returns:
```typescript
{
  metrics: {
    mrr: number; totalGmv: number; platformRevenue: number; pendingPayouts: number;
    refundsIssuedThisMonth: number; failedPaymentsThisMonth: number; subscriptionChurnThisMonth: number;
  };
  revenueChart: Array<{ month: string; revenue: number }>; // per the tab's comment: "7 metrics + 6-month chart"
}
```

Heavy overlap with Ticket 7 (Forecasting) and Ticket 10 (Morning Brief) — **reuse the same underlying calculations, do not write three different GMV/revenue computations across three tickets.** If you implement this ticket after Ticket 7, extract the shared GMV/MRR logic into a private helper method on `admin-finance.service.ts` and call it from both endpoints, rather than copy-pasting the query.

- `pendingPayouts` — reuse `getPendingWithdrawals` (already exists in `admin-finance.service.ts`).
- `refundsIssuedThisMonth` — check `RefundRequest` model (exists per ADM-012 — verify fields yourself) filtered to this month + approved status.
- `failedPaymentsThisMonth` — likely derived from `Subscription` rows with `status: 'PAST_DUE'` updated this month, or from a payment-transaction log if one exists (`grep -rn "PaymentTransaction\|Transaction" backend/prisma/schema.prisma` to check).
- `revenueChart` — 6 months of revenue, same source as Ticket 7's `trend` but 6 months instead of 3; consider making the month-count a parameter on the shared helper so both tickets can request different windows from the same function.

**Suggested home**: extend `admin-finance.service.ts`.

**Verify**: `curl http://localhost:8080/admin/financial-command-centre -H "Authorization: Bearer $TOKEN"` — 7 real numeric metrics, 6-entry chart array.

---

### TICKET 13 — Practitioner Complaints — ⚠️ CONTAINS A STATUS-VALUE MISMATCH

**Frontend**: `frontend/src/features/admin/practitioner-complaints-tab.tsx` (do not modify)

**Endpoints needed**:
- `GET /admin/complaints` → `PractitionerComplaint[]`
- `PATCH /admin/complaints/:complaintId/resolve` → body `{ action: string, resolutionNotes: string, clientNotification: string }`

**⚠️ MISMATCH**: the frontend's TypeScript interface declares `status: 'PENDING' | 'RESOLVED' | 'DISMISSED'`. The **real** Prisma model comment says the intended values are `OPEN | UNDER_REVIEW | RESOLVED | DISMISSED` (plain `String` column, default `"OPEN"` — no actual enum enforcement, so any string is technically storable, but re-verify the default and comment yourself: `grep -n -A 15 "^model PractitionerComplaint" backend/prisma/schema.prisma`). There is no `"PENDING"` in the model's own documented value set — the model's own default is `"OPEN"`.

**DECISION NEEDED**: pick one of:
(a) Treat `"OPEN"` and `"UNDER_REVIEW"` (rows not yet resolved) as what the frontend calls `"PENDING"` — map it in the service response (`status: dbRow.status === 'RESOLVED' || dbRow.status === 'DISMISSED' ? dbRow.status : 'PENDING'`), leaving the real DB value as `OPEN`/`UNDER_REVIEW` untouched.
(b) Just also accept `"PENDING"` as a value the frontend can set/see directly, since the column has no DB-level enum constraint.

Recommendation: (a) — it changes less, and preserves the more granular `OPEN` vs `UNDER_REVIEW` distinction the schema's own author clearly intended, in case something else later needs it. Whichever you choose, write a one-line comment at the mapping point explaining the choice, per Ground Rule 9.

**Relation naming**: the frontend expects the resolver's name under `resolver: { name }`. The Prisma relation is named `resolvedBy` (`resolvedBy User? @relation("ResolverComplaint", fields: [resolvedById], ...)`) — when you `include: { resolvedBy: { select: { name: true } } }`, Prisma will hand back the object as `resolvedBy: {...}` in the query result; you must **rename it to `resolver` in the HTTP response** (e.g. `{ ...complaint, resolver: complaint.resolvedBy }` and delete/omit the original key) to match what the frontend reads.

**Verified other fields** (match directly, no translation needed): `id, clientId, client:{id,name,email}, practitionerId, practitioner:{id,name,email,isVerified?? — check whether User has a `verified` field with this exact name}, reason, description, resolutionNotes, resolvedAt, createdAt, updatedAt`.

**`resolve` action body**: `{ action: string, resolutionNotes: string, clientNotification: string }` — `action` presumably determines the resulting status (e.g. `"resolve"` → `RESOLVED`, `"dismiss"` → `DISMISSED`); check the frontend's UI for what values of `action` it actually sends (read the file's dropdown/button options yourself) rather than guessing the exact string set.

**Suggested home**: new file `backend/src/admin/admin-complaints.service.ts`.

**Verify**: create a complaint directly via Prisma Studio or a raw insert (there's no user-facing "file a complaint" endpoint tested in this document — check if one exists first: `grep -rn "PractitionerComplaint" backend/src --include="*.controller.ts"`), then confirm `GET /admin/complaints` returns it with `status: "PENDING"` (per your mapping choice) even though the DB row says `"OPEN"`.

---

### TICKET 14 — Practitioner Performance (analytics, no new table)

**Frontend**: `frontend/src/features/admin/practitioner-performance-tab.tsx` (do not modify)

**Endpoint needed**: `GET /admin/practitioner-performance` → `PractitionerPerformance[]` where each item is:
```typescript
{
  id, name, email, totalConsultationsAllTime, totalConsultationsThisMonth,
  averageRating, totalReviews, responseRate, noShowRate, revenueGenerated,
  daysSinceLastLogin, daysSinceLastConsultation,
  status: 'Active' | 'Quiet' | 'Inactive' | 'At Risk',
  lastLoginAt?: Date, lastConsultationAt?: Date;
}
```

All derivable from `User` (role: BABALAWO) joined with `Appointment` (counts, revenue) and review data (check whether `BabalawoReview` or similar model holds `averageRating`/`totalReviews`, or whether these are precomputed columns directly on `User` — verify with `grep -n "averageRating\|totalReviews" backend/prisma/schema.prisma`).

**`status` derivation** — **DECISION NEEDED**, the exact thresholds aren't specified anywhere in the frontend or schema. Pick reasonable thresholds and document them in a comment, e.g.: `Active` = consultation in last 7 days, `Quiet` = 8–30 days, `Inactive` = 31–60 days, `At Risk` = 60+ days AND declining trend. Do not agonize over exact numbers — this is a judgment call the ticket explicitly allows, just be consistent and document your choice.

**responseRate / noShowRate**: check `Appointment` model's `status` field values (`grep -n "status.*String" backend/prisma/schema.prisma` near the `Appointment` model, or check the enum-like comment) for what statuses represent a no-show vs. a response, e.g. count of `status: 'NO_SHOW'` (if that value exists) over total, or derive from `Appointment.confirmedAt`/similar timestamp presence — verify actual status values used in this app rather than assuming `NO_SHOW` exists; check `grep -rn "'NO_SHOW'\|NoShow" backend/src --include="*.ts"` first.

**Suggested home**: extend `admin-trust-score.service.ts` (practitioner-quality domain, same as Ticket 11) — but check its size first per Ground Rule 5/8's file-size concern; if it's getting large, a new `admin-practitioner-performance.service.ts` is fine too.

**Verify**: `curl http://localhost:8080/admin/practitioner-performance -H "Authorization: Bearer $TOKEN"` against at least one real BABALAWO test user with a few appointments, confirm the numbers are plausible (not negative, not `NaN`).

---

### TICKET 15 — Trust Score Adjustments Listing (small addition to existing service)

**Frontend**: `frontend/src/features/admin/trust-score-management-tab.tsx` (do not modify)

**This ticket is small.** The individual override *action* already works (`PATCH /admin/trust-scores/override/:userId`, implemented in `backend/src/admin/admin-trust-score.service.ts`'s `applyOverride` method — already wired, already tested, do not touch it). What's missing is purely a **listing** endpoint.

**Endpoint needed**: `GET /admin/trust-score-adjustments` → `TrustScoreAdjustment[]` where:
```typescript
{ id, name, email, trustScoreOverride, trustScoreOverrideReason, trustScoreOverrideBy, trustScoreOverrideAt, createdAt, updatedAt }
```

**These field names match the real `User` model exactly** (`trustScoreOverride Float?, trustScoreOverrideAt DateTime?, trustScoreOverrideBy String?, trustScoreOverrideReason String?` — re-verify yourself) — this is a direct `findMany` with **no transformation needed**:
```typescript
this.prisma.user.findMany({
  where: { trustScoreOverride: { not: null } },
  select: { id: true, name: true, email: true, trustScoreOverride: true, trustScoreOverrideReason: true, trustScoreOverrideBy: true, trustScoreOverrideAt: true, createdAt: true, updatedAt: true },
});
```

**Suggested home**: add this as a new method directly on the **existing** `AdminTrustScoreService` class (`backend/src/admin/admin-trust-score.service.ts`) — it already has `getTrustScoreAudit`, `applyOverride`, `getOverrideHistory`; this is the same domain, do not create a new service file for a single query.

**Verify**: `curl http://localhost:8080/admin/trust-score-adjustments -H "Authorization: Bearer $TOKEN"` after applying at least one override via the already-working `PATCH .../override/:userId` endpoint — confirm the overridden user shows up in the list.

---

### TICKET 16 — Inactive Practitioners (mostly wiring existing logic — do not rewrite it)

**Frontend**: `frontend/src/features/admin/inactive-practitioner-tab.tsx` (do not modify)

**This ticket is smaller than it looks.** The core query logic **already exists** in `backend/src/admin/admin-users.service.ts`:
```typescript
async getInactivePractitioners(_currentUser: any, daysInactive: number): Promise<any[]> {
  const cutoff = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
  return this.prisma.user.findMany({
    where: {
      role: 'BABALAWO',
      OR: [
        { userSessions: { none: {} } },
        { userSessions: { every: { lastSeenAt: { lt: cutoff } } } },
      ],
    },
    select: { id: true, name: true, email: true, isOnLeave: true, isDeactivated: true },
  });
}
```
It's called from `admin.service.ts`'s `getInactivePractitioners` (which just delegates), which is in turn called from `inactive-practitioner-monitor.service.ts` (a daily cron job) — but **no controller route exposes it to the admin UI.** Do not rewrite this method — it's correct. You need to:

1. **Add two fields to its `select`**: `role: true, trustScore: true, createdAt: true` — the frontend's `InactivePractitioner` interface expects `{ id, name, email, role, isOnLeave, isDeactivated, trustScore, createdAt }`, currently missing `role`/`trustScore`/`createdAt` from the select clause. (`role` will always be `'BABALAWO'` here since it's filtered on, but the frontend interface expects the field present regardless.)
2. **Add a new controller route**: `GET /admin/inactive-practitioners?daysThreshold={n}` → calls `this.adminService.getInactivePractitioners(admin, Number(daysThreshold))`.
3. **Add two new action endpoints** (these do NOT already exist, write them fresh):
   - `POST /admin/practitioners/:practitionerId/re-engagement-action` → body `{ action: string, message?: string }`. The frontend sends three possible `action` values (read the file's button `onClick` handlers yourself to get the exact three strings — from the mutation's success-toast logic already shown in this file, they are `'send-message'`, `'mark-on-leave'`, and a third action that sets `isDeactivated` — confirm the exact third string from the source). For `'send-message'`: use existing `NotificationService` (already injected into `AdminModule`, check `notifications/notification.service.ts` for its send method signature) to notify the practitioner. For `'mark-on-leave'`: set `User.isOnLeave = true`. For the deactivate action: set `User.isDeactivated = true`.
   - `POST /admin/practitioners/:practitionerId/reactivate-listing` → set both `isOnLeave: false, isDeactivated: false`.

**Suggested home**: add the new controller routes to `admin.controller.ts` calling `adminService`/`adminUsersService` methods; add the two new action methods to `admin-users.service.ts` (same file the core query already lives in).

**Verify**:
```bash
curl "http://localhost:8080/admin/inactive-practitioners?daysThreshold=14" -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8080/admin/practitioners/<id>/re-engagement-action -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"action":"mark-on-leave"}'
```
Confirm the practitioner's `isOnLeave` becomes `true` in the database, then reactivate and confirm it flips back.

---

### TICKET 17 — Subscription Lists (partially exists — grant/winback already work)

**Frontend**: `frontend/src/features/admin/admin-subscription-tab.tsx` (do not modify)

**Already working, do not touch**: `GET /admin/subscription-stats`, `POST /admin/subscriptions/:id/cancel`, `POST /admin/subscriptions/:id/extend`, `POST /admin/subscriptions/:id/send-payment-reminder`, `POST /subscriptions/admin/grant`, `POST /subscriptions/admin/send-winback` — all confirmed present. Only the three **list** endpoints are missing:

- `GET /admin/subscriptions/active` → `Subscriber[]` = `{ id, userId, name, email, avatar?, plan, status, amountPaid, startDate, endDate, autoRenew, paystackRef? }`, filtered `status: 'ACTIVE'`.
- `GET /admin/subscriptions/cancelled` → `CancelledSubscriber[]` = `{ id, userId, name, email, plan, endDate, cancelledAt }`, filtered `status: 'CANCELLED'`.
- `GET /admin/subscriptions/failed-payments` → `FailedSubscriber[]` = `{ id, userId, name, email, plan, endDate, failedAt }`, filtered `status: 'PAST_DUE'`.

**Verified Prisma model** (`Subscription`, mapped to table `subscriptions`): `id, userId, plan (enum SubscriptionPlan: QUARTERLY|ANNUAL), status (enum SubscriptionStatus: ACTIVE|EXPIRED|CANCELLED|PAST_DUE), paystackSubId?, paystackRef?, startDate, endDate, autoRenew, amountPaid (Int, in kobo), currency, reminderSent, createdAt, updatedAt`.

**⚠️ Two things to flag, not silently paper over**:
1. **`amountPaid` is stored in kobo (an Int)**, e.g. ₦25,000 is stored as `2500000`. Check whether the frontend divides by 100 itself before displaying (read the render code in `admin-subscription-tab.tsx` yourself) — if it doesn't, divide by 100 in the service before returning so the number displayed is Naira, not kobo.
2. **There is no `cancelledAt` or `failedAt` column** — only `updatedAt`. Use `updatedAt` as the timestamp for both (it reflects when the status last changed, which for a subscription that's been `CANCELLED`/`PAST_DUE` and not touched since is a reasonable proxy) — map it to the field name the frontend expects (`cancelledAt` / `failedAt` respectively) in the response, do not try to add real new columns for this unless you have a strong reason to precisely track the status-change moment (a migration is a bigger, riskier change than this ticket calls for).

**Suggested home**: extend `admin-finance.service.ts` (it already has `getSubscriptionStats`) — same domain, same file.

**Verify**:
```bash
curl http://localhost:8080/admin/subscriptions/active -H "Authorization: Bearer $TOKEN"
curl http://localhost:8080/admin/subscriptions/cancelled -H "Authorization: Bearer $TOKEN"
curl http://localhost:8080/admin/subscriptions/failed-payments -H "Authorization: Bearer $TOKEN"
```

---

## 4. Suggested execution order

Not mandatory, but this order minimizes rework: do the "no mismatch, matches schema exactly" tickets first to build momentum and confidence in the pattern (2, 3, 5, 8, 11, 15, 16), then the ones with a flagged mismatch requiring a decision (1's email-sending question, 4, 13, 17), then the pure-analytics ones last since 10 and 12 depend on logic from 7 (7 → 12 → 10, in that order, extracting shared helpers as you go per the reuse notes in each ticket).

## 5. Final checklist before considering this document "done"

For **every** ticket:
- [ ] Backend typechecks with zero new errors (`cd backend && npx tsc --noEmit`)
- [ ] Every endpoint tested live with `curl` against a running local instance, with a real admin JWT, not just read as code
- [ ] Every mismatch flagged in this document was explicitly resolved one way or the other, with a one-line code comment explaining the choice
- [ ] No unrelated file was modified "as a drive-by fix"
- [ ] New services registered in `admin.module.ts`'s `providers` array (check the app actually boots: watch for `Nest can't resolve dependencies of ...` errors in the server logs, the exact class of bug this codebase's `admin.module.ts` comment describes having hit before)
- [ ] Frontend files themselves were **not modified** unless a ticket explicitly said so (the goal of this backlog is closing the backend gap under an already-built, already-correct frontend — if you find yourself wanting to change a frontend file, stop and re-read the ticket, you've likely misunderstood the required response shape rather than found a frontend bug)
