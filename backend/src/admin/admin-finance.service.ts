import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AdminFinanceService {
  private readonly logger = new Logger(AdminFinanceService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private paymentsService: PaymentsService
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

      // Release partial amount to provider, refund rest to client
      const providerAmount = escrow.amount - dto.refundAmount;
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

      // Refund remainder
      if (dto.refundAmount < escrow.amount) {
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
   * Approve or reject withdrawal request
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

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal request is not pending');
    }

    const updated = await this.prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: action,
        adminNotes: notes,
        processedAt: new Date(),
        processedBy: processedBy.id,
      },
    });

    this.logger.log(
      `Withdrawal ${withdrawalId} ${action === 'APPROVE' ? 'approved' : 'rejected'} by admin ${processedBy.id}`
    );

    return updated;
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
          status: 'COMPLETED' 
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { 
          createdAt: { gte: startOfMonth.toISOString() }, 
          status: 'DELIVERED' 
        },
      }),
    ]);
    
    const thisMonthGMV = ((appointmentRevenue._sum?.price || 0) as number) + ((orderRevenue._sum?.totalAmount || 0) as number);

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

    // 5. Projections
    const projectedMRR = currentMRR * (1 + monthlyGrowthRate);
    const churnAdjustedMRR = currentMRR * (1 - churnRate) * (1 + monthlyGrowthRate);
    const projectedAnnualGMV = thisMonthGMV * 12;
    const projectedAnnualPlatformRevenue = projectedAnnualGMV * 0.1; // assuming 10% platform fee, adjust if different

    // 6. Platform cost (configurable) - using existing platform settings
    const platformCostNgn = await this.getPlatformCost(); // helper method

    // 7. Break-even
    const breakEvenThreshold = platformCostNgn > 0 ? platformCostNgn / (projectedAnnualPlatformRevenue / 12) : 0;
    const monthsToBreakEven = breakEvenThreshold > 0 ? Math.ceil(breakEvenThreshold) : 0;

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
      platformCostNgn,
      breakEvenThreshold,
      monthsToBreakEven,
      churnRate,
      currentSubscribers,
      trend,
    };
  }

  private async getPlatformCost(): Promise<number> {
    // Try to get from platform settings - using existing fields
    // Check if there's a PlatformSettings table with a cost field
    const settings = await this.prisma.platformSettings.findFirst();
    if (settings) {
      // Calculate based on commission percentages and other settings
      // Using a combination of values as an estimate of platform costs
      return (settings.consultationCommissionPct + settings.marketplaceCommissionPct) * 10000; // placeholder calculation
    }
    // Default fallback
    return 500000; // 500k NGN as placeholder
  }

  async getPendingPayoutsTotal(): Promise<number> {
    // Reuse existing withdrawal pending logic
    const pending = await this.prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      select: { amount: true },
    });
    return pending.reduce((sum, w) => sum + w.amount, 0);
  }

  private async getRevenueTrend(months: number = 6) {
    const now = new Date();
    const trend = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const [apptSum, orderSum] = await Promise.all([
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
      ]);
      const gmv = (apptSum._sum?.price || 0) + (orderSum._sum?.totalAmount || 0);
      const revenue = gmv * 0.1;
      trend.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue,
      });
    }
    return trend;
  }

  async getActiveSubscribers() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
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
    const totalGmv = (apptAgg._sum?.price || 0) + (orderAgg._sum?.totalAmount || 0);

    // 3. Platform revenue (10% of GMV)
    const platformRevenue = totalGmv * 0.1;

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
