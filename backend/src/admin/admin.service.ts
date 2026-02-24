import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStage, UserRole, VendorStatus, AdminSubRole } from '@ile-ase/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { VerificationService } from '../verification/verification.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';
import { CirclesService } from '../circles/circles.service';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { CreateAdvisoryVoteDto } from './dto/advisory-board.dto';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { AuditService } from './audit.service';
import { CreateCircleDto } from '../circles/dto/create-circle.dto';

interface AuditFilters {
  page: number;
  limit: number;
  action?: string;
  userId?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private verificationService: VerificationService,
    private walletService: WalletService,
    private paymentsService: PaymentsService,
    private circlesService: CirclesService,
    private notificationService: NotificationService,
    private auditService: AuditService
  ) {}

  /**
   * Get Platform Statistics
   * Analytics for admin dashboard
   */
  async getPlatformStats(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can access platform statistics');
    }

    const [
      totalUsers,
      verifiedBabalawos,
      pendingVerifications,
      activeRelationships,
      totalAppointments,
      totalMessages,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'BABALAWO', verified: true } }),
      this.prisma.verificationApplication.count({
        where: { currentStage: { not: VerificationStage.ETHICS_AGREEMENT } },
      }),
      this.prisma.babalawoClient.count({ where: { status: 'ACTIVE' } }),
      this.prisma.appointment.count(),
      this.prisma.message.count(),
    ]);

    return {
      totalUsers,
      verifiedBabalawos,
      pendingVerifications,
      activeRelationships,
      totalAppointments,
      totalMessages,
    };
  }

  /**
   * Get All Users (Admin only)
   */
  async getAllUsers(
    currentUser: CurrentUserPayload,
    filters?: { role?: string; verified?: boolean }
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view all users');
    }

    const where: Record<string, unknown> = {};
    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.verified !== undefined) {
      where.verified = filters.verified;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        hasOnboarded: true,
        culturalLevel: true,
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }

  /**
   * Get Verification Applications for Review
   */
  async getVerificationApplications(currentUser: CurrentUserPayload, stage?: VerificationStage) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can review verification applications');
    }

    const where = stage ? { currentStage: stage } : {};

    const applications = await this.prisma.verificationApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        history: {
          orderBy: { timestamp: 'desc' },
          take: 5, // Latest 5 status updates
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return applications;
  }

  /**
   * Approve verification application
   */
  async approveVerification(
    id: string,
    dto: ApproveVerificationDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve verification applications');
    }

    const application = await this.prisma.verificationApplication.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Verification application not found');
    }

    // Update application status
    const updatedApplication = await this.prisma.verificationApplication.update({
      where: { id },
      data: {
        approvedById: currentUser.id,
        approvedAt: new Date(),
        currentStage: 'APPROVED' as VerificationStage,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update user verification status
    await this.prisma.user.update({
      where: { id: application.userId },
      data: {
        verified: true,
        role: 'BABALAWO', // Promote to Babalawo after verification
      },
    });

    // Send notification to user
    await this.notificationService.createNotification({
      userId: application.userId,
      type: NotificationType.VERIFICATION,
      category: NotificationCategory.SUCCESS,
      title: 'Verification Approved',
      message: `Your ${application.lineage} verification has been approved.`,
      sendEmail: true,
      sendPush: true,
    });

    return updatedApplication;
  }

  /**
   * Reject verification application
   */
  async rejectVerification(
    id: string,
    dto: ApproveVerificationDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reject verification applications');
    }

    const application = await this.prisma.verificationApplication.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Verification application not found');
    }

    // Update application status
    const updatedApplication = await this.prisma.verificationApplication.update({
      where: { id },
      data: {
        rejectedById: currentUser.id,
        rejectedAt: new Date(),
        rejectionReason: dto.reason || 'Application rejected by admin',
        currentStage: 'REJECTED' as VerificationStage,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send notification to user
    await this.notificationService.createNotification({
      userId: application.userId,
      type: NotificationType.VERIFICATION,
      category: NotificationCategory.ERROR,
      title: 'Verification Rejected',
      message: `Your ${application.lineage} verification has been rejected. Reason: ${dto.reason}`,
      sendEmail: true,
      sendPush: true,
    });

    return updatedApplication;
  }

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
    approve: boolean,
    notes: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
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
        status: approve ? 'APPROVED' : 'REJECTED',
        adminNotes: notes,
        processedAt: new Date(),
        processedBy: currentUser.id,
      },
    });

    this.logger.log(
      `Withdrawal ${withdrawalId} ${approve ? 'approved' : 'rejected'} by admin ${currentUser.id}`
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
   * Get enhanced analytics
   */
  async getAnalytics(currentUser: CurrentUserPayload, period: string = '30d') {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can access analytics');
    }

    // Calculate date range
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const [
      userGrowth,
      transactionVolume,
      totalRevenue,
      appointmentStats,
      prescriptionStats,
      disputeStats,
    ] = await Promise.all([
      // User growth
      this.prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Transaction volume
      this.prisma.transaction.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
          type: { in: ['DEPOSIT', 'PAYMENT'] },
        },
        _sum: { amount: true },
        _count: true,
      }),

      // Total revenue (escrow fees, commissions)
      this.prisma.escrow.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'RELEASED',
        },
        _sum: { amount: true },
        _count: true,
      }),

      // Appointment stats
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),

      // Guidance Plan stats
      this.prisma.guidancePlan.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),

      // Dispute stats
      this.prisma.escrow.count({
        where: {
          status: 'DISPUTED',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      period,
      userGrowth,
      transactionVolume: {
        total: transactionVolume._sum.amount || 0,
        count: transactionVolume._count || 0,
      },
      totalRevenue: {
        total: totalRevenue._sum.amount || 0,
        count: totalRevenue._count || 0,
      },
      appointmentStats,
      prescriptionStats,
      disputeCount: disputeStats,
    };
  }

  /**
   * Get pending vendor applications for cultural vetting
   */
  async getPendingVendors(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view vendor applications');
    }

    const vendors = await this.prisma.vendor.findMany({
      where: {
        status: VendorStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            yorubaName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vendors;
  }

  /**
   * Review vendor application with cultural vetting
   */
  async reviewVendorApplication(
    vendorId: string,
    dto: { approved: boolean; culturalAuthenticityNotes?: string; rejectionReason?: string },
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can review vendor applications');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor application not found');
    }

    if (vendor.status !== VendorStatus.PENDING) {
      throw new BadRequestException('Vendor application is not pending');
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: dto.approved ? VendorStatus.APPROVED : VendorStatus.REJECTED,
        verifiedAt: dto.approved ? new Date() : null,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        culturalAuthenticityNotes: dto.culturalAuthenticityNotes,
        rejectionReason: dto.rejectionReason,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Vendor application ${vendorId} ${dto.approved ? 'approved' : 'rejected'} by admin ${currentUser.id}`
    );

    return updated;
  }

  /**
   * Get reported content (flagged reviews)
   */
  async getReportedContent(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view reported content');
    }

    const [productReviews, babalawoReviews, courseReviews] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { flaggedCount: { gt: 0 }, status: { not: 'REMOVED' } },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true } },
        },
      }),
      this.prisma.babalawoReview.findMany({
        where: { flaggedCount: { gt: 0 }, status: { not: 'REMOVED' } },
        include: {
          client: { select: { id: true, name: true, email: true } },
          babalawo: { select: { id: true, name: true } },
        },
      }),
      this.prisma.courseReview.findMany({
        where: { flaggedCount: { gt: 0 }, status: { not: 'REMOVED' } },
        include: {
          student: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      }),
    ]);

    // Normalize
    const reports = [
      ...productReviews.map((r) => ({
        id: r.id,
        type: 'PRODUCT_REVIEW',
        content: r.content,
        rating: r.rating,
        flaggedCount: r.flaggedCount,
        reporter: 'Community', // Aggregated
        targetId: r.productId,
        targetName: r.product.name,
        authorName: r.customer.name,
        createdAt: r.createdAt,
      })),
      ...babalawoReviews.map((r) => ({
        id: r.id,
        type: 'BABALAWO_REVIEW',
        content: r.content,
        rating: r.rating,
        flaggedCount: r.flaggedCount,
        reporter: 'Community',
        targetId: r.babalawoId,
        targetName: r.babalawo.name,
        authorName: r.client.name,
        createdAt: r.createdAt,
      })),
      ...courseReviews.map((r) => ({
        id: r.id,
        type: 'COURSE_REVIEW',
        content: r.content,
        rating: r.rating,
        flaggedCount: r.flaggedCount,
        reporter: 'Community',
        targetId: r.courseId,
        targetName: r.course.title,
        authorName: r.student.name,
        createdAt: r.createdAt,
      })),
    ];

    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Resolve reported content
   */
  async resolveReportedContent(
    type: string,
    id: string,
    action: 'DISMISS' | 'REMOVE',
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can resolve reports');
    }

    const updateData = {
      status: action === 'REMOVE' ? 'REMOVED' : 'ACTIVE', // If dismissed, verify status is active
      moderatedBy: currentUser.id,
      moderatedAt: new Date(),
      moderationNotes: `Report resolved: ${action}`,
      flaggedCount: action === 'DISMISS' ? 0 : undefined, // Reset flags if dismissed
    };

    if (type === 'PRODUCT_REVIEW') {
      return this.prisma.productReview.update({ where: { id }, data: updateData });
    } else if (type === 'BABALAWO_REVIEW') {
      return this.prisma.babalawoReview.update({ where: { id }, data: updateData });
    } else if (type === 'COURSE_REVIEW') {
      return this.prisma.courseReview.update({ where: { id }, data: updateData });
    } else {
      throw new BadRequestException('Invalid content type');
    }
  }

  /**
   * Create an advisory board vote
   */
  async createAdvisoryVote(
    userId: string,
    createVoteDto: CreateAdvisoryVoteDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISORY_BOARD_MEMBER') {
      throw new ForbiddenException('Only advisory board members can create votes');
    }

    // Verify user is an advisory board member
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISORY_BOARD_MEMBER') {
      throw new ForbiddenException('Only advisory board members can create votes');
    }

    // Create the vote
    const vote = await this.prisma.advisoryVote.create({
      data: {
        title: createVoteDto.title,
        description: createVoteDto.description,
        proposerId: userId,
        deadline: new Date(createVoteDto.deadline),
        requiredMajority: createVoteDto.requiredMajority,
        status: 'PENDING', // Will be activated when quorum is met
        options: {
          create: createVoteDto.voteOptions.map((option) => ({
            option,
            voteCount: 0,
          })),
        },
      },
      include: {
        options: true,
        proposer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            role: true,
          },
        },
      },
    });

    return vote;
  }

  /**
   * Get advisory board votes
   */
  async getAdvisoryVotes(userId: string, status: string | null, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISORY_BOARD_MEMBER') {
      throw new ForbiddenException('Only advisory board members can view votes');
    }

    const where: any = {};
    if (status) {
      const statuses = status.split(',');
      where.status = { in: statuses };
    }

    const votes = await this.prisma.advisoryVote.findMany({
      where,
      include: {
        options: {
          select: {
            option: true,
            voteCount: true,
          },
        },
        proposer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            role: true,
          },
        },
        casts: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format results to match frontend expectations
    return votes.map((vote) => {
      const totalVotes = vote.casts.length;
      const yesVotes =
        vote.options.find((opt) => opt.option.toLowerCase() === 'yes')?.voteCount || 0;
      const noVotes = vote.options.find((opt) => opt.option.toLowerCase() === 'no')?.voteCount || 0;
      const abstainVotes = totalVotes - yesVotes - noVotes;

      return {
        ...vote,
        votes: {
          yes: yesVotes,
          no: noVotes,
          abstain: abstainVotes,
        },
        voterCount: totalVotes,
        voteOptions: vote.options.map((opt) => opt.option),
        results: vote.options.map((opt) => ({
          option: opt.option,
          count: opt.voteCount,
          percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
        })),
      };
    });
  }

  /**
   * Cast a vote in an advisory board vote
   */
  async castAdvisoryVote(voteId: string, option: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISORY_BOARD_MEMBER') {
      throw new ForbiddenException('Only advisory board members can vote');
    }

    // Check if vote exists and is active
    const vote = await this.prisma.advisoryVote.findUnique({
      where: { id: voteId },
      include: {
        options: true,
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    if (vote.status !== 'ACTIVE' && vote.status !== 'PENDING') {
      throw new BadRequestException('Vote is not active');
    }

    if (new Date(vote.deadline) < new Date()) {
      throw new BadRequestException('Vote deadline has passed');
    }

    // Check if user has already voted
    const existingVote = await this.prisma.advisoryVoteCast.findFirst({
      where: {
        voteId,
        userId: currentUser.id,
      },
    });

    if (existingVote) {
      throw new BadRequestException('You have already voted in this poll');
    }

    // Verify the option is valid
    const validOption = vote.options.find((opt) => opt.option === option);
    if (!validOption) {
      throw new BadRequestException('Invalid vote option');
    }

    // Create the vote cast
    const voteCast = await this.prisma.advisoryVoteCast.create({
      data: {
        voteId,
        userId: currentUser.id,
        option,
      },
    });

    // Increment the option count
    await this.prisma.advisoryVoteOption.update({
      where: {
        id: validOption.id,
      },
      data: {
        voteCount: {
          increment: 1,
        },
      },
    });

    // Update vote status if quorum is met (more than 50% of advisory board members)
    const totalAdvisoryMembers = await this.prisma.user.count({
      where: { role: 'ADVISORY_BOARD_MEMBER' },
    });

    const currentVotes = await this.prisma.advisoryVoteCast.count({
      where: { voteId },
    });

    if (currentVotes > totalAdvisoryMembers / 2 && vote.status === 'PENDING') {
      await this.prisma.advisoryVote.update({
        where: { id: voteId },
        data: { status: 'ACTIVE' },
      });
    }

    // Check if vote has ended and determine result
    if (new Date(vote.deadline) < new Date()) {
      await this.determineVoteResult(voteId);
    }

    return voteCast;
  }

  /**
   * Determine and finalize vote result
   */
  private async determineVoteResult(voteId: string) {
    const vote = await this.prisma.advisoryVote.findUnique({
      where: { id: voteId },
      include: {
        options: true,
        casts: true,
      },
    });

    if (!vote || vote.status !== 'ACTIVE') {
      return;
    }

    // Calculate results
    const totalVotes = vote.casts.length;
    if (totalVotes === 0) {
      await this.prisma.advisoryVote.update({
        where: { id: voteId },
        data: { status: 'REJECTED' },
      });
      return;
    }

    // Find the winning option
    const winner = vote.options.reduce((prev, current) =>
      prev.voteCount > current.voteCount ? prev : current
    );

    // Check if it meets the required majority
    let status: string;
    const requiredMajority = vote.requiredMajority;

    if (requiredMajority === 'UNANIMOUS' && winner.voteCount !== totalVotes) {
      status = 'REJECTED';
    } else if (requiredMajority === 'SUPER' && winner.voteCount / totalVotes < 0.75) {
      status = 'REJECTED';
    } else if (requiredMajority === 'SIMPLE' && winner.voteCount / totalVotes <= 0.5) {
      status = 'REJECTED';
    } else {
      status = 'APPROVED';
    }

    // Update vote status
    await this.prisma.advisoryVote.update({
      where: { id: voteId },
      data: { status: status as any },
    });
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
   * Get circle suggestions with optional status filter
   */
  async getCircleSuggestions(currentUser: CurrentUserPayload, status?: string) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view circle suggestions');
    }

    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.circleSuggestion.findMany({
      where,
      include: {
        suggester: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve circle suggestion and create circle
   */
  async approveCircleSuggestion(
    suggestionId: string,
    circleData: CreateCircleDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve circle suggestions');
    }

    return this.circlesService.createFromSuggestion(suggestionId, circleData, currentUser);
  }

  /**
   * Reject circle suggestion
   */
  async rejectCircleSuggestion(
    suggestionId: string,
    reason: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reject circle suggestions');
    }

    const suggestion = await this.prisma.circleSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Circle suggestion not found');
    }

    if (suggestion.status !== 'PENDING') {
      throw new BadRequestException('Suggestion has already been processed');
    }

    return this.prisma.circleSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'REJECTED',
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        notes: reason,
      },
      include: {
        suggester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Get pending circles (circles needing approval)
   */
  async getPendingCircles(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view pending circles');
    }

    return this.prisma.circle.findMany({
      where: {
        status: 'PENDING_APPROVAL',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        suggester: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Moderate circle (archive, delete, etc.)
   */
  async moderateCircle(
    circleId: string,
    action: 'ARCHIVE' | 'DELETE' | 'ACTIVATE',
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can moderate circles');
    }

    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    if (action === 'DELETE') {
      return this.prisma.circle.delete({
        where: { id: circleId },
      });
    }

    const statusMap = {
      ARCHIVE: 'ARCHIVED',
      ACTIVATE: 'ACTIVE',
    };

    return this.prisma.circle.update({
      where: { id: circleId },
      data: {
        status: statusMap[action],
        active: action === 'ACTIVATE',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
      },
    });
  }

  /**
   * Approve and promote circle event to main events directory
   */
  async approveCircleEvent(eventId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve circle events');
    }

    // This will be implemented when EventsService is injected
    // For now, we'll use Prisma directly
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { circle: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.circleId) {
      throw new BadRequestException('This event is not associated with a circle');
    }

    // Publish the event
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        published: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ['REGISTERED', 'ATTENDED'] },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Log PII reveal action
   * Used when admin reveals sensitive personal information
   */
  async logPiiReveal(
    adminUserId: string,
    entityType: string,
    entityId: string,
    fieldLabel: string,
    reason: string,
  ): Promise<void> {
    this.logger.log(`Logging PII reveal for ${entityType}:${entityId} by admin ${adminUserId}`);
    
    // Log the action in the audit trail
    await this.auditService.logAction({
      adminId: adminUserId,
      action: 'REVEAL_PII',
      entityType,
      entityId,
      reason,
      payload: {
        fieldLabel,
        reason,
        piiReveal: true,
      },
    });
  }

  async getAuditStats() {
    const totalLogs = await this.prisma.auditLog.count();
    const recentLogs = await this.prisma.auditLog.count({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    return { totalLogs, recentLogs };
  }

  async getAuditLogs(currentUser: CurrentUserPayload, filters: any) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view audit logs');
    }
    return this.auditService.getAuditLogs(filters);
  }

  async impersonateUser(currentUser: CurrentUserPayload, targetUserId: string, reason: string) {
    if (currentUser.role !== 'ADMIN' || currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can impersonate users');
    }

    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException('A valid reason with at least 10 characters is required for impersonation');
    }

    // Fetch target user details
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Log the impersonation action for audit purposes
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'IMPERSONATE_USER',
      entityType: 'USER',
      entityId: targetUserId,
      reason,
      payload: {
        targetUserId,
        targetUserEmail: targetUser.email,
        reason,
        impersonatorId: currentUser.id,
        impersonatorEmail: currentUser.email,
        timestamp: new Date()
      },
    });

    // For security reasons, we won't return actual user credentials here
    // Instead, we'll return a confirmation that the impersonation was logged
    return {
      impersonationLogged: true,
      targetUserId,
      reason,
      impersonationStartedAt: new Date()
    };
  }

  /**
   * Create or update admin user with specific sub-role
   */
  async createOrUpdateAdmin(
    currentUser: CurrentUserPayload,
    userData: {
      email: string;
      name: string;
      adminSubRole: string;
      sendInvite?: boolean;
    }
  ) {
    if (currentUser.role !== 'ADMIN' || currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can manage admin accounts');
    }

    // Validate admin sub-role
    const validSubRoles = Object.values(AdminSubRole);
    if (!validSubRoles.includes(userData.adminSubRole as AdminSubRole)) {
      throw new BadRequestException(`Invalid admin sub-role. Valid values: ${validSubRoles.join(', ')}`);
    }

    // Check if user already exists
    let adminUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (adminUser) {
      // Update existing admin user
      if (adminUser.role !== 'ADMIN') {
        throw new BadRequestException('Cannot convert non-admin user to admin via this endpoint');
      }

      adminUser = await this.prisma.user.update({
        where: { email: userData.email },
        data: {
          name: userData.name,
          adminSubRole: userData.adminSubRole,
        },
      });
    } else {
      // Create new admin user
      // Generate a random temporary password for new admin users
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      adminUser = await this.prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          passwordHash,
          role: 'ADMIN',
          adminSubRole: userData.adminSubRole,
          verified: true, // Admins are auto-verified
        },
      });

      // Send invitation if requested
      if (userData.sendInvite) {
        await this.notificationService.createNotification({
          userId: adminUser.id,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.INFO,
          title: 'Admin Account Created',
          message: `An admin account has been created for you with ${adminUser.adminSubRole} permissions.`,
          sendEmail: true,
        });
      }
    }

    // Log the admin creation/update
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: adminUser.id === adminUser.id ? 'ADMIN_USER_CREATED' : 'ADMIN_USER_UPDATED',
      entityType: 'USER',
      entityId: adminUser.id,
      reason: adminUser.id === adminUser.id ? 'New admin user created' : 'Existing admin updated',
      payload: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        adminSubRole: adminUser.adminSubRole,
        updatedBy: currentUser.id,
        updatedByEmail: currentUser.email
      }
    });

    return adminUser;
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(currentUser: CurrentUserPayload, filters?: { adminSubRole?: string }) {
    if (currentUser.role !== 'ADMIN' || currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can view admin accounts');
    }

    const where: Record<string, unknown> = { role: 'ADMIN' };
    if (filters?.adminSubRole) {
      where.adminSubRole = filters.adminSubRole;
    }

    const admins = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        adminSubRole: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return admins;
  }

  /**
   * Remove admin privileges from user
   */
  async removeAdminPrivileges(currentUser: CurrentUserPayload, userId: string) {
    if (currentUser.role !== 'ADMIN' || currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can remove admin privileges');
    }

    if (currentUser.id === userId) {
      throw new BadRequestException('Admins cannot remove their own admin privileges');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new BadRequestException('User is not an admin');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'CLIENT', // Demote to client
        adminSubRole: null,
      },
    });

    // Log the removal
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'ADMIN_PRIVILEGES_REMOVED',
      entityType: 'USER',
      entityId: userId,
      reason: 'Admin privileges removed by super admin',
      payload: {
        previousRole: 'ADMIN',
        previousAdminSubRole: user.adminSubRole,
        newRole: 'CLIENT',
        newAdminSubRole: null,
        removedBy: currentUser.id,
        removedByEmail: currentUser.email
      }
    });

    return updatedUser;
  }
}
