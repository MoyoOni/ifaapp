import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, AdminRoles } from '../auth/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { CurrentUserPayload } from '@/shared/types/current-user-payload.interface';
import { AdminService } from './admin.service';
import { AdminMarketplaceService } from './admin-marketplace.service';
import { AdminAcademyService } from './admin-academy.service';
import { AdminTrustScoreService } from './admin-trust-score.service';
import { AdminPlatformSettingsService } from './admin-platform-settings.service';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { AdminPromosService } from './admin-promos.service';
import { AdminReferralsService } from './admin-referrals.service';
import { AdminCommunityService } from './admin-community.service';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { AdminFeaturedContentService } from './admin-featured-content.service';
import { AdminIntegrityService } from './admin-integrity.service';
import { AdminComplaintsService } from './admin-complaints.service';
import { AdminMarketIntelligenceService } from './admin-market-intelligence.service';
import { AdminPractitionerPerformanceService } from './admin-practitioner-performance.service';
import { AdminMorningBriefService } from './admin-morning-brief.service';
import { OutboxService } from '../outbox/outbox.service';
import { GdprService } from '../gdpr/gdpr.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { BulkVerifyDto } from './dto/bulk-verify.dto';
import { CreateAdvisoryVoteDto, CastAdvisoryVoteDto } from './dto/advisory-board.dto';
import { CreateCircleDto } from '../circles/dto/create-circle.dto';
import { VerificationStage } from '@common/enums/verification-stage.enum';
import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';
import { LogPiiRevealDto } from './dto/log-pii-reveal.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { ReviewVendorDto } from './dto/review-vendor.dto';
import { ResolveReportedContentDto } from './dto/resolve-reported-content.dto';
import { RejectWithReasonDto } from './dto/reject-with-reason.dto';
import { ModerateCircleDto } from './dto/moderate-circle.dto';
import { ManageAdminDto } from './dto/manage-admin.dto';
import {
  CreateQuizQuestionDto,
  UpdateQuizQuestionDto,
  UpdateQuizThresholdDto,
} from './dto/quiz-question.dto';
import { TrustScoreOverrideDto } from './dto/trust-score-override.dto';
import { FeatureItemDto } from './dto/feature-item.dto';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';
import { ManualEnrollDto } from './dto/manual-enroll.dto';
import { RemoveEnrollmentDto } from './dto/remove-enrollment.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { AwardBadgeDto } from './dto/award-badge.dto';
import { CreateDailyWordDto, UpdateDailyWordDto } from './dto/daily-word.dto';
import { CreateOralHistoryDto, UpdateOralHistoryDto } from './dto/oral-history.dto';
import { CreateSacredEventDto, UpdateSacredEventDto } from './dto/sacred-event.dto';
import { UpdateFeaturedDto } from './dto/update-featured.dto';
import { FeaturedSearchDto } from './dto/featured-search.dto';
import { RejectPostDto } from './dto/reject-post.dto';
import { CreateFlagRuleDto } from './dto/create-flag-rule.dto';
import { UpdateFlagRuleDto } from './dto/update-flag-rule.dto';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly marketplaceService: AdminMarketplaceService,
    private readonly academyService: AdminAcademyService,
    private readonly trustScoreService: AdminTrustScoreService,
    private readonly platformSettingsService: AdminPlatformSettingsService,
    private readonly gdprService: GdprService,
    private readonly outboxService: OutboxService,
    private readonly announcementsService: AdminAnnouncementsService,
    private readonly promosService: AdminPromosService,
    private readonly referralsService: AdminReferralsService,
    private readonly communityService: AdminCommunityService,
    private readonly culturalContentService: AdminCulturalContentService,
    private readonly featuredContentService: AdminFeaturedContentService,
    private readonly integrityService: AdminIntegrityService,
    private readonly complaintsService: AdminComplaintsService,
    private readonly marketIntelligenceService: AdminMarketIntelligenceService,
    private readonly morningBriefService: AdminMorningBriefService,
    private readonly practitionerPerformanceService: AdminPractitionerPerformanceService
  ) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getPlatformStats(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getPlatformStats(currentUser);
  }

  // ADM-005: Platform Announcement System
  @Post('announcements')
  @Roles(UserRole.ADMIN)
  async createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.announcementsService.create(dto, currentUser);
  }

  @Get('announcements')
  @Roles(UserRole.ADMIN)
  async getAllAnnouncements(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.announcementsService.findAllForAdmin(currentUser);
  }

  // Deliberately no @Roles() here -- any authenticated user (not just
  // admins) needs to see the announcements targeted at them for the
  // banner. RolesGuard allows requests through when no roles metadata
  // is set on the handler.
  @Get('announcements/active')
  async getActiveAnnouncements(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.announcementsService.findActiveForUser(currentUser);
  }

  @Patch('announcements/:id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivateAnnouncement(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.announcementsService.deactivate(id, currentUser);
  }

  // P1-01: admin visibility into in-flight/stuck/failed outbox events.
  @Get('outbox-events')
  @Roles(UserRole.ADMIN)
  async getOutboxEvents(@Query('status') status?: string, @Query('limit') limit?: string) {
    return this.outboxService.getOutboxEvents({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('outbox-events/:id/retry')
  @Roles(UserRole.ADMIN)
  async retryOutboxEvent(@Param('id') id: string) {
    await this.outboxService.retryEvent(id);
    return { success: true };
  }

  @Get('subscription-stats')
  @Roles(UserRole.ADMIN)
  async getSubscriptionStats() {
    return this.adminService.getSubscriptionStats();
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPPORT, AdminSubRole.SUPER)
  async getAllUsers(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('role') role?: string,
    @Query('verified') verified?: string
  ) {
    return this.adminService.getAllUsers(currentUser, {
      role,
      verified: verified ? verified === 'true' : undefined,
    });
  }

  @Get('verification-applications')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.COMPLIANCE, AdminSubRole.SUPER)
  async getVerificationApplications(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('stage') stage?: string
  ) {
    return this.adminService.getVerificationApplications(currentUser, stage as VerificationStage);
  }

  @Patch('verification-applications/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveVerification(
    @Param('id') id: string,
    @Body() dto: ApproveVerificationDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.approveVerification(id, dto, currentUser);
  }

  @Post('verification-applications/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectVerification(
    @Param('id') id: string,
    @Body() dto: ApproveVerificationDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.rejectVerification(id, dto, currentUser);
  }

  @Post('bulk-verify')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async bulkVerifyApplications(
    @Body() dto: BulkVerifyDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.bulkVerifyApplications(dto, currentUser);
  }

  /**
   * Get pending withdrawals (requires approval)
   * GET /admin/withdrawals/pending
   */
  @Get('withdrawals/pending')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.FINANCE, AdminSubRole.SUPER)
  async getPendingWithdrawals(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('threshold') threshold?: number
  ) {
    return this.adminService.getPendingWithdrawals(currentUser, threshold || 500);
  }

  /**
   * Approve or reject withdrawal
   * POST /admin/withdrawals/:id/process
   */
  @Post('withdrawals/:id/process')
  @Roles(UserRole.ADMIN)
  async processWithdrawal(
    @Param('id') withdrawalId: string,
    @Body() dto: ProcessWithdrawalDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.processWithdrawal(
      withdrawalId,
      dto.approve,
      dto.notes || '',
      currentUser
    );
  }

  /**
   * Get fraud alerts
   * GET /admin/fraud-alerts
   */
  @Get('fraud-alerts')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.COMPLIANCE, AdminSubRole.SUPER)
  async getFraudAlerts(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getFraudAlerts(currentUser);
  }

  /**
   * Get unverified payments (webhook redundancy)
   * GET /admin/payments/unverified
   */
  @Get('payments/unverified')
  @Roles(UserRole.ADMIN)
  async getUnverifiedPayments(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('hours') hours?: number
  ) {
    return this.adminService.getUnverifiedPayments(currentUser, hours || 24);
  }

  /**
   * Manually verify payment (admin only)
   * POST /admin/payments/verify/:transactionId
   */
  @Post('payments/verify/:transactionId')
  @Roles(UserRole.ADMIN)
  async manuallyVerifyPayment(
    @Param('transactionId') transactionId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.manuallyVerifyPayment(transactionId, currentUser);
  }

  /**
   * Log PII reveal action for audit purposes
   * POST /admin/log-pii-reveal
   */
  @Post('log-pii-reveal')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async logPiiRevealAction(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: LogPiiRevealDto
  ) {
    await this.adminService.logPiiReveal(
      currentUser.id,
      dto.entityType,
      dto.entityId,
      dto.fieldLabel,
      dto.reason
    );
    return { message: 'PII reveal action logged successfully' };
  }

  /**
   * Get analytics data
   * GET /admin/analytics
   */
  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.FINANCE, AdminSubRole.SUPER)
  async getAnalytics(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('period') period?: string
  ) {
    return this.adminService.getAnalytics(currentUser, period || '30d');
  }

  @Get('analytics/lifecycle')
  @Roles(UserRole.ADMIN)
  async getLifecycleAnalytics() {
    return this.adminService.getLifecycleAnalytics();
  }

  /**
   * Get pending vendor applications
   * GET /admin/vendors/pending
   */
  @Get('vendors/pending')
  @Roles(UserRole.ADMIN)
  async getPendingVendors(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getPendingVendors(currentUser);
  }

  /**
   * Review vendor application
   * POST /admin/vendors/:vendorId/review
   */
  @Post('vendors/:vendorId/review')
  @Roles(UserRole.ADMIN)
  async reviewVendorApplication(
    @Param('vendorId') vendorId: string,
    @Body() dto: ReviewVendorDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.reviewVendorApplication(vendorId, dto, currentUser);
  }

  /**
   * Get reported content
   * GET /admin/reported-content
   */
  @Get('reported-content')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.MODERATOR, AdminSubRole.SUPER)
  async getReportedContent(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getReportedContent(currentUser);
  }

  /**
   * Resolve reported content
   * POST /admin/reported-content/:type/:id/resolve
   */
  @Post('reported-content/:type/:id/resolve')
  @Roles(UserRole.ADMIN)
  async resolveReportedContent(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: ResolveReportedContentDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.resolveReportedContent(type, id, dto.action, currentUser);
  }

  // ==================== Circle Management ====================

  @Get('circle-suggestions')
  @Roles(UserRole.ADMIN)
  async getCircleSuggestions(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('status') status?: string
  ) {
    return this.adminService.getCircleSuggestions(currentUser, status);
  }

  @Post('circle-suggestions/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveCircleSuggestion(
    @Param('id') suggestionId: string,
    @Body() circleData: CreateCircleDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.approveCircleSuggestion(suggestionId, circleData, currentUser);
  }

  @Post('circle-suggestions/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectCircleSuggestion(
    @Param('id') suggestionId: string,
    @Body() dto: RejectWithReasonDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.rejectCircleSuggestion(suggestionId, dto.reason, currentUser);
  }

  @Get('circles/pending')
  @Roles(UserRole.ADMIN)
  async getPendingCircles(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getPendingCircles(currentUser);
  }

  @Patch('circles/:id/moderate')
  @Roles(UserRole.ADMIN)
  async moderateCircle(
    @Param('id') circleId: string,
    @Body() dto: ModerateCircleDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.moderateCircle(circleId, dto.action, currentUser);
  }

  @Post('circle-events/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveCircleEvent(
    @Param('id') eventId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.approveCircleEvent(eventId, currentUser);
  }

  @Get('audit/stats')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAuditStats(@CurrentUser() currentUser: CurrentUserPayload) {
    this.logger.log(`Admin ${currentUser.id} requesting audit statistics`);
    return this.adminService.getAuditStats();
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async getAuditLogs(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters = {
      page: Number(page),
      limit: Number(limit),
      action,
      resourceType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.adminService.getAuditLogs(currentUser, filters);
  }

  @Post('impersonate/:targetUserId')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async impersonateUser(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('targetUserId') targetUserId: string,
    @Body('reason') reason: string
  ) {
    return this.adminService.impersonateUser(currentUser, targetUserId, reason);
  }

  @Post('manage-admins')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async createOrUpdateAdmin(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: ManageAdminDto
  ) {
    return this.adminService.createOrUpdateAdmin(currentUser, dto);
  }

  @Get('admins')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async getAdminUsers(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('adminSubRole') adminSubRole?: string
  ) {
    return this.adminService.getAdminUsers(currentUser, { adminSubRole });
  }

  @Delete('admins/:userId')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async removeAdminPrivileges(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('userId') userId: string
  ) {
    return this.adminService.removeAdminPrivileges(currentUser, userId);
  }

  // ADVISORY BOARD VOTING ENDPOINTS
  @Post('advisory-board/votes/:userId')
  @Roles(UserRole.ADMIN, UserRole.ADVISORY_BOARD_MEMBER)
  async createAdvisoryVote(
    @Param('userId') userId: string,
    @Body() createVoteDto: CreateAdvisoryVoteDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.createAdvisoryVote(userId, createVoteDto, currentUser);
  }

  @Get('advisory-board/votes')
  @Roles(UserRole.ADMIN, UserRole.ADVISORY_BOARD_MEMBER)
  async getAdvisoryVotes(
    @Query('userId') userId: string,
    @Query('status') status: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.getAdvisoryVotes(userId, status, currentUser);
  }

  @Post('advisory-board/votes/:voteId/cast')
  @Roles(UserRole.ADMIN, UserRole.ADVISORY_BOARD_MEMBER)
  async castAdvisoryVote(
    @Param('voteId') voteId: string,
    @Body() castVoteDto: CastAdvisoryVoteDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.castAdvisoryVote(castVoteDto.voteId, castVoteDto.option, currentUser);
  }

  // ADM-027: Session & Security Management

  @Get('security/overview')
  @Roles(UserRole.ADMIN)
  async getSecurityOverview() {
    return this.adminService.getSecurityOverview();
  }

  @Get('security/logins')
  @Roles(UserRole.ADMIN)
  async getRecentLogins(@Query('limit') limit: number = 50) {
    return this.adminService.getRecentLogins(Number(limit));
  }

  @Get('security/users/:userId/sessions')
  @Roles(UserRole.ADMIN)
  async getUserSessions(@Param('userId') userId: string) {
    return this.adminService.getUserSessions(userId);
  }

  @Delete('security/users/:userId/sessions')
  @Roles(UserRole.ADMIN)
  async forceLogoutUser(@Param('userId') userId: string) {
    return this.adminService.forceLogoutUser(userId);
  }

  // ADM-028: Cultural Orientation Quiz Management

  @Get('quiz/questions')
  @Roles(UserRole.ADMIN)
  async getQuizQuestions() {
    return this.adminService.getQuizQuestions();
  }

  @Post('quiz/questions')
  @Roles(UserRole.ADMIN)
  async createQuizQuestion(@Body() dto: CreateQuizQuestionDto) {
    return this.adminService.createQuizQuestion(dto);
  }

  @Patch('quiz/questions/:id')
  @Roles(UserRole.ADMIN)
  async updateQuizQuestion(@Param('id') id: string, @Body() dto: UpdateQuizQuestionDto) {
    return this.adminService.updateQuizQuestion(id, dto);
  }

  @Delete('quiz/questions/:id')
  @Roles(UserRole.ADMIN)
  async deleteQuizQuestion(@Param('id') id: string) {
    return this.adminService.deleteQuizQuestion(id);
  }

  @Get('quiz/stats')
  @Roles(UserRole.ADMIN)
  async getQuizStats() {
    return this.adminService.getQuizStats();
  }

  @Patch('quiz/threshold')
  @Roles(UserRole.ADMIN)
  async updateQuizThreshold(@Body() dto: UpdateQuizThresholdDto) {
    return this.adminService.updateQuizThreshold(dto.threshold);
  }

  @Post('quiz/users/:userId/reset')
  @Roles(UserRole.ADMIN)
  async resetUserQuizStatus(@Param('userId') userId: string) {
    return this.adminService.resetUserQuizStatus(userId);
  }

  // ADM-029: Trust Score Audit

  @Get('trust-scores/audit/:userId')
  @Roles(UserRole.ADMIN)
  async getTrustScoreAudit(@Param('userId') userId: string) {
    return this.trustScoreService.getTrustScoreAudit(userId);
  }

  @Patch('trust-scores/override/:userId')
  @Roles(UserRole.ADMIN)
  async applyTrustScoreOverride(
    @Param('userId') userId: string,
    @Body() dto: TrustScoreOverrideDto,
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.trustScoreService.applyOverride(userId, dto.override, dto.reason, admin.id);
  }

  @Get('trust-scores/override-history/:userId')
  @Roles(UserRole.ADMIN)
  async getTrustScoreOverrideHistory(@Param('userId') userId: string) {
    return this.trustScoreService.getOverrideHistory(userId);
  }

  @Get('trust-score-adjustments')
  @Roles(UserRole.ADMIN)
  async getTrustScoreAdjustments() {
    return this.trustScoreService.getOverrideAdjustments();
  }

  // ADM-007: Featured Practitioners

  @Get('practitioners/for-featuring')
  @Roles(UserRole.ADMIN)
  async getPractitionersForFeaturing() {
    return this.trustScoreService.getPractitionersForFeaturing();
  }

  @Get('practitioners/featured')
  @Roles(UserRole.ADMIN)
  async getFeaturedPractitioners() {
    return this.trustScoreService.getFeaturedPractitioners();
  }

  @Patch('practitioners/:id/featured')
  @Roles(UserRole.ADMIN)
  async updatePractitionerFeaturedStatus(
    @Param('id') id: string,
    @Body() dto: { isFeatured: boolean; featuredOrder?: number; featuredExpiry?: string }
  ) {
    return this.trustScoreService.updatePractitionerFeaturedStatus(
      id,
      dto.isFeatured,
      dto.featuredOrder,
      dto.featuredExpiry ? new Date(dto.featuredExpiry) : undefined
    );
  }

  // Practitioner Performance

  @Get('practitioner-performance')
  @Roles(UserRole.ADMIN)
  async getPractitionerPerformance() {
    return this.practitionerPerformanceService.getPractitionerPerformance();
  }

  // ADM-030: Platform Settings

  @Get('platform-settings')
  @Roles(UserRole.ADMIN)
  async getPlatformSettings() {
    return this.platformSettingsService.getSettings();
  }

  @Patch('platform-settings')
  @Roles(UserRole.ADMIN)
  async updatePlatformSettings(
    @Body() body: Record<string, unknown>,
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.platformSettingsService.updateSettings(body, admin.id);
  }

  // ADM-031: Marketplace Management

  @Get('marketplace/products')
  @Roles(UserRole.ADMIN)
  async getAllProducts(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.marketplaceService.getAllProducts(Number(page), Number(limit));
  }

  @Delete('marketplace/products/:id')
  @Roles(UserRole.ADMIN)
  async removeProduct(
    @Param('id') id: string,
    @Body() dto: RejectWithReasonDto,
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.marketplaceService.removeProduct(id, dto.reason, admin.id);
  }

  @Patch('marketplace/products/:id/feature')
  @Roles(UserRole.ADMIN)
  async featureProduct(@Param('id') id: string, @Body() dto: FeatureItemDto) {
    return this.marketplaceService.featureProduct(
      id,
      dto.featuredUntil ? new Date(dto.featuredUntil) : null
    );
  }

  @Get('marketplace/orders')
  @Roles(UserRole.ADMIN)
  async getAllOrders(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.marketplaceService.getAllOrders(Number(page), Number(limit));
  }

  @Get('marketplace/vendor-health')
  @Roles(UserRole.ADMIN)
  async getVendorHealth() {
    return this.marketplaceService.getVendorHealth();
  }

  @Get('marketplace/categories')
  @Roles(UserRole.ADMIN)
  async getMarketplaceCategories() {
    return this.marketplaceService.getCategories();
  }

  // ADM-020: Promo Codes Management

  @Get('promos')
  @Roles(UserRole.ADMIN)
  async getAllPromos(@Query('includeInactive') includeInactive: string) {
    return this.promosService.getAllPromos(includeInactive === 'true');
  }

  @Post('promos')
  @Roles(UserRole.ADMIN)
  async createPromo(
    @Body() body: { code: string; type: string; value: number; maxUses?: number; expiresAt?: string; eligibleRoles: string[] },
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.promosService.createPromo(
      body.code,
      body.type,
      body.value,
      admin,
      body.maxUses,
      body.expiresAt,
      body.eligibleRoles
    );
  }

  @Patch('promos/:id')
  @Roles(UserRole.ADMIN)
  async updatePromo(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.promosService.updatePromo(id, body.isActive);
  }

  @Delete('promos/:id')
  @Roles(UserRole.ADMIN)
  async deletePromo(@Param('id') id: string) {
    return this.promosService.deletePromo(id);
  }

  // ADM-022: Revenue Forecasting

  @Get('forecasting/revenue')
  @Roles(UserRole.ADMIN)
  async getRevenueForecast() {
    return this.adminService.getRevenueForecast();
  }

  // ADM-027: Subscription Lists

  @Get('subscriptions/active')
  @Roles(UserRole.ADMIN)
  async getActiveSubscribers() {
    return this.adminService.getActiveSubscribers();
  }

  @Get('subscriptions/cancelled')
  @Roles(UserRole.ADMIN)
  async getCancelledSubscribers() {
    return this.adminService.getCancelledSubscribers();
  }

  @Get('subscriptions/failed-payments')
  @Roles(UserRole.ADMIN)
  async getFailedSubscribers() {
    return this.adminService.getFailedSubscribers();
  }

  // ADM-029: Financial Command Centre

  @Get('financial-command-centre')
  @Roles(UserRole.ADMIN)
  async getFinancialCommandCentre() {
    return this.adminService.getFinancialCommandCentre();
  }

  // ADM-028: Market Intelligence

  @Get('market-intelligence/leaderboard')
  @Roles(UserRole.ADMIN)
  async getLeaderboard(@Query('sortBy') sortBy: string = 'bookings') {
    return this.marketIntelligenceService.getLeaderboard(sortBy as 'bookings' | 'revenue' | 'rating');
  }

  @Get('market-intelligence/signals')
  @Roles(UserRole.ADMIN)
  async getSignals() {
    return this.marketIntelligenceService.getSignals();
  }

  // ADM-021: Referral Program Management

  @Get('referrals/stats')
  @Roles(UserRole.ADMIN)
  async getReferralStats() {
    return this.referralsService.getStats();
  }

  @Get('referrals')
  @Roles(UserRole.ADMIN)
  async getReferrals(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.referralsService.getReferrals(Number(page), Number(limit));
  }

  @Post('referrals/:id/credit')
  @Roles(UserRole.ADMIN)
  async creditReferral(@Param('id') id: string) {
    return this.referralsService.creditReferral(id);
  }

  // ADM-017: Community Recognition System

  @Get('community/stars')
  @Roles(UserRole.ADMIN)
  async getCommunityStars() {
    return this.communityService.getCommunityStars();
  }

  @Post('community/badges/:userId')
  @Roles(UserRole.ADMIN)
  async awardBadge(
    @Param('userId') userId: string,
    @Body() dto: AwardBadgeDto,
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.communityService.awardBadge(userId, dto, admin.id);
  }

  @Delete('community/badges/:badgeId')
  @Roles(UserRole.ADMIN)
  async revokeBadge(@Param('badgeId') badgeId: string) {
    return this.communityService.revokeBadge(badgeId);
  }

  // ADM-023: Cultural Content Calendar

  // ===== Daily Words =====

  @Get('cultural/daily-words')
  @Roles(UserRole.ADMIN)
  async getDailyWords() {
    return this.culturalContentService.getDailyWords();
  }

  @Post('cultural/daily-words')
  @Roles(UserRole.ADMIN)
  async createDailyWord(@Body() dto: CreateDailyWordDto, @CurrentUser() admin: CurrentUserPayload) {
    return this.culturalContentService.createDailyWord(dto, admin);
  }

  @Patch('cultural/daily-words/:id')
  @Roles(UserRole.ADMIN)
  async updateDailyWord(@Param('id') id: string, @Body() dto: UpdateDailyWordDto) {
    return this.culturalContentService.updateDailyWord(id, dto);
  }

  @Delete('cultural/daily-words/:id')
  @Roles(UserRole.ADMIN)
  async deleteDailyWord(@Param('id') id: string) {
    return this.culturalContentService.deleteDailyWord(id);
  }

  // ===== Oral History =====

  @Get('cultural/oral-histories')
  @Roles(UserRole.ADMIN)
  async getOralHistories() {
    return this.culturalContentService.getOralHistories();
  }

  @Post('cultural/oral-histories')
  @Roles(UserRole.ADMIN)
  async createOralHistory(@Body() dto: CreateOralHistoryDto, @CurrentUser() admin: CurrentUserPayload) {
    return this.culturalContentService.createOralHistory(dto, admin);
  }

  @Patch('cultural/oral-histories/:id')
  @Roles(UserRole.ADMIN)
  async updateOralHistory(@Param('id') id: string, @Body() dto: UpdateOralHistoryDto) {
    return this.culturalContentService.updateOralHistory(id, dto);
  }

  @Delete('cultural/oral-histories/:id')
  @Roles(UserRole.ADMIN)
  async deleteOralHistory(@Param('id') id: string) {
    return this.culturalContentService.deleteOralHistory(id);
  }

  // ===== Sacred Calendar Events =====

  @Get('cultural/sacred-events')
  @Roles(UserRole.ADMIN)
  async getSacredEvents() {
    return this.culturalContentService.getSacredEvents();
  }

  @Post('cultural/sacred-events')
  @Roles(UserRole.ADMIN)
  async createSacredEvent(@Body() dto: CreateSacredEventDto, @CurrentUser() admin: CurrentUserPayload) {
    return this.culturalContentService.createSacredEvent(dto, admin);
  }

  @Patch('cultural/sacred-events/:id')
  @Roles(UserRole.ADMIN)
  async updateSacredEvent(@Param('id') id: string, @Body() dto: UpdateSacredEventDto) {
    return this.culturalContentService.updateSacredEvent(id, dto);
  }

  @Delete('cultural/sacred-events/:id')
  @Roles(UserRole.ADMIN)
  async deleteSacredEvent(@Param('id') id: string) {
    return this.culturalContentService.deleteSacredEvent(id);
  }

  // ADM-024: Featured Content Management

  @Get('featured-content')
  @Roles(UserRole.ADMIN)
  async getFeaturedContent() {
    return this.featuredContentService.getFeaturedContent();
  }

  @Get('featured-content/search')
  @Roles(UserRole.ADMIN)
  async searchFeaturedContent(@Query() dto: FeaturedSearchDto) {
    return this.featuredContentService.search(dto.type, dto.q);
  }

  @Patch('featured-content/:type/:id')
  @Roles(UserRole.ADMIN)
  async updateFeatured(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: UpdateFeaturedDto,
  ) {
    return this.featuredContentService.updateFeatured(type, id, dto);
  }

  // ADM-025: Cultural Integrity Management

  @Get('integrity/queue')
  @Roles(UserRole.ADMIN)
  async getIntegrityQueue(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.integrityService.getQueue(Number(page), Number(limit));
  }

  @Post('integrity/queue/:postId/approve')
  @Roles(UserRole.ADMIN)
  async approvePost(@Param('postId') postId: string, @CurrentUser() admin: CurrentUserPayload) {
    return this.integrityService.approvePost(postId, admin);
  }

  @Post('integrity/queue/:postId/reject')
  @Roles(UserRole.ADMIN)
  async rejectPost(@Param('postId') postId: string, @Body() dto: RejectPostDto, @CurrentUser() admin: CurrentUserPayload) {
    return this.integrityService.rejectPost(postId, admin, dto);
  }

  @Get('integrity/rules')
  @Roles(UserRole.ADMIN)
  async getFlagRules() {
    return this.integrityService.getRules();
  }

  @Post('integrity/rules')
  @Roles(UserRole.ADMIN)
  async createFlagRule(@Body() dto: CreateFlagRuleDto, @CurrentUser() admin: CurrentUserPayload) {
    return this.integrityService.createRule(dto, admin);
  }

  @Patch('integrity/rules/:id')
  @Roles(UserRole.ADMIN)
  async updateFlagRule(@Param('id') id: string, @Body() dto: UpdateFlagRuleDto) {
    return this.integrityService.updateRule(id, dto);
  }

  @Delete('integrity/rules/:id')
  @Roles(UserRole.ADMIN)
  async deleteFlagRule(@Param('id') id: string) {
    return this.integrityService.deleteRule(id);
  }

  // ADM-032: Academy Management

  @Get('academy/courses')
  @Roles(UserRole.ADMIN)
  async getAllCourses(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.academyService.getAllCourses(Number(page), Number(limit));
  }

  @Patch('academy/courses/:id/feature')
  @Roles(UserRole.ADMIN)
  async featureCourse(@Param('id') id: string, @Body() dto: FeatureItemDto) {
    return this.academyService.featureCourse(
      id,
      dto.featuredUntil ? new Date(dto.featuredUntil) : null
    );
  }

  @Patch('academy/courses/:id/status')
  @Roles(UserRole.ADMIN)
  async updateCourseStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCourseStatusDto,
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.academyService.updateCourseStatus(id, dto.status, admin.id, dto.reason);
  }

  @Get('academy/enrollment-stats')
  @Roles(UserRole.ADMIN)
  async getEnrollmentStats() {
    return this.academyService.getEnrollmentStats();
  }

  @Post('academy/enroll')
  @Roles(UserRole.ADMIN)
  async manualEnroll(@Body() dto: ManualEnrollDto) {
    return this.academyService.manualEnroll(dto.courseId, dto.userId);
  }

  @Delete('academy/enrollments/:enrollmentId')
  @Roles(UserRole.ADMIN)
  async removeEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: RemoveEnrollmentDto
  ) {
    return this.academyService.removeEnrollment(enrollmentId, dto.userId);
  }

  @Post('academy/certificates/:enrollmentId/issue')
  @Roles(UserRole.ADMIN)
  async issueCertificate(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.academyService.issueCertificate(enrollmentId, admin.id);
  }

  @Delete('academy/certificates/:enrollmentId')
  @Roles(UserRole.ADMIN)
  async revokeCertificate(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: RejectWithReasonDto,
    @CurrentUser() admin: CurrentUserPayload
  ) {
    return this.academyService.revokeCertificate(enrollmentId, dto.reason, admin.id);
  }

  // ADM-016: Inactive Practitioners

  @Get('inactive-practitioners')
  @Roles(UserRole.ADMIN)
  async getInactivePractitioners(
    @Query('daysThreshold') daysThreshold: number = 30,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.adminService.getInactivePractitioners(admin, Number(daysThreshold));
  }

  @Post('practitioners/:practitionerId/re-engagement-action')
  @Roles(UserRole.ADMIN)
  async reEngagePractitioner(
    @Param('practitionerId') practitionerId: string,
    @Body() body: { action: string; message?: string },
  ) {
    return this.adminService.reEngagePractitioner(practitionerId, body.action, body.message);
  }

  @Post('practitioners/:practitionerId/reactivate-listing')
  @Roles(UserRole.ADMIN)
  async reactivatePractitioner(@Param('practitionerId') practitionerId: string) {
    return this.adminService.reactivatePractitioner(practitionerId);
  }

  // ==================== GDPR / Compliance ====================

  @Get('compliance/users/:userId/export')
  @Roles(UserRole.ADMIN)
  async adminExportUserData(@Param('userId') userId: string) {
    return this.gdprService.exportUserData(userId);
  }

  @Delete('compliance/users/:userId/erase')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async adminEraseUser(@Param('userId') userId: string, @CurrentUser() admin: CurrentUserPayload) {
    return this.gdprService.deleteUser(userId, admin);
  }

  @Get('compliance/users/:userId/consent')
  @Roles(UserRole.ADMIN)
  async adminGetConsent(@Param('userId') userId: string) {
    return this.gdprService.getConsentPreferences(userId);
  }

  @Post('compliance/users/:userId/consent')
  @Roles(UserRole.ADMIN)
  async adminUpdateConsent(
    @Param('userId') userId: string,
    @Body()
    preferences: { marketingEmails?: boolean; dataProcessing?: boolean; forumDigest?: boolean }
  ) {
    return this.gdprService.updateConsentPreferences(userId, preferences);
  }

  // ==================== Complaints ====================

  @Get('complaints')
  @Roles(UserRole.ADMIN)
  async getComplaints(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.complaintsService.getComplaints(currentUser, status, page, limit);
  }

  @Post('complaints/:id/resolve')
  @Roles(UserRole.ADMIN)
  async resolveComplaint(
    @Param('id') id: string,
    @Body() dto: ResolveComplaintDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.complaintsService.resolveComplaint(id, dto, currentUser);
  }

  // ADM-030: Morning Brief

  @Get('morning-brief')
  @Roles(UserRole.ADMIN)
  async getMorningBrief(@CurrentUser() admin: CurrentUserPayload) {
    return this.morningBriefService.getMorningBrief(admin);
  }
}
