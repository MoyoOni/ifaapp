import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../shared/types/current-user-payload.interface';
import { AdminMarketplaceService } from './admin-marketplace.service';
import { AdminAcademyService } from './admin-academy.service';
import { AdminTrustScoreService } from './admin-trust-score.service';
import { AdminPlatformSettingsService } from './admin-platform-settings.service';
import { AdminUsersService } from './admin-users.service';
import { AdminFinanceService } from './admin-finance.service';
import { AdminCommunityService } from './admin-community.service';
import { AdminContentService } from './admin-content.service';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { AdminPromosService } from './admin-promos.service';
import { AdminReferralsService } from './admin-referrals.service';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { AdminComplaintsService } from './admin-complaints.service';
import { AuditService } from './audit.service';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { BulkVerifyDto } from './dto/bulk-verify.dto';
import { CreateCircleDto } from '../circles/dto/create-circle.dto';
import { VerificationStage } from '@common/enums/verification-stage.enum';
import { Prisma } from '@prisma/client';
import { CreateAdvisoryVoteDto, CastAdvisoryVoteDto } from './dto/advisory-board.dto';
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
import { SuspendUserDto } from './dto/suspend-user.dto';
import { WarnUserDto } from './dto/warn-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UnbanUserDto } from './dto/unban-user.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';

// P2-04: AdminService is now a thin facade preserving the original public
// method signatures AdminController calls, delegating the actual logic to
// domain services split out below (users/finance/community/content) — see
// ProBacklog-v1.md P2-04 for the full rationale. Only the genuinely
// cross-cutting platform-stats/audit/security methods stayed here directly.
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminMarketplaceService: AdminMarketplaceService,
    private readonly adminAcademyService: AdminAcademyService,
    private readonly adminTrustScoreService: AdminTrustScoreService,
    private readonly adminPlatformSettingsService: AdminPlatformSettingsService,
    private readonly adminUsersService: AdminUsersService,
    private readonly adminFinanceService: AdminFinanceService,
    private readonly adminCommunityService: AdminCommunityService,
    private readonly adminContentService: AdminContentService,
    private readonly adminAnnouncementsService: AdminAnnouncementsService,
    private readonly adminPromosService: AdminPromosService,
    private readonly adminReferralsService: AdminReferralsService,
    private readonly adminCulturalContentService: AdminCulturalContentService,
    private readonly adminComplaintsService: AdminComplaintsService,
    private readonly auditService: AuditService
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

  async getAuditStats() {
    const totalLogs = await this.prisma.auditLog.count();
    const recentLogs = await this.prisma.auditLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    return { totalLogs, recentLogs };
  }

  async getAuditLogs(currentUser: CurrentUserPayload, filters: any) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view audit logs');
    }
    return this.auditService.getAuditLogs(filters);
  }

  async getSecurityOverview() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [activeSessions, loginsLast24h, failedLoginsLastHour, uniqueIPsLastHour] =
      await Promise.all([
        this.prisma.userSession.count({ where: { isActive: true } }),
        this.prisma.userSession.count({ where: { loginAt: { gte: oneDayAgo }, success: true } }),
        this.prisma.userSession.count({ where: { loginAt: { gte: oneHourAgo }, success: false } }),
        this.prisma.userSession.findMany({
          where: { loginAt: { gte: oneHourAgo } },
          select: { ipAddress: true },
          distinct: ['ipAddress'],
        }),
      ]);
    const suspiciousIPs = await this.prisma.userSession.groupBy({
      by: ['ipAddress'],
      where: { loginAt: { gte: oneHourAgo }, success: false, ipAddress: { not: null } },
      _count: { id: true },
      having: { id: { _count: { gt: 5 } } },
    });
    return {
      activeSessions,
      loginsLast24h,
      failedLoginsLastHour,
      uniqueActiveIPs: uniqueIPsLastHour.length,
      suspiciousIPs: suspiciousIPs.map((s) => ({ ip: s.ipAddress, failCount: s._count.id })),
    };
  }

  /**
   * Get All Users (Admin only)
   */
  async getAllUsers(
    currentUser: CurrentUserPayload,
    filters?: { role?: string; verified?: boolean }
  ) {
    return this.adminUsersService.getAllUsers(currentUser, filters);
  }

  /**
   * ADM-003: Suspend / warn / ban / unban a user
   */
  async suspendUser(currentUser: CurrentUserPayload, userId: string, dto: SuspendUserDto) {
    return this.adminUsersService.suspendUser(currentUser, userId, dto);
  }

  async warnUser(currentUser: CurrentUserPayload, userId: string, dto: WarnUserDto) {
    return this.adminUsersService.warnUser(currentUser, userId, dto);
  }

  async banUser(currentUser: CurrentUserPayload, userId: string, dto: BanUserDto) {
    return this.adminUsersService.banUser(currentUser, userId, dto);
  }

  async unbanUser(currentUser: CurrentUserPayload, userId: string, dto: UnbanUserDto) {
    return this.adminUsersService.unbanUser(currentUser, userId, dto);
  }

  async changeUserRole(currentUser: CurrentUserPayload, userId: string, dto: ChangeUserRoleDto) {
    return this.adminUsersService.changeUserRole(currentUser, userId, dto);
  }

  /**
   * Get Verification Applications for Review
   */
  async getVerificationApplications(currentUser: CurrentUserPayload, stage?: VerificationStage) {
    return this.adminUsersService.getVerificationApplications(currentUser, stage);
  }

  /**
   * Approve verification application
   */
  async approveVerification(
    id: string,
    dto: ApproveVerificationDto,
    currentUser: CurrentUserPayload
  ) {
    return this.adminUsersService.approveVerification(id, dto, currentUser);
  }

  /**
   * Reject verification application
   */
  async rejectVerification(
    id: string,
    dto: ApproveVerificationDto,
    currentUser: CurrentUserPayload
  ) {
    return this.adminUsersService.rejectVerification(id, dto, currentUser);
  }

  /**
   * Bulk approve or decline verification applications
   */
  async bulkVerifyApplications(dto: BulkVerifyDto, currentUser: CurrentUserPayload) {
    return this.adminUsersService.bulkVerifyApplications(dto, currentUser);
  }

  /**
   * Get pending vendor applications for cultural vetting
   */
  async getPendingVendors(currentUser: CurrentUserPayload) {
    return this.adminUsersService.getPendingVendors(currentUser);
  }

  /**
   * Review vendor application with cultural vetting
   */
  async reviewVendorApplication(
    vendorId: string,
    dto: { approved: boolean; culturalAuthenticityNotes?: string; rejectionReason?: string },
    currentUser: CurrentUserPayload
  ) {
    return this.adminUsersService.reviewVendorApplication(vendorId, dto, currentUser);
  }

  async impersonateUser(currentUser: CurrentUserPayload, targetUserId: string, reason: string) {
    return this.adminUsersService.impersonateUser(currentUser, targetUserId, reason);
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
    return this.adminUsersService.createOrUpdateAdmin(currentUser, userData);
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(currentUser: CurrentUserPayload, filters?: { adminSubRole?: string }) {
    return this.adminUsersService.getAdminUsers(currentUser, filters);
  }

  /**
   * Remove admin privileges from user
   */
  async removeAdminPrivileges(currentUser: CurrentUserPayload, userId: string) {
    return this.adminUsersService.removeAdminPrivileges(currentUser, userId);
  }

  async getUserSessions(userId: string) {
    return this.adminUsersService.getUserSessions(userId);
  }

  async forceLogoutUser(userId: string) {
    return this.adminUsersService.forceLogoutUser(userId);
  }

  // COMMUNITY_BACKLOG.md FOR-017
  async setCommunityCarer(userId: string, isCarer: boolean) {
    return this.adminUsersService.setCommunityCarer(userId, isCarer);
  }

  async getRecentLogins(limit = 50) {
    return this.adminUsersService.getRecentLogins(limit);
  }

  async getLifecycleAnalytics() {
    return this.adminUsersService.getLifecycleAnalytics();
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
    reason: string
  ): Promise<void> {
    return this.adminUsersService.logPiiReveal(
      adminUserId,
      entityType,
      entityId,
      fieldLabel,
      reason
    );
  }

  /**
   * Get disputes (from escrows with DISPUTED status)
   */
  async getDisputes(currentUser: CurrentUserPayload, status?: string) {
    return this.adminFinanceService.getDisputes(currentUser, status);
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    escrowId: string,
    dto: any, // ResolveDisputeDto
    currentUser: CurrentUserPayload
  ) {
    return this.adminFinanceService.resolveDispute(escrowId, dto, currentUser);
  }

  /**
   * Get withdrawal requests requiring approval (> $500)
   */
  async getPendingWithdrawals(currentUser: CurrentUserPayload, threshold: number = 500) {
    return this.adminFinanceService.getPendingWithdrawals(currentUser, threshold);
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
    const action = approve ? 'APPROVE' : 'REJECT';
    return this.adminFinanceService.processWithdrawal(withdrawalId, action, notes, currentUser);
  }

  /**
   * Get fraud alerts (auto-flagged content)
   * Auto-flags suspicious content for admin review
   */
  async getFraudAlerts(currentUser: CurrentUserPayload) {
    return this.adminFinanceService.getFraudAlerts(currentUser);
  }

  /**
   * Get unverified payments (webhook redundancy)
   */
  async getUnverifiedPayments(currentUser: CurrentUserPayload, hours: number = 24) {
    return this.adminFinanceService.getUnverifiedPayments(currentUser, hours);
  }

  /**
   * Manually verify payment (admin only)
   */
  async manuallyVerifyPayment(transactionId: string, currentUser: CurrentUserPayload) {
    return this.adminFinanceService.manuallyVerifyPayment(transactionId, currentUser);
  }

  /**
   * Subscription analytics for admin dashboard
   */
  async getSubscriptionStats() {
    return this.adminFinanceService.getSubscriptionStats();
  }

  /**
   * Get reported content (flagged reviews)
   */
  async getReportedContent(currentUser: CurrentUserPayload) {
    return this.adminCommunityService.getReportedContent(currentUser);
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
    return this.adminCommunityService.resolveReportedContent(type, id, action, currentUser);
  }

  /**
   * Create an advisory board vote
   */
  async createAdvisoryVote(createVoteDto: CreateAdvisoryVoteDto, currentUser: CurrentUserPayload) {
    return this.adminCommunityService.createAdvisoryVote(createVoteDto, currentUser);
  }

  /**
   * Get advisory board votes
   */
  async getAdvisoryVotes(userId: string, status: string | null, currentUser: CurrentUserPayload) {
    return this.adminCommunityService.getAdvisoryVotes(userId, status, currentUser);
  }

  /**
   * Cast a vote in an advisory board vote
   */
  async castAdvisoryVote(voteId: string, option: string, currentUser: CurrentUserPayload) {
    return this.adminCommunityService.castAdvisoryVote(voteId, option, currentUser);
  }

  /**
   * Get circle suggestions with optional status filter
   */
  async getCircleSuggestions(currentUser: CurrentUserPayload, status?: string) {
    return this.adminCommunityService.getCircleSuggestions(currentUser, status);
  }

  /**
   * Approve circle suggestion and create circle
   */
  async approveCircleSuggestion(
    suggestionId: string,
    circleData: CreateCircleDto,
    currentUser: CurrentUserPayload
  ) {
    return this.adminCommunityService.approveCircleSuggestion(
      suggestionId,
      circleData,
      currentUser
    );
  }

  /**
   * Reject circle suggestion
   */
  async rejectCircleSuggestion(
    suggestionId: string,
    reason: string,
    currentUser: CurrentUserPayload
  ) {
    return this.adminCommunityService.rejectCircleSuggestion(suggestionId, reason, currentUser);
  }

  /**
   * Get pending circles (circles needing approval)
   */
  async getPendingCircles(currentUser: CurrentUserPayload) {
    return this.adminCommunityService.getPendingCircles(currentUser);
  }

  /**
   * Moderate circle (archive, delete, etc.)
   */
  async moderateCircle(
    circleId: string,
    action: 'ARCHIVE' | 'DELETE' | 'ACTIVATE',
    currentUser: CurrentUserPayload
  ) {
    return this.adminCommunityService.moderateCircle(circleId, action, currentUser);
  }

  /**
   * V8-204: admin-only toggle for Circle.isDevoted (gates joining behind the
   * Devoted subscription tier).
   */
  async setCircleDevoted(circleId: string, isDevoted: boolean, currentUser: CurrentUserPayload) {
    return this.adminCommunityService.setCircleDevoted(circleId, isDevoted, currentUser);
  }

  /**
   * Approve and promote circle event to main events directory
   */
  async approveCircleEvent(eventId: string, currentUser: CurrentUserPayload) {
    return this.adminCommunityService.approveCircleEvent(eventId, currentUser);
  }

  async getQuizQuestions() {
    return this.adminContentService.getQuizQuestions();
  }

  async createQuizQuestion(data: Record<string, any>) {
    return this.adminContentService.createQuizQuestion(data);
  }

  async updateQuizQuestion(id: string, data: Record<string, any>) {
    return this.adminContentService.updateQuizQuestion(id, data);
  }

  async deleteQuizQuestion(id: string) {
    return this.adminContentService.deleteQuizQuestion(id);
  }

  async getQuizStats() {
    return this.adminContentService.getQuizStats();
  }

  async updateQuizThreshold(threshold: number) {
    return this.adminContentService.updateQuizThreshold(threshold);
  }

  async resetUserQuizStatus(userId: string) {
    return this.adminContentService.resetUserQuizStatus(userId);
  }

  async getRevenueForecast() {
    return this.adminFinanceService.getRevenueForecast();
  }

  async getActiveSubscribers(search?: string) {
    return this.adminFinanceService.getActiveSubscribers(search);
  }

  async getCancelledSubscribers() {
    return this.adminFinanceService.getCancelledSubscribers();
  }

  async getFailedSubscribers() {
    return this.adminFinanceService.getFailedSubscribers();
  }

  async cancelSubscriptionById(
    currentUser: CurrentUserPayload,
    subscriptionId: string,
    reason?: string
  ) {
    return this.adminFinanceService.cancelSubscriptionById(currentUser, subscriptionId, reason);
  }

  async extendSubscriptionById(
    currentUser: CurrentUserPayload,
    subscriptionId: string,
    months: number,
    reason?: string
  ) {
    return this.adminFinanceService.extendSubscriptionById(
      currentUser,
      subscriptionId,
      months,
      reason
    );
  }

  async sendSubscriptionPaymentReminder(currentUser: CurrentUserPayload, subscriptionId: string) {
    return this.adminFinanceService.sendSubscriptionPaymentReminder(currentUser, subscriptionId);
  }

  async getFinancialCommandCentre() {
    return this.adminFinanceService.getFinancialCommandCentre();
  }

  async getInactivePractitioners(admin: CurrentUserPayload, daysThreshold: number) {
    return this.adminUsersService.getInactivePractitioners(admin, daysThreshold);
  }

  async reEngagePractitioner(practitionerId: string, action: string, message?: string) {
    return this.adminUsersService.reEngagePractitioner(practitionerId, action, message);
  }

  async reactivatePractitioner(practitionerId: string) {
    return this.adminUsersService.reactivatePractitioner(practitionerId);
  }

  async getComplaints(
    currentUser: CurrentUserPayload,
    status?: string,
    page: number = 1,
    limit: number = 20
  ) {
    return this.adminComplaintsService.getComplaints(currentUser, status, page, limit);
  }

  async resolveComplaint(id: string, dto: any, currentUser: CurrentUserPayload) {
    return this.adminComplaintsService.resolveComplaint(id, dto, currentUser);
  }
}
