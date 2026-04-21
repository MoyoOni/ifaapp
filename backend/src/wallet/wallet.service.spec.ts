import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Currency, TransactionType, TransactionStatus } from '@ile-ase/common'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../payments/currency.service';
import { NotificationService } from '../notifications/notification.service';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;

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
              update: jest.fn(),
              findMany: jest.fn(),
              aggregate: jest.fn(),
            },
            withdrawalRequest: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            // $transaction executes the callback with the txClient
            $transaction: jest.fn((cb: (tx: typeof txClient) => Promise<any>) => cb(txClient)),
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
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);

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

      const result = await service.getWalletBalance('user-1');

      expect(result).toEqual({
        balance: 7500,
        currency: 'NGN',
        locked: false,
      });
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

    it('should reject deposit to another users wallet', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };

      await expect(
        service.depositFunds('user-1', depositDto, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject deposit to locked wallet', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        ...mockWallet,
        locked: true,
      });

      await expect(
        service.depositFunds('user-1', depositDto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing transaction for duplicate idempotency key', async () => {
      const existingTxn = { ...mockTransaction, wallet: mockWallet };
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(existingTxn);

      const result = await service.depositFunds(
        'user-1',
        depositDto,
        mockUser,
        'idem-key-123',
      );

      expect(result).toEqual({
        wallet: existingTxn.wallet,
        transaction: existingTxn,
      });
      // Should NOT call $transaction for duplicate
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should process new deposit with idempotency key', async () => {
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.depositFunds(
        'user-1',
        depositDto,
        mockUser,
        'new-idem-key',
      );

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
      (txClient.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 5000 });
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
      expect(txClient.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
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

      const escrowDto = {
        recipientId: 'recipient-1',
        amount: 5000,
        type: 'BOOKING' as any,
        relatedId: 'booking-1',
        notes: 'Consultation booking',
      };

      await expect(service.createEscrow('user-1', escrowDto, mockUser))
        .rejects.toThrow('Insufficient funds');
    });
  });

  describe('releaseEscrow', () => {
    it('should release escrow and transfer funds atomically', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        recipientId: 'recipient-1',
        amount: 5000,
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
      (txClient.escrow.update as jest.Mock).mockResolvedValue({ ...mockEscrow, status: 'CANCELLED' });

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

      await expect(
        service.cancelEscrow('user-1', 'escrow-1', mockUser as any),
      ).rejects.toThrow(ForbiddenException);
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

      const result = await service.getWalletBalance('user-1');

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
        mockUser as any,
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

  describe('createWithdrawalRequest', () => {
    it('should create withdrawal request', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 10000,
        currency: 'NGN',
        locked: false,
      };

      const mockWithdrawalRequest = {
        id: 'withdrawal-1',
        userId: 'user-1',
        walletId: 'wallet-1',
        amount: 5000,
        currency: 'NGN',
        status: 'PENDING',
        bankAccount: '1234567890',
        bankName: 'Test Bank',
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.escrow.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });
      (prisma.withdrawalRequest.create as jest.Mock).mockResolvedValue(mockWithdrawalRequest);

      const withdrawalDto = {
        amount: 5000,
        currency: Currency.NGN,
        bankAccount: '1234567890',
        bankName: 'Test Bank',
      };

      const result = await service.createWithdrawalRequest('user-1', withdrawalDto, mockUser as any);

      expect(result).toEqual(mockWithdrawalRequest);
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
      (prisma.escrow.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });

      const withdrawalDto = {
        amount: 5000,
        currency: Currency.NGN,
        bankAccount: '1234567890',
        bankName: 'Test Bank',
      };

      await expect(service.createWithdrawalRequest('user-1', withdrawalDto, mockUser as any))
        .rejects.toThrow('Insufficient available balance');
    });
  });
});
