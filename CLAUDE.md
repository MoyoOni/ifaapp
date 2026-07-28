# AI Agent Development Guide - Ìlú Àṣẹ Platform

This document provides context for AI agents working on the Ìlú Àṣẹ platform. Read this before starting any development work.

**Project:** Ìlú Àṣẹ - Digital Sanctuary for Ifá Spiritual Community
**Production:** LIVE at https://iluase.com

---

## Required Reading Before Coding

**[ILUASE_V1_BACKLOG.md](ILUASE_V1_BACKLOG.md) is the single source of truth for what's left to build or fix.** Read it before picking up any task. It consolidates every open item from every other backlog doc in this repo (V8/ADMIN/VENDOR/SHOP/COMMUNITY/EXPERIENCE/Z1/ProBacklog-v1/V5/V9/HUMAN/MVP_PIVOT), each with its original story ID preserved so you can find the full detail in the source doc if you need it.

**All 13 of those source docs are superseded** — each has a banner at its own top saying so. They're still useful for the *detailed* per-story reasoning (file:line references, why a decision was made a certain way), but none of them should be used to decide what to work on next, and several of their own "✅ DONE"/completion headlines turned out to be wrong once someone actually checked the code. `ILUASE_V1_BACKLOG.md` explains its own confidence levels — read that doc's own intro before trusting any single line in isolation.

**Platform history, for context:** V1 (28 EPICs, feature development), V2 (production readiness, folded into V4), V4 (10 sprints, production launch), V5 (real-data wiring, 8 sprints), V8 (monetisation/Devoted tier), V9 (forum launch), and Z1 (final consolidated hardening sprints) are all effectively complete phases. Nothing about "what phase are we in" matters for day-to-day work anymore — `ILUASE_V1_BACKLOG.md` is phase-agnostic and organized by domain (money/security, structural debt, then feature area) instead.

**[SPIRITUAL_JOURNEY_EVALUATION.md](SPIRITUAL_JOURNEY_EVALUATION.md)** still holds the decision record on the deferred spiritual journey feature, referenced from the master backlog's MSP-021 entry.

---

## After Each Implementation

After completing any task:

1. **Update `ILUASE_V1_BACKLOG.md`** — move the item from wherever it sits into the ✅ "What's Actually Fully Done" section (don't delete it — keep a one-line note of what was wrong and what fixed it, the same way this doc's own items are annotated). If you found and fixed something not already tracked there, add it with a 🔵 "verified/fixed this session" tag.
2. **If the fix touched a source backlog doc's specific story** (e.g. a VND-XXX or FOR-XXX item), it's fine to also add a status note in that source doc for the detailed record — just make sure `ILUASE_V1_BACKLOG.md` reflects it too, since that's what the next session will actually read.
3. **Update this file's "Current Status" section below** if the change affects platform-wide facts (infrastructure, architecture conventions, what's paused).

---

## Current Status (Last Updated: July 28, 2026)

**Production is LIVE at https://iluase.com.**

**Whole-app UX/UI wiring audit — 🟢 VERIFIED FULLY DONE (July 28, 2026).** A prior session found ~30 wiring issues across CLIENT/BABALAWO/VENDOR/ADMIN (403s from calling role-gated endpoints, dead links to unregistered routes, dead buttons, duplicate routes/components, fake data) and planned a 5-phase fix. Every item was independently re-verified against the actual current code on July 28 and all 30 were already fixed. Nothing actionable remains here; don't re-run this audit without a specific new lead.

**Paused / Deprioritized Platform Dependencies — Single Source of Truth:**
- **Consultations & 1:1 Messaging** — paused platform-wide per `MVP_PIVOT_BACKLOG.md` (frontend-only, reversible; all 14 PIV-XXX stories verified done July 28, 2026). Blocks several items listed in `ILUASE_V1_BACKLOG.md` — see that doc's "📌 Paused Platform Features" section for the full current list rather than restating it here every time something new depends on it.
- **Spiritual Journey feature** — exists and is routed (`/client/spiritual-journey`), but is deprioritized for the current window, not actively paused. Confirm current priority with this feature's owner before scheduling dependent work.

**Demo/Quick-Access Mode is a permanent dev/QA feature, not legacy cruft** (formalized July 4, 2026). `devLogin()` in `use-auth.ts` (gated behind `dev_mode_role` in localStorage) is an intentional internal tool for demos and local QA. Every read of `dev_mode_role`/`VITE_DEMO_MODE`/`VITE_ENABLE_DEMO_MODE` across the frontend goes through `isDevModeActive()` (`shared/utils/dev-mode.ts`), which wraps the check in `import.meta.env.DEV` — statically `false` in a production build, so a stray `dev_mode_role` value in a real user's localStorage can never have any effect. `devLogin()` itself also refuses to run under `NODE_ENV=production`. When adding a new query/mutation that should be demo-mode-aware, follow this existing pattern rather than inventing a new gating mechanism.

**Infrastructure (still valid as of March 16, 2026 — verify before relying on specifics if it's been a while):**
- **Staging** — EC2 t3.small, Docker Compose, http://100.52.200.113:4040 (see `ILUASE_V1_BACKLOG.md`'s ⚪ Needs a Human section — this instance may currently be unreachable, unresolved as of the backlog's last update)
- **Production** — ECS Fargate (2×backend / 2×frontend), multi-AZ RDS Postgres 16, Redis 7 cluster, ALB, ACM wildcard cert, Route53 DNS
- **CloudFront CDN** — iluase.com + www.iluase.com → CloudFront, `/api/*` uncached, statics CachingOptimized
- **Uptime monitoring** — Route53 health checks + CloudWatch alarms, multi-region
- **Shareable profile URLs** — `slug` field on User, `GET /public/resolve/:slug` (no auth), `/:slug` route

---

## Key Technical Context

### Project Structure
```
ifa_app/
├── backend/           # NestJS backend
│   ├── src/
│   │   ├── appointments/    # Consultation booking (currently paused, see above)
│   │   ├── seeding/         # Demo data ecosystem
│   │   └── ...
│   └── prisma/        # Database schema and seeds
├── frontend/          # React/TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── demo/      # Demo ecosystem data
│   │   └── ...
│   ├── Dockerfile.staging     # For EC2 staging (proxies to backend)
│   └── Dockerfile.production  # For ECS production (static files only)
├── docker/
│   ├── nginx.staging.conf     # Nginx with backend proxy (EC2)
│   └── nginx.production.conf  # Nginx static-only (ECS — ALB handles routing)
└── docs/
    ├── active/    # Operational docs in current use
    └── archive/   # Historical session summaries and completed phase docs
```

### Demo Data Source of Truth
- **Location:** `backend/src/seeding/demo-ecosystem.ts`
- **Frontend:** `frontend/src/demo/demo-ecosystem.ts`
- All demo scenarios use this unified data.

### User Roles
- **Client:** Book consultations, receive guidance, purchase products
- **Babalawo:** Provide consultations, create guidance plans, manage availability
- **Vendor:** Sell sacred items, manage inventory, process orders
- **Admin:** Platform management, verification queue, disputes

---

## Engineering Principles

1. **No feature is "done" without tests.** Backend unit tests (Jest), frontend component tests where practical (Vitest + React Testing Library), and live/E2E verification for anything money- or security-adjacent — see `ILUASE_V1_BACKLOG.md`'s 🟠 Structural section for where test coverage still falls short of any stated target.
2. **Observability matters.** Structured logging + error tracking (Sentry, frontend and backend) on anything new.
3. **Demo mode must be explicit.** No silent fallbacks in production — production errors should surface, not get swallowed. Use the existing `isDevModeActive()` pattern (see Current Status above), don't invent a new one.
4. **Verify against real code, not doc claims.** This repo's backlog docs have repeatedly claimed things were "✅ DONE" when the backend endpoint didn't exist, or vice versa. Before relying on any status claim — including in `ILUASE_V1_BACKLOG.md` itself for anything marked 📄 rather than 🔵 — do a quick spot-check against the actual running code if the task depends on it being true.
5. **Don't fabricate data.** If a metric/feature can't be honestly computed from real data, say so in the UI ("not yet tracked") rather than inventing a plausible-looking number.
6. **Cultural authenticity matters** — use proper Yoruba names and terminology; this is a spiritual-community platform, not a generic marketplace/forum template.
