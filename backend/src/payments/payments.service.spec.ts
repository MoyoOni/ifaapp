import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentsService, PaymentProvider } from './payments.service';
import { PaystackApiService } from './paystack-api.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LocationService } from './location.service';
import { CurrencyService } from './currency.service';
import { NotificationService } from '../notifications/notification.service';
import { Currency, PaymentPurpose } from '@ile-ase/common';

const PAYSTACK_TEST_SECRET = 'paystack-secret';
const FLUTTERWAVE_TEST_HASH = 'fw-hash';

function signPaystackPayload(payload: unknown): string {
  return crypto
    .createHmac('sha512', PAYSTACK_TEST_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

const mockPaystackApi = {
  isConfigured: jest.fn().mockReturnValue(true),
  initializeTransaction: jest.fn(),
  verifyTransaction: jest.fn(),
  createRefund: jest.fn(),
};

jest.mock('flutterwave-node-v3', () => {
  return jest.fn().mockImplementation(() => ({
    Payment: {
      initialize: jest.fn(),
    },
    Transaction: {
      verify: jest.fn(),
    },
    Refund: {
      create: jest.fn(),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;

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
      findMany: jest.fn(),
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
    // No prior refunds by default (EMG-05 cap check) — tests exercising
    // multi-step partial refunds override this per-call.
    mockPrismaService.transaction.findMany.mockResolvedValue([]);

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
    const payload = {
      event: 'charge.success',
      data: {
        reference: 'ref-123',
        amount: 500000,
        currency: 'NGN',
        metadata: { userId: 'user-id' },
      },
    };

    it('should process Paystack success webhook when the signature is valid (EMG-02)', async () => {
      mockWalletService.depositFunds.mockResolvedValue({ transaction: { id: 'tx-1' } });

      const result = await service.handleWebhook(
        payload,
        PaymentProvider.PAYSTACK,
        signPaystackPayload(payload)
      );

      expect(result.success).toBe(true);
      expect(mockWalletService.depositFunds).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({
          amount: 5000,
          currency: Currency.NGN,
        }),
        undefined,
        'paystack:ref-123',
        expect.objectContaining({ eventType: 'PAYMENT_RECEIVED' })
      );
    });

    it('does not re-notify or re-mark a replayed Paystack webhook that was already processed (EMG-03)', async () => {
      // depositFunds' own idempotency check found an existing, already-processed
      // transaction (webhookReceived: true) — this simulates a Paystack retry.
      mockWalletService.depositFunds.mockResolvedValue({
        transaction: { id: 'tx-1', webhookReceived: true },
      });

      const result = await service.handleWebhook(
        payload,
        PaymentProvider.PAYSTACK,
        signPaystackPayload(payload)
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.transaction.update).not.toHaveBeenCalled();
      expect(mockNotificationService.notifyPaymentReceived).not.toHaveBeenCalled();
    });

    it('rejects a Paystack webhook with no signature header instead of skipping verification (EMG-02)', async () => {
      await expect(service.handleWebhook(payload, PaymentProvider.PAYSTACK)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockWalletService.depositFunds).not.toHaveBeenCalled();
    });

    it('rejects a Paystack webhook with an incorrect signature', async () => {
      await expect(
        service.handleWebhook(payload, PaymentProvider.PAYSTACK, 'forged-signature')
      ).rejects.toThrow(UnauthorizedException);

      expect(mockWalletService.depositFunds).not.toHaveBeenCalled();
    });

    it('rejects a Paystack webhook outright if PAYSTACK_SECRET_KEY is not configured', async () => {
      mockConfigService.get.mockImplementationOnce((key: string) =>
        key === 'PAYSTACK_SECRET_KEY' ? null : 'fw-hash'
      );

      await expect(
        service.handleWebhook(payload, PaymentProvider.PAYSTACK, signPaystackPayload(payload))
      ).rejects.toThrow(UnauthorizedException);

      expect(mockWalletService.depositFunds).not.toHaveBeenCalled();
    });

    it('processes a Flutterwave success webhook when the verif-hash header matches', async () => {
      const fwPayload = {
        event: 'charge.completed',
        data: {
          status: 'successful',
          tx_ref: 'ref-456',
          amount: 5000,
          currency: 'NGN',
          meta: { userId: 'user-id' },
        },
      };
      mockWalletService.depositFunds.mockResolvedValue({ transaction: { id: 'tx-2' } });

      const result = await service.handleWebhook(
        fwPayload,
        PaymentProvider.FLUTTERWAVE,
        FLUTTERWAVE_TEST_HASH
      );

      expect(result.success).toBe(true);
      expect(mockWalletService.depositFunds).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({ amount: 5000, currency: Currency.NGN }),
        undefined,
        'flutterwave:ref-456',
        expect.objectContaining({ eventType: 'PAYMENT_RECEIVED' })
      );
    });

    it('does not re-notify a replayed Flutterwave webhook that was already processed (EMG-03)', async () => {
      const fwPayload = {
        event: 'charge.completed',
        data: {
          status: 'successful',
          tx_ref: 'ref-456',
          amount: 5000,
          currency: 'NGN',
          meta: { userId: 'user-id' },
        },
      };
      mockWalletService.depositFunds.mockResolvedValue({
        transaction: { id: 'tx-2', webhookReceived: true },
      });

      const result = await service.handleWebhook(
        fwPayload,
        PaymentProvider.FLUTTERWAVE,
        FLUTTERWAVE_TEST_HASH
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.transaction.update).not.toHaveBeenCalled();
      expect(mockNotificationService.notifyPaymentReceived).not.toHaveBeenCalled();
    });

    it('rejects a Flutterwave webhook with no verif-hash header instead of skipping verification (EMG-02)', async () => {
      const fwPayload = {
        event: 'charge.completed',
        data: {
          status: 'successful',
          tx_ref: 'ref-456',
          amount: 5000,
          currency: 'NGN',
          meta: { userId: 'user-id' },
        },
      };

      await expect(service.handleWebhook(fwPayload, PaymentProvider.FLUTTERWAVE)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockWalletService.depositFunds).not.toHaveBeenCalled();
    });

    it('rejects a Flutterwave webhook outright if FLUTTERWAVE_SECRET_HASH is not configured', async () => {
      const fwPayload = {
        event: 'charge.completed',
        data: {
          status: 'successful',
          tx_ref: 'ref-456',
          amount: 5000,
          currency: 'NGN',
          meta: { userId: 'user-id' },
        },
      };
      mockConfigService.get.mockImplementationOnce((key: string) =>
        key === 'FLUTTERWAVE_SECRET_HASH' ? null : 'paystack-secret'
      );

      await expect(
        service.handleWebhook(fwPayload, PaymentProvider.FLUTTERWAVE, FLUTTERWAVE_TEST_HASH)
      ).rejects.toThrow(UnauthorizedException);

      expect(mockWalletService.depositFunds).not.toHaveBeenCalled();
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
    // Owns `mockTransaction` above (userId: 'user-1') — satisfies the EMG-05
    // ownership check so existing legitimate-refund test cases keep passing.
    const owningUser = { id: 'user-1', role: 'CLIENT' } as any;

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
          owningUser
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
        owningUser
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
        owningUser
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
        service.refundPayment('ref-123', undefined, PaymentProvider.PAYSTACK, undefined, owningUser)
      ).rejects.toThrow();
    });

    it('rejects a refund when no matching payment reference exists (EMG-05)', async () => {
      // Previously: an unmatched reference still succeeded at the gateway and
      // only logged a warning — meaning any Paystack reference string could be
      // refunded with zero record it belonged to anyone. Now it's rejected
      // outright before the gateway is ever called.
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.refundPayment('ref-999', 10000, PaymentProvider.PAYSTACK, undefined, owningUser)
      ).rejects.toThrow(BadRequestException);

      expect(mockPaystackApi.createRefund).not.toHaveBeenCalled();
      expect(mockWalletService.recordRefundFromGateway).not.toHaveBeenCalled();
    });

    it("rejects a refund attempt against another user's payment (EMG-05)", async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction); // owned by 'user-1'
      const attacker = { id: 'attacker-user', role: 'CLIENT' } as any;

      await expect(
        service.refundPayment('ref-123', undefined, PaymentProvider.PAYSTACK, undefined, attacker)
      ).rejects.toThrow(ForbiddenException);

      expect(mockPaystackApi.createRefund).not.toHaveBeenCalled();
    });

    it('allows an ADMIN to refund a payment they do not own', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      const admin = { id: 'admin-user', role: 'ADMIN' } as any;
      mockPaystackApi.createRefund.mockResolvedValue({
        status: true,
        data: { transaction: { reference: 'ref-123', amount: 1000000 } },
      });
      mockWalletService.recordRefundFromGateway.mockResolvedValue({ id: 'refund-tx-admin' });

      const result = await service.refundPayment(
        'ref-123',
        undefined,
        PaymentProvider.PAYSTACK,
        undefined,
        admin
      );

      expect(result.success).toBe(true);
    });

    it('rejects a refund amount that exceeds the original transaction amount (EMG-05)', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction); // amount: 10000

      await expect(
        service.refundPayment('ref-123', 15000, PaymentProvider.PAYSTACK, undefined, owningUser)
      ).rejects.toThrow(BadRequestException);

      expect(mockPaystackApi.createRefund).not.toHaveBeenCalled();
    });

    it('rejects a second refund that would push the cumulative total over the original amount (EMG-05)', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction); // amount: 10000
      // 8000 already refunded against this reference
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { id: 'refund-1', reference: 'ref-123', type: 'REFUND', amount: 8000 },
      ]);

      await expect(
        service.refundPayment('ref-123', 5000, PaymentProvider.PAYSTACK, undefined, owningUser)
      ).rejects.toThrow(BadRequestException);

      expect(mockPaystackApi.createRefund).not.toHaveBeenCalled();
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
        owningUser
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
        owningUser
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
        owningUser
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

    it('should handle multiple partial refunds for the same transaction (cumulative cap allows it — EMG-05)', async () => {
      // First refund — nothing refunded yet, 5000 of 10000 is within bounds
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        amount: 10000,
        refundCount: 0,
      });
      mockPrismaService.transaction.findMany.mockResolvedValueOnce([]);

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
        owningUser
      );

      expect(result1.success).toBe(true);
      expect(result1.amount).toBe(5000);

      // Second refund — 5000 already refunded, this one adds 3000 (8000 total,
      // still within the original 10000 — must be allowed, not treated as a
      // duplicate/idempotent replay).
      mockPrismaService.transaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        amount: 10000,
        refundCount: 1,
      });
      mockPrismaService.transaction.findMany.mockResolvedValueOnce([
        { id: 'refund-tx-11', reference: 'ref-123', type: 'REFUND', amount: 5000 },
      ]);

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
        owningUser
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
        owningUser
      );

      expect(result.success).toBe(true);
      expect(mockPaystackApi.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: 'ref-123', amount: 500000 })
      );
    });
  });
});
