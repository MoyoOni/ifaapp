import { Test, TestingModule } from '@nestjs/testing';
import { AdminFinanceService } from './admin-finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from './audit.service';
import { NotificationService } from '../notifications/notification.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaystackApiService } from '../payments/paystack-api.service';
import { Prisma } from '@prisma/client';

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

  const mockSubscriptionsService = {
    disablePaystackSubscription: jest.fn().mockResolvedValue(undefined),
  };

  const mockPaystackApiService = {
    createTransferRecipient: jest.fn(),
    initiateTransfer: jest.fn(),
  };

  const mockWalletService = {
    releaseEscrow: jest.fn(),
    cancelEscrow: jest.fn(),
    refundWithdrawalAmount: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminFinanceService,
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: PaymentsService,
          useValue: { getUnverifiedPayments: jest.fn(), manuallyVerifyPayment: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { logAction: jest.fn() },
        },
        {
          provide: NotificationService,
          useValue: { createNotification: jest.fn() },
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: PaystackApiService,
          useValue: mockPaystackApiService,
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
              update: jest.fn(),
            },
            payment: {
              findMany: jest.fn(),
            },
            subscription: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn().mockResolvedValue(0),
            },
            transaction: {
              updateMany: jest.fn(),
              aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
            },
            // ILUASE_V1_BACKLOG.md 🔴 Critical fix: getRevenueForecast no
            // longer fabricates platformCostNgn -- it reads the real column.
            appointment: {
              aggregate: jest.fn().mockResolvedValue({ _sum: { price: 0 } }),
            },
            order: {
              aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 0 } }),
            },
            platformSettings: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
            refundRequest: {
              count: jest.fn().mockResolvedValue(0),
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

  describe('getActiveSubscribers (V8-402: searchable subscriber list)', () => {
    it('returns all active subscribers unfiltered when no search term is given', async () => {
      (prisma as any).subscription.findMany.mockResolvedValue([
        { id: 'sub-1', amountPaid: 2_500_000, user: { id: 'user-1', name: 'Test', email: 't@example.com' } },
      ]);

      await service.getActiveSubscribers();

      expect((prisma as any).subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'ACTIVE' } })
      );
    });

    it('filters by user name/email (case-insensitive) when a search term is given', async () => {
      (prisma as any).subscription.findMany.mockResolvedValue([]);

      await service.getActiveSubscribers('adewale');

      expect((prisma as any).subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            user: {
              OR: [
                { name: { contains: 'adewale', mode: 'insensitive' } },
                { email: { contains: 'adewale', mode: 'insensitive' } },
              ],
            },
          },
        })
      );
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

  describe('processWithdrawal (HUMAN_BACKLOG.md: must actually debit the wallet and call a real transfer API)', () => {
    const pendingWithdrawal = {
      id: 'withdrawal-1',
      userId: 'user-1',
      // WithdrawalRequest.amount mocked as a real Decimal instance
      // (ProBacklog-v1.md item #15) -- proves the kobo-conversion math
      // (Math.round(Number(withdrawal.amount) * 100)) actually handles a
      // real Decimal, not just a plain number other mocks used to provide.
      amount: new Prisma.Decimal('5000.00'),
      currency: 'NGN',
      status: 'PENDING',
      bankAccount: '0123456789',
      bankCode: '058',
      bankName: 'GTBank',
      accountName: 'Test Seeker',
    };

    beforeEach(() => {
      (prisma.withdrawalRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithdrawal);
      (prisma.withdrawalRequest.update as jest.Mock).mockImplementation(({ data }: any) => ({
        ...pendingWithdrawal,
        ...data,
      }));
    });

    it('throws ForbiddenException for a non-admin', async () => {
      await expect(
        service.processWithdrawal('withdrawal-1', 'APPROVE', 'ok', mockNonAdminUser)
      ).rejects.toThrow('Only admins can process withdrawals');
    });

    it('throws NotFoundException when the withdrawal does not exist', async () => {
      (prisma.withdrawalRequest.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.processWithdrawal('missing', 'APPROVE', 'ok', mockAdminUser)
      ).rejects.toThrow('Withdrawal request not found');
    });

    it('throws BadRequestException when the withdrawal is not PENDING', async () => {
      (prisma.withdrawalRequest.findUnique as jest.Mock).mockResolvedValue({
        ...pendingWithdrawal,
        status: 'PROCESSED',
      });
      await expect(
        service.processWithdrawal('withdrawal-1', 'APPROVE', 'ok', mockAdminUser)
      ).rejects.toThrow('Withdrawal request is not pending');
    });

    describe('REJECT', () => {
      it('refunds the held amount and marks the request REJECTED', async () => {
        const result = await service.processWithdrawal(
          'withdrawal-1',
          'REJECT',
          'not eligible',
          mockAdminUser
        );

        expect(mockWalletService.refundWithdrawalAmount).toHaveBeenCalledWith('withdrawal-1');
        expect(prisma.withdrawalRequest.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) })
        );
        expect(result.status).toBe('REJECTED');
        expect(mockPaystackApiService.createTransferRecipient).not.toHaveBeenCalled();
      });
    });

    describe('APPROVE', () => {
      it('throws when bank details are missing', async () => {
        (prisma.withdrawalRequest.findUnique as jest.Mock).mockResolvedValue({
          ...pendingWithdrawal,
          bankCode: null,
        });

        await expect(
          service.processWithdrawal('withdrawal-1', 'APPROVE', 'ok', mockAdminUser)
        ).rejects.toThrow('missing bank account details');
      });

      it('creates a transfer recipient and initiates the transfer with the amount in kobo', async () => {
        mockPaystackApiService.createTransferRecipient.mockResolvedValue({
          status: true,
          data: { recipient_code: 'RCP_123' },
        });
        mockPaystackApiService.initiateTransfer.mockResolvedValue({
          status: true,
          data: { reference: 'withdrawal-1', transfer_code: 'TRF_123', status: 'success' },
        });

        const result = await service.processWithdrawal('withdrawal-1', 'APPROVE', 'ok', mockAdminUser);

        expect(mockPaystackApiService.createTransferRecipient).toHaveBeenCalledWith({
          name: 'Test Seeker',
          account_number: '0123456789',
          bank_code: '058',
          currency: 'NGN',
        });
        expect(mockPaystackApiService.initiateTransfer).toHaveBeenCalledWith({
          amount: 500000,
          recipientCode: 'RCP_123',
          reason: expect.stringContaining('withdrawal-1'),
          reference: 'withdrawal-1',
        });
        expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
          where: { reference: 'withdrawal-1', status: 'PENDING' },
          data: { status: 'COMPLETED' },
        });
        expect(result.status).toBe('PROCESSED');
      });

      it('marks the transaction PENDING (not COMPLETED) when Paystack reports the transfer as still pending', async () => {
        mockPaystackApiService.createTransferRecipient.mockResolvedValue({
          status: true,
          data: { recipient_code: 'RCP_123' },
        });
        mockPaystackApiService.initiateTransfer.mockResolvedValue({
          status: true,
          data: { reference: 'withdrawal-1', transfer_code: 'TRF_123', status: 'pending' },
        });

        await service.processWithdrawal('withdrawal-1', 'APPROVE', 'ok', mockAdminUser);

        expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
          where: { reference: 'withdrawal-1', status: 'PENDING' },
          data: { status: 'PENDING' },
        });
      });

      it('refunds the hold and rejects with a clear message when Paystack rejects the transfer', async () => {
        mockPaystackApiService.createTransferRecipient.mockResolvedValue({
          status: true,
          data: { recipient_code: 'RCP_123' },
        });
        mockPaystackApiService.initiateTransfer.mockResolvedValue({
          status: false,
          message: 'Insufficient platform balance',
        });

        await expect(
          service.processWithdrawal('withdrawal-1', 'APPROVE', 'ok', mockAdminUser)
        ).rejects.toThrow(/Insufficient platform balance/);

        expect(mockWalletService.refundWithdrawalAmount).toHaveBeenCalledWith('withdrawal-1');
        expect(prisma.withdrawalRequest.update).not.toHaveBeenCalled();
      });

      it('refunds the hold when creating the transfer recipient itself throws', async () => {
        mockPaystackApiService.createTransferRecipient.mockRejectedValue(new Error('network error'));

        await expect(
          service.processWithdrawal('withdrawal-1', 'APPROVE', 'ok', mockAdminUser)
        ).rejects.toThrow(/network error/);

        expect(mockWalletService.refundWithdrawalAmount).toHaveBeenCalledWith('withdrawal-1');
      });
    });
  });

  describe('cancelSubscriptionById (HUMAN_BACKLOG.md: admin cancel must actually reach Paystack)', () => {
    it('throws ForbiddenException for non-admin user', async () => {
      await expect(service.cancelSubscriptionById(mockNonAdminUser, 'sub-1')).rejects.toThrow(
        'Only admins can cancel subscriptions'
      );
    });

    it('throws NotFoundException when the subscription does not exist', async () => {
      (prisma as any).subscription.findUnique.mockResolvedValue(null);

      await expect(service.cancelSubscriptionById(mockAdminUser, 'missing')).rejects.toThrow(
        'Subscription not found'
      );
    });

    it('calls disablePaystackSubscription before marking the row cancelled locally', async () => {
      const subscription = {
        id: 'sub-1',
        userId: 'user-1',
        plan: 'ANNUAL',
        paystackSubId: 'SUB_code',
        paystackEmailToken: 'email_token_abc',
      };
      (prisma as any).subscription.findUnique.mockResolvedValue(subscription);
      (prisma as any).subscription.update.mockResolvedValue({ ...subscription, status: 'CANCELLED' });

      await service.cancelSubscriptionById(mockAdminUser, 'sub-1', 'requested by user support ticket');

      expect(mockSubscriptionsService.disablePaystackSubscription).toHaveBeenCalledWith(subscription);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { autoRenew: false, status: 'CANCELLED' },
      });
    });
  });

  // ILUASE_V1_BACKLOG.md top 🔴 Critical item, second fix: getRevenueForecast
  // used to fabricate platformCostNgn as a "placeholder calculation" and
  // assumed a flat 10% platform fee rather than reading real settings.
  describe('getRevenueForecast (ILUASE_V1_BACKLOG.md fix: no more fabricated operating cost)', () => {
    beforeEach(() => {
      (prisma as any).subscription.findMany.mockResolvedValue([]);
      (prisma as any).subscription.count.mockResolvedValue(0);
      (prisma as any).appointment.aggregate.mockResolvedValue({ _sum: { price: 1000 } });
      (prisma as any).order.aggregate.mockResolvedValue({ _sum: { totalAmount: 4000 } });
    });

    it('reports platformCostNgn as null (not a fabricated number) and skips break-even math when no admin value has been set', async () => {
      (prisma as any).platformSettings.findFirst.mockResolvedValue(null);

      const result = await service.getRevenueForecast();

      expect(result.platformCostNgn).toBeNull();
      expect(result.platformCostTracked).toBe(false);
      expect(result.platformCostNote).toContain('not yet tracked');
      expect(result.breakEvenThreshold).toBeNull();
      expect(result.monthsToBreakEven).toBeNull();
    });

    it('computes real break-even math once an admin has set a real platformCostNgn', async () => {
      (prisma as any).platformSettings.findFirst.mockResolvedValue({
        consultationCommissionPct: 15,
        marketplaceCommissionPct: 10,
        platformCostNgn: 120000,
      });

      const result = await service.getRevenueForecast();

      expect(result.platformCostNgn).toBe(120000);
      expect(result.platformCostTracked).toBe(true);
      expect(result.platformCostNote).toBeUndefined();
      // this-month platform revenue = 1000*0.15 + 4000*0.10 = 550, annualized = 6600
      expect(result.projectedAnnualPlatformRevenue).toBe(6600);
      // break-even = 120000 / (6600 / 12) = 218.18...
      expect(result.breakEvenThreshold).toBeCloseTo(218.18, 1);
      expect(result.monthsToBreakEven).toBe(219);
    });

    it('uses the real configured commission rates instead of a hardcoded 10% flat fee', async () => {
      (prisma as any).platformSettings.findFirst.mockResolvedValue({
        consultationCommissionPct: 20,
        marketplaceCommissionPct: 5,
        platformCostNgn: null,
      });

      const result = await service.getRevenueForecast();

      // this-month platform revenue = 1000*0.20 + 4000*0.05 = 400, annualized = 4800
      // (a flat-10% assumption on the 5000 GMV would have wrongly given 500/6000)
      expect(result.projectedAnnualPlatformRevenue).toBe(4800);
    });

    it("includes each month's real gmv in the trend chart, not just revenue (was silently undefined before)", async () => {
      (prisma as any).platformSettings.findFirst.mockResolvedValue(null);
      (prisma as any).transaction.aggregate.mockResolvedValue({ _sum: { amount: 250 } });

      const result = await service.getRevenueForecast();

      expect(result.trend).toHaveLength(3);
      for (const point of result.trend) {
        expect(point.gmv).toBe(5000); // 1000 appointment + 4000 order, per beforeEach
        expect(point.revenue).toBe(250); // real COMMISSION transactions, not a gmv*0.1 guess
      }
    });
  });

  describe('getFinancialCommandCentre (ILUASE_V1_BACKLOG.md fix: real commission, not a 10%-of-GMV guess)', () => {
    beforeEach(() => {
      (prisma as any).subscription.findMany.mockResolvedValue([]);
      (prisma as any).subscription.count.mockResolvedValue(0);
      (prisma as any).appointment.aggregate.mockResolvedValue({ _sum: { price: 20000 } });
      (prisma as any).order.aggregate.mockResolvedValue({ _sum: { totalAmount: 80000 } });
      (prisma as any).escrow.findMany.mockResolvedValue([]);
      (prisma as any).withdrawalRequest.findMany.mockResolvedValue([]);
      (prisma as any).refundRequest.count.mockResolvedValue(0);
    });

    it('reports platformRevenue as the real sum of COMMISSION transactions, not 10% of total GMV', async () => {
      (prisma as any).transaction.aggregate.mockResolvedValue({ _sum: { amount: 4321 } });

      const result = await service.getFinancialCommandCentre();

      // Total GMV here is 100000; the old code would have fabricated 10000.
      expect(result.metrics.totalGmv).toBe(100000);
      expect(result.metrics.platformRevenue).toBe(4321);
    });

    it('reports platformRevenue as 0 (not a fabricated non-zero guess) when no commission has been collected yet', async () => {
      (prisma as any).transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });

      const result = await service.getFinancialCommandCentre();

      expect(result.metrics.platformRevenue).toBe(0);
    });
  });
});
