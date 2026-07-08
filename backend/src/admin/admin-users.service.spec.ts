import { Test, TestingModule } from '@nestjs/testing';
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
