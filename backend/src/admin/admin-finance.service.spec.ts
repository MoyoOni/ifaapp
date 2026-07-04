import { Test, TestingModule } from '@nestjs/testing';
import { AdminFinanceService } from './admin-finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';

// P2-04: moved from admin.service.spec.ts along with the getDisputes/
// getPendingWithdrawals logic itself, when AdminService was split.

describe('AdminFinanceService', () => {
  let service: AdminFinanceService;
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
        AdminFinanceService,
        {
          provide: WalletService,
          useValue: { releaseEscrow: jest.fn(), cancelEscrow: jest.fn() },
        },
        {
          provide: PaymentsService,
          useValue: { getUnverifiedPayments: jest.fn(), manuallyVerifyPayment: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
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
          },
        },
      ],
    }).compile();

    service = module.get<AdminFinanceService>(AdminFinanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      await expect(service.getDisputes(mockNonAdminUser)).rejects.toThrow(
        'Only admins can view disputes'
      );
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
        },
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
      await expect(service.getPendingWithdrawals(mockNonAdminUser)).rejects.toThrow(
        'Only admins can view withdrawal requests'
      );
    });
  });
});
