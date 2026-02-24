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
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Reviews Service
 * Handles review creation, moderation, and aggregation
 */
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

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
  async flagReview(reviewType: 'product' | 'babalawo' | 'course', reviewId: string) {
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

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

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

    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    // Note: User model doesn't have a rating field yet, so we'd need to add it
    // For now, we'll just log it
    this.logger.log(`Babalawo ${babalawoId} average rating: ${averageRating.toFixed(2)}`);
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

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

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
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
      ratingDistribution: distribution,
    };
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
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    const accuracyRatings = reviews.filter((r) => r.accuracyRating).map((r) => r.accuracyRating!);
    const communicationRatings = reviews
      .filter((r) => r.communicationRating)
      .map((r) => r.communicationRating!);
    const culturalRespectRatings = reviews
      .filter((r) => r.culturalRespectRating)
      .map((r) => r.culturalRespectRating!);

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
      averageAccuracy:
        accuracyRatings.length > 0
          ? parseFloat(
              (accuracyRatings.reduce((a, b) => a + b, 0) / accuracyRatings.length).toFixed(2)
            )
          : 0,
      averageCommunication:
        communicationRatings.length > 0
          ? parseFloat(
              (
                communicationRatings.reduce((a, b) => a + b, 0) / communicationRatings.length
              ).toFixed(2)
            )
          : 0,
      averageCulturalRespect:
        culturalRespectRatings.length > 0
          ? parseFloat(
              (
                culturalRespectRatings.reduce((a, b) => a + b, 0) / culturalRespectRatings.length
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
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    const contentQualityRatings = reviews
      .filter((r) => r.contentQualityRating)
      .map((r) => r.contentQualityRating!);
    const instructorRatings = reviews
      .filter((r) => r.instructorRating)
      .map((r) => r.instructorRating!);
    const valueRatings = reviews.filter((r) => r.valueRating).map((r) => r.valueRating!);

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
      averageContentQuality:
        contentQualityRatings.length > 0
          ? parseFloat(
              (
                contentQualityRatings.reduce((a, b) => a + b, 0) / contentQualityRatings.length
              ).toFixed(2)
            )
          : 0,
      averageInstructor:
        instructorRatings.length > 0
          ? parseFloat(
              (instructorRatings.reduce((a, b) => a + b, 0) / instructorRatings.length).toFixed(2)
            )
          : 0,
      averageValue:
        valueRatings.length > 0
          ? parseFloat((valueRatings.reduce((a, b) => a + b, 0) / valueRatings.length).toFixed(2))
          : 0,
      ratingDistribution: distribution,
    };
  }
}
