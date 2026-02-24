import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LocationService } from './location.service';
import { CurrencyService } from './currency.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { Currency, PaymentPurpose, EscrowType } from '@ile-ase/common';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Payment } from '@prisma/client';
import Flutterwave from 'flutterwave-node-v3';
import { NotificationService } from '../notifications/notification.service';
import { PaystackApiService } from './paystack-api.service';

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
  async handleWebhook(payload: any, provider: PaymentProvider, signature?: string) {
    try {
      if (provider === PaymentProvider.PAYSTACK) {
        return await this.handlePaystackWebhook(payload, signature);
      } else {
        return await this.handleFlutterwaveWebhook(payload, signature);
      }
    } catch (error) {
      this.logger.error(
        `Webhook handling failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }

  /**
   * Handle Paystack webhook
   */
  private async handlePaystackWebhook(payload: any, signature?: string) {
    // Verify webhook signature
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (signature) {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (hash !== signature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      // Process successful payment
      const metadata = data.metadata;
      const userId = metadata?.userId;

      if (userId) {
        const amountDecimal = data.amount / 100; // Convert from kobo
        const currency = data.currency as Currency;
        const reference = data.reference;

        // Credit wallet (no currentUser for webhook calls)
        const result = await this.walletService.depositFunds(userId, {
          amount: amountDecimal,
          currency,
          reference,
        });

        // Mark transaction as webhook received
        if (result.transaction) {
          await this.prisma.transaction.update({
            where: { id: result.transaction.id },
            data: {
              webhookReceived: true,
              webhookReceivedAt: new Date(),
            },
          });
        }

        // HC-206.2: Email notification for payment received
        this.notificationService
          .notifyPaymentReceived(userId, amountDecimal, currency, reference)
          .catch((err) =>
            this.logger.warn(`Payment received email failed: ${(err as Error).message}`)
          );
      }

      return {
        success: true,
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
      };
    }

    return { success: false, message: 'Event not processed' };
  }

  /**
   * Handle Flutterwave webhook
   */
  private async handleFlutterwaveWebhook(payload: any, signature?: string) {
    // Verify webhook signature
    const secretHash = this.configService.get<string>('FLUTTERWAVE_SECRET_HASH');
    if (signature && secretHash) {
      if (signature !== secretHash) {
        throw new BadRequestException('Invalid webhook signature');
      }
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

        // Credit wallet (no currentUser for webhook calls)
        const result = await this.walletService.depositFunds(userId, {
          amount,
          currency,
          reference,
        });

        // Mark transaction as webhook received
        if (result.transaction) {
          await this.prisma.transaction.update({
            where: { id: result.transaction.id },
            data: {
              webhookReceived: true,
              webhookReceivedAt: new Date(),
            },
          });
        }

        // HC-206.2: Email notification for payment received
        this.notificationService
          .notifyPaymentReceived(userId, amount, currency, reference)
          .catch((err) =>
            this.logger.warn(`Payment received email failed: ${(err as Error).message}`)
          );
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
    userId?: string
  ) {
    // Try to determine provider from reference format
    if (!provider) {
      provider = reference.startsWith('ILEASE_')
        ? PaymentProvider.FLUTTERWAVE
        : PaymentProvider.PAYSTACK;
    }

    // Apply refund policy based on cancellation reason
    let refundAmount = amount;
    if (cancellationReason && !amount) {
      // Get original payment amount from transaction
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          reference: reference,
          type: 'DEPOSIT',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (transaction) {
        refundAmount = this.calculateRefundAmount(transaction.amount, cancellationReason, userId);
      }
    }

    try {
      const result =
        provider === PaymentProvider.PAYSTACK
          ? await this.refundPaystackPayment(reference, refundAmount)
          : await this.refundFlutterwavePayment(reference, refundAmount);

      // Update wallet: decrement balance and record REFUND transaction (PB-206.1)
      const originalTx = await this.prisma.transaction.findFirst({
        where: { reference, type: 'DEPOSIT' },
        orderBy: { createdAt: 'desc' },
      });
      if (originalTx) {
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
      } else {
        this.logger.warn(
          `Refund ${reference} succeeded at gateway but no DEPOSIT transaction found; wallet not updated.`
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Refund failed: ${(error as any).message}`, (error as any).stack);
      throw new InternalServerErrorException('Refund processing failed');
    }
  }

  /**
   * Calculate refund amount based on policy
   */
  private calculateRefundAmount(
    originalAmount: number,
    cancellationReason: string,
    userId?: string
  ): number {
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

    // Depending on the purpose of the payment, perform different actions
    switch (payment.purpose) {
      case PaymentPurpose.WALLET_TOPUP:
        // Add funds to user's wallet using the proper method
        const depositData = {
          amount: payment.amount,
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
                amount: payment.amount,
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
        await this.processMarketplaceOrderPayment(payment);
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
          },
        });

        if (!order) {
          this.logger.warn(`Order ${orderId} not found for payment ${payment.id}`);
          continue;
        }

        // Calculate order amount (may differ from payment if multi-vendor split)
        const orderAmount = order.totalAmount;

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

        await this.walletService.createEscrow(order.customerId, escrowData, {
          id: order.customerId,
          role: 'CLIENT',
        } as CurrentUserPayload);

        this.logger.log(
          `Marketplace order ${orderId} marked as PAID. Escrow created for vendor ${order.vendor.userId}`
        );

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
