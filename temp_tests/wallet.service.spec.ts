import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../payments/currency.service';
import { NotificationService } from '../notifications/notification.service';
import { WalletService } from './wallet.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { Currency } from '@ile-ase/common';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

jest.mock('../prisma/prisma.service');
jest.mock('../payments/currency.service');
jest.mock('../notifications/notification.service');

describe('WalletService', () => {
  let service: WalletService;
  let prismaService: PrismaService;
  let currencyService: CurrencyService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        PrismaService,
        CurrencyService,
        NotificationService,
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);
    currencyService = module.get<CurrencyService>(CurrencyService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateWallet', () => {
    it('should create a new wallet if one does not exist', async () => {
      const userId = 'user-123';
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: 0,
        currency: Currency.NGN,
        locked: false,
      };

      jest.spyOn(prismaService['wallet'], 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService['wallet'], 'create').mockResolvedValue(mockWallet);

      const result = await service.getOrCreateWallet(userId);

      expect(result).toEqual(mockWallet);
      expect(prismaService['wallet'].findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService['wallet'].create).toHaveBeenCalledWith({
        data: {
          userId,
          balance: 0,
          currency: Currency.NGN,
        },
      });
    });

    it('should return existing wallet if one exists', async () => {
      const userId = 'user-123';
      const mockExistingWallet = {
        id: 'wallet-123',
        userId,
        balance: 1000,
        currency: Currency.NGN,
        locked: false,
      };

      jest.spyOn(prismaService['wallet'], 'findUnique').mockResolvedValue(mockExistingWallet);

      const result = await service.getOrCreateWallet(userId);

      expect(result).toEqual(mockExistingWallet);
      expect(prismaService['wallet'].findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance', async () => {
      const userId = 'user-123';
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: 5000,
        currency: Currency.NGN,
        locked: false,
      };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(mockWallet);

      const result = await service.getWalletBalance(userId);

      expect(result).toEqual({
        balance: mockWallet.balance,
        currency: mockWallet.currency,
        locked: mockWallet.locked,
      });
    });
  });

  describe('depositFunds', () => {
    const userId = 'user-123';
    const currentUser = { id: userId, role: 'CLIENT' } as any;
    const depositDto: CreateDepositDto = {
      amount: 1000,
      currency: Currency.NGN,
      reference: 'ref-123',
      description: 'Test deposit',
    };

    it('should deposit funds to wallet', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: 0,
        currency: Currency.NGN,
        locked: false,
      };

      const mockTransaction = {
        id: 'tx-123',
        walletId: 'wallet-123',
        userId,
        type: 'DEPOSIT',
        amount: depositDto.amount,
        currency: depositDto.currency,
        status: 'COMPLETED',
        description: `Deposit: ${depositDto.amount} ${depositDto.currency}`,
        reference: depositDto.reference,
      };

      const mockUpdatedWallet = {
        ...mockWallet,
        balance: depositDto.amount,
      };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(mockWallet);
      jest.spyOn(prismaService['transaction'], 'create').mockResolvedValue(mockTransaction);
      jest.spyOn(prismaService['wallet'], 'update').mockResolvedValue(mockUpdatedWallet);

      const result = await service.depositFunds(userId, depositDto, currentUser);

      expect(result).toEqual({
        wallet: mockUpdatedWallet,
        transaction: mockTransaction,
      });
      expect(prismaService['wallet'].update).toHaveBeenCalledWith({
        where: { id: mockWallet.id },
        data: {
          balance: {
            increment: depositDto.amount,
          },
        },
      });
    });

    it('should throw ForbiddenException if user tries to deposit to another users wallet', async () => {
      const otherUserId = 'user-456';
      const otherUser = { id: otherUserId, role: 'CLIENT' } as any;

      await expect(service.depositFunds(userId, depositDto, otherUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if wallet is locked', async () => {
      const lockedWallet = {
        id: 'wallet-123',
        userId,
        balance: 0,
        currency: Currency.NGN,
        locked: true,
      };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(lockedWallet);

      await expect(service.depositFunds(userId, depositDto, currentUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordRefundFromGateway', () => {
    const userId = 'user-123';
    const amount = 500;
    const currency = Currency.NGN;
    const reference = 'ref-123';
    const metadata = { reason: 'cancelled' };

    it('should record a refund from gateway and decrement balance', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: 1000,
        currency,
        locked: false,
      };

      const mockTransaction = {
        id: 'tx-456',
        walletId: 'wallet-123',
        userId,
        type: 'REFUND',
        amount,
        currency,
        status: 'COMPLETED',
        description: `Refund to payment source: ${amount} ${currency}`,
        reference,
        metadata,
      };

      const mockUpdatedWallet = {
        ...mockWallet,
        balance: mockWallet.balance - amount,
      };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(mockWallet);
      jest.spyOn(prismaService['wallet'], 'update').mockResolvedValue(mockUpdatedWallet);
      jest.spyOn(prismaService['transaction'], 'create').mockResolvedValue(mockTransaction);

      const result = await service.recordRefundFromGateway(userId, amount, currency, reference, metadata);

      expect(result).toEqual({
        wallet: mockUpdatedWallet,
        transaction: mockTransaction,
      });
      expect(prismaService['wallet'].update).toHaveBeenCalledWith({
        where: { id: mockWallet.id },
        data: { balance: { decrement: amount } },
      });
      expect(prismaService['transaction'].create).toHaveBeenCalledWith({
        data: {
          walletId: mockWallet.id,
          userId,
          type: 'REFUND',
          amount,
          currency,
          status: 'COMPLETED',
          description: `Refund to payment source: ${amount} ${currency}`,
          reference,
          metadata,
        },
      });
    });

    it('should allow refund even if balance is less than refund amount', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: 100, // Less than refund amount
        currency,
        locked: false,
      };

      const mockTransaction = {
        id: 'tx-456',
        walletId: 'wallet-123',
        userId,
        type: 'REFUND',
        amount,
        currency,
        status: 'COMPLETED',
        description: `Refund to payment source: ${amount} ${currency}`,
        reference,
        metadata,
      };

      const mockUpdatedWallet = {
        ...mockWallet,
        balance: mockWallet.balance - amount, // Will be negative
      };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(mockWallet);
      jest.spyOn(prismaService['wallet'], 'update').mockResolvedValue(mockUpdatedWallet);
      jest.spyOn(prismaService['transaction'], 'create').mockResolvedValue(mockTransaction);

      const result = await service.recordRefundFromGateway(userId, amount, currency, reference, metadata);

      expect(result).toEqual({
        wallet: mockUpdatedWallet,
        transaction: mockTransaction,
      });
    });

    it('should throw BadRequestException if wallet is locked', async () => {
      const lockedWallet = {
        id: 'wallet-123',
        userId,
        balance: 1000,
        currency,
        locked: true,
      };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(lockedWallet);

      await expect(
        service.recordRefundFromGateway(userId, amount, currency, reference, metadata)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactions', () => {
    const userId = 'user-123';
    const currentUser = { id: userId, role: 'CLIENT' } as any;
    const mockWallet = { id: 'wallet-123', userId, balance: 1000, currency: Currency.NGN, locked: false };
    const mockTransactions = [
      {
        id: 'tx-1',
        walletId: 'wallet-123',
        userId,
        type: 'DEPOSIT',
        amount: 1000,
        currency: Currency.NGN,
        status: 'COMPLETED',
        description: 'Test transaction',
        reference: 'ref-1',
      }
    ];

    it('should return transactions for the user', async () => {
      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(mockWallet);
      jest.spyOn(prismaService['transaction'], 'findMany').mockResolvedValue(mockTransactions);
      jest.spyOn(prismaService['transaction'], 'count').mockResolvedValue(1);

      const filters = { limit: 10, offset: 0 };
      const result = await service.getTransactions(userId, filters, currentUser);

      expect(result).toEqual({
        transactions: mockTransactions,
        total: 1,
        limit: 10,
        offset: 0,
      });
    });

    it('should throw ForbiddenException if user does not match current user', async () => {
      const otherUser = { id: 'other-user', role: 'CLIENT' } as any;

      await expect(service.getTransactions(userId, {}, otherUser)).rejects.toThrow(ForbiddenException);
    });
  });
});