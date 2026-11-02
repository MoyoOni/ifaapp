/**
 * The one definition of a Devoted member (November 2, 2026). Every grant
 * (Paystack payment, renewal, admin grant, referral reward) sets both the
 * flag and subscriptionEnd, so a member is Devoted while the flag is set and
 * that date hasn't passed. Before this, most checks read only the flag --
 * which stayed DEVOTED forever after a failed auto-renewal -- while
 * GET /subscriptions/me also required an ACTIVE subscription row, so the
 * two disagreed.
 */
export const DEVOTED_FIELDS = { subscriptionStatus: true, subscriptionEnd: true } as const;

export interface DevotedFields {
  subscriptionStatus: string | null;
  subscriptionEnd: Date | null;
}

export function isDevoted(user: DevotedFields | null | undefined, now: Date = new Date()): boolean {
  return !!user && user.subscriptionStatus === 'DEVOTED' && !!user.subscriptionEnd && user.subscriptionEnd > now;
}

/** Prisma `where` for the same rule, for counts and audience queries. */
export function devotedWhere(now: Date = new Date()) {
  return { subscriptionStatus: 'DEVOTED', subscriptionEnd: { gt: now } };
}
