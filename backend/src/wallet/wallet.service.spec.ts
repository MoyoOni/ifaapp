import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Currency, TransactionType, TransactionStatus } from '@ile-ase/common'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../payments/currency.service';
import { NotificationService } from '../notifications/notification.service';
import { OutboxService } from '../outbox/outbox.service';
import { Prisma } from '@prisma/client';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;
  let outboxService: { createEventInTx: jest.Mock };

  const mockUser = {
    id: 'user-1',
    sub: 'user-1',
    email: 'user@example.com',
    role: 'CLIENT',
    verified: true,
  };

  // Transaction client mock — mirrors prisma but used inside $transaction callbacks
  const txClient = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    escrow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    withdrawalRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: {
            wallet: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            escrow: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              aggregate: jest.fn(),
            },
            withdrawalRequest: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            // VENDOR_BACKLOG.md VND-002 -- default resolves to no minimum
            // threshold so pre-existing withdrawal tests keep passing
            // without needing to know about PlatformSettings.
            platformSettings: {
              findUnique: jest.fn().mockResolvedValue({ minPayoutThresholdNgn: 0 }),
            },
            bankAccount: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            // $transaction executes the callback with the txClient. Also
            // supports the array form (Prisma.$transaction([...])) used by
            // setDefaultBankAccount -- just awaits each promise as-is since
            // those are built from the same top-level mocked methods.
            $transaction: jest.fn((arg: unknown) =>
              Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: typeof txClient) => Promise<any>)(txClient)
            ),
          },
        },
        {
          provide: CurrencyService,
          useValue: {
            convert: jest.fn(),
            getExchangeRate: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendNotification: jest.fn(),
            createNotification: jest.fn(),
          },
        },
        {
          provide: OutboxService,
          useValue: {
            createEventInTx: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);
    outboxService = module.get<OutboxService>(OutboxService) as any;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet if found', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 5000,
        currency: 'NGN',
        locked: false,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.getOrCreateWallet('user-1');

      expect(result).toEqual(mockWallet);
      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.wallet.create).not.toHaveBeenCalled();
    });

    it('should create new wallet if not found', async () => {
      const mockNewWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 0,
        currency: 'NGN',
        locked: false,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.create as jest.Mock).mockResolvedValue(mockNewWallet);

      const result = await service.getOrCreateWallet('user-1');

      expect(result).toEqual(mockNewWallet);
      expect(prisma.wallet.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          balance: 0,
          currency: 'NGN',
        },
      });
    });
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance information', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 7500,
        currency: 'NGN',
        locked: false,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.getWalletBalance('user-1', mockUser as any);

      expect(result).toEqual({
        balance: 7500,
        currency: 'NGN',
        locked: false,
      });
    });

    it("rejects reading another user's wallet balance (EMG-05)", async () => {
      const attacker = { ...mockUser, id: 'attacker-user' };

      await expect(service.getWalletBalance('user-1', attacker as any)).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.wallet.findUnique).not.toHaveBeenCalled();
    });

    it("allows an ADMIN to read another user's wallet balance", async () => {
      const admin = { ...mockUser, id: 'admin-user', role: 'ADMIN' };
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 7500,
        currency: 'NGN',
        locked: false,
      };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.getWalletBalance('user-1', admin as any);

      expect(result.balance).toBe(7500);
    });
  });

  describe('getWalletBalanceMultiCurrency (EMG-05)', () => {
    it("rejects reading another user's multi-currency balance", async () => {
      const attacker = { ...mockUser, id: 'attacker-user' };

      await expect(
        service.getWalletBalanceMultiCurrency('user-1', attacker as any)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.wallet.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('depositFunds', () => {
    const mockWallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 5000,
      currency: 'NGN',
      locked: false,
    };

    const mockUpdatedWallet = { ...mockWallet, balance: 10000 };

    const mockTransaction = {
      id: 'txn-1',
      walletId: 'wallet-1',
      userId: 'user-1',
      type: 'DEPOSIT',
      amount: 5000,
      currency: 'NGN',
      status: 'COMPLETED',
    };

    const depositDto = {
      amount: 5000,
      currency: Currency.NGN,
      description: 'Bank transfer deposit',
      reference: 'ref-123',
    };

    beforeEach(() => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (txClient.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (txClient.wallet.update as jest.Mock).mockResolvedValue(mockUpdatedWallet);
    });

    it('should create deposit transaction and update balance atomically', async () => {
      const result = await service.depositFunds('user-1', depositDto, mockUser);

      expect(result).toEqual({
        wallet: mockUpdatedWallet,
        transaction: mockTransaction,
      });

      // Verify $transaction was called (atomic)
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(txClient.transaction.create).toHaveBeenCalled();
      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { increment: 5000 } },
      });
    });

    it('does not write an outbox event when notifyOnDeposit is not provided', async () => {
      await service.depositFunds('user-1', depositDto, mockUser);

      expect(outboxService.createEventInTx).not.toHaveBeenCalled();
    });

    it('writes an outbox event atomically inside the transaction when notifyOnDeposit is provided (P1-01)', async () => {
      const notifyOnDeposit = {
        eventType: 'PAYMENT_RECEIVED',
        payload: { userId: 'user-1', amount: 5000, currency: 'NGN', reference: 'ref-123' },
      };

      await service.depositFunds('user-1', depositDto, mockUser, undefined, notifyOnDeposit);

      expect(outboxService.createEventInTx).toHaveBeenCalledWith(
        txClient,
        expect.objectContaining({
          aggregateType: 'WALLET',
          aggregateId: 'wallet-1',
          eventType: 'PAYMENT_RECEIVED',
          payload: notifyOnDeposit.payload,
        })
      );
    });

    it('does not write a duplicate outbox event on an idempotent replay', async () => {
      const existingTxn = { ...mockTransaction, wallet: mockWallet };
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(existingTxn);

      await service.depositFunds('user-1', depositDto, mockUser, 'idem-key-123', {
        eventType: 'PAYMENT_RECEIVED',
        payload: { userId: 'user-1' },
      });

      // The idempotency check returns early, before the $transaction (and
      // therefore before the outbox write) is ever reached.
      expect(outboxService.createEventInTx).not.toHaveBeenCalled();
    });

    it('should reject deposit to another users wallet', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };

      await expect(service.depositFunds('user-1', depositDto, otherUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should reject deposit to locked wallet', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        ...mockWallet,
        locked: true,
      });

      await expect(service.depositFunds('user-1', depositDto, mockUser)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should return existing transaction for duplicate idempotency key', async () => {
      const existingTxn = { ...mockTransaction, wallet: mockWallet };
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(existingTxn);

      const result = await service.depositFunds('user-1', depositDto, mockUser, 'idem-key-123');

      expect(result).toEqual({
        wallet: existingTxn.wallet,
        transaction: existingTxn,
      });
      // Should NOT call $transaction for duplicate
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should process new deposit with idempotency key', async () => {
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.depositFunds('user-1', depositDto, mockUser, 'new-idem-key');

      expect(result).toEqual({
        wallet: mockUpdatedWallet,
        transaction: mockTransaction,
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(txClient.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          idempotencyKey: 'new-idem-key',
        }),
      });
    });
  });

  describe('createEscrow', () => {
    it('should create escrow and deduct from wallet atomically', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 10000,
        currency: 'NGN',
        locked: false,
      };

      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        recipientId: 'recipient-1',
        amount: 5000,
        type: 'BOOKING',
        status: 'HOLD',
        relatedId: 'booking-1',
        notes: 'Consultation booking',
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (txClient.escrow.create as jest.Mock).mockResolvedValue(mockEscrow);
      (txClient.wallet.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      const escrowDto = {
        recipientId: 'recipient-1',
        amount: 5000,
        type: 'BOOKING' as any,
        relatedId: 'booking-1',
        notes: 'Consultation booking',
      };

      const result = await service.createEscrow('user-1', escrowDto, mockUser);

      expect(result).toEqual(mockEscrow);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(txClient.escrow.create).toHaveBeenCalled();
      expect(txClient.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'wallet-1', locked: false, balance: { gte: 5000 } },
        data: { balance: { decrement: 5000 } },
      });
    });

    it('should throw error if insufficient funds', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 3000,
        currency: 'NGN',
        locked: false,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      // The conditional update affects zero rows because balance < amount —
      // this is the actual mechanism that now rejects the request.
      (txClient.wallet.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const escrowDto = {
        recipientId: 'recipient-1',
        amount: 5000,
        type: 'BOOKING' as any,
        relatedId: 'booking-1',
        notes: 'Consultation booking',
      };

      await expect(service.createEscrow('user-1', escrowDto, mockUser)).rejects.toThrow(
        'Insufficient funds'
      );
    });

    it('rejects a concurrent second escrow that would drive the balance negative (EMG-06)', async () => {
      // Simulates two concurrent createEscrow calls against the same wallet:
      // both read the same starting balance (10000), both request 8000. The
      // first commits and the conditional update reflects that on the second
      // call by returning count: 0 (the DB-level guard the real Postgres
      // instance would enforce via the same WHERE clause).
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 10000,
        currency: 'NGN',
        locked: false,
      };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (txClient.wallet.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const escrowDto = {
        recipientId: 'recipient-1',
        amount: 8000,
        type: 'BOOKING' as any,
        relatedId: 'booking-2',
      };

      await expect(service.createEscrow('user-1', escrowDto, mockUser)).rejects.toThrow(
        'Insufficient funds'
      );
      expect(txClient.escrow.create).not.toHaveBeenCalled();
    });
  });

  describe('createExternallyFundedEscrow (VENDOR_BACKLOG.md VND-010 investigation)', () => {
    it('creates the escrow without touching wallet balance or requiring a minimum balance', async () => {
      const mockWallet = { id: 'wallet-1', userId: 'user-1', balance: 0, currency: 'NGN', locked: false };
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        recipientId: 'vendor-user-1',
        amount: 5000,
        type: 'ORDER',
        status: 'HOLD',
        relatedId: 'order-1',
      };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.escrow.create as jest.Mock).mockResolvedValue(mockEscrow);

      const result = await service.createExternallyFundedEscrow('user-1', {
        recipientId: 'vendor-user-1',
        amount: 5000,
        type: 'ORDER' as any,
        relatedId: 'order-1',
      });

      expect(result).toEqual(mockEscrow);
      // The whole point of this variant: no wallet balance check/decrement,
      // unlike createEscrow() -- a 0-balance wallet must not block this.
      expect(prisma.wallet.update).not.toHaveBeenCalled();
      expect(txClient.wallet.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('refundMarketplaceOrder (VENDOR_BACKLOG.md VND-010 investigation)', () => {
    it('cancels a HOLD escrow and credits the customer wallet with the refund amount', async () => {
      const mockWallet = { id: 'wallet-1', userId: 'customer-1', balance: 1000, currency: 'NGN', locked: false };
      const mockEscrow = { id: 'escrow-1', type: 'ORDER', relatedId: 'order-1', status: 'HOLD' };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (txClient.escrow.findFirst as jest.Mock).mockResolvedValue(mockEscrow);
      (txClient.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 6000 });
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      const result = await service.refundMarketplaceOrder(
        'order-1',
        'customer-1',
        5000,
        'NGN' as any,
        'vendor-user-1'
      );

      expect(txClient.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'escrow-1' }, data: expect.objectContaining({ status: 'CANCELLED' }) })
      );
      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { increment: 5000 } },
      });
      expect(result.escrowCancelled).toBe(true);
    });

    it('still credits the wallet when no escrow exists (e.g. orders paid before this fix)', async () => {
      const mockWallet = { id: 'wallet-1', userId: 'customer-1', balance: 0, currency: 'NGN', locked: false };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (txClient.escrow.findFirst as jest.Mock).mockResolvedValue(null);
      (txClient.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 5000 });
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      const result = await service.refundMarketplaceOrder(
        'order-1',
        'customer-1',
        5000,
        'NGN' as any,
        'admin-1'
      );

      expect(txClient.escrow.update).not.toHaveBeenCalled();
      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { increment: 5000 } },
      });
      expect(result.escrowCancelled).toBe(false);
    });
  });

  describe('releaseEscrow', () => {
    it('should release escrow and transfer funds atomically', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        recipientId: 'recipient-1',
        // Escrow.amount mocked as a real Decimal instance (ProBacklog-v1.md
        // item #15), not the plain number other tests in this file still use.
        amount: new Prisma.Decimal('5000.00'),
        type: 'BOOKING',
        status: 'HOLD',
        relatedId: 'booking-1',
        currency: 'NGN',
        releaseTiers: null,
        releasedAt: null,
      };

      const mockRecipientWallet = {
        id: 'wallet-2',
        userId: 'recipient-1',
        balance: 2000,
        currency: 'NGN',
        locked: false,
      };

      const mockUpdatedEscrow = {
        ...mockEscrow,
        status: 'RELEASED',
        releasedAt: new Date(),
        releasedBy: 'user-1',
      };

      (prisma.escrow.findUnique as jest.Mock).mockResolvedValue({ ...mockEscrow, wallet: {} });
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockRecipientWallet);
      (txClient.escrow.update as jest.Mock).mockResolvedValue(mockUpdatedEscrow);
      (txClient.wallet.update as jest.Mock).mockResolvedValue({});
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      const releaseDto = { escrowId: 'escrow-1' };
      const result = await service.releaseEscrow('user-1', releaseDto, mockUser);

      expect(result).toEqual(mockUpdatedEscrow);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-2' },
        data: { balance: { increment: 5000 } },
      });
    });

    // ProBacklog-v1.md item #15 (Float->Decimal migration): this multi-tier
    // branch had zero test coverage before this migration. The exact bug it
    // would have caught: `escrow.amount * (releaseTiers.tier1 || 0.5)` used a
    // raw `*` against a real Decimal instance, which TypeScript's Decimal
    // class doesn't overload -- this would either fail to compile (as it now
    // correctly does without the Number() normalization) or, if the call site
    // were loosely typed as `any`, silently produce garbage at runtime.
    it('releases only tier 1 (50%) on a Decimal-valued escrow, leaving it PARTIALLY_RELEASED', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        recipientId: 'recipient-1',
        amount: new Prisma.Decimal('2000.00'),
        type: 'GUIDANCE_PLAN',
        status: 'HOLD',
        relatedId: 'plan-1',
        currency: 'NGN',
        releaseTiers: { tier1: 0.5, tier2: 0.5 },
        releasedAt: null,
      };

      (prisma.escrow.findUnique as jest.Mock).mockResolvedValue({ ...mockEscrow, wallet: {} });
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        id: 'wallet-2',
        userId: 'recipient-1',
        balance: 0,
        currency: 'NGN',
        locked: false,
      });
      (txClient.escrow.update as jest.Mock).mockResolvedValue({ ...mockEscrow, status: 'PARTIALLY_RELEASED' });
      (txClient.wallet.update as jest.Mock).mockResolvedValue({});
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      await service.releaseEscrow('user-1', { escrowId: 'escrow-1', tier: 'TIER_1' } as any, mockUser);

      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-2' },
        data: { balance: { increment: 1000 } },
      });
      expect(txClient.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PARTIALLY_RELEASED' }),
        })
      );
    });

    it('releases the correct remainder on a FULL release after tier 1 was already released, on a Decimal-valued escrow', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        recipientId: 'recipient-1',
        amount: new Prisma.Decimal('2000.00'),
        type: 'GUIDANCE_PLAN',
        status: 'PARTIALLY_RELEASED',
        relatedId: 'plan-1',
        currency: 'NGN',
        releaseTiers: { tier1: 0.5, tier2: 0.5, releasedTier1: true },
        releasedAt: null,
      };

      (prisma.escrow.findUnique as jest.Mock).mockResolvedValue({ ...mockEscrow, wallet: {} });
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        id: 'wallet-2',
        userId: 'recipient-1',
        balance: 1000,
        currency: 'NGN',
        locked: false,
      });
      (txClient.escrow.update as jest.Mock).mockResolvedValue({ ...mockEscrow, status: 'RELEASED' });
      (txClient.wallet.update as jest.Mock).mockResolvedValue({});
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      await service.releaseEscrow('user-1', { escrowId: 'escrow-1', tier: 'FULL' } as any, mockUser);

      // Tier 1 (1000) already released -- FULL should release only the
      // remaining 1000, not the full 2000 again.
      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-2' },
        data: { balance: { increment: 1000 } },
      });
    });
  });

  describe('expireEscrows', () => {
    // Same Decimal-tier-math risk as releaseEscrow above, in the cron-driven
    // auto-expiry path -- previously zero coverage here too.
    it('refunds only the un-released remainder for a partially-released, Decimal-valued escrow', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        amount: new Prisma.Decimal('2000.00'),
        type: 'GUIDANCE_PLAN',
        status: 'PARTIALLY_RELEASED',
        currency: 'NGN',
        releaseTiers: { tier1: 0.5, tier2: 0.5, releasedTier1: true },
        wallet: {},
      };

      (prisma.escrow.findMany as jest.Mock).mockResolvedValue([mockEscrow]);
      (txClient.wallet.update as jest.Mock).mockResolvedValue({});
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      await service.expireEscrows();

      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { increment: 1000 } },
      });
    });

    it('marks a fully-released escrow EXPIRED without refunding anything', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        amount: new Prisma.Decimal('2000.00'),
        type: 'GUIDANCE_PLAN',
        status: 'HOLD',
        currency: 'NGN',
        releaseTiers: { tier1: 0.5, tier2: 0.5, releasedTier1: true, releasedTier2: true },
        wallet: {},
      };

      (prisma.escrow.findMany as jest.Mock).mockResolvedValue([mockEscrow]);
      (prisma.escrow.update as jest.Mock).mockResolvedValue({ ...mockEscrow, status: 'EXPIRED' });

      await service.expireEscrows();

      expect(prisma.escrow.update).toHaveBeenCalledWith({
        where: { id: 'escrow-1' },
        data: { status: 'EXPIRED' },
      });
      expect(txClient.wallet.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelEscrow', () => {
    it('should cancel escrow and refund atomically', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        amount: 5000,
        type: 'BOOKING',
        status: 'HOLD',
        currency: 'NGN',
        wallet: {},
      };

      (prisma.escrow.findUnique as jest.Mock).mockResolvedValue(mockEscrow);
      (txClient.wallet.update as jest.Mock).mockResolvedValue({});
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});
      (txClient.escrow.update as jest.Mock).mockResolvedValue({
        ...mockEscrow,
        status: 'CANCELLED',
      });

      const result = await service.cancelEscrow('user-1', 'escrow-1', mockUser as any);

      expect(result).toEqual({ success: true, refundedAmount: 5000 });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { increment: 5000 } },
      });
      expect(txClient.escrow.update).toHaveBeenCalledWith({
        where: { id: 'escrow-1' },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      });
    });

    it('should reject cancellation by non-owner', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'other-user',
        amount: 5000,
        status: 'HOLD',
        wallet: {},
      };

      (prisma.escrow.findUnique as jest.Mock).mockResolvedValue(mockEscrow);

      await expect(service.cancelEscrow('user-1', 'escrow-1', mockUser as any)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('getWalletBalance (duplicate suite, retained for coverage of the escrow-adjacent path)', () => {
    it('should return wallet balance information', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 7500,
        currency: 'NGN',
        locked: false,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.getWalletBalance('user-1', mockUser as any);

      expect(result).toEqual({
        balance: 7500,
        currency: 'NGN',
        locked: false,
      });
    });
  });

  describe('releaseEscrow', () => {
    // ... existing tests ...

    it('should reject release by non-owner', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'other-user',
        recipientId: 'recipient-1',
        amount: 5000,
        type: 'BOOKING',
        status: 'HOLD',
        relatedId: 'booking-1',
        currency: 'NGN',
        releaseTiers: null,
        releasedAt: null,
      };

      (prisma.escrow.findUnique as jest.Mock).mockResolvedValue({ ...mockEscrow, wallet: {} });

      await expect(
        service.releaseEscrow('user-1', { escrowId: 'escrow-1' }, mockUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject release of non-existent escrow', async () => {
      (prisma.escrow.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.releaseEscrow('user-1', { escrowId: 'non-existent' }, mockUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactions', () => {
    it('should return transaction history for user', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 5000,
        currency: 'NGN',
        locked: false,
      };
      const mockTransactions = [
        {
          id: 'txn-1',
          walletId: 'wallet-1',
          userId: 'user-1',
          type: 'DEPOSIT',
          amount: 5000,
          currency: 'NGN',
          status: 'COMPLETED',
          description: 'Bank transfer',
          createdAt: new Date(),
        },
      ];

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getTransactions(
        'user-1',
        { limit: 50, offset: 0 },
        mockUser as any
      );

      expect(result).toEqual({
        transactions: mockTransactions,
        total: 1,
        limit: 50,
        offset: 0,
      });
    });

    it('should apply filters correctly', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 5000,
        currency: 'NGN',
        locked: false,
      };

      const mockTransactions = [
        {
          id: 'txn-1',
          walletId: 'wallet-1',
          userId: 'user-1',
          type: 'DEPOSIT',
          amount: 5000,
          currency: 'NGN',
          status: 'COMPLETED',
          description: 'Bank transfer',
          createdAt: new Date(),
        },
      ];

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(1);

      const filters = {
        limit: 10,
        offset: 0,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date().toISOString(),
      };

      const result = await service.getTransactions('user-1', filters, mockUser as any);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          walletId: 'wallet-1',
          userId: 'user-1',
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });

      expect(result).toEqual({
        transactions: mockTransactions,
        total: 1,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('createWithdrawalRequest (HUMAN_BACKLOG.md: hold funds atomically at request time)', () => {
    const mockWallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 10000,
      currency: 'NGN',
      locked: false,
    };

    const withdrawalDto = {
      amount: 5000,
      currency: Currency.NGN,
      bankAccount: '1234567890',
      bankName: 'Test Bank',
      bankCode: '058',
      accountName: 'Test Seeker',
    };

    beforeEach(() => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
    });

    it('atomically decrements the wallet balance and creates a PENDING hold transaction', async () => {
      const mockWithdrawalRequest = {
        id: 'withdrawal-1',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'PENDING',
        bankAccount: '1234567890',
        bankName: 'Test Bank',
        bankCode: '058',
      };

      (txClient.wallet.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (txClient.withdrawalRequest.create as jest.Mock).mockResolvedValue(mockWithdrawalRequest);
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      const result = await service.createWithdrawalRequest(
        'user-1',
        withdrawalDto,
        mockUser as any
      );

      expect(result).toEqual(mockWithdrawalRequest);
      expect(txClient.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'wallet-1', locked: false, balance: { gte: 5000 } },
        data: { balance: { decrement: 5000 } },
      });
      expect(txClient.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TransactionType.WITHDRAWAL,
            amount: -5000,
            status: TransactionStatus.PENDING,
            reference: 'withdrawal-1',
          }),
        })
      );
    });

    it('throws BadRequestException when the conditional decrement matches no rows (insufficient balance)', async () => {
      (txClient.wallet.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(
        service.createWithdrawalRequest('user-1', withdrawalDto, mockUser as any)
      ).rejects.toThrow('Insufficient available balance');

      expect(txClient.withdrawalRequest.create).not.toHaveBeenCalled();
    });

    it('rejects when the amount is below the platform minimum payout threshold', async () => {
      (prisma.platformSettings.findUnique as jest.Mock).mockResolvedValueOnce({
        minPayoutThresholdNgn: 10000,
      });

      await expect(
        service.createWithdrawalRequest('user-1', withdrawalDto, mockUser as any)
      ).rejects.toThrow('Minimum withdrawal amount is 10000');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('resolves bank details from a saved bankAccountId instead of raw fields', async () => {
      const savedAccount = {
        id: 'bank-1',
        userId: 'user-1',
        bankName: 'Saved Bank',
        bankCode: '011',
        accountNumber: '0011223344',
        accountName: 'Saved Seeker',
      };
      (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue(savedAccount);
      (txClient.wallet.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (txClient.withdrawalRequest.create as jest.Mock).mockResolvedValue({ id: 'withdrawal-1' });
      (txClient.transaction.create as jest.Mock).mockResolvedValue({});

      await service.createWithdrawalRequest(
        'user-1',
        { amount: 5000, currency: Currency.NGN, bankAccountId: 'bank-1' },
        mockUser as any
      );

      expect(txClient.withdrawalRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bankAccount: '0011223344',
            bankName: 'Saved Bank',
            bankCode: '011',
            accountName: 'Saved Seeker',
          }),
        })
      );
    });

    it('throws NotFoundException when bankAccountId does not belong to the requesting user', async () => {
      (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({
        id: 'bank-1',
        userId: 'someone-else',
      });

      await expect(
        service.createWithdrawalRequest(
          'user-1',
          { amount: 5000, currency: Currency.NGN, bankAccountId: 'bank-1' },
          mockUser as any
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when neither bankAccountId nor complete raw bank fields are provided', async () => {
      await expect(
        service.createWithdrawalRequest(
          'user-1',
          { amount: 5000, currency: Currency.NGN },
          mockUser as any
        )
      ).rejects.toThrow(
        'Provide either a saved bankAccountId or all of bankAccount/bankName/bankCode/accountName'
      );
    });
  });

  describe('bank account management (VENDOR_BACKLOG.md VND-002)', () => {
    describe('getBankAccounts', () => {
      it('returns the accounts for the requesting user, default first', async () => {
        const accounts = [{ id: 'bank-1', userId: 'user-1', isDefault: true }];
        (prisma.bankAccount.findMany as jest.Mock).mockResolvedValue(accounts);

        const result = await service.getBankAccounts('user-1', mockUser as any);

        expect(result).toEqual(accounts);
        expect(prisma.bankAccount.findMany).toHaveBeenCalledWith({
          where: { userId: 'user-1' },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        });
      });

      it('throws ForbiddenException when a non-admin requests another user’s accounts', async () => {
        await expect(
          service.getBankAccounts('other-user', mockUser as any)
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('createBankAccount', () => {
      const dto = {
        bankName: 'Test Bank',
        bankCode: '058',
        accountNumber: '1234567890',
        accountName: 'Test Seeker',
      };

      it('creates the first account as the default automatically', async () => {
        (prisma.bankAccount.count as jest.Mock).mockResolvedValue(0);
        (prisma.bankAccount.create as jest.Mock).mockResolvedValue({ id: 'bank-1', ...dto, isDefault: true });

        const result = await service.createBankAccount('user-1', dto, mockUser as any);

        expect(result.isDefault).toBe(true);
        expect(prisma.bankAccount.create).toHaveBeenCalledWith({
          data: { userId: 'user-1', ...dto, isDefault: true },
        });
      });

      it('demotes the existing default when a later account is explicitly marked default', async () => {
        (prisma.bankAccount.count as jest.Mock).mockResolvedValue(1);
        (prisma.bankAccount.create as jest.Mock).mockResolvedValue({ id: 'bank-2', ...dto, isDefault: true });

        await service.createBankAccount('user-1', { ...dto, isDefault: true }, mockUser as any);

        expect(prisma.bankAccount.updateMany).toHaveBeenCalledWith({
          where: { userId: 'user-1', isDefault: true },
          data: { isDefault: false },
        });
      });

      it('does not demote the existing default when the new account is not marked default', async () => {
        (prisma.bankAccount.count as jest.Mock).mockResolvedValue(1);
        (prisma.bankAccount.create as jest.Mock).mockResolvedValue({ id: 'bank-2', ...dto, isDefault: false });

        await service.createBankAccount('user-1', dto, mockUser as any);

        expect(prisma.bankAccount.updateMany).not.toHaveBeenCalled();
        expect(prisma.bankAccount.create).toHaveBeenCalledWith({
          data: { userId: 'user-1', ...dto, isDefault: false },
        });
      });

      it('rejects once the user already has the maximum number of saved accounts', async () => {
        (prisma.bankAccount.count as jest.Mock).mockResolvedValue(3);

        await expect(
          service.createBankAccount('user-1', dto, mockUser as any)
        ).rejects.toThrow('You can save up to 3 bank accounts');

        expect(prisma.bankAccount.create).not.toHaveBeenCalled();
      });

      it('throws ForbiddenException when creating an account for another user', async () => {
        await expect(
          service.createBankAccount('other-user', dto, mockUser as any)
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('setDefaultBankAccount', () => {
      it('demotes the current default and promotes the requested account', async () => {
        (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'bank-2', userId: 'user-1' });

        const result = await service.setDefaultBankAccount('user-1', 'bank-2', mockUser as any);

        expect(result).toEqual({ message: 'Default bank account updated' });
        expect(prisma.bankAccount.updateMany).toHaveBeenCalledWith({
          where: { userId: 'user-1', isDefault: true },
          data: { isDefault: false },
        });
        expect(prisma.bankAccount.update).toHaveBeenCalledWith({
          where: { id: 'bank-2' },
          data: { isDefault: true },
        });
      });

      it('throws NotFoundException when the account does not belong to the requesting user', async () => {
        (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'bank-2', userId: 'someone-else' });

        await expect(
          service.setDefaultBankAccount('user-1', 'bank-2', mockUser as any)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteBankAccount', () => {
      it('deletes an account owned by the requesting user', async () => {
        (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'bank-1', userId: 'user-1' });
        (prisma.bankAccount.delete as jest.Mock).mockResolvedValue({});

        const result = await service.deleteBankAccount('user-1', 'bank-1', mockUser as any);

        expect(result).toEqual({ message: 'Bank account removed' });
        expect(prisma.bankAccount.delete).toHaveBeenCalledWith({ where: { id: 'bank-1' } });
      });

      it('throws NotFoundException when the account belongs to a different user', async () => {
        (prisma.bankAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'bank-1', userId: 'someone-else' });

        await expect(
          service.deleteBankAccount('user-1', 'bank-1', mockUser as any)
        ).rejects.toThrow(NotFoundException);
      });

      it('throws ForbiddenException when acting on another user’s account list', async () => {
        await expect(
          service.deleteBankAccount('other-user', 'bank-1', mockUser as any)
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('getPayoutSettings (VENDOR_BACKLOG.md VND-002)', () => {
    it('returns the minimum payout threshold from platform settings', async () => {
      (prisma.platformSettings.findUnique as jest.Mock).mockResolvedValueOnce({
        minPayoutThresholdNgn: 10000,
      });

      const result = await service.getPayoutSettings();

      expect(result).toEqual({ minPayoutThresholdNgn: 10000 });
    });

    it('defaults to 0 when platform settings do not exist yet', async () => {
      (prisma.platformSettings.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getPayoutSettings();

      expect(result).toEqual({ minPayoutThresholdNgn: 0 });
    });
  });

  describe('refundWithdrawalAmount (HUMAN_BACKLOG.md)', () => {
    it('credits the wallet back and cancels the held transaction', async () => {
      const withdrawal = { id: 'withdrawal-1', userId: 'user-1', amount: 5000, currency: 'NGN' };
      (prisma.withdrawalRequest.findUnique as jest.Mock).mockResolvedValue(withdrawal);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 5000,
        currency: 'NGN',
        locked: false,
      });
      (txClient.wallet.update as jest.Mock).mockResolvedValue({});
      (txClient.transaction.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.refundWithdrawalAmount('withdrawal-1');

      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { increment: 5000 } },
      });
      expect(txClient.transaction.updateMany).toHaveBeenCalledWith({
        where: { reference: 'withdrawal-1', status: TransactionStatus.PENDING },
        data: { status: TransactionStatus.CANCELLED },
      });
    });

    it('throws NotFoundException when the withdrawal request does not exist', async () => {
      (prisma.withdrawalRequest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.refundWithdrawalAmount('missing')).rejects.toThrow(
        'Withdrawal request not found'
      );
    });
  });
});
