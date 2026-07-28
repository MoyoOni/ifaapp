import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { CreateBabalawoReviewDto } from './dto/create-babalawo-review.dto';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { RespondToReviewDto } from './dto/respond-to-review.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============================================
  // PRODUCT REVIEWS
  // ============================================

  /**
   * Create a product review
   * POST /reviews/products/:productId
   */
  @Post('products/:productId')
  @UseGuards(AuthGuard('jwt'))
  async createProductReview(
    @Param('productId') productId: string,
    @Body() dto: CreateProductReviewDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.createProductReview(productId, dto, currentUser);
  }

  /**
   * Get product reviews
   * GET /reviews/products/:productId
   */
  @Get('products/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string
  ) {
    return this.reviewsService.getProductReviews(productId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Get product rating statistics
   * GET /reviews/products/:productId/stats
   */
  @Get('products/:productId/stats')
  async getProductRatingStats(@Param('productId') productId: string) {
    return this.reviewsService.getProductRatingStats(productId);
  }

  // ============================================
  // VENDOR_BACKLOG.md VND-022: Review & Reputation Management
  // ============================================

  /**
   * Vendor's public response to a review
   * PATCH /reviews/products/:reviewId/respond
   */
  @Patch('products/:reviewId/respond')
  @UseGuards(AuthGuard('jwt'))
  async respondToReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: RespondToReviewDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.respondToReview(reviewId, dto, currentUser);
  }

  /**
   * All reviews across a vendor's products, with per-product breakdown and trend
   * GET /reviews/vendors/:vendorId
   */
  @Get('vendors/:vendorId')
  @UseGuards(AuthGuard('jwt'))
  async getVendorReviews(
    @Param('vendorId') vendorId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.getVendorReviews(vendorId, currentUser);
  }

  /**
   * Vendor-triggered manual review request for a delivered order (once only)
   * POST /reviews/orders/:orderId/request
   */
  @Post('orders/:orderId/request')
  @UseGuards(AuthGuard('jwt'))
  async requestReviewForOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.requestReviewForOrder(orderId, currentUser);
  }

  // ============================================
  // BABALAWO REVIEWS
  // ============================================

  /**
   * Create a Babalawo review
   * POST /reviews/babalawos/:babalawoId
   */
  @Post('babalawos/:babalawoId')
  @UseGuards(AuthGuard('jwt'))
  async createBabalawoReview(
    @Param('babalawoId') babalawoId: string,
    @Body() dto: CreateBabalawoReviewDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.createBabalawoReview(babalawoId, dto, currentUser);
  }

  /**
   * Get Babalawo reviews
   * GET /reviews/babalawos/:babalawoId
   */
  @Get('babalawos/:babalawoId')
  async getBabalawoReviews(
    @Param('babalawoId') babalawoId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string
  ) {
    return this.reviewsService.getBabalawoReviews(babalawoId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Get Babalawo rating statistics
   * GET /reviews/babalawos/:babalawoId/stats
   */
  @Get('babalawos/:babalawoId/stats')
  async getBabalawoRatingStats(@Param('babalawoId') babalawoId: string) {
    return this.reviewsService.getBabalawoRatingStats(babalawoId);
  }

  // ============================================
  // COURSE REVIEWS
  // ============================================

  /**
   * Create a course review
   * POST /reviews/courses/:courseId
   */
  @Post('courses/:courseId')
  @UseGuards(AuthGuard('jwt'))
  async createCourseReview(
    @Param('courseId') courseId: string,
    @Body() dto: CreateCourseReviewDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.createCourseReview(courseId, dto, currentUser);
  }

  /**
   * Get course reviews
   * GET /reviews/courses/:courseId
   */
  @Get('courses/:courseId')
  async getCourseReviews(
    @Param('courseId') courseId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string
  ) {
    return this.reviewsService.getCourseReviews(courseId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Get course rating statistics
   * GET /reviews/courses/:courseId/stats
   */
  @Get('courses/:courseId/stats')
  async getCourseRatingStats(@Param('courseId') courseId: string) {
    return this.reviewsService.getCourseRatingStats(courseId);
  }

  // ============================================
  // MODERATION
  // ============================================

  /**
   * Moderate a product review
   * PATCH /reviews/products/:reviewId/moderate
   */
  @Patch('products/:reviewId/moderate')
  @UseGuards(AuthGuard('jwt'))
  async moderateProductReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.moderateProductReview(reviewId, dto, currentUser);
  }

  /**
   * Moderate a Babalawo review
   * PATCH /reviews/babalawos/:reviewId/moderate
   */
  @Patch('babalawos/:reviewId/moderate')
  @UseGuards(AuthGuard('jwt'))
  async moderateBabalawoReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.moderateBabalawoReview(reviewId, dto, currentUser);
  }

  /**
   * Moderate a course review
   * PATCH /reviews/courses/:reviewId/moderate
   */
  @Patch('courses/:reviewId/moderate')
  @UseGuards(AuthGuard('jwt'))
  async moderateCourseReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.reviewsService.moderateCourseReview(reviewId, dto, currentUser);
  }

  /**
   * Flag a review
   * POST /reviews/:type/:reviewId/flag
   * Requires auth, and one flag per account per review (ReviewFlag table) --
   * previously fully unauthenticated with no per-caller tracking at all, so
   * a single anonymous script could force any review to auto-flag (3
   * reports) with zero friction.
   */
  @Post(':type/:reviewId/flag')
  @UseGuards(AuthGuard('jwt'))
  async flagReview(
    @Param('type') type: string,
    @Param('reviewId') reviewId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (!['product', 'babalawo', 'course'].includes(type)) {
      throw new Error('Invalid review type');
    }
    return this.reviewsService.flagReview(
      type as 'product' | 'babalawo' | 'course',
      reviewId,
      currentUser.id
    );
  }
}
