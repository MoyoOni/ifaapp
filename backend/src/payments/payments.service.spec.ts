import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService, PaymentProvider } from './payments.service';
import { PaystackApiService } from './paystack-api.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LocationService } from './location.service';
import { CurrencyService } from './currency.service';
import { NotificationService } from '../notifications/notification.service';
import { Currency, PaymentPurpose } from '@ile-ase/common';

const mockPaystackApi = {
  isConfigured: jest.fn().mockReturnValue(true),
  initializeTransaction: jest.fn(),
  verifyTransaction: jest.fn(),
  createRefund: jest.fn(),
};

jest.mock('flutterwave-node-v3', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      Payment: {
        initialize: jest.fn(),
      },
      Transaction: {
        verify: jest.fn(),
      },
      Refund: {
        create: jest.fn(),
      },
    })),
  };
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let walletService: WalletService;
  let locationService: LocationService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'PAYSTACK_SECRET_KEY') return 'paystack-secret';
      if (key === 'FLUTTERWAVE_PUBLIC_KEY') return 'fw-public';
      if (key === 'FLUTTERWAVE_SECRET_KEY') return 'fw-secret';
      if (key === 'FLUTTERWAVE_SECRET_HASH') return 'fw-hash';
      return null;
    }),
  };

  const mockPrismaService = {
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockWalletService = {
    depositFunds: jest.fn(),
    recordRefundFromGateway: jest.fn(),
  };

  const mockLocationService = {
    getUserCountry: jest.fn().mockResolvedValue('NG'),
    getProviderForCountry: jest.fn().mockReturnValue('PAYSTACK'),
  };

  const mockCurrencyService = {
    convertAmount: jest.fn(),
    getSupportedCurrencies: jest.fn(),
  };

  const mockNotificationService = {
    notifyOrderUpdate: jest.fn(),
    notifyPaymentReceived: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPaystackApi.isConfigured.mockReturnValue(true);
    mockPaystackApi.initializeTransaction.mockReset();
    mockPaystackApi.verifyTransaction.mockReset();
    mockPaystackApi.createRefund.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaystackApiService, useValue: mockPaystackApi },
        { provide: WalletService, useValue: mockWalletService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: CurrencyService, useValue: mockCurrencyService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
    walletService = module.get<WalletService>(WalletService);
    locationService = module.get<LocationService>(LocationService);
  });

  describe('initializePayment', () => {
    it('should initialize Paystack payment for NGN in Nigeria', async () => {
      mockLocationService.getProviderForCountry.mockReturnValue('PAYSTACK');

      mockPaystackApi.initializeTransaction.mockResolvedValue({
        status: true,
        data: {
          authorization_url: 'https://paystack.com/checkout/123',
          access_code: '123',
          reference: 'ref-123',
        },
      });

      const result = await service.initializePayment(
        'user-id',
        { amount: 1000, currency: Currency.NGN, purpose: PaymentPurpose.WALLET_TOPUP },
        'test@example.com',
        'Test User'
      );

      expect(result.provider).toBe(PaymentProvider.PAYSTACK);
      expect(result.authorizationUrl).toBeDefined();
      expect(mockPaystackApi.initializeTransaction).toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    it('should verify Paystack payment', async () => {
      mockPaystackApi.verifyTransaction.mockResolvedValue({
        status: true,
        data: {
          status: 'success',
          amount: 100000, // kobo
          currency: 'NGN',
          reference: 'ref-123',
          metadata: { userId: 'user-id' },
          customer: { email: 'test@example.com' },
          paid_at: new Date(),
        },
      });

      const result = await service.verifyPayment('ref-123', PaymentProvider.PAYSTACK);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(1000); // Converted from kobo
      expect(result.provider).toBe(PaymentProvider.PAYSTACK);
    });
  });

  describe('handleWebhook', () => {
    it('should process Paystack success webhook', async () => {
      const payload = {
        event: 'charge.success',
        data: {
          reference: 'ref-123',
          amount: 500000,
          currency: 'NGN',
          metadata: { userId: 'user-id' },
        },
      };

      mockWalletService.depositFunds.mockResolvedValue({ transaction: { id: 'tx-1' } });

      const result = await service.handleWebhook(payload, PaymentProvider.PAYSTACK);

      expect(result.success).toBe(true);
      expect(mockWalletService.depositFunds).toHaveBeenCalledWith('user-id', expect.objectContaining({
        amount: 5000,
        currency: Currency.NGN,
      }));
    });
  });

  describe('refundPayment', () => {
    const mockTransaction = {
      id: 'tx-1',
      userId: 'user-1',
      amount: 10000,
      currency: 'NGN',
      reference: 'ref-123',
      type: 'DEPOSIT',
      status: 'COMPLETED',
      createdAt: new Date(),
    };

    const baseTestCases = [
      {
        reason: 'BABALAWO_CANCELLED',
        expectedAmount: 10000,
        mockResponse: (amount: number) => ({
          status: true,
          data: {
            transaction: {
              reference: 'ref-123',
              amount: amount * 100, // Paystack returns in kobo
            },
          },
        }),
      },
      {
        reason: 'SERVICE_NOT_COMPLETED',
        expectedAmount: 10000,
        mockResponse: (amount: number) => ({
          status: true,
          data: {
            transaction: {
              reference: 'ref-123',
              amount: amount * 100,
            },
          },
        }),
      },
      {
        reason: 'DISPUTE_RESOLUTION',
        expectedAmount: 10000,
        mockResponse: (amount: number) => ({
          status: true,
          data: {
            transaction: {
              reference: 'ref-123',
              amount: amount * 100,
            },
          },
        }),
      },
      {
        reason: 'TECHNICAL_ISSUE',
        expectedAmount: 10000,
        mockResponse: (amount: number) => ({
          status: true,
          data: {
            transaction: {
              reference: 'ref-123',
              amount: amount * 100,
            },
          },
        }),
      },
      {
        reason: 'USER_CANCELLED',
        expectedAmount: 5000,
        mockResponse: (amount: number) => ({
          status: true,
          data: {
            transaction: {
              reference: 'ref-123',
              amount: amount * 100,
            },
          },
        }),
      },
    ];

    // Run tests for each refund reason
    baseTestCases.forEach(({ reason, expectedAmount, mockResponse }) => {
      it(`should handle refund for ${reason}`, async () => {
        mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);

        mockPaystackApi.createRefund.mockResolvedValue(mockResponse(expectedAmount));

        mockWalletService.recordRefundFromGateway.mockResolvedValue({ id: `refund-tx-${reason}` });

        const result = await service.refundPayment(
          'ref-123',
          undefined,
          PaymentProvider.PAYSTACK,
          reason,
          'user-1'
        );

        expect(result.success).toBe(true);
        expect(result.amount).toBe(expectedAmount);
        expect(mockWalletService.recordRefundFromGateway).toHaveBeenCalledWith(
          'user-1',
          expectedAmount,
          Currency.NGN,
          'ref-123',
          expect.objectContaining({
            cancellationReason: reason,
          })
        );
      });
    });

    it('should handle partial refund with custom amount', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);

      mockPaystackApi.createRefund.mockResolvedValue({
        status: true,
        data: {
          transaction: {
            reference: 'ref-123',
            amount: 300000, // Custom amount in kobo
          },
        },
      });

      mockWalletService.recordRefundFromGateway.mockResolvedValue({ id: 'refund-tx-6' });

      const result = await service.refundPayment(
        'ref-123',
        3000, // Custom partial refund
        PaymentProvider.PAYSTACK,
        undefined,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.amount).toBe(3000);
    });

    it('should refund via Flutterwave', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        reference: 'ILEASE_123',
      });

      const flutterwaveClient = (service as any).flutterwaveClient;
      flutterwaveClient.Refund.create.mockResolvedValue({
        status: 'success',
        data: {
          tx_ref: 'ILEASE_123',
          amount: 10000,
        },
      });

      mockWalletService.recordRefundFromGateway.mockResolvedValue({ id: 'refund-tx-7' });

      const result = await service.refundPayment(
        'ILEASE_123',
        undefined,
        PaymentProvider.FLUTTERWAVE,
        'BABALAWO_CANCELLED',
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe(PaymentProvider.FLUTTERWAVE);
      expect(result.amount).toBe(10000);
    });

    it('should handle refund failure gracefully', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);

      mockPaystackApi.createRefund.mockResolvedValue({
        status: false,
        message: 'Refund failed',
      });

      await expect(
        service.refundPayment('ref-123', undefined, PaymentProvider.PAYSTACK, undefined, 'user-1')
      ).rejects.toThrow();
    });

    it('should warn if original transaction not found but refund succeeds', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      mockPaystackApi.createRefund.mockResolvedValue({
        status: true,
        data: {
          transaction: {
            reference: 'ref-999',
            amount: 1000000,
          },
        },
      });

      const loggerSpy = jest.spyOn((service as any).logger, 'warn');

      const result = await service.refundPayment(
        'ref-999',
        10000,
        PaymentProvider.PAYSTACK,
        undefined,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('no DEPOSIT transaction found')
      );
      expect(mockWalletService.recordRefundFromGateway).not.toHaveBeenCalled();
    });

    it('should auto-detect provider from reference format', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        reference: 'ILEASE_AUTO',
      });

      const flutterwaveClient = (service as any).flutterwaveClient;
      flutterwaveClient.Refund.create.mockResolvedValue({
        status: 'success',
        data: {
          tx_ref: 'ILEASE_AUTO',
          amount: 10000,
        },
      });

      mockWalletService.recordRefundFromGateway.mockResolvedValue({ id: 'refund-tx-8' });

      const result = await service.refundPayment(
        'ILEASE_AUTO',
        undefined,
        undefined, // No provider specified
        'BABALAWO_CANCELLED',
        'user-1'
      );

      expect(result.provider).toBe(PaymentProvider.FLUTTERWAVE);
      expect(flutterwaveClient.Refund.create).toHaveBeenCalled();
    });

    it('should handle refund for transaction with different currency', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        currency: 'USD',
        amount: 100, // $1.00
      });

      mockPaystackApi.createRefund.mockResolvedValue({
        status: true,
        data: {
          transaction: {
            reference: 'ref-123',
            amount: 10000, // $1.00 in cents
          },
        },
      });

      mockWalletService.recordRefundFromGateway.mockResolvedValue({ id: 'refund-tx-9' });

      const result = await service.refundPayment(
        'ref-123',
        undefined,
        PaymentProvider.PAYSTACK,
        'BABALAWO_CANCELLED',
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.amount).toBe(100); // Should be $1.00
      expect(mockWalletService.recordRefundFromGateway).toHaveBeenCalledWith(
        'user-1',
        100,
        'USD',
        'ref-123',
        expect.objectContaining({
          cancellationReason: 'BABALAWO_CANCELLED',
        })
      );
    });

    it('should handle refund for transaction with different currency via Flutterwave', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        reference: 'ILEASE_456',
        currency: 'USD',
        amount: 100, // $1.00
      });

      const flutterwaveClient = (service as any).flutterwaveClient;
      flutterwaveClient.Refund.create.mockResolvedValue({
        status: 'success',
        data: {
          tx_ref: 'ILEASE_456',
          amount: 100, // $1.00
        },
      });

      mockWalletService.recordRefundFromGateway.mockResolvedValue({ id: 'refund-tx-10' });

      const result = await service.refundPayment(
        'ILEASE_456',
        undefined,
        PaymentProvider.FLUTTERWAVE,
        'BABALAWO_CANCELLED',
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe(PaymentProvider.FLUTTERWAVE);
      expect(result.amount).toBe(100); // Should be $1.00
      expect(mockWalletService.recordRefundFromGateway).toHaveBeenCalledWith(
        'user-1',
        100,
        'USD',
        'ILEASE_456',
        expect.objectContaining({
          cancellationReason: 'BABALAWO_CANCELLED',
        })
      );
    });

    it('should handle multiple refunds for the same transaction', async () => {
      // First refund
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        amount: 10000,
        refundCount: 0,
      });

      mockPaystackApi.createRefund.mockResolvedValueOnce({
        status: true,
        data: {
          transaction: {
            reference: 'ref-123',
            amount: 500000, // 50% of 10000 in kobo
          },
        },
      });

      mockWalletService.recordRefundFromGateway.mockResolvedValueOnce({ id: 'refund-tx-11' });

      const result1 = await service.refundPayment(
        'ref-123',
        5000, // 50% of 10000
        PaymentProvider.PAYSTACK,
        'USER_CANCELLED',
        'user-1'
      );

      expect(result1.success).toBe(true);
      expect(result1.amount).toBe(5000);

      // Second refund
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        amount: 10000,
        refundCount: 1,
      });

      mockPaystackApi.createRefund.mockResolvedValueOnce({
        status: true,
        data: {
          transaction: {
            reference: 'ref-123',
            amount: 300000, // Additional 3000 in kobo
          },
        },
      });

      mockWalletService.recordRefundFromGateway.mockResolvedValueOnce({ id: 'refund-tx-12' });

      const result2 = await service.refundPayment(
        'ref-123',
        3000, // Additional refund
        PaymentProvider.PAYSTACK,
        'USER_CANCELLED',
        'user-1'
      );

      expect(result2.success).toBe(true);
      expect(result2.amount).toBe(3000);

      // Wallet recordRefundFromGateway called for each refund
      expect(mockWalletService.recordRefundFromGateway).toHaveBeenCalledTimes(2);
    });

    it('should pass through refund amount to Paystack (validation is gateway responsibility)', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        amount: 10000,
      });

      mockPaystackApi.createRefund.mockResolvedValue({
        status: true,
        data: {
          transaction: {
            reference: 'ref-123',
            amount: 500000, // partial in kobo
          },
        },
      });

      const result = await service.refundPayment(
        'ref-123',
        5000,
        PaymentProvider.PAYSTACK,
        undefined,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(mockPaystackApi.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: 'ref-123', amount: 500000 })
      );
    });
  });
});

