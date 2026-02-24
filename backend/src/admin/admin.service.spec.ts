import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationService } from '../verification/verification.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';
import { CirclesService } from '../circles/circles.service';

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

  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    verified: true,
  };

  const mockNonAdminUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'CLIENT',
    verified: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: VerificationService,
          useValue: { getApplication: jest.fn(), approve: jest.fn(), reject: jest.fn() },
        },
        {
          provide: WalletService,
          useValue: { releaseEscrow: jest.fn(), cancelEscrow: jest.fn() },
        },
        {
          provide: PaymentsService,
          useValue: { getUnverifiedPayments: jest.fn(), manuallyVerifyPayment: jest.fn() },
        },
        {
          provide: CirclesService,
          useValue: { createFromSuggestion: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            verificationApplication: {
              count: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            babalawoClient: {
              count: jest.fn(),
            },
            appointment: {
              count: jest.fn(),
            },
            message: {
              count: jest.fn(),
            },
            dispute: {
              findMany: jest.fn(),
            },
            escrow: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              aggregate: jest.fn(),
              count: jest.fn(),
            },
            withdrawalRequest: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            payment: {
              findMany: jest.fn(),
            },
            vendor: {
              findMany: jest.fn(),
            },
            reportedContent: {
              findMany: jest.fn(),
            },
            advisoryBoardVote: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            circleSuggestion: {
              findMany: jest.fn(),
            },
            circle: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
            event: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlatformStats', () => {
    it('should return platform statistics for admin user', async () => {
      // Mock all the count methods
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(100)  // totalUsers
        .mockResolvedValueOnce(25);   // verifiedBabalawos
      
      (prisma.verificationApplication.count as jest.Mock).mockResolvedValueOnce(5); // pendingVerifications (where: currentStage not ETHICS_AGREEMENT)
      
      (prisma.babalawoClient.count as jest.Mock)
        .mockResolvedValueOnce(50);   // activeRelationships
      
      (prisma.appointment.count as jest.Mock)
        .mockResolvedValueOnce(200);  // totalAppointments
      
      (prisma.message.count as jest.Mock)
        .mockResolvedValueOnce(1000); // totalMessages

      const result = await service.getPlatformStats(mockAdminUser);

      expect(result).toEqual({
        totalUsers: 100,
        verifiedBabalawos: 25,
        pendingVerifications: 5,
        activeRelationships: 50,
        totalAppointments: 200,
        totalMessages: 1000,
      });

      // Verify all methods were called
      expect(prisma.user.count).toHaveBeenCalledTimes(2);
      expect(prisma.verificationApplication.count).toHaveBeenCalledTimes(1);
      expect(prisma.babalawoClient.count).toHaveBeenCalledTimes(1);
      expect(prisma.appointment.count).toHaveBeenCalledTimes(1);
      expect(prisma.message.count).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      await expect(service.getPlatformStats(mockNonAdminUser))
        .rejects.toThrow('Only admins can access platform statistics');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users for admin user', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'CLIENT',
          verified: true,
          hasOnboarded: true,
          culturalLevel: 'OMO_ILE',
        }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.getAllUsers(mockAdminUser);

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          verified: true,
          hasOnboarded: true,
          culturalLevel: true,
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
      await expect(service.getAllUsers(mockNonAdminUser))
        .rejects.toThrow('Only admins can view all users');
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
        }
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
      await expect(service.getVerificationApplications(mockNonAdminUser))
        .rejects.toThrow('Only admins can review verification applications');
    });
  });

  describe('getDisputes', () => {
    it('should return disputes for admin user', async () => {
      const mockEscrows = [
        {
          id: 'escrow-1',
          status: 'DISPUTED',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'u1', name: 'User', email: 'u@x.com' },
          guidancePlan: { appointment: { id: 'apt-1', date: new Date(), time: '10:00' } },
        },
      ];

      (prisma.escrow.findMany as jest.Mock).mockResolvedValue(mockEscrows);

      const result = await service.getDisputes(mockAdminUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'escrow-1', status: 'DISPUTED' });
      expect(prisma.escrow.findMany).toHaveBeenCalledWith({
        where: { status: 'DISPUTED' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          guidancePlan: {
            include: {
              appointment: {
                select: { id: true, date: true, time: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should filter disputes by status when provided', async () => {
      (prisma.escrow.findMany as jest.Mock).mockResolvedValue([]);

      await service.getDisputes(mockAdminUser, 'RESOLVED');

      expect(prisma.escrow.findMany).toHaveBeenCalledWith({
        where: { status: 'RESOLVED' },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      await expect(service.getDisputes(mockNonAdminUser))
        .rejects.toThrow('Only admins can view disputes');
    });
  });

  describe('getPendingWithdrawals', () => {
    it('should return pending withdrawals for admin user', async () => {
      const mockWithdrawals = [
        {
          id: 'withdrawal-1',
          userId: 'user-1',
          amount: 5000,
          currency: 'NGN',
          status: 'PENDING',
          createdAt: new Date(),
        }
      ];

      (prisma.withdrawalRequest.findMany as jest.Mock).mockResolvedValue(mockWithdrawals);

      const result = await service.getPendingWithdrawals(mockAdminUser);

      expect(result).toEqual(mockWithdrawals);
      expect(prisma.withdrawalRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          amount: { gte: 500 },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          escrow: {
            select: {
              id: true,
              type: true,
              amount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      await expect(service.getPendingWithdrawals(mockNonAdminUser))
        .rejects.toThrow('Only admins can view withdrawal requests');
    });
  });
});