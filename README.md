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

- `/frontend/` - React 18 + TypeScript + Vite + Tailwind (mobile-first PWA)
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

**Optional (with defaults):** `PORT` (3000), `NODE_ENV` (development), `FRONTEND_URL` (http://localhost:5173), `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `JWT_REFRESH_SECRET`. For messaging encryption set `ENCRYPTION_KEY` (exactly 32 characters). See `backend/.env.example` for payment, email, S3, and other optional services. For production build checklist (source maps, bundle analysis, security headers), see [docs/PRODUCTION_BUILD.md](docs/PRODUCTION_BUILD.md).

```bash
# Install dependencies for all workspaces
npm install

# Run frontend and backend concurrently
npm run dev

# Run individually (recommended - prevents port conflicts)
npm run dev:frontend   # Starts on http://localhost:5173
npm run dev:backend    # Starts on http://localhost:3000/api

# Or use PowerShell scripts (auto-handles port conflicts)
.\scripts\start-backend.ps1   # Automatically kills old processes on port 3000
.\scripts\start-frontend.ps1  # Starts frontend dev server

# Build all workspaces
npm run build

# Run tests
npm run test
```

## Quick Access (Dev/Demo Mode)

For development and demo purposes, use Quick Access buttons in the login form:

- **Admin:** `admin@ilease.ng`
- **Babalawo:** `babalawo@ilease.ng`  
- **Client:** `client@ilease.ng`

See `FIXES.md` for all permanent fixes and verification checklist.

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
