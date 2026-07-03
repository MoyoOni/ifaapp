# Backend tests

## Unit tests

```bash
npm test
```

## Integration tests (DB relationships)

```bash
npm run test:integration
```

Requires: `DATABASE_URL` and test DB. Uses `test/jest.integration.json`.

## E2E & API contract tests (HC-201.5)

```bash
npm run test:e2e
```

**Requires:**

- **Postgres** running (e.g. `localhost:5432`)
- **Env** (in `.env` or shell):
  - `DATABASE_URL` — e.g. `postgresql://user:pass@localhost:5432/ifa_dev`
  - `JWT_SECRET` — min 32 characters
  - Optional: `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` (32 chars). If missing, `test/e2e-setup.ts` sets a default `ENCRYPTION_KEY` for tests.

**Quick local Postgres (Docker):**

```bash
docker run -d --name ifa-postgres -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=ifa_e2e -p 5432:5432 postgres:15
```

Then in `backend`:

```bash
export DATABASE_URL=postgresql://test:test@localhost:5432/ifa_e2e
export JWT_SECRET=your-secret-at-least-32-characters-long
npx prisma migrate deploy
npm run test:e2e
```

**What runs:**

- `test/api-contracts.e2e-spec.ts` — API contract tests (health, events, auth, error shapes, Zod schemas)
- `test/consultation-booking.e2e-spec.ts` — consultation booking flow (if present)

CI runs the same via `.github/workflows/backend-e2e.yml` with a Postgres service container.
