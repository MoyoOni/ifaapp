import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
  HttpException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ReleaseTier } from '../wallet/dto/release-escrow.dto';
import { LocationService } from './location.service';
import { CurrencyService } from './currency.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { Currency, PaymentPurpose, EscrowType, TransactionStatus, WithdrawalStatus } from '@ile-ase/common';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Payment } from '../shared/types/prisma-models';
// flutterwave-node-v3 is CJS-only without esModuleInterop configured; `import Flutterwave
// from` would risk a runtime interop mismatch for a payment SDK client, so require() stays
// here deliberately.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Flutterwave = require('flutterwave-node-v3');
import { NotificationService, NotificationType, NotificationCategory } from '../notifications/notification.service';
import { PaystackApiService } from './paystack-api.service';
import {
  PaymentWebhookPayload,
  PaystackWebhookPayload,
  FlutterwaveWebhookPayload,
} from './types/webhook-payloads';

/**
 * Payment Gateway Provider Enum
 */
export enum PaymentProvider {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
}

/**
 * Payment Service
 * Abstraction layer for Paystack and Flutterwave payment gateways
 * NOTE: Paystack for Nigeria, Flutterwave for African diaspora
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private flutterwaveClient: any;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private paystackApi: PaystackApiService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private locationService: LocationService,
    private currencyService: CurrencyService,
    private notificationService: NotificationService
  ) {
    // Initialize Flutterwave
    const flutterwavePublicKey = this.configService.get<string>('FLUTTERWAVE_PUBLIC_KEY');
    const flutterwaveSecretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
    if (flutterwavePublicKey && flutterwaveSecretKey) {
      this.flutterwaveClient = new Flutterwave(flutterwavePublicKey, flutterwaveSecretKey);
    }
  }

  /**
   * Determine payment provider based on currency, user location, and preference
   */
  private async determineProvider(
    currency: Currency,
    userId: string,
    preferredProvider?: PaymentProvider,
    ipAddress?: string
  ): Promise<PaymentProvider> {
    // User preference override (if provided)
    if (preferredProvider) {
      return preferredProvider;
    }

    // Get user country
    const countryCode = await this.locationService.getUserCountry(userId, ipAddress);

    // Use location service to determine provider
    const provider = this.locationService.getProviderForCountry(countryCode, currency);

    return provider === 'PAYSTACK' ? PaymentProvider.PAYSTACK : PaymentProvider.FLUTTERWAVE;
  }

  /**
   * Initialize payment
   */
  async initializePayment(
    userId: string,
    dto: InitializePaymentDto,
    userEmail: string,
    userName: string,
    ipAddress?: string,
    preferredProvider?: PaymentProvider,
    convertToCurrency?: Currency
  ) {
    let paymentAmount = dto.amount;
    let paymentCurrency = dto.currency;
    let conversionInfo = null;

    // Handle currency conversion if requested
    if (convertToCurrency && convertToCurrency !== dto.currency) {
      const conversion = await this.currencyService.convertAmount(
        dto.amount,
        dto.currency,
        convertToCurrency,
        true // Include fees
      );

      paymentAmount = conversion.convertedAmount;
      paymentCurrency = convertToCurrency;
      conversionInfo = {
        originalAmount: dto.amount,
        originalCurrency: dto.currency,
        convertedAmount: conversion.convertedAmount,
        convertedCurrency: convertToCurrency,
        rate: conversion.rate,
        fees: conversion.fees,
      };
    }

    const provider = await this.determineProvider(
      paymentCurrency,
      userId,
      preferredProvider,
      ipAddress
    );

    // Convert amount to kobo (Paystack) or smallest unit
    const amountInSmallestUnit =
      paymentCurrency === Currency.NGN
        ? Math.round(paymentAmount * 100) // Kobo for NGN
        : Math.round(paymentAmount * 100); // Cents for other currencies

    const metadata = {
      userId,
      purpose: dto.purpose,
      relatedId: dto.relatedId,
      ...(dto.metadata ? JSON.parse(dto.metadata) : {}),
    };

    try {
      let paymentResult;
      if (provider === PaymentProvider.PAYSTACK) {
        paymentResult = await this.initializePaystackPayment(
          amountInSmallestUnit,
          paymentCurrency,
          userEmail || dto.email || '',
          userName || dto.name || '',
          metadata,
          dto.callbackUrl
        );
      } else {
        paymentResult = await this.initializeFlutterwavePayment(
          amountInSmallestUnit,
          paymentCurrency,
          userEmail || dto.email || '',
          userName || dto.name || '',
          metadata,
          dto.callbackUrl
        );
      }

      // VENDOR_BACKLOG.md VND-004 (payment-confirmation audit): previously no
      // `Payment` row was ever created for a real gateway-initiated payment
      // at all -- `processSuccessfulPayment`'s purpose-based routing
      // (WALLET_TOPUP/BOOKING/MARKETPLACE_ORDER/COURSE_ENROLLMENT) existed
      // but was only reachable via the admin-only `manuallyVerifyPayment`,
      // never from a live webhook. Scoped to MARKETPLACE_ORDER here (the
      // specific, confirmed bug: a card-paid marketplace order was never
      // actually marked PAID, it just silently credited the buyer's wallet
      // instead) rather than also touching BOOKING/COURSE_ENROLLMENT, which
      // haven't been verified broken and aren't part of what was reported.
      if (dto.purpose === PaymentPurpose.MARKETPLACE_ORDER) {
        await this.prisma.payment.create({
          data: {
            userId,
            transactionId: paymentResult.reference,
            amount: paymentAmount,
            currency: paymentCurrency,
            purpose: dto.purpose,
            provider: provider === PaymentProvider.PAYSTACK ? 'PAYSTACK' : 'FLUTTERWAVE',
            status: 'PENDING',
            metadata,
          },
        });
      }

      // Include conversion info in response if applicable
      if (conversionInfo) {
        return {
          ...paymentResult,
          conversion: conversionInfo,
        };
      }

      return paymentResult;
    } catch (error) {
      this.logger.error(
        `Payment initialization failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new InternalServerErrorException('Failed to initialize payment');
    }
  }

  /**
   * Initialize Paystack payment
   */
  private async initializePaystackPayment(
    amount: number,
    currency: Currency,
    email: string,
    name: string,
    metadata: any,
    callbackUrl?: string
  ) {
    if (!this.paystackApi.isConfigured()) {
      throw new BadRequestException('Paystack is not configured');
    }

    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const callback = callbackUrl || `${baseUrl}/payment/callback`;

    const response = await this.paystackApi.initializeTransaction({
      amount,
      email,
      currency: currency as string,
      callback_url: callback,
      metadata,
    });

    if (!response.status) {
      throw new BadRequestException(response.message || 'Failed to initialize payment');
    }

    return {
      provider: PaymentProvider.PAYSTACK,
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code,
      reference: response.data.reference,
    };
  }

  /**
   * Initialize Flutterwave payment
   */
  private async initializeFlutterwavePayment(
    amount: number,
    currency: Currency,
    email: string,
    name: string,
    metadata: any,
    callbackUrl?: string
  ) {
    if (!this.flutterwaveClient) {
      throw new BadRequestException('Flutterwave is not configured');
    }

    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const callback = callbackUrl || `${baseUrl}/payment/callback`;

    const payload = {
      tx_ref: `ILEASE_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount: amount / 100, // Flutterwave expects amount in main currency unit
      currency: currency,
      redirect_url: callback,
      customer: {
        email,
        name,
      },
      meta: metadata,
    };

    const response = await this.flutterwaveClient.Payment.initialize(payload);

    if (response.status !== 'success') {
      throw new BadRequestException(response.message || 'Failed to initialize payment');
    }

    return {
      provider: PaymentProvider.FLUTTERWAVE,
      authorizationUrl: response.data.link,
      reference: payload.tx_ref,
    };
  }

  /**
   * Verify payment
   */
  /**
   * HUMAN_BACKLOG.md: the withdrawal form needs real bank codes (not free-text
   * bank names) to actually be able to pay someone via Paystack Transfer.
   */
  async listBanks() {
    const response = await this.paystackApi.listBanks();
    if (!response.status) {
      throw new Error(response.message || 'Failed to fetch bank list from Paystack');
    }
    return response.data.filter((bank) => bank.active);
  }

  async verifyPayment(reference: string, provider?: PaymentProvider) {
    // Try to determine provider from reference format
    if (!provider) {
      provider = reference.startsWith('ILEASE_')
        ? PaymentProvider.FLUTTERWAVE
        : PaymentProvider.PAYSTACK;
    }

    try {
      if (provider === PaymentProvider.PAYSTACK) {
        return await this.verifyPaystackPayment(reference);
      } else {
        return await this.verifyFlutterwavePayment(reference);
      }
    } catch (error) {
      this.logger.error(
        `Payment verification failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  /**
   * Verify Paystack payment
   */
  private async verifyPaystackPayment(reference: string) {
    if (!this.paystackApi.isConfigured()) {
      throw new BadRequestException('Paystack is not configured');
    }

    const response = await this.paystackApi.verifyTransaction(reference);

    if (!response.status) {
      throw new BadRequestException(response.message || 'Payment verification failed');
    }

    const transaction = response.data;
    const customer = transaction.customer;

    return {
      provider: PaymentProvider.PAYSTACK,
      success: transaction.status === 'success',
      amount: transaction.amount / 100, // Convert from kobo
      currency: transaction.currency,
      reference: transaction.reference,
      metadata: transaction.metadata,
      customer: {
        email: customer?.email,
        name: customer
          ? [customer.first_name, customer.last_name].filter(Boolean).join(' ')
          : undefined,
      },
      paidAt: transaction.paid_at,
    };
  }

  /**
   * Verify Flutterwave payment
   */
  private async verifyFlutterwavePayment(reference: string) {
    if (!this.flutterwaveClient) {
      throw new BadRequestException('Flutterwave is not configured');
    }

    const response = await this.flutterwaveClient.Transaction.verify({ tx_ref: reference });

    if (response.status !== 'success') {
      throw new BadRequestException(response.message || 'Payment verification failed');
    }

    const transaction = response.data[0];

    return {
      provider: PaymentProvider.FLUTTERWAVE,
      success: transaction.status === 'successful',
      amount: transaction.amount,
      currency: transaction.currency,
      reference: transaction.tx_ref,
      metadata: transaction.meta,
      customer: {
        email: transaction.customer?.email,
        name: transaction.customer?.name,
      },
      paidAt: transaction.created_at,
    };
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(
    payload: PaymentWebhookPayload,
    provider: PaymentProvider,
    signature?: string
  ) {
    try {
      // The `provider` param (set by which controller route received the
      // request — see payments.controller.ts) is the actual discriminant
      // here, not anything inspectable on `payload` itself, so TypeScript
      // can't narrow the union automatically between these two branches.
      if (provider === PaymentProvider.PAYSTACK) {
        return await this.handlePaystackWebhook(payload as PaystackWebhookPayload, signature);
      } else {
        return await this.handleFlutterwaveWebhook(payload as FlutterwaveWebhookPayload, signature);
      }
    } catch (error) {
      // Preserve the real status (e.g. 401 for a bad/missing signature) instead of
      // masking auth failures as a generic 500 — EMG-02.
      if (error instanceof HttpException) {
        if (error instanceof UnauthorizedException) {
          this.logger.warn(`Webhook rejected: ${(error as Error).message}`);
        } else {
          this.logger.error(
            `Webhook handling failed: ${(error as Error).message}`,
            (error as Error).stack
          );
        }
        throw error;
      }
      this.logger.error(
        `Webhook handling failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }

  /**
   * Constant-time comparison of two webhook signature strings.
   * Guards against timing attacks and avoids `crypto.timingSafeEqual`
   * throwing on mismatched buffer lengths (EMG-02).
   */
  private timingSafeCompare(expected: string, actual: string): boolean {
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const actualBuffer = Buffer.from(actual, 'utf8');
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  /**
   * Handle Paystack webhook
   */
  private async handlePaystackWebhook(payload: PaystackWebhookPayload, signature?: string) {
    // Verify webhook signature — mandatory, no bypass (EMG-02).
    // A missing signature header used to skip verification entirely; a forged
    // `charge.success` payload with no header was trusted outright.
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      this.logger.error('PAYSTACK_SECRET_KEY is not configured — refusing to process webhook');
      throw new UnauthorizedException('Webhook processing is not configured');
    }
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const expectedHash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    if (!this.timingSafeCompare(expectedHash, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      // Process successful payment
      const metadata = data.metadata;
      const userId = metadata?.userId;
      const reference = data.reference;

      // VENDOR_BACKLOG.md VND-004 (payment-confirmation audit): a
      // MARKETPLACE_ORDER payment must mark the order(s) PAID and create the
      // vendor escrow -- NOT be credited to the buyer's wallet, which is
      // what every charge.success used to do unconditionally regardless of
      // `metadata.purpose`. Routed via the `Payment` row created at
      // initialize time (see `initializePayment`) so this reuses the
      // already-written, purpose-aware `processSuccessfulPayment` dispatch
      // instead of duplicating order-completion logic here.
      if (metadata?.purpose === PaymentPurpose.MARKETPLACE_ORDER && reference) {
        const payment = await this.prisma.payment.findUnique({ where: { transactionId: reference } });
        if (payment) {
          if (payment.status !== 'success') {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'success', verified: true, verifiedAt: new Date() },
            });
            await this.processSuccessfulPayment(payment.id);
          } else {
            this.logger.log(`Paystack webhook replay for reference ${reference} — order payment already processed, skipping`);
          }
          return { success: true, reference, amount: data.amount / 100, currency: data.currency };
        }
        this.logger.warn(`No Payment record found for MARKETPLACE_ORDER reference ${reference} -- falling back to legacy handling`);
      }

      if (userId) {
        const amountDecimal = data.amount / 100; // Convert from kobo
        const currency = data.currency as Currency;

        // Credit wallet (no currentUser for webhook calls). Keyed by an
        // idempotency key derived from the gateway reference (EMG-03) so a
        // Paystack retry-on-non-2xx, or a replayed payload, returns the
        // already-processed transaction instead of crediting the wallet twice.
        // The "payment received" notification is now written as an outbox
        // event in the SAME transaction as the balance credit (P1-01) instead
        // of being sent here as a separate, unprotected, fire-and-forget call
        // — depositFunds only reaches its transaction body (and therefore
        // only writes the outbox row) on a genuinely new deposit, never on an
        // idempotent replay, so this can't double-notify either.
        const result = await this.walletService.depositFunds(
          userId,
          {
            amount: amountDecimal,
            currency,
            reference,
          },
          undefined,
          reference ? `paystack:${reference}` : undefined,
          {
            eventType: 'PAYMENT_RECEIVED',
            payload: { userId, amount: amountDecimal, currency, reference },
          }
        );

        // If depositFunds returned an already-processed transaction (idempotent
        // replay — EMG-03), skip re-marking it; only a genuinely new deposit
        // reaches this branch.
        if (result.transaction && !result.transaction.webhookReceived) {
          await this.prisma.transaction.update({
            where: { id: result.transaction.id },
            data: {
              webhookReceived: true,
              webhookReceivedAt: new Date(),
            },
          });
        } else if (result.transaction) {
          this.logger.log(
            `Paystack webhook replay for reference ${reference} — deposit already processed, skipping`
          );
        }
      }

      return {
        success: true,
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
      };
    }

    // HUMAN_BACKLOG.md: withdrawal transfers can complete asynchronously --
    // AdminFinanceService.processWithdrawal already resolves the common case
    // where Paystack's /transfer response itself says 'success' immediately,
    // but a 'pending' transfer only gets a final answer via this webhook.
    // `reference` is the WithdrawalRequest id (set at initiateTransfer time).
    if (event === 'transfer.success' || event === 'transfer.failed' || event === 'transfer.reversed') {
      const reference = data.reference;
      if (!reference) {
        return { success: false, message: 'Transfer webhook missing reference' };
      }

      const withdrawal = await this.prisma.withdrawalRequest.findUnique({ where: { id: reference } });

      if (event === 'transfer.success') {
        // Idempotency guard mirrors the failure branch below -- a repeated
        // webhook delivery after this already ran sees the row is no longer
        // in a resolvable state and no-ops instead of double-notifying.
        if (withdrawal && withdrawal.status !== WithdrawalStatus.PROCESSED) {
          await this.prisma.transaction.updateMany({
            where: { reference, status: TransactionStatus.PENDING },
            data: { status: TransactionStatus.COMPLETED },
          });
          await this.prisma.withdrawalRequest.update({
            where: { id: reference },
            data: { status: WithdrawalStatus.PROCESSED },
          });
          // VENDOR_BACKLOG.md VND-002: "push/email notification when status
          // changes at each stage" -- this is the final "Confirmed" stage of
          // the payout tracker, distinct from the earlier "Approved" one
          // (AdminFinanceService.processWithdrawal already notifies then).
          this.notificationService
            .createNotification({
              userId: withdrawal.userId,
              type: NotificationType.SYSTEM,
              category: NotificationCategory.INFO,
              title: 'Payout confirmed',
              message: `Your withdrawal of ${Number(withdrawal.amount).toLocaleString()} ${withdrawal.currency} has been confirmed as delivered to your bank account.`,
              sendEmail: true,
            })
            .catch(() => undefined);
        }
      } else {
        // transfer.failed / transfer.reversed -- Paystack accepted the
        // transfer at initiation time but it didn't actually complete.
        // Idempotency guard: only refund if still PROCESSED (a second
        // webhook delivery for the same event sees PENDING and no-ops).
        if (withdrawal && withdrawal.status === WithdrawalStatus.PROCESSED) {
          await this.walletService.refundWithdrawalAmount(reference);
          await this.prisma.withdrawalRequest.update({
            where: { id: reference },
            data: {
              status: WithdrawalStatus.PENDING,
              adminNotes: `Paystack ${event} — funds returned automatically, needs re-approval`,
            },
          });
          this.notificationService
            .createNotification({
              userId: withdrawal.userId,
              type: NotificationType.SYSTEM,
              category: NotificationCategory.WARNING,
              title: 'Payout could not be completed',
              message: `Your withdrawal of ${Number(withdrawal.amount).toLocaleString()} ${withdrawal.currency} could not be delivered. The funds have been returned to your wallet and an admin will review it.`,
              sendEmail: true,
            })
            .catch(() => undefined);
        }
      }

      return { success: true, event };
    }

    return { success: false, message: 'Event not processed' };
  }

  /**
   * Handle Flutterwave webhook
   */
  private async handleFlutterwaveWebhook(payload: FlutterwaveWebhookPayload, signature?: string) {
    // Verify webhook signature — mandatory, no bypass (EMG-02).
    // Previously this only checked `if (signature && secretHash)`, so an unset
    // FLUTTERWAVE_SECRET_HASH silently allowed every request through unverified.
    const secretHash = this.configService.get<string>('FLUTTERWAVE_SECRET_HASH');
    if (!secretHash) {
      this.logger.error('FLUTTERWAVE_SECRET_HASH is not configured — refusing to process webhook');
      throw new UnauthorizedException('Webhook processing is not configured');
    }
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    if (!this.timingSafeCompare(secretHash, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.completed' && data.status === 'successful') {
      // Process successful payment
      const metadata = data.meta;
      const userId = metadata?.userId;

      if (userId) {
        const amount = data.amount;
        const currency = data.currency as Currency;
        const reference = data.tx_ref;

        // Credit wallet (no currentUser for webhook calls). Keyed by an
        // idempotency key derived from the gateway reference (EMG-03) — see
        // the matching comment in handlePaystackWebhook. The "payment
        // received" notification is written as an outbox event in the same
        // transaction as the balance credit (P1-01) rather than sent here as
        // a separate, unprotected call — see the matching comment there too.
        const result = await this.walletService.depositFunds(
          userId,
          {
            amount,
            currency,
            reference,
          },
          undefined,
          reference ? `flutterwave:${reference}` : undefined,
          {
            eventType: 'PAYMENT_RECEIVED',
            payload: { userId, amount, currency, reference },
          }
        );

        if (result.transaction && !result.transaction.webhookReceived) {
          await this.prisma.transaction.update({
            where: { id: result.transaction.id },
            data: {
              webhookReceived: true,
              webhookReceivedAt: new Date(),
            },
          });
        } else if (result.transaction) {
          this.logger.log(
            `Flutterwave webhook replay for reference ${reference} — deposit already processed, skipping`
          );
        }
      }

      return {
        success: true,
        reference: data.tx_ref,
        amount: data.amount,
        currency: data.currency,
      };
    }

    return { success: false, message: 'Event not processed' };
  }

  /**
   * Refund payment with policy enforcement
   */
  async refundPayment(
    reference: string,
    amount?: number,
    provider?: PaymentProvider,
    cancellationReason?: string,
    currentUser?: CurrentUserPayload
  ) {
    // Try to determine provider from reference format
    if (!provider) {
      provider = reference.startsWith('ILEASE_')
        ? PaymentProvider.FLUTTERWAVE
        : PaymentProvider.PAYSTACK;
    }

    // EMG-05: look up and authorize against the original transaction BEFORE
    // touching the gateway — a refund is irreversible once the gateway call
    // succeeds. Previously there was no ownership check at all (any
    // authenticated user could refund any other user's payment reference),
    // and this same lookup only happened *after* the money had already moved,
    // used solely to update the wallet ledger.
    const originalTx = await this.prisma.transaction.findFirst({
      where: { reference, type: 'DEPOSIT' },
      orderBy: { createdAt: 'desc' },
    });

    if (!originalTx) {
      throw new BadRequestException('No matching payment found for this reference');
    }

    if (currentUser && currentUser.id !== originalTx.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only refund your own payments');
    }

    // Cap the refund at what's actually left to refund (EMG-05): sums every
    // REFUND transaction already recorded against this reference so neither an
    // explicit client-supplied `amount` nor a retried/duplicate refund request
    // can push the cumulative refunded total above what was ever paid. This
    // still allows legitimate multi-step partial refunds.
    const priorRefunds = await this.prisma.transaction.findMany({
      where: { reference, type: 'REFUND' },
    });
    const alreadyRefunded = priorRefunds.reduce((sum, tx) => sum + Number(tx.amount), 0);
    // Transaction.amount is now Decimal (ProBacklog-v1.md item #15) --
    // normalized once here since the refund math below is plain number math.
    const originalTxAmount = Number(originalTx.amount);

    // Apply refund policy based on cancellation reason
    let refundAmount = amount;
    if (cancellationReason && !amount) {
      refundAmount = this.calculateRefundAmount(originalTxAmount, cancellationReason);
    }
    refundAmount = refundAmount ?? originalTxAmount - alreadyRefunded;

    if (alreadyRefunded + refundAmount > originalTxAmount) {
      throw new BadRequestException(
        `Refund amount exceeds remaining refundable balance (already refunded ${alreadyRefunded} of ${originalTxAmount})`
      );
    }

    try {
      const result =
        provider === PaymentProvider.PAYSTACK
          ? await this.refundPaystackPayment(reference, refundAmount)
          : await this.refundFlutterwavePayment(reference, refundAmount);

      // Update wallet: decrement balance and record REFUND transaction (PB-206.1)
      const currency = (originalTx.currency as Currency) || Currency.NGN;
      await this.walletService.recordRefundFromGateway(
        originalTx.userId,
        result.amount,
        currency,
        reference,
        {
          cancellationReason: cancellationReason ?? undefined,
          provider,
        }
      );

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Refund failed: ${(error as any).message}`, (error as any).stack);
      throw new InternalServerErrorException('Refund processing failed');
    }
  }

  /**
   * Calculate refund amount based on policy
   */
  private calculateRefundAmount(originalAmount: number, cancellationReason: string): number {
    // 100% refund if Babalawo cancels
    if (cancellationReason === 'BABALAWO_CANCELLED') {
      return originalAmount;
    }

    // 50% refund if user cancels post-booking
    if (cancellationReason === 'USER_CANCELLED') {
      return originalAmount * 0.5;
    }

    // 100% refund for service not completed or dispute resolution
    if (
      cancellationReason === 'SERVICE_NOT_COMPLETED' ||
      cancellationReason === 'DISPUTE_RESOLUTION'
    ) {
      return originalAmount;
    }

    // 100% refund for technical issues
    if (cancellationReason === 'TECHNICAL_ISSUE') {
      return originalAmount;
    }

    // Default: 50% refund for other reasons
    return originalAmount * 0.5;
  }

  /**
   * Refund Paystack payment
   */
  private async refundPaystackPayment(reference: string, amount?: number) {
    if (!this.paystackApi.isConfigured()) {
      throw new BadRequestException('Paystack is not configured');
    }

    const payload: { transaction: string; amount?: number } = { transaction: reference };
    if (amount != null) {
      payload.amount = Math.round(amount * 100); // Convert to kobo
    }

    const response = await this.paystackApi.createRefund(payload);

    if (!response.status) {
      throw new BadRequestException(response.message || 'Refund failed');
    }

    return {
      provider: PaymentProvider.PAYSTACK,
      success: true,
      reference: response.data.transaction.reference,
      amount: response.data.transaction.amount / 100,
    };
  }

  /**
   * Refund Flutterwave payment
   */
  private async refundFlutterwavePayment(reference: string, amount?: number) {
    if (!this.flutterwaveClient) {
      throw new BadRequestException('Flutterwave is not configured');
    }

    const payload: any = { tx_ref: reference };
    if (amount) {
      payload.amount = amount;
    }

    const response = await this.flutterwaveClient.Refund.create(payload);

    if (response.status !== 'success') {
      throw new BadRequestException(response.message || 'Refund failed');
    }

    return {
      provider: PaymentProvider.FLUTTERWAVE,
      success: true,
      reference: response.data.tx_ref,
      amount: response.data.amount,
    };
  }

  /**
   * Get currency conversion rates
   */
  async getCurrencyRates(baseCurrency?: Currency): Promise<any> {
    return this.currencyService.getSupportedCurrencies(baseCurrency || Currency.NGN);
  }

  /**
   * Convert currency amount
   */
  async convertCurrencyAmount(
    amount: number,
    from: Currency,
    to: Currency,
    includeFees: boolean = false
  ): Promise<any> {
    return this.currencyService.convertAmount(amount, from, to, includeFees);
  }

  /**
   * Get unverified payments within the last X hours
   */
  async getUnverifiedPayments(hours: number = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return this.prisma.payment.findMany({
      where: {
        verified: false,
        createdAt: {
          gte: cutoffTime,
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Manually verify a payment
   */
  async manuallyVerifyPayment(transactionId: string, verifiedById: string) {
    // Find the payment record
    const payment = await this.prisma.payment.findUnique({
      where: {
        transactionId,
      },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Update the payment as verified
    const updatedPayment = await this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: verifiedById,
      },
    });

    // Process the payment if successful
    if (updatedPayment.status === 'success') {
      await this.processSuccessfulPayment(updatedPayment.id);
    }

    return updatedPayment;
  }

  /**
   * Process a successful payment - update balances, send notifications, etc.
   */
  async processSuccessfulPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
      },
    });

    if (!payment || payment.status !== 'success') {
      throw new BadRequestException('Payment not found or not successful');
    }

    // Payment.amount is now Decimal (ProBacklog-v1.md item #15) -- converted
    // once here since everything downstream (DTOs, the shared Payment mirror
    // type in shared/types/prisma-models.ts) still expects a plain number.
    const paymentAmount = Number(payment.amount);

    // Depending on the purpose of the payment, perform different actions
    switch (payment.purpose) {
      case PaymentPurpose.WALLET_TOPUP:
        // Add funds to user's wallet using the proper method
        const depositData = {
          amount: paymentAmount,
          currency: payment.currency as Currency,
          reference: payment.transactionId,
          description: 'Wallet top-up via payment gateway',
        };
        await this.walletService.depositFunds(payment.userId, depositData);
        break;

      case PaymentPurpose.BOOKING:
        const appointmentId = (payment.metadata as any)?.relatedId;
        if (appointmentId) {
          const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
              babalawo: true,
            },
          });
          if (appointment) {
            await this.prisma.appointment.update({
              where: { id: appointmentId },
              data: { status: 'SCHEDULED' },
            });
            await this.walletService.createEscrow(
              payment.userId,
              {
                recipientId: appointment.babalawo.id,
                amount: paymentAmount,
                currency: payment.currency as Currency,
                type: EscrowType.BOOKING,
                relatedId: appointmentId,
                notes: `Consultation with ${appointment.babalawo.name}`,
              },
              { id: payment.userId, role: 'CLIENT' } as CurrentUserPayload
            );
          }
        }
        break;

      case PaymentPurpose.MARKETPLACE_ORDER:
        // Handle marketplace order payment
        await this.processMarketplaceOrderPayment({ ...payment, amount: paymentAmount });
        break;

      case PaymentPurpose.COURSE_ENROLLMENT:
        const enrollmentId = (payment.metadata as any)?.relatedId;
        if (enrollmentId) {
          await this.prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: 'ACTIVE' },
          });
        }
        break;

      case PaymentPurpose.GUIDANCE_PLAN:
        // Guidance plans are already handled via prescription approval flow
        break;

      default:
        break;
    }

    // Send notification to user
    // Implementation would depend on your notification system
  }

  /**
   * Process marketplace order payment
   * Updates order status to PAID and creates escrow for vendor
   */
  private async processMarketplaceOrderPayment(payment: Payment) {
    // relatedId is stored in metadata for multi-vendor orders
    const metadata = payment.metadata as any;
    const orderIds = metadata?.relatedId?.split(',').filter(Boolean) || [];

    if (orderIds.length === 0) {
      this.logger.warn(`No order IDs found for payment ${payment.id}`);
      return;
    }

    for (const orderId of orderIds) {
      try {
        // Find the order
        const order = await this.prisma.order.findUnique({
          where: { id: orderId.trim() },
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
            customer: true,
            // VENDOR_BACKLOG.md VND-024
            items: { include: { product: true } },
          },
        });

        if (!order) {
          this.logger.warn(`Order ${orderId} not found for payment ${payment.id}`);
          continue;
        }

        // Calculate order amount (may differ from payment if multi-vendor split)
        // Order.totalAmount is now Decimal (ProBacklog-v1.md item #15) --
        // createExternallyFundedEscrow's DTO expects a plain number.
        const orderAmount = Number(order.totalAmount);

        // Update order status to PAID
        await this.prisma.order.update({
          where: { id: orderId.trim() },
          data: {
            status: 'PAID',
            paymentId: payment.transactionId,
            paidAt: new Date(),
          },
        });

        // Create escrow for the vendor
        // Uses 50/50 release tiers: 50% when shipped, 50% when delivered
        const escrowData = {
          recipientId: order.vendor.userId,
          amount: orderAmount,
          currency: order.currency as Currency,
          type: EscrowType.ORDER,
          relatedId: orderId.trim(),
          notes: `Marketplace order #${orderId.slice(0, 8)} - Escrow hold`,
          releaseTiers: {
            tier1: 0.5, // Released when order shipped
            tier2: 0.5, // Released when order delivered
          },
        };

        // VENDOR_BACKLOG.md VND-010 investigation: this money came from an
        // external Paystack charge, never from order.customerId's internal
        // wallet balance -- createEscrow() would require that balance to
        // already hold `orderAmount` and throw "Insufficient funds" on
        // every real order (a fresh wallet defaults to 0), silently
        // swallowed by the catch below, leaving the vendor never paid.
        const escrow = await this.walletService.createExternallyFundedEscrow(order.customerId, escrowData);

        this.logger.log(
          `Marketplace order ${orderId} marked as PAID. Escrow created for vendor ${order.vendor.userId}`
        );

        // VENDOR_BACKLOG.md VND-024: "No shipping required -- instant
        // delivery." Grants a 30-day/5-download window for every DIGITAL
        // item that actually has a file configured -- inlined here (not
        // calling MarketplaceService.grantDigitalDownloadsForOrder, which
        // has the same logic) to avoid a new PaymentsModule <-> Marketplace
        // Module import cycle (WalletModule already imports PaymentsModule,
        // and MarketplaceModule already forwardRef's WalletModule).
        const digitalItems = order.items.filter((i) => i.product.type === 'DIGITAL');
        const allDigital = order.items.length > 0 && order.items.every((i) => i.product.type === 'DIGITAL');
        for (const item of digitalItems) {
          if (!item.product.digitalFileKey && !item.product.digitalFileUrl) continue;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          await this.prisma.digitalProductDownload
            .upsert({
              where: { orderId_productId: { orderId: orderId.trim(), productId: item.productId } },
              create: { orderId: orderId.trim(), productId: item.productId, customerId: order.customerId, expiresAt },
              update: {},
            })
            .catch((err: Error) => this.logger.warn(`Digital download grant failed for order ${orderId}: ${err.message}`));
        }

        // A pure-digital order has no shipping step for the existing
        // SHIPPED/DELIVERED escrow-release tiers to gate on -- without this,
        // its escrow would sit in HOLD forever (nothing would ever call
        // updateOrder to advance a digital order's status). Delivery is
        // instant, so the full escrow releases immediately too.
        if (allDigital) {
          await this.prisma.order.update({
            where: { id: orderId.trim() },
            data: { status: 'DELIVERED', deliveredAt: new Date() },
          });
          await this.walletService.releaseEscrow(
            order.vendor.userId,
            { escrowId: escrow.id, tier: ReleaseTier.FULL },
            { id: order.vendor.userId, role: 'VENDOR' } as CurrentUserPayload
          );
          this.logger.log(`Marketplace order ${orderId} is all-digital -- marked DELIVERED and escrow released immediately`);
        }

        // Send notifications
        // Notify customer that payment was confirmed
        await this.notificationService.notifyOrderPaid(order.customerId, orderId, {
          vendorName: order.vendor.businessName,
          totalAmount: orderAmount,
          currency: order.currency,
        });

        // Notify vendor of new paid order
        await this.notificationService.notifyVendorNewOrder(order.vendor.userId, orderId, {
          customerName: order.customer.name,
          totalAmount: orderAmount,
          currency: order.currency,
        });
      } catch (error) {
        this.logger.error(`Failed to process order ${orderId}: ${(error as any).message}`);
        // Continue processing other orders even if one fails
      }
    }
  }
}
