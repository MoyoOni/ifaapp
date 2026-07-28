> ⚠️ **SUPERSEDED as of July 28, 2026** — see [`ILUASE_V1_BACKLOG.md`](ILUASE_V1_BACKLOG.md) for the current single source of truth on remaining work. This file is kept for its detailed per-story write-ups only; don't use it to decide what to work on next.

# Ìlú Àṣẹ — COMMUNITY_BACKLOG — Sacred Community Forum

> **Last Updated**: July 24, 2026 (reality-checked against the actual codebase)
> **Next Review**: August 2, 2026 — after initial community feedback integration
> **Platform Status**: Production-ready forum with category management, thread creation, post moderation, cultural safeguards, and admin oversight. This backlog tracks community-specific features and enhancements beyond the core forum operations documented in V9_FORUM_BACKLOG.md. Existing docs (V9_FORUM_BACKLOG.md, Z1_BACKLOG.md, ADMIN_BACKLOG.md) describe forum capabilities; this backlog focuses on **community dynamics, cultural authenticity, spiritual guidance, and cross-user experiences** that those docs don't cover.
>
> **What changed in this revision**: every item below has been checked against the real backend schema, controllers, and frontend components rather than treated as a wishlist written in isolation. A lot has been built since this backlog was first drafted (the Admin Operations Backlog's Sprints 1–6 and the V9 Forum Launch shipped most of the "moderation and recognition" layer). Nothing already-built is re-proposed here — instead each item says plainly what exists today and what the remaining gap actually is. **All AI-driven moderation/assistant concepts have been removed** (FOR-012, FOR-022, and the AI bullets inside FOR-001/FOR-002/FOR-016/FOR-017) — they conflicted with this document's own Cultural Integrity Principle #1 ("elders and practitioners are the guides, not algorithms"), and the human-review infrastructure that shipped since (ADM-018's flag-and-queue system) already covers the legitimate need without them.
>
> **Follow-up pass (same day)**: added an "At a Glance" table, notes on reviewer-capacity and the illustrative (not real) nature of "Owner" fields, a Success Metrics section, and three new cross-cutting items — FOR-025 (unify this doc's trust score with `SHOP_BACKLOG.md`'s vendor reputation work before both get built independently), FOR-026 (same coordination for oral-history/storytelling, split across five items in two docs), and FOR-027 (a real safety gap: FOR-002/FOR-015 both escalate crisis content to live Babalawo booking, which is currently paused — FOR-027 is the interim decision that can't wait for that relaunch).

---

## ✅ Already Live — Don't Rebuild This

A quick inventory so nothing below gets re-proposed as new work. If your idea is "add X," check here first — X may already exist and just need a follow-on enhancement (each item below links to the FOR-XXX it feeds).

**Forum content & structure** (seeded, live today):
- 10 categories, including `Practitioners' Inner Circle` (verified-BABALAWO-only, mod-gated) and `🌱 Youth Corner` — the containers FOR-004, FOR-008, FOR-009, FOR-014, FOR-021 assume need building don't; they exist, empty of specialized tooling
- A pinned **Community Covenant** thread (welcome/guidelines) in `Ìdágbasílẹ̀ & Ìlànà`
- A pinned **"Share Your Story — Oral History Archive"** thread in `Yorùbá Language & Culture` — this is the seed FOR-019 should grow from, not duplicate
- 7 starter discussion threads across the other categories
- A **Cultural Onboarding Gate** (`passedCulturalOrientation`, `cultural-orientation-gate.tsx`) — a 3-question cultural-orientation check required before a user's first post. This *is* the "user education system on cultural boundaries" FOR-001 asks for.

**Moderation & cultural safety** (human-led, matching this doc's own principles):
- `ContentFlagRule` model + `heldForReview` on every post + `admin-integrity-tab.tsx` — a real human review queue for flagged content (feeds FOR-001, FOR-016)
- Elder Oversight Panel (`elder-oversight-panel.tsx`) in the forum feature
- Practitioner complaint intake and resolution (`PractitionerComplaint` model, `practitioner-complaints-tab.tsx`)
- Trust score system: `trustScore` field, tier computation, and three admin-facing views (`trust-score-management-tab.tsx`, `admin-trust-score-audit-tab.tsx`, `admin-market-intelligence-tab.tsx`)

**Recognition & milestones**:
- `UserBadge` model with admin award/revoke tooling (`admin-community-tab.tsx`) — feeds FOR-006
- `GET /users/:id/badges` — 7 computed spiritual milestones, shown as a badge strip with tooltips on every public profile — this **is** FOR-023's "spiritual journey tracking," already shipped, not a future item

**Calendar & cultural content**:
- `SacredCalendarEvent` model + `OralHistoryEntry` model, both with full admin CRUD (`admin-cultural-content-tab.tsx`) — feeds FOR-007 and FOR-019/FOR-024

**Community structure & operations**:
- `Announcement` model with full CRUD, consumed by a live `announcement-banner.tsx` shown platform-wide — this is FOR-Q1, already shipped, not a quick win still to do
- Forum health/intelligence metrics (`GET /forum/admin/metrics?period=`) for admins
- **Circles** — a generic, already-live topic + location + privacy grouping primitive (`model Circle`: `topics: String[]`, `location`, `privacy`). Several items below (FOR-005, FOR-013, FOR-015, FOR-021) don't need new schema at all — they need someone to *create the Circle* using what's already there. That's a content/community-ops task, not an engineering backlog item.
- **Pod Network** (`/pods`) — a city-based local-gathering teaser with a "Steward" role and copy that already name-checks "youth mentorship." Currently a waitlist page (paused per `MVP_PIVOT_BACKLOG.md`), not a live feature — but it's the natural home for FOR-009/FOR-014's intergenerational-and-elder-led framing once it launches.
- "**Ask a Babalawo**" — currently informal copy pointing at the Forum's `Seeker Questions — No Judgment` category (see `HelpPage.tsx`, `MessagesPausedPage.tsx`). Not a dedicated feature yet — FOR-Q3 is the ticket to formalize it, not invent it from nothing.

**A note on dependencies that are currently paused**: per `MVP_PIVOT_BACKLOG.md`, Consultations and 1:1 Messaging are paused platform-wide (frontend-only pivot, backend untouched, reversible). Any item below that depends on live booking/messaging (FOR-003 explicitly) should wait for that relaunch rather than build against a route that currently shows a "coming soon" notice. **This is tracked in exactly one place** — see `CLAUDE.md`'s "Paused / Deprioritized Dependencies" list — so when something relaunches, one update unblocks every backlog that references it instead of a grep-and-hope across files.

**A note on "Owner" fields below**: they're illustrative labels ("Elder Council Coordination," "Community Ritual Team"), not real assigned teams — this platform doesn't have a dedicated Data Science Team or AI Ethics Team, and treating these as if it did can quietly justify skipping something ("no owner exists, so it's not really actionable"). Read every `Owner` field as one of three realistic buckets instead: **Engineering** (schema/API/UI work), **Product & Content** (policy, copy, curation, blacklists), or **Community & Vendor Ops** (people doing the actual moderating, mentoring, and coordinating).

**A note on reviewer capacity**: almost every safety item below (FOR-001, FOR-002, FOR-003, FOR-014, FOR-016, FOR-018) routes to "elder review" or the admin panel. That's the right principle, but it assumes elder/admin reviewer *capacity* that should be checked before committing to SLAs — the platform's first admin user was only bootstrapped a few days before this revision. "Human review, not automation" is correct; "human review, infinitely scalable" is not a safe assumption. Treat reviewer headcount as a real dependency, not a given, especially for FOR-002/FOR-015's crisis-adjacent content.

---

## 📊 At a Glance

| ID | Item | Priority | Status | SP |
|---|---|---|---|---|
| FOR-001 | Cultural Authenticity Safeguards | P0 | 🟢 Mostly built (July 25, 2026) | 1 |
| FOR-002 | Crisis Escalation Protocol | P0 | 🟢 Mostly built (bug fixed July 24, 2026) | 3 |
| FOR-003 | Spiritual Guidance Thread Management | P0→P1 | ⬜ Not started (blocked on Consultations) | 8 |
| FOR-004 | Cultural Learning Pathways | P1 | ✅ Done (July 26, 2026) | 10 |
| FOR-005 | Cross-Cultural Practice Bridges | P1 | 🟢 Mostly built (July 25, 2026) | 1 |
| FOR-006 | Community Recognition & Achievement | P1 | 🟢 Mostly built (endorsement shipped July 25, 2026) | 2 |
| FOR-007 | Spiritual Calendar Integration | P2 | 🟢 Mostly built | 4 |
| FOR-008 | Language Preservation Tools | P2 | 🟢 Mostly built (July 25, 2026) | 2 |
| FOR-009 | Intergenerational Bridge Program | P2 | 🟢 Mostly built (matching satisfied by FOR-004's CommunityMentorship, cross-checked July 27, 2026) | 2 |
| FOR-010 | Virtual Sacred Space Creation | P3 | ⬜ Not started | 21 |
| FOR-011 | Blockchain Oral History Preservation | P3 | ⬜ Not started | 18 |
| ~~FOR-012~~ | ~~AI-Assisted Cultural Moderation~~ | — | ❌ Removed | — |
| FOR-013 | Sacred Space & Ritual Participation | P0 | 🟢 Core loop done (July 25, 2026) | 4 |
| FOR-014 | Community Elders & Wisdom Keepers Council | P0 | 🟢 Mostly built (July 25, 2026) | 3 |
| FOR-015 | Grief, Healing & Ancestral Support Space | P0 | 🟢 Core loop done (July 25, 2026) | 5 |
| FOR-016 | Spiritual Abuse & Harm Prevention | P1 | 🟢 Core loop done (July 26, 2026) — education content remains | 9 |
| FOR-017 | Community Member Wellbeing (opt-in) | P1 | 🟢 Core loop done (July 25, 2026) | 5 |
| FOR-018 | Community Healing & Reconciliation | P1 | 🟢 Core loop done (July 25, 2026) | 6 |
| FOR-019 | Oral Tradition & Storytelling Platform | P2 | 🟢 Mostly built (marketplace link shipped) | 2 |
| FOR-020 | Embodied Knowledge & Practice Transmission | P2 | ⬜ Not started | 14 |
| FOR-021 | Community Dream Sharing & Interpretation | P2 | 🟢 Core loop done (July 25, 2026) | 5 |
| ~~FOR-022~~ | ~~Community Wisdom AI Assistant~~ | — | ❌ Removed | — |
| FOR-023 | Spiritual Journey Tracking | P3 | 🟢 Mostly built | 4 |
| FOR-024 | Community-Generated Content Repository | P3 | 🟢 Submission path + frontend form shipped (July 24, 2026) | 6 |
| FOR-025 | *New* — Unify Trust & Reputation System | P1 | ✅ Done | 5 |
| FOR-026 | *New* — Consolidate Oral History Effort | P1 | ✅ Done | 2 |
| FOR-027 | *New* — Document Interim Crisis Escalation Path | P0 | ✅ Done | 2 |
| FOR-Q1 | Community Announcements | Immediate | ✅ Done | — |
| FOR-Q2 | Community Member Directory | Immediate | 🟢 Done (July 25, 2026) | 5 |
| FOR-Q3 | "Ask an Elder" Feature | Immediate | 🟢 Done (July 25, 2026) | 3 |

**Total remaining effort**: ~166 SP across 22 genuinely open items (down from 24 after removing the 2 AI items and adding 3 new ones) — but "remaining" is uneven: FOR-001/005/006/007/008/014/015/019/023/Q1/Q3 (11 items, ~46 SP) already have most of their infrastructure built and are cheaper than their point count implies. FOR-008 shipped July 25, 2026 (9 SP → 2 SP) — most of its scope turned out to already exist (`DailyYorubaWord`/`YorubaWordService`), just never surfaced in the UI. FOR-001 shipped the same day (6 SP → 1 SP) — the curated `ContentFlagRule` blacklist, exactly as scoped ("a curated rule list, not new engineering"). FOR-014 shipped the same day too (7 SP → 3 SP) — elder profiles (a real bug fix: the UI already expected a `specialization` field that never existed on `User`), teaching series, and elder endorsements (closing FOR-006's identical gap); governance and succession deliberately left as product decisions, not engineering guesses.

---

## 🔴 CRITICAL — Community Core Experience

### FOR-001: Cultural Authenticity Safeguards — Strengthen the Existing Review Queue
- **Priority**: P0
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Community Safety Team
- **Story Points**: 1 *(revised down from 6 — the last criterion was genuinely just a content/config task, exactly as scoped)*
- **Description**: The human-reviewed flagging system (`ContentFlagRule` + `heldForReview`, `admin-integrity-tab.tsx`) and the cultural-onboarding gate (`cultural-orientation-gate.tsx`) already cover the two hardest parts of this item. What's left is narrower: giving elders a documented, prioritized topic list to review against.
- **Acceptance Criteria**:
  - [x] ~~AI-powered content analysis~~ — removed; the existing human review queue is the mechanism, and stays that way (Cultural Integrity Principle #1)
  - [x] Community reporting system for cultural concerns — exists (flag → `heldForReview` → `admin-integrity-tab.tsx`)
  - [x] Elder review queue for flagged threads/posts — exists
  - [x] Blacklist of prohibited topics (Akose discussions, counterfeits, misappropriated sacred practices) as a documented `ContentFlagRule` config — **shipped July 25, 2026**: 8 curated `KEYWORD` rules seeded (`prisma/seed-cultural-flag-rules.ts`, `npm run seed:cultural-flag-rules`, upsert-by-(type,value)), each with a `reason` explaining the judgment call: 3 for Akose (`"akose for sale"`, `"selling akose"`, `"diy akose"` — deliberately scoped to *offering/preparing* Akose ad-hoc, not the concept itself, since Akose is a normal topic and only its unsupervised sale/preparation is the actual concern, mirroring the same restriction already enforced for marketplace listings in `marketplace.service.ts`'s `createProduct`), 2 for counterfeits (`"counterfeit"`, `"replica orisha"`), 3 for misappropriated sacred practices (`"initiation for sale"`, `"buy initiation"`, `"oath-bound"`). Live-verified reachable via the existing, unmodified `GET /admin/integrity/rules` endpoint and `admin-integrity-tab.tsx` — no frontend changes needed, that UI already existed and just had nothing to display.
  - [x] User education system on cultural boundaries — exists (Cultural Onboarding Gate)
- **Dependencies**: none remaining
- **Notes**: Nearly done, as predicted — this was genuinely just a curated rule list. **Important honest caveat discovered while seeding this**: `ContentFlagRule` is read only by the admin CRUD screen (`admin-integrity.service.ts`'s `getRules()`) — nothing in `forum.service.ts`'s actual post/thread creation path checks a new post against these rules, and separately, `ForumPost.heldForReview` is never set to `true` by any community-facing action anywhere in the codebase (confirmed via full-codebase search) — the admin review queue this item points to will always be empty in practice. This is the exact same gap already documented on `SHOP_BACKLOG.md`'s MSP-015 for the identical pattern on `Product`. Deliberately **not** fixed here: wiring real-time keyword auto-flagging into forum post creation is a separate, meaningfully bigger decision with real false-positive risk against ordinary cultural conversation (e.g. "Ẹbọ" is a routine, everyday Ifá term — a bare keyword match on it would wrongly flag normal discussion), and deserves its own scoping rather than being a silent side effect of seeding reference data. These 8 rules are real, useful reference material for elders doing manual review today; automated enforcement is a distinct follow-up item.

### FOR-002: Crisis Escalation Protocol
- **Priority**: P0
- **Status**: 🟢 MOSTLY BUILT — real bug found and fixed (July 24, 2026)
- **Owner**: Safety Team
- **Story Points**: 3 *(revised down from 8 — this was already built as F9-602/D3; the remaining work was one bug fix, not new engineering)*
- **Description**: On investigation this was already substantially implemented, not "not started" as originally assessed. `CRISIS_KEYWORDS` keyword matching + `detectCrisis()` exist in `forum.service.ts` (F9-602), flagging a post's `hasCrisisSignal` field and notifying admins. A dedicated admin queue (`getCrisisSignalPosts()` / `clearCrisisSignal()`, D3) surfaces flagged posts in `AdminCrisisAlertsTab.tsx`, already wired into the admin nav under Community & Forum.
- **What was already built (confirmed by reading the code, not assumed)**:
  - [x] Keyword-based flagging (not sentiment/ML inference) — `detectCrisis()` in `forum.service.ts`
  - [x] Admin review queue for flagged posts — `getCrisisSignalPosts()` + `AdminCrisisAlertsTab.tsx`, with a "Mark as Reviewed" action (`clearCrisisSignal()`)
  - [x] Admin notification on detection — `notifyAdmins()` fires with thread/post context
  - [x] Interim escalation destination documented — FOR-027 (`hello@iluase.com` + disclosure in the Covenant thread)
- **Bug found and fixed**: `createThread()` ran `detectCrisis()` against the thread's first post but only called `notifyAdmins()` — it never persisted `hasCrisisSignal: true` on that post. So a crisis-level *thread* (as opposed to a *reply*, which had the correct code path) would notify admins but never actually appear in the `AdminCrisisAlertsTab` queue itself, since that queue reads `hasCrisisSignal` directly from the DB. Fixed by capturing the created post's reference and adding the same `prisma.forumPost.update({ hasCrisisSignal: true })` call the reply path already had.
- **Verified**: real API call creating a crisis-keyword thread as a test user → confirmed `hasCrisisSignal` persisted via direct DB query → confirmed the post surfaced in `GET /forum/admin/crisis-signals` → confirmed it rendered correctly in a live Playwright session through the actual admin dashboard (Community & Forum → Crisis Alerts). Test user, threads, posts, and notifications all deleted after verification.
- **Remaining gaps** (small, not blocking):
  - [ ] No dedicated unit test file for `ForumService` covers `createThread`'s crisis path — only live/integration verification exists today. Worth a regression test if `ForumService` gets a spec file for other reasons.
  - [ ] Temporary content restriction during active crisis handling — not implemented; currently the flagged post stays fully visible while awaiting review
  - [ ] Integration note: connects to live Babalawo availability once Consultations relaunches (currently paused — interim path is FOR-027)
- **Dependencies**: none remaining for the core loop — Elder Oversight Panel exists, interim escalation path exists (FOR-027)
- **Notes**: Same pattern as FOR-019/FOR-025/FOR-027 this session — assessed as unbuilt, actually mostly shipped, with one real correctness bug hiding in the gap between the thread-creation and reply-creation code paths.

### FOR-027: Document an Interim Crisis Escalation Path (Pre-Consultations-Relaunch)
- **Priority**: P0
- **Status**: ✅ DONE (July 24, 2026)
- **Owner**: Community & Vendor Ops (this is a policy decision, not an engineering task)
- **Story Points**: 2
- **Description**: FOR-002 and FOR-015 both escalate crisis-level content to "a qualified practitioner via live booking" — but Consultations is currently paused platform-wide. That leaves a real gap: if someone posts something crisis-level *today*, the actual response path is a Forum reply or an email, neither of which is fast enough for that category of content. This item is not "build a feature" — it's "decide and document what actually happens right now," independent of when Consultations relaunches.
- **Acceptance Criteria**:
  - [x] A documented, named interim contact/process for crisis-level content — decided: `hello@iluase.com` + explicit "we don't yet offer same-day response, contact local emergency services for real emergencies" disclosure (no fake same-day guarantee)
  - [x] That path is referenced directly in FOR-002's escalation protocol and FOR-015's crisis-integration note
  - [x] A one-line disclosure added to crisis-adjacent UI copy — added to the pinned Community Covenant thread's existing "Protect the Vulnerable" section (`prisma/seed-forum-covenant.ts`), the one place every forum user is expected to read before posting. Also fixed a pre-existing seed bug in the same script (missing `tags` field caused a NOT NULL violation that silently prevented this thread from ever seeding) — re-ran and confirmed both covenant threads are now live in the database.
- **Dependencies**: none — this is a decision to make now, not a build to schedule later
- **Notes**: Shipped as a documentation-only change to existing seed content — no new UI component needed, since the Covenant thread was already the designated "safety" read.

### FOR-003: Spiritual Guidance Thread Management
- **Priority**: P0 → consider P1 while Consultations is paused
- **Status**: ⬜ NOT STARTED
- **Owner**: Guidance Team
- **Story Points**: 8 *(revised down from 11 — the booking-integration half is blocked, not extra work; scope it to the thread-only half for now)*
- **Description**: A specialized thread type for guidance requests. `ForumThread` has no dedicated "type" field today, but does have a `tags: String[]` — a tag-based approach (e.g. a `guidance-request` tag surfaced distinctly in the UI) needs no schema change.
- **Acceptance Criteria**:
  - [ ] Dedicated "Guidance Request" thread presentation (tag-based, not new schema)
  - [ ] Privacy controls for sensitive spiritual matters (thread-level, reusing existing privacy patterns from Circles)
  - [ ] Thread closure/archiving procedure after guidance completion
  - [ ] Babalawo availability integration and appointment-booking connection — **defer this half until Consultations relaunches**; building it against the currently-paused booking flow would be wasted work
- **Dependencies**: Appointments Module (currently paused, see MVP_PIVOT_BACKLOG.md)
- **Notes**: Split cleanly into a "thread type now" phase and a "booking integration later" phase so the whole item isn't blocked by the pivot.

---

## 🟡 SIGNIFICANT — Community Dynamics & Growth

### FOR-004: Cultural Learning Pathways
- **Priority**: P1
- **Status**: ✅ DONE (July 26, 2026)
- **Owner**: Education Team
- **Story Points**: 10
- **Description**: The `Seeker Questions — No Judgment` category already exists as an unstructured newcomer space. This item adds structure and tracking on top of it.
- **Acceptance Criteria**:
  - [x] Beginner-friendly space for newcomers — exists (`Seeker Questions — No Judgment`)
  - [x] Structured thread series for core concepts (curated, not auto-generated) — **shipped July 26, 2026**: `ForumThread.isTeachingSeries`/`seriesName` already existed end-to-end at creation (Babalawo/Admin-only, from an earlier FOR-014 pass), but there was no way to browse them grouped by series. Added `GET /forum/series` (list, with thread count per series) and `GET /forum/series/:seriesName` (ordered thread list), plus `LearningPathwaysView`/`PathwayDetailView` and a "Learning Pathways" link in the Forum home sidebar.
  - [x] Progress tracking for community learning — **shipped July 26, 2026**: reused the existing computed-badge system exactly as this item's own note specified, no parallel tracking model. Added a `pathway-graduate` badge to `getUserBadges()` (posted in every thread of a series with 2+ threads), and a per-series `myProgress` field (`{postedInThreads, totalThreads}`) on the series-detail endpoint, shown as a progress bar in `PathwayDetailView`.
  - [x] Integration with Academy course recommendations (Academy is live and unaffected by the MVP pivot) — **shipped July 26, 2026**: rule-based keyword match (same approach as `getRelatedProducts`, not ML) between a series' thread titles and `Course.title`/`category`, surfaced as `recommendedCourses` on the series-detail endpoint and rendered on `PathwayDetailView`. Course has no shared taxonomy with ForumCategory, so this is a plain keyword-overlap heuristic, not a real taxonomy mapping — acceptable for a first pass, but a genuine design gap if course/forum content grows large enough for false positives to matter.
  - [x] Mentorship matching for new members — **shipped July 26, 2026**: new `CommunityMentorship` model + `community-mentorship` module, directly mirroring `VendorCommunityService`'s mentorship methods (VENDOR_BACKLOG.md VND-019) — self-service request, one active mentorship at a time, capped mentee load (3) per mentor, 30-day period. Mentor pool is any user with `answersElderQuestions=true` (FOR-Q3's existing "Ask an Elder" opt-in) rather than a new eligibility system. `CommunityMentorshipView` at `/community/mentorship`, linked from Forum home.
- **Dependencies**: Academy (live), existing badge system
- **Notes**: Reused the badge/milestone system already built for FOR-023 instead of inventing new progress tracking, and the `VendorCommunityService` mentorship pattern instead of inventing new matching logic. 22 new backend unit tests across `community-mentorship.service.spec.ts`, `users.service.spec.ts`, and `forum-learning-pathways.service.spec.ts`.

### FOR-005: Cross-Cultural Practice Bridges
- **Priority**: P1
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Community Relations Team
- **Story Points**: 1 *(revised down from 4 — confirmed this was in fact a "go create the Circle" task, not an engineering one)*
- **Description**: Facilitate respectful dialogue between Yoruba spiritual practice and other African/Afro-diasporic traditions.
- **Acceptance Criteria**:
  - [x] A dedicated **Circle** for cross-cultural dialogue — **shipped July 25, 2026**: `Cross-Cultural Practice Bridges` Circle live at `/circles/cross-cultural-bridges` (`backend/prisma/seed-cross-cultural-circle.ts`, `npm run seed:cross-cultural-circle`, upsert-by-slug like FOR-018's Healing Circle), topics `cross-cultural`/`dialogue`/`afro-diasporic`/`comparative-practice`. Verified live via the real API.
  - [x] Guidelines for respectful inter-tradition communication — written directly into the Circle's description (speak from your own practice, questions welcome but not assumptions of equivalence, oath-bound/initiatory knowledge stays within its lineage, disagreement about practice is fine but disrespect isn't).
  - [ ] Moderation protocol reusing the existing flag/review queue — **investigated, found there isn't one to reuse**: `CircleFeedPost` has no `heldForReview`-style field at all (unlike `ForumPost`/`Product`), and the only admin action on Circles is `moderateCircle()` (`admin-community.service.ts`), which acts on the whole Circle (suspend/archive), not individual posts. This criterion as originally written assumed infrastructure that doesn't exist. Noted honestly in the Circle's own description rather than left silently unfulfilled; a real post-level Circle flagging system is out of scope for this item and would need its own story.
  - [ ] Expert facilitators identified — operational/staffing task, not engineering. Not started.
- **Dependencies**: Circles (live)
- **Notes**: Confirmed by building it: this needed no new schema, backend, or frontend code — only Circle creation + description content, exactly as the original note predicted. The one real gap found (no per-post moderation for Circle content) is a platform-wide hole, not specific to this Circle — worth flagging alongside the identical `ForumPost.heldForReview`-never-set gap discovered during `SHOP_BACKLOG.md`'s MSP-015.

### FOR-006: Community Recognition & Achievement System
- **Priority**: P1
- **Status**: 🟢 MOSTLY BUILT
- **Owner**: Engagement Team
- **Story Points**: 2 *(revised down from 3 — the endorsement gap closed via FOR-014)*
- **Description**: `UserBadge` model, admin award/revoke tooling, and a public badge strip with 7 computed milestones are already live. The remaining gap is specifically the oral-tradition angle, which overlaps with FOR-019.
- **Acceptance Criteria**:
  - [x] Recognition badges and titles — exists (`UserBadge`, `admin-community-tab.tsx`)
  - [x] Contribution tracking — exists (milestone computation, `GET /users/:id/badges`)
  - [x] Elder endorsement system for respected members (distinct from admin-awarded badges — an elder-initiated endorsement flow) — **shipped July 25, 2026 as part of FOR-014**: `ElderEndorsement` model, `POST/DELETE /users/:id/endorse`, computed "Elder-Endorsed" badge. See FOR-014 for full detail — built there since it was also that item's stated gap.
  - [ ] Community milestone celebrations (a notification/announcement hook off existing milestone events) — still open; badges are computed live on read rather than at the moment a threshold is crossed, so a "just earned" notification needs a different trigger point (checking post-creation counts inline wherever a badge-relevant action happens), not a quick add.
  - [ ] Storytelling and oral tradition preservation features — see FOR-019, don't duplicate
- **Dependencies**: `UserBadge` system (exists), FOR-019, FOR-014 (done — endorsement shipped there)
- **Notes**: The remaining scope here is smaller still: milestone celebrations (a real but distinct piece of engineering) and the FOR-019 storytelling overlap.

---

## 🟡 MINOR — Community Enhancement Features

### FOR-007: Spiritual Calendar Integration
- **Priority**: P2
- **Status**: 🟢 MOSTLY BUILT
- **Owner**: Events Team
- **Story Points**: 4 *(revised down from 8)*
- **Description**: `SacredCalendarEvent` with full admin CRUD (`admin-cultural-content-tab.tsx`) already exists. What's missing is surfacing it *in the forum*, not building the calendar itself.
- **Acceptance Criteria**:
  - [x] Cultural calendar data model and admin management — exists
  - [ ] Automatic thread highlighting during significant spiritual days (a forum-side consumer of the existing calendar data)
  - [ ] Community preparation discussion threads tied to calendar entries
  - [ ] Connection to Marketplace for ceremonial preparation (Marketplace is live)
- **Dependencies**: `SacredCalendarEvent` (exists), Marketplace (live)
- **Notes**: This is a forum-side integration task against an existing calendar, not new calendar infrastructure.

### FOR-008: Language Preservation Tools
- **Priority**: P2
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Linguistics Team
- **Story Points**: 2 *(revised down from 9 — the core content system already existed, fully built, and was simply never surfaced anywhere in the UI)*
- **Description**: The `Yorùbá Language & Culture` category exists as a space; the actual language tooling within it does not — or so it appeared. Investigation found a complete `DailyYorubaWord`/`YorubaWordService` system (word, pronunciation, definition, example, cultural context, category, per-user view history) already fully built with a working detail page at `/yoruba-word/:wordId` — it just had no entry point anywhere a user could actually reach it.
- **Acceptance Criteria**:
  - [x] Yoruba language input tools for posts and comments (diacritical marks) — **shipped July 25, 2026**: new reusable `YorubaDiacriticToolbar` component (`shared/components/yoruba-diacritic-toolbar.tsx`), inserts a character at the cursor position in the currently focused textarea. Not a new input method/IME — unicode diacritics were always technically typeable, most users just have no easy way to type `ẹ ọ ṣ` etc. without a Yoruba keyboard layout. Wired into both `create-thread-form.tsx`'s post composer and `thread-view.tsx`'s reply box. Live-verified: clicking a character inserts it at the cursor.
  - [x] Pronunciation guides for spiritual terms — **discovered already fully built** (`YorubaWordService`, 12 terms with `pronunciation` field), just never surfaced. Fixed by building the glossary browse page below.
  - [x] Translation assistance between Yoruba and English — served at the word level by the same existing `definition` field (English gloss for each Yorùbá term) — scoped deliberately to word-level glossary lookup, not sentence-level machine translation (which would mean adopting a third-party translation API, a real infrastructure/cost decision not made unilaterally here).
  - [x] Language learning threads and resources within the existing category — **discovered already built**: a "Proverb Challenge" starter thread already exists in `Yorùbá Language & Culture` (`seed-forum-starter-threads.ts`), functioning exactly as this criterion describes. Not duplicated.
  - [x] Cultural context explanations for Yoruba terms — same existing `YorubaWordService`, the `culturalContext` field. Also just needed surfacing.
- **Dependencies**: `Yorùbá Language & Culture` category (exists)
- **Notes**: Turned out to be far more "already built" than the original description assumed — the real gap was discoverability, not tooling. **New public glossary page** at `/yoruba-glossary` (`yoruba-glossary-view.tsx`) — all 12 terms, category filter chips, no per-term ID dependency (renders full content inline rather than requiring a DB row to exist for every term, since `DailyYorubaWord` rows are only created lazily as each term rotates through as "today's word"). **New `DailyYorubaWordBanner`**, shown only within the `Yorùbá Language & Culture` category on the Forum home page — same conditional-render pattern as FOR-Q3's `AskAnElderBanner`. **Found and fixed a real, pre-existing bug while investigating**: `GET /recommendations/daily-word/yoruba/categories` and `.../history/:userId` were completely unreachable — `daily-word/yoruba/:wordId` was declared before them in `recommendations.controller.ts`, so every request to those two literal routes was being swallowed as a wordId lookup (`getWordById('categories')` → no matching row → silent empty response, status 200). `getCategories()` and `getUserWordHistory()` were dead code until this fix — same "literal segments before `:param`" convention already used everywhere else in this codebase, just missed here. New `GET /recommendations/daily-word/yoruba/glossary` (public, optional `?category=` filter) added for the browse page. Live-verified: category filter chips correctly narrow the glossary (4 Spiritual-category terms out of 12), the Daily Word banner renders correctly with working "Full context" and "Browse glossary" links, and the diacritic toolbar correctly inserts characters at the cursor.

### FOR-009: Intergenerational Bridge Program
- **Priority**: P2
- **Status**: 🟢 MOSTLY BUILT (cross-checked July 27, 2026) — the one criterion this doc flagged as "genuinely new" (mentor-mentee matching) turned out to already be satisfied by `CommunityMentorship`, built for FOR-004's "Mentorship matching for new members" on July 26, 2026, one day before this cross-check. Confirmed real via `backend/src/community-mentorship/` (service/controller/module/tests) and `CommunityMentorshipView` routed at `/community/mentorship`.
- **Owner**: Community Team
- **Story Points**: 2 *(revised down from 7 — matching is done; only the elder-tech-assistance criterion remains genuinely open)*
- **Description**: Pod Network already has a "Steward" role and copy referencing youth mentorship (currently paused/waitlist); `Practitioners' Inner Circle` already gates a peer space by verification. FOR-004's `CommunityMentorship` system already covers the matching gap this item used to flag as its one real piece of new engineering — self-service request, mentor pool is any user opted into `answersElderQuestions` (FOR-Q3's "Ask an Elder"), capped at 3 active mentees, 30-day period. That mentor pool (self-selected as willing to guide newer members) is this platform's version of "intergenerational" — spiritual seniority via opt-in, not literal age — and fits this item's intent without inventing a separate age-based system.
- **Acceptance Criteria**:
  - [x] Mentor-mentee matching system — **satisfied by `CommunityMentorship` (FOR-004, July 26, 2026)**, not built separately for this item. `POST /community-mentorship/request`, `GET /community-mentorship/available-mentors`, `GET /community-mentorship/mine`, `POST /community-mentorship/:id/complete`.
  - [x] A space for practitioner-level dialogue — exists (`Practitioners' Inner Circle` category)
  - [ ] Knowledge preservation projects — see FOR-019, don't duplicate
  - [ ] Storytelling and oral tradition sharing — see FOR-019, don't duplicate
  - [ ] Technology assistance for elder community members — genuinely still open; distinct from mentorship matching (this is elders needing help *using the platform*, not elders mentoring newcomers on culture/practice). Not started.
- **Dependencies**: Pod Network relaunch (currently paused waitlist) only affects the youth/Steward framing, not the now-shipped matching system; FOR-019 for the knowledge-preservation/storytelling criteria.
- **Notes**: This is a documentation correction, not new engineering — verified against actual code (schema, service, controller, routed frontend view) before updating, rather than trusting either the old status line or a claim that it was still open.

---

## 🟢 FUTURE — Advanced Community Features

### FOR-010: Virtual Sacred Space Creation
- **Priority**: P3
- **Status**: ⬜ NOT STARTED
- **Owner**: Innovation Team
- **Story Points**: 21
- **Description**: VR/AR-enabled digital spaces for sacred community gatherings and ceremonies.
- **Acceptance Criteria**:
  - [ ] VR/AR enabled community spaces for special occasions
  - [ ] Digital representations of sacred Yoruba spaces
  - [ ] Virtual ceremony participation features
  - [ ] Accessibility features for all community members
  - [ ] Cultural authenticity verification for virtual elements
- **Dependencies**: Future VR/AR Infrastructure, Mobile App Integration
- **Notes**: Genuinely greenfield, no dependency conflicts with anything shipped. Long-term only.

### FOR-011: Blockchain-Based Oral History Preservation
- **Priority**: P3
- **Status**: ⬜ NOT STARTED
- **Owner**: Innovation Team
- **Story Points**: 18
- **Description**: Blockchain technology to preserve and authenticate oral histories and spiritual narratives.
- **Acceptance Criteria**:
  - [ ] Immutable record of community oral histories
  - [ ] Smart contracts for traditional knowledge sharing agreements
  - [ ] Verification system for authentic spiritual narratives
  - [ ] Community governance of historical records
  - [ ] Integration with traditional oral transmission methods
- **Dependencies**: Future Blockchain Infrastructure, Cultural Authority Integration
- **Notes**: `OralHistoryEntry` (see FOR-019/FOR-024) already gives a conventional database home for this content — treat this item as "add blockchain verification on top of that," not a replacement for it.

~~### FOR-012: AI-Assisted Cultural Moderation~~ — **REMOVED**
This item proposed AI assistance for content moderation. It's removed for two reasons: (1) it conflicts directly with this document's own Cultural Integrity Principle #1 ("elders and practitioners are the guides, not algorithms or moderators alone"), and (2) the human-led review queue it was meant to assist (`ContentFlagRule` + `heldForReview` + `admin-integrity-tab.tsx`) already shipped and already does this job without automation. If review-queue throughput becomes a real bottleneck, the fix is more elder reviewer capacity, not AI — see FOR-001.

---

## **Ìlú Àṣẹ — COMMUNITY_BACKLOG ADDENDUM — Deeper Community Layers**

> **Added**: July 5, 2026 (post-audit review) · **Reality-checked**: July 24, 2026
> **Rationale**: The initial COMMUNITY_BACKLOG covers safeguarding, learning, and recognition – but misses the *sacred relational, ritual, and intergenerational* dimensions that make a spiritual community distinct from a conventional forum.

---

## 🔴 CRITICAL — Missing Community Soul & Ritual Layers

### FOR-013: Sacred Space & Ritual Participation
- **Priority**: P0
- **Status**: 🟢 CORE LOOP DONE (July 25, 2026) — buildable entirely on existing primitives, as the original note predicted
- **Owner**: Community Ritual Team
- **Story Points**: 4 *(revised down from 8 — the two highest-value criteria shipped; the rest are content/UX polish, not infrastructure)*
- **Description**: Community rituals and ceremonies coordinated together, not just discussed. `SacredCalendarEvent`, Circles, and Forum threads already exist as the building blocks — none of this needs new infrastructure, just new coordination features on top.
- **What shipped**: new `RitualParticipation` model (migration `20260725085839_add_ritual_participation`), hanging RSVP + optional intention off the existing `SacredCalendarEvent` model — no new "ritual" concept invented. Three routes on `CommunityCulturalContentController`: `POST/DELETE /cultural/sacred-events/:id/rsvp`, `GET /cultural/sacred-events/:id/participation`. Frontend: a `RitualParticipationPanel` component embedded directly in the existing "Coming Up" banner on the marketplace homepage (`marketplace-view.tsx`, from MSP-008) — shows participant count, an "I'm Participating" button with an optional intention textarea and public/private toggle, and a feed of public intentions from other participants.
- **Acceptance Criteria**:
  - [x] Virtual ritual announcements and participation tracking, hung off existing `SacredCalendarEvent` entries — shipped
  - [x] Prayer/offering intention sharing (public/private) — shipped; private intentions are provably excluded from the public feed (verified: `publicIntentions` only ever contains entries where `isPublic: true`)
  - [ ] Community-wide ritual timing coordination across time zones — display-only concern, not attempted this pass (every date already renders in the visitor's local browser timezone via `toLocaleDateString`, which may already be sufficient — worth confirming with real usage before building anything further)
  - [ ] Post-ritual sharing thread pattern ("What did you experience?") — reuse Forum, not attempted
  - [ ] Ritual preparation guides, tied to Marketplace (live) for needed items — content task, not attempted
  - [ ] Community-generated rituals, culturally approved via the existing review queue — a bigger governance decision, deferred
  - [ ] Respectful recording of virtual ceremonies (with consent) — a separate media/compliance feature, deferred
- **Verified live end-to-end**: created a real upcoming `SacredCalendarEvent` as admin → two client users RSVP'd, one with a public intention and one with a private intention → confirmed the participation summary correctly showed `count: 2` but only the public intention in `publicIntentions` → cancelled an RSVP and confirmed the count updated → confirmed the whole flow in a real browser (RSVP button → intention form → "You're participating" state → public intention rendering inline in the banner). Screenshots taken. All test data deleted afterward.
- **Dependencies**: `SacredCalendarEvent` (exists), Circles (exist), Marketplace (live)
- **Notes**: The community should pray together, not just talk about prayer — and the data model to hang this off of already existed, exactly as predicted. The remaining five criteria are genuinely separable follow-ups (content, a governance decision, or a compliance-sensitive media feature), not infrastructure blockers.

### FOR-014: Community Elders & Wisdom Keepers Council
- **Priority**: P0
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Elder Council Coordination
- **Story Points**: 3 *(revised down from 7 — 4 of 7 criteria closed; governance and succession deliberately left as scoping decisions, not engineering)*
- **Description**: Elder Oversight Panel (moderation-side), practitioner complaint handling, and Pod Network's "Steward" concept already give elders real standing in the system. What's missing is a *teaching-and-governance* layer, not a moderation one.
- **Acceptance Criteria**:
  - [x] Elder profiles with expertise areas and availability — **shipped July 25, 2026, and it was actually a bug fix**: `public-profile-view.tsx` already had a full "Specializations" bento card reading `user.specialization` — but that field never existed on `User` (only on `VerificationApplication`, a frozen one-time snapshot never surfaced afterward), so the section had been silently rendering nothing this entire time. Added real, self-editable `User.specialization: String[]` and `User.availabilityNote: String?` fields (`PATCH /users/:id`, same self-service pattern as `answersElderQuestions`), plus the missing edit-form inputs. Deliberately distinct from `interests` (already working, relabeled "Areas of Practice" for Babalawo) — that's a casual interest list; this is the formal specialization list shown prominently next to Services/Booking. Live-verified: set specialization + availability, confirmed rendering on the live profile page.
  - [x] Elder-led discussion series and teachings — **shipped July 25, 2026**: `ForumThread.isTeachingSeries`/`seriesName`, settable by Babalawo/Admin only at thread creation (`forum.service.ts`'s `createThread`, same role-check pattern as Vendor Circle's gate), shown as a badge in thread listings. Live-verified: Babalawo can create one, a client attempting the same is correctly rejected with 403.
  - [x] Community Q&A sessions with elders — **confirmed already fully covered by FOR-Q3's "Ask an Elder"** (`answersElderQuestions`, the Seeker Questions banner, the "Elder Voice" badge) — exactly the formalization target this criterion asked for. Not duplicated.
  - [x] Elder endorsement system — **shipped July 25, 2026**: new `ElderEndorsement` model (any verified Babalawo can endorse any member, `@@unique([endorserId, endorseeId])` prevents duplicates), `POST/DELETE /users/:id/endorse`, `GET /users/:id/endorsements`, computed into a "🌟 Elder-Endorsed" badge via the same `getUserBadges()` every other badge uses — not a second recognition system. Closes the identical gap FOR-006 flagged. Live-verified: endorse → duplicate rejected → badge appears; self-endorsement rejected; an unverified Babalawo correctly blocked from endorsing at all.
  - [ ] Elder governance on cultural matters — **deliberately not built**: this needs a real product decision about what "governance" concretely means (voting rights? veto power on flagged content? a formal council with terms/elections?) before any of it can be engineered. Building a guess at a governance/voting mechanism unilaterally would be a bigger and more consequential call than this pass should make on its own.
  - [ ] Succession planning (elder apprentices) — **deliberately not built**: a formal spiritual-succession system encodes real claims about lineage and readiness that should come from actual elders/community leadership, not be invented in software. Left as a distinct, larger, more sensitive follow-up.
  - [x] Elder wellbeing support — **confirmed already covered**: FOR-017's wellbeing check-in system (`/wellbeing/check-in`) has no role restriction — a Babalawo can already request one same as anyone. Elders additionally already have a private peer space via `Practitioners' Inner Circle` (BABALAWO-only forum category) where wellbeing topics can be raised among peers. No new engineering needed.
- **Dependencies**: Elder Oversight Panel (exists), Pod Network relaunch (paused), FOR-Q3 (done)
- **Notes**: The forum should be *elders-led*, not just *elders-moderated*. 5 of 7 criteria now closed (2 by new engineering, 2 by cross-reference to already-shipped work, 1 by fixing a real pre-existing bug); the 2 remaining are correctly left for a real scoping decision rather than an invented governance/succession system. 7 new backend unit tests added (`users.service.spec.ts`, 531/531 full backend suite passing).

### FOR-015: Grief, Healing & Ancestral Support Space
- **Priority**: P0
- **Status**: 🟢 CORE LOOP DONE (July 25, 2026)
- **Owner**: Community Care Team
- **Story Points**: 5 *(revised down from 6 — the crisis-escalation integration was the one item that genuinely needed engineering, and it's now done)*
- **Description**: A Circle with grief/healing as its topic can be created today with zero new code (`Circle.topics: String[]` already supports this). The remaining engineering is specifically the cultural-protocol and crisis-escalation layer.
- **What shipped**:
  - **Crisis-escalation integration (the real engineering piece)**: F9-602's crisis-keyword detection was Forum-only before this pass — a hard case posted in a Circle (exactly where grief-related content is most likely to appear) never reached the admin welfare queue at all. Fixed by extracting the keyword logic out of `ForumService` into a new shared `CrisisDetectionService` (`backend/src/shared/services/crisis-detection.service.ts`, registered on the global `SharedModule` so both `ForumService` and `CirclesService` use the exact same keyword list — no second list to drift out of sync). Added `hasCrisisSignal` to `CircleFeedPost` (migration `20260725091855_add_circle_feed_post_crisis_signal`), wired detection into `createCircleFeedPost()`, and extended the existing admin queue (`getCrisisSignalPosts()`/`clearCrisisSignal()` in `forum.service.ts`) to merge Forum and Circle flagged content into the one `AdminCrisisAlertsTab` screen — tagged `source: 'forum' | 'circle'` — rather than building a second review screen.
  - **The Circle itself**: seeded via a new idempotent script (`prisma/seed-grief-circle.ts`, `npm run seed:grief-circle`) — "Grief, Healing & Ancestral Support", public, topics `[grief, healing, ancestral-veneration, remembrance]`, description links to the Remembrance Wall and repeats FOR-027's interim crisis-contact disclosure.
  - **Ancestral remembrance features**: a new small `MemorialEntry` model + `/memorials` module (list-only public feed, no admin review queue by design — same posting-is-immediate posture as Circle feed posts) and a "Ancestral Remembrance Wall" page (`/remembrance-wall`) where any member can add a name, relationship, and message, with a public/private toggle.
- **Acceptance Criteria**:
  - [x] A dedicated grief/healing Circle, created and stewarded — shipped via seed script
  - [x] Ancestral remembrance features (community memorials) — shipped (`/remembrance-wall`)
  - [ ] Healing support referrals to practitioners (referral only, not in-app therapy) — not attempted; the existing "Find My Guide" Babalawo discovery flow already covers this in a general sense, worth confirming that's sufficient before building anything grief-specific
  - [ ] Cultural grief-practice guidance content — content task, not attempted
  - [x] Integration with the crisis escalation protocol (FOR-002) for hard cases — shipped, see above
  - [ ] Post-grief reintegration support pattern — not attempted, unclear scope without product input
- **Verified live end-to-end**: (1) crisis integration — joined the seeded test flow with a real Circle, posted crisis-keyword content to its feed, confirmed `hasCrisisSignal: true` persisted, confirmed it appeared in the merged admin queue tagged `source: circle` with the correct circle name and link, confirmed "Mark as Reviewed" correctly cleared it via the real admin UI (screenshot taken). (2) Remembrance Wall — added a public entry through the real form, confirmed it rendered on the wall; added a private entry via API and confirmed it was correctly excluded from the public listing; confirmed a non-author cannot delete another user's entry (403) while the author can (200). All test data deleted afterward; the seeded Circle itself was kept as real content.
- **Regression check**: refactoring `ForumService` to use the new shared `CrisisDetectionService` touches the exact crisis-detection code fixed and verified earlier this session (see FOR-002) — re-ran the full Jest suite (500 passing) and re-verified live that a Forum thread with crisis keywords still correctly persists `hasCrisisSignal: true` after the refactor.
- **Dependencies**: Circles (exist), FOR-002 (done), FOR-027 (done)
- **Notes**: The crisis-escalation gap here was real, not hypothetical — Circles like this one are exactly where a hard case is most likely to surface, and until this pass it had zero safety-net coverage. FOR-002's escalation destination (live Babalawo booking) is still paused — see FOR-027's interim contact path, which is now also linked from the Circle's own description.

---

## 🟡 SIGNIFICANT — Missing Community Protection & Wellbeing

### FOR-016: Spiritual Abuse & Harm Prevention
- **Priority**: P1
- **Status**: 🟢 CORE LOOP DONE (July 26, 2026) — only the content-authoring item remains, deliberately not built by an AI agent
- **Owner**: Community Safety Team
- **Story Points**: 9 *(most of this was already built in an earlier session but never checked off here — see notes below)*
- **Description**: Trust scores, practitioner complaint handling, and the human review queue already give real groundwork here. The original draft's "detection patterns" language implied automated inference — replaced with the same human-flag pattern used everywhere else in this doc.
- **Acceptance Criteria**:
  - [x] A mechanism to flag concerning practitioner behavior — exists (`PractitionerComplaint`, trust score system)
  - [x] Keyword/pattern-based community flagging (not ML) for control/fear-based/financial-exploitation concerns, into the existing review queue — **shipped July 26, 2026**: `ContentFlagRule` (ADM-018's admin-curated KEYWORD list) existed but nothing ever evaluated it against anything — confirmed via `grep`, zero call sites. `ComplaintsService.file()` now scans a filed complaint's `description` against active KEYWORD rules at submission time; a match sets `flaggedByKeywordRule`/`matchedKeywords` (new columns) and escalates the admin notification from WARNING to URGENT. `AdminComplaintsService.getComplaints()` now sorts flagged complaints first — into the existing queue, not a separate one. `practitioner-complaints-tab.tsx` shows a "⚠ Flagged" badge with the matched terms on hover.
  - [x] Elder review of flagged cases — exists (Elder Oversight Panel)
  - [ ] Education content on healthy spiritual boundaries — **still open, deliberately not authored here**: this is a content/policy task (what "healthy spiritual boundaries" means in Yoruba/Ifá practice, what counts as a red flag), not engineering — same category as this doc's own MSP-003 blacklist item. An AI agent isn't the right author for authoritative cultural/spiritual guidance content; needs a human with Product & Content or Community Ops ownership.
  - [x] Restoration/repair process after a finding — see FOR-018, don't duplicate — **already done, checkbox was stale**: `AdminComplaintsService.resolveComplaint()` already notifies the client on every resolution with "our Healing & Reconciliation space is here for you" and a `healingPath: '/healing'` data pointer (FOR-018), not just a bare outcome message. Confirmed in code July 26, 2026 while scoping this item; no new work needed.
  - [x] Referral to community support (not punitive-only) — **already done, checkbox was stale**: the same resolution notification above is explicitly framed as support, not a verdict — confirmed alongside the item above.
  - [x] A documented (not automated) list of known-harmful-practitioner flags, tied to existing trust score tooling — **already done, checkbox was stale**: `COMPLAINT_REASONS` (`CONTROLLING_BEHAVIOR`/`FEAR_BASED_MANIPULATION`/`FINANCIAL_EXPLOITATION`, alongside the pre-existing `NO_SHOW`/`INAPPROPRIATE`/`FRAUD`) is exactly this documented taxonomy, and `recomputeTrustScore()` already docks -15 for an upheld (RESOLVED) complaint. Confirmed in code July 26, 2026; no new work needed.
- **Dependencies**: `PractitionerComplaint` (exists), trust score system (exists), FOR-018
- **Notes**: Protection must come with care, not just enforcement — and the enforcement half is mostly built already. Three of these five criteria were fully implemented in an earlier session (the `COMPLAINT_REASONS` taxonomy, trust score integration, and the healing-space referral in `resolveComplaint()`) but this file was never updated to reflect it — a real instance of the doc drift this backlog's own July 24 revision note warned about. The keyword-flagging gap was the one genuine remaining engineering item; education content remains a real, open, non-engineering task.

### FOR-025: Unify Trust & Reputation Across Practitioners and Vendors
- **Priority**: P1
- **Status**: ✅ DONE (July 24, 2026)
- **Owner**: Engineering
- **Story Points**: 5
- **Description**: This backlog's `trustScore` system and `SHOP_BACKLOG.md`'s MSP-006 (Marketplace Reputation & Trust) currently describe two separate trust models. Since a Babalawo can also be a Vendor on this platform, a single person could end up with two independent, potentially contradictory trust signals if these are built separately. This item is the decision-and-merge work to prevent that, not a new trust feature.
- **Acceptance Criteria**:
  - [x] Confirmed `trustScore` is person-level (`User.trustScore`), not practitioner-context-only
  - [x] Decided: Vendor reputation becomes a contributing signal into the same `trustScore`, not a separate number
  - [x] Implemented: `recomputeTrustScore()` (`backend/src/users/users.service.ts`) now scores any BABALAWO role AND/OR any user with a `vendorProfile` — an approved vendor gets +10, and +20 more if 5+ product reviews average ≥70% positive. A Babalawo who's also a vendor gets both sets of signals blended into the one existing `trustScore` field; a client with no practitioner or vendor standing still correctly scores 0. 5 new unit tests cover all four cases (Babalawo-only unchanged, vendor-only, blended, below-threshold).
  - [x] `SHOP_BACKLOG.md`'s MSP-006 updated to point at this resolved design and explicitly wait for it before building its own vendor-level rollup
- **Dependencies**: `trustScore` system (exists), `SHOP_BACKLOG.md`'s MSP-006
- **Notes**: Found and flagged (not fixed — separate, unrelated bug) while in this code: `admin-trust-score.service.ts`'s audit-breakdown view claims to "mirror `recomputeTrustScore()` logic" but uses an entirely different, pre-existing formula (referrals, certificates, avg-rating×4 — none of which the real function has). Worth its own ticket.

### FOR-017: Community Member Wellbeing — Opt-In Check-Ins
- **Priority**: P1
- **Status**: 🟢 CORE LOOP DONE (July 25, 2026)
- **Owner**: Community Wellbeing Team
- **Story Points**: 5 *(revised down from 7 — the two structural criteria shipped; the rest are content/policy work)*
- **Description**: The original draft's "algorithmic detection of disengagement or distress patterns" is removed — inferring a member's mental state from behavior without their consent is exactly the kind of automated judgment this document's own principles rule out. What remains is a genuinely useful, consent-based version.
- **What shipped**: new `WellbeingCheckIn` model + `isCommunityCarer` admin-assigned flag on `User` (migration `20260725095459_add_wellbeing_checkins`, same human-designated pattern as `isCommunityBuilder`/`isFeatured`). New `/wellbeing` module: `POST /wellbeing/check-in` (any member, optional message), `GET /wellbeing/check-ins/mine`, `GET /wellbeing/check-ins` (carer/admin-only queue), `PATCH /wellbeing/check-ins/:id/claim`, `PATCH /wellbeing/check-ins/:id/resolve`. Carers and admins get an in-app notification the moment a request comes in. A new `/wellbeing` page lets any member request a check-in and see their own request history; carers additionally see a live queue with Claim/Resolve actions. Admins can mark any user as a Community Carer from a new "Wellbeing" section in the User Management panel.
- **Acceptance Criteria**:
  - [x] Anonymous, user-initiated wellbeing check-in requests — "anonymous" interpreted as *not visible to the wider community*, restricted to designated carers/admins only (not literally anonymous to the carer who responds, since someone has to reach out) — verified a non-carer gets a 403 trying to view the queue
  - [x] Community member caring roles (designated support roles, human-assigned) — `isCommunityCarer`, admin-toggleable, verified both directions live in the admin UI
  - [ ] Referral pathways to practitioners and support services — the Wellbeing page links to `hello@iluase.com` (FOR-027's interim contact) for crisis-adjacent cases; a dedicated practitioner-referral flow beyond that wasn't built this pass
  - [ ] Cultural support content for mental health challenges — content task, not attempted
  - [ ] Community member restoration journeys (returning from hardship) — vague scope without product input, deferred
  - [x] Wellbeing data privacy and consent management — check-in requests are visible only to the requester, carers, and admins; nothing is ever shown on a public profile or the member directory
- **Verified live end-to-end**: registered a requester and a carer → admin marked the carer via the User Management panel (in the real browser, toggled both on and off, confirmed correct toast + button state each time) → requester submitted a check-in with a message → confirmed a non-carer gets 403 on the queue → carer claimed it (requester's own view updated to CLAIMED) → carer resolved it → confirmed the full request/claim/resolve loop in the real `/wellbeing` page. **Found and fixed a real infrastructure bug along the way**: a stray production build (`dist/backend/src/main`, started in an earlier session) was shadowing port 8080 ahead of the actual dev server, silently serving stale code for some routes — killed it and confirmed a single clean dev instance stayed up correctly. All test data deleted afterward.
- **Dependencies**: Member profiles (exist)
- **Notes**: Proactive care through invitation, not surveillance.

### FOR-018: Community Healing & Reconciliation Processes
- **Priority**: P1
- **Status**: 🟢 CORE LOOP DONE (July 25, 2026)
- **Owner**: Community Reconciliation Team
- **Story Points**: 6 *(revised down from 10 — the mediation loop shipped; ceremonies and feedback-loop tooling remain content/process work)*
- **Description**: When conflicts occur, provide culturally appropriate healing and reconciliation. **Important scoping clarification found during implementation**: "Elder Oversight Panel" (`elder-oversight-panel.tsx`) already exists in the codebase, but it is exclusively a *content-accuracy* tool — Babalawos flagging/endorsing forum posts for cultural correctness (`ElderFlag`/`ElderReaction`). It has no concept of an interpersonal conflict between two members. This item's "elder-mediated" restorative process is therefore a new, distinct concept — also deliberately separate from `PractitionerComplaint` (admin-adjudicated, client-vs-practitioner formal complaints), matching FOR-016's note not to duplicate that system.
- **What shipped**: new `HealingCase` model (migration `20260725121100_add_healing_cases`) — a private, elder-mediated restorative case, never visible outside the reporter, an optionally-named respondent, the assigned elder, and admins. New `/healing` module: `POST /healing/cases` (any member reports, with an optional respondent resolved by email, same non-blocking pattern as MSP-024's gift-recipient resolution), `GET /healing/cases/mine`, `GET /healing/cases/queue` (Babalawo/admin-only), `PATCH /healing/cases/:id/assign` (an elder claims an unclaimed case), `PATCH /healing/cases/:id/resolve`. New `/healing` page: "Bring a Concern" form + case history for everyone; for Babalawo/admin, a live queue with Claim/Resolve actions. Seeded the "Healing & Reconciliation" Circle (`npm run seed:healing-circle`) as the general discussion/support space, pointing to `/healing` for private mediation specifically.
- **Acceptance Criteria**:
  - [x] Conflict resolution process (culturally appropriate mediation) — shipped as a new elder-mediated case system (see scoping note above on why "owned by Elder Oversight Panel" as originally worded didn't map to an existing mechanism)
  - [x] Community healing circles — reuse the Circles primitive — Circle seeded
  - [ ] Restoration pathways for those who caused harm — the case/resolution loop supports this narratively (an elder's resolution notes can describe a restoration path), but no structured "restoration plan" data model was built — deferred as a possible follow-up once real case volume shows what's actually needed
  - [ ] Reconciliation ceremonies where appropriate — content/ops task, not attempted
  - [x] Privacy-respecting documentation of healing processes — verified live: a random third party gets 403 on case detail; only reporter/respondent/assigned elder/admin can ever see a case
  - [ ] Learning-from-conflicts feedback loop — vague scope without product input, deferred
  - [ ] Community forgiveness/trust restoration process — vague scope without product input, deferred
- **Verified live end-to-end, including every access-control edge case**: reporter filed a case naming a respondent by email → confirmed the respondent could see it in their own case list → confirmed a non-elder gets 403 on the queue → confirmed a completely unrelated third party gets 403 on the case detail (privacy holds) → an elder claimed the case (status → IN_MEDIATION) → confirmed a **second** elder cannot double-claim it (400) and cannot resolve a case they don't own (403) → the assigned elder resolved it with notes → confirmed the resolution appeared correctly on the reporter's own case view, both via API and in a real browser screenshot. All test data deleted afterward.
- **Dependencies**: Circles (exist), FOR-016 (partial — the restoration-process cross-reference)
- **Notes**: Healing is a practice, not a one-time event. The "Elder Oversight Panel already exists" assumption in earlier drafts was checked against the real component and found to be a different, narrower system (content moderation, not conflict mediation) — this is now documented so it isn't re-assumed later.

---

## 🟡 MINOR — Missing Community Wisdom Transmission

### FOR-019: Oral Tradition & Storytelling Platform
- **Priority**: P2
- **Status**: 🟢 MOSTLY BUILT — more than this backlog credited before implementation started; only storytelling events remain
- **Owner**: Cultural Preservation Team
- **Story Points**: 2 *(revised down again from 6 — the admin UI already had category/source-URL/transcript fields fully wired before this pass touched anything; only the marketplace connection was actually missing)*
- **Description**: `OralHistoryEntry` (full admin CRUD via `admin-cultural-content-tab.tsx`) and an actual pinned **"Share Your Story — Oral History Archive"** thread already exist, seeded and live in the `Yorùbá Language & Culture` category. This item is about growing what's there, not starting from zero.
- **Acceptance Criteria**:
  - [x] A dedicated space for oral-history contributions — exists (pinned Archive thread + `OralHistoryEntry` model)
  - [x] Audio/video recording of oral stories (with elder consent) — turns out this already existed: the admin form has a labeled "Audio/source URL" field (`sourceUrl`) for exactly this, discovered during implementation (July 24, 2026) — not something that needed building
  - [x] Transcription with cultural annotations — also already existed: a labeled "Transcription / content" field (`content`), same discovery
  - [x] Story categories within the existing model — also already existed: `ORAL_HISTORY_CATEGORIES` dropdown (Divination, Ceremony, Proverbs, History, Elder Teaching, Myth & Legend, Ritual) — close enough to the originally-proposed taxonomy, no changes needed
  - [ ] Storytelling events (virtual gatherings) — the one genuinely unbuilt item remaining; could reuse `SacredCalendarEvent` rather than new infrastructure
  - [x] Story preservation for future generations — the underlying model already persists this
  - [x] **Connection to Marketplace: items associated with stories** — shipped July 24, 2026. Added `relatedProductIds: String[]` to `OralHistoryEntry` (migration `20260724102222_add_oral_history_related_products`), wired through the DTOs, admin form (comma-separated product IDs, matching the existing `tags` field's UX pattern), and `marketplace.service.ts`'s `findProductById()` — the public product-detail response now includes a `relatedStories` array of any published entries linked to it. Frontend renders this as a "Related Story" card on the product page. Verified end-to-end with a real product/vendor/story and a live authenticated browser session — screenshot confirms correct rendering.
- **Dependencies**: `OralHistoryEntry` (exists), Marketplace (live)
- **Notes**: This item is a good example of why the reality-check discipline in this backlog matters — the original "6 SP, needs audio/video/categorization work" estimate was itself stale by the time implementation started; the actual remaining gap was one relation, not three features.

### FOR-026: Consolidate Oral History / Storytelling Effort Across Community and Shop
- **Priority**: P1
- **Status**: ✅ DONE (July 24, 2026) — design decided; FOR-024/MSP-015/MSP-020/MSP-022 build against it, not yet built themselves
- **Owner**: Product & Content
- **Story Points**: 2
- **Description**: FOR-019 and FOR-024 here, plus `SHOP_BACKLOG.md`'s MSP-015, MSP-020, and MSP-022, all point at the same underlying idea — community-contributed, elder-reviewed cultural storytelling — and the same `OralHistoryEntry` model. As five separately-scoped items across two documents, two different people could pick these up independently and build overlapping (or conflicting) features. This item is the coordination work, not a new feature.
- **Acceptance Criteria**:
  - [x] One named owner for "storytelling/oral history" across both backlogs — **Product & Content**, single point of contact for all five downstream items
  - [x] A single design decided: no new submission model. Any user submits a story through one lightweight intake (a form posting into the existing `OralHistoryEntry` table with `publishedAt: null` — i.e. a draft, using the exact same shape admin already creates entries with) — it lands in the exact same admin queue `admin-cultural-content-tab.tsx` already has (toggle publish/unpublish), so there is no second review system to build. FOR-024's "community-submitted content path" *is* this: opening the existing `POST /admin/cultural/oral-histories` creation flow to non-admin authenticated users, with `publishedAt` forced to `null` server-side until an admin/elder toggles it live — one code path, one permission change, not a parallel model.
  - [x] Marketplace vs. Forum surfacing stays separate, as intended: `relatedProductIds` (shipped this session, see FOR-019) is the marketplace-side hook; the pinned Archive thread is the Forum-side hook. Both read from the same underlying `OralHistoryEntry` rows — MSP-015/MSP-020/MSP-022 should surface existing/future entries via `relatedProductIds`, not invent a second per-item comment/story model as their original drafts proposed
  - [x] Both backlogs updated to point at this one shared design
- **Dependencies**: `OralHistoryEntry` (exists), FOR-019, FOR-024, `SHOP_BACKLOG.md`'s MSP-015/MSP-020/MSP-022
- **Notes**: This resolves the *design* question so the four still-open items (FOR-024, MSP-015, MSP-020, MSP-022) have one target to build against instead of independently inventing submission flows. None of those four are built yet — this item only removes the risk of them diverging.

### FOR-020: Embodied Knowledge & Practice Transmission
- **Priority**: P2
- **Status**: ⬜ NOT STARTED
- **Owner**: Practice Transmission Team
- **Story Points**: 14
- **Description**: Support for transmitting embodied practices (ritual movements, offerings, prayer forms) beyond text.
- **Acceptance Criteria**:
  - [ ] Video guidance for practices (with cultural approval)
  - [ ] Practice guides ("How to make an offering," "How to pray")
  - [ ] Practice discussion threads
  - [ ] Elder-led practice workshops (virtual)
  - [ ] Practice verification for cultural accuracy
  - [ ] Practice documentation for future generations
  - [ ] Practice modification guidance
- **Dependencies**: Academy (live), Elder Oversight Panel (exists)
- **Notes**: Genuinely new. Knowledge is not just intellectual – it must be lived.

### FOR-021: Community Dream Sharing & Interpretation
- **Priority**: P2
- **Status**: 🟢 CORE LOOP DONE (July 25, 2026)
- **Owner**: Spiritual Interpretation Team
- **Story Points**: 5 *(revised down from 7 — the journaling/sharing/interpretation loop shipped; framework content and anti-manipulation tooling remain)*
- **Description**: A dedicated space for sharing and interpreting dreams. A dream-sharing Circle can be created today with the existing `topics` field — the cultural-framework and privacy tooling on top is the real gap.
- **What shipped**: new `DreamEntry` model (migration `20260725101800_add_dream_entries`) with two independent, private-by-default opt-ins — share publicly on a dream-pattern feed, and/or request a Babalawo's interpretation — since sharing and wanting a practitioner's reading are different kinds of consent, not one "publish" toggle. New `/dreams` module: `POST /dreams`, `GET /dreams/mine`, `GET /dreams/shared` (public), `GET /dreams/interpretation-requests` (Babalawo/admin-only), `POST /dreams/:id/interpret`. New `/dreams` page with three tabs (My Journal, Shared Dreams, and — for Babalawo/admin only — Interpretation Requests). Seeded the "Dream Sharing & Interpretation" Circle (`npm run seed:dream-circle`) as the discussion-space container, linking to `/dreams` for the actual journal.
- **Acceptance Criteria**:
  - [x] A dream-sharing Circle or thread type (privacy-controlled) — Circle seeded; the actual private/public control lives on `DreamEntry.isPublic`, not the Circle
  - [ ] Cultural dream-interpretation framework content (Yoruba dream traditions) — content task, not attempted
  - [x] Practitioner involvement in interpretation (on request) — `interpretationRequested` flag + Babalawo-only queue + `interpret()` endpoint, verified end-to-end
  - [x] Dream journaling features — private-by-default journal at `/dreams`, verified a dream with no flags set is never visible to anyone but its author
  - [x] Community dream-pattern threads — the public `/dreams/shared` feed
  - [ ] Protection against dream manipulation or anxiety — no concrete engineering scope identified for this criterion; likely a moderation-policy question rather than a feature, flagged for Product
  - [x] Connection to Ifá/divination framing when appropriate — the interpretation flow is explicitly Babalawo-only, tying it to the existing practitioner network rather than any Babalawo-less generic response
- **Verified live end-to-end**: registered a dreamer and a Babalawo → dreamer created one fully private dream and one public dream requesting interpretation → confirmed the shared feed showed only the public one (private dream provably never appeared) → confirmed a non-Babalawo gets 403 on the interpretation queue → Babalawo saw the request, submitted an interpretation → confirmed it appeared back on the dreamer's own journal entry and on the public shared feed. Confirmed the same in a real browser (My Journal tab correctly showed both dreams with the interpretation rendered under the public one). All test data deleted afterward.
- **Dependencies**: Circles (exist), Babalawo network (live)
- **Notes**: Dreaming is sacred in Yoruba tradition — handle with care. Kept the journal private-by-default throughout; nothing is shared or sent for interpretation without the author explicitly opting in per-dream.

---

## 🟢 FUTURE — Advanced Community Ecosystem

### FOR-023: Community Member Spiritual Journey Tracking
- **Priority**: P3
- **Status**: 🟢 MOSTLY BUILT
- **Owner**: Spiritual Development Team
- **Story Points**: 4 *(revised down from 12 — the core already shipped as EXP-029)*
- **Description**: `GET /users/:id/badges` already computes 7 spiritual milestones and shows them as a badge strip with tooltips on every public profile. This item's core premise is done; what's left is connective tissue to mentorship and growth-path recommendations.
- **Acceptance Criteria**:
  - [x] Spiritual milestone tracking — exists (7 computed milestones, `EXP-029`)
  - [x] Public display with celebration framing — exists (badge strip on profile)
  - [ ] Mentor matching at each milestone stage — depends on FOR-009's matching system
  - [ ] Privacy controls for spiritual development (partially covered by existing profile-visibility settings — verify coverage before building new)
  - [ ] Connection to Academy/Marketplace for growth support (both live)
- **Dependencies**: `EXP-029` badge system (exists), FOR-009
- **Notes**: This item is close to done. Don't rebuild the milestone system — extend it.

### FOR-024: Community-Generated Cultural Content Repository
- **Priority**: P3
- **Status**: 🟢 SUBMISSION PATH + FRONTEND FORM SHIPPED (July 24, 2026)
- **Owner**: Cultural Preservation Team
- **Story Points**: 6 *(revised down from 7 — the frontend form was small, since `product-detail-view.tsx` already had the display half from FOR-019)*
- **Description**: `OralHistoryEntry` with admin-managed CRUD already gives elder-curated cultural content a real home. This session opened the *community-submitted* path per FOR-026's decided design (backend), then wired a real "Share a Story" form on the product page (frontend) — no new model, no new review queue, one permission change plus one form.
- **Acceptance Criteria**:
  - [x] Elder-curated cultural content storage — exists (`OralHistoryEntry`, `admin-cultural-content-tab.tsx`)
  - [x] Community-submitted content path — shipped: `POST /cultural/oral-histories/submit` (new `CommunityCulturalContentController`, `backend/src/admin/community-cultural-content.controller.ts`), open to any authenticated user via `JwtAuthGuard` only (no `@Roles` restriction). Delegates to a new `submitCommunityOralHistory()` method on the existing `AdminCulturalContentService` — same `prisma.oralHistoryEntry.create()` call the admin path uses, but `publishedAt` is never set, so submissions always land as drafts. They then flow through the exact same admin queue (`GET/PATCH /admin/cultural/oral-histories`) admins already use to review and publish `OralHistoryEntry` rows — no second review system.
  - [x] **Frontend submission form** — a "Share a Story" section added to `product-detail-view.tsx`, right next to the "Related Story" card it already rendered (FOR-019). Any logged-in user sees a "Share a story about this item" link that expands into a title/category/content form, posting to the endpoint above with `relatedProductIds: [productId]` pre-set. On success shows "Thank you — your story was submitted for elder review." Reuses the exact 7-category taxonomy (`Divination`, `Ceremony`, `Proverbs`, `History`, `Elder Teaching`, `Myth & Legend`, `Ritual`) the admin form already uses — one shared list, not a second one invented for this path.
  - [ ] Revision history with transparency
  - [ ] Community discussion around content accuracy
  - [ ] Licensing for respectful, non-commercial sharing
  - [ ] Governance model for content decisions
- **Verified end-to-end, twice**: (1) API-only — registered a real client user → `POST /cultural/oral-histories/submit` → confirmed `publishedAt: null` → confirmed it appeared in `GET /admin/cultural/oral-histories` with correct `creator` attribution → admin `PATCH .../publish: true` → confirmed it went live. (2) Full browser loop — registered a real client, vendor, and product → loaded the real product page → clicked "Share a story about this item" → filled and submitted the form → confirmed the "submitted for elder review" message rendered → confirmed via the admin API that the submission landed with the correct `relatedProductIds` → admin approved it → confirmed it now appears in that same product's `relatedStories`, rendering in the "Related Story" card FOR-019 built. Screenshots taken. All test data deleted after both passes.
- **Dependencies**: `OralHistoryEntry` (exists), FOR-019 (mostly built), FOR-026 (design decided — this item builds it)
- **Notes**: The community is the knowledge, not just consumers of it. Both the backend submission path and the frontend form that uses it are done — this closes the loop MSP-015/MSP-020/MSP-022 needed for their community-storytelling criteria.

---

## Quick Wins

### ~~FOR-Q1: Community Announcements & Events Channel~~ — **ALREADY SHIPPED**
- **Status**: ✅ DONE
- What was proposed here — admin-only announcements, community-wide visibility — already exists: `Announcement` model with full CRUD, and a live `announcement-banner.tsx` shown platform-wide. Nothing left to schedule. If calendar-integration or post-event-reflection threads are wanted, scope those as small additions referencing this system directly, not as a fresh "not started" item.

### FOR-Q2: Community Member Directory with Cultural Context
- **Priority**: Immediate
- **Status**: 🟢 DONE (July 25, 2026)
- **Description**: A directory of community members with spiritual interests, roles, and connection preferences. Genuinely new — the platform has Temple, Circle, Event, and Vendor directories, but no general member directory. Built as a filtered view of existing profile data plus one new opt-in flag, exactly as the original note suggested — not a parallel profile system.
- **What shipped**: a new `showInDirectory` boolean on `User` (default `false` — privacy-first, opt-in required) and a new `ConnectionRequest` model (migration `20260724153046_add_member_directory`). Four new routes on the existing `UsersController`: `GET /users/directory` (filterable by role/interest/search, self excluded), `GET /users/directory/connections`, `POST /users/directory/connect/:userId`, `PATCH /users/directory/connections/:id`. A toggle in Settings → Privacy ("Show me in the Community Directory") reuses the existing profile-update endpoint — no new settings-storage mechanism. A new `/directory` page (`member-directory-view.tsx`) with Browse and My Connections tabs, linked from the main Client nav.
- **Acceptance Criteria**:
  - [x] Opt-in member profiles (privacy-first) — `showInDirectory` defaults `false`; verified a fresh user is invisible in the directory until they explicitly opt in
  - [x] Role indicators: Seeker, Practitioner, Elder, Vendor, Babalawo — reuses the existing `role` field, filterable in Browse
  - [x] Connection request feature — full send/accept/decline loop, with guards against self-connection and duplicate requests (verified both)
  - [x] Cultural interest tags — reuses the existing `interests` field already on `User`, no new field needed
  - [ ] Language preferences — reused the existing single-value `dialectPreference` field rather than adding a new multi-language array; revisit if a real multi-language need shows up, but didn't want to invent a field speculatively
- **Verified live end-to-end, twice**: (1) API — two real users, confirmed directory empty pre-opt-in, opted both in, confirmed both appeared with correct interests, sent/accepted a connection request, confirmed duplicate and self-connection requests are correctly rejected. (2) Real browser — confirmed the Browse tab, the "My Connections" tab (with a live pending-count badge), and the Settings toggle all render and function correctly, including a bug found and fixed during this pass (a user initially saw themselves in their own directory list with a "Connect" button that would have failed — fixed by excluding the viewer's own id server-side). Screenshots taken. All test data deleted afterward.
- **Dependencies**: User Profiles (exist)
- **Notes**: Kept to a filtered view of existing profile data plus one new flag and one new connection model, per the original note. **Monetization candidate deferred, not resolved**: advanced directory search/filtering as a `Devoted`-tier perk is still worth flagging to Product — this pass shipped the free/basic version only.

### FOR-Q3: "Ask an Elder" — Formalize What Already Exists Informally
- **Priority**: Immediate
- **Status**: 🟢 DONE (July 25, 2026)
- **Description**: "Ask a Babalawo" already appears in user-facing copy (`HelpPage.tsx`, `MessagesPausedPage.tsx`) pointing at the Forum's `Seeker Questions — No Judgment` category. This item formalizes that pointer into an actual feature rather than inventing a parallel system. **Major discovery during implementation**: one full acceptance criterion — "public/private answer options" — was already completely built (`thread-view.tsx` already has an `isAnonymous` reply checkbox scoped specifically to `category.slug === 'seeker-questions'`, wired to a `ForumPost.isAnonymous` field the backend already supported). This wasn't a coincidence — it's clearly a partial prior attempt at this exact item that the backlog hadn't caught up to.
- **What shipped**:
  - **Elder opt-in**: new `answersElderQuestions` boolean on `User` (migration `20260725122235_add_answers_elder_questions`), self-service (a Babalawo's own choice, unlike the admin-assigned `isCommunityCarer` from FOR-017) via a new Settings → Privacy toggle, reusing the existing generic profile-update endpoint.
  - **Question categories**: added `spiritual`, `cultural`, `practical`, `historical` to the Forum's existing `SUGGESTED_TAGS` list (`create-thread-form.tsx`) — reused the tag-chip UI that already existed rather than building a second taxonomy, exactly as the acceptance criterion itself suggested ("or a new sub-tag on it").
  - **Response-time expectations**: new `GET /forum/elders-answering` endpoint (public) listing opted-in Babalawos, and a new `AskAnElderBanner` component shown only within the Seeker Questions category — static "aim to respond within a couple of days, not a guarantee" copy plus a live count of currently-opted-in elders as social proof.
  - **Public/private answer options**: already existed (see discovery above) — re-verified live, unchanged.
  - **Recognition for elders who answer**: extended the existing computed-badge system (`getUserBadges()` in `users.service.ts`, the same one FOR-Q2/FOR-015/etc. all reuse) with a new "Elder Voice" badge, awarded once a Babalawo has posted 3+ replies within the Seeker Questions category — no parallel badge system.
- **Acceptance Criteria**:
  - [x] Elders/Babalawos opt in to answer questions within the existing category — shipped, self-service toggle
  - [x] Question categories: Spiritual, Cultural, Practical, Historical — shipped as forum tags
  - [x] Response-time expectations shown (not an SLA) — shipped, explicitly phrased as "aim to," not a guarantee
  - [x] Public/private answer options — **already existed**, re-verified working after this pass's other changes
  - [x] Recognition for elders who answer — reuses `getUserBadges()`, verified live
- **Verified live end-to-end**: confirmed a Babalawo is invisible in `elders-answering` before opt-in and correctly listed after → posted a real question in Seeker Questions with the new `spiritual` tag → re-verified the pre-existing anonymous-reply checkbox still correctly sets `isAnonymous: true` after this session's other Forum-adjacent changes → posted 3 elder replies and confirmed the "Elder Voice" badge appeared with the correct count → confirmed the "Ask an Elder" banner renders correctly in a real browser, showing the response-time copy and live elder count, inside the actual Seeker Questions category view (screenshot taken). All test data deleted afterward; found and corrected one pre-existing category `threadCount` drift left over from this session's many rounds of raw-SQL test cleanup (cosmetic only, now fixed for this category).
- **Dependencies**: `Seeker Questions — No Judgment` category (exists), Elder Council (FOR-014), badge system (exists)
- **Notes**: Direct connection between seekers and wisdom. The scope here ended up smaller than the original 5 SP estimate because the hardest single piece (private/anonymous answers) turned out to already be built — the same "check before assuming" discipline used throughout this backlog's revision paid off again.

---

## Sprint Metrics

### Phase 0 — Do These First (Days, Not Sprints)
- ✅ FOR-027: Document an Interim Crisis Escalation Path — **done July 24, 2026**
- ✅ FOR-025: Unify Trust & Reputation System — **done July 24, 2026**, Shop's MSP-006 unblocked
- ✅ FOR-026: Consolidate Oral History Effort — **done July 24, 2026**; Shop's MSP-015/020/022 unblocked to build against the decided design (community submissions flow into the existing `OralHistoryEntry` admin queue, no new model)

### Phase 1 — Foundation (Months 1-2)
- FOR-001: Cultural Authenticity Safeguards *(mostly done — config task remains)*
- FOR-002: Crisis Escalation Protocol
- FOR-003: Spiritual Guidance Thread Management *(thread-type half only; booking half waits on Consultations relaunch)*

### Phase 2 — Dynamics (Months 3-4)
- FOR-004: Cultural Learning Pathways
- FOR-005: Cross-Cultural Practice Bridges *(confirm content-vs-engineering scope first)*
- FOR-006: Community Recognition & Achievement System *(small remaining scope)*

### Phase 3 — Enhancement (Months 5-6)
- FOR-007: Spiritual Calendar Integration *(forum-side surfacing only)*
- FOR-008: Language Preservation Tools
- FOR-009: Intergenerational Bridge Program *(matching system only)*

### Phase 4 — Innovation (Months 7+)
- FOR-010: Virtual Sacred Space Creation
- FOR-011: Blockchain-Based Oral History Preservation

---

## Sprint Metrics (Extended)

### Phase 1 — Community Soul (Months 1-2)
- FOR-013: Sacred Space & Ritual Participation *(buildable on existing Circles/Calendar)*
- FOR-014: Community Elders & Wisdom Keepers Council *(teaching/governance layer only)*
- FOR-015: Grief, Healing & Ancestral Support Space *(stand up the Circle first, near-zero cost)*

### Phase 2 — Protection & Wellbeing (Months 3-4)
- FOR-016: Spiritual Abuse & Harm Prevention *(remaining human-flag config)*
- FOR-017: Community Member Wellbeing — Opt-In Check-Ins
- FOR-018: Community Healing & Reconciliation Processes

### Phase 3 — Wisdom Transmission (Months 5-6)
- FOR-019: Oral Tradition & Storytelling Platform *(media richness on an existing base)*
- FOR-020: Embodied Knowledge & Practice Transmission
- FOR-021: Community Dream Sharing & Interpretation *(Circle-based)*

### Phase 4 — Advanced Ecosystem (Months 7+)
- FOR-023: Community Member Spiritual Journey Tracking *(mostly done — mentor-match connective tissue only)*
- FOR-024: Community-Generated Cultural Content Repository *(open the existing model to submissions)*

---

## Success Metrics — How We'll Know Something Worked

Priority and story points say what to build and roughly how much it costs; neither says whether it worked. Nothing below is a hard target — they're the concrete question each phase should be able to answer at its next review, so "Next Review: August 2" has something real to check against instead of a vibe.

- **FOR-001/FOR-016 (safeguards)**: Is the flagged-content review queue's median time-to-resolution getting shorter or longer as content volume grows? A growing backlog here means reviewer capacity, not policy, is the constraint (see the reviewer-capacity note above).
- **FOR-002/FOR-027 (crisis)**: Time from a crisis-flagged post to a human response. This is the one number that should be tracked from day one, before anything else in this document.
- **FOR-004/FOR-Q3 (learning & guidance)**: Are newcomers who go through the Cultural Onboarding Gate returning to post again within a week? A cultural-education feature that doesn't change return behavior isn't reaching anyone.
- **FOR-006/FOR-023 (recognition & milestones)**: Badge/milestone completion rate — are people actually reaching the milestones that already exist, or is the system invisible to them?
- **FOR-013/FOR-014/FOR-015 (ritual, elders, grief)**: Simplest honest metric — did the Circle get created and does it have members three months later? A feature nobody uses because nobody knew to create the space isn't a technology failure, it's a rollout failure.
- **FOR-019/FOR-024/FOR-026 (storytelling)**: Number of community-submitted (not elder-authored) entries in `OralHistoryEntry` after the submission path opens — this is the metric that tells you MSP-015/020/022 in Shop are pulling from a healthy, growing well rather than a static seed.

---

## Cultural Authenticity Assurance

All community features must:
- Respect Yoruba spiritual traditions and practices
- Maintain cultural integrity over engagement metrics
- Support authentic practitioners and community members
- Protect sacred knowledge from misappropriation
- Preserve the human-centered spiritual guidance model
- Ensure ethical discourse within cultural context

---

## Cultural Integrity Principles for All Community Features

Every feature in this backlog must:

1. **Respect Yoruba Spiritual Authority** – elders and practitioners are the guides, not algorithms or moderators alone
2. **Maintain Human-Centered Guidance** – technology serves community, not the other way around
3. **Prioritize Community Over Metrics** – engagement counts less than spiritual connection
4. **Preserve Sacred Knowledge** – knowledge is not to be extracted, but shared respectfully
5. **Support Authentic Practitioners** – empower genuine practitioners, not self-appointed experts
6. **Enable Generous Sharing** – knowledge is to be shared, not hoarded
7. **Honor Cyclical Time** – community rhythms (ceremonies, seasons) guide activity
8. **Build Intergenerational Connection** – elders and youth must be in dialogue
9. **Maintain Transparency in Spiritual Matters** – no hidden algorithms about spiritual guidance
10. **Support Community Wellbeing** – the community exists for the people, not the other way around

*(Principles 1 and 9 are why every AI-driven concept in the original draft of this backlog was removed in the July 24, 2026 revision, not just the two items explicitly named FOR-012 and FOR-022.)*

---

*"Ìgbàgbọ̀ náà jẹ́ ẹ̀yín, ẹ jẹ́ ọ̀kan"*
"Faith is your strength, make it one"

---

*"Awa ni ìlú, ìlú ni wa"*
*"We are the community, and the community is us."* 🕊️
