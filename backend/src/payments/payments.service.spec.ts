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
      create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
    },
    transaction: {
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    withdrawalRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    // VENDOR_BACKLOG.md VND-024
    digitalProductDownload: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  };

  const mockWalletService = {
    depositFunds: jest.fn(),
    recordRefundFromGateway: jest.fn(),
    refundWithdrawalAmount: jest.fn().mockResolvedValue(undefined),
    createEscrow: jest.fn().mockResolvedValue({ id: 'escrow-1' }),
    createExternallyFundedEscrow: jest.fn().mockResolvedValue({ id: 'escrow-1' }),
    // VENDOR_BACKLOG.md VND-024
    releaseEscrow: jest.fn().mockResolvedValue({}),
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
    createNotification: jest.fn().mockResolvedValue(undefined),
    notifyOrderPaid: jest.fn().mockResolvedValue(undefined),
    notifyVendorNewOrder: jest.fn().mockResolvedValue(undefined),
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
      // Payment-confirmation audit fix: no Payment row for WALLET_TOPUP --
      // that path's idempotency/outbox wiring lives entirely in
      // WalletService.depositFunds, untouched by this fix.
      expect(mockPrismaService.payment.create).not.toHaveBeenCalled();
    });

    it('creates a Payment row for MARKETPLACE_ORDER so the webhook can later route it correctly (payment-confirmation audit fix)', async () => {
      mockPaystackApi.initializeTransaction.mockResolvedValue({
        status: true,
        data: {
          authorization_url: 'https://paystack.com/checkout/456',
          access_code: '456',
          reference: 'order-ref-456',
        },
      });

      await service.initializePayment(
        'user-id',
        {
          amount: 5000,
          currency: Currency.NGN,
          purpose: PaymentPurpose.MARKETPLACE_ORDER,
          relatedId: 'order-1,order-2',
        } as any,
        'test@example.com',
        'Test User'
      );

      expect(mockPrismaService.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-id',
            transactionId: 'order-ref-456',
            purpose: PaymentPurpose.MARKETPLACE_ORDER,
            status: 'PENDING',
            metadata: expect.objectContaining({ relatedId: 'order-1,order-2' }),
          }),
        })
      );
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

    describe('MARKETPLACE_ORDER routing (payment-confirmation audit fix)', () => {
      const orderPayload = {
        event: 'charge.success',
        data: {
          reference: 'order-ref-1',
          amount: 500000,
          currency: 'NGN',
          metadata: { userId: 'user-id', purpose: PaymentPurpose.MARKETPLACE_ORDER, relatedId: 'order-1' },
        },
      };
      const mockPaymentRow = {
        id: 'payment-1',
        status: 'PENDING',
        userId: 'user-id',
        transactionId: 'order-ref-1',
        purpose: PaymentPurpose.MARKETPLACE_ORDER,
        metadata: { relatedId: 'order-1' },
      };
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-id',
        vendorId: 'vendor-1',
        totalAmount: 5000,
        currency: 'NGN',
        vendor: { userId: 'vendor-user-1', businessName: 'Ide Beads Shop' },
        customer: { name: 'Ade' },
        // VENDOR_BACKLOG.md VND-024
        items: [{ productId: 'product-1', product: { type: 'PHYSICAL', digitalFileKey: null, digitalFileUrl: null } }],
      };

      it('marks the order PAID and creates the vendor escrow instead of crediting the buyer wallet', async () => {
        // First lookup (by transactionId, in handlePaystackWebhook) sees the
        // still-PENDING row; second lookup (by id, inside
        // processSuccessfulPayment) sees it after the `success` update.
        mockPrismaService.payment.findUnique
          .mockResolvedValueOnce(mockPaymentRow)
          .mockResolvedValueOnce({ ...mockPaymentRow, status: 'success' });
        mockPrismaService.payment.update.mockResolvedValue({ ...mockPaymentRow, status: 'success' });
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

        const result = await service.handleWebhook(
          orderPayload,
          PaymentProvider.PAYSTACK,
          signPaystackPayload(orderPayload)
        );

        expect(result.success).toBe(true);
        expect(mockWalletService.depositFunds).not.toHaveBeenCalled();
        expect(mockPrismaService.order.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'order-1' },
            data: expect.objectContaining({ status: 'PAID' }),
          })
        );
        // VENDOR_BACKLOG.md VND-010 investigation: createEscrow() requires the
        // depositor's internal wallet balance, which is wrong for money that
        // arrived from an external Paystack charge -- must use the
        // externally-funded variant instead, or this silently never pays the
        // vendor (see createExternallyFundedEscrow's doc comment in wallet.service.ts).
        expect(mockWalletService.createExternallyFundedEscrow).toHaveBeenCalledWith(
          'user-id',
          expect.objectContaining({ recipientId: 'vendor-user-1', amount: 5000 })
        );
        expect(mockWalletService.createEscrow).not.toHaveBeenCalled();
        expect(mockNotificationService.notifyVendorNewOrder).toHaveBeenCalledWith(
          'vendor-user-1',
          'order-1',
          expect.anything()
        );
      });

      it('VENDOR_BACKLOG.md VND-024: grants a digital download and fast-tracks an all-digital order to DELIVERED with escrow released immediately', async () => {
        const digitalOrder = {
          ...mockOrder,
          items: [
            {
              productId: 'product-1',
              product: { type: 'DIGITAL', digitalFileKey: 'digital-products/vendor-1/file.pdf', digitalFileUrl: null },
            },
          ],
        };
        mockPrismaService.payment.findUnique
          .mockResolvedValueOnce(mockPaymentRow)
          .mockResolvedValueOnce({ ...mockPaymentRow, status: 'success' });
        mockPrismaService.payment.update.mockResolvedValue({ ...mockPaymentRow, status: 'success' });
        mockPrismaService.order.findUnique.mockResolvedValue(digitalOrder);

        await service.handleWebhook(orderPayload, PaymentProvider.PAYSTACK, signPaystackPayload(orderPayload));

        expect(mockPrismaService.digitalProductDownload.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { orderId_productId: { orderId: 'order-1', productId: 'product-1' } },
            create: expect.objectContaining({ orderId: 'order-1', productId: 'product-1', customerId: 'user-id' }),
          })
        );
        expect(mockPrismaService.order.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 'order-1' }, data: expect.objectContaining({ status: 'DELIVERED' }) })
        );
        expect(mockWalletService.releaseEscrow).toHaveBeenCalledWith(
          'vendor-user-1',
          expect.objectContaining({ escrowId: 'escrow-1', tier: 'FULL' }),
          expect.objectContaining({ id: 'vendor-user-1' })
        );
      });

      it('VENDOR_BACKLOG.md VND-024: does not fast-track a mixed physical+digital order to DELIVERED', async () => {
        const mixedOrder = {
          ...mockOrder,
          items: [
            { productId: 'product-1', product: { type: 'DIGITAL', digitalFileKey: 'key', digitalFileUrl: null } },
            { productId: 'product-2', product: { type: 'PHYSICAL', digitalFileKey: null, digitalFileUrl: null } },
          ],
        };
        mockPrismaService.payment.findUnique
          .mockResolvedValueOnce(mockPaymentRow)
          .mockResolvedValueOnce({ ...mockPaymentRow, status: 'success' });
        mockPrismaService.payment.update.mockResolvedValue({ ...mockPaymentRow, status: 'success' });
        mockPrismaService.order.findUnique.mockResolvedValue(mixedOrder);

        await service.handleWebhook(orderPayload, PaymentProvider.PAYSTACK, signPaystackPayload(orderPayload));

        // The digital item still gets its download grant...
        expect(mockPrismaService.digitalProductDownload.upsert).toHaveBeenCalled();
        // ...but the order is not force-delivered and escrow is not released early,
        // since the physical item still needs to actually ship.
        expect(mockPrismaService.order.update).not.toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'DELIVERED' }) })
        );
        expect(mockWalletService.releaseEscrow).not.toHaveBeenCalled();
      });

      it('does not reprocess an order payment on a replayed webhook delivery', async () => {
        mockPrismaService.payment.findUnique.mockResolvedValue({ ...mockPaymentRow, status: 'success' });

        const result = await service.handleWebhook(
          orderPayload,
          PaymentProvider.PAYSTACK,
          signPaystackPayload(orderPayload)
        );

        expect(result.success).toBe(true);
        expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
        expect(mockPrismaService.order.update).not.toHaveBeenCalled();
      });

      it('falls back to legacy wallet-deposit handling if no matching Payment row exists', async () => {
        mockPrismaService.payment.findUnique.mockResolvedValue(null);
        mockWalletService.depositFunds.mockResolvedValue({ transaction: { id: 'tx-1' } });

        await service.handleWebhook(orderPayload, PaymentProvider.PAYSTACK, signPaystackPayload(orderPayload));

        expect(mockWalletService.depositFunds).toHaveBeenCalled();
      });
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

    it('HUMAN_BACKLOG.md: transfer.success completes the held withdrawal transaction and marks it PROCESSED', async () => {
      mockPrismaService.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'withdrawal-1',
        userId: 'vendor-user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'PENDING',
      });
      const transferPayload = {
        event: 'transfer.success',
        data: { reference: 'withdrawal-1', transfer_code: 'TRF_123', status: 'success' },
      };

      const result = await service.handleWebhook(
        transferPayload,
        PaymentProvider.PAYSTACK,
        signPaystackPayload(transferPayload)
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.transaction.updateMany).toHaveBeenCalledWith({
        where: { reference: 'withdrawal-1', status: 'PENDING' },
        data: { status: 'COMPLETED' },
      });
      expect(mockPrismaService.withdrawalRequest.update).toHaveBeenCalledWith({
        where: { id: 'withdrawal-1' },
        data: { status: 'PROCESSED' },
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'vendor-user-1', title: 'Payout confirmed' })
      );
    });

    it('HUMAN_BACKLOG.md: does not re-notify or re-update on a repeated transfer.success delivery', async () => {
      mockPrismaService.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'withdrawal-1',
        userId: 'vendor-user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'PROCESSED', // already resolved by the first delivery
      });
      const transferPayload = {
        event: 'transfer.success',
        data: { reference: 'withdrawal-1', transfer_code: 'TRF_123', status: 'success' },
      };

      await service.handleWebhook(transferPayload, PaymentProvider.PAYSTACK, signPaystackPayload(transferPayload));

      expect(mockPrismaService.withdrawalRequest.update).not.toHaveBeenCalled();
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('HUMAN_BACKLOG.md: transfer.failed refunds the wallet hold and returns the withdrawal to PENDING', async () => {
      mockPrismaService.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'withdrawal-1',
        status: 'PROCESSED',
      });
      const transferPayload = {
        event: 'transfer.failed',
        data: { reference: 'withdrawal-1', transfer_code: 'TRF_123', status: 'failed' },
      };

      const result = await service.handleWebhook(
        transferPayload,
        PaymentProvider.PAYSTACK,
        signPaystackPayload(transferPayload)
      );

      expect(result.success).toBe(true);
      expect(mockWalletService.refundWithdrawalAmount).toHaveBeenCalledWith('withdrawal-1');
      expect(mockPrismaService.withdrawalRequest.update).toHaveBeenCalledWith({
        where: { id: 'withdrawal-1' },
        data: expect.objectContaining({ status: 'PENDING' }),
      });
    });

    it('HUMAN_BACKLOG.md: a repeated transfer.failed delivery is a no-op (idempotent) once already refunded', async () => {
      mockPrismaService.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'withdrawal-1',
        status: 'PENDING', // already reverted by the first delivery
      });
      const transferPayload = {
        event: 'transfer.failed',
        data: { reference: 'withdrawal-1', transfer_code: 'TRF_123', status: 'failed' },
      };

      await service.handleWebhook(
        transferPayload,
        PaymentProvider.PAYSTACK,
        signPaystackPayload(transferPayload)
      );

      expect(mockWalletService.refundWithdrawalAmount).not.toHaveBeenCalled();
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
