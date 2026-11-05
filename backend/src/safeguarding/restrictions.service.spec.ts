import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RestrictionsService } from './restrictions.service';

// docs/safeguarding SAFE-05
describe('RestrictionsService', () => {
  const prisma = {
    accountRestriction: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn((a) => Promise.resolve({ id: 'r1', ...a.data })), update: jest.fn((a) => Promise.resolve({ id: a.where.id, ...a.data })) },
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1' }) },
  };
  const service = new RestrictionsService(prisma as never);
  beforeEach(() => jest.clearAllMocks());

  it('counts only restrictions that are neither lifted nor expired', async () => {
    prisma.accountRestriction.count.mockResolvedValue(1);
    await expect(service.has('u1', 'PAUSE_POSTING')).resolves.toBe(true);
    const where = prisma.accountRestriction.count.mock.calls[0][0].where;
    expect(where).toMatchObject({ userId: 'u1', type: 'PAUSE_POSTING', liftedAt: null });
    expect(where.OR).toEqual([{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }]);
  });

  it('refuses with a member-friendly message when restricted, and allows otherwise', async () => {
    prisma.accountRestriction.count.mockResolvedValue(1);
    await expect(service.assertNot('u1', 'PAUSE_BOOKINGS')).rejects.toThrow('not taking new bookings');
    prisma.accountRestriction.count.mockResolvedValue(0);
    await expect(service.assertNot('u1', 'PAUSE_BOOKINGS')).resolves.toBeUndefined();
  });

  it('lists each restricted person once', async () => {
    prisma.accountRestriction.findMany.mockResolvedValue([{ userId: 'a' }, { userId: 'a' }, { userId: 'b' }]);
    await expect(service.userIdsUnder('HIDE_PROFILE')).resolves.toEqual(['a', 'b']);
  });

  it('applies no-contact in both directions, and never to oneself', async () => {
    await expect(service.noContactBetween('a', 'a')).resolves.toBe(false);
    prisma.accountRestriction.count.mockResolvedValue(1);
    await expect(service.noContactBetween('b', 'a')).resolves.toBe(true);
    const where = prisma.accountRestriction.count.mock.calls.at(-1)[0].where;
    expect(where.AND[0].OR).toEqual([{ userId: 'b', protectedUserId: 'a' }, { userId: 'a', protectedUserId: 'b' }]);
    await expect(service.assertContactAllowed('b', 'a')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('needs the protected member for no-contact, and a real person to restrict', async () => {
    await expect(service.apply({ userId: 'u1', type: 'NO_CONTACT', reason: 'x', createdById: 'lead' })).rejects.toBeInstanceOf(ForbiddenException);
    const r = await service.apply({ userId: 'u1', type: 'PAUSE_SELLING', reason: 'while we look', createdById: 'lead', protectedUserId: 'ignored' });
    expect(r).toMatchObject({ type: 'PAUSE_SELLING', protectedUserId: null });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.apply({ userId: 'gone', type: 'PAUSE_SELLING', reason: 'x', createdById: 'lead' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lifts once, and lifting again changes nothing', async () => {
    prisma.accountRestriction.findUnique.mockResolvedValueOnce({ id: 'r1', liftedAt: null });
    await service.lift('r1', 'lead');
    expect(prisma.accountRestriction.update).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { liftedAt: expect.any(Date), liftedById: 'lead' } });
    prisma.accountRestriction.findUnique.mockResolvedValueOnce({ id: 'r1', liftedAt: new Date() });
    await service.lift('r1', 'lead');
    expect(prisma.accountRestriction.update).toHaveBeenCalledTimes(1);
    prisma.accountRestriction.findUnique.mockResolvedValueOnce(null);
    await expect(service.lift('nope', 'lead')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists a person’s restrictions newest first', async () => {
    prisma.accountRestriction.findMany.mockResolvedValue([]);
    await service.listFor('u1');
    expect(prisma.accountRestriction.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } });
  });
});
