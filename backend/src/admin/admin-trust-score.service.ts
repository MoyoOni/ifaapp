import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminTrustScoreService {
  constructor(private prisma: PrismaService) {}

  // Full audit trail — reads from AuditLog filtered to trust score events
  async getTrustScoreAudit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        trustScore: true,
        trustScoreOverride: true,
        trustScoreOverrideReason: true,
        trustScoreOverrideBy: true,
        trustScoreOverrideAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const auditEntries = await this.prisma.auditLog.findMany({
      where: { resourceType: 'TrustScore', resourceId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, name: true } } },
    });

    // SHOP_BACKLOG.md MSP-006: this override tool (applyOverride below) was
    // already generic -- any userId, including a vendor's -- but this
    // breakdown was hardcoded to babalawo-shaped signals (appointments,
    // reviews, forum activity), so an admin reviewing a vendor's trust score
    // saw all-zero/irrelevant numbers with no way to see the vendor conduct
    // history (disputes, fulfillment) an override/restoration decision
    // should actually be based on. That's the missing connective tissue
    // between "a conflict was resolved" and "trust can be restored" --
    // reusing existing Dispute/ReturnRequest/ProductReview/VND-017
    // certification data, not a parallel trust system.
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    const breakdown = vendor ? await this.getVendorBreakdown(vendor) : await this.getPractitionerBreakdown(userId);

    return { user, breakdown, auditEntries };
  }

  private async getPractitionerBreakdown(userId: string) {
    const [appointments, reviews, posts, threads, referrals, certificates] = await Promise.all([
      this.prisma.appointment.count({ where: { babalawoId: userId, status: 'COMPLETED' } }),
      this.prisma.babalawoReview.aggregate({
        where: { babalawoId: userId },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.forumPost.count({ where: { authorId: userId, status: 'PUBLISHED' } }),
      this.prisma.forumThread.count({ where: { authorId: userId } }),
      this.prisma.referral.count({ where: { referrerId: userId } }),
      this.prisma.certificate.count({ where: { userId } }),
    ]);

    return [
      {
        component: 'Completed consultations',
        value: appointments,
        points: Math.min(appointments * 5, 30),
      },
      {
        component: 'Average review rating',
        value: reviews._avg.rating?.toFixed(1) ?? 'N/A',
        points: reviews._count.id > 0 ? Math.round((reviews._avg.rating ?? 0) * 4) : 0,
      },
      { component: 'Forum posts', value: posts, points: Math.min(posts * 1, 10) },
      { component: 'Forum threads', value: threads, points: Math.min(threads * 2, 10) },
      { component: 'Referrals', value: referrals, points: Math.min(referrals * 3, 15) },
      { component: 'Certificates', value: certificates, points: Math.min(certificates * 5, 15) },
    ];
  }

  private async getVendorBreakdown(vendor: { id: string; userId: string }) {
    const [reviewAgg, disputes, returnCount, orderCount, endorsements] = await Promise.all([
      this.prisma.productReview.aggregate({
        where: { product: { vendorId: vendor.id }, status: 'ACTIVE' },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.dispute.findMany({
        where: { respondentId: vendor.userId, orderId: { not: null } },
        select: { status: true },
      }),
      this.prisma.returnRequest.count({ where: { vendorId: vendor.id } }),
      this.prisma.order.count({ where: { vendorId: vendor.id } }),
      this.prisma.elderEndorsement.count({ where: { endorseeId: vendor.userId } }),
    ]);

    const resolvedDisputes = disputes.filter((d) => d.status === 'RESOLVED').length;
    const disputeResolutionRate = disputes.length > 0 ? Math.round((resolvedDisputes / disputes.length) * 100) : null;

    return [
      {
        component: 'Average product rating',
        value: reviewAgg._avg.rating?.toFixed(1) ?? 'N/A',
        points: reviewAgg._count.id > 0 ? Math.round((reviewAgg._avg.rating ?? 0) * 4) : 0,
      },
      { component: 'Product reviews', value: reviewAgg._count.id, points: Math.min(reviewAgg._count.id, 15) },
      {
        component: 'Order disputes (resolved / total)',
        value: `${resolvedDisputes}/${disputes.length}`,
        points: disputeResolutionRate === null ? 0 : Math.round((disputeResolutionRate / 100) * 15),
      },
      { component: 'Return requests', value: returnCount, points: 0 },
      { component: 'Total orders', value: orderCount, points: Math.min(Math.round(orderCount / 5), 15) },
      { component: 'Elder endorsements', value: endorsements, points: Math.min(endorsements * 5, 15) },
    ];
  }

  async applyOverride(userId: string, override: number | null, reason: string, adminId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        trustScoreOverride: override,
        trustScoreOverrideReason: reason,
        trustScoreOverrideBy: adminId,
        trustScoreOverrideAt: new Date(),
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'TRUST_SCORE_OVERRIDE',
        resourceType: 'TrustScore',
        resourceId: userId,
        newValues: { override, reason },
      },
    });
    return { success: true };
  }

  async getOverrideHistory(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { resourceType: 'TrustScore', resourceId: userId, action: 'TRUST_SCORE_OVERRIDE' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async getOverrideAdjustments() {
    return this.prisma.user.findMany({
      where: {
        trustScoreOverride: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        trustScoreOverride: true,
        trustScoreOverrideReason: true,
        trustScoreOverrideBy: true,
        trustScoreOverrideAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getPractitionersForFeaturing() {
    const practitioners = await this.prisma.user.findMany({
      where: {
        role: 'BABALAWO',
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        averageRating: true,
        trustScore: true,
        trustScoreOverride: true,
        trustScoreOverrideReason: true,
        trustScoreOverrideBy: true,
        trustScoreOverrideAt: true,
        isFeatured: true,
        featuredOrder: true,
        featuredExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Add totalReviews by counting reviews for each practitioner
    const practitionersWithReviews = await Promise.all(
      practitioners.map(async (practitioner) => {
        const totalReviews = await this.prisma.babalawoReview.count({
          where: { babalawoId: practitioner.id },
        });

        return {
          ...practitioner,
          totalReviews,
        };
      })
    );

    return practitionersWithReviews;
  }

  async getFeaturedPractitioners() {
    const practitioners = await this.prisma.user.findMany({
      where: {
        role: 'BABALAWO',
        isFeatured: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        averageRating: true,
        trustScore: true,
        isFeatured: true,
        featuredOrder: true,
        featuredExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Add totalReviews by counting reviews for each practitioner
    const practitionersWithReviews = await Promise.all(
      practitioners.map(async (practitioner) => {
        const totalReviews = await this.prisma.babalawoReview.count({
          where: { babalawoId: practitioner.id },
        });

        return {
          ...practitioner,
          totalReviews,
        };
      })
    );

    return practitionersWithReviews;
  }

  async updatePractitionerFeaturedStatus(
    userId: string,
    isFeatured: boolean,
    featuredOrder?: number,
    featuredExpiry?: Date
  ) {
    const practitioner = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isFeatured,
        featuredOrder: featuredOrder ?? null,
        featuredExpiry: featuredExpiry ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        averageRating: true,
        trustScore: true,
        isFeatured: true,
        featuredOrder: true,
        featuredExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Add totalReviews to the response
    const totalReviews = await this.prisma.babalawoReview.count({
      where: { babalawoId: practitioner.id },
    });

    return {
      ...practitioner,
      totalReviews,
    };
  }
}
