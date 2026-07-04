/**
 * Explicit response shapes for the auth endpoints (P2-01), kept separate from
 * `User` (the app's internal view-model type, defined where it's consumed —
 * see `shared/hooks/use-auth.ts`). The point of this separation: a backend
 * field rename or shape change shows up here, in one file, as a type error at
 * the mapping boundary — instead of silently reaching a component through an
 * untyped `response.data` cast.
 *
 * This describes the exact JSON returned by POST /auth/register, /auth/login,
 * and /auth/refresh today (see backend/src/auth/auth.service.ts). It is
 * deliberately narrower than `User` — only the fields the backend actually
 * sends at this boundary, not the richer shape `GET /users/:id` returns.
 */
export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  yorubaName?: string | null;
  culturalLevel?: string | null;
  hasOnboarded: boolean;
  adminSubRole?: string | null;
}

export interface AuthResponse {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
}
