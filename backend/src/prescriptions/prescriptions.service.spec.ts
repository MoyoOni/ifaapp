import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuidancePlansService } from './prescriptions.service';
import { NotificationService } from '../notifications/notification.service';
import { WalletService } from '../wallet/wallet.service';
import { UserRole } from '@ile-ase/common';

describe('GuidancePlansService', () => {
  let service: GuidancePlansService;

  const mockPrismaService = {
    guidancePlan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    guidancePlanItem: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrismaService)),
  };

  const mockWalletService = {
    createEscrow: jest.fn(),
    releaseEscrow: jest.fn(),
  };

  const mockNotificationService = {
    create: jest.fn(),
    sendNotification: jest.fn(),
  };

  const mockPlan = {
    id: 'plan-1',
    babalawoId: 'bab-1',
    clientId: 'client-1',
    title: 'Test Plan',
    status: 'PENDING',
    items: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuidancePlansService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<GuidancePlansService>(GuidancePlansService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGuidancePlan', () => {
    it('should throw NotFoundException when plan does not exist', async () => {
      (mockPrismaService.guidancePlan.findUnique as jest.Mock).mockResolvedValue(null);

      const currentUser = { sub: 'client-1', id: 'client-1', role: UserRole.CLIENT } as any;
      await expect(service.getGuidancePlan('nonexistent', currentUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not participant', async () => {
      (mockPrismaService.guidancePlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);

      const currentUser = { sub: 'other-user', id: 'other-user', role: UserRole.CLIENT } as any;
      await expect(service.getGuidancePlan('plan-1', currentUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should return plan when user is the seeker', async () => {
      (mockPrismaService.guidancePlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);

      const currentUser = { sub: 'client-1', id: 'client-1', role: UserRole.CLIENT } as any;
      const result = await service.getGuidancePlan('plan-1', currentUser);
      expect(result).toEqual(mockPlan);
    });
  });

  describe('getUserGuidancePlans', () => {
    it('should return plans for the current user', async () => {
      const plans = [mockPlan];
      (mockPrismaService.guidancePlan.findMany as jest.Mock).mockResolvedValue(plans);

      const currentUser = { sub: 'client-1', id: 'client-1', role: UserRole.CLIENT } as any;
      const result = await service.getUserGuidancePlans('client-1', {}, currentUser);
      expect(result).toEqual(plans);
      expect(mockPrismaService.guidancePlan.findMany).toHaveBeenCalled();
    });
  });
});
