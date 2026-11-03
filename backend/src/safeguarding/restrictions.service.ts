import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * docs/safeguarding SAFE-05 (November 3, 2026): restrictions narrower than
 * suspending the whole account, each applied for a reason, by someone, with
 * an optional end date and (ideally) a case.
 */
export const RESTRICTION_TYPES = ['PAUSE_BOOKINGS', 'PAUSE_SELLING', 'HIDE_PROFILE', 'PAUSE_POSTING', 'NO_CONTACT'] as const;
export type RestrictionType = (typeof RESTRICTION_TYPES)[number];

/** Plain words for the case log. */
export const RESTRICTION_LABELS: Record<RestrictionType, string> = {
  PAUSE_BOOKINGS: 'Pause new bookings',
  PAUSE_SELLING: 'Pause selling',
  HIDE_PROFILE: 'Hide profile',
  PAUSE_POSTING: 'Pause posting',
  NO_CONTACT: 'No contact with the person protected',
};

const MESSAGES: Record<Exclude<RestrictionType, 'NO_CONTACT'>, string> = {
  PAUSE_BOOKINGS: 'This practitioner is not taking new bookings at the moment.',
  PAUSE_SELLING: 'This shop is not taking new orders at the moment.',
  HIDE_PROFILE: 'This profile is not available.',
  PAUSE_POSTING: 'Posting is paused on your account. Please contact hello@iluase.com if you think this is a mistake.',
};

@Injectable()
export class RestrictionsService {
  constructor(private prisma: PrismaService) {}

  private activeWhere(now = new Date()): Prisma.AccountRestrictionWhereInput {
    return { liftedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
  }

  async has(userId: string, type: Exclude<RestrictionType, 'NO_CONTACT'>): Promise<boolean> {
    return (await this.prisma.accountRestriction.count({ where: { userId, type, ...this.activeWhere() } })) > 0;
  }

  /** Throws a 403 with a member-friendly message if `userId` is under `type`. */
  async assertNot(userId: string, type: Exclude<RestrictionType, 'NO_CONTACT'>): Promise<void> {
    if (await this.has(userId, type)) throw new ForbiddenException(MESSAGES[type]);
  }

  /** Everyone currently under `type`, for leaving them out of listings. */
  async userIdsUnder(type: Exclude<RestrictionType, 'NO_CONTACT'>): Promise<string[]> {
    const rows = await this.prisma.accountRestriction.findMany({
      where: { type, ...this.activeWhere() },
      select: { userId: true },
    });
    return [...new Set(rows.map((r) => r.userId))];
  }

  /** A no-contact restriction applies both ways between the two people. */
  async noContactBetween(a: string, b: string): Promise<boolean> {
    if (!a || !b || a === b) return false;
    const n = await this.prisma.accountRestriction.count({
      where: {
        type: 'NO_CONTACT',
        ...this.activeWhere(),
        AND: [{ OR: [{ userId: a, protectedUserId: b }, { userId: b, protectedUserId: a }] }],
      },
    });
    return n > 0;
  }

  async assertContactAllowed(a: string, b: string): Promise<void> {
    if (await this.noContactBetween(a, b)) throw new ForbiddenException('This is not available.');
  }

  async listFor(userId: string) {
    return this.prisma.accountRestriction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async apply(data: {
    userId: string;
    type: RestrictionType;
    reason: string;
    createdById: string;
    protectedUserId?: string;
    caseId?: string;
    expiresAt?: Date;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    if (data.type === 'NO_CONTACT' && !data.protectedUserId) {
      throw new ForbiddenException('A no-contact restriction needs the member it protects');
    }
    return this.prisma.accountRestriction.create({ data: { ...data, protectedUserId: data.type === 'NO_CONTACT' ? data.protectedUserId : null } });
  }

  async lift(id: string, liftedById: string) {
    const r = await this.prisma.accountRestriction.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Restriction not found');
    if (r.liftedAt) return r;
    return this.prisma.accountRestriction.update({ where: { id }, data: { liftedAt: new Date(), liftedById } });
  }
}
