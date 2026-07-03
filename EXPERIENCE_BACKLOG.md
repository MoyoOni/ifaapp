# EXPERIENCE_BACKLOG.md — OBSOLETE

**Status:** ✅ CONSOLIDATED into Z1_BACKLOG.md
**Date:** April 19, 2026
**Reason:** All experience features verified complete except EXP-007 (real video content).

**What was here:**
- EXP-001 through EXP-032: User experience enhancements
- Status: 31/32 items completed, 1 remaining (EXP-007)
- Platform user journeys fully functional

**Remaining Work:** Z1-301 — Real Cultural Onboarding Videos (15 SP)

**New Location:** See Z1_BACKLOG.md for remaining experience work.

---

*This document is now obsolete. All remaining work has been consolidated into Z1_BACKLOG.md with unique routing codes.*

---

# Experience Backlog — Ìlú Àṣẹ

**Goal:** Every person who signs up should feel, within their first 5 minutes, that this platform was built specifically for them. Every practitioner should feel equipped. Every seeker should feel guided. Every enhancement here compounds — better onboarding means more retained users, better Babalawo tools mean better sessions, better client features mean more return bookings.

**Total:** 3 Areas · 9 Sprints · ~220 Story Points
**Label format:** `EXP-XXX`
**Audience:** All roles — CLIENT, BABALAWO (and Ìyánifá), VENDOR (where noted)

---

## Strategic Philosophy

> *"Ẹni tó bá fẹ́ rìn jìnnà gbọdọ̀ bẹ̀rẹ̀ ìrìn àjò rẹ̀ ní ìmọ̀ ojú ọ̀nà."*
> — One who wishes to travel far must begin the journey knowing the road.

The onboarding is not a form. It is the first ceremony. Every step should feel like being welcomed into a sacred space — not processed through a SaaS funnel. The Babalawo experience is a professional tool. The client experience is a personal sanctuary. Both must earn trust on day one and deepen it every session.

---

## Current State — What Exists

### Onboarding
| Step | Status |
|------|--------|
| Registration (name, email, phone, password) | ✅ Built |
| Google OAuth sign-up | ✅ Built |
| Email verification (send link, confirm screen) | ✅ Built |
| Welcome slides (3 slides with audio narration) | ✅ Built |
| Babalawo role setup (verification info + slug picker) | ✅ Built |
| Vendor shop registration (business name, description, pledge) | ✅ Built |
| Heritage reconnection question (Yes/No) | ✅ Built |
| Cultural onboarding path (Glossary, Video, Course, Guide tabs) | ✅ Built |
| Discover Temples step (CLIENT only) | ✅ Built |
| Yoruba name + Location form | ✅ Built |
| Post-onboarding redirect to dashboard | ✅ Built |
| Referral code (URL param, not surfaced in UI) | 🟡 Backend only |
| Avatar / profile photo upload | ❌ Missing |
| "First steps" checklist post-onboarding | ❌ Missing |
| Video guide content | ❌ Placeholder |
| Interests saved to backend | ❌ Not wired |
| Progress saved mid-flow | ❌ Restarts from scratch |

### Babalawo
| Capability | Status |
|-----------|--------|
| Dashboard (stats) | ✅ Built |
| Discovery listing / profile | ✅ Built |
| Calendar & availability setting | ✅ Built |
| My Seekers (client list) | ✅ Built |
| Earnings report | ✅ Built |
| Course management (Academy) | ✅ Built |
| Temple connection | ✅ Built |
| Service offering view | ✅ Built |
| Invite client flow | ✅ Built |
| Consultation notes (per-client) | ❌ Missing |
| Guidance plan templates / reuse | ❌ Missing |
| Client relationship timeline | ❌ Missing |
| Availability rules (recurring, blackout, timezone) | ❌ Missing |
| Profile completeness score | ❌ Missing |
| Post-session follow-up prompts | ❌ Missing |
| Ratings & testimonials | ❌ Missing |

### Client
| Capability | Status |
|-----------|--------|
| Personal dashboard | ✅ Built |
| Consultation list / booking flow | ✅ Built |
| Temple browse | ✅ Built |
| Wallet | ✅ Built |
| Devoted subscription system | ✅ Built |
| Spiritual journey (deferred) | 🔵 Deferred |
| My Babalawo / saved practitioner | ❌ Missing |
| Session history with receipts | ❌ Missing |
| Guidance plan tracking UI | ❌ Missing |
| Leave a review after consultation | ❌ Missing |
| Rebooking shortcuts | ❌ Missing |
| Notification preferences | ❌ Missing |
| Referral programme (all clients) | ❌ Missing |

---

---

# AREA 1 — ONBOARDING ENHANCEMENTS

---

## 🔴 Sprint 1 — First Impressions (Critical) (38 SP)

### EXP-001 · Avatar Upload During Onboarding (8 SP) ✅ DONE

**The gap:** Users complete setup and land on their dashboard as a grey initial. No face. No presence. Their profile feels anonymous before they've written a single post.

**The fix:** Add an optional avatar upload step between the form and completion. One screen, one action.

**UX flow:**
```
[Final Steps form] → [Add Your Photo] → [Complete Setup]

"Add Your Photo" step:
- Large circle upload zone (tap/click)
- Camera icon, "Upload photo" label
- "Take photo" option on mobile (input[type=file capture=user])
- Skip option: "Continue without photo"
- Crop modal on select (square crop, 1:1)
```

**What it does:**
- Uploads avatar via existing `PATCH /users/:id` with `avatar` field
- If user skips, shows reminder dot on profile icon in sidebar for 7 days
- No compression needed client-side — backend resizes

**Acceptance criteria:**
- Avatar appears in sidebar, feed posts, and member cards immediately after onboarding
- Skip works; no avatar = initials fallback (existing)
- File size limit: 5MB. Accepted types: jpg, png, webp

---

### EXP-002 · First Steps Checklist Post-Onboarding (10 SP) ✅ DONE

**The gap:** After onboarding, users arrive at an empty dashboard. They don't know where to start. "What do I do now?" is the silent killer of early retention.

**The fix:** A persistent, dismissible "First Steps" card that appears on the dashboard for the first 14 days, guiding each role through their critical first actions.

**CLIENT checklist:**
- [ ] Complete your profile
- [ ] Browse Temples near you
- [ ] Book your first consultation
- [ ] Explore the Academy
- [ ] Join a Circle

**BABALAWO checklist:**
- [ ] Upload your verification documents
- [ ] Set your availability
- [ ] Create your first service offering
- [ ] Connect to a Temple
- [ ] Write your practice bio

**VENDOR checklist:**
- [ ] Complete your shop profile
- [ ] List your first product
- [ ] Set your delivery zones
- [ ] Read the Cultural Authenticity Guidelines

**Implementation:**
- Component: `frontend/src/shared/components/first-steps-checklist.tsx`
- State stored in `localStorage` keyed by userId (no backend needed)
- Each item checked off individually, persists across sessions
- "Dismiss" button: hides the card, shows a small "?" icon that reopens it
- Progress ring: "3/5 complete"

**Acceptance criteria:**
- Card visible on dashboard for all new users (< 14 days old OR checklist incomplete)
- Checking off an item marks it green, animates
- All 5 checked = "🎉 You're all set!" completion state, auto-dismisses after 3s
- Returning to dashboard after partial completion resumes state

---

### EXP-003 · Profile Completeness Score & Nudge System (8 SP) ✅ DONE

**The gap:** Incomplete Babalawo profiles (no bio, no credentials, no photo) rank lower in discovery. But there's no visible signal telling them this. Clients with incomplete profiles have worse matching. Nobody knows.

**The fix:** A completeness score that lives on the profile page and dashboard — visible to the user only, not public.

**Score calculation (Babalawo):**
| Field | Weight |
|-------|--------|
| Avatar | 15% |
| Yoruba name | 10% |
| Location | 10% |
| Bio / practice description | 20% |
| At least 1 service offering | 15% |
| Verification documents uploaded | 20% |
| At least 1 availability slot | 10% |

**Score calculation (CLIENT):**
| Field | Weight |
|-------|--------|
| Avatar | 20% |
| Yoruba name | 15% |
| Location | 15% |
| At least 1 consultation booked | 20% |
| Temple joined | 15% |
| Circle joined | 15% |

**UI:**
- Circular progress ring (0-100%) with colour: red < 40%, amber 40-70%, green > 70%
- On profile page: "Your profile is 65% complete — add your bio to appear in more searches"
- On Babalawo dashboard: "Complete your profile to unlock more bookings"
- Each incomplete item links directly to the relevant edit section
- Babalawo discovery sort: `completenessScore DESC` as tiebreaker (backend change)

**Files:**
- `frontend/src/shared/components/profile-completeness.tsx` (NEW)
- `backend/src/users/users.service.ts` — add `getCompletenessScore(userId)` helper

---

### EXP-004 · Referral Code Step in Registration (5 SP) ✅ DONE

**The gap:** Referral codes are read from `?ref=CODE` URL params, but someone sharing a link verbally (word of mouth, WhatsApp, etc.) can't enter the code manually. The referral panel exists for Devoted users — the code ingestion step at registration is invisible.

**The fix:** Show a "Have a referral code?" optional input on the registration form, below the phone field.

**UI:**
```
[Phone (optional)]
[Have a referral code? ▼]   ← collapsed by default, one click to expand
  [Referral Code ________]
```

**Logic:**
- Pre-populate from `?ref=CODE` URL param if present (same as existing)
- Manually entered code validated on submit via `GET /users/referral/validate/:code`
- Error: "Code not recognised — you can continue without one"
- On success: small green tick + "Welcome bonus applied"
- Passed to `register()` as `referredByCode` (already wired in backend)

**Acceptance criteria:**
- Field collapsed by default (not intimidating)
- Pre-filled if URL param present, field expanded automatically
- Invalid code shows error but does not block registration
- Referral credit applied as per existing referral logic

---

### EXP-005 · Intent Capture ("What Brings You Here") (7 SP) ✅ DONE

**The gap:** We don't know why people sign up. Some come for healing, some for cultural learning, some to find their ancestral religion, some to book a specific ceremony. Knowing this drives better content surfacing, better practitioner matching, and better product decisions.

**The fix:** A single screen in the welcome flow (after the 3 slides, before role-setup) that asks one honest question.

**Screen:**
```
"What brings you to Ìlú Àṣẹ?"
(Choose one — helps us personalise your experience)

[ ] I want to reconnect with my Yoruba roots
[ ] I'm seeking spiritual guidance or divination
[ ] I want to learn about Ifá and Isese
[ ] I'm a practitioner building my practice
[ ] I'm selling sacred items and supplies
[ ] I'm just exploring — I'm curious
```

**Logic:**
- Multi-select allowed (up to 2)
- Saved to user record: `intentTags: string[]`
- Used to personalise dashboard welcome message for first 30 days
- Used in admin analytics to understand acquisition intent
- "Skip" available — graceful, no punishment

**Backend:**
- Add `intentTags String[]` to User model (Prisma migration)
- `PATCH /users/:id/onboarding` accepts `intentTags`

**Acceptance criteria:**
- Shown to all roles before role-specific setup
- Selection persists to backend
- Dashboard shows context-aware welcome message based on intent for first 30 days

---

## 🟠 Sprint 2 — Deepening the Welcome (24 SP)

### EXP-006 · Timezone & Language Preference Step (5 SP) ✅ DONE

**The gap:** We don't know where users are from beyond a general location. Appointments show in UTC or "their time" without context. Platform communicates in English regardless of user's preferred language (Yorùbá, French, Portuguese).

**The fix:** A step in the onboarding flow (after location, before heritage question) that captures timezone and display language.

**UI:**
```
[Phone (optional)]
[Have a referral code? ▼]
 ↓ Continue
[Your Preferences]
  [Preferred Language ▼] — English | Yorùbá | Français | Português
  [Timezone ▼] — auto-detected from browser (Intl.DateTimeFormat().resolvedOptions().timeZone)
[Skip for now] [Continue →]
```

**Logic:**
- Timezone auto-detected but editable
- Saved: `timezone String` on User model
- Used in: appointments calendar, availability display, booking confirmation
- Language saved: `displayLanguage String` — used by existing `useLanguage` context

**Acceptance criteria:**
- Timezone shown in every appointment time display across the app
- Babalawo availability shown in seeker's local time on discovery cards
- Language selection persists and is applied immediately

---

### EXP-007 · Video Guide — Real Content (8 SP) 🟡 PARTIAL — UI built, video content placeholders only

**The gap:** The "Video Guide" tab in Cultural Onboarding Path shows a placeholder. A new diaspora member — possibly the first person in their family to engage with Ifá — sees an empty screen where a guide should be.

**The fix:** Three short embedded videos (YouTube or Cloudflare Stream) covering:
1. "What is Ifá?" — 3-minute explainer (cultural context, not promotional)
2. "Your First Divination — What to Expect" — 2 minutes
3. "How to Respect the Tradition" — 2 minutes

**Implementation:**
- Replace the placeholder Play icon with an embedded `<iframe>` or `<video>` per tab
- Videos hosted on YouTube (unlisted) initially — embed URL in config
- Tab labels updated: "Introduction" | "Your First Session" | "Respect & Protocol"
- Add a 4th tab: "Voices from the Community" — 2-3 short 30-second testimonials (future)

**Acceptance criteria:**
- Videos play without leaving the onboarding modal
- No autoplay (accessibility + respect)
- Captions available (YouTube auto-captions acceptable for v1)
- Works on mobile

---

### EXP-008 · Save Onboarding Progress Mid-Flow (5 SP) ✅ DONE

**The gap:** If a user closes their browser mid-onboarding (slow connection in Lagos, phone call, etc.), they restart from the beginning on next login. Frustrating, and loses data they already entered.

**The fix:** Persist onboarding progress to `localStorage` keyed by `userId`. On re-entry, resume from the last completed step.

**What gets saved:**
- Current step name
- Selected interests / intent tags
- Yoruba name draft
- Location draft
- Heritage answer
- Slug draft (babalawo)

**Restore logic:**
- On `OnboardingView` mount: check `localStorage.getItem('onboarding_progress_${userId}')`
- If present + step is not 'complete': show "Resume where you left off?" banner at top
- "Yes, resume" → jump to saved step
- "Start over" → clear saved state, begin from welcome slide 1

**Acceptance criteria:**
- Progress saved after every "Continue" click
- Cleared on successful `handleSubmit`
- Resume banner is graceful, not disruptive
- Works across browser restarts (localStorage, not sessionStorage)

---

### EXP-009 · Babalawo Credential Upload During Onboarding (6 SP) ✅ DONE

**The gap:** The Babalawo role-setup step says "you can upload credentials from your profile" — but finding that setting later is friction. Many practitioners never upload, causing verification delays.

**The fix:** Add an optional document upload card directly in the Babalawo role-setup step, after the "I understand" button.

**Screen:**
```
After "I understand →":
┌─────────────────────────────────────────────────────┐
│ 📎 Upload Credentials Now (Optional)                 │
│ Skip this and upload later from your profile.        │
│                                                      │
│ [ + Certificate of initiation ]                      │
│ [ + Temple reference letter   ]                      │
│ [ + Additional document       ]                      │
│                                                      │
│ [Upload & Continue →]  [Skip for now]                │
└─────────────────────────────────────────────────────┘
```

**Logic:**
- Uses existing `POST /users/documents` or equivalent upload endpoint
- Each document: file input, label dropdown (certificate / reference / other)
- Upload happens immediately (not deferred to submit)
- "Skip for now" works fine — no punishment
- Uploaded docs visible in admin verification queue immediately

**Acceptance criteria:**
- Babalawo can upload 1-3 documents during onboarding
- Uploaded docs appear in admin verification queue
- Skip works; user can upload from profile later
- File types: PDF, JPG, PNG. Max 10MB each.

---

## 🟡 Sprint 3 — Post-Onboarding Experience (18 SP)

### EXP-010 · Personalised Welcome Dashboard Message (5 SP) ✅ DONE

**The gap:** After onboarding, every user sees the same generic dashboard. There's no acknowledgement of who they are, what they said, or what they came for.

**The fix:** For the first 30 days, the dashboard header shows a personalised welcome message based on intent, role, and completeness.

**Examples:**
- CLIENT, intent "reconnect with roots": *"E kaabo, [Name]. Your journey of return begins here. Your first step: find a Temple near you."*
- CLIENT, intent "seeking guidance": *"Welcome, [Name]. When you're ready, your first consultation is waiting. Browse practitioners below."*
- BABALAWO, new, unverified: *"Welcome, [Name]. Your profile is awaiting verification. Upload your credentials to go live sooner."*
- BABALAWO, verified: *"Ẹ kaabọ̀, [Name]. Your practice is live. Set your availability so seekers can find you."*

**Implementation:**
- Component: `WelcomeBanner` in dashboard
- Hidden after 30 days OR after user clicks "Got it"
- Message selection: `getWelcomeMessage(role, intentTags, isVerified, daysSinceJoin)` utility

---

### EXP-011 · "Discover" Step Enhancement — Real Data (5 SP) ✅ DONE

**The gap:** The "Discover Temples" step shows "199 Ilé Ìjúbà" as a hardcoded number. The `OnboardingFlow` generic component (separate from `OnboardingView`) has interest-selection logic that isn't wired to the backend.

**The fix:**
- Replace hardcoded count with real `GET /temples?count=true` number
- Wire the interest selections in `OnboardingFlow` to `PATCH /users/:id` `interests` field
- Show 2-3 temple preview cards in the discover step (real data, filtered by location if available)

**Acceptance criteria:**
- Temple count is live and correct
- Interests saved to backend on selection
- 2-3 nearest temples shown (by location string match) or most popular if no location

---

### EXP-012 · Onboarding Completion Email (8 SP) ✅ DONE

**The gap:** After completing setup, users get no email confirmation. There's no "here's how to get started" welcome message in their inbox. First week retention email sequences don't exist.

**The fix:** Trigger a role-specific welcome email sequence upon `hasOnboarded = true`.

**Day 0 email (immediate):**
- Subject: "Ẹ kaabọ̀, [Name] — your sanctuary awaits"
- Body: brief welcome, platform highlights, 3 first steps for their role
- CTA: one big button to their dashboard

**Day 3 email (only if not yet booked/posted):**
- CLIENT: "Have you found your Babalawo yet?" — link to discovery
- BABALAWO: "Your first seeker is waiting — set your availability" — link to calendar
- VENDOR: "List your first product and go live" — link to product creation

**Day 7 email (only if no activity):**
- "The community is alive — here's what's happening" — 3 recent forum posts
- Cultural content: featured Odù wisdom of the week (admin-curated)

**Implementation:**
- Trigger from `users.service.ts` on `hasOnboarded` update
- Email templates: HTML emails using existing email infrastructure
- Unsubscribe link in footer (GDPR)

---

---

# AREA 2 — BABALAWO EXPERIENCE

---

## 🔴 Sprint 4 — Practice Tools (Critical) (42 SP)

### EXP-013 · Consultation Notes (Private, Per-Client) (12 SP) ✅ DONE

**The problem:** After every session, a Babalawo holds knowledge about their client — the Odù that came up, the client's situation, what was prescribed, how they responded. Right now, there is nowhere to put this. It lives in WhatsApp, paper notebooks, or memory. Over years, this becomes a professional liability.

**The feature:** A private, encrypted notes section per client — accessible only to the Babalawo.

**UX:**
```
My Seekers → [Client Name] → Notes tab

┌──────────────────────────────────────────────────────┐
│ 📓 Private Notes — [Client Name]                      │
│ Only you can see these.                               │
│                                                       │
│ [Mar 15, 2026] First session                         │
│ Odù: Ogbe Meji. Client experiencing career confusion. │
│ Prescribed: Ebo with ọpẹlẹ, 3-day fast.             │
│ Mood: nervous, but open. Good candidate for long-term │
│ guidance. Follow up in 2 weeks.                       │
│                                                       │
│ [Feb 20, 2026] Second session                         │
│ ...                                                   │
│                                                       │
│ [+ Add note for today]                               │
└──────────────────────────────────────────────────────┘
```

**Implementation:**
- New model: `ConsultationNote { id, babalawoId, clientId, content, appointmentId?, createdAt, updatedAt }`
- Backend: `POST /practitioners/notes`, `GET /practitioners/notes/:clientId`, `PATCH /practitioners/notes/:noteId`, `DELETE /practitioners/notes/:noteId`
- Frontend tab in the client detail view within My Seekers
- Rich text not required for v1 — plain textarea, newlines preserved
- Auto-save on blur (no save button) via debounced PATCH
- Notes are never visible to the client, admin, or anyone else (server-side enforced)

**Acceptance criteria:**
- Babalawo can write, read, edit, and delete notes per client
- Notes are private — no client-facing API route returns them
- Auto-save with "Saved" indicator
- Character limit: 10,000 per note entry
- Notes persist across sessions

---

### EXP-014 · Client Relationship Timeline (10 SP) ✅ DONE

**The problem:** Babalawo sees their client list, but clicking a client shows no history. There's no answer to: "When did we last speak? What did I prescribe? What Odù came up?" All of this exists in the database — it's just not surfaced.

**The feature:** A full relationship timeline per client inside My Seekers.

**UX:**
```
My Seekers → [Client Name]

Profile | Timeline | Notes | Prescriptions

Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 Mar 15, 2026 — Consultation (60 min, Video)
   "Career crossroads — Ogbe Meji"
   [View full details]

🟡 Mar 12, 2026 — Guidance plan issued
   "Ebo prescription — 3-day fast"
   [View prescription]

💚 Feb 20, 2026 — Consultation (45 min, Voice)
   First session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Implementation:**
- Endpoint: `GET /practitioners/clients/:clientId/timeline` — returns merged array of appointments + prescriptions + notes (summaries)
- Frontend: `client-timeline-view.tsx` within the My Seekers client detail
- No new models required — joins existing appointments, prescriptions, notes tables
- Each entry has a type badge (Consultation / Prescription / Note) and expandable detail

**Acceptance criteria:**
- Timeline loads in chronological order (newest first)
- Each consultation entry shows: date, duration, type (video/voice/in-person)
- Each prescription entry links to the full prescription view
- Note entries show first 100 chars of the note with "Read more"
- Empty state: "No sessions yet with [Name]"

---

### EXP-015 · Guidance Plan Templates (8 SP) ✅ DONE

**The problem:** Every prescription is written from scratch. Babalawo who commonly prescribe the same Ebo, the same Orisa offerings, the same practices — retype everything each time. This is slow and inconsistent.

**The feature:** Saved prescription templates that a Babalawo can start from.

**UX:**
```
Create Guidance Plan → 
  [Start from template ▼]
    ├── My templates (3)
    │   ├── Standard Ebo for Ogbe Meji
    │   ├── Orisa Oshun reconciliation
    │   └── New initiate orientation
    └── [+ Save current plan as template]
```

**Implementation:**
- New model: `PrescriptionTemplate { id, babalawoId, name, content, createdAt }`
- Backend: `POST /prescriptions/templates`, `GET /prescriptions/templates`, `DELETE /prescriptions/templates/:id`
- Frontend: dropdown in the prescription creation form header
- "Save as template" button at bottom of form — prompts for template name
- Templates are private to the Babalawo who created them

**Acceptance criteria:**
- Babalawo can save up to 20 templates
- Loading a template pre-fills the form (user can then edit before saving)
- Template list shows name + created date
- Delete confirmation before removing a template

---

### EXP-016 · Ratings & Testimonials System (12 SP) ✅ DONE

**The problem:** The most critical trust signal in any marketplace — social proof — is completely missing. A new seeker cannot tell a deeply experienced Babalawo from someone who just joined. Ratings solve this.

**The feature:** After each completed consultation, clients are invited to rate their Babalawo (1-5 stars + optional written testimonial). Ratings aggregate on the practitioner's discovery card and profile.

**Client flow:**
```
After consultation status = COMPLETED:
→ Notification: "How was your session with Baba Adewale? Share your experience."
→ Rating modal:
   ⭐⭐⭐⭐⭐
   [Optional: Write a testimonial...]
   Note: "Testimonials may be displayed publicly on the practitioner's profile."
   [Submit] [Skip]
```

**Babalawo profile:**
```
⭐ 4.8  (47 reviews)
"Baba Adewale brought clarity to a situation I had..."  — Anonymous Seeker
[See all testimonials →]
```

**Implementation:**
- New model: `Review { id, clientId, babalawoId, appointmentId, rating Int, testimonial String?, isAnonymous Boolean, createdAt }`
- Unique constraint: one review per appointment
- Backend: `POST /reviews`, `GET /reviews/babalawo/:id` (public), `PATCH /reviews/:id` (client edits within 48h)
- Aggregate score: `avgRating Float` computed on User model (updated on each new review)
- Discovery sort: `avgRating DESC` as secondary sort after `completenessScore`
- Anonymous by default — client can choose to show their Yoruba name

**Acceptance criteria:**
- Rating prompt appears 24h after consultation status = COMPLETED
- Rating blocked if: appointment still active, client already rated this appointment
- Stars 1-5, testimonial optional, max 500 chars
- Testimonials moderated: admin can hide offensive ones (flag system)
- Aggregate score visible on discovery card and profile
- Zero reviews: "No reviews yet" — does not show empty stars

---

## 🟠 Sprint 5 — Practice Depth (22 SP)

### EXP-017 · Advanced Availability Rules (8 SP) ✅ DONE

**The problem:** The current availability system likely supports basic time slots. But real practice is more nuanced: a Babalawo might not work on Osé (every 5th Ifá day), be unavailable during Ìsẹ̀ṣe ceremonies in July, or need their slots displayed in a client's timezone.

**The feature:** Recurring rules, blackout dates, and timezone-aware display.

**Availability rules UI:**
```
Set Availability → 

[Weekly Schedule]
Mon: 10am–1pm, 3pm–6pm
Tue: —
Wed: 10am–1pm
...

[Blackout Dates]
+ Add dates I won't be available
  e.g. Jul 18–25 (Ìsẹ̀ṣe week), Dec 24–Jan 2

[Timezone]
My timezone: Africa/Lagos (auto-detected)
Clients see times in their own timezone automatically.

[Advance booking window]
Bookings accepted: up to 60 days in advance
Minimum notice: 24 hours
```

**Implementation:**
- Extend `AvailabilityRule` model with `timezone`, `blackoutDates String[]`, `advanceBookingDays Int`, `minNoticehours Int`
- Booking calendar: converts all times to client's timezone for display
- Blackout dates: block those dates from appearing as available

---

### EXP-018 · Post-Session Follow-Up Prompt (5 SP) ✅ DONE

**The problem:** 24 hours after a session ends, the Babalawo has no built-in mechanism to check in on their client. This is culturally expected — a good Babaláwo follows up. The platform should remind them.

**The feature:** 24h after a completed appointment, Babalawo receives an in-app notification:

> "Your session with [Client Name] ended yesterday. Would you like to send them a follow-up message or update their guidance plan?"
> [Send Message] [Update Plan] [Dismiss]

**Implementation:**
- Triggered by appointment status change to COMPLETED (existing event)
- Scheduled notification: `appointmentsService.scheduleFollowUpReminder(appointmentId)` — 24h delay via Bull queue
- Notification opens: pre-composed message draft to client, or opens prescription form with client pre-selected
- One notification per appointment, non-repeating

---

### EXP-019 · Babalawo Practice Analytics (9 SP) ✅ DONE

**The problem:** Babalawo can see their earnings, but not their practice patterns. Which time slots get booked most? Are repeat clients growing? What's the busiest month? A practitioner growing their practice needs this to make decisions.

**The feature:** A simple analytics section on the Babalawo dashboard.

**Metrics shown:**
- Monthly sessions (bar chart, last 6 months)
- Average session rating over time
- Repeat client rate (% of clients who booked more than once)
- Most popular service offering
- Busiest day of week / time of day
- "Your practice in numbers": total sessions, total clients, avg rating, member since

**Implementation:**
- Backend: `GET /practitioners/analytics` — aggregates from appointments table
- Frontend: small chart components using `recharts` (already in project)
- Section added to Babalawo dashboard below earnings summary

---

---

# AREA 3 — CLIENT EXPERIENCE

---

## 🔴 Sprint 6 — Retention Foundations (Critical) (36 SP)

### EXP-020 · My Babalawo — Saved Practitioner (8 SP) ✅ DONE

**The problem:** The relationship with a Personal Awo is sacred and long-term. Once a client has found their practitioner, they want to return easily. But right now, rebooking means going back through the full discovery flow.

**The feature:** A "My Babalawo" panel on the client dashboard — a saved/preferred practitioner relationship.

**UI:**
```
Personal Dashboard → "My Babalawo"

┌────────────────────────────────────┐
│ 🌿 Your Personal Awo               │
│                                    │
│ [Avatar] Baba Adewale Ifáṣewun    │
│ ⭐ 4.8 · 47 sessions              │
│ Verified Practitioner              │
│                                    │
│ [Book Again →]  [Send Message →]  │
│ [View Profile]                     │
└────────────────────────────────────┘
```

If no Personal Awo set:
```
┌────────────────────────────────────┐
│ 🌿 Find Your Personal Awo          │
│ Your spiritual guide on this       │
│ platform. The relationship is      │
│ built over time.                   │
│ [Browse Practitioners →]           │
└────────────────────────────────────┘
```

**Logic:**
- "Personal Awo" set automatically after 3+ completed sessions with the same practitioner
- Client can also manually set/change from their profile settings
- Not "follow" — this is the sacred relationship noted in onboarding code comments

**Implementation:**
- Add `personalAwoId String?` to User model (foreign key to User)
- `GET /users/me` returns `personalAwo` with basic profile data
- `PATCH /users/:id` accepts `personalAwoId`
- Dashboard component: `personal-awo-panel.tsx`

---

### EXP-021 · Session History with Receipts (10 SP) ✅ DONE

**The problem:** A client who has had 20 sessions has no way to look back at their journey. They can't see what was discussed, what they paid, or recall which session was the turning point. There's no paper trail — everything disappears.

**The feature:** A full session history view with expandable detail and downloadable receipt per session.

**UX:**
```
My Consultations → [History tab]

Filter: All | Completed | Upcoming

Mar 15, 2026 · Baba Adewale Ifáṣewun
Video Consultation · 60 min
₦15,000 paid · Guidance plan issued
[View details] [Download receipt]

Feb 20, 2026 · Baba Adewale Ifáṣewun
Voice Consultation · 45 min
₦12,000 paid
[View details] [Download receipt]
```

**Detail view:**
- Date, time, duration, type
- Practitioner name + avatar (link to profile)
- Amount paid, payment method, transaction ID
- Guidance plan issued (link if yes)
- Client's own notes (if they added one — see EXP-023)

**Receipt:**
- PDF generated client-side (using `jsPDF` or equivalent)
- Contains: Ìlú Àṣẹ logo, date, practitioner, service, amount, transaction ref
- "For spiritual services — not a medical document" footer

---

### EXP-022 · Rebooking Shortcuts (6 SP) ✅ DONE

**The problem:** Returning clients — the most valuable user segment — must navigate back through discovery to rebook someone they've seen before. This is unnecessary friction that reduces repeat booking rates.

**The fix:** Three rebooking entry points:
1. **From history:** "Book Again with Baba Adewale" button on each past session
2. **From My Babalawo panel (EXP-020):** "Book Again →" button
3. **From notifications:** "Your last session was 4 weeks ago — time for a check-in?" weekly nudge for clients with no upcoming booking

**Implementation:**
- "Book Again" = `navigate('/booking/${babalawoId}')` with practitioner pre-selected
- Notification: scheduled weekly check — if no upcoming appointment AND last completed appointment > 3 weeks ago → push notification
- Existing `usePushNotifications` hook already handles delivery

---

### EXP-023 · Client Session Notes (Personal, Private) (12 SP) ✅ DONE

**The problem:** After a divination, a client has received sacred guidance. They may want to write down their own reflection — what they felt, what resonated, what they intend to do. Right now, they use a separate notebook or phone notes app.

**The feature:** A personal notes section per consultation — the client's own private reflection space.

**UX:**
```
My Consultations → [Session detail] → My Notes

┌────────────────────────────────────────────────────────┐
│ 📓 My Personal Notes — Mar 15 session                  │
│ These are private. Only you can see them.              │
│                                                        │
│ The Odù that came up was Ogbe Meji. Baba said...      │
│ I felt a sense of recognition when he mentioned...    │
│                                                        │
│ What I intend to do:                                   │
│ — Begin the prescribed Ebo by Friday                   │
│ — Speak to my father about the ancestral connection    │
│                                                        │
│ [Auto-saved]                                           │
└────────────────────────────────────────────────────────┘
```

**Implementation:**
- New model: `ClientSessionNote { id, appointmentId, clientId, title, content, createdAt, updatedAt }`
- Backend: `POST /client-session-notes/appointment/:appointmentId`, `GET /client-session-notes/appointment/:appointmentId`, `GET /client-session-notes`, `PUT /client-session-notes/:noteId`, `DELETE /client-session-notes/:noteId`
- Frontend component in session detail view with rich editing capabilities
- Notes are private to the client who wrote them - never visible to practitioners
- Auto-save with "Saved" indicator
- Character limit: 10,000 per note entry
- Notes persist across sessions

**Acceptance criteria:**
- Client can write, read, edit, and delete their own session notes
- Notes are private — no practitioner-facing API route returns them
- Auto-save with "Saved" indicator
- Character limit: 10,000 per note entry
- Notes persist across sessions
- Accessible from session history page

---

## 🟠 Sprint 7 — Guidance & Growth (24 SP)

### EXP-024 · Guidance Plan Tracking UI (10 SP) ✅ DONE

**The problem:** When a client receives a guidance plan (prescription), it shows as a list item. They can't tell: how far are they through it? Is it still active? What was each item for? It feels like a to-do list dropped in their lap.

**The feature:** A visual guidance plan tracking view.

**UX:**
```
My Journey → Active Guidance Plan

"Ebo Prescription — Ogbe Meji"
Issued by Baba Adewale · Mar 15, 2026 · 30 days

Progress: ████████░░ 6/8 items

┌─────────────────────────────────────────────────────┐
│ ✅ Day 1: Morning prayer with Opele                 │
│ ✅ Day 2: Fast (water only until noon)              │
│ ✅ Day 3: Offering to Oshun                        │
│ ⬜ Day 7: Return reading with Babalawo              │
│ ⬜ Day 14: Cold water bath                         │
│ ⬜ Day 21: Gratitude offering                      │
│ ⬜ Day 28: Completion ceremony                     │
│ ⬜ Day 30: Final check-in                         │
└─────────────────────────────────────────────────────┘

[Mark today's item complete] [Message my Babalawo]
```

**Implementation:**
- Parse prescription items from existing `Prescription.content` structure
- Client marks items complete: stored as `completedItems String[]` on Prescription record
- Progress ring / bar calculation: `completedItems.length / items.length`
- Overdue items highlighted in amber
- Completed plan: confetti + "Àṣẹ — you completed your guidance plan" celebration

---

### EXP-025 · Leave a Review (Client-Side) (8 SP) ✅ DONE

**Pairs with EXP-016 (Ratings & Testimonials).**

**The client UI for submitting a review:**
- Triggered by in-app notification 24h after session
- Rating screen: 5 stars (tap), optional text, anonymous toggle
- "Your words may help another seeker find the right guide" — cultural framing
- Post-submit: "Thank you — your testimonial has been shared" + guidance on what's next
- Option to edit within 48h of submission

**Implementation notes:**
- See EXP-016 for backend model and endpoints
- This story covers the client-facing submission flow only
- Review cannot be submitted if: appointment not COMPLETED, already submitted for this appointment

---

### EXP-026 · Notification Preferences (6 SP) ✅ DONE

**The problem:** Clients and Babalawo receive notifications but cannot control which ones they want. This leads to notification fatigue, which leads to turning them all off.

**The feature:** A notification preferences panel in Settings.

**Settings:**
```
Notification Preferences

Email Notifications:
[ON]  New booking confirmed
[ON]  Appointment reminder (24h before)
[OFF] Weekly community digest
[ON]  New guidance plan issued
[ON]  Message received
[OFF] Marketing & promotions

Push Notifications:
[ON]  Appointment reminder (1h before)
[ON]  New message
[ON]  Post-session follow-up prompt (Babalawo)
[OFF] Forum activity
[OFF] Circle updates
```

**Implementation:**
- New model: `NotificationPreferences { userId, emailBooking, emailReminder, emailDigest, emailPlan, emailMessages, emailMarketing, pushReminder, pushMessages, pushFollowup, pushForum, pushCircles }`
- `GET /users/me/notification-preferences`
- `PATCH /users/me/notification-preferences`
- SettingsPage new tab: "Notifications"
- All notification sends: check preferences before dispatching

---

## ✅ Sprint 8 — Community & Growth (20 SP) — COMPLETE

### EXP-027 · Referral Programme (All Clients) (10 SP) ✅ DONE

**The problem:** The referral system exists but is only surfaced for Devoted subscribers. Word-of-mouth is the primary growth channel for a cultural platform like this. Everyone should be able to refer.

**The feature:** A referral panel accessible from every client's profile/settings.

**UI:**
```
My Referrals

Your referral code: MOYOONI
Share link: https://iluase.com/signup?ref=MOYOONI

[Copy link] [Share via WhatsApp] [Share via Email]

Your rewards:
- 3 friends joined → ₦1,500 credit earned
- 1 active → ₦500 pending (they must complete first booking)

How it works:
• Friend signs up with your code
• They complete their first booking
• You both receive ₦500 wallet credit
```

**Implementation:**
- Referral panel already exists for Devoted (`referral-panel.tsx`) — generalise it
- Remove Devoted gate from the referral panel component
- Add to client settings page and quick-access panel
- Backend referral credit logic: already exists (EXP-004 wires into it)

---

### EXP-028 · "Continue Your Journey" — Smart Dashboard CTAs (5 SP) ✅ DONE

**The problem:** The client dashboard shows static cards. It doesn't adapt to where the user is in their journey. A new user and a 2-year member see the same screen.

**The feature:** Context-aware CTA cards that change based on user state.

**States → CTAs:**
| State | Primary CTA |
|-------|-------------|
| New user, never booked | "Book your first consultation" |
| Has booked once | "Book with Baba [Name] again" |
| Active guidance plan | "Check your guidance plan progress" |
| Guidance plan completed | "Well done — ready for a follow-up?" |
| No activity in 30+ days | "It's been a while — reconnect with your practice" |
| Upcoming appointment | "Your next session is in 2 days with Baba [Name]" |

**Implementation:**
- `useDashboardState()` hook — queries appointments + prescriptions + last login
- Returns a `state` enum used by dashboard to select CTA variant
- No new API calls — aggregates from existing query results

---

### EXP-029 · Spiritual Milestones & Badges (5 SP) ✅ DONE

**The gap:** There is no sense of progress or celebration in the client experience. Spiritual growth is a journey — it should feel like one.

**The feature:** Quiet, tasteful milestone badges that appear on the client's profile.

**Milestones:**
| Milestone | Badge |
|-----------|-------|
| First consultation completed | "First Step" 🌱 |
| 5 consultations completed | "Seeker" 🔮 |
| Joined a Temple | "Rooted" 🏛️ |
| Active guidance plan for 30 days | "Devoted" ⚡ |
| Joined a Circle | "Connected" 🤝 |
| 1 year on platform | "Elder in Training" 🌳 |
| Left 3+ reviews | "Voice of the Community" 📣 |

**Implementation:**
- `badges String[]` field on User (computed, not stored — derived from other data on profile load)
- Badge display: small icon strip on profile page, below name
- No notifications — badges appear silently, user discovers them on their own
- Hover tooltip shows milestone name and date achieved

---

## 🟡 Sprint 9 — Polish & Edge Cases (16 SP)

### EXP-030 · Onboarding A/B Test Infrastructure (5 SP) ✅ DONE

**The problem:** We've added many onboarding steps. We don't know which ones improve completion rate and which ones cause drop-off.

**The feature:** Basic funnel tracking on the onboarding flow.

**What's tracked:**
- Entered onboarding
- Completed each step (step name + timestamp)
- Abandoned at step (session ends without completion)
- Total time to complete

**Implementation:**
- `analytics.track('onboarding_step', { step, role, userId })` call at each `setOnboardingStep()`
- Backend: `POST /analytics/events` (lightweight, no external service needed for v1)
- Admin analytics dashboard: "Onboarding funnel" chart showing drop-off per step

---

### EXP-031 · Password Strength Indicator (3 SP) ✅ DONE

**The gap:** The registration form has password validation (min 8 chars) but no visual feedback during typing. Users type a weak password and only discover it's insufficient on submit.

**The fix:** Real-time strength indicator below the password field.

```
[••••••••••]  
████████░░  Strong  ✓ Has uppercase  ✓ Has number  ✗ Has symbol
```

**Implementation:**
- Client-side only: `zxcvbn` library or manual checks (no install needed — 4 checks)
- Checks: length ≥ 8, has uppercase, has number, has special char
- Colour: red (1-2 checks), amber (3), green (4)

---

### EXP-032 · Google Sign-In Post-OAuth Onboarding (8 SP) ✅ DONE

**The problem:** Users who sign up with Google skip the registration form entirely and land in onboarding. But their name and email are already known — the onboarding flow still asks for it redundantly. Also, Google OAuth users have no password, so "change password" in settings should prompt to set one.

**The fix:**
- Google OAuth registration: pre-populate name from Google profile, skip the name/email fields in form step
- Avatar: use Google profile picture as default if no custom avatar set
- Settings → Security: "You signed up with Google. [Set a password →]" for passwordless accounts
- Set password flow: `POST /auth/set-password` (no current password required for OAuth-only accounts)

**Acceptance criteria:**
- Google user's name pre-filled in onboarding form
- Google user's avatar used as default (no upload required unless they want to change)
- "Set password" flow available in settings for Google-only accounts

---

## Summary by Area

### Area 1 — Onboarding (Sprints 1-3)
| Story | Title | SP | Status |
|-------|-------|-----|--------|
| EXP-001 | Avatar Upload During Onboarding | 8 | ✅ DONE |
| EXP-002 | First Steps Checklist | 10 | ✅ DONE |
| EXP-003 | Profile Completeness Score | 8 | ✅ DONE |
| EXP-004 | Referral Code Step in Registration | 5 | ✅ DONE |
| EXP-005 | Intent Capture | 7 | ✅ DONE |
| EXP-006 | Timezone & Language Preference | 5 | ✅ DONE |
| EXP-007 | Video Guide — Real Content | 8 | 🟡 PARTIAL — UI built, no real videos yet |
| EXP-008 | Save Onboarding Progress | 5 | ✅ DONE |
| EXP-009 | Babalawo Credential Upload | 6 | ✅ DONE |
| EXP-010 | Personalised Welcome Message | 5 | ✅ DONE |
| EXP-011 | Discover Step Real Data | 5 | ✅ DONE |
| EXP-012 | Onboarding Completion Email Sequence | 8 | ✅ DONE |
| **Subtotal** | | **80 SP** | |

### Area 2 — Babalawo Experience (Sprints 4-5)
| Story | Title | SP | Status |
|-------|-------|-----|--------|
| EXP-013 | Consultation Notes (Private) | 12 | ✅ DONE |
| EXP-014 | Client Relationship Timeline | 10 | ✅ DONE |
| EXP-015 | Guidance Plan Templates | 8 | ✅ DONE |
| EXP-016 | Ratings & Testimonials System | 12 | ✅ DONE |
| EXP-017 | Advanced Availability Rules | 8 | ✅ DONE |
| EXP-018 | Post-Session Follow-Up Prompt | 5 | ✅ DONE |
| EXP-019 | Babalawo Practice Analytics | 9 | ✅ DONE |
| **Subtotal** | | **64 SP** | |

### Area 3 — Client Experience (Sprints 6-8)
| Story | Title | SP | Status |
|-------|-------|-----|--------|
| EXP-020 | My Babalawo — Saved Practitioner | 8 | ✅ DONE |
| EXP-021 | Session History with Receipts | 10 | ✅ DONE |
| EXP-022 | Rebooking Shortcuts | 6 | ✅ DONE |
| EXP-023 | Client Session Notes | 12 | ✅ DONE |
| EXP-024 | Guidance Plan Tracking UI | 10 | ✅ DONE |
| EXP-025 | Leave a Review (Client-Side) | 8 | ✅ DONE |
| EXP-026 | Notification Preferences | 6 | ✅ DONE |
| EXP-027 | Referral Programme (All Clients) | 10 | ✅ DONE |
| EXP-028 | Smart Dashboard CTAs | 5 | ✅ DONE |
| EXP-029 | Spiritual Milestones & Badges | 5 | ✅ DONE |
| **Subtotal** | | **80 SP** | |

### Sprint 9 — Polish
| Story | Title | SP | Status |
|-------|-------|-----|--------|
| EXP-030 | Onboarding A/B Test Infrastructure | 5 | ✅ DONE |
| EXP-031 | Password Strength Indicator | 3 | |
| EXP-032 | Google OAuth Post-Onboarding Polish | 8 | |
| **Subtotal** | | **16 SP** | |

---

**Grand Total: 240 Story Points across 9 Sprints**

---

## Recommended Build Order

**Start here (highest ROI, most self-contained):**
1. EXP-001 — Avatar upload (15 min, every user, visible immediately)
2. EXP-016 + EXP-025 — Ratings & Reviews (drives discovery quality + trust)
3. EXP-002 — First Steps Checklist (reduces "what do I do?" confusion)
4. EXP-013 — Consultation Notes (every Babalawo needs this on day one of real use)
5. EXP-020 — My Babalawo (retention foundation for returning clients)

**Then depth:**
6. EXP-021 — Session History + Receipts
7. EXP-014 — Client Relationship Timeline (Babalawo)
8. EXP-024 — Guidance Plan Tracking (Client)
9. EXP-022 — Rebooking Shortcuts

**Then growth:**
10. EXP-027 — Referral Programme
11. EXP-005 + EXP-012 — Intent Capture + Email Sequence
12. EXP-028 + EXP-029 — Smart CTAs + Milestones
