import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { addMonths } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';
import { PaystackApiService } from '../payments/paystack-api.service';
import { AuditService } from './audit.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TransactionStatus, WithdrawalStatus } from '@ile-ase/common';

@Injectable()
export class AdminFinanceService {
  private readonly logger = new Logger(AdminFinanceService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private paymentsService: PaymentsService,
    private paystackApiService: PaystackApiService,
    private auditService: AuditService,
    private notificationService: NotificationService,
    private subscriptionsService: SubscriptionsService
  ) {}

  /**
   * Get disputes (from escrows with DISPUTED status)
   */
  async getDisputes(currentUser: CurrentUserPayload, status?: string) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view disputes');
    }

    const where: any = { status: 'DISPUTED' };
    if (status && status !== 'DISPUTED') {
      // Handle resolved disputes (status might be different)
      where.status = status;
    }

    const disputes = await this.prisma.escrow.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        guidancePlan: {
          include: {
            appointment: {
              select: {
                id: true,
                date: true,
                time: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate SLA (48 hours)
    return disputes.map((dispute: any) => {
      const createdAt = new Date(dispute.createdAt);
      const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      const slaHours = 48;
      const hoursRemaining = Math.max(0, slaHours - hoursElapsed);
      const isOverdue = hoursElapsed > slaHours;

      return {
        ...dispute,
        sla: {
          hoursElapsed,
          hoursRemaining,
          isOverdue,
          deadline: new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000),
        },
      };
    });
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    escrowId: string,
    dto: any, // ResolveDisputeDto
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can resolve disputes');
    }

    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        user: true,
        guidancePlan: true,
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status !== 'DISPUTED') {
      throw new BadRequestException('Escrow is not in dispute status');
    }

    // Handle resolution based on type
    if (dto.resolution === 'REFUND_CLIENT') {
      // Full refund to client - release escrow with refund logic
      // Note: In production, you'd call a proper refund method
      // For now, we'll mark as cancelled and refund manually
      await this.prisma.escrow.update({
        where: { id: escrowId },
        data: {
          status: 'CANCELLED',
          notes: escrow.notes
            ? `${escrow.notes}\n[Dispute Resolved: Full refund to client - ${dto.notes || ''}]`
            : `[Dispute Resolved: Full refund to client - ${dto.notes || ''}]`,
        },
      });

      // Refund to wallet balance (simplified - in production, use proper refund transaction)
      await this.prisma.wallet.update({
        where: { id: escrow.walletId },
        data: {
          balance: {
            increment: escrow.amount,
          },
        },
      });
    } else if (dto.resolution === 'PAY_PROVIDER') {
      // Release full amount to provider
      await this.walletService.releaseEscrow(
        escrow.userId,
        {
          escrowId,
          tier: 'FULL' as any,
          notes: `Dispute resolved: ${dto.notes || 'Admin approved full payment'}`,
        },
        currentUser
      );
    } else if (dto.resolution === 'PARTIAL_REFUND') {
      if (!dto.refundAmount || dto.refundAmount <= 0) {
        throw new BadRequestException('Refund amount required for partial refund');
      }

      // Release partial amount to provider, refund rest to client. Escrow.amount
      // is now Decimal (ProBacklog-v1.md item #15).
      const providerAmount = Number(escrow.amount) - dto.refundAmount;
      if (providerAmount > 0 && escrow.recipientId) {
        // This is simplified - in production, you'd need a more sophisticated release mechanism
        await this.walletService.releaseEscrow(
          escrow.userId,
          {
            escrowId,
            amount: providerAmount,
            notes: `Dispute resolved: Partial payment (${dto.notes || ''})`,
          },
          currentUser
        );
      }

      // Refund remainder. Escrow.amount is now Decimal (ProBacklog-v1.md
      // item #15) -- dto here is typed `any`, so this comparison would
      // silently compile either way; made explicit for clarity.
      if (dto.refundAmount < Number(escrow.amount)) {
        await this.walletService.cancelEscrow(escrow.userId, escrowId, currentUser);
      }
    }

    // Update escrow status
    const updated = await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: dto.resolution === 'REFUND_CLIENT' ? 'CANCELLED' : 'RELEASED',
        notes: escrow.notes
          ? `${escrow.notes}\n[Dispute Resolved: ${dto.notes || ''}]`
          : `[Dispute Resolved: ${dto.notes || ''}]`,
      },
    });

    this.logger.log(`Dispute resolved for escrow ${escrowId} by admin ${currentUser.id}`);

    return updated;
  }

  /**
   * Get withdrawal requests requiring approval (> $500)
   */
  async getPendingWithdrawals(currentUser: CurrentUserPayload, threshold: number = 500) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view withdrawal requests');
    }

    const withdrawals = await this.prisma.withdrawalRequest.findMany({
      where: {
        status: 'PENDING',
        amount: {
          gte: threshold,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        escrow: {
          select: {
            id: true,
            type: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return withdrawals;
  }

  /**
   * Approve or reject withdrawal request.
   *
   * HUMAN_BACKLOG.md: this previously only flipped WithdrawalRequest.status
   * to the literal strings 'APPROVE'/'REJECT' (not the real WithdrawalStatus
   * enum values) -- never touched the wallet balance and never called any
   * real transfer API, so an "approved" withdrawal was pure fiction as far
   * as the user's bank account was concerned. The funds are actually held
   * (decremented from the wallet) at request-creation time now
   * (createWithdrawalRequest) -- REJECT refunds that hold; APPROVE attempts
   * a real Paystack transfer and only keeps the hold if that succeeds or is
   * genuinely pending (Paystack transfers can be asynchronous -- see
   * payments.service.ts's transfer.success/transfer.failed webhook handling
   * for how a pending one gets finally resolved).
   */
  async processWithdrawal(
    withdrawalId: string,
    action: 'APPROVE' | 'REJECT',
    notes: string,
    processedBy: CurrentUserPayload
  ) {
    if (processedBy.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can process withdrawals');
    }

    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal request is not pending');
    }

    if (action === 'REJECT') {
      await this.walletService.refundWithdrawalAmount(withdrawal.id);

      const updated = await this.prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.REJECTED,
          adminNotes: notes,
          processedAt: new Date(),
          processedBy: processedBy.id,
        },
      });

      await this.notificationService.createNotification({
        userId: withdrawal.userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: 'Withdrawal request rejected',
        message: notes
          ? `Your withdrawal request was rejected: ${notes}. The held amount has been returned to your wallet.`
          : 'Your withdrawal request was rejected. The held amount has been returned to your wallet.',
        sendEmail: true,
      });

      this.logger.log(`Withdrawal ${withdrawalId} rejected by admin ${processedBy.id}`);
      return updated;
    }

    // APPROVE
    if (!withdrawal.bankAccount || !withdrawal.bankCode || !withdrawal.accountName) {
      throw new BadRequestException(
        'This withdrawal request is missing bank account details and cannot be paid out'
      );
    }

    try {
      const recipient = await this.paystackApiService.createTransferRecipient({
        name: withdrawal.accountName,
        account_number: withdrawal.bankAccount,
        bank_code: withdrawal.bankCode,
        currency: withdrawal.currency,
      });
      if (!recipient.status) {
        throw new Error(recipient.message || 'Failed to register the payout recipient with Paystack');
      }

      const transfer = await this.paystackApiService.initiateTransfer({
        // WithdrawalRequest.amount is now Decimal (ProBacklog-v1.md item #15)
        // -- this feeds the real Paystack transfer amount (in kobo), so
        // getting this normalization right actually moves real money.
        amount: Math.round(Number(withdrawal.amount) * 100),
        recipientCode: recipient.data.recipient_code,
        reason: `Ìlú Àṣẹ withdrawal ${withdrawal.id}`,
        reference: withdrawal.id,
      });
      if (!transfer.status) {
        throw new Error(transfer.message || 'Paystack transfer was not accepted');
      }

      // A 'success' status means Paystack already completed the transfer;
      // anything else (typically 'pending') means it's still in flight and
      // the transfer.success/transfer.failed webhook resolves it later.
      const transactionStatus =
        transfer.data.status === 'success' ? TransactionStatus.COMPLETED : TransactionStatus.PENDING;
      await this.prisma.transaction.updateMany({
        where: { reference: withdrawal.id, status: TransactionStatus.PENDING },
        data: { status: transactionStatus },
      });

      const updated = await this.prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.PROCESSED,
          adminNotes: notes,
          processedAt: new Date(),
          processedBy: processedBy.id,
        },
      });

      await this.notificationService.createNotification({
        userId: withdrawal.userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: 'Withdrawal approved',
        message: `Your withdrawal of ${Number(withdrawal.amount).toLocaleString()} ${withdrawal.currency} has been approved and sent to your bank account.`,
        sendEmail: true,
      });

      this.logger.log(`Withdrawal ${withdrawalId} approved and transferred by admin ${processedBy.id}`);
      return updated;
    } catch (err) {
      // The transfer never happened (or we can't confirm it did) -- return
      // the held funds and leave the request PENDING so it can be
      // investigated or retried, rather than silently marking it approved.
      await this.walletService.refundWithdrawalAmount(withdrawal.id);
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to process withdrawal ${withdrawalId} via Paystack: ${message}`, err);
      throw new BadRequestException(
        `Payout failed: ${message}. The held amount has been returned to the user's wallet — resolve the issue and try approving again.`
      );
    }
  }

  /**
   * Get fraud alerts (auto-flagged content)
   * Auto-flags suspicious content for admin review
   */
  async getFraudAlerts(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view fraud alerts');
    }

    const alerts = [];

    // 1. Check marketplace products for selling Akose/Ebo (should be prescriptions)
    const prohibitedTerms = ['akose', 'ebo', 'sacred prescription', 'spiritual prescription'];
    const products = await this.prisma.product.findMany({
      where: {
        status: { in: ['ACTIVE', 'INACTIVE'] },
      },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    for (const product of products) {
      const productText =
        `${product.name} ${product.description} ${product.longDescription || ''}`.toLowerCase();

      const containsProhibited = prohibitedTerms.some((term) => {
        if (term.includes(' ')) {
          return productText.includes(term);
        } else {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          return regex.test(productText);
        }
      });

      if (containsProhibited) {
        alerts.push({
          id: `product-${product.id}`,
          type: 'PRODUCT_VIOLATION',
          severity: 'HIGH',
          title: 'Product Selling Akose/Ebo',
          description: `Product "${product.name}" appears to be selling Akose/Ebo, which should only be provided via prescription module.`,
          entityType: 'PRODUCT',
          entityId: product.id,
          entity: {
            id: product.id,
            name: product.name,
            vendor: product.vendor.user.name,
            vendorId: product.vendor.userId,
          },
          createdAt: product.createdAt,
          flaggedAt: new Date(),
        });
      }

      // Check for fake verification claims
      const fakeClaims = ['certified babalawo', 'verified by council', 'authentic ifa priest'];
      const hasFakeClaim = fakeClaims.some(
        (claim) =>
          productText.includes(claim) && !(product.vendor.user as { verified?: boolean }).verified
      );

      if (hasFakeClaim) {
        alerts.push({
          id: `product-fake-${product.id}`,
          type: 'FAKE_VERIFICATION_CLAIM',
          severity: 'MEDIUM',
          title: 'Fake Verification Claim',
          description: `Product "${product.name}" claims verification but vendor is not verified.`,
          entityType: 'PRODUCT',
          entityId: product.id,
          entity: {
            id: product.id,
            name: product.name,
            vendor: product.vendor.user.name,
            vendorId: product.vendor.userId,
          },
          createdAt: product.createdAt,
          flaggedAt: new Date(),
        });
      }
    }

    // 2. Check forum posts for selling Akose (if forum exists)
    // This would require a Forum/Post model - placeholder for now

    // 3. Check for suspicious activity patterns
    // Multiple failed payment attempts, rapid account creation, etc.
    const suspiciousUsers = await this.prisma.user.findMany({
      where: {
        role: { in: ['BABALAWO', 'VENDOR'] },
        verified: false,
      },
      include: {
        _count: {
          select: {
            appointmentsAsBabalawo: true,
            appointmentsAsClient: true,
          },
        },
        vendorProfile: {
          include: {
            _count: { select: { products: true } },
          },
        },
      },
    });

    for (const user of suspiciousUsers) {
      const totalAppointments =
        (user._count?.appointmentsAsBabalawo ?? 0) + (user._count?.appointmentsAsClient ?? 0);
      const productCount = user.vendorProfile?._count?.products ?? 0;
      if ((totalAppointments > 10 || productCount > 5) && !user.verified) {
        alerts.push({
          id: `user-suspicious-${user.id}`,
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          title: 'Unverified User with High Activity',
          description: `User "${user.name}" has ${totalAppointments} appointments and ${productCount} products but is not verified.`,
          entityType: 'USER',
          entityId: user.id,
          entity: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          createdAt: user.createdAt,
          flaggedAt: new Date(),
        });
      }
    }

    // Sort by severity and date
    const severityOrder: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    alerts.sort((a, b) => {
      const severityDiff = (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime();
    });

    return alerts;
  }

  /**
   * Get unverified payments (webhook redundancy)
   */
  async getUnverifiedPayments(currentUser: CurrentUserPayload, hours: number = 24) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view unverified payments');
    }

    return this.paymentsService.getUnverifiedPayments(hours);
  }

  /**
   * Manually verify payment (admin only)
   */
  async manuallyVerifyPayment(transactionId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can manually verify payments');
    }

    return this.paymentsService.manuallyVerifyPayment(transactionId, currentUser.id);
  }

  // ==================== Circle Management ====================

  /**
   * Subscription analytics for admin dashboard
   */
  async getSubscriptionStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalDevoted,
      quarterlyCount,
      annualCount,
      newThisMonth,
      cancelledThisMonth,
      recentSubscribers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { subscriptionStatus: 'DEVOTED' } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', plan: 'QUARTERLY' } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', plan: 'ANNUAL' } }),
      this.prisma.subscription.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.subscription.count({
        where: { status: 'CANCELLED', updatedAt: { gte: startOfMonth } },
      }),
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const mrr =
      quarterlyCount * Math.round(2_500_000 / 3) + annualCount * Math.round(10_000_000 / 12);
    const arr = quarterlyCount * 2_500_000 + annualCount * 10_000_000;

    const churnRate =
      totalDevoted > 0
        ? Math.round((cancelledThisMonth / Math.max(totalDevoted, 1)) * 1000) / 10
        : 0;

    return {
      totalDevoted,
      quarterlyCount,
      annualCount,
      mrr,
      arr,
      newThisMonth,
      cancelledThisMonth,
      churnRate,
      recentSubscribers: recentSubscribers.map((s) => ({
        id: s.id,
        name: (s as any).user?.name ?? 'Unknown',
        email: (s as any).user?.email ?? '',
        plan: s.plan,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
      })),
    };
  }

  async getRevenueForecast() {
    // 1. Current subscribers and MRR
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { amountPaid: true, startDate: true },
    });
    const currentSubscribers = activeSubscriptions.length;
    const currentMRR = activeSubscriptions.reduce((sum, sub) => sum + sub.amountPaid, 0) / 100; // in Naira

    // 2. This month GMV (appointments + marketplace orders)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [appointmentRevenue, orderRevenue] = await Promise.all([
      this.prisma.appointment.aggregate({
        _sum: { price: true },
        where: {
          date: { gte: startOfMonth.toISOString() },
          status: 'COMPLETED',
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: startOfMonth.toISOString() },
          status: 'DELIVERED',
        },
      }),
    ]);

    const thisMonthGMV =
      ((appointmentRevenue._sum?.price || 0) as number) +
      ((orderRevenue._sum?.totalAmount || 0) as number);

    // 3. Churn rate (subscriptions cancelled this month / active at start)
    const startOfMonthDate = new Date();
    startOfMonthDate.setDate(1);
    startOfMonthDate.setHours(0, 0, 0, 0);
    const cancelledThisMonth = await this.prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        updatedAt: { gte: startOfMonthDate },
      },
    });
    const activeAtStart = await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: startOfMonthDate },
      },
    });
    const churnRate = activeAtStart > 0 ? cancelledThisMonth / activeAtStart : 0;

    // 4. Growth rate (MRR month over month)
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(startOfMonth);
    lastMonthEnd.setMilliseconds(-1);

    // Calculate last month's MRR
    const lastMonthSubs = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: startOfMonth },
      },
      select: { amountPaid: true },
    });
    const lastMonthMRR = lastMonthSubs.reduce((sum, s) => sum + s.amountPaid, 0) / 100;
    const monthlyGrowthRate = lastMonthMRR > 0 ? (currentMRR - lastMonthMRR) / lastMonthMRR : 0;

    // 5. Projections. Platform revenue now uses the actually-configured
    // commission rates (ILUASE_V1_BACKLOG.md fix) instead of a hardcoded
    // "assuming 10%" flat rate -- appointment revenue x consultation rate
    // plus order revenue x marketplace rate, matching what
    // walletService.releaseEscrow() now really deducts on the marketplace
    // side (consultation commission is still never actually collected,
    // since Consultations are paused, but the configured rate is still the
    // most honest available projection basis).
    const projectedMRR = currentMRR * (1 + monthlyGrowthRate);
    const churnAdjustedMRR = currentMRR * (1 - churnRate) * (1 + monthlyGrowthRate);
    const projectedAnnualGMV = thisMonthGMV * 12;
    const platformSettings = await this.prisma.platformSettings.findFirst();
    const consultationRate = Number(platformSettings?.consultationCommissionPct ?? 15) / 100;
    const marketplaceRate = Number(platformSettings?.marketplaceCommissionPct ?? 10) / 100;
    const thisMonthPlatformRevenue =
      ((appointmentRevenue._sum?.price || 0) as number) * consultationRate +
      ((orderRevenue._sum?.totalAmount || 0) as number) * marketplaceRate;
    const projectedAnnualPlatformRevenue = thisMonthPlatformRevenue * 12;

    // 6. Platform cost -- ILUASE_V1_BACKLOG.md 🔴 Critical fix: this used to
    // be a fabricated "placeholder calculation" derived from commission
    // percentages. It now reads the real, admin-settable
    // PlatformSettings.platformCostNgn column and is honestly `null` (not a
    // made-up number) until an admin actually enters one via
    // PATCH /admin/platform-settings.
    const platformCostNgn =
      platformSettings?.platformCostNgn != null ? Number(platformSettings.platformCostNgn) : null;
    const platformCostTracked = platformCostNgn !== null;

    // 7. Break-even -- only computable once a real operating cost exists.
    const breakEvenThreshold =
      platformCostTracked && platformCostNgn! > 0 && projectedAnnualPlatformRevenue > 0
        ? platformCostNgn! / (projectedAnnualPlatformRevenue / 12)
        : null;
    const monthsToBreakEven = breakEvenThreshold !== null ? Math.ceil(breakEvenThreshold) : null;

    // 8. Trend (last 3 months)
    const trend = await this.getRevenueTrend(3); // helper method

    return {
      currentMRR,
      projectedMRR,
      churnAdjustedMRR,
      thisMonthGMV,
      monthlyGrowthRate,
      projectedAnnualGMV,
      projectedAnnualPlatformRevenue,
      consultationCommissionPct: consultationRate * 100,
      marketplaceCommissionPct: marketplaceRate * 100,
      platformCostNgn,
      platformCostTracked,
      platformCostNote: platformCostTracked
        ? undefined
        : 'Operating cost not yet tracked -- set PlatformSettings.platformCostNgn via PATCH /admin/platform-settings to enable break-even projections.',
      breakEvenThreshold,
      monthsToBreakEven,
      churnRate,
      currentSubscribers,
      trend,
    };
  }

  async getPendingPayoutsTotal(): Promise<number> {
    // Reuse existing withdrawal pending logic
    const pending = await this.prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      select: { amount: true },
    });
    return pending.reduce((sum, w) => sum + Number(w.amount), 0);
  }

  private async getRevenueTrend(months: number = 6) {
    const now = new Date();
    const trend = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const [apptSum, orderSum, commissionSum] = await Promise.all([
        this.prisma.appointment.aggregate({
          _sum: { price: true },
          where: {
            date: { gte: monthStart.toISOString(), lt: monthEnd.toISOString() },
            status: { in: ['COMPLETED', 'CONFIRMED'] },
          },
        }),
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: { gte: monthStart.toISOString(), lt: monthEnd.toISOString() },
            status: { in: ['DELIVERED', 'SHIPPED'] },
          },
        }),
        // ILUASE_V1_BACKLOG.md 🔴 Critical fix: "revenue" used to be a
        // fabricated `gmv * 0.1` guess. Now that walletService.releaseEscrow()
        // actually deducts and records real commission (COMMISSION-type
        // Transaction rows), this reads the real amount collected instead of
        // estimating it -- honestly $0 for the consultation side, since
        // Consultations are paused and no commission is ever collected there.
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            type: 'COMMISSION',
            createdAt: { gte: monthStart.toISOString(), lt: monthEnd.toISOString() },
          },
        }),
      ]);
      const gmv = Number(apptSum._sum?.price || 0) + Number(orderSum._sum?.totalAmount || 0);
      const revenue = Number(commissionSum._sum?.amount || 0);
      trend.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        gmv,
        revenue,
      });
    }
    return trend;
  }

  // V8-402: AC called for a "searchable + exportable" subscriber list; this
  // only ever returned the unfiltered full table. Search matches user
  // name/email (case-insensitive) -- CSV export is generated client-side
  // from this same data, no separate export endpoint needed.
  async getActiveSubscribers(search?: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        ...(search
          ? {
              user: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { endDate: 'asc' },
    });
    return subscriptions.map((s) => ({
      ...s,
      amountPaid: s.amountPaid / 100, // convert kobo to Naira
    }));
  }

  async getCancelledSubscribers() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'CANCELLED' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return subscriptions.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.user.name,
      email: s.user.email,
      avatar: s.user.avatar,
      plan: s.plan,
      endDate: s.endDate,
      cancelledAt: s.updatedAt, // map updatedAt as cancelledAt
    }));
  }

  async getFailedSubscribers() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'PAST_DUE' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return subscriptions.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.user.name,
      email: s.user.email,
      plan: s.plan,
      endDate: s.endDate,
      failedAt: s.updatedAt, // map updatedAt as failedAt
    }));
  }

  /**
   * ADM-013: Admin-initiated subscription actions. These operate on a
   * Subscription row directly (the id shown in the active/cancelled/
   * failed-payments admin lists), unlike the self-service
   * SubscriptionsService methods which look up "the caller's own active
   * subscription" by userId -- an admin isn't the subscriber, so those
   * aren't reusable here.
   */
  async cancelSubscriptionById(
    currentUser: CurrentUserPayload,
    subscriptionId: string,
    reason?: string
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can cancel subscriptions');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // HUMAN_BACKLOG.md: this previously only updated the local row --
    // Paystack kept billing the customer on schedule regardless of the
    // admin's cancellation. Shares the same guard/logging/error-swallowing
    // logic as the user's own self-service cancel path.
    await this.subscriptionsService.disablePaystackSubscription(subscription);

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { autoRenew: false, status: 'CANCELLED' },
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'ADMIN_CANCEL_SUBSCRIPTION',
      entityType: 'Subscription',
      entityId: subscriptionId,
      reason,
      payload: { userId: subscription.userId, plan: subscription.plan },
    });

    await this.notificationService.createNotification({
      userId: subscription.userId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.INFO,
      title: 'Subscription Cancelled',
      message: reason
        ? `Your Devoted subscription was cancelled by an admin: ${reason}`
        : 'Your Devoted subscription was cancelled by an admin.',
      sendEmail: true,
    });

    this.logger.log(`Subscription ${subscriptionId} cancelled by admin ${currentUser.id}`);
    return { success: true };
  }

  async extendSubscriptionById(
    currentUser: CurrentUserPayload,
    subscriptionId: string,
    months: number,
    reason?: string
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can extend subscriptions');
    }
    if (!months || months <= 0) {
      throw new BadRequestException('months must be a positive number');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newEnd = addMonths(subscription.endDate, months);
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { endDate: newEnd },
    });
    await this.prisma.user.update({
      where: { id: subscription.userId },
      data: { subscriptionEnd: newEnd },
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'ADMIN_EXTEND_SUBSCRIPTION',
      entityType: 'Subscription',
      entityId: subscriptionId,
      reason,
      payload: { userId: subscription.userId, months, newEndDate: newEnd },
    });

    await this.notificationService.createNotification({
      userId: subscription.userId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.SUCCESS,
      title: 'Subscription Extended',
      message: `Your Devoted subscription has been extended by ${months} month${months === 1 ? '' : 's'}.`,
      sendEmail: true,
    });

    this.logger.log(
      `Subscription ${subscriptionId} extended by ${months} month(s) by admin ${currentUser.id}`
    );
    return { success: true, newEndDate: newEnd };
  }

  async sendSubscriptionPaymentReminder(currentUser: CurrentUserPayload, subscriptionId: string) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can send payment reminders');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.notificationService.createNotification({
      userId: subscription.userId,
      type: NotificationType.PAYMENT,
      category: NotificationCategory.WARNING,
      title: 'Update Your Payment Method',
      message:
        'Your last Devoted subscription payment failed. Please update your payment method to keep your benefits active.',
      sendEmail: true,
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'ADMIN_SEND_PAYMENT_REMINDER',
      entityType: 'Subscription',
      entityId: subscriptionId,
      payload: { userId: subscription.userId },
    });

    this.logger.log(
      `Payment reminder sent for subscription ${subscriptionId} by admin ${currentUser.id}`
    );
    return { success: true };
  }

  async getFinancialCommandCentre() {
    // 1. MRR (from active subscriptions)
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { amountPaid: true },
    });
    const mrr = activeSubs.reduce((sum, s) => sum + s.amountPaid, 0) / 100;

    // 2. Total GMV (all-time appointments + orders)
    const [apptAgg, orderAgg] = await Promise.all([
      this.prisma.appointment.aggregate({
        _sum: { price: true },
        where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['DELIVERED', 'SHIPPED'] } },
      }),
    ]);
    const totalGmv = Number(apptAgg._sum?.price || 0) + Number(orderAgg._sum?.totalAmount || 0);

    // 3. Platform revenue -- ILUASE_V1_BACKLOG.md 🔴 Critical fix: this was
    // a fabricated "10% of GMV" guess. Now sums the real, all-time
    // COMMISSION-type Transaction rows walletService.releaseEscrow() writes
    // when marketplace order escrows release (consultation side is
    // honestly $0 -- Consultations are paused and no commission is ever
    // collected there).
    const commissionAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'COMMISSION' },
    });
    const platformRevenue = Number(commissionAgg._sum?.amount || 0);

    // 4. Pending payouts (reuse existing method)
    const pendingPayouts = await this.getPendingPayoutsTotal();

    // 5. Refunds this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const refundsThisMonth = await this.prisma.refundRequest.count({
      where: {
        status: 'APPROVED',
        createdAt: { gte: startOfMonth.toISOString() },
      },
    });

    // 6. Failed payments this month (PAST_DUE subscriptions updated this month)
    const failedPaymentsThisMonth = await this.prisma.subscription.count({
      where: {
        status: 'PAST_DUE',
        updatedAt: { gte: startOfMonth.toISOString() },
      },
    });

    // 7. Subscription churn this month
    const churnThisMonth = await this.prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        updatedAt: { gte: startOfMonth.toISOString() },
      },
    });

    // 8. Revenue chart (6 months)
    const revenueChart = await this.getRevenueTrend(6);

    return {
      metrics: {
        mrr,
        totalGmv,
        platformRevenue,
        pendingPayouts,
        refundsIssuedThisMonth: refundsThisMonth,
        failedPaymentsThisMonth,
        subscriptionChurnThisMonth: churnThisMonth,
      },
      revenueChart,
    };
  }
}
