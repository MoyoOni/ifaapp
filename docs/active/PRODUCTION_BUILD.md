# Production Build Checklist (PB-016.6)

This document summarizes production build optimizations and security for the Ilé Àṣẹ platform.

## Frontend

### Console statements
- **Done:** All app code uses `frontend/src/shared/utils/logger.ts`. In production (`NODE_ENV=production`), only `logger.warn` and `logger.error` are emitted; `log`/`debug`/`info` are no-ops. No raw `console.*` in application code.

### Source maps
- **Done:** Production build has `sourcemap: false` in `frontend/vite.config.ts`. No source maps are emitted (smaller assets, no source exposure).

### Environment variables
- Injected at **build time** via Vite. Use `VITE_*` prefix (e.g. `VITE_API_URL`, `VITE_ENABLE_DEMO_MODE`). See `frontend/.env.example`. For production, set these in CI/hosting (e.g. Vercel, Netlify) or in a `.env.production` file at build.

### Bundle size
- **Done:** `vite.config.ts` uses `manualChunks` to split react, query, ui, motion, icons, socket, utils. `chunkSizeWarningLimit: 750`; `reportCompressedSize: true` shows gzip sizes in build output.
- **Bundle analysis:** Run `npm run build:analyze` in `frontend/` to generate `frontend/dist/stats.html` (opens in browser for treemap/sunburst). Requires `rollup-plugin-visualizer` (devDependency).

### Security headers (frontend SPA)
- CSP and HSTS for the **static frontend** must be set by the **host** that serves the app (e.g. Nginx, Vercel, Cloudflare). Example for Nginx:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `Content-Security-Policy:` (tune for your APIs and assets; allow `'self'`, API origin, etc.)
- The backend API does **not** serve the SPA; it only serves JSON. So API security headers are configured in the backend (see below).

## Backend

### Security headers
- **Done:** `backend/src/main.ts` uses `helmet()` with:
  - `contentSecurityPolicy: false` (API does not serve HTML)
  - `hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }`
- CORS is configured via `enableCors({ origin: FRONTEND_URL, credentials: true })`.

### Environment variables
- Validated at startup via `backend/src/config/env.validation.ts`. See `backend/.env.example` and root README “Backend environment variables”.

## Quick reference

| Item              | Location / Command |
|-------------------|--------------------|
| No console in prod | `frontend/src/shared/utils/logger.ts` |
| No source maps    | `frontend/vite.config.ts` → `build.sourcemap: false` |
| Env at build time | `VITE_*` in frontend; backend validated in `config/env.validation.ts` |
| Bundle analysis  | `cd frontend && npm run build:analyze` → open `dist/stats.html` |
| Backend security  | `backend/src/main.ts` → helmet (HSTS, etc.) |
