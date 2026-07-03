# E2E Tests (PB-201.3 / HC-201.3)

Playwright E2E tests for critical user flows. No backend required—specs mock APIs.

## Run locally

```bash
cd frontend
npm run e2e          # all projects (chromium + mobile)
npm run e2e:ui      # interactive UI
npx playwright test --project=chromium   # desktop only (faster)
```

The dev server (Vite on 5173) is started automatically.

## Scenarios

- **Home:** load, navigation
- **Auth (1, 2, 3):** sign up, login, logout (2–3 skipped until mocks align with backend)
- **Booking (4–8):** temples, babalawo, book, cancel, reschedule
- **Payment (9–12):** wallet, add funds, withdraw, history
- **Marketplace (13–15):** browse, cart, checkout
- **Guidance (16–18):** create, approve, reject
- **Messaging (19–20):** send, reply
- **Core flow:** booking flow, guidance page, basic nav

Target: 20+ scenarios passing. Current: **25 passed** (auth Scenario 2–3 use pre-authenticated session: set localStorage then visit dashboard / clear then redirect to login).

**Backlog (auth form flow):**
- Run E2E with backend on port 3000 so `/api/*` is real; then add tests that submit the login form and assert redirect to dashboard.
- Debug request interception (log requests in test) to confirm login POST is fulfilled by mock and not proxied; fix if needed and re-enable full login-form Scenario 2/3.

## CI

`.github/workflows/frontend-e2e.yml` runs on push/PR when `frontend/` or `common/` change. Artifacts (screenshots, report) are uploaded on failure.
