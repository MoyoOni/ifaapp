import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewBundleDto } from './dto/review-bundle.dto';
import { UpdateVendorTierDto } from '../vendor-community/dto/vendor-community.dto';
import { ReviewEventFeatureDto } from '../marketplace/dto/event-product-feature.dto';
import { ReviewVendorCertificationDto } from './dto/review-vendor-certification.dto';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

const CULTURAL_TRAINING_COURSE_SLUG = 'ori-the-metaphysics-of-consciousness';

const TIER_LABELS: Record<string, string> = {
  APPRENTICE: 'Apprentice',
  RECOGNIZED_ARTISAN: 'Recognized Artisan',
  MASTER_PRACTITIONER: 'Master Practitioner',
  ELDER_APPROVED: 'Elder-Approved',
};

// VENDOR_BACKLOG.md VND-017
const CERTIFICATION_TIER_LABELS: Record<string, string> = {
  COMMUNITY_LISTED: 'Community Listed',
  COMMUNITY_VERIFIED: 'Community Verified',
  ELDER_ENDORSED: 'Elder Endorsed',
};

@Injectable()
export class AdminMarketplaceService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async getAllProducts(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, businessName: true, userId: true } },
          reviews: { select: { rating: true } },
        },
      }),
      this.prisma.product.count(),
    ]);
    return {
      products: products.map((p) => ({
        ...p,
        avgRating:
          p.reviews.length > 0
            ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
            : null,
        reviewCount: p.reviews.length,
        reviews: undefined,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async removeProduct(productId: string, reason: string, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.update({ where: { id: productId }, data: { status: 'REMOVED' } });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'PRODUCT_REMOVED',
        resourceType: 'Product',
        resourceId: productId,
        newValues: { reason },
      },
    });
    return { success: true };
  }

  async featureProduct(productId: string, featuredUntil: Date | null) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { isFeatured: !!featuredUntil, featuredUntil },
    });
  }

  async getAllOrders(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          vendor: { select: { id: true, businessName: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.order.count(),
    ]);
    return { orders, total, page, pages: Math.ceil(total / limit) };
  }

  async getVendorHealth() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const vendors = await this.prisma.vendor.findMany({
      include: {
        products: { select: { id: true, status: true } },
        orders: {
          select: { id: true, status: true, createdAt: true },
          where: { createdAt: { gte: thirtyDaysAgo } },
        },
        user: { select: { id: true, name: true, email: true, updatedAt: true } },
      },
    });
    return vendors.map((v) => {
      const total = v.orders.length;
      const fulfilled = v.orders.filter((o) => o.status === 'DELIVERED').length;
      const lastLogin = v.user.updatedAt;
      const inactive = Date.now() - lastLogin.getTime() > 30 * 24 * 60 * 60 * 1000;
      return {
        // vendorId/vendorName/productCount: found while wiring up MSP-016's
        // tier-update UI to this same tab that the frontend's VendorHealth
        // interface (admin-marketplace-tab.tsx) had never actually matched
        // (it expected vendorId/vendorName/productCount; this returned
        // id/name with no productCount at all) -- same class of bug as the
        // P7-01 fix already noted elsewhere in that file. Fixed here since
        // it's the exact tab MSP-016 extends.
        vendorId: v.id,
        vendorName: v.businessName,
        email: v.user.email,
        productCount: v.products.length,
        activeProducts: v.products.filter((p) => p.status === 'ACTIVE').length,
        ordersLast30d: total,
        fulfillmentRate: total > 0 ? Math.round((fulfilled / total) * 100) : null,
        inactive,
        apprenticeshipTier: v.apprenticeshipTier,
      };
    });
  }

  // SHOP_BACKLOG.md MSP-002: bundle approval, routed through the same
  // admin-review pattern as reviewVendorApplication (ReviewVendorDto).
  async getPendingBundles() {
    return this.prisma.productBundle.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        items: { include: { product: { select: { id: true, name: true, price: true } } } },
        creator: { select: { id: true, businessName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewBundle(bundleId: string, dto: ReviewBundleDto, adminId: string) {
    const bundle = await this.prisma.productBundle.findUnique({
      where: { id: bundleId },
      include: { creator: { select: { userId: true } } },
    });
    if (!bundle) throw new NotFoundException('Bundle not found');

    const updated = await this.prisma.productBundle.update({
      where: { id: bundleId },
      data: {
        status: dto.approved ? 'APPROVED' : 'REJECTED',
        rejectionReason: dto.approved ? null : dto.rejectionReason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // SHOP_BACKLOG.md MSP-019: on approval, auto-create the two Forum
    // threads a Ritual Readiness Kit needs -- reuses Forum rather than a
    // parallel comment system. Skipped on re-approval if threads already
    // exist (this method can be called more than once for the same bundle).
    if (dto.approved && !bundle.supportThreadId && !bundle.reflectionThreadId) {
      const category = await this.prisma.forumCategory.findUnique({
        where: { slug: 'ritual-kits-ceremonies' },
      });
      if (category) {
        const [supportThread, reflectionThread] = await Promise.all([
          this.prisma.forumThread.create({
            data: {
              categoryId: category.id,
              authorId: bundle.creator.userId,
              title: `${bundle.name} — Support & Questions`,
              content: `A space to ask questions before or during "${bundle.name}". The vendor and community are here to help.`,
              tags: ['ritual-kit', 'support'],
            },
          }),
          this.prisma.forumThread.create({
            data: {
              categoryId: category.id,
              authorId: bundle.creator.userId,
              title: `${bundle.name} — Reflections`,
              content: `Completed this kit's ritual? Share how it went, what you felt, and any wisdom for the next person.`,
              tags: ['ritual-kit', 'reflection'],
            },
          }),
        ]);
        const withThreads = await this.prisma.productBundle.update({
          where: { id: bundleId },
          data: { supportThreadId: supportThread.id, reflectionThreadId: reflectionThread.id },
        });
        await this.prisma.forumCategory.update({
          where: { id: category.id },
          data: { threadCount: { increment: 2 } },
        });
        return withThreads;
      }
    }

    return updated;
  }

  // SHOP_BACKLOG.md MSP-015/MSP-003: "flagging with gentle education" review
  // queue, mirroring the ADM-018 heldForReview pattern used for ForumPost.
  async getFlaggedProducts() {
    return this.prisma.product.findMany({
      where: { heldForReview: true },
      include: {
        vendor: { select: { id: true, businessName: true } },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  // Clearing a flag always keeps the listing active -- whether the flag was
  // unfounded or the vendor already fixed the issue, the listing stays live
  // either way. If a flag turns out to be serious enough to remove the
  // listing, that's a separate, deliberate action via the existing
  // removeProduct() above, not an automatic side effect of clearing a flag.
  async clearProductFlag(productId: string, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id: productId },
      data: { heldForReview: false, reviewedBy: adminId, reviewedAt: new Date() },
    });
  }

  async getCategories() {
    const categories = await this.prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return categories.map((c) => ({ name: c.category, productCount: c._count.id }));
  }

  // SHOP_BACKLOG.md MSP-016: apprenticeship tier advancement is always an
  // admin/elder decision, never automatic (this doc's own "no algorithmic
  // black-box decisions" principle). Advancing past APPRENTICE requires the
  // vendor to have completed the mandatory cultural training -- reusing the
  // one live flagship Academy course rather than gating on a not-yet-built
  // dedicated vendor course (Academy is deliberately single-course for now,
  // see seed-academy-courses.ts's own note).
  async updateVendorTier(vendorId: string, dto: UpdateVendorTierDto, adminId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (dto.tier !== 'APPRENTICE') {
      const completedTraining = await this.prisma.enrollment.findFirst({
        where: {
          studentId: vendor.userId,
          completedAt: { not: null },
          course: { slug: CULTURAL_TRAINING_COURSE_SLUG },
        },
      });
      if (!completedTraining) {
        throw new BadRequestException(
          'This vendor must complete the mandatory cultural training course before advancing tier'
        );
      }
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { apprenticeshipTier: dto.tier, tierUpdatedAt: new Date(), tierUpdatedBy: adminId },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'VENDOR_TIER_UPDATED',
        resourceType: 'Vendor',
        resourceId: vendorId,
        newValues: { tier: dto.tier, reason: dto.reason },
      },
    });

    if (dto.tier !== 'APPRENTICE') {
      this.notificationService
        .createNotification({
          userId: vendor.userId,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.INFO,
          title: `You've been recognized as ${TIER_LABELS[dto.tier]}!`,
          message: `Your dedication and cultural integrity have been recognized. You are now a ${TIER_LABELS[dto.tier]} on Ìlú Àṣẹ.`,
          data: { vendorId, tier: dto.tier },
        })
        .catch(() => undefined);
    }

    return updated;
  }

  // VENDOR_BACKLOG.md VND-017: cultural certification review queue --
  // Community Verified / Elder Endorsed tier applications, same
  // admin-review pattern as reviewBundle/updateVendorTier above.
  async getCertificationApplications() {
    return this.prisma.vendorCertificationApplication.findMany({
      where: { status: 'PENDING' },
      include: {
        vendor: { select: { id: true, businessName: true, culturalCertificationTier: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewCertificationApplication(
    applicationId: string,
    dto: ReviewVendorCertificationDto,
    adminId: string
  ) {
    const application = await this.prisma.vendorCertificationApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Certification application not found');
    if (application.status !== 'PENDING') {
      throw new BadRequestException(`This application has already been ${application.status.toLowerCase()}`);
    }

    const updated = await this.prisma.vendorCertificationApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.approved ? 'APPROVED' : 'DECLINED',
        declineReason: dto.approved ? null : dto.declineReason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    if (dto.approved) {
      await this.prisma.vendor.update({
        where: { id: application.vendorId },
        data: { culturalCertificationTier: application.requestedTier },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'VENDOR_CERTIFICATION_REVIEWED',
        resourceType: 'Vendor',
        resourceId: application.vendorId,
        newValues: { requestedTier: application.requestedTier, approved: dto.approved, reason: dto.declineReason },
      },
    });

    const vendor = await this.prisma.vendor.findUnique({ where: { id: application.vendorId } });
    if (vendor) {
      this.notificationService
        .createNotification({
          userId: vendor.userId,
          type: NotificationType.SYSTEM,
          category: dto.approved ? NotificationCategory.SUCCESS : NotificationCategory.INFO,
          title: dto.approved
            ? `You're now ${CERTIFICATION_TIER_LABELS[application.requestedTier]}!`
            : 'Certification application declined',
          message: dto.approved
            ? `Your products now carry the ${CERTIFICATION_TIER_LABELS[application.requestedTier]} badge.`
            : `Your application for ${CERTIFICATION_TIER_LABELS[application.requestedTier]} was declined${dto.declineReason ? `: ${dto.declineReason}` : '.'}${dto.declineReason ? '' : ' You may reapply.'}`,
          data: { vendorId: application.vendorId, requestedTier: application.requestedTier },
        })
        .catch(() => undefined);
    }

    return updated;
  }

  // SHOP_BACKLOG.md MSP-008: vendor request flow for seasonal item
  // promotions, routed through this same admin-review pipeline.
  async getPendingEventFeatureRequests() {
    return this.prisma.eventProductFeature.findMany({
      where: { status: 'PENDING' },
      include: {
        event: { select: { id: true, title: true, date: true } },
        product: { select: { id: true, name: true, images: true } },
        vendor: { select: { id: true, businessName: true } },
      },
      orderBy: { requestedAt: 'asc' },
    });
  }

  async reviewEventFeatureRequest(id: string, dto: ReviewEventFeatureDto, adminId: string) {
    const request = await this.prisma.eventProductFeature.findUnique({
      where: { id },
      include: { event: true, vendor: { select: { userId: true, businessName: true } } },
    });
    if (!request) throw new NotFoundException('Feature request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been reviewed');
    }

    const updated = await this.prisma.eventProductFeature.update({
      where: { id },
      data: {
        status: dto.approved ? 'APPROVED' : 'REJECTED',
        rejectionReason: dto.approved ? null : dto.rejectionReason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    if (dto.approved) {
      // Early visibility for the approved item, through the event's own
      // window -- this is the "early access for ceremonial preparation
      // items" criterion: promotional surfacing ahead of/through the event,
      // not a purchase-gating mechanism.
      await this.prisma.product.update({
        where: { id: request.productId },
        data: { isFeatured: true, featuredUntil: request.event.endDate ?? request.event.date },
      });
    }

    this.notificationService
      .createNotification({
        userId: request.vendor.userId,
        type: NotificationType.SYSTEM,
        category: dto.approved ? NotificationCategory.SUCCESS : NotificationCategory.INFO,
        title: dto.approved
          ? `Your item was approved for "${request.event.title}"!`
          : `Feature request for "${request.event.title}" was not approved`,
        message: dto.approved
          ? `Your product is now featured ahead of ${request.event.title}.`
          : dto.rejectionReason || 'This request was not approved this time.',
        data: { eventId: request.eventId, productId: request.productId },
      })
      .catch(() => undefined);

    return updated;
  }
}
