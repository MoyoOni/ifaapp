import { UserRole, AdminSubRole } from '@common';

/**
 * The app's internal view-model for the current user (P2-01). Populated by
 * mapping either a real API response (`types/api/mappers/auth.mapper.ts`) or
 * demo/quick-access data — never by casting a raw response or `DemoUser`
 * directly, so a field this type expects that the source doesn't actually
 * have is a compile error at the mapping boundary, not a silent `undefined`
 * reaching a component.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  adminSubRole?: AdminSubRole;
  verified: boolean;
  yorubaName?: string;
  avatar?: string;
  hasOnboarded: boolean;
  culturalLevel?: string;
  isImpersonated?: boolean;
  impersonatorId?: string;
  passedCulturalOrientation?: boolean;
  intentTags?: string[];
  createdAt?: string;
}
