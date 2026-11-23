# Ìlú Àṣẹ - Digital Nexus for Isese/Ifá

**🎉 PRODUCTION READY!** A trusted digital platform connecting seekers with verified practitioners of Isese/Ifá spirituality in Nigeria and the diaspora.

## Platform Status ✅ LIVE

- ✅ **Complete Navigation System Overhaul** - Zero duplicates, all links functional
- ✅ **Mobile/Desktop Consistency** - Unified experience across all devices
- ✅ **Human-Centric Design** - No AI/magical interactions, pure human-to-human connections
- ✅ **Role-Based Navigation** - Distinct experiences for Babalawo, Client, Vendor, and Admin
- ✅ **All Critical Features Complete** - Ready for production deployment

## Architecture

Monorepo structure with strict domain separation:

- `/frontend/` - React 19 + TypeScript + Vite + Tailwind (mobile-first PWA), plus the Capacitor iOS/Android app shells (`frontend/ios`, `frontend/android`)
- `/backend/` - NestJS (Node.js/TypeScript), PostgreSQL (Prisma), Redis, Socket.IO
- `/common/` - Shared Zod schemas, enums, DTOs
- `/scripts/` - Docker, CI/CD, seeding, compliance checks
- `/docs/` - ADRs, architecture decisions

## Development

### Backend environment variables

The backend validates required environment variables at startup and will fail fast with clear errors if they are missing or invalid. Copy and configure:

```bash
cp backend/.env.example backend/.env
```

**Required:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/ilease`) |
| `JWT_SECRET` | At least 32 characters; use a secure random string in production |

**Optional (with defaults):** `PORT` (3000; set 8080 for local dev so the Vite proxy reaches it), `NODE_ENV` (development), `FRONTEND_URL` (http://localhost:5173), `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `JWT_REFRESH_SECRET`. For messaging encryption set `ENCRYPTION_KEY` (exactly 32 characters). See `backend/.env.example` for payment, email, S3, and other optional services. For production build checklist (source maps, bundle analysis, security headers), see [docs/active/PRODUCTION_BUILD.md](docs/active/PRODUCTION_BUILD.md).

```bash
# Install dependencies for all workspaces
npm install

# Run frontend and backend concurrently
npm run dev

# Run individually (recommended - prevents port conflicts)
npm run dev:frontend   # Starts on http://localhost:5173 and proxies /api to http://localhost:8080
npm run dev:backend    # Starts on http://localhost:8080/api — set PORT=8080 in backend/.env
                       # (the backend's built-in default is 3000, which the proxy won't reach)

# Or use PowerShell scripts (auto-handles port conflicts)
.\scripts\start-backend.ps1   # Automatically kills old processes on port 3000
.\scripts\start-frontend.ps1  # Starts frontend dev server

# Build all workspaces
npm run build

# Run tests
npm run test

# Browser (Playwright) tests — starts the frontend dev server on 5173 if one isn't running
npm run test:e2e

# Backend lint, check only (no --fix). Informational: lint is not a gate yet,
# there are ~2,100 existing problems. Type-check with `npx tsc --noEmit` instead.
npm run lint:check -w backend
```

### Mobile app

The iOS and Android apps are Capacitor 8 shells around the frontend build (app ID `com.iluase.app`).
They need Node 22 (`frontend/.nvmrc`), Xcode for iOS and Android Studio for Android. Build, sync and
run steps live in [CLAUDE.md](CLAUDE.md)'s Mobile section.

## Quick Access (Dev/Demo Mode)

For development and demo purposes, use Quick Access buttons in the login form:

- **Admin:** `admin@ilease.ng`
- **Babalawo:** `babalawo@ilease.ng`  
- **Client:** `client@ilease.ng`

See [ILUASE_V1_BACKLOG.md](ILUASE_V1_BACKLOG.md) for the current single source of truth on what's fixed/open — the `FIXES.md` this line used to point to doesn't exist.

## Cultural Integrity

- All spiritual guidance is human-mediated only - no AI divination
- Yoruba diacritics preserved (Àṣẹ, Babaláwo)
- Culturally respectful terminology (acknowledge/honor, not like/follow)

## Compliance

- NDPA 2023 aligned (explicit consent, data minimization)
- WAT timezone default
- End-to-end encryption for sensitive communications

## License

Private - All rights reserved
