import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SesEmailService } from '../shared/services/ses-email.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { addMonths, addDays, differenceInDays } from 'date-fns';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sesEmailService: SesEmailService,
    private readonly notificationService: NotificationService
  ) {}

  // ─── Initiate Subscription (returns Paystack checkout URL) ───────────────

  async initiateSubscription(userId: string, plan: 'QUARTERLY' | 'ANNUAL') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const planCode =
      plan === 'QUARTERLY'
        ? process.env.PAYSTACK_DEVOTED_QUARTERLY_PLAN
        : process.env.PAYSTACK_DEVOTED_ANNUAL_PLAN;

    const amount = plan === 'QUARTERLY' ? 2_500_000 : 10_000_000; // kobo

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        plan: planCode,
        callback_url: `${process.env.FRONTEND_URL ?? 'https://iluase.com'}/subscription/confirm`,
        metadata: { userId, plan, userName: user.name },
      }),
    });

    const data = (await response.json()) as any;

    if (!data.status) {
      this.logger.error('Paystack initiate failed', data);
      throw new Error(data.message ?? 'Payment initiation failed');
    }

    this.logger.log(`Paystack checkout initiated for user ${userId} — plan ${plan}`);
    return { checkoutUrl: data.data.authorization_url, reference: data.data.reference };
  }

  // ─── Public Stats (social proof) ─────────────────────────────────────────

  async getPublicStats() {
    const [devotedCount, totalUsers] = await Promise.all([
      this.prisma.user.count({ where: { subscriptionStatus: 'DEVOTED' } }),
      this.prisma.user.count(),
    ]);
    return { devotedCount, totalUsers };
  }

  // ─── Get My Subscription Status ──────────────────────────────────────────

  async getMySubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true, subscriptionEnd: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { endDate: 'desc' },
    });

    if (!activeSub || user.subscriptionStatus === 'FREE') {
      return { status: 'FREE', plan: null, endDate: null, daysRemaining: null, autoRenew: null };
    }

    const daysRemaining = differenceInDays(activeSub.endDate, new Date());

    // Fire renewal reminder if within 3 days and not yet sent
    if (
      daysRemaining <= 3 &&
      daysRemaining >= 0 &&
      !activeSub.reminderSent &&
      activeSub.autoRenew
    ) {
      const fullUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (fullUser) {
        this.sendRenewalReminder(
          fullUser.email,
          fullUser.name,
          activeSub.plan,
          activeSub.endDate,
          daysRemaining
        ).catch((err) => {
          this.logger.error(`Failed to send renewal reminder to ${fullUser.email}`, err);
        });
        const dayWord = daysRemaining === 1 ? 'day' : 'days';
        this.notificationService
          .createNotification({
            userId,
            type: NotificationType.SYSTEM,
            category: NotificationCategory.WARNING,
            title: `Devoted renews in ${daysRemaining} ${dayWord}`,
            message: `Your Devoted plan renews on ${activeSub.endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. Your subscription will auto-renew.`,
          })
          .catch(() => {});
        this.prisma.subscription
          .update({ where: { id: activeSub.id }, data: { reminderSent: true } })
          .catch(() => {});
      }
    }

    return {
      status: user.subscriptionStatus,
      plan: activeSub.plan,
      endDate: activeSub.endDate.toISOString(),
      daysRemaining: Math.max(0, daysRemaining),
      autoRenew: activeSub.autoRenew,
    };
  }

  // ─── Cancel Subscription ─────────────────────────────────────────────────

  async cancelSubscription(userId: string) {
    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { endDate: 'desc' },
    });
    if (!activeSub) throw new NotFoundException('No active subscription found');

    // Cancel in Paystack (disable subscription)
    if (activeSub.paystackSubId) {
      try {
        await fetch(`https://api.paystack.co/subscription/disable`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: activeSub.paystackSubId,
            token: activeSub.paystackSubId, // Paystack requires email token — stored separately in production
          }),
        });
      } catch (err) {
        this.logger.warn('Failed to cancel in Paystack, proceeding locally', err);
      }
    }

    // Mark as cancelled locally — but keep user DEVOTED until endDate
    await this.prisma.subscription.update({
      where: { id: activeSub.id },
      data: { autoRenew: false, status: 'CANCELLED' },
    });

    this.logger.log(
      `Subscription cancelled for user ${userId} — access until ${activeSub.endDate}`
    );

    return {
      message: 'Subscription cancelled. You keep Devoted access until your period ends.',
      accessUntil: activeSub.endDate.toISOString(),
    };
  }

  // ─── Pause Subscription (extends endDate by 30 days, no charge) ──────────

  async pauseSubscription(userId: string) {
    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { endDate: 'desc' },
    });
    if (!activeSub) throw new NotFoundException('No active subscription found');

    const newEnd = addDays(activeSub.endDate, 30);
    await this.prisma.subscription.update({
      where: { id: activeSub.id },
      data: { endDate: newEnd },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionEnd: newEnd },
    });

    return { message: 'Subscription paused by 30 days.', newEndDate: newEnd.toISOString() };
  }

  // ─── Billing History ─────────────────────────────────────────────────────

  async getBillingHistory(userId: string) {
    const subs = await this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return subs.map((s) => ({
      id: s.id,
      plan: s.plan,
      status: s.status,
      amountPaid: s.amountPaid,
      currency: s.currency,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      createdAt: s.createdAt.toISOString(),
      paystackRef: s.paystackRef,
    }));
  }

  // ─── Webhook Event Handler ────────────────────────────────────────────────

  async handleWebhookEvent(event: { event: string; data: any }) {
    const { event: type, data } = event;
    this.logger.log(`Paystack webhook received: ${type}`);

    try {
      if (type === 'subscription.create') {
        await this.onSubscriptionCreated(data);
      } else if (type === 'subscription.disable') {
        await this.onSubscriptionDisabled(data);
      } else if (type === 'invoice.payment_failed') {
        await this.onPaymentFailed(data);
      } else if (type === 'charge.success') {
        await this.onChargeSuccess(data);
      }
    } catch (err) {
      // Log but never throw — Paystack needs 200 back
      this.logger.error(`Webhook handler error for event ${type}`, err);
    }
  }

  private async onSubscriptionCreated(data: any) {
    const { userId, plan } = data.metadata ?? {};
    if (!userId || !plan) {
      this.logger.warn('subscription.create missing metadata', data);
      return;
    }

    // Idempotency (EMG-03): Paystack retries a webhook on any non-2xx response,
    // and the same event can be replayed. Without this check, a retry would
    // create a second Subscription row, re-grant the referral reward, and
    // re-send the billing confirmation email for one real subscription.
    // `paystackSubId` is @unique but nullable (Postgres allows many NULLs), so
    // this can't rely on the DB constraint alone when the subscription code is
    // absent from the payload — dedupe on whichever gateway reference is present.
    const reference = data.reference ?? null;
    const subscriptionCode = data.subscription_code ?? null;
    if (reference || subscriptionCode) {
      const existing = await this.prisma.subscription.findFirst({
        where: {
          userId,
          OR: [
            ...(subscriptionCode ? [{ paystackSubId: subscriptionCode }] : []),
            ...(reference ? [{ paystackRef: reference }] : []),
          ],
        },
      });
      if (existing) {
        this.logger.log(
          `Duplicate subscription.create webhook for user ${userId} (ref=${reference}, sub=${subscriptionCode}) — already processed, skipping`
        );
        return;
      }
    }

    const months = plan === 'QUARTERLY' ? 3 : 12;
    const endDate = addMonths(new Date(), months);

    await this.prisma.subscription.create({
      data: {
        userId,
        plan,
        status: 'ACTIVE',
        paystackSubId: data.subscription_code ?? null,
        paystackRef: data.reference ?? null,
        startDate: new Date(),
        endDate,
        amountPaid: data.amount ?? (plan === 'QUARTERLY' ? 2_500_000 : 10_000_000),
        currency: 'NGN',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'DEVOTED', subscriptionEnd: endDate },
    });

    // Check and reward referrer
    await this.rewardReferrer(userId);

    // In-app notification — subscription activated
    this.notificationService
      .createNotification({
        userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.SUCCESS,
        title: 'Welcome to Devoted!',
        message: `Your ${plan === 'ANNUAL' ? 'Annual' : 'Quarterly'} Devoted plan is now active. Access expires ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
      })
      .catch(() => {});

    // Send billing confirmation email (fire-and-forget)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (user) {
      this.sendBillingConfirmation(
        user.email,
        user.name,
        plan,
        endDate,
        data.amount ?? (plan === 'QUARTERLY' ? 2_500_000 : 10_000_000)
      ).catch((err) => {
        this.logger.error(`Failed to send billing confirmation to ${user.email}`, err);
      });
    }

    this.logger.log(`User ${userId} is now DEVOTED until ${endDate.toISOString()}`);
  }

  private async onSubscriptionDisabled(data: any) {
    const { userId } = data.metadata ?? {};
    if (!userId) return;

    await this.prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', autoRenew: false },
    });

    // Keep DEVOTED status until endDate — a cron will expire it
    this.logger.log(`Subscription disabled for user ${userId}`);
  }

  private async onPaymentFailed(data: any) {
    const { userId } = data.metadata ?? {};
    if (!userId) return;

    await this.prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'PAST_DUE' },
    });

    // In-app notification — payment failed
    this.notificationService
      .createNotification({
        userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.ERROR,
        title: 'Devoted payment failed',
        message:
          'Your Devoted subscription payment could not be processed. Please update your payment method to keep your access.',
      })
      .catch(() => {});

    this.logger.warn(`Payment failed for user ${userId} — marked PAST_DUE`);
  }

  private async onChargeSuccess(data: any) {
    // Renewal — update endDate
    const { userId, plan } = data.metadata ?? {};
    if (!userId) return;

    const months = plan === 'QUARTERLY' ? 3 : 12;
    const newEnd = addMonths(new Date(), months);

    await this.prisma.subscription.updateMany({
      where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      data: { status: 'ACTIVE', endDate: newEnd, reminderSent: false },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'DEVOTED', subscriptionEnd: newEnd },
    });

    // In-app notification — renewal
    this.notificationService
      .createNotification({
        userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.SUCCESS,
        title: 'Devoted plan renewed',
        message: `Your ${plan === 'ANNUAL' ? 'Annual' : 'Quarterly'} Devoted plan has been renewed. Access until ${newEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
      })
      .catch(() => {});

    this.logger.log(`Renewal successful for user ${userId} — extended to ${newEnd.toISOString()}`);
  }

  // ─── Referral Reward ─────────────────────────────────────────────────────

  private async rewardReferrer(newSubscriberId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { referredId: newSubscriberId },
    });
    if (!referral || referral.rewardGranted) return;

    // Extend referrer's subscription by 30 days, or grant 30-day Devoted if free
    const referrer = await this.prisma.user.findUnique({ where: { id: referral.referrerId } });
    if (!referrer) return;

    const baseDate =
      referrer.subscriptionStatus === 'DEVOTED' && referrer.subscriptionEnd
        ? referrer.subscriptionEnd
        : new Date();

    const newEnd = addDays(baseDate, 30);

    if (referrer.subscriptionStatus !== 'DEVOTED') {
      // Grant a 30-day Devoted
      await this.prisma.subscription.create({
        data: {
          userId: referral.referrerId,
          plan: 'QUARTERLY',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: newEnd,
          amountPaid: 0,
          currency: 'NGN',
        },
      });
    } else {
      await this.prisma.subscription.updateMany({
        where: { userId: referral.referrerId, status: 'ACTIVE' },
        data: { endDate: newEnd },
      });
    }

    await this.prisma.user.update({
      where: { id: referral.referrerId },
      data: { subscriptionStatus: 'DEVOTED', subscriptionEnd: newEnd },
    });

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { rewardGranted: true },
    });

    this.logger.log(
      `Referral reward granted: ${referral.referrerId} gets 30 days for referring ${newSubscriberId}`
    );
  }

  // ─── Admin Manual Grant ───────────────────────────────────────────────────

  async adminGrantSubscription(userId: string, plan: 'QUARTERLY' | 'ANNUAL', reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const months = plan === 'QUARTERLY' ? 3 : 12;
    const endDate = addMonths(new Date(), months);

    await this.prisma.subscription.create({
      data: {
        userId,
        plan,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
        amountPaid: 0, // complimentary
        currency: 'NGN',
        paystackRef: `admin-grant-${Date.now()}`,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'DEVOTED', subscriptionEnd: endDate },
    });

    // In-app notification
    this.notificationService
      .createNotification({
        userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.SUCCESS,
        title: 'Devoted access granted',
        message: `Your Devoted ${plan === 'ANNUAL' ? 'Annual' : 'Quarterly'} plan has been activated by the Ilé Àṣẹ team.${reason ? ` Note: ${reason}` : ''} Access until ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
      })
      .catch(() => {});

    this.logger.log(
      `Admin granted ${plan} Devoted to user ${userId}${reason ? ` — reason: ${reason}` : ''}`
    );
    return { granted: true, plan, endDate: endDate.toISOString() };
  }

  // ─── Billing Confirmation Email ───────────────────────────────────────────

  private async sendBillingConfirmation(
    email: string,
    name: string,
    plan: string,
    endDate: Date,
    amountKobo: number
  ): Promise<void> {
    const planLabel = plan === 'ANNUAL' ? 'Annual (1 year)' : 'Quarterly (3 months)';
    const amountNaira = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amountKobo / 100);
    const endFormatted = endDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://iluase.com';

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
    <p style="color:#FCD34D;margin:8px 0 0;font-size:14px;">You are now Devoted</p>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>Àṣẹ ${name},</p>
    <p>Thank you for becoming a <strong>Devoted</strong> member of Ilé Àṣẹ. Your payment was successful.</p>
    <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:bold;color:#92400E;">Receipt</p>
      <p style="margin:4px 0;color:#78350F;">Plan: <strong>${planLabel}</strong></p>
      <p style="margin:4px 0;color:#78350F;">Amount: <strong>${amountNaira}</strong></p>
      <p style="margin:4px 0;color:#78350F;">Access until: <strong>${endFormatted}</strong></p>
    </div>
    <p style="font-size:14px;color:#6B7280;">You now have access to premium Academy courses, exclusive Circles, priority booking, unlimited messaging, and more.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${frontendUrl}/subscription/manage" style="display:inline-block;background:#B45309;color:#FFFFFF;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;">
        Manage Your Subscription
      </a>
    </div>
    <p style="font-size:12px;color:#9CA3AF;">May your path be clear. Aboru Aboye.</p>
  </div>
</body></html>`;

    await this.sesEmailService.sendEmail(email, 'Welcome to Devoted — Ilé Àṣẹ', html);
    this.logger.log(`Billing confirmation sent to ${email}`);
  }

  private async sendRenewalReminder(
    email: string,
    name: string,
    plan: string,
    endDate: Date,
    daysRemaining: number
  ): Promise<void> {
    const planLabel = plan === 'ANNUAL' ? 'Annual' : 'Quarterly';
    const endFormatted = endDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://iluase.com';
    const dayWord = daysRemaining === 1 ? 'day' : 'days';

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>Àṣẹ ${name},</p>
    <p>Your <strong>Devoted ${planLabel}</strong> membership renews in <strong>${daysRemaining} ${dayWord}</strong> (on ${endFormatted}).</p>
    <p style="font-size:14px;color:#6B7280;">Your subscription will renew automatically. No action needed — enjoy uninterrupted Devoted access.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${frontendUrl}/subscription/manage" style="display:inline-block;background:#B45309;color:#FFFFFF;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;">
        Manage Subscription
      </a>
    </div>
    <p style="font-size:12px;color:#9CA3AF;">Aboru Aboye.</p>
  </div>
</body></html>`;

    await this.sesEmailService.sendEmail(
      email,
      `Your Devoted membership renews in ${daysRemaining} ${dayWord} — Ilé Àṣẹ`,
      html
    );
    this.logger.log(`Renewal reminder sent to ${email} (${daysRemaining} days remaining)`);
  }

  // ─── Win-Back Email (called by admin or external trigger) ─────────────────

  async sendWinBackEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, subscriptionStatus: true },
    });
    if (!user || user.subscriptionStatus === 'DEVOTED') return;

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://iluase.com';

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
    <p style="color:#FCD34D;margin:8px 0 0;font-size:14px;">We miss you</p>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>Àṣẹ ${user.name},</p>
    <p>Your <strong>Devoted</strong> membership has ended, but your spiritual journey doesn't have to.</p>
    <p style="font-size:14px;color:#6B7280;">Return today and reconnect with your Babaláwo, your community, and your path.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${frontendUrl}/pricing" style="display:inline-block;background:#B45309;color:#FFFFFF;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;">
        Rejoin as Devoted
      </a>
    </div>
    <p style="font-size:12px;color:#9CA3AF;">May your path be clear. Aboru Aboye.</p>
  </div>
</body></html>`;

    await this.sesEmailService.sendEmail(user.email, 'Your Devoted journey awaits — Ilé Àṣẹ', html);
    this.logger.log(`Win-back email sent to ${user.email}`);
  }
}
