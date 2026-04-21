# V9 Forum Launch Backlog — Ìlú Àṣẹ
## "Dialogue" — The Living Room of the Culture

**Goal:** Launch the Ìlú Àṣẹ forum as the highest-engagement space on the platform.
BoxDen-style energy. Isese values. Yoruba identity at every layer.
**Total:** 9 Sprints · 180 Story Points
**Label format:** F9-XXX
**Branch:** `v9/forum-launch`

---

## 🎉 V9 STATUS: ALL 9 SPRINTS COMPLETE — 180/180 SP — March 23, 2026

**Tasks Completed in This Session:**

| Task | Status | Notes |
|------|--------|-------|
| F9-901: Practitioner Trust Score | ✅ DONE | `trustScore` field added, `recomputeTrustScore()` and `getTrustScoreTier()` methods implemented, badge component created |
| F9-902: Cultural Onboarding Gate | ✅ DONE | `passedCulturalOrientation` field added, validation in createPost(), modal component with 3 questions, endpoint at `PATCH /users/:id/cultural-orientation` |
| F9-903: Forum Health Metrics | ✅ DONE | `getDetailedMetrics(period)` method added, endpoint at `GET /forum/admin/metrics?period=7d|30d|90d` |
| F9-904: Oral History Archive | ✅ DONE | Pinned thread seeded in `yoruba-language-culture`, `oral-history` tag added, amber border treatment + sidebar quick link |
| F9-905: Youth Corner Category | ✅ DONE | 10th category added to seed script, will appear on next `npm run seed:forum-categories` |

**Database Migrations Applied:**
- `20260323000010_add_sprint9_trust_and_onboarding/migration.sql` ✅ Applied to PostgreSQL

**Build Status:**
- Backend: ✅ `npm run build` — PASS
- Frontend: ✅ `npm run build` — PASS (1.2 MB gzip, all modules transformed)

---

## Philosophy
> *"Ọ̀rọ̀ s'ọ̀rọ̀, ẹni t'ó bá mọ̀ ń gbọ́"* — Talk to talk; whoever understands, listens.

The forum is not a ticketing system. It is a *digital ìjọba* — a place where the community governs itself through wisdom, presence, and mutual acknowledgment. Every design decision should answer: **does this make the space feel more alive?**

---

## Current State Audit

| What Exists | State |
|-------------|-------|
| ForumCategory, ForumThread, ForumPost, PostAcknowledgment DB models | ✅ Solid schema |
| Àṣẹ acknowledgment with stacked avatars + tooltip | ✅ Built (Sprint 1) |
| Thread pin / lock / approve (admin) | ✅ Built |
| Thread creation open to all logged-in users | ✅ Built (Sprint 1 — Devoted gate removed) |
| 9 real forum categories seeded | ✅ Built (Sprint 1 — seed script) |
| Forum home with real API, 9 categories, role badges | ✅ Built (Sprint 1) |
| Dialogue ✦ CTA, relative timestamps, green pulse dot | ✅ Built (Sprint 1) |
| ForumRoleBadge component | ✅ Built (Sprint 1) |
| Socket.io forum:join/leave, viewer count, real-time posts | ✅ Built (Sprint 2) |
| Thread bookmarking (ForumBookmark model + UI) | ✅ Built (Sprint 2) |
| Thread share URL (clipboard + native share) | ✅ Built (Sprint 2) |
| Thread tags (schema + filter + UI) | ✅ Built (Sprint 2) |
| UserRole + culturalLevel badges on posts | ✅ Built (Sprint 1 + 2) |
| rankXP accrual + cultural level auto-promotion | ✅ Built (Sprint 4) |
| Forum reply notifications + @Mention notifications | ✅ Built (Sprint 3) |
| Anonymous posting in Seeker Questions | ✅ Built (Sprint 3) |
| @Mention system with autocomplete | ✅ Built (Sprint 3) |
| Thread templates (7 templates, 5 categories) | ✅ Built (Sprint 3) |
| Trending / hot threads (48h scoring) | ✅ Built (Sprint 4) |
| Odù of the Week auto-pinned thread | ✅ Built (Sprint 4) |
| Proverb of the Day banner | ✅ Built (Sprint 4) |
| Reported posts queue (admin) | ✅ Built (Sprint 4) |
| Full-text search (threads + posts, highlighted) | ✅ Built (Sprint 5) |
| Thread subscription bell toggle | ✅ Built (Sprint 5) |
| Forum onboarding tooltip tour | ✅ Built (Sprint 5) |
| Forum stats admin dashboard card | ✅ Built (Sprint 5) |
| Sacred Knowledge tag + disclaimer banner | ✅ Built (Sprint 6) |
| Mental health crisis detection + admin alert | ✅ Built (Sprint 6) |
| "Not medical advice" auto-footer (healing category) | ✅ Built (Sprint 6) |
| Elder Quiet Flag (cultural veto) | ✅ Built (Sprint 6) |
| Citation prompt in Ifá Studies | ✅ Built (Sprint 6) |
| Healing rate-limit warning | ✅ Built (Sprint 6) |
| WhatsApp deep link share button | ✅ Built (Sprint 7) |
| Weekly digest email | ✅ Built (Sprint 7) |
| Community Builder badge | ✅ Built (Sprint 7) |
| Contextual marketplace links in threads | ✅ Built (Sprint 7) |
| Micro-tipping on posts (wallet credit) | ✅ Built (Sprint 7) |
| First Responder badge | ✅ Built (Sprint 8) |
| Participation streak counter | ✅ Built (Sprint 8) |
| Elder Reactions (quick emoji reactions for Babalawos) | ✅ Built (Sprint 8) |
| Post Tag chips (Prayer/Guidance/Testimony/Question) | ✅ Built (Sprint 8) |
| Participation Leaderboard | ✅ Built (Sprint 8) |
| Àṣẹ Live audio space session management | ✅ Built (Sprint 8) |
| Practitioner Trust Score | ✅ Built (Sprint 9) |
| Cultural Onboarding Gate (quiz + endpoint) | ✅ Built (Sprint 9) |
| Forum Health Metrics Dashboard (7d/30d/90d) | ✅ Built (Sprint 9) |
| Oral History Archive | ✅ Built (Sprint 9) |
| Youth Corner category (10th category) | ✅ Built (Sprint 9) |

---

## Sprint 1 — Foundation: Categories, Gates & Identity
**Story Points: 21**

### F9-101 — Seed the 9 Forum Categories (3 SP)
**Why:** The forum has 2 demo categories. Users will open it and see a ghost town. 9 rich, culturally-named categories make the space feel intentional and deep before a single user posts.

**Backend:**
- New file: `backend/prisma/seed-forum-categories.ts`
- Upsert (safe to re-run) 9 categories:

| Order | Slug | Display Name | Icon | isTeachings | Notes |
|-------|------|-------------|------|-------------|-------|
| 1 | `idagbasile-ilana` | Ìdágbasílẹ̀ & Ìlànà | 🏛️ | false | Intros + guidelines |
| 2 | `ifa-divination-studies` | Ifá & Divination Studies | 🔮 | false | Core spiritual content |
| 3 | `healing-herbs-wellness` | Healing, Herbs & Spiritual Wellness | 🌿 | false | Ewe, baths, mental health |
| 4 | `yoruba-language-culture` | Yorùbá Language & Culture | 🗣️ | false | Language, proverbs, music |
| 5 | `temple-connections-events` | Temple Connections & Events | 👥 | false | Temple spotlights, travel |
| 6 | `seeker-questions` | Seeker Questions — No Judgment | ❓ | false | Highest traffic expected |
| 7 | `resources-recommendations` | Resources & Recommendations | 📚 | false | Books, apps, vendors |
| 8 | `culture-lifestyle` | Culture & Lifestyle | 🎵 | false | Music, fashion, art, humor |
| 9 | `practitioners-inner-circle` | Practitioners' Inner Circle | 🔐 | true | BABALAWO-only, requires approval |

- `package.json` script: `"seed:forum-categories": "tsx prisma/seed-forum-categories.ts"`
- Run once against production: `npm run seed:forum-categories`

**Files:** `backend/prisma/seed-forum-categories.ts`, `backend/package.json`

**Acceptance Criteria:**
- 9 rows in ForumCategory table after seed
- Re-run produces 0 duplicates (upsert on slug)
- Practitioners' Inner Circle has `isTeachings: true`

---

### F9-102 — Forum Home: Show All 9 Categories from Real API (5 SP)
**Why:** The forum home currently falls back to 2 hardcoded demo categories. Users should see the full 9 from the DB.

**Frontend — `frontend/src/features/forum/forum-home-view.tsx`:**
- Replace demo fallback with real `GET /forum/categories` call (React Query)
- Category sidebar renders all 9: icon (emoji from DB) + name + `threadCount` badge
- Selected category highlighted with amber left border
- "Practitioners' Inner Circle" hidden entirely for non-BABALAWO users (`user.role !== 'BABALAWO'`)
- Each category row shows a one-line description (add `description` field to seed data)
- Category descriptions:
  - `idagbasile-ilana`: "Welcome, introductions & community guidelines"
  - `ifa-divination-studies`: "Odù, divination tools, ethics in practice"
  - `healing-herbs-wellness`: "Ewe, spiritual baths, mental health & alignment"
  - `yoruba-language-culture`: "Proverbs, language practice, diaspora stories"
  - `temple-connections-events`: "Temple spotlights, travel tips, event announcements"
  - `seeker-questions`: "New to Ifá? Ask anything — no judgment here"
  - `resources-recommendations`: "Books, apps, vendor reviews, study guides"
  - `culture-lifestyle`: "Music, fashion, food, art & respectful humor"
  - `practitioners-inner-circle`: "Verified practitioners only — peer consultation & ethics"

**Frontend — `frontend/src/features/forum/create-thread-form.tsx`:**
- Category dropdown fetches from same `GET /forum/categories`
- Filter out `practitioners-inner-circle` for non-BABALAWO users
- Add tooltip on Seeker Questions: "Anonymous posting is available in this category"

**Files:** `frontend/src/features/forum/forum-home-view.tsx`, `frontend/src/features/forum/create-thread-form.tsx`

**Acceptance Criteria:**
- Forum home loads 9 categories from API (not hardcoded demo)
- Non-Babalawo user sees 8 categories (Practitioners hidden)
- Babalawo user sees all 9
- Category descriptions visible on hover or inline

---

### F9-103 — Remove Devoted Gate on Thread Creation (2 SP)
**Why:** Platform is early-stage. Open participation grows the community faster. Limit can be added later via env flag.

**Backend — `backend/src/forum/forum.service.ts`:**
- Remove `subscriptionStatus === 'DEVOTED'` check in `createThread()`
- Any authenticated user (any role, any plan) can create threads
- Add comment: `// TODO: Re-enable when platform scales: THREAD_MONTHLY_LIMIT = 25`
- Practitioners' Inner Circle category still requires `role === BABALAWO`

**Frontend — `frontend/src/features/forum/forum-home-view.tsx`:**
- Remove lock icon from "Start Discussion" / "Dialogue ✦" button for logged-in free users
- Still show login prompt for unauthenticated visitors

**Files:** `backend/src/forum/forum.service.ts`, `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- FREE user can successfully POST to `POST /forum/threads` and receive 201
- Lock icon gone from create button for logged-in users
- Unauthenticated users still prompted to log in

---

### F9-104 — Role Badges on Thread List & Thread Posts (5 SP)
**Why:** BoxDen's culture is powered by knowing *who* is speaking. A Verified Babalawo's post carries different weight than an anonymous reply. Badges create social proof and r1espect hierarchy.

**New shared component: `frontend/src/features/forum/forum-role-badge.tsx`**

```tsx
// Props: role, verified, subscriptionStatus, culturalLevel
// Returns a single badge pill or null
```

| Condition | Badge Text | Style |
|-----------|-----------|-------|
| `role === BABALAWO && verified` | ✓ Verified Babaláwo | Amber bg, white text |
| `role === BABALAWO && !verified` | Babaláwo | Stone outline |
| `role === ADMIN` | Moderator | Blue bg |
| `subscriptionStatus === DEVOTED` | 👑 Devoted | Amber outline + Crown icon |
| `culturalLevel === 'Omo Awo'` | Omo Awo | Purple outline |
| `culturalLevel` (other levels) | Level name | Gray outline |
| Everything else | null | — |

- Show ONE primary badge per author (priority: Verified Babalawo > Moderator > Babalawo > Devoted > culturalLevel)
- Badge renders after author name in thread list rows
- Badge renders after author name in each post within thread-view
- Author API responses already include `role`, `verified`, `subscriptionStatus`, `culturalLevel` — confirm backend returns these on thread/post author objects; add to select if missing

**Backend — `backend/src/forum/forum.service.ts`:**
- Ensure `author` select includes: `{ id, name, yorubaName, avatar, role, verified, subscriptionStatus, culturalLevel }`

**Files:** `frontend/src/features/forum/forum-role-badge.tsx` (NEW), `frontend/src/features/forum/forum-home-view.tsx`, `frontend/src/features/forum/thread-view.tsx`, `backend/src/forum/forum.service.ts`

**Acceptance Criteria:**
- Verified Babalawo posts show gold "✓ Verified Babaláwo" badge
- Admin posts show blue "Moderator" badge
- Devoted users show crown badge
- No badge shown for regular CLIENT users (clean, no clutter)
- Badges are pill-shaped, small, non-intrusive

---

### F9-105 — "Dialogue ✦" CTA + Relative Timestamps (3 SP)
**Why:** "Start Discussion" is generic. "Dialogue" is culturally resonant and signals this is a thoughtful space. Relative timestamps ("2 mins ago") make the forum feel alive — raw dates make it feel like an archive.

**Frontend — `frontend/src/features/forum/forum-home-view.tsx`:**
- "Start Discussion" button → **"Dialogue ✦"** with `title="Share your wisdom"` tooltip
- Thread list rows: replace raw date with relative time using `date-fns/formatDistanceToNow`
  - `lastPostAt` → "3 minutes ago", "2 hours ago", "Yesterday", "3 days ago"
  - Show full date on hover (title attribute)
- Empty state per category: *"Be the first to start a dialogue in this space. Dialogue ✦"*

**Files:** `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- Button reads "Dialogue ✦"
- Thread rows show "X mins ago" / "X hours ago" / "Yesterday"
- Hovering timestamp shows full ISO date
- Empty category state has culturally appropriate message

---

### F9-106 — Àṣẹ Acknowledgment: Stacked Avatars (3 SP)
**Why:** The acknowledgment system is the heart of the forum's reputation mechanic. Currently it's just a count. Making it visual — showing whose faces approved a post — adds social proof and encourages more acknowledgments.

**Frontend — `frontend/src/features/forum/ase-acknowledgment-button.tsx`:**
- When `acknowledgeCount >= 3`: show a stack of up to 3 mini circular avatars of acknowledgers
  - Fetch `GET /forum/posts/:postId/acknowledgments` lazily (on hover or after initial render)
  - Stack: overlapping circles, offset by 8px each, 20px diameter
- Tooltip on hover: *"Babaláwo Adesanya, Ìyá Kemi and 4 others spoke Àṣẹ to this"*
- When `acknowledgeCount === 0`: "Speak Àṣẹ" label
- When `acknowledgeCount === 1`: "1 acknowledged"
- When `acknowledgeCount >= 2`: "{N} acknowledged"

**Files:** `frontend/src/features/forum/ase-acknowledgment-button.tsx`

**Acceptance Criteria:**
- Stacked avatars visible when ≥ 3 acknowledgments
- Tooltip names top acknowledgers
- Works in both thread list (if shown) and thread detail view

---

## Sprint 2 — Real-Time Presence & Live Updates
**Story Points: 18**

### F9-201 — "X People Viewing This" Socket Presence (8 SP)
**Why:** Nothing signals a post is worth reading more than "47 people reading this". This single feature transforms the forum from a static blog into a living room.

**Architecture:** Extend existing `MessagingGateway` — no new gateway, no new infra.

**Backend — `backend/src/messaging/messaging.gateway.ts`:**
```typescript
@SubscribeMessage('forum:join')
handleForumJoin(@ConnectedSocket() client: Socket, @MessageBody() threadId: string) {
  client.join(`forum_thread:${threadId}`);
  const count = this.server.sockets.adapter.rooms.get(`forum_thread:${threadId}`)?.size ?? 1;
  this.server.to(`forum_thread:${threadId}`).emit('forum:viewers', { threadId, count });
}

@SubscribeMessage('forum:leave')
handleForumLeave(@ConnectedSocket() client: Socket, @MessageBody() threadId: string) {
  client.leave(`forum_thread:${threadId}`);
  const count = this.server.sockets.adapter.rooms.get(`forum_thread:${threadId}`)?.size ?? 0;
  this.server.to(`forum_thread:${threadId}`).emit('forum:viewers', { threadId, count });
}
```

- Also handle implicit leave on disconnect: in `handleDisconnect`, iterate client's rooms, leave all `forum_thread:*` rooms and broadcast updated counts
- Expose `server` property as `public` so `ForumService` can emit to it

**Backend — `backend/src/forum/forum.service.ts`:**
- Inject `MessagingGateway` (via `forwardRef` to avoid circular)
- After `createPost()` succeeds, emit:
  ```typescript
  this.messagingGateway.server
    .to(`forum_thread:${post.threadId}`)
    .emit('forum:new_post', { threadId: post.threadId, post: formattedPost });
  ```

**Backend — `backend/src/forum/forum.module.ts`:**
- Add `MessagingModule` to imports (with `forwardRef` if needed)
- Add `NotificationsModule` to imports

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
```typescript
// On mount:
socket.emit('forum:join', threadId);
// On unmount:
socket.emit('forum:leave', threadId);
// Listener:
socket.on('forum:viewers', ({ count }) => setViewerCount(count));
socket.on('forum:new_post', ({ post }) => setPosts(prev => [...prev, post]));
```

- Viewer banner: `👁️ {count} people reading this` — shown only when count > 1
- Banner styled subtly: small gray text top of thread, below title
- New posts appended in real-time without full page reload (React state update)
- New post gets a subtle "New" fade-in animation (opacity 0 → 1 over 300ms)

**Socket file:** Reuse existing socket from `frontend/src/lib/socket.ts` — confirm it exports a singleton

**Files:** `backend/src/messaging/messaging.gateway.ts`, `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.module.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Open same thread in 2 tabs → banner shows "2 people reading this"
- Close one tab → count drops to 1, banner disappears
- Reply in tab B → tab A auto-appends new post with fade-in
- Socket disconnect (navigating away) correctly decrements count

---

### F9-202 — "Last Seen Online" on Forum Home (2 SP)
**Why:** The forum home should show which categories are "hot right now". A last-activity indicator lets users navigate to active conversations.

**Frontend — `frontend/src/features/forum/forum-home-view.tsx`:**
- Thread list row right side: small pulsing green dot if `lastPostAt < 30 mins ago`
- Tooltip: "Active in the last 30 minutes"
- Category sidebar: show last thread title snippet under category name ("Latest: Odù Ogbe discussed 2h ago")

**Files:** `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- Green dot visible on threads with activity < 30 min
- Category sidebar shows last thread snippet

---

### F9-203 — Thread Bookmarking (3 SP)
**Why:** Users will discover great threads they want to return to. Bookmarking is a retention loop — it brings users back.

**Backend:**
- New Prisma model: `ForumBookmark` (`id`, `userId`, `threadId`, `createdAt`, unique: `[userId, threadId]`)
- New migration: `add_forum_bookmark`
- New endpoints in forum.controller.ts:
  - `POST /forum/threads/:id/bookmark` — add bookmark
  - `DELETE /forum/threads/:id/bookmark` — remove bookmark
  - `GET /forum/bookmarks` — get current user's bookmarked threads (paginated)

**Frontend:**
- Bookmark icon (Bookmark from lucide-react) in thread list row actions
- Filled/unfilled toggle state
- "Saved Threads" tab on forum home (alongside category list)
- Calls `GET /forum/bookmarks` when tab selected

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/forum-home-view.tsx`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Bookmark icon toggles on/off per thread
- "Saved Threads" tab shows all bookmarked threads for current user
- Bookmark persists across sessions (DB-backed, not localStorage)

---

### F9-204 — Thread Share URL (1 SP)
**Why:** Every thread should be shareable. This drives organic traffic and community growth.

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- "Share" button (Share2 icon from lucide-react) in thread header
- On click: copy `window.location.href` to clipboard + toast "Link copied!"
- On mobile: use `navigator.share()` API if available (falls back to clipboard)

**Files:** `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Share button copies current URL to clipboard
- Toast confirmation appears
- Mobile uses native share sheet when available

---

### F9-205 — Thread Tags (4 SP)
**Why:** Tags let users filter and find content. "Odù", "Dream", "Herbs", "Question" tags surface relevant threads faster than reading titles. Also enables future trending algorithm.

**Backend:**
- Add `tags String[]` to `ForumThread` model in schema.prisma
- New migration: `add_tags_to_forum_thread`
- Update `CreateThreadDto`: `@IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(5) tags?: string[]`
- `GET /forum/threads` accepts `?tag=` filter param

**Suggested tag vocabulary** (provide as suggested options, user can type custom):
- `question` `discussion` `resource` `dream` `odù` `herbs` `events` `language` `personal` `controversial` `elder-wisdom` `beginner`

**Frontend:**
- Tag selector in create-thread-form: multi-select chips (max 5), type-ahead from suggested list
- Tags shown as small pills on thread list rows
- Clicking a tag filters thread list to matching threads

**Files:** `backend/prisma/schema.prisma`, new migration, forum DTOs, `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/create-thread-form.tsx`, `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- Thread can be created with up to 5 tags
- Tags visible as pills on thread rows
- Clicking tag filters list correctly
- `GET /forum/threads?tag=odù` returns only tagged threads

---

## Sprint 3 — Notifications, Mentions & Anonymous Posting
**Story Points: 22**

### F9-301 — Forum Reply Notifications (5 SP)
**Why:** Without notifications, users post and never return. A notification that says "Babaláwo Adesanya replied to your thread" is the hook that brings them back.

**Backend — `common/src/enums/notification-type.enum.ts` (or wherever NotificationType lives):**
- Add: `FORUM_REPLY = 'FORUM_REPLY'`

**Backend — `backend/src/forum/forum.service.ts` in `createPost()`:**
After persisting post, collect recipients:
1. Thread creator (if not the poster)
2. All unique users who previously posted in the thread (if not the poster)
3. All users who bookmarked the thread (F9-203)

Deduplicate, then fire-and-forget for each:
```typescript
recipientIds.forEach(recipientId => {
  this.notificationService.createNotification({
    userId: recipientId,
    type: NotificationType.FORUM_REPLY,
    title: 'New reply in your discussion',
    message: `${poster.yorubaName ?? poster.name} replied to "${thread.title}"`,
    data: { threadId: thread.id, postId: post.id, category: thread.category.slug }
  }).catch(() => {});
});
```

- Notification click navigates to `/forum/thread/:id` (handle in frontend notification bell)

**Frontend:**
- Notification bell already handles all `NotificationType` values generically — no changes needed
- Ensure notification data has `threadId` so bell links correctly

**Files:** `common/src/enums/notification-type.enum.ts`, `backend/src/forum/forum.service.ts`

**Acceptance Criteria:**
- Reply to a thread → thread creator receives in-app notification
- Previous participants also notified
- Notification click navigates to the thread
- Poster does NOT get notified of their own reply

---

### F9-302 — @Mention System (7 SP)
**Why:** Direct mentions ("@Babaláwo_Kola what do you think?") drive targeted engagement and make discussions feel personal. Essential for vibrant forums.

**Backend:**
- Parse `content` field in `createPost()` for `@username` or `@yorubaName` patterns
- For each mention found: look up user by name/yorubaName, fire notification:
  ```typescript
  {
    type: NotificationType.MENTION, // Add MENTION to enum
    title: 'You were mentioned',
    message: `${poster.name} mentioned you in "${thread.title}"`,
    data: { threadId, postId }
  }
  ```
- Max 5 mentions per post (prevent spam)

**Frontend — `frontend/src/features/forum/thread-view.tsx` (reply textarea):**
- When user types `@`, show autocomplete dropdown of forum participants (fetch `GET /users?search=...`)
- Select completes `@yorubaName` or `@name` into the textarea
- In rendered posts: `@mention` styled in amber highlight: `<span class="text-amber-600 font-medium">@Kemi</span>`

**Recommendation:** Use a lightweight approach — detect `@` in textarea `onChange`, show floating dropdown, replace on selection. No need for a full rich text editor for this feature alone.

**Files:** `common/src/enums/notification-type.enum.ts`, `backend/src/forum/forum.service.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Typing `@` in reply box shows user autocomplete
- Selecting a user inserts @name into textarea
- Saving post sends MENTION notification to mentioned user
- @name renders in amber in displayed post

---

### F9-303 — Anonymous Posting in Seeker Questions (5 SP)
**Why:** The "Seeker Questions" category is the highest-traffic expected zone. Many seekers have sensitive questions about family, spiritual crisis, or personal struggles they won't ask under their real name. Anonymous posting removes this friction.

**Backend — `backend/prisma/schema.prisma`:**
- Add `isAnonymous Boolean @default(false)` to `ForumPost`

**Migration:** `backend/prisma/migrations/20260323000001_add_anonymous_to_forum_post/migration.sql`
```sql
ALTER TABLE "ForumPost" ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
```

**Backend — `backend/src/forum/dto/create-post.dto.ts`:**
- Add `@IsOptional() @IsBoolean() isAnonymous?: boolean`

**Backend — `backend/src/forum/forum.service.ts`:**
- `createPost()`: if `isAnonymous === true`, verify thread category is `seeker-questions` — reject otherwise with 400
- `getPostsByThread()`: when `isAnonymous === true`, return masked author:
  ```typescript
  author: post.isAnonymous && requester.role !== 'ADMIN'
    ? { id: 'anon', name: 'Anonymous Seeker', yorubaName: null, avatar: null, role: null, verified: false, culturalLevel: null }
    : post.author
  ```
- Admin/moderators receive real author data always (for moderation)

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- When thread category is `seeker-questions`: show checkbox below reply textarea
  ```
  ☐ Post anonymously — your name will be hidden from other community members
  ```
- Anonymous posts render with:
  - Silhouette avatar (gray `UserCircle` icon)
  - *"Anonymous Seeker"* in italic muted text
  - No role badge, no cultural level
  - Small lock icon to signal anonymity

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/dto/create-post.dto.ts`, `backend/src/forum/forum.service.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Anonymous checkbox only appears in Seeker Questions threads
- Posting anonymously shows "Anonymous Seeker" to other users
- Admin sees real author identity
- Attempting anonymous post in another category returns 400
- Author's own posts show their name to themselves (personal context)

---

### F9-304 — Thread Templates (5 SP)
**Why:** "Ask About Odù" threads all need the same structure (Odù name, question type, context). Templates guide users to post quality content that practitioners can actually answer. Structure = better responses.

**Pre-built templates:**

| Template | Category | Trigger | Pre-fills |
|----------|----------|---------|-----------|
| Ask About an Odù | Ifá Studies | "New Thread" in category | Title: "Question about Odù [name]:" + body prompt |
| Share a Dream | Ifá Studies | — | Body: "Date:", "Dream description:", "Feelings during:", "Current life context:" |
| Introduce Yourself | Ìdágbasílẹ̀ | Default in that category | Body: "Who I am:", "How I found Ifá:", "What I'm seeking:", "Where I'm from:" |
| Event Announcement | Temple Connections | — | Body: "Event name:", "Date & Time:", "Location (physical/virtual):", "Registration link:", "Hosted by:" |
| Resource Recommendation | Resources | — | Body: "What I'm recommending:", "Why:", "Where to find it:", "Best for:" |

**Frontend — `frontend/src/features/forum/create-thread-form.tsx`:**
- When a category is selected, show template selector if templates exist for that category
- "Use template" button pre-fills title + body textarea
- User can edit freely after template loads
- Template shown as light dashed border preview before accepting

**Files:** `frontend/src/features/forum/create-thread-form.tsx` (templates as static data in same file or adjacent `forum-templates.ts`)

**Acceptance Criteria:**
- Selecting "Ifá & Divination Studies" shows template options
- Clicking template pre-fills title and body
- User can clear and type freely
- Templates available for 5 categories

---

## Sprint 4 — Engagement Loops & Community Growth
**Story Points: 21**

### F9-401 — Trending / Hot Threads Section (5 SP)
**Why:** New visitors need a reason to stay. A "🔥 Hot Right Now" section showing the 5 most-engaged threads in the last 48 hours is the first thing that makes the forum feel alive to someone who's never posted.

**Backend — `backend/src/forum/forum.service.ts`:**
- New method: `getTrendingThreads(limit = 5)`
- Trending score formula: `(postCount × 3) + (viewCount × 0.5) + (acknowledgmentCount × 5)` where all values are from the last 48 hours
- Raw SQL or Prisma groupBy to compute — returns top N threads
- New endpoint: `GET /forum/trending` (no auth required)

**Frontend — `frontend/src/features/forum/forum-home-view.tsx`:**
- "🔥 Hot Right Now" horizontal scroll section at top of thread list (above category filter)
- Shows 5 cards: thread title, category badge, stat summary (posts, views, Àṣẹ count)
- Clicking navigates to thread
- Refreshes every 5 minutes (React Query `staleTime: 5 * 60 * 1000`)

**Files:** `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- `GET /forum/trending` returns up to 5 threads sorted by score
- Trending section visible on forum home above thread list
- Refreshes without page reload
- Threads with 0 posts excluded

---

### F9-402 — Weekly Odù of the Week (Auto-Pinned Thread) (4 SP)
**Why:** BoxDen's "What are you listening to?" weekly threads generate hundreds of replies. The Odù of the Week is this platform's equivalent — a recurring anchor that gives the community a shared focus point.

**Backend:**
- ScheduleModule is disabled (Reflector circular issue). Use the same on-fetch trigger pattern from the subscription renewal reminder.
- New method: `ensureOduOfWeek()` called inside `getCategories()` or `getThreadsByCategory('ifa-divination-studies')`
- Logic: check if a pinned thread with `tags: ['odu-of-week']` exists in the current ISO week number → if not, create it
- Thread auto-created by a designated admin account (configurable `ODUS_OF_WEEK_AUTHOR_ID` env)
- Weekly Odù cycling: array of 16 principal Odù, cycle by `weekNumber % 16`

```typescript
const ODU_LIST = [
  'Ogbe', 'Oyeku', 'Iwori', 'Odi', 'Irosun', 'Owonrin',
  'Obara', 'Okanran', 'Ogunda', 'Osa', 'Ika', 'Oturupon',
  'Otura', 'Irete', 'Ose', 'Ofun'
];
```

- Thread title: `🔮 Odù of the Week: ${oduName} — Week ${weekNum}, ${year}`
- Body: Standard opening prompt seeded in thread content
- Auto-pinned, locked after 7 days

**Frontend:** No changes needed — thread appears in Ifá Studies category like any pinned thread.

**Files:** `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.module.ts`

**Acceptance Criteria:**
- First time `getThreadsByCategory('ifa-divination-studies')` is called in a new week → pinned Odù thread created
- Correct Odù cycling through all 16
- Thread is pinned and marked with `odu-of-week` tag
- Previous week's thread remains (not deleted), just unpinned

---

### F9-403 — rankXP Accrual on Forum Activity (4 SP)
**Why:** The `rankXP` field has sat empty since V1. Activating it gives users a reason to contribute. Cultural levels (Omo Ilé → Omo Awo) become meaningful progression, not just labels. This is the gamification backbone for the platform.

**XP Rules:**
| Action | XP Earned |
|--------|-----------|
| Create a thread | +10 XP |
| Reply to a thread | +5 XP |
| Receive an Àṣẹ acknowledgment | +3 XP per acknowledgment |
| Thread reaches 20 replies | Author gets +25 bonus XP |
| Thread reaches 100 views | Author gets +15 bonus XP |

**Cultural Level Thresholds:**
| Level | XP Threshold |
|-------|-------------|
| Omo Ilé (Child of the House) | 0 |
| Akeko (Dedicated Student) | 100 |
| Oye (Titled Initiate) | 500 |
| Aremo (Crown Prince) | 1,500 |
| Omo Awo (Child of the Priest) | 5,000 |

**Backend — `backend/src/forum/forum.service.ts`:**
- After `createThread()`: `prisma.user.update({ where: { id: authorId }, data: { rankXP: { increment: 10 } } })`
- After `createPost()`: increment poster's rankXP by 5
- After `acknowledgePost()`: increment post author's rankXP by 3
- Check thresholds and auto-promote `culturalLevel` field if XP crosses boundary
- All fire-and-forget (`.catch(() => {})`)

**Frontend — `frontend/src/features/forum/forum-role-badge.tsx`:**
- Cultural level badge already renders from `culturalLevel` field (F9-104)
- No additional changes — badge updates automatically as level promotes

**Files:** `backend/src/forum/forum.service.ts`

**Acceptance Criteria:**
- `rankXP` increments correctly on thread create, post, acknowledgment received
- User crosses 100 XP → `culturalLevel` updates to "Akeko"
- XP updates are non-blocking (fire-and-forget)

---

### F9-404 — Proverb of the Day Banner (2 SP)
**Why:** Opening the forum should feel like entering a cultural space. A rotating Yoruba proverb at the top of the forum home creates atmosphere and signals "this is not Reddit".

**Frontend — `frontend/src/features/forum/forum-home-view.tsx`:**
- Amber/gold banner at top of forum: `"Ọ̀rọ̀ s'ọ̀rọ̀, ẹni t'ó bá mọ̀ ń gbọ́"` — rotates daily
- 10 pre-loaded proverbs in a static array, selected by `dayOfYear % 10`
- English translation beneath in smaller muted text
- Dismissible per session (localStorage `forum_proverb_dismissed_${date}`)

**Suggested proverbs:**
1. *Ọ̀rọ̀ s'ọ̀rọ̀, ẹni t'ó bá mọ̀ ń gbọ́* — "Talk to talk; whoever understands, listens"
2. *Àgbàdo tó bá jo ẹgbẹ rẹ kò ní jẹ nìkan* — "The corn that burns its neighbour will not eat alone"
3. *Ìwà l'ẹwà* — "Character is beauty"
4. *Ojú tó rán ìmọ̀ ńkọ́ ìmọ̀* — "The eyes that have seen knowledge do not unlearn knowledge"
5. *Àṣẹ* — "May it be so" (used as closing affirmation)

**Files:** `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- Proverb banner visible at top of forum home
- Changes daily (day-based selection)
- Dismissible with X button (persists for the day)
- English translation shown beneath

---

### F9-405 — Reported Posts Queue (Admin) (6 SP)
**Why:** A community of this cultural sensitivity needs moderation. Users need a trusted way to flag harmful content. Admins need a queue to review it. Without this, one bad actor can poison the space.

**Backend:**
- New Prisma model: `ForumReport` (`id`, `reporterId`, `postId`, `threadId?`, `reason` String, `status` String default 'PENDING', `reviewedBy?`, `reviewedAt?`, `action?`, `createdAt`)
- New migration: `add_forum_report`
- New endpoints:
  - `POST /forum/posts/:postId/report` — any user, body: `{ reason: string }`, max 1 report per user per post
  - `GET /forum/reports` — ADMIN only, returns paginated pending reports with post context
  - `PATCH /forum/reports/:id` — ADMIN only, `{ action: 'dismiss' | 'hide_post' | 'warn_user' | 'ban_user' }`

**Frontend:**
- Thread post: "..." overflow menu → "Report this post" option
- Report modal: reason dropdown (Misinformation, Spam, Harassment, Cultural Disrespect, Exploitation, Other) + optional note
- Success: "Your report has been submitted. Our community moderators will review it."
- Admin: new "Reports" tab in Admin Dashboard (alongside Subscriptions, Users, etc.)
  - Table: post excerpt | reporter | reason | date | action buttons
  - "Dismiss" (no action), "Hide Post" (sets status=HIDDEN), "Warn User" (sends warning notification), "Ban User"

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/thread-view.tsx`, `frontend/src/features/admin/admin-dashboard-view.tsx` (new tab)

**Acceptance Criteria:**
- User can report a post with a reason
- One report per user per post enforced
- Admin sees pending reports in dashboard
- "Hide Post" action sets post status to HIDDEN and it disappears from thread view
- Reporter notified when action taken on their report

---

## Sprint 5 — Search, Discovery & Polish
**Story Points: 15**

### F9-501 — Forum Full-Text Search (5 SP)
**Why:** A forum with no search is a library with no index. As threads accumulate, discoverability becomes the #1 retention problem.

**Backend — `backend/src/forum/forum.service.ts`:**
- Enhance `getThreads()` search: currently title/content/author. Add tag search.
- Add `GET /forum/search?q=` endpoint:
  - Searches: thread titles, thread content (first post), post content
  - Returns: mixed results (threads + posts), sorted by relevance
  - Postgres `ILIKE '%query%'` for now; note that full-text search with `tsvector` is the upgrade path

**Frontend:**
- Existing search input in forum-home-view already calls search — extend to also show post-level results
- Search results page: grouped by type (Threads / Posts), shows excerpt with query term highlighted
- "No results" state: "No threads found for '{query}' — be the first to start this conversation! Dialogue ✦"

**Files:** `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- Search finds threads by title, content, tags, and category
- Results highlight matched terms
- Empty state prompts user to create the thread
- Response < 500ms for typical queries

---

### F9-502 — Thread Subscription Toggle (3 SP)
**Why:** Separate from bookmarks — a subscription means "notify me of all new replies". Let users explicitly opt in or out per thread.

**Backend:**
- New Prisma model: `ForumSubscription` (`id`, `userId`, `threadId`, `createdAt`, unique: `[userId, threadId]`)
- Auto-subscribe: on `createThread()` and `createPost()`, upsert subscription for author
- Endpoints:
  - `POST /forum/threads/:id/subscribe`
  - `DELETE /forum/threads/:id/subscribe`
  - Returns current subscription status on thread detail

**Frontend:**
- Bell icon in thread header: filled = subscribed, outline = unsubscribed
- Tooltip: "Notify me of new replies" / "Mute this thread"
- F9-301 notifications use this subscription model (already planned)

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Subscribe/unsubscribe toggle works
- Thread creator auto-subscribed on creation
- Reply poster auto-subscribed on reply
- F9-301 only notifies subscribed users

---

### F9-503 — Forum Onboarding Tooltip Tour (3 SP)
**Why:** New users land on the forum and see 9 categories and don't know where to start. A 3-step tooltip tour ("Welcome to Dialogue → Start in Seeker Questions → Speak Àṣẹ to great posts") converts lurkers to contributors.

**Frontend:**
- 3-step tooltip tour, shown once (localStorage: `forum_tour_complete`)
- Step 1 (category list): "9 spaces for dialogue — start with Seeker Questions if you're new"
- Step 2 (thread list): "Threads showing 🟢 are active right now"
- Step 3 (Àṣẹ button): "Speak Àṣẹ to acknowledge great wisdom"
- Dismiss at any step; never shown again after completion
- Uses simple positioned tooltips (no library needed — CSS `absolute` positioning)

**Files:** `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- Tour shown on first visit to forum (not shown to returning users)
- 3 steps navigable with Next/Skip
- Completion saved to localStorage
- Tour doesn't appear on mobile (too intrusive) — desktop only

---

### F9-504 — Community Covenant Pinned Thread (2 SP)
**Why:** The platform's cultural values need to be visible, not buried in a terms page. A beautifully written Community Covenant as a pinned thread in Ìdágbasílẹ̀ sets the tone from day one.

**Backend:**
- Seed script creates 2 pinned, locked threads in `idagbasile-ilana` category:
  1. **"Community Covenant — The Àṣẹ of This Space"** — rules written in bilingual Yoruba/English, culturally grounded
  2. **"How to Ask a Babaláwo — Etiquette Guide"** — practical guide on respectful inquiry

- Both: `isPinned: true`, `isLocked: true`, `isApproved: true`
- Authored by platform admin account

**Seed content (Community Covenant highlights):**
- "Speak truth. Challenge ideas. Never attack the person."
- "Elders are addressed with respect. Titles matter."
- "Misinformation about Ifá will be removed — this is a sacred space."
- "Questions are sacred. There are no foolish seekers."
- "Àṣẹ — what you speak, you call into being. Speak well."

**Files:** `backend/prisma/seed-forum-categories.ts` (extend the same seed script)

**Acceptance Criteria:**
- 2 pinned, locked threads in Ìdágbasílẹ̀ category after seed run
- Threads readable by all, replies disabled
- Appear at top of category, above all other threads

---

### F9-505 — Forum Stats in Admin Dashboard (2 SP)
**Why:** Admins need to see forum health at a glance — total threads, posts today, active users, reported posts pending.

**Backend — `backend/src/admin/admin.service.ts`:**
- Add `getForumStats()`:
  ```typescript
  {
    totalThreads, totalPosts, postsToday,
    activeUsersLast7Days, // distinct authorIds in last 7 days
    pendingReports,
    topCategories: [{ name, threadCount }] // top 3
  }
  ```
- New endpoint: `GET /admin/forum-stats` (ADMIN only)

**Frontend:**
- In admin-subscription-tab or new admin-forum-tab: stats grid showing the above
- "Pending Reports" card shows count with "Review" link to F9-405 reports queue

**Files:** `backend/src/admin/admin.service.ts`, `backend/src/admin/admin.controller.ts`, `frontend/src/features/admin/admin-dashboard-view.tsx`

**Acceptance Criteria:**
- Admin sees total threads, posts today, active users, pending reports
- Numbers load from real API
- Pending reports card links to report queue

---

---

## Sprint 6 — Cultural Safeguards & User Safety
**Story Points: 26**
*These are not optional polish — they are the foundation of community trust. Ship before the forum goes fully public.*

### F9-601 — Sacred Knowledge Tag + Disclaimer System (5 SP)
**Why:** The single highest-leverage protection for the tradition. Some threads will contain initiatory content, esoteric knowledge, or ritual details that should not be freely visible to unregistered visitors or casual browsers. A "Sacred Knowledge" tag + disclaimer preserves cultural integrity without censorship.

**Backend — `backend/prisma/schema.prisma`:**
- Add `isSacred Boolean @default(false)` to `ForumThread`
- Add migration: `add_is_sacred_to_forum_thread`

**Backend — `backend/src/forum/forum.service.ts`:**
- Thread author + admin can mark a thread as sacred via `PATCH /forum/threads/:id` (`isSacred: true`)
- `findAllThreads()`: if requester is unauthenticated, filter out `isSacred: true` threads entirely
- `findThreadById()`: if unauthenticated + `isSacred: true` → return 403 with message: "This discussion contains sacred knowledge. Please sign in to participate respectfully."

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- Sacred threads show a banner below the title:
  ```
  🔱 Sacred Knowledge
  "This discussion contains initiatory or esoteric content shared in trust.
  For personal guidance, consult a verified Babaláwo."
  ```
  Amber border, understated styling — respectful, not alarming.

**Frontend — `frontend/src/features/forum/create-thread-form.tsx`:**
- Checkbox at bottom: `[ ] Mark as Sacred Knowledge — limits visibility to registered members`
- Tooltip: "Use this for discussions involving ritual details, initiatory content, or esoteric Odù teachings."

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/create-thread-form.tsx`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Unauthenticated visitor cannot see sacred thread list or content
- Sacred thread shows amber disclaimer banner to logged-in users
- Author can mark/unmark; admin can always override
- Regular thread creation has opt-in sacred checkbox

---

### F9-602 — Mental Health Crisis Detection + Resources (4 SP)
**Why:** Spiritual platforms attract people in pain. Someone exploring Ifá after a loss, during a mental health crisis, or seeking spiritual answers to deep suffering WILL post in the Seeker Questions category. Detecting distress signals and providing crisis resources is non-negotiable.

**Backend — `backend/src/forum/forum.service.ts`:**
- In `createPost()` and `createThread()`: scan `content` against a keyword list:
  ```typescript
  const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'end my life', 'hurt myself',
    'can\'t go on', 'want to die', 'harm myself', 'no reason to live'];
  ```
- If detected: flag post with `hasCrisisSignal: true` (add field to ForumPost)
- Do NOT block post — allow it through. Notify admin via `SYSTEM` notification: "Post flagged for welfare review"
- Return special field in API response: `{ crisisDetected: true }` alongside the created post

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- If API returns `crisisDetected: true` after posting: show gentle modal before redirecting:
  ```
  "You are not alone. 🙏🏾
  If you're going through something difficult right now, support is available:
  • Nigeria: Mentally Aware Initiative — 0800 200 0248 (free, 24/7)
  • UK: Samaritans — 116 123 (free, 24/7)
  • US: 988 Suicide & Crisis Lifeline — call or text 988
  • Talk to a community mod: [Message a Moderator]"
  ```
- User can dismiss and their post remains visible — this is a support resource, not a removal

**Files:** `backend/src/forum/forum.service.ts`, `backend/prisma/schema.prisma` (add `hasCrisisSignal`), `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Post containing "kill myself" triggers modal with crisis resources
- Post still publishes — no content suppressed
- Admin receives notification to check the thread
- Modal is gentle, non-alarmist, and actionable
- Keywords are case-insensitive, phrase-matched (not word-matched — "hurt myself" not "hurt")

---

### F9-603 — Auto-Footer: "Not Medical/Legal Advice" in Healing Category (2 SP)
**Why:** Protects users and the platform legally. A sister posting about using Ewe for a child's illness needs to see this. A single lawsuit over misinterpreted spiritual advice could destroy the platform.

**Backend — `backend/src/forum/forum.service.ts`:**
- In `findPostsByThread()`: if thread's category is `healing-herbs-wellness`, append metadata: `{ showHealthDisclaimer: true }` to response
- Same for `createPost()` response in that category

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- When `category.slug === 'healing-herbs-wellness'`: render a fixed footer banner inside the thread view:
  ```
  ⚕️ Community Wisdom Notice
  "Discussions here share traditional knowledge and lived experience.
  Spiritual practices complement — they do not replace — professional medical, legal, or psychological care.
  For serious health concerns, please consult a qualified practitioner."
  ```
- Subtle, not intrusive — small gray bar at bottom of thread, not a blocking modal

**Files:** `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Disclaimer visible on all threads in Healing category
- Not shown in other categories
- Non-intrusive (bottom banner, not popup)
- Clearly distinguishes "spiritual complement" from "replacement"

---

### F9-604 — Elder Quiet Flag (Cultural Veto) (5 SP)
**Why:** When a verified elder sees a post that misrepresents the tradition, the *last* thing you want is a public argument. A quiet flag — visible only to admins + the flagging elder — allows correction without drama. Preserves dignity. Prevents division.

**Backend — `backend/prisma/schema.prisma`:**
- New model: `ElderFlag` (`id`, `postId`, `flaggedBy` (userId), `reason` String, `status` String default 'PENDING', `reviewedBy?`, `reviewedAt?`, `createdAt`)
- Constraint: `flaggedBy` must have `role === BABALAWO && verified === true`

**New endpoints:**
- `POST /forum/posts/:postId/elder-flag` — BABALAWO + verified only; body: `{ reason: string }`
- `GET /forum/elder-flags` — ADMIN only; returns pending flags with full post context
- `PATCH /forum/elder-flags/:id` — ADMIN only; `{ action: 'acknowledge' | 'remove_post' | 'request_edit' | 'dismiss' }`

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- Verified Babalawo users see extra menu item on posts: "🔱 Flag as Culturally Inaccurate" (in the `...` overflow menu)
- Submitting opens a private modal: "Your concern will be reviewed by our moderation team. This flag is not visible to the post author or community."
- Confirmation: "Thank you, Elder. Your guidance protects the tradition."

**Admin — `frontend/src/features/admin/admin-dashboard-view.tsx`:**
- New "Elder Flags" section within the Reports tab (or sub-section)
- Shows: post excerpt | flagging elder's name | reason | date
- Actions: Acknowledge (no action needed), Request Edit (notify author), Remove Post, Dismiss

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/thread-view.tsx`, `frontend/src/features/admin/admin-dashboard-view.tsx`

**Acceptance Criteria:**
- Only verified Babalawos see the "Flag as Culturally Inaccurate" option
- Flag is invisible to post author and all non-admin users
- Admin receives notification of new elder flag
- Elder sees confirmation message after flagging
- No public indication that a post has been flagged

---

### F9-605 — Citation Prompt in Ifá Studies (3 SP)
**Why:** "This Odù says X" posted without a source is how misinformation spreads. A gentle, non-blocking prompt after saving a post — "Can you share the source or elder who taught this?" — elevates discourse quality without gatekeeping.

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- When a post is submitted in `ifa-divination-studies` or `practitioners-inner-circle` category: after successful API save, show a toast-style prompt (not a blocking modal):
  ```
  "Your wisdom has been shared. 🙏🏾
  If this references a specific Odù or teaching — adding your source helps the community learn.
  [Add source] [No source needed]"
  ```
- "Add source" opens a small inline edit below the post: a text field for source/attribution
- Submits via `PATCH /forum/posts/:id` with appended source text
- "No source needed" dismisses — post stands as-is
- Only shown once per post (tracked in local state, not persisted)

**Files:** `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Prompt appears after posting in Ifá Studies or Practitioners' Inner Circle
- Non-blocking — post already visible before prompt shown
- "Add source" appends attribution to post
- Only shown once (not on page refresh)
- Not shown in other categories

---

### F9-606 — "Not Medical Advice" Auto-Tag + Rate-Limiting Repeat Posters (3 SP)
**Why:** Specific to herb and remedy posts: if someone posts about an Ewe remedy more than 3 times in the Healing category in a day, they may be self-promoting or spreading unverified advice at scale.

**Backend — `backend/src/forum/forum.service.ts`:**
- In `createPost()` within `healing-herbs-wellness` category: check poster's post count in that category in last 24h
- If count > 5: add soft warning to response: `{ rateLimitWarning: true, message: 'You\'ve shared a lot of healing wisdom today. Our moderators may review your recent posts.' }`
- Do NOT block — just flag for mod review and add admin notification

**Files:** `backend/src/forum/forum.service.ts`

**Acceptance Criteria:**
- Poster who submits >5 posts in Healing category in 24h sees soft warning toast
- Post still published
- Admin notified to review
- Counter resets at midnight UTC

---

## Sprint 7 — Growth Loops & Virality
**Story Points: 19**

### F9-701 — WhatsApp Deep Link Share Button (3 SP)
**Why:** Your community already lives in WhatsApp groups. A one-tap "Share to WhatsApp" button with pre-filled respectful text turns every great thread into organic growth. Leverages the existing WhatsApp Business Cloud integration.

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- Add "Share on WhatsApp" button alongside the existing Share URL button (F9-204)
- Mobile: `https://wa.me/?text=` deep link (opens WhatsApp directly)
- Desktop: `https://web.whatsapp.com/send?text=` (opens WhatsApp Web)
- Pre-filled text:
  ```
  "Interesting discussion happening on Ìlú Àṣẹ — the Ifá spiritual community platform:
  "${thread.title}"
  Join the dialogue: ${threadUrl}
  *Dialogue* ✦ — Ìlú Àṣẹ"
  ```
- WhatsApp brand green icon (use inline SVG — no external library)
- Analytics: track WhatsApp share clicks via a `POST /forum/threads/:id/share` endpoint (count only, no user data)

**Files:** `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- WhatsApp button visible on thread header
- On mobile: opens WhatsApp app with pre-filled text
- On desktop: opens WhatsApp Web
- Pre-filled text includes thread title + URL + Ìlú Àṣẹ branding
- Share count tracked (optional analytics endpoint)

---

### F9-702 — "Thread of the Week" Digest Email (5 SP)
**Why:** Re-engagement. Users who haven't visited in 7 days get a curated digest of the top 3 threads. Each email is a personalised invitation back. Leverages the existing SES email infrastructure.

**Backend — `backend/src/forum/forum.service.ts`:**
- New method: `getDigestContent()`:
  - Top 3 threads by `trendingScore` (from F9-401) in last 7 days
  - Returns: title, category, excerpt (first 200 chars), postCount, authorName, threadUrl
- Trigger: called from `backend/src/subscriptions/subscriptions.service.ts` on-fetch trigger pattern (same as renewal reminders) — OR from a new admin endpoint `POST /admin/send-forum-digest` for manual triggering initially

**Backend — `backend/src/forum/forum.service.ts` (email template):**
```html
Subject: "This week in Ìlú Àṣẹ — Dialogue ✦"
Body: 3 thread cards — title (linked), category badge, excerpt, "Join the dialogue →" CTA
Footer: "You're receiving this because you're part of the Ìlú Àṣẹ community.
Manage your preferences: [Settings link]"
```

**Frontend — `frontend/src/pages/SettingsPage.tsx`:**
- Add toggle: "Weekly forum digest email" (default: ON)
- Stored as `forumDigestOptIn Boolean @default(true)` on User model

**Files:** `backend/src/forum/forum.service.ts`, `backend/src/admin/admin.controller.ts` (manual trigger), `frontend/src/pages/SettingsPage.tsx`, `backend/prisma/schema.prisma` (add `forumDigestOptIn`)

**Acceptance Criteria:**
- Admin can trigger digest manually via `POST /admin/send-forum-digest`
- Email contains top 3 threads with title, excerpt, CTA link
- Users with `forumDigestOptIn: false` are skipped
- Opt-out setting visible in Settings page
- Emails sent via existing SES service

---

### F9-703 — "Invite 3 Seekers → Community Builder Badge" (4 SP)
**Why:** Referral loops with social recognition are the most cost-efficient growth mechanism. A "Community Builder" role visible on every post is worth more than £50 in ads.

**Backend:**
- Extend existing `getReferralStats()` in `users.service.ts`:
  - When `rewardedCount >= 3` AND user doesn't have `communityBuilder` flag: award it
  - Add `isCommunityBuilder Boolean @default(false)` to User model
  - Send `SYSTEM` notification: "You've earned the Community Builder badge! Your contribution is building this community."

**Frontend — `frontend/src/features/forum/forum-role-badge.tsx`:**
- Add Community Builder to badge priority chain (below Devoted, above cultural level):
  ```
  isCommunityBuilder → "🏗️ Community Builder" — teal outline
  ```

**Frontend — Referral Panel (`frontend/src/features/devoted/referral-panel.tsx`):**
- Add progress bar: "2 of 3 referrals to unlock Community Builder badge"
- Award animation when threshold hit

**Files:** `backend/prisma/schema.prisma`, `backend/src/users/users.service.ts`, `frontend/src/features/forum/forum-role-badge.tsx`, `frontend/src/features/devoted/referral-panel.tsx`

**Acceptance Criteria:**
- User who refers 3 verified signups gets `isCommunityBuilder: true` automatically
- Badge appears on all their forum posts
- Progress visible in referral panel
- Notification sent on award
- Badge added to `ForumRoleBadge` component

---

### F9-704 — Contextual Marketplace Links ("Items in This Thread") (4 SP)
**Why:** When a thread about Opele chains goes viral, there are users ready to buy. Surfacing marketplace products contextually — "Items discussed in this thread" — converts community engagement into revenue without feeling like advertising.

**Backend — `backend/src/forum/forum.service.ts`:**
- New method: `getRelatedProducts(threadId)`:
  - Extract key nouns from thread title + content (simple keyword matching against product names/tags)
  - Check `marketplace` table for products matching any keyword
  - Return up to 3 products: `{ id, name, price, image, slug }`
- Endpoint: `GET /forum/threads/:id/related-products` (no auth required)

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- Sidebar or bottom section in thread view: "🛍️ Sacred Items in This Conversation"
- Shows 1-3 product cards: image, name, price, "View in Marketplace →" link
- Only shown if `relatedProducts.length > 0`
- Clearly styled as marketplace links — not disguised as content
- Mobile: horizontal scroll strip at bottom of thread

**Files:** `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Thread about "Opele" shows Opele products from marketplace
- Maximum 3 products shown
- Empty if no matching products (section hidden)
- Clearly labeled as marketplace
- Clicking links to product detail page

---

### F9-705 — "Support This Thread" Micro-Tip (3 SP)
**Why:** A Babalawo writes a detailed, helpful response in the forum. The seeker wants to show gratitude. Micro-tipping (£2-£5) directly on a post creates a direct value loop, bypasses the booking system for informal appreciation, and rewards quality contributions.

**Backend:**
- New endpoint: `POST /forum/posts/:postId/tip`
  - Body: `{ amount: number, currency: string }` (amount in kobo/pence)
  - Initiates Paystack/Flutterwave payment flow for `amount` to post author
  - On success: increment post author's wallet balance + send notification: "Someone tipped you ₦500 on your forum post!"
  - Record in `ForumTip` model: `{ id, postId, fromUserId, toUserId, amount, currency, status, createdAt }`

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- Below each post: small "💝 Tip" button (only shown for posts by BABALAWO users)
- Opens amount selector: ₦500 / ₦1,000 / ₦2,000 / Custom
- Flows through existing payment modal
- Success: "Àṣẹ! Your appreciation has been sent. 🙏🏾"

**Files:** `backend/prisma/schema.prisma` (ForumTip model), `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Tip button visible only on posts by verified Babalawo users
- Payment flows through existing Paystack/Flutterwave integration
- Author notified of tip with amount
- Tip recorded in DB for transparency
- Tipping one's own post returns 400

---

## Sprint 8 — Engagement Psychology & Gamification
**Story Points: 21**

### F9-801 — "First to Respond" Badge in Seeker Questions (3 SP)
**Why:** The Seeker Questions category lives or dies by response time. Rewarding fast, quality first replies creates a culture of attentiveness — especially important for someone posting about a spiritual crisis who may not come back if ignored.

**Backend — `backend/src/forum/forum.service.ts`:**
- In `createPost()`: if post is first reply to a thread in `seeker-questions` AND poster is not the thread creator:
  - Add `isFirstResponder: true` to post record (add field to ForumPost)
  - Award +15 rankXP bonus to poster
  - Fire notification to poster: "You were the first to welcome a Seeker. 🌟 +15 Àṣẹ XP"

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- First reply in Seeker Questions threads shows small "🌟 First to Welcome" badge beside author name
- Subtle gold star, tooltip: "This member was first to welcome this seeker"

**Files:** `backend/src/forum/forum.service.ts`, `backend/prisma/schema.prisma` (add `isFirstResponder`), `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- First reply in Seeker Questions gets `isFirstResponder: true`
- +15 XP awarded to first responder
- "First to Welcome" badge visible on that reply
- Badge only appears in Seeker Questions (not other categories)
- Only the actual first reply gets this — not thread creator's own follow-ups

---

### F9-802 — Participation Streak Counter (4 SP)
**Why:** Streaks are one of the most powerful engagement mechanics in consumer apps (Duolingo, Snapchat). A "7-day contribution streak 🔥" gives users a reason to return even when they have nothing urgent to discuss.

**Backend — `backend/prisma/schema.prisma`:**
- Add to User: `contributionStreak Int @default(0)`, `lastContributionDate DateTime?`, `longestStreak Int @default(0)`

**Backend — `backend/src/forum/forum.service.ts`:**
- After any `createPost()` or `createThread()`: call `updateStreak(userId)`:
  - If `lastContributionDate` was yesterday → increment streak
  - If today → no change (already counted today)
  - If >1 day ago → reset to 1
  - If streak > `longestStreak` → update `longestStreak`
  - Fire-and-forget

**Frontend — `frontend/src/features/forum/forum-home-view.tsx`:**
- Small flame counter in forum header (visible to logged-in user): "🔥 7-day streak"
- Tooltip: "You've contributed {streak} days in a row. Keep the dialogue alive!"
- Milestone notifications: at 7, 30, 100 days — system notification "🔥 {N}-day streak! Ìlú Àṣẹ is richer for your presence."

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- Streak increments on first post/thread per calendar day
- Streak resets if user misses a day
- Streak visible in forum header for logged-in user
- Milestone notifications fire at 7, 30, 100 days
- `longestStreak` preserved even after reset

---

### F9-803 — "Elder Reacts" Quick Reactions for Verified Babalawos (3 SP)
**Why:** A verified Babalawo reacting to a post is a quality signal — it's a form of peer-reviewed endorsement. More meaningful than a generic "like". Their engagement lifts the post's visibility to other community members.

**Backend:**
- New model: `ElderReaction` (`id`, `postId`, `userId`, `emoji` String, `createdAt`, unique: `[postId, userId]`)
  - Constraint: `userId` must be `verified Babalawo`
  - Allowed emojis: `🙏🏾` (blessing), `💬` (worth discussing), `⚠️` (needs context), `✓` (accurate)
- Endpoints:
  - `POST /forum/posts/:postId/elder-react` — `{ emoji: string }` — BABALAWO + verified only
  - `DELETE /forum/posts/:postId/elder-react`
  - Elder reactions returned on `getPostsByThread()` response

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- Under each post: elder reaction row (only shown if reactions exist)
  - `🙏🏾 3` `✓ 1` style display — count next to each emoji
- Verified Babalawo users see a row of 4 quick-react buttons they can click
- Non-practitioners see reactions as read-only endorsements
- `⚠️ needs context` reaction is shown with amber styling to signal the community to read carefully

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Only verified Babalawos can add elder reactions
- All users can see reactions displayed
- `⚠️` reaction shown in amber
- One reaction type per elder per post (can change by reacting with different emoji)
- Elder reactions visible immediately without refresh

---

### F9-804 — "Personal View" / "Unpopular Opinion" Post Tag (2 SP)
**Why:** Honest dialogue requires psychological safety. A user who wants to say "I believe Ifá can coexist with Christianity" shouldn't fear being shamed. A self-applied "Personal View" tag gives them the safety to share while signaling to readers it's not a doctrinal claim.

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- Below reply textarea: optional tag selector (radio buttons):
  - *(none selected)* — default
  - `💭 Personal View` — "This is my opinion, not traditional doctrine"
  - `🤔 Unpopular Take` — "I know this is controversial — respectful discussion welcome"
  - `❓ Genuine Question` — "I'm genuinely unsure and seeking understanding"

**Frontend display:** Post renders with tag pill below content:
- `💭 Personal View` — gray italic
- `🤔 Unpopular Take` — amber
- `❓ Genuine Question` — blue

**Backend:** Store as `postTag String?` on `ForumPost` (add field + migration). Accepted values: `personal_view`, `unpopular_take`, `genuine_question`.

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- Optional tag selector in reply form
- Selected tag renders as pill below post content
- 3 tag types with correct styling
- Untagged posts show no pill
- Tag stored in DB, returned in API

---

### F9-805 — Participation Leaderboard (Àṣẹ Elders Board) (5 SP)
**Why:** Social recognition is the most powerful and cheapest reward. A public "Àṣẹ Elders Board" showing top contributors creates aspiration and signals to new users who the respected voices are.

**Backend — `backend/src/forum/forum.service.ts`:**
- New method: `getLeaderboard(period: 'week' | 'month' | 'all-time', limit = 10)`:
  - Aggregates: `rankXP` gained in period (or total for all-time), threads created, posts made, acknowledges received
  - Returns: `[{ userId, name, yorubaName, avatar, role, verified, subscriptionStatus, culturalLevel, xpGained, postCount, acknowledgesReceived }]`
- New endpoint: `GET /forum/leaderboard?period=week` (public, no auth)

**Frontend:**
- New component: `frontend/src/features/forum/ase-elders-board.tsx`
- Shown as a collapsible panel in the forum home sidebar (below categories)
- "🏆 Àṣẹ Elders Board" heading + period toggle (This Week / This Month / All Time)
- Top 5 entries: rank badge (1st = gold crown, 2nd = silver, 3rd = bronze), avatar, name, role badge, XP stat
- Clicking name navigates to user profile

**Files:** `backend/src/forum/forum.service.ts`, `backend/src/forum/forum.controller.ts`, `frontend/src/features/forum/ase-elders-board.tsx` (NEW), `frontend/src/features/forum/forum-home-view.tsx` (add to sidebar)

**Acceptance Criteria:**
- Leaderboard shows top 5 by XP for selected period
- Role badges visible (Verified Babalawo stands out in gold)
- Period toggle works (week/month/all-time)
- Clicking name navigates to profile
- Updates reflect new XP within 5 minutes (React Query staleTime: 5min)

---

### F9-806 — "Àṣẹ Live" Audio Space Preparation (4 SP)
**Why:** Oral tradition is the *heart* of Ifá. Voice carries what text cannot. A monthly facilitated voice session — 1-2 elders + community questions from the forum — is the signature high-value event that separates Ìlú Àṣẹ from every other forum on the internet.

**Note:** We are NOT building WebRTC ourselves. Phase 1 uses Twitter/X Spaces or Discord Stage (external). This story creates the event creation → promotion → recording workflow inside the platform.

**Backend:**
- New `LiveSession` model: `{ id, title, hostIds String[], scheduledAt DateTime, platform String, externalUrl String, preThreadId String?, recordingUrl?, status String default 'SCHEDULED', createdAt }`
- Endpoints:
  - `POST /admin/live-sessions` — ADMIN only
  - `GET /live-sessions` — public; returns upcoming + recent
  - `PATCH /admin/live-sessions/:id` — update status/recording URL

**Frontend:**
- `GET /live-sessions` displayed as a prominent banner on forum home when status is `LIVE` or `UPCOMING_24H`:
  ```
  🎙️ Àṣẹ Live — Tomorrow at 7PM WAT
  "Understanding Ogbe — Elder Kola answers your questions"
  [Submit a question] [Set reminder]
  ```
- "Submit a question" links to a thread in `ifa-divination-studies` where users pre-submit questions
- "Set reminder" adds a WhatsApp notification (via existing notification system)
- Past sessions shown in `resources-recommendations` category with recording link

**Files:** `backend/prisma/schema.prisma`, `backend/src/admin/admin.service.ts`, `backend/src/admin/admin.controller.ts`, `frontend/src/features/forum/forum-home-view.tsx`

**Acceptance Criteria:**
- Admin can schedule a Live Session with title, host, date, platform URL
- Banner appears on forum home 24h before and during session
- "Submit a question" links to pre-created forum thread
- After session: admin can add recording URL → session moved to Resources
- Past sessions browsable in Resources category

---

## Sprint 9 — Trust Infrastructure & Analytics
**Story Points: 17**

### F9-901 — Practitioner Trust Score (4 SP)
**Why:** "Fake Babalawo" exploitation is a real risk that destroys community trust. A transparent Trust Score — built from peer reviews, completed consultations, forum engagement, and verification status — lets seekers make informed decisions.

**Backend — `backend/prisma/schema.prisma`:**
- Add `trustScore Int @default(0)` to User
- Trust score components (computed, not stored separately):
  - `+30` Video verified (one-time, admin-awarded)
  - `+20` Completed 5+ consultations with positive ratings
  - `+15` Active forum contributor (50+ posts)
  - `+10` Temple member (linked to a verified temple)
  - `+5` Referred by another verified Babalawo
  - `-20` Active dispute or unresolved complaint

**Backend — new helper method in `users.service.ts`:**
- `recomputeTrustScore(userId)`: runs all checks, updates `trustScore` field
- Called after: consultation completion, verification, forum post milestones, disputes

**Frontend — profile and forum posts:**
- `TrustScoreBadge` component: shows score as tier:
  - 0-29: no badge
  - 30-49: 🌱 "Building Trust"
  - 50-74: ⭐ "Community Trusted"
  - 75+: 🏆 "Elder Trusted"
- Shown on practitioner profiles + next to Babalawo name in forum posts

**Files:** `backend/prisma/schema.prisma`, `backend/src/users/users.service.ts`, `frontend/src/shared/components/trust-score-badge.tsx` (NEW)

**Acceptance Criteria:**
- Trust score computed from 5 weighted factors
- Tier badge visible on practitioner profile and forum posts
- Score updates when relevant events occur (consultation complete, etc.)
- Score breakdown visible on practitioner's own profile ("How is my Trust Score calculated?")

---

### F9-902 — Cultural Onboarding Gate for Sensitive Categories (3 SP)
**Why:** Keeps trolls and drive-by disruptors out of the 🔮 Ifá Studies and 🔐 Practitioners' Inner Circle sections. Not a barrier — a 30-second cultural orientation that signals "this space is serious".

**Backend — `backend/prisma/schema.prisma`:**
- Add `passedCulturalOrientation Boolean @default(false)` to User

**Backend — `backend/src/forum/forum.service.ts`:**
- In `createPost()` for `ifa-divination-studies` or `practitioners-inner-circle`:
  - Check `user.passedCulturalOrientation`
  - If false: return 403 with `{ code: 'ORIENTATION_REQUIRED', message: 'Please complete a short cultural orientation before posting in this space.' }`

**Orientation questions** (3 multiple-choice, correct answers unlock posting):
1. *What is an Odù?* → A) A sacred verse/chapter of Ifá wisdom ✓ B) A type of drum C) A Yoruba greeting
2. *What does "Àṣẹ" mean?* → A) Goodbye B) Spiritual authority, power, and blessing ✓ C) An elder's title
3. *Who is Ifá?* → A) A deity of iron B) The Yoruba god of war C) The Orisha of wisdom, divination, and knowledge ✓

**Frontend — `frontend/src/features/forum/thread-view.tsx`:**
- When posting in Ifá Studies and orientation not complete: show a one-time modal with the 3 questions
- All 3 must be answered correctly to proceed
- On pass: `PATCH /users/me { passedCulturalOrientation: true }` + "Welcome to this sacred space 🙏🏾"
- On fail: "Take a moment to learn more before joining this discussion. Here are some resources: [link to Seeker Questions]"

**Files:** `backend/prisma/schema.prisma`, new migration, `backend/src/forum/forum.service.ts`, `backend/src/users/users.controller.ts`, `frontend/src/features/forum/thread-view.tsx`

**Acceptance Criteria:**
- New users blocked from posting in Ifá Studies until orientation passed
- 3 multiple-choice questions with only one correct answer each
- Passing all 3 sets `passedCulturalOrientation: true` permanently
- Never shown again after passing
- Failing shows resources, not an error — graceful and educational

---

### F9-903 — Forum Health Metrics Dashboard (Admin) (5 SP)
**Why:** You can't improve what you don't measure. These 4 specific metrics tell you whether the forum is healthy — or silently dying.

**Backend — `backend/src/admin/admin.service.ts`:**
Add to `getForumStats()`:
```typescript
{
  // Existing
  totalThreads, totalPosts, postsToday, pendingReports,

  // New health metrics
  avgTimeToFirstReply: number,         // avg minutes from thread created to first reply (last 7 days, Seeker Questions only)
  circleConversionRate: number,        // % of forum users who have joined ≥1 circle
  elderParticipationRate: number,      // % of verified Babalawos who posted in last 30 days
  reportReasonBreakdown: {             // report reason distribution
    misinformation: number,
    spam: number,
    harassment: number,
    culturalDisrespect: number,
    exploitation: number,
    other: number,
  },
  topContributors: [{ name, postCount, acknowledgesReceived }],
  categoryActivity: [{ name, postsLast7Days }],
}
```

**Frontend — admin forum stats panel:**
- Display as metric cards with trend indicators:
  - "⏱️ Avg reply time: 4.2 hours" (green if <24h, amber if <72h, red if >72h)
  - "🔄 Circle conversion: 23%" (green if >20%)
  - "🧓 Elder participation: 67%" (green if >50%)
  - Bar chart: Report reason breakdown
  - Table: Top 5 contributors this week

**Files:** `backend/src/admin/admin.service.ts`, `backend/src/admin/admin.controller.ts`, `frontend/src/features/admin/admin-dashboard-view.tsx`

**Acceptance Criteria:**
- All 4 health metrics shown in admin dashboard
- Avg reply time calculated from Seeker Questions threads only
- Elder participation = verified Babalawos who posted / total verified Babalawos
- Colour coding guides admin attention (green/amber/red)
- Data refreshes on dashboard load

---

### F9-904 — "Oral History Archive" Thread Series Setup (2 SP)
**Why:** The most irreplaceable content on this platform will be elder testimonies: training stories, temple histories, diaspora journeys. Seeding this intentionally — rather than hoping it happens organically — creates the platform's long-term cultural asset.

**Backend:**
- New tag: `oral-history` added to the suggested tag vocabulary
- New pinned thread created in `yoruba-language-culture` category: **"Share Your Story — Oral History Archive"**
  - Pinned, open for replies, not locked
  - Opening post explains the archive project with clear prompts: "When did you first encounter Ifá? What is your earliest memory of Yoruba spiritual practice? Where were you when you first learned your Odù?"

**Frontend:**
- Oral history threads tagged `oral-history` get a subtle scroll-decoration styling: warm amber left border, slightly different background
- `resources-recommendations` sidebar: "📜 Oral History Archive" quick link

**Files:** `backend/prisma/seed-forum-categories.ts` (add pinned thread seeding), `frontend/src/features/forum/forum-home-view.tsx` (oral history quick link)

**Acceptance Criteria:**
- Oral History pinned thread seeded in Yoruba Language & Culture category
- Thread is open for replies (not locked)
- `oral-history` tag available in tag selector
- Threads tagged `oral-history` have distinct visual treatment

---

### F9-905 — Youth Corner Subcategory (3 SP)
**Why:** The next generation of Ifá practitioners are teenagers and young adults navigating identity, tradition, and modern life simultaneously. A moderated safe space for under-25s builds long-term loyalty that no amount of advertising can replicate.

**Backend:**
- Add 10th category to seed script: `youth-corner`
  - Name: "Youth Corner 🌱"
  - Description: "For under-25s exploring tradition, identity & modern life"
  - `isTeachings: false`, visible to all (no age gate — honor system)

**Note:** No actual age verification. "Youth Corner" is a cultural designation — a tone and moderation style, not an access control. Older users who want to support are welcome; the audience is self-selected.

**Moderation:**
- Youth Corner posts get extra gentle moderation guidance in admin flags
- Designated "Youth Mentor" mod role (add to `moderatorNotes` on post reports)

**Frontend:**
- Category added to list automatically via seed
- Category description in sidebar: "For under-25s navigating tradition & modern life"

**Files:** `backend/prisma/seed-forum-categories.ts` (add 10th category)

**Acceptance Criteria:**
- Youth Corner appears as 10th category in forum
- Visible to all users
- Re-running seed doesn't create duplicates (upsert)
- Category has appropriate icon (🌱) and description

---

## Summary Table (Updated)

| Sprint | Focus | Stories | SP |
|--------|-------|---------|-----|
| Sprint 1 | Foundation: Categories, Identity, Gates | F9-101 to F9-106 | 21 |
| Sprint 2 | Real-Time Presence & Live Updates | F9-201 to F9-205 | 18 |
| Sprint 3 | Notifications, Mentions, Anonymous | F9-301 to F9-304 | 22 |
| Sprint 4 | Engagement Loops & Community Growth | F9-401 to F9-405 | 21 |
| Sprint 5 | Search, Discovery & Polish | F9-501 to F9-505 | 15 |
| Sprint 6 | Cultural Safeguards & User Safety | F9-601 to F9-606 | 26 |
| Sprint 7 | Growth Loops & Virality | F9-701 to F9-705 | 19 |
| Sprint 8 | Engagement Psychology & Gamification | F9-801 to F9-806 | 21 |
| Sprint 9 | Trust Infrastructure & Analytics | F9-901 to F9-905 | 17 |
| **TOTAL** | | **45 stories** | **180 SP** |

---

## Recommended Sprint Order for Launch

```
PRE-LAUNCH (Must ship):
  Sprint 1 — Categories, identity, gates ← DONE ✅
  Sprint 6 — Cultural safeguards (Sacred tag, mental health, disclaimers)
  Sprint 2 — Real-time presence

LAUNCH WEEK:
  Sprint 3 — Notifications, mentions, anonymous posting
  Sprint 4 (partial) — Odù of the Week, trending, proverb banner

POST-LAUNCH (2-4 weeks):
  Sprint 5 — Search, polish
  Sprint 4 (remainder) — XP, leaderboard, report queue
  Sprint 7 — Growth loops, WhatsApp share, micro-tips
  Sprint 8 — Engagement psychology, streaks, elder reacts

MONTH 2+:
  Sprint 9 — Trust score, analytics, oral archive, youth corner
```

**Critical path note:** Sprint 6 (Cultural Safeguards) should ship BEFORE public launch. The Sacred Knowledge tag and mental health detection protect both users and the platform. Everything else can iterate.

---

## What We Are NOT Building Yet

| Feature | Why Deferred |
|---------|-------------|
| Rich text editor / media embeds (YouTube, Instagram, TikTok) | Requires Tiptap/ProseMirror — significant effort. Separate sprint after launch. |
| Forum moderation AI (auto-flagging with NLP) | Phase 2 — after community establishes its own norms. Manual + elder flags are sufficient now. |
| Inter-tradition dialogue space (Vodou, Candomblé) | Requires deep community trust first. Plant when the platform has 1,000+ verified members. |
| "Embeddable Ask a Babalawo" widget for external sites | API-level work. Needs stable forum first. Phase 3. |
| Temple API (temples pulling forum data) | Same as above. Ecosystem play for Year 2. |
| WebRTC for Àṣẹ Live | Using Twitter Spaces/Discord in Phase 1. Build native only if external platforms prove inadequate. |
| Forum coins / token rewards | Deferred — XP system (F9-403) is the right level for now. Tokenomics is a complex, regulated space. |
| Sub-categories / nested categories | Category structure is sufficient for launch. Avoid over-engineering. |

---

## Verification Checklist

1. `npm run seed:forum-categories` → 9 rows, 0 duplicates on re-run
2. Forum home renders all 9 categories from real API (not demo data)
3. BABALAWO user sees Practitioners' Inner Circle; CLIENT user does not
4. FREE user can click "Dialogue ✦" and successfully create a thread
5. Thread rows show "2 mins ago" relative time, not raw date
6. Verified Babalawo posts show gold "✓ Verified Babaláwo" badge
7. Devoted users show crown badge
8. Open thread in 2 browser tabs → "2 people reading this" banner appears
9. Reply in Tab B → Tab A auto-appends the post with fade-in
10. Close Tab B → count drops, banner disappears
11. Reply to a thread you didn't create → thread creator gets notification in bell
12. Type `@` in reply box → autocomplete dropdown appears
13. Select @mention → mention styled in amber in rendered post
14. Mentioned user receives notification
15. Seeker Questions thread → anonymous checkbox visible
16. Anonymous post renders as "Anonymous Seeker" with silhouette avatar
17. Admin sees real author identity on anonymous post
18. Attempting anonymous post in Ifá Studies → 400 error
19. Template selector appears when "Ifá & Divination Studies" is selected
20. Report button → reason modal → admin sees report in queue
21. Admin hides post → post disappears from thread for other users
22. Odù of the Week thread auto-created Monday morning first visit to Ifá category
23. `rankXP` increments on post creation
24. `culturalLevel` auto-promotes when XP threshold crossed
25. Proverb banner visible on forum home, dismissible, changes daily
