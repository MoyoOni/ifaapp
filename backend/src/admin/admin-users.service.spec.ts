import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from './audit.service';

// P2-04: moved from admin.service.spec.ts along with the getAllUsers/
// getVerificationApplications logic itself, when AdminService was split.

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: PrismaService;

  const mockAdminUser = {
    id: 'admin-1',
    sub: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    verified: true,
  };

  const mockNonAdminUser = {
    id: 'user-1',
    sub: 'user-1',
    email: 'user@example.com',
    role: 'CLIENT',
    verified: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: NotificationService,
          useValue: { sendNotification: jest.fn(), createNotification: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            verificationApplication: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users for admin user', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'CLIENT',
          adminSubRole: null,
          verified: true,
          hasOnboarded: true,
          culturalLevel: 'OMO_ILE',
          createdAt: new Date('2026-01-01'),
          suspendedUntil: null,
          bannedAt: null,
          banReason: null,
          warnCount: 0,
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.getAllUsers(mockAdminUser);

      // ADM-003: isBanned/isSuspended are computed from bannedAt/suspendedUntil,
      // not selected columns -- not part of the Prisma mock's return value.
      expect(result).toEqual(mockUsers.map((u) => ({ ...u, isBanned: false, isSuspended: false })));
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          adminSubRole: true,
          verified: true,
          hasOnboarded: true,
          culturalLevel: true,
          createdAt: true,
          suspendedUntil: true,
          bannedAt: true,
          banReason: true,
          warnCount: true,
          isCommunityCarer: true,
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should filter users by role when provided', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAllUsers(mockAdminUser, { role: 'CLIENT' });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'CLIENT' },
        select: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });

    it('should filter users by verification status when provided', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAllUsers(mockAdminUser, { verified: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { verified: true },
        select: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      await expect(service.getAllUsers(mockNonAdminUser)).rejects.toThrow(
        'Only admins can view all users'
      );
    });
  });

  describe('getInactivePractitioners', () => {
    // Current implementation fetches all BABALAWOs with their most recent
    // appointment/session since the cutoff (bounded to 1 each via `take`),
    // then filters for "neither" in application code -- not a DB-level
    // where/OR filter. Assertions target that real shape.
    it('filters by role and applies the daysInactive cutoff via select', async () => {
      const findManySpy = jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);

      await service.getInactivePractitioners(mockAdminUser, 14);

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'BABALAWO' },
          select: expect.objectContaining({
            appointmentsAsBabalawo: expect.objectContaining({
              where: { date: { gte: expect.any(String) } },
            }),
            userSessions: expect.objectContaining({
              where: { lastSeenAt: { gte: expect.any(String) } },
            }),
          }),
        })
      );
    });

    it('uses a different cutoff for a different daysInactive value', async () => {
      const findManySpy = jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);

      await service.getInactivePractitioners(mockAdminUser, 14);
      const cutoff14 = (findManySpy.mock.calls[0][0] as any).select.userSessions.where.lastSeenAt
        .gte;

      await service.getInactivePractitioners(mockAdminUser, 30);
      const cutoff30 = (findManySpy.mock.calls[1][0] as any).select.userSessions.where.lastSeenAt
        .gte;

      // A 30-day window's cutoff is further in the past than a 14-day window's.
      expect(new Date(cutoff30).getTime()).toBeLessThan(new Date(cutoff14).getTime());
    });
  });

  describe('getVerificationApplications', () => {
    it('should return verification applications for admin user', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          userId: 'user-1',
          currentStage: 'APPLICATION',
          submittedAt: new Date(),
          user: {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'CLIENT',
          },
          history: [],
        },
      ];

      (prisma.verificationApplication.findMany as jest.Mock).mockResolvedValue(mockApplications);

      const result = await service.getVerificationApplications(mockAdminUser);

      expect(result).toEqual(mockApplications);
      expect(prisma.verificationApplication.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          history: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
        },
        orderBy: { submittedAt: 'desc' },
      });
    });

    it('should filter applications by stage when provided', async () => {
      (prisma.verificationApplication.findMany as jest.Mock).mockResolvedValue([]);

      await service.getVerificationApplications(mockAdminUser, 'APPLICATION' as any);

      expect(prisma.verificationApplication.findMany).toHaveBeenCalledWith({
        where: { currentStage: 'APPLICATION' },
        include: expect.any(Object),
        orderBy: { submittedAt: 'desc' },
      });
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      await expect(service.getVerificationApplications(mockNonAdminUser)).rejects.toThrow(
        'Only admins can review verification applications'
      );
    });
  });
});

// Code-health pass (November 6, 2026): the privileged actions -- admin
// management, moderation, role changes, verification -- had no tests at all.
describe('AdminUsersService privileged actions', () => {
  let service: AdminUsersService;
  const prisma = {
    user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
    userSession: { updateMany: jest.fn() },
    verificationApplication: { findUnique: jest.fn(), update: jest.fn() },
    vendor: { findUnique: jest.fn(), update: jest.fn() },
  };
  const audit = { logAction: jest.fn() };
  const notifications = { createNotification: jest.fn() };

  const superAdmin = { id: 'super-1', sub: 'super-1', email: 'super@example.com', role: 'ADMIN', adminSubRole: 'SUPER', verified: true } as any;
  const moderator = { ...superAdmin, id: 'mod-1', sub: 'mod-1', adminSubRole: 'MODERATOR' };
  const client = { id: 'client-1', sub: 'client-1', email: 'c@example.com', role: 'CLIENT', verified: true } as any;
  const member = { id: 'member-1', email: 'm@example.com', role: 'CLIENT', adminSubRole: null };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compile();
    service = module.get(AdminUsersService);
    prisma.user.update.mockImplementation(({ where, data }) => Promise.resolve({ id: where.id ?? 'x', ...data }));
  });

  describe('super-admin-only actions', () => {
    it.each([
      ['impersonateUser', (u: any) => service.impersonateUser(u, 'member-1', 'Investigating a support ticket')],
      ['createOrUpdateAdmin', (u: any) => service.createOrUpdateAdmin(u, { email: 'a@example.com', name: 'A', adminSubRole: 'SUPPORT' })],
      ['getAdminUsers', (u: any) => service.getAdminUsers(u)],
      ['removeAdminPrivileges', (u: any) => service.removeAdminPrivileges(u, 'other-admin')],
    ])('%s refuses a non-super admin and a non-admin', async (_name, call) => {
      await expect(call(moderator)).rejects.toThrow(ForbiddenException);
      await expect(call(client)).rejects.toThrow(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('impersonation needs a real reason and is audited', async () => {
      await expect(service.impersonateUser(superAdmin, 'member-1', 'because')).rejects.toThrow(BadRequestException);
      prisma.user.findUnique.mockResolvedValue(member);
      const res = await service.impersonateUser(superAdmin, 'member-1', 'Investigating a support ticket');
      expect(res.impersonationLogged).toBe(true);
      expect(audit.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'IMPERSONATE_USER', entityId: 'member-1', adminId: 'super-1' }));
    });

    it('createOrUpdateAdmin rejects an unknown sub-role and accepts SAFEGUARDING', async () => {
      await expect(service.createOrUpdateAdmin(superAdmin, { email: 'a@example.com', name: 'A', adminSubRole: 'OWNER' })).rejects.toThrow(BadRequestException);

      prisma.user.findUnique.mockResolvedValue({ ...member, email: 'a@example.com' });
      prisma.user.update.mockResolvedValue({ ...member, role: 'ADMIN', adminSubRole: 'SAFEGUARDING' });
      await service.createOrUpdateAdmin(superAdmin, { email: 'a@example.com', name: 'A', adminSubRole: 'SAFEGUARDING' });
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { role: 'ADMIN', adminSubRole: 'SAFEGUARDING' } }));
      expect(audit.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_USER_UPDATED' }));
    });

    it('removeAdminPrivileges refuses self-removal and non-admin targets, and demotes to CLIENT', async () => {
      await expect(service.removeAdminPrivileges(superAdmin, 'super-1')).rejects.toThrow(BadRequestException);
      prisma.user.findUnique.mockResolvedValue(member);
      await expect(service.removeAdminPrivileges(superAdmin, 'member-1')).rejects.toThrow('User is not an admin');

      prisma.user.findUnique.mockResolvedValue({ id: 'other-admin', role: 'ADMIN', adminSubRole: 'FINANCE' });
      await service.removeAdminPrivileges(superAdmin, 'other-admin');
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'other-admin' }, data: { role: 'CLIENT', adminSubRole: null } });
      expect(audit.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_PRIVILEGES_REMOVED', payload: expect.objectContaining({ previousAdminSubRole: 'FINANCE' }) }));
    });
  });

  describe('moderation: suspend, warn, ban, unban', () => {
    const calls = {
      suspendUser: (u: any, id: string) => service.suspendUser(u, id, { reason: 'Harassment', durationDays: 3 }),
      warnUser: (u: any, id: string) => service.warnUser(u, id, { message: 'Please keep it respectful' }),
      banUser: (u: any, id: string) => service.banUser(u, id, { reason: 'Repeated harassment' }),
    };

    it.each(Object.entries(calls))('%s: non-admins, missing users, self and other admins are refused', async (_name, call) => {
      await expect(call(client, 'member-1')).rejects.toThrow(ForbiddenException);
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(call(moderator, 'nobody')).rejects.toThrow(NotFoundException);
      prisma.user.findUnique.mockResolvedValue({ ...moderator, role: 'ADMIN' });
      await expect(call(moderator, 'mod-1')).rejects.toThrow(BadRequestException);
      prisma.user.findUnique.mockResolvedValue({ id: 'super-1', role: 'ADMIN' });
      await expect(call(moderator, 'super-1')).rejects.toThrow(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('suspends for the requested number of days, audits and tells the member', async () => {
      prisma.user.findUnique.mockResolvedValue(member);
      const before = Date.now();
      await service.suspendUser(moderator, 'member-1', { reason: 'Harassment', durationDays: 3 });
      const until: Date = prisma.user.update.mock.calls[0][0].data.suspendedUntil;
      expect(until.getTime() - before).toBeGreaterThanOrEqual(3 * 86_400_000);
      expect(until.getTime() - before).toBeLessThan(3 * 86_400_000 + 5000);
      expect(audit.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'SUSPEND_USER', reason: 'Harassment' }));
      expect(notifications.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'member-1', title: 'Account Suspended' }));
    });

    it('a warning increments the count', async () => {
      prisma.user.findUnique.mockResolvedValue(member);
      prisma.user.update.mockResolvedValue({ ...member, warnCount: 2 });
      await service.warnUser(moderator, 'member-1', { message: 'Please keep it respectful' });
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ warnCount: { increment: 1 } }) }));
      expect(audit.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'WARN_USER', payload: expect.objectContaining({ warnCount: 2 }) }));
    });

    it('a ban records the reason', async () => {
      prisma.user.findUnique.mockResolvedValue(member);
      await service.banUser(moderator, 'member-1', { reason: 'Repeated harassment' });
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { bannedAt: expect.any(Date), banReason: 'Repeated harassment' } }));
    });

    it('unban clears both a ban and a suspension, and says which it was', async () => {
      await expect(service.unbanUser(client, 'member-1', { reason: 'x' })).rejects.toThrow(ForbiddenException);
      prisma.user.findUnique.mockResolvedValue({ ...member, bannedAt: new Date(), suspendedUntil: null });
      await service.unbanUser(moderator, 'member-1', { reason: 'Appeal upheld' });
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { bannedAt: null, banReason: null, suspendedUntil: null } }));
      expect(notifications.createNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Account Reinstated' }));

      prisma.user.findUnique.mockResolvedValue({ ...member, bannedAt: null, suspendedUntil: new Date(Date.now() + 86_400_000) });
      await service.unbanUser(moderator, 'member-1', { reason: 'Served enough' });
      expect(notifications.createNotification).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Suspension Lifted' }));
      expect(audit.logAction).toHaveBeenLastCalledWith(expect.objectContaining({ payload: expect.objectContaining({ wasBanned: false, wasSuspended: true }) }));
    });
  });

  describe('changeUserRole', () => {
    it('refuses non-admins and changing your own role', async () => {
      await expect(service.changeUserRole(client, 'member-1', { role: 'VENDOR' } as any)).rejects.toThrow(ForbiddenException);
      await expect(service.changeUserRole(moderator, 'mod-1', { role: 'VENDOR' } as any)).rejects.toThrow(BadRequestException);
    });

    it('any admin can move a member between CLIENT, BABALAWO and VENDOR', async () => {
      prisma.user.findUnique.mockResolvedValue(member);
      await service.changeUserRole(moderator, 'member-1', { role: 'VENDOR' } as any);
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { role: 'VENDOR', adminSubRole: null } }));
      expect(audit.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'CHANGE_USER_ROLE', payload: expect.objectContaining({ previousRole: 'CLIENT' }) }));
    });

    it('only a super admin can grant or revoke ADMIN, and a sub-role is required', async () => {
      prisma.user.findUnique.mockResolvedValue(member);
      await expect(service.changeUserRole(moderator, 'member-1', { role: 'ADMIN', adminSubRole: 'SUPPORT' } as any)).rejects.toThrow(ForbiddenException);
      prisma.user.findUnique.mockResolvedValue({ id: 'fin-1', role: 'ADMIN', adminSubRole: 'FINANCE' });
      await expect(service.changeUserRole(moderator, 'fin-1', { role: 'CLIENT' } as any)).rejects.toThrow(ForbiddenException);

      prisma.user.findUnique.mockResolvedValue(member);
      await expect(service.changeUserRole(superAdmin, 'member-1', { role: 'ADMIN' } as any)).rejects.toThrow(/adminSubRole is required/);
      await service.changeUserRole(superAdmin, 'member-1', { role: 'ADMIN', adminSubRole: 'SAFEGUARDING' } as any);
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { role: 'ADMIN', adminSubRole: 'SAFEGUARDING' } }));
    });
  });

  describe('sessions and flags', () => {
    it('force logout sets the cut-off that ends every token, not just the history rows', async () => {
      await service.forceLogoutUser('member-1');
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'member-1' }, data: { sessionsRevokedAt: expect.any(Date) } });
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'member-1', isActive: true } }));
    });

    it('setCommunityCarer 404s for a missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.setCommunityCarer('nobody', true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('verification and vendor review', () => {
    it('approving promotes to a verified Babalawo and notifies them', async () => {
      await expect(service.approveVerification('app-1', {} as any, client)).rejects.toThrow(ForbiddenException);
      prisma.verificationApplication.findUnique.mockResolvedValue(null);
      await expect(service.approveVerification('app-1', {} as any, moderator)).rejects.toThrow(NotFoundException);

      prisma.verificationApplication.findUnique.mockResolvedValue({ id: 'app-1', userId: 'member-1', lineage: 'Òyó' });
      await service.approveVerification('app-1', {} as any, moderator);
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'member-1' }, data: { verified: true, role: 'BABALAWO' } });
      expect(notifications.createNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Verification Approved' }));
    });

    it('rejecting leaves the role alone and records the reason', async () => {
      prisma.verificationApplication.findUnique.mockResolvedValue({ id: 'app-1', userId: 'member-1', lineage: 'Òyó' });
      await service.rejectVerification('app-1', { reason: 'Lineage not confirmed' } as any, moderator);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.verificationApplication.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ rejectionReason: 'Lineage not confirmed' }) }));
    });

    it('bulk verify reports each application separately and carries on past failures', async () => {
      await expect(service.bulkVerifyApplications({ appIds: [], action: 'approve' } as any, moderator)).rejects.toThrow(BadRequestException);
      prisma.verificationApplication.findUnique
        .mockResolvedValueOnce({ id: 'a', userId: 'u-a' })
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error('db down'));
      const res = await service.bulkVerifyApplications({ appIds: ['a', 'b', 'c'], action: 'approve' } as any, moderator);
      expect(res.results).toEqual([
        { id: 'a', success: true },
        { id: 'b', success: false, error: 'Not found' },
        { id: 'c', success: false, error: 'db down' },
      ]);
    });

    it('vendor review only acts on pending applications', async () => {
      prisma.vendor.findUnique.mockResolvedValue({ id: 'v-1', status: 'APPROVED' });
      await expect(service.reviewVendorApplication('v-1', { approved: true }, moderator)).rejects.toThrow('not pending');
      prisma.vendor.findUnique.mockResolvedValue({ id: 'v-1', status: 'PENDING' });
      await service.reviewVendorApplication('v-1', { approved: false, rejectionReason: 'Items not authentic' }, moderator);
      expect(prisma.vendor.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED', verifiedAt: null, reviewedBy: 'mod-1' }) }));
    });
  });
});
