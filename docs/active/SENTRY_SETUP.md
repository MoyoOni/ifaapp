# Sentry Setup Guide — superseded

**This file is superseded by [`SENTRY.md`](SENTRY.md).** It previously duplicated that doc with different, wrong file paths (`backend/src/common/filters/sentry-exception.filter.ts`, `backend/src/common/middleware/sentry.middleware.ts`, `frontend/src/lib/sentry.ts`, `frontend/src/components/common/ErrorBoundary.tsx` — none of which exist; the real files are `backend/src/sentry.ts`, `backend/src/common/filters/global-exception.filter.ts`, and `frontend/src/shared/config/sentry.ts`).

Use `SENTRY.md` for setup and usage instructions — its paths and endpoints (`/test-sentry`, `GET /api/test/sentry/error`) are verified against the actual code as of September 18, 2026. This file is kept only so the old link doesn't 404; don't add new content here.
