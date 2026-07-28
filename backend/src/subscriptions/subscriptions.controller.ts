import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { SubscriptionsService } from './subscriptions.service';
import { InitiateSubscriptionDto } from './dto/initiate-subscription.dto';
import { SetAutoRenewDto } from './dto/set-auto-renew.dto';
import { AdminGrantSubscriptionDto, WinBackDto } from './dto/admin-subscription.dto';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard, AdminRoles } from '../auth/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

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
  @UseGuards(JwtAuthGuard)
  async initiateSubscription(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: InitiateSubscriptionDto
  ) {
    return this.subscriptionsService.initiateSubscription(currentUser.id, dto.plan);
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
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.subscriptionsService.getMySubscription(currentUser.id);
  }

  // ─── POST /subscriptions/cancel ─────────────────────────────────────────
  // Authenticated — cancels at end of period
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.subscriptionsService.cancelSubscription(currentUser.id);
  }

  // ─── PATCH /subscriptions/auto-renew ────────────────────────────────────
  // Authenticated — V8-401: lighter-weight than cancel, keeps status ACTIVE
  @Patch('auto-renew')
  @UseGuards(JwtAuthGuard)
  async setAutoRenew(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: SetAutoRenewDto
  ) {
    return this.subscriptionsService.setAutoRenew(currentUser.id, dto.autoRenew);
  }

  // ─── POST /subscriptions/pause ──────────────────────────────────────────
  // Authenticated — extends endDate by 30 days, no charge
  @Post('pause')
  @UseGuards(JwtAuthGuard)
  async pauseSubscription(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.subscriptionsService.pauseSubscription(currentUser.id);
  }

  // ─── GET /subscriptions/history ─────────────────────────────────────────
  // Authenticated — billing history
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getBillingHistory(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.subscriptionsService.getBillingHistory(currentUser.id);
  }

  // ─── POST /subscriptions/admin/grant ─────────────────────────────────────
  // Admin only — manually grant Devoted to a user (comps, gifts, influencer)
  @Post('admin/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER, AdminSubRole.FINANCE)
  async adminGrantSubscription(@Body() body: AdminGrantSubscriptionDto) {
    return this.subscriptionsService.adminGrantSubscription(body.userId, body.plan, body.reason);
  }

  // ─── POST /subscriptions/admin/send-winback ──────────────────────────────
  // Admin only — sends win-back email to a specific expired subscriber
  @Post('admin/send-winback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER, AdminSubRole.FINANCE, AdminSubRole.SUPPORT)
  async sendWinBack(@Body() body: WinBackDto) {
    await this.subscriptionsService.sendWinBackEmail(body.userId);
    return { sent: true };
  }

  // ─── POST /subscriptions/webhook ────────────────────────────────────────
  // PUBLIC — called by Paystack. Signature verification is mandatory (EMG-02).
  // Previously: an unset PAYSTACK_WEBHOOK_SECRET skipped verification entirely,
  // and even with a secret set, a missing signature header or missing rawBody
  // fell through the `else if` with no check and no rejection — a forged
  // `subscription.create` event with no header at all was processed as-is,
  // letting anyone grant themselves a paid subscription for free.
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest
  ) {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('PAYSTACK_WEBHOOK_SECRET is not configured — refusing to process webhook');
      throw new UnauthorizedException('Webhook processing is not configured');
    }
    if (!signature || !req.rawBody) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const expectedHash = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expectedHash, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');
    const isValid =
      expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    if (!isValid) {
      this.logger.warn('Invalid Paystack webhook signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let event: { event: string; data: any };
    try {
      event = req.rawBody ? JSON.parse(req.rawBody.toString()) : req.body;
    } catch {
      this.logger.warn('Could not parse webhook body');
      return { received: false };
    }

    await this.subscriptionsService.handleWebhookEvent(event);
    return { received: true };
  }
}
