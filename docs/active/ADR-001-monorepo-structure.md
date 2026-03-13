# ADR-001: Monorepo Structure

## Status
Accepted

## Context
The Ilé Àṣẹ platform requires multiple components: frontend (React), backend (NestJS), shared types/schemas, and infrastructure scripts. We need a clean separation of concerns while maintaining code sharing and consistency.

## Decision
Use a monorepo structure with npm workspaces, organized as:

```
/
├── frontend/     # React 18 + TypeScript + Vite
├── backend/      # NestJS + Prisma + PostgreSQL
├── common/       # Shared Zod schemas, enums, DTOs
├── scripts/      # Docker, CI/CD, seeding
└── docs/         # ADRs and documentation
```

## Consequences

### Positive
- Clear domain separation
- Shared types/schemas in `/common` prevent duplication
- Single repository simplifies development and deployment
- Type safety across frontend/backend via shared schemas

### Negative
- Requires understanding of workspace management
- Larger repository size

## Implementation
- Root `package.json` with workspaces configuration
- TypeScript path aliases configured for `@common/*` imports
- Shared color constants in `/common/src/styles/colors.ts`
