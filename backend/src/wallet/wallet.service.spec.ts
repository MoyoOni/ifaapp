import { Test, TestingModule } from '@nestjs/testing';
import { Currency } from '@ile-ase/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../payments/currency.service';
import { NotificationService } from '../notifications/notification.service';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'CLIENT',
    verified: true,
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
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);
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
      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
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
    it('should create deposit transaction and update balance', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 5000,
        currency: 'NGN',
        locked: false,
      };

      const mockUpdatedWallet = {
        ...mockWallet,
        balance: 10000,
      };

      const mockTransaction = {
        id: 'txn-1',
        walletId: 'wallet-1',
        userId: 'user-1',
        type: 'DEPOSIT',
        amount: 5000,
        currency: 'NGN',
        status: 'COMPLETED',
        description: 'Bank transfer deposit',
        reference: 'ref-123',
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.wallet.update as jest.Mock).mockResolvedValue(mockUpdatedWallet);

      const depositDto = {
        amount: 5000,
        currency: Currency.NGN,
        description: 'Bank transfer deposit',
        reference: 'ref-123',
      };

      const result = await service.depositFunds('user-1', depositDto, mockUser);

      expect(result).toEqual({
        wallet: mockUpdatedWallet,
        transaction: mockTransaction,
      });

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          walletId: 'wallet-1',
          userId: 'user-1',
          type: 'DEPOSIT',
          amount: 5000,
          currency: 'NGN',
          status: 'COMPLETED',
          description: 'Deposit: 5000 NGN',
          reference: 'ref-123',
        },
      });

      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: {
          balance: { increment: 5000 },
        },
      });
    });
  });

  describe('createEscrow', () => {
    it('should create escrow and deduct from wallet balance', async () => {
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

      const mockUpdatedWallet = {
        ...mockWallet,
        balance: 5000,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.escrow.create as jest.Mock).mockResolvedValue(mockEscrow);
      (prisma.wallet.update as jest.Mock).mockResolvedValue(mockUpdatedWallet);
      (prisma.transaction.create as jest.Mock).mockResolvedValue({});

      const escrowDto = {
        recipientId: 'recipient-1',
        amount: 5000,
        type: 'BOOKING' as any,
        relatedId: 'booking-1',
        notes: 'Consultation booking',
      };

      const result = await service.createEscrow('user-1', escrowDto, mockUser);

      expect(result).toEqual(mockEscrow);

      expect(prisma.escrow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          walletId: 'wallet-1',
          userId: 'user-1',
          recipientId: 'recipient-1',
          amount: 5000,
          type: 'BOOKING',
          relatedId: 'booking-1',
          notes: 'Consultation booking',
        }),
      });

      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: {
          balance: { decrement: 5000 },
        },
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
    it('should release escrow and transfer funds to recipient', async () => {
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
      (prisma.escrow.update as jest.Mock).mockResolvedValue(mockUpdatedEscrow);
      (prisma.wallet.update as jest.Mock).mockResolvedValue({});
      (prisma.transaction.create as jest.Mock).mockResolvedValue({});

      const releaseDto = {
        escrowId: 'escrow-1',
      };

      const result = await service.releaseEscrow('user-1', releaseDto, mockUser);

      expect(result).toEqual(mockUpdatedEscrow);

      expect(prisma.escrow.update).toHaveBeenCalledWith({
        where: { id: 'escrow-1' },
        data: expect.objectContaining({
          status: 'RELEASED',
          releasedAt: expect.any(Date),
          releasedBy: 'user-1',
        }),
      });

      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-2' },
        data: {
          balance: { increment: 5000 },
        },
      });
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
        }
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
      expect(prisma.transaction.findMany).toHaveBeenCalled();
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
      expect(prisma.withdrawalRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          amount: 5000,
          currency: 'NGN',
          status: 'PENDING',
          bankAccount: '1234567890',
          bankName: 'Test Bank',
        }),
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