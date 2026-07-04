import { UserRole, AdminSubRole } from '@common';
import type { User } from '@/types/user';
import type { AuthUserResponse } from '@/types/api/auth';
import type { DemoUser } from '@/demo';

/**
 * Maps the raw `user` object returned by POST /auth/register|login|refresh
 * into the app's `User` view model (P2-01). This is the one place that needs
 * to change if that response shape ever changes — every call site downstream
 * works with `User`, not raw JSON.
 */
export function mapAuthUserToUser(dto: AuthUserResponse): User {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    role: dto.role as UserRole,
    verified: dto.verified,
    hasOnboarded: dto.hasOnboarded,
    yorubaName: dto.yorubaName ?? undefined,
    culturalLevel: dto.culturalLevel ?? undefined,
    adminSubRole: (dto.adminSubRole as AdminSubRole) ?? undefined,
  };
}

/**
 * Maps demo/quick-access data (`DemoUser`, from the demo fixture ecosystem)
 * into the same `User` view model devLogin() fabricates a session with.
 * `DemoUser` is missing several fields `User` requires (`hasOnboarded`
 * doesn't exist on it at all; `email`/`verified` are optional there but
 * required here) — this mapper is the single place those gaps get filled
 * in explicitly, replacing the blind `as any` casts this used to require.
 * Because the two interfaces don't structurally match, TypeScript cannot
 * silently accept a `DemoUser` wherever a `User` is expected without going
 * through here.
 */
export function mapDemoUserToUser(demo: DemoUser, overrides: Partial<User> = {}): User {
  return {
    id: demo.id,
    email: demo.email ?? `${demo.id}@demo.iluase.local`,
    name: demo.name,
    role: demo.role,
    verified: demo.verified ?? false,
    hasOnboarded: true, // Dev mode always bypasses onboarding.
    yorubaName: demo.yorubaName,
    avatar: demo.avatar,
    culturalLevel: demo.culturalLevel,
    createdAt: demo.createdAt,
    ...overrides,
  };
}
