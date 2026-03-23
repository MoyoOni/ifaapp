import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { InitiateSubscriptionDto } from './dto/initiate-subscription.dto';

// Extend Request to include rawBody (enabled in main.ts via { rawBody: true })
interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── POST /subscriptions/initiate ───────────────────────────────────────
  // Authenticated — returns Paystack checkout URL
  @Post('initiate')
  @UseGuards(AuthGuard('jwt'))
  async initiateSubscription(
    @Req() req: any,
    @Body() dto: InitiateSubscriptionDto,
  ) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.subscriptionsService.initiateSubscription(userId, dto.plan);
  }

  // ─── GET /subscriptions/public-stats ────────────────────────────────────
  // PUBLIC — returns aggregate counts for social proof on pricing page
  @Get('public-stats')
  async getPublicStats() {
    return this.subscriptionsService.getPublicStats();
  }

  // ─── GET /subscriptions/me ──────────────────────────────────────────────
  // Authenticated — returns current subscription status
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMySubscription(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.subscriptionsService.getMySubscription(userId);
  }

  // ─── POST /subscriptions/cancel ─────────────────────────────────────────
  // Authenticated — cancels at end of period
  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelSubscription(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.subscriptionsService.cancelSubscription(userId);
  }

  // ─── POST /subscriptions/pause ──────────────────────────────────────────
  // Authenticated — extends endDate by 30 days, no charge
  @Post('pause')
  @UseGuards(AuthGuard('jwt'))
  async pauseSubscription(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.subscriptionsService.pauseSubscription(userId);
  }

  // ─── GET /subscriptions/history ─────────────────────────────────────────
  // Authenticated — billing history
  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  async getBillingHistory(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.subscriptionsService.getBillingHistory(userId);
  }

  // ─── POST /subscriptions/admin/grant ─────────────────────────────────────
  // Admin only — manually grant Devoted to a user (comps, gifts, influencer)
  @Post('admin/grant')
  @UseGuards(AuthGuard('jwt'))
  async adminGrantSubscription(
    @Req() req: any,
    @Body() body: { userId: string; plan: 'QUARTERLY' | 'ANNUAL'; reason?: string },
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.subscriptionsService.adminGrantSubscription(body.userId, body.plan, body.reason);
  }

  // ─── POST /subscriptions/admin/send-winback ──────────────────────────────
  // Admin only — sends win-back email to a specific expired subscriber
  @Post('admin/send-winback')
  @UseGuards(AuthGuard('jwt'))
  async sendWinBack(@Req() req: any, @Body() body: { userId: string }) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    await this.subscriptionsService.sendWinBackEmail(body.userId);
    return { sent: true };
  }

  // ─── POST /subscriptions/webhook ────────────────────────────────────────
  // PUBLIC — called by Paystack. Signature verified here.
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest,
  ) {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('PAYSTACK_WEBHOOK_SECRET not set — skipping signature check');
    } else if (signature && req.rawBody) {
      const hash = crypto
        .createHmac('sha512', secret)
        .update(req.rawBody)
        .digest('hex');

      if (hash !== signature) {
        this.logger.warn('Invalid Paystack webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    let event: { event: string; data: any };
    try {
      event = req.rawBody
        ? JSON.parse(req.rawBody.toString())
        : req.body;
    } catch {
      this.logger.warn('Could not parse webhook body');
      return { received: false };
    }

    await this.subscriptionsService.handleWebhookEvent(event);
    return { received: true };
  }
}
