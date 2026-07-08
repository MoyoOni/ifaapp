import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUsersService } from './admin-users.service';
import { AdminFinanceService } from './admin-finance.service';
import { AdminCommunityService } from './admin-community.service';
import { AdminContentService } from './admin-content.service';
import { AuditService } from './audit.service';
import { AdminMarketplaceService } from './admin-marketplace.service';
import { AdminAcademyService } from './admin-academy.service';
import { AdminTrustScoreService } from './admin-trust-score.service';
import { AdminPlatformSettingsService } from './admin-platform-settings.service';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { AdminPromosService } from './admin-promos.service';
import { AdminReferralsService } from './admin-referrals.service';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { AdminComplaintsService } from './admin-complaints.service';

// P2-04: AdminService is now a thin facade delegating to domain services
// (see admin-users/finance/community/content.service.spec.ts for the real
// logic-level tests, moved there from here along with the code they cover).
// This file only tests what's still directly in AdminService (platform
// stats — genuinely cross-cutting, not owned by one domain) plus a
// representative sample of delegation wiring, not every one of the 43
// delegated methods.
jest.mock('@ile-ase/common', () => {
  const actual = jest.requireActual('@ile-ase/common');
  return {
    ...actual,
    VerificationStage: {
      ETHICS_AGREEMENT: 'ETHICS_AGREEMENT',
      APPLICATION: 'APPLICATION',
      COUNCIL_REVIEW: 'COUNCIL_REVIEW',
      CERTIFICATION: 'CERTIFICATION',
    },
  };
});

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;
  let adminUsersService: AdminUsersService;

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
        AdminService,
        {
          provide: AdminUsersService,
          useValue: { getAllUsers: jest.fn() },
        },
        {
          provide: AdminFinanceService,
          useValue: { getDisputes: jest.fn() },
        },
        {
          provide: AdminCommunityService,
          useValue: { moderateCircle: jest.fn() },
        },
        {
          provide: AdminContentService,
          useValue: { getQuizStats: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn(), getAuditLogs: jest.fn() },
        },
        // Not exercised by any test in this file (see the file-level comment
        // above) -- only present so AdminService's full constructor resolves.
        { provide: AdminMarketplaceService, useValue: {} },
        { provide: AdminAcademyService, useValue: {} },
        { provide: AdminTrustScoreService, useValue: {} },
        { provide: AdminPlatformSettingsService, useValue: {} },
        { provide: AdminAnnouncementsService, useValue: {} },
        { provide: AdminPromosService, useValue: {} },
        { provide: AdminReferralsService, useValue: {} },
        { provide: AdminCulturalContentService, useValue: {} },
        { provide: AdminComplaintsService, useValue: {} },
        {
          provide: PrismaService,
          useValue: {
            user: { count: jest.fn() },
            verificationApplication: { count: jest.fn() },
            babalawoClient: { count: jest.fn() },
            appointment: { count: jest.fn() },
            message: { count: jest.fn() },
            auditLog: { count: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    adminUsersService = module.get<AdminUsersService>(AdminUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlatformStats', () => {
    it('should return platform statistics for admin user', async () => {
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(25); // verifiedBabalawos

      (prisma.verificationApplication.count as jest.Mock).mockResolvedValueOnce(5);
      (prisma.babalawoClient.count as jest.Mock).mockResolvedValueOnce(50);
      (prisma.appointment.count as jest.Mock).mockResolvedValueOnce(200);
      (prisma.message.count as jest.Mock).mockResolvedValueOnce(1000);

      const result = await service.getPlatformStats(mockAdminUser);

      expect(result).toEqual({
        totalUsers: 100,
        verifiedBabalawos: 25,
        pendingVerifications: 5,
        activeRelationships: 50,
        totalAppointments: 200,
        totalMessages: 1000,
      });

      expect(prisma.user.count).toHaveBeenCalledTimes(2);
      expect(prisma.verificationApplication.count).toHaveBeenCalledTimes(1);
      expect(prisma.babalawoClient.count).toHaveBeenCalledTimes(1);
      expect(prisma.appointment.count).toHaveBeenCalledTimes(1);
      expect(prisma.message.count).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      await expect(service.getPlatformStats(mockNonAdminUser)).rejects.toThrow(
        'Only admins can access platform statistics'
      );
    });
  });

  describe('delegation to domain services (P2-04)', () => {
    it('getAllUsers delegates to AdminUsersService with the same arguments', async () => {
      const expected = [{ id: 'user-1' }];
      (adminUsersService.getAllUsers as jest.Mock).mockResolvedValue(expected);

      const result = await service.getAllUsers(mockAdminUser, { role: 'CLIENT' });

      expect(adminUsersService.getAllUsers).toHaveBeenCalledWith(mockAdminUser, { role: 'CLIENT' });
      expect(result).toBe(expected);
    });
  });
});
