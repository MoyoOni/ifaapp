import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { CreateBabalawoReviewDto } from './dto/create-babalawo-review.dto';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { RespondToReviewDto } from './dto/respond-to-review.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

/**
 * Reviews Service
 * Handles review creation, moderation, and aggregation
 */
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  // ============================================
  // PRODUCT REVIEWS
  // ============================================

  /**
   * Create a product review
   */
  async createProductReview(
    productId: string,
    dto: CreateProductReviewDto,
    currentUser: CurrentUserPayload
  ) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = await this.prisma.productReview.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId: currentUser.id,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Verify order if orderId is provided
    if (dto.orderId) {
      const order = await this.prisma.order.findFirst({
        where: {
          id: dto.orderId,
          customerId: currentUser.id,
          status: { in: ['DELIVERED', 'COMPLETED'] },
        },
        include: {
          items: {
            where: { productId },
          },
        },
      });

      if (!order || order.items.length === 0) {
        throw new BadRequestException('Invalid order or product not in order');
      }
    }

    // Create review
    const review = await this.prisma.productReview.create({
      data: {
        productId,
        customerId: currentUser.id,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        orderId: dto.orderId,
        status: 'PENDING', // Requires moderation
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating (async, don't await)
    this.updateProductRating(productId).catch((err) => {
      this.logger.error(`Failed to update product rating: ${err.message}`);
    });

    // VENDOR_BACKLOG.md VND-004: "Review received -> in-app notification"
    this.prisma.product
      .findUnique({ where: { id: productId }, select: { name: true, vendor: { select: { userId: true } } } })
      .then((p) =>
        p
          ? this.notificationService.createNotification({
              userId: p.vendor.userId,
              type: NotificationType.REVIEW_RECEIVED,
              category: NotificationCategory.INFO,
              title: 'New review received',
              message: `${review.customer.yorubaName || review.customer.name} left a ${dto.rating}★ review on ${p.name}.`,
              data: { action: 'review_received', reviewId: review.id, productId },
            })
          : undefined
      )
      .catch(() => undefined);

    return review;
  }

  /**
   * Get product reviews
   */
  async getProductReviews(productId: string, filters?: { status?: string; limit?: number }) {
    const where: any = {
      productId,
      status: filters?.status || 'ACTIVE',
    };

    return this.prisma.productReview.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  // ============================================
  // BABALAWO REVIEWS
  // ============================================

  /**
   * Create a Babalawo review
   */
  async createBabalawoReview(
    babalawoId: string,
    dto: CreateBabalawoReviewDto,
    currentUser: CurrentUserPayload
  ) {
    // Check if Babalawo exists and is verified
    const babalawo = await this.prisma.user.findUnique({
      where: { id: babalawoId },
    });

    if (!babalawo || babalawo.role !== 'BABALAWO' || !babalawo.verified) {
      throw new NotFoundException('Verified Babalawo not found');
    }

    // Check if user has already reviewed this Babalawo
    const existingReview = await this.prisma.babalawoReview.findUnique({
      where: {
        babalawoId_clientId: {
          babalawoId,
          clientId: currentUser.id,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this Babalawo');
    }

    // Verify appointment if appointmentId is provided
    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id: dto.appointmentId,
          clientId: currentUser.id,
          babalawoId,
          status: 'COMPLETED',
        },
      });

      if (!appointment) {
        throw new BadRequestException('Invalid appointment or appointment not completed');
      }
    } else {
      // Check if user has had any completed appointments with this Babalawo
      const hasAppointment = await this.prisma.appointment.findFirst({
        where: {
          clientId: currentUser.id,
          babalawoId,
          status: 'COMPLETED',
        },
      });

      if (!hasAppointment) {
        throw new BadRequestException(
          'You must have completed at least one appointment with this Babalawo to leave a review'
        );
      }
    }

    // Create review
    const review = await this.prisma.babalawoReview.create({
      data: {
        babalawoId,
        clientId: currentUser.id,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        accuracyRating: dto.accuracyRating,
        communicationRating: dto.communicationRating,
        culturalRespectRating: dto.culturalRespectRating,
        appointmentId: dto.appointmentId,
        status: 'PENDING', // Requires moderation
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    // Update Babalawo rating (async, don't await)
    this.updateBabalawoRating(babalawoId).catch((err) => {
      this.logger.error(`Failed to update Babalawo rating: ${err.message}`);
    });

    return review;
  }

  /**
   * Get Babalawo reviews
   */
  async getBabalawoReviews(babalawoId: string, filters?: { status?: string; limit?: number }) {
    const where: any = {
      babalawoId,
      status: filters?.status || 'ACTIVE',
    };

    return this.prisma.babalawoReview.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  // ============================================
  // COURSE REVIEWS
  // ============================================

  /**
   * Create a course review
   */
  async createCourseReview(
    courseId: string,
    dto: CreateCourseReviewDto,
    currentUser: CurrentUserPayload
  ) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user has already reviewed this course
    const existingReview = await this.prisma.courseReview.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: currentUser.id,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this course');
    }

    // Verify enrollment
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId,
        studentId: currentUser.id,
        status: { in: ['ENROLLED', 'COMPLETED'] },
      },
    });

    if (!enrollment) {
      throw new BadRequestException('You must be enrolled in this course to leave a review');
    }

    // Create review
    const review = await this.prisma.courseReview.create({
      data: {
        courseId,
        studentId: currentUser.id,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        contentQualityRating: dto.contentQualityRating,
        instructorRating: dto.instructorRating,
        valueRating: dto.valueRating,
        enrollmentId: enrollment.id,
        status: 'PENDING', // Requires moderation
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    // Update course rating (async, don't await)
    this.updateCourseRating(courseId).catch((err) => {
      this.logger.error(`Failed to update course rating: ${err.message}`);
    });

    return review;
  }

  /**
   * Get course reviews
   */
  async getCourseReviews(courseId: string, filters?: { status?: string; limit?: number }) {
    const where: any = {
      courseId,
      status: filters?.status || 'ACTIVE',
    };

    return this.prisma.courseReview.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  // ============================================
  // MODERATION
  // ============================================

  /**
   * Moderate a product review
   */
  async moderateProductReview(
    reviewId: string,
    dto: ModerateReviewDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can moderate reviews');
    }

    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.productReview.update({
      where: { id: reviewId },
      data: {
        status: dto.status,
        moderatedBy: currentUser.id,
        moderatedAt: new Date(),
        moderationNotes: dto.moderationNotes,
      },
    });
  }

  /**
   * Moderate a Babalawo review
   */
  async moderateBabalawoReview(
    reviewId: string,
    dto: ModerateReviewDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can moderate reviews');
    }

    const review = await this.prisma.babalawoReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.babalawoReview.update({
      where: { id: reviewId },
      data: {
        status: dto.status,
        moderatedBy: currentUser.id,
        moderatedAt: new Date(),
        moderationNotes: dto.moderationNotes,
      },
    });
  }

  /**
   * Moderate a course review
   */
  async moderateCourseReview(
    reviewId: string,
    dto: ModerateReviewDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can moderate reviews');
    }

    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.courseReview.update({
      where: { id: reviewId },
      data: {
        status: dto.status,
        moderatedBy: currentUser.id,
        moderatedAt: new Date(),
        moderationNotes: dto.moderationNotes,
      },
    });
  }

  /**
   * Flag a review (user reports inappropriate content)
   */
  async flagReview(
    reviewType: 'product' | 'babalawo' | 'course',
    reviewId: string,
    flaggedBy: string
  ) {
    // One flag per account per review. If this account already flagged it,
    // treat the call as a no-op success rather than incrementing again --
    // without this, a single account could call the endpoint repeatedly to
    // force any review past the flaggedCount >= 2 auto-flag threshold alone.
    try {
      await this.prisma.reviewFlag.create({ data: { reviewType, reviewId, flaggedBy } });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return this.getReviewForFlagCheck(reviewType, reviewId);
      }
      throw err;
    }

    if (reviewType === 'product') {
      const review = await this.prisma.productReview.findUnique({
        where: { id: reviewId },
      });
      if (!review) throw new NotFoundException('Review not found');

      return this.prisma.productReview.update({
        where: { id: reviewId },
        data: {
          flaggedCount: { increment: 1 },
          status: review.flaggedCount >= 2 ? 'FLAGGED' : review.status, // Auto-flag after 3 reports
        },
      });
    } else if (reviewType === 'babalawo') {
      const review = await this.prisma.babalawoReview.findUnique({
        where: { id: reviewId },
      });
      if (!review) throw new NotFoundException('Review not found');

      return this.prisma.babalawoReview.update({
        where: { id: reviewId },
        data: {
          flaggedCount: { increment: 1 },
          status: review.flaggedCount >= 2 ? 'FLAGGED' : review.status,
        },
      });
    } else {
      const review = await this.prisma.courseReview.findUnique({
        where: { id: reviewId },
      });
      if (!review) throw new NotFoundException('Review not found');

      return this.prisma.courseReview.update({
        where: { id: reviewId },
        data: {
          flaggedCount: { increment: 1 },
          status: review.flaggedCount >= 2 ? 'FLAGGED' : review.status,
        },
      });
    }
  }

  /** Returns the review unchanged -- used when flagReview sees a duplicate flag from the same account. */
  private async getReviewForFlagCheck(
    reviewType: 'product' | 'babalawo' | 'course',
    reviewId: string
  ) {
    const review =
      reviewType === 'product'
        ? await this.prisma.productReview.findUnique({ where: { id: reviewId } })
        : reviewType === 'babalawo'
          ? await this.prisma.babalawoReview.findUnique({ where: { id: reviewId } })
          : await this.prisma.courseReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  // ============================================
  // RATING AGGREGATION
  // ============================================

  /**
   * Update product rating (calculate average from active reviews)
   */
  private async updateProductRating(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: {
        productId,
        status: 'ACTIVE',
      },
      select: { rating: true },
    });

    if (reviews.length === 0) return;

    const averageRating =
      reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) /
      reviews.length;

    // Note: Product model doesn't have a rating field yet, so we'd need to add it
    // For now, we'll just log it
    this.logger.log(`Product ${productId} average rating: ${averageRating.toFixed(2)}`);
  }

  /**
   * Update Babalawo rating (calculate average from active reviews)
   */
  private async updateBabalawoRating(babalawoId: string) {
    const reviews = await this.prisma.babalawoReview.findMany({
      where: {
        babalawoId,
        status: 'ACTIVE',
      },
      select: { rating: true },
    });

    let averageRating = 0;
    if (reviews.length > 0) {
      averageRating =
        reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) /
        reviews.length;
    }

    // Update the user's averageRating field
    await this.prisma.user.update({
      where: { id: babalawoId },
      data: { averageRating },
    });

    this.logger.log(
      `Babalawo ${babalawoId} average rating updated to: ${averageRating.toFixed(2)}`
    );
  }

  /**
   * Update course rating (calculate average from active reviews)
   */
  private async updateCourseRating(courseId: string) {
    const reviews = await this.prisma.courseReview.findMany({
      where: {
        courseId,
        status: 'ACTIVE',
      },
      select: { rating: true },
    });

    if (reviews.length === 0) return;

    const averageRating =
      reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) /
      reviews.length;

    // Note: Course model doesn't have a rating field yet, so we'd need to add it
    // For now, we'll just log it
    this.logger.log(`Course ${courseId} average rating: ${averageRating.toFixed(2)}`);
  }

  /**
   * Get aggregated ratings for a product
   */
  async getProductRatingStats(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: {
        productId,
        status: 'ACTIVE',
      },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review: { rating: number }) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    const averageRating =
      reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) /
      reviews.length;

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
      ratingDistribution: distribution,
    };
  }

  // ============================================
  // VENDOR_BACKLOG.md VND-022: Review & Reputation Management
  // ============================================

  private async assertOwnsVendorOrAdmin(vendorId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role === 'ADMIN') return;
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only manage your own vendor account');
    }
  }

  /**
   * "Vendor can publicly respond to any review (one response per review)" --
   * a review with an existing vendorResponse is immutable, matching the
   * backlog's "one response" framing (not "latest response wins").
   */
  async respondToReview(
    reviewId: string,
    dto: RespondToReviewDto,
    currentUser: CurrentUserPayload
  ) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
      include: { product: { select: { vendorId: true, vendor: { select: { userId: true } } } } },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (currentUser.role !== 'ADMIN' && review.product.vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only respond to reviews on your own products');
    }
    if (review.vendorResponse) {
      throw new BadRequestException('This review already has a response');
    }

    return this.prisma.productReview.update({
      where: { id: reviewId },
      data: { vendorResponse: dto.response, vendorRespondedAt: new Date() },
    });
  }

  /**
   * "All reviews across all products in one view" + per-product breakdown +
   * a rule-based trend (last 30 days' average vs. the 30 days before that --
   * explainable, not a fabricated/ML score).
   */
  async getVendorReviews(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const reviews = await this.prisma.productReview.findMany({
      where: { product: { vendorId }, status: 'ACTIVE' },
      include: {
        product: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, yorubaName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const perProductMap = new Map<string, { productId: string; name: string; ratingSum: number; count: number }>();
    reviews.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
      const existing = perProductMap.get(r.productId) ?? {
        productId: r.productId,
        name: r.product.name,
        ratingSum: 0,
        count: 0,
      };
      existing.ratingSum += r.rating;
      existing.count += 1;
      perProductMap.set(r.productId, existing);
    });

    const perProduct = [...perProductMap.values()].map((p) => ({
      productId: p.productId,
      name: p.name,
      averageRating: parseFloat((p.ratingSum / p.count).toFixed(2)),
      totalReviews: p.count,
    }));

    const now = new Date();
    const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prior30Start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const avgOf = (rs: typeof reviews) =>
      rs.length === 0 ? null : rs.reduce((s, r) => s + r.rating, 0) / rs.length;
    const last30Avg = avgOf(reviews.filter((r) => r.createdAt >= last30Start));
    const prior30Avg = avgOf(
      reviews.filter((r) => r.createdAt >= prior30Start && r.createdAt < last30Start)
    );
    let trendDirection: 'up' | 'down' | 'flat' | 'insufficient_data' = 'insufficient_data';
    if (last30Avg !== null && prior30Avg !== null) {
      const diff = last30Avg - prior30Avg;
      trendDirection = Math.abs(diff) < 0.1 ? 'flat' : diff > 0 ? 'up' : 'down';
    }

    return {
      reviews,
      totalReviews: reviews.length,
      averageRating: avgOf(reviews) !== null ? parseFloat((avgOf(reviews) as number).toFixed(2)) : 0,
      ratingDistribution: distribution,
      perProduct,
      trend: {
        last30DaysAverage: last30Avg !== null ? parseFloat(last30Avg.toFixed(2)) : null,
        previous30DaysAverage: prior30Avg !== null ? parseFloat(prior30Avg.toFixed(2)) : null,
        direction: trendDirection,
      },
    };
  }

  /**
   * "Vendor can trigger manual review request per order (once only)" --
   * shares the same `reviewRequestSentAt` guard as the automatic 7-day nudge
   * in review-request-nudge.service.ts, so triggering one manually also
   * prevents the automatic one from firing later for the same order.
   */
  async requestReviewForOrder(orderId: string, currentUser: CurrentUserPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendor: { select: { userId: true } },
        items: { take: 1, select: { productId: true } },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (currentUser.role !== 'ADMIN' && order.vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only request reviews for your own orders');
    }
    if (!['COMPLETED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException('Reviews can only be requested for delivered orders');
    }
    if (order.reviewRequestSentAt) {
      throw new BadRequestException('A review request has already been sent for this order');
    }

    await this.notificationService.createNotification({
      userId: order.customerId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.INFO,
      title: 'How was your order?',
      message: 'The vendor would love to hear your thoughts -- please leave a review.',
      data: { action: 'review_request', orderId, productId: order.items[0]?.productId },
      sendEmail: true,
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { reviewRequestSentAt: new Date() },
    });

    return { message: 'Review request sent' };
  }

  /**
   * Get aggregated ratings for a Babalawo
   */
  async getBabalawoRatingStats(babalawoId: string) {
    const reviews = await this.prisma.babalawoReview.findMany({
      where: {
        babalawoId,
        status: 'ACTIVE',
      },
      select: {
        rating: true,
        accuracyRating: true,
        communicationRating: true,
        culturalRespectRating: true,
      },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        averageAccuracy: 0,
        averageCommunication: 0,
        averageCulturalRespect: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(
      (review: {
        rating: number;
        accuracyRating: number | null;
        communicationRating: number | null;
        culturalRespectRating: number | null;
      }) => {
        distribution[review.rating as keyof typeof distribution]++;
      }
    );

    const averageRating =
      reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) /
      reviews.length;

    const accuracyRatings = reviews
      .filter((r: { accuracyRating: number | null }) => r.accuracyRating)
      .map((r: { accuracyRating: number | null }) => r.accuracyRating!);
    const communicationRatings = reviews
      .filter((r: { communicationRating: number | null }) => r.communicationRating)
      .map((r: { communicationRating: number | null }) => r.communicationRating!);
    const culturalRespectRatings = reviews
      .filter((r: { culturalRespectRating: number | null }) => r.culturalRespectRating)
      .map((r: { culturalRespectRating: number | null }) => r.culturalRespectRating!);

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
      averageAccuracy:
        accuracyRatings.length > 0
          ? parseFloat(
              (
                accuracyRatings.reduce((a: number, b: number) => a + b, 0) / accuracyRatings.length
              ).toFixed(2)
            )
          : 0,
      averageCommunication:
        communicationRatings.length > 0
          ? parseFloat(
              (
                communicationRatings.reduce((a: number, b: number) => a + b, 0) /
                communicationRatings.length
              ).toFixed(2)
            )
          : 0,
      averageCulturalRespect:
        culturalRespectRatings.length > 0
          ? parseFloat(
              (
                culturalRespectRatings.reduce((a: number, b: number) => a + b, 0) /
                culturalRespectRatings.length
              ).toFixed(2)
            )
          : 0,
      ratingDistribution: distribution,
    };
  }

  /**
   * Get aggregated ratings for a course
   */
  async getCourseRatingStats(courseId: string) {
    const reviews = await this.prisma.courseReview.findMany({
      where: {
        courseId,
        status: 'ACTIVE',
      },
      select: {
        rating: true,
        contentQualityRating: true,
        instructorRating: true,
        valueRating: true,
      },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        averageContentQuality: 0,
        averageInstructor: 0,
        averageValue: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(
      (review: {
        rating: number;
        contentQualityRating: number | null;
        instructorRating: number | null;
        valueRating: number | null;
      }) => {
        distribution[review.rating as keyof typeof distribution]++;
      }
    );

    const averageRating =
      reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) /
      reviews.length;

    const contentQualityRatings = reviews
      .filter((r: { contentQualityRating: number | null }) => r.contentQualityRating)
      .map((r: { contentQualityRating: number | null }) => r.contentQualityRating!);
    const instructorRatings = reviews
      .filter((r: { instructorRating: number | null }) => r.instructorRating)
      .map((r: { instructorRating: number | null }) => r.instructorRating!);
    const valueRatings = reviews
      .filter((r: { valueRating: number | null }) => r.valueRating)
      .map((r: { valueRating: number | null }) => r.valueRating!);

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
      averageContentQuality:
        contentQualityRatings.length > 0
          ? parseFloat(
              (
                contentQualityRatings.reduce((a: number, b: number) => a + b, 0) /
                contentQualityRatings.length
              ).toFixed(2)
            )
          : 0,
      averageInstructor:
        instructorRatings.length > 0
          ? parseFloat(
              (
                instructorRatings.reduce((a: number, b: number) => a + b, 0) /
                instructorRatings.length
              ).toFixed(2)
            )
          : 0,
      averageValue:
        valueRatings.length > 0
          ? parseFloat(
              (
                valueRatings.reduce((a: number, b: number) => a + b, 0) / valueRatings.length
              ).toFixed(2)
            )
          : 0,
      ratingDistribution: distribution,
    };
  }
}
