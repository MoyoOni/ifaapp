import { Prisma } from '@prisma/client';
import { AdminSubRole } from '@ile-ase/common';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Safeguarding rules shared by practitioner complaints, user reports and the
 * crisis queue (docs/safeguarding, SAFE-01/SAFE-03, November 3, 2026).
 */

/** Report reasons that are safeguarding concerns, not ordinary moderation. */
export const SAFEGUARDING_REASONS = [
  'SEXUAL_MISCONDUCT',
  'HARASSMENT',
  'CONFIDENTIALITY_BREACH',
  'CONTROLLING_BEHAVIOR',
  'FEAR_BASED_MANIPULATION',
  'FINANCIAL_EXPLOITATION',
] as const;

/** Always Priority 1 (Part B §13): flagged urgent whatever the wording. */
export const URGENT_REASONS = ['SEXUAL_MISCONDUCT'] as const;

export const isSafeguardingReason = (reason: string) => (SAFEGUARDING_REASONS as readonly string[]).includes(reason);
export const isUrgentReason = (reason: string) => (URGENT_REASONS as readonly string[]).includes(reason);

/** Only Safeguarding and Super admins may read or act on safeguarding reports (SAFE-03). */
export function canHandleSafeguarding(user: Pick<CurrentUserPayload, 'role'> & { adminSubRole?: string | null }): boolean {
  return user.role === 'ADMIN' && (user.adminSubRole === AdminSubRole.SUPER || user.adminSubRole === AdminSubRole.SAFEGUARDING);
}

/** The admins to notify about a new safeguarding report. */
export const safeguardingAdminsWhere: Prisma.UserWhereInput = {
  role: 'ADMIN',
  adminSubRole: { in: [AdminSubRole.SUPER, AdminSubRole.SAFEGUARDING] },
};
