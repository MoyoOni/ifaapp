import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaymentsService, PaymentProvider } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Currency } from '@ile-ase/common';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Initialize payment
   * POST /payments/initialize
   * 20 requests/minute (HC-204.3) to limit abuse
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('initialize')
  @UseGuards(AuthGuard('jwt'))
  async initializePayment(
    @Body() dto: InitializePaymentDto,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Req() req: Request,
    @Query('provider') preferredProvider?: PaymentProvider,
    @Query('convertTo') convertToCurrency?: string
  ) {
    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get IP address for geolocation
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    return this.paymentsService.initializePayment(
      currentUser.id,
      dto,
      user.email,
      user.name,
      ipAddress as string,
      preferredProvider,
      convertToCurrency as Currency
    );
  }

  /**
   * Get currency conversion rates
   * GET /payments/currency/rates
   */
  @Get('currency/rates')
  @UseGuards(AuthGuard('jwt'))
  async getCurrencyRates(@Query('base') baseCurrency?: Currency) {
    return this.paymentsService.getCurrencyRates(baseCurrency);
  }

  /**
   * Convert currency amount
   * GET /payments/currency/convert
   */
  @Get('currency/convert')
  @UseGuards(AuthGuard('jwt'))
  async convertCurrency(
    @Query('amount') amount: number,
    @Query('from') from: Currency,
    @Query('to') to: Currency,
    @Query('includeFees') includeFees?: string
  ) {
    return this.paymentsService.convertCurrencyAmount(amount, from, to, includeFees === 'true');
  }

  /**
   * Verify payment
   * GET /payments/verify/:reference
   */
  @Get('verify/:reference')
  @UseGuards(AuthGuard('jwt'))
  async verifyPayment(
    @Param('reference') reference: string,
    @Query('provider') provider?: PaymentProvider,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.paymentsService.verifyPayment(reference, provider);
  }

  /**
   * Paystack webhook
   * POST /payments/webhook/paystack
   * 20 requests/minute (HC-204.3)
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  async paystackWebhook(@Body() payload: any, @Headers('x-paystack-signature') signature?: string) {
    return this.paymentsService.handleWebhook(payload, PaymentProvider.PAYSTACK, signature);
  }

  /**
   * Flutterwave webhook
   * POST /payments/webhook/flutterwave
   * 20 requests/minute (HC-204.3)
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  async flutterwaveWebhook(@Body() payload: any, @Headers('verif-hash') signature?: string) {
    return this.paymentsService.handleWebhook(payload, PaymentProvider.FLUTTERWAVE, signature);
  }

  /**
   * Refund payment
   * POST /payments/refund
   */
  @Post('refund')
  @UseGuards(AuthGuard('jwt'))
  async refundPayment(
    @Body() dto: RefundPaymentDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.paymentsService.refundPayment(
      dto.reference,
      dto.amount,
      dto.provider,
      dto.cancellationReason,
      currentUser.id
    );
  }

  /**
   * Get unverified payments (admin only)
   * GET /payments/unverified
   */
  @Get('unverified')
  @UseGuards(AuthGuard('jwt'))
  async getUnverifiedPayments(
    @Query('hours') hours?: number,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    if (currentUser?.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    return this.paymentsService.getUnverifiedPayments(hours || 24);
  }

  /**
   * Manually verify payment (admin only)
   * POST /payments/verify-manual/:transactionId
   */
  @Post('verify-manual/:transactionId')
  @UseGuards(AuthGuard('jwt'))
  async manuallyVerifyPayment(
    @Param('transactionId') transactionId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    return this.paymentsService.manuallyVerifyPayment(transactionId, currentUser.id);
  }
}
